export type UserRole = 'admin' | 'agent' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
}

export type ShippingStatus = 
  | 'Pending' 
  | 'Scheduled' 
  | 'Picked Up' 
  | 'In Warehouse' 
  | 'Received at Warehouse'
  | 'In Transit' 
  | 'Out for Delivery' 
  | 'Delivered' 
  | 'Cancelled';

export interface ShippingItem {
  id: string;
  name: string;
  weight: number;
  quantity?: number;
  isFragile?: boolean;
  fragile?: boolean;
  invoiceNumber?: string;
  remarks?: string;
  status: ShippingStatus;
  source: 'Pickup' | 'Warehouse' | 'Store';
  submitted?: boolean;
  price?: number;
  image?: string;
}

export interface DestinationAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  customerId?: string;
  items: ShippingItem[];
  destination: DestinationAddress;
  total_weight?: number;
  totalWeight?: number;
  total_cost?: number;
  totalCost?: number;
  status: ShippingStatus;
  payment_status?: 'Pending' | 'Paid';
  paymentStatus?: 'Pending' | 'Paid';
  shipping_date?: string;
  shippingDate?: string;
  created_at?: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  customer_id?: string;
  customerId?: string;
  customerName: string;
  date: string;
  time: string;
  address: string;
  phone: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  items?: ShippingItem[];
  paymentStatus: 'Pending' | 'Paid';
  pickupType: 'AllAgent' | 'Mixed';
  assignedAgent?: AgentProfile;
  assignedAgentId?: string;
  languagePreference?: string;
  itemType?: string;
  vehicleType?: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive' | 'On Delivery';
  vehicleNumber?: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  weight: number;
  description?: string;
  estimatedDelivery?: string;
}
