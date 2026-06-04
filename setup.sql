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

-- Create the 'products' table for the store
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  weight DECIMAL NOT NULL,
  description TEXT,
  dimensions JSONB,
  material TEXT,
  origin TEXT,
  estimated_delivery TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON products FOR DELETE USING (true);

-- Create the 'agents' table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  vehicle_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for agents
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
CREATE POLICY "Allow public read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Allow public insert agents" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update agents" ON agents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete agents" ON agents FOR DELETE USING (true);

-- Create the 'agent_logs' table for logging all admin actions performed on agents
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'DEASSIGN'
  agent_id TEXT,
  agent_name TEXT,
  details JSONB,
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for agent_logs
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for security-exempt dev setup)
CREATE POLICY "Allow public read agent_logs" ON agent_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert agent_logs" ON agent_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update agent_logs" ON agent_logs FOR UPDATE USING (true);

-- Create the 'customer_profiles' table for saving and auto-filling pickup/profile details
CREATE TABLE IF NOT EXISTS customer_profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  street TEXT,
  apartment TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for customer_profiles
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Public access policies for development
CREATE POLICY "Allow public read customer_profiles" ON customer_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert customer_profiles" ON customer_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update customer_profiles" ON customer_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete customer_profiles" ON customer_profiles FOR DELETE USING (true);

-- ENABLE REALTIME
-- To view tables in the "Database -> Replication" section of Supabase Dashboard:
-- 1. Create the publication if it doesn't exist
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- 2. Add the tables you want to enable real-time for
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE customer_profiles;

-- Create 'shipping_settings' table
CREATE TABLE IF NOT EXISTS shipping_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  rates JSONB NOT NULL,
  discounts JSONB NOT NULL,
  coupons JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for shipping_settings
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
CREATE POLICY "Allow public read shipping_settings" ON shipping_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert shipping_settings" ON shipping_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update shipping_settings" ON shipping_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete shipping_settings" ON shipping_settings FOR DELETE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE shipping_settings;


-- OPTIONAL: If you want to enable it for ALL current and future tables
-- ALTER PUBLICATION supabase_realtime SET FOR ALL TABLES;
