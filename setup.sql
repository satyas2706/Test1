-- JiffEX Database Setup SQL
-- Run this in your Supabase SQL Editor

-- Create the 'items' table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  weight DECIMAL NOT NULL,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  price DECIMAL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'orders' table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  items JSONB NOT NULL,
  total_weight DECIMAL NOT NULL,
  total_cost DECIMAL NOT NULL,
  status TEXT NOT NULL,
  destination JSONB NOT NULL,
  payment_status TEXT NOT NULL,
  shipping_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
-- In production, you should restrict these to authenticated users
CREATE POLICY "Allow public read items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow public insert items" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update items" ON items FOR UPDATE USING (true);

CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE USING (true);
