
export type UserRole = 'Admin' | 'Customer' | 'Agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ShippingStatus = 'Pending' | 'Ready for Collection' | 'Processing' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Received at Warehouse';

export interface ShippingItem {
  id: string;
  name: string;
  weight: number;
  image?: string;
  status: ShippingStatus;
  source: 'Pickup' | 'Store' | 'Warehouse';
  price?: number;
  quantity?: number;
  fragile?: boolean;
  submitted?: boolean;
  invoiceNumber?: string;
  remarks?: string;
  estimatedDelivery?: string;
}

export interface ShippingQuote {
  country: string;
  weight: number;
  estimatedCost: number;
}

export interface AgentProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  vehicleNumber?: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  address: string;
  phone: string;
  customerName?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  items: ShippingItem[];
  paymentStatus: 'Pending' | 'Paid';
  orderId?: string;
  assignedAgentId?: string;
  assignedAgent?: AgentProfile;
  customerId: string;
  pickupType?: 'AllAgent' | 'Mixed';
  languagePreference?: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: ShippingItem[];
  totalWeight: number;
  totalCost: number;
  status: ShippingStatus;
  createdAt: string;
  shippingDate?: string;
  destination: DestinationAddress;
  paymentStatus: 'Pending' | 'Paid';
}

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  category: 'Pooja' | 'Return Gifts' | 'Decorative';
  image: string;
  weight: number;
  estimatedDelivery?: string;
}

export interface DestinationAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
