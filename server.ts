import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import twilio from "twilio";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import path from "path";

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
  console.log("Email service (SMTP) initialized. Verifying connection...");
  mailTransporter.verify((error: any, success: any) => {
    if (error) {
      console.error("[SMTP] Connection Error:", error.message);
    } else {
      console.log("[SMTP] Server is ready to take our messages");
    }
  });
} else {
  console.warn("⚠️ Email service (SMTP) is not configured. Invoices will not be sent.");
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
    await sendNotification(customer_id, 'Pickup confirmed', `Your agent pickup for ${destination.city}, ${destination.country} has been confirmed.`, ['SMS', 'Email', 'whatsapp'], { 
      email: destination.email, 
      phone: destination.phone,
      fullName: destination.fullName,
      orderId: id,
      pickupDate: shipping_date,
      pickupTime: req.body.time, // Appointments have time field
      pickupAddress: destination.addressLine1
    });
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

  // Send WhatsApp and Email notification for status update
  const message = `Your JiffEX order ${req.params.orderId} status has been updated to: ${status}.`;
  await sendNotification(customer_id, 'Order Status Updated', message, ['whatsapp', 'Email'], { 
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

// API: Share Invoice via Email (PDF Attachment)
app.post("/api/invoice/send-pdf", async (req, res) => {
  const { email, order, companyDetails } = req.body;
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

    const orderShortId = order.id.slice(0, 8).toUpperCase();
    const appUrl = process.env.APP_URL || "https://www.jiffex.com";
    const trackingUrl = `${appUrl}?tab=track&id=BB-${orderShortId}`;
    
    const subject = `Invoice for your JiffEX Order: BB-${orderShortId}`;
    const bodyText = `
Dear ${order.destination.fullName},

Thank you for choosing JiffEX for your shipping needs. 

We are pleased to inform you that your payment has been successfully processed. Please find the attached tax invoice for your order BB-${orderShortId}.

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
  <p>We are pleased to inform you that your payment has been successfully processed. Please find the attached tax invoice for your order <strong>BB-${orderShortId}</strong>.</p>
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

    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: subject,
      text: bodyText,
      html: bodyHtml,
      attachments: [
        {
          filename: `Invoice_BB-${orderShortId}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    console.log(`[Invoice PDF] Invoice ${order.id} successfully sent to ${email}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[Invoice PDF] Error:`, err.message);
    res.status(500).json({ error: "Failed to generate or send invoice" });
  }
});

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
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
    doc.font("Helvetica").text(`INV-${order.id.slice(0, 8).toUpperCase()}`, 150, infoTop);
    
    doc.font("Helvetica-Bold").text(`Invoice Date:`, 50, infoTop + 15);
    doc.font("Helvetica").text(`${new Date(order.created_at || new Date()).toLocaleDateString()}`, 150, infoTop + 15);
    
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
    order.items.forEach((item: any) => {
      doc.text(item.name, 50, y);
      doc.text((item.quantity || 1).toString(), 300, y, { width: 40, align: 'center' });
      doc.text(`${item.weight} kg`, 360, y, { width: 80, align: 'center' });
      doc.text(`₹${(item.price || 0).toLocaleString()}`, 460, y, { width: 80, align: 'right' });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown(2);

    // Shipping Details
    const shippingTop = doc.y;
    doc.fontSize(12).font("Helvetica-Bold").text("Shipping Details", 50, shippingTop);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Service Type: ${order.items[0]?.source || 'Standard Shipping'}`, 50, shippingTop + 20);
    doc.text(`Origin: India`, 50, shippingTop + 35);
    doc.text(`Destination: ${order.destination.country}`, 50, shippingTop + 50);
    doc.text(`Tracking ID: BB-${order.id.slice(0, 8).toUpperCase()}`, 50, shippingTop + 65);

    // Cost Breakdown
    const costTop = shippingTop;
    doc.fontSize(12).font("Helvetica-Bold").text("Cost Breakdown", 350, costTop);
    
    const productCost = order.items.reduce((acc: number, i: any) => acc + (i.price || 0), 0);
    const shippingCharges = order.total_cost - productCost;
    
    doc.fontSize(10).font("Helvetica");
    doc.text(`Product Cost:`, 350, costTop + 20);
    doc.text(`₹${productCost.toLocaleString()}`, 460, costTop + 20, { width: 80, align: 'right' });
    
    doc.text(`Packing Charges:`, 350, costTop + 35);
    doc.text(`₹0`, 460, costTop + 35, { width: 80, align: 'right' });
    
    doc.text(`Shipping Charges:`, 350, costTop + 50);
    doc.text(`₹${shippingCharges.toLocaleString()}`, 460, costTop + 50, { width: 80, align: 'right' });
    
    doc.text(`Taxes:`, 350, costTop + 65);
    doc.text(`₹0`, 460, costTop + 65, { width: 80, align: 'right' });
    
    doc.moveTo(350, costTop + 80).lineTo(550, costTop + 80).stroke();
    doc.font("Helvetica-Bold").text(`Total Paid:`, 350, costTop + 85);
    doc.text(`₹${order.total_cost.toLocaleString()}`, 460, costTop + 85, { width: 80, align: 'right' });

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
