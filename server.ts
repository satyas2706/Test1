import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase Client (Server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", supabaseConnected: !!supabase });
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
  console.log("Order created successfully:", data[0].id);
  res.json(data[0]);
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
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("⚠️ Supabase credentials missing. API routes will fail.");
    }
  });
}

startServer();
