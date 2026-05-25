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

// In-memory data store for fallback when Supabase is disconnected
const memOrders: any[] = [];
const memItems: any[] = [];
console.log("Memory Orders and Items stores initialized.");

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

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'shipping_settings.json');

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

const getShippingSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.discounts) {
        parsed.discounts = {};
        const ratesObj = parsed.rates || DEFAULT_SHIPPING_SETTINGS.rates;
        Object.keys(ratesObj).forEach(country => {
          parsed.discounts[country] = parsed.discountPercent || 0;
        });
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading shipping settings:", err);
  }
  return DEFAULT_SHIPPING_SETTINGS;
};

const saveShippingSettings = (settings: any) => {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error saving shipping settings:", err);
    return false;
  }
};

app.get("/api/settings/shipping", (req, res) => {
  res.json(getShippingSettings());
});

app.post("/api/settings/shipping", (req, res) => {
  const { rates, discounts } = req.body;
  const current = getShippingSettings();
  
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
  
  saveShippingSettings(current);
  res.json(current);
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
  if (!supabase) {
    const userItems = memItems.filter(i => {
      const uId = i.user_id || i.userId || i.customer_id || i.customerId;
      return String(uId) === String(req.params.userId);
    });
    return res.json(userItems);
  }

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

    console.log(`[SUPABASE] Inserting schema-compliant order with ID: ${finalId}`);
    const { data, error } = await supabase.from('orders').insert(databaseOrderData).select().single();
    if (error) {
      console.warn(`[SUPABASE] Schema insert failed, retrying with full object just in case. Error: ${error.message}`);
      
      const fullOrderData = {
        ...databaseOrderData,
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
      if (fbError) throw fbError;
      return res.json(fbData);
    }
    res.json(data);
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
      .single();
      
    if (getError || !currentOrder) {
      throw getError || new Error("Order not found");
    }
    
    let parsedDestination = currentOrder.destination || {};
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

    // Filter down to only columns that are guaranteed to exist in the orders postgres schema
    const databaseUpdates: any = {
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
      const { data, error } = await supabase
        .from('orders')
        .select('id');
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
  };
};

// API: Get all orders (Admin only)
app.get("/api/orders", async (req, res) => {
  if (!supabase) {
    return res.json(memOrders.map(transformDbOrder));
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Transform snake_case back to camelCase for frontend
    const transformed = (data || []).map(transformDbOrder);

    res.json(transformed);
  } catch (err: any) {
    console.error("Fetch All Orders Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Public Tracking (No Auth required)
app.get("/api/orders/track/:orderId", async (req, res) => {
  if (!supabase) {
    const { orderId } = req.params;
    const found = memOrders.find(o => o.id === orderId);
    if (!found) return res.status(404).json({ error: "Order not found" });
    return res.json(transformDbOrder(found));
  }

  const { orderId } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Transform for frontend
    const transformed = transformDbOrder(data);

    res.json(transformed);
  } catch (err: any) {
    console.error("Tracking Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Example API: Get all orders for a user
app.get("/api/orders/:customerId", async (req, res) => {
  if (!supabase) {
    const customerId = req.params.customerId;
    const userOrders = memOrders.filter(o => {
      const cId = o.customer_id || o.customerId || o.destination?.customerId || o.destination?.customer_id;
      return String(cId) === String(customerId);
    });
    return res.json(userOrders.map(transformDbOrder));
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', req.params.customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    const transformed = (data || []).map(transformDbOrder);

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
