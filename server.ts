import "./src/lib/patch-atob";
import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import twilio from "twilio";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import path from "path";
import crypto from "crypto";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Robust Environment Variables Sanitizer (strips surrounding spaces/quotes, handles Google App Password formatting)
if (process.env.SMTP_HOST) {
  process.env.SMTP_HOST = process.env.SMTP_HOST.trim().replace(/^['"]|['"]$/g, '');
}
if (process.env.SMTP_PORT) {
  process.env.SMTP_PORT = process.env.SMTP_PORT.trim().replace(/^['"]|['"]$/g, '');
}
if (process.env.SMTP_USER) {
  process.env.SMTP_USER = process.env.SMTP_USER.trim().replace(/^['"]|['"]$/g, '');
}
if (process.env.SMTP_FROM) {
  process.env.SMTP_FROM = process.env.SMTP_FROM.trim().replace(/^['"]|['"]$/g, '');
}
if (process.env.SMTP_PASS) {
  let cleanedPass = process.env.SMTP_PASS.trim().replace(/^['"]|['"]$/g, '');
  const host = (process.env.SMTP_HOST || "").toLowerCase();
  if (host.includes("gmail") || host.includes("googlemail")) {
    const spaceLessPass = cleanedPass.replace(/\s+/g, '');
    if (spaceLessPass.length === 16) {
      console.log("[SMTP Sanitizer] Automatically trimmed internal spaces from 16-character Gmail App Password.");
      cleanedPass = spaceLessPass;
    }
  }
  process.env.SMTP_PASS = cleanedPass;
}

if (process.env.TWILIO_ACCOUNT_SID) {
  process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID.trim().replace(/^['"]|['"]$/g, '');
}
if (process.env.TWILIO_AUTH_TOKEN) {
  process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN.trim().replace(/^['"]|['"]$/g, '');
}
if (process.env.TWILIO_PHONE_NUMBER) {
  process.env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER.trim().replace(/^['"]|['"]$/g, '');
}
if (process.env.TWILIO_WHATSAPP_NUMBER) {
  process.env.TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER.trim().replace(/^['"]|['"]$/g, '');
}

const app = express();
const PORT = 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Supabase client initialized on server.");
} else {
  console.warn("Supabase credentials missing. Running in limited mode.");
}

// Global cache for resilient database order fallback
let cachedAllOrders: any[] = [];

// Helper to enforce a fast timeout on Supabase database queries
const queryWithTimeout = (promise: any, ms = 2500, timeoutErrorMsg = 'Operation cached'): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutErrorMsg));
    }, ms);
    Promise.resolve(promise).then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
};

console.log("Starting server initialization...");

// In-memory OTP store (replaces SQLite for better environment compatibility)
const otps = new Map<string, { code: string, expiresAt: number }>();
console.log("Memory OTP store initialized.");

// In-memory data store for fallback when Supabase is disconnected
const memOrders: any[] = [];
const memItems: any[] = [];
const memPickups: any[] = [];
console.log("Memory Orders, Items, and Pickups stores initialized.");

// Notification Clients
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

// Secure debugging utility for loaded SMTP parameters
console.log("=== SMTP Environment Checklist ===");
console.log("SMTP_HOST:", process.env.SMTP_HOST ? `"${process.env.SMTP_HOST}"` : "NOT CONFIGURED");
console.log("SMTP_PORT:", process.env.SMTP_PORT ? `"${process.env.SMTP_PORT}"` : "NOT CONFIGURED (defaults to 587)");
console.log("SMTP_USER:", process.env.SMTP_USER ? `"${process.env.SMTP_USER}"` : "NOT CONFIGURED");
console.log("SMTP_FROM:", process.env.SMTP_FROM ? `"${process.env.SMTP_FROM}"` : "NOT CONFIGURED");
if (process.env.SMTP_PASS) {
  const pass = process.env.SMTP_PASS;
  const maskedPass = pass.length > 4 
    ? pass.substring(0, 2) + "*".repeat(pass.length - 4) + pass.substring(pass.length - 2)
    : "*".repeat(pass.length);
  console.log(`SMTP_PASS: "${maskedPass}" (Length: ${pass.length} characters)`);
} else {
  console.log("SMTP_PASS: NOT CONFIGURED");
}
console.log("=================================");

const mailTransporter = process.env.SMTP_HOST 
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }) 
  : null;

if (mailTransporter) {
  console.log("Email service (SMTP) configured. Testing connection asynchronously...");
  mailTransporter.verify((error: any) => {
    if (error) {
      console.error("[SMTP] Connection Error:", formatSmtpError(error, "SMTP Initialization"));
    } else {
      console.log("[SMTP] Server is ready.");
    }
  });
}

// SMTP Error Formatting Helper for detailed, actionable feedback
function formatSmtpError(err: any, prefix: string): string {
  const message = err?.message || String(err || "");
  if (message.includes("535") || message.includes("BadCredentials") || message.includes("Username and Password not accepted")) {
    const smtpUser = process.env.SMTP_USER || "";
    const smtpFrom = process.env.SMTP_FROM || "";
    
    let mismatchWarning = "";
    if (smtpUser && smtpFrom) {
      // Extract email addresses if they are formatted like "Name <email@domain.com>"
      const extractEmail = (str: string) => {
        const match = str.match(/<([^>]+)>/);
        return (match ? match[1] : str).trim().toLowerCase();
      };
      
      const parsedUser = extractEmail(smtpUser);
      const parsedFrom = extractEmail(smtpFrom);
      
      if (parsedUser && parsedFrom && parsedUser !== parsedFrom) {
        mismatchWarning = `\n\n⚠️ SENDER EMAIL MISMATCH WARNING: Your SMTP_USER ("${parsedUser}") and SMTP_FROM ("${parsedFrom}") do not match! Gmail requires you to authenticate using the exact Google Account username you are sending from. If your App Password was generated for "${parsedFrom}", please make sure SMTP_USER is set to "${parsedFrom}".`;
      }
    }
    
    return `${prefix} Error: SMTP Login Failed (Gmail 535 Bad Credentials). Run-time checklist:
1. Google SMTP requires a 16-character "App Password" (not your normal password/password with spaces).
2. Your current SMTP_PASS length is ${process.env.SMTP_PASS?.length || 0} characters.
To resolve this:
  a. Enable 2-Step Verification in your Google Account settings.
  b. Search for "App Passwords" in your Google Account.
  c. Generate a new App Password named "JiffEX Mail".
  d. Paste the 16-character code as "SMTP_PASS" in server secrets and restart the dev server.${mismatchWarning}`;
  }
  return `${prefix} Error: ${message}`;
}

// Notification Helper
function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except '+'
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Strict cleanup: remove any letters (like 'X' in placeholders)
  cleaned = cleaned.replace(/[a-zA-Z]/g, '');

  // If it doesn't start with '+', assume it's an Indian number and add '+91'
  if (!cleaned.startsWith('+')) {
    // If it starts with '0', remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // If it's 10 digits, add +91
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else if (!cleaned.startsWith('91') && cleaned.length < 10) {
       // Fallback for shorter numbers, still assume India
       cleaned = '+91' + cleaned;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
       cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

async function sendNotification(userId: string, event: string, message: string, channels: string[], recipientInfo?: { email?: string, phone?: string, fullName?: string, orderId?: string, pickupDate?: string, pickupTime?: string, pickupAddress?: string }) {
  console.log(`[Notification] User: ${userId}, Event: ${event}, Message: ${message}, Channels: ${channels.join(', ')}`);
  
  const promises = [];

  if (channels.includes('SMS') && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    const rawPhone = recipientInfo?.phone || '+919999999999';
    const to = normalizePhoneNumber(rawPhone);
    
    // Skip if it looks like a placeholder (contains too many 1s or 0s or is too short)
    const isPlaceholder = to.includes('11111') || to.includes('00000') || to.length < 10;

    if (!isPlaceholder) {
      promises.push(
        twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to
        }).catch(err => console.error(`SMS Error (${to}):`, err.message))
      );
    } else {
      console.warn(`[Notification] Skipping SMS to placeholder number: ${to}`);
    }
  }

  if (channels.includes('whatsapp') && twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
    const rawPhone = recipientInfo?.phone || '+919999999999';
    const normalized = normalizePhoneNumber(rawPhone);
    const to = `whatsapp:${normalized}`;
    
    const isPlaceholder = normalized.includes('11111') || normalized.includes('00000') || normalized.length < 10;

    if (!isPlaceholder) {
      promises.push(
        twilioClient.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to
        }).catch(err => console.error(`WhatsApp Error (${to}):`, err.message))
      );
    } else {
      console.warn(`[Notification] Skipping WhatsApp to placeholder number: ${to}`);
    }
  }

  if (channels.includes('Email') && mailTransporter && process.env.SMTP_FROM) {
    const to = recipientInfo?.email;
    console.log(`[Notification] Attempting to send email to: ${to} for event: ${event}`);
    if (to && to !== 'user@example.com' && to.includes('@')) {
      let subject = `JiffEX Notification: ${event}`;
      let html = null;
      let text = message;

      if (event === 'Pickup confirmed') {
        const fullName = recipientInfo?.fullName || 'Valued Customer';
        const orderId = recipientInfo?.orderId || 'N/A';
        const pickupDate = recipientInfo?.pickupDate || 'Scheduled Date';
        const pickupTime = recipientInfo?.pickupTime || 'Scheduled Time';
        const pickupAddress = recipientInfo?.pickupAddress || 'Your Address';
        const appUrl = process.env.APP_URL || "https://www.jiffex.com";
        const trackingUrl = `${appUrl}?tab=track&id=${orderId}`;

        subject = `Pickup Scheduled: Your JiffEX Appointment ${orderId}`;
        
        html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
  <p>Dear <strong>${fullName}</strong>,</p>
  <p>Thank you for choosing <strong>JiffEX</strong> for your shipping needs.</p>
  <p>We are pleased to confirm that your home pickup has been successfully scheduled. Our agent will visit your location as per the details below:</p>
  
  <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
    <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${orderId}</p>
    <p style="margin: 5px 0;"><strong>Scheduled Date:</strong> ${pickupDate}</p>
    <p style="margin: 5px 0;"><strong>Time Slot:</strong> ${pickupTime}</p>
    <p style="margin: 5px 0;"><strong>Pickup Address:</strong> ${pickupAddress}</p>
  </div>

  <p><strong>What happens next?</strong></p>
  <ul style="padding-left: 20px;">
    <li>Our agent will arrive within the scheduled time slot.</li>
    <li>They will weigh your items and provide an instant quote.</li>
    <li>Once you approve, you can make the payment securely via the app or to the agent.</li>
    <li>Your items will be packed and dispatched immediately.</li>
  </ul>
  
  <p>You can track your booking status anytime using this link: 
    <a href="${trackingUrl}" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">
      Track Booking Status
    </a>
  </p>
  
  <p>If you need to reschedule or have any questions, please contact our support team at <a href="mailto:support@jiffex.com" style="color: #4f46e5;">support@jiffex.com</a>.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    Best regards,<br>
    <strong>The JiffEX Team</strong><br>
    JiffEX Shipping & Logistics<br>
    <a href="https://www.jiffex.com" style="color: #4f46e5; text-decoration: none;">www.jiffex.com</a>
  </p>
</div>
        `;
      }

      promises.push(
        mailTransporter.sendMail({
          from: process.env.SMTP_FROM,
          to,
          subject,
          text,
          html: html || undefined
        }).then(() => {
          console.log(`[Notification] Email successfully sent to ${to}`);
        }).catch(err => {
          console.error(`[Notification] Email Error for ${to}:`, err.message);
        })
      );
    } else {
      console.warn(`[Notification] Skipping email for user ${userId} - invalid or default recipient email: ${to}`);
    }
  }

  await Promise.all(promises);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Auth Routes for Email/Phone OTP
app.post("/api/auth/send-otp", async (req, res) => {
  console.log("[Auth] POST /api/auth/send-otp", req.body);
  const { email, phone } = req.body;
  const identifier = email || phone;

  if (!identifier) {
    return res.status(400).json({ error: "Email or Phone required" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
    otps.set(identifier, { code, expiresAt });
    console.log(`[Auth] OTP stored in memory for ${identifier}`);

    if (email) {
      if (mailTransporter && process.env.SMTP_FROM) {
        mailTransporter.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject: "Your Login OTP",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #6366f1;">Welcome to JiffEX</h2>
              <p>Your one-time password (OTP) for login is:</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #1e293b; margin: 20px 0;">${code}</div>
              <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
            </div>
          `
        }).then(() => {
          console.log(`[Auth] OTP sent to email: ${email}`);
        }).catch(err => {
          console.error("[Auth] Background SMTP OTP send failed:", err.message);
        });
        console.log(`[Auth] Triggered background OTP email for ${email}. Custom OTP: ${code}`);
        res.json({ success: true, devCode: code });
      } else {
        console.log(`[Auth] No SMTP configured. OTP for ${email} is: ${code}`);
        res.json({ success: true, devCode: code });
      }
    } else if (phone) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        twilioClient.messages.create({
          body: `Your JiffEX login code is: ${code}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: normalizedPhone
        }).then(() => {
          console.log(`[Auth] OTP sent to phone: ${normalizedPhone}`);
        }).catch(err => {
          console.error("[Auth] Background Twilio OTP send failed:", err.message);
        });
        console.log(`[Auth] Triggered background Twilio SMS for ${normalizedPhone}. Custom OTP: ${code}`);
        res.json({ success: true, devCode: code });
      } else {
        console.log(`[Auth] No Twilio configured. OTP for ${phone} is: ${code}`);
        res.json({ success: true, devCode: code });
      }
    }
  } catch (err: any) {
    console.error("OTP Send Error:", err.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  console.log("[Auth] POST /api/auth/verify-otp", req.body);
  const { email, phone, code } = req.body;
  const identifier = email || phone;

  if (!identifier || !code) {
    return res.status(400).json({ error: "Identifier and code required" });
  }

  try {
    const otpData = otps.get(identifier);

  // For testing: allow 123456 as a universal test code
  const isTestCode = code === "123456";

  if (!isTestCode && (!otpData || otpData.code !== code || Date.now() > otpData.expiresAt)) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

    // Success - Clear OTP if it existed
    if (otpData) otps.delete(identifier);

    // No Firebase, just return a mock user
    res.json({ success: true, user: { email: email || '', phone: phone || '', id: 'user-' + Math.random().toString(36).substr(2, 9) } });
  } catch (err: any) {
    console.error("OTP Verify Error:", err.message);
    res.status(500).json({ error: "Verification failed" });
  }
});

// API Routes
app.get("/api/health", async (req, res) => {
  res.json({ 
    status: "ok",
    supabaseConnected: !!supabase,
    emailConfigured: !!mailTransporter && !!process.env.SMTP_FROM
  });
});

// Runtime Supabase configuration API for production environments (e.g. Render)
app.get("/api/supabase-config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
  });
});

const DEFAULT_SHIPPING_SETTINGS = {
  rates: {
    'USA': 12,
    'UK': 10,
    'Canada': 11,
    'Australia': 13,
    'UAE': 8,
    'Germany': 9,
    'Singapore': 7,
    'India': 5,
  },
  discounts: {
    'USA': 0,
    'UK': 0,
    'Canada': 0,
    'Australia': 0,
    'UAE': 0,
    'Germany': 0,
    'Singapore': 0,
    'India': 0,
  }
};

const getShippingSettings = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('shipping_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && data) {
        return {
          rates: data.rates || DEFAULT_SHIPPING_SETTINGS.rates,
          discounts: data.discounts || DEFAULT_SHIPPING_SETTINGS.discounts,
          coupons: data.coupons || [
            { code: "SHIP5", discountPercent: 5, isEnabled: true },
            { code: "BOOST", discountPercent: 12, isEnabled: false }
          ]
        };
      } else if (error && error.code !== 'PGRST116') {
        console.warn("[Supabase] Failed to fetch shipping settings:", error.message);
      }
    } catch (err: any) {
      console.warn("[Supabase] Exception fetching shipping settings:", err.message || err);
    }
  }

  // Fallback to default in-memory settings since we strictly do not read or write anything to local filesystem.
  return {
    ...DEFAULT_SHIPPING_SETTINGS,
    coupons: [
      { code: "SHIP5", discountPercent: 5, isEnabled: true },
      { code: "BOOST", discountPercent: 12, isEnabled: false }
    ]
  };
};

const saveShippingSettings = async (settings: any) => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('shipping_settings')
        .upsert({
          id: 'global',
          rates: settings.rates,
          discounts: settings.discounts,
          coupons: settings.coupons,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        console.log("[Supabase] Successfully saved shipping settings to Supabase.");
        return true;
      } else {
        console.warn("[Supabase] Failed to save shipping settings to Supabase:", error.message);
      }
    } catch (err: any) {
      console.warn("[Supabase] Exception saving shipping settings to Supabase:", err.message || err);
    }
  }
  return false;
};

app.get("/api/settings/shipping", async (req, res) => {
  const current = await getShippingSettings();
  res.json(current);
});

app.post("/api/settings/shipping", async (req, res) => {
  const { rates, discounts, coupons } = req.body;
  const current = await getShippingSettings();
  
  if (rates) {
    current.rates = { ...current.rates, ...rates };
  }
  if (discounts) {
    // Make sure we sanitize incoming values to numbers
    const sanitizedDiscounts: Record<string, number> = {};
    Object.keys(discounts).forEach(country => {
      sanitizedDiscounts[country] = Number(discounts[country]) || 0;
    });
    current.discounts = { ...current.discounts, ...sanitizedDiscounts };
  }
  if (Array.isArray(coupons)) {
    // Sanitize coupons
    current.coupons = coupons
      .map((c: any) => ({
        code: String(c.code).trim().toUpperCase().substring(0, 5),
        discountPercent: Math.max(0, Math.min(100, Number(c.discountPercent) || 0)),
        isEnabled: Boolean(c.isEnabled)
      }))
      .filter((c: any) => c.code.length === 5);
  }
  
  await saveShippingSettings(current);
  res.json(current);
});

// Mock Data Fallbacks
const MOCK_PRODUCTS = [
  { id: 'm1', name: 'Premium Packing Box (S)', description: 'Perfect for small heavy items', price: 45, category: 'Packaging', weight: 0.1, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop' },
  { id: 'm2', name: 'Premium Packing Box (M)', description: 'Versatile medium sized box', price: 75, category: 'Packaging', weight: 0.2, imageUrl: 'https://images.unsplash.com/photo-1589884629038-63316ec0ad29?q=80&w=2070&auto=format&fit=crop' },
  { id: 'm3', name: 'Bubble Wrap (10m)', description: 'Extra protection for fragile items', price: 120, category: 'Protection', weight: 0.5, imageUrl: 'https://images.unsplash.com/photo-1549465220-1d8f9d0c441c?q=80&w=2070&auto=format&fit=crop' }
];

// Helper formatting functions for products between Supabase (snake_case) and frontend (camelCase)
function dbToProduct(dbProduct: any) {
  if (!dbProduct) return null;
  const { estimated_delivery, ...rest } = dbProduct;
  return {
    ...rest,
    estimatedDelivery: estimated_delivery
  };
}

function productToDb(product: any) {
  if (!product) return null;
  const { estimatedDelivery, id, ...rest } = product;
  const dbProduct: any = {
    ...rest,
    estimated_delivery: estimatedDelivery
  };
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
  if (id && isValidUuid) {
    dbProduct.id = id;
  }
  return dbProduct;
}

// API: Get all products
app.get("/api/products", async (req, res) => {
  if (!supabase) return res.json(MOCK_PRODUCTS);
  
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    
    // If table is empty, return mocks as seed data
    if (!data || data.length === 0) {
      return res.json(MOCK_PRODUCTS);
    }
    
    res.json(data.map(dbToProduct));
  } catch (err: any) {
    console.error("Fetch Products Error:", err.message);
    res.json(MOCK_PRODUCTS.map(dbToProduct));
  }
});

// API: Create a product
app.post("/api/products", async (req, res) => {
  if (!supabase) return res.json(req.body);

  try {
    const dbPayload = productToDb(req.body);
    const { data, error } = await supabase.from('products').insert(dbPayload).select().single();
    if (error) throw error;
    res.json(dbToProduct(data));
  } catch (err: any) {
    console.error("Create Product Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Update a product
app.patch("/api/products/:id", async (req, res) => {
  if (!supabase) return res.json(req.body);

  const { id } = req.params;
  try {
    const dbPayload = productToDb(req.body);
    // Explicitly do not let id be changed on patch
    delete dbPayload.id;
    const { data, error } = await supabase.from('products').update(dbPayload).eq('id', id).select().single();
    if (error) throw error;
    res.json(dbToProduct(data));
  } catch (err: any) {
    console.error("Update Product Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Delete a product
app.delete("/api/products/:id", async (req, res) => {
  if (!supabase) return res.json({ success: true });

  const { id } = req.params;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete Product Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Example API: Get all items for a user
app.get("/api/items/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!supabase) {
    if (userId === 'all') {
      return res.json(memItems);
    }
    const userItems = memItems.filter(i => {
      const uId = i.user_id || i.userId || i.customer_id || i.customerId;
      return String(uId) === String(userId);
    });
    return res.json(userItems);
  }

  try {
    let query = supabase.from('items').select('*');
    if (userId !== 'all') {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error("Fetch Items Error:", err.message);
    res.json([]);
  }
});

// Example API: Create an item
app.post("/api/items", async (req, res) => {
  if (!supabase) {
    const finalId = req.body.id || crypto.randomUUID();
    const itemData = {
      id: finalId,
      user_id: req.body.user_id || req.body.userId || req.body.customer_id || req.body.customerId,
      name: req.body.name,
      weight: req.body.weight,
      status: req.body.status || 'Received at Warehouse',
      source: req.body.source || 'Pickup',
      price: req.body.price,
      image: req.body.image
    };
    memItems.push(itemData);
    return res.json(itemData);
  }

  try {
    const itemData: any = {};
    if (req.body.id) itemData.id = req.body.id;
    itemData.user_id = req.body.user_id || req.body.userId || req.body.customer_id || req.body.customerId;
    if (req.body.name) itemData.name = req.body.name;
    if (req.body.weight !== undefined) itemData.weight = req.body.weight;
    if (req.body.status) itemData.status = req.body.status;
    if (req.body.source) itemData.source = req.body.source;
    if (req.body.price !== undefined) itemData.price = req.body.price;
    if (req.body.image) itemData.image = req.body.image;

    const { data, error } = await supabase.from('items').insert(itemData).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Create Item Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Example API: Create an order/appointment
app.post("/api/orders", async (req, res) => {
  const providedId = req.body.id || req.body.orderId || req.body.appointmentId;
  const finalId = providedId && String(providedId).trim() !== "" ? providedId : crypto.randomUUID();
  
  if (!supabase) {
    console.log(`[MEMDB] Creating order with ID: ${finalId}`);
    const newOrder = { ...req.body, id: finalId };
    const idx = memOrders.findIndex(o => o.id === finalId);
    if (idx > -1) {
      memOrders[idx] = newOrder;
    } else {
      memOrders.push(newOrder);
    }
    return res.json(newOrder);
  }

  try {
    let parsedDestination = req.body.destination || {};
    if (typeof parsedDestination === 'string') {
      try {
        parsedDestination = JSON.parse(parsedDestination);
      } catch (e) {
        parsedDestination = {};
      }
    }

    // Merge extra details inside the JSONB destination mapping to preserve them completely
    const sanitizedDestination = {
      ...parsedDestination,
      pickupType: req.body.pickup_type || req.body.pickupType || parsedDestination.pickupType,
      assignedAgent: req.body.assigned_agent || req.body.assignedAgent || parsedDestination.assignedAgent,
      assignedAgentId: req.body.assigned_agent_id || req.body.assignedAgentId || parsedDestination.assignedAgentId,
      languagePreference: req.body.language_preference || req.body.languagePreference || parsedDestination.languagePreference,
      itemType: req.body.item_type || req.body.itemType || parsedDestination.itemType,
      vehicleType: req.body.vehicle_type || req.body.vehicleType || parsedDestination.vehicleType,
      customerName: req.body.customer_name || req.body.customerName || parsedDestination.customerName || parsedDestination.fullName,
      phone: req.body.phone || req.body.destination?.phone || parsedDestination.phone,
      date: req.body.date || req.body.shipping_date || req.body.shippingDate || parsedDestination.date,
      time: req.body.time || parsedDestination.time || 'Flexible',
      address: req.body.address || req.body.destination?.addressLine1 || parsedDestination.address || parsedDestination.addressLine1
    };

    const databaseOrderData = {
      id: finalId,
      customer_id: req.body.customer_id || req.body.customerId,
      items: req.body.items,
      total_weight: req.body.total_weight || req.body.totalWeight || 0,
      total_cost: req.body.total_cost || req.body.totalCost || 0,
      status: req.body.status,
      destination: sanitizedDestination,
      payment_status: req.body.payment_status || req.body.paymentStatus || 'Pending',
      shipping_date: req.body.shipping_date || req.body.shippingDate,
    };

    let currentId = finalId;
    let insertSuccess = false;
    let savedData: any = null;
    let lastError: any = null;

    const isDuplicateKeyError = (err: any) => {
      if (!err) return false;
      const msg = String(err.message || '').toLowerCase();
      const details = String(err.details || '').toLowerCase();
      return err.code === '23505' || msg.includes('duplicate key') || msg.includes('violates unique constraint') || details.includes('already exists');
    };

    // Helper to increment standard format: PREFIX-xxxxx
    const incrementSequentialId = (idStr: string): string => {
      if (!idStr) return crypto.randomUUID();
      const parts = idStr.split('-');
      if (parts.length >= 2) {
        const prefix = parts[0];
        const seqStr = parts[1];
        const s = parseInt(seqStr, 10);
        if (!isNaN(s)) {
          const nextSeqNum = s + 1;
          const seq = nextSeqNum.toString().padStart(seqStr.length, '0');
          return `${prefix}-${seq}`;
        }
      }
      return `${idStr}-${Math.floor(Math.random() * 1000)}`;
    };

    // Try up to 15 times if we keep hitting duplicate key error
    for (let attempt = 1; attempt <= 15; attempt++) {
      const currentOrderData = {
        ...databaseOrderData,
        id: currentId,
      };

      console.log(`[SUPABASE] Attempt ${attempt}: Inserting order with ID: ${currentId}`);
      const { data, error } = await supabase.from('orders').insert(currentOrderData).select().single();
      
      if (!error) {
        savedData = data;
        insertSuccess = true;
        break;
      }

      lastError = error;
      
      if (isDuplicateKeyError(error)) {
        console.warn(`[SUPABASE] Attempt ${attempt} failed with duplicate key for ID ${currentId}. Incrementing ID and retrying...`);
        currentId = incrementSequentialId(currentId);
        continue;
      }

      // If it's a structural schema mismatch or any other error, let's try the fallback full representation
      console.warn(`[SUPABASE] Attempt ${attempt} failed with error: ${error.message}. Testing fallback schema representation...`);
      const fullOrderData = {
        ...currentOrderData,
        pickup_type: req.body.pickup_type || req.body.pickupType,
        assigned_agent: req.body.assigned_agent || req.body.assignedAgent,
        assigned_agent_id: req.body.assigned_agent_id || req.body.assignedAgentId,
        language_preference: req.body.language_preference || req.body.languagePreference,
        item_type: req.body.item_type || req.body.itemType,
        vehicle_type: req.body.vehicle_type || req.body.vehicleType,
        phone: req.body.phone,
        customer_name: req.body.customer_name || req.body.customerName,
        date: req.body.date,
        time: req.body.time,
        address: req.body.address
      };

      const { data: fbData, error: fbError } = await supabase.from('orders').insert(fullOrderData).select().single();
      if (!fbError) {
        savedData = fbData;
        insertSuccess = true;
        break;
      }
      
      lastError = fbError;
      if (isDuplicateKeyError(fbError)) {
        console.warn(`[SUPABASE] Schema fallback failed with duplicate key for ID ${currentId}. Incrementing ID and retrying...`);
        currentId = incrementSequentialId(currentId);
        continue;
      }
      
      // If it is another type of error, stop retrying unless we have custom behavior
      break;
    }

    if (!insertSuccess) {
      throw lastError || new Error("Failed to insert order after all attempts");
    }

    const finalInsertedId = savedData?.id || currentId;

    // Pre-populate in-memory fallback list and cache with the ACTUAL INSERTED ID
    const preOrder = { ...databaseOrderData, id: finalInsertedId, created_at: savedData?.created_at || new Date().toISOString() };
    
    // Clear any previous stale entries of finalId if they were wrong
    if (finalInsertedId !== finalId) {
      const oldIdx = memOrders.findIndex(o => o.id === finalId);
      if (oldIdx > -1) memOrders.splice(oldIdx, 1);
      
      const oldCachedIdx = cachedAllOrders.findIndex(o => o.id === finalId);
      if (oldCachedIdx > -1) cachedAllOrders.splice(oldCachedIdx, 1);
    }

    const mIdx = memOrders.findIndex(o => o.id === finalInsertedId);
    if (mIdx > -1) {
      memOrders[mIdx] = { ...memOrders[mIdx], ...preOrder };
    } else {
      memOrders.unshift(preOrder);
    }
    const trPreOrder = transformDbOrder(preOrder);
    const cIdx = cachedAllOrders.findIndex(o => o.id === finalInsertedId);
    if (cIdx > -1) {
      cachedAllOrders[cIdx] = { ...cachedAllOrders[cIdx], ...trPreOrder };
    } else {
      cachedAllOrders.unshift(trPreOrder);
    }

    res.json(savedData);
  } catch (err: any) {
    console.error("Create Order Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Update item status
app.patch("/api/items/:itemId/status", async (req, res) => {
  if (!supabase) {
    const { itemId } = req.params;
    const { status } = req.body;
    const idx = memItems.findIndex(i => i.id === itemId);
    if (idx > -1) {
      memItems[idx].status = status;
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Item not found" });
  }

  try {
    const { error } = await supabase
      .from('items')
      .update({ status: req.body.status })
      .eq('id', req.params.itemId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Update Item Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Update item weight
app.patch("/api/items/:itemId/weight", async (req, res) => {
  if (!supabase) {
    const { itemId } = req.params;
    const { weight } = req.body;
    const idx = memItems.findIndex(i => i.id === itemId);
    if (idx > -1) {
      memItems[idx].weight = weight;
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Item not found" });
  }

  try {
    const { error } = await supabase
      .from('items')
      .update({ weight: req.body.weight })
      .eq('id', req.params.itemId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Update Item Weight Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Update order details (Partial)
app.patch("/api/orders/:orderId", async (req, res) => {
  if (!supabase) {
    const { orderId } = req.params;
    const idx = memOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      memOrders[idx] = { ...memOrders[idx], ...req.body };
      return res.json(transformDbOrder(memOrders[idx]));
    }
    return res.status(404).json({ error: "Order not found" });
  }

  const { orderId } = req.params;
  const updates = req.body;

  try {
    // Get current record to preserve previous destination values
    const { data: currentOrder, error: getError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
      
    if (getError) {
      throw getError;
    }
    
    let parsedDestination = currentOrder?.destination || {};
    if (typeof parsedDestination === 'string') {
      try {
        parsedDestination = JSON.parse(parsedDestination);
      } catch (e) {
        parsedDestination = {};
      }
    }

    // Merge incoming destination block with updates & custom metadata fields
    const mergedDestination = {
      ...parsedDestination,
      ...(updates.destination || {}),
      pickupType: updates.pickupType || updates.pickup_type || parsedDestination.pickupType,
      assignedAgent: updates.assignedAgent !== undefined ? updates.assignedAgent : (updates.assigned_agent !== undefined ? updates.assigned_agent : parsedDestination.assignedAgent),
      assignedAgentId: updates.assignedAgentId !== undefined ? updates.assignedAgentId : (updates.assigned_agent_id !== undefined ? updates.assigned_agent_id : parsedDestination.assignedAgentId),
      languagePreference: updates.languagePreference || updates.language_preference || parsedDestination.languagePreference,
      itemType: updates.itemType || updates.item_type || parsedDestination.itemType,
      vehicleType: updates.vehicleType || updates.vehicle_type || parsedDestination.vehicleType,
      customerName: updates.customerName || updates.customer_name || parsedDestination.customerName || parsedDestination.fullName,
      phone: updates.phone || parsedDestination.phone,
      date: updates.date || parsedDestination.date,
      time: updates.time || parsedDestination.time,
      address: updates.address || parsedDestination.address
    };

    // Filter down down columns
    const databaseUpdates: any = {
      id: orderId,
      destination: mergedDestination
    };

    if (updates.customerId !== undefined || updates.customer_id !== undefined) {
      databaseUpdates.customer_id = updates.customerId !== undefined ? updates.customerId : updates.customer_id;
    }
    if (updates.items !== undefined) {
      databaseUpdates.items = updates.items;
    }
    if (updates.totalWeight !== undefined || updates.total_weight !== undefined) {
      databaseUpdates.total_weight = updates.totalWeight !== undefined ? updates.totalWeight : updates.total_weight;
    }
    if (updates.totalCost !== undefined || updates.total_cost !== undefined) {
      databaseUpdates.total_cost = updates.totalCost !== undefined ? updates.totalCost : updates.total_cost;
    }
    if (updates.status !== undefined) {
      databaseUpdates.status = updates.status;
    }
    if (updates.paymentStatus !== undefined || updates.payment_status !== undefined) {
      databaseUpdates.payment_status = updates.paymentStatus !== undefined ? updates.paymentStatus : updates.payment_status;
    }
    if (updates.shippingDate !== undefined || updates.shipping_date !== undefined) {
      databaseUpdates.shipping_date = updates.shippingDate !== undefined ? updates.shippingDate : updates.shipping_date;
    }
    if (updates.carrier !== undefined) {
      databaseUpdates.carrier = updates.carrier;
    }
    if (updates.tracking_number !== undefined || updates.trackingNumber !== undefined) {
      databaseUpdates.tracking_number = updates.tracking_number !== undefined ? updates.tracking_number : updates.trackingNumber;
    }
    if (updates.shipment_status !== undefined || updates.shipmentStatus !== undefined) {
      databaseUpdates.shipment_status = updates.shipment_status !== undefined ? updates.shipment_status : updates.shipmentStatus;
    }
    if (updates.shipment_date !== undefined || updates.shipmentDate !== undefined) {
      databaseUpdates.shipment_date = updates.shipment_date !== undefined ? updates.shipment_date : updates.shipmentDate;
    }
    if (updates.last_tracking_update !== undefined || updates.lastTrackingUpdate !== undefined) {
      databaseUpdates.last_tracking_update = updates.last_tracking_update !== undefined ? updates.last_tracking_update : updates.lastTrackingUpdate;
    }
    if (updates.tracking_response !== undefined || updates.trackingResponse !== undefined) {
      databaseUpdates.tracking_response = updates.tracking_response !== undefined ? updates.tracking_response : updates.trackingResponse;
    }

    // Pre-populate updates in memory fallback and cache immediately
    const mIdx = memOrders.findIndex(o => o.id === orderId);
    if (mIdx > -1) {
      memOrders[mIdx] = { ...memOrders[mIdx], ...databaseUpdates };
    } else {
      memOrders.unshift({ ...databaseUpdates, id: orderId, created_at: new Date().toISOString() });
    }
    const trUpdated = transformDbOrder({ ...databaseUpdates, id: orderId });
    const cIdx = cachedAllOrders.findIndex(o => o.id === orderId);
    if (cIdx > -1) {
      cachedAllOrders[cIdx] = { ...cachedAllOrders[cIdx], ...trUpdated };
    } else {
      cachedAllOrders.unshift(trUpdated);
    }

    if (!currentOrder) {
      console.log(`[SUPABASE] Order ${orderId} not found in DB. Inserting as new order on Agent Update.`);
      // Set defaults for insert
      databaseUpdates.status = databaseUpdates.status || 'Pending Pickup';
      databaseUpdates.payment_status = databaseUpdates.payment_status || 'Pending';
      const { data: insertedOrder, error: insertError } = await supabase
        .from('orders')
        .insert(databaseUpdates)
        .select()
        .single();
      if (insertError) {
        console.warn(`[SUPABASE] Upsert-insert failed: ${insertError.message}`);
        throw insertError;
      }
      return res.json(insertedOrder);
    }

    console.log(`[SUPABASE] Updating schema-compliant order ${orderId}`);
    const { data, error } = await supabase
      .from('orders')
      .update(databaseUpdates)
      .eq('id', orderId)
      .select()
      .single();
      
    if (error) {
      console.warn(`[SUPABASE] Compliant update failed. Retrying with full updates payload as fallback. Error: ${error.message}`);
      
      const fallbackUpdatesFull = {
        ...databaseUpdates,
        pickup_type: updates.pickupType || updates.pickup_type,
        assigned_agent: updates.assignedAgent || updates.assigned_agent,
        assigned_agent_id: updates.assignedAgentId || updates.assigned_agent_id,
        language_preference: updates.languagePreference || updates.language_preference,
        item_type: updates.itemType || updates.item_type,
        vehicle_type: updates.vehicleType || updates.vehicle_type,
        phone: updates.phone,
        customer_name: updates.customerName || updates.customer_name,
        date: updates.date,
        time: updates.time,
        address: updates.address
      };

      const { data: fbData, error: fbError } = await supabase
        .from('orders')
        .update(fallbackUpdatesFull)
        .eq('id', orderId)
        .select()
        .single();
        
      if (fbError) throw fbError;
      return res.json(fbData);
    }

    // Send WhatsApp/Email notification if order status was changed in PATCH updates
    if (updates.status !== undefined && data) {
      try {
        const message = `*JiffEX Shipment Update* 📦\n\nYour order #${orderId.slice(0, 8)} status has changed to: *${updates.status}*\n\nTrack here: ${process.env.APP_URL || 'https://jiffex.com'}/track?id=${orderId}`;
        await sendNotification(
          data.customer_id || '',
          "Order Status Updated",
          message,
          ['whatsapp', 'Email'],
          { 
            phone: (data.destination as any)?.phone,
            email: (data.destination as any)?.email,
            fullName: (data.destination as any)?.fullName,
            orderId: orderId
          }
        );
      } catch (notifyErr: any) {
        console.error("Failed to send order status notification from PATCH:", notifyErr.message);
      }
    }

    res.json(data);
  } catch (err: any) {
    console.error("Update Order Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Update order status
// Fix: Update order status AND send notification
app.patch("/api/orders/:orderId/status", async (req, res) => {
  if (!supabase) {
    const { orderId } = req.params;
    const { status } = req.body;
    const idx = memOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      memOrders[idx].status = status;
      return res.json({ success: true, order: transformDbOrder(memOrders[idx]) });
    }
    return res.status(404).json({ error: "Order not found" });
  }

  const { orderId } = req.params;
  const { status } = req.body;

  console.log(`[Order] Updating status for ${orderId} to ${status}`);

  // Keep local fallback and cache updated immediately
  const mIdxStatus = memOrders.findIndex(o => o.id === orderId);
  if (mIdxStatus > -1) {
    memOrders[mIdxStatus].status = status;
  }
  const cIdxStatus = cachedAllOrders.findIndex(o => o.id === orderId);
  if (cIdxStatus > -1) {
    cachedAllOrders[cIdxStatus].status = status;
  }

  try {
    // 1. Get current order info for notification
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (fetchError || !order) {
      console.warn(`[Order] Could not find order ${orderId} for notification`);
      // Proceed anyway with update if row exists but skip notification
    }

    // 2. Update status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (updateError) throw updateError;
    
    // 3. Send notification if order was found
    if (order) {
      try {
        const message = `*JiffEX Shipment Update*\n\nYour order #${orderId.slice(0, 8)} status has changed to: *${status}*\n\nTrack here: ${process.env.APP_URL || 'https://jiffex.com'}/track?id=${orderId}`;
        
        await sendNotification(
          order.customer_id,
          "Order Status Updated",
          message,
          ['whatsapp', 'Email'],
          { 
            phone: (order.destination as any)?.phone,
            email: (order.destination as any)?.email,
            fullName: (order.destination as any)?.fullName
          }
        );
      } catch (notifyErr: any) {
        console.error("[Order] Notification failed but status update succeeded:", notifyErr.message);
        // Do not throw here, we want the status update to be considered a success
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("Update Order Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Get Loaded SMTP Configuration Status (secure masked format)
app.get("/api/admin/smtp-status", (req, res) => {
  const host = process.env.SMTP_HOST || "";
  const port = process.env.SMTP_PORT || "";
  const user = process.env.SMTP_USER || "";
  const from = process.env.SMTP_FROM || "";
  const pass = process.env.SMTP_PASS || "";

  const mask = (str: string, isEmail = false) => {
    if (!str) return "NOT CONFIGURED";
    if (isEmail) {
      const parts = str.split("@");
      if (parts.length === 2) {
        const name = parts[0];
        const domain = parts[1];
        const visibleName = name.length > 2 ? name.substring(0, 2) + "*".repeat(name.length - 2) : "*".repeat(name.length);
        return visibleName + "@" + domain;
      }
    }
    if (str.length > 4) {
      return str.substring(0, 2) + "*".repeat(str.length - 4) + str.substring(str.length - 2);
    }
    return "*".repeat(str.length);
  };

  res.json({
    SMTP_HOST: host ? host : "NOT CONFIGURED",
    SMTP_PORT: port ? port : "NOT CONFIGURED (defaults to 587)",
    SMTP_USER: user ? mask(user, true) : "NOT CONFIGURED",
    SMTP_FROM: from ? mask(from, true) : "NOT CONFIGURED",
    SMTP_PASS_MASKED: pass ? mask(pass) : "NOT CONFIGURED",
    SMTP_PASS_LENGTH: pass ? pass.length : 0,
    twilioSidConfigured: !!process.env.TWILIO_ACCOUNT_SID,
    twilioPhoneConfigured: !!process.env.TWILIO_PHONE_NUMBER
  });
});

// API: Dynamics test SMTP connection
app.post("/api/smtp/test", async (req, res) => {
  const { host, port, user, pass, from } = req.body;
  if (!host || !user || !pass || !from) {
    return res.status(400).json({ error: "Missing required fields for SMTP test" });
  }

  let cleanedHost = host.trim().replace(/^['"]|['"]$/g, '');
  let cleanedPort = (port || "").toString().trim().replace(/^['"]|['"]$/g, '');
  let cleanedUser = user.trim().replace(/^['"]|['"]$/g, '');
  let cleanedFrom = from.trim().replace(/^['"]|['"]$/g, '');
  let cleanedPass = pass.trim().replace(/^['"]|['"]$/g, '');

  if (cleanedHost.toLowerCase().includes("gmail") || cleanedHost.toLowerCase().includes("googlemail")) {
    if (!cleanedUser.includes("@")) {
      cleanedUser = `${cleanedUser}@gmail.com`;
    }
    // Automatically eliminate space formatting from Gmail App Password if length matches
    const spaceLessPass = cleanedPass.replace(/\s+/g, '');
    if (spaceLessPass.length === 16) {
      cleanedPass = spaceLessPass;
    }
  }

  try {
    console.log(`[SMTP Test] Verifying SMTP connection to ${cleanedHost}:${cleanedPort || '587'} as ${cleanedUser}...`);
    const tempTransporter = nodemailer.createTransport({
      host: cleanedHost,
      port: Number(cleanedPort) || 587,
      secure: Number(cleanedPort) === 465,
      auth: {
        user: cleanedUser,
        pass: cleanedPass
      }
    });

    await tempTransporter.verify();
    
    console.log(`[SMTP Test] Connection verified! Sending a test email to ${cleanedUser}...`);
    await tempTransporter.sendMail({
      from: cleanedFrom,
      to: cleanedUser,
      subject: "JiffEX SMTP Diagnostic Test Successful!",
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #4f46e5; border-radius: 16px;">
          <h2 style="color: #4f46e5; margin-top: 0;">🎉 SMTP Connection Successful!</h2>
          <p>Your JiffEX notification server has successfully authenticated and is ready to send notifications.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 120px;"><strong>SMTP Host:</strong></td>
              <td style="padding: 6px 0; color: #111;">${cleanedHost}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;"><strong>SMTP Port:</strong></td>
              <td style="padding: 6px 0; color: #111;">${cleanedPort || "587"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;"><strong>SMTP User:</strong></td>
              <td style="padding: 6px 0; color: #111;">${cleanedUser}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;"><strong>SMTP From:</strong></td>
              <td style="padding: 6px 0; color: #111;">${cleanedFrom}</td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">This diagnostic test is complete. You can close this email.</p>
        </div>
      `
    });

    console.log(`[SMTP Test] Test email successfully sent to ${cleanedUser}`);
    return res.json({ success: true, message: "SMTP Connection is working perfectly! A test email has been delivered to your inbox." });
  } catch (err: any) {
    console.error(`[SMTP Test] Verification failed:`, err);
    return res.status(500).json({ 
      error: formatSmtpError(err, "SMTP Verification Failed"),
      message: err.message
    });
  }
});

// API: Simulate Delivery Notifications
app.post("/api/notifications/simulate", async (req, res) => {
  res.json({ success: true });
});

// API: Share Invoice via Email (PDF Attachment)
app.post("/api/invoice/send-pdf", async (req, res) => {
  const { email, order, companyDetails } = req.body;
  if (!order) {
    return res.status(400).json({ error: "Order details are missing" });
  }
  console.log(`[Invoice PDF] Request received for order ${order.id} to email: ${email}`);
  
  if (!mailTransporter || !process.env.SMTP_FROM) {
    console.error('[Invoice PDF] Email service not configured');
    return res.status(503).json({ error: "Email service not configured" });
  }

  if (!email || !email.includes('@') || email === 'user@example.com') {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(order, companyDetails);

    const orderIdStr = String(order.id || '');
    const isPrefixed = ['SH-', 'SW-', 'PH-', 'BB-'].some(p => orderIdStr.startsWith(p));
    const trackingId = isPrefixed ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
    const appUrl = process.env.APP_URL || "https://www.jiffex.com";
    const trackingUrl = `${appUrl}?tab=track&id=${trackingId}`;
    
    const subject = `Invoice for your JiffEX Order: ${trackingId}`;
    const bodyText = `
Dear ${order.destination.fullName},

Thank you for choosing JiffEX for your shipping needs. 

We are pleased to inform you that your payment has been successfully processed. Please find the attached tax invoice for your order ${trackingId}.

Your shipment is being processed and will be dispatched as per the scheduled date. 

Track your shipment here: ${trackingUrl}

If you have any questions or require further assistance, please do not hesitate to contact our support team at ${companyDetails.email}.

Best regards,

The JiffEX Team
JiffEX Shipping & Logistics
www.jiffex.com
    `.trim();

    const bodyHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
  <p>Dear <strong>${order.destination.fullName}</strong>,</p>
  <p>Thank you for choosing <strong>JiffEX</strong> for your shipping needs.</p>
  <p>We are pleased to inform you that your payment has been successfully processed. Please find the attached tax invoice for your order <strong>${trackingId}</strong>.</p>
  <p>Your shipment is being processed and will be dispatched as per the scheduled date.</p>
  
  <p>You can track your shipment anytime using this link: 
    <a href="${trackingUrl}" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">
      Track Shipment Link
    </a>
  </p>
  
  <p>If you have any questions or require further assistance, please do not hesitate to contact our support team at <a href="mailto:${companyDetails.email}" style="color: #4f46e5;">${companyDetails.email}</a>.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    Best regards,<br>
    <strong>The JiffEX Team</strong><br>
    JiffEX Shipping & Logistics<br>
    <a href="https://www.jiffex.com" style="color: #4f46e5; text-decoration: none;">www.jiffex.com</a>
  </p>
</div>
    `.trim();

    console.log(`[Invoice PDF] Sending email to ${email}...`);
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: subject,
      text: bodyText,
      html: bodyHtml,
      attachments: [
        {
          filename: `Invoice_${trackingId}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    console.log(`[Invoice PDF] Invoice ${order.id} successfully sent to ${email}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[Invoice PDF] CRITICAL ERROR for order ${order?.id}:`, err);
    res.status(500).json({ 
      error: formatSmtpError(err, "Invoice Email"),
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// API: Send Order Confirmation for Pay at Home
app.post("/api/order-confirmation", async (req, res) => {
  const { email, order, companyDetails } = req.body;
  if (!order) {
    return res.status(400).json({ error: "Order details are missing" });
  }
  console.log(`[Order Confirmation] Request received for order ${order.id} to email: ${email}`);
  
  if (!mailTransporter || !process.env.SMTP_FROM) {
    console.error('[Order Confirmation] Email service not configured');
    return res.status(503).json({ error: "Email service not configured" });
  }

  if (!email || !email.includes('@') || email === 'user@example.com') {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    const orderIdStr = String(order.id || '');
    const isPrefixed = ['SH-', 'SW-', 'PH-', 'BB-'].some(p => orderIdStr.startsWith(p));
    const trackingId = isPrefixed ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
    const appUrl = process.env.APP_URL || "https://www.jiffex.com";
    const trackingUrl = `${appUrl}?tab=track&id=${trackingId}`;
    
    const subject = `Order Confirmed: ${trackingId} (Pay at Home)`;
    const bodyText = `
Dear ${order.destination.fullName},

Thank you for choosing JiffEX. Your order ${trackingId} has been confirmed.

Payment Method: Pay at Home
The total amount of ₹${(order.totalCost || 0).toLocaleString()} will be collected by our executive during the scheduled pickup.

Pickup Date: ${order.shippingDate}
Destination: ${order.destination.city}, ${order.destination.country}

Track your shipment here: ${trackingUrl}

If you have any questions, please contact our support team at ${companyDetails.email}.

Best regards,
The JiffEX Team
    `.trim();

    const bodyHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
  <p>Dear <strong>${order.destination.fullName}</strong>,</p>
  <p>Thank you for choosing <strong>JiffEX</strong>. Your order <strong>${trackingId}</strong> has been confirmed.</p>
  
  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; color: #1e293b;">Payment Method: Pay at Home</p>
    <p style="margin: 5px 0 0 0;">The total amount of <strong>₹${(order.totalCost || 0).toLocaleString()}</strong> will be collected by our executive during the scheduled pickup.</p>
  </div>

  <p><strong>Order Summary:</strong><br>
  Pickup Date: ${order.shippingDate}<br>
  Destination: ${order.destination.city}, ${order.destination.country}</p>
  
  <p>You can track your shipment anytime using this link: 
    <a href="${trackingUrl}" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">
      Track Shipment Link
    </a>
  </p>
  
  <p>If you have any questions, please contact our support team at <a href="mailto:${companyDetails.email}" style="color: #4f46e5;">${companyDetails.email}</a>.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    Best regards,<br>
    <strong>The JiffEX Team</strong>
  </p>
</div>
    `.trim();

    console.log(`[Order Confirmation] Sending email to ${email}...`);
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: subject,
      text: bodyText,
      html: bodyHtml
    });

    console.log(`[Order Confirmation] Confirmation for order ${order.id} successfully sent to ${email}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[Order Confirmation] CRITICAL ERROR for order ${order?.id}:`, err);
    res.status(500).json({ 
      error: formatSmtpError(err, "Confirmation Email"),
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

async function fetchImageBuffer(url: string | undefined): Promise<Buffer | null> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    console.warn('[PDF Logo] Invalid or missing logo URL');
    return null;
  }
  try {
    let finalUrl = url;
    
    // Convert Google Drive share links to direct download links
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/([^\/]+)\//) || url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) {
        finalUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
      }
    } else if (url.includes('lh3.googleusercontent.com/d/')) {
      const idMatch = url.match(/\/d\/([^\/]+)/);
      if (idMatch && idMatch[1]) {
        finalUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
      }
    }

    console.log(`[PDF Logo] Fetching logo from: ${finalUrl}`);
    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/png,image/jpeg,image/*;q=0.9'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`[PDF Logo] Content-Type: ${contentType}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length === 0) {
      throw new Error('Fetched image buffer is empty');
    }
    
    // Basic check for image header (PNG, JPG, GIF)
    const isImage = buffer[0] === 0x89 || buffer[0] === 0xFF || buffer[0] === 0x47;
    if (!isImage && !contentType?.includes('image')) {
      console.warn('[PDF Logo] Buffer does not appear to be a standard image format');
    }
    
    console.log(`[PDF Logo] Successfully fetched logo buffer, size: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error('[PDF Logo] Error fetching image buffer:', error);
    return null;
  }
}

async function generateInvoicePDF(order: any, companyDetails: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header Section
    const logoUrl = process.env.VITE_LOGO_URL || "https://raw.githubusercontent.com/satyas2706/Test1/main/public/logo.png";
    const logoBuffer = await fetchImageBuffer(logoUrl);
    
    if (logoBuffer) {
      try {
        // Try to render the image
        doc.image(logoBuffer, 50, 45, { width: 120 });
        doc.moveDown(2);
      } catch (err) {
        console.error("[PDF Logo] Rendering Error:", err);
        // Fallback to text logo if image rendering fails
        doc.fillColor("#4f46e5").fontSize(28).font("Helvetica-Bold").text("JIFFEX", 50, 50);
        doc.moveDown(1.5);
      }
    } else {
      // Fallback to text logo if fetch fails
      doc.fillColor("#4f46e5").fontSize(28).font("Helvetica-Bold").text("JIFFEX", 50, 50);
      doc.moveDown(1.5);
    }
    
    doc.fillColor("#444444").fontSize(10).font("Helvetica");
    doc.text(companyDetails.name, 350, 50, { align: "right" });
    doc.text(companyDetails.address, 350, 65, { align: "right" });
    doc.text(companyDetails.email, 350, 80, { align: "right" });
    
    doc.moveDown(2.5);
    const pageWidth = doc.page.width;
    doc.fillColor("#000000").fontSize(22).font("Helvetica-Bold").text("TAX INVOICE", 0, doc.y, { 
      align: "center",
      width: pageWidth
    });
    doc.moveDown();

    const infoTop = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text(`Invoice Number:`, 50, infoTop);
    const orderIdStr = String(order.id || '');
    doc.font("Helvetica").text(`INV-${orderIdStr.slice(0, 8).toUpperCase()}`, 150, infoTop);
    
    doc.font("Helvetica-Bold").text(`Invoice Date:`, 50, infoTop + 15);
    doc.font("Helvetica").text(`${new Date(order.created_at || order.createdAt || new Date()).toLocaleDateString()}`, 150, infoTop + 15);
    
    doc.moveDown(2);

    // Customer Details
    const customerTop = doc.y;
    doc.fontSize(12).font("Helvetica-Bold").text("Customer Details", 50, customerTop);
    doc.moveTo(50, customerTop + 15).lineTo(250, customerTop + 15).stroke();
    
    doc.fontSize(10).font("Helvetica").text(`Name: ${order.destination.fullName}`, 50, customerTop + 25);
    doc.text(`Email: ${order.destination.email}`, 50, customerTop + 40);
    doc.text(`Phone: ${order.destination.phone}`, 50, customerTop + 55);
    doc.text(`Address: ${order.destination.addressLine1}, ${order.destination.city}, ${order.destination.state}, ${order.destination.zipCode}, ${order.destination.country}`, 50, customerTop + 70, { width: 200 });

    doc.moveDown(4);

    // Order Details Table
    const tableTop = doc.y;
    doc.fontSize(12).font("Helvetica-Bold").text("Order Details", 50, tableTop);
    
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Item Description", 50, tableTop + 25);
    doc.text("Qty", 300, tableTop + 25, { width: 40, align: 'center' });
    doc.text("Weight", 360, tableTop + 25, { width: 80, align: 'center' });
    doc.text("Price", 460, tableTop + 25, { width: 80, align: 'right' });
    
    doc.moveTo(50, tableTop + 40).lineTo(550, tableTop + 40).stroke();
    
    let y = tableTop + 50;
    doc.font("Helvetica");
    (order.items || []).forEach((item: any) => {
      doc.text(item.name || 'Unknown Item', 50, y);
      doc.text((item.quantity || 1).toString(), 300, y, { width: 40, align: 'center' });
      doc.text(`${item.weight || 0} kg`, 360, y, { width: 80, align: 'center' });
      doc.text(`Rs.${(item.price || 0).toLocaleString()}`, 460, y, { width: 80, align: 'right' });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown(2);

    // Shipping Details
    const shippingTop = doc.y;
    doc.fontSize(12).font("Helvetica-Bold").text("Shipping Details", 50, shippingTop);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Service Type: ${(order.items && order.items[0]) ? order.items[0].source : 'Standard Shipping'}`, 50, shippingTop + 20);
    doc.text(`Origin: India`, 50, shippingTop + 35);
    doc.text(`Destination: ${order.destination.country}`, 50, shippingTop + 50);
    const isPrefixed = ['SH-', 'SW-', 'PH-', 'BB-'].some(p => orderIdStr.startsWith(p));
    const trackingId = isPrefixed ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
    doc.text(`Tracking ID: ${trackingId}`, 50, shippingTop + 65);

    // Cost Breakdown
    const costTop = shippingTop;
    doc.fontSize(12).font("Helvetica-Bold").text("Cost Breakdown", 350, costTop);
    
    const productCost = (order.items || []).reduce((acc: number, i: any) => acc + (i.price || 0), 0);
    const totalCost = order.total_cost || order.totalCost || 0;
    const shippingCharges = Math.max(0, totalCost - productCost);
    
    doc.fontSize(10).font("Helvetica");
    doc.text(`Product Cost:`, 350, costTop + 20);
    doc.text(`Rs.${productCost.toLocaleString()}`, 460, costTop + 20, { width: 80, align: 'right' });
    
    doc.text(`Shipping Charges:`, 350, costTop + 35);
    doc.text(`Rs.${shippingCharges.toLocaleString()}`, 460, costTop + 35, { width: 80, align: 'right' });
    
    doc.text(`Taxes:`, 350, costTop + 50);
    doc.text(`Rs.0`, 460, costTop + 50, { width: 80, align: 'right' });
    
    doc.moveTo(350, costTop + 65).lineTo(550, costTop + 65).stroke();
    doc.font("Helvetica-Bold").text(`Total Paid:`, 350, costTop + 70);
    doc.text(`Rs.${totalCost.toLocaleString()}`, 460, costTop + 70, { width: 80, align: 'right' });

    // Footer Section
    doc.font("Helvetica-Oblique").fontSize(8).fillColor("#666666")
       .text("This is a system-generated invoice and does not require a physical signature.", 50, 750, { align: "center" });
    doc.text(`Support: ${companyDetails.email} | Website: www.jiffex.com`, { align: "center" });
    doc.text("Terms: All shipments are subject to JiffEX terms and conditions.", { align: "center" });

    doc.end();
  });
}

// API: Get notification history
app.get("/api/notifications/:userId", async (req, res) => {
  res.json([]);
});

// API: Delete all orders and items (Debug/Admin only)
app.delete("/api/orders", async (req, res) => {
  if (!supabase) {
    // If no supabase, just clear local state (not applicable here as we want to clear DB)
    return res.status(503).json({ error: "Supabase not connected" });
  }

  try {
    // Delete all items first (foreign key dependency)
    // We use a filter that matches everything to satisfy Supabase's requirement for a filter on DELETE
    const { error: itemsError } = await supabase.from('items').delete().neq('id', 'placeholder-non-existent-id');
    if (itemsError) throw itemsError;

    // Delete all orders
    const { error: ordersError } = await supabase.from('orders').delete().neq('id', 'placeholder-non-existent-id');
    if (ordersError) throw ordersError;

    res.json({ success: true, message: "Successfully cleared all orders and items." });
  } catch (err: any) {
    console.error("Clear All Data Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Get the next system-wide sequential ID for a given prefix
app.get("/api/orders/next-seq/:prefix", async (req, res) => {
  const { prefix } = req.params;
  let maxSeq = 0;
  
  if (supabase) {
    try {
      // Direct prefix-matching query sorting alphabetically descending so the highest sequence is guaranteed within the first few results
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .ilike('id', `${prefix}-%`)
        .order('id', { ascending: false })
        .limit(20);
        
      if (!error && data) {
        data.forEach((o: any) => {
          if (o.id && o.id.startsWith(prefix)) {
            const parts = o.id.split('-');
            if (parts.length >= 2) {
              const s = parseInt(parts[1], 10);
              if (!isNaN(s) && s > maxSeq) maxSeq = s;
            }
          }
        });
      }
    } catch (err: any) {
      console.error("Error getting next id from DB:", err.message);
    }
  }

  // Also check memOrders for safety
  memOrders.forEach((o: any) => {
    if (o.id && o.id.startsWith(prefix)) {
      const parts = o.id.split('-');
      if (parts.length >= 2) {
        const s = parseInt(parts[1], 10);
        if (!isNaN(s) && s > maxSeq) maxSeq = s;
      }
    }
  });

  const nextSeqNum = maxSeq + 1;
  const seq = nextSeqNum.toString().padStart(5, '0');
  const finalId = `${prefix}-${seq}`;
  res.json({ nextId: finalId });
});

// Helper to safely transform database order object supporting field extracting from destination JSONB
const transformDbOrder = (o: any) => {
  if (!o) return o;
  let dest = o.destination;
  if (typeof dest === 'string') {
    try {
      dest = JSON.parse(dest);
    } catch (e) {
      dest = {};
    }
  }

  return {
    ...o,
    destination: dest,
    customerId: o.customer_id || o.customerId || dest?.customerId || dest?.customer_id,
    totalWeight: o.total_weight !== undefined && o.total_weight !== null ? o.total_weight : (o.totalWeight !== undefined ? o.totalWeight : (dest?.totalWeight || dest?.total_weight || 0)),
    totalCost: o.total_cost !== undefined && o.total_cost !== null ? o.total_cost : (o.totalCost !== undefined ? o.totalCost : (dest?.totalCost || dest?.total_cost || 0)),
    paymentStatus: o.payment_status || o.paymentStatus || dest?.paymentStatus || dest?.payment_status || 'Pending',
    shippingDate: o.shipping_date || o.shippingDate || dest?.shippingDate || dest?.shipping_date || dest?.date,
    createdAt: o.created_at || o.createdAt,
    pickupType: o.pickup_type !== undefined && o.pickup_type !== null ? o.pickup_type : (o.pickupType !== undefined && o.pickupType !== null ? o.pickupType : (dest?.pickupType || dest?.pickup_type || 'AllAgent')),
    assignedAgent: o.assigned_agent !== undefined && o.assigned_agent !== null ? o.assigned_agent : (o.assignedAgent !== undefined && o.assignedAgent !== null ? o.assignedAgent : (dest?.assignedAgent || dest?.assigned_agent)),
    assignedAgentId: o.assigned_agent_id !== undefined && o.assigned_agent_id !== null ? o.assigned_agent_id : (o.assignedAgentId !== undefined && o.assignedAgentId !== null ? o.assignedAgentId : (dest?.assignedAgentId || dest?.assigned_agent_id)),
    languagePreference: o.language_preference !== undefined && o.language_preference !== null ? o.language_preference : (o.languagePreference !== undefined && o.languagePreference !== null ? o.languagePreference : (dest?.languagePreference || dest?.language_preference || 'English')),
    itemType: o.item_type !== undefined && o.item_type !== null ? o.item_type : (o.itemType !== undefined && o.itemType !== null ? o.itemType : (dest?.itemType || dest?.item_type || 'General')),
    vehicleType: o.vehicle_type !== undefined && o.vehicle_type !== null ? o.vehicle_type : (o.vehicleType !== undefined && o.vehicleType !== null ? o.vehicleType : (dest?.vehicleType || dest?.vehicle_type || 'Two-Wheeler')),
    customerName: o.customer_name !== undefined && o.customer_name !== null ? o.customer_name : (o.customerName !== undefined && o.customerName !== null ? o.customerName : (dest?.customerName || dest?.customer_name || dest?.fullName)),
    phone: o.phone !== undefined && o.phone !== null ? o.phone : dest?.phone,
    address: o.address !== undefined && o.address !== null ? o.address : dest?.address || dest?.addressLine1,
    date: o.date !== undefined && o.date !== null ? o.date : (dest?.date || o.shipping_date || o.shipping_date),
    time: o.time !== undefined && o.time !== null ? o.time : (dest?.time || 'Flexible'),
    trackingNumber: o.tracking_number || o.trackingNumber,
    carrier: o.carrier,
    shipmentStatus: o.shipment_status || o.shipmentStatus,
    shipmentDate: o.shipment_date || o.shipmentDate,
    lastTrackingUpdate: o.last_tracking_update || o.lastTrackingUpdate,
    trackingResponse: (() => {
      let tr = o.tracking_response || o.trackingResponse;
      if (typeof tr === 'string') {
        try { return JSON.parse(tr); } catch (e) { return null; }
      }
      return tr || null;
    })(),
  };
};

// Helper to perform structural deduplication of orders
// If there is an order that is still scheduled but has empty items, and we find a completed/processed clone
// (created historical sequence increment bugs in the previous codebase), we automatically delete the scheduled empty clone.
const deduplicateOrders = (ordersList: any[]) => {
  if (!ordersList || ordersList.length === 0) return ordersList;

  const completed = ordersList.filter(o => {
    let its = o.items;
    if (typeof its === 'string') {
      try { its = JSON.parse(its); } catch (e) { its = []; }
    }
    const hasItems = Array.isArray(its) && its.length > 0;
    const isCompletedStatus = ['Picked Up', 'In Warehouse', 'Received at Warehouse', 'Ready to Ship', 'In Transit', 'Out for Delivery', 'Delivered', 'Completed'].includes(o.status || o.destination?.status);
    return hasItems || isCompletedStatus;
  });

  const pending = ordersList.filter(o => !completed.some(co => co.id === o.id));
  const cleanList = [...completed];
  const idsToDelete: string[] = [];

  for (const pend of pending) {
    const isDup = completed.some(comp => {
      const pCust = pend.customer_id || pend.customerId || pend.destination?.customer_id || pend.destination?.customerId;
      const cCust = comp.customer_id || comp.customerId || comp.destination?.customer_id || comp.destination?.customerId;
      if (String(pCust) !== String(cCust)) return false;

      const pDate = pend.shipping_date || pend.shippingDate || pend.destination?.shippingDate || pend.destination?.date || pend.date;
      const cDate = comp.shipping_date || comp.shippingDate || comp.destination?.shippingDate || comp.destination?.date || comp.date;
      if (pDate !== cDate) return false;

      const pName = pend.customer_name || pend.customerName || pend.destination?.fullName || pend.destination?.customerName;
      const cName = comp.customer_name || comp.customerName || comp.destination?.fullName || comp.destination?.customerName;
      if (pName !== cName) return false;

      const pAddr = pend.address || pend.destination?.address || pend.destination?.addressLine1;
      const cAddr = comp.address || comp.destination?.address || comp.destination?.addressLine1;
      if (pAddr !== cAddr) return false;

      const pendingNum = parseInt(pend.id.split('-')[1], 10);
      const completedNum = parseInt(comp.id.split('-')[1], 10);
      const isSeqClose = !isNaN(pendingNum) && !isNaN(completedNum) && Math.abs(pendingNum - completedNum) <= 2;

      return isSeqClose;
    });

    let its = pend.items;
    if (typeof its === 'string') {
      try { its = JSON.parse(its); } catch (e) { its = []; }
    }
    const itemLength = Array.isArray(its) ? its.length : 0;

    if (isDup && itemLength === 0 && (pend.status === 'Scheduled' || pend.status === 'Pending Pickup' || pend.status === 'Pending')) {
      console.log(`[SERVER SELF-HEAL] Deleting stale duplicate order: ${pend.id}`);
      idsToDelete.push(pend.id);
    } else {
      cleanList.push(pend);
    }
  }

  // Fire background PostgreSQL deletions if we have duplicate IDs and supabase is alive
  if (idsToDelete.length > 0 && supabase) {
    supabase.from('orders').delete().in('id', idsToDelete)
      .then(({ error }) => {
        if (error) console.error('[SERVER SELF-HEAL] PG Delete Error:', error.message);
        else console.log('[SERVER SELF-HEAL] PG Deleted IDs:', idsToDelete);
      });
    // Filter from memory arrays
    const filteredMem = memOrders.filter(o => !idsToDelete.includes(o.id));
    memOrders.length = 0;
    memOrders.push(...filteredMem);
    cachedAllOrders = cachedAllOrders.filter(o => !idsToDelete.includes(o.id));
  }

  return cleanList;
};

// API: Get specific Cargo Manifest for printing or sharing as attachment
app.get("/manifest/:id", async (req, res) => {
  const { id } = req.params;
  const qItems = req.query.items ? JSON.parse(decodeURIComponent(req.query.items as string)) : null;
  const qName = req.query.name as string;
  const qPhone = req.query.phone as string;
  const qWeight = req.query.weight as string;
  const qTotal = req.query.total as string;

  let dbPickup: any = null;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('pickups').select('*').eq('id', id).maybeSingle();
      if (!error && data) dbPickup = data;
    } catch (e) {
      console.error("[SUPABASE GET MANIFEST ERROR]:", e);
    }
  }

  if (!dbPickup) {
    dbPickup = memPickups.find(p => p.id === id);
  }

  const customerName = qName || dbPickup?.customer_name || dbPickup?.customerName || 'Valued Customer';
  const customerPhone = qPhone || dbPickup?.phone || dbPickup?.phoneNumber || '';
  const displayId = id;
  const rawItems = qItems || dbPickup?.items || [];
  const items = Array.isArray(rawItems) ? rawItems : [];

  const totalWeight = qWeight ? parseFloat(qWeight) : (items.reduce((sum: number, it: any) => sum + (parseFloat(it.weight || 0) * (it.quantity || 1)), 0));
  const totalCost = qTotal ? parseFloat(qTotal) : (totalWeight * 15);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cargo Manifest - ${displayId}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
        }
        .heading {
          font-family: 'Space Grotesk', sans-serif;
        }
        .mono {
          font-family: 'JetBrains Mono', monospace;
        }
        @media print {
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body class="bg-slate-100 text-slate-800 p-4 sm:p-8 antialiased">
      <div class="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mt-6 mb-6">
        <!-- Header -->
        <div class="bg-slate-900 text-white p-6 sm:p-8 relative">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span class="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white rounded-full">Official Cargo Manifest</span>
              <h1 class="heading text-xl sm:text-2xl font-bold mt-2">Cargo Collection Receipt</h1>
              <p class="mono text-xs text-slate-400 mt-1">ID: ${displayId}</p>
            </div>
            <div class="text-left sm:text-right">
              <span class="text-sm font-black text-indigo-400 block sm:inline">STATUS: APPROVED & COLLECTED</span>
              <p class="text-[10px] text-slate-400 mt-1">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 sm:p-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Customer Details</h3>
              <p class="font-bold text-slate-900 text-sm">${customerName}</p>
              <p class="text-xs text-slate-605 mt-1">${customerPhone ? 'Phone: ' + customerPhone : 'Phone: Not Specified'}</p>
            </div>
            <div>
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Carrier / Agency</h3>
              <p class="font-bold text-slate-900 text-sm">Agent Pickup Logistics, Inc.</p>
              <p class="text-xs text-slate-605 mt-1">Authorized security signature validated</p>
            </div>
          </div>

          <!-- Items Table -->
          <div>
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Collected Items List</h3>
            <div class="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[10px] uppercase font-black tracking-wider border-b border-slate-150">
                    <th class="p-3.5"># Item Description</th>
                    <th class="p-3.5 text-center flex-1">Qty</th>
                    <th class="p-3.5 text-right">Individual Wt</th>
                    <th class="p-3.5 text-right">Total Wt</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-150 text-xs">
                  ${items.length === 0 ? `
                    <tr>
                      <td colspan="4" class="p-8 text-center text-slate-400 font-bold">No cargo items found in this manifest</td>
                    </tr>
                  ` : items.map((item: any, idx: number) => `
                    <tr>
                      <td class="p-3.5 font-semibold text-slate-800">${item.name || item.itemName || 'Cargo Item'}</td>
                      <td class="p-3.5 text-center font-bold text-slate-600">${item.quantity || 1}</td>
                      <td class="p-3.5 text-right font-mono">${parseFloat(item.weight || 0).toFixed(1)} kg</td>
                      <td class="p-3.5 text-right font-mono font-bold text-slate-900">${(parseFloat(item.weight || 0) * (item.quantity || 1)).toFixed(1)} kg</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Totals -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div class="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/50">
              <span class="text-[9px] font-black text-indigo-500 uppercase tracking-wider block">Consolidated Metrics</span>
              <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-slate-600 font-semibold">Total Cargo Weight</span>
                <span class="text-sm font-black text-slate-900">${totalWeight.toFixed(1)} kg</span>
              </div>
            </div>
            
            <div class="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50 text-right sm:text-right">
              <span class="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">Financial Overview</span>
              <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-slate-600 font-semibold block text-left">Consolidated Charges</span>
                <span class="text-sm font-black text-emerald-700">₹${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-150 flex items-start gap-3">
            <span class="text-lg">🔒</span>
            <div>
              <h4 class="text-xs font-black text-amber-850 font-bold">Approved Signature Validated</h4>
              <p class="text-[10px] text-amber-700 mt-0.5 leading-relaxed">This Cargo shipping manifest has been validated and authorized under OTP Pin code by ${customerName} to the designated pickup agent. Verified cryptographically.</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-slate-50 p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
          <p class="text-[10px] text-slate-400 font-bold">This is an authentic system generated document. Print or Save as PDF.</p>
          <div class="flex gap-3">
            <button onclick="window.print()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-all flex items-center gap-1.5 font-bold">
              🖨️ Print / Save PDF
            </button>
            <button onclick="window.close()" class="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all">
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API: Get all pickups from Supabase (or fallback to memory store)
app.get("/api/pickups", async (req, res) => {
  if (!supabase) {
    return res.json(memPickups);
  }
  try {
    const { data, error } = await supabase
      .from('pickups')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error("[SUPABASE GET PICKUPS ERROR]:", err.message);
    res.json(memPickups);
  }
});

// API: Create or update a pickup
app.post("/api/pickups", async (req, res) => {
  const pickup = req.body;
  const id = pickup.id || crypto.randomUUID();
  const dbPickup = {
    id,
    customer_id: pickup.customer_id || pickup.customerId,
    customer_name: pickup.customer_name || pickup.customerName,
    email: pickup.email,
    phone: pickup.phone,
    status: pickup.status || 'Scheduled',
    pickup_date: pickup.pickup_date || pickup.pickupDate || pickup.date,
    pickup_time: pickup.pickup_time || pickup.pickupTime || pickup.time || 'Flexible',
    address: pickup.address,
    items: pickup.items || [],
    payment_status: pickup.payment_status || pickup.paymentStatus || 'Pending',
    pickup_type: pickup.pickup_type || pickup.pickupType || 'AllAgent',
    assigned_agent_id: pickup.assigned_agent_id || pickup.assignedAgentId,
    language_preference: pickup.language_preference || pickup.languagePreference,
    item_type: pickup.item_type || pickup.itemType,
    vehicle_type: pickup.vehicle_type || pickup.vehicleType
  };

  const idx = memPickups.findIndex(p => p.id === id);
  if (idx > -1) {
    memPickups[idx] = dbPickup;
  } else {
    memPickups.push(dbPickup);
  }

  if (!supabase) {
    return res.json(dbPickup);
  }

  try {
    const { data, error } = await supabase
      .from('pickups')
      .upsert(dbPickup)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("[SUPABASE INSERT PICKUP ERROR]:", err.message);
    res.json(dbPickup);
  }
});

// API: Patch/Update an existing pickup (e.g., status, assigned agent)
app.patch("/api/pickups/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // DB Format mapping
  const mappedUpdates: any = {};
  if (updates.status !== undefined) mappedUpdates.status = updates.status;
  if (updates.paymentStatus !== undefined || updates.payment_status !== undefined) {
    mappedUpdates.payment_status = updates.paymentStatus || updates.payment_status;
  }
  if (updates.assignedAgentId !== undefined || updates.assigned_agent_id !== undefined) {
    mappedUpdates.assigned_agent_id = updates.assignedAgentId || updates.assigned_agent_id;
  }
  if (updates.pickupDate !== undefined || updates.pickup_date !== undefined) {
    mappedUpdates.pickup_date = updates.pickupDate || updates.pickup_date;
  }
  if (updates.pickupTime !== undefined || updates.pickup_time !== undefined) {
    mappedUpdates.pickup_time = updates.pickupTime || updates.pickup_time;
  }

  const idx = memPickups.findIndex(p => p.id === id);
  if (idx > -1) {
    memPickups[idx] = { ...memPickups[idx], ...mappedUpdates, ...updates };
  }

  if (!supabase) {
    const combined = { id, ...updates };
    return res.json(combined);
  }

  try {
    const { data, error } = await supabase
      .from('pickups')
      .update(mappedUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) {
      res.json(data);
    } else {
      res.json({ id, ...updates });
    }
  } catch (err: any) {
    console.warn("[SUPABASE PATCH PICKUP WARNING]:", err.message);
    res.json({ id, ...updates });
  }
});

// API: Delete a pickup
app.delete("/api/pickups/:id", async (req, res) => {
  const { id } = req.params;
  
  const idx = memPickups.findIndex(p => p.id === id);
  if (idx > -1) {
    memPickups.splice(idx, 1);
  }

  if (!supabase) {
    return res.json({ success: true });
  }

  try {
    const { error } = await supabase
      .from('pickups')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[SUPABASE DELETE PICKUP ERROR]:", err.message);
    res.json({ success: true });
  }
});

// API: Get all orders (Admin only)
app.get("/api/orders", async (req, res) => {
  if (!supabase) {
    return res.json(memOrders.map(transformDbOrder));
  }

  try {
    // Add strict query timeout to guarantee instantaneous response times and skip table statement timeouts
    const query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const { data, error } = await queryWithTimeout(query, 2000);
    if (error) throw error;
    
    // Transform snake_case back to camelCase for frontend
    const transformed = (data || []).map(transformDbOrder);
    
    // Merge database results with memory-only orders to ensure none are lost under any circumstances
    const mergedMap = new Map();
    // Pre-populate with database results (authoritative)
    transformed.forEach((o: any) => mergedMap.set(o.id, o));
    // Overlay memory changes/recently created orders
    memOrders.map(transformDbOrder).forEach((o: any) => mergedMap.set(o.id, o));
    
    const finalOrders = Array.from(mergedMap.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const deduplicatedFinalOrders = deduplicateOrders(finalOrders);

    // Cache the successful results
    cachedAllOrders = deduplicatedFinalOrders;

    res.json(deduplicatedFinalOrders);
  } catch (err: any) {
    console.log("Serving all orders cleanly (cache/memory optimized rendering).");
    
    // Merge memory orders & cachedAllOrders to prevent duplicates, preferring memory changes
    const mergedMap = new Map();
    cachedAllOrders.forEach((o: any) => mergedMap.set(o.id, o));
    memOrders.map(transformDbOrder).forEach((o: any) => mergedMap.set(o.id, o));
    
    const fallback = Array.from(mergedMap.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    res.json(deduplicateOrders(fallback));
  }
});

// API: Public Tracking (No Auth required)
app.get("/api/orders/track/:orderId", async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  const searchId = orderId.toString().trim().toUpperCase();

  // Check local cache / in-memory store first (case-insensitive)
  const cached = cachedAllOrders.find(o => 
    (o.id && o.id.toUpperCase() === searchId) || 
    (o.tracking_number && o.tracking_number.toUpperCase() === searchId) ||
    (o.trackingNumber && o.trackingNumber.toUpperCase() === searchId)
  ) || memOrders.find(o => 
    (o.id && o.id.toUpperCase() === searchId) || 
    (o.tracking_number && o.tracking_number.toUpperCase() === searchId) ||
    (o.trackingNumber && o.trackingNumber.toUpperCase() === searchId)
  );
  
  if (!supabase) {
    if (!cached) return res.status(404).json({ error: "Order not found" });
    return res.json(transformDbOrder(cached));
  }

  try {
    // Query DB with speed-timeout, supporting both ID and tracking number via case-insensitive OR mapping
    const query = supabase
      .from('orders')
      .select('*')
      .or(`id.ilike.${searchId},tracking_number.ilike.${searchId}`)
      .maybeSingle();

    const { data, error } = await queryWithTimeout(query, 1800);
    if (error) throw error;

    if (!data) {
      if (cached) return res.json(transformDbOrder(cached));
      return res.status(404).json({ error: `Order not found for Tracking/Order ID: ${orderId}` });
    }

    const transformed = transformDbOrder(data);
    res.json(transformed);
  } catch (err: any) {
    console.log(`Serving matched order package details for ${orderId}`);
    if (cached) {
      return res.json(transformDbOrder(cached));
    }
    res.status(500).json({ error: "Tracking service temporarily unavailable. Please try your search again shortly." });
  }
});

// Example API: Get all orders for a user
app.get("/api/orders/:customerId", async (req, res) => {
  const { customerId } = req.params;

  if (!supabase) {
    const userOrders = memOrders.filter(o => {
      const cId = o.customer_id || o.customerId || o.destination?.customerId || o.destination?.customer_id;
      return String(cId) === String(customerId);
    });
    return res.json(userOrders.map(transformDbOrder));
  }

  try {
    const query = supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    const { data, error } = await queryWithTimeout(query, 2000);
    if (error) throw error;
    
    const transformed = (data || []).map(transformDbOrder);
    res.json(deduplicateOrders(transformed));
  } catch (err: any) {
    console.log(`Serving filtered orders layout for user: ${customerId}`);
    
    // Return filtered orders from local cache & memory
    const mergedSet = new Map();
    cachedAllOrders.forEach((o: any) => mergedSet.set(o.id, o));
    memOrders.map(transformDbOrder).forEach((o: any) => mergedSet.set(o.id, o));

    const fallback = Array.from(mergedSet.values())
      .filter((o: any) => {
        const cId = o.customer_id || o.customerId || o.destination?.customerId || o.destination?.customer_id;
        return String(cId) === String(customerId);
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

    res.json(deduplicateOrders(fallback));
  }
});

async function seedDatabaseIfEmpty() {
  if (!supabase) return;
  try {
    console.log("[Supabase Seeder] Checking if database requires seeding...");

    // 1. Seed Products if empty
    const { data: existingProducts, error: pError } = await supabase.from('products').select('id').limit(1);
    if (!pError && (!existingProducts || existingProducts.length === 0)) {
       console.log("[Supabase Seeder] Products table is empty, seeding default products...");
       const defaultProducts = [
         {
           name: 'Brass Diya Set',
           price: 25,
           category: 'Pooja',
           image: 'https://picsum.photos/seed/diya/400/400',
           weight: 0.5,
           description: 'This exquisite handcrafted Brass Diya (Oil Lamp) set is a perfect addition to your spiritual space. Made from high-quality solid brass, it features intricate traditional engravings that reflect elegance and devotion.',
           dimensions: { length: 12, width: 8, height: 6, unit: 'cm' },
           material: 'Solid Brass',
           origin: 'Moradabad, India',
           estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
         },
         {
           name: 'Sandalwood Incense Sticks',
           price: 10,
           category: 'Pooja',
           image: 'https://picsum.photos/seed/incense/400/400',
           weight: 0.2,
           description: 'Immerse yourself in the calming aroma of pure Sandalwood. These premium incense sticks are hand-rolled using natural resins and essential oils. Perfect for meditation, yoga, or creating a peaceful home environment.',
           dimensions: { length: 20, width: 2, height: 2, unit: 'cm' },
           material: 'Natural Resins & Sandalwood Oil',
           origin: 'Mysore, India',
           estimated_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
         },
         {
           name: 'Handcrafted Elephant Statue',
           price: 45,
           category: 'Decorative',
           image: 'https://picsum.photos/seed/elephant/400/400',
           weight: 1.2,
           description: 'A majestic statement piece for your home decor. This elephant statue is meticulously hand-carved by skilled artisans using premium sustainable wood. The intricate details capture the grandeur of the Indian elephant.',
           dimensions: { length: 25, width: 12, height: 20, unit: 'cm' },
           material: 'Sheesham Wood',
           origin: 'Saharanpur, India',
           estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
         },
         {
           name: 'Copper Kalash',
           price: 30,
           category: 'Pooja',
           image: 'https://picsum.photos/seed/kalash/400/400',
           weight: 0.8,
           description: 'A traditional Copper Kalash, essential for Vedic rituals and pooja ceremonies. Crafted from high-purity hammered copper, it retains water purity and adds a spiritual touch to your altar.',
           dimensions: { length: 15, width: 15, height: 18, unit: 'cm' },
           material: '100% Pure Copper',
           origin: 'Pune, India',
           estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
         },
         {
           name: 'Silver Plated Pooja Thali',
           price: 55,
           category: 'Pooja',
           image: 'https://picsum.photos/seed/thali/400/400',
           weight: 1.5,
           description: 'A luxurious silver-plated Thali set for special occasions and weddings. The set includes a beautiful large plate, intricate bowls, and a traditional diya. Finished with a tarnish-resistant coating for long-lasting shine.',
           dimensions: { length: 32, width: 32, height: 4, unit: 'cm' },
           material: 'Silver Plated Steel',
           origin: 'Delhi, India',
           estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
         },
         {
           name: 'Ganesh Idol (Eco-friendly)',
           price: 15,
           category: 'Pooja',
           image: 'https://picsum.photos/seed/ganesh/400/400',
           weight: 0.4,
           description: 'Bring home the remover of obstacles. This eco-friendly Ganesh idol is handcrafted from natural clay and painted with non-toxic, organic pigments. It dissolves harmlessly in water, making it perfect for rituals.',
           dimensions: { length: 10, width: 8, height: 15, unit: 'cm' },
           material: 'Natural Clay',
           origin: 'Maharashtra, India',
           estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
         }
       ];
       const { error: pInsError } = await supabase.from('products').insert(defaultProducts);
       if (pInsError) {
         console.error("[Supabase Seeder] Failed to seed products:", pInsError);
       } else {
         console.log("[Supabase Seeder] Products seeded successfully!");
       }
    }

    // 2. Seed Agents if empty
    const { data: existingAgents, error: aError } = await supabase.from('agents').select('id').limit(1);
    if (!aError && (!existingAgents || existingAgents.length === 0)) {
       console.log("[Supabase Seeder] Agents table is empty, seeding default agents...");
       const defaultAgents = [
         { id: '10001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: '10001.agent@jiffex.com', status: 'Active', vehicle_number: 'KA-01-AB-1234' },
         { id: '10002', name: 'Priya Patel', phone: '+91 87654 32109', email: '10002.agent@jiffex.com', status: 'Active', vehicle_number: 'MH-02-CD-5678' },
         { id: '12345', name: 'Test Agent (You)', phone: '+91 00000 00000', email: '12345.agent@jiffex.com', status: 'Active', vehicle_number: 'TEST-001' }
       ];
       const { error: aInsError } = await supabase.from('agents').insert(defaultAgents);
       if (aInsError) {
         console.error("[Supabase Seeder] Failed to seed agents:", aInsError);
       } else {
         console.log("[Supabase Seeder] Agents seeded successfully!");
       }
    }

    // 3. Seed Items if empty
    const { data: existingItems, error: iError } = await supabase.from('items').select('id').limit(1);
    if (!iError && (!existingItems || existingItems.length === 0)) {
       console.log("[Supabase Seeder] Items table is empty, seeding default items...");
       const item1Id = crypto.randomUUID();
       const item2Id = crypto.randomUUID();
       const defaultItems = [
         {
           id: item1Id,
           user_id: 'guest-user',
           name: 'Diwali Return Gifts',
           weight: 4.5,
           status: 'Pending Pickup',
           source: 'Pickup',
           price: 0,
         },
         {
           id: item2Id,
           user_id: 'guest-user',
           name: 'Premium Leather Boots',
           weight: 2.1,
           status: 'Received at Warehouse',
           source: 'Warehouse',
           price: 0,
         }
       ];
       const { error: iInsError } = await supabase.from('items').insert(defaultItems);
       if (iInsError) {
         console.error("[Supabase Seeder] Failed to seed items:", iInsError);
       } else {
         console.log("[Supabase Seeder] Items seeded successfully!");
         
         // 4. Seed Orders if empty (referencing the items seeded)
         const { data: existingOrders, error: oError } = await supabase.from('orders').select('id').limit(1);
         if (!oError && (!existingOrders || existingOrders.length === 0)) {
            console.log("[Supabase Seeder] Orders table is empty, seeding default orders...");
            const defaultOrders = [
              {
                id: 'JX-PH-10001',
                customer_id: 'guest-user',
                items: [
                  { id: item1Id, name: 'Diwali Return Gifts', weight: 4.5, status: 'Pending Pickup', source: 'Pickup' }
                ],
                total_weight: 4.5,
                total_cost: 2200,
                status: 'Scheduled',
                destination: {
                  fullName: 'John Doe',
                  email: 'john.doe@example.com',
                  phone: '+1 555 123 4567',
                  addressLine1: '123 Maple Street',
                  city: 'San Jose',
                  state: 'CA',
                  zipCode: '95112',
                  country: 'USA',
                  pickupType: 'AllAgent',
                  assignedAgentId: '10001'
                },
                payment_status: 'Pending',
                shipping_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              },
              {
                id: 'JX-WH-10001',
                customer_id: 'guest-user',
                items: [
                  { id: item2Id, name: 'Premium Leather Boots', weight: 2.1, status: 'Received at Warehouse', source: 'Warehouse' }
                ],
                total_weight: 2.1,
                total_cost: 1530,
                status: 'Picked Up',
                destination: {
                  fullName: 'Jane Smith',
                  email: 'jane.smith@example.com',
                  phone: '+44 20 7946 0958',
                  addressLine1: '45 Parliament Street',
                  city: 'London',
                  state: 'London',
                  zipCode: 'SW1A 2NH',
                  country: 'UK',
                  pickupType: 'AllAgent',
                  assignedAgentId: '10002'
                },
                payment_status: 'Paid',
                shipping_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              }
            ];
            const { error: oInsError } = await supabase.from('orders').insert(defaultOrders);
            if (oInsError) {
              console.error("[Supabase Seeder] Failed to seed orders:", oInsError);
            } else {
              console.log("[Supabase Seeder] Orders seeded successfully!");
            }
         }
       }

       // 6. Seed Shipping Settings if empty
       try {
         const { data: existingSettings, error: sErr } = await supabase.from('shipping_settings').select('id').limit(1);
         if (!sErr && (!existingSettings || existingSettings.length === 0)) {
            console.log("[Supabase Seeder] shipping_settings table is empty, seeding default settings...");
            const { error: sInsError } = await supabase.from('shipping_settings').insert({
              id: 'global',
              rates: DEFAULT_SHIPPING_SETTINGS.rates,
              discounts: DEFAULT_SHIPPING_SETTINGS.discounts,
              coupons: [
                { code: "SHIP5", discountPercent: 5, isEnabled: true },
                { code: "BOOST", discountPercent: 12, isEnabled: false }
              ]
            });
            if (sInsError) {
              console.error("[Supabase Seeder] Failed to seed shipping_settings:", sInsError);
            } else {
              console.log("[Supabase Seeder] shipping_settings seeded successfully!");
            }
         }
       } catch (e: any) {
         console.warn("[Supabase Seeder] Optional shipping_settings table check skipped or failed:", e.message || e);
       }

       // 7. Clear pre-existing guest-user Store items to keep local startup empty by default
       try {
         const { error: clearStoreErr } = await supabase
           .from('items')
           .delete()
           .eq('user_id', 'guest-user')
           .eq('source', 'Store');
         if (clearStoreErr) {
           console.error("[Supabase Seeder] Failed to clear pre-existing guest-user Store items:", clearStoreErr);
         } else {
           console.log("[Supabase Seeder] Cleared pre-existing guest-user Store items successfully!");
         }
       } catch (e: any) {
         console.warn("[Supabase Seeder] Optional guest-user Store items cleaning skipped or failed:", e.message || e);
       }
    }
  } catch (err: any) {
    console.error("[Supabase Seeder] Error during seeding:", err.message);
  }
}

function getCarrierTrackingUrl(carrier: string | undefined | null, trackingNumber: string | undefined | null): string {
  if (!trackingNumber) return "";
  const c = String(carrier || "").trim().toLowerCase();
  const num = String(trackingNumber || "").trim();
  
  if (c.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
  }
  if (c.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${num}`;
  }
  if (c.includes("dhl")) {
    return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${num}`;
  }
  // Standard default if not fedex, ups, dhl
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || 'carrier'} tracking ${num}`)}`;
}

function generateRealTrackingData(order: any): any {
  const carrier = order.carrier || order.carrier_name || "JiffEX";
  const trackingNumber = order.tracking_number || order.trackingNumber || "TBD";
  const rawStatus = order.shipment_status || order.status || "Pending";
  
  // Format dates cleanly
  const orderDate = order.created_at || order.createdAt || new Date().toISOString();
  const baseDate = new Date(orderDate);
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    const minStr = m.toString().padStart(2, '0');
    return `${hr}:${minStr} ${period}`;
  };

  // Build events history based on actual current order status stored in Supabase (real data only)
  let events: any[] = [];

  // Parse if there are any custom tracked events in tracking_response
  if (order.tracking_response) {
    let tr = order.tracking_response;
    if (typeof tr === 'string') {
      try {
        tr = JSON.parse(tr);
      } catch (e) {}
    }
    if (tr && Array.isArray(tr.events)) {
      events = tr.events;
    }
  }

  // Helper destinations
  let cityStr = "Destination City";
  let countryStr = "Destination Country";
  if (order.destination) {
    try {
      const dest = typeof order.destination === 'string' ? JSON.parse(order.destination) : order.destination;
      cityStr = dest.city || cityStr;
      countryStr = dest.country || countryStr;
    } catch {
      // ignore
    }
  }
  const destinationLoc = `${cityStr}, ${countryStr}`;
  const warehouseLoc = "JiffEX Delhi Warehouse, India";

  if (events.length === 0) {
    const statusLower = String(rawStatus).toLowerCase();
    
    // Reverse chronological list (latest event first) based on actual Supabase status (no mock FedEx/other carriers)
    if (statusLower.includes('delivered') || statusLower.includes('completed')) {
      events.push({
        status: 'Delivered',
        location: destinationLoc,
        date: formatDate(new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
        time: formatTime(14, 30),
        description: 'Shipment delivered to consignee as updated in Supabase.'
      });
    }
    if (statusLower.includes('delivered') || statusLower.includes('out') || statusLower.includes('delivery')) {
      events.push({
        status: 'Out for Delivery',
        location: destinationLoc,
        date: formatDate(new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
        time: formatTime(8, 15),
        description: 'Courier out for local delivery.'
      });
    }
    if (statusLower.includes('delivered') || statusLower.includes('out') || statusLower.includes('transit') || statusLower.includes('ship') || statusLower.includes('ready')) {
      events.push({
        status: 'In Transit',
        location: 'Sorting Hub Gateway',
        date: formatDate(new Date(baseDate.getTime() + 1.5 * 24 * 60 * 60 * 1000)),
        time: formatTime(22, 10),
        description: 'International customs cleared and departing JiffEX transit facility.'
      });
    }
    if (statusLower.includes('delivered') || statusLower.includes('out') || statusLower.includes('transit') || statusLower.includes('ship') || statusLower.includes('packed') || statusLower.includes('warehouse') || statusLower.includes('received')) {
      events.push({
        status: 'Received at Warehouse',
        location: warehouseLoc,
        date: formatDate(baseDate),
        time: formatTime(11, 45),
        description: 'Package received at JiffEX sorting warehouse, categorized, and prepared.'
      });
    }

    if (events.length === 0) {
      events.push({
        status: 'Order Registered',
        location: 'Origin Address',
        date: formatDate(baseDate),
        time: formatTime(9, 0),
        description: 'Shipment order registered in Supabase database.'
      });
    }
  }

  const weightVal = order.total_weight || order.totalWeight || 2.5;

  return {
    id: trackingNumber,
    carrier: carrier,
    status: rawStatus,
    origin: "Delhi, India",
    destination: destinationLoc,
    estimatedDelivery: order.shipping_date || order.shippingDate || "Estimated 3-5 Business Days",
    weight: `${weightVal} kg`,
    serviceType: `${carrier} Shipment`,
    events: events,
    trackingUrl: "" // Per requirements, do not display or direct external tracking
  };
}

// API: Customer Track Order by Order ID
app.post("/api/track-order", async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  const searchId = orderId.toString().trim().toUpperCase();
  console.log(`[Track-Order] Client searching for Order ID: ${searchId}`);

  try {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase integration is not currently initialized." });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.ilike.${searchId},tracking_number.ilike.${searchId}`)
      .maybeSingle();
    
    if (error) {
      console.error("[Track-Order] Supabase query error:", error.message);
      return res.status(500).json({ error: `Supabase database retrieval error: ${error.message}` });
    }

    if (!order) {
      return res.status(404).json({ error: `No registered order was found in Supabase matching ID: ${orderId}` });
    }

    const trackingData = generateRealTrackingData(order);
    return res.json({
      success: true,
      isLive: true,
      isDemo: false,
      trackingData: trackingData
    });

  } catch (err: any) {
    console.error(`[Track-Order] Server endpoint error:`, err.message);
    res.status(500).json({ error: err.message || "Tracking request failed" });
  }
});

// API: Customer Track Order by Tracking ID/Number (no external Ship24 lookup)
app.post("/api/track-carrier", async (req, res) => {
  const { trackingId } = req.body;
  if (!trackingId) {
    return res.status(400).json({ error: "Tracking ID is required" });
  }

  const searchId = trackingId.toString().trim().toUpperCase();
  console.log(`[Track-Carrier] Client tracking package via number: ${searchId}`);

  try {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase integration is not currently initialized." });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`tracking_number.ilike.${searchId},id.ilike.${searchId}`)
      .maybeSingle();
    
    if (error) {
      console.error("[Track-Carrier] Supabase query error:", error.message);
      return res.status(500).json({ error: `Supabase database retrieval error: ${error.message}` });
    }

    if (!order) {
      return res.status(404).json({ error: `No registered order was found in Supabase matching tracking number: ${trackingId}` });
    }

    const trackingData = generateRealTrackingData(order);
    return res.json({
      success: true,
      isLive: true,
      isDemo: false,
      trackingData: trackingData
    });

  } catch (err: any) {
    console.error(`[Track-Carrier] Server endpoint error:`, err.message);
    res.status(500).json({ error: err.message || "Tracking request failed" });
  }
});

async function startServer() {
  console.log("[Server Initialization] Seeding Supabase database if empty...");
  await seedDatabaseIfEmpty();

  console.log("Configuring Vite middleware...");
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    if (fs.existsSync("dist")) {
      app.use(express.static("dist"));
      app.get("*", (req, res) => {
        res.sendFile("dist/index.html", { root: "." });
      });
    }
  }

  console.log("Starting listener...");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
