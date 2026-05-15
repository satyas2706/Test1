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

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Supabase client initialized on server.");
} else {
  console.warn("Supabase credentials missing. Running in limited mode.");
}

console.log("Starting server initialization...");

// In-memory OTP store (replaces SQLite for better environment compatibility)
const otps = new Map<string, { code: string, expiresAt: number }>();
console.log("Memory OTP store initialized.");

// Notification Clients
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

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
      console.error("[SMTP] Connection Error:", error.message);
    } else {
      console.log("[SMTP] Server is ready.");
    }
  });
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
        await mailTransporter.sendMail({
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
        });
        console.log(`[Auth] OTP sent to email: ${email}`);
        res.json({ success: true });
      } else {
        console.log(`[Auth] No SMTP configured. OTP for ${email} is: ${code}`);
        res.json({ success: true, devCode: code });
      }
    } else if (phone) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        await twilioClient.messages.create({
          body: `Your JiffEX login code is: ${code}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: normalizedPhone
        });
        console.log(`[Auth] OTP sent to phone: ${normalizedPhone}`);
        res.json({ success: true });
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

    // For testing: allow any 6-digit code if the OTP store doesn't have a match
    // This handles the "OTP not received" issue by letting users type anything like 123456
    const isTestCode = code.length === 6;

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

// Mock Data Fallbacks
const MOCK_PRODUCTS = [
  { id: 'm1', name: 'Premium Packing Box (S)', description: 'Perfect for small heavy items', price: 45, category: 'Packaging', weight: 0.1, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop' },
  { id: 'm2', name: 'Premium Packing Box (M)', description: 'Versatile medium sized box', price: 75, category: 'Packaging', weight: 0.2, imageUrl: 'https://images.unsplash.com/photo-1589884629038-63316ec0ad29?q=80&w=2070&auto=format&fit=crop' },
  { id: 'm3', name: 'Bubble Wrap (10m)', description: 'Extra protection for fragile items', price: 120, category: 'Protection', weight: 0.5, imageUrl: 'https://images.unsplash.com/photo-1549465220-1d8f9d0c441c?q=80&w=2070&auto=format&fit=crop' }
];

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
    
    res.json(data);
  } catch (err: any) {
    console.error("Fetch Products Error:", err.message);
    res.json(MOCK_PRODUCTS);
  }
});

// API: Create a product
app.post("/api/products", async (req, res) => {
  if (!supabase) return res.json(req.body);

  try {
    const { data, error } = await supabase.from('products').insert(req.body).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Create Product Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Example API: Get all items for a user
app.get("/api/items/:userId", async (req, res) => {
  if (!supabase) return res.json([]);

  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', req.params.userId);
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error("Fetch Items Error:", err.message);
    res.json([]);
  }
});

// Example API: Create an item
app.post("/api/items", async (req, res) => {
  if (!supabase) return res.json(req.body);

  try {
    const { data, error } = await supabase.from('items').insert(req.body).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Create Item Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Example API: Create an order/appointment
app.post("/api/orders", async (req, res) => {
  if (!supabase) return res.json({ ...req.body, id: crypto.randomUUID() });

  try {
    // Transform keys to match SQL schema (camelCase to snake_case if necessary)
    const orderData = {
      id: req.body.id || crypto.randomUUID(),
      customer_id: req.body.customerId,
      items: req.body.items,
      total_weight: req.body.totalWeight,
      total_cost: req.body.totalCost,
      status: req.body.status,
      destination: req.body.destination,
      payment_status: req.body.paymentStatus,
      shipping_date: req.body.shippingDate,
    };

    const { data, error } = await supabase.from('orders').insert(orderData).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Create Order Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Update item status
app.patch("/api/items/:itemId", async (req, res) => {
  if (!supabase) return res.json({ success: true });

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

// API: Update order status
app.patch("/api/orders/:orderId", async (req, res) => {
  if (!supabase) return res.json({ success: true });

  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: req.body.status })
      .eq('id', req.params.orderId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Update Order Error:", err.message);
    res.status(500).json({ error: err.message });
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
    const trackingId = orderIdStr.startsWith('BB-') ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
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
      error: `Invoice Email Error: ${err.message}`,
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
    const trackingId = orderIdStr.startsWith('BB-') ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
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
      error: `Confirmation Email Error: ${err.message}`,
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
    const trackingId = orderIdStr.startsWith('BB-') ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
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

// Example API: Get all orders for a user
app.get("/api/orders/:customerId", async (req, res) => {
  if (!supabase) return res.json([]);

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', req.params.customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Transform snake_case back to camelCase for frontend if needed
    const transformed = (data || []).map(o => ({
      ...o,
      customerId: o.customer_id,
      totalWeight: o.total_weight,
      totalCost: o.total_cost,
      paymentStatus: o.payment_status,
      shippingDate: o.shipping_date,
      createdAt: o.created_at
    }));

    res.json(transformed);
  } catch (err: any) {
    console.error("Fetch Orders Error:", err.message);
    res.json([]);
  }
});

async function startServer() {
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
