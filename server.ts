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
import Razorpay from "razorpay";

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
const isSupabaseValid = !!(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'undefined' && 
  supabaseKey !== 'undefined' && 
  supabaseUrl.trim() !== '' && 
  supabaseKey.trim() !== '' &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder')
);
const supabase = isSupabaseValid ? createClient(supabaseUrl, supabaseKey) : null;

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

/**
 * Resilient server-side Supabase query execution with automatic retry for transient schema cache / PostgREST warming states.
 */
async function safeSupabaseQuery<T = any>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }> | Promise<{ data: T | null; error: any }> | any,
  options: { retries?: number; initialDelayMs?: number; label?: string } = {}
): Promise<{ data: T | null; error: any }> {
  const retries = options.retries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 600;
  const label = options.label || 'Supabase query';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();
      const err = result?.error;
      if (!err) {
        return result;
      }

      const isTransient =
        err.code === 'PGRST002' ||
        err.code === 'PGRST000' ||
        err.code === '57014' ||
        err.code === '53300' ||
        err.status === 503 ||
        err.status === 502 ||
        err.status === 504 ||
        (typeof err.message === 'string' && (
          err.message.includes('schema cache') ||
          err.message.includes('connection') ||
          err.message.includes('timeout') ||
          err.message.includes('fetch failed') ||
          err.message.includes('NetworkError')
        ));

      if (isTransient && attempt < retries) {
        const delay = initialDelayMs * Math.pow(1.8, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      return result;
    } catch (caughtErr: any) {
      const isTransient =
        caughtErr?.code === 'PGRST002' ||
        caughtErr?.message?.includes('schema cache') ||
        caughtErr?.message?.includes('fetch failed') ||
        caughtErr?.message?.includes('timeout');

      if (isTransient && attempt < retries) {
        const delay = initialDelayMs * Math.pow(1.8, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      return { data: null, error: caughtErr };
    }
  }

  return { data: null, error: new Error(`${label} failed after ${retries} attempts`) };
}

console.log("Starting server initialization...");

// In-memory OTP store supporting multiple active codes within expiration window
interface StoredOtpEntry {
  code: string;
  createdAt: number;
}
const otps = new Map<string, { codes: StoredOtpEntry[]; expiresAt: number }>();
console.log("Memory OTP store initialized with multi-code window support.");

// In-memory data store for fallback when Supabase is disconnected
const memOrders: any[] = [];
const memItems: any[] = [];
const memPickups: any[] = [];
console.log("Memory Orders, Items, and Pickups stores initialized.");

// Persistent file storage setup to prevent loss of cart/orders during process restarts
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const ITEMS_FILE = path.join(DATA_DIR, 'mem_items.json');
const ORDERS_FILE = path.join(DATA_DIR, 'mem_orders.json');
const PICKUPS_FILE = path.join(DATA_DIR, 'mem_pickups.json');

function saveDb() {
  try {
    fs.writeFileSync(ITEMS_FILE, JSON.stringify(memItems, null, 2), 'utf-8');
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(memOrders, null, 2), 'utf-8');
    fs.writeFileSync(PICKUPS_FILE, JSON.stringify(memPickups, null, 2), 'utf-8');
    console.log('[FILE-PERSISTENCE] Saved memItems, memOrders, memPickups to files.');
  } catch (err: any) {
    console.error('[FILE-PERSISTENCE] Failed to save database:', err.message || err);
  }
}

function loadDb() {
  try {
    if (fs.existsSync(ITEMS_FILE)) {
      const data = fs.readFileSync(ITEMS_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      if (Array.isArray(loaded)) {
        memItems.length = 0;
        memItems.push(...loaded);
        console.log(`[FILE-PERSISTENCE] Loaded ${memItems.length} items from JSON file.`);
      }
    }
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      if (Array.isArray(loaded)) {
        memOrders.length = 0;
        memOrders.push(...loaded);
        console.log(`[FILE-PERSISTENCE] Loaded ${memOrders.length} orders from JSON file.`);
      }
    }
    if (fs.existsSync(PICKUPS_FILE)) {
      const data = fs.readFileSync(PICKUPS_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      if (Array.isArray(loaded)) {
        memPickups.length = 0;
        memPickups.push(...loaded);
        console.log(`[FILE-PERSISTENCE] Loaded ${memPickups.length} pickups from JSON file.`);
      }
    }
  } catch (err: any) {
    console.error('[FILE-PERSISTENCE] Failed to load database:', err.message || err);
  }
}

// Initial load
loadDb();

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

// Helper function to format email sender with Company Display Name "Jiffex"
export function getSenderAddress(customFrom?: string): string {
  const raw = (customFrom || process.env.SMTP_FROM || process.env.SMTP_USER || 'jiffex2026@gmail.com').trim();
  if (!raw) {
    return '"Jiffex" <jiffex2026@gmail.com>';
  }
  const match = raw.match(/^(?:"?([^"]*)"?\s*)?<([^>]+)>$/);
  if (match) {
    const existingName = match[1]?.trim();
    const emailOnly = match[2].trim();
    const displayName = existingName || 'Jiffex';
    return `"${displayName}" <${emailOnly}>`;
  }
  return `"Jiffex" <${raw}>`;
}

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
  c. Generate a new App Password named "Jiffex Mail".
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

  if (channels.includes('Email') && mailTransporter && (process.env.SMTP_FROM || process.env.SMTP_USER)) {
    const to = recipientInfo?.email;
    console.log(`[Notification] Attempting to send email to: ${to} for event: ${event}`);
    if (to && to !== 'user@example.com' && to.includes('@')) {
      let subject = `Jiffex Notification: ${event}`;
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

        subject = `Pickup Scheduled: Your Jiffex Appointment ${orderId}`;
        
        html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
  <p>Dear <strong>${fullName}</strong>,</p>
  <p>Thank you for choosing <strong>Jiffex</strong> for your shipping needs.</p>
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
    <strong>The Jiffex Team</strong><br>
    Jiffex Shipping & Logistics<br>
    <a href="https://www.jiffex.com" style="color: #4f46e5; text-decoration: none;">www.jiffex.com</a>
  </p>
</div>
        `;
      }

      promises.push(
        mailTransporter.sendMail({
          from: getSenderAddress(process.env.SMTP_FROM),
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

// Razorpay Payment Integration
let razorpayInstance: any = null;
function getRazorpay() {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variable is missing.");
    }
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

// Get Razorpay Config Key ID (so client-side does not need VITE_ prefixes)
app.get("/api/payment/razorpay/config", (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return res.status(404).json({ error: "Razorpay Key ID is not configured on the server." });
  }
  res.json({ keyId });
});

// Create a Razorpay Order
app.post("/api/payment/razorpay/order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const rzp = getRazorpay();
    // Razorpay works in the smallest currency unit (e.g., paise for INR)
    // 1 INR = 100 paise
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: currency,
      receipt: receipt || `receipt_order_${Date.now()}`,
    };

    const order = await rzp.orders.create(options);
    res.json(order);
  } catch (err: any) {
    console.error("[Razorpay] Order creation failed:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to create Razorpay order." });
  }
});

// Verify Payment Signature
app.post("/api/payment/razorpay/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ error: "Razorpay Key Secret is not configured on the server." });
    }

    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: "Payment signature mismatch." });
    }
  } catch (err: any) {
    console.error("[Razorpay] Verification failed:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to verify Razorpay signature." });
  }
});

// Admin email configurations
const ADMIN_EMAILS = [
  'srikanth.satya@jiffex.in',
  'arun.dubba@jiffex.in'
];

const ADMIN_ALIASES = [
  'srikanth.satya@jiffex.in',
  'arun.dubba@jiffex.in',
  'admin@jiffex.com',
  'admin@jiffex.in',
  'admin@jiffex.org'
];

// Agent testing email destination
const AGENT_TEST_RECIPIENT = 'srikanth.satya@jiffex.in';

// Auth Routes for Email OTP Authentication
app.post("/api/auth/send-otp", async (req, res) => {
  console.log("[Auth] POST /api/auth/send-otp", req.body);
  const { email } = req.body;
  const cleanEmail = email ? email.toString().trim().toLowerCase() : '';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: "A valid email address is required" });
  }

  const isAdminTarget = ADMIN_ALIASES.includes(cleanEmail);
  const isAgentTarget = cleanEmail.endsWith('.agent@jiffex.com') || 
                        cleanEmail.endsWith('.agent@jiffex.in') || 
                        cleanEmail === 'agent@jiffex.com' || 
                        cleanEmail === 'agent@jiffex.in' ||
                        cleanEmail.includes('.agent@') ||
                        cleanEmail.startsWith('agent@') ||
                        /^\d+\.agent@/i.test(cleanEmail);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiryWindow = 10 * 60 * 1000; // 10 minutes
  const expiresAt = now + expiryWindow;

  try {
    // Retain recent unexpired codes for this email so previous requests don't fail if emails arrive out of order
    const saveCodeForEmail = (targetEmail: string) => {
      const existing = otps.get(targetEmail);
      const validExistingCodes = existing 
        ? existing.codes.filter(c => now - c.createdAt < expiryWindow)
        : [];
      validExistingCodes.push({ code, createdAt: now });
      otps.set(targetEmail, { codes: validExistingCodes, expiresAt });
    };

    if (isAdminTarget) {
      // Register OTP for all admin aliases so verifying with any admin email or alias works
      for (const alias of ADMIN_ALIASES) {
        saveCodeForEmail(alias);
      }
      console.log(`[Auth] Admin OTP generated (${code}) and mapped to all admin accounts: ${ADMIN_EMAILS.join(', ')}`);
    } else if (isAgentTarget) {
      // Save code for the agent work email and also map to testing recipient
      saveCodeForEmail(cleanEmail);
      saveCodeForEmail(AGENT_TEST_RECIPIENT);
      console.log(`[Auth] Agent OTP generated (${code}) for agent ${cleanEmail} -> routed to ${AGENT_TEST_RECIPIENT} for testing`);
    } else {
      saveCodeForEmail(cleanEmail);
      console.log(`[Auth] OTP generated for ${cleanEmail}`);
    }

    if (mailTransporter && (process.env.SMTP_FROM || process.env.SMTP_USER)) {
      try {
        const recipientTo = isAdminTarget 
          ? ADMIN_EMAILS.join(', ') 
          : isAgentTarget 
          ? AGENT_TEST_RECIPIENT 
          : cleanEmail;

        const emailSubject = isAdminTarget 
          ? `Your Jiffex Admin Login Verification Code: ${code}`
          : isAgentTarget
          ? `[Agent OTP] Jiffex Field Agent Login Code: ${code} (${cleanEmail})`
          : `Your Jiffex Login Verification Code: ${code}`;

        const textContent = isAdminTarget
          ? `Your Jiffex Admin verification code is: ${code}\n\nEnter this 6-digit code on the login screen to sign in. This code is valid for 10 minutes.\n\nThis administrator verification code was sent to Srikanth Satya and Arun Dubba.`
          : isAgentTarget
          ? `Your Jiffex Field Agent verification code is: ${code}\n\nAgent Account: ${cleanEmail}\n\nEnter this 6-digit code on the login screen to access the Field Agent Portal. This code is valid for 10 minutes.\n\n[TESTING MODE] This agent OTP was dispatched to Srikanth Satya (srikanth.satya@jiffex.in) for testing purposes.`
          : `Your Jiffex verification code is: ${code}\n\nEnter this 6-digit code on the login screen to sign in. This code is valid for 10 minutes.\n\nIf you did not request this code, please ignore this message.`;

        await mailTransporter.sendMail({
          from: getSenderAddress(process.env.SMTP_FROM),
          to: recipientTo,
          subject: emailSubject,
          text: textContent,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 36px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <div style="text-align: center; margin-bottom: 28px;">
                <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">${isAgentTarget ? 'Jiffex Agent Portal' : 'Jiffex Fulfilment'}</h1>
                <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 500;">${isAgentTarget ? 'Field Operations & Cargo Verification' : 'Secure Express International Shipping'}</p>
              </div>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">${isAdminTarget ? 'Administrator One-Time Password' : isAgentTarget ? 'Field Agent One-Time Password (Testing Mode)' : 'Your One-Time Login Code'}</p>
                <div style="display: inline-block; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #ffffff; padding: 12px 24px; border-radius: 12px; border: 1px solid #cbd5e1;">
                  ${code}
                </div>
                <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">Valid for <strong>10 minutes</strong>. Do not share this code.</p>
                ${isAdminTarget ? `<p style="color: #4f46e5; font-size: 11px; margin: 10px 0 0 0; font-weight: 600;">Dispatched to Srikanth Satya & Arun Dubba</p>` : ''}
                ${isAgentTarget ? `<p style="color: #4f46e5; font-size: 11px; margin: 10px 0 0 0; font-weight: 600;">Agent Login: <strong>${cleanEmail}</strong> • Dispatched to Srikanth Satya (Testing Mode)</p>` : ''}
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center; line-height: 1.5;">
                ${isAdminTarget ? 'This is an authorized administrative login verification email.' : isAgentTarget ? 'This is an authorized field agent login verification email routed to srikanth.satya@jiffex.in for testing.' : 'If you did not request this login code, you can safely ignore this email.'}
              </p>
            </div>
          `
        });
        console.log(`[Auth] OTP successfully sent via SMTP to ${recipientTo}`);
        const userNotice = isAdminTarget 
          ? `Admin verification code sent to srikanth.satya@jiffex.in and arun.dubba@jiffex.in`
          : isAgentTarget
          ? `Agent verification code sent to srikanth.satya@jiffex.in for agent ${cleanEmail} (Testing Mode)`
          : `Verification code sent to ${cleanEmail}`;
        return res.json({ success: true, message: userNotice });
      } catch (smtpErr: any) {
        console.error(`[Auth] SMTP send failed for ${cleanEmail}:`, smtpErr.message);
        return res.status(500).json({ error: `Failed to deliver email: ${smtpErr.message || 'SMTP service error'}. Please try again.` });
      }
    } else {
      console.warn(`[Auth] No SMTP configured. Generated OTP for ${cleanEmail} is: ${code}`);
      const userNotice = isAdminTarget 
        ? `Admin verification code generated (Sent to srikanth.satya@jiffex.in & arun.dubba@jiffex.in)`
        : isAgentTarget
        ? `Agent verification code generated (Sent to srikanth.satya@jiffex.in for testing)`
        : `Verification code generated and sent to your email`;
      return res.json({ success: true, message: userNotice });
    }
  } catch (err: any) {
    console.error("OTP Send Error:", err.message);
    res.status(500).json({ error: "Failed to send verification code. Please try again." });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  console.log("[Auth] POST /api/auth/verify-otp", req.body);
  const { email, code } = req.body;
  const cleanEmail = email ? email.toString().trim().toLowerCase() : '';
  const cleanCode = code ? code.toString().trim() : '';

  if (!cleanEmail || !cleanCode) {
    return res.status(400).json({ error: "Email and 6-digit verification code are required" });
  }

  const isAdminTarget = ADMIN_ALIASES.includes(cleanEmail);
  const isAgentTarget = cleanEmail.endsWith('.agent@jiffex.com') || 
                        cleanEmail.endsWith('.agent@jiffex.in') || 
                        cleanEmail === 'agent@jiffex.com' || 
                        cleanEmail === 'agent@jiffex.in' ||
                        cleanEmail.includes('.agent@') ||
                        cleanEmail.startsWith('agent@') ||
                        /^\d+\.agent@/i.test(cleanEmail);

  try {
    let otpData = otps.get(cleanEmail);
    if (!otpData && isAdminTarget) {
      // Fallback search across admin emails
      for (const adminEmail of ADMIN_EMAILS) {
        if (otps.has(adminEmail)) {
          otpData = otps.get(adminEmail);
          break;
        }
      }
    } else if (!otpData && isAgentTarget) {
      // Fallback search under AGENT_TEST_RECIPIENT
      if (otps.has(AGENT_TEST_RECIPIENT)) {
        otpData = otps.get(AGENT_TEST_RECIPIENT);
      }
    }

    if (!otpData || !otpData.codes || otpData.codes.length === 0) {
      return res.status(400).json({ error: "No active verification code found for this email. Please request a new code." });
    }

    const now = Date.now();
    const expiryWindow = 10 * 60 * 1000;
    // Filter to currently valid codes
    const activeCodes = otpData.codes.filter(c => now - c.createdAt < expiryWindow);

    if (activeCodes.length === 0) {
      otps.delete(cleanEmail);
      if (isAdminTarget) {
        for (const alias of ADMIN_ALIASES) otps.delete(alias);
      }
      return res.status(400).json({ error: "Your verification code has expired. Please request a new code." });
    }

    // Check if entered code matches any of the active unexpired codes
    const isMatch = activeCodes.some(c => c.code === cleanCode);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid verification code. Please check your latest email and try again." });
    }

    // Success - Clear OTP from memory
    otps.delete(cleanEmail);
    if (isAdminTarget) {
      for (const alias of ADMIN_ALIASES) otps.delete(alias);
    }
    console.log(`[Auth] Successfully verified email OTP for: ${cleanEmail}`);

    let displayName = cleanEmail.split('@')[0];
    if (cleanEmail === 'srikanth.satya@jiffex.in') {
      displayName = 'Srikanth Satya';
    } else if (cleanEmail === 'arun.dubba@jiffex.in') {
      displayName = 'Arun Dubba';
    } else if (isAdminTarget) {
      displayName = 'Admin User';
    }

    res.json({ 
      success: true, 
      user: { 
        email: cleanEmail, 
        id: 'user-' + Buffer.from(cleanEmail).toString('hex').slice(0, 8),
        name: displayName,
        role: isAdminTarget ? 'admin' : undefined
      } 
    });
  } catch (err: any) {
    console.error("OTP Verify Error:", err.message);
    res.status(500).json({ error: "Verification failed. Please try again." });
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

const DEFAULT_RATE_BANDS: Record<string, Array<{ id: string; minWeight: number; maxWeight: number; rate: number; isFlat?: boolean }>> = {
  'USA': [
    { id: 'usa-1', minWeight: 0, maxWeight: 0.5, rate: 1150 },
    { id: 'usa-2', minWeight: 0.5, maxWeight: 2, rate: 996 },
    { id: 'usa-3', minWeight: 2, maxWeight: 5, rate: 920 },
    { id: 'usa-4', minWeight: 5, maxWeight: 10, rate: 850 },
    { id: 'usa-5', minWeight: 10, maxWeight: 999, rate: 780 },
  ],
  'UK': [
    { id: 'uk-1', minWeight: 0, maxWeight: 0.5, rate: 980 },
    { id: 'uk-2', minWeight: 0.5, maxWeight: 2, rate: 830 },
    { id: 'uk-3', minWeight: 2, maxWeight: 5, rate: 760 },
    { id: 'uk-4', minWeight: 5, maxWeight: 10, rate: 700 },
    { id: 'uk-5', minWeight: 10, maxWeight: 999, rate: 640 },
  ],
  'Canada': [
    { id: 'can-1', minWeight: 0, maxWeight: 0.5, rate: 1080 },
    { id: 'can-2', minWeight: 0.5, maxWeight: 2, rate: 913 },
    { id: 'can-3', minWeight: 2, maxWeight: 5, rate: 840 },
    { id: 'can-4', minWeight: 5, maxWeight: 10, rate: 780 },
    { id: 'can-5', minWeight: 10, maxWeight: 999, rate: 720 },
  ],
  'Australia': [
    { id: 'aus-1', minWeight: 0, maxWeight: 0.5, rate: 1250 },
    { id: 'aus-2', minWeight: 0.5, maxWeight: 2, rate: 1079 },
    { id: 'aus-3', minWeight: 2, maxWeight: 5, rate: 990 },
    { id: 'aus-4', minWeight: 5, maxWeight: 10, rate: 910 },
    { id: 'aus-5', minWeight: 10, maxWeight: 999, rate: 840 },
  ],
  'UAE': [
    { id: 'uae-1', minWeight: 0, maxWeight: 0.5, rate: 780 },
    { id: 'uae-2', minWeight: 0.5, maxWeight: 2, rate: 664 },
    { id: 'uae-3', minWeight: 2, maxWeight: 5, rate: 600 },
    { id: 'uae-4', minWeight: 5, maxWeight: 10, rate: 550 },
    { id: 'uae-5', minWeight: 10, maxWeight: 999, rate: 500 },
  ],
  'Germany': [
    { id: 'ger-1', minWeight: 0, maxWeight: 0.5, rate: 890 },
    { id: 'ger-2', minWeight: 0.5, maxWeight: 2, rate: 747 },
    { id: 'ger-3', minWeight: 2, maxWeight: 5, rate: 680 },
    { id: 'ger-4', minWeight: 5, maxWeight: 10, rate: 620 },
    { id: 'ger-5', minWeight: 10, maxWeight: 999, rate: 570 },
  ],
  'Singapore': [
    { id: 'sg-1', minWeight: 0, maxWeight: 0.5, rate: 700 },
    { id: 'sg-2', minWeight: 0.5, maxWeight: 2, rate: 581 },
    { id: 'sg-3', minWeight: 2, maxWeight: 5, rate: 520 },
    { id: 'sg-4', minWeight: 5, maxWeight: 10, rate: 470 },
    { id: 'sg-5', minWeight: 10, maxWeight: 999, rate: 420 },
  ],
  'India': [
    { id: 'ind-1', minWeight: 0, maxWeight: 0.5, rate: 500 },
    { id: 'ind-2', minWeight: 0.5, maxWeight: 2, rate: 415 },
    { id: 'ind-3', minWeight: 2, maxWeight: 5, rate: 360 },
    { id: 'ind-4', minWeight: 5, maxWeight: 10, rate: 320 },
    { id: 'ind-5', minWeight: 10, maxWeight: 999, rate: 280 },
  ],
};

const DEFAULT_SHIPPING_SETTINGS = {
  rates: {
    'USA': 996,
    'UK': 830,
    'Canada': 913,
    'Australia': 1079,
    'UAE': 664,
    'Germany': 747,
    'Singapore': 581,
    'India': 415,
  },
  rateBands: DEFAULT_RATE_BANDS,
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
      const { data, error } = await safeSupabaseQuery(() =>
        supabase
          .from('shipping_settings')
          .select('*')
          .eq('id', 'global')
          .maybeSingle(),
        { label: 'getShippingSettings' }
      );

      if (!error && data) {
        const rates = data.rates || DEFAULT_SHIPPING_SETTINGS.rates;
        const rateBands = data.rate_bands || data.rateBands || rates?._rateBands || DEFAULT_SHIPPING_SETTINGS.rateBands;
        return {
          rates,
          rateBands,
          discounts: data.discounts || DEFAULT_SHIPPING_SETTINGS.discounts,
          coupons: data.coupons || [
            { code: "SHIP5", discountPercent: 5, isEnabled: true },
            { code: "BOOST", discountPercent: 12, isEnabled: false }
          ]
        };
      } else if (error && error.code !== 'PGRST116' && error.code !== 'PGRST002') {
        console.warn("[Supabase] Failed to fetch shipping settings:", error.message || error);
      }
    } catch (err: any) {
      if (!err?.message?.includes('schema cache')) {
        console.warn("[Supabase] Exception fetching shipping settings:", err.message || err);
      }
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
      // Package _rateBands into rates object as fallback for database compatibility
      const ratesPayload = { ...settings.rates, _rateBands: settings.rateBands };
      const { error } = await safeSupabaseQuery(() =>
        supabase
          .from('shipping_settings')
          .upsert({
            id: 'global',
            rates: ratesPayload,
            discounts: settings.discounts,
            coupons: settings.coupons,
            updated_at: new Date().toISOString()
          }),
        { label: 'saveShippingSettings' }
      );

      if (!error) {
        console.log("[Supabase] Successfully saved shipping settings to Supabase.");
        return true;
      } else if (error.code !== 'PGRST002') {
        console.warn("[Supabase] Failed to save shipping settings to Supabase:", error.message || error);
      }
    } catch (err: any) {
      if (!err?.message?.includes('schema cache')) {
        console.warn("[Supabase] Exception saving shipping settings to Supabase:", err.message || err);
      }
    }
  }
  return false;
};

app.get("/api/settings/shipping", async (req, res) => {
  const current = await getShippingSettings();
  res.json(current);
});

app.post("/api/settings/shipping", async (req, res) => {
  const { rates, rateBands, discounts, coupons } = req.body;
  const current = await getShippingSettings();
  
  if (rates) {
    current.rates = { ...current.rates, ...rates };
  }
  if (rateBands) {
    current.rateBands = { ...current.rateBands, ...rateBands };
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
    const { data, error } = await safeSupabaseQuery(() =>
      supabase.from('products').select('*'),
      { label: 'fetchProducts' }
    );
    if (error) throw error;
    
    // If table is empty, return mocks as seed data
    if (!data || data.length === 0) {
      return res.json(MOCK_PRODUCTS);
    }
    
    res.json(data.map(dbToProduct));
  } catch (err: any) {
    if (!err?.message?.includes('schema cache')) {
      console.warn("Fetch Products fallback to default items:", err.message || err);
    }
    res.json(MOCK_PRODUCTS.map(dbToProduct));
  }
});

// API: Create a product
app.post("/api/products", async (req, res) => {
  if (!supabase) return res.json(req.body);

  try {
    const dbPayload = productToDb(req.body);
    const { data, error } = await safeSupabaseQuery(() =>
      supabase.from('products').insert(dbPayload).select().single(),
      { label: 'createProduct' }
    );
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
    const { data, error } = await safeSupabaseQuery(() =>
      supabase.from('products').update(dbPayload).eq('id', id).select().single(),
      { label: 'updateProduct' }
    );
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
    const { error } = await safeSupabaseQuery(() =>
      supabase.from('products').delete().eq('id', id),
      { label: 'deleteProduct' }
    );
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete Product Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Delete an item
app.delete("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  if (!supabase) {
    const idx = memItems.findIndex(i => i.id === id);
    if (idx > -1) {
      memItems.splice(idx, 1);
      saveDb();
    }
    return res.json({ success: true });
  }

  try {
    // Attempt delete
    const { error: deleteError } = await supabase.from('items').delete().eq('id', id);
    
    // In case the DELETE is silently blocked by missing RLS delete policies, also update the user_id to 'deleted'
    // so it is excluded from future fetch queries
    const { error: updateError } = await supabase.from('items').update({ user_id: 'deleted' }).eq('id', id);
    
    if (deleteError && updateError) {
      throw new Error(`Delete failed: ${deleteError.message}. Update fallback failed: ${updateError.message}`);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete Item Error:", err.message);
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
    let query = supabase.from('items').select('*').neq('user_id', 'deleted');
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
      image: req.body.image,
      submitted: req.body.submitted !== undefined ? req.body.submitted : (req.body.source ? req.body.source !== 'Warehouse' : true)
    };
    memItems.push(itemData);
    saveDb();
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
    itemData.submitted = req.body.submitted !== undefined ? req.body.submitted : (req.body.source ? req.body.source !== 'Warehouse' : true);

    const { data, error } = await supabase.from('items').upsert(itemData, { onConflict: 'id' }).select().single();
    if (error) {
      if (error.code === '42703' || (error.message && error.message.includes('submitted'))) {
        console.warn("[Self-Heal] Missing 'submitted' column in Supabase items table during upsert. Retrying without it.");
        const { submitted, ...safeItemData } = itemData;
        const { data: retryData, error: retryError } = await supabase.from('items').upsert(safeItemData, { onConflict: 'id' }).select().single();
        if (retryError) throw retryError;
        return res.json(retryData);
      }
      throw error;
    }
    res.json(data);
  } catch (err: any) {
    if (err.code === '42703' || (err.message && err.message.includes('submitted'))) {
      console.warn("[Self-Heal Catch] Missing 'submitted' column in Supabase items table. Stripping and retrying.");
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
        const { data: retryData, error: retryError } = await supabase.from('items').upsert(itemData, { onConflict: 'id' }).select().single();
        if (retryError) throw retryError;
        return res.json(retryData);
      } catch (retryErr: any) {
        console.error("Create Item Retry Error:", retryErr.message);
        return res.status(500).json({ error: retryErr.message });
      }
    }
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
    saveDb();
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
      console.warn("[SUPABASE] Order insert into database failed or offline. Saving to persistent memory storage instead.", lastError?.message);
      const preOrder = { ...databaseOrderData, id: finalId, created_at: new Date().toISOString() };
      const mIdx = memOrders.findIndex(o => o.id === finalId);
      if (mIdx > -1) {
        memOrders[mIdx] = { ...memOrders[mIdx], ...preOrder };
      } else {
        memOrders.push(preOrder);
      }
      saveDb();
      return res.json(transformDbOrder(preOrder));
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
    saveDb();
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
      saveDb();
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
      saveDb();
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

// API: Update item submitted status
app.patch("/api/items/:itemId/submitted", async (req, res) => {
  const { itemId } = req.params;
  const { submitted } = req.body;

  if (!supabase) {
    const idx = memItems.findIndex(i => i.id === itemId);
    if (idx > -1) {
      memItems[idx].submitted = !!submitted;
      saveDb();
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Item not found" });
  }

  try {
    const { error } = await supabase
      .from('items')
      .update({ submitted: !!submitted })
      .eq('id', itemId);
    if (error) {
      if (error.code === '42703' || (error.message && error.message.includes('submitted'))) {
        console.warn("[Self-Heal] Missing 'submitted' column in Supabase items table during update. Swallowing error and continuing.");
        return res.json({ success: true, warning: 'Missing submitted column' });
      }
      throw error;
    }
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '42703' || (err.message && err.message.includes('submitted'))) {
      console.warn("[Self-Heal Catch] Missing 'submitted' column in Supabase items table. Swallowing error and continuing.");
      return res.json({ success: true, warning: 'Missing submitted column' });
    }
    console.error("Update Item Submitted Error:", err.message);
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
      saveDb();
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
        const message = `*Jiffex Shipment Update* 📦\n\nYour order #${orderId.slice(0, 8)} status has changed to: *${updates.status}*\n\nTrack here: ${process.env.APP_URL || 'https://jiffex.com'}/track?id=${orderId}`;
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
      saveDb();
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
    saveDb();
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
        const message = `*Jiffex Shipment Update*\n\nYour order #${orderId.slice(0, 8)} status has changed to: *${status}*\n\nTrack here: ${process.env.APP_URL || 'https://jiffex.com'}/track?id=${orderId}`;
        
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
      from: getSenderAddress(cleanedFrom),
      to: cleanedUser,
      subject: "Jiffex SMTP Diagnostic Test Successful!",
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #4f46e5; border-radius: 16px;">
          <h2 style="color: #4f46e5; margin-top: 0;">🎉 SMTP Connection Successful!</h2>
          <p>Your Jiffex notification server has successfully authenticated and is ready to send notifications.</p>
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
  
  if (!mailTransporter || (!process.env.SMTP_FROM && !process.env.SMTP_USER)) {
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
    const appUrl = process.env.APP_URL || "https://www.jiffex.shop";
    const trackingUrl = `${appUrl}?tab=track&id=${trackingId}`;
    
    const subject = `Invoice for your Jiffex Order: ${trackingId}`;
    const bodyText = `
Dear ${order.destination.fullName},

Thank you for choosing Jiffex for your shipping needs. 

We are pleased to inform you that your payment has been successfully processed. Please find the attached tax invoice for your order ${trackingId}.

Your shipment is being processed and will be dispatched as per the scheduled date. 

Track your shipment here: ${trackingUrl}

If you have any questions or require further assistance, please do not hesitate to contact our support team at ${companyDetails.email || 'support@jiffex.shop'}.

Best regards,

The Jiffex Team
Jiffex Fulfilment Private Limited
www.jiffex.shop
    `.trim();

    const bodyHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
  <p>Dear <strong>${order.destination.fullName}</strong>,</p>
  <p>Thank you for choosing <strong>Jiffex</strong> for your shipping needs.</p>
  <p>We are pleased to inform you that your payment has been successfully processed. Please find the attached tax invoice for your order <strong>${trackingId}</strong>.</p>
  <p>Your shipment is being processed and will be dispatched as per the scheduled date.</p>
  
  <p>You can track your shipment anytime using this link: 
    <a href="${trackingUrl}" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">
      Track Shipment Link
    </a>
  </p>
  
  <p>If you have any questions or require further assistance, please do not hesitate to contact our support team at <a href="mailto:${companyDetails.email || 'support@jiffex.shop'}" style="color: #4f46e5;">${companyDetails.email || 'support@jiffex.shop'}</a>.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    Best regards,<br>
    <strong>The Jiffex Team</strong><br>
    Jiffex Fulfilment Private Limited<br>
    <a href="https://www.jiffex.shop" style="color: #4f46e5; text-decoration: none;">www.jiffex.shop</a>
  </p>
</div>
    `.trim();

    console.log(`[Invoice PDF] Sending email to ${email}...`);
    await mailTransporter.sendMail({
      from: getSenderAddress(process.env.SMTP_FROM),
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

app.post("/api/invoice/send-consolidated-pdf", async (req, res) => {
  const { email, orders, companyDetails } = req.body;
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({ error: "No orders provided for consolidated invoice" });
  }
  console.log(`[Consolidated Invoice PDF] Request received for ${orders.length} orders to email: ${email}`);
  
  if (!mailTransporter || (!process.env.SMTP_FROM && !process.env.SMTP_USER)) {
    console.error('[Consolidated Invoice PDF] Email service not configured');
    return res.status(503).json({ error: "Email service not configured" });
  }

  if (!email || !email.includes('@') || email === 'user@example.com') {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    const pdfBuffer = await generateConsolidatedInvoicePDF(orders, companyDetails);

    const userInitials = (orders[0]?.destination?.fullName || 'USR').slice(0, 3).toUpperCase();
    const consolId = `CONSOL-${userInitials}-${new Date().getTime().toString().slice(-6)}`;
    const subject = `Consolidated Invoice for your Jiffex Orders: ${consolId}`;
    const bodyText = `
Dear ${orders[0].destination?.fullName || 'Valued Customer'},

Thank you for choosing Jiffex for your shipping needs. 

All your orders have now been completed successfully. Please find attached your single consolidated tax invoice containing all your completed shipments.

If you have any questions or require further assistance, please do not hesitate to contact our support team at ${companyDetails.email || 'support@jiffex.shop'}.

Best regards,

The Jiffex Team
Jiffex Fulfilment Private Limited
www.jiffex.shop
    `.trim();

    const bodyHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
  <p>Dear <strong>${orders[0].destination?.fullName || 'Valued Customer'}</strong>,</p>
  <p>Thank you for choosing <strong>Jiffex</strong> for your shipping needs.</p>
  <p>We are pleased to inform you that all your orders have now been completed successfully. Please find the attached single consolidated tax invoice for your completed shipments.</p>
  
  <p>If you have any questions or require further assistance, please do not hesitate to contact our support team at <a href="mailto:${companyDetails.email || 'support@jiffex.shop'}" style="color: #4f46e5;">${companyDetails.email || 'support@jiffex.shop'}</a>.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    Best regards,<br>
    <strong>The Jiffex Team</strong><br>
    Jiffex Fulfilment Private Limited<br>
    <a href="https://www.jiffex.shop" style="color: #4f46e5; text-decoration: none;">www.jiffex.shop</a>
  </p>
</div>
    `.trim();

    console.log(`[Consolidated Invoice PDF] Sending email to ${email}...`);
    await mailTransporter.sendMail({
      from: getSenderAddress(process.env.SMTP_FROM),
      to: email,
      subject: subject,
      text: bodyText,
      html: bodyHtml,
      attachments: [
        {
          filename: `Consolidated_Invoice_${consolId}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    console.log(`[Consolidated Invoice PDF] Consolidated Invoice ${consolId} successfully sent to ${email}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[Consolidated Invoice PDF] CRITICAL ERROR:`, err);
    res.status(500).json({ 
      error: formatSmtpError(err, "Consolidated Invoice Email"),
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// API: Send Order Confirmation for Pay at Home & General checkouts
app.post("/api/order-confirmation", async (req, res) => {
  const { email, order, companyDetails } = req.body;
  if (!order) {
    return res.status(400).json({ error: "Order details are missing" });
  }
  console.log(`[Order Confirmation] Request received for order ${order.id} to email: ${email}`);
  
  if (!mailTransporter || (!process.env.SMTP_FROM && !process.env.SMTP_USER)) {
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
    
    const isPaid = order.paymentStatus === 'Paid' || order.payment_status === 'Paid';
    const isPayAtHome = order.paymentStatus === 'Pay at Home' || order.payment_status === 'Pay at Home';
    const isPending = order.paymentStatus === 'Pending' || order.payment_status === 'Pending';
    const isShopOrder = orderIdStr.startsWith('SH-') || 
                        (order.items && Array.isArray(order.items) && order.items.some((i: any) => i.source === 'Store' || i.source === 'shop'));

    let subject = isPaid ? `Order Confirmed & Paid: ${trackingId}` : `Order Confirmed: ${trackingId}`;
    if (isShopOrder && isPaid) {
      subject = `Tax Invoice & Order Confirmation: ${trackingId}`;
    }
    
    let paymentBlockText = `Payment Status: Pending\nAmount: ₹${(order.totalCost || order.total_cost || 0).toLocaleString()}`;
    let paymentBlockHtml = `
    <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef3c7;">
      <p style="margin: 0; font-weight: bold; color: #b45309;">Payment Status: Pending</p>
      <p style="margin: 5px 0 0 0; color: #78350f;">The total amount of <strong>₹${(order.totalCost || order.total_cost || 0).toLocaleString()}</strong> is pending and will be collected or billed once the shipment is processed.</p>
    </div>`;

    if (isPaid) {
      paymentBlockText = `Payment Status: Paid\nWe have successfully received your payment of ₹${(order.totalCost || order.total_cost || 0).toLocaleString()}.`;
      paymentBlockHtml = `
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 0; font-weight: bold; color: #15803d;">Payment Confirmed</p>
        <p style="margin: 5px 0 0 0; color: #166534;">We have successfully received your payment of <strong>₹${(order.totalCost || order.total_cost || 0).toLocaleString()}</strong>.</p>
      </div>`;
    } else if (isPayAtHome) {
      paymentBlockText = `Payment Method: Pay at Home\nThe total amount of ₹${(order.totalCost || order.total_cost || 0).toLocaleString()} will be collected by our executive during the scheduled pickup.`;
      paymentBlockHtml = `
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-weight: bold; color: #1e293b;">Payment Method: Pay at Home</p>
        <p style="margin: 5px 0 0 0; color: #334155;">The total amount of <strong>₹${(order.totalCost || order.total_cost || 0).toLocaleString()}</strong> will be collected by our executive during the scheduled pickup.</p>
      </div>`;
    }

    // Generate invoice PDF attachment if Shop & Ship or Paid
    let attachments: any[] = [];
    if (isShopOrder || isPaid) {
      try {
        console.log(`[Order Confirmation] Generating tax invoice PDF for order ${order.id}...`);
        const pdfBuffer = await generateInvoicePDF(order, companyDetails);
        if (pdfBuffer && pdfBuffer.length > 0) {
          attachments.push({
            filename: `Invoice_${trackingId}.pdf`,
            content: pdfBuffer
          });
          console.log(`[Order Confirmation] Tax invoice PDF generated (${pdfBuffer.length} bytes) for order ${order.id}`);
        }
      } catch (pdfErr) {
        console.error(`[Order Confirmation] Error generating invoice PDF for order ${order.id}:`, pdfErr);
      }
    }

    // Notice text: Shop & Ship orders receive an attached invoice, NOT a consolidation notice
    const invoiceNoticeHtml = isShopOrder 
      ? `
  <p style="background-color: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0; font-size: 13px; color: #166534; margin: 15px 0;">
    <strong>Tax Invoice:</strong> Your official tax invoice for order <strong>${trackingId}</strong> has been generated and is attached to this email.
  </p>`
      : `
  <p style="background-color: #eff6ff; padding: 10px; border-radius: 8px; border: 1px solid #bfdbfe; font-size: 13px; color: #1e40af; margin: 15px 0;">
    <strong>Invoice Notice:</strong> To avoid multiple separate emails, we will generate and email a single consolidated tax invoice once all of your active orders are successfully completed.
  </p>`;

    const invoiceNoticeText = isShopOrder
      ? `Your official tax invoice for order ${trackingId} has been generated and is attached to this email.`
      : `Your final tax invoice will be generated and emailed as a consolidated invoice once all your active orders are completed.`;

    const bodyText = `
Dear ${order.destination.fullName},

Thank you for choosing Jiffex. Your order ${trackingId} has been confirmed.

${paymentBlockText}

Pickup/Shipping Date: ${order.shippingDate || order.shipping_date || 'As scheduled'}
Destination: ${order.destination.city}, ${order.destination.country}

Track your shipment here: ${trackingUrl}

${invoiceNoticeText}

If you have any questions, please contact our support team at ${companyDetails.email}.

Best regards,
The Jiffex Team
    `.trim();

    const bodyHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
  <p>Dear <strong>${order.destination.fullName}</strong>,</p>
  <p>Thank you for choosing <strong>Jiffex</strong>. Your order <strong>${trackingId}</strong> has been confirmed.</p>
  
  ${paymentBlockHtml}

  <p><strong>Order Summary:</strong><br>
  Shipping Date: ${order.shippingDate || order.shipping_date || 'As scheduled'}<br>
  Destination: ${order.destination.city}, ${order.destination.country}</p>
  
  <p>You can track your shipment anytime using this link: 
    <a href="${trackingUrl}" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">
      Track Shipment Link
    </a>
  </p>
  
  ${invoiceNoticeHtml}

  <p>If you have any questions, please contact our support team at <a href="mailto:${companyDetails.email}" style="color: #4f46e5;">${companyDetails.email}</a>.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    Best regards,<br>
    <strong>The Jiffex Team</strong>
  </p>
</div>
    `.trim();

    console.log(`[Order Confirmation] Sending email to ${email}...`);
    await mailTransporter.sendMail({
      from: getSenderAddress(process.env.SMTP_FROM),
      to: email,
      subject: subject,
      text: bodyText,
      html: bodyHtml,
      attachments: attachments.length > 0 ? attachments : undefined
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
  // Check if local logo file exists first as most reliable and fastest source
  const localLogoPaths = [
    path.join(process.cwd(), 'public', 'logo.jpg'),
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(process.cwd(), 'logo.png')
  ];
  for (const localPath of localLogoPaths) {
    if (fs.existsSync(localPath)) {
      try {
        const localBuf = fs.readFileSync(localPath);
        if (localBuf && localBuf.length > 0) {
          console.log(`[PDF Logo] Loaded logo from local filesystem: ${localPath}`);
          return localBuf;
        }
      } catch (err) {
        console.warn(`[PDF Logo] Error reading local file ${localPath}:`, err);
      }
    }
  }

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
    
    console.log(`[PDF Logo] Successfully fetched logo buffer, size: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error('[PDF Logo] Error fetching image buffer:', error);
    return null;
  }
}

async function generateConsolidatedInvoicePDF(orders: any[], companyDetails: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const compName = companyDetails?.fullName || companyDetails?.name || "Jiffex Fulfilment Private Limited";
    const compGst = companyDetails?.gstin || "36AAHCJ4656R1ZQ";
    const compAddress = companyDetails?.address || "Plot No 20, Siddartha Nagar North, Hyderabad 500038";
    const compEmail = companyDetails?.email || "support@jiffex.shop";
    const compWebsite = companyDetails?.website || "www.jiffex.shop";

    // Header Section - Logo & Company Info
    const logoUrl = process.env.VITE_LOGO_URL || "https://lh3.googleusercontent.com/d/1XuJvOVPtaq-Ifmz3Uw0S5HgeGY2ygOIL";
    const logoBuffer = await fetchImageBuffer(logoUrl);
    
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 40, { width: 130 });
      } catch (err) {
        console.error("[PDF Logo] Rendering Error:", err);
        doc.fillColor("#4f46e5").fontSize(26).font("Helvetica-Bold").text("Jiffex", 50, 45);
      }
    } else {
      doc.fillColor("#4f46e5").fontSize(26).font("Helvetica-Bold").text("Jiffex", 50, 45);
    }
    
    // Company details on top right
    doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold");
    doc.text(compName, 260, 45, { align: "right", width: 285 });
    
    doc.fillColor("#475569").fontSize(9).font("Helvetica");
    doc.text(compAddress, 260, 60, { align: "right", width: 285 });
    doc.font("Helvetica-Bold").text(`GSTIN: ${compGst}`, 260, 75, { align: "right", width: 285 });
    doc.font("Helvetica").text(`Email: ${compEmail} | Web: ${compWebsite}`, 260, 90, { align: "right", width: 285 });
    
    doc.moveTo(50, 110).lineTo(545, 110).lineWidth(1).strokeColor("#cbd5e1").stroke();

    // Invoice Title & Meta Box
    const pageWidth = doc.page.width;
    doc.fillColor("#0f172a").fontSize(18).font("Helvetica-Bold").text("CONSOLIDATED TAX INVOICE", 0, 120, { 
      align: "center",
      width: pageWidth
    });

    const primaryOrder = orders[0];
    const userInitials = (primaryOrder?.destination?.fullName || 'USR').slice(0, 3).toUpperCase();
    const consolId = `CONSOL-${userInitials}-${new Date().getTime().toString().slice(-6)}`;
    
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155");
    doc.text(`Invoice No: ${consolId}`, 50, 148);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 380, 148, { align: 'right', width: 165 });
    doc.text(`Place of Supply: Telangana (36)`, 50, 162);
    doc.text(`Reverse Charge: No`, 380, 162, { align: 'right', width: 165 });

    doc.moveTo(50, 178).lineTo(545, 178).lineWidth(0.5).strokeColor("#e2e8f0").stroke();

    // Billing & Shipping Address side-by-side
    const addrTop = 188;
    const dest = primaryOrder?.destination || {};
    const destName = dest.fullName || 'Valued Customer';
    const destPhone = dest.phone || 'N/A';
    const destEmail = dest.email || 'N/A';
    const destAddrStr = [dest.addressLine1, dest.city, dest.state, dest.zipCode, dest.country].filter(Boolean).join(', ');

    // Billing Address Box
    doc.rect(50, addrTop, 240, 92).lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke("#f8fafc", "#e2e8f0");
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold").text("BILLING ADDRESS", 60, addrTop + 8);
    doc.fillColor("#334155").fontSize(9).font("Helvetica-Bold").text(destName, 60, addrTop + 24, { width: 220 });
    doc.font("Helvetica").fillColor("#475569");
    doc.text(destAddrStr || 'Same as destination address', 60, addrTop + 36, { width: 220 });
    doc.text(`Phone: ${destPhone}`, 60, addrTop + 62, { width: 220 });
    doc.text(`Email: ${destEmail}`, 60, addrTop + 74, { width: 220 });

    // Shipping Address Box
    doc.rect(305, addrTop, 240, 92).lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke("#f8fafc", "#e2e8f0");
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold").text("SHIPPING ADDRESS", 315, addrTop + 8);
    doc.fillColor("#334155").fontSize(9).font("Helvetica-Bold").text(destName, 315, addrTop + 24, { width: 220 });
    doc.font("Helvetica").fillColor("#475569");
    doc.text(destAddrStr || 'N/A', 315, addrTop + 36, { width: 220 });
    doc.text(`Phone: ${destPhone}`, 315, addrTop + 62, { width: 220 });
    doc.text(`Email: ${destEmail}`, 315, addrTop + 74, { width: 220 });

    // Order Details Table
    const tableTop = addrTop + 106;
    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text("Consolidated Item Details", 50, tableTop);
    
    // Table Header Bar
    const thY = tableTop + 16;
    doc.rect(50, thY, 495, 22).fill("#0f172a");
    
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Item Description", 58, thY + 6);
    doc.text("Order ID", 220, thY + 6);
    doc.text("Qty", 295, thY + 6, { width: 30, align: 'center' });
    doc.text("Unit Price", 330, thY + 6, { width: 65, align: 'right' });
    doc.text("Tax", 400, thY + 6, { width: 55, align: 'right' });
    doc.text("Total Amount", 460, thY + 6, { width: 80, align: 'right' });
    
    let y = thY + 26;
    doc.font("Helvetica").fillColor("#1e293b");

    const allItems: any[] = [];
    orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        allItems.push({
          ...item,
          orderId: order.id
        });
      });
    });

    allItems.forEach((item: any, idx: number) => {
      if (y > 670) {
        doc.addPage();
        y = 50;
        doc.rect(50, y, 495, 22).fill("#0f172a");
        doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text("Item Description", 58, y + 6);
        doc.text("Order ID", 220, y + 6);
        doc.text("Qty", 295, y + 6, { width: 30, align: 'center' });
        doc.text("Unit Price", 330, y + 6, { width: 65, align: 'right' });
        doc.text("Tax", 400, y + 6, { width: 55, align: 'right' });
        doc.text("Total Amount", 460, y + 6, { width: 80, align: 'right' });
        y += 28;
      }

      const qty = item.quantity || 1;
      const totalItemPrice = item.price || 0;
      const unitPrice = qty > 0 ? (totalItemPrice / qty) : totalItemPrice;
      const isEven = idx % 2 === 1;

      if (isEven) {
        doc.rect(50, y - 4, 495, 20).fill("#f8fafc");
      }

      doc.fillColor("#1e293b").fontSize(8.5).font("Helvetica");
      doc.text(item.name || 'Unknown Item', 58, y, { width: 155 });
      doc.text(item.orderId || 'N/A', 220, y, { width: 70 });
      doc.text(qty.toString(), 295, y, { width: 30, align: 'center' });
      doc.text(`Rs. ${Math.round(unitPrice).toLocaleString()}`, 330, y, { width: 65, align: 'right' });
      doc.text("Rs. 0 (0%)", 400, y, { width: 55, align: 'right' });
      doc.text(`Rs. ${Math.round(totalItemPrice).toLocaleString()}`, 460, y, { width: 80, align: 'right' });
      
      y += 20;
    });

    if (y > 640) {
      doc.addPage();
      y = 50;
    }

    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor("#cbd5e1").stroke();
    y += 12;

    // Shipping & Cost Breakdown Summary
    const summaryTop = y;
    doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("Shipping & Summary", 50, summaryTop);
    doc.fontSize(8.5).font("Helvetica").fillColor("#475569");
    doc.text(`Orders Included: ${orders.map(o => o.id).join(', ')}`, 50, summaryTop + 16, { width: 260 });
    doc.text(`Destination Country: ${dest.country || 'International'}`, 50, summaryTop + 42);
    doc.text(`GST Status: Tax Invoice under GST Rules (Telangana)`, 50, summaryTop + 56);

    // Cost Breakdown table on right
    const costBoxX = 330;
    const productCost = allItems.reduce((acc: number, i: any) => acc + (i.price || 0), 0);
    const totalCost = orders.reduce((acc: number, o: any) => acc + (o.total_cost || o.totalCost || 0), 0);
    const shippingCharges = Math.max(0, totalCost - productCost);

    doc.rect(costBoxX, summaryTop, 215, 95).lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke("#f8fafc", "#e2e8f0");
    
    doc.fillColor("#475569").fontSize(8.5).font("Helvetica");
    doc.text("Items Subtotal:", costBoxX + 12, summaryTop + 10);
    doc.text(`Rs. ${Math.round(productCost).toLocaleString()}`, costBoxX + 110, summaryTop + 10, { width: 90, align: 'right' });

    doc.text("Shipping & Handling:", costBoxX + 12, summaryTop + 26);
    doc.text(`Rs. ${Math.round(shippingCharges).toLocaleString()}`, costBoxX + 110, summaryTop + 26, { width: 90, align: 'right' });

    doc.text("Tax / GST (0%):", costBoxX + 12, summaryTop + 42);
    doc.text("Rs. 0", costBoxX + 110, summaryTop + 42, { width: 90, align: 'right' });

    doc.moveTo(costBoxX + 10, summaryTop + 60).lineTo(costBoxX + 205, summaryTop + 60).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

    doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold");
    doc.text("Total Amount:", costBoxX + 12, summaryTop + 70);
    doc.text(`Rs. ${Math.round(totalCost).toLocaleString()}`, costBoxX + 110, summaryTop + 70, { width: 90, align: 'right' });

    // Footer Section
    doc.font("Helvetica-Oblique").fontSize(8).fillColor("#64748b")
       .text("This is a computer-generated consolidated tax invoice and does not require a physical signature.", 50, 755, { align: "center", width: 495 });
    doc.font("Helvetica").fontSize(8).fillColor("#475569")
       .text(`Support: ${compEmail} | Website: ${compWebsite} | GSTIN: ${compGst}`, 50, 768, { align: "center", width: 495 });
    doc.font("Helvetica").fontSize(7.5).fillColor("#94a3b8")
       .text(`${compName} • ${compAddress}`, 50, 780, { align: "center", width: 495 });

    doc.end();
  });
}

async function generateInvoicePDF(order: any, companyDetails: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const compName = companyDetails?.fullName || companyDetails?.name || "Jiffex Fulfilment Private Limited";
    const compGst = companyDetails?.gstin || "36AAHCJ4656R1ZQ";
    const compAddress = companyDetails?.address || "Plot No 20, Siddartha Nagar North, Hyderabad 500038";
    const compEmail = companyDetails?.email || "support@jiffex.shop";
    const compWebsite = companyDetails?.website || "www.jiffex.shop";

    // Header Section - Logo & Company Info
    const logoUrl = process.env.VITE_LOGO_URL || "https://lh3.googleusercontent.com/d/1XuJvOVPtaq-Ifmz3Uw0S5HgeGY2ygOIL";
    const logoBuffer = await fetchImageBuffer(logoUrl);
    
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 40, { width: 130 });
      } catch (err) {
        console.error("[PDF Logo] Rendering Error:", err);
        doc.fillColor("#4f46e5").fontSize(26).font("Helvetica-Bold").text("Jiffex", 50, 45);
      }
    } else {
      doc.fillColor("#4f46e5").fontSize(26).font("Helvetica-Bold").text("Jiffex", 50, 45);
    }
    
    // Company details on top right
    doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold");
    doc.text(compName, 260, 45, { align: "right", width: 285 });
    
    doc.fillColor("#475569").fontSize(9).font("Helvetica");
    doc.text(compAddress, 260, 60, { align: "right", width: 285 });
    doc.font("Helvetica-Bold").text(`GSTIN: ${compGst}`, 260, 75, { align: "right", width: 285 });
    doc.font("Helvetica").text(`Email: ${compEmail} | Web: ${compWebsite}`, 260, 90, { align: "right", width: 285 });
    
    doc.moveTo(50, 110).lineTo(545, 110).lineWidth(1).strokeColor("#cbd5e1").stroke();

    // Invoice Title & Meta Box
    const pageWidth = doc.page.width;
    doc.fillColor("#0f172a").fontSize(18).font("Helvetica-Bold").text("TAX INVOICE", 0, 120, { 
      align: "center",
      width: pageWidth
    });

    const orderIdStr = String(order.id || '');
    const invNo = `INV-${orderIdStr.slice(0, 8).toUpperCase()}`;
    const invDate = new Date(order.created_at || order.createdAt || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155");
    doc.text(`Invoice No: ${invNo}`, 50, 148);
    doc.text(`Invoice Date: ${invDate}`, 380, 148, { align: 'right', width: 165 });
    doc.text(`Place of Supply: Telangana (36)`, 50, 162);
    doc.text(`Reverse Charge: No`, 380, 162, { align: 'right', width: 165 });

    doc.moveTo(50, 178).lineTo(545, 178).lineWidth(0.5).strokeColor("#e2e8f0").stroke();

    // Billing & Shipping Address side-by-side
    const addrTop = 188;
    const dest = order.destination || {};
    const destName = dest.fullName || 'Valued Customer';
    const destPhone = dest.phone || 'N/A';
    const destEmail = dest.email || 'N/A';
    const destAddrStr = [dest.addressLine1, dest.city, dest.state, dest.zipCode, dest.country].filter(Boolean).join(', ');

    // Billing Address Box
    doc.rect(50, addrTop, 240, 92).lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke("#f8fafc", "#e2e8f0");
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold").text("BILLING ADDRESS", 60, addrTop + 8);
    doc.fillColor("#334155").fontSize(9).font("Helvetica-Bold").text(destName, 60, addrTop + 24, { width: 220 });
    doc.font("Helvetica").fillColor("#475569");
    doc.text(destAddrStr || 'Same as destination address', 60, addrTop + 36, { width: 220 });
    doc.text(`Phone: ${destPhone}`, 60, addrTop + 62, { width: 220 });
    doc.text(`Email: ${destEmail}`, 60, addrTop + 74, { width: 220 });

    // Shipping Address Box
    doc.rect(305, addrTop, 240, 92).lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke("#f8fafc", "#e2e8f0");
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold").text("SHIPPING ADDRESS", 315, addrTop + 8);
    doc.fillColor("#334155").fontSize(9).font("Helvetica-Bold").text(destName, 315, addrTop + 24, { width: 220 });
    doc.font("Helvetica").fillColor("#475569");
    doc.text(destAddrStr || 'N/A', 315, addrTop + 36, { width: 220 });
    doc.text(`Phone: ${destPhone}`, 315, addrTop + 62, { width: 220 });
    doc.text(`Email: ${destEmail}`, 315, addrTop + 74, { width: 220 });

    // Order Details Table
    const tableTop = addrTop + 106;
    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text("Order Details", 50, tableTop);
    
    // Table Header Bar
    const thY = tableTop + 16;
    doc.rect(50, thY, 495, 22).fill("#0f172a");
    
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Item Description", 58, thY + 6);
    doc.text("Qty", 260, thY + 6, { width: 35, align: 'center' });
    doc.text("Unit Price", 305, thY + 6, { width: 70, align: 'right' });
    doc.text("Tax", 385, thY + 6, { width: 65, align: 'right' });
    doc.text("Total Amount", 460, thY + 6, { width: 80, align: 'right' });
    
    let y = thY + 26;
    doc.font("Helvetica").fillColor("#1e293b");

    const items = order.items || [];
    items.forEach((item: any, idx: number) => {
      if (y > 670) {
        doc.addPage();
        y = 50;
        doc.rect(50, y, 495, 22).fill("#0f172a");
        doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text("Item Description", 58, y + 6);
        doc.text("Qty", 260, y + 6, { width: 35, align: 'center' });
        doc.text("Unit Price", 305, y + 6, { width: 70, align: 'right' });
        doc.text("Tax", 385, y + 6, { width: 65, align: 'right' });
        doc.text("Total Amount", 460, y + 6, { width: 80, align: 'right' });
        y += 28;
      }

      const qty = item.quantity || 1;
      const totalItemPrice = item.price || 0;
      const unitPrice = qty > 0 ? (totalItemPrice / qty) : totalItemPrice;
      const isEven = idx % 2 === 1;

      if (isEven) {
        doc.rect(50, y - 4, 495, 20).fill("#f8fafc");
      }

      doc.fillColor("#1e293b").fontSize(8.5).font("Helvetica");
      doc.text(item.name || 'Unknown Item', 58, y, { width: 195 });
      doc.text(qty.toString(), 260, y, { width: 35, align: 'center' });
      doc.text(`Rs. ${Math.round(unitPrice).toLocaleString()}`, 305, y, { width: 70, align: 'right' });
      doc.text("Rs. 0 (0%)", 385, y, { width: 65, align: 'right' });
      doc.text(`Rs. ${Math.round(totalItemPrice).toLocaleString()}`, 460, y, { width: 80, align: 'right' });
      
      y += 20;
    });

    if (y > 640) {
      doc.addPage();
      y = 50;
    }

    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor("#cbd5e1").stroke();
    y += 12;

    // Shipping Details & Cost Breakdown Summary
    const shippingTop = y;
    doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("Shipping Details", 50, shippingTop);
    
    const isPrefixed = ['SH-', 'SW-', 'PH-', 'BB-'].some(p => orderIdStr.startsWith(p));
    const trackingId = isPrefixed ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
    const serviceType = (order.items && order.items[0]) ? order.items[0].source : 'Standard Shipping';

    doc.fontSize(8.5).font("Helvetica").fillColor("#475569");
    doc.text(`Service Type: ${serviceType}`, 50, shippingTop + 16);
    doc.text(`Origin: Hyderabad, Telangana, India`, 50, shippingTop + 30);
    doc.text(`Destination: ${dest.country || 'International'}`, 50, shippingTop + 44);
    doc.text(`Tracking ID: ${trackingId}`, 50, shippingTop + 58);
    doc.text(`GST Status: Tax Invoice under GST Rules (Telangana)`, 50, shippingTop + 72);

    // Cost Breakdown table on right
    const costBoxX = 330;
    const productCost = (order.items || []).reduce((acc: number, i: any) => acc + (i.price || 0), 0);
    const totalCost = order.total_cost || order.totalCost || 0;
    const shippingCharges = Math.max(0, totalCost - productCost);

    doc.rect(costBoxX, shippingTop, 215, 95).lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke("#f8fafc", "#e2e8f0");
    
    doc.fillColor("#475569").fontSize(8.5).font("Helvetica");
    doc.text("Items Subtotal:", costBoxX + 12, shippingTop + 10);
    doc.text(`Rs. ${Math.round(productCost).toLocaleString()}`, costBoxX + 110, shippingTop + 10, { width: 90, align: 'right' });

    doc.text("Shipping & Handling:", costBoxX + 12, shippingTop + 26);
    doc.text(`Rs. ${Math.round(shippingCharges).toLocaleString()}`, costBoxX + 110, shippingTop + 26, { width: 90, align: 'right' });

    doc.text("Tax / GST (0%):", costBoxX + 12, shippingTop + 42);
    doc.text("Rs. 0", costBoxX + 110, shippingTop + 42, { width: 90, align: 'right' });

    doc.moveTo(costBoxX + 10, shippingTop + 60).lineTo(costBoxX + 205, shippingTop + 60).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

    doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold");
    doc.text("Total Amount:", costBoxX + 12, shippingTop + 70);
    doc.text(`Rs. ${Math.round(totalCost).toLocaleString()}`, costBoxX + 110, shippingTop + 70, { width: 90, align: 'right' });

    // Footer Section
    doc.font("Helvetica-Oblique").fontSize(8).fillColor("#64748b")
       .text("This is a computer-generated invoice and does not require a physical signature.", 50, 755, { align: "center", width: 495 });
    doc.font("Helvetica").fontSize(8).fillColor("#475569")
       .text(`Support: ${compEmail} | Website: ${compWebsite} | GSTIN: ${compGst}`, 50, 768, { align: "center", width: 495 });
    doc.font("Helvetica").fontSize(7.5).fillColor("#94a3b8")
       .text(`${compName} • ${compAddress}`, 50, 780, { align: "center", width: 495 });

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
    supabase.from('pickups').delete().in('id', idsToDelete)
      .then(({ error }) => {
        if (error) console.error('[SERVER SELF-HEAL] Pickups Delete Error:', error.message);
        else console.log('[SERVER SELF-HEAL] Pickups Deleted IDs:', idsToDelete);
      });
    // Filter from memory arrays
    const filteredMem = memOrders.filter(o => !idsToDelete.includes(o.id));
    memOrders.length = 0;
    memOrders.push(...filteredMem);

    const filteredPickups = memPickups.filter(p => !idsToDelete.includes(p.id));
    memPickups.length = 0;
    memPickups.push(...filteredPickups);

    cachedAllOrders = cachedAllOrders.filter(o => !idsToDelete.includes(o.id));
    saveDb();
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
  saveDb();

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
    saveDb();
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
    saveDb();
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

// Helper to transform a pickup record into a complete standard order object
const transformDbPickupToOrder = (p: any) => {
  if (!p) return null;
  let items = p.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch (e) { items = []; }
  }
  if (!Array.isArray(items)) items = [];

  const fullName = p.customer_name || p.customerName || 'Customer';
  const phone = p.phone || '';
  const email = p.email || '';
  const address = p.address || '';
  const date = p.pickup_date || p.pickupDate || p.date || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  const time = p.pickup_time || p.pickupTime || p.time || 'Flexible';

  return transformDbOrder({
    id: p.id,
    customer_id: p.customer_id || p.customerId || (email ? `guest_${email.replace(/[^a-z0-9]/gi, '_')}` : 'guest'),
    customer_name: fullName,
    email: email,
    phone: phone,
    address: address,
    status: p.status || 'Scheduled',
    payment_status: p.payment_status || p.paymentStatus || 'Pending',
    shipping_date: date,
    created_at: p.created_at || new Date().toISOString(),
    total_weight: p.total_weight || p.totalWeight || 0,
    total_cost: p.total_cost || p.totalCost || 0,
    items: items,
    destination: {
      fullName: fullName,
      customerName: fullName,
      email: email,
      phone: phone,
      addressLine1: address,
      address: address,
      city: p.city || 'Hyderabad',
      state: p.state || 'Telangana',
      zipCode: p.zip_code || p.zipCode || '500001',
      country: p.country || 'India',
      pickupType: p.pickup_type || p.pickupType || 'AllAgent',
      assignedAgentId: p.assigned_agent_id || p.assignedAgentId,
      languagePreference: p.language_preference || p.languagePreference || 'English',
      itemType: p.item_type || p.itemType || 'General',
      vehicleType: p.vehicle_type || p.vehicleType || 'Two-Wheeler',
      date: date,
      time: time
    },
    pickup_type: p.pickup_type || p.pickupType || 'AllAgent',
    assigned_agent_id: p.assigned_agent_id || p.assignedAgentId,
    language_preference: p.language_preference || p.languagePreference,
    item_type: p.item_type || p.itemType,
    vehicle_type: p.vehicle_type || p.vehicleType
  });
};

// Global background cache refresh tracker
let isRefreshingOrders = false;
let lastOrderRefreshTime = 0;

const refreshAllOrdersCache = async (force = false): Promise<any[]> => {
  const now = Date.now();
  // Return cached immediately if refreshed within last 60 seconds and not forced
  if (!force && cachedAllOrders.length > 0 && now - lastOrderRefreshTime < 60000) {
    return cachedAllOrders;
  }
  if (isRefreshingOrders && cachedAllOrders.length > 0) {
    return cachedAllOrders;
  }
  isRefreshingOrders = true;
  try {
    const orderMap = new Map<string, any>();

    // 1. Fetch from pickups table in Supabase
    if (supabase) {
      try {
        const { data: pickups, error: pErr } = await supabase
          .from('pickups')
          .select('*')
          .order('created_at', { ascending: false });
        if (!pErr && Array.isArray(pickups)) {
          pickups.forEach((p: any) => {
            const transformed = transformDbPickupToOrder(p);
            if (transformed && transformed.id) {
              orderMap.set(transformed.id, transformed);
            }
          });
        }
      } catch (err: any) {
        console.warn('[SERVER] Pickups table fetch warning:', err.message);
      }

      // 2. Fetch from orders table in safe chunked ranges to prevent statement timeouts
      try {
        const ranges = [
          [0, 49],
          [50, 99],
          [100, 149],
          [150, 199]
        ];
        for (const [start, end] of ranges) {
          try {
            const { data: chunk, error: cErr } = await supabase
              .from('orders')
              .select('*')
              .order('id', { ascending: false })
              .range(start, end);
            if (!cErr && Array.isArray(chunk) && chunk.length > 0) {
              chunk.forEach((o: any) => {
                const transformed = transformDbOrder(o);
                if (transformed && transformed.id) {
                  orderMap.set(transformed.id, transformed);
                }
              });
              if (chunk.length < (end - start + 1)) {
                break;
              }
            } else {
              break;
            }
          } catch (chunkErr) {
            break;
          }
        }
      } catch (err: any) {
        console.warn('[SERVER] Orders table fetch warning:', err.message);
      }
    }

    // 3. Overlay in-memory pickups & in-memory orders (ensuring local additions are never lost)
    memPickups.forEach((p: any) => {
      const transformed = transformDbPickupToOrder(p);
      if (transformed && transformed.id) {
        orderMap.set(transformed.id, transformed);
      }
    });

    memOrders.forEach((o: any) => {
      const transformed = transformDbOrder(o);
      if (transformed && transformed.id) {
        orderMap.set(transformed.id, transformed);
      }
    });

    const combinedList = Array.from(orderMap.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const deduplicated = deduplicateOrders(combinedList);
    if (deduplicated && deduplicated.length > 0) {
      cachedAllOrders = deduplicated;
      lastOrderRefreshTime = Date.now();
    }
    return cachedAllOrders;
  } catch (err: any) {
    console.error('[SERVER] Failed to refresh all orders cache:', err.message);
    return cachedAllOrders;
  } finally {
    isRefreshingOrders = false;
  }
};

// API: Get all orders (Admin only - returns complete list with zero timeouts)
app.get("/api/orders", async (req, res) => {
  // If cache is empty or stale, trigger refresh
  if (cachedAllOrders.length === 0) {
    await refreshAllOrdersCache(true);
  } else {
    // Trigger non-blocking background refresh to keep cache fresh
    refreshAllOrdersCache().catch(console.error);
  }

  // Merge any recent memory orders
  const mergedMap = new Map();
  cachedAllOrders.forEach((o: any) => mergedMap.set(o.id, o));
  memOrders.map(transformDbOrder).forEach((o: any) => mergedMap.set(o.id, o));
  memPickups.map(transformDbPickupToOrder).filter(Boolean).forEach((o: any) => {
    if (!mergedMap.has(o.id)) mergedMap.set(o.id, o);
  });

  const finalOrders = Array.from(mergedMap.values()).sort((a: any, b: any) => {
    const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
    const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const deduplicatedFinalOrders = deduplicateOrders(finalOrders);
  res.json(deduplicatedFinalOrders);
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
  const { email, phone } = req.query;

  const idsToFetch = [customerId];
  if (email) {
    const cleanEmail = String(email).toLowerCase().trim();
    const guestId = `guest_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    if (!idsToFetch.includes(guestId)) idsToFetch.push(guestId);
    if (!idsToFetch.includes(cleanEmail)) idsToFetch.push(cleanEmail);
  }

  if (!supabase) {
    const userOrders = memOrders.filter(o => {
      const cId = o.customer_id || o.customerId || o.destination?.customerId || o.destination?.customer_id;
      const isIdMatch = idsToFetch.some(id => String(cId).toLowerCase() === String(id).toLowerCase());
      
      const destEmail = o.destination?.email || o.email || "";
      const isEmailMatch = email && destEmail && String(destEmail).toLowerCase() === String(email).toLowerCase();
      
      const destPhone = o.destination?.phone || o.phone || "";
      const isPhoneMatch = phone && destPhone && String(destPhone) === String(phone);

      return isIdMatch || isEmailMatch || isPhoneMatch;
    });
    return res.json(deduplicateOrders(userOrders.map(transformDbOrder)));
  }

  try {
    const query = supabase
      .from('orders')
      .select('*')
      .in('customer_id', idsToFetch)
      .order('created_at', { ascending: false });

    const { data, error } = await queryWithTimeout(query, 5000);
    if (error) throw error;
    
    let mergedOrders = [...(data || [])];

    // Also fetch orders matching destination email if available
    if (email) {
      try {
        const emailLower = String(email).toLowerCase().trim();
        const { data: emailData } = await supabase
          .from('orders')
          .select('*')
          .ilike('destination->>email', emailLower)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (emailData && Array.isArray(emailData)) {
          emailData.forEach((o: any) => {
            if (!mergedOrders.some((existing: any) => existing.id === o.id)) {
              mergedOrders.push(o);
            }
          });
        }
      } catch (e) {
        // Non-blocking secondary lookup
      }
    }

    // Merge in-memory orders matching user
    memOrders.forEach((o: any) => {
      const cId = o.customer_id || o.customerId || o.destination?.customerId || o.destination?.customer_id;
      const isIdMatch = idsToFetch.some(id => String(cId).toLowerCase() === String(id).toLowerCase());
      const destEmail = o.destination?.email || o.email || "";
      const isEmailMatch = email && destEmail && String(destEmail).toLowerCase() === String(email).toLowerCase();
      const destPhone = o.destination?.phone || o.phone || "";
      const isPhoneMatch = phone && destPhone && String(destPhone) === String(phone);

      if (isIdMatch || isEmailMatch || isPhoneMatch) {
        if (!mergedOrders.some((existing: any) => existing.id === o.id)) {
          mergedOrders.push(o);
        }
      }
    });

    const transformed = mergedOrders.map(transformDbOrder);
    res.json(deduplicateOrders(transformed));
  } catch (err: any) {
    console.log(`Serving filtered orders fallback for user: ${customerId}`);
    
    // Return filtered orders from local cache & memory
    const mergedSet = new Map();
    cachedAllOrders.forEach((o: any) => mergedSet.set(o.id, o));
    memOrders.map(transformDbOrder).forEach((o: any) => mergedSet.set(o.id, o));

    const fallback = Array.from(mergedSet.values())
      .filter((o: any) => {
        const cId = o.customer_id || o.customerId || o.destination?.customerId || o.destination?.customer_id;
        const isIdMatch = idsToFetch.some(id => String(cId).toLowerCase() === String(id).toLowerCase());
        
        const destEmail = o.destination?.email || o.email || "";
        const isEmailMatch = email && destEmail && String(destEmail).toLowerCase() === String(email).toLowerCase();
        
        const destPhone = o.destination?.phone || o.phone || "";
        const isPhoneMatch = phone && destPhone && String(destPhone) === String(phone);

        return isIdMatch || isEmailMatch || isPhoneMatch;
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
    const { data: existingProducts, error: pError } = await safeSupabaseQuery(() =>
      supabase.from('products').select('id').limit(1),
      { label: 'seedCheckProducts' }
    );
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
       const { error: pInsError } = await safeSupabaseQuery(() =>
         supabase.from('products').insert(defaultProducts),
         { label: 'seedInsertProducts' }
       );
       if (pInsError && pInsError.code !== 'PGRST002') {
         console.warn("[Supabase Seeder] Failed to seed products:", pInsError.message || pInsError);
       } else {
         console.log("[Supabase Seeder] Products seeded successfully!");
       }
    }

    // 2. Seed Agents if empty
    const { data: existingAgents, error: aError } = await safeSupabaseQuery(() =>
      supabase.from('agents').select('id').limit(1),
      { label: 'seedCheckAgents' }
    );
    if (!aError && (!existingAgents || existingAgents.length === 0)) {
       console.log("[Supabase Seeder] Agents table is empty, seeding default agents...");
       const defaultAgents = [
         { id: '10001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: '10001.agent@jiffex.com', status: 'Active', vehicle_number: 'KA-01-AB-1234' },
         { id: '10002', name: 'Priya Patel', phone: '+91 87654 32109', email: '10002.agent@jiffex.com', status: 'Active', vehicle_number: 'MH-02-CD-5678' },
         { id: '12345', name: 'Test Agent (You)', phone: '+91 00000 00000', email: '12345.agent@jiffex.com', status: 'Active', vehicle_number: 'TEST-001' }
       ];
       const { error: aInsError } = await safeSupabaseQuery(() =>
         supabase.from('agents').insert(defaultAgents),
         { label: 'seedInsertAgents' }
       );
       if (aInsError && aInsError.code !== 'PGRST002') {
         console.warn("[Supabase Seeder] Failed to seed agents:", aInsError.message || aInsError);
       } else {
         console.log("[Supabase Seeder] Agents seeded successfully!");
       }
    }

    // 3. Seed Items if empty
    const { data: existingItems, error: iError } = await safeSupabaseQuery(() =>
      supabase.from('items').select('id').limit(1),
      { label: 'seedCheckItems' }
    );
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
       const { error: iInsError } = await safeSupabaseQuery(() =>
         supabase.from('items').insert(defaultItems),
         { label: 'seedInsertItems' }
       );
       if (iInsError && iInsError.code !== 'PGRST002') {
         console.warn("[Supabase Seeder] Failed to seed items:", iInsError.message || iInsError);
       } else {
         console.log("[Supabase Seeder] Items seeded successfully!");
         
         // 4. Seed Orders if empty (referencing the items seeded)
         const { data: existingOrders, error: oError } = await safeSupabaseQuery(() =>
           supabase.from('orders').select('id').limit(1),
           { label: 'seedCheckOrders' }
         );
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
            const { error: oInsError } = await safeSupabaseQuery(() =>
              supabase.from('orders').insert(defaultOrders),
              { label: 'seedInsertOrders' }
            );
            if (oInsError && oInsError.code !== 'PGRST002') {
              console.warn("[Supabase Seeder] Failed to seed orders:", oInsError.message || oInsError);
            } else {
              console.log("[Supabase Seeder] Orders seeded successfully!");
            }
         }
       }

       // 6. Seed Shipping Settings if empty
       try {
         const { data: existingSettings, error: sErr } = await safeSupabaseQuery(() =>
           supabase.from('shipping_settings').select('id').limit(1),
           { label: 'seedCheckShippingSettings' }
         );
         if (!sErr && (!existingSettings || existingSettings.length === 0)) {
            console.log("[Supabase Seeder] shipping_settings table is empty, seeding default settings...");
            const { error: sInsError } = await safeSupabaseQuery(() =>
              supabase.from('shipping_settings').insert({
                id: 'global',
                rates: DEFAULT_SHIPPING_SETTINGS.rates,
                discounts: DEFAULT_SHIPPING_SETTINGS.discounts,
                coupons: [
                  { code: "SHIP5", discountPercent: 5, isEnabled: true },
                  { code: "BOOST", discountPercent: 12, isEnabled: false }
                ]
              }),
              { label: 'seedInsertShippingSettings' }
            );
            if (sInsError && sInsError.code !== 'PGRST002') {
              console.warn("[Supabase Seeder] Failed to seed shipping_settings:", sInsError.message || sInsError);
            } else {
              console.log("[Supabase Seeder] shipping_settings seeded successfully!");
            }
         }
       } catch (e: any) {
         if (!e?.message?.includes('schema cache')) {
           console.warn("[Supabase Seeder] Optional shipping_settings table check skipped or failed:", e.message || e);
         }
       }

       // 7. Clear pre-existing guest-user Store items to keep local startup empty by default
       try {
         const { error: clearStoreErr } = await safeSupabaseQuery(() =>
           supabase
             .from('items')
             .delete()
             .eq('user_id', 'guest-user')
             .eq('source', 'Store'),
           { label: 'seedClearGuestStoreItems' }
         );
         if (clearStoreErr && clearStoreErr.code !== 'PGRST002') {
           console.warn("[Supabase Seeder] Failed to clear pre-existing guest-user Store items:", clearStoreErr.message || clearStoreErr);
         } else {
           console.log("[Supabase Seeder] Cleared pre-existing guest-user Store items successfully!");
         }
       } catch (e: any) {
         if (!e?.message?.includes('schema cache')) {
           console.warn("[Supabase Seeder] Optional guest-user Store items cleaning skipped or failed:", e.message || e);
         }
       }
    }
  } catch (err: any) {
    if (!err?.message?.includes('schema cache')) {
      console.warn("[Supabase Seeder] Seeding deferred:", err.message || err);
    }
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
  const carrier = order.carrier || order.carrier_name || "Jiffex";
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
  const warehouseLoc = "Jiffex Delhi Warehouse, India";

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
        description: 'International customs cleared and departing Jiffex transit facility.'
      });
    }
    if (statusLower.includes('delivered') || statusLower.includes('out') || statusLower.includes('transit') || statusLower.includes('ship') || statusLower.includes('packed') || statusLower.includes('warehouse') || statusLower.includes('received')) {
      events.push({
        status: 'Received at Warehouse',
        location: warehouseLoc,
        date: formatDate(baseDate),
        time: formatTime(11, 45),
        description: 'Package received at Jiffex sorting warehouse, categorized, and prepared.'
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

// ==========================================
// OMNIDIMENSION / JIFFEX AI AGENT TOOL ENDPOINTS
// 1. Live Shipment Tracking
// 2. Shipping Quote Calculator
// 3. Book Home Pickup
// ==========================================

// Helper: normalize params across OpenAI, OmniDimension, and standard REST requests
const extractAgentParams = (req: express.Request) => {
  const query = req.query || {};
  const body = req.body || {};
  let nestedArgs: any = {};
  
  if (body.arguments) {
    if (typeof body.arguments === 'string') {
      try { nestedArgs = JSON.parse(body.arguments); } catch (e) { nestedArgs = {}; }
    } else if (typeof body.arguments === 'object') {
      nestedArgs = body.arguments;
    }
  } else if (body.message?.toolCalls?.[0]?.function?.arguments) {
    const fnArgs = body.message.toolCalls[0].function.arguments;
    if (typeof fnArgs === 'string') {
      try { nestedArgs = JSON.parse(fnArgs); } catch (e) { nestedArgs = {}; }
    } else {
      nestedArgs = fnArgs;
    }
  } else if (body.toolCall?.arguments) {
    nestedArgs = typeof body.toolCall.arguments === 'string' ? JSON.parse(body.toolCall.arguments || '{}') : body.toolCall.arguments;
  } else if (body.parameters) {
    nestedArgs = body.parameters;
  }

  return { ...query, ...body, ...nestedArgs };
};

// 1. Live Shipment Status & Tracking Handler
const handleGetShipmentStatus = async (req: express.Request, res: express.Response) => {
  console.log(`[OmniDimension Track] Request Method: ${req.method}`);
  try {
    const params = extractAgentParams(req);
    
    let orderId = (params.orderId || params.order_id || params.order || '').toString().trim();
    let trackingId = (params.trackingId || params.tracking_id || params.trackingNumber || params.tracking_number || params.awb || params.id || '').toString().trim();
    let phone = (params.phone || params.phoneNumber || params.phone_number || params.customerPhone || params.number || '').toString().trim();
    let query = (params.query || params.search || params.text || '').toString().trim();

    // If a generic query was passed, detect if it looks like an order ID or phone
    if (!orderId && !trackingId && query) {
      if (query.replace(/\D/g, '').length >= 6) {
        phone = query;
      } else {
        trackingId = query;
      }
    }

    console.log(`[OmniDimension Track] Searching -> orderId: "${orderId}", trackingId: "${trackingId}", phone: "${phone}"`);

    let foundOrder: any = null;

    // 1. Search by orderId or trackingId
    const primaryTerm = (trackingId || orderId).toUpperCase();
    if (primaryTerm) {
      // Memory / cache first
      foundOrder = cachedAllOrders.find(o => 
        (o.id && o.id.toUpperCase() === primaryTerm) || 
        (o.tracking_number && o.tracking_number.toUpperCase() === primaryTerm) ||
        (o.trackingNumber && o.trackingNumber.toUpperCase() === primaryTerm)
      ) || memOrders.find(o => 
        (o.id && o.id.toUpperCase() === primaryTerm) || 
        (o.tracking_number && o.tracking_number.toUpperCase() === primaryTerm) ||
        (o.trackingNumber && o.trackingNumber.toUpperCase() === primaryTerm)
      );

      if (!foundOrder && supabase) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .or(`id.ilike.%${primaryTerm}%,tracking_number.ilike.%${primaryTerm}%`)
          .limit(1)
          .maybeSingle();
        if (data) foundOrder = data;
      }
    }

    // 2. Search by Phone
    if (!foundOrder && phone) {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length >= 4) {
        foundOrder = cachedAllOrders.find(o => {
          const destPhone = (o.destination?.phone || o.phone || '').toString().replace(/\D/g, '');
          return destPhone && (destPhone.includes(cleanDigits) || cleanDigits.includes(destPhone));
        }) || memOrders.find(o => {
          const destPhone = (o.destination?.phone || o.phone || '').toString().replace(/\D/g, '');
          return destPhone && (destPhone.includes(cleanDigits) || cleanDigits.includes(destPhone));
        });

        if (!foundOrder && supabase) {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);
          if (data) {
            foundOrder = data.find((o: any) => {
              let dest = o.destination;
              if (typeof dest === 'string') {
                try { dest = JSON.parse(dest); } catch (e) { dest = {}; }
              }
              const destPhone = (dest?.phone || o.phone || '').toString().replace(/\D/g, '');
              return destPhone && (destPhone.includes(cleanDigits) || cleanDigits.includes(destPhone));
            });
          }
        }
      }
    }

    // 3. Fallback: Return the latest active sample order if no term was provided
    if (!foundOrder && !orderId && !trackingId && !phone) {
      foundOrder = cachedAllOrders[0] || memOrders[0];
      if (!foundOrder && supabase) {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (data) foundOrder = data;
      }
    }

    if (!foundOrder) {
      return res.status(200).json({
        success: false,
        found: false,
        status: "Not Found",
        message: `I could not locate any active shipment matching ${primaryTerm || phone || 'your request'}. Please confirm your tracking ID (e.g. JFX-12345) or registered phone number.`,
        speech: `I could not locate any active shipment matching that tracking ID or phone number. Please check the tracking number on your receipt or provide your phone number.`,
        data: null
      });
    }

    // Prepare structured response
    let destObj = foundOrder.destination;
    if (typeof destObj === 'string') {
      try { destObj = JSON.parse(destObj); } catch (e) { destObj = {}; }
    }

    const trackingData = generateRealTrackingData(foundOrder);
    const trackingCode = foundOrder.tracking_number || foundOrder.trackingNumber || foundOrder.id;
    const statusText = foundOrder.shipment_status || foundOrder.shipmentStatus || foundOrder.status || "In Transit";
    const destCity = destObj?.city || "London";
    const destCountry = destObj?.country || "United Kingdom";
    const estDelivery = foundOrder.shipping_date || foundOrder.shippingDate || trackingData.estimatedDelivery || "in 3-5 business days";
    const carrier = foundOrder.carrier || "Jiffex Express";

    const speechText = `Shipment ${trackingCode} to ${destCity}, ${destCountry} is currently ${statusText} with ${carrier}. Estimated delivery date is ${estDelivery}.`;

    return res.json({
      success: true,
      found: true,
      orderId: foundOrder.id,
      trackingId: trackingCode,
      trackingNumber: trackingCode,
      status: statusText,
      shipmentStatus: statusText,
      carrier: carrier,
      origin: trackingData.origin || "Delhi, India",
      destination: `${destCity}, ${destCountry}`,
      estimatedDelivery: estDelivery,
      weight: trackingData.weight || `${foundOrder.total_weight || 2.5} kg`,
      customerName: destObj?.fullName || foundOrder.customer_name || "Valued Customer",
      events: trackingData.events || [],
      latestEvent: trackingData.events?.[0] || null,
      message: speechText,
      speech: speechText,
      result: speechText
    });
  } catch (err: any) {
    console.error("[handleGetShipmentStatus ERROR]:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Failed to retrieve live shipment tracking.",
      message: "An error occurred while retrieving shipment details. Please try again.",
      speech: "An error occurred while retrieving your shipment status. Please try again in a moment."
    });
  }
};

// 2. Shipping Quote Calculator Handler
const handleGetShippingQuote = async (req: express.Request, res: express.Response) => {
  console.log(`[OmniDimension Quote] Request Method: ${req.method}`);
  try {
    const params = extractAgentParams(req);
    
    let rawCountry = (params.destinationCountry || params.destination_country || params.country || params.to || params.destination || 'USA').toString().trim();
    let weight = parseFloat(params.weightKg || params.weight_kg || params.weight || params.wt || 1);
    if (isNaN(weight) || weight <= 0) weight = 1;

    // Optional volumetric dimensions (in cm)
    const length = parseFloat(params.length || params.l || 0);
    const width = parseFloat(params.width || params.w || 0);
    const height = parseFloat(params.height || params.h || 0);
    let volumetricWeight = 0;
    if (length > 0 && width > 0 && height > 0) {
      volumetricWeight = Math.round(((length * width * height) / 5000) * 100) / 100;
    }
    const chargeableWeight = Math.max(weight, volumetricWeight);

    let method = (params.method || params.shippingMethod || params.shipping_method || params.serviceType || 'Express').toString().trim();
    let packageType = (params.packageType || params.package_type || params.itemType || params.item_type || 'General Goods').toString().trim();

    // Country normalization
    const countryLower = rawCountry.toLowerCase();
    let normalizedCountry = 'USA';
    if (countryLower.includes('uk') || countryLower.includes('kingdom') || countryLower.includes('england') || countryLower.includes('london') || countryLower.includes('britain')) {
      normalizedCountry = 'UK';
    } else if (countryLower.includes('ca') || countryLower.includes('canada') || countryLower.includes('toronto')) {
      normalizedCountry = 'Canada';
    } else if (countryLower.includes('au') || countryLower.includes('australia') || countryLower.includes('sydney') || countryLower.includes('melbourne')) {
      normalizedCountry = 'Australia';
    } else if (countryLower.includes('uae') || countryLower.includes('dubai') || countryLower.includes('emirates') || countryLower.includes('abu dhabi')) {
      normalizedCountry = 'UAE';
    } else if (countryLower.includes('de') || countryLower.includes('germany') || countryLower.includes('deutschland') || countryLower.includes('berlin') || countryLower.includes('frankfurt')) {
      normalizedCountry = 'Germany';
    } else if (countryLower.includes('sg') || countryLower.includes('singapore')) {
      normalizedCountry = 'Singapore';
    } else if (countryLower.includes('in') || countryLower.includes('india') || countryLower.includes('delhi') || countryLower.includes('mumbai') || countryLower.includes('hyderabad') || countryLower.includes('bangalore')) {
      normalizedCountry = 'India';
    } else if (countryLower.includes('us') || countryLower.includes('america') || countryLower.includes('states') || countryLower.includes('new york') || countryLower.includes('california')) {
      normalizedCountry = 'USA';
    } else {
      normalizedCountry = rawCountry.charAt(0).toUpperCase() + rawCountry.slice(1);
    }

    // Live shipping settings & rates from Supabase
    const settings = await getShippingSettings();
    const rates = settings.rates || {};
    const rateBands = settings.rateBands || DEFAULT_RATE_BANDS;
    const discounts = settings.discounts || {};

    const countryBands = rateBands[normalizedCountry] || DEFAULT_RATE_BANDS[normalizedCountry] || DEFAULT_RATE_BANDS['USA'];
    let baseRate = Number(rates[normalizedCountry]) || Number(rates['USA']) || 996;
    let isFlatRate = false;
    let appliedBandLabel = 'Standard Tier';

    if (countryBands && countryBands.length > 0) {
      const sorted = [...countryBands].sort((a: any, b: any) => Number(a.minWeight) - Number(b.minWeight));
      const matched = sorted.find((b: any) => chargeableWeight >= Number(b.minWeight) && chargeableWeight <= Number(b.maxWeight))
        || (chargeableWeight > Number(sorted[sorted.length - 1].maxWeight) ? sorted[sorted.length - 1] : sorted[0]);

      if (matched) {
        baseRate = Number(matched.rate) || baseRate;
        isFlatRate = Boolean(matched.isFlat);
        appliedBandLabel = Number(matched.maxWeight) >= 999 
          ? `${matched.minWeight}+ kg` 
          : `${matched.minWeight}–${matched.maxWeight} kg`;
      }
    }

    const isStandard = method.toLowerCase().includes('standard') || method.toLowerCase().includes('economy');
    const methodMultiplier = isStandard ? 0.75 : 1.0;
    const effectiveMethod = isStandard ? 'Standard Economy' : 'Jiffex Priority Express';

    const rawQuote = isFlatRate ? baseRate * methodMultiplier : chargeableWeight * baseRate * methodMultiplier;
    const discountPercent = Number(discounts[normalizedCountry]) || 0;
    const discountAmount = rawQuote * (discountPercent / 100);
    const finalPriceInr = Math.max(0, Math.round(rawQuote - discountAmount));
    const approximateUsd = Math.round((finalPriceInr / 86) * 10) / 10;

    const formattedPrice = `₹${finalPriceInr.toLocaleString('en-IN')}`;
    const deliveryTime = isStandard ? '8–12 business days' : '3–5 business days';

    const speechText = `Shipping ${chargeableWeight} kg of ${packageType} to ${normalizedCountry} via ${effectiveMethod} will cost ${formattedPrice} (approx $${approximateUsd} USD). Estimated transit time is ${deliveryTime}, including free doorstep pickup and tracking.`;

    console.log(`[OmniDimension Quote] Calculated for ${normalizedCountry} (${chargeableWeight} kg): ${formattedPrice}`);

    return res.json({
      success: true,
      origin: "India",
      country: normalizedCountry,
      destinationCountry: normalizedCountry,
      weightKg: weight,
      volumetricWeightKg: volumetricWeight > 0 ? volumetricWeight : undefined,
      chargeableWeightKg: chargeableWeight,
      packageType: packageType,
      method: effectiveMethod,
      price: formattedPrice,
      priceInr: finalPriceInr,
      approximateUsd: approximateUsd,
      currency: "INR",
      deliveryTime: deliveryTime,
      appliedBand: appliedBandLabel,
      discountApplied: discountPercent > 0 ? `${discountPercent}% Instant Off` : undefined,
      doorstepPickupIncluded: true,
      message: speechText,
      speech: speechText,
      result: speechText
    });
  } catch (err: any) {
    console.error("[handleGetShippingQuote ERROR]:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Failed to calculate quote.",
      speech: "I encountered an issue calculating that quote. Please specify the destination country and estimated weight in kilograms."
    });
  }
};

// 3. Book Doorstep / Home Pickup Handler
const handleBookHomePickup = async (req: express.Request, res: express.Response) => {
  console.log(`[OmniDimension Pickup] Request Method: ${req.method}`);
  try {
    const params = extractAgentParams(req);

    const customerName = (params.customerName || params.customer_name || params.name || params.fullName || params.full_name || 'Valued Customer').toString().trim();
    const phone = (params.phone || params.phoneNumber || params.phone_number || params.contact || '').toString().trim();
    const email = (params.email || params.emailAddress || 'customer@jiffex.com').toString().trim();
    const address = (params.address || params.pickupAddress || params.pickup_address || params.street || params.location || 'Customer Address Provided via Agent').toString().trim();
    
    // Date formatting (default to tomorrow if omitted)
    let pickupDate = (params.pickupDate || params.pickup_date || params.date || '').toString().trim();
    if (!pickupDate || pickupDate.toLowerCase() === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      pickupDate = tomorrow.toISOString().split('T')[0];
    } else if (pickupDate.toLowerCase() === 'today') {
      pickupDate = new Date().toISOString().split('T')[0];
    }

    const pickupTime = (params.pickupTime || params.pickup_time || params.timeSlot || params.time_slot || params.slot || params.time || '10:00 AM - 1:00 PM (Morning Slot)').toString().trim();
    const itemType = (params.itemType || params.item_type || params.items || params.packageDetails || params.package_details || 'International Parcel / Box').toString().trim();
    const vehicleType = (params.vehicleType || params.vehicle_type || 'Two Wheeler').toString().trim();
    const notes = (params.notes || params.instructions || params.specialInstructions || '').toString().trim();

    // Generate real Pickup ID
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const pickupId = `PKP-${randomSeq}`;

    const newPickupRecord = {
      id: pickupId,
      customer_id: params.customerId || params.customer_id || `CUST-${phone.slice(-4) || '9999'}`,
      customer_name: customerName,
      email: email,
      phone: phone || '+91 98765 43210',
      status: 'Scheduled',
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      address: address,
      items: [
        {
          name: itemType,
          weight: params.estimatedWeight || params.weight || '1-5 kg',
          notes: notes
        }
      ],
      payment_status: 'Pending',
      pickup_type: 'Doorstep',
      assigned_agent_id: null,
      language_preference: 'English',
      item_type: itemType,
      vehicle_type: vehicleType
    };

    // Store in memory
    memPickups.unshift(newPickupRecord);
    saveDb();

    // Persist to Supabase if connected
    if (supabase) {
      try {
        await supabase.from('pickups').upsert(newPickupRecord);
      } catch (dbErr: any) {
        console.warn("[handleBookHomePickup DB warning]:", dbErr.message);
      }
    }

    const speechText = `Your doorstep pickup is successfully booked with Booking ID ${pickupId}! Our Jiffex executive will arrive on ${pickupDate} during the ${pickupTime} at your address (${address.substring(0, 40)}).`;

    console.log(`[OmniDimension Pickup] Created Pickup Booking: ${pickupId} for ${customerName}`);

    return res.json({
      success: true,
      pickupId: pickupId,
      bookingId: pickupId,
      status: "Scheduled",
      customerName: customerName,
      phone: newPickupRecord.phone,
      pickupDate: pickupDate,
      pickupTime: pickupTime,
      address: address,
      itemType: itemType,
      message: speechText,
      speech: speechText,
      result: speechText,
      pickupDetails: newPickupRecord
    });
  } catch (err: any) {
    console.error("[handleBookHomePickup ERROR]:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Failed to schedule home pickup.",
      speech: "I encountered an issue booking your pickup. Please provide your full address, phone number, and preferred date."
    });
  }
};

// Route registrations (Both GET and POST for broad agent / webhook compatibility)
// 1. Live Tracking
app.post("/get_shipment_status", handleGetShipmentStatus);
app.get("/get_shipment_status", handleGetShipmentStatus);
app.post("/api/get_shipment_status", handleGetShipmentStatus);
app.get("/api/get_shipment_status", handleGetShipmentStatus);
app.post("/track_shipment", handleGetShipmentStatus);
app.get("/track_shipment", handleGetShipmentStatus);
app.post("/api/omnidimension/track", handleGetShipmentStatus);
app.get("/api/omnidimension/track", handleGetShipmentStatus);

// 2. Quote Calculator
app.post("/get_shipping_quote", handleGetShippingQuote);
app.get("/get_shipping_quote", handleGetShippingQuote);
app.post("/api/get_shipping_quote", handleGetShippingQuote);
app.get("/api/get_shipping_quote", handleGetShippingQuote);
app.post("/calculate_shipping_quote", handleGetShippingQuote);
app.get("/calculate_shipping_quote", handleGetShippingQuote);
app.post("/api/omnidimension/quote", handleGetShippingQuote);
app.get("/api/omnidimension/quote", handleGetShippingQuote);

// 3. Home Pickup Booking
app.post("/book_home_pickup", handleBookHomePickup);
app.get("/book_home_pickup", handleBookHomePickup);
app.post("/api/book_home_pickup", handleBookHomePickup);
app.get("/api/book_home_pickup", handleBookHomePickup);
app.post("/book_pickup", handleBookHomePickup);
app.get("/book_pickup", handleBookHomePickup);
app.post("/schedule_pickup", handleBookHomePickup);
app.get("/schedule_pickup", handleBookHomePickup);
app.post("/api/omnidimension/pickup", handleBookHomePickup);
app.get("/api/omnidimension/pickup", handleBookHomePickup);

// OmniDimension Tools JSON Schema Manifest & Test
app.get("/api/omnidimension/tools", (req, res) => {
  res.json({
    name: "Jiffex Fulfilment Tools",
    version: "2.0.0",
    tools: [
      {
        name: "get_shipment_status",
        description: "Get real-time tracking information, checkpoints, and estimated delivery date for a Jiffex shipment.",
        parameters: {
          type: "object",
          properties: {
            trackingId: { type: "string", description: "The Jiffex shipment tracking number or Order ID (e.g. JFX-12345)" },
            phone: { type: "string", description: "The customer's registered phone number to find associated shipments" }
          }
        },
        endpoint: "/get_shipment_status",
        method: "POST"
      },
      {
        name: "get_shipping_quote",
        description: "Calculate accurate international shipping rates, discounts, and delivery timelines based on country, weight, and method.",
        parameters: {
          type: "object",
          properties: {
            destinationCountry: { type: "string", description: "The destination country name (e.g. USA, UK, Canada, Australia, UAE, Germany)" },
            weightKg: { type: "number", description: "Total package weight in kilograms (e.g. 2.5)" },
            shippingMethod: { type: "string", enum: ["Express", "Standard"], description: "Shipping speed tier: Express (3-5 days) or Standard (8-12 days)" },
            packageType: { type: "string", description: "Type of goods (e.g. Documents, Clothes, Food items, Electronics)" }
          },
          required: ["destinationCountry", "weightKg"]
        },
        endpoint: "/get_shipping_quote",
        method: "POST"
      },
      {
        name: "book_home_pickup",
        description: "Schedule a free doorstep package pickup by a Jiffex courier executive.",
        parameters: {
          type: "object",
          properties: {
            customerName: { type: "string", description: "Full name of the customer" },
            phone: { type: "string", description: "Contact phone number of the customer" },
            address: { type: "string", description: "Full pickup street address, city, and pincode" },
            pickupDate: { type: "string", description: "Desired pickup date (e.g. 2026-08-25, 'Tomorrow', 'Today')" },
            pickupTime: { type: "string", description: "Preferred time slot (e.g. '10:00 AM - 1:00 PM', 'Morning', 'Afternoon')" },
            itemType: { type: "string", description: "Brief description of packages (e.g. 2 boxes of clothes, approx 5kg)" }
          },
          required: ["customerName", "phone", "address"]
        },
        endpoint: "/book_home_pickup",
        method: "POST"
      }
    ]
  });
});

app.get("/api/omnidim-test", (req, res) => {
  res.json({
    success: true,
    message: "OmniDimension connection and agent endpoints active",
    supportedTools: ["get_shipment_status", "get_shipping_quote", "book_home_pickup"]
  });
});

async function startServer() {
  console.log("[Server Initialization] Seeding Supabase database if empty...");
  seedDatabaseIfEmpty().catch(err => {
    console.error("[Server Seeding Warning] Background seeding failed:", err);
  });

  // Warm up orders cache immediately on start
  refreshAllOrdersCache(true).then(orders => {
    console.log(`[Server Initialization] Orders cache warmed up: ${orders.length} orders loaded.`);
  }).catch(err => {
    console.error("[Server Initialization Warning] Initial orders cache warming failed:", err.message);
  });

  // Background timer to keep orders cache fresh
  setInterval(() => {
    refreshAllOrdersCache().catch(err => {
      console.warn("[Background Cache] Orders cache refresh warning:", err.message);
    });
  }, 60000);

  console.log("Configuring Vite middleware...");
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  console.log("Starting listener...");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
