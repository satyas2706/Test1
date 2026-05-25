export type UserRole = 'admin' | 'agent' | 'customer' | 'customer_service' | 'webmaster';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
}

export type ShippingStatus = 
  | 'Request Placed'
  | 'Order Confirmed'
  | 'Processing Order'
  | 'Consolidating items'
  | 'Packed'
  | 'Ready to Ship'
  | 'Pending' 
  | 'Scheduled' 
  | 'Picked Up' 
  | 'In Warehouse' 
  | 'Received at Warehouse'
  | 'Awaiting Warehouse Arrival'
  | 'In Transit' 
  | 'Out for Delivery' 
  | 'Delivered' 
  | 'Pending Pickup'
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
  purchaseSource?: string;
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
  payment_status?: 'Pending' | 'Paid' | 'Pay at Home' | 'Payment on Arrival';
  paymentStatus?: 'Pending' | 'Paid' | 'Pay at Home' | 'Payment on Arrival';
  shipping_date?: string;
  shippingDate?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedAgent?: AgentProfile;
  assignedAgentId?: string;
  documents?: { id: string; name: string; image: string; type: string; uploadedAt: string }[];
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
  documents?: { id: string; name: string; image: string; type: string; uploadedAt: string }[];
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
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  material?: string;
  origin?: string;
  estimatedDelivery?: string;
}

export interface TicketComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  customerEmail: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  comments?: TicketComment[];
}

export interface RefundRequest {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'Refunded' | 'Rejected';
  requestedAt: string;
}
