import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import twilio from "twilio";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase Client (Server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client initialized successfully.");
  } catch (err: any) {
    console.error("Failed to initialize Supabase client:", err.message);
  }
} else {
  console.warn("⚠️ Supabase URL or Key is missing or invalid. Database features will be disabled.");
}

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
  console.log("Email service (SMTP) initialized successfully.");
} else {
  console.warn("⚠️ Email service (SMTP) is not configured. Invoices will not be sent.");
}

// Notification Helper
async function sendNotification(userId: string, event: string, message: string, channels: string[], recipientInfo?: { email?: string, phone?: string }) {
  console.log(`[Notification] User: ${userId}, Event: ${event}, Message: ${message}, Channels: ${channels.join(', ')}`);
  
  // Store in database for history
  if (supabase) {
    try {
      await supabase.from('notifications').insert([{
        user_id: userId,
        event_type: event,
        message,
        channels,
        status: 'sent',
        created_at: new Date().toISOString()
      }]);
    } catch (err: any) {
      console.error('Failed to save notification to DB:', err.message);
    }
  }

  const promises = [];

  if (channels.includes('SMS') && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    const to = recipientInfo?.phone || '+919999999999';
    promises.push(
      twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      }).catch(err => console.error('SMS Error:', err.message))
    );
  }

  if (channels.includes('whatsapp') && twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
    const to = recipientInfo?.phone ? `whatsapp:${recipientInfo.phone}` : 'whatsapp:+919999999999';
    promises.push(
      twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to
      }).catch(err => console.error('WhatsApp Error:', err.message))
    );
  }

  if (channels.includes('Email') && mailTransporter && process.env.SMTP_FROM) {
    const to = recipientInfo?.email || 'user@example.com';
    promises.push(
      mailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: `JiffEX Notification: ${event}`,
        text: message
      }).catch(err => console.error('Email Error:', err.message))
    );
  }

  await Promise.all(promises);
}

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/health", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ status: "error", error: "Supabase not configured" });
  }
  
  try {
    // Try a simple query to verify connection
    const { error } = await supabase.from('notifications').select('count', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: "ok", supabaseConnected: true });
  } catch (error: any) {
    console.error('Supabase Health Check Error:', error.message);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Example API: Get all items for a user
app.get("/api/items/:userId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", req.params.userId);
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Example API: Create an item
app.post("/api/items", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  
  // Sanitize input to match table schema (remove extra fields like 'image')
  const { id, user_id, name, weight, status, source, price } = req.body;
  const itemToInsert = { id, user_id, name, weight, status, source, price };

  const { data, error } = await supabase
    .from("items")
    .insert([itemToInsert])
    .select();
    
  if (error) {
    console.error("Supabase Insert Error (items):", error.message);
    return res.status(400).json({ error: error.message });
  }
  res.json(data[0]);
});

// Example API: Create an order/appointment
app.post("/api/orders", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  
  console.log("Creating order with payload:", JSON.stringify(req.body, null, 2));

  // Sanitize input to match table schema
  const { id, customer_id, items, total_weight, total_cost, status, destination, payment_status, shipping_date } = req.body;
  const orderToInsert = { id, customer_id, items, total_weight, total_cost, status, destination, payment_status, shipping_date };

  const { data, error } = await supabase
    .from("orders")
    .insert([orderToInsert])
    .select();
    
  if (error) {
    console.error("Supabase Insert Error (orders):", error.message, error.details, error.hint);
    return res.status(400).json({ error: error.message });
  }

  // Trigger Notification: Shipment dispatched (if status is 'Dispatched') or Pickup confirmed (if it's an appointment)
  if (status === 'Scheduled') {
    await sendNotification(customer_id, 'Pickup confirmed', `Your agent pickup for ${destination.city}, ${destination.country} has been confirmed.`, ['SMS', 'Email', 'whatsapp'], { email: destination.email, phone: destination.phone });
  } else if (status === 'Dispatched') {
    await sendNotification(customer_id, 'Shipment dispatched', `Your shipment BB-${id.slice(0,8)} has been dispatched to ${destination.city}, ${destination.country}.`, ['SMS', 'Email', 'whatsapp'], { email: destination.email, phone: destination.phone });
  }

  console.log("Order created successfully:", data[0].id);
  res.json(data[0]);
});

// API: Update item status (trigger notification)
app.patch("/api/items/:itemId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  
  const { status, user_id, name, email, phone } = req.body;
  const { data, error } = await supabase
    .from("items")
    .update({ status })
    .eq("id", req.params.itemId)
    .select();

  if (error) return res.status(400).json({ error: error.message });

  if (status === 'Received at Warehouse') {
    await sendNotification(user_id, 'Package received at warehouse', `Your item "${name}" has been safely received at our warehouse.`, ['SMS', 'Email', 'whatsapp'], { email, phone });
  }

  res.json(data[0]);
});

// API: Update order status (trigger notification)
app.patch("/api/orders/:orderId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  
  const { status, customer_id, destination } = req.body;
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", req.params.orderId)
    .select();

  if (error) return res.status(400).json({ error: error.message });

  // Send WhatsApp notification for status update
  const message = `Your JiffEX order ${req.params.orderId} status has been updated to: ${status}.`;
  await sendNotification(customer_id, 'Order Status Updated', message, ['whatsapp'], { 
    email: destination?.email, 
    phone: destination?.phone 
  });

  res.json(data[0]);
});

// API: Simulate Delivery Notifications
app.post("/api/notifications/simulate", async (req, res) => {
  const { userId, event, message, email, phone } = req.body;
  await sendNotification(userId, event, message, ['SMS', 'Email', 'whatsapp'], { email, phone });
  res.json({ success: true });
});

// API: Share Invoice via Email
app.post("/api/invoice/share", async (req, res) => {
  const { email, orderId, invoiceDetails } = req.body;
  
  if (!mailTransporter || !process.env.SMTP_FROM) {
    return res.status(503).json({ error: "Email service not configured" });
  }

  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `JiffEX Invoice: ${orderId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">JiffEX Shipping & Logistics</h2>
          <h3>Tax Invoice</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <hr />
          <h4>Shipment Summary</h4>
          <pre style="background: #f8fafc; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${invoiceDetails}</pre>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            Thank you for choosing JiffEX. For any queries, please contact our support.
          </p>
        </div>
      `
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Email Share Error:', err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// API: Get notification history
app.get("/api/notifications/:userId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.params.userId)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Example API: Get all orders for a user
app.get("/api/orders/:customerId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", req.params.customerId);
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

async function startServer() {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("⚠️ Supabase credentials missing. API routes will fail.");
    }
  });
}

startServer();
