/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Logo } from './components/Logo';
import { MobilePickupFlow } from './components/MobilePickupFlow';
import { SinglePagePickupForm } from './components/SinglePagePickupForm';
import { MobileDropOffFlow } from './components/MobileDropOffFlow';
import { RateBand, CountryRateBands } from './types';
import { DEFAULT_RATE_BANDS, calculateShippingCost } from './utils/shipping';
import { 
  Package, 
  PackageCheck, 
  Truck, 
  Store, 
  Calculator, 
  Calendar, 
  Car,
  Box,
  Boxes,
  MapPin, 
  CreditCard, 
  AlertTriangle, 
  Sparkles,
  TrendingUp,
  Banknote,
  CheckCircle,
  AlertCircle,
  PieChart as PieChartIcon,
  Plus, 
  Minus,
  PlusCircle,
  Trash2, 
  Ticket as TicketIcon,
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Globe,
  LogIn,
  Share,
  ShieldCheck,
  Printer,
  Copy,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Camera,
  User as UserIcon,
  ExternalLink,
  ShoppingBag,
  Info,
  LayoutDashboard,
  History,
  Home,
  Users,
  BarChart3,
  Search,
  ArrowRight,
  Download,
  Mail,
  Phone,
  Settings2,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowDown,
  LogOut,
  Zap,
  Database,
  Plane,
  PackagePlus,
  Send,
  Loader2,
  Check,
  Upload,
  XCircle,
  Cpu,
  Shield,
  Bell,
  Heart,
  Lock,
  MessageSquare,
  MessageCircle,
  SlidersHorizontal,
  ArrowUpDown,
  HelpCircle,
  ShoppingCart,
  Warehouse,
  Menu,
  Save,
  Pencil,
  Headphones,
  Flame,
  Wine,
  ShieldAlert,
  BatteryCharging,
  FlaskConical,
  Mic,
  Bot,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShippingItem, 
  ShippingStatus, 
  StoreProduct, 
  DestinationAddress,
  Appointment,
  User,
  UserRole,
  Order,
  AgentProfile,
  Ticket,
  TicketComment,
  RefundRequest
} from './types';
import { 
  SHIPPING_RATES, 
  COUNTRIES, 
  STORE_PRODUCTS, 
  PROHIBITED_ITEMS, 
  SHIPPING_DATES,
  PICKUP_SLOTS,
  WAREHOUSE_ADDRESS,
  COMPANY_DETAILS
} from './constants';
import { api } from './services/api';
import { supabase, isSupabaseConfigured, updateSupabaseConfig } from './lib/supabase';
import { Login } from './components/Login';
import { Session } from '@supabase/supabase-js';
import AccountSection from './components/sections/AccountSection';
import AboutSection from './components/sections/AboutSection';
import { MobileStoreSection } from './components/sections/MobileStoreSection';
import { MobileCartSection } from './components/sections/MobileCartSection';

interface AutoScrollingShopProductsProps {
  storeProducts: any[];
  items: any[];
  addItem: (item: any, source: string) => void;
  removeStoreItem: (name: string) => void;
}

const AutoScrollingShopProducts: React.FC<AutoScrollingShopProductsProps> = ({
  storeProducts,
  items,
  addItem,
  removeStoreItem
}) => {
  const doubledProducts = useMemo(() => {
    if (!storeProducts || storeProducts.length === 0) return [];
    
    // Stabilize the list layout by ensuring there's a good volume of items to prevent blank areas
    let baseList = [...storeProducts];
    while (baseList.length < 10) {
      baseList = [...baseList, ...storeProducts];
    }
    
    // Double for infinite seamless translation from 0% to -50%
    return [...baseList, ...baseList];
  }, [storeProducts]);

  const duration = useMemo(() => {
    if (!storeProducts || storeProducts.length === 0) return 20;
    let baseCount = storeProducts.length;
    while (baseCount < 10) {
      baseCount += storeProducts.length;
    }
    return baseCount * 4.5; // Natural smooth scroll speed
  }, [storeProducts]);

  if (!storeProducts || storeProducts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-xs text-slate-400">
        Loading products...
      </div>
    );
  }

  return (
    <div 
      className="flex-1 relative overflow-hidden w-full select-none min-h-[380px]"
    >
      <style>{`
        @keyframes marqueeVertical {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .marquee-anim-container {
          animation: marqueeVertical ${duration}s linear infinite;
        }
        .marquee-anim-container:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Top & Bottom soft fading gradients to merge smoothly into container card */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-teal-50 via-teal-50/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-teal-50 via-teal-50/40 to-transparent z-10 pointer-events-none" />

      <div className="marquee-anim-container flex flex-col gap-2.5">
        {doubledProducts.map((product, index) => {
          const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
          return (
            <div 
              key={`${product.id}-${index}`} 
              className="bg-white/95 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between hover:border-teal-400 hover:shadow-md transition-all relative group shadow-xs shrink-0"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden shrink-0 relative border border-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <span className="text-[9px] text-teal-600 font-black uppercase tracking-wider block leading-none mb-0.5">{product.category}</span>
                  <h4 className="text-xs font-black text-slate-900 truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-teal-950">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {product.weight} kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {cartItem ? (
                  <button
                    type="button"
                    onClick={() => removeStoreItem(product.name)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-black rounded-xl border border-rose-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    Added âœ“
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => addItem(product, 'Store')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-black rounded-xl border border-teal-500 flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type Tab = 'home' | 'pickup' | 'warehouse' | 'store' | 'cart' | 'finalize' | 'history' | 'admin' | 'warehouse-mgmt' | 'agent' | 'support' | 'notifications' | 'track' | 'account' | 'about';


const API_URL = window.location.origin;

export const logAgentActionToSupabase = async (
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'DEASSIGN',
  agentId: string,
  agentName: string,
  details: any,
  performedBy: string
) => {
  try {
    console.log(`[Supabase Agent Sync] ${actionType} on ${agentId} (${agentName}) by ${performedBy}`);
    if (isSupabaseConfigured) {
      if (actionType === 'CREATE' || actionType === 'UPDATE') {
        const { error: upsertError } = await supabase
          .from('agents')
          .upsert({
            id: agentId,
            name: agentName,
            phone: details.phone || '',
            email: details.email || `${agentId}.agent@jiffex.com`,
            status: details.status || 'Active',
            vehicle_number: details.vehicleNumber || ''
          });
        if (upsertError) {
          console.error('[Supabase agents upsert error]:', upsertError);
        }
      } else if (actionType === 'DELETE') {
        const { error: deleteError } = await supabase
          .from('agents')
          .delete()
          .eq('id', agentId);
        if (deleteError) {
          console.error('[Supabase agents delete error]:', deleteError);
        }
      }

      const { error: logError } = await supabase
        .from('agent_logs')
        .insert({
          action_type: actionType,
          agent_id: agentId,
          agent_name: agentName,
          details,
          performed_by: performedBy
        });
      if (logError) {
        console.error('[Supabase agent_logs log error]:', logError);
      }
    }
  } catch (err) {
    console.error('Failed to update Supabase agent records:', err);
  }
};

const sendWhatsApp = (phone: string, message: string) => {
  if (!phone) {
    toast.error('Unable to send WhatsApp notification. No contact phone number is associated with this shipment.');
    return;
  }
  let cleanPhone = phone.replace(/\D/g, '');
  // If it's a 10-digit number, assume Indian prefix 91
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

const getStatusWhatsAppMessage = (orderId: string, status: string, name: string, country: string, totalCost?: number) => {
  const trackingUrl = `${window.location.origin}/track?id=${orderId}`;
  let statusEmoji = 'ðŸ“¦';
  let statusDescription = 'has been updated.';
  
  switch(status) {
    case 'Scheduled':
      statusEmoji = 'ðŸ“…';
      statusDescription = 'has been successfully Scheduled! Our agent will contact you for pickup shortly.';
      break;
    case 'Pending Pickup':
      statusEmoji = 'ðŸ•’';
      statusDescription = 'is currently Pending Pickup.';
      break;
    case 'Picked Up':
      statusEmoji = 'ðŸšš';
      statusDescription = 'has been successfully Picked Up by our logistics agent and is on its way to the warehouse.';
      break;
    case 'In Warehouse':
    case 'Received at Warehouse':
      statusEmoji = 'ðŸ¢';
      statusDescription = 'has been Received at our Warehouse hub and is ready for the next processing stages.';
      break;
    case 'Order Confirmed':
      statusEmoji = 'âœ…';
      statusDescription = 'has been Confirmed.';
      break;
    case 'Processing Order':
      statusEmoji = 'âš™ï¸';
      statusDescription = 'is currently being Processed.';
      break;
    case 'Consolidating items':
      statusEmoji = 'ðŸ“¥';
      statusDescription = 'is undergoing Consolidation of all package items.';
      break;
    case 'Packed':
      statusEmoji = 'ðŸ“¦';
      statusDescription = 'has been securely Packed and ready for dispatch.';
      break;
    case 'Ready to Ship':
      statusEmoji = 'âœˆï¸';
      statusDescription = 'is fully Packed and Ready to Ship internationally!';
      break;
    case 'In Transit':
      statusEmoji = 'ðŸŒ';
      statusDescription = 'is In Transit (International Shipping / Air Cargo). It is currently flying to the destination hub.';
      break;
    case 'Out for Delivery':
      statusEmoji = 'ðŸ›µ';
      statusDescription = 'is now Out for Delivery! Our local courier agent is delivering your packages today.';
      break;
    case 'Delivered':
      statusEmoji = 'ðŸŽ‰';
      statusDescription = 'has been successfully Delivered! Thank you for shipping with JiffEX. We hope to serve you again soon!';
      break;
    case 'Cancelled':
      statusEmoji = 'âŒ';
      statusDescription = 'has been Cancelled.';
      break;
    default:
      statusDescription = `status is now: *${status}*.`;
  }

  const costString = totalCost ? `\nðŸ’° Total cost: *â‚¹${totalCost.toFixed(2)}*` : '';

  return `*JiffEX Shipment Notification* ${statusEmoji}\n\nDear *${name || 'Customer'}*,\n\nYour shipment *#${orderId.slice(0, 8)}* ${statusDescription}\n\nðŸ“ Destination: *${country || 'N/A'}*${costString}\n\nðŸ”— Live Tracker: ${trackingUrl}\n\nThank you for choosing JiffEX!`;
};

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    id="global-back-button"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    onClick={onClick}
    className="absolute top-3.5 md:top-1 left-6 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group z-20 font-bold text-xs cursor-pointer"
  >
    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-indigo-600" />
    <span>Back</span>
  </motion.button>
);

const StaticShipmentTracker = ({ order }: { order?: Order }) => {
  const statusSteps: ShippingStatus[] = [
    'Scheduled',
    'Pending Pickup',
    'Order Confirmed',
    'Processing Order',
    'In Transit',
    'Out for Delivery',
    'Delivered'
  ];

  const rawStatus = order?.status || 'In Transit';
  // Map some alternative names to the steps
  const statusMap: Record<string, ShippingStatus> = {
    'Request Placed': 'Scheduled',
    'Pending': 'Scheduled',
    'Received at Warehouse': 'Processing Order',
    'In Warehouse': 'Processing Order',
    'Consolidating items': 'Processing Order',
    'Packed': 'Processing Order',
    'Ready to Ship': 'Processing Order'
  };
  
  const currentStatus = statusMap[rawStatus] || rawStatus;
  const currentIndex = statusSteps.indexOf(currentStatus as ShippingStatus);
  
  const steps = statusSteps.map((label, index) => ({
    label,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming',
    date: index <= currentIndex ? (order?.updatedAt || order?.createdAt || 'Today').split('T')[0] : 'TBD',
    icon: label === 'Delivered' ? CheckCircle2 : (label === 'In Transit' ? Truck : label === 'Scheduled' ? Calendar : Package)
  }));

  if (!order) {
    return (
      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
        <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-400">Enter a Tracking ID to search</h3>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">Shipment Status</h3>
          <p className="text-sm text-slate-500">Real-time updates for your package</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 rounded-2xl text-xs font-bold text-indigo-600 border border-indigo-100 flex items-center gap-2">
          <Package size={14} /> ID: {order.id}
        </div>
      </div>

      <div className="relative pt-4 pb-8 overflow-x-auto no-scrollbar">
        <div className="min-w-[600px] relative px-4">
          <div className="absolute top-[24px] left-8 right-8 h-1 bg-slate-100 rounded-full" />
          <div 
            className="absolute top-[24px] left-8 h-1 bg-indigo-600 transition-all duration-1000 ease-out rounded-full" 
            style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 64px)' }}
          />
          
          <div className="relative flex justify-between">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-3 relative z-10 w-24">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  step.status === 'completed' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' :
                  step.status === 'current' ? 'bg-white border-2 border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-50' :
                  'bg-white border border-slate-200 text-slate-300'
                }`}>
                  <step.icon size={20} />
                </div>
                <div className="text-center">
                  <div className={`text-[10px] font-black uppercase tracking-tight leading-tight mb-1 ${step.status !== 'upcoming' ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400">{step.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
            <MapPin size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</div>
            <div className="text-xs font-black text-slate-900">{order.destination.city}, {order.destination.country}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</div>
          <div className="text-xs font-black text-indigo-600">JiffEX Global Express</div>
        </div>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  currentUser: User | null;
  orders: Order[];
  appointments: Appointment[];
  onAssignAgent: (aptId: string, agent: AgentProfile) => Promise<void>;
  agents: AgentProfile[];
  setAgents: React.Dispatch<React.SetStateAction<AgentProfile[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  adminTab: 'Overview' | 'Pickups' | 'Logistics' | 'Agents' | 'Inventory' | 'Reports' | 'Settings' | 'Refunds' | 'Rates';
  setAdminTab: React.Dispatch<React.SetStateAction<'Overview' | 'Pickups' | 'Logistics' | 'Agents' | 'Inventory' | 'Reports' | 'Settings' | 'Refunds' | 'Rates'>>;
  storeProducts: StoreProduct[];
  setStoreProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setItems: React.Dispatch<React.SetStateAction<ShippingItem[]>>;
  refundRequests: RefundRequest[];
  setRefundRequests: React.Dispatch<React.SetStateAction<RefundRequest[]>>;
  isWebmaster: boolean;
  onUpdateOrderItemStatus: (orderId: string, itemId: string, status: ShippingStatus) => Promise<void>;
  onUpdateOrderItemWeight: (orderId: string, itemId: string, weight: number) => Promise<void>;
  shippingRates?: Record<string, number>;
  setShippingRates?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  shippingRateBands?: CountryRateBands;
  setShippingRateBands?: React.Dispatch<React.SetStateAction<CountryRateBands>>;
  shippingDiscounts?: Record<string, number>;
  setShippingDiscounts?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  coupons?: Array<{ code: string; discountPercent: number; isEnabled: boolean }>;
  setCoupons?: React.Dispatch<React.SetStateAction<Array<{ code: string; discountPercent: number; isEnabled: boolean }>>>;
  isAutoAssignAgentEnabled: boolean;
  setIsAutoAssignAgentEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SupportDeskDashboardProps {
  orders: Order[];
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  refundRequests: RefundRequest[];
  setRefundRequests: React.Dispatch<React.SetStateAction<RefundRequest[]>>;
  currentUser: User | null;
}

const SupportDeskDashboard = ({ orders, tickets, setTickets, refundRequests, setRefundRequests, currentUser }: SupportDeskDashboardProps) => {
  const [activeSupportTab, setActiveSupportTab] = useState<'Tickets' | 'Refunds' | 'Stats'>('Tickets');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const stats = {
    completed: orders.filter(o => o.status === 'Delivered').length,
    inProgress: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status !== 'Resolved').length
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'Resolved' } : t));
    toast.success(`Ticket ${ticketId} resolved successfully.`);
    if (selectedTicket?.id === ticketId) setSelectedTicket(null);
  };

  const handleRespond = () => {
    if (!responseText.trim() || !selectedTicket) return;

    const newComment: TicketComment = {
      id: 'CMT-' + Math.floor(Math.random() * 10000),
      author: currentUser?.name || currentUser?.email || 'CSR',
      content: responseText,
      createdAt: 'Just now'
    };

    const updatedTickets = tickets.map(t => 
      t.id === selectedTicket.id 
        ? { ...t, comments: [...(t.comments || []), newComment], status: 'In Progress' as const } 
        : t
    );

    setTickets(updatedTickets);
    // Find the updated ticket to refresh selection
    const updatedSelected = updatedTickets.find(t => t.id === selectedTicket.id);
    if (updatedSelected) setSelectedTicket(updatedSelected);
    
    setResponseText('');
    setIsResponding(false);
    toast.success('Response added to ticket');
  };

  const handleCreateRefundRequest = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      toast.error('Order not found');
      return;
    }

    const newRequest: RefundRequest = {
      id: 'REF-' + Math.floor(Math.random() * 10000),
      orderId,
      amount: order.totalCost || 0,
      reason: 'CSR Initiated Refund',
      status: 'Pending Approval',
      requestedAt: 'Just now'
    };

    setRefundRequests([...refundRequests, newRequest]);
    toast.success(`Refund request created for order ${orderId}. Awaiting Admin Approval.`);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">CSR Terminal Activity</span>
            </div>
            <h3 className="text-3xl font-black mb-2">Service Hub</h3>
            <p className="text-slate-400 font-medium tracking-tight">Active Session: <span className="text-white">{currentUser?.email}</span></p>
          </div>
          <div className="flex gap-4">
            {['Tickets', 'Refunds', 'Stats'].map((t: any) => (
              <button 
                key={t}
                onClick={() => setActiveSupportTab(t)}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeSupportTab === t ? 'bg-white text-slate-900' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSupportTab === 'Stats' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[3rem] group hover:bg-emerald-100 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <CheckCircle size={24} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Efficiency</span>
            </div>
            <div className="text-4xl font-black text-emerald-900 mb-1">{stats.completed}</div>
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Orders Completed</p>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[3rem] group hover:bg-indigo-100 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <Truck size={24} />
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Active Load</span>
            </div>
            <div className="text-4xl font-black text-indigo-900 mb-1">{stats.inProgress}</div>
            <p className="text-sm font-bold text-indigo-700 uppercase tracking-widest">In Progress</p>
          </div>

          <div className="bg-red-50 border border-red-100 p-8 rounded-[3rem] group hover:bg-red-100 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                <XCircle size={24} />
              </div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Churn</span>
            </div>
            <div className="text-4xl font-black text-red-900 mb-1">{stats.cancelled}</div>
            <p className="text-sm font-bold text-red-700 uppercase tracking-widest">Cancelled Orders</p>
          </div>
        </div>
      ) : activeSupportTab === 'Tickets' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-2 px-6">
              <h4 className="text-xl font-black text-slate-900">Queue Management</h4>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Filter tickets..."
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
              </div>
            </div>
            
            <div className="space-y-4">
              {tickets.filter(t => t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase())).map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTicket(t)}
                  className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${
                    selectedTicket?.id === t.id ? 'border-indigo-500 shadow-xl shadow-indigo-100' : 'border-slate-100 shadow-sm hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black ${
                        t.priority === 'High' ? 'bg-red-50 text-red-600' : 
                        t.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {t.id.split('-')[1]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.id} â€¢ {t.createdAt}</span>
                          {t.status === 'Resolved' && <CheckCircle size={12} className="text-emerald-500" />}
                        </div>
                        <h5 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{t.subject}</h5>
                        <p className="text-sm font-bold text-slate-400 mt-0.5 inline-flex items-center gap-1">
                          <Mail size={12} /> {t.customerEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                        t.priority === 'High' ? 'bg-red-600 text-white' : 
                        t.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        {t.priority}
                      </span>
                      <span className={`text-[10px] font-black uppercase ${t.status === 'Resolved' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100 flex flex-col min-h-[500px] sticky top-24">
              {selectedTicket ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-1">
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          Case: {selectedTicket.id}
                        </div>
                        <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4">{selectedTicket.subject}</h3>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">"{selectedTicket.description}"</p>
                      </div>

                      {/* Conversation History */}
                      {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                        <div className="space-y-4 mb-8">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Conversation History</h4>
                          {selectedTicket.comments.map((comment) => (
                            <div key={comment.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{comment.author}</span>
                                <span className="text-[10px] font-bold text-slate-400">{comment.createdAt}</span>
                              </div>
                              <p className="text-sm text-slate-600 font-medium">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 mt-4 pt-6 border-t border-slate-50">
                    {/* Response Input Area */}
                    {isResponding ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                          placeholder="Type your response or internal comments here..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={handleRespond}
                            className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all"
                          >
                            Send Response
                          </button>
                          <button 
                            onClick={() => {
                              setIsResponding(false);
                              setResponseText('');
                            }}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-[0.2em] mb-4">Linked Order</h4>
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-black text-indigo-600">{selectedTicket.orderId}</p>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase">Linked Customer Record</p>
                              </div>
                              <button 
                                onClick={() => handleCreateRefundRequest(selectedTicket.orderId)}
                                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              >
                                Initiate Refund
                              </button>
                            </div>
                            
                            {orders.find(o => o.id === selectedTicket.orderId) && (
                              <button 
                                onClick={() => {
                                  const order = orders.find(o => o.id === selectedTicket.orderId);
                                  if (order) {
                                    const message = `*JiffEX Support HUB*\n\nRegarding your ticket: ${selectedTicket.id}\nOrder ID: ${order.id}\nStatus: ${order.status}\n\nHere is your current invoice summary.\nTotal: â‚¹${order.totalCost.toFixed(2)}\n\nHow else can we help you today?`;
                                    sendWhatsApp(order.destination.phone, message);
                                  }
                                }}
                                className="w-full py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                              >
                                <MessageCircle size={16} /> Send Invoice via WhatsApp
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setIsResponding(true)}
                            className="py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all"
                          >
                            Respond
                          </button>
                          <button 
                            disabled={selectedTicket.status === 'Resolved'}
                            onClick={() => handleResolveTicket(selectedTicket.id)}
                            className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                              selectedTicket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-600 text-white hover:bg-slate-900'
                            }`}
                          >
                            {selectedTicket.status === 'Resolved' ? 'Closed' : 'Resolve'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">No Ticket Selected</h4>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">Select a ticket from the queue to view customer details and internal resolution tools.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">Refund Pipelines</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tiered Approval Workflow</p>
            </div>
            <ShieldCheck size={32} className="text-slate-100" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Req ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Requested</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-50 last:border-0 group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900">{req.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{req.orderId}</td>
                    <td className="px-6 py-4 font-black text-slate-900">â‚¹{req.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        req.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-400">{req.requestedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {refundRequests.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 mx-auto">
                <RefreshCw size={32} />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-1">No Refund Footprint</h4>
              <p className="text-sm text-slate-400 font-medium">Historical refund requests will appear here once initiated for orders.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SupportSectionProps {
  currentUser: User | null;
  orders: Order[];
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  refundRequests: RefundRequest[];
  setRefundRequests: React.Dispatch<React.SetStateAction<RefundRequest[]>>;
}

const SupportSection = ({ currentUser, orders, tickets, setTickets, refundRequests, setRefundRequests }: SupportSectionProps) => {
  if (currentUser?.role === 'customer_service') {
    return (
      <SupportDeskDashboard 
        orders={orders} 
        tickets={tickets} 
        setTickets={setTickets} 
        refundRequests={refundRequests} 
        setRefundRequests={setRefundRequests} 
        currentUser={currentUser} 
      />
    );
  }

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const mobileFaqs = [
    { q: "How long does shipping to the US take?", a: "Express shipments typically take 5-7 business days. Standard shipping takes 10-14 business days. These times depend on customs clearance and the final destination city." },
    { q: "What is the 'Send to Our Warehouse' service?", a: "This service allows you to send items from online stores (Amazon, Flipkart, etc.) or your home to our warehouse. We consolidate all your packages into one shipment to save you money on international shipping." },
    { q: "How do I calculate shipping costs?", a: "Shipping is calculated based on the higher of actual weight or volumetric weight. You can use our calculator on the home page for an instant estimate." }
  ];

  const prohibitedItemsList = [
    { name: "Aerosols & Perfumes", icon: Flame, color: "text-[#FF7A00]", bg: "bg-[#FFF8F2] border-[#FFE2CC]" },
    { name: "Alcohol & Tobacco", icon: Wine, color: "text-[#FF7A00]", bg: "bg-[#FFF8F2] border-[#FFE2CC]" },
    { name: "Ammunition & Firearms", icon: ShieldAlert, color: "text-[#FF7A00]", bg: "bg-[#FFF8F2] border-[#FFE2CC]" },
    { name: "Batteries (Lithium)", icon: BatteryCharging, color: "text-[#10B981]", bg: "bg-[#F0FDF4] border-[#DCFCE7]" },
    { name: "Chemicals & Hazardous", icon: FlaskConical, color: "text-[#FF7A00]", bg: "bg-[#FFF8F2] border-[#FFE2CC]" }
  ];

  return (
    <>
      {/* 1. MOBILE VIEW (Visible under md screens, matches screenshot design exactly) */}
      <div className="block md:hidden space-y-6 pb-24 px-1 pt-1">
        {/* Hero Section */}
        <section className="relative p-5 rounded-[2rem] bg-gradient-to-r from-[#091535] to-[#142352] text-white overflow-hidden shadow-lg shadow-indigo-950/10">
          <div className="max-w-[65%] space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight">Need Help?</h1>
            <p className="text-[10px] text-blue-200/80 leading-relaxed font-medium">
              We're here to make your shipping experience smooth and hassle-free.
            </p>
          </div>
          {/* 3D Headset Illustration placeholder */}
          <div className="absolute -right-2 -bottom-2 w-24 h-24 flex items-center justify-center">
            <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Headphones className="w-9 h-9 text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 bg-sky-400 p-1 rounded-xl shadow-md">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </section>

        {/* How can we help you today? */}
        <div className="space-y-3.5">
          <h2 className="text-sm font-black text-[#0A142F] tracking-tight">How can we help you today?</h2>
          
          {/* Jiffex Agent Card */}
          <div 
            onClick={() => {
              try {
                const omniEl = document.querySelector('#omnidimension-web-widget, [id*="omnidim"], [class*="omnidim"], button[aria-label*="chat"], button[aria-label*="bot"], iframe[id*="omnidim"]') as HTMLElement | null;
                if (omniEl) omniEl.click();
                else toast.success('Jiffex Agent is active in the bottom-right corner.');
              } catch (e) {
                toast.success('Jiffex Agent is active.');
              }
            }}
            className="flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-indigo-500/30 cursor-pointer active:scale-[0.99] transition relative overflow-hidden"
          >
            <div className="flex items-center space-x-3 relative z-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-white">Jiffex AI Agent</h3>
                  <span className="text-[8px] bg-indigo-500/40 text-indigo-200 px-1.5 py-0.5 rounded-full font-bold">Online</span>
                </div>
                <p className="text-[9px] text-blue-200/90 font-medium leading-tight max-w-[170px]">Instant 24/7 AI logistics support & rate inquiries.</p>
              </div>
            </div>
            <button 
              type="button"
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-extrabold rounded-full flex items-center space-x-1 shadow-md shadow-indigo-500/30 shrink-0 relative z-10"
            >
              <span>Chat Now</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Live Chat Card */}
          <div className="flex items-center justify-between p-3.5 bg-[#F5F3FF] border border-[#E0DBFF] rounded-2xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#E0DBFF]/40 shrink-0">
                <MessageSquare className="w-5 h-5 text-[#4F2EF7]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-[#0A142F]">Live Chat</h3>
                <p className="text-[9px] text-slate-500 font-medium leading-tight max-w-[170px]">Chat with our support team for instant assistance.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                try {
                  const omniEl = document.querySelector('#omnidimension-web-widget, [id*="omnidim"], [class*="omnidim"], button[aria-label*="chat"], button[aria-label*="bot"], iframe[id*="omnidim"]') as HTMLElement | null;
                  if (omniEl) omniEl.click();
                  else toast.success('Connecting to Live Support...');
                } catch (e) {
                  toast.success('Connecting to Live Support...');
                }
              }}
              className="px-3 py-1.5 bg-[#4F2EF7] text-white text-[9px] font-extrabold rounded-full flex items-center space-x-1 hover:bg-[#3F22D6] active:scale-95 transition shadow-md shadow-indigo-200 shrink-0"
            >
              <span>Chat Now</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Email Support Card */}
          <a 
            href="mailto:support@jiffex.com"
            className="flex items-center justify-between p-3.5 bg-[#F4FBF7] border border-[#D1F2E1] rounded-2xl shadow-sm active:scale-[0.99] transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#D1F2E1]/40 shrink-0">
                <Mail className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-[#0A142F]">Email Support</h3>
                <p className="text-[9px] text-slate-500 font-medium leading-tight max-w-[170px]">Send us your queries and we'll reply within 24 hours.</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#10B981] shrink-0" />
          </a>

          {/* Help Center Card */}
          <div 
            onClick={() => toast.info('Opening Help Center / FAQ Section below...')}
            className="flex items-center justify-between p-3.5 bg-[#FFF9F3] border border-[#FFE7D1] rounded-2xl shadow-sm cursor-pointer active:scale-[0.99] transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#FFE7D1]/40 shrink-0">
                <HelpCircle className="w-5 h-5 text-[#FF7A00]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-[#0A142F]">Help Center</h3>
                <p className="text-[9px] text-slate-500 font-medium leading-tight max-w-[170px]">Browse FAQs, guides and shipping information.</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#FF7A00] shrink-0" />
          </div>
        </div>

        {/* FAQs Section */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-[#4F2EF7]" />
              <h2 className="text-sm font-black text-[#0A142F] tracking-tight">Frequently Asked Questions</h2>
            </div>
            <button 
              onClick={() => {
                setOpenFaq(openFaq === null ? 0 : null);
              }}
              className="text-[10px] font-extrabold text-[#4F2EF7] hover:underline"
            >
              {openFaq === null ? 'View all' : 'Collapse'}
            </button>
          </div>

          <div className="space-y-2">
            {mobileFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className={`border transition-all duration-200 rounded-xl overflow-hidden ${
                    isOpen ? 'bg-[#F8FAFC] border-[#E2E8F0] shadow-sm' : 'bg-white border-slate-100'
                  }`}
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex justify-between items-center p-3.5 text-left"
                  >
                    <span className="text-[11px] font-bold text-[#0A142F] pr-3 leading-snug">{faq.q}</span>
                    <div className="flex-shrink-0">
                      {isOpen ? (
                        <div className="w-4 h-4 rounded-full border border-indigo-100 flex items-center justify-center bg-indigo-50">
                          <Minus className="w-2.5 h-2.5 text-[#4F2EF7]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center">
                          <Plus className="w-2.5 h-2.5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-[10px] text-slate-500 font-medium leading-relaxed border-t border-slate-100/60 pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prohibited Items Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-[#FF7A00]" />
              <h2 className="text-sm font-black text-[#0A142F] tracking-tight">Prohibited Items (US Shipping)</h2>
            </div>
            <button 
              onClick={() => toast.info('Displaying full list of prohibited items below.')}
              className="text-[10px] font-extrabold text-[#FF7A00] hover:underline"
            >
              View full list
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            To comply with international regulations and US Customs, the following items cannot be shipped.
          </p>

          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {prohibitedItemsList.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center ${item.bg} min-h-[85px] shadow-sm`}
                >
                  <div className="p-1 rounded-full bg-white shadow-sm mb-1.5 shrink-0">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-[7.5px] leading-tight font-black text-[#0A142F]">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. LAPTOP/DESKTOP VIEW */}
      <div className="hidden md:block space-y-12 pb-24">
        <div className="text-center space-y-4">
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Need Help?</h3>
          <p className="text-slate-500 max-w-2xl mx-auto">Our support team and 24/7 Jiffex Agent are here to ensure your shipping experience is flawless.</p>
        </div>

        {/* Featured Jiffex Agent Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-indigo-500/30 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 max-w-xl text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} className="text-indigo-400 animate-spin" />
              <span>Jiffex AI Support Agent</span>
            </div>
            <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Instant Jiffex Logistics Support
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Have questions about shipping rates, scheduling doorstep pickup, shop & ship consolidation, or tracking? Use our 24/7 Jiffex assistant for instant resolution.
            </p>
          </div>

          <button
            onClick={() => {
              try {
                const omniEl = document.querySelector('#omnidimension-web-widget, [id*="omnidim"], [class*="omnidim"], button[aria-label*="chat"], button[aria-label*="bot"], iframe[id*="omnidim"]') as HTMLElement | null;
                if (omniEl) omniEl.click();
                else toast.success('Jiffex Agent is active in the bottom-right corner.');
              } catch (e) {
                toast.success('Jiffex Agent is active.');
              }
            }}
            className="relative z-10 shrink-0 px-8 py-5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center gap-3 transition-all active:scale-95 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot size={20} className="text-white" />
            </div>
            <span>Open Jiffex Agent</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: Bot, 
              title: "Jiffex Agent", 
              desc: "Instant 24/7 AI assistance for rate calculations, tracking, and logistics guidance.",
              action: "Open Jiffex Agent",
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              onClick: () => {
                try {
                  const omniEl = document.querySelector('#omnidimension-web-widget, [id*="omnidim"], [class*="omnidim"], button[aria-label*="chat"], button[aria-label*="bot"], iframe[id*="omnidim"]') as HTMLElement | null;
                  if (omniEl) omniEl.click();
                  else toast.success('Jiffex Agent is active in the bottom-right corner.');
                } catch (e) {
                  toast.success('Jiffex Agent is active.');
                }
              }
            },
            { 
              icon: Mail, 
              title: "Email Support", 
              desc: "Send us your queries and we'll get back to you within 24 hours.",
              action: "support@jiffex.com",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              onClick: () => { window.location.href = 'mailto:support@jiffex.com'; }
            },
            { 
              icon: HelpCircle, 
              title: "Help Center", 
              desc: "Browse our extensive library of FAQs and shipping guides.",
              action: "Visit FAQ",
              color: "text-amber-600",
              bg: "bg-amber-50",
              onClick: undefined
            }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <item.icon size={28} />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-2">{item.title}</h4>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">{item.desc}</p>
              <button 
                onClick={item.onClick}
                className={`text-sm font-bold ${item.color} flex items-center gap-2 hover:underline cursor-pointer`}
              >
                {item.action} <ArrowRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Comprehensive FAQ Section */}
          <div className="bg-slate-50 rounded-[3rem] p-8 md:p-12">
            <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <HelpCircle className="text-indigo-600" />
              Frequently Asked Questions
            </h4>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {[
                { q: "How long does shipping to the US take?", a: "Express shipments typically take 5-7 business days. Standard shipping takes 10-14 business days. These times depend on customs clearance and the final destination city." },
                { q: "What is the 'Send to Our Warehouse' service?", a: "This service allows you to send items from online stores (Amazon, Flipkart, etc.) or your home to our warehouse. We consolidate all your packages into one shipment to save you money on international shipping." },
                { q: "How do I calculate shipping costs?", a: "Shipping is calculated based on the higher of actual weight or volumetric weight. You can use our calculator on the home page for an instant estimate." },
                { q: "Can I track my shipment in real-time?", a: "Yes! Once your shipment is dispatched, you'll receive a tracking ID. You can enter this ID in the 'Track Shipment' box on our home page." },
                { q: "What happens if my items are fragile?", a: "We offer professional repacking services. If you mark an item as fragile, our warehouse team will add extra protective layers (bubble wrap, corrugated sheets) to ensure safe transit." },
                { q: "Are there any hidden charges?", a: "Our quotes include door-to-door delivery. However, customs duties or taxes (if applicable in the destination country) are determined by local authorities and are the recipient's responsibility." },
                { q: "What is the 'Pickup from home' service?", a: "If you're in a supported city in India, our agent will come to your doorstep to collect your items. They can even help with basic packing!" },
                { q: "How do I pay for my shipment?", a: "We accept all major credit cards, debit cards, and digital payment methods like UPI. Payment is required once all your items are received and weighed at our warehouse." },
                { q: "Can I ship homemade food items?", a: "Yes, you can ship dry, non-perishable homemade food (like sweets or snacks). However, they must be properly packed and have a reasonable shelf life. Perishables are strictly prohibited." },
                { q: "What if my package is lost or damaged?", a: "We take extreme care, but in rare cases of loss or damage, we offer limited liability coverage. For high-value items, we strongly recommend purchasing additional shipping insurance." }
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="font-bold text-slate-900 mb-2 flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">?</div>
                    {faq.q}
                  </div>
                  <p className="text-sm text-slate-500 ml-9 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prohibited Items Section */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-sm">
            <h4 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <AlertTriangle className="text-amber-500" />
              Prohibited Items (US Shipping)
            </h4>
            <p className="text-sm text-slate-500 mb-8">
              To comply with international regulations and US Customs, the following items cannot be shipped. Attempting to ship these may result in delays, fines, or seizure.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {PROHIBITED_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-red-50 hover:border-red-100 transition-all">
                  <div className="w-2 h-2 rounded-full bg-red-400 group-hover:scale-125 transition-transform" />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-red-700">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
              <Info className="text-amber-600 shrink-0 mt-1" size={20} />
              <div className="space-y-2">
                <h5 className="text-sm font-black text-amber-900 uppercase tracking-widest">Important Note</h5>
                <p className="text-xs text-amber-800 leading-relaxed">
                  This list is not exhaustive. If you are unsure about an item, please contact our support team before sending it to the warehouse. Certain items like medicines or seeds require specific documentation and prior approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AdminDashboard = ({ 
  currentUser, 
  orders, 
  appointments, 
  onAssignAgent, 
  agents, 
  setAgents, 
  categories, 
  setCategories, 
  adminTab, 
  setAdminTab,
  storeProducts,
  setStoreProducts,
  setOrders,
  setItems,
  refundRequests,
  setRefundRequests,
  isWebmaster: isWebmasterProp,
  onUpdateOrderItemStatus,
  onUpdateOrderItemWeight,
  shippingRates = SHIPPING_RATES,
  setShippingRates,
  shippingRateBands = {},
  setShippingRateBands,
  shippingDiscounts = {},
  setShippingDiscounts,
  coupons = [],
  setCoupons,
  isAutoAssignAgentEnabled,
  setIsAutoAssignAgentEnabled
}: AdminDashboardProps) => {
  const [categoryInput, setCategoryInput] = useState('');
  const [agentSearch, setAgentSearch] = useState('');

  // Shipping history interfaces & states
  const [ratesActiveSubTab, setRatesActiveSubTab] = useState<'rates' | 'history'>('rates');
  const [inventoryActiveSubTab, setInventoryActiveSubTab] = useState<'StoreCatalog' | 'NewProduct' | 'Categories'>('StoreCatalog');
  const [productFilterInput, setProductFilterInput] = useState('');
  const [shippingHistory, setShippingHistory] = useState<{
    id: string;
    timestamp: string;
    type: 'Rate' | 'Discount';
    country: string;
    oldValue: number;
    newValue: number;
    updatedBy: string;
  }[]>(() => {
    const saved = localStorage.getItem('jiffex_shipping_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse shipping history', e);
      }
    }
    // Return high-quality initial seed data for an immediately alive experience
    return [
      {
        id: 'sh-1',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleString(),
        type: 'Rate',
        country: 'USA',
        oldValue: 12,
        newValue: 15,
        updatedBy: 'admin@jiffex.com'
      },
      {
        id: 'sh-2',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(),
        type: 'Discount',
        country: 'UAE',
        oldValue: 0,
        newValue: 10,
        updatedBy: 'admin@jiffex.com'
      }
    ];
  });

  // Local state to manage shipping rate configuration in the admin panel
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [editingDiscounts, setEditingDiscounts] = useState<Record<string, string>>({});
  const [editingRateBands, setEditingRateBands] = useState<CountryRateBands>({});
  const [adminCoupons, setAdminCoupons] = useState<Array<{ code: string; discountPercent: number; isEnabled: boolean }>>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState('');
  const [isSavingShipping, setIsSavingShipping] = useState<boolean>(false);

  useEffect(() => {
    if (shippingRateBands) {
      setEditingRateBands(JSON.parse(JSON.stringify(shippingRateBands)));
    }
  }, [shippingRateBands]);

  useEffect(() => {
    if (coupons) {
      setAdminCoupons(coupons);
    }
  }, [coupons]);

  useEffect(() => {
    if (shippingRates) {
      const initialRates: Record<string, string> = {};
      Object.keys(shippingRates).forEach(country => {
        initialRates[country] = String(shippingRates[country]);
      });
      setEditingRates(initialRates);
    }
  }, [shippingRates]);

  useEffect(() => {
    if (shippingDiscounts) {
      const initialDiscounts: Record<string, string> = {};
      COUNTRIES.forEach(country => {
        initialDiscounts[country] = String(shippingDiscounts[country] || 0);
      });
      setEditingDiscounts(initialDiscounts);
    }
  }, [shippingDiscounts]);

  const handleSaveShippingSettings = async () => {
    setIsSavingShipping(true);
    try {
      const parsedRates: Record<string, number> = {};
      Object.keys(editingRates).forEach(country => {
        parsedRates[country] = Number(editingRates[country]) || 0;
      });
      const parsedDiscounts: Record<string, number> = {};
      Object.keys(editingDiscounts).forEach(country => {
        parsedDiscounts[country] = Number(editingDiscounts[country]) || 0;
      });

      // Track rate and discount changes to append to history log
      const newEntries: {
        id: string;
        timestamp: string;
        type: 'Rate' | 'Discount';
        country: string;
        oldValue: number;
        newValue: number;
        updatedBy: string;
      }[] = [];
      const timestamp = new Date().toLocaleString();
      const updatedBy = currentUser?.email || 'admin@jiffex.com';

      // Compare rates for changes
      Object.keys(parsedRates).forEach(country => {
        const oldVal = shippingRates[country] !== undefined ? shippingRates[country] : SHIPPING_RATES[country] || 10;
        const newVal = parsedRates[country];
        if (oldVal !== newVal) {
          newEntries.push({
            id: 'sh-' + Math.random().toString(36).substr(2, 9),
            timestamp,
            type: 'Rate',
            country,
            oldValue: oldVal,
            newValue: newVal,
            updatedBy
          });
        }
      });

      // Compare discounts for changes
      Object.keys(parsedDiscounts).forEach(country => {
        const oldVal = shippingDiscounts[country] || 0;
        const newVal = parsedDiscounts[country];
        if (oldVal !== newVal) {
          newEntries.push({
            id: 'sh-' + Math.random().toString(36).substr(2, 9),
            timestamp,
            type: 'Discount',
            country,
            oldValue: oldVal,
            newValue: newVal,
            updatedBy
          });
        }
      });
      
      const response = await api.updateShippingSettings({
        rates: parsedRates,
        rateBands: editingRateBands,
        discounts: parsedDiscounts,
        coupons: adminCoupons
      });
      
      if (setShippingRates) {
        setShippingRates(response.rates);
      }
      if (setShippingRateBands && response.rateBands) {
        setShippingRateBands(response.rateBands);
        setEditingRateBands(response.rateBands);
      }
      if (setShippingDiscounts) {
        setShippingDiscounts(response.discounts);
      }
      if (setCoupons && response.coupons) {
        setCoupons(response.coupons);
      }

      // Prepend any new modifications to history state
      if (newEntries.length > 0) {
        const updatedHistory = [...newEntries, ...shippingHistory];
        setShippingHistory(updatedHistory);
        localStorage.setItem('jiffex_shipping_history', JSON.stringify(updatedHistory));
      }

      toast.success("Country shipping rates and specific discounts updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update shipping settings: " + err.message);
    } finally {
      setIsSavingShipping(false);
    }
  };

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [editDeliveryValue, setEditDeliveryValue] = useState<string>('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('All');
  const [editTempName, setEditTempName] = useState('');
  const [editTempCategory, setEditTempCategory] = useState('');
  const [editTempWeight, setEditTempWeight] = useState('');
  const [editTempDescription, setEditTempDescription] = useState('');
  const [editTempMaterial, setEditTempMaterial] = useState('');
  const [editTempOrigin, setEditTempOrigin] = useState('');
  const [editTempLength, setEditTempLength] = useState('');
  const [editTempWidth, setEditTempWidth] = useState('');
  const [editTempHeight, setEditTempHeight] = useState('');

  // Local states for updating itemized cargo weights and tracking confirmed ones
  const [cargoWeights, setCargoWeights] = useState<Record<string, string>>({});
  const [confirmedWeights, setConfirmedWeights] = useState<Record<string, boolean>>({});
  const [expandedCargo, setExpandedCargo] = useState<Record<string, boolean>>({});
  const [expandedTracking, setExpandedTracking] = useState<Record<string, boolean>>({});

  // Local state for drafts to prevent global re-renders and focus loss
  const [newAgent, setNewAgent] = useState(() => {
    const sugId = Math.floor(10000 + Math.random() * 90000).toString();
    return { id: sugId, name: '', phone: '', email: `${sugId}.agent@jiffex.com`, vehicleNumber: '' };
  });
  const [newProduct, setNewProduct] = useState<Partial<StoreProduct>>({ name: '', price: 0, category: categories[0] || 'Pooja', image: '', weight: 0, estimatedDelivery: '' });

  const filteredProducts = storeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productFilterInput.toLowerCase()) || 
                          p.category.toLowerCase().includes(productFilterInput.toLowerCase());
    const matchesCategory = selectedCatalogCategory === 'All' || p.category === selectedCatalogCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!currentUser) return null;
  const isWebmaster = isWebmasterProp ?? (currentUser?.role === 'webmaster');

  const stats = [
    { label: 'Total Shipments', value: orders.length, icon: Package, color: 'bg-blue-500', tab: 'Logistics' },
    { label: 'Pending Pickups', value: orders.filter(o => o.status === 'Scheduled' || o.status === 'Pending Pickup').length, icon: Clock, color: 'bg-amber-500', tab: 'Pickups' },
    { label: 'Active Shipments', value: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length, icon: Truck, color: 'bg-indigo-500', tab: 'Logistics' },
    { label: 'Total Revenue', value: `â‚¹${orders.reduce((acc, o) => acc + (o.totalCost || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-500', tab: 'Reports' },
  ].filter((_, i) => !isWebmaster || i >= 0);

  const availableTabs = (isWebmaster 
    ? ['Overview', 'Inventory', 'Reports', 'Rates', 'Settings'] 
    : ['Overview', 'Pickups', 'Logistics', 'Agents', 'Inventory', 'Reports', 'Refunds', 'Rates', 'Settings']) as any[];

  // Force tab if webmaster is on restricted tab
  useEffect(() => {
    if (isWebmaster && !['Overview', 'Inventory', 'Reports', 'Rates', 'Settings'].includes(adminTab)) {
      setAdminTab('Overview');
    }
  }, [isWebmaster, adminTab, setAdminTab]);

  const handleAddAgent = () => {
    if (!newAgent.id || !newAgent.name || !newAgent.phone) {
      toast.error('Agent ID, Name, and Phone are required.');
      return;
    }
    const idNormalized = newAgent.id.trim();
    if (!/^\d{5}$/.test(idNormalized)) {
      toast.error('Agent ID must be an exact 5-digit number (e.g. 12345).');
      return;
    }
    if (agents.some(a => a.id === idNormalized)) {
      toast.error(`Agent ID "${idNormalized}" is already taken. Please enter a unique ID.`);
      return;
    }
    const agent: AgentProfile = {
      id: idNormalized,
      name: newAgent.name.trim(),
      phone: newAgent.phone.trim(),
      email: `${idNormalized}.agent@jiffex.com`,
      vehicleNumber: newAgent.vehicleNumber?.trim() || undefined,
      status: 'Active'
    };
    setAgents([...agents, agent]);
    logAgentActionToSupabase(
      'CREATE',
      idNormalized,
      agent.name,
      {
        phone: agent.phone,
        email: agent.email,
        vehicleNumber: agent.vehicleNumber || '',
        status: agent.status
      },
      currentUser?.email || 'admin@jiffex.com'
    );
    
    const sugId = Math.floor(10000 + Math.random() * 90000).toString();
    setNewAgent({
      id: sugId,
      name: '',
      phone: '',
      email: `${sugId}.agent@jiffex.com`,
      vehicleNumber: ''
    });
    toast.success(`Agent ${agent.name} with ID ${idNormalized} registered successfully!`);
  };

  const handleAssignAgent = async (aptId: string, agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    try {
      await onAssignAgent(aptId, agent);
      toast.success(`Agent ${agent.name} assigned successfully.`);
    } catch (err: any) {
      console.error('Assign Agent Error:', err);
      toast.error('Failed to assign agent.');
    }
  };

  const handleAddCategory = () => {
    if (categoryInput && !categories.includes(categoryInput)) {
      setCategories([...categories, categoryInput]);
      setCategoryInput('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: ShippingStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      await api.updateOrderStatus(orderId, newStatus, order.customerId, order.destination);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      // Also update status in 'pickups' table in Supabase
      if (isSupabaseConfigured) {
        try {
          await api.updatePickup(orderId, {
            status: (newStatus === 'Scheduled' || newStatus === 'Pending Pickup') ? 'Scheduled' : 
                    newStatus === 'Cancelled' ? 'Cancelled' : 
                    newStatus === 'Picked Up' ? 'Picked Up' : 'Completed'
          });
        } catch (e) {
          console.warn('Failed to update pickup status in Supabase:', e);
        }
      }

      // Send dynamic WhatsApp message on status change
      const message = getStatusWhatsAppMessage(
         orderId, 
         newStatus, 
         order.destination?.fullName || 'Valued Customer', 
         order.destination?.country || '', 
         order.totalCost
      );
      sendWhatsApp(order.destination?.phone || '', message);

      toast.success(`Order ${orderId} status updated to ${newStatus}. WhatsApp notification sent.`);

      // Check if all active orders for this customer are now completed (Delivered), and send a single consolidated invoice
      if (newStatus === 'Delivered') {
        const customerId = order.customerId || order.customer_id;
        if (customerId) {
          const customerOrders = orders.filter(o => (o.customerId === customerId || o.customer_id === customerId));
          const updatedCustomerOrders = customerOrders.map(o => o.id === orderId ? { ...o, status: 'Delivered' as ShippingStatus } : o);
          const activeCustomerOrders = updatedCustomerOrders.filter(o => o.status !== 'Cancelled');
          
          const allCompleted = activeCustomerOrders.length > 0 && activeCustomerOrders.every(o => o.status === 'Delivered');
          if (allCompleted) {
            const recipientEmail = order.destination?.email;
            if (recipientEmail && recipientEmail.includes('@') && recipientEmail !== 'user@example.com') {
              const promise = api.sendConsolidatedInvoicePDF(recipientEmail, activeCustomerOrders, COMPANY_DETAILS);
              toast.promise(promise, {
                loading: 'All orders completed! Sending consolidated invoice to customer...',
                success: 'All orders completed! Single consolidated invoice sent to customer email.',
                error: 'All orders completed, but could not send consolidated invoice email.'
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to update order status:', err.message);
      toast.error('Failed to update order status.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 -mx-4 lg:-mx-8 min-h-[80vh]">
      {/* Professional Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 bg-white border-r border-slate-100 p-6 flex flex-col gap-8 rounded-r-3xl hidden lg:flex shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Admin</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Command Center</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {availableTabs.map((tab: any) => {
            const Icon = tab === 'Overview' ? LayoutDashboard : 
                         tab === 'Pickups' ? Clock :
                         tab === 'Logistics' ? Truck :
                         tab === 'Agents' ? Users : 
                         tab === 'Inventory' ? Package : 
                         tab === 'Reports' ? BarChart3 : 
                         tab === 'Refunds' ? RefreshCw :
                         tab === 'Rates' ? SlidersHorizontal :
                         tab === 'Settings' ? Settings2 : LayoutDashboard;
            
            return (
              <button 
                key={tab}
                onClick={() => setAdminTab(tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all group ${
                  adminTab === tab 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={`${adminTab === tab ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} shrink-0`} />
                {tab === 'Inventory' ? 'Inventory' : (tab === 'Agents' ? 'Agent Management' : (tab === 'Settings' ? 'Settings' : (tab === 'Rates' ? 'Shipping Rates' : tab)))}
                {adminTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
              {currentUser.email?.[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Active Operator</p>
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="lg:hidden flex gap-2 overflow-x-auto p-2 bg-white border-b border-slate-100 sticky top-0 z-10 no-scrollbar">
        {availableTabs.map((tab: any) => (
          <button 
            key={tab}
            onClick={() => setAdminTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              adminTab === tab 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {tab === 'Inventory' ? 'Inventory' : (tab === 'Agents' ? 'Agent Management' : (tab === 'Settings' ? 'Settings' : (tab === 'Rates' ? 'Shipping Rates' : tab)))}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:p-8 lg:pt-3 lg:pb-8 space-y-6 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {adminTab === 'Overview' && 'Dashboard Overview'}
              {adminTab === 'Pickups' && 'Pickup Requests'}
              {adminTab === 'Logistics' && 'Active Logistics Pipeline'}
              {adminTab === 'Agents' && 'Agent Management'}
              {adminTab === 'Inventory' && (isWebmaster ? 'Product Catalog' : 'Inventory Management')}
              {adminTab === 'Reports' && 'Business Intelligence'}
              {adminTab === 'Refunds' && 'Refund Management'}
              {adminTab === 'Rates' && 'Shipping Rates & Discounts'}
              {adminTab === 'Settings' && 'Settings'}
            </h1>
            <p className="text-slate-500 font-medium">
              Manage your operations and track key performance indicators.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCw size={18} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Server
            </div>
          </div>
        </header>

        <div className="space-y-4 pb-20">
          {adminTab === 'Overview' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setAdminTab(stat.tab as any)}
                    className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <stat.icon size={24} />
                      </div>
                      <div className="px-2 py-1 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-lg">Realtime</div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                       <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                         <Clock size={20} />
                       </div>
                       Recent Pickups
                    </h3>
                    <button onClick={() => setAdminTab('Pickups')} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all">View All</button>
                  </div>
                  <div className="space-y-4 relative z-10">
                    {appointments.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No appointments scheduled</p>
                      </div>
                    ) : (
                      appointments.slice(0, 3).map(apt => (
                        <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/apt hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover/apt:text-amber-500 shadow-sm transition-colors border border-slate-100">
                               <UserIcon size={18} />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm">{apt.customerName}</div>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{apt.date} â€¢ {apt.time}</div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {apt.status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                         <Truck size={20} />
                       </div>
                       Active Shipments
                    </h3>
                    <button onClick={() => setAdminTab('Logistics')} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Full Pipeline</button>
                  </div>
                  <div className="space-y-4 relative z-10">
                    {orders.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No active logistics</p>
                      </div>
                    ) : (
                      orders.slice(0, 3).map(order => (
                        <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/order hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm transition-colors border border-slate-100">
                               <Package size={18} />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm">#{order.id.slice(0, 8)}</div>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{order.destination.city} â€¢ {order.totalWeight}kg</div>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {order.status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* System Settings & Configuration Shortcut */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                           <Settings2 size={20} />
                         </div>
                         System Settings
                      </h3>
                      <button onClick={() => setAdminTab('Settings')} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Configure</button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Control dispatch modes, automatic agent assignment rules, data backup pipelines, and security gate protocols.
                    </p>
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600">Autoagent Dispatch</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isAutoAssignAgentEnabled ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                          {isAutoAssignAgentEnabled ? 'Enabled' : 'Manual'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600">Security Gate status</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 mt-6 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setAdminTab('Settings')} 
                      className="w-full py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-xs font-black text-slate-700 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      Open Rules Engine <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : adminTab === 'Pickups' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pickup Operations</h2>
                  <p className="text-slate-500 font-medium mt-1">Dispatch agents and manage {orders.filter(o => o.status === 'Scheduled' || o.status === 'Pending Pickup').length} pending requests.</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    LIVE OPS
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {appointments.length === 0 ? (
                   <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No Pickup Requests Found</h3>
                    <p className="text-sm text-slate-300 mt-2">New schedule requests will appear here automatically.</p>
                  </div>
                ) : (
                  appointments.map((apt, i) => (
                    <motion.div 
                      key={apt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 group-hover:bg-indigo-50 transition-colors -mr-16 -mt-16 rounded-full blur-3xl opacity-50" />
                      
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
                        <div className="flex items-start gap-6">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700 shrink-0 shadow-inner border border-slate-100">
                            <UserIcon size={40} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 uppercase tracking-widest">#{apt.id}</span>
                              {apt.paymentStatus === 'Paid' ? (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">Fully Paid</span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-xl border border-amber-100 uppercase tracking-widest">Pay at Pickup</span>
                              )}
                            </div>
                            <h4 className="text-2xl font-black text-slate-900">{apt.customerName}</h4>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Calendar size={16} className="text-indigo-500" /> {apt.date}
                              </div>
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Clock size={16} className="text-indigo-500" /> {apt.time}
                              </div>
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <MapPin size={16} className="text-indigo-500" /> {apt.address}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch gap-4 xl:min-w-[450px]">
                          <div className="flex-1 space-y-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Dispatch</p>
                              <div className="flex gap-2">
                                <button className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all active:scale-95">
                                  <Phone size={16} />
                                </button>
                                <button className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all active:scale-95">
                                  <Mail size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-sm font-black text-slate-900">{apt.phone}</span>
                               <span className="text-xs font-medium text-slate-400">Preferred: {apt.languagePreference || 'Any'}</span>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-center gap-3">
                             {apt.assignedAgent ? (
                              <div className="bg-indigo-600 p-5 rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-between group/assigned">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                    <Car size={24} />
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-1 opacity-70">En Route</div>
                                    <div className="text-sm font-black text-white">{apt.assignedAgent.name}</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleAssignAgent(apt.id, null as any)}
                                  className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Dispatch Agent</p>
                                <div className="relative">
                                  <select 
                                    className="w-full p-4 pl-4 pr-12 rounded-3xl bg-white border border-slate-200 text-sm font-black text-slate-700 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 appearance-none transition-all cursor-pointer shadow-lg shadow-slate-100"
                                    onChange={(e) => handleAssignAgent(apt.id, e.target.value)}
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Select Field Agent...</option>
                                    {agents.filter(a => a.status === 'Active').map(agent => (
                                      <option key={agent.id} value={agent.id}>{agent.name} â€¢ {agent.vehicleNumber || 'No Vehicle'}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-1 items-center gap-8">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Load Profile</p>
                             <div className="flex gap-2">
                               <span className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-[10px] font-black border border-slate-100 uppercase">{apt.itemType || 'General Goods'}</span>
                               <span className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-[10px] font-black border border-slate-100 uppercase">{apt.vehicleType || 'Any Vehicle'}</span>
                             </div>
                          </div>
                          <div className="h-10 w-px bg-slate-100" />
                          <div className="space-y-2 max-w-sm">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Items Detail</p>
                             <div className="flex flex-wrap gap-2 mt-2">
                               {apt.items && apt.items.length > 0 ? apt.items.map((it, idx) => (
                                 <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold border border-indigo-100">
                                   {it.name} (x{it.quantity || 1})
                                 </span>
                               )) : (
                                 <span className="text-[10px] text-slate-400 italic">No specific items listed</span>
                               )}
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <button 
                            onClick={() => handleUpdateOrderStatus(apt.id, 'Picked Up')}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                           >
                             <CheckCircle size={16} /> Mark Picked Up
                           </button>
                           <button 
                            onClick={() => handleUpdateOrderStatus(apt.id, 'Cancelled')}
                            className="px-6 py-3 bg-white text-red-600 border border-red-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                           >
                             Cancel
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          ) : adminTab === 'Logistics' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pipeline Control Center</h2>
                  <p className="text-slate-500 font-medium mt-1">Cross-border logistics management for {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length} active shipments.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search ID, Country, Customer..." 
                      className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all w-80 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <Box className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">Pipeline Empty</p>
                    <p className="text-sm text-slate-300 mt-2">Active shipments will appear here as they move through the network.</p>
                  </div>
                ) : (
                  [...orders].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((order, i) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
                    >
                      <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                          {/* Route & Shipment Identification */}
                          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                  Global Shipment
                                </span>
                                <span className="font-mono text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
                                  #{order.id.slice(0, 12).toUpperCase()}
                                </span>
                                {(order.carrier && (order.trackingNumber || order.tracking_number)) && (
                                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <Truck size={12} className="text-emerald-600" /> {order.carrier}: {order.trackingNumber || order.tracking_number}
                                  </span>
                                )}
                              </div>

                              {/* Visual Route Connect (Origin Hub to Destination City) */}
                              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50/80">
                                <div className="flex items-center gap-3">
                                  <div className="text-left shrink-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
                                    <p className="text-sm font-black text-slate-800 flex items-center gap-1">
                                      ðŸ‡®ðŸ‡³ India Hub
                                    </p>
                                  </div>

                                  <div className="flex-1 flex items-center justify-center px-1">
                                    <div className="w-full relative flex items-center justify-center">
                                      <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-dashed border-indigo-200" />
                                      </div>
                                      <div className="relative bg-white border border-indigo-50 px-2 py-0.5 rounded-full text-indigo-500 shadow-sm">
                                        <Plane size={12} className="transform rotate-45" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                                    <p className="text-sm font-black text-indigo-600 flex items-center justify-end gap-1">
                                      ðŸ‡ºðŸ‡¸ {order.destination.city}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Shipment Status & Payload Metrics Row */}
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                              <span className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {order.status}
                              </span>
                              <span className="px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/30 text-[10px] font-bold text-slate-600">
                                {order.items.length} Units â€¢ {order.totalWeight || order.total_weight || 0}kg Payload
                              </span>
                              <span className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-extrabold text-emerald-700">
                                â‚¹{(order.totalCost || order.total_cost || 0).toLocaleString()} Cost
                              </span>
                            </div>
                          </div>

                          {/* Consignee Intelligence */}
                          <div className="lg:col-span-4 bg-slate-50/30 p-5 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                <UserIcon size={12} className="text-indigo-400" /> Consignee Information
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-400 uppercase tracking-tight text-[9px]">Recipient</span>
                                  <span className="font-black text-slate-900 truncate max-w-[150px]">{order.destination.fullName}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-400 uppercase tracking-tight text-[9px]">Phone</span>
                                  <span className="font-black text-indigo-600 font-mono">{order.destination.phone}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-400 uppercase tracking-tight text-[9px]">Email</span>
                                  <span className="font-bold text-slate-600 truncate max-w-[155px]" title={order.destination.email}>{order.destination.email}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Financial Ledger</span>
                              <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                                order.paymentStatus === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                {order.paymentStatus || 'Pending'}
                              </span>
                            </div>
                          </div>

                          {/* Lifecycle Controller & Expander */}
                          <div className="lg:col-span-3 flex flex-col justify-between gap-4">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1 flex items-center gap-1.5">
                                <Settings2 size={12} /> Live Operations
                              </p>
                              <div className="relative">
                                <select 
                                  className="w-full p-3.5 pl-4 pr-10 rounded-2xl bg-white border-2 border-slate-100 text-xs font-black text-slate-700 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 appearance-none transition-all cursor-pointer shadow-sm hover:border-indigo-200"
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as ShippingStatus)}
                                >
                                  <optgroup label="Transit Phase 1: India Operations">
                                    <option value="Scheduled">Scheduled (Pickup Confirmed)</option>
                                    <option value="Pending Pickup">Pending Pickup</option>
                                    <option value="Picked Up">Picked Up (In Transit to Hub)</option>
                                    <option value="In Warehouse">In Warehouse (In Hub)</option>
                                    <option value="Order Confirmed">Order Confirmed</option>
                                    <option value="Processing Order">Processing Order</option>
                                    <option value="Consolidating items">Consolidating items</option>
                                    <option value="Packed">Packed</option>
                                    <option value="Ready to Ship">Ready to Ship</option>
                                  </optgroup>
                                  <optgroup label="Transit Phase 2: International">
                                    <option value="In Transit">In Transit (Air Cargo)</option>
                                    <option value="Out for Delivery">Final Mile Delivery</option>
                                    <option value="Delivered">Successfully Delivered</option>
                                  </optgroup>
                                  <option value="Cancelled" className="text-red-600 font-bold">Void/Cancel Shipment</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              {/* Assign Delivery Partner (Carrier & Tracking) */}
                              <button
                                type="button"
                                onClick={() => setExpandedTracking(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                className={`w-full py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-2 border ${
                                  expandedTracking[order.id]
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Truck size={14} className={expandedTracking[order.id] ? 'text-white' : 'text-indigo-600'} />
                                  {expandedTracking[order.id] ? 'Hide Carrier details' : 'Assign Delivery Partner'}
                                </span>
                                <ChevronDown 
                                  size={14} 
                                  className={`transform transition-transform duration-300 ${
                                    expandedTracking[order.id] ? 'rotate-180' : ''
                                  }`} 
                                />
                              </button>

                              {/* Dropdown toggling for the entire inventory list */}
                              <button
                                type="button"
                                onClick={() => setExpandedCargo(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                className={`w-full py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-2 border ${
                                  expandedCargo[order.id]
                                    ? 'bg-slate-950 border-slate-950 text-white shadow-lg'
                                    : 'bg-indigo-600 border-indigo-600 text-white hover:bg-slate-900 hover:border-slate-900 shadow-lg shadow-indigo-100 hover:shadow-none'
                                }`}
                              >
                                <span>
                                  {expandedCargo[order.id] ? 'Hide Cargo Details' : 'Manage Itemized Cargo'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded-md font-extrabold">
                                    {order.items.length}
                                  </span>
                                  <ChevronDown 
                                    size={14} 
                                    className={`transform transition-transform duration-300 ${
                                      expandedCargo[order.id] ? 'rotate-180' : ''
                                    }`} 
                                  />
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deep Tracking Breakdown UI */}
                      {expandedTracking[order.id] && (
                        <div className="bg-indigo-50/20 p-8 border-t border-indigo-100/30">
                          <div className="max-w-2xl mx-auto">
                            <ShipmentTrackingEditor 
                              order={order} 
                              onUpdate={(carrier, trackingNumber) => {
                                setOrders(prevOrders => 
                                  prevOrders.map(o => 
                                    o.id === order.id 
                                      ? { 
                                          ...o, 
                                          carrier, 
                                          trackingNumber, 
                                          tracking_number: trackingNumber,
                                          shipmentStatus: o.shipmentStatus || 'In Warehouse',
                                          shipment_status: o.shipmentStatus || 'In Warehouse'
                                        } 
                                      : o
                                  )
                                );
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Deep Inventory Breakdown UI */}
                      {expandedCargo[order.id] && (
                        <div className="bg-slate-50 p-8 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Boxes size={14} className="text-indigo-500" /> Itemized Cargo Breakdown ({order.items.length} units)
                          </p>
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {order.items.map((item, idx) => {
                              const itemKey = `${order.id}_${item.id}`;
                              const displayWeight = cargoWeights[itemKey] !== undefined 
                                ? cargoWeights[itemKey] 
                                : (item.weight || 0).toString();
                              const isWeightChanged = displayWeight !== (item.weight || 0).toString();
                              const parsedWeight = parseFloat(displayWeight);
                              const isValidWeight = !isNaN(parsedWeight) && parsedWeight > 0;
                              const isWeightConfirmed = (item.weight > 0) && !isWeightChanged;

                              return (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                                  <div className="space-y-1 min-w-0 max-w-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900 text-sm truncate">{item.name}</span>
                                      <span className="text-indigo-600 text-xs font-black bg-indigo-52 px-2 py-0.5 rounded-lg border border-indigo-100/50">x{item.quantity || 1}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                        {item.purchaseSource ? `Vendor: ${item.purchaseSource}` : `Source: ${item.source || 'Direct Store'}`}
                                      </span>
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-4">
                                    <div>
                                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider border ${
                                        item.status === 'Received at Warehouse' 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                          : item.status === 'Awaiting Warehouse Arrival' 
                                            ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' 
                                            : 'bg-slate-50 text-slate-600 border-slate-100'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </div>

                                    {/* Interactive Weight & Confirm Button */}
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-black uppercase">Weight</span>
                                        <input 
                                          type="number" 
                                          step="0.01"
                                          className="w-14 bg-transparent text-xs font-bold text-indigo-600 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          value={displayWeight}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setCargoWeights(prev => ({ ...prev, [itemKey]: val }));
                                          }}
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">kg</span>
                                      </div>

                                      <button 
                                        type="button"
                                        disabled={!isWeightChanged || !isValidWeight}
                                        onClick={async () => {
                                          if (isValidWeight) {
                                            await onUpdateOrderItemWeight(order.id, item.id, parsedWeight);
                                            setConfirmedWeights(prev => ({ ...prev, [itemKey]: true }));
                                            toast.success(`Weight for ${item.name} updated to ${parsedWeight} kg!`);
                                          }
                                        }}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                          isWeightChanged && isValidWeight
                                            ? 'bg-indigo-600 hover:bg-slate-900 text-white shadow-md shadow-indigo-100'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100'
                                        }`}
                                      >
                                        Confirm
                                      </button>
                                    </div>

                                    {/* Action Button to Receive */}
                                    {item.status !== 'Received at Warehouse' && (
                                      <div className="flex flex-col items-center sm:items-end gap-1">
                                        <button 
                                          type="button"
                                          disabled={!isWeightConfirmed}
                                          onClick={() => {
                                            if (isWeightConfirmed) {
                                              onUpdateOrderItemStatus(order.id, item.id, 'Received at Warehouse');
                                            }
                                          }}
                                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isWeightConfirmed
                                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100'
                                              : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                                          }`}
                                        >
                                          Receive Item
                                        </button>
                                        {!isWeightConfirmed && (
                                          <span className="text-[8px] text-red-500 font-extrabold tracking-wider uppercase">
                                            {isWeightChanged ? 'Confirm weight first' : 'Set weight to unlock'}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                          <ShipmentTrackingEditor 
                            order={order} 
                            onUpdate={(carrier, trackingNumber) => {
                              setOrders(prevOrders => 
                                prevOrders.map(o => 
                                  o.id === order.id 
                                    ? { 
                                        ...o, 
                                        carrier, 
                                        trackingNumber, 
                                        tracking_number: trackingNumber,
                                        shipmentStatus: o.shipmentStatus || 'In Warehouse',
                                        shipment_status: o.shipmentStatus || 'In Warehouse'
                                      } 
                                    : o
                                )
                              );
                            }}
                          />

                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <FileText size={14} className="text-indigo-500" /> Export Compliance
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <button className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 text-[10px] font-black text-slate-700 uppercase tracking-wider hover:border-indigo-500 hover:text-indigo-600 transition-all group/btn shadow-sm">
                                AWB
                                <Download size={14} className="text-slate-300 group-hover/btn:text-indigo-600 group-hover/btn:translate-y-0.5 transition-all" />
                              </button>
                              <button className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 text-[10px] font-black text-slate-700 uppercase tracking-wider hover:border-indigo-500 hover:text-indigo-600 transition-all group/btn shadow-sm">
                                Packing List
                                <Download size={14} className="text-slate-300 group-hover/btn:text-indigo-600 group-hover/btn:translate-y-0.5 transition-all" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <MapPin size={14} className="text-indigo-500" /> Destination Intelligence
                            </p>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                              <p className="text-xs font-black text-slate-900 leading-relaxed">
                                {order.destination.addressLine1}<br />
                                {order.destination.city}, {order.destination.state}<br />
                                <span className="text-indigo-600">{order.destination.country} {order.destination.zipCode}</span>
                              </p>
                              <div className="flex items-center gap-3 mt-4">
                                 <button className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Phone size={14} /></button>
                                 <button className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><MessageCircle size={14} /></button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex flex-col gap-3">
                             <button 
                               onClick={() => toast.success('Live GPS Link shared with customer via SMS.')}
                               className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                             >
                               Share Tracking Hub
                             </button>
                             <button className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                               View Operational Log
                             </button>
                          </div>
                        </div>
                      </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          ) : adminTab === 'Refunds' ? (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none mb-2">Refund Approval Queue</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending CS Requests</p>
            </div>
            <div className="px-5 py-3 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-2">
              <Clock size={14} className="animate-pulse" />
              {refundRequests.filter(r => r.status === 'Pending Approval').length} Actions Required
            </div>
          </div>

          <div className="overflow-x-auto overflow-hidden rounded-[2rem] border border-slate-100">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Req ID</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reason</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resolution</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                        <RefreshCw size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No pending refund requests</p>
                    </td>
                  </tr>
                ) : (
                  refundRequests.map((req) => (
                    <tr key={req.id} className="border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-black text-slate-900">{req.id}</td>
                      <td className="px-8 py-6 text-sm font-bold text-indigo-600">{req.orderId}</td>
                      <td className="px-8 py-6 font-black text-slate-900 tracking-tight">â‚¹{req.amount.toLocaleString()}</td>
                      <td className="px-8 py-6 text-xs font-semibold text-slate-500 leading-relaxed max-w-xs">{req.reason}</td>
                      <td className="px-8 py-6 text-right">
                        {req.status === 'Pending Approval' ? (
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => {
                                setRefundRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Approved' } : r));
                                toast.success(`Refund ${req.id} approved.`);
                              }}
                              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100 hover:shadow-none"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                setRefundRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Rejected' } : r));
                                toast.error(`Refund ${req.id} rejected.`);
                              }}
                              className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 
                            req.status === 'Refunded' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {req.status}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : adminTab === 'Agents' ? (
        <div className="space-y-8 pb-12">
          {/* Top Panel: Agent Metrics and Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Field Network</div>
                <div className="text-2xl font-black text-slate-900">{agents.length} Deployed</div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Protocols</div>
                <div className="text-2xl font-black text-slate-900">{agents.filter(a => a.status === 'Active').length} Verified</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <Car size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Fleet</div>
                <div className="text-2xl font-black text-slate-900">
                  {agents.filter(a => a.vehicleNumber).length} Vehicles
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Onboard Agent form */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 animate-pulse">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Onboard Field Agent</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Register a new verified courier to the logistics network. Secure login identity auto-syncs with the 5-digit ID block.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                {/* Inputs Row 1: Key Metadata & Demographics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Agent ID (5-Digits)</label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all font-mono"
                      placeholder="e.g. 12345"
                      value={newAgent.id}
                      onChange={e => {
                        const idVal = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setNewAgent({
                          ...newAgent, 
                          id: idVal,
                          email: idVal ? `${idVal.toLowerCase()}.agent@jiffex.com` : ''
                        });
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Legal Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold transition-all"
                      placeholder="e.g. Amit Patel"
                      value={newAgent.name}
                      onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contact Phone</label>
                    <input 
                      type="tel" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all"
                      placeholder="+91 XXXXX"
                      value={newAgent.phone}
                      onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vehicle Plate #</label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all uppercase"
                      placeholder="KA-01-AB-1234"
                      value={newAgent.vehicleNumber}
                      onChange={e => setNewAgent({...newAgent, vehicleNumber: e.target.value})}
                    />
                  </div>
                </div>

                {/* Inputs Row 2: Generated Credentials & Submission Action */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-2">
                  <div className="md:col-span-8">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Work Email (Login ID)</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        disabled
                        className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold font-mono opacity-80 cursor-not-allowed outline-none"
                        placeholder="agentid.agent@jiffex.com"
                        value={newAgent.email}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <button 
                      onClick={handleAddAgent}
                      className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-slate-900 transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      Deploy Field Agent <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Network registry */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Agent Network Directory</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Manage and track active operators & deployment metrics</p>
                </div>
                
                {/* Search field */}
                <div className="relative w-full sm:w-72">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={agentSearch}
                    onChange={e => setAgentSearch(e.target.value)}
                    placeholder="Search name, ID, phone, vehicle plate..."
                    className="w-full pl-10 pr-8 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 transition-all"
                  />
                  {agentSearch && (
                    <button 
                      onClick={() => setAgentSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Directory Header Labels for Large Screens */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-xl mb-4">
                <div className="col-span-3">Agent Profile</div>
                <div className="col-span-2">Contact Info</div>
                <div className="col-span-3">Work Email</div>
                <div className="col-span-2">Fleet Details</div>
                <div className="col-span-2 text-right pr-4">Duty & Actions</div>
              </div>

              {/* Grid or Table layout showing ALL details of agents */}
              <div className="space-y-3">
                {agents.filter(agent => {
                  if (!agentSearch) return true;
                  const query = agentSearch.toLowerCase();
                  return (
                    agent.name.toLowerCase().includes(query) ||
                    agent.id.includes(query) ||
                    agent.phone.includes(query) ||
                    (agent.email && agent.email.toLowerCase().includes(query)) ||
                    (agent.vehicleNumber && agent.vehicleNumber.toLowerCase().includes(query))
                  );
                }).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Users size={36} className="stroke-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No agents match your search filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the search parameter</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agents
                      .filter(agent => {
                        if (!agentSearch) return true;
                        const query = agentSearch.toLowerCase();
                        return (
                          agent.name.toLowerCase().includes(query) ||
                          agent.id.includes(query) ||
                          agent.phone.includes(query) ||
                          (agent.email && agent.email.toLowerCase().includes(query)) ||
                          (agent.vehicleNumber && agent.vehicleNumber.toLowerCase().includes(query))
                        );
                      })
                      .map(agent => {
                        // Calculate metrics
                        const activePickups = orders.filter(
                          o => o.assignedAgentId === agent.id && 
                          (o.status === 'Scheduled' || o.status === 'Pending Pickup')
                        ).length;

                        const completedDuites = orders.filter(
                          o => o.assignedAgentId === agent.id && o.status === 'Delivered'
                        ).length;

                        return (
                          <div 
                            key={agent.id} 
                            className="bg-slate-50 border border-slate-200/80 rounded-2xl hover:border-indigo-300 transition-all p-5 shadow-sm"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                              {/* Profile Field */}
                              <div className="lg:col-span-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 uppercase">
                                  {agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate">{agent.name}</h4>
                                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-black text-indigo-600 font-mono tracking-tight shrink-0">
                                    ID: {agent.id}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const newStatus = agent.status === 'Active' ? 'Inactive' : 'Active';
                                      const updatedAgents = agents.map(a => a.id === agent.id ? { ...a, status: newStatus } : a);
                                      setAgents(updatedAgents);
                                      logAgentActionToSupabase(
                                        'UPDATE',
                                        agent.id,
                                        agent.name,
                                        { ...agent, status: newStatus },
                                        currentUser?.email || 'admin@jiffex.com'
                                      );
                                      toast.success(`Agent ${agent.name} status updated to ${newStatus}`);
                                    }}
                                    className={`inline-block mt-1 ml-2 px-1.5 py-0.5 border rounded text-[9px] font-black uppercase font-mono tracking-tight shrink-0 transition-colors duration-150 cursor-pointer ${
                                      agent.status === 'Active'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                        : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                    }`}
                                    title="Click to toggle agent status"
                                  >
                                    {agent.status}
                                  </button>
                                </div>
                              </div>

                              {/* Contact Info Field */}
                              <div className="lg:col-span-2">
                                <div className="block lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Contact Phone</div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                  <Phone size={12} className="text-slate-400 shrink-0" />
                                  <span>{agent.phone}</span>
                                </div>
                              </div>

                              {/* Email Field */}
                              <div className="lg:col-span-3">
                                <div className="block lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Work Email</div>
                                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                                  <Mail size={12} className="text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[170px] lg:max-w-none">{agent.email || `${agent.id}.agent@jiffex.com`}</span>
                                  <button
                                    onClick={() => {
                                      const loginEmail = agent.email || `${agent.id}.agent@jiffex.com`;
                                      navigator.clipboard.writeText(loginEmail);
                                      toast.success(`Copied login ID: ${loginEmail}`);
                                    }}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                    title="Copy Login Email"
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>
                              </div>

                              {/* Vehicle Plate # */}
                              <div className="lg:col-span-2">
                                <div className="block lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Vehicle Plate #</div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                  <Car size={12} className="text-slate-400 shrink-0" />
                                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                                    {agent.vehicleNumber || 'No Vehicle'}
                                  </span>
                                </div>
                              </div>

                              {/* Duty Metrics and Action Button */}
                              <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-4">
                                {/* Metrics */}
                                <div className="text-left lg:text-right">
                                  <div className="block lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Duty Stats</div>
                                  <div className="flex flex-row lg:flex-col gap-3 lg:gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      Active: <strong className="text-indigo-600">{activePickups}</strong>
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                      Delivered: <strong className="text-emerald-600">{completedDuites}</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Delete button wrapper */}
                                <div>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to remove agent "${agent.name}"? Active work assignments will require re-assignment.`)) {
                                        setAgents(agents.filter(a => a.id !== agent.id));
                                        logAgentActionToSupabase(
                                          'DELETE',
                                          agent.id,
                                          agent.name,
                                          agent,
                                          currentUser?.email || 'admin@jiffex.com'
                                        );
                                        toast.success(`Agent ${agent.name} has been de-registered.`);
                                      }
                                    }}
                                    className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                    title="De-register Agent"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : adminTab === 'Reports' ? (
        <div className="space-y-8 pb-10">
          {/* Executive Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <Package size={20} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Logistics Efficiency</h4>
                <p className="text-2xl font-black mb-4">+14% Growth</p>
                <p className="text-xs text-indigo-100/80 leading-relaxed font-medium">
                  Pickup times are optimizing. Current average: <span className="font-bold text-white">4.2h</span>
                </p>
              </div>
            </div>
            
            <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
              <CheckCircle size={24} className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-1">Quality Assurance</h4>
                <p className="text-2xl font-black mb-4">98.2% Perfect</p>
                <p className="text-xs text-emerald-100/80 leading-relaxed font-medium">
                  Customer satisfaction rating is at an all-time high for international transit.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shadow-slate-100 relative overflow-hidden group">
              <BarChart3 size={24} className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md text-slate-400">
                  <Database size={20} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Data Storage</h4>
                <p className="text-2xl font-black mb-4">Optimization</p>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Cloud resources are operating within nominal parameters. Response time: <span className="text-white">12ms</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Revenue & Volume Distribution</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Last 7 Days Portfolio</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Load</span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { day: 'Mon', revenue: 4500, volume: 1200 },
                      { day: 'Tue', revenue: 7800, volume: 1800 },
                      { day: 'Wed', revenue: 5200, volume: 1500 },
                      { day: 'Thu', revenue: 9100, volume: 2200 },
                      { day: 'Fri', revenue: 6400, volume: 1700 },
                      { day: 'Sat', revenue: 10500, volume: 2800 },
                      { day: 'Sun', revenue: 8200, volume: 2000 },
                    ]}
                  >
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                      itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                      labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={4} fill="transparent" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
              <h3 className="text-xl font-black text-slate-900 mb-2">Transit Status</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Real-time split</p>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Delivered', value: 45, color: '#10b981' },
                          { name: 'Transit', value: 30, color: '#4f46e5' },
                          { name: 'Pending', value: 25, color: '#f59e0b' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {[
                          { name: 'Delivered', value: 45, color: '#10b981' },
                          { name: 'Transit', value: 30, color: '#4f46e5' },
                          { name: 'Pending', value: 25, color: '#f59e0b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900">100%</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Sync</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-8">
                  {[
                    { label: 'Done', color: 'bg-emerald-500' },
                    { label: 'Moving', color: 'bg-indigo-500' },
                    { label: 'Wait', color: 'bg-amber-500' },
                  ].map(status => (
                    <div key={status.label} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                      <span className="text-[9px] font-black text-slate-400 uppercase">{status.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Pulse */}
            <div className="lg:col-span-3 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <div>
                  <h3 className="text-xl font-black text-slate-900">Destination Pulse</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Market Dominance by Region</p>
                </div>
                <Globe className="text-slate-200 w-12 h-12" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { country: 'North America', volume: '48%', trend: '+8.2%', color: 'indigo', icon: Globe },
                  { country: 'Europe', volume: '22%', trend: '+4.1%', color: 'emerald', icon: MapPin },
                  { country: 'Middle East', volume: '15%', trend: '-2.4%', color: 'amber', icon: Search },
                  { country: 'APAC', volume: '10%', trend: '+12.5%', color: 'blue', icon: TrendingUp },
                ].map((market) => (
                  <div key={market.country} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 transition-colors group">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 bg-white rounded-2xl shadow-sm text-${market.color}-600`}>
                        <market.icon size={20} />
                      </div>
                      <span className={`text-[10px] font-black ${market.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                        {market.trend}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{market.country}</div>
                    <div className="text-3xl font-black text-slate-900 mb-4">{market.volume}</div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: market.volume }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full bg-${market.color}-600 rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : adminTab === 'Inventory' ? (
        <div className="w-full space-y-6">
          {/* Sub Tab Selection Bar */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              id="subtab-store-catalog"
              onClick={() => setInventoryActiveSubTab('StoreCatalog')}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
                inventoryActiveSubTab === 'StoreCatalog'
                  ? 'bg-white text-indigo-600 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              Store Catalog
            </button>
            <button
              id="subtab-new-product"
              onClick={() => setInventoryActiveSubTab('NewProduct')}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
                inventoryActiveSubTab === 'NewProduct'
                  ? 'bg-white text-indigo-600 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              New Product
            </button>
            <button
              id="subtab-categories"
              onClick={() => setInventoryActiveSubTab('Categories')}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
                inventoryActiveSubTab === 'Categories'
                  ? 'bg-white text-indigo-600 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              Categories
            </button>
          </div>

          {/* Store Catalog Tab Pane */}
          {inventoryActiveSubTab === 'StoreCatalog' && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Store Catalog</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global Inventory Persistence</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  {/* Category tabs */}
                  <div className="flex bg-slate-100/80 p-1 rounded-2xl overflow-x-auto max-w-full">
                    <button
                      id="cat-tab-all"
                      onClick={() => setSelectedCatalogCategory('All')}
                      className={`px-4 py-2 text-xs font-black rounded-xl whitespace-nowrap transition-all ${
                        selectedCatalogCategory === 'All'
                          ? 'bg-white text-indigo-600 shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-900 font-bold'
                      }`}
                    >
                      All Items ({storeProducts.length})
                    </button>
                    {categories.map(cat => {
                      const count = storeProducts.filter(p => p.category === cat).length;
                      return (
                        <button
                          key={cat}
                          id={`cat-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => setSelectedCatalogCategory(cat)}
                          className={`px-4 py-2 text-xs font-black rounded-xl whitespace-nowrap transition-all ${
                            selectedCatalogCategory === cat
                              ? 'bg-white text-indigo-600 shadow-sm font-black'
                              : 'text-slate-500 hover:text-slate-900 font-bold'
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative group shrink-0">
                    <input 
                      type="text" 
                      placeholder="Filter items..."
                      value={productFilterInput}
                      onChange={e => setProductFilterInput(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  </div>
                </div>
              </div>

              {/* Row-based detailed layout (1 item per line) */}
              <div className="space-y-4">
                {filteredProducts.map(product => {
                  const isEditingThis = editingProductId === product.id;
                  
                  return (
                    <div 
                      key={product.id} 
                      className={`p-6 bg-white rounded-3xl border transition-all duration-300 ${
                        isEditingThis 
                          ? 'border-indigo-500 ring-2 ring-indigo-50 shadow-md' 
                          : 'border-slate-100 hover:border-indigo-100 shadow-xs'
                      } flex flex-col md:flex-row gap-6 items-start`}
                    >
                      {/* Left: Product Image */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 relative flex items-center justify-center mx-auto md:mx-0">
                        <img 
                          src={product.image || 'https://picsum.photos/seed/product/400/400'} 
                          className="w-full h-full object-cover" 
                          alt={product.name} 
                          referrerPolicy="no-referrer" 
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-slate-900/85 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                          {product.id}
                        </span>
                      </div>

                      {/* Right: Speced row container */}
                      {!isEditingThis ? (
                        <div className="flex-grow flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100/50 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                {product.category}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">
                                {product.weight} kg
                              </span>
                              {product.estimatedDelivery && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold">
                                  Delivery: {product.estimatedDelivery}
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                                {product.name}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl mt-1">
                                {product.description || "Premium exporter catalog item. Guaranteed dispatch matching export parameters."}
                              </p>
                            </div>

                            {/* Specifications Row Grid - Detailed View */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-[11px] font-sans">
                              <div>
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Composition</span>
                                <span className="font-black text-slate-800">{product.material || 'Premium Quality'}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Origin of Dispatch</span>
                                <span className="font-black text-slate-800">{product.origin || 'India / South Asia'}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Dimensions Specs</span>
                                <span className="font-black text-slate-800">
                                  {product.dimensions 
                                    ? `${product.dimensions.length} Ã— ${product.dimensions.width} Ã— ${product.dimensions.height} ${product.dimensions.unit}`
                                    : '12 Ã— 10 Ã— 5 cm'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Fulfillment Lead</span>
                                <span className="font-black text-slate-800">{product.estimatedDelivery ? `Within ${product.estimatedDelivery}` : 'Instant Dispatched'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pricing & Control Box */}
                          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 bg-slate-50 lg:bg-transparent p-4 lg:p-0 rounded-2xl w-full lg:w-fit shrink-0">
                            <div className="text-left lg:text-right">
                              <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Catalog Value</span>
                              <span className="text-2xl font-black text-slate-900">â‚¹{product.price.toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProductId(product.id);
                                  setEditPriceValue(product.price.toString());
                                  setEditDeliveryValue(product.estimatedDelivery || '');
                                  setEditTempName(product.name);
                                  setEditTempCategory(product.category);
                                  setEditTempWeight(product.weight.toString());
                                  setEditTempDescription(product.description || '');
                                  setEditTempMaterial(product.material || '');
                                  setEditTempOrigin(product.origin || '');
                                  setEditTempLength(product.dimensions?.length?.toString() || '15');
                                  setEditTempWidth(product.dimensions?.width?.toString() || '12');
                                  setEditTempHeight(product.dimensions?.height?.toString() || '8');
                                }}
                                className="px-4 py-2 bg-indigo-50 hover:bg-slate-900 border border-indigo-100 hover:border-slate-950 text-indigo-700 hover:text-white rounded-xl text-xs font-black transition-all shadow-xs"
                              >
                                Edit Specs
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    await api.deleteProduct(product.id);
                                    setStoreProducts(prev => prev.filter(p => p.id !== product.id));
                                    toast.info(`Product "${product.name}" removed from database catalog.`);
                                  } catch (err: any) {
                                    console.error("DB Delete Product Failed:", err);
                                    // Local fallback
                                    setStoreProducts(prev => prev.filter(p => p.id !== product.id));
                                    toast.info(`Product "${product.name}" removed from local catalog view.`);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-xl transition-all"
                                title="Remove Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Edit Specs form inside the line
                        <div className="flex-grow w-full space-y-4">
                          <div className="bg-indigo-50/55 p-3 rounded-2xl border border-indigo-100/60 mb-2">
                            <h5 className="text-xs font-black text-indigo-950 tracking-wider uppercase mb-0.5 flex items-center gap-1.5">
                              <Box size={14} /> Spec Editor Mode â€” ID: {product.id}
                            </h5>
                            <p className="text-[10px] text-slate-500 font-medium">Configure detailed specifications and variables for customer and packaging calculations.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Product Name</label>
                              <input 
                                type="text"
                                value={editTempName}
                                onChange={(e) => setEditTempName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Price (INR)</label>
                              <input 
                                type="number"
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Category</label>
                              <select 
                                value={editTempCategory}
                                onChange={(e) => setEditTempCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Weight (kg)</label>
                              <input 
                                type="number"
                                step="0.01"
                                value={editTempWeight}
                                onChange={(e) => setEditTempWeight(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Est. Delivery Lead</label>
                              <input 
                                type="text"
                                value={editDeliveryValue}
                                onChange={(e) => setEditDeliveryValue(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. 2 Days, 3 Days"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2 items-end">
                              <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase">L (cm)</label>
                                <input 
                                  type="number"
                                  value={editTempLength}
                                  onChange={(e) => setEditTempLength(e.target.value)}
                                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase">W (cm)</label>
                                <input 
                                  type="number"
                                  value={editTempWidth}
                                  onChange={(e) => setEditTempWidth(e.target.value)}
                                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase">H (cm)</label>
                                <input 
                                  type="number"
                                  value={editTempHeight}
                                  onChange={(e) => setEditTempHeight(e.target.value)}
                                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Material Composition</label>
                              <input 
                                type="text"
                                value={editTempMaterial}
                                onChange={(e) => setEditTempMaterial(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Origin country/city</label>
                              <input 
                                type="text"
                                value={editTempOrigin}
                                onChange={(e) => setEditTempOrigin(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                              <label className="block text-[10px] font-black text-slate-400 uppercase">Product Description & Special Instructions</label>
                              <textarea 
                                value={editTempDescription}
                                onChange={(e) => setEditTempDescription(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProductId(null);
                              }}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const finalPrice = Number(editPriceValue);
                                const finalWeight = Number(editTempWeight);
                                if (!editTempName.trim()) {
                                  toast.error("Name is required.");
                                  return;
                                }
                                if (isNaN(finalPrice) || finalPrice < 0) {
                                  toast.error("Please enter a valid price.");
                                  return;
                                }
                                if (isNaN(finalWeight) || finalWeight <= 0) {
                                  toast.error("Please enter a valid weight.");
                                  return;
                                }
                                
                                const updatedPayload: Partial<StoreProduct> = {
                                  name: editTempName,
                                  price: finalPrice,
                                  category: editTempCategory as any,
                                  weight: finalWeight,
                                  estimatedDelivery: editDeliveryValue,
                                  description: editTempDescription,
                                  material: editTempMaterial,
                                  origin: editTempOrigin,
                                  dimensions: {
                                    length: Number(editTempLength) || 15,
                                    width: Number(editTempWidth) || 12,
                                    height: Number(editTempHeight) || 8,
                                    unit: 'cm'
                                  },
                                  image: product.image
                                };

                                try {
                                  const savedProduct = await api.updateProduct(product.id, updatedPayload);
                                  setStoreProducts(prev => prev.map(p => p.id === product.id ? savedProduct : p));
                                  setEditingProductId(null);
                                  toast.success(`"${editTempName}" specs successfully synchronized with Database!`);
                                } catch (err: any) {
                                  console.error("DB Product Spec Sync Failed:", err);
                                  const localUpdated = { ...product, ...updatedPayload };
                                  setStoreProducts(prev => prev.map(p => p.id === product.id ? localUpdated : p));
                                  setEditingProductId(null);
                                  toast.success(`"${editTempName}" updated offline successfully.`);
                                }
                              }}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-sm"
                            >
                              Save Specs
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400">No products match your filter search</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Product Tab Pane */}
          {inventoryActiveSubTab === 'NewProduct' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Box size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">New Product</h3>
                  <p className="text-xs text-slate-500 font-medium font-sans">Create a new item and publish it directly to the customer store catalog.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                      placeholder="e.g. Traditional Brass Diya"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unit Price (â‚¹)</label>
                      <input 
                        type="number" 
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                        value={newProduct.price || ''}
                        onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payload (kg)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                        value={newProduct.weight || ''}
                        onChange={e => setNewProduct({...newProduct, weight: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Classification</label>
                    <div className="relative">
                      <select 
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all appearance-none cursor-pointer"
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Visual Asset</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                        placeholder="Image URL"
                        value={newProduct.image || ''}
                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      />
                      <label className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer flex items-center justify-center transition-colors shadow-sm" title="Upload Local Asset">
                        <Upload size={18} className="text-slate-400" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (!newProduct.name || !newProduct.price) {
                      toast.error("Name and price are required.");
                      return;
                    }
                    const payload: Partial<StoreProduct> = {
                      name: newProduct.name,
                      price: newProduct.price,
                      category: newProduct.category as any,
                      image: newProduct.image || 'https://picsum.photos/seed/product/400/400',
                      weight: newProduct.weight || 0.5,
                      estimatedDelivery: newProduct.estimatedDelivery || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      description: "Imported product from JiffEX shop catalog.",
                      dimensions: { length: 15, width: 12, height: 8, unit: 'cm' },
                      material: 'Premium quality',
                      origin: 'India'
                    };

                    try {
                      const createdProduct = await api.createProduct(payload);
                      setStoreProducts(prev => [...prev, createdProduct]);
                      setNewProduct({ name: '', price: 0, category: categories[0] || 'Pooja', image: '', weight: 0, estimatedDelivery: '' });
                      toast.success(`"${payload.name}" successfully published to Database Catalog!`);
                      setInventoryActiveSubTab('StoreCatalog');
                    } catch (err: any) {
                      console.error("DB Create Product Failed:", err);
                      const fallbackProd: StoreProduct = {
                        id: 'p' + (storeProducts.length + 1),
                        name: newProduct.name,
                        price: newProduct.price,
                        category: newProduct.category as any,
                        image: newProduct.image || 'https://picsum.photos/seed/product/400/400',
                        weight: newProduct.weight || 0.5,
                        estimatedDelivery: newProduct.estimatedDelivery
                      };
                      setStoreProducts(prev => [...prev, fallbackProd]);
                      setNewProduct({ name: '', price: 0, category: categories[0] || 'Pooja', image: '', weight: 0, estimatedDelivery: '' });
                      toast.success(`"${fallbackProd.name}" successfully published offline!`);
                      setInventoryActiveSubTab('StoreCatalog');
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                >
                  Publish to Catalog
                </button>
              </div>
            </div>
          )}

          {/* Categories Tab Pane */}
          {inventoryActiveSubTab === 'Categories' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Boxes size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Categories</h3>
                  <p className="text-xs text-slate-500 font-medium">Create or remove categories to classify store catalog items.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold"
                    placeholder="New Key..."
                    value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value)}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 group">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{cat}</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : adminTab === 'Rates' ? (
        <div className="w-full space-y-6">
          {/* Sub Tab selection bar */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setRatesActiveSubTab('rates')}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
                ratesActiveSubTab === 'rates'
                  ? 'bg-white text-indigo-600 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              Configurator
            </button>
            <button
              id="history-sub-tab"
              onClick={() => setRatesActiveSubTab('history')}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                ratesActiveSubTab === 'history'
                  ? 'bg-white text-indigo-600 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              <History size={13} />
              History
            </button>
          </div>

          {ratesActiveSubTab === 'history' ? (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold">
                  <History size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 font-sans tracking-tight">Rates & Discounts Modification History</h4>
                  <p className="text-xs text-slate-500 font-medium font-sans">Chronological record of all updates made to shipping costs and special discount adjustments.</p>
                </div>
              </div>

              {shippingHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <History size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-bold font-sans">No modification history recorded yet.</p>
                  <p className="text-xs text-slate-400 mt-1 font-sans">Changes are compiled instantly here when you update shipping configurations.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4 font-sans font-black">Timestamp</th>
                        <th className="px-6 py-4 font-sans font-black">Operator</th>
                        <th className="px-6 py-4 font-sans font-black">Type</th>
                        <th className="px-6 py-4 font-sans font-black">Country</th>
                        <th className="px-6 py-4 text-right font-sans font-black">Old Value</th>
                        <th className="px-6 py-4 text-right font-sans font-black">New Value</th>
                        <th className="px-6 py-4 text-center font-sans font-black">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shippingHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">{entry.timestamp}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded">
                              {entry.updatedBy}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              entry.type === 'Rate' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {entry.type === 'Rate' ? 'Rate / kg' : 'Discount'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-xs text-slate-700">{entry.country}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 font-semibold">
                            {entry.type === 'Rate' ? `â‚¹${entry.oldValue}` : `${entry.oldValue}%`}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-900 font-black">
                            {entry.type === 'Rate' ? `â‚¹${entry.newValue}` : `${entry.newValue}%`}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Shipping Rates & Discounts</h3>
                    <p className="text-xs text-slate-500 font-medium">Manage country-specific per-kg shipping rates and configure global discount offers.</p>
                  </div>
                </div>
                
                <button
                  onClick={handleSaveShippingSettings}
                  disabled={isSavingShipping}
                  id="save-shipping-settings-btn"
                  className="px-6 py-3 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-2xl flex items-center gap-2 text-sm transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  {isSavingShipping ? 'Saving Settings...' : 'Save Operations Configuration'}
                </button>
              </div>

              <div className="space-y-6">
                {/* Left Column: Countries Rates & discounts Editing */}
                <div className="w-full bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 animate-fadeIn">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Operations Config (Rates & Discounts)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {COUNTRIES.map(country => (
                      <div key={country} className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                        <div>
                          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black tracking-wide uppercase mb-1">
                            {country}
                          </span>
                          <div className="text-[10px] font-bold text-slate-400">OPERATIONS RATIO</div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500">Base Rate (Fallback)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">â‚¹</span>
                              <input
                                id={`rate-input-${country}`}
                                type="number"
                                value={editingRates[country] !== undefined ? editingRates[country] : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditingRates(prev => ({
                                    ...prev,
                                    [country]: val
                                  }));
                                }}
                                className="w-full pl-7 pr-12 py-2 text-slate-800 text-sm font-black border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                placeholder="e.g. 996"
                                min="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">/ kg</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500">Country Discount</label>
                            <div className="relative overflow-hidden">
                              <input
                                id={`discount-input-${country}`}
                                type="number"
                                value={editingDiscounts[country] !== undefined ? editingDiscounts[country] : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditingDiscounts(prev => ({
                                    ...prev,
                                    [country]: val
                                  }));
                                }}
                                className="w-full pl-3 pr-14 py-2 text-rose-600 text-sm font-black border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-100"
                                placeholder="0"
                                min="0"
                                max="100"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-500">% OFF</span>
                            </div>
                          </div>

                          {/* Weight Rate Bands section */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Weight Bands ({editingRateBands[country]?.length || 0})</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const existing = editingRateBands[country] || [];
                                  const lastMax = existing.length > 0 ? existing[existing.length - 1].maxWeight : 0;
                                  const newBand: RateBand = {
                                    id: `${country.toLowerCase()}-${Date.now()}`,
                                    minWeight: lastMax,
                                    maxWeight: lastMax + 5,
                                    rate: Number(editingRates[country]) || 800,
                                  };
                                  setEditingRateBands(prev => ({
                                    ...prev,
                                    [country]: [...(prev[country] || []), newBand]
                                  }));
                                }}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                              >
                                + Add Band
                              </button>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {(editingRateBands[country] || []).map((band, idx) => (
                                <div key={band.id || idx} className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={band.minWeight}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setEditingRateBands(prev => {
                                            const updated = [...(prev[country] || [])];
                                            updated[idx] = { ...updated[idx], minWeight: val };
                                            return { ...prev, [country]: updated };
                                          });
                                        }}
                                        className="w-12 py-0.5 px-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-center"
                                      />
                                      <span className="text-[10px] text-slate-400">-</span>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={band.maxWeight >= 999 ? '999' : band.maxWeight}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 999;
                                          setEditingRateBands(prev => {
                                            const updated = [...(prev[country] || [])];
                                            updated[idx] = { ...updated[idx], maxWeight: val };
                                            return { ...prev, [country]: updated };
                                          });
                                        }}
                                        className="w-12 py-0.5 px-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-center"
                                      />
                                      <span className="text-[10px] text-slate-400 font-bold">kg</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingRateBands(prev => ({
                                          ...prev,
                                          [country]: (prev[country] || []).filter((_, i) => i !== idx)
                                        }));
                                      }}
                                      className="text-slate-300 hover:text-rose-500 font-bold text-[10px]"
                                    >
                                      âœ•
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between gap-1">
                                    <div className="relative flex-1">
                                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">â‚¹</span>
                                      <input
                                        type="number"
                                        value={band.rate}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setEditingRateBands(prev => {
                                            const updated = [...(prev[country] || [])];
                                            updated[idx] = { ...updated[idx], rate: val };
                                            return { ...prev, [country]: updated };
                                          });
                                        }}
                                        className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black"
                                      />
                                    </div>
                                    <label className="flex items-center gap-1 cursor-pointer text-[9px] font-bold text-slate-500">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(band.isFlat)}
                                        onChange={(e) => {
                                          const val = e.target.checked;
                                          setEditingRateBands(prev => {
                                            const updated = [...(prev[country] || [])];
                                            updated[idx] = { ...updated[idx], isFlat: val };
                                            return { ...prev, [country]: updated };
                                          });
                                        }}
                                        className="w-3 h-3 text-indigo-600 rounded"
                                      />
                                      Flat
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Campaigns Monitor underneath as text, no box required */}
                  <div className="mt-8 pt-6 border-t border-slate-200/50">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Campaigns Monitor</div>
                    <h4 className="text-sm font-black text-slate-900 mb-1">Active Region Discounts</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                      The active shipping discount rates currently configured specifically for selected destination regions.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRIES.filter(c => Number(editingDiscounts[c]) > 0).map(c => (
                        <div key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                          <span className="font-semibold text-slate-500">{c}:</span>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded text-[10px] border border-emerald-100">
                            {editingDiscounts[c]}% OFF
                          </span>
                        </div>
                      ))}
                      {COUNTRIES.filter(c => Number(editingDiscounts[c]) > 0).length === 0 && (
                        <p className="text-xs text-slate-400 italic">
                          No active country discounts. Flat rates are applied at checkout.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic 5-character Coupon Codes Section */}
                  <div className="mt-8 pt-6 border-t border-slate-200/50">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Coupon Codes Management (5 Characters)</div>
                    <div className="flex flex-col gap-6 w-full">
                      
                      {/* Create Coupon Form (Full Width) */}
                      <div className="w-full bg-white p-6 rounded-[2.5rem] border border-slate-150 shadow-xs space-y-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 font-sans tracking-tight">
                            <TicketIcon size={16} className="text-indigo-600" />
                            Create Coupon Code
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium font-sans">Add a custom 5-character coupon offering active percentage discount on the total bill.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500">Coupon Code (5 Chars)</label>
                            <input
                              type="text"
                              maxLength={5}
                              value={newCouponCode}
                              onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                              className="w-full px-3 py-2 text-slate-800 text-sm font-black uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
                              placeholder="e.g. SHIP5"
                            />
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-0.5">
                              <span>Alphanumeric only</span>
                              <span className={newCouponCode.length === 5 ? "text-emerald-500 font-bold" : "text-amber-500 font-medium"}>
                                {newCouponCode.length}/5 characters
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500">Discount Percent (%)</label>
                            <div className="relative">
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={newCouponPercent}
                                onChange={(e) => setNewCouponPercent(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 text-slate-800 text-sm font-black border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                placeholder="10"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const codeClean = newCouponCode.trim();
                              const percentNum = Number(newCouponPercent);
                              if (codeClean.length !== 5) {
                                  toast.error("Coupon code must be exactly 5 characters long.");
                                  return;
                              }
                              if (isNaN(percentNum) || percentNum < 1 || percentNum > 100) {
                                  toast.error("Discount percent must be a valid number between 1 and 100.");
                                  return;
                              }
                              if (adminCoupons.some(c => c.code === codeClean)) {
                                  toast.error(`Coupon code "${codeClean}" already exists.`);
                                  return;
                              }
                              const updated = [...adminCoupons, { code: codeClean, discountPercent: percentNum, isEnabled: true }];
                              setAdminCoupons(updated);
                              setNewCouponCode('');
                              setNewCouponPercent('');
                              toast.success(`Coupon code ${codeClean} (${percentNum}% OFF) prepared! Please click "Save Operations Configuration" to persist and save changes.`);
                            }}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors active:scale-95 shadow-sm h-[38px] mb-[1px]"
                          >
                            <Plus size={14} /> Add Coupon
                          </button>
                        </div>
                      </div>

                      {/* Active Campaign Coupons (Stacked Below) */}
                      <div className="w-full bg-slate-55/40 p-6 rounded-[2.5rem] border border-slate-150 space-y-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 font-sans tracking-tight">Active Campaign Coupons</h4>
                          <p className="text-xs text-slate-500 font-medium">Configure, toggle (enable/disable), or delete stored promotional offers below.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-1">
                          {adminCoupons.length === 0 ? (
                            <div className="sm:col-span-2 text-sm text-slate-400 italic py-8 bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center">
                              <TicketIcon size={24} className="text-slate-300 mb-1" />
                              <span className="font-sans font-medium text-xs">No coupons created yet.</span>
                            </div>
                          ) : (
                            adminCoupons.map((c, idx) => (
                              <div key={`${c.code}-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs transition-hover hover:border-indigo-100">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 tracking-wider">
                                      {c.code}
                                    </span>
                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 px-1.5 py-0.5 rounded">
                                      {c.discountPercent}% OFF
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.isEnabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                                    {c.isEnabled ? "Active" : "Disabled"}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {/* Toggle button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = adminCoupons.map((item, i) => 
                                        i === idx ? { ...item, isEnabled: !item.isEnabled } : item
                                      );
                                      setAdminCoupons(updated);
                                      toast.success(`Coupon code "${c.code}" is now ${!c.isEnabled ? 'Enabled' : 'Disabled'}. Save configuration to persist changes.`);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border ${
                                      c.isEnabled 
                                        ? "bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border-slate-200 text-slate-500" 
                                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100 whitespace-nowrap"
                                    }`}
                                  >
                                    {c.isEnabled ? 'Disable' : 'Enable'}
                                  </button>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = adminCoupons.filter((_, i) => i !== idx);
                                      setAdminCoupons(updated);
                                      toast.info(`Coupon "${c.code}" removed. Save configuration to persist.`);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Delete Coupon"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : adminTab === 'Settings' ? (
        <div className="w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn animate-delay-100">
            {/* Security Gate */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Shield size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">Security Gate</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2FA Authorization</div>
                    <div className="text-sm font-bold text-slate-900">Status: Active</div>
                  </div>
                  <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Login</div>
                    <div className="text-sm font-bold text-slate-900">Restricted Mode</div>
                  </div>
                  <div className="w-10 h-5 bg-slate-200 rounded-full relative">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Assignment Configurations Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-sans">Agent Assignment</h3>
                  <p className="text-xs text-slate-500 font-medium font-sans">Automatic pickup dispatch rules</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1 pr-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-sans">
                      System Dispatch Mode
                    </div>
                    <div className="text-xs font-black text-slate-900 font-sans">
                      {isAutoAssignAgentEnabled ? "Auto-Assign Enabled" : "Manual Assignment Only"}
                    </div>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button
                    onClick={() => setIsAutoAssignAgentEnabled(!isAutoAssignAgentEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative focus:outline-none shrink-0 cursor-pointer ${
                      isAutoAssignAgentEnabled ? 'bg-indigo-600 shadow-xs' : 'bg-slate-200'
                    }`}
                    aria-label="Toggle auto agent assignment"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isAutoAssignAgentEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-[11px] text-slate-500 leading-relaxed font-semibold font-sans">
                  {isAutoAssignAgentEnabled ? (
                    <span>
                      ðŸš€ <strong className="text-indigo-600">Auto-Pilot:</strong> Active background-verified agents are randomly auto-assigned to home pickup requests on booking confirm.
                    </span>
                  ) : (
                    <span>
                      ðŸ›‘ <strong className="text-rose-600">Manual Assign:</strong> No agent will be assigned to new courier bookings. Admin has to manually coordinate assignment.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Data Pipeline Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Database size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">Data Pipeline</h3>
              </div>
              <div className="space-y-4">
                 <button className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup Sync</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-slate-900">Last: 2h ago</span>
                    <RefreshCw size={14} className="text-slate-300 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Are you absolutely sure you want to delete ALL orders and items? This cannot be undone.')) {
                      try {
                        await api.clearAllOrders();
                        setOrders([]);
                        setItems([]);
                        toast.success('Database has been successfully cleared.');
                      } catch (err: any) {
                        toast.error('Failed to clear database: ' + err.message);
                      }
                    }
                  }}
                  className="w-full text-left p-4 bg-red-50 rounded-2xl border border-red-100 hover:bg-red-600 hover:text-white transition-all group"
                >
                  <div className="text-[10px] font-black text-red-500 group-hover:text-red-100 uppercase tracking-widest">Hard Reset</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-black">Clear All Orders & Items</span>
                    <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* System Health Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-900 rounded-2xl flex items-center justify-center text-white">
                  <Cpu size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">System Health</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <span>Server Load</span>
                    <span className="text-slate-900">42%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[42%] h-full bg-indigo-600 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <span>API Latency</span>
                    <span className="text-slate-900">24ms</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[12%] h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <LayoutDashboard className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium tracking-tight">Select an action from the command center</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {availableTabs.map(t => (
              <button 
                key={t}
                onClick={() => setAdminTab(t)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
              >
                Explore {t === 'Inventory' ? 'Inventory' : (t === 'Agents' ? 'Agent Management' : (t === 'Rates' ? 'Shipping Rates' : t))} <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

// --- Weight calculation helpers ---
const getSafeItemUnitWeight = (item: any): number => {
  if (!item) return 0.5;
  const match = STORE_PRODUCTS.find(p => p.name.toLowerCase() === item.name.toLowerCase());
  if (match) return match.weight;
  
  const rawWeight = parseFloat(item.weight);
  if (!isNaN(rawWeight) && rawWeight > 0) {
    if (item.quantity && item.quantity > 1) {
      return Number((rawWeight / item.quantity).toFixed(2));
    }
    return rawWeight;
  }
  return 0.5;
};

const getSafeItemTotalWeight = (item: any): number => {
  if (!item) return 0.5;
  const qty = item.quantity || 1;
  const unit = getSafeItemUnitWeight(item);
  return Number((unit * qty).toFixed(2));
};

const getSafeOrderTotalWeight = (order: any): number => {
  if (!order) return 0;
  
  const itemsList = order.items || [];
  if (itemsList.length > 0) {
    const calculatedSum = itemsList.reduce((acc: number, item: any) => acc + getSafeItemTotalWeight(item), 0);
    if (calculatedSum > 0) return Number(calculatedSum.toFixed(2));
  }
  
  // When pickup is not started (Scheduled or Pending Pickup) and we have no final weighed items yet, show 0 kg as actual weight
  if (order.status === 'Scheduled' || order.status === 'Pending Pickup' || order.status === 'Pending') {
    return 0;
  }
  
  const dbWeight = parseFloat(order.totalWeight || order.total_weight || 0);
  if (!isNaN(dbWeight) && dbWeight > 0) return dbWeight;
  
  if (order.vehicleType) {
    const v = order.vehicleType.toLowerCase();
    if (v.includes('scooter') || v.includes('bike')) return 5;
    if (v.includes('car')) return 15;
    if (v.includes('van')) return 150;
    if (v.includes('truck')) return 500;
  }
  
  if (order.itemType) {
    const t = order.itemType.toLowerCase();
    if (t.includes('heavy')) return 25;
    if (t.includes('documents')) return 0.5;
    if (t.includes('everyday')) return 5;
  }
  
  return 1.5;
};

const ShipmentTrackingEditor = ({ order, onUpdate }: { order: any, onUpdate: (carrier: string, trackingNumber: string) => void }) => {
  const [carrier, setCarrier] = useState(order.carrier || 'FedEx');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || order.tracking_number || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCarrier(order.carrier || 'FedEx');
    setTrackingNumber(order.trackingNumber || order.tracking_number || '');
  }, [order.id, order.carrier, order.trackingNumber, order.tracking_number]);

  const handleSave = async () => {
    const cleanNum = trackingNumber.trim();
    if (!cleanNum) {
      toast.error('Tracking number is required.');
      return;
    }
    setIsSaving(true);
    try {
      await api.updateOrder(order.id, {
        carrier,
        trackingNumber: cleanNum,
        tracking_number: cleanNum,
        shipmentStatus: order.shipmentStatus || order.shipment_status || 'In Warehouse'
      } as any);
      onUpdate(carrier, cleanNum);
      toast.success(`Shipment details for Order ${order.id} saved successfully!`);
    } catch (err: any) {
      console.error('Save shipment info failed:', err);
      toast.error('Could not save shipment info: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-1 border-b border-slate-200/50">
        <Truck size={14} className="text-indigo-500" /> Dispatch Carrier & Tracking
      </p>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Carrier Partner</label>
          <div className="relative">
            <select
              className="w-full p-3 pr-10 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 appearance-none transition-all cursor-pointer shadow-sm hover:border-indigo-200"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="FedEx">FedEx International</option>
              <option value="UPS">UPS Express</option>
              <option value="DHL">DHL Worldwide Express</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Carrier Tracking #</label>
          <input
            type="text"
            className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500"
            placeholder="e.g. TRACKING123"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
        >
          {isSaving ? 'Synchronizing...' : 'Save Dispatch Courier'}
        </button>
      </div>
    </div>
  );
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day (24 hours)

interface StoredActiveSession {
  email: string;
  name?: string;
  loginTime: number;
  expiresAt: number;
}

const getValidActiveSession = (): StoredActiveSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('jiffex_active_user_session');
    if (!raw) return null;
    const sessionData: StoredActiveSession = JSON.parse(raw);
    if (!sessionData || !sessionData.expiresAt || !sessionData.email) {
      localStorage.removeItem('jiffex_active_user_session');
      return null;
    }
    if (Date.now() > sessionData.expiresAt) {
      console.log('[Session Manager] Session expired (> 1 day old). Clearing active session.');
      localStorage.removeItem('jiffex_active_user_session');
      return null;
    }
    return sessionData;
  } catch (e) {
    console.error('[Session Manager] Error parsing active user session:', e);
    localStorage.removeItem('jiffex_active_user_session');
    return null;
  }
};

const saveActiveSession = (email: string, name?: string) => {
  if (typeof window === 'undefined' || !email) return;
  try {
    const now = Date.now();
    const sessionData: StoredActiveSession = {
      email: email.trim(),
      name: (name || '').trim(),
      loginTime: now,
      expiresAt: now + SESSION_EXPIRY_MS // 1 day duration
    };
    localStorage.setItem('jiffex_active_user_session', JSON.stringify(sessionData));
    console.log('[Session Manager] Saved 1-day user session valid until:', new Date(sessionData.expiresAt).toLocaleString());
  } catch (e) {
    console.error('[Session Manager] Failed to save active user session:', e);
  }
};

const clearActiveSession = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('jiffex_active_user_session');
  } catch (e) {
    console.error('[Session Manager] Failed to clear active session:', e);
  }
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionGuestId] = useState(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('jiffex_session_guest_id');
      if (existing) return existing;
      const newId = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('jiffex_session_guest_id', newId);
      return newId;
    }
    return 'guest-user';
  });
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [tabHistory, setTabHistory] = useState<Tab[]>(['home']);
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNewOrderMenu, setShowNewOrderMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [navbarTrackingId, setNavbarTrackingId] = useState('');

  const navigateTo = (tab: Tab) => {
    if (tab === 'finalize') {
      setActiveCheckoutStep(1);
    }
    if (tab === 'pickup') {
      if (!currentUser) {
        // Automatically start fresh for another customer if not signed in
        setPickupName('');
        setPickupEmail('');
        setPickupPhone('');
        setPickupAddress({ street: '', apartment: '', city: '', state: '', zip: '' });
        setPickupDetailsTab('pickup');
        setPickupDestination({
          fullName: '',
          email: '',
          phone: '',
          addressLine1: '',
          city: '',
          state: '',
          zipCode: '',
          country: COUNTRIES[0],
        });
        setPickupLanguage('English');
        setPickupSpecialInstructions('');
        setPickupCategory('Personal Effects');
        setPickupEstimatedWeight('Less than 5 kg');
        setActivePickupStep(1);
        setLastBookingRef(null);
        setIsSchedulingNewPickup(true);
      }
    }
    if (tab !== activeTab) {
      setTabHistory(prev => [...prev, tab]);
      setActiveTab(tab);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const goBack = () => {
    if (tabHistory.length > 1) {
      let newHistory = [...tabHistory];
      newHistory.pop(); // remove current

      if (newHistory.length > 0) {
        const prevTab = newHistory[newHistory.length - 1];
        setTabHistory(newHistory);
        setActiveTab(prevTab);
      } else {
        setActiveTab('home');
        setTabHistory(['home']);
      }
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      setActiveTab('home');
      setTabHistory(['home']);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const [shippingPreference, setShippingPreference] = useState<'International' | 'LocalPickup' | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [items, setItems] = useState<ShippingItem[]>(() => {
    try {
      const saved = localStorage.getItem('jiffex_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const itemsRef = useRef<ShippingItem[]>([]);
  useEffect(() => {
    try {
      localStorage.setItem('jiffex_cart_items', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist cart items to localStorage:', e);
    }
    itemsRef.current = items;
  }, [items]);
  const isMigratingRef = useRef(false);
  const deletedDbItemIdsRef = useRef<Set<string>>(new Set());
  const orderedItemIdsRef = useRef<Set<string>>(new Set());
  const [quote, setQuote] = useState<{ country: string; weight: number } | null>(null);
  const [address, setAddress] = useState<DestinationAddress>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    zipCode: '',
    country: COUNTRIES[0],
  });
  const [selectedDate, setSelectedDate] = useState<string>(SHIPPING_DATES[0]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Derieve appointments from orders in real-time
  const [agents, setAgents] = useState<AgentProfile[]>(() => {
    const saved = localStorage.getItem('jiffex_agents_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved agents list:', e);
      }
    }
    return [
      { id: '10001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: '10001.agent@jiffex.com', status: 'Active', vehicleNumber: 'KA-01-AB-1234' },
      { id: '10002', name: 'Priya Patel', phone: '+91 87654 32109', email: '10002.agent@jiffex.com', status: 'Active', vehicleNumber: 'MH-02-CD-5678' },
      { id: '12345', name: 'Test Agent (You)', phone: '+91 00000 00000', email: '12345.agent@jiffex.com', status: 'Active', vehicleNumber: 'TEST-001' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('jiffex_agents_list', JSON.stringify(agents));
  }, [agents]);

  const appointments = useMemo(() => {
    return orders
      .filter(o => o.status === 'Scheduled' || o.status === 'Pending Pickup' || o.status === 'Picked Up' || (o as any).pickupType)
      .map(o => {
        const agentId = o.assignedAgentId || o.assigned_agent_id || (o as any).destination?.assignedAgentId || (o as any).destination?.assigned_agent_id;
        const resolvedAgent = agentId ? agents.find(a => a.id === agentId) : undefined;
        return {
          id: o.id,
          customerId: o.customerId || (o as any).customer_id,
          customerName: (o as any).pickupAddress?.fullName || o.customerName || o.destination?.fullName || '',
          date: o.shippingDate || (o as any).date || o.createdAt?.split('T')[0],
          time: (o as any).time || 'Flexible',
          address: (o as any).pickupAddress?.addressLine1 || o.destination?.addressLine1 || '',
          phone: (o as any).pickupAddress?.phone || o.destination?.phone || '',
          status: (o.status === 'Scheduled' || o.status === 'Pending Pickup') ? 'Scheduled' : 
                  o.status === 'Cancelled' ? 'Cancelled' : 
                  o.status === 'Picked Up' ? 'Picked Up' : 'Completed',
          items: o.items,
          paymentStatus: o.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
          pickupType: (o as any).pickupType || 'AllAgent',
          assignedAgent: resolvedAgent,
          assignedAgentId: resolvedAgent ? resolvedAgent.id : undefined,
          languagePreference: (o as any).languagePreference,
          itemType: (o as any).itemType,
          vehicleType: (o as any).vehicleType,
          email: o.destination?.email || (o as any).email || ''
        };
      }) as Appointment[];
  }, [orders, agents]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [activeWorkOrder, setActiveWorkOrder] = useState<Appointment | null>(null);
  const [agentActiveTab, setAgentActiveTab] = useState<'Summary' | 'Scheduled' | 'Completed' | 'Canceled'>('Summary');
  const [agentMainTab, setAgentMainTab] = useState<'Summary' | 'Home Pickup'>('Summary');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cart Section States
  const getInitialPickupSlot = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istNow = new Date(utc + (3600000 * 5.5));
    const istDateStr = istNow.toISOString().split('T')[0];
    
    const hourMap: Record<string, number> = {
      '9â€“11 AM': 9,
      '11â€“1 PM': 11,
      '1â€“3 PM': 13,
      '3â€“5 PM': 15,
      '5â€“7 PM': 17,
      '7â€“9 PM': 19
    };

    for (const slot of PICKUP_SLOTS) {
      if (slot.date < istDateStr) continue;
      
      const validTime = slot.times.find(time => {
        if (slot.date > istDateStr) return true;
        return istNow.getHours() < hourMap[time];
      });
      
      if (validTime) {
        return { date: slot.date, time: validTime };
      }
    }
    return { date: PICKUP_SLOTS[0].date, time: PICKUP_SLOTS[0].times[0] };
  };

  const initialSlot = getInitialPickupSlot();
  const [selectedPickupDate, setSelectedPickupDate] = useState(initialSlot.date);
  const [selectedPickupTime, setSelectedPickupTime] = useState(initialSlot.time);
  const [pickupName, setPickupName] = useState('');
  const [pickupEmail, setPickupEmail] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    apartment: '',
    city: '',
    state: '',
    zip: ''
  });
  const [pickupDetailsTab, setPickupDetailsTab] = useState<'pickup' | 'destination'>('pickup');
  const [pickupDestination, setPickupDestination] = useState<DestinationAddress>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    zipCode: '',
    country: COUNTRIES[0],
  });
  const [provideDestinationLater, setProvideDestinationLater] = useState(false);
  const [pickupLanguage, setPickupLanguage] = useState('English');
  const [pickupItemType, setPickupItemType] = useState('Packages & Parcels');
  const [pickupVehicleType, setPickupVehicleType] = useState('Less than 5 kg');
  const [pickupSpecialInstructions, setPickupSpecialInstructions] = useState('');
  const [pickupCategory, setPickupCategory] = useState('Personal Effects');
  const [pickupEstimatedWeight, setPickupEstimatedWeight] = useState('Less than 5 kg');
  const [savePickupToProfile, setSavePickupToProfile] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; checked: boolean }>({ connected: false, checked: false });
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    const s = getValidActiveSession();
    return !!s;
  });
  const [guestEmail, setGuestEmail] = useState<string>(() => {
    const s = getValidActiveSession();
    return s ? s.email : '';
  });
  const [guestName, setGuestName] = useState<string>(() => {
    const s = getValidActiveSession();
    return s ? (s.name || '') : '';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTriggerSource, setLoginTriggerSource] = useState<'default' | 'checkout' | 'pickup'>('default');
  const [showPickupConfirmModal, setShowPickupConfirmModal] = useState(false);
  const [activePickupStep, setActivePickupStep] = useState(1);
  const [activeCheckoutStep, setActiveCheckoutStep] = useState(1);
  const [shopConsolidationOption, setShopConsolidationOption] = useState<'pickup' | 'warehouse' | 'store_only' | null>(null);
  const [showConsolidationError, setShowConsolidationError] = useState(false);
  const [pickupConsolidationOption, setPickupConsolidationOption] = useState<'shop_and_ship' | 'pickup_only' | null>(null);
  const [shopItemsShippingDestination, setShopItemsShippingDestination] = useState<'home' | 'custom' | 'warehouse'>('home');
  const [showPickupConsolidationError, setShowPickupConsolidationError] = useState(false);
  const [showPaymentTroubleModal, setShowPaymentTroubleModal] = useState(false);
  const [paymentTroublePendingOrderSave, setPaymentTroublePendingOrderSave] = useState<(() => Promise<void>) | null>(null);

  // Sync / Read store items from database only
  useEffect(() => {
    const loadProductsFromDb = async () => {
      try {
        console.log('[SUPABASE DATABASE PRODUCTS ONLY] Fetching store catalog...');
        const fetched = await api.fetchProducts();
        if (fetched && fetched.length > 0) {
          setStoreProducts(fetched);
        } else {
          setStoreProducts(STORE_PRODUCTS);
        }
      } catch (err) {
        console.error('[SUPABASE DATABASE PRODUCTS ONLY] Fetch failed, falling back to static list:', err);
        setStoreProducts(STORE_PRODUCTS);
      }
    };
    loadProductsFromDb();
  }, [dbStatus.connected]);

  // Celebration effect for pickup confirmation
  useEffect(() => {
    if (activePickupStep === 5) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [activePickupStep]);

  // Ensure selected pickup time is valid for the selected date (IST)
  useEffect(() => {
    const getISTTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      return new Date(utc + (3600000 * 5.5));
    };
    
    const istNow = getISTTime();
    const istDateStr = istNow.toISOString().split('T')[0];
    
    const currentSlots = PICKUP_SLOTS.find(s => s.date === selectedPickupDate);
    if (!currentSlots) return;

    const hourMap: Record<string, number> = {
      '9â€“11 AM': 9,
      '11â€“1 PM': 11,
      '1â€“3 PM': 13,
      '3â€“5 PM': 15,
      '5â€“7 PM': 17,
      '7â€“9 PM': 19
    };

    const isPast = (time: string) => {
      if (selectedPickupDate < istDateStr) return true;
      if (selectedPickupDate > istDateStr) return false;
      return istNow.getHours() >= hourMap[time];
    };

    if (isPast(selectedPickupTime)) {
      const firstValidTime = currentSlots.times.find(t => !isPast(t));
      if (firstValidTime) {
        setSelectedPickupTime(firstValidTime);
      }
    }
  }, [selectedPickupDate, selectedPickupTime]);
  const [isSchedulingNewPickup, setIsSchedulingNewPickup] = useState(false);
  const [isAutoAssignAgentEnabled, setIsAutoAssignAgentEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jiffex_auto_assign_agent');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('jiffex_auto_assign_agent', String(isAutoAssignAgentEnabled));
  }, [isAutoAssignAgentEnabled]);

  // State persistence on tab transitions is preferred over aggressive resets.
  // This allows the user to navigate back safely from the Cart to their active booking confirmation page.

  const [lastBookingRef, setLastBookingRef] = useState<string | null>(null);
  const userAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (!currentUser || !session?.user) {
        return lastBookingRef ? a.id === lastBookingRef : false;
      }
      return (
        (currentUser.id && a.customerId === currentUser.id) ||
        (currentUser.email && currentUser.email !== 'guest@example.com' && a.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (currentUser.phone && a.phone === currentUser.phone)
      );
    });
  }, [appointments, currentUser, lastBookingRef, session]);

  // Automatically link store consolidation preference when shop_and_ship is selected in home pickup
  useEffect(() => {
    if (pickupConsolidationOption === 'shop_and_ship' && (activeTab === 'pickup' || userAppointments.some(a => a.status === 'Scheduled' || a.status === 'Picked Up'))) {
      setShopConsolidationOption('pickup');
      setShowConsolidationError(false);
    }
  }, [pickupConsolidationOption, activeTab, userAppointments]);

  const [categories, setCategories] = useState(['Pooja', 'Return Gifts', 'Decorative', 'Sweets & Snacks', 'Spices & Gourmet']);
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TKT-8821',
      orderId: 'JF-9901',
      customerEmail: 'amit.sharma@gmail.com',
      subject: 'Shipment Delayed',
      description: 'The package was supposed to arrive yesterday but status is still "In Transit".',
      priority: 'High',
      status: 'Open',
      createdAt: '2 hrs ago',
      comments: [
        { id: 'C1', author: 'System', content: 'Automatically flagged for delay.', createdAt: '2 hrs ago' }
      ]
    },
    {
      id: 'TKT-8822',
      orderId: 'JF-9905',
      customerEmail: 'priya.v@outlook.com',
      subject: 'Damaged Item Received',
      description: 'The brass lamp has a dent on the base. Requesting replacement or refund.',
      priority: 'Medium',
      status: 'In Progress',
      createdAt: '5 hrs ago',
      comments: [
        { id: 'C2', author: 'CSR Support', content: 'Checking with logistics partners.', createdAt: '4 hrs ago' }
      ]
    }
  ]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([
    {
      id: 'REF-1001',
      orderId: 'JF-9905',
      amount: 4500,
      reason: 'Damaged item reported in TKT-8822',
      status: 'Pending Approval',
      requestedAt: '1 day ago'
    }
  ]);

  // Shipping setting states
  const [shippingRates, setShippingRates] = useState<Record<string, number>>(SHIPPING_RATES);
  const [shippingRateBands, setShippingRateBands] = useState<CountryRateBands>(DEFAULT_RATE_BANDS);
  const [editingRateBands, setEditingRateBands] = useState<CountryRateBands>(DEFAULT_RATE_BANDS);
  const [activeBandCountry, setActiveBandCountry] = useState<string | null>('USA');
  const [shippingDiscounts, setShippingDiscounts] = useState<Record<string, number>>({});
  const [coupons, setCoupons] = useState<Array<{ code: string; discountPercent: number; isEnabled: boolean }>>([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  useEffect(() => {
    const fetchShippingSettings = async () => {
      try {
        const data = await api.getShippingSettings();
        if (data && data.rates) {
          setShippingRates(data.rates);
        }
        if (data && data.rateBands) {
          setShippingRateBands(data.rateBands);
          setEditingRateBands(data.rateBands);
        }
        if (data && data.discounts) {
          setShippingDiscounts(data.discounts);
        }
        if (data && data.coupons) {
          setCoupons(data.coupons);
        }
      } catch (err) {
        console.error("Error fetching shipping settings:", err);
      }
    };
    fetchShippingSettings();
  }, []);

  // Home Section States
  const [qCountry, setQCountry] = useState(COUNTRIES[0]);
  const [qWeight, setQWeight] = useState(1);
  const [qMethod, setQMethod] = useState<'Standard' | 'Express'>('Express');
  const [trackingId, setTrackingId] = useState('');

  // Handle URL parameters for tracking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as Tab;
    const id = params.get('id');
    
    if (tab === 'track' && id) {
      setActiveTab('track');
      setTrackingId(id);
      // Clean up URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Scroll to top when pickup step or tab changes
  useEffect(() => {
    if (activeTab === 'pickup' && activePickupStep >= 1) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activePickupStep, activeTab]);

  const pickupDetailsRef = React.useRef<HTMLDivElement>(null);

  // Scroll to pickup details when tab changes in step 3
  useEffect(() => {
    if (activeTab === 'pickup' && activePickupStep === 3) {
      const timer = setTimeout(() => {
        pickupDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pickupDetailsTab, activePickupStep, activeTab]);

  const quoteRef = React.useRef<HTMLDivElement>(null);
  const warehouseItemsRef = React.useRef<HTMLDivElement>(null);
  const pickupHeaderRef = React.useRef<HTMLDivElement>(null);

  const scrollToQuote = () => {
    const el = isMobile 
      ? (document.getElementById('mobile-quick-quote') || document.getElementById('desktop-quick-quote') || quoteRef.current)
      : (document.getElementById('desktop-quick-quote') || document.getElementById('mobile-quick-quote') || quoteRef.current);
    if (el) {
      if (!isMobile) {
        const yOffset = -100; // 80px sticky nav + 20px comfortable breathing space
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleQuickQuoteClick = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTabHistory(prev => [...prev, 'home' as Tab]);
      setTimeout(() => {
        scrollToQuote();
      }, 200);
    } else {
      scrollToQuote();
    }
    setIsMobileMenuOpen(false);
  };

  const handleTrackShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    // Find order or appointment with this ID
    const order = orders.find(o => o.id === trackingId);
    const appointment = appointments.find(a => a.id === trackingId);
    
    if (order) {
      setSelectedOrderForInvoice(order);
      navigateTo('history');
    } else if (appointment) {
      toast.info(`Tracking Appointment ${trackingId}: Status is ${appointment.status}`);
    } else {
      toast.error('Tracking ID not found. Please check and try again.');
    }
  };

  // Admin Section States
  const [adminTab, setAdminTab] = useState<'Overview' | 'Pickups' | 'Logistics' | 'Agents' | 'Inventory' | 'Reports' | 'Settings' | 'Refunds' | 'Rates'>('Overview');

  // Store Section States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showJiffySuggestion, setShowJiffySuggestion] = useState(false);

  // Cart Add States
  const [cartItemName, setCartItemName] = useState('');
  const [cartItemWeight, setCartItemWeight] = useState<number | ''>('');
  const [cartItemQuantity, setCartItemQuantity] = useState(1);
  const [cartItemFragile, setCartItemFragile] = useState(false);
  const [cartItemInvoiceNumber, setCartItemInvoiceNumber] = useState('');
  const [cartItemRemarks, setCartItemRemarks] = useState('');
  const [cartItemPurchaseSource, setCartItemPurchaseSource] = useState('Amazon');
  const [cartItemImageUrl, setCartItemImageUrl] = useState('');
  const [cartItemSource, setCartItemSource] = useState<'Pickup' | 'Warehouse'>('Pickup');

  // Unique Customer ID for Warehouse
  const customerWarehouseId = useMemo(() => {
    if (currentUser) return `JFX-${currentUser.id.slice(0, 5).toUpperCase()}`;
    const savedId = localStorage.getItem('jiffex_customer_id');
    if (savedId) return savedId;
    const newId = `JFX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    localStorage.setItem('jiffex_customer_id', newId);
    return newId;
  }, [currentUser]);

  // Finalize Section States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

  // Work Order Section States
  const [woItems, setWoItems] = useState<ShippingItem[]>([]);
  const [woItemName, setWoItemName] = useState('');
  const [woItemWeight, setWoItemWeight] = useState(1);
  const [woItemQuantity, setWoItemQuantity] = useState(1);
  const [woItemImage, setWoItemImage] = useState('');
  const [capturingItemId, setCapturingItemId] = useState<string | null>(null);
  const [woAddress, setWoAddress] = useState<DestinationAddress>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    zipCode: '',
    country: COUNTRIES[0],
  });
  const [isWOPaid, setIsWOPaid] = useState(false);
  const [woStep, setWoStep] = useState<number>(1);

  // Auto-scroll to top when a step is changed or payment is processed
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollableElements = document.querySelectorAll('.overflow-y-auto, [style*="overflow-y: auto"], [style*="overflow-y: scroll"]');
    scrollableElements.forEach(el => {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [woStep, isWOPaid]);
  const [woStatusInput, setWoStatusInput] = useState<ShippingStatus>('Picked Up');
  const [woOrderId, setWoOrderId] = useState<string | null>(null);
  const [woPaymentMethod, setWoPaymentMethod] = useState<'card' | 'upi' | 'cash'>('card');
  const [woShippingDate, setWoShippingDate] = useState<string>(SHIPPING_DATES[0]);
  const [woIsEditingItems, setWoIsEditingItems] = useState<boolean>(false);
  const [woOtpCode, setWoOtpCode] = useState<string>('');
  const [woOtpSent, setWoOtpSent] = useState<boolean>(false);
  const [woOtpVerified, setWoOtpVerified] = useState<boolean>(false);
  const [woOtpInput, setWoOtpInput] = useState<string>('');
  const [showSimulatedWhatsapp, setShowSimulatedWhatsapp] = useState<boolean>(false);
  const [woDocuments, setWoDocuments] = useState<{ id: string; name: string; image: string; type: string; uploadedAt: string }[]>([]);
  const [woDocName, setWoDocName] = useState('');
  const [woDocType, setWoDocType] = useState('Govt ID Proof');
  const [woDocImage, setWoDocImage] = useState('');
  const [capturingDocId, setCapturingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkOrder) {
      setWoStep(1);
      setWoOtpCode('');
      setWoOtpSent(false);
      setWoOtpVerified(false);
      setWoOtpInput('');
      setShowSimulatedWhatsapp(false);
      // Find corresponding order
      const correspondingOrder = orders.find(o => o.id === activeWorkOrder.id);
      if (correspondingOrder) {
        setWoAddress({
          fullName: correspondingOrder.destination?.fullName || activeWorkOrder.customerName || '',
          email: correspondingOrder.destination?.email || '',
          phone: correspondingOrder.destination?.phone || activeWorkOrder.phone || '',
          addressLine1: correspondingOrder.destination?.addressLine1 || activeWorkOrder.address || '',
          city: correspondingOrder.destination?.city || '',
          state: correspondingOrder.destination?.state || '',
          zipCode: correspondingOrder.destination?.zipCode || '',
          country: correspondingOrder.destination?.country || 'India'
        });
        setWoItems(correspondingOrder.items || []);
        setWoDocuments(correspondingOrder.documents || []);
        setWoStatusInput(correspondingOrder.status === 'Scheduled' || correspondingOrder.status === 'Pending Pickup' ? 'Picked Up' : correspondingOrder.status);
      } else {
        setWoAddress({
          fullName: activeWorkOrder.customerName || '',
          email: '',
          phone: activeWorkOrder.phone || '',
          addressLine1: activeWorkOrder.address || '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        });
        setWoItems(activeWorkOrder.items || []);
        setWoDocuments(activeWorkOrder.documents || []);
        setWoStatusInput('Picked Up');
      }
      setIsWOPaid(correspondingOrder?.paymentStatus === 'Paid');
      setWoIsEditingItems(false);
    } else {
      setWoItems([]);
      setWoDocuments([]);
      setIsWOPaid(false);
      setWoStatusInput('Picked Up');
      setWoIsEditingItems(false);
      setWoOtpCode('');
      setWoOtpSent(false);
      setWoOtpVerified(false);
      setWoOtpInput('');
      setShowSimulatedWhatsapp(false);
      setWoItemName('');
      setWoItemWeight(1);
      setWoItemQuantity(1);
      setWoItemImage('');
      setWoDocName('');
      setWoDocType('Govt ID Proof');
      setWoDocImage('');
      setCapturingDocId(null);
    }
  }, [activeWorkOrder]);

  const [showPickupChoiceModal, setShowPickupChoiceModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState<{ show: boolean; item: any; source: any }>({ show: false, item: null, source: null });
  const [cancellingPickupId, setCancellingPickupId] = useState<string | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrdersForConsolidatedInvoice, setSelectedOrdersForConsolidatedInvoice] = useState<Order[] | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoadingNotifications(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications/${encodeURIComponent(currentUser.id)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    // Check health of backend
    const checkHealth = async () => {
      try {
        const data = await api.checkHealth();
        if (data.status !== 'ok') {
          console.error('Backend health check failed:', data);
          if (data.error && data.error.includes('ENOTFOUND')) {
            setDbError('Database connection failed. Please check your Supabase URL in environment variables.');
          }
        }
      } catch (error: any) {
        console.error('Health check error:', error);
        if (error.message && error.message.includes('ENOTFOUND')) {
          setDbError('Database connection failed. Please check your Supabase URL in environment variables.');
        }
      }
    };
    checkHealth();

    if (activeTab === 'history' || activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, currentUser]);

  const simulateNotification = async (event: string, message: string) => {
    if (!currentUser) return;
    try {
      await fetch(`${API_URL}/api/notifications/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, event, message })
      });
      fetchNotifications();
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  const handleSchedulePickup = () => {
    const missingFields = [];
    if (!pickupName) missingFields.push('Your Name');
    if (!pickupPhone) missingFields.push('Contact Number');
    if (!pickupAddress.street) missingFields.push('Street Address');
    if (!pickupAddress.city) missingFields.push('City');
    if (!pickupAddress.zip) missingFields.push('ZIP Code');

    if (missingFields.length > 0) {
      toast.error(`${missingFields.join(', ')} is not entered. Enter to schedule.`);
      return;
    }

    if (pickupPhone.length !== 10 || !/^\d+$/.test(pickupPhone)) {
      toast.error('Contact Number must be exactly 10 digits.');
      return;
    }

    if (!currentUser) {
      setLoginTriggerSource('pickup');
      setShowLoginModal(true);
      return;
    }

    confirmPickup('AllAgent');
  };

  const generateNewOrderId = useCallback((source: 'Store' | 'Warehouse' | 'Pickup') => {
    let prefix = 'BB';
    if (source === 'Store') prefix = 'SH';
    else if (source === 'Warehouse') prefix = 'SW';
    else if (source === 'Pickup') prefix = 'PH';
    
    // Safety: Ensure we have a valid combined list to check for existing IDs
    const allExisting = [...(orders || []), ...(appointments || [])];
    const relevant = allExisting.filter(o => o.id && o.id.startsWith(prefix));
    
    let maxSeq = 0;
    relevant.forEach(o => {
      const parts = o.id.split('-');
      if (parts.length >= 2) {
        const s = parseInt(parts[1], 10);
        if (!isNaN(s) && s > maxSeq) maxSeq = s;
      }
    });

    const nextSeqNum = maxSeq + 1;
    const seq = nextSeqNum.toString().padStart(5, '0');
    
    let finalId = `${prefix}-${seq}`;
    // Final check for absolute uniqueness (e.g. if there's a custom ID that doesn't follow the pattern)
    if (allExisting.some(o => o.id === finalId)) {
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      finalId = `${prefix}-${seq}-${random}`;
    }
    return finalId;
  }, [orders, appointments]);

  const confirmPickup = async (
    type: 'AllAgent' | 'Mixed' = 'AllAgent',
    overrideCustomerId?: string,
    overrideEmail?: string,
    overrideName?: string
  ) => {
    const assignedAgent = (isAutoAssignAgentEnabled && type === 'AllAgent') ? agents[Math.floor(Math.random() * agents.length)] : undefined;
    const fullAddress = `${pickupAddress.street}${pickupAddress.apartment ? ', ' + pickupAddress.apartment : ''}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zip}`;
    
    let newAppointmentId = generateNewOrderId('Pickup');
    try {
      const resp = await api.getNextOrderId('PH');
      if (resp && resp.nextId) {
        newAppointmentId = resp.nextId;
      }
    } catch (err) {
      console.warn('Failed to get next sequential ID from backend, using fallback:', err);
    }
    
    // Calculate realistic estimated weight
    let estWeight = 3;
    if (pickupEstimatedWeight) {
      if (pickupEstimatedWeight.includes('1-5')) estWeight = 3;
      else if (pickupEstimatedWeight.includes('5-15')) estWeight = 10;
      else if (pickupEstimatedWeight.includes('15-50')) estWeight = 32;
      else if (pickupEstimatedWeight.includes('50+')) estWeight = 75;
      else {
        const match = pickupEstimatedWeight.match(/(\d+)/);
        if (match) estWeight = parseInt(match[0], 10);
      }
    }
    if (estWeight === 0) estWeight = 3;

    const resolvedCustomerId = overrideCustomerId || currentUser?.id || sessionGuestId;
    const resolvedName = pickupName || overrideName || currentUser?.name || 'Guest User';
    const resolvedEmail = pickupEmail || overrideEmail || currentUser?.email || '';

    // Create new order which will derive the appointment
    const newOrder: Order = {
      id: newAppointmentId,
      customerId: resolvedCustomerId,
      items: [],
      totalWeight: estWeight,
      totalCost: 0,
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      shippingDate: selectedPickupDate,
      destination: {
        fullName: provideDestinationLater ? (pickupDestination.fullName || 'To Be Provided Later') : (pickupDestination.fullName || resolvedName),
        email: pickupDestination.email || resolvedEmail,
        phone: pickupDestination.phone || pickupPhone,
        addressLine1: provideDestinationLater ? 'Address details will be provided later (Pending Dispatch)' : (pickupDestination.addressLine1 || ''),
        city: provideDestinationLater ? 'To Be Provided Later' : (pickupDestination.city || ''),
        state: provideDestinationLater ? 'To Be Provided Later' : (pickupDestination.state || ''),
        zipCode: provideDestinationLater ? '000000' : (pickupDestination.zipCode || ''),
        country: pickupDestination.country || COUNTRIES[0]
      },
      pickupAddress: {
        fullName: resolvedName,
        email: resolvedEmail,
        phone: pickupPhone,
        addressLine1: fullAddress,
        city: pickupAddress.city,
        state: pickupAddress.state,
        zipCode: pickupAddress.zip,
        country: 'India'
      },
      paymentStatus: 'Pending',
      pickupType: type,
      assignedAgent: assignedAgent,
      assignedAgentId: assignedAgent?.id,
      languagePreference: pickupLanguage,
      itemType: pickupItemType,
      vehicleType: pickupVehicleType,
      customerName: resolvedName,
      pickupConsolidationOption: pickupConsolidationOption
    } as any;
    
    setOrders([...orders, newOrder]);

    // Send confirmation email
    const recipientEmail = resolvedEmail;
    if (recipientEmail && recipientEmail.includes('@') && recipientEmail !== 'user@example.com') {
      api.sendOrderConfirmationEmail(recipientEmail, newOrder, COMPANY_DETAILS)
        .then(() => toast.success(`Confirmation email sent to ${recipientEmail}`))
        .catch(err => {
          console.error('Failed to send pickup confirmation email:', err);
          toast.error(`Pickup scheduled, but ${err.message || 'failed to send email'}`);
        });
    }

    if (currentUser) {
      if (currentUser.email) {
      }
    }
    if (resolvedCustomerId) {
    }
    if (resolvedEmail) {
    }

    setLastBookingRef(newOrder.id);
    setIsSchedulingNewPickup(false);
    setActivePickupStep(5);
    window.scrollTo(0, 0);

    // Sync to DB
    if (dbStatus.checked) {
      if (isSupabaseConfigured) {
        supabase
          .from('items')
          .delete()
          .eq('user_id', resolvedCustomerId)
          .eq('source', 'Store')
          .then(({ error }) => {
            if (error) console.error('Failed to clear pre-existing Store items from DB on confirmation:', error);
            else console.log('Successfully cleared pre-existing Store items from DB for', resolvedCustomerId);
          })
          .catch(err => console.error('Error during deleting Store items on confirmation:', err));
      }
      try {
        const orderData = {
          ...newOrder,
          customer_id: resolvedCustomerId,
          total_weight: newOrder.totalWeight || 3,
          total_cost: 0,
          destination: newOrder.destination,
          pickup_address: newOrder.pickupAddress,
          payment_status: 'Pending',
          shipping_date: selectedPickupDate
        } as any;

        const savedOrder = await api.createOrder(orderData);
        if (savedOrder && savedOrder.id && savedOrder.id !== newOrder.id) {
          console.log(`[Pickup] Self-healed unique ID from backend: ${savedOrder.id}`);
          setLastBookingRef(savedOrder.id);
          setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, id: savedOrder.id } : o));
        }

        // Also save to 'pickups' table in Supabase
        const targetId = (savedOrder && savedOrder.id) ? savedOrder.id : newOrder.id;
        const pickupData = {
          id: targetId,
          customer_id: resolvedCustomerId,
          customer_name: resolvedName,
          email: resolvedEmail,
          phone: pickupPhone,
          status: 'Scheduled',
          pickup_date: selectedPickupDate,
          pickup_time: 'Flexible',
          address: fullAddress,
          items: [],
          payment_status: 'Pending',
          pickup_type: type,
          assigned_agent_id: assignedAgent?.id,
          language_preference: pickupLanguage,
          item_type: pickupItemType,
          vehicle_type: pickupVehicleType
        };
        await api.createPickup(pickupData);
      } catch (err) {
        console.error('Failed to sync pickup to DB:', err);
      }
    }

    setShowPickupChoiceModal(false);
  };

  const clearPickupInputs = () => {
    setPickupName('');
    setPickupEmail('');
    setPickupPhone('');
    setPickupAddress({ street: '', apartment: '', city: '', state: '', zip: '' });
    setPickupDetailsTab('pickup');
    setPickupDestination({
      fullName: '',
      email: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '',
      zipCode: '',
      country: COUNTRIES[0],
    });
    setProvideDestinationLater(false);
    setPickupLanguage('English');
    setPickupSpecialInstructions('');
    setPickupCategory('Personal Effects');
    setPickupEstimatedWeight('Less than 5 kg');
    setPickupConsolidationOption(null);
    setShowPickupConsolidationError(false);
  };

  const cancelPickup = (id: string) => {
    setCancellingPickupId(id);
  };

  const confirmCancelPickup = () => {
    if (cancellingPickupId) {
      setOrders(prev => prev.filter(o => o.id !== cancellingPickupId));
      setCancellingPickupId(null);
      toast.success('Pickup cancelled successfully.');
    }
  };

  const CheckoutProgressTracker = () => {
    const steps = [
      { id: 'home', label: 'Home', icon: Calculator },
      { id: 'cart', label: 'Collection', icon: Package },
      { id: 'finalize', label: 'Payment', icon: CreditCard },
      { id: 'shipped', label: 'Shipped', icon: Truck },
    ];

    const currentStepIndex = isPaid ? 3 : steps.findIndex(s => s.id === activeTab);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    return (
      <div className="max-w-4xl mx-auto mb-12 px-4">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-emerald-500"
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex || isPaid;
              const isActive = idx === currentStepIndex && !isPaid;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                  </div>
                  <span className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Check backend health and Supabase connection
  useEffect(() => {
    let subscription: any;

    const initializeSupabaseAndAuth = async () => {
      try {
        // Fetch runtime Supabase configuration from the server
        const configRes = await fetch('/api/supabase-config');
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.supabaseUrl && configData.supabaseAnonKey) {
            updateSupabaseConfig(configData.supabaseUrl, configData.supabaseAnonKey);
          }
        }
      } catch (err) {
        console.warn('Unable to reach runtime configuration api:', err);
      }

      // Check backend health
      try {
        const res = await api.checkHealth();
        setDbStatus({ connected: res.supabaseConnected, checked: true });
      } catch (err) {
        setDbStatus({ connected: false, checked: true });
      }

      // Initialize auth session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user?.email) {
          saveActiveSession(session.user.email, session.user.user_metadata?.full_name);
        }
        setAuthLoading(false);
      } catch (err) {
        console.warn('Supabase auth getSession error:', err);
        setAuthLoading(false);
      }

      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session?.user?.email) {
            saveActiveSession(session.user.email, session.user.user_metadata?.full_name);
          }
        });
        subscription = data.subscription;
      } catch (err) {
        console.warn('Supabase auth onAuthStateChange error:', err);
      }
    };

    initializeSupabaseAndAuth();

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Periodic check for 1-day session expiration
  useEffect(() => {
    const checkSessionExpiry = () => {
      const activeSession = getValidActiveSession();
      if ((isGuestMode || session || currentUser) && !activeSession) {
        console.log('[Session Manager] 1-day session expired while logged in. Logging out.');
        toast.info('Your 24-hour session has expired. Please log in again.');
        handleLogout();
      }
    };

    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isGuestMode, session, currentUser]);

  // Sync agents database list with Supabase when connected
  useEffect(() => {
    const loadAgentsFromSupabase = async () => {
      if (dbStatus.connected && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('*');
          if (error) {
            console.error('Error fetching agents from Supabase:', error);
          } else if (data && data.length > 0) {
            const mappedAgents: AgentProfile[] = data.map(a => ({
              id: a.id,
              name: a.name,
              phone: a.phone,
              email: a.email,
              status: a.status as any,
              vehicleNumber: a.vehicle_number || ''
            }));
            setAgents(mappedAgents);
            localStorage.setItem('jiffex_agents_list', JSON.stringify(mappedAgents));
          }
        } catch (e) {
          console.error('Failed to load agents from Supabase:', e);
        }
      }
    };
    loadAgentsFromSupabase();
  }, [dbStatus.connected]);

  // Sync currentUser with session or Guest Mode, restoring custom offline profile if present
  useEffect(() => {
    if (session?.user) {
      const email = session.user.email || '';
      let role: UserRole = 'customer';
      
      const isAgentEmail = email.toLowerCase().endsWith('.agent@jiffex.com') || email === 'agent@jiffex.com';
      
      // Auto-assign roles based on official emails
      if (email === 'admin@jiffex.com') role = 'admin';
      else if (email === 'service@jiffex.com') role = 'customer_service';
      else if (isAgentEmail) role = 'agent';
      else if (email === 'webmaster@jiffex.com') role = 'webmaster';
      else role = (session.user.user_metadata?.role as UserRole) || 'customer';

      const userId = session.user.id;
      const savedProfileStr = localStorage.getItem(`jiffex_user_profile_${userId}`);
      let localProfile: any = {};
      
      if (savedProfileStr) {
        try {
          localProfile = JSON.parse(savedProfileStr);
        } catch (e) {
          console.error("Error parsing stored user profile:", e);
        }
      }

      let nameToUse = localProfile.name || session.user.user_metadata?.full_name || email.split('@')[0] || 'User';
      let phoneToUse = localProfile.phone || '';
      let idToUse = userId;

      if (role === 'agent') {
        const parts = email.toLowerCase().split('.agent@jiffex.com');
        if (parts.length > 1) {
          const matchId = parts[0].toUpperCase();
          idToUse = matchId;
          const registeredAgent = agents.find(a => a.id.toUpperCase() === matchId);
          if (registeredAgent) {
            nameToUse = registeredAgent.name;
            phoneToUse = registeredAgent.phone;
          } else {
            nameToUse = `Agent ${matchId}`;
          }
        } else if (email === 'agent@jiffex.com') {
          idToUse = 'AG-TEST';
          nameToUse = 'Test Agent (You)';
        }
      }

      setCurrentUser({
        id: idToUse,
        name: nameToUse,
        email: localProfile.email || email,
        role: role,
        phone: phoneToUse,
        address: localProfile.address || ''
      });
    } else if (isGuestMode) {
      const email = guestEmail || '';
      let role: UserRole = 'customer';
      
      const isAgentEmail = email.toLowerCase().endsWith('.agent@jiffex.com') || email === 'agent@jiffex.com';
      
      if (email === 'admin@jiffex.com') role = 'admin';
      else if (email === 'service@jiffex.com') role = 'customer_service';
      else if (isAgentEmail) role = 'agent';
      else if (email === 'webmaster@jiffex.com') role = 'webmaster';

      const userId = email ? `guest_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : sessionGuestId;
      const savedProfileStr = localStorage.getItem(`jiffex_user_profile_${userId}`);
      let localProfile: any = {};
      
      if (savedProfileStr) {
        try {
          localProfile = JSON.parse(savedProfileStr);
        } catch (e) {
          console.error("Error parsing stored guest profile:", e);
        }
      }

      let nameToUse = localProfile.name || guestName || 'Guest User';
      let phoneToUse = localProfile.phone || '';
      let idToUse = userId;

      if (role === 'agent') {
        const parts = email.toLowerCase().split('.agent@jiffex.com');
        if (parts.length > 1) {
          const matchId = parts[0].toUpperCase();
          idToUse = matchId;
          const registeredAgent = agents.find(a => a.id.toUpperCase() === matchId);
          if (registeredAgent) {
            nameToUse = registeredAgent.name;
            phoneToUse = registeredAgent.phone;
          } else {
            nameToUse = `Agent ${matchId}`;
          }
        } else if (email === 'agent@jiffex.com') {
          idToUse = 'AG-TEST';
          nameToUse = 'Test Agent (You)';
        }
      } else {
        nameToUse = localProfile.name || guestName || (role === 'admin' ? 'Admin User' : role === 'customer_service' ? 'Support CSR' : role === 'webmaster' ? 'Webmaster' : 'Guest User');
      }

      setCurrentUser({
        id: idToUse,
        name: nameToUse,
        email: localProfile.email || email || 'guest@example.com',
        role: role,
        phone: phoneToUse,
        address: localProfile.address || ''
      });
    } else {
      setCurrentUser(null);
    }
  }, [session, isGuestMode, guestEmail, guestName, agents]);

  // Profile Save Callback Handler
  const handleUpdateProfile = (updatedProfile: { name: string; email: string; phone: string; address: string }) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      ...updatedProfile
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem(`jiffex_user_profile_${currentUser.id}`, JSON.stringify(updatedProfile));
    
    // Fallback/auto-propagate to checkout forms
    setAddress(prev => ({
      ...prev,
      fullName: updatedProfile.name || prev.fullName,
      email: updatedProfile.email || prev.email,
      phone: updatedProfile.phone || prev.phone,
      addressLine1: updatedProfile.address || prev.addressLine1
    }));
  };

  const savePickupProfileToDb = async () => {
    if (!currentUser) {
      console.warn('Cannot save pickup details: No active user session.');
      return;
    }
    
    // Always save locally
    const profileData = {
      name: pickupName,
      email: pickupEmail,
      phone: pickupPhone,
      address: {
        street: pickupAddress.street,
        apartment: pickupAddress.apartment,
        city: pickupAddress.city,
        state: pickupAddress.state,
        zip: pickupAddress.zip
      }
    };
    localStorage.setItem(`jiffex_pickup_profile_${currentUser.id}`, JSON.stringify(profileData));

    // Also sync with main custom profile so other sections benefit from it
    localStorage.setItem(`jiffex_user_profile_${currentUser.id}`, JSON.stringify({
      name: pickupName,
      email: pickupEmail,
      phone: pickupPhone,
      address: `${pickupAddress.street}${pickupAddress.apartment ? ', ' + pickupAddress.apartment : ''}, ${pickupAddress.city}, ${pickupAddress.zip}`
    }));

    // If Supabase is connected, save into customer_profiles table
    if (isSupabaseConfigured && dbStatus.connected) {
      try {
        const { error } = await supabase
          .from('customer_profiles')
          .upsert({
            id: currentUser.id,
            name: pickupName,
            email: pickupEmail,
            phone: pickupPhone,
            street: pickupAddress.street,
            apartment: pickupAddress.apartment || '',
            city: pickupAddress.city,
            state: pickupAddress.state || '',
            zip: pickupAddress.zip,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('[Supabase save customer_profile error]:', error);
          toast.error('Failed to sync profile to database, saved locally instead.');
        } else {
          toast.success('Pickup details saved to your profile!');
        }
      } catch (err) {
        console.error('Failed to upsert user profile in Supabase:', err);
      }
    } else {
      toast.success('Pickup details saved locally!');
    }
  };

  // Fetch and auto-fill profile details from Supabase if configured and user is logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser && isSupabaseConfigured && dbStatus.connected) {
        try {
          const { data, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching customer profile from Supabase:', error);
          } else if (data) {
            // Merge/fill the home pickup details!
            if (data.name) setPickupName(data.name);
            if (data.email) setPickupEmail(data.email);
            if (data.phone) setPickupPhone(data.phone);
            if (data.street || data.city || data.zip) {
              setPickupAddress({
                street: data.street || '',
                apartment: data.apartment || '',
                city: data.city || '',
                state: data.state || '',
                zip: data.zip || ''
              });
            }
          } else {
            // Fallback to current user generic fields if nothing saved in supabase yet
            if (currentUser.name && currentUser.name !== 'User' && currentUser.name !== 'Guest User') {
              setPickupName(currentUser.name);
            }
            if (currentUser.email) {
              setPickupEmail(currentUser.email);
            }
            if (currentUser.phone) {
              setPickupPhone(currentUser.phone);
            }
          }
        } catch (e) {
          console.error('Failed to load user profile details from Supabase:', e);
        }
      } else if (currentUser) {
        // Fallback to local storage or current user object
        const savedLocal = localStorage.getItem(`jiffex_pickup_profile_${currentUser.id}`);
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal);
            if (parsed.name) setPickupName(parsed.name);
            if (parsed.email) setPickupEmail(parsed.email);
            if (parsed.phone) setPickupPhone(parsed.phone);
            if (parsed.address) {
              setPickupAddress({
                street: parsed.address.street || '',
                apartment: parsed.address.apartment || '',
                city: parsed.address.city || '',
                state: parsed.address.state || '',
                zip: parsed.address.zip || ''
              });
            }
          } catch (e) {
            console.error('Failed to parse saved local profile:', e);
          }
        } else {
          if (currentUser.name && currentUser.name !== 'User' && currentUser.name !== 'Guest User') {
            setPickupName(currentUser.name);
          }
          if (currentUser.email) {
            setPickupEmail(currentUser.email);
          }
          if (currentUser.phone) {
            setPickupPhone(currentUser.phone);
          }
        }
      }
    };

    fetchUserProfile();
  }, [currentUser, dbStatus.connected]);

  // Auto-propagate loaded custom profile info to checkout fields
  useEffect(() => {
    if (currentUser) {
      setAddress(prev => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone || '',
        addressLine1: prev.addressLine1 || currentUser.address || ''
      }));
    }
  }, [currentUser]);

  // Helper to normalize data from DB (handles both camelCase and snake_case)
  const normalizeOrder = useCallback((o: any): Order => {
    let dest = o.destination;
    if (typeof dest === 'string') {
      try {
        dest = JSON.parse(dest);
      } catch (e) {
        console.error('Failed to parse destination JSON string:', e);
      }
    }
    
    let its = o.items;
    if (typeof its === 'string') {
      try {
        its = JSON.parse(its);
      } catch (e) {
        console.error('Failed to parse items JSON string:', e);
        its = [];
      }
    } else if (!its) {
      its = [];
    }

    return {
      ...o,
      destination: dest,
      items: its,
      customerId: o.customerId || o.customer_id || dest?.customerId || dest?.customer_id,
      totalWeight: o.totalWeight !== undefined ? o.totalWeight : (o.total_weight !== undefined ? o.total_weight : (dest?.totalWeight || dest?.total_weight || 0)),
      totalCost: o.totalCost !== undefined ? o.totalCost : (o.total_cost !== undefined ? o.total_cost : (dest?.totalCost || dest?.total_cost || 0)),
      paymentStatus: o.paymentStatus || o.payment_status || dest?.paymentStatus || dest?.payment_status || 'Pending',
      shippingDate: o.shippingDate || o.shipping_date || dest?.shippingDate || dest?.shipping_date || dest?.date,
      createdAt: o.createdAt || o.created_at,
      pickupType: o.pickupType || o.pickup_type || dest?.pickupType || dest?.pickup_type || 'AllAgent',
      assignedAgent: o.assignedAgent || o.assigned_agent || dest?.assignedAgent || dest?.assigned_agent,
      assignedAgentId: o.assignedAgentId || o.assigned_agent_id || dest?.assignedAgentId || dest?.assigned_agent_id,
      languagePreference: o.languagePreference || o.language_preference || dest?.languagePreference || dest?.language_preference || 'English',
      itemType: o.itemType || o.item_type || dest?.itemType || dest?.item_type || 'General',
      vehicleType: o.vehicleType || o.vehicle_type || dest?.vehicleType || dest?.vehicle_type || 'Two-Wheeler',
      customerName: o.customerName || o.customer_name || dest?.customerName || dest?.customer_name || dest?.fullName,
      phone: o.phone || dest?.phone,
      date: o.date || dest?.date || o.shippingDate || o.shipping_date,
      time: o.time || dest?.time || 'Flexible',
      address: o.address || dest?.address || dest?.addressLine1
    };
  }, []);

  const refreshItems = useCallback(() => {
    if (dbStatus.checked) {
      if (!currentUser) {
        // If there is no logged in user, keep cart local-only (filter out any old authenticated items)
        setItems(prev => prev.filter(i => !i.user_id && !i.userId));
        return;
      }
      const uId = currentUser.id;
      const roleLower = (currentUser.role || '').toLowerCase();
      const isAdminOrAgent = ['admin', 'webmaster', 'customer_service', 'agent'].includes(roleLower);
      const fetchId = isAdminOrAgent ? 'all' : uId;

      // Detect and migrate any guest items to the current logged-in user
      const guestItems = itemsRef.current.filter(i => !i.user_id && !i.userId);
      if (guestItems.length > 0 && !isAdminOrAgent && !isMigratingRef.current) {
        isMigratingRef.current = true;
        console.log(`[Cart Migration] Found ${guestItems.length} guest items to migrate for user ${uId}`);
        
        const runMigration = async () => {
          try {
            // Immutably associate local items with the logged-in user immediately to prevent duplicate runs
            setItems(prev => prev.map(item => {
              if (!item.user_id && !item.userId) {
                return {
                  ...item,
                  user_id: uId,
                  userId: uId
                };
              }
              return item;
            }));

            for (const item of guestItems) {
              const qty = item.quantity || 1;
              const singleWeight = (item.weight || 0) / qty;
              const singlePrice = (item.price || 0) / qty;
              const idsList = item.ids && item.ids.length > 0 ? item.ids : [item.id];
              
              for (const dId of idsList) {
                try {
                  await api.createItem({
                    id: dId,
                    user_id: uId,
                    name: item.name,
                    weight: singleWeight,
                    price: singlePrice,
                    status: item.status,
                    source: item.source,
                    image: item.image,
                    submitted: item.submitted
                  } as any);
                } catch (err) {
                  console.error('[Cart Migration] Failed to migrate item unit:', err);
                }
              }
            }

            // Fetch the fresh list from database
            const data = await api.fetchItems(fetchId);
            
            // Filter out items that are marked as deleted locally or already ordered to avoid race conditions
            const filteredData = data.map(newItem => {
              if (newItem.ids && newItem.ids.length > 0) {
                const remainingIds = newItem.ids.filter(id => !deletedDbItemIdsRef.current.has(id) && !orderedItemIdsRef.current.has(id));
                if (remainingIds.length === 0) return null;
                const originalQty = newItem.quantity || newItem.ids.length;
                const singleUnitWeight = (newItem.weight || 0) / originalQty;
                const singleUnitPrice = (newItem.price || 0) / originalQty;
                const repId = remainingIds.includes(newItem.id) ? newItem.id : remainingIds[0];
                return {
                  ...newItem,
                  id: repId,
                  ids: remainingIds,
                  quantity: remainingIds.length,
                  weight: singleUnitWeight * remainingIds.length,
                  price: singleUnitPrice * remainingIds.length
                };
              } else {
                if (deletedDbItemIdsRef.current.has(newItem.id) || orderedItemIdsRef.current.has(newItem.id)) return null;
                return newItem;
              }
            }).filter((item): item is NonNullable<typeof item> => item !== null);

            setItems(prev => {
              const merged = filteredData.map(newItem => {
                const localItem = prev.find(p => 
                  p.id === newItem.id || 
                  ((p.name || '').toLowerCase() === (newItem.name || '').toLowerCase() && p.source === newItem.source)
                );
                return {
                  ...newItem,
                  submitted: localItem ? (localItem.submitted !== undefined ? localItem.submitted : newItem.submitted) : newItem.submitted
                };
              });

              // Keep local items that are not in the fetched filteredData,
              // but make sure they are not items we just deleted.
              const localOnlyItems = prev.filter(p => {
                const existsInFetched = filteredData.some(f => 
                  f.id === p.id || 
                  (f.ids && p.ids && f.ids.some(id => p.ids.includes(id))) ||
                  ((f.name || '').toLowerCase() === (p.name || '').toLowerCase() && f.source === p.source)
                );
                if (existsInFetched) return false;

                const wasDeleted = p.ids && p.ids.length > 0 
                  ? p.ids.every(id => deletedDbItemIdsRef.current.has(id))
                  : deletedDbItemIdsRef.current.has(p.id);

                return !wasDeleted;
              });

              const finalMerged = [...merged, ...localOnlyItems];

              if (prev.length === finalMerged.length && prev.every((item, idx) => item.id === finalMerged[idx].id && item.status === finalMerged[idx].status && item.weight === finalMerged[idx].weight && item.submitted === finalMerged[idx].submitted)) {
                return prev;
              }
              return finalMerged;
            });
          } catch (err) {
            console.error('Failed to fetch items after migration:', err);
          } finally {
            isMigratingRef.current = false;
          }
        };

        runMigration();
        return;
      }

      api.fetchItems(fetchId)
        .then(data => {
          // Filter out items that are marked as deleted locally or already ordered to avoid race conditions
          const filteredData = data.map(newItem => {
            if (newItem.ids && newItem.ids.length > 0) {
              const remainingIds = newItem.ids.filter(id => !deletedDbItemIdsRef.current.has(id) && !orderedItemIdsRef.current.has(id));
              if (remainingIds.length === 0) return null;
              const originalQty = newItem.quantity || newItem.ids.length;
              const singleUnitWeight = (newItem.weight || 0) / originalQty;
              const singleUnitPrice = (newItem.price || 0) / originalQty;
              const repId = remainingIds.includes(newItem.id) ? newItem.id : remainingIds[0];
              return {
                ...newItem,
                id: repId,
                ids: remainingIds,
                quantity: remainingIds.length,
                weight: singleUnitWeight * remainingIds.length,
                price: singleUnitPrice * remainingIds.length
              };
            } else {
              if (deletedDbItemIdsRef.current.has(newItem.id) || orderedItemIdsRef.current.has(newItem.id)) return null;
              return newItem;
            }
          }).filter((item): item is NonNullable<typeof item> => item !== null);

          setItems(prev => {
            // Map data and preserve the unpersisted custom properties from our local state (such as 'submitted')
            const merged = filteredData.map(newItem => {
              const localItem = prev.find(p => 
                p.id === newItem.id || 
                ((p.name || '').toLowerCase() === (newItem.name || '').toLowerCase() && p.source === newItem.source)
              );
              return {
                ...newItem,
                submitted: localItem ? (localItem.submitted !== undefined ? localItem.submitted : newItem.submitted) : newItem.submitted
              };
            });

            // Keep local items that are not in the fetched filteredData,
            // but make sure they are not items we just deleted.
            const localOnlyItems = prev.filter(p => {
              const existsInFetched = filteredData.some(f => 
                f.id === p.id || 
                (f.ids && p.ids && f.ids.some(id => p.ids.includes(id))) ||
                ((f.name || '').toLowerCase() === (p.name || '').toLowerCase() && f.source === p.source)
              );
              if (existsInFetched) return false;

              const wasDeleted = p.ids && p.ids.length > 0 
                ? p.ids.every(id => deletedDbItemIdsRef.current.has(id))
                : deletedDbItemIdsRef.current.has(p.id);

              return !wasDeleted;
            });

            const finalMerged = [...merged, ...localOnlyItems];

            if (prev.length === finalMerged.length && prev.every((item, idx) => item.id === finalMerged[idx].id && item.status === finalMerged[idx].status && item.weight === finalMerged[idx].weight && item.submitted === finalMerged[idx].submitted)) {
              return prev;
            }
            return finalMerged;
          });
        })
        .catch(err => console.error('Failed to load items from server:', err));
    }
  }, [currentUser, dbStatus.checked]);

  // Real-time Order and Item Updates (Supabase Realtime)
  useEffect(() => {
    if (!currentUser || !dbStatus.connected) return;

    const roleLower = (currentUser.role || '').toLowerCase();
    const isPrivileged = ['admin', 'webmaster', 'customer_service', 'agent'].includes(roleLower);
    const filterStr = isPrivileged ? undefined : `customer_id=eq.${currentUser.id}`;

    console.log(`[Realtime] Subscribing to order & item updates. Privileged: ${isPrivileged}, User: ${currentUser.id}`);
    
    // Create a channel for order updates
    const channel = supabase
      .channel('public:orders:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(filterStr ? { filter: filterStr } : {}),
        },
        (payload) => {
          console.log('[Realtime] Order Change Detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = normalizeOrder(payload.new);
            setOrders(prev => {
               if (prev.some(o => o.id === newOrder.id)) return prev;
               return [newOrder, ...prev];
            });
            if (isPrivileged) {
              toast.success(`New order received: #${newOrder.id.slice(0, 8)}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const rawNew = payload.new as any;
            const updatedOrder = normalizeOrder(rawNew);
            setOrders(prev => prev.map(o => {
              if (o.id === updatedOrder.id) {
                // Defensive merge to prevent any partial update (e.g. status-only) from wiping out unchanged fields like items, destination, etc.
                const mergedOrder = { ...o };
                
                if (rawNew.status !== undefined && rawNew.status !== null) {
                  mergedOrder.status = updatedOrder.status;
                }
                if (rawNew.payment_status !== undefined && rawNew.payment_status !== null || rawNew.paymentStatus !== undefined && rawNew.paymentStatus !== null) {
                  mergedOrder.paymentStatus = updatedOrder.paymentStatus;
                }
                if (rawNew.items !== undefined && rawNew.items !== null) {
                  mergedOrder.items = updatedOrder.items;
                }
                if (rawNew.destination !== undefined && rawNew.destination !== null) {
                  mergedOrder.destination = { ...o.destination, ...updatedOrder.destination };
                }
                if (rawNew.customer_id !== undefined && rawNew.customer_id !== null || rawNew.customerId !== undefined && rawNew.customerId !== null) {
                  mergedOrder.customerId = updatedOrder.customerId;
                }
                if (rawNew.total_weight !== undefined && rawNew.total_weight !== null || rawNew.totalWeight !== undefined && rawNew.totalWeight !== null) {
                  mergedOrder.totalWeight = updatedOrder.totalWeight;
                }
                if (rawNew.total_cost !== undefined && rawNew.total_cost !== null || rawNew.totalCost !== undefined && rawNew.totalCost !== null) {
                  mergedOrder.totalCost = updatedOrder.totalCost;
                }
                if (rawNew.shipping_date !== undefined && rawNew.shipping_date !== null || rawNew.shippingDate !== undefined && rawNew.shippingDate !== null) {
                  mergedOrder.shippingDate = updatedOrder.shippingDate;
                }
                if (rawNew.assigned_agent_id !== undefined && rawNew.assigned_agent_id !== null || rawNew.assignedAgentId !== undefined && rawNew.assignedAgentId !== null) {
                  mergedOrder.assignedAgentId = updatedOrder.assignedAgentId;
                }
                if (rawNew.assigned_agent !== undefined && rawNew.assigned_agent !== null || rawNew.assignedAgent !== undefined && rawNew.assignedAgent !== null) {
                  mergedOrder.assignedAgent = updatedOrder.assignedAgent;
                }
                if (rawNew.pickup_type !== undefined && rawNew.pickup_type !== null || rawNew.pickupType !== undefined && rawNew.pickupType !== null) {
                  mergedOrder.pickupType = updatedOrder.pickupType;
                }
                if (rawNew.created_at !== undefined && rawNew.created_at !== null || rawNew.createdAt !== undefined && rawNew.createdAt !== null) {
                  mergedOrder.createdAt = updatedOrder.createdAt;
                }

                // Map any other string/scalar fields safely
                const simpleProps = [
                  'customerName', 'phone', 'date', 'time', 'address', 'languagePreference', 'itemType', 'vehicleType'
                ];
                simpleProps.forEach(prop => {
                  const snakeKey = prop.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                  if (rawNew[prop] !== undefined && rawNew[prop] !== null) {
                    (mergedOrder as any)[prop] = (updatedOrder as any)[prop];
                  } else if (rawNew[snakeKey] !== undefined && rawNew[snakeKey] !== null) {
                    (mergedOrder as any)[prop] = (updatedOrder as any)[prop];
                  }
                });

                return mergedOrder;
              }
              return o;
            }));
            const finalUserId = updatedOrder.customerId || currentUser.id;
            if (!isPrivileged || finalUserId === currentUser.id) {
               toast.info(`Order #${updatedOrder.id.slice(0, 8)} status updated to: ${updatedOrder.status}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to orders updates');
        }
      });

    // Create a channel for items updates
    const itemsChannel = supabase
      .channel('public:items:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
        },
        (payload) => {
          console.log('[Realtime] Item Change Detected:', payload);
          refreshItems();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to items updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(itemsChannel);
    };
  }, [currentUser, dbStatus.connected, normalizeOrder, refreshItems]);

  // Fetch orders when currentUser or activeTab changes, with fast-polling for agents/admins
  useEffect(() => {
    if (dbStatus.checked) {
      const uId = currentUser?.id || sessionGuestId;
      const roleLower = (currentUser?.role || '').toLowerCase();
      const isAdminRole = currentUser ? ['admin', 'webmaster', 'customer_service'].includes(roleLower) : false;
      const isAgentRole = roleLower === 'agent';
      
      const processOrders = (data: any[]) => {
        const rawNormalized = data.map(normalizeOrder) as any[];
        
        // Dedup logic to remove stale scheduled duplicates resulting from the old ID-increment bug
        const completed = rawNormalized.filter(o => 
          (o.items?.length || 0) > 0 || 
          ['Picked Up', 'In Warehouse', 'Received at Warehouse', 'Ready to Ship', 'In Transit', 'Out for Delivery', 'Delivered', 'Completed'].includes(o.status)
        );
        const pending = rawNormalized.filter(o => !completed.some(co => co.id === o.id));
        
        const cleanOrders = [...completed];
        const duplicatesToSkipId = new Set<string>();

        for (const pend of pending) {
          const isDup = completed.some(comp => {
            const sameCustomer = String(pend.customerId) === String(comp.customerId);
            const sameDate = pend.shippingDate === comp.shippingDate;
            const sameName = pend.destination?.fullName === comp.destination?.fullName;
            const sameAddress = (pend.destination?.addressLine1 || pend.address) === (comp.destination?.addressLine1 || comp.address);
            
            const pendingNum = parseInt(pend.id.split('-')[1], 10);
            const completedNum = parseInt(comp.id.split('-')[1], 10);
            const isSeqClose = !isNaN(pendingNum) && !isNaN(completedNum) && Math.abs(pendingNum - completedNum) <= 2;

            return sameCustomer && sameDate && sameName && sameAddress && isSeqClose;
          });

          if (isDup && (pend.items?.length || 0) === 0 && (pend.status === 'Scheduled' || pend.status === 'Pending Pickup')) {
            duplicatesToSkipId.add(pend.id);
          } else {
            cleanOrders.push(pend);
          }
        }

        // Sort cleanOrders by date/createdAt descending
        cleanOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
          const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
          return dateB - dateA;
        });

        // Fast-compare with prev list, including status, paymentStatus, item count, totalCost and weight
        setOrders(prev => {
          if (prev.length === cleanOrders.length && 
              prev.every((o: any, idx: number) => {
                const norm = cleanOrders[idx];
                return o.id === norm.id && 
                       o.status === norm.status && 
                       o.paymentStatus === norm.paymentStatus &&
                       (o.items?.length || 0) === (norm.items?.length || 0) &&
                       parseFloat(o.totalWeight || 0) === parseFloat(norm.totalWeight || 0) &&
                       parseFloat(o.totalCost || 0) === parseFloat(norm.totalCost || 0);
              })) {
            return prev;
          }
          return cleanOrders;
        });
      };

      const fetchOrders = () => {
        if (isAdminRole || isAgentRole) {
          api.getAllOrders().then(processOrders).catch(console.error);
        } else {
          api.getOrders(uId, currentUser?.email, currentUser?.phone).then(processOrders).catch(console.error);
        }
      };

      fetchOrders();

      // For Agent, Admin, or Support roles, poll every 3 seconds to ensure instant reflection
      if (isAdminRole || isAgentRole || activeTab === 'agent' || activeTab === 'admin') {
        const intervalId = setInterval(fetchOrders, 3000);
        return () => clearInterval(intervalId);
      }
    }
  }, [currentUser, activeTab, dbStatus.checked, normalizeOrder]);

  // Fetch items from database when currentUser or activeTab changes, supporting admin views
  useEffect(() => {
    refreshItems();
  }, [currentUser, activeTab, sessionGuestId, refreshItems]);

  // Scroll to top when major state changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, activeWorkOrder, isPaid]);

  // --- Helpers ---
  const orderedItemIds = useMemo(() => {
    const ids = new Set<string>();
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item && item.id) {
            ids.add(item.id);
          }
        });
      }
    });
    return ids;
  }, [orders]);

  useEffect(() => {
    orderedItemIdsRef.current = orderedItemIds;
  }, [orderedItemIds]);

  const cartItems = useMemo(() => {
    return items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);
  }, [items, orderedItemIds]);

  const totalWeight = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  }, [cartItems]);

  const hasAllAgentPickup = useMemo(() => {
    return userAppointments.some(a => a.status === 'Scheduled' && a.pickupType === 'AllAgent');
  }, [userAppointments]);

  const totalCost = useMemo(() => {
    const rate = shippingRates[address.country] || 10;
    const rawShippingCost = totalWeight * rate;
    const discountPercent = shippingDiscounts[address.country] || 0;
    const discountAmount = rawShippingCost * (discountPercent / 100);
    const shippingCost = Math.max(0, rawShippingCost - discountAmount);
    const itemsCost = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    return shippingCost + itemsCost;
  }, [cartItems, totalWeight, address.country, shippingRates, shippingDiscounts]);

  const minPickupDate = useMemo(() => {
    const storeItems = items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Store' && i.estimatedDelivery);
    if (storeItems.length === 0) return null;
    
    let latestDate = new Date(0);
    storeItems.forEach(item => {
      const itemDate = new Date(item.estimatedDelivery!);
      if (itemDate > latestDate) {
        latestDate = itemDate;
      }
    });
    return latestDate;
  }, [items, orderedItemIds]);

  const filteredPickupSlots = useMemo(() => {
    if (!minPickupDate) return PICKUP_SLOTS;
    
    return PICKUP_SLOTS.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= minPickupDate;
    });
  }, [minPickupDate]);

  // Update selectedPickupDate if it becomes invalid due to store items
  useEffect(() => {
    if (!minPickupDate) return;

    const currentSelectedDate = new Date(selectedPickupDate);
    if (currentSelectedDate < minPickupDate) {
      const validSlot = PICKUP_SLOTS.find(slot => new Date(slot.date) >= minPickupDate);
      if (validSlot) {
        setSelectedPickupDate(validSlot.date);
      }
    }
  }, [minPickupDate, selectedPickupDate]);

  const addItem = useCallback(async (item: Omit<ShippingItem, 'id' | 'status' | 'source'>, source: 'Warehouse' | 'Pickup' | 'Store', force = false) => {
    // Check if item already exists in cart (same name, source, and submission status)
    const existingItemIndex = items.findIndex(i => 
      (i.name || '').toLowerCase() === (item.name || '').toLowerCase() && 
      i.source === source && 
      !orderedItemIds.has(i.id) &&
      (source !== 'Warehouse' || i.submitted === false)
    );

    const newId = crypto.randomUUID();

    if (existingItemIndex !== -1) {
      // Increment quantity
      const quantityToAdd = 1;
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      const singleUnitWeight = item.weight || 0;
      const singleUnitPrice = item.price || 0;
      const currentIds = existingItem.ids || [existingItem.id];

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: (existingItem.quantity || 1) + quantityToAdd,
        weight: (existingItem.weight || 0) + singleUnitWeight,
        price: (existingItem.price || 0) + singleUnitPrice,
        ids: [...currentIds, newId]
      };
      setItems(updatedItems);
      setShowConflictModal({ show: false, item: null, source: null });

      if (dbStatus.checked && currentUser) {
        try {
          await api.createItem({
            id: newId,
            user_id: currentUser.id,
            name: item.name,
            weight: singleUnitWeight,
            price: singleUnitPrice,
            status: existingItem.status,
            source: source,
            image: item.image,
            submitted: source !== 'Warehouse'
          } as any);
        } catch (err: any) {
          console.error('Failed to sync increment item:', err.message);
        }
      }
      return;
    }

    const newItem: ShippingItem = {
      ...item,
      id: newId,
      ids: [newId],
      status: source === 'Store' ? 'Received at Warehouse' : source === 'Warehouse' ? 'Awaiting Warehouse Arrival' : 'Pending',
      source: source,
      quantity: 1,
      submitted: source !== 'Warehouse'
    };
    
    // Optimistic update
    setItems([...items, newItem]);
    setShowConflictModal({ show: false, item: null, source: null });

    // Try to sync to backend database
    if (dbStatus.checked && currentUser) {
      try {
        await api.createItem({
          ...newItem,
          user_id: currentUser.id // Ensure user_id is passed
        } as any);
      } catch (err: any) {
        console.error('Failed to sync item to DB:', err.message);
      }
    }
  }, [items, dbStatus.checked, currentUser, sessionGuestId, orderedItemIds]);

  const removeItem = useCallback((id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    
    if (itemToDelete) {
      const idsToDelete = itemToDelete.ids && itemToDelete.ids.length > 0 ? itemToDelete.ids : [id];
      idsToDelete.forEach(dId => deletedDbItemIdsRef.current.add(dId));
      
      if (dbStatus.checked && currentUser) {
        for (const dId of idsToDelete) {
          api.deleteItem(dId).catch(err => console.error('Failed to delete item from DB:', err));
        }
      }
    }
  }, [items, dbStatus.checked, currentUser]);

  const updateItemQuantity = useCallback((id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (delta === -1 && (item.quantity || 1) <= 1) {
      removeItem(id);
      return;
    }

    if (delta === 1) {
      const newId = crypto.randomUUID();
      const singleUnitWeight = item.weight / (item.quantity || 1);
      const singleUnitPrice = (item.price || 0) / (item.quantity || 1);
      
      setItems(prev => prev.map(i => {
        if (i.id === id) {
          return {
            ...i,
            quantity: (i.quantity || 1) + 1,
            weight: i.weight + singleUnitWeight,
            price: (i.price || 0) + singleUnitPrice,
            ids: [...(i.ids || [i.id]), newId]
          };
        }
        return i;
      }));

      if (dbStatus.checked && currentUser) {
        api.createItem({
          id: newId,
          user_id: currentUser.id,
          name: item.name,
          weight: singleUnitWeight,
          price: singleUnitPrice,
          status: item.status,
          source: item.source,
          image: item.image,
          submitted: item.submitted
        } as any).catch(err => console.error('Failed to sync increment item:', err));
      }
    } else if (delta === -1) {
      const currentIds = [...(item.ids || [item.id])];
      const idToRemove = currentIds.pop() || id;
      deletedDbItemIdsRef.current.add(idToRemove); // Track locally deleted item unit ID
      
      const singleUnitWeight = item.weight / (item.quantity || 1);
      const singleUnitPrice = (item.price || 0) / (item.quantity || 1);

      setItems(prev => prev.map(i => {
        if (i.id === id) {
          return {
            ...i,
            quantity: (i.quantity || 1) - 1,
            weight: i.weight - singleUnitWeight,
            price: (i.price || 0) - singleUnitPrice,
            ids: currentIds
          };
        }
        return i;
      }));

      if (dbStatus.checked && currentUser) {
        api.deleteItem(idToRemove).catch(err => console.error('Failed to sync decrement item:', err));
      }
    }
  }, [items, dbStatus.checked, currentUser, removeItem]);

  const removeStoreItem = useCallback((name: string) => {
    const item = items.find(i => (i.name || '').toLowerCase() === name.toLowerCase() && i.source === 'Store' && !orderedItemIds.has(i.id));
    if (!item) return;
    
    if ((item.quantity || 1) <= 1) {
      removeItem(item.id);
    } else {
      updateItemQuantity(item.id, -1);
    }
  }, [items, removeItem, updateItemQuantity, orderedItemIds]);

  const updateOrderItemStatus = async (orderId: string, itemId: string, status: ShippingStatus) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => 
            item.id === itemId || (item.id.slice(0, 8) === itemId.slice(0, 8)) ? { ...item, status } : item
          );
          
          // Check if all items are received at warehouse
          // If all items are 'Received at Warehouse', order status becomes 'Ready to Ship'
          const allReceived = updatedItems.every(item => item.status === 'Received at Warehouse');
          const newOrderStatus = allReceived ? 'Ready to Ship' : order.status;
          
          const updatedOrder = { ...order, items: updatedItems, status: (newOrderStatus as ShippingStatus) };
          
          if (newOrderStatus !== order.status) {
            // Trigger WhatsApp update
            const message = getStatusWhatsAppMessage(
              orderId, 
              newOrderStatus, 
              order.destination?.fullName || 'Valued Customer', 
              order.destination?.country || '', 
              order.totalCost
            );
            setTimeout(() => {
              sendWhatsApp(order.destination?.phone || '', message);
            }, 100);
          }

          // Sync to DB
          if (dbStatus.connected && currentUser) {
            api.updateOrder(orderId, { 
              items: updatedItems, 
              status: updatedOrder.status 
            }).catch(err => console.error('Failed to sync order update:', err));
            
            if (allReceived && order.status !== 'Ready to Ship') {
              toast.info(`Order ${orderId} is now Ready to Ship!`);
            }
          }
          
          return updatedOrder;
        }
        return order;
      });
      return updatedOrders;
    });
  };

  const updateOrderItemWeight = async (orderId: string, itemId: string, weight: number) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => 
            item.id === itemId || (item.id.slice(0, 8) === itemId.slice(0, 8)) ? { ...item, weight } : item
          );
          
          // Re-calculate total weight (assuming item.weight is per unit or total for the quantity? 
          // Previous code uses item.weight directly in total weight calculation usually)
          const totalWeight = updatedItems.reduce((acc, item) => acc + item.weight, 0);
          
          const updatedOrder = { ...order, items: updatedItems, totalWeight: Number(totalWeight.toFixed(2)) };
          
          // Sync to DB
          if (dbStatus.connected && currentUser) {
            api.updateOrder(orderId, { 
              items: updatedItems, 
              totalWeight: updatedOrder.totalWeight 
            }).catch(err => console.error('Failed to sync order weight update:', err));
            toast.success(`Weight updated for item in ${orderId.slice(0, 8)}`);
          }
          
          return updatedOrder;
        }
        return order;
      });
      return updatedOrders;
    });
  };

  const updateItemStatus = async (id: string, status: ShippingStatus) => {
    const item = items.find(i => i.id === id);
    setItems(items.map(i => i.id === id ? { ...i, status } : i));
    
    if (dbStatus.connected && currentUser && item) {
      try {
        await api.updateItemStatus(id, status, currentUser.id, item.name, currentUser.email, currentUser.phone);
      } catch (err) {
        console.error('Failed to update item status in DB:', err);
      }
    }
  };

  const cancelAppointment = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleFinalPayment = async () => {
    if (!currentUser) return;
    const hasScheduledPickup = userAppointments.some(a => a.status === 'Scheduled');
    const cartItems = items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);
    
    // Determine payment status based on pickup and shipping preference
    const isPayAtHome = hasScheduledPickup && shippingPreference === 'International' && !cartItems.some(i => i.source === 'Store');
    const isWarehouseCheckout = cartItems.some(i => i.source === 'Warehouse');
    const paymentStatus = isWarehouseCheckout ? 'Pending' : isPayAtHome ? 'Pay at Home' : 'Paid';

    const hasHomePickupActive = (shopConsolidationOption === 'pickup' && (pickupConsolidationOption === 'shop_and_ship' || userAppointments.some(a => a.status === 'Scheduled' || a.status === 'Picked Up'))) && cartItems.some(i => i.source === 'Store');

    let finalDestination = { ...address };

    if (shippingPreference === 'LocalPickup' || shopItemsShippingDestination === 'warehouse') {
      finalDestination = {
        fullName: WAREHOUSE_ADDRESS.name || 'Jiffex Warehouse Hub',
        email: currentUser?.email || '',
        phone: WAREHOUSE_ADDRESS.phone || '9999999999',
        addressLine1: WAREHOUSE_ADDRESS.street || 'Jiffex Hub',
        city: WAREHOUSE_ADDRESS.city || 'City',
        state: WAREHOUSE_ADDRESS.state || 'State',
        zipCode: WAREHOUSE_ADDRESS.zip || '00000',
        country: WAREHOUSE_ADDRESS.country || 'USA'
      };
    } else if (shopItemsShippingDestination === 'custom') {
      // Use the custom address entered by the user
      finalDestination = {
        fullName: address.fullName || currentUser?.name || '',
        email: address.email || currentUser?.email || '',
        phone: address.phone || currentUser?.phone || '',
        addressLine1: address.addressLine1 || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'USA'
      };
    } else if (hasHomePickupActive || (!address.fullName || !address.addressLine1)) {
      finalDestination = {
        fullName: address.fullName || pickupDestination.fullName || pickupName || currentUser?.name || 'Customer',
        email: address.email || pickupDestination.email || currentUser?.email || '',
        phone: address.phone || pickupDestination.phone || pickupPhone || currentUser?.phone || '9999999999',
        addressLine1: address.addressLine1 || pickupDestination.addressLine1 || (pickupAddress.street ? `${pickupAddress.street}${pickupAddress.apartment ? ', ' + pickupAddress.apartment : ''}` : 'Home Address'),
        city: address.city || pickupDestination.city || pickupAddress.city || 'City',
        state: address.state || pickupDestination.state || pickupAddress.state || 'State',
        zipCode: address.zipCode || pickupDestination.zipCode || pickupAddress.zip || '000000',
        country: address.country || pickupDestination.country || 'USA'
      };
    }

    // Validate checkout details (required if custom address or normal international checkout is selected)
    if (shippingPreference !== 'LocalPickup' && shopItemsShippingDestination !== 'warehouse') {
      if (shopItemsShippingDestination === 'custom' || !hasHomePickupActive) {
        if (!finalDestination.fullName || !finalDestination.phone || !finalDestination.addressLine1 || !finalDestination.city || !finalDestination.zipCode) {
          toast.error('Please complete your shipping address details including your contact phone number.');
          return;
        }
      }
    }

    setAddress(finalDestination);

    // Infer order source from cart items as backup if orderId is falsy
    let finalOrderId = orderId;
    if (!finalOrderId) {
      const hasWarehouse = cartItems.some(i => i.source === 'Warehouse');
      const hasPickup = cartItems.some(i => i.source === 'Pickup');
      const hasStore = cartItems.some(i => i.source === 'Store');

      let inferredSource: 'Store' | 'Warehouse' | 'Pickup' = 'Store';
      if (hasWarehouse) inferredSource = 'Warehouse';
      else if (hasPickup) inferredSource = 'Pickup';
      else if (hasStore) inferredSource = 'Store';

      finalOrderId = generateNewOrderId(inferredSource);
      setOrderId(finalOrderId);
    }

    const isPickupType = finalOrderId.startsWith('PH-') || cartItems.some(i => i.source === 'Pickup');
    const assignedAgent = (isAutoAssignAgentEnabled && isPickupType) ? agents[Math.floor(Math.random() * agents.length)] : undefined;

    const finalCostToPay = appliedCoupon 
      ? Math.max(0, totalCost - (totalCost * (appliedCoupon.discountPercent / 100))) 
      : totalCost;

    const finalShippingDate = selectedDate || selectedPickupDate || SHIPPING_DATES[0];

    const newOrder: Order = {
      id: finalOrderId,
      customerId: currentUser.id,
      items: [...cartItems],
      totalWeight,
      totalCost: finalCostToPay,
      status: isWarehouseCheckout ? 'Request Placed' : (isPickupType ? 'Scheduled' : 'Request Placed'),
      createdAt: new Date().toISOString(),
      shippingDate: finalShippingDate,
      destination: finalDestination,
      paymentStatus: paymentStatus,
      pickupType: isPickupType ? 'AllAgent' : undefined,
      assignedAgent: assignedAgent,
      assignedAgentId: assignedAgent?.id
    } as any;
    
    const saveAndConfirmOrder = async (orderToSave: Order) => {
      // Optimistic update
      setOrders([...orders, orderToSave]);
      setIsPaid(true);

      const isHomePickupPending = !userAppointments.some(a => a.status === 'Scheduled' || a.status === 'Picked Up');
      const hasShopItemsInOrder = (orderToSave.id && orderToSave.id.startsWith('SH-')) || 
                                  (orderToSave.items && orderToSave.items.some(i => i.source === 'Store' || (i.source as any) === 'shop')) || 
                                  cartItems.some(i => i.source === 'Store' || (i.source as any) === 'shop') ||
                                  (activeTab as any) === 'shop' || (activeTab as any) === 'Shop';
      const chosenHomePickup = shopConsolidationOption === 'pickup';

      for (const item of cartItems) {
        const idsToDelete = item.ids && item.ids.length > 0 ? item.ids : [item.id];
        for (const dId of idsToDelete) {
          deletedDbItemIdsRef.current.add(dId);
          if (dbStatus.connected && currentUser) {
            api.deleteItem(dId).catch(err => console.error('Failed to delete item from DB on checkout:', err));
          }
        }
      }

      // Only remove items that were in the cart (submitted)
      setItems(items.filter(i => i.source === 'Warehouse' && !i.submitted));

      // Sync to DB
      if (dbStatus.connected) {
        try {
          const savedOrder = await api.createOrder({
            ...orderToSave,
            id: finalOrderId,
            customer_id: currentUser.id, // Snake case for DB
            total_weight: totalWeight,
            total_cost: finalCostToPay,
            payment_status: orderToSave.paymentStatus,
            shipping_date: selectedDate,
            pickup_type: isPickupType ? 'AllAgent' : undefined,
            assigned_agent: assignedAgent,
            assigned_agent_id: assignedAgent?.id
          } as any);

          let finalSavedOrder = orderToSave;
          if (savedOrder && savedOrder.id && savedOrder.id !== finalOrderId) {
            console.log(`[Order] Self-healed unique ID from backend: ${savedOrder.id}`);
            setOrderId(savedOrder.id);
            finalSavedOrder = { ...orderToSave, id: savedOrder.id };
            setOrders(prev => prev.map(o => o.id === finalOrderId ? finalSavedOrder : o));
          }

          // Automatically send order confirmation email
          const recipientEmail = address.email || currentUser.email;
          if (isWarehouseCheckout) {
            await api.sendOrderConfirmationEmail(recipientEmail, finalSavedOrder, COMPANY_DETAILS);
            toast.success(`Shipment request confirmed! Confirmation sent to ${recipientEmail}.`);
          } else if (isPayAtHome) {
            // Send a special "Pay at Home" confirmation email
            await api.sendOrderConfirmationEmail(recipientEmail, finalSavedOrder, COMPANY_DETAILS);
            toast.success(`Order confirmed! Confirmation sent to ${recipientEmail}. Final billing will be done at your home.`);
          } else {
            // Online paid / UPI: send order confirmation. Invoice will be consolidated on completion.
            await api.sendOrderConfirmationEmail(recipientEmail, finalSavedOrder, COMPANY_DETAILS);
            toast.success(`Payment successful! Order confirmation sent to ${recipientEmail}. Your consolidated tax invoice will be generated when all active orders are completed.`);
          }
        } catch (err: any) {
          console.error('Failed to sync order or send email:', err.message);
          const successMsg = isWarehouseCheckout ? 'Shipment request confirmed' : isPayAtHome ? 'Order confirmed' : 'Payment successful';
          toast.error(`${successMsg}, but ${err.message || 'failed to send confirmation email'}.`);
        }
      } else {
        const successMsg = isWarehouseCheckout 
          ? 'Shipment request confirmed (Offline Mode)' 
          : isPayAtHome 
            ? 'Order confirmed (Offline Mode)' 
            : 'Payment successful (Offline Mode)';
        toast.success(successMsg);
      }
    };

    // Razorpay Integration for online paid checkouts
    if (paymentStatus === 'Paid') {
      try {
        toast.loading("Initializing secure Razorpay payment...", { id: "razorpay-init" });
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.dismiss("razorpay-init");
          throw new Error("Razorpay checkout SDK failed to load. Check your internet connection.");
        }

        // Fetch public Razorpay config key ID
        const configRes = await fetch("/api/payment/razorpay/config");
        if (!configRes.ok) {
          toast.dismiss("razorpay-init");
          throw new Error("Razorpay Key ID is not configured on the server. Please define RAZORPAY_KEY_ID in environment variables.");
        }
        const { keyId } = await configRes.json();

        // Create transaction order on backend
        const orderRes = await fetch("/api/payment/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalCostToPay,
            currency: "INR",
            receipt: `rcpt_${finalOrderId}`
          })
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json();
          toast.dismiss("razorpay-init");
          throw new Error(errData.error || "Failed to initiate payment transaction on the server.");
        }
        const razorpayOrder = await orderRes.json();
        toast.dismiss("razorpay-init");

        // Open official Razorpay checkout modal
        const options = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Jiffex International Logistics",
          description: `Order ${finalOrderId} payment`,
          image: "https://lh3.googleusercontent.com/d/14pgrQ4cnN4z6ymvfRCnRa-Q5kR8aW1Xr",
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            try {
              toast.loading("Verifying payment transaction...", { id: "razorpay-verify" });
              
              // Verify response signature on backend for security
              const verifyRes = await fetch("/api/payment/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              if (!verifyRes.ok) {
                toast.dismiss("razorpay-verify");
                toast.error("Payment verification failed! Please try again.");
                return;
              }

              toast.dismiss("razorpay-verify");
              toast.success("Payment verified successfully!");

              // Persist and confirm order
              const paidOrder = { ...newOrder, paymentStatus: 'Paid' as any };
              await saveAndConfirmOrder(paidOrder);
            } catch (err: any) {
              toast.dismiss("razorpay-verify");
              toast.error(`Verification error: ${err.message || err}`);
            }
          },
          prefill: {
            name: currentUser.name || address.fullName,
            email: currentUser.email || address.email,
            contact: currentUser.phone || address.phone,
            method: paymentMethod === 'upi' ? 'upi' : undefined,
          },
          notes: {
            order_id: finalOrderId,
            customer_id: currentUser.id
          },
          theme: {
            color: "#4f46e5", // Indigo theme color
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment window closed.");
              setPaymentTroublePendingOrderSave(() => async () => {
                const paidOrder = { ...newOrder, paymentStatus: 'Paid' as any };
                await saveAndConfirmOrder(paidOrder);
              });
              setShowPaymentTroubleModal(true);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

      } catch (err: any) {
        console.error("Razorpay error, falling back to simulated checkout:", err);
        setPaymentTroublePendingOrderSave(() => async () => {
          const paidOrder = { ...newOrder, paymentStatus: 'Paid' as any };
          await saveAndConfirmOrder(paidOrder);
        });
        setShowPaymentTroubleModal(true);
      }
    } else {
      // Direct placement (e.g. Warehouse or Pay at Home)
      await saveAndConfirmOrder(newOrder);
    }
  };

  const addWOItem = () => {
    if (!woItemName) return;
    const finalWeight = Math.max(0.1, Number(woItemWeight) || 1);
    const finalQty = Math.max(1, Math.round(Number(woItemQuantity)) || 1);
    const newItem: ShippingItem = {
      id: crypto.randomUUID(),
      name: woItemName,
      weight: finalWeight,
      quantity: finalQty,
      status: 'Pending',
      source: 'Pickup',
      image: woItemImage || undefined
    };
    setWoItems([...woItems, newItem]);
    setWoItemName('');
    setWoItemWeight(1);
    setWoItemQuantity(1);
    setWoItemImage('');
  };

  const handleWOSaveDetails = async () => {
    if (!activeWorkOrder) return;

    const totalW = woItems.reduce((s, i) => s + (i.weight * (i.quantity || 1)), 0);
    const rate = shippingRates[woAddress.country] || 10;
    const rawC = totalW * rate;
    const discountPercent = shippingDiscounts[woAddress.country] || 0;
    const discC = rawC * (discountPercent / 100);
    const totalC = Math.max(0, rawC - discC);

    const currentAgent = {
      id: currentUser?.id || 'AG-TEST',
      name: currentUser?.name || 'Test Agent',
      phone: currentUser?.phone || '',
      email: currentUser?.email || '',
      status: 'Active' as const
    };

    // Update original order/appointment with saved items, weight, and details
    setOrders(prev => prev.map(o => 
      o.id === activeWorkOrder!.id 
        ? { 
            ...o, 
            items: woItems,
            totalWeight: totalW,
            totalCost: totalC,
            documents: woDocuments,
            destination: {
              ...o.destination,
              ...woAddress,
              assignedAgent: currentAgent,
              assignedAgentId: currentAgent.id
            } as any,
          } 
        : o
    ));

    // Sync to database if connected
    if (dbStatus.connected) {
      try {
        await api.updateOrder(activeWorkOrder.id, {
          items: woItems,
          totalWeight: totalW,
          totalCost: totalC,
          documents: woDocuments,
          destination: {
            ...woAddress,
            assignedAgent: currentAgent,
            assignedAgentId: currentAgent.id
          } as any,
          assignedAgent: currentAgent,
          assignedAgentId: currentAgent.id,
          assigned_agent: currentAgent,
          assigned_agent_id: currentAgent.id
        } as any);

        // Also update pickups table in Supabase
        if (isSupabaseConfigured) {
          try {
            await api.updatePickup(activeWorkOrder.id, {
              items: woItems,
              status: 'Scheduled',
              paymentStatus: 'Pending',
              assignedAgentId: currentAgent.id,
              pickupDate: woShippingDate,
              address: `${woAddress.addressLine1}, ${woAddress.city}, ${woAddress.country}`
            });
          } catch (e) {
            console.warn('Failed to update pickup details in Supabase:', e);
          }
        }

        toast.success(`Cargo list, documents and details saved successfully!`);
      } catch (err: any) {
        console.warn('Failed to sync details online:', err);
        toast.success('Cargo list and details saved successfully! (Offline mode)');
      }
    } else {
      toast.success(`Cargo list and details saved successfully!`);
    }
  };

  const handleWOComplete = () => {
    if (!activeWorkOrder) return;
    const newOrderId = activeWorkOrder.id; // Correctly align work order ID with invoice ID
    setWoOrderId(newOrderId);
    setIsWOPaid(true);
    
    const totalW = woItems.reduce((s, i) => s + (i.weight * (i.quantity || 1)), 0);
    const rate = shippingRates[woAddress.country] || 10;
    const rawC = totalW * rate;
    const discountPercent = shippingDiscounts[woAddress.country] || 0;
    const discC = rawC * (discountPercent / 100);
    const totalC = Math.max(0, rawC - discC);

    const currentAgent = {
      id: currentUser?.id || 'AG-TEST',
      name: currentUser?.name || 'Test Agent',
      phone: currentUser?.phone || '',
      email: currentUser?.email || '',
      status: 'Active' as const
    };

    const completedItems = woItems.map(item => ({
      ...item,
      status: woStatusInput as ShippingStatus
    }));

    const newOrder: Order = {
      id: newOrderId,
      customerId: activeWorkOrder.customerId,
      items: completedItems,
      totalWeight: totalW,
      totalCost: totalC,
      status: woStatusInput,
      createdAt: new Date().toISOString(),
      shippingDate: woShippingDate,
      destination: {
        ...woAddress,
        assignedAgent: currentAgent,
        assignedAgentId: currentAgent.id
      } as any,
      paymentStatus: 'Paid',
      assignedAgent: currentAgent,
      assignedAgentId: currentAgent.id,
      documents: woDocuments
    };

    // Update local React state: update existing order rather than appending a duplicate ID
    setOrders(prev => {
      const exists = prev.some(o => o.id === newOrderId);
      if (exists) {
        return prev.map(o => o.id === newOrderId ? newOrder : o);
      } else {
        return [...prev, newOrder];
      }
    });
    
    // Add items to the main items list as well, marked as received
    const itemsWithStatus = completedItems.map(item => ({
      ...item,
      source: 'Pickup' as const,
      submitted: true
    }));
    setItems(prev => [...prev, ...itemsWithStatus]);

    // Sync to DB
    if (dbStatus.connected) {
      api.updateOrder(newOrderId, {
        status: woStatusInput,
        paymentStatus: 'Paid',
        items: completedItems,
        totalWeight: totalW,
        totalCost: totalC,
        assignedAgent: currentAgent,
        assignedAgentId: currentAgent.id,
        assigned_agent: currentAgent,
        assigned_agent_id: currentAgent.id,
        documents: woDocuments
      } as any)
      .then(() => {
        console.log(`[Order] Order ${newOrderId} successfully updated on DB`);
      })
      .catch(err => {
        console.error('Failed to update completed order on DB:', err);
      });

      // Also update pickup status in 'pickups' table in Supabase
      if (isSupabaseConfigured) {
        api.updatePickup(newOrderId, {
          status: (woStatusInput === 'Scheduled' || woStatusInput === 'Pending Pickup') ? 'Scheduled' : 
                  woStatusInput === 'Cancelled' ? 'Cancelled' : 
                  woStatusInput === 'Picked Up' ? 'Picked Up' : 'Completed',
          items: completedItems,
          paymentStatus: 'Paid',
          assignedAgentId: currentAgent.id,
          pickupDate: woShippingDate,
          address: `${woAddress.addressLine1}, ${woAddress.city}, ${woAddress.country}`
        })
        .then(() => {
          console.log(`[Pickup] Pickup ${newOrderId} successfully updated on DB`);
        })
        .catch(e => {
          console.warn('Failed to update completed pickup in Supabase:', e);
        });
      }

      const recipientEmail = woAddress.email || currentUser?.email || '';
      api.shareInvoice(newOrder)
        .then(() => toast.success(`Payment successful! Invoice sent to ${recipientEmail}`))
        .catch(err => {
          console.error('Failed to send invoice:', err.message);
          toast.error(`Payment successful, but ${err.message || 'failed to send invoice email'}.`);
        });
    } else {
      const recipientEmail = woAddress.email || currentUser?.email || '';
      toast.success(`Payment successful! Invoice saved locally.`);
    }
  };

  const handleCheckout = async () => {
    const hasScheduledPickup = userAppointments.some(a => a.status === 'Scheduled' || a.status === 'Picked Up');

    // Reset coupon code inputs
    setAppliedCoupon(null);
    setCouponCodeInput('');

    // Determine primary source and generate the correct order ID first so it is preserved even across login
    const cartItems = items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);

    let source: 'Store' | 'Warehouse' | 'Pickup' = 'Store';
    
    if (hasScheduledPickup && cartItems.length > 0) {
      source = (cartItems[0]?.source || 'Pickup') as any;
    } else {
      const warehouseItems = items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Warehouse' && i.submitted);
      const storeItems = items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Store');
      const pickupItems = items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Pickup');
      
      if (warehouseItems.length > 0) source = 'Warehouse';
      else if (pickupItems.length > 0) source = 'Pickup';
      else if (storeItems.length > 0) source = 'Store';
    }

    let prefix = 'BB';
    if (source === 'Store') prefix = 'SH';
    else if (source === 'Warehouse') prefix = 'SW';
    else if (source === 'Pickup') prefix = 'PH';

    let newOrderId = generateNewOrderId(source);
    try {
      const resp = await api.getNextOrderId(prefix);
      if (resp && resp.nextId) {
        newOrderId = resp.nextId;
      }
    } catch (err) {
      console.warn('Failed to get next sequential ID from backend, using fallback:', err);
    }
    setOrderId(newOrderId);

    if (!currentUser) {
      setLoginTriggerSource('checkout');
      setShowLoginModal(true);
      return;
    }

    if (hasScheduledPickup && cartItems.length > 0) {
      navigateTo('finalize');
      return;
    }

    if (hasScheduledPickup) {
      toast.warning("You have an active agent pickup scheduled. Please add items to your cart first.");
      return;
    }

    const pendingItems = items.filter(i => i.status === 'Pending');
    if (pendingItems.length > 0) {
      toast.warning(`You have ${pendingItems.length} item(s) with PENDING status. All items must be 'Received at Warehouse' before you can proceed to checkout.`);
      return;
    }
    
    navigateTo('finalize');
  };

  // --- Components ---

    interface ThirdPartyTrackResult {
      id: string;
      carrier: string;
      status: string;
      origin: string;
      destination: string;
      estimatedDelivery: string;
      weight: string;
      serviceType: string;
      events: Array<{
        status: string;
        location: string;
        date: string;
        time: string;
        description: string;
      }>;
      shipmentFacts?: {
        overview: Array<{ label: string; value: string }>;
        services: Array<{ label: string; value: string }>;
        packageDetails: Array<{ label: string; value: string }>;
      };
      isLive?: boolean;
      isSimulationFallback?: boolean;
      isDemoFallback?: boolean;
      apiError?: string;
      hasError?: boolean;
      trackingUrl?: string;
    }

    const ThirdPartyTrackerCard = ({ result }: { result: ThirdPartyTrackResult }) => {
      const [showTracker, setShowTracker] = useState(true);
      const carrierBranding = {
        FedEx: {
          logo: (
            <span className="font-extrabold tracking-tight text-lg">
              <span className="text-[#4D148C]">Fed</span>
              <span className="text-[#FF6200]">Ex</span>
            </span>
          ),
          barColor: 'bg-[#4D148C]',
        },
        Fedex: {
          logo: (
            <span className="font-extrabold tracking-tight text-lg">
              <span className="text-[#4D148C]">Fed</span>
              <span className="text-[#FF6200]">Ex</span>
            </span>
          ),
          barColor: 'bg-[#4D148C]',
        },
        fedex: {
          logo: (
            <span className="font-extrabold tracking-tight text-lg">
              <span className="text-[#4D148C]">Fed</span>
              <span className="text-[#FF6200]">Ex</span>
            </span>
          ),
          barColor: 'bg-[#4D148C]',
        },
        Delhivery: {
          logo: (
            <span className="font-black italic tracking-widest text-[#FF6200] text-base font-sans">
              DELHIVERY
            </span>
          ),
          barColor: 'bg-[#FF5500]',
        },
        delhivery: {
          logo: (
            <span className="font-black italic tracking-widest text-[#FF6200] text-base font-sans">
              DELHIVERY
            </span>
          ),
          barColor: 'bg-[#FF5500]',
        },
        DHL: {
          logo: (
            <span className="font-black italic tracking-tighter text-lg text-[#D0021B]">
              DHL Express
            </span>
          ),
          barColor: 'bg-[#D0021B]',
        },
        UPS: {
          logo: (
            <span className="flex items-center gap-1.5 font-black text-sm text-amber-950 bg-[#FFC72C] px-2.5 py-1 rounded-md shrink-0 border border-amber-500/20">
              UPSÂ®
            </span>
          ),
          barColor: 'bg-[#351C15]',
        },
        USPS: {
          logo: (
            <span className="font-black italic tracking-wide text-[#004B87] text-lg">
              USPSÂ®
            </span>
          ),
          barColor: 'bg-[#003366]',
        }
      };

      const brand = carrierBranding[result.carrier] || {
        logo: <span className="font-extrabold tracking-tight text-lg text-indigo-600">{result.carrier}</span>,
        barColor: 'bg-indigo-600'
      };
      const steps = ['Label Created', 'Pickup Completed', 'In Transit', 'Out for Delivery', 'Delivered'];
      const getStepIndex = (statusStr: string): number => {
        const s = (statusStr || '').toLowerCase();
        if (s.includes('delivered') || s.includes('received by') || s.includes('completed') || s.includes('signed')) return 4;
        if (s.includes('out for delivery') || s.includes('delivery vehicle') || s.includes('on vehicle')) return 3;
        if (s.includes('transit') || s.includes('departed') || s.includes('arrived') || s.includes('facility') || s.includes('hub') || s.includes('cleared') || s.includes('customs') || s.includes('received at warehouse') || s.includes('packed') || s.includes('shipped') || s.includes('dispatched')) return 2;
        if (s.includes('pick') || s.includes('pickup') || s.includes('collected') || s.includes('received')) return 1;
        if (s.includes('label') || s.includes('created') || s.includes('billing') || s.includes('manifest') || s.includes('pending')) return 0;
        return 2; // Default to In Transit
      };
      const currentStepIndex = getStepIndex(result.status);
      const isSimulated = !!(result.isDemoFallback || !result.isLive);
      const hasError = !!(result.hasError || result.status === 'Error' || result.status === 'Fetch Failed');

      if (isMobile) {
        if (hasError) {
          return (
            <div className="bg-white rounded-3xl border border-red-100 shadow-md overflow-hidden p-5 space-y-4">
              <div className="flex items-center gap-3">
                {brand.logo}
                <span className="px-2 py-0.5 rounded-full text-[8px] uppercase font-black tracking-widest bg-red-50 text-red-800 border border-red-100 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  Sync Failed
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Connection Offline</h3>
                <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-lg border border-red-100">
                  ID: {result.id}
                </span>
              </div>
              <div className="p-3.5 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-red-700 leading-normal font-semibold">
                  We were unable to synchronize the delivery status with the partner carrier system. Please verify that the tracking number or order ID is correct and registered.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5 space-y-5 animate-fade-in">
            {/* Header: Carrier Branding, Status Badge, ID */}
            <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3">
                {brand.logo}
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider text-white ${brand.barColor}`}>
                  {result.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">ID:</span>
                  <span className="text-xs font-black text-slate-800 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-150">{result.id}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(result.id);
                      toast.success("Tracking ID copied to clipboard!");
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 active:scale-95 transition-all"
                    title="Copy Tracking ID"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                  {result.serviceType}
                </span>
              </div>
              {result.estimatedDelivery && (
                <div className="text-[11px] font-semibold text-emerald-600 bg-emerald-50/50 border border-emerald-100/40 p-2.5 rounded-xl flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>{result.estimatedDelivery}</span>
                </div>
              )}
            </div>

            {/* Route Map Flow */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex-1 text-left space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Origin</span>
                <span className="text-xs font-black text-slate-800 block truncate">{result.origin.split(',')[0]}</span>
                <span className="text-[9px] text-slate-400 font-semibold block truncate">
                  {result.origin.split(',').slice(1).join(',').trim()}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center px-1 relative min-w-[50px] shrink-0">
                <div className="absolute top-[16px] left-0 right-0 h-0.5 bg-slate-200" />
                <div 
                  className={`absolute top-[16px] left-0 h-0.5 ${brand.barColor} transition-all duration-1000`} 
                  style={{ width: `${(currentStepIndex / 4) * 100}%` }}
                />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border shadow-sm relative z-10 text-indigo-600`}>
                  <Plane size={11} className="animate-pulse" />
                </div>
              </div>

              <div className="flex-1 text-right space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
                <span className="text-xs font-black text-slate-800 block truncate">{result.destination.split(',')[0]}</span>
                <span className="text-[9px] text-slate-400 font-semibold block truncate">
                  {result.destination.split(',').slice(1).join(',').trim()}
                </span>
              </div>
            </div>

            {/* Vertical Timeline logs */}
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Active Scanner Milestones
              </span>
              <div className="relative pl-5 space-y-5 pt-1 border-l border-slate-100 ml-2">
                {result.events && result.events.length > 0 ? (
                  result.events.map((ev, i) => {
                    const isLatest = i === 0;
                    return (
                      <div key={i} className="relative flex flex-col gap-0.5 text-left">
                        {/* Dot indicator */}
                        <div className="absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border border-white bg-white flex items-center justify-center z-10 shadow-sm">
                          <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-indigo-600 animate-pulse' : 'bg-slate-350'}`} />
                        </div>

                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className={`text-xs font-extrabold ${isLatest ? 'text-indigo-600' : 'text-slate-800'}`}>
                            {ev.status}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 whitespace-nowrap">
                            {ev.date} {ev.time}
                          </span>
                        </div>
                        
                        {ev.location && (
                          <div className="inline-flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded max-w-fit mt-0.5">
                            <MapPin size={8} /> {ev.location}
                          </div>
                        )}

                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                          {ev.description}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">No scan events received yet.</div>
                )}
              </div>
            </div>

            {/* Shipment Facts: 2-column tiles */}
            {result.shipmentFacts && (
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">Shipment Overview</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {result.shipmentFacts.overview.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                      <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">{item.label}</span>
                      <span className="text-xs font-extrabold text-slate-800 block break-words leading-tight">{item.value}</span>
                    </div>
                  ))}
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">Total Weight</span>
                    <span className="text-xs font-mono font-extrabold text-indigo-600 block leading-tight">{result.weight}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">Carrier Service</span>
                    <span className="text-xs font-extrabold text-slate-800 block leading-tight truncate">{result.carrier}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active direct carrier link */}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
              {result.trackingUrl && (
                <a 
                  href={result.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 flex items-center justify-center gap-1.5 transition-all text-center font-bold"
                >
                  <ExternalLink size={12} />
                  Open {result.carrier} Portal
                </a>
              )}
              <button 
                type="button"
                onClick={() => navigateTo('support')}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all text-center font-bold"
              >
                <Headphones size={12} />
                Contact Support Desk
              </button>
            </div>
          </div>
        );
      }

      if (hasError) {
        return (
          <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-xl overflow-hidden">
            {/* Header Panel with Carrier Branding but styled as Alert */}
            <div className="p-6 sm:p-8 border-b border-red-50 bg-gradient-to-r from-red-50/10 via-white to-red-50/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {brand.logo}
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest leading-none border bg-red-50 text-red-800 border-red-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Tracking Synchronization Failed
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 font-sans">Connection Offline</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-black rounded-xl border border-red-100">
                  ID: {result.id}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="p-5 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3.5 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-white border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-sm font-sans font-black">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="text-xs font-black text-red-800 uppercase tracking-widest block leading-none">Unable to Retrieve Live Status</span>
                  <p className="text-xs text-red-700 leading-relaxed font-semibold">
                    We were unable to synchronize the delivery status details with the partner carrier system. 
                    No simulated or placeholder milestones are loaded to guarantee true data accuracy.
                  </p>
                  {result.apiError && (
                    <div className="mt-3 p-3 bg-red-100/35 rounded-xl border border-red-100/40 text-left">
                      <span className="block text-[10px] font-black uppercase text-red-800 tracking-wider mb-1 font-sans">Server Error Log Details</span>
                      <p className="text-[11px] font-mono font-medium text-red-900 leading-normal break-all">
                        {result.apiError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Please verify that the courier tracking number or order ID is valid and registered in the Supabase database.
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-fade-in">
          {/* Header Panel with Carrier Branding */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                {brand.logo}
                <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest leading-none border bg-teal-50 text-teal-800 border-teal-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Real-time Database Status
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Carrier Shipment Status</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl border border-slate-200">
                {result.serviceType}
              </span>
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100">
                ID: {result.id}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Real Data Synchronization Notice & Direct Tracking Option */}
            <div className="p-5 bg-teal-50/40 border border-teal-100/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-teal-200 text-teal-600 flex items-center justify-center shrink-0 shadow-sm font-sans font-black">
                  <CheckCircle2 size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-teal-800 uppercase tracking-widest block leading-none">Database Records Synced</span>
                  <p className="text-[11px] text-teal-700 leading-relaxed font-semibold">
                    This shipment tracking status is synchronized directly with your real JiffEX dashboard order data.
                  </p>
                </div>
              </div>
              {result.trackingUrl && (
                <button
                  type="button"
                  onClick={() => setShowTracker(prev => !prev)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 ${
                    showTracker 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <ExternalLink size={14} />
                  {showTracker ? 'Hide' : 'Open'} {result.carrier} Tracker
                </button>
              )}
            </div>

            {/* Custom Interactive Shipment Progress Tracker (No Iframe Blockers!) */}
            {showTracker && (
              <div className="space-y-6 pt-2 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Shipment Progress</span>
                  <span className="text-xs font-semibold text-slate-500 font-mono tracking-tight bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-250/30">
                    ID: {result.id}
                  </span>
                </div>

                <div className="bg-slate-50/50 border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 space-y-6">
                  {/* Status & Barcode Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-5 border-b border-slate-200/80">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-[#FF6200] uppercase tracking-widest block leading-none">
                        {result.carrier} Standard Shipping Console
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${brand.barColor} animate-ping`} />
                        Official Live Carrier Delivery Milestones
                      </h4>
                    </div>
                    {/* Authentic CSS-based Liner Barcode rendering */}
                    <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                      <div className="flex items-end gap-[1.5px] h-7 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 2, 1].map((w, idx) => (
                          <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider">
                        SECURE BARCODE: {result.id}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Chronology Timeline */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-slate-400 uppercase tracking-widest">Route Chronology</span>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md text-[10px]">
                        Last Checked: Just Now
                      </span>
                    </div>
                    <div className="relative pt-4 pb-4">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full absolute top-1/2 -translate-y-1/2 left-0" />
                      <div 
                        className={`h-1.5 rounded-full absolute top-1/2 -translate-y-1/2 left-0 transition-all duration-1000 ${brand.barColor}`}
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                      />
                      <div className="relative flex justify-between">
                        {steps.map((st, idx) => {
                          const isActive = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                                isCurrent ? `${brand.barColor} text-white border-transparent scale-110 shadow-lg` :
                                isActive ? `${brand.barColor} text-white border-transparent` :
                                'bg-white text-slate-350 border-slate-200'
                              }`}>
                                {idx === 4 ? <CheckCircle2 size={13} /> : idx === 2 ? <Truck size={13} /> : <Package size={13} />}
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-tight text-center ${
                                isCurrent ? 'text-slate-800 font-extrabold' :
                                isActive ? 'text-slate-600 font-bold' :
                                'text-slate-350'
                              }`}>
                                {st}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* High-visibility Live Status Banner & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                    <div className="bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Real-time status</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-black text-white uppercase ${brand.barColor}`}>
                            {result.status}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/40">
                            {result.estimatedDelivery}
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-xs font-medium text-slate-500 leading-relaxed font-sans">
                        Authorized digital delivery manifest synced with the real-time order tracking server. Handled through prompt priority gateway queues.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">carrier services</span>
                        <div className="text-sm font-black text-slate-800">{result.carrier} Global Express Air</div>
                        <div className="text-xs font-semibold text-slate-500">{result.serviceType}</div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 font-mono mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span>DATA SECURITY ENVELOPE</span>
                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-black uppercase tracking-wider text-[9px]">Verified Secure</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Scan Logs directly under the shipment progress */}
                  {result.events && result.events.length > 0 && (
                    <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
                        Active Scanner Milestones
                      </span>
                      <div className="relative pl-6 space-y-6 pt-2">
                        <div className="absolute top-2 bottom-2 left-[10px] w-0.5 bg-slate-100" />
                        {result.events.map((ev, i) => (
                          <div key={i} className="relative flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 text-left animate-fade-in">
                            {/* Dot indicator */}
                            <div className="absolute -left-6 top-1 w-5.5 h-5.5 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center z-10">
                              <div className={`w-2 h-2 rounded-full ${i === 0 ? brand.barColor : 'bg-slate-300'}`} />
                            </div>

                            <div className="sm:w-32 shrink-0 pt-0.5 leading-none">
                              <span className="text-xs font-black text-slate-800 block">{ev.date}</span>
                              <span className="text-[9px] text-slate-400 font-bold block mt-1">{ev.time}</span>
                            </div>

                            <div className="flex-1 pb-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black text-slate-900 leading-none">{ev.status}</span>
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded leading-none">
                                  {ev.location}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                                {ev.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safe Direct external portal link as final backup option */}
                  <div className="flex justify-end text-right pt-2 border-t border-slate-100">
                    <a 
                      href={result.trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 leading-none"
                    >
                      <ExternalLink size={11} />
                      Open Direct Portal on {result.carrier}.com (Requires Authentication)
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Cargo specs layout (Always display Source and Destination details clearly) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-slate-150 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Origin</span>
                  <span className="text-xs font-bold text-slate-900 leading-tight">{result.origin}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-slate-150 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Destination</span>
                  <span className="text-xs font-bold text-slate-900 leading-tight">{result.destination}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-slate-150 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Total Weight</span>
                  <span className="text-xs font-mono font-bold text-indigo-700 leading-tight">{result.weight}</span>
                </div>
              </div>
            </div>

            {/* Shipment Facts sections */}
            {result.shipmentFacts && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 1. Shipment Overview */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-[#4D148C] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4D148C]" />
                      Shipment Overview
                    </h4>
                    <div className="space-y-3.5">
                      {result.shipmentFacts.overview.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-100/50 pb-2 last:border-none last:pb-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-0.5">{item.label}</span>
                          <span className="text-xs font-black text-slate-800 text-right leading-snug">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Services */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-[#FF6200] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6200]" />
                      Services
                    </h4>
                    <div className="space-y-3.5">
                      {result.shipmentFacts.services.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-100/50 pb-2 last:border-none last:pb-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-0.5">{item.label}</span>
                          <span className="text-xs font-black text-slate-800 text-right leading-snug">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Package Details */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-[#4D148C] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4D148C]" />
                      Package Details
                    </h4>
                    <div className="space-y-3.5">
                      {result.shipmentFacts.packageDetails.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-100/50 pb-2 last:border-none last:pb-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-0.5">{item.label}</span>
                          <span className="text-xs font-black text-slate-800 text-right leading-snug">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    const mapOrderToThirdPartyTrackResult = (order: Order): ThirdPartyTrackResult => {
      const destCountry = order.destination?.country || 'USA';
      
      // Assign carrier based on destination or deterministically
      let carrier: 'FedEx' | 'DHL' | 'UPS' | 'USPS' = 'FedEx';
      if (['UK', 'Germany', 'UAE'].includes(destCountry)) {
        carrier = 'DHL';
      } else if (['Australia', 'Canada'].includes(destCountry)) {
        carrier = 'UPS';
      } else if (destCountry === 'India') {
        carrier = 'USPS';
      }

      // Map JiffEX native status to tracking status
      const rawStatus = order.status;
      let status: 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Pending' = 'Pending';
      if (rawStatus === 'Delivered') {
        status = 'Delivered';
      } else if (rawStatus === 'Out for Delivery') {
        status = 'Out for Delivery';
      } else if (['In Transit', 'Ready to Ship', 'Packed'].includes(rawStatus)) {
        status = 'In Transit';
      } else {
        status = 'Pending';
      }

      const origin = 'JiffEX Delhi Hub (DEL), India';
      const destination = `${order.destination?.city || 'New York'}, ${order.destination?.state ? order.destination.state + ', ' : ''}${destCountry}`;
      
      const shipDate = order.shippingDate || order.created_at || order.createdAt || new Date().toISOString();
      const dateBase = new Date(shipDate);
      const formatDateStr = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const formatTimeStr = (h: number, m: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        const minStr = m.toString().padStart(2, '0');
        return `${hr}:${minStr} ${period}`;
      };

      const estDate = new Date(dateBase.getTime() + (status === 'Delivered' ? 3 : 5) * 24 * 3600 * 1000);
      const estimatedDelivery = status === 'Delivered'
        ? `Delivered on ${formatDateStr(new Date(dateBase.getTime() + 3 * 24 * 3600 * 1000))}`
        : `Estimated Delivery by ${formatDateStr(estDate)}`;

      const events = [];
      const today = new Date();
      
      if (status === 'Delivered') {
        const dDate = new Date(dateBase.getTime() + 3 * 24 * 3600 * 1000);
        events.push({
          status: 'Delivered',
          location: destination,
          date: formatDateStr(dDate),
          time: formatTimeStr(14, 30),
          description: `Shipment delivered and signed. Received by ${order.destination?.fullName || 'Consignee'}.`
        });
        events.push({
          status: 'Out for Delivery',
          location: destination,
          date: formatDateStr(dDate),
          time: formatTimeStr(8, 15),
          description: `Courier out for local delivery in ${order.destination?.city || 'destination area'}.`
        });
        events.push({
          status: 'Customs Cleared',
          location: `${order.destination?.city || 'Destination Hub'} Airport`,
          date: formatDateStr(new Date(dateBase.getTime() + 2 * 24 * 3600 * 1000)),
          time: formatTimeStr(11, 20),
          description: 'International customs clearance process completed successfully.'
        });
        events.push({
          status: 'Arrived at Sorting Hub',
          location: 'Transit Sorting Gateway',
          date: formatDateStr(new Date(dateBase.getTime() + 1.5 * 24 * 3600 * 1000)),
          time: formatTimeStr(23, 40),
          description: 'Departed from origin transit facility.'
        });
        events.push({
          status: 'Processed & Shipped',
          location: origin,
          date: formatDateStr(dateBase),
          time: formatTimeStr(18, 10),
          description: 'Order packed, consolidated, and handed over to carrier network.'
        });
      } else if (status === 'Out for Delivery') {
        events.push({
          status: 'Out for Delivery',
          location: destination,
          date: formatDateStr(today),
          time: formatTimeStr(9, 30),
          description: `Shipment out for local delivery. Carrier agent is en route.`
        });
        events.push({
          status: 'Customs Cleared',
          location: `${order.destination?.city || 'Destination Hub'} Airport`,
          date: formatDateStr(new Date(today.getTime() - 12 * 3600 * 1000)),
          time: formatTimeStr(15, 45),
          description: 'Customs clearance approved.'
        });
        events.push({
          status: 'In Transit',
          location: 'In Transit',
          date: formatDateStr(new Date(today.getTime() - 36 * 3600 * 1000)),
          time: formatTimeStr(10, 0),
          description: 'Departed international hub.'
        });
        events.push({
          status: 'Processed & Shipped',
          location: origin,
          date: formatDateStr(dateBase),
          time: formatTimeStr(18, 10),
          description: 'Consolidation complete. Dispatched with primary carrier.'
        });
      } else if (status === 'In Transit') {
        events.push({
          status: 'In Transit',
          location: 'International Air Transit',
          date: formatDateStr(today),
          time: formatTimeStr(16, 0),
          description: 'In flight / transit to destination hub country.'
        });
        events.push({
          status: 'Departed Facility',
          location: origin,
          date: formatDateStr(dateBase),
          time: formatTimeStr(21, 15),
          description: 'Departed JiffEX New Delhi logistics facility.'
        });
        events.push({
          status: 'Processed at Warehouse',
          location: origin,
          date: formatDateStr(dateBase),
          time: formatTimeStr(14, 0),
          description: 'Consolidated, packed, and custom declarations declared.'
        });
      } else {
        if (order.status === 'Packed' || order.status === 'Consolidating items' || order.status === 'Ready to Ship') {
          events.push({
            status: 'Consolidation & Packaging Complete',
            location: origin,
            date: formatDateStr(today),
            time: formatTimeStr(11, 0),
            description: `All items safely consolidated and packed into a single container. Ready for dispatch.`
          });
        }
        if (order.status === 'Received at Warehouse' || order.status === 'In Warehouse') {
          events.push({
            status: 'Received at JiffEX Warehouse',
            location: origin,
            date: formatDateStr(today),
            time: formatTimeStr(10, 0),
            description: `Items received from home pickup, weighed, and cataloged. Awaiting consolidation.`
          });
        }
        events.push({
          status: 'Order Placed & Scheduled',
          location: 'Origin Address',
          date: formatDateStr(dateBase),
          time: formatTimeStr(8, 0),
          description: 'Shipment request submitted and carrier routing generated.'
        });
      }

      const calculatedWeight = order.totalWeight || order.items?.reduce((sum, i) => sum + (i.weight || 0), 0) || 1.5;
      const weight = `${calculatedWeight.toFixed(1)} kg`;

      const serviceTypes: Record<'FedEx' | 'DHL' | 'UPS' | 'USPS', string> = {
        UPS: 'UPS Worldwide ExpressÂ® (via JiffEX)',
        FedEx: 'FedEx International PriorityÂ® (via JiffEX)',
        DHL: 'DHL Express WorldwideÂ® (via JiffEX)',
        USPS: 'USPS Priority Mail ExpressÂ® (via JiffEX)'
      };

      return {
        id: order.id,
        carrier,
        status,
        origin,
        destination,
        estimatedDelivery,
        weight,
        serviceType: serviceTypes[carrier],
        events
      };
    };

    const TrackSection = () => {
      const [trackIdInput, setTrackIdInput] = useState(trackingId);
      const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
      const [thirdPartyResult, setThirdPartyResult] = useState<ThirdPartyTrackResult | null>(null);
      const [isSearching, setIsSearching] = useState(false);

      const handleTrackSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const inputVal = trackIdInput.trim();
        if (!inputVal) return;

        setIsSearching(true);
        setThirdPartyResult(null);
        setTrackingOrder(null);

        try {
          // 1. Try to track directly using the new Order ID endpoint
          console.log("[TrackSection] Querying live Order ID:", inputVal);
          const data = await api.trackOrderLive(inputVal);
          if (data && data.success && data.trackingData) {
            setThirdPartyResult({
              ...data.trackingData,
              isLive: data.isLive,
              isDemoFallback: data.isDemo,
              apiError: data.apiError
            });
            toast.success(`Tracking details for Order ${inputVal} loaded successfully!`);
            return;
          }
        } catch (err: any) {
          console.warn("[TrackSection] Order ID search failed, checking carrier number database:", err.message);
          
          // 2. Fallback: Check if input is a carrier tracking number directly
          try {
            const res = await fetch("/api/track-carrier", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackingId: inputVal }),
            });
            const data = await res.json();
            if (res.ok && data && data.success && data.trackingData) {
              setThirdPartyResult({
                ...data.trackingData,
                isLive: data.isLive,
                isDemoFallback: data.isDemo,
                apiError: data.apiError
              });
              toast.success(`Shipment details for tracking number ${inputVal} loaded!`);
              return;
            } else {
              toast.error(data.error || err.message || 'Tracking ID / Order ID details not found.');
            }
          } catch (carrierErr: any) {
            console.error("[TrackSection] Fallback carrier lookup failed:", carrierErr);
            toast.error(carrierErr.message || 'Tracking ID / Order ID details not found inside the registry.');
          }
        } finally {
          setIsSearching(false);
        }
      };

      useEffect(() => {
        if (trackingId) {
          setTrackIdInput(trackingId);
          const autoSearch = async () => {
            setIsSearching(true);
            setThirdPartyResult(null);
            setTrackingOrder(null);

            try {
              const data = await api.trackOrderLive(trackingId);
              if (data && data.success && data.trackingData) {
                setThirdPartyResult({
                  ...data.trackingData,
                  isLive: data.isLive,
                  isDemoFallback: data.isDemo,
                  apiError: data.apiError
                });
                return;
              }
            } catch (err) {
              console.warn("[TrackSection Auto] Order auto-search failed, checking carrier number directly:", err);
              
              try {
                const res = await fetch("/api/track-carrier", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ trackingId }),
                });
                const data = await res.json();
                if (res.ok && data && data.success && data.trackingData) {
                  setThirdPartyResult({
                    ...data.trackingData,
                    isLive: data.isLive,
                    isDemoFallback: data.isDemo,
                    apiError: data.apiError
                  });
                  return;
                }
              } catch (cErr) {
                console.error("[TrackSection Auto] Live carrier tracking failed:", cErr);
              }
            } finally {
              setIsSearching(false);
            }
          };
          autoSearch();
        }
      }, [trackingId]);

      if (isMobile) {
        const activeOrders = orders.filter(o => 
          (o.customerId === currentUser?.id || o.customer_id === currentUser?.id)
        );

        return (
          <div className="flex flex-col gap-5 px-4 py-4 pb-12">
            {/* Mobile Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Track Shipment</h1>
              <p className="text-xs text-slate-500 font-semibold leading-normal">
                Enter your Order ID or Courier Tracking number to check its delivery journey.
              </p>
            </div>

            {/* Mobile Search Card */}
            <div className="bg-white p-4 rounded-3xl shadow-lg shadow-indigo-500/5 border border-slate-100">
              <form onSubmit={handleTrackSearch} className="flex flex-col gap-3">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Package size={18} />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="Order ID (e.g. SH-00001) or Carrier ID..."
                    value={trackIdInput}
                    onChange={(e) => setTrackIdInput(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="w-full py-3.5 bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {isSearching ? 'Searching...' : 'Track Shipment'}
                </button>
              </form>
            </div>

            <AnimatePresence mode="wait">
              {/* If we have searched a tracking ID and found results */}
              {trackingOrder && (
                <motion.div
                  key="local-order"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <ThirdPartyTrackerCard result={mapOrderToThirdPartyTrackResult(trackingOrder)} />
                  
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100/60 flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                      <Info size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-black text-amber-950 uppercase tracking-wider">Notice</h4>
                      <p className="text-[10px] text-amber-800 leading-normal font-medium">
                        Status updates can take 12-24 hours to reflect after handover. If you have questions, please reach out to JiffEX support.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {thirdPartyResult && (
                <motion.div
                  key="third-party-order"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <ThirdPartyTrackerCard result={thirdPartyResult} />
                </motion.div>
              )}

              {/* Empty State / Active Shipments Quick Link (when no active result is rendered) */}
              {!trackingOrder && !thirdPartyResult && (
                <motion.div
                  key="empty-quick-links"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  {activeOrders.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Truck size={15} className="text-indigo-600" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Your Active Orders</h3>
                      </div>
                      <div className="space-y-2">
                        {activeOrders.map((ord) => (
                          <div 
                            key={ord.id} 
                            onClick={() => {
                              setTrackIdInput(ord.id);
                              setTrackingId(ord.id);
                            }}
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 transition-all flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-800">{ord.id}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] uppercase font-bold border ${
                                  ord.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  ord.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold">
                                Destination: <span className="text-slate-600 font-black">{ord.destination?.city || ord.destination?.country || 'Global'}</span>
                              </div>
                            </div>
                            <div className="text-indigo-600 text-xs font-black flex items-center gap-0.5">
                              Track <ChevronRight size={14} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center py-10 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                        <Package size={22} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">No active searches</h4>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                          Enter your tracking identifier above or view your order dashboard for details.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      return (
        <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Track Your Shipment</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Enter your Order ID (e.g. JX-PH-10001) to see the real-time status of your global delivery.</p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-100">
            <form onSubmit={handleTrackSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Package size={20} />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter Tracking ID (e.g. Fedex, DHL, UPS or SH-00001)"
                  value={trackIdInput}
                  onChange={(e) => setTrackIdInput(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={isSearching}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                {isSearching ? 'Searching...' : 'Track Now'}
              </button>
            </form>
          </div>

          <AnimatePresence mode="wait">
            {trackingOrder && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <ThirdPartyTrackerCard result={mapOrderToThirdPartyTrackResult(trackingOrder)} />
                
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                    <Info size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Important Notice</h4>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Status updates may take 12-24 hours to reflect after physical handover. If your status hasn't changed in 48 hours, please contact support.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {thirdPartyResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <ThirdPartyTrackerCard result={thirdPartyResult} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    };

    const HomeSection = useMemo(() => {
      return (
        <div className="flex flex-col gap-0 md:gap-24 pb-3 md:pb-24">
          {/* JIFFEX Truck Hero Section */}
          <div className="relative overflow-hidden rounded-none md:rounded-[4rem] bg-transparent text-white px-0 pt-4 pb-0 sm:p-12 md:p-20 shadow-2xl">
            <div 
              className="absolute inset-x-0 top-0 bottom-[180px] md:bottom-0 pointer-events-none z-0"
              style={{
                background: `radial-gradient(circle at 30% 20%, #1e2a78 0%, #0b1220 60%, #05070f 100%)`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center space-y-5 md:space-y-12 w-full">
              {/* Laptop / Desktop View Header Text */}
              <div className="hidden md:block space-y-4 md:space-y-8 max-w-4xl px-4 md:px-0">
                <div className="space-y-2 md:space-y-6">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-tight text-white"
                  >
                    Send Anything from India to Abroadâ€”<span className="relative inline-block">Hassle-Free<div className="absolute -bottom-1 md:-bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 md:h-1.5 bg-amber-500 rounded-full" /></span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm sm:text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto"
                  >
                    Shop online, schedule pickup, or send your own items. We handle packing & delivery.
                  </motion.p>
                </div>
              </div>

              {/* Mobile View Header Text & Image (Right Side) */}
              <div className="md:hidden w-[90%] mx-auto px-1 text-left flex items-center justify-between gap-3">
                <div className="flex-1 space-y-1.5 pr-1">
                  <motion.h1 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-black tracking-tight leading-tight text-white"
                  >
                    Send Anything from India to Abroadâ€”<span className="relative inline-block text-amber-400">Hassle-Free</span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[10px] text-slate-300 font-medium leading-normal"
                  >
                    Shop online, schedule pickup, or send your own items. We handle packing & delivery.
                  </motion.p>
                </div>
                {/* Image on the right above the card container */}
                <div className="w-[110px] shrink-0">
                  <motion.img 
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    src="https://lh3.googleusercontent.com/d/1m7ORvWwf92WuUJRS_-ySzPQhoInEnAU4"
                    alt="Jiffex Delivery"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              {/* Mobile View Badges (Secure Packing, Global Delivery, On-time Guaranteed) */}
              <div className="md:hidden w-[90%] mx-auto grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { icon: ShieldCheck, text: "Secure Packing", color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/5" },
                  { icon: Globe, text: "Global Delivery", color: "text-sky-400 border-sky-500/25 bg-sky-500/5" },
                  { icon: Clock, text: "On-time Guaranteed", color: "text-amber-400 border-amber-500/25 bg-amber-500/5" }
                ].map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.05 }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg border ${badge.color}`}
                    >
                      <Icon size={9} className="shrink-0" />
                      <span className="font-extrabold text-[8px] tracking-tight whitespace-nowrap leading-none">{badge.text}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mobile View: Dedicated Unified Single Page Layout Container */}
              <div className="md:hidden w-[95%] mx-auto px-0 mt-3">
                <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 text-slate-800 space-y-6 text-left">
                  
                  {/* SECTION 1: WHAT WOULD YOU LIKE TO DO */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <PlusCircle size={14} className="stroke-[2.5]" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Quick Actions</h3>
                    </div>

                    {/* Three Side-by-Side Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Card 1: Schedule Pickup */}
                      <div 
                        onClick={() => {
                          navigateTo('pickup');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="cursor-pointer bg-white border border-slate-100 hover:border-indigo-100 p-2 rounded-xl flex flex-col items-center text-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h4 className="font-extrabold text-[9px] text-indigo-950 leading-tight">Schedule Pickup</h4>
                        <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold mt-auto w-full">Schedule</span>
                      </div>

                      {/* Card 2: Drop off package */}
                      <div 
                        onClick={() => {
                          navigateTo('warehouse');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="cursor-pointer bg-white border border-slate-100 hover:border-indigo-100 p-2 rounded-xl flex flex-col items-center text-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h4 className="font-extrabold text-[9px] text-indigo-950 leading-tight">Drop Off Package</h4>
                        <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold mt-auto w-full">Drop Off</span>
                      </div>

                      {/* Card 3: Shop & Ship */}
                      <div 
                        onClick={() => {
                          navigateTo('store');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="cursor-pointer bg-white border border-slate-100 hover:border-indigo-100 p-2 rounded-xl flex flex-col items-center text-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h4 className="font-extrabold text-[9px] text-indigo-950 leading-tight">Shop & Ship</h4>
                        <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold mt-auto w-full">Shop</span>
                      </div>
                    </div>

                    {/* Below service cards, put how jiffex works side by side horizontally under the same white background */}
                    <div className="pt-2">
                      <div className="bg-slate-50/50 rounded-xl p-2 border border-slate-100/80 grid grid-cols-4 divide-x divide-slate-200/50">
                        {[
                          { icon: Calendar, title: "Book in 30 Seconds", desc: "Quick & easy pickup", color: "bg-indigo-50 text-indigo-600" },
                          { icon: ShoppingBag, title: "Add items from Anywhere", desc: "From home, shop or any store", color: "bg-amber-50 text-amber-600" },
                          { icon: Truck, title: "We Combine Everything", desc: "Pack & store in our warehouse", color: "bg-emerald-50 text-emerald-600" },
                          { icon: CheckCircle2, title: "Delivered to Your Doorstep", desc: "Global delivery made easy", color: "bg-blue-50 text-blue-600" }
                        ].map((step, idx) => {
                          const StepIcon = step.icon;
                          return (
                            <div key={idx} className="flex flex-col items-center text-center px-1 py-1 first:pl-0 last:pr-0">
                              <div className={`w-6 h-6 rounded-md ${step.color} flex items-center justify-center shrink-0 mb-1`}>
                                <StepIcon size={12} className="font-black" />
                              </div>
                              <h5 className="font-black text-[8px] sm:text-[9px] text-slate-900 leading-tight min-h-[22px] flex items-center justify-center">
                                {step.title}
                              </h5>
                              <p className="text-[7px] text-slate-400 font-medium leading-tight mt-0.5">
                                {step.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Section Divider 1 */}
                  <div className="border-t border-slate-100" />

                  {/* SECTION 2: SHOP DEALS */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <ShoppingBag size={14} className="stroke-[2.5]" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Shop Authentic Indian Goods</h3>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      onClick={() => {
                        navigateTo('store');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {/* Decorative background circle */}
                      <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                      
                      <div className="flex gap-2.5 items-start">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 text-amber-600 border border-amber-100/30">
                          <ShoppingBag size={20} className="animate-pulse" />
                        </div>
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[12px] text-amber-950 tracking-tight leading-none">Shop Indian Goods</span>
                            <span className="bg-amber-600 text-white text-[7px] font-black uppercase px-1 py-0.5 rounded tracking-wide leading-none">Catalog</span>
                          </div>
                          <p className="text-[10px] text-slate-600 font-medium leading-normal max-w-[210px]">
                            Craving home flavors, festive sweets, or premium ethnic wear? Buy from top Indian stores and we'll deliver them abroad!
                          </p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-center justify-center bg-amber-600 text-white p-2 px-3 rounded-xl shadow-sm hover:bg-amber-700 active:scale-95 transition-all">
                        <span className="text-[9px] font-black tracking-tight leading-none">Shop</span>
                        <ArrowRight size={12} className="mt-1" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Section Divider 2 */}
                  <div className="border-t border-slate-100" />

                  {/* SECTION 3: QUICK SHIPPING QUOTE */}
                  <div id="mobile-quick-quote" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <Calculator size={14} className="stroke-[2.5]" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Quick Shipping Quote</h3>
                    </div>

                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Destination</label>
                          <select 
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs font-bold text-slate-800"
                            value={qCountry}
                            onChange={(e) => setQCountry(e.target.value)}
                          >
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Weight (kg)</label>
                          <input 
                            type="number" 
                            min="0.1" 
                            step="0.1"
                            className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs font-bold bg-slate-50 text-slate-800"
                            value={qWeight}
                            onChange={(e) => setQWeight(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Shipping Method</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'Standard', label: 'Standard', days: '10-14 Days', multiplier: 0.7 },
                            { id: 'Express', label: 'Express', days: '5-7 Days', multiplier: 1.0 }
                          ].map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setQMethod(method.id as any)}
                              className={`p-2.5 rounded-xl border-2 transition-all text-left ${
                                qMethod === method.id 
                                  ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-600/5' 
                                  : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className={`text-[10px] font-black ${qMethod === method.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                                {method.label}
                              </div>
                              <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {method.days}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-indigo-100 text-[8px] font-bold uppercase tracking-widest">
                              Estimated Cost ({qMethod})
                            </span>
                            <div className="text-xl font-black">
                              â‚¹{(() => {
                                const res = calculateShippingCost({
                                  country: qCountry,
                                  weightKg: qWeight,
                                  method: qMethod,
                                  rates: shippingRates,
                                  rateBands: shippingRateBands,
                                  discounts: shippingDiscounts
                                });
                                return res.finalPriceInr.toLocaleString('en-IN');
                              })()}
                            </div>
                            {(() => {
                              const res = calculateShippingCost({
                                country: qCountry,
                                weightKg: qWeight,
                                method: qMethod,
                                rates: shippingRates,
                                rateBands: shippingRateBands,
                                discounts: shippingDiscounts
                              });
                              if (res.discountPercent > 0) {
                                return (
                                  <div className="text-[7px] font-bold text-rose-300 mt-0.5">
                                    Discount of {res.discountPercent}% Applied for {qCountry}! (Save â‚¹{Math.round(res.discountAmount).toLocaleString('en-IN')}) [Band: {res.appliedBandLabel}]
                                  </div>
                                );
                              }
                              return (
                                <div className="text-[7px] font-bold text-indigo-200 mt-0.5">
                                  Band: {res.appliedBandLabel} (â‚¹{res.baseRatePerKg}{res.isFlatRate ? ' flat' : '/kg'})
                                </div>
                              );
                            })()}
                            <div className="text-[7px] font-bold text-indigo-200 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                              <Clock size={10} /> Est. Delivery: {qMethod === 'Express' ? '5-7' : '10-14'} Business Days
                            </div>
                          </div>
                          <Truck className="opacity-25 shrink-0" size={28} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Laptop / Desktop only view for the service selectors */}
              <div className="hidden md:block space-y-6 md:space-y-8 w-full">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-widest"
                >
                  <span className="hidden md:inline">Choose how you want to send:</span>
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6 max-w-5xl mx-auto"
                >
                  {/* Card 1: Pickup from Home */}
                  <div 
                    onClick={() => navigateTo('pickup')}
                    className="relative cursor-pointer bg-indigo-50/90 border-indigo-100 md:bg-white md:border-slate-100 p-2.5 sm:p-8 rounded-[1.2rem] md:rounded-[2.5rem] shadow-md md:shadow-xl border flex flex-col items-center text-center gap-2 sm:gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[6px] md:text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-200">
                        Most Popular
                      </span>
                    </div>
                    <div className="w-10 h-10 md:w-20 md:h-20 bg-indigo-100/80 md:bg-indigo-50 rounded-xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Truck className="w-5 h-5 md:w-10 md:h-10 text-indigo-600" />
                    </div>
                    <div className="space-y-1 md:space-y-3 flex-grow">
                      <h3 className="font-black text-[10px] xs:text-xs md:text-2xl text-indigo-950 md:text-slate-900 leading-tight">Schedule Pickup</h3>
                      <p className="hidden md:block text-xs sm:text-sm text-slate-500 leading-relaxed">
                        We collect items from your doorstep, pack & ship internationally
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigateTo('pickup'); }}
                      className="w-full py-1.5 md:py-4 bg-indigo-600 text-white rounded-lg md:rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 text-[9px] md:text-sm"
                    >
                      Schedule
                    </button>
                  </div>

                  {/* Card 2: Send to Our Warehouse */}
                  <div 
                    onClick={() => navigateTo('warehouse')}
                    className="cursor-pointer bg-emerald-50/90 border-emerald-100 md:bg-white md:border-slate-100 p-2.5 sm:p-8 rounded-[1.2rem] md:rounded-[2.5rem] shadow-md md:shadow-xl border flex flex-col items-center text-center gap-2 sm:gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="w-10 h-10 md:w-20 md:h-20 bg-emerald-100/80 md:bg-indigo-50 rounded-xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Package className="w-5 h-5 md:w-10 md:h-10 text-emerald-600 md:text-indigo-600" />
                    </div>
                    <div className="space-y-1 md:space-y-3 flex-grow">
                      <h3 className="font-black text-[10px] xs:text-xs md:text-2xl text-emerald-950 md:text-slate-900 leading-tight">Drop Off Package</h3>
                      <p className="hidden md:block text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Ship your items to our warehouseâ€”we pack & deliver abroad
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigateTo('warehouse'); }}
                      className="w-full py-1.5 md:py-4 bg-emerald-600 md:bg-indigo-600 text-white rounded-lg md:rounded-2xl font-bold hover:bg-emerald-700 md:hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 text-[9px] md:text-sm"
                    >
                      Drop Off
                    </button>
                  </div>

                  {/* Card 3: Shop & Send */}
                  <div 
                    onClick={() => navigateTo('store')}
                    className="cursor-pointer bg-amber-50/90 border-amber-100 md:bg-white md:border-slate-100 p-2.5 sm:p-8 rounded-[1.2rem] md:rounded-[2.5rem] shadow-md md:shadow-xl border flex flex-col items-center text-center gap-2 sm:gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="w-10 h-10 md:w-20 md:h-20 bg-amber-100/80 md:bg-indigo-50 rounded-xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <ShoppingBag className="w-5 h-5 md:w-10 md:h-10 text-amber-600 md:text-indigo-600" />
                    </div>
                    <div className="space-y-1 md:space-y-3 flex-grow">
                      <h3 className="font-black text-[10px] xs:text-xs md:text-2xl text-amber-950 md:text-slate-900 leading-tight">Shop & Ship</h3>
                      <p className="hidden md:block text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Buy authentic Indian productsâ€”we deliver anywhere abroad
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigateTo('store'); }}
                      className="w-full py-1.5 md:py-4 bg-amber-500 md:bg-indigo-600 text-white rounded-lg md:rounded-2xl font-bold hover:bg-amber-600 md:hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 text-[9px] md:text-sm"
                    >
                      Shop Now
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="hidden md:flex flex-col sm:flex-row items-center justify-center gap-8 pt-4"
                >
                  <button 
                    onClick={() => {
                      const element = document.getElementById('how-it-works');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="hidden md:flex px-6 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-full font-bold items-center gap-2 transition-all group text-lg"
                  >
                    Not sure? <span className="underline underline-offset-4 transition-colors">See how it works</span>
                  </button>
                  
                  <div className="h-6 w-px bg-slate-800 hidden md:block" />
                  
                  <div className="flex items-center gap-3 text-slate-400 font-medium text-lg">
                    <span className="text-amber-400 text-2xl">â­</span> Trusted by 1000+ customers â€¢ Delivered worldwide
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* How JiffEX Works - Value Prop */}
          <div id="how-it-works" className="hidden md:block space-y-12 scroll-mt-24">
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">How JiffEX Works</h3>
              <p className="text-slate-500 max-w-2xl mx-auto">A seamless, unified shipping experience designed for your convenience.</p>
            </div>

            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden lg:block" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                {[
                  { icon: Calendar, title: "Book a Pickup in 30 Seconds", desc: "Start by scheduling an agent pickup. This becomes the heart of your shipment process.", color: "bg-indigo-600", shadow: "shadow-indigo-200" },
                  { icon: ShoppingBag, title: "Add Items from Anywhere", desc: "Add items from your home, our Shop, or even items you've sent to our warehouse.", color: "bg-amber-500", shadow: "shadow-amber-200" },
                  { icon: Truck, title: "We Combine Everything for You", desc: "Our agent brings your warehouse and store items to your home for a final unified collection.", color: "bg-emerald-500", shadow: "shadow-emerald-200" },
                  { icon: CheckCircle2, title: "Delivered to Your Doorstep", desc: "Everything is weighed and packed at your home, then shipped globally in one go.", color: "bg-blue-500", shadow: "shadow-blue-200" }
                ].map((step, i) => (
                  <motion.div 
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group"
                  >
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center h-full">
                      <div className={`w-16 h-16 ${step.color} text-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl ${step.shadow} group-hover:scale-110 transition-transform duration-500`}>
                        <step.icon size={32} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-3">{step.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Emotional Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden md:block relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white shadow-2xl"
          >
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-xs font-bold uppercase tracking-widest">
                <Heart size={14} className="text-pink-300 fill-pink-300" /> Made for the Global Indian
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Stop waiting for a <span className="text-indigo-200 italic">friend's suitcase.</span>
              </h2>
              <p className="text-xl text-indigo-100 leading-relaxed font-medium">
                Your connection to home shouldn't depend on someone else's travel plans. 
                Whether it's your mother's handmade sweets, that specific wedding outfit, or the comfort of Indian spicesâ€”we bring India to your doorstep.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">No More Waiting</div>
                    <div className="text-xs text-indigo-200">Ship whenever you want</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">No More Asking</div>
                    <div className="text-xs text-indigo-200">Independence in shipping</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div ref={quoteRef} id="desktop-quick-quote" className="hidden md:grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-3 md:p-8 rounded-2xl md:rounded-3xl shadow-xl md:shadow-indigo-500/5 border border-slate-100">
                <h2 className="text-xs md:text-2xl font-black mb-3 md:mb-6 flex items-center gap-1.5 uppercase tracking-wider text-slate-900">
                  <Calculator className="text-indigo-600 shrink-0" size={14} md:size={20} /> Quick Quote
                </h2>
                <div className="space-y-3.5 md:space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-5">
                    <div>
                      <label className="block text-[7.5px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Destination</label>
                      <select 
                        className="w-full p-1.5 md:p-4 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-[16px] md:text-base"
                        value={qCountry}
                        onChange={(e) => setQCountry(e.target.value)}
                      >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[7.5px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Weight (kg)</label>
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1"
                        className="w-full p-1.5 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-[16px] md:text-base"
                        value={qWeight}
                        onChange={(e) => setQWeight(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[7.5px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-3">Shipping Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Standard', label: 'Standard', days: '10-14 Days', multiplier: 0.7 },
                        { id: 'Express', label: 'Express', days: '5-7 Days', multiplier: 1.0 }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setQMethod(method.id as any)}
                          className={`p-1.5 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all text-left ${
                            qMethod === method.id 
                              ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/5' 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className={`text-[9px] md:text-sm font-black ${qMethod === method.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                            {method.label}
                          </div>
                          <div className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {method.days}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 md:p-6 bg-indigo-600 rounded-xl md:rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-indigo-100 text-[7px] md:text-xs font-bold uppercase tracking-widest">
                          Estimated Cost ({qMethod})
                        </span>
                        <div className="text-lg md:text-4xl font-black">
                          â‚¹{(() => {
                            const res = calculateShippingCost({
                              country: qCountry,
                              weightKg: qWeight,
                              method: qMethod,
                              rates: shippingRates,
                              rateBands: shippingRateBands,
                              discounts: shippingDiscounts
                            });
                            return res.finalPriceInr.toLocaleString('en-IN');
                          })()}
                        </div>
                        {(() => {
                          const res = calculateShippingCost({
                            country: qCountry,
                            weightKg: qWeight,
                            method: qMethod,
                            rates: shippingRates,
                            rateBands: shippingRateBands,
                            discounts: shippingDiscounts
                          });
                          if (res.discountPercent > 0) {
                            return (
                              <div className="text-[7px] md:text-xs font-bold text-rose-300 mt-0.5">
                                Discount of {res.discountPercent}% Applied for {qCountry}! (Save â‚¹{Math.round(res.discountAmount).toLocaleString('en-IN')}) [Band: {res.appliedBandLabel}]
                              </div>
                            );
                          }
                          return (
                            <div className="text-[7px] md:text-xs font-bold text-indigo-200 mt-0.5">
                              Band: {res.appliedBandLabel} (â‚¹{res.baseRatePerKg}{res.isFlatRate ? ' flat' : '/kg'})
                            </div>
                          );
                        })()}
                        <div className="text-[7px] md:text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1 flex items-center gap-1">
                          <Clock size={10} /> Est. Delivery: {qMethod === 'Express' ? '5-7' : '10-14'} Business Days
                        </div>
                      </div>
                      <Truck className="opacity-20 shrink-0" size={20} md:size={48} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block lg:col-span-3">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
                
                <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-2xl">
                  <Info size={48} className="text-indigo-400" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-2xl font-black">Unified Shipping Protocol</h4>
                  <p className="text-slate-400 leading-relaxed">
                    When you schedule an agent pickup, JiffEX activates the <span className="text-white font-bold">Home-First Protocol</span>. All your itemsâ€”whether from Shop or our warehouseâ€”are consolidated at your doorstep for a truly personalized shipping experience.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Products from Shop - Moved to Last */}
          <div className="hidden md:block space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-black text-slate-900">
                  Featured from <span className="bg-gradient-to-r from-deep-blue to-indigo-600 bg-clip-text text-transparent">Shop</span>
                </h3>
                <p className="text-slate-500">Premium products curated for your special occasions.</p>
              </div>
              <button 
                onClick={() => navigateTo('store')}
                className="text-indigo-600 font-bold flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {storeProducts.slice(0, 4).map(product => {
                const cartItem = items.find(i => i.name === product.name && i.source === 'Store' && !orderedItemIds.has(i.id));
                const itemCount = cartItem?.quantity || 0;
                
                return (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col">
                    <AnimatePresence>
                      {itemCount > 0 && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-3 right-3 z-10 w-7 h-7 bg-jiffex-orange text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white"
                        >
                          {itemCount}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        {product.category}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-900 mb-1 truncate">{product.name}</h4>
                      <div className="flex flex-col gap-3 mt-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-600 font-bold">â‚¹{product.price}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{product.weight}kg</span>
                        </div>
                        
                        <div className="flex justify-center">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store')}
                            className="w-10 h-10 bg-deep-blue text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10"
                          >
                            <Plus size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      );
    }, [qCountry, qWeight, setActiveTab, setQuote, addItem, removeStoreItem, items, storeProducts, currentUser, appointments, trackingId, setTrackingId, handleTrackShipment]);

    const NotificationCenter = useMemo(() => {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Notification Center</h2>
            <p className="text-slate-500">Track your shipment alerts across SMS, Email, and WhatsApp.</p>
          </div>
          <button 
            onClick={fetchNotifications}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={20} className={loadingNotifications ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'sms', label: 'SMS Alerts', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
            { id: 'email', label: 'Email Updates', icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { id: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ].map(channel => (
            <div key={channel.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 ${channel.bg} ${channel.color} rounded-2xl flex items-center justify-center`}>
                <channel.icon size={24} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{channel.label}</div>
                <div className="text-xs text-emerald-600 font-bold">Active</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" /> Recent Notifications
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => simulateNotification('Out for delivery', 'Your shipment SH-00001 is out for delivery today!')}
                className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Simulate Out for Delivery
              </button>
              <button 
                onClick={() => simulateNotification('Delivered', 'Success! Your shipment SH-00001 has been delivered.')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Simulate Delivered
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                <p>No notifications yet. They will appear here as your shipment progresses.</p>
              </div>
            ) : (
              notifications.map((notif: any) => (
                <div key={notif.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                      {notif.event_type === 'Delivered' ? <CheckCircle2 className="text-emerald-600" size={20} /> : 
                       notif.event_type === 'Out for delivery' ? <Truck className="text-indigo-600" size={20} /> :
                       <Bell className="text-slate-400" size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-900">{notif.event_type}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{notif.message}</p>
                      <div className="flex gap-2 mt-3">
                        {notif.channels.map((ch: string) => (
                          <span key={ch} className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-500 rounded uppercase tracking-tighter">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }, [notifications, loadingNotifications]);

  const CustomerHistory = useMemo(() => {
    if (!currentUser) {
      if (isMobile) {
        return (
          <div className="space-y-4 px-1 pb-16 bg-slate-50/50">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button 
                onClick={goBack}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95 cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-2xl font-extrabold text-slate-900">My Orders</h2>
            </div>
            <div className="text-center py-12 text-slate-400 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mx-4">
              <Package size={48} className="mx-auto mb-4 opacity-20 text-indigo-600" />
              <p className="text-sm font-semibold text-slate-700">You are not logged in</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">Sign in to your JiffEX account to view, track, and manage all your shipments.</p>
              <button 
                onClick={() => {
                  setLoginTriggerSource('default');
                  setShowLoginModal(true);
                }} 
                className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-md shadow-indigo-100 active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold transition-all shadow-sm group cursor-pointer"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-indigo-600" />
              <span>Back</span>
            </button>
            <h2 className="text-3xl font-black text-slate-900">My Orders</h2>
          </div>
          <div className="text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm max-w-md mx-auto">
            <Package size={56} className="mx-auto mb-4 opacity-20 text-indigo-600" />
            <p className="text-lg font-bold text-slate-700">You are not logged in</p>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Sign in to your JiffEX account to view, track, and manage all your shipments.</p>
            <button 
              onClick={() => {
                setLoginTriggerSource('default');
                setShowLoginModal(true);
              }} 
              className="mt-6 px-8 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }
    
    // Merge orders and appointments for a complete view
    const userCleanEmail = (currentUser.email || '').toLowerCase().trim();
    const userGuestId = userCleanEmail ? `guest_${userCleanEmail.replace(/[^a-z0-9]/g, '_')}` : '';
    const userPhone = (currentUser.phone || '').trim();
    const userId = String(currentUser.id || '').toLowerCase().trim();

    const customerOrders = orders.filter(o => {
      const cId = String(o.customerId || o.customer_id || o.destination?.customerId || o.destination?.customer_id || '').toLowerCase().trim();
      const isIdMatch = cId === userId || (userGuestId && cId === userGuestId) || (userCleanEmail && cId === userCleanEmail);

      const destEmail = String(o.destination?.email || (o as any).email || (o as any).customerEmail || '').toLowerCase().trim();
      const isEmailMatch = userCleanEmail && userCleanEmail !== 'guest@example.com' && destEmail === userCleanEmail;

      const destPhone = String(o.destination?.phone || (o as any).phone || (o as any).customerPhone || '').trim();
      const isPhoneMatch = userPhone && destPhone === userPhone;

      return isIdMatch || isEmailMatch || isPhoneMatch;
    });

    const customerAppointments = appointments.filter(a => {
      const cId = String(a.customerId || a.customer_id || (a as any).destination?.customerId || (a as any).destination?.customer_id || '').toLowerCase().trim();
      const isIdMatch = cId === userId || (userGuestId && cId === userGuestId) || (userCleanEmail && cId === userCleanEmail);

      const destEmail = String(a.email || (a as any).destination?.email || (a as any).customerEmail || '').toLowerCase().trim();
      const isEmailMatch = userCleanEmail && userCleanEmail !== 'guest@example.com' && destEmail === userCleanEmail;

      const destPhone = String(a.phone || (a as any).destination?.phone || (a as any).customerPhone || '').trim();
      const isPhoneMatch = userPhone && destPhone === userPhone;

      return isIdMatch || isEmailMatch || isPhoneMatch;
    });
    
    // Combine them, avoiding duplicates by ID
    const unifiedHistory = [...customerOrders];
    customerAppointments.forEach(apt => {
      if (!unifiedHistory.find(o => o.id === apt.id)) {
        unifiedHistory.push({
          id: apt.id,
          customerId: apt.customerId || apt.customer_id,
          items: apt.items || [],
          totalWeight: 0,
          totalCost: 0,
          status: apt.status as ShippingStatus,
          createdAt: new Date().toISOString(),
          shippingDate: apt.date,
          destination: {
            fullName: apt.customerName || currentUser.name,
            email: currentUser.email,
            phone: apt.phone,
            addressLine1: apt.address,
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          },
          paymentStatus: apt.paymentStatus
        } as Order);
      }
    });

    // Sort by date descending
    unifiedHistory.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    if (isMobile) {
      return (
        <div className="space-y-4 px-1 pb-16 bg-slate-50/50">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <button 
              onClick={goBack}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-2xl font-extrabold text-slate-900">My Orders</h2>
          </div>

          <div className="space-y-4">
            {(() => {
              const completedOrdersList = unifiedHistory.filter(o => o.status === 'Delivered' && o.items && o.items.length > 0);
              if (completedOrdersList.length === 0) return null;
              
              const allCompletedActive = unifiedHistory.filter(o => o.status !== 'Cancelled').every(o => o.status === 'Delivered');
              
              return (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-3xl p-5 mx-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <FileText size={100} className="text-indigo-600" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                        <FileText size={14} />
                      </span>
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">CONSOLIDATED TAX INVOICE</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">
                      {allCompletedActive 
                        ? 'All Shipments Completed!' 
                        : `${completedOrdersList.length} of ${unifiedHistory.filter(o => o.status !== 'Cancelled').length} Shipments Completed`}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 max-w-md leading-relaxed">
                      To keep your billing clean, JiffEX generates a single consolidated invoice grouping all completed orders.
                    </p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button 
                        onClick={() => setSelectedOrdersForConsolidatedInvoice(completedOrdersList)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer border-0"
                      >
                        <Search size={14} />
                        <span>View Consolidated Invoice</span>
                      </button>
                      
                      <button 
                        onClick={async () => {
                          const promise = api.sendConsolidatedInvoicePDF(currentUser.email, completedOrdersList, COMPANY_DETAILS);
                          toast.promise(promise, {
                            loading: 'Sending consolidated invoice...',
                            success: 'Single consolidated invoice sent to your email!',
                            error: 'Could not send consolidated invoice via Email.'
                          });
                        }}
                        className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share size={14} />
                        <span>Email Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {unifiedHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mx-4">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">You have no active shipments.</p>
                <button onClick={() => navigateTo('home')} className="mt-4 text-indigo-600 font-bold hover:underline text-sm">Start a shipment</button>
              </div>
            ) : (
              unifiedHistory.map(order => {
                const isPickup = order.id.startsWith('PH-') || (order as any).pickupType;
                const formattedPlacedDate = () => {
                  try {
                    const date = new Date(order.createdAt || order.created_at || Date.now());
                    return `Placed: ${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                  } catch {
                    return `Placed: ${order.createdAt || order.created_at || 'N/A'}`;
                  }
                };
                
                return (
                  <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mb-4 mx-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase block">ORDER ID</span>
                        <button 
                          onClick={() => setSelectedOrderForDetails(order)}
                          className="text-left hover:text-indigo-600 transition-colors cursor-pointer font-black text-slate-900 text-lg mt-0.5 block"
                        >
                          {order.id}
                        </button>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {isPickup && (
                          <div className="bg-indigo-50 text-indigo-600 font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                            HOME PICKUP SCHEDULED
                          </div>
                        )}
                        
                        <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">
                          {order.status === 'Picked Up' || order.status === 'Order Picked Up' ? 'SCHEDULED' : order.status === 'Order Placed' || order.status === 'Pending' ? 'REQUEST PLACED' : order.status}
                        </div>
                      </div>
                    </div>

                    {/* Pickup Details Box */}
                    {isPickup && (
                      <div className="bg-indigo-50/20 border border-indigo-100/40 rounded-xl p-3.5 mb-4">
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-900">
                          <Calendar size={16} className="text-indigo-600" />
                          <span>Scheduled Pickup Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium block">Date:</span>
                            <span className="text-slate-800 font-semibold">{order.shippingDate || (order as any).shipping_date || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Time:</span>
                            <span className="text-slate-800 font-semibold">{(order as any).time || (order as any).destination?.time || 'Flexible'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400 font-medium block">Address:</span>
                            <span className="text-slate-800 font-semibold block break-words">{order.destination?.addressLine1 || (order as any).destination?.addressLine1 || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Weight Est:</span>
                            <span className="text-slate-800 font-semibold">{order.totalWeight || (order as any).total_weight || 0} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Assigned Agent:</span>
                            <span className="text-slate-800 font-semibold">{order.assignedAgent?.name || (order as any).assignedAgent?.name || (order as any).destination?.assignedAgent?.name || 'Assigning soon...'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400 font-medium block">Item Type:</span>
                            <span className="text-slate-800 font-semibold">{(order as any).itemType || (order as any).destination?.itemType || 'Everyday Items'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Row */}
                    <div className="grid grid-cols-5 divide-x divide-slate-100 py-3 border-t border-b border-slate-100 my-4 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">FROM</span>
                        <span className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1">
                          <span>ðŸ‡®ðŸ‡³</span>
                          <span className="hidden xs:inline">India</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">TO</span>
                        <span className="text-xs font-extrabold text-slate-900 block truncate px-1">
                          {order.destination?.country || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">ITEMS</span>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {order.items?.length || 0} items
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">WEIGHT</span>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {getSafeOrderTotalWeight(order)} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">TOTAL PAID</span>
                        <span className="text-xs font-extrabold text-indigo-600 block">
                          â‚¹{Math.round(Number(order.totalCost || order.total_cost || 0))}
                        </span>
                      </div>
                    </div>

                    {/* Timestamp Row */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <Clock size={14} className="text-slate-400" />
                      <span>{formattedPlacedDate()}</span>
                    </div>

                    {/* Action Buttons Stack */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setTrackingId(order.id);
                          setActiveTab('track');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-indigo-600 bg-indigo-50/50 border border-indigo-100 text-xs font-bold transition hover:bg-indigo-100/50 cursor-pointer"
                      >
                        <Search size={14} />
                        <span>Track Shipment</span>
                      </button>

                      <button 
                        onClick={async () => {
                          const promise = api.shareInvoice(order);
                          toast.promise(promise, {
                            loading: 'Sending invoice...',
                            success: 'Invoice sent to your email!',
                            error: 'Could not send invoice via Email.'
                          });

                          const summary = `JiffEX Invoice\nOrder ID: ${order.id}\nDestination: ${order.destination.fullName || ''}, ${order.destination.country}\nTotal Weight: ${order.totalWeight || order.total_weight || 0} kg\nTotal Cost: â‚¹${order.totalCost || order.total_cost || 0}`;
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: `JiffEX Invoice - ${order.id}`,
                                text: summary,
                              });
                            } catch (e) {
                              console.warn('Native share dismissed or failed', e);
                            }
                          } else {
                            try {
                              await navigator.clipboard.writeText(summary);
                              toast.success('Invoice summary copied to clipboard!');
                            } catch (e) {
                              toast.error('Could not copy to clipboard.');
                            }
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-emerald-600 bg-emerald-50/50 border border-emerald-100 text-xs font-bold transition hover:bg-emerald-100/50 cursor-pointer"
                      >
                        <Share size={14} />
                        <span>Share Invoice</span>
                      </button>

                      {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button 
                          onClick={() => cancelPickup(order.id)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-rose-600 bg-rose-50/50 border border-rose-100 text-xs font-bold transition hover:bg-rose-100/50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Cancel Order</span>
                        </button>
                      )}
                    </div>

                    {/* View Invoice Footer Link */}
                    <div 
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="flex items-center justify-center gap-1 text-xs font-extrabold text-indigo-600 mt-4 cursor-pointer hover:underline"
                    >
                      <span>View Invoice</span>
                      <ChevronRight size={12} className="text-indigo-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Invoice Modal */}
          <AnimatePresence>
            {selectedOrderForInvoice && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-8 custom-scrollbar"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Logo iconSize={18} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900">Tax Invoice</h2>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Order ID: {selectedOrderForInvoice.id}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedOrderForInvoice(null)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      <XCircle size={24} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Shipping From</h4>
                      <div className="text-sm font-bold text-slate-900">JiffEX Warehouse</div>
                      <div className="text-xs text-slate-600 leading-relaxed mt-1">
                        {WAREHOUSE_ADDRESS.street}<br />
                        {WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.state}<br />
                        {WAREHOUSE_ADDRESS.zip}, {WAREHOUSE_ADDRESS.country}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Shipping To</h4>
                      <div className="text-sm font-bold text-slate-900">{selectedOrderForInvoice.destination.fullName}</div>
                      <div className="text-xs text-slate-600 leading-relaxed mt-1">
                        {selectedOrderForInvoice.destination.addressLine1}<br />
                        {selectedOrderForInvoice.destination.city}, {selectedOrderForInvoice.destination.state}<br />
                        {selectedOrderForInvoice.destination.zipCode}, {selectedOrderForInvoice.destination.country}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const isPendingInvoice = (selectedOrderForInvoice.status === 'Scheduled' || selectedOrderForInvoice.status === 'Pending Pickup') && (!selectedOrderForInvoice.items || selectedOrderForInvoice.items.length === 0);
                    return (
                      <>
                        <div className="border-t border-slate-100 pt-6 mb-8">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Item Details</h4>
                          {isPendingInvoice ? (
                            <div className="bg-indigo-50/50 border border-indigo-100/60 text-indigo-900 rounded-2xl p-6 text-center">
                              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Clock size={20} />
                              </div>
                              <p className="text-sm font-bold text-slate-800">No items picked or billed yet</p>
                              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                                This is a scheduled pickup from home. The item list will be finalized and updated once our agent xœì}ÝrÜH²Þ½Ÿ¢Ä˜3ÝÔ²›ÿ‡+RÁirfè#‰\’íZ£‚Ý +4€Ð"9<ŒpœßØöúò„7Âà_×Ù'ØGpfU( õ‡îæÆÓ3b£Býfee~ùe?ô}·Ÿ&Ä	dä:É8vrŽcâ¥î®§¿ÇçÝÿ@´Ÿ—‹ÑŽö–—‹ï³î–y²EÚú" Ò÷$yëŒÜí¹$rúnç¦³:§5!·‰‹u‡ñÀ¿ãƒàsèõÝ.mfwäDí6þ¹@¼Áõ<ÙÞ1Ô$¯Í'÷fûž¹ëuá»×¬;}7HÝ˜üyœ¤ÞÅMçÜM¯\7 Qg•œ_vßIÝÎú‰Ãq0pkŸœ‡XEþ¿cyiÉØDYÕ+réDÝ%/í
êA†ø?¨úÕÊÍëí_u£ù×Ô½Ny{Ö––Tí$ág7¾ðÃ«ÎÐÜÀ²®0Äøî®7r.]òŠ¼ôF—$‰ûÛÂå»rc.Æ¾Í¡ÿ„ç†éÑéãËçHì^¸qìÆG¡ïõo¶ç‚°“]š#‹;0O_9ýOø¦ÄûÅÝ¾]Yºƒëwv½jZå°m~u°XoÈE¤óÐˆýÿÎ'Ö3Ü}× NŠI†ÿë\ÅNTŸn×5úïMg™ŒRø­È‡ååèú£X©u|ZÛ‘;ðÆ#ë‡ Ä*åK'TtÝYî®“è¦³ÿð+¾xnG‘÷Äåµû+—÷]ÖY	Ã>v¾°aývÞ»Þå0…¹“¤q\Ö‹VæšK7=q.Üxé»ÀKÙ£TBÍß‘O—PZÆÎd5ùCzcWÚè¿Œ õÒò/ÿB–ï¦|õi˜:>±ëŠÍjWÐ‡Å¾è¦áwÞµ;h¯LÓ-MV¤í­ö76^·VeCÅ°Ç4<ûû¿þûWÂ¥»3a­NËFbY¶Äê¶ùyýÍ:‚úyþ¬ú÷JGç2:5ßÇV`Ž:¬ÏÙ7:ï¬i;ýÖKŽÜ`à—\©€o¦ÇÐ·q‰	bj~â‰q´k¢–åAu.CºÍra»TÈ3¶.QÞÅð*ß¹òn’’s?„ß¡ÕËs;YƒÞ†°‘{}'õÂÀnm5šÖ+PÏ‘ûGgjèuÇ§!ñ]ûv^ß%n1ï³Ú^y°£Ÿ»dà%‘ïÜ€°¸œÝL«]yýOð*¾çp¿;0+¸¼6^à{ÛášvVq'ºí/Âíæ 3:õö¾Å>XìÊjME*î\-&,Õ^d[–z„-zr÷ÊñRx‚A/‘¯É·ÐCÆî1O‹YšN<ªTÕï’Ž‚œDø?ÞÑçÙT ,.ÛÈ\ù:,´]úõ:±q“´ÝÊj•¾‡ÒÃ¸‰*NEÙfj³Î­VEÓ1±épÛýu–ó}Œò‚ö ½Š!…«°Ñâxn6èÛ7N:ìÒ…Ý~;ÆÅ®P{ ½¤5èdÚ›~îó»–`ïåV^oWI¬¹#7vüUê…ÍT"¶Ä­iZ¹¥9èGÎÍæÖIê¤ãÄ¬÷ØÍkóM/§Sgš•:ÿ{Éå»ù6¼GòCu a{ÚdÇx<®©”ž—çã4ƒêz†a‡±¬ËÙÈ‡,ÁÊQŒ÷ÏÜ[ùc¨ÀÀ‰‡ÊFÇyb´,`uWH'aÜ‰BO+B^Åô~t_ÞÄ£;¡åí]dž´7¸.¶!_ò®àÏ¼¸÷¾8¢.Tê	z©qO(¦ëËÅQˆuïJ~•<RZ/wosâ(v4¸’r»øœì¹©ãù	y`¿l_aéù„
 r°7Ož/–Š­•*Ö &?²w|ýuM3©mkx%^¸ig‰ˆç‹ÅøÂl‡HüqŒªð/ ûÖ—>š‡T¾_=K$â0iûö–„‘Ó÷ðÈ¿´@’¾ã»ðW÷›W@ç¼“É ‡õQééåüéeú¬âQ÷ÚK'|kùtV^(¸a²3žÑ¸õ/Aó]ú<üXoØ":ƒÝ®²5F ðúÐÙá¨“ôãÐ÷Ïx®V1é|·Wi’Ô‰SÔ27UU'é‡+5Ýa¥¤;Ôìlâóyûrq¸¢,;ªŠPÅ"WlÇÂÑ­rdD«^öÞƒ½-å"êzƒ;¥Ÿ@³áeBVÑŽ0 ‹~û¶M-÷°üNäïo0i”{®¨Ê€­ìKËKÕCW!˜û¡ÆIUèJ_£‹?ö¼¸ïçåµ;µÎŠ6èI´ÅT¾Œ½Áÿa»è	ÜR6'ŸÀkµ–Ôt¾ŠN®6N@%VçvN†^¡Œÿ.G0Ã×”/ŸqM3§_uéOÞ{é°Ý:ú¡ÓšG»¦½g[‰ƒþ¶›ù.š ÆÑéM$ßnÙçi[´;À––¼êâôÄöÊY­™Ôsãì¾V_ Çn}ck^S­-ÒúÞÅÅþÉ{P†á8q[ÊÛU+N¯ãÊÆ®,ŸP§ª˜‰¸,zœa4þ¶‹ÛÆí°?^{»¬l\:^@­wõ‡Z­ùnù^Ún-àŸ JÝ6ìÙ+óÝ?ƒ$£Wï^žÇ*¡3yõûÜ©`Uíìf¨îÝï‚¡Mµ¢ô²üîÖ}µý/ê…·ÁµnˆðÚqp°ptSTÓP“qÎ4½ßïïÿpøîdÿçÝ½½ãý“èæØuS«®?ŒânA^,ŒÞ„¥B‡ÉíÃÞŸÆ7:Ë¶ó&ºŸkÇ=ýû­ÕÊ7ÙÖ±Ûw=PÉë9I{góW€nÃið]âÆ¯¨Ï¾ñ{¿„MX¿Q½]Üm™–µ]ÑÅfrgù„°#Ì¦
%Él[.„øC3”(êÓÁ­r®Îb!ÎËì*¼Ju-7‹­W=cüúrÍ‘»ŽâkCœ­/4BG&8KžÑ·úÍºRjR—ÒªÄ®ƒ)
E9‡SUÕÙT4bqC'_ößNnÀ”›#Å+ý Š=uå#rÒºƒ±‹”ŠrÙ‹yé‰q­ìZ1x³Mî© špW£ã³Ô]ŸÛá}²mù5‹ì­²¢Z1	ßE÷¸,1.”ìŸ™ôa2P_WÓÏÓÕA7 §Þh¦½mìÅÔÙuwIÖfOµ¾wôe‘?L¿Ì¾ßMï2€®ß½A4Ã¾×k×ªeàðêÐÚÚŒqx&}®¬UÈi±>B7	Ã ÛíjÁQ_â,xí—cÄ¬²¥ˆ&ž]†>ñúæ£'/£µ\ú^2ü2W'"In¿ã›TN¨Ýªñ8ˆOæ²çÄ—á—9?ºC­ïØ¦‚ÏìÅ“BåáÖéUØy?t¡ˆxÃ ¶»^:+Z©?£óú[¸®ÆÍ`¤¶ÿù«{±¾ÎH¡{2cµW´N>Z'nŠA;g9d“©Êñ@ÃŸµùÀúff$fvûºØØ%'Ÿ]“ìÐFüØ›J¼ò)œÙñà®r7ÎÚÀ¹Æ7áÂg®8ú6@Ó˜O(DÀ‡óÍÐžPàÙlÎ¾Œ@³§`fƒFœ ¬;û@²
 kE!	?‘²Ç{„±§*f…ô5é5MÚ¾›@’aìŸ:&gæÁd³#³”K$ò2*“¦Q©.ZX§+Ù*µóˆæòy¸T±tákìÐžËv ‘¢n¶À… E¡ë‰N}&A7Ó¨‡ª€¾	Mvúá
Ó×‰IõjTZ,‰;òªfCç;ª‹,ýàèâR¾É6²böÑ_ÏaÊ5ˆæásÉÍcÀÌ¾‰V÷Wk‹zõE×£yÊ=DúH…®£âˆùÇíb~2‰ ù)ÝdóÓÈ÷ŸÇ÷0áZDøT¤köC.^³›Ù´.ÉÓk?™IB”§äRÀ®Ïø?B¹uäxƒò¯«ƒp²eæÂD„e¡2æ<<8úŽç0VØ<(DV1½iñR‰nÉ„‡îÃ_Ó`ª{~˜<ÕHé£<|‹›Ob7ÇAnPÙDP¶Ýq¼M"?ù¬¹¿…•XžÆ¬àiÎ‘’!;ÌËNä+õp16Ÿ*€†l–•4¹qöZŸržóëêifYyT_îÆqxõÚ½H…˜©Jë°štè;ic0L¨ýó"ŒGÕÃ«ø¸ÇQ®
Ý”ppêû“lzËIVõ$onXU%ˆ¤2Ûó?nÛLÄÜ
oí‡lEýpùn&r’×\Û&ãÀ»ðÜÁð-Œoºž}ß±ˆ0Ó···I‹›‘ÝAÑB!·œv}7¸L‡d6<1 Ò» mÉ«³Û±ì¥ùl™¡ô®5æM/+l·ŸB,ÛðÛÐs`Ù#Í@k¾ë¢M\ßÐyEU*2H)u;d';ç1¹ˆÃ‘°.à¢€6²S­r^Œbá Ôv‚ÉŒV­sž„þ¤@Fxª®ŠÅCÆ@»ç+±]¤I'W÷ç»§0k³Õˆf2=Ê,¹ë5Î›úš$kU?ôÉh°Eÿ±€km¯(e6m•Zk'ÍWÐ‚­Tj'äL}Ó‡¥Z˜YÕZzuT6îÔKšS‰TÏõ÷Bb	§wÙ;|{røú`o÷tœîþ‘¼ýñð ·¯®‚Z™“ø°ÃÔ’TÚÀ[‰DQté+ÒÚ…mQØ¨ª&$îYKõÌ9ûêV-þîHxA¾ºH€e%Hês&S Uc "ÎNjñ-"?íhaNCòÉu#Feˆü.5º0£ð\"vÜwÉ`ùÈjãh·›,ÒtI©›æppé»t}qxâËˆfè~%£N‘w5¡R4‘ñÉHƒóL*&jâ€ºWôæAíÁp<Hà|ÐšÎÙdÛªâè EðnHôµeIT?­Ó€zP,×KGÇ\­Êö¦Ñ ûKØÇÔXÜ²ê—mK²“†BN¸NÜZ;*h~ôÜ+"viF[¤DêÓÊÄãí$7AŸÔ56ñÃŸ”/AmÇ‰¼.œ_’q´÷][ˆQèº#8S.È4¿Ò;|s´ûöO?ïíŸî¼>‘’Và'Wüõmþï‚²¶„ø!•[¤uÂ¹¤Ë±}Ê2’q¿ï&	–¡YùÐ)ÔÉÚÖgš2]85ÄPb/Ã<ÂŸÈKþì9dìªâ)ï&©—ÕKÎJÕc–T%\‘šÑLÓvñ5Ys"o…iÉÑîœf™ÉµÄúÅÚ%a¤*,,êÁ¢Ö­ò^çšxù0¯Gæ/KuÐª ž$!­J¸QAêSpÙ-¯TÜñ2ý·ìë^+Ÿ©3>8JÓ•VäAð/£?…c2t@•
Bâ0¥*ÉÔ”®|ÿåò²²Îgï*}¶[ÃpäbødÙN·V[4U*Æ	àævN(„“WF5Ûd¶$IàeeÈ?Â&Š9R FèMÈÃP>lHA!*êŒ…fµÎWCU$¹ZbïZÈ4”œD’²PkôÐ5N½é´‰ñ”öƒ†Î©v^@’ÆÞ#¡—`€¹	TmUø'êqM–X)è£!,QrNªï„m+^±F=¦gíÌW‚î¦vv—"Ò-ŽFqmy÷Ø9¯mœÔZJÏXð\ÔÒH1}3Œ.èÉIÎtÄ[÷78º:²e#jM:Ûr>	úÓÊ`™Ÿ”;³—Kø%™(íHT·üpÜªWv0«•´ÊÌú!:§¿ŽØ?šhÆ5#j¥Ñ¸ª³â	*JW–Ç3fÁ|Ú°F6±qjZÔh°UwAj>Í°³c ¨œÛÁxÁN`„b£nX^ÊàÂe‡'4VþU¿RÑ<~¯|Ù.ZoÖáPö	†C k›*f`ÖMc0²Ÿ¤´.-€(’ö0\ÂUþóRƒ7«Á):NÐ
Uˆa¹5vwMv8ûn¡àvÜù¦Y…¥`1MK¥¡a'pJqÉ÷a8Hš4p*hZCdZMìßžŒ¶ÓðÖ’¯T+.¦àc%µ°ûê¿3Õ»¸KÙ5¯HKÀèÔ 8 ~(”ÜK«€Ê_{wv§TÕ¦o)¶¨vm«ôàdPDÉúí¥¼ý¯s¶jŸÌ8k“ÇVhÙ}fµºŠI'=JÔœ¦„0V*’:ö©C¸cîïa.àüí¿üøïÿ1yôgÊve€aÎž~éHª›rtlt‘eÆžø„:é€ÂB(S•;¸Ÿn¢ÓúUf ez½öeôP–Q`¶]£‚#s“Uô¾„Þaàm„~Î¢‡Ø	ú
Zrâ.Ý‰›õVV¯$£¼—„6|—áWÖôØí&ZnPÄ×@)*kôUçÂS£„_öhú[¾¤&_Ç+Ø¥03¥¥Å´ÔJ¥Ô8·sÿ¸Cì(d{Ei¸­»è…Üæ%¿ô³C¯á½Ý ¼jÏãaéæ|÷$¡Bmœ8›t®YBÐÊp’Þ x‹uÆcJè³Û“a§zÙ{ WlŸ¨³oê`Ðõ_â¦§|rÓ§ÒyÎa¸¢Sç¼Ý¢3¨¥y@á@Æ: 0CV-“JËuÉ÷ ug.µQReuÀ=RÆo¬Ð$´§s|Ó„ê©'…F?RœzÈ3¸ÛŠuS¥1Ö?u¼…Ä?Ìâ`"H~°
{$~MaìÚd<9 o“3ãµþ)Èœa[pÌÏ]J?‚Æ^ü"hÙeþÐÖÝ‚ô¦ŒÜá§ û•Üè&*[[Vê[„ÆqZk$gº‰ƒ kî*c6ëæÓÏú;q0©Ü6=…ÛFŠ[Fe˜HG3ý´¢Å€œÚÊ†Ýt»
“ÿNúN
¦mìÂ1An÷Ê‰ƒvë­Ãˆvx	,Ê„ÉÌkwÐZ ®éåº¹O\ÆìG«ï{ÑyèÄƒîUâÁÀmÞ™†êf’ˆË‡v!øì‡‘‡±÷!É_òL·©±vÚ {=-mA²ÀkoJ/í_ªëøÙîÁB(^¾	ëL÷µïœd1]+E.¢lwa+ãã3IDIí÷ìlp›¶òš†×§%3We¡ÄéæŠzØ¡þ¥!Çïùpã—ûjþ.Õ0ëºÔ«d¸RkÖç[¿^ÙRö¡½Iš³i0ë}‘ÕbÖ3 ñFc<æ‰9UÛ­LÕ¤IKQXQá~ö'T†2È˜¸‡‘¡“s<• |ÒiÝ³	'Ú4¨mÝl›löìñO3Uft^“ ÂÊ*wci® gÕF@¼º)…‹)Vr™ØXPS{¶-¿ìÝÏq3š’ÜÂ¢¶¢èÓé5´pI/Ï—Ið+¡¸¥ªqÙ˜U.kË*'&Ó¥ŽS%ž¬‹ÇL§M7MÊ¸‰ÆMœ.Nž~ôdqòà¾¦0Wyž-µ=|‚PÈëð2$@N„tmgÍóÕ:×8_•­îárÕe	cÕ¹êÔBjŠH+aëÐ1”@Ûä¨kb1}B:c@…q±4ME§Y"—†®9)W5³Z[µÂ)Ñ(AË„™šf£ifÙ™&s›=Â<Ò%Wš€–Q%ÙdfH­Ûñ>æ˜MåJä¼ú¹bSœŠ¶Wv¯Íü´)GCç+­â,ç±JÊÊˆ:²³w{É3ègJìv™<«¾x‚ÎÁØ-]búŒ;˜E¤Å ùÏ”{rÆ™«½¡Lð!³ÒIi4òn³u ›ŒU	SiiÆbLç@mˆ¹+ëñŠÖQâYõ›ZŽ¦1dp¢`…Ûq£ªNBÄ¡‰¹¸‚-`4½ú&X€zëº®ó6dÍ!CF†Œò þºqSe¾eÍÛäÔºT'ë$;>†âs:ô/	™Gn°ÐÊRC0Ô²w¹´MÄG® +h9G–†Àñ¡£”Äa±Èé³€ ÌAl5H0eCBï¹N2†=„yY/9)½{8>—Q4ˆ#¥í9Ã@³e*è¼L3N}^¡¢¯‘¸P“§A'.ïšÉHÅåe=Mjq>´Oœ`œ÷¨ÅwÖõv¿Êqù{î‰xÜr¸% °'B:.ÔîQ©ÇÅz<(¹øâ§DCÎëe½ín´½­ñ*µ¨â,Æ­Û`q“ŠÐÚª Ñö\!’ªJ•e¶qið3­Š_aòX³Î§ Ç¶ru|-_Ï:º vP Ï©ŽÍaþ¼1¢ÿÔŠ½ÉôEL1SuGƒ‰UÝ¬¦™úŠžZß¹ÉTÖ”ë¸ ‘Æn¦»£ÒÊ”w“rj>FT‡ÁÐá×á™vVqwÉCÜ`Ö9H@»Ùâ
$veµ¦êw®VMÎ’mh"bgöÙEdQf  _“o¡ocš
Ó*îÍ¦™™1ŽEç´>¢§Ë|qÙ,IMhòºWY3"â†g™£úzQ±e«ç«ÅÈVŸ¿´yZ	ãX˜;Ún§œåp4`¢Wµ›¾¯LöË‚RTgÉj™Ðg’¬?%ÉS Ø¤t¤“„ÝÚ$ãPµ¿ÄoNÂažˆæ@çÉµ
ûò$¶Ð
-Yþ|…³Ò×	Äóg¸÷³ÎÃD	âJg›Ê)FÊ_qn®ÔÉ¥ŒÇu]tÆË£˜Q>&‚»›Ð‹|™6×“íÊ[-¬fÙìÌr³€YNâÀ­^TQä×‰ñPM_¸9YNÈi_AjS_:ê™'¾„ÔÑcuÔY#d`¿ÇÄë;Óav¦@íLÛy¢È9bvè½î0l†MüÂÙ£ Î<$t&Om©„Îè7­Ïd2+.9aó±Î,ÓLcš±¨™©)J3‰_)xåìòD#ŽFã{EÚMN‹!cªZ31çÆyhY_ Çn};ak^S­-Òª¢4·ÍÓûA“Üó0šg]ãžMfñÖ|7‰|/m·ðO¡…°I¯Ìwÿz½ª¸LZý>7¼[çÒæÕ½›à]§cý²üîÖ}µã}L0ñQë†¯¡G™n&=_Ngðš-¨|x*Ì ²ÔÉƒ¼f~8ŸŒóä± ‡¿–ýÖje•â²yDXLð7ìÍ_!äLX›¼÷KØ„mè,õËÚ®èb3¹³|BØfS…’d¶­…È¸õ@y'o•suQC±¬Cš‘17(¥Þ¨ð)«#[$‚Sb‡éYuDQ«šÙèNU&ä`¬± yŠälÝä&b^zb\+»/þ`“ÃdæD^KH4˜QAÃÉž5LgÊdÝU¢eÓBQR/këjÁ·ÿ]Íqe‚4Ï³ìmc/æ¼Ð¦í˜¢¿¼¾/ÓÏ°ïõÚµj¨h‘MÃ3és“,OŽx’³àµ\ŽÉÉ–"šxtúüýÅë›ž¼ŒÖ~pé{ÉðË\4£·_†RÝYH‰ª»Ñ8HÉ»{N|~™cð£;ôÐúŽmzÐ!øÌ^<Ù(Tn^…÷CŠˆg1bóä]êÀðûïÐÁÂu5n#m´ýÏ?èXÝ‹õuF
Ý“+ÐŽpú¤›bÐNÃYÙdê‡r<dÁ—JóõÍÌI:Íìöu±±KN>»&1&ÈysšGEÊr`Ó’-"²y0–Æ|’Å¨~ø8ß,ë	bÍ&ëË¾zêaW¶i`Í¼ÿ «
¯²ŽC uz¢!V\õaUO/ j6ØÝIŽ61#LÓ%n7”0MèÕ,Â®& àã*×&‚áÙ¥ÆÔùDs¹,e¦›'>,²c*•`(9ŒÙBshÐe*»vñS%Ïjš=KãhZ|Î¢§¤Æp†KÔ@ÃˆÓý?žÂ¸Ä#'%í·!aˆÇóðºŠêÍ_g¥t®0¥s˜ô¹æA;¥˜¸#¯º
7t©º4d)Ò”|“íŽÅ”¦¿bö¤á7|‚ÃošæM˜ºõ	GÔ*¨^'Òõh„r!:RI®Aú®/q§»,\'*%wíMvyf‚ÔlÔJzè2%õf)uºÈËGa’ eo•‚{t=Æoü¹ê-Ìô@zuN¶¤0Ù,e¤ÇƒÃ©¯á|ó`…ÍƒB<U0Ö›a0•—LPp°2j†Âîùa"Y@«ë—Ua.ÒG*ô³¦`—M à1j5m³ —FS,XÉMû[´ËoÑ.íbe]2ðÕ’&Œµ¦­yøMiZQØÎ<GÙ1ÙòÆ ÞáÛ“Ã×[hHM:¯
Dø*¢ßák{ðÚ6ÅzµÞ·î:Ež°ù.h’ñhãÝ<õW+ï¬ip°¤v÷„@Î$Œ;QHƒJb¿}YABxwïB;)š~öHú¢èÿ?Ã[)c–>¾’ãÄGµ€r[WÙž±wâWH´ÖOÛÍüÉÊV¹xí›6ûUd/ù'g³½¿mùt_N\›aê^@¥ß8<[*Êy“%t2y€oI·Ûe×èƒ,‘=l¾wóªXßÜÉ¿¹“s'?[ç“v"k‚DªƒAßÊ¶øDåè7Çµæ…æ$žÜÅ;½ƒ÷‰¸ïs"Š¾UŒîZmNÑ7S.¸^8Š|U"¦±ƒ ï¡º+“*;-–gª„¨†„˜Æ2# ]ÿP>Ä)èg<6¢AÐšCQÇ8Ý¥»ƒqßmcæ]P4™­l<"¿#*Ÿp8¿@–ªˆåaäaÆ÷ü»Óí´ÎÞ*£F£Ï÷“»TÎµ§ô·cälm‡•ŒßU¿0ä{p?<äÑîÁÞ#;qÕ<ŠMíßW ¶Ã+ÜØƒ´mcà~¬Œƒy&³…•sª‰£ÞHnßïNrô‰:‰ïqšJ)ŠÃ‘—`%'òº‰$«öhï»¶è qGŽç/›¿@z‡oŽvßþéç½ýÓÝƒ×'š´ä,·9¯Q›ÿ» M‰î‡ÔlÚâ	ÏÔÔ…¡Ç¥N·ÛZÐ”Â³¹c)P„ïJæ)æ0¦¹Zh<Ó–J“´C™E–vì^yÙŸ=‡ìc‘]•²ë”YÙŸåçŒÖ”Š!Ç†öáERHåcz·@>ÐÞH`!ÒBl|Ö®¸t·ŸzŸÝSç|A•e¬þ·MÚ®X/yž{¾û*‡»“ïÃø}îŠÀ0«m2NÜ7î(,åkó.Hû™Péù,›ú7_ÜâÐvä…Vn£÷±÷^…‚/½
h*¡\“€
3=´ˆ¶×å0Îçøwé\=Ou‡ß—Š>F‚ƒm’à×äÃUÈÇ2‹÷GúüRõÑ«Ì#Cµ•íJMŸóâËOíy	-ô””'Å»³_Tï_’´;ÂÿÓ·Wk]Pá"4¤Ú§¹ÊµM¨B7r®Ñó^/²S{ó<,T/yˆ´ù\f×2ÙÕ4
/¡@žÆ ³‹—Ã°$çìL'«È0ô‹ IÉàz\ eo©ê8#îq7r#.&(áŠ&KßVÏ}ÝºýOÌÓ¾ÂÅÛêJ2"<²£†2RUí€œ°íªÿL)ÃB8Ä¨³	çV\½œáø¶²ž‘d•„œS{}âx‰¦H·¼¨5¬®¶J&vÌ“‘ÒlžÕi¤¶êöC(w´EÿŽÃ+-ðî«Ùë ÁF+³ÉO/‡«uwª
”ÁmNÆ£‘ƒ¡þÃUI±÷ÆÂ{æ6ÜÖFNÔm‰¿Êí2¤žZW®œOäê%#˜´è¾Ø&gÏ3ôE1çyÇ>ÿ)ø)(ü•ÐâŸ‚Œß”]Ïäzî:ÿ)`¦&K·5„
Y4vüAÎåò2ÏìOƒoÁ#[q_ÉXÇÓ¡|BõcH†	jÌ¬aÏÎäÚ%ê¬ï‡NšìFQ»xc4PxI5SÜ‡°„³ÞÈ±¸¥Ë/Dˆ®€ÞØ5¼“š«nZ)ö$õÁ‡Êf]º%bñëŸ~J‰ä¾‹Ê›TVûýLæ~ÂÄÎ}>õy…Ô“]9?óù¾ ˜¶å »|	°ù"X¦?~·~±(f3j)óÙ»tÒ0î&xl˜W0+7¶ÕQ:I
nbÞQšÓ!NÂ­¬‹U·ÝÍwûNÚ¶Ù‘ÑíÒ¥âxG\³¹-}ß‹ÎC't¯bX §P“6¯ˆò€ÉNæü˜ÜnUv˜0‘‡>Åä…?k©ê9¤N­‚ Î¥Õ³êú’D6ˆ§Ü‹	våýb)#êçY¥l(Ÿ‚Ál´“Oa¿F§0ØIP«ºÁÑt3µ 5Å2SœußÉ´n‰UÕ W]&£ÁV½*UüdH!iDBÕjz¦£AäË³åÌÀ¨XkÊð 7NtäÙp­Ô1Ç±Kíñj"Ò¿ðÝEjç‘ƒ³& ‹Hö6µý}æHáõU&awE$¢J(Ùˆ5wËF…ÚÝ¶Ä"©4s³N\îª™¥r©â©qß*myrÈ¯wýTùZ%+¨Â×Š–jPS´Ú® 95ëbqxR¥÷$.73mäZU-R­8˜Uu¨±IQäÓ5>³ï¼qÓa8˜iëÅ×@?ð7±MÔúe+½øÛ®)©@pi±è©1¼öyZ9»åžõõ
\Û¬EF1u Uâþ”;³ñ#~Û®C8b
aÔ±Äæ ÿk-I´¬±QEk
0RÅƒ|B(WðÈÇ}ÿZ¤Û©	Ø¡G— é -\p•ÔÞ5?_9vpBê5/‡kXkKÃNtMJý‚æÇ¤áwä=¨Ýl1UŠÁéL¸·S:½¬‡r–ÚÓ7rß2ÊÔ\^È¥èdDezM‰AeGéoQâæêšŒƒFI.j>1ÑêÔ¸c©¬«ºèvÈ’}~‚†‡‰®o
CC¦7ñº‘v½¢wÿ4oÜé°n+»ízMÓor¡¢•›Lv,?Šì“™°à¾[´Ï7—² p!Ëz]jtý/ÚØDÔ5æ%«1¤py‰ýËÜIÌÂRê–•«j÷.¹Ç’`ÿ>³”º§a»å [{.J,”RlÍZ[#ÅÎÈe¢8–Zv‘Ñ 
¤ÛUcX},¹gˆ¼u¯˜«6¬
Ø“è[ÖoKbÊG ÿ•â-&ëðëjø|³ÿ>¤™P¬ºYå—~Í°Cl½U r Åšh¡&8FÆ—\{ö[?„ŽºòÒ!ù»ì[6¾&'©%äÏ.p›H£q×¯v×qé‹~{ªŒ¶¹ñµs!ÅæÃ;i¶ÌŽÃk%Cë«~Še‘ÞDØbú[uŠÔ	"¤Ë¥º,Ôhñšµ’®É]¹: •Ø9ËAÇ!Ã¯|ŽÃà˜1GÊ’ÅaJ;qs	ß~Å:N‹ô ºí¥•µ ]!2Ke«¬ï®jÞpÂT©Ü¹16e%g1i”‹2Ã"3ñ½çt)N2„E&ª1Ð×…ûÞûÅ‰œ¥nÊR­b­`’Eù‘Ïìaàß /q>»L2H¨ËÍbÁdíS4+?!»9 k€Ìò‘J’ÐºKº¿–Nö½ã‚½¶9f6×1ç»Â¶€Ìèº9ÄŽJ†áU@(Õ|ò)#²H|'¾DïR?ÉBÉûc÷/c.wPeÆª*©ùôP«FU@QU’e^K¸†*ƒˆÍ„ªO¢œ£‹kjŽÒÅ2ÄBÍ ©¨©‘ÀfS?dÌÙ#7ª¼Ài—-í›…É.¡J|« ¡5ÊïV	¦­ä"(Ør™<ç¹#”~Z]Þ·ªL¢¤tñ8èÃ—¹UÔ`IÈŒyrÅ¾Ž“K«¬BÜUõ¿ýõ¿Õ+ÄTuô—É¨7 Vû‡0ë÷B?)ÍÜ ª­²>}é@B3ÿW½™j¿”­¨AE
f)*è—4mÅ·NLÚèØ£d©ƒâ{ŸP÷…e9AH’Þøî¢.úŸœsß­òÑÖÖe!69¼@½m@R”D.o²Ûµiçh(%´ós×Ç	šÁgÀîÖ‡¯»ƒ{[‹ÜÕ±1Ùó+Åóÿü§ÙûIQÄnâ‘ìi‹X-ŠÈE)Çnß‹<<¦èJY+Já~¢„7Mi<I‚eTŠøÈ3Q×,%§tjíF²f7’YAtº'~¬@`ˆ”b¯ /ÉUˆ“ÅIfˆôÝàŽ;dIŸÅö=}4CD?–7L¶w0ÝÎ½HAb€0Ü
Ç©kçyõw	Â!j@>(­Q­Û³aIäT¹ØP¥Œc:Ë¨ åì_©z÷ûöö6ác¡´ù¿"­²é¡8<ñ¿øo+tko©KÚ"ÕqWÞš½VÌÍšWàKZ¢M_õtw&›öÆ»|f¨ôþlE£¸=÷½JNV	Œ)ßg4¶rê¬ËG²»]¯éí¦­œJéâêÈ`ÊÑV’AØQ«¢m°·fc»YR¿ÑzhE5‡«}•Ñn0È¯Jý„QïºÅÍ‰º÷œ¦=¤4øÊ€U_žEÐUmN÷ÈòéíHz‡¯_ï÷NßVÔ•[¡»–ë.•×¹ž°É>t5+;‹@G|î†×ßpºßN4öw®ÄD–»,«!?}Ÿ…ÛI†hâ8¦®ŸD Þ€’DÛ´@2·áO„ÐX$p"8É:~ç*Œ}½: SŸ€Â›†I=ŽGå-¤¶DvÔ˜Ÿ-q|rˆ¾ƒ"‡xA4NeVöC­©LÍÁæê?zƒí¹ü5P÷{‰äN§ßw£t{Žr_->—ÜÑw¢tÃ»Üà³‡ªx²ÛªGzÉ= zàFºí*•/†¿§]³MÜnŠ–…´‹ß“WÝKejªkx‡JceÆÌ–»M7÷;¸ý˜^h+43v{70ÌžÒ‡”³Wx#DC9p7Ž2c?EƒHBYyUslëi¸	•Ìƒ-¨kK­dr5“>€#Øæ0Æ™ghö¹#œÈÙ hlv.‹gsê˜k†·—ÔÚª®I;ŠÝÏØøo	èÂa,´ñÕyEr>:c·ò¿ƒ„ÒV5mú8Ê‚ÑI:tipÔLR]ëÕ*¯\eîú‘ogÚi‡ÿì&Ø´wÇ¯Ùä–†Õ®Õ‹RaDi™l9¯e‚GÅí¤ö7¡ÑÃÔð¶.Å<Èh›qCbåÃ+ÜPi¨©GˆF¡Q…ªnÏ5›\Œ 5Ø[Øî•×îå"}›¢&
ùÎ>LÊãë%â”}"¨¡;ÅÍAFw/»T¶‘sè|49qßEëÏõ¦Z€9žÀ’³”Ä8?žEYÊf\õ3÷ä
U£ñ Škm›Å—Üð¸DJ§ÔB3¶JvÁ<	ÐfQ¹^]W°)òÙñÇ°ï°<¬+n¬íQ¹ÐÂ§Úù†DTºÈÏh*,‡fŽ¯lqHÕùC® œ RÒÊ!	ãëÀ®³LÅTA&¯r«7d­qÏTüVZ¼î=®)ÁúË	ÚŸ.çµË´´²ÅPê%åò’.0Xª‰F¨]l{Î	$PÙçËXe?ñ)-,>6hx×ÐZ©yWQ½
Þ"jƒô¥L?jV°{?gÐª¬Oµ. h#œ`žÐÜ¯d™Q2þ«h§žÀ**íN&ZLËÉhÏ§¯j’
ó}ITQ`>¥açÃ*µJT|{:`²ÒBœ}L¦àìS‡$°‰‘uLû/x9çY†ã"é ºTGÑYZãÈ¢±ÁÜþ/˜Ûÿ±ð”É’øA;e¥W!A“0óëlÑì9 yDcýÓ ª{R=V„tÔã¨¥ý¢w¹µ(¯ó?¤]ÁeŽÚX^)1©ÀxÐŽ‰¤üÉIjæ´xAenÔ)IìŠlþàÀ2v Ø¾KŸ¹ð\ð‘|øzk«såžòÒÜ%ò‚ë½[ÅC¼ávý÷ÚÛuQ’ñ Ö:)ßPÎÛIúÚÅ…ýž¸AZüdyIwÄO}™Ówg¯Z†7é·Í¦ ÜðóÐ‚ë/äw ¬~“U¥NVýnbYeþº…@”H3P±é	ƒZG&Q	2ï¸n°s¡d=Û#~&\$z!$1á0œ^–@–£aópíû.þùí>+±Â¶æ_u)fAexdl){]¹78× ´•qàkY|$’M=JGû\vHÝ¸á§ê8­f!ÍÁË";?ÜÐ„t¥ZÇ~˜·UÔLåéu)±† d/£VUž<ö‘{oÙG'{^ö˜?@!½}&vñ+RiÜ"ssš<{ø¹ËPÚäÕ©âÍœó$ôAù 4D@-CŸÂWÖ<¤ÿ¯8ÅKˆ€òöÁFÅns`nË"€`nçïÿöWs– -_²IõlÒ[2Ë^j5”[5G@Ë$²2s¸\„í¹žÊ ËGÌ¹¥±³V@UtŠM˜›8-hÖºB/,×R¼ä—‹¸­õòÒ<gi Ä¢¦º‰#þG!ÔX»êÌ3M“¤qÖåF¼9¬SãB—ç¥ZWˆë"‚U „¹DÄõ™+˜ÏP„G”Z6¥¬ÇhoïjÜüº…i^µô`ðþ—˜|¨^‚0ÄA.§ÕvfqÿÎ33Û'[®ÇäÁ:4FV'ŽJÁš¯X¦[²¯9ÌJ‹Ãi•N­”7$Sl_xåšÀ¡äëfŒtQ(©¡ì‰Ð4Ïâ3þ¯ð‚Á¶8›@ÃJY&Š Ê¹[7Öß¶URž‹i" î<íåœ·å°h§ß_`>P,	¾Ñèèzl{A¬|«vÏñûcŸzG›¼MX¯{ûD”Äâ§Æ¸+§+CÖ*Aëê ¥˜:ËŒ6%Û«Jæ×’Z	g¾*¼ßö˜—Þþ!U²§)Þ.µa)ÂoÑ_Á¡b´Òs;·µÉ{Gê×8î	$ÎŠc0èYe«)™íØP^KÆtsIàº{”ñ™(3Íl†¨ºî°`L6ÝÃ%9|],XË}œñ'¤®¾8a¯*~¨‰Ö»yd0”lb½\£Bú®V!ðÅ[×ÒX4FÎ|oJcm¬ëŒ]Êx•üþ6¼v+N!Øh4gÑ·‚!ÕÀßÖ#4¤Z{²ÍSjGNöëÈÌ`IUÚÒ‹d6T·]acË¢}XnvÒÆìŠ^ÄRV´`4UkŒTÕ&˜¡ýòD!åMC7°‚ý«‚ø+q]UK•ÊØ¤64!
ô*ì¸Ðâ.ìÎyª˜Jxä}ÏÏæþ’æË¢Ãnk]ý¸.ÝÏñÓv®>&K&œê<[]>¨Z,AUlôBQM€y»)¥ªb|WùaLí8ÉÄ€ÒY¢Vß†\&Ã©J¸qÓ.Ù§µb—Œ¦ÀBøL³¿0ò}~P†þï6Ø5`td}cÏDfÁC6Qh/Ïu\'‘F3®+±l´ÍbU¡£Ïml™™p¼>Ò&/pVÎ
„ßÖÄ²¡°êâàcf´Þƒ›C¦¥¿Ù:AŠtÓ"Vª¾,+	£‹èÙ&æDGµÆ>M¶üàv£‘ë5ï§Ì%‘Çå.+ßHe	Ý‡W£œwÛàrÐÛ\‰"m·ã§Û"ý`c7IoCUêûÑ£B[P+¹SÅ`u²XnªÕ"EA–s¦S–]­ðˆóËÆél‘X[ï‹šü0æ~Ò‹¤€ehý<ŠMLx^&iô?™¨õŠL²˜³ñY‰²²&åykCÅÚY(ãå°Pèµâ–‘¶œ¼Ý=²N%n¬®yÄi9VØz—qí€‘ÂN;GóÜœ¾U¯<Hç/ªR9m"zé— ¤_kúÊ§¤¾î¬Ùk.BØˆ&äBUU=ïR9Ö0G©–êÀ%¶š]XÃs<-‚ ûõC(Ü¨uØÆÑ¦£~D,Z²ˆ4:qº:eô7aöU]¨¢‹ÉY(Š	 Ás×‰CLÉê¡19æ·ÄPóÉ %ïFS,š 8eÅ¦§~ßèu„Áh\ÞEa­"¹„nµ¸Ÿã5%Ê7Dmf½iÐd!Ó¡ƒ}„ØÁÒ©”ÆfƒYð`(XÄõR,'4áBÙÇ€nà® „+È`+0|UÂ²¨ÙXÀ/[Dt˜'†qk³ÐÑl¶Ü	2zÒT'zùZ¶`.Ïë#_Ó›{¢|]¯³u½e½°¥Y=ª2˜’MjxÎg0X5Ãùƒ¢‡ìü&ØM‚ý½Á#'¼ê¾äºEdYñ7æ‘hé¿Ä¥ÿw~èTå?•ý2 €ì3¡ì¿â	õî_ò¯}é’ßf}È Y¦Äyé¿í,Êå}z_øÆùf³©0C¿€Ñ&ãæÒ(PŠ—H,Å¬{ëpÕ%B+óf³³qäy
ÎI‰Œ¦A2>Í‘Ö¼€ã¶KÉvÍ@ÙJ3û™‹,:æƒfSµÂ`*³Bb7Áb7FcOåf¹'G‹ÅÖ&m‹‹H\hUrÿÚ)ò´5tªè·ëŸ,ëh­¤À(ûj–UÃ¶iÆtãç‘'ªDwºð|è]A}zV¨Oú˜fü§ˆâ_Æò?ÈäØs}41lø”³ã4v’áÊlg‡ÎÄú²Í2,`~¾îú¯—ß |TK”r“²ÜÛ¯)`FLED>ŸQÓ,cs;ÿìº‹`˜·ä&èã0€Ñ°<‰£¤Õ„Ìy§®ï¾?<q>»<¥`•y6i°.K4wÝ¡p+Î&"Ç/Ió²ÈÃ
­«Iè7L+8X—%±¼¢£Š×/»¦>â(Êã/¬TB¯°<ÆÐ¤€åé×®
BS'ÝW%*=$|Ë¹"W¶’:ÿ¸|ðÝAo—rEîöÞ½Ù{z¢a\™–5²dSÅ ©Šf~8JœC<rô†.”¤KYbž\é²ŽGþl¯Ï*Åax!2JÒ„ƒ’ÏG’±Öoà²£Ãg±I–&	áôâá6ˆéæJÔŽÓs\•ðBNå e¤T‡ƒUe§xxñà a*‡&²oy§;³j”Zì©emøy–n„ÒVhO8:ovßîížÿIÒL™¨VÇñìq-›0Ío‘ò¦Pbø0¾7.NÐíãã|ê|œTm†ùaÇªY!–Ìç¤%X_XügÜ°o”ÁµK
ù.¢}{ä®ÌÐœrÆSiø mòW"µ(m”ðu…kŽzîºÚF8Ú‚Ç;(0Š|W’lùóór­/I“ýÔèÀÈçÌ)=c$K]a­V¨åî‹K®
7021B‹±­ÖDŒj“‹š9HmÉ8VÁ@ý¶¸›BJî…ƒ²‘#²ìðìƒ¢/çÚuC'FmsÐšÏ_I‰$[yBªÒMêZä„»yéG0ÒQ§ê¢‹;•»ûÖPåâŽ&å²Ç²çÂ$ey j¯8ñ.ÔÏe·6y×Að9ôú¨òG7õv„#hEßƒ›³ûÉ· \ßQ.G}»ÂÐ¦<°„ÕôØÚ˜fÄÜŽðåå"»Ï²˜lôçv²¿hw4-…5”ÂÿjX€d,³N¥‹¨ÒŽ–-3êÓ’qÍþê7oúa:D¤,ýGPJEtƒã£ÔN¨Û³”ÑjµOí¹I?öh/,>
Ë1_}˜‘„ùÐñŒÄÎR,'ÑÄ$Ç_«1IÍH3965§qÃ©«
·™y£¥8	ž›àÆlî0kÍºV›809ÊquŸ¿•5m¹œyEÂÒ¥{ÌN2¦ˆÇ2×:s®
4]¥çî­"¶¤H¾¤Œ[)S†É¦aJÑnïÝ¹ú:…-æa¢aŒ§Î'šÝá
Ì	ˆšXÆ¼6–Vxû¸†H¾-+4gãÓž¥Tþ°ÂPÙÃÎê
)Ñ¼K¡t¥©ê(<øQkò	TtÒúN*çG±‹É_5t±v!DÊÇu¡EŠ‡ÔáµÎP;¡Ì7˜9@UûþdÁJŒ ®àcÄ¡e²7Lhqc©õ\¡jNé¥jª!aEÙ¥wÞ5&e@f´”[ˆšˆR!‚f*4 ³²1Ÿ]xãÓhm’+ˆk9ûJ8ÀSøL—ÙæY±<uñ©ÌŒ$ŒÛ­#ß¥¾ôî‡KDMSÕã‘s	“µd<T4†'uÇ7ÆÔ4£ë†À½‚êC¨«î`c€êüÜ"¿#{Èñ„WíùzÞÌìƒV„­¢ƒÕ7ân‘¼·Õ7ò„8EW«oeévÓ-j|Å
·©ô:D6ÝSoäžPóhûÃÇrËvCûV:°+{˜àsä „Kä®îZf…E³°ÀÐLÚºÝîUñ}÷úGå˜ÚžÅkRÎÎŠ[žâ,?	U¶0ü”
Vº>:šhÚ 3•e×Ä‡Þ—5FWöÜJÝµ…Ô”'{oEKT!&s_­Lj(¤à‘?NÊ^VdêËFP*gDÀ¶KG#Ÿ+¶´5Ú$D’|ÔS¤[àœ?…Ç¹¨,šïñ (ËH©{ìÖIè+"Ø‚%LWÕcH-t‰[A€Ï*¨áÅè±9…7•ˆ®¡||EãÁJæj]Uï»F×i…cnçm˜ïI‘Ä¹2¤~PÅKähæ£ÝM>þYtºìÑ-h–|âÈƒ| ÉSØ¨æÄ³Á¡ÎŸKz¿ªB9šùF˜kDæcÁOiª! ~€›œŠáCäø€«œ7/÷Õ)à_ÔŽ°ª<båùhEP³xØóxØ„ÁVË¢9!†ø¿&ö#…{¬?
±=Ñ!2œ‡Ø‡'àíŒ7Áp·Õ™(Ûu~	ÃìZ3ÇÖr¶HÔJaO¯ºaäfø+gL1S¤àçª››®bÔöYÎ;1÷•Ð½s,=È><{ƒt¸“ýŸ~O†,üåáï1®\¥ˆžWÑ¦~%öf
sIú1®R¹b±Cn×DæL_n¸ÃˆžàÀË>êdCLBÎb«#ÔÕ¤"AB±\,&,ƒVºë9K‚¡›e°eÆ²¶T‚ý­/Õb%jÐÚ§’°ˆ„¡=’jÜ¹yåíâP4ÑH:}€V£8ÝX…Ršç×1ü÷#¦¸Ï]¢À‘áj<Ïál³7ÅÎ	âèì+a;‰Ýìƒ®^úYò<Ý7â\Ê±ÄÌ,/W1²“å–i„#Ÿ"ÝŒÈß¼j8OÝ#Úe¡4ÜÁƒÅi¡9â[mx3­Ó¦(ï_Â»Þ+ÒÃ¸#w‡—È.±ÈÉ ìÕ-²·rzð–a¯w÷öŽ÷OtÈëÕi‘×2ƒÄC¡¥_¾q¢#¯¾ªà(]b‘B¬qß­@¦W»ˆH½€a88Q;á“[2X2ÔtÌ4LƒÏÞÀ¥ðÍ>‚²ŠwGNÏC[:z0Noà¤0ŠÆ)û=¼(Ð7l¡×Žäv‚/G/r/˜”ÄS	ƒ·FhÔ#®©§Ý¾y¨ù‡bÃ ÌÐÁ2Œ ŠBOÀx@
¹ÑR@GdÙ°’j˜D’psç²}KÓüÛÉ
ÚªÀï¤›®dƒWù€'°îÈÍ³H}>ÁôÛÁª'{Sƒ\,Héš}òSO2ùh‹Ì ãÜ£åØM¼¦™ÈiÒ2ëhÝ< Ù¯kæDØ+3˜9´œû˜9iöà`¦€¼F‚½åßö¾l9ì_ì\ƒ™$öÀ{àÜôz¦ÜéS£_Ÿüt“L8¤!žÐêSò¾_Ñn÷Ÿ¼ˆôÂÁ=ã¥¿Äó‹aÇÌ`Òð’~í{xðî±Ìhº%üZ64ž
nê½Œ—c7WŽôÞá»·§Çû'ÔNèY(	õ—÷ï²ú÷ïvà¿<|Da¤U…4€É<°­vCk	™Âh«0ðüf½ýr¬·¢˜RÛgnÄ]Û"'½ö÷Þ½Þ'_“£Ý?iì·kfûmÍã_Ö£7x·³\<yÁ<‡‘u
Íãd^µÍX³ã<$ËFÏñÝ`€QX¶kÝ"êIèÆ¾Ãs’:éXU;šc
`€a7ñ.JIˆ)FÉ ó‹Ây&Šüâ#ø•
”„Ö†ÄP·„b»úapá]ŽcdÐV\Â“WÎéƒP\_O¼Ñ`ðfŠBDÜ.ß]1~6Ùíhj;FQŒáÍ£(C2Nu”ƒåyòÃÁÑÑÁÛïÞÛ=å;ë€f‡Õ ÔL.u;‡:Ã¸Á»Ô^iY$EÖ'M[ÅSÜžEŠÀ1™È—;ªª,¾Ê4ÚY¯ª1XUÂÌj¼U=%P5j«P÷ÊZêì@öÈ<)@¥˜áYÚ›%®¿qâþÐ„Ð½£’½±#ÛO"ßKÛ­NkþÃÊG=¼Gïoä€WÁfö¿ýÏÿAzïNNßì“Ýw§?ü'æ™lž‘ÏžCÞ4Ù¢y)wg$\fã(«óY|Rä–Âÿ——´ÄZ¬Û› 7Õt¹ Ôåi¶¯Ñ7¼ãséö¼¸ïçjÍf]@Š_s'ŠÊlL8ÛØî8†±÷U„”SJ.Iéoö;ž²Q'Y„a¹ $~Å.qû¸Í9be	Î²Ã°M:°%Ò×’ë!„9Ó29Lº•M÷‚ç<U+KHÈ­‚j«W¼Ã4bD]î@Ã+å¸ª¦$¥Jºb³Uì®±¸4r¨QvaS9å–m¾/9 3ß”“4?¹ï]º}»Êb-ø¹²T÷¬÷ÔØ7Ùö½öXA&pŠmVSUÙôÑLeT@`nNÒá,ùåðaàvè¦ÏVQ>Åi²‚3¹I
½Ö1ð&Öœ~8p3Òþ?ã6|ÈïØ5ÐAáÊzN¾¡?`˜Ó@ú¨B+Ípm|‡Å½Ð­i;Ç6÷f+¿}áÀ|±xà ªºè/Rsq‘|;öC4*û
±iè`z#2MÒX™íRNUÊ½ Brà^ÓÑR–EÈÙßÿóÿEOÈpØþJ–=
êÀ}P“Ÿ)ß>ßý3hšíÖO”…Ç4£ø6@¹o1Ç6&*-ù3±
NÏÄïÃøÓ!*¯Š_`œº±K	1Ú‹?í-^.É†ŽG
àZ…CÞ›äªrö¿ýõ¿’ç½ÝãïIïðõëýƒy‰ªÕóŸ‚Ÿ‚3ò;Ýˆ<ÇªZ÷­çÐçµöÀqóvÿ}ëÎ\ZN¯D¡%Ï©V_ƒ®ØT«’~|ÚÂ¦J>mŠé>æz°4 ,Ão½Ä®TfŸ¹¸}PGôìÞ,ðïÿúïy™x)/qeÞÜÝææ‹ Íü¿“ç'û½wÇûÅ5&8¼B%Ÿu‹òïÎfBñ˜çÔÅÍuè%dƒ…×bQLRƒªŽcžOt¯ ÅK™¶æ2=Œª›Y"è0è’Ó¡|"7áøÙ™qùfkå]ŒtjgÃ4’­ÅE'òºÙOÝ~8ZL`|EìöW·n€µ{w|ÐG\A.ów_£ì”ß/¬Ñù;e4¹^J@@Â’ŠA´3Šmúè€¼;~M3eCÕ•ÅˆEB_€ úÔ›àÓDb¨ZŒ³ãŸ	Œ"h0¯Ÿ‘Cx+*5y­ûð¢·¤Ò€J—LlÀñ»)™ÔïsÃRn‹ÇšÜ -P¿”ˆ¤¡ÇnV„ÌÝë†6hPàªiH-=ßq³5*x,JLÐ…pÄ`æä": ö2S
åáï<02mó*S‡Ôé„•Š%G(5Êh^S<TåHý";ßHIy^ÊÒ Ã÷Êé_wªeºÑX1_‡¥Ã’Á‚¹OŸ.è«']c6sššQ„U+m‰§±•Å_]uFÎõÜÎ‰7âis˜›Mê×WMo­Ò’Õ†O76¦üf>As´õ5oß¾ÝÐ…ÿ”¨ßØàeÛ"®J¢º×äŽãì {—œ(-?>”]ÄU›=cà%Î¹ï¶ËÆëÐ§Ì•ÈÓâRÂ±Â•¨N9¶ZfcíÈÂâ®¸Jnz·~Ö¸-&_,ó†‰¿TÄøjnUÖäëÐELx’ìcê£…[î3ëÉd•G#“ób©?_öæ€åÚ±ØpŒfŸ
mu.™Y6~ÎÚoEc]|Ðsæ¦©×¾E÷}êÁ^K¡*[dui$RZo˜w†¢,C£E!¤u|/7jfâ¢K¸¢»i|ƒìB°¦‰C©pàc°´nÐ-#söÀ4`#[Ïz…J¯e¶3# ~ÊÓÚÐ­èG*ë„…ú§%ÄÏ}Øë‡ÌÛ³®¤ÄÚí¤Å¬Ù[ùßÿ·¿RG½p£ ùÃÏšÊãÂí³rÅ”: }-‰''\@Xœ—µñÝH€rƒgÎ
­ÄÃiŠç”+¤ÕçGR¸Á+Ôä.Ë©qƒ¿P_z<*­ñ¬ªéi…—@aÌÕô½ä~.÷u÷CØ3  ˆÜq¤ô¶=ŒsUïÜa´SdlÎ”ãe­÷ŠjÇG¼yo\Ê%;´<³sÉÈ‹ÊZ‹Œ¢HÌý[§(ªœE´‚‚öÂvS}Nˆ]©y¢ J\“T“6<i!7”w‚G¡oÐå›o×°eé5kÆ#áK²PK¶Ib%M¢Ö¯~Kijœsåù§`”ªFÑP5)°Ò}ÕÔßÂŸh„óà£ÁVH»‹shG©†zèwt[š„J•aÜ÷´Bfä‡é‘$4`–Óæ*ìðíà'`â¬ó(-!ÒRÕú$=˜BÍÂŠQéå·Nð)SÑÁ¯%dh4a'µFlR5$ÃÜNº—"vÒGÚêÒÆ+óyq+K‚ÃH`„aŒ©Æ§ã=©¼ÞuÞõ
Al¶Œ#;ÍdßášVbÉ !*_	Z™dw±Ë2.yl.n
:]râä½S±qä=)†õ¹G6¡Tª1¡PªÓ¿bêÝÑÁ£Èó{›ËTP \ò‡cLÁ±÷Eˆ›97[IBßøë$}šè	IZ¡§'JØ;6g¡ÞHzT‹ye…Öýž{î¥<_Ð…Ë^â,7((qß\øÓ,VspÖJ
¾òqdK£ŸÔÆéÅÊU´ÏÅ˜ß‰¥qöî¹/À¿ïY³`†ÃnÖKYÄ%—õÒê5†G®XèÜwÝ ú­š>U0ôNË’çpSyù¢D™KÄ,®¦P§‹AÍ]•ÈS$¡ï¨×ûQù¥ö.Ù™{]Ñ+™¢c×Æ"rÙ°\7_è„ïˆP$mFoé`Ut·¹-’I]¾6ýAú!·eÓ¸©;âïÿúïÐXØÝâD-Gj/¡A¸G0ÿÑ>¤É7?“ž¢|•XS•@£íÉ*HÚõÚÞýÓ¼Á)Oì°ŽÊÞáÿE¼Z½ÿ  ÿÿì}[WI¶æûüŠ(ºº$Nƒ@\˜¼0ØUœö…cpÕéññ*'R‚²-)u2S5ÍZ½æá<Ïš™—™·9ÿbþNý’Ù;.™‘qK/U]¹ºË(/‘‘;vìë·ÏÅ¬Ðpuz­Jc¬úcÉzo:¼.jsÃë.ñE‰‘{Í)Ñ—ÒXñOA¤Æ0ÁÆërã€° PRqœŽ£¬`‘­«RNˆ0¦þ€¹‰&7ÂM>L¯Êf~ä¡h¸2JÇphA(Ó¦±-ï,·TóºŽNN3¼µ”¾çáíš„>˜±ŠŽÌ›×°´#á@ªv¥÷Úæp$SáùX€2IJ¡¹A5™
à{²árS’ì©Y&8 ÷•ó„‚ß"¼vî9Íåt{R&$(~!Ô‚„öázœ„¤ÜÅd{‡8ØâÂ½ûb£DÑ&
ñ©iÑò,¸¾êºš"K Ža²˜C]Z,jØ&
Š²€(„F_Â?;ìsñ=•·)½uBjjº7˜òòæwñEÅ=¬?÷`³âZsQQÅD2×ÕjÞÏÒÑÕa(ÕÝ²®+dðeí¸ƒ¢ˆúCî(eIpTý6'™¾¡¦zÁ†Q“¼¬ÞöÖïß9.xÞd+‹3â©.×°¨^0ÔJ@âÑç±Ž/¢›A•Åc¸ÁâAÝÁZÂv1Ëúç–°:GîØm¥ Mìüé9°ö‹8/~r'€t¦ƒGƒ½;ÛºdK]OŽžV„‰IB7m‘cÄëýYït{Ë²ÜCž?öô¥1g -Þ;º	61pG|‹x&k€¸)<Ý7íGéÕ„V”ã¸îôûùId ›ËøjÝ¸×•fAÊl
Í#þj[ÅÒþúÖÎÆrò££àÞ0éÅ­ÐÈk)w8J", D~0z.îÌe±ÖÆ"|¶w\Vf1Z–ÎhJöîžs…ePÆ ÍdQÅºªÐº¥}šûÆÒOKòzJÁøX‚9é4ü 5£†¥ã£bb‹·¾W5˜*ŸÇ1'¹6ž•\/&dh«…ß°Lj:‰;¾žÏ¸7\w«Pûé
\å†I1³ÔDgdòÚ8:™ÙœSŠ¼Ã…‘Rös”0 šªUóª¶8O+ðr9#Õ˜ºÂïaÉ¨h!³ÕŠ,û¶6JÜovGÚï®Í,ÀŠüú§¢.ó¡DÅŒlLv@!ñÙÏ÷ïau~‹	@Uåãd4¢ïvZHüo®s]–ØOÅÅ®#XÙ}½-Š\ÑS¢óTf¸€÷­=²rËY™-íÿùåëW„§uòDÎE·Ò1ÆÞ®…oÊœÍ/cÆô­/³¯$þ, 8~ë+—t:Œ²˜í®e.©ÏÕ³Hï&.º÷û]D7õ`Œ¢…wÚàüeþÊKáy"Ë×©)EU’GX¶+øF©2™XÀˆá2!tþlìyzíÍÌðsspá®,µJÞL¯öPMD—³‚ÌÉoÖâcŽ~º—ÄÏÿçÿbv_Šƒ„kØI½î0~zw?‚ÜèRÃ
NÎSàÄ"F®H^D’Kfå{L&×„îš²]¬n£»OÄr2OËxn
ˆ™gÚ2û¤kˆ/·å~¹W²É^ÒÆÒ‰x†þ»Jº‰CÉÙÙ;ùx‡â|â¿sSŒK=¶Ý$ùQ©T«£ºeGµ–Ô–b©âècQ§ªŸÿã¿“¬ ™ÎrJ5"3-St¶•å6œU—hOf£Ñ§š™Í-Å¼Šõ‘¾ÕÁñðdwë£Î Þ£I?‘oÈ“ëDOÔµÌÙí1®´]²ñ±VšiŸdY%,k—y»c-†mËˆT²ÿxþB4`T3þ( Eù¬Ä.£Ò!éÚ°íŸY\Ì²‰éšiCµp“? 7©7aØ’U2ÞRÉø‘Œ›”ŽW¼
÷ÁTLXÂ~r}¦:é?ÿÇÿf1JùµOL£_Õ±8:E–ŒÛËM(3ŸÆ}LŠ3íº'úÓú*×í¸CÕ+÷¾T6[Õ±ØÚ¸ïíW Ÿò\°úlÈéòu~Í³æ•ZXÚ9Óæ+@BàÔÛd°ôúF­ Üh¡õÔäêŸ÷IJõ÷ôŠ¢LÓ—‰¶Ñä¡ÑINŽŸdz$Ãµ)Ín)ö=§´ž¹Ù:¸Šà›'—J’!Ëáåé~N‡F«r¬±2oô"h¤–5m•<ä[Eù)ý âv…¼Ñ,Ë+BXà×Š¿™]m…$ù/O¢d€çéSÇôO%†OÈ€Ê+„Jw*§‹Ö]1¤ôÜK~s½dÒ
Nz¿Îñ^CEújŠ?N+‚1JgØÎ·R±Lú‰ù“3> ô¢~²´6ð?chEEà?ÅËMáo Ã£†‡Sf#"{d–ÇÏãqÚ–÷OºIß½Ì·‚Â;ãõô?¬Aj‰:@[Ò#dÐ)Ò×¨œÂV$ 'Ù9Ç‘L‹ž“çHÔ´Ž°;Q‡#»Ói??hQ0Båš@EÉlÚR^'b¾N¬ãë„+F{•ã¿ˆ>…ß%ÀYkÀ§¦XùT4Ç×oFÅgÑymhiÃ»ãzNúÆGÚ8¹ŸãJ“?z‡¼yË?bm¥Xð|“>éÏáîQŸ$é4ÄV!|([»ÊX•¥½BKÜ“Ÿë€&7ëÇív>ÃòWÄA$è7Ò¤­OÎ„O€ ÐÅð‹ê?FY<ý9ÆÇõ7|Ð€‚" ³á7œ±½œQð·2ó³õ¶“Lú£Ù ÎÛ)ŸsE‚ãë
º:Ü"}&?ñÓUyf½”µ®š`W€Í®/×ÇîUü!žÌbd¤MÇíóª“i‡§-ŸÊë>£åHtÈÃØç¿Ä³(ŸS8Ce™	ééê*’NK«„Ÿ•9Ç4Ka`ŒòŠV¨½Ã¬ywq¬_”ŠÚmã×ôç$ØeÑÆþª–êìes2…:Í@dIž2J/aýâldqt8Œ²BfSÐ]F²Ï£é*G°~ws
9¼[zŒöá{nnÿ¨=Eûåˆ?%$ôåIÔ¶£i!Ó+kzý!´Cé»d'À€a°R¼=Å8¤#xþ,©j²Å¶§¶óH_›ëêSø=§EFX£øë8¬Ã('†cõùóÕ£#þ„2boø“ot×r…Ò,ëÚ¥fÄÖZ©_t9‰«ôÝÇYÑ	ö'ÊÂeÊDs8‹hK´T/¤‡6L	Iàâƒ?Â?û 9À¿««ËÚŒCÿ; óÐSôKþ‘mRllQ¨8>})ð¬Eõ‡³Öò›õ·ê¬{äbZÄGl$ðÉV<Y}}
|è†ŒAŸ‚`’S†œ	z¿€A¾ê·$˜«r„:ÓY>lW¼Gx‡öp¥<Gß^ýncm~Ëy©îœR&ßÑf·v§è×m¹‚™GIì¶c&I,^K{íAyy‡D“ù›·Ò´«ŒÍ²Ô´Vô1I;äôa•6¶úõ[j·ïª/EUÇ½]¤KI1‚kïJ±†ËuÀ'þ}ç…Ô
ì}¸ó ÇBAp#R%{›€?¡0ÌßŠ'‹~¼Už§Rü]¶Bè—:2ŽŸáTîÈ2Vu=/æØÑ–†[©Vl©¹ÈZú.&&Ç•ÚÔ#òîëåTóQðqT&_¬´Ôv³øƒ¥Q
þÜ64|XîÊrC­ýP‚Ã1tÑ[9Æz+ÅaNou:«„Ï¯oÊ1¼%Y:6’]ûë6$·Ë‹ØK,'[KÔ¨ßz|¯èdÉäŽ«Úr.ö~©ê_\³>g¢Ã¶µþšÆ6óQæqÎbˆéO×øk>…­e‡ «õrá³@ Ã÷X3Äýf/¢vO·ÛÑ
9§Âùy§ìw‡‚5ÅH¶ z·£êÊ²x;ŠðšÕ¥Ú¹Ø[^áfegá÷¥-yT.y×<8„:’çq”mwØ«…9`2“H*Û(ƒ†ByKûl{<±ŒF»kÃžÖ¸±Xh:×êöè-¸…ýÍÜßÏ£	&|ƒ=Ân’!¥ØÔuä¬šƒ¿–8Á!c»¥±t“K{ö¢`r·B)}KeB-cµ•r.ºß¤éÜŠ‚.^k`ùž§çÉ(¦©H;¤·ú´Ò‘½PDçjèB-pa°ÃsÜÌ•­ð%¬ÕîhI	(z“åëù¼^/uŠ/Ú ˜ÝU^w ‘±gÐ±vët6G þ|(âÞÒöâ¸»æo‘A8 q ®ûô¼Â#§õµ5¥­ÕÞ.
gšÀL#éÃ¹ÙŠêùF³¿^kŠ˜Á´e`z®l =G¾9)ô ;)h ª–§¸†0RÃ?xeTUÞLúµPTžåÍ¾ÓœTá?
ù}ìI5šÊÝ=cöFš·žMÎÂ_1ËCI-Æê¸}õ‹'è3RÞû‰Y7AËçôhÓŠ÷Èéì|•2ñv:ÍÉÕ˜¿ô£x7Ûg©Â›“$ç‘iñ@¯²xÓ¾Ûô-ûË³-E©! •cƒ}™—«bçÊ=ø"ÄÇõ¼![€D@DÓÙœQ8ýýå¢å¢Œœª£/H¾z¥ümQQ²Ý>Ã!›¹—Í™òBR*³sÌ	¡ë·ÕÑ¨ê^àÊÖÑ6\z†µ÷½ÒIå!úµÒIõ…at¢Öý”RY)Ú7&Ûÿç¢áüÕŠøÀ0:)mŸ‡H„‘h¤îz
$SºvMÑîŽâü}‘NF
Ý²Avªs¯d°ãÑÁp»|P!\Ó\cÕb` f%7Ñ°B57pu¢5%ìƒºYR¡l˜‰Qéìvñ´‘.µ˜àyOb§JÊõÕ4¨5¡“‰œÜX6'VEÊ¨FÝÅØ%©&Lï‹¥»õåRÎáH*1f£šòËŒjŠ–YóÎ˜%V 9y<Nè$4^¾ƒTn"=¼Å³TLÑµQP(Ír¥Æñ?áÊqÈ–¿†•ã,«•Sx•N|¦µcˆFµ-¡ò?çR‚Øä²Gµ2ï÷²ˆŒ"÷g\DV±ûW±†¬2wµ„JA[»?ÏâùWµ<©uÝðÏú¬ËFŠál	¿fWÆûY/õ#x¹Tg4mÃ%âjÙE!.KÚ&h0ÿ2ƒåÅ”²¤ŸSŒ0ÝwToï2KÿƒØd9Òúx§úÙ#£Kéç&ÓdêÖ=ª=2±)ï±«j™Æ»i‚:®cM#0b7Ð»ˆÞW¯ÞYÖe÷,c^Ä×SQºiÓìdC÷ÄçUQ5Œ0gÙ®¥j#ÿœžçÁÀ¥Úê“æe›ÌJ³÷ÈàëR…eé{á]Ô‰yc¥¥ãèºÝ]±…Ž–ñ9ëË·¿ÁJjÂ½j<ùÅS	ˆBÇ”ýºgÚœ^±D/ão“ïiÖ‹ºqÒ7…õ×t]RµÛú:8€m#5nÚÆÔu=˜–Ìò²ÖQxæ/éù¯q-Hqe5ø=®‡ZYŒ/oYð,
ÂÂ|>ÂŠ@`'=_£`–‚—_°àåè:ÏÆO)Šu:9Âúžùé‘Ûå;ì U˜S}Ýœ°¸&,sJhMa2….þ©^Äù©Æüû¤wÉHõ¥‘:W(@M¢S^æ¦cøúë°è	0·¿ÿ8ôk	f›òüÁÆƒF¢Ù=INÕjÐÎ‰HÀl¬[(ÊÄF 2!—Ké‘Å—VÀ
 ;7ôX4eAWnÔ&ÜPC@Šöü1ŽßoâÌÁ$ÍÐèv×†–W@u2&}HG³qLÒ2Îsš-Å“†$°’‰ˆú¤N+
ZŸÿÞV=µ	¹Üh«ozÛt°2åæñ}çS lP™aä¢dý‚å^÷–`š¿D†ô+ø/Ë8•)`˜¡íÝ”i1·°e—Édïæˆ)æ—­Œå½àŸ£øþ‚?ÎSÐíÇð'¹µJÚÄ¹¦1Ë¢ì»,P,p
cŸflÂ—Èuwoi}‰ÌÙ?×=öþñ`³æè¾L/.ò†a†ObË{K¿Û¼Ø|o±s/žÀÞÍz§»uë†˜T}Øêz×Õ*"nÊ#à€,sä.[Eœ'Ñä;ä3y‘¥ïã£Ö{–Eó½¥²±„Eƒ¤ñ½ŠŠËoƒž_t/¶.º*'ÿëÁu’SBùSíÑ¬¨¥ª‡›ÑÆùö]È§eÉkxÛ{„*)_BN®œ°¿ðÏô…w~Ál’ÀT½¿t}ÛYšŽŠdê¨ /¥y«óQŒ‹âÕ%å·;¤õ»õ‹î·½¨µÂÙí+˜Çˆn­îƒéuy3ÑÒ	æÓRêÆç...Z.4@:Æå;ñÃäÉg-t 5µ±}>¸Øv´fÿxäŒo~¯æùŠ¯Â	eNœ	·ß_.Ks_‘=žø‘²¡›Þ-…H,—A—ýÞ[še£öï¤¾l™Ýµ’C™ù¬ÞIre8|47ù$‰KÛ¡¿ˆÙ]EÜZ9;â¸½Ä}ÓõŸÓsñµÏ“kÛ~¶›%˜ð{>£’ì¦‘Hâ»J³÷"£Í¸_Z¶Å }rUðÉîÂOaÜ/njéà5§Žjeî†!©D«oõ"EcB^É<.)¯~[>4„m]QÕ-Ž=É
owÀ R~¡fZ’ÑhçLR»ÄÉ3N¶ö†ÊeX¾Ádã‘ÞÐ]?¸Ýmðá]©^P÷ƒÈl}sãb+n¡¶ÄñV€ˆ\£oðºCF\ '¸vÿ$˜\×-sï-Éd"6©½›ë®¦³¢ºuÛyë4 Úu0¹ÄíjËuk¹¹Ð¯¶wÕ%‰y	°9A5'†SŽñm`IÙ|&”ïe?Züîa<1´øw˜S¹úõ}ôößOohƒÚO!rûî¬zO"’]ŽXss–ÀÝÚRY¯Æ¥U*ŒÎsÐóYNÙl{†»,a»ÅO×{ï,9h{‡«6N€ù¼î§Ö¡TÜY´Œ1ÐŠ·,VµÆö§‘¬÷e¦° ÂiZŸÎPŽVüíéÎ~Ñ¥š¨ám"O†’ÒBs)š4Ïî«~ê¯g–$¬wš*÷òZUáån³dq(ÿ6Kê,‰‚eþ)±ô÷°‚LÑ0‹5õž´¡+pr–ŒcZ àYzéµFß£å¸©æ‰fãM‹k§ç$«Ýï)¨Õ¼ö:™—r/Œ¹ªbžôð²ôh2 eÐ9Œ\m*êj±n5ÐQøU“"iT"ù(`LÏ¡NH4Ì,¾„¡Ad7.èç•bkÃ$g¡c04+¢¶í}“¢(€J¾ÉTr½ä4³,ôÚØQ>Á!ÓNP‰îÓË'Q²bÅðÿuxÙë§ÒºJ¨ ËKsJ8d(ëºywO£7Rsö9Š~~M?˜¢™¢óäA…ÛÐ¢Çbér9.]uUÒE3­>Ð—£pMAÄåsZ$;o­ç,ÈaØ-V»Ä_I²ñÎæö7}Å„$^¶UU¤”ùÄÂý`¸év(xE}ý­YŸ¿œƒÇx4Ï¤­• Dæ•ëÕÊëé£ƒ0@îÊJöê ÚXÐjDjÐ¬Ü=óÏ£)Öõ‘‹RÞWŠ<äÒ­ß±H“šnæÑzð­ŽA£žÐYº×A=Øƒ_ÍþêèÖ·ê(ÛU<´´)>¨¼ÝòŠIz0p²›Êî1fÉˆLB‘èlC*Å½i–2MR‚q®›ßa×neºO›ðÖ¸EØCØò	V›¤z 55º Í·åË„ÚdŽ7™IPg·l2fÆ)Å,Ç©6Ð:ÛÆÆ˜ár2Íý•7bø©Û™–³‡¿:·Ì/Ž¿ <×-Ÿëšº“*ðy-ƒ½†ÓºÉ3XgÓÕ4ÆåXU¤Ú@eÌ [&,!k†d°Kp½ÏÁ*Mò2GÖïjBC`5B‘Õ‰1‚9ùßcI2ƒûÌ.»oØÃx‚•xþQ¦¨"ÞÎ!¬¼É ÊÄþºY¯:^¹=Z¼¹ˆ¬ÔÆ·å¸"àBÖVÉ·ùóßÿsñ¶Ê®P¼ÒE-öi`K?pTÇ5,˜¯ÁDh²¡ ¶Jo$ÔÆ0Íh«÷Ó q¸-JF	öýÓa:ù$`úz¢Ó`w¾ÓH0XÆŒ‘ÊÒÉ¥¥¡ji
9„>öˆ–1F°¦ÖëIé)_#“9CCná¸Ñ†÷@{TÚKµˆÐ( ªGôÒ7z”ý·*žcE/h´±Z!_)GÖÁm©ÀÍ7¤	o¨±»j®«±è(š³Ö>ÎJu¡Âò[ï>lU‘E‡­ìþq†L$™ÚÌ”A+<XÂß|Ä,ƒâ.,ì¯f	auÛ»2jÓA
)qUÖ¤–Õ‚Å
P±Ã6þ|1‹ß=È²ôêàã3²íÆíUyæ‰JÍ«Y)T€"WÑ©òš±à”Rþ©V~ÊTJGCÖJ@©úòJ=%EÁ†\ÑÓðEiª·´5ë0—åSXv­yRÖi’ñ 8„»¸ÖŠ‚[(%ˆ¡oÿŠ¾*àÇƒ¼3Œòv‚`ð4
"éäé,ësûmU¼7TõšÀX¦j;mº}C:NÂ¿æx°C‹C‘ˆßb&ÅßØ‰Ûe¥B½ûG½ç¼Ö›¿žOjÚ©Ö=g•d8Ï¤XŽUU›ú5©"SIf®O§Xû·œf—ë²F#ñ¥oàIuâV°1Ã°(58xzŠhE4¨ŒJ¢|‚¹N2¿%¬Õ=o«ô?kkä;´V”­3²$çs"@Ú©o	»Ž’^	ŠÞýx^Ö±ÛS»YV+Šúýz³‚“o?žž‰FX~k…\Å-`£Ñ‡¸z=–d'ˆ5=ŒiR=ýT¸½ñ8¥OÏ°*-£¤l„Jžpóñ‘ðñ:*üZ­uøúôlµ…%‰è‹’AÓ%° ÛAÑ^_&¿'[JqYZy>íMÕÌÛe¢JuýCæ§ã"îà îpcYÛèæªVtGÔÏÃq~óv_ Èâ¿oßÿ}äwÚ{Iœ’×6õ]‚x§‰iåã´$Ò”‰¥_F•tàR^¡¾aŽþ—c¾—¾È3â¸±Tveå¶•ÅÖáxM÷VÀÊØ=ÉxIUE˜Ã“˜B›\Ä¹ZîÚCèùr}¬&PÕ¿ØXLVýHn]je`q4ƒàU|‘ÅùððJ‚Óù¤œê<›fsï ëŸÒêz4Ç…·èv×˜ÀI´˜Ù–`²CZ,>°üˆ*ÐYÝßÊPçÖÉ9Õ
ÂMùLçæ¤H;+0Ÿp†žÚZ¯ÔV5_‰¥XuAÞ/µPW¶öúÒx-½_ @8:ÀJÜ!78”Y@Õ—ç®ó>žçmmc[ÖºEåì×Ó£ôj¢un:Ë@ÕÖzÇO:»w” s.ÐOÎ°ÀVÕ¯²XÝçy¹ yŸ¯„#½ŸÔò£õPBû«zX*âZyD3¾Ú4 \±}é™šÛöháÈ¾]…¬Ò6&…â©‡(QìRÍ;s_I±f/Œ)*„;a¾¾¡#s~y+þäñÜM<0¶Ýr<>»ñ¬aÐ3ókÐï djµyÚ‚âQe(bÓxÚ†¨Gc˜\ž2uÞ:€rIñÞVY2RÁÒ&RDMÈsW9Q³ÀM‚›h¼ä¨ä_fñ,”÷¦×ÙÊâñÛ€ÅUF}1(`o.;†&xË´/ëM’jÖŒ!ä›„¨îJl^
rE&‚´ M‡aAƒ l‚¥¥kÚíÎü7äq”õ‡Æ„	ÌôÂ-Òéjw­GXŒ¯9=¡»¬`yåË¬nm3Ó±4TltÉvË&d’ËÞï9³+t:Ö‡d¢aÞ4»›¸zÚN:+0Ü–U|`§Pý¢1¬å
¹h­·N®V7·ÍF¼&94f¸N	.ÐmþDbƒÅ“­ 1BMk%¦D3C¨,$PdÇq/ã²EMkØÆ	Üˆñ‹FÌY9ÐÒ>Êœ„×†ß]+†_P×@™nÒ¿°~RƒÝÖ)–gþ…uê Ïðöl‚+Æô8|Â²´v‹ót ÇÃò‡~¬Î	ÿÃ™oƒAÙòäCÓåìˆâ,¨`œ‚ ²w£z—Å ‹hwOmÍ´šÓù¨Ù¥–¦îhML¡å›Øæ¶Ò]þ×s9ÂyCŠ-JMèDÌ”Z¤Â&j“)ÛôÄé®nk§$—;¨z75˜#7tæ«"cgê³*ãW³D­©Æ(ªðä<>Î9HRu2Ò«úÕŠŸ°ÅÏÙÛQ"é*©¸Iœ¿ÆMè¬–ãÅëè#åí(,g6c¤éG y/Ižõ÷¤Ó·†~ÈþI©Á^öA*¹r=Z‚…­'‹³“t”`¶ù$]§–xVÀ1¶-kœÎ¼€rdÝ$^¿ÿËÝax¦h\6(è
pâyßáÀ.ã‘ñt:™Æ6I¯²hª«M<dd4J¦y’óò¤oº[Ø0È$G;¤\_a#æ¿É{‹‹½Ðë÷³&½Aš[n]ß3lÜ¸«Y¿dÀ<_+:9ÐuÜ^_!Û¼v5B+­iÿ}ËMÃŸmk8ã¹ìÑ=W.¢Tfy†’Á#«V»0€L×«¦+Hä[ëº×B×ÁÌå•ÄáÌ…bÇÔ÷N‘¾Fâqñž	ugÏ|²•¡J:îÄYg³bxKN¥]>˜?™¡ÅÝªË‡º“> ¥…½Ï£‘›Þ5+à.Lqâ‹h6*~@«%ß(–oóÂ#<Í²½›vl-¶f j#ÿÈ™FY?¥QÑ2²Ë˜PuØêõ9'0œ/Úð”À†1Š@ús¥W[{2k’ ›ÆØkÊaQ†d:˜ÒsúÃ>FŸËÄ#`þá=Y[#¯ig´#ºy˜ü=I„wæÉHmÁÍæqA…ãö4‹?à|ã¿Uh	çP6É?¸¤6¹â(n87·À
“åàgs28g¸] ž	/‹>„DÓ¤ÃæGŸ1>º›Ú Õá·0·xÜŸiÖn=L¡å…5B?Q|Uk…ÀmM¾(di…ßr—sO…`Z–öÝ·«ÐæCÅáz¶K´Êå‘ðs™DÉ@Fµ8ý—I?©PPùG¸]DY– qü‚Ê…¶MVÈ×¿y)žŒ.“­d¶,ƒvï[Ùicî`?Í§“Ãa4¹ŒËL“—5–Îx¥«)‰¨$öÚ*$·ô´ïk–o:¥™l¤–xÂÒ>ÿcw]oÜÐÁUzúä²ŠªÃˆ \8Kûåµ±”|‰1zÍÂ†Ó¿ä¤}b™o%dü]†GŠ¯f0,Ì"\¼¿†áC/é¿w[ŒÝIÇTú¹p£ÇrÆL8 Ã—/Ü\Õ±´_þÚl?”Ãyïs‡ÔW‡\®aKu2ÛC~Ž×,Í¢TÛ­ÿ’0<Jm<Ð¢Ôº~~jô £2/®P5ÿ /Ò+õÃ5 ßu'áÀnÎ®å”§M‡vÐ]br¯Rh€ƒÕZ@Ž!#ßÏÎ9aŸ9¨B¯l
©¨¢è–Xþš6Ø¡A>`c9¬˜o“"^·´O#ãañèÁð4Hv"ÂŒ<n/kÁ<W¶"w”Úx\"‚€&±54ÑéÄkŠFe#qºÏd _šË‡Æt÷¬ÙT¢¶Ve°¹ÀÚžE‘ô9Þþí›·,»¦-…ó¯Té4%$ßªz\õœ®> &H«7='ÇP0­ø"ê-ju—ò ¡šbçÝmT@[5Žì‰«ø‹³\ŠÒ-¥Ü‚>'=àÝý:vs¨	A½;D&­}¾¡¯‹Ú\A™Êb(K÷°ô%*p	‡¸û²'A¢û yÓ!i
üVW’-‡À
¡wÈ…0ÓÐ1&nñ¬1@3­P'¦o©j3P „€b
`Ê6´(>iÄmf'rÂ›n×j¾{à!ÑM‚W« •Þ[WðK½á$’kš´ŸÄûK³¼Ë;ã^v4ðÅ@Ëê[k­j†U‚®ÎÐ”XNçQ&GI»¤m2“Aî®$ÕšìÒ—´üùªÒ*+_7•½ËÀZŒ¨]g5•àß©$uRweLâ!¶Æ-Æ,Sz%vÜ¨«oú+íBõÂgÑ<&!Úÿ¾É£°´–ëBì›ÖA·züAþwƒþwÿû˜žLÏ?¦çÓó‡ôü!=HÏn¶X>Ê_Ñ„ja+;Á»^åSŒwÉÿ}†pj‚Ÿ¬©*K)ïðÊj0Fk¬¿?Ëò¤²”%Ù¹¢ AF²÷mªAEòŽV+bCÓÈ¸ÎN‚P°¶þA>`t¬j³ã…µòÀ¸¦8"´ ˆ{°ù{ò²5Y¥&kö6QÖìlÉ…EQyøƒ¹Ý7Ð•·"«éÖqDép³DeDp™&ìªkórErú.V£0V ´‚œÙŽa2ªœ»Ó>,³ÇQÖOXµ‹åÌ±„ƒ*i®Ên$jö£¹xHÕúwñ?'.“gËW<MFñ´¥¼¤LÔUï‹¸ë›9yóò-‡Ñ¨?ƒÁM3å=–ZÙÞ·<¹ž¦Y¡¤ò;U^á(Aì}ÍiŒ’uWßòLIµÇ›[BNÓ”oS#;X ÛæéŒì!CB#;,iìˆ!¿Q`ÌÀjG«.¿QQë+“qÍâ¼µ¾¶˜þ½é	Ãuà[SŒj-1Dû–÷(
Õ¹Úí*=¦^¤ÙØñµ+M‘çÆ§ô˜Qî,¤ÛŒ}ÿ( ~!¥>déDåy ÚÍFÌn¦‚Ñ:Jæ9p{ê4zÛ@F÷m’Ï$\®åã/°Q€ôÚ“åÕSÐÇ·»ÍWZ9TÖ¬—ö_Äñ€ãÑ”\%Å$‚Õ!tÈ(Eøý¤Ÿ?"´¶Q¿  3g–ŸnXcŠ”íÀuS„2%ƒl ÿ‚ˆSùâa59l‘ae5‚2â@x°ª•Ÿ54(Šg"ã-Ó©ÐU€¥@ÌY@¹#æ‰)wÙ™(­ÌÓ,$ëÉ¼ä%bW‹t5#pëê Ž§Tê R‰¹½\í’é*¾Œ½Q*o°´VçMz~´Ñ¬y{'Ñ‡ä¾å,m·°8GÍïjMä6 eIA‘¥¶ÈUé=ê(þÄWä hÒ zÖÓ6ƒ:ê´èËò®'ŽÜÐ‘àÕÖó*¢|ƒ9x…t`B?Êhh¡6ˆ¨BŠV„îÞ;ñÍ7ZÖ)
<oEÓöƒ
´‰×Á,ûñ¨Jñ¤@¹ëo#ë±D?5ÛâàsšCl©ˆ#ÿy÷€!…ŸdqŽé”¦}ó¦wÕ97Ô9ž¹À0_‘Íí‰ ¹ 1—´ šã_'Eó×™,V«4	œÐ`øm9ä
6Ê!óFý%¹¸ˆ¯WÓ#ÈLà=tKóÀÔTùÊ2ÎÉ¢§X	šá"Vóiþ|˜!FüC/¬(2÷”\O`Ìvƒ2¡«\b,§+Õ9f7Kó
ÀÉ`Æ”qVuË“f£0ï¼Uw©dêª¶ÚW,Òòp«I–XYì¤|exaßÜ
qcÛÝfKû?ÿ·ÿW6:Í`¿¸%?ÿý?IyŽ›ü	†7qp[ämÙkd¬`kîh0X‡£ø{¤™Guœ‰>qMeîÔyh¿_“;¢ÝÑÚ7öø4œ›eŸ\±ß,‚òÕñv<@'©ºŸþtÜN×fu;ýi¯/Ãì ?ðè¾yõdí’í·+B¶Ýž°¬\’)eãZ¶ïv@´[ùÖµ®%ÞÍªFŸŒf¹anÕJn°†BMª>à òg-Êç±iÐTÓ1£:È3eõJ±¢ 2ûƒ1»ÜR»¨C`ÔËãè’þ¶î“òB$*®!b³Öj|Z×¥F—r1Ãä4ú×™r˜ö_Süµy? Ô¡«å0!Lu~Vg­W•ÏŽ»æ;äG
C:Å¾Ç¸x‹!†Aée\QüIIŽ§Ðâš^ŽÒóhDÇ‘þJÓ¡µ}À°ÛTa³‡Åz$¼v
•èsqJ‹_BÔF'|±öÃbdx=I.’x€ÙÀ˜ó8ÄvªdØ¿É(Æ’!bmáÅ9/×t…‰gSJ7˜9†Ui®¥yÎ¬mìíÃh2ÅHvªiƒçû	-çk™«c‚±f u0û?´€šéE©Û‰ó¨3²´MÖ®îTJŸaÛeÛ¬ÜiÛªÔ‡*ïý®VVû P4w÷\dÑe2’^ù”¨îH&RØ_Ðï©î;–OWw‡²÷yuß+v¢ºc
z5¨Í1C·©n<QÎKïg{}ù^üù:ñë°/#Ñ .-î`”ÛG‡Òp¶[-Ó%ž·g¾(†­Ý5]å#Ö¾ˆF¹ñµÊPi¯x}8²3¾’–ðQ´\c"_æÿàJég)bN‰XÏQ‚ØÛ,	m0¨–:. :–z¸œY¤Q^tòY3WÚï–¾¾‘Iõv	[dÙŒsÆË«þJtb€ o¨åZ•¸ü”,ÎÎÇIÁscð–‹d`'ì¼“$øh¬Ì›ÎŠv»æ\RV_ÅŽPÿ¨“Ó×OŠ­Y°àÎã!°nêãÊÇiZ¢!Pñ2ÂÈÕ{Ì`;+OÔÒfŽßÖp&¾ª>í·¬ó«Ãt:?`j|‹c©³«èë„;Þ}}óãÁ«'ß¿|}úä§ƒ££WONO™võo“ƒ¢˜ Lƒˆ!«àÕpÕô`^dq\X.¢<£c~F/ý5™ÚÚC[B6‡«gè¥4ÝÂJÿ¼ÃÆ÷à4ë ‘ö<²Aç*ZÇÁhKS´:[©‹Q„1&lºÊ&¿KKŸŸœU8à…!ö=;Ê+tråvDÕ,%g¤,D¯ÂÏGžæ¨ý2¼9è`Y”¦y«ò=ËÊg'9òž'ãi1‡æL\C0 GMë/X‹ ù.R>YÚJ8>ÛŽÔ.D”kôŽ=2‰³¬€DÎçxë‹øŠú#´xÄÐÃ¯4š©‚ývè¡è}?¾¡Þ!ý…ÊLòò“,Z˜Oe9uÆý@‰?ÞìJ/YdXª—à'”•÷3Â¦,eBy@Ë²ùl,•e€_eížŽ¾€å²®¯Ý³ÇGæ–éŠånŒ«Jî\oXŸ@öÕÝD¢V›+9‘M)v«ªw÷åããgOÈËÏþL~8~ò#yúò9zõò„¼|ú”œþéà»'¤]2óe­­=ìpó-·Ú¯^Dƒ4œºoûyzbØQ–N_^\<m½fz0ly{Æ}°ö$¥7mÈýærüÞÿ£~ˆÅ œ±›ª¿ë÷	Œ½ñ—ñž²¨½¯üU¿W*Ñƒ_Zþ¨ß)`0önÄ_†ïœ&X`6©_©ôà½›êoC$©hO•‘Lßy¨Ü®°·ÎVLÕþÔ™šü¯¼Ãö”®LUïgœoª3œ´¿kÕËø	ç»Ê‡êçìoRÔ•ê}Êiç[µlWì=àÚNõn~ÂùÖò¡ú9û›T¥³z¡zÞù^½	ë%ÇˆsýMl~Æ=Îåc†“ú“š×–mûìàä™öýñqÎ¾‘3ŽnXgï§`QXmmJG“	è¨Ù¾r(Ç9åà60êiJÍ¥å0
º5Å¬ÌZ”Õù	¡	
W«0ÖþS†:o©.:4xùûšþ>Í2¬Ò°´o¶²»MÃnhýƒÖW\&wVhšˆåödBAZl	Du[i-ü<ê¿ ¥¬ÒÑ¨ÕT,2”<°Qeƒ¬)„N|Íw£ô<Vü$ä;f`	¬ä'ókŒÃa•4•uÚ:R¥oiPâ(êŽAdî=v‘YÜÍA™üûi~òÁd~5ù˜G8­ìÂ
³€r/*ÎXEÌßøëÓÞnÇ<Hzi*qÁV¡jCC!Žš#‚ã6ë	~€Ä¼$KÞ‡(g&œÈŒ¥XúÈpv.\‡x…À`$sVüê"Í ™{œ™â˜Kb4·|¼É5m£Ûå+›èËÛ‚ÍkãÇóezé¦Z©ÉÑcó’.çÖ
UÔ‡“ãè¯?ŽàûŸŽ’é{fU³øiÅ§×UË Èc«ä»4äUÛ§hßÿD6Zl–%q–ûºGZ{vEƒ	zwaë¬Þr8¢
‡(oFËÈú^p2Š&±ÔôUrQ`ñ<œxV‰‰7~”dˆ‹%‚ƒ4ÍZf¸5S#"ê-Iž¶?¶eØiêñaâ-ÃªkÀ–¶çnîRµ6Qó·å ìs‘*1GÚ¦)TÉÌxÃö²4U[!$›„1NÖ­LÜÎÃù –­z± q÷ÞíêãàAe<,<q›Ólq“ç7äUŒq×,©&uÕ; —ÍéÚëæõ]©¶fëºèþiOIwG†ãßpˆìµÞsS¤ˆÉíEpb<ÂÎÝÒÐè‡qHQ+CèC­ŒŸ'?~÷y4=I¼Õ¯Ø½Îœi(ƒ)UÁú­>‚Jp#	–Óˆ¾¦zkŽ$_€ƒ2$VF
ÒÇ%a9_ê¸)Ù;ß¡\e	É'æh%KDLˆŠ¨(tOþ’Ù¬™¨ù²ìX6%j“ˆ š©œÎ¡G>hÑï54ƒjkT–±°C†I1¢@|Ó¹ 1ÛÍŽ,+ú¸·Ü“;#‰^·¨d®J>pûž©¯Eiðíúlÿ]Š­˜LQe'Ø,Y#ÇG¾šõn¸S\mP²JŒ6_çû}(îÎ)rNÃGšˆSêÛ­¸£sÌz—3ÏêM¾[‰–Ï6^‡I1_£±Gkÿ,?þxq»Ý¿nq¯ßµŽ—à?9Ó8d¡ÍEã!ç1‹³ÿnÞTj¤A)„+tRò·]§7u×µño‚Þî1Ö‚¯~å-…gQ`”ûzgË¡¹™e)Ý£SöÁÖ-IˆÝI–’³dºÃIä`tÍs’Lú£Ù fØñi»Ú°ì´Áe.DsÖÒãY2ÂÎ¯Î0Q†PÛÈxÑ‡4‘‹›ƒ’?‚.­:ÄfØ!ª±ÓL©õv¸S<é§cì‡@üGÐ‰êÐCwV‰*ùÏ¥2ðA–âæ¿tµH¦Þû{×‹N²$êxKtŽZ‘HÁ&/"Ú‡<ÍVõ]Ô£ ’óÄ¶'\X÷»Ôôºã…”:pÃ£y«GqÞÏ’)+pH_äèˆ·¶L@QX<Ð €pÞÚ­*>¿®€Iz*{ºäJ2y9º®Ô´;—²uMSª£ž­ž“¬ÈWÈ³h
ú$–¹u4ÅqÿÝa
ÕQƒü×Cµ:4ö¶| ´ÛXY„ø?ù‹ú§¢'aU&¾p’&ŒFOöY+n”r2}òá¢Rµpzõ¦ëU¨ohiŸýµ¯5!JKûâ¯…šy>A?ZÚgÿ.ÔÄÁ_’>þ»Ðã/æï#è ýg±‘H²¼8Ìæ0ü¯ÅF"Žó!|ûw¡&^bÖÕÒ>ý'¤í„†f—ÏË®ènMÃoHûõ«gäå”¬-‡p°€¢p[÷ÏéÜœMÙ¾‡E1ÍwÖÖ<ûtÚÃ§äÃÅ	Ë”š<Ð=»¨±ÀbáÿÕmõ"Š*êÉhÔQ2ÂÂ¿-žrñ¤\Öd	2×S9îäwÍV’;bS>œËIIûkêK#pàBÎ^3‰É™ç¢LaÒÀòDZö³)EòyT;ãèºÝ]©EJ“UÒµ#e‹Cñ\nhÁ(J‚t-(ÅÙ²{ÐµLB ÊûÃ
ô•{mTêµÎ¢`t$D2"‘HVæ>¾"H°Ç§«‡‹”$bæºðMÆ½phÿ DûÅÒlZGy{ ÉÞÅ1ÔÌ<!Cäª¬‹î®¯×6_³G¤œ3eÅÕ¤Â‘*N¯{Ÿ=$.—ýÂû”›e›²š—‹}
õ†ŸDsju}‘	ÚTšºÐä09Öì·ðêq·ÃOrŒ·œò¡å›`ò-Ï9%ç1\ÄðšxÎê¥ÆeƒVä2·ã^ñ¯'Ó(#ãhNâkØ§DãNtîHž)P~Ú<8t<c¨Ó]Qá¬*÷Xm,o5ÕE§E"QqËÃVLâr6,Ë<§$ŽúC^8Á='†“¬ÀíhÎ
Ò^8?E9Æ@‚ÙÂd:œçIŸÞš•µò`¬ió¬nºØªyõÅÇsn{xXÃh§ƒ!›Pƒ$Gg°wóU˜Y…‰¸¶‡¬6ü0XZ]ùÚUýZî§{é=¢èáæâ¦Ž,¦–ûM2Nyéæ®Ds^b’øyéU<hY›»}g|5Éž?
Ú$yba¨¬tæÚ‹}®`ËéÚùÒ?¼±CNgãq”ÍÉ7ä)ÇÖ0:†ÃÜÂÂÛØpï¦ÒaDo^ÍZ„qj/œöqÒ¦BwvIKáN§4Íq8L²þ(îýB¼Òè•¦°0Þ»[ú0\$Ù˜Ê}Ü°˜h€BˆPÜï?J·&\¯>(É+°.™H9kz¸”ºöÂ·oŒÐQ¿/AÀ¯š@*îRp‚Û’³ÁÈÑfb^†+jß
mFk`j¸¦ÞeVmÍCxÍšÞ¦Ñ †í¨Cð¢Å¡Z ²kûQK…Â”Yú>þ1CÐN®× }®dUpuÇ\k´ž+•-)jî;chKå{ÓÛBQ˜¹arŽ·²=xa"+s±Ìfdá'Èe0¿Y‚³à©g°ì•Ü,QíjŸ½ÈgÓ,šë‘ôsÃëPW`™sæJ8cÝò#u³cDKŸ9o‘ ½+dí• D[vHÐÞ wÙ€@—JqÄP7¼ø1ÕB0€þº©ÎL½|,G_/!×÷¿/d«€JDyø&v0kÞ†RyCÍÔ .À%(U­µVÁ§º‘-›ÏYl·fÎ¡„™~C¢yÝY¦f!S50†‹—’!Éê"¶7¤ÒšzðUC½ß¶[û¬q½z”Ã­Ó°Ö›c¦ë‡OkV7[·H]µî[6Uƒ5ògÕ$Z‡`Ž¸sL}FÒL8ój­}4¶õš¹XCz°6ÈÌ=”™×¥
5Û­¹la¥
XØqP©ø–üK1ùgÕªzû*>ª½BFí=ž«ëîQÐ4L^O'îDÐ'ûÿÜàaõ®¾ª#
Öí=ôÁ#L#+vLß÷Æ9ŒÏ”P÷4w—a‡·js¸#Kš2cö„ª–‚¤NÿÎ¹ÚeÕB†ù Q‰7G7ËÅA,`e°›ªLH=ƒ™‡ñfÍÄCÑSHöx2xäÝMªžÄw”¬.Í´C!à1!{Zf `¡¹ófp|9
/ßË“	ˆc“b4G”xêgŠF.Eø	0Dà.¥í(ŸOú¤Žgl8y	Jù£bN•Š\Uø–Á›¦²›Òá¾*ð
Ûˆ¿Ž¯ÅYizüåc¡ô6„Ž‡ÒétPûÄS;{õ6àé’¸oÒK}Õï8•xíºSZ¾5¸â*³¦~%ãùW%V¯õ@¨oóØ¡¨ÐŒ´„¹ì#EBM(íªÒú­”Ð\‰-<tÜÁ?„•ÿ-ì‚ûÔ*XÞ±CÞð¿ßzFÒÐëãöš	ê!LF6»‘è*J
Íì0ï(Ä©ž6{ùŠ@”h´¡¨èIôšMæ]f›Žâ<˜fíwO£dÄà­YÇØô}}ÃºtK¹t¹tÞ­x¬3òfØSÿMÞ[<78/»Í<ª Ö]GImË_’CÛê*×ŒVŸ'¤<(Ëãex»¼:ØÃ-‡Ã½WžÂ–ªh¤•ƒï”§Û¹¶2¦Ä"fOSU·°²?¾b¦x¢ú¥ëí2q3Ð¤ðP­Bó×7ûiÉ H-ôDËgz­Û*)ÖTfùÆˆ¯m¶Ÿ8Ü²2~e¨_¶¡Ÿ„ÿÝ4Å·*ÌgTƒ6°WÙíãuGˆlŽäðÑÓÙ(%ŸN<ë«þO“d,ù?*ôªWñ Î“Ë	z+N²ôÒSdÅ>Ü*ãˆ^ÄXï¦‹îx"í–FXÇ,IýC<J§èmÝ{€Â¯ˆâÉâŸ%@H´6ÀÂéêúée<¿ÚÍ¯¤á‡ß?9zýì	99>üÓë²J^¾€ˆKûôå«ç±öàÙ3rôä‡ãÃ'§–äwÏ„20qÖG#–¸8ärèkÚ»ÑÏØ÷¢R”7œ´·À
‰ `q†Ä7êoç›O´Gk§|o}"jç	ìlãé€>Ô²]qµ5¢î|öØuÕÏ9ûrjlÂp:´X¨FïžkÐÑ„á´½¦û‰{OGi‘ïÝNúæ÷(.@NÌ)Ê¼~&`VåÇ'}og[mõwÀK”ø“€§XË´üºxýðþúÛ÷&Ž°$ÞåE@+[/ÔÏøçVÏ„ºµ«	,OÍ Ô€é¬£Yú!ÄÒ½Ï`åd´’®é‚»7¶Æì×|cSU8„'X¢¦#Ã¥€±26èºêhs˜Zš3_pókcÖkîžQm^@\«â¸êí££Y÷ö–‡Q^>ÈKw(USêÞlÍ+j,±Y1¾êYGônp1qÈ¢„*XØŸÑ°xœ¦èŒy…—êoûs¡%<Ä!p¯_aFœ}égØSaô´'é)ÿÓGIN1º¤§ËS¾¥ÿC<Lú£X–—¤SK]iÀtÖ+8a,Å%ü"$±‡Ôß¾7NcŒÏ?žäE6£U6ËÈp) Æ]WmF‚–ÏRàâ¬NIý¤›u1žé	¿õ,=:—û"¶µâÖ'­ºÌÑ“Ó?a½Zjãèøôàñ³'Gäøyzð¨1/Ÿ’Óãß=“Õ—:S€7£(×µ°o¾©i2ä+¸aËîµ¨hìÃ¾#4@ˆÚ®WI1,•[ªòªh¶¯áßc3KÎ(™½
y›ývÙVÀSs•ôf›z_ÿºº±^™ÿ¦4Jéƒs!åhFY_¯nc‰Šm‡cþñíÑÊ”«cê¦Œ–ø8!ì†à"Œiíj)ïró0ƒÍ_’‹ˆ4ÃtÐº³*PÞs·ž#y/l›Ûw	eu¼ÄPpÃd½‘J¹kÑB ù$NÜÖêì­Æ`VWìºÃ\3:ÐÕ½…&J¾÷îÅ*;¤­×­¤n6SÝÂel£*Ó]VvÕ&ùNƒ.Å£ºY¯†E{keq¹e¯ÀY z<; £ä}Ìdµ1h…r…·§³Ñ€ô±ÞB=4%;ã¾ç`]‹ëÙYÉºŽ'ƒ¤ÅFC˜XØâìÙãjõÍ&c¶1WK…¼Dr˜yð*
PPá×^¶Bz¨'U­àsôÜFõ×KƒÛ¬cIAOmUOÎm©˜AÊ¢ù
I×žæªlèhmÓ§lµ«qy›{óÂCö' ¿íh 4Ò`Æê2P¦àLÐÃÃÂ`³/¬˜ƒ–¦$‡‚êéF°Ây-#{—qS¨Þ¦\†aWî«/,YvKÏ´ç âaÏÄÃò©ƒÝ¼c‘^5 [ìœæq©4¢Ï”Ôwj§f-îëí©c®fÙ¸FýÖä!“XŸ¬Æ‹kô=ájN1ÁÖ<S?kgnL[°]·oÎaé%aåbäètû¤—9e5
	íiš}‚½¥ÌfåaÄrYþBqÝ\ÆÜ(~Œ¹æ…ÎØ›‡czÍÃê»ä­b&1KÚ07Eå)ÂëÒ¾˜™Üvç«Z›¡B`ç¢ÉœË— ’«hÂÐ ¢KŠf“–â -YGåÏ!ˆÙ÷ˆÎR(Ãõœ?¨=XJ‹XÄö€¥h7‚àˆà¥áñ91Ó¨ÒîC32¡ŸaÑP†ÐHŽPn]!§ ’Ä¹l†ÐÀì¸?€`vx³”üÔ_=?É,¢H1GÚï/Càÿho‘u ÎÖ/°»G©"qh¤ës­‹ÃE¼¬Å€½î…Œæ7`³°£1B;>?NïG0Z;>f;î¹…n½­žÇrAùD.¤?Krw
óýA¬Ù­!hbÝáñ%´‹]ê¶Yý©Ýf¡ZÍ½sJÔ½FBlïõ¢¿4Î¡½y¶|Èªš7ÉÙÕùI¾¼´©Åãð!æÅ‹L ¦!Ã]÷W`€iw½N˜wÊ…KR=ŒFñde
ÇðCHœÏi!Ýç©µÕD
«\Tã½õÍ¬=P*ôÖ‚_ÚÔ|:Zì,*ôó…3NêdÈ·ÜW‚â?ærPkÃþ
çÂ¡Õ­]p­L šô1G Ù¬;@ê¡-†È(uóS®‡€„]w¦îb‰º()=O ë—ÆJ>¥,÷|ÃìbZ+·ƒ$šû»º–
cº‡ž(«çn4Èý'“Õ!¼%„$ðXºÌX%E/ÀLúÆÚ–_Q¢	6]Ñüþj@	Ì¦–¶MA»b‹þ*H.´¥‹à€2–ƒ Z×«Ñ¬H¸ÎŸÑüÊ,³Xõ:ÇÔ•xÐav\PK©y–sÑ©ÏüûÂWÀÆrk.ˆƒEôˆ‚|”üW?÷ºŽãTÀß@u0,œéÞµ©;ú'ôh¤ñ¹Ó¿Bõ©-5‚eƒDËg­”Q1š5Áil¢¥÷iñËé¾ÜD;XbùÕ^ /I;.-€¯X¾¶Ž³Øí}LœÅòÅZBßvdÃ²:¡§*Và<.< $`
ü@R¶ÃbÏŽEúø{CqúØ€ÖÇfßõé­ûðöØaíƒ‡ícG#ÆèPÐ¬Nd
Zç·ÄiwÅ(v¶öYõEÚ!P-Li¤O†)Žâ«ƒ;4Ü²«o& S#m+ø=n0ÿæ! ê¡c•Í`•æäç¿ÿ'¿Â`ýoÉûËÐþ†)¿æ%üÆ0ï;îŽaÉ­dˆ²²¨å±ôsˆ0Aš#XòÇ‚p,Ù!€Zìðyüü›¨+ä×_º¡Ñ¥p„Þ{¡r ¡JSçú÷Ÿþ½{ÀöÐ“,Îiq´9 {¦WY »C~Ä˜mtS8&e1ÇAÄ.PÓ9´süy×mè”Hpw_ÂÃ®k½,.†,,~Ä×Iaxßªï…§À§E8'âo¸Ô”G«Î(¶r.—¨aµ3Šz‡ˆæ^uÎ;{ïŠŸÛ6WÉ±§¸T¥ª—n#qhÙ`OÄ=ø$µ˜¥ý Žñ©ü–>¹A‰-$ë­Ïðan"\‘åÏ»$KS–‘Å1‘-í38m‹§á‚§·n¬"¿ÙH¹p&§Ôn%É`‡´ž€H4Dsf i­¤¬p3·1mèqt©†c8²D,¯x†ÁHkOgì³,®Þñ8½¾kÛÏ“kQ	Ci7ÎïÚòQÚŸQüªÝ§˜ƒ
$¢5Ø2K‰¡ë5È^ ±K3I1ø1®•ãûµrqÀÞ5Š¿GY·GÝßYï­9î®a6¥µ³h*µµÞy¸Ý¬‘zÙH*§Í?3P·`‡$&×¨õ˜/‡ÕM
`ágDÝ Î=$rL>TP!*ÙñïSÉªãË2	ÑSƒÖ¶;ì›õŸÖê@üSvyµ{›WºÝ­•^oe½ÓÝZ~y&;e¯*Ž‚æ§0•Ú¥aÞ™&¾(5ùWùu8f*ÌZí…òÁl‡Çƒ½%¤ÐUìÂê%Ð_ˆ¾+¦jÉVßêºdš¶nÔšñ<ŒêCófìJAC†ç§UF,K—Jó×Õ W>øÖÐwA¸znõãxBl¹xTÒRA¬‰ö¹åælc_ l¨¡úÃ¨EóÍÌo¿,Á÷`:ÍÒkºàD– ("·é~d`­’¿r’z4—Ÿaby1Œ&d‹¼¿lU9Îµƒ8ïË²á
ÉÇ(L£¬àg
$KGå2¹((À¹$?j
foAÉtÃ¡{ëjW•“¼›§E„Á‘ˆN8ÐAfÈùæ:fÝ¥˜CV›V—¢ïÚÓç¬z0ŒŸÞÝúÞçïãèÃãæ/S¼;Cád6zOF³ËK;ÚåñlT$ÓQ, ä¥N+p½äóŸR8ÿÐP2gÙ3ì]MvÛ/_¢o&›@ŸÚ8˜aèØõv4œËæm5úvUñØ2,ó)º´, a×9xÙ&nÐî> [ðBŠˆ4èTÂýðy‘-³"ò›bž¨Ï£‡|`]ùM	9~ªHr¬ðÈ(Ùqë¼Lä÷)9JgÜ^ýh]Ç“ CîÂÅJã›1»p!gFYéObóôÏÄn(FzaÄ±šM°.®òÕ:ÂÛÀa0¶@‹Tƒ¡bu–8›–2Ä@ëœhè“QèI>‹Fœ&³ˆ‡æ¤i$‘- _¨Üçý1>³NÕãþ6íðm»ñÖ[ß|7Ö«˜¨&{j ŽMý¸×C,>†âk4 ’Ì›±i<±êE¬6ÁÆ	qà:K
ÄàÎ~Ú\–P8ã;òö»˜¸¶',µàÈRíM°A`Îö¨‘™Éò~"ÍõprËvhD_zqÓ77œî_¾EÝ7°š"„?Ðë›¨{»EòÇýšßi¤SÊ^ómƒ:‘»Ç“‹TÄùSc¤ƒÒÝX‡hÀäŸÓÙÏÿßTêÇ¸²"2Í’~Lb®“óøí3ravòóßÿ™¤dÍÑò%*”†m—}m3j\;Ò·<±™4*´æQu¼Ä`-Ve$¹øîx°Bª\š<WŠ¨_0”$e#^Ãž`YÇ§q…°O–€3H°Æa_[šƒƒÙ7|H}7bÃr Ã—Ò‚;CECI•v/Ð¾¨ðbæ,p\2ì.‰H+$¶]/ï2
Ä¹¿¨ÓCèy2Á/KË¤4²{eéÕ+º5d'MÂQ=þhU{‚WÙÃ°HÐÞ8(íUÌªƒÆÍ#!{÷	éœÃß"!‹„kçK„l©ò™ã M,â·ÐGùùXÜ9â{ŒãÁXš+-ÎüQ”îYUé¼`YÑX`“#õŸGº4âp°¡ôuõašs3ß«Z; {d_Ñ¦Ph”î"^ü6EÅ ½z­4†,Zo<øÆµ5r|zFhõašB=ðã°|LÃ/¹Œh	‹¢Á—4÷ç±F&é•<®¼o¼*wÑÇÒ«t{]ùiK'þšNâ— ŽÂ¥" A¬¯7zQ³lRõ_	¯Ø -­C“[-o}jé¸mN4Å:PÕ˜7ª²ìýi‘agÚb§HO_ÂXÝíåN>%E»uÖZ~³RÓ™Mhï€°ÊÇ9£»CØsZ<‰R}y¡]¢9=9B}KNž“5Ò}¸ØøëñãO°Ui‘]yXþö7R­lº¥‹X›LÂ÷ !æ@Mû{Ð›3|#'¹&&ÈÝÆÑ<¡üäfÖÅ
¤±Ûf-Ôã{ëe%VÛ¬qÙO=è¥óETÇ5AŠ6Šý5¨yÝæ–z‰2‘–ÈSÜ4á0¶±æµV³%ý0þõž”{Ó<õ^4ûúñ‰]ðÍœðÍÜð$_üãÒþÍ xñ³Ýrœá KnÅ“Õ×§­r"nü~Ž×™7+ZävùÖ]Ú7zLŽíÈ÷ø]äøì1Ü;¼ãG‡Û7ÄÌÑo¿cø—¨PáðÇdÚèt„ZºT>®…Š†ôA5`¬:}öòì´sÝkçtÿ©öýº`¾Ì ™QP¡·¹áþ™™ðÇ'“ûqsýMî·ŸQîÿÇTF1ö‚éÑ(o°@•hôiYÀ_nD¨eGŠlÖ ·$†~Ûº£*Í:ÄfiªÇóhºC^Å}€vs:9+„¡ëïC›	 ­‡?ÿýv»äàyk‡<ö¦Ïv»ø0¨eðl·Ûôaxvƒ?»ÑðÙxv‹?»ÕðÙ-xö[þì·Ÿýž}ÈŸ}ØàÑK_L4Õ{QÑ„)å“þ7‡­
£ÚZ¶ÞŒ^$8"ïü"õäPÈãêUäûW)—ÇNÝA3¦îÒéõj/H–Ó\ÐsÓqí:®‰©z	ÅçúMc£wÚ<Á*[“ ;$Û˜7ºá#JtõzŸ"xCö×±Xµ´Å  Ž­ZLÇýEm„/¤A«øÉ1ä1¬–@ªl²0>'½l||zyÓ{ûË÷	'9ä‡Ãâß%â§!…Ö
øxÁAehÐF‰$?à%xl!Aæ€ W@PP8P_ìñ¸q^%æU|a§à2vhÃN‹F-7´XÔÐ‚1CŸ*bˆ‡	¬Ž‹ÕÞ¦m¨Äy¯¡C÷8ô‹ÒŠÔM÷÷¾·q¼(÷‹I
ÀKYxsp¡§»âÚ‡;‹Î	SNÒ¬¤==¯.!Ë;S¥¼¹7ÙMËÚrx‚ºÑ‰ÏŒ@»Å˜kË#§×Ü»TzÜ ´^S6!Ô/"úõÝ©ö%¬öÿ¿¦UN7äóõ%Ú©ø§ÖßRtK)è.¥Ù=‹Ga]Ê$H·#¶r!Ð´ŸféØ×Täï“Óë â'¿¢•?é›r¿¥ç±J¸½Ž²…”Ô{–Þv}[„! ôA`mÇ7ojZŠ"´ dSÌ†åìoÕÞ#ýúôÇt}?Å,”¥ÁMŸ#²CíB¯ó8£éõ&¼öR¤ ¬õK8§Ÿ3§'Ôï[Z@—¬ÍŽF%ÎÙa®=é²pÓªÐª ¬†–)öD•$¯qâZ^ç8‡B)"ý„²mš“†UBÛàe¥ÙR«‡ÎSaé“²•¦5ÑÙ˜ntæ„ò¶/—œ‘’XuîOÈtÃü‚Œ öÝã¥ý?<ì61æ/ÆF¿ñ¥¸üúê ¹L€¨Òód´_ ”ÊÆÑõ3Z¨
6õ…¹IÓÐ(è/Ù#*×éd1ŠöÚ¿­]®V«ALz¾¡Qtkwt×—+&G‡o¸o;õ'ça¨»ðÉÊ%ŸŒA&­j½²É;1IÐG“Ñç•š0DÆc@†øëd‡6!‰Žd”ÂÚT˜#%À°µm—™h#‹M÷U«ùÎpá&5åÁ+ª¡Þa^L¿Ôe¤,¢ïû•¼HWÈãY2ÐèÁÓ"‹ã‚ê­!í)ˆóîNNÛ!zû:âmµo:ŽÒú
aÍïh2BH<Gh"ó]†¨ôÐŽ/X…9LŠyÕ¥ñþÖÀðëZ‘ÚšÄ^`ïK¹wÝÂKù‰›/¼ûÛÞ¾èU‚Uí™û>Á2ùÿ   ÿÿì}ërÛÈ’æ«”µ=MjZ¤HJòEÇ–W–ä¶Îø¢c©»Ï9^G"!mà %µFóc"66v7bfþíDLÄþÚGØy~GØÌ¬PU¨
e»û˜ÝA P—¬¼Uæ—¿ÍmB3}ƒ}’¤Îi®sÊ(hÿËN±«yû/A]}Ù,c³àdïÀdß`¿üÌnq·@ëŸv¯üÊ¦Ã™?¼íOA7>"ù4°œðe^ì{¿k(ƒ¸ïIÕœ›ÛFÛÓK–à´žCDÏç•<9.àãÆF’X+y©nf)lîXet5<‹c˜<‡tCÎÕ÷¬°(h¾Ñ[¥à¥*ò·ÂZã½R,e5	4¡	zò*ÃÀyÁh7©ØX
Q¦íqtá(‰‚0ïƒßáäÒI£Î,ŽNœ=þÊU§Õ=¹–ÐKõã¥m™/Bç¯×ÝÈ2tfQ@¾7oˆ&ÒÓŽÝÃÙÀD(£H_Šø ç—0‡åÆŠ= ^¹(’óòq:	ŸF±u¹ìI1‹¿'Aÿ
 S}¶y)±EÇã?œ–Ž}Yˆt0e“Kh9I£	´)ú9ßabYz™NKæxÆ’`œšœsô”
+Æáø0?~,:…!V)¬
áûËtRrþ9¢Ã…Ñé)\…ñj+Ì
K`l×uÕõ¬Ó]êº¨%7.än-®ž71wDª¾âßC,2…0mqôÔ&Eå+‡tQÌjîë¼z¿Nð;AÛX}`JÏ%:ÕÁEukèZnÄð‘Ý‹yëHóÖ¡ùÂ+ïÓhæÂZëù>ŸœïË0Ê9ÛÏæºga÷ùCN]Êx½ -÷‡7—Þãvžœìð.È'Ê¢Wn§½¨e™;ßÎw<8æØÙ3Îçâiä%i7˜žDí¥?Eg°Ù¦ùFCF&o6"š.ûÁoi`Õu:TÕ¹»äŠ¾ìp—Ãq¸‹™¦ÉÔú=á,^ï—©¹©8Ýg£hÚJÙ{„+ÑgýÒOØ½“\pÔ²-û©6~“^QÂÎß±ó‘sÚ˜êýžÂ{›!è»åÂ¬•àêÝ´YÛ»VDZ^kGázÎU7*ª8(ÐóÉôìÔY­YØNvÔ_š Æ×ßèpª{3ž`/‡Iï ¥ñ%ksåÁ—+„ÂžRå»ÜƒqKs,‚0áð±Ÿ–ãTÜ«a|`Ô¾€A*Î2Wõ
Î‰À}’ØWç,ó€¼+=ðg5¹3ÃÚ#îÕéÇ‘D9Ý!§wT»ûHjVrÍJWW˜xÛ|.Zü¸Ã7\í¼úîåÑëý½CÂW6+Ç
ôq“„pZ†×Ù¯·®°Œÿµš„óÁD$Jv&|›q
éø°°0'­Òá%È°³¼àËÒS‹HsãCPI?ÄÑt7:ŸÎµ…u¹Qý—z?Cza0ÌP±¸Š ]6öÃYÂÎ’¢ÈM&AYŒ×äÕ¥p²Øÿøç®5m¿Yo­SSó([‹J·1µÝìT‘Z¸MIûšW5Š›¦Þ˜†ÖX¢~òêB£h{üÌ‘ŠƒŸßfœ)ÿ(‡A9MÑ ›dåàÇ*Å±µ&™:ø¹‘ Ï^8¿$oPRö–äÂ¯„ûPZÁ'`?<×èWÈ{Ü³}ðó—Çz2'Àx!ìgÖ$?7â=ô¶_-ã¹9·+ƒú8ì‰Ò>²·áS%ÛÐËò¥æI7øùír%3Oâ©7í(s_-À³á»'áàçF,‰Þ5?KrFXûËâ1LŒfŒæÓ üš÷§M<ypå\Ú¶=óâ”j÷b¥á¹²‡å}*ò³žÃ@û7GpØ¬òçÝ³MRráe™3ÈÔögfç(ÇÍrƒ¨os‰ã†ŠßÞ>×vº¾‹8XpÎÂÏÍNæÎ%ÂÏ¢…ï¯jÇ5Í3¢Î}ÙrÞrrðcÝsr‘ðs£Mwƒ¼$üüÅíº?ï°UvÁ…féJÔµ/{n{× Ši¼°A"~¬›îç`†-}¤m'Þöùl¼ß ­)¢i¾„ÐÔ}~m^ª/A5ÆÏ— šòý_‚jn~ãÃÚNÞ8-¥²®—½:›á*	~”6ƒ/¿1ö­SäMƒB+îØÓü3WQSA–Sì¿ÈÝo£pÓÞ¹IÁ÷+Ÿý¬®2*ÊÌ¾÷Â`Äõ,~að\1°aw9µ91w
ÈZöwÇîHH•Òw[Êðº“Œ÷c°_ù:häMsp| ¸Ý:}TH1Ó3
‘cÿoÏÌCÔ€ìO?%ÙŒÍâhèû˜+ÐuÇ¯äu—­Ãç\šãóÎ#Œ9ßœÐjñÊ£l»“4ýo˜†—Ð*#àÒäSŽº±ÿÖ¸â¯¼<•{”ËRÉü`îÒT®,³NYq‰©ýuÊu{½”/â]ù|ïÖÏ_„øu—:7ÞUøùì9õg<ew,Y²î3&mSØ¶DÖ¥°JËorƒåm#•Š,¿	s“"ÞÎÛJ–èB¥E´eÌdgKû”£À~ð–šà´7¡W:p§IxFîS[´%Z:ŠvÛL¹7öë_TXË§©
ûšrÀ>íµj­Ü
Ú~¬«ÁZ[u}3›&J›;Ž"<žiX†uýÆeXóºªÖbŸ_êª.¢®ê—Rª¯”*aÄìñ0ô¿‚‚ª6ðéë¨Ð"î;É³4Ð¹«cf³f¯§š¿Ï-è³&œt Aò"LÎ'ÜÎ‡NÖœëæôK[û¸Ó¨Ëo7¾‘ aÄ96Fò5k‹+ßûã ¶]\v~qÃX¥O3—Â°=£ô6ft
Ûw¾¶ùq«?6\Zî¦øøí0Å“þvËŸv¾;l­°+ŒûýÈ!×JÆQœÂµ	¼g,}ç¿‚©éÇÁ°Å®—¯™—²+õUGÁÄ¿þm­ÙOØ»½@©Ã¬ýÍƒ>SÊ{ÝíË½–ÔAPDdK•aïƒâìv`9»lôVî§ëM–ô–6¢Z©¸Á».r^ùw’Â„jà âòco­6ËÃã¸IZo©Š_)7Ž‘¬¬£_GôðÆoÜŸŽÏ}Zl3wªÿ´Äf«.ÜˆÞn§ÎƒVj¾ßˆYC6˜R„˜Y•Çšõ³¬‰}	; Ó¶(\-‡«ë«X–÷³¯oúýbÎIgµ@Ú54×Ð! ˆdÂÊhz›ÍLƒZšù3õ|äžÆG`FoÂIð“‘aÄ,ž‹ñìûÜ‹ý1Õ•0¨t8vƒ¨+>öÈ<tT÷5€  (ÎáØv²(¼Šx@±:M2åñ#~{#>ã$5ÿ‘…Žqs¸ÐY¬pËå„ñ]JzâbšTE^9£{¦8óõ¡iˆjCBl™yà.ö	nÅÄ­ªj“ ÎÅÚÂJaŽ…k‹¹I`*.q;š‘¥4CG«½}ÏÛ3Ðg.8„Û”>ÛËÝ\`D¯Úîçã¡Ÿb1‘|: xÄú.Ç+ôw‘?´áúP¼ ùy4ö¦ƒ<wâ…‰ÿ;—âx8›‰»ë•µn0†g@ÁíÖsú)tŽm´–ñ²î~nt?2k<ÏôPÓyfìšù0¯NCÞÀ“ AÏm¸¾ãÄltœÛÄôçžFÇQ§qÐ[ø<"YsÒqx7·[½oæ×¡jtæü”¶¡!ûæÖuLê~‚ª6¼Æ<aôk{µý_Fß,¯:ŸÉãêÒ“M¢
ä*î3/NüýiÊ[yÓ{»‚+î!òr½ðÒ1Œã¢Ý_¡Ö;Ì-]´$-!>ý|üHƒÊ´‡ìÃç§e ÑÙ²šl"Ø$yzÌ°Ë¨ø+÷ZÎpP_#êå½o±ñ¾Áó&Áä£n€„H#Eë»âÓzNb.ëôù‹`ú‡³ˆú^ÐÇ_Ópšþü…w‘·“SGÖŽsCÐ…llÐÜ½¿fm}>Va6Ýè?ÛÔZãYŸ+wnýH)„îÊ›«·¢Œ¡#¯AÇyÓÞ…¡élytnÝæBŽv€åüN).f?Ã+
‹™«Š¹Â¸œ{xäÜ“zs7³½Õ`—£h
ÏÉKˆãæÉ(ûK¼ ™«K$µÕn#mÍ|¤ßÈ©¸ØƒRëã’ík{…&f÷ÁF¯8•µ(WÇ: »ºÔÚÜ¯y*×À»¯–tCÿßì¢3@OjÉ‰Za­6óRäLøºs•3Òë+EýyÌZß´Ø&kµ®ÙûÓFÞ‹fžÑ†~4ƒW{ ï¹c˜ôQ‹@³›¯ÞÀJ!•Ðk6õ¿üÃ¿_eL¼›FOƒÔ,£'ªøÉ»².Ë-®I%+ÙÞ™ÛviŒŸ+EY¸þÈÄPáS6{ÓùpoêVJ2û<"±hŠà,ÓÖR#Õ,:yKãQìµNåîý¥-\h¼ýzõý)ÌÝ¿EhöÚä1ŒÅ¤:3ç\Õá¡Ja0	R|—´Ñî”¶2ìØ&>ü+]1Ùb½&î;±F’ñ'~ì…#Qµ,s†ñ#€9N¤`ýëÿaYõ\½ã×•+´Aþè•UÑö’4#Ãæ“”ù×[>jð‚f¢úÜ½êäõr»:WœÐ/xà]æà†ìÐ'ß§“GÐ¢'f”V©%f7ÝPM¬T‹Ž,FGt®¨[Nw5TÝ	Ü‰Ê ‹jX6EùêaAüò÷ÿÂK5ó3Ë¿%ãhÃ‹ãàƒº+eæ:`Jî	Ñ0÷ÙÙËˆÍD¿§ÑyË„ÅrïA«y±0>ªn
_/ùp|*„*Îd™w‚‹Oa™*¥0ÚOQ.ÌÙ»§qñhÓî]W¬<§ÚÑ¶R¡sBužwîÃî½_oß…§õ{·á¶…Þ<N÷sÌ‘»ÎÆÛÍjó”k/f¶Q­6OÁðæ±Ó30F²x »À¤pbYk½::@e…—V"?¥»È*;º‰›¨pÏ 3'Ôœ[´æš½ä¦€ü62‹]1˜ö@fÑANÔæšO</=€õ7
ýÃáØ…b™ç[8‘F%DÕ¿{3 ”^³ñT¶ƒó%+Š›Å¶•c¶ØÚâ–õJ–W`Jû:	â	{Â9Ö‡Áéó)ÛÀ©È›0Zv²µä”»ð¦ÚdŠºt°*æ–§„mlfcG70Î˜JVÜœ¶Q)ùRÂŠœ0kÖ³&…%êŽYW6*™™%7L<Þ¯|Ö” æúÞ9ÓÄt)™lbáßÉhímƒÂ><AÅ‚ßiÔ9f'q4{¤nÎW1E~·³ì>ÜsOÎ-+—k¥®d_ìëe§]¤¾h2ÃÚ8Ï@í†>l‡>Ø_UÆŸQ
Cåg…þŽ£sÅ¢ƒëUÞe^EÍŽÑ‚äÓpÜ¤lAInN›„>Ò&È°^„K¤ïDîôQÍÛu4oiéáË]üwŒÿj„—ÆœòRßÉþEâSìá(ÿºnV±Òùôã“"oOzÙê Š›°z¡aJë[8¤õÕófq§‹ ¸A¶êQ_Œ¼VNä€¹â¤Aö|Ë‡qn0s´P£“Åí«4@Ð€Ø¥r™ŽEwfgaâ;ßÉåÛ×Œ+ËµØÅ—÷p<0À¡¿×ÇRøn6§)9x5'5]t˜A<xŸ¬¨òùqw{&‚9Ãž=î&³0HÛ-ÖZ~Ó£C|IzÜšïi¥c?ö[×wØüÛÿø¯µ6ÔNWÙM”ƒ„ÜOœø“€Œƒ,¼vÈõ2†‹Ø$Àî¸Æ<ê²W¹c®GSîX÷.ïÔŽªÆàtÍ‹½±Y+‰yÁm‹òûœãÖ%y- qÕºW`×®ÞíI,ÖO:˜„„áJ(úñ;Vi/IS¶Ù%.~35¢îtÅ‰Ö„÷–NçT¢QËìki+S‚_û'@ïÓ¡ïàf0tÅØ÷öSCeßs^JH~²M#R¿‚§¢ÓÐgÜªêÞFuâýætílË6öjˆˆØ#V?Òz?†ÅAknAqSïCpê¥QÜ†Áì8òâQ÷<†t‹HÍ¸8V8TOr6úIÒnå„Åöwax³ äì üw\pwê–´‰J7£ «Ã37ï¥Àé Ãlê'W¾ë,÷4HCèËN4»,¶ÞMu6lLøR] ê­öâ ¹stžM¦ì[Ì½mbé”’uÃS)Y·Ï³uïËfO%©ø	{úÿöÏÿ}ûÝþîÞá
ÛûãÁÞÎÑöÑþ«—‡ 6í¾ÚùîÅÞË£CÖ&à=>¢åšC;}<Ðý<¿Ãà¡òGìøc/Å-ÅÅ¦§SHûY?cfw¸ÂV<¼d^œNažé˜M#$ç DþïOfé%ïSÝ°Ê3á…,^#Y\|ÇÓBËùÞ+b¢åO€»²žíºz|'ýbà¤e•ÏN€¶þÀf	ÊìEüÜ'£œSóB]Q¢ÜÎÏ€,À3ÕàX7¬´À4‹Ò/m©4^ÙâØã†ÔS‡ ð§u¡ºâ=i .êÍ‡¼bè0ÜdKä‰ì/­pq¶IËßÉAÛæ×†p-ak½I–ü*Î”»p#W+6)ìŸ]¯4îÁ@ê øšQ@¬`ÑÌôò +ü8ø^9©ÒÔ_D/Ö¤^òC¶Ã(N•. U÷K¼™aZ¤ Ë= |¦yº°.uãR½í/…âRîÃ%›84t–yÌ€¹½#ÍÐÚn¼¥Rmd+,Xv-™AÔMu2‚kÃ¹4q¨Õ¶.4¹J®«Ü/©[H¹A”)Xºå%®ÌMÕ´nB¨iH.—lrÜ,;ÓV¶àlÌO¼,Ì%5z £gÑùÕ“L]˜F« ÝhÂy…3ÓEjo·Õ0R]‘«wçd¸ó;Åøp…TüÊ=í‡Ñ*wù6s¯E„ŸÇ¬Uåø]W½(í3üÉ¼Ø&¿m¯Õ¬?›Ô.oÐµ^¯åÜÒõ»[‹›7äKîÀ‰îÌœÉôìti‹ÓqÔÛ\²‡Ii>9÷«ÑbvÖMdï®½tÒ¨‘tqU8Ä4¡±Ï0š+ƒT€é~x!ãà8@ø	ÂHc‡À’:Ç—ü—µÿEèW¦œo6·JÕdTÂcª×›j~¶Œ®>âÒÍÎIÞ_Gñ¥dáàuäºëMÌ›j™êh²ÌÕi5“PøÍ[ºÆ^ÂÆŸÄ[°”°á&ùEŸ""2ô¢y]¬&lh«	GRm2•)ÞÅljÔõ9(+£r×€E'ƒˆnÌ5ïý]d[Ñ	C‡˜dy£±¯°èËÄß½Ï ˜CzÂMó×Þ	ä‚øã0XèP¼ú0˜ÌBÌ_H(}akIó5ØB`’ë's½ö{¬nÇ‹ûâRo|€¹·º?ýÁÈÊ±8}z„É1ÅóŽCLŠ‰Dæzùkè£m“-a<{Ñ…§¨§¡NŸø#™ƒ1¥c,1
“ äkš‡à’KŽÌÂâEÃ&~lF1$ÕNþâÑZ¥Z7Ébøàþ][”Õ“ÌÙ+1N3äb¨à!÷Œ!Å6†Z–iâÌÌù¨Rêðáñù)Ò`ž²ƒ7O ¦ó~ÃtœZµ6ãÝoúZJ–AË2nªäšº‘é¯Å»×´wßíe+U¥ÕŠ5ÑgEwn)MÇ­g³§›ôÊ’‚¼(­2Ž¿ðgßJz%ýðE±¬R,iŠ„f)æñTKj¹‘nI¡GqàMOCÿ³S0i<Õ¦Nû!úå¶sæ)šÇ~|Jv")^ÑÑbï2ÁkÑc¾SøÔ®`zz“	i^a :ùh>ÅkÇKÆðòßûç~*¾åŠl^²i”úðRèf€)ºçì4
Gð=Qa;ÕÔy^C€äa8ÏÅ0ò¼šùÓUEšx£l”p`°'#/ˆ/±Ïèl8§æùÌûÙ‹GÑY‚ˆÐ/”z°=™œM^¸:Œ€Š¡éåÜ±—âÝØÿbF	ºÿNÎü°¡ÚÙÔÑŽŸ›és¸ã-z'mëO xfrJb.7Q=3n;¯îùGÛú¡wæœ|ÎUS7éF®‡ÎãHýù‹R<]ºÛŽôØ‹ñ¨ó8JÓh‚þ‡ óÎ›zjUÖ:O;(0óëÃ1\SÀæH„íìÅüøy:;K·*f"èÍ?ŠÚ­q¤Q|éV	Î”zØw}ò¹Û×ž‚@v}t?ÉpðìKÿœ¿½MgÅNMœS`ùÝdGa£î­0œ/‡lIC¦ä&™\j‰ÎÈ´õ0;$õôr]•v¸¡¹)µ0>)Ò¨fôûÿ€Ÿð+éÎì{,Gôâ’½ÂÖe\:×jûÌ·¨‡_ö˜ásó=&Û¿Ù¹J‘sÉÁV|Š¼>øÝ–’tË[K:œá%/Ç¶[©LòÝ¼L2Þ<"\Èv»iu0‡ÀÔÿõßÿßÿýŸlçÕËÃWÏ÷w·övÙï÷Ÿ>Ýû#;<zõz>{up°ÿò[¶ÿòhïÛ×¶ÊÚ¼¤¾í°C"F4Ün·ºî\(¬ÎÍ¥&ÌQö†ø»/:èIiŸZ±@)¼#(úf×WutÒ˜G• f>î¼Ù¸O±9ï¿ÝåßŠÄPT])r7ÐIÇÁh­iâˆþc—èÔ†ŽÂÜ·!LmP¼÷N‰gsE>­7ø°õÞÕâqtºûÛô8¬n°ÇòÜM'”2ï»%
j©6‚–‹ÏNÔ9¨´n©{ù`E^ÕO’h¥+i®s„9mÉ“JxƒIú³GLÇžú¾hEÓ	jäi]3„úÝ3%kr¹Üá8šñzSS<| 'šã(ÆkõÎ
-ÓéåsÂ»ÈZ#šfŽj#~æTÁðÓ&O<–ÉÝždåÐ•{*k±Ä6A\ÊŸs/™QÇÒõ5³èdÔ+Î¥§ÑyìÍ?ò©¹Øï4SÇú¤Žú>ÛC'º\(ÌˆCôŸ^‘I÷]5‡"œ¢åž#¨Ä+’v£! 4·¦#_6„[\1â¥ÀärôÌzè(r¤ÕÞE¸(¹‚(˜gRÖukz‚°^g£Ew£`B·g„Øyàa1-'$Clã0k_—ñ2—CbÙ®”¯.{—¶Ô#ò6&Ý“ „­Ò/Ý¡-ápèû£¤;ö’vÐFnŽ@oD>º¸<º,LÝ!Ž€?«]¨o£Öqí~˜ýµÚhJÇFÕÃ#	ùy6™xñ¥Ãò&6è&@ÃCŸpsZ4º¢çØ'¼úÓS :gDÖ2¼Þš¤«°ÔbÚ™Š:(óf‘Ê¼à˜›Òy[ß%mÍZPÏŠ”1¿Ò|ÞA<”õD…Iw®_’®XÀ¥­_þõŸ›é¯œ@ƒ©J»O¢‹MGÍ¨.X3ù¹ /æÄD|"ÓÑ³QV3ãùg1{®žývÛævð'û†Á"d‘ªyô—Q«ºæ‹¼à¹¾Í(øŠqì—LüQ”AFŸÏná_rÜ‡Yì¬©/f!è¼9áÂ`Îófñ4#4³ù…>+A‹/´ÞA¦»ŠãÐ›Ö[ÀÙ9âÄÙt_–¶ò©@Ì—ÆíÖL®Úiçz	È¥P/ò>dÛèc#Å[Ü(ÍÁ[3Rä¦©“Ÿ‘q÷<+_ÓÖç‚³”e¢œ âoºP&&}w£'ó×¯ŠÎ¨†[ÿnuõnë¨zŽi®†Žs–×¡0žg±-9ŠN}†åmäzZ1tLöRJ#/¤uìq `$ñÍÚý¡gu
¨©_µo]àûUþ$ýá¦µn¯ØýåFuSz*o#°knO–êË‚YåîÊº‘3ËÙ¥;´ÖQXs—”íZ8¼òCÅÅ(û¸.Tô=7—Å«¥¹¾,ß öh‘\	’Ò¢³ƒA½KGÒl€™¼ÀØ¢	áÐÆü‡œÕ?;àFZ:ÿpu›ã!Ä~‚Já†Þ*·AE"l.Œ2Ìï:˜ß²×Àôs8ïšsËBŒA«°•8Tiîõh„,ªá•«¹n%9Ì0ÉöXÅœP¸%ÛdÆÛ×ðöç†»	Cü·
D©ª¬;¹7•ò(NpŠÉx5’Û>=­§0Çz^_ûIyÂ¶?x9dŸ»zw[§²Eà ›xˆþ(€Q¾K6ø ¤WßpëÐ;Á¾ÇªÞFx2I%2x]¡',LªoÖ¬8IÅ„ ,ØpŒ ì£ÇX¼ä<¢ t*\Â† ¦ÅÙÔß¼pËsÙË¼éeL|W°Ö2H:7˜NQú„×6Iº7^1Z á%Avò¯Q2uK†^v:ByÿÀŸÃørFU„ kþ4ÉLdY—¼Ô
Ï´qpô<{òk'/9úÆx¡C÷[Û˜ÞYLÞ¯Æ8ˆSâ=Õ`N@y™äo$ž”Ò³ý»ì‹ÃPíD+Â°µúÎR?Ñq‹j°BM¬d
?ZEå	Ë¥f÷=TœúË°½&¡Ú“<fÎžcN1	µû>Hˆ‡Àªâü¥Þq²Â@×`	V;	†XäX¬¬öˆt'/TÄáÕö3sÉtàÄI¶C;Hð,``â4(J	~¹f…´‡×S<Ýò².X!C€ë}%»­N6q*ByÖ{½²ßêê±$ÕÝCž]ÌØuLi»_âXf™cŠ0Õ_ÌÝZK[Ä%0:„×	X†#þZnK%_xSN¥aee™x¶xÌó¼GDŽï,0³ÛÌHôó‡ò”Ô+Ù.1WNª®ñs·"¨Ø(]°ÒÞ,ô.i‚5;.)¦2f/˜ÜãûF÷¸…?TÙPê­bÌ²ef­g5lâ£'»¢Ò4È$rkˆú›Ù”ˆ‚íª·ŽE©W>Ï7Ó…‰ói—4v©nd™)=6èèÕ;ºJw²@'É‡ibò%-|€õð=£@§eµšxE*¬D¾Þ»Fq½÷FéøÑUß’ÈdRåŒ¢,‡z*P!|PÓ†§u°0Ôü%VikdM0~0|¶G#ÁÐã@ åäE–”+j^¦~€âsê§ŒL'dë(½³.8^óðbìª‡,¼ÒigZ·ÙYÚ¨Ð[È“§¤¬‘ÈO)\ÃªÏT9‰Å8¾+³Z`nÖ´¬K[‡¦Uóòe†/<&FÈ4Û"ºg$oT›êYB–ja„ hQnn	}”‰/@¥Æ=hv#›xhþP†‹i2³ÁÀï³Â7Öêž4ßYúd mTFlo§J'Y™“y}	²ô™\ðT— ØÆÅGªz=ûÒ»èPÖèRUGiój-0]'Ó(¥:!ÞÙ
®´z¥²›bSqÂ â“	tÑaN·hƒÍ¼`T˜¼SÔe}^¥3ñ=Ñ	ß†|Sûa^Ü3Û˜(Ž}tP€ñ†(ï&Ý°Âü²³fûBZ2×úâñl¢ã›Ï†ÍqU¶xÈ2QÄÛ3ò'HR7‰&~Û#…¯‚&=KÄ	Kö¢YFÊoØ ôà;Ñ¦ÝÁxÇh#¹3Œú´
„=.Ù^C¢y,þÃ£øLÁùÑ{"U–§¸P}ñ¬$cßbW¥§dó¯!Èðf)hÿ£‹šˆÇâV–ênðÿAM…+Ka·ËÚÒXò†Ñùê
Æqý®êfi¥ôŒ{¹i©bm.BŠ¸Ïe*
VUzËÉÐÃ §x4· ¼Å”<3J[¬ûÔ8h?ÈÙDÄ¯K¼õÕ"˜ÜŽäõñ—áÑ‚µsŸìxñ>H\i{³ý]×ã2SÉ¾´u»c¦Q³Òõ–e<<EY´ú*UD«G¨N\*uÑtr¦º L[+.ûhÖh=C?	½|‰"gÔò1EZG>™æ
1Ã(Œâd¹¬G±—ŒMÐJ›»Ú€#ÏuAõµ#æv]Ë¥83!ƒ6TâAZTŸ%uµ¶´%t6Q>Ùëf V®õÓrÜ¡MhKãí#¹4{µ¾æÖ¬Sà:RÄ.ä2~T“ï[,³Î°s­wî	m·3™;^èOG^ü)&ó^>™Ö(ZÑíš£Ë/mýÝ¢Z»›wOX?òÊJ¨[Mö…7;ÜöÏñœ{m5§@5ˆN¤8øýí’ƒ1%IJ~3Ã.,~Êˆ8Z¶ëÆs†r‰K·¢Îâ-‹ ²n'	¯<Fá#n¢‘S²x—12òÔO“…Dç†íãO¿Çø¢F8¢:I;Ç¿j’yÐ»¼Ð&‘Õ&[*w+Y÷š²¬YBÆM_ké6¾ðƒ?†¡ÿ’PÇ›¼ÙM:–ø0RÔ×–ÆAc÷pTEaKù`ØYi‘kÄ‘€ñ-Lqi4‡Ýúäc÷iøH…N~VÅK¬?Îâ„ýÅïÑÿ6Ÿi‘×ÌB	ç®ˆ¬ÚôŽ“(<ÃdYþ=ôO ó„]!®¤’˜øÂñ‹ïç+DüxÚHâ8ãð^i¥î¶y4˜^íŽ‚Èx(žLÐyÆ(Šàg10wø"Ä%	£Ë®ÀV7wŒ9‚ÒÝyÅÙ™ÊÞÑ9
Æ\Q"¼ð,Á> ïR/dÉÐE‰o8<¸,z¶Ãð,Äš¼Í»´+^@ufRqQ¸¨ ßˆ§¢¼>EýÃsKŠÞÈs.Yo³FÖ0×—›‘°»ÀÔö@NäNÞŽUa^-·Y)¯5Ð<ÜÈeÆÓã´Ô°bKðŽ,1qs¨ÖêØZåE¦¬§¾!ë©\€ÞØ‰ÕY4ºäª}4·kmâBmj‚u<sœY~´7Ëk	_²CžÉe>¹$âŽý“GWù¹+=øÚ?¹6I9›ÏMœ€>foðß· ’¼ic+¬õCÖtë-?þÊ’ËlÉO¼†9¿‹ãS‚è¬¹jüOKb“ñâê*;ÄàVc†àzû'âÀG!Ô$WgCˆ>ŽÎÙD„p Ú'T\§¥=ÈŠE#¼GÆWciucLŒœ|']ÖÃb­g¾öbí±ŸžÅÓªÇ"ë›:¡Õõ¼oŽš4F”H†1 ¤’ßJ<‰ìMiNBý‘»*cIèîZž1L	=Þ8®¤DÒùqu½&¸˜0ü”CM`g©ä &ä{Œ"ùEüm¨±ÚêdÇ˜@Áeq¢PçÀX¬ˆ;”Ó(² •„Tµ,Å`:â:T"G¨d%„kÄ@¥»Iöš…]Y<çkÌPnYô–³ŽÁþÍ˜à3D”âñ|Và=ç>iÁ4cfÀÖrfÎuUó5•qpƒ>¾ÂôÄ}y'X÷8ÓÆQ·XÛÐáåÚÎÒ¿w
1¢ô”™—ƒË*.dÉ­òÈ0fŒ|j7¼ý1Ë‚r7Ù®—zˆÒežY2îàÙ íu-=€®e}wKã£­îîV}ož{Ç~híMVÑ.ê%Ù™s+êÿ9Á5Æë+Ð7cçjD]¥ s‘Q*¾zgˆ†úêJZ©ëæÑPï®+YŽDtJHï•´"U™U|ÿJ^£B«Ò²¸—ÍyÕê‚ø~_öA™]µ`T)o×é%Gí%AêL2U4VžªÔˆFx'!A]2ÍåŸ.õHÎ¥˜è†¼ÙžZ“‡h)Ý<	0Y+Ï¨Ëòø€¿Û:–¶rlyq®q›r²Â®›ï˜ûJ•h{’^ëEp¼Ã%ÑYZs“=B¯_h‡Ÿ¹£ôðÃ} ˜X„øM57Kó[‚Ñç1w	+ÛáÐ¨PÛ•²Að€ò]ŽçÓá0!t¦pÉê¸˜†AN¢<½I|-ÁÐsüòµ%F¥{%©Ý¿Ž÷+WK•|]ôNUñm®œŠ:%Bæñî¹MˆÝ*Žœ¡…ùëObï4+2yJ(q3Î—‚tÄÄO(6zÆó
Ž¨åx–Ó.Ø^*éò&]½Ï4S=>.’Ÿòiqô‚¹;!6‰½ÏùòãªÛ_ü<Ys.lušÐP´JÜBW*ÏŽØÍBWi‘%E«XÓ\0¨*ó›'Àãæ‡XÀ‚¸¶»à “ž°:ÝWÖ`dû¾R¡Î†DœwN—Wê·èz`ÕY7š³)1ƒ¹Ã\ç0†Æ½ñ6¢â\‘…šÐõÐµ«¼”äwßE~ßÊ.0 ¬o}ª%;@ÀÁ¹÷F}òwÈR~èhCÝ!ŠûåþCÑ‰çWéðsC'º†Iä²DÏQ÷ËÕíFïþØE ë·Síf°+´fØuó¸)¿·!@œu%³‹ö, w”øsAÂÝyS6ùâ# Œˆ„îº-+š¡o‰}-zá°±c¶–¥CZizLEß]ÎGÒ ºW@	¶ó+GÂØTQ›&÷þ7šO'ŽÕäÀwÌÑ“ÝEm—yua‰*n¤Ï‡ß¿6F4!Ñ¢%~ãxÒ¹Ù‹ªŽI»©tw¤¯ÏNÒ.Tí¼’ûCz9§»IÉµãŽÃYŽ9‹*×|Àì£årÿ<:šÿ DM[x]WX§ïÈPñ£D=`ÐÃ]&CêïMª=åi‡±Oˆ ü;5ˆWÈÖ4ù0û¸Ëµ‡/‚éY"·îqo€oé~£ÐÖJ‘j¥Ô¨˜À›Až¥D_•õˆ†àí·Ib7§°ÂÅ¡û?æ"1éy‰ÌDá²@dáÇ 13þ‘þq7>?#Šý„~KMƒ_´ëçsQå)›}Á.M×âbÂ%”’×ÒY²bþßÌoRr÷—‘˜ªì(¡/ó;XU0ƒ©MG
¼ÞÛÙÛÿ~o×™+Ü’«ia"S!,Ë9Ÿ˜ReíS7®›´ìºd¸gÒ6¤€Ì…‹„Û¯ÿ¦ùº7‘Ÿ¡£ïcòÕùm›µÏÊ¥ÎMìí	ñ¢LlcPîGñ©qß†A¯Úè\AÎtbê’.Ymè:z)3A¢É^åC&–Ë‡‰9$ƒnnYtƒKÍagè1g¦»ˆ¬ÏÚú|!Ú}ü>¹¹ÂÙðÊTöÊ\+³ÁÊéÈÈÐ0'/š£!ÝÎ9
 ÒC°
@ØžB<²¨êVDKˆ™XyP[T¦>}Šš©
¬´@ª ûMqÏ×Æ7Ù°¸¸²juˆÕ%Å</Ì‚íþ„6JÂ:rpü”½¸ä…wSï˜µ‰½,2À$Ôe%½J*œ6£–v´ÜˆQ•6BŠô¤ßBúy%›dÛ^ÆÆn¿
V¯FÏêØ›ŽB?+×d£69$œ^ßGxµãûjÊR¡¯¨qŽBvJkâ1z<2ò+{%1Cæ˜iÁ)‡¤b=f­Ü9èéèæYý¬i”â8¢s*pNc™FS¿UÑð&5l6+LfC9ZtÐ³µoƒ¦´1“+}²¬ý~lß60S;<'šÇNÓ‰qF:-s&
Ÿˆ¶ÈcA˜j&{[8N§¸½ÓˆYƒznÇ@û¯él¦ û´	Y`_¨Dl¡( åÒú#KtLžDñ¤eùUBþæÌTºæZ¬#<•õ8;®Cè4·”s*FR[Ö«¨T;øþ’RÍMy¸¦
 U@%¿¯V;@¥&#¯2O†õ4V±ú›ù·QèÕTª‘¤ªl–õ<?³E±»Ó9êæõAì=±—mø$ó–[/dâ*¸µòˆí™ª‚$öuã)-hÝ®Ù&ÝeÝ”$	Û<™—s+€$`.)eÄcSªMyËaF™'Éqè³h¸#¸s¶C¶,ßó1QSÄjiW{;šVß²¤”Ïf „ï€€DüIta„]0èÄ÷kTb3ë3d[Nµž°u‚B.ºoË!1`ÕÁÃÃ`:;KmJJz9}_²Ý¤0ôÇ@~ühidÔ$ºõ~­s<;* ­)¹	6‰«×–¥¤ÎáY²	ê5 :+.!aõêâ‹¢”J°YÆÎÚt#a’¨Ìú¨Š²Œ§î_ Š\‹„¡˜VAq«Ú[ãNÚ¯Åù«¸Kú¬÷kJYÚè>ô¹åüË3¼ð'Q[®Ã-ãè"`×ÆpžÑG¨lOö=ƒ™É&ü”‘î';°<§h†r¨âúÅ·ÃÊÌºCùº~óïLú^<­Æd/âvç~¼ûº½Ü¦Ãðöt;¡ÛþpæÇ—ê-ËÆV_S
"‡v'ùŸØUÑOÎc·Š_Í­xy+ùŸ¥V¿f­ˆlm}þ0)_uq!ï°tIiôzYd†#ÄK§F§Á.ùM·ÛÕ/¿í‚I›‚ðYaÇJ¹îä<ÀrômüùÉ¥Œ¸B¶E#í€ÜÚÌç‰áwØ1ÿëwÆgÆ ‚çyæ‡:^2”ßCt’D/ûícº¸l|Qšä7÷ÌóÀ=}˜"ÇÉÿ´<¦4Î+=7òO¼³0Íoîe?]«kÍ©Q7lÍSŠ%k"‚äEt„~±Î%x‡ü™ÇHlKa ®”¯2{ì ðá¦âoùG@cÚõîôÐð@é¢úLÎ9ðÞüK©]å6ù»|§7¡÷èJü!ÿÆO'hÊø=Úù^Òiù£:ãèü)íZœ×â‹Þ[å6å»|gÆÝ]eií¼Èo¾(-&-ˆ¿ôò¤/Ê=ÄR˜ÿÕÇ‘ý˜ý©ÏÅïƒ““ËÃ³ÓSÐë€ùœhsS~Ìx]~²¨k÷èªø[Y{iÇ=*Ó‘ï$Ì'ÙÁ½êw­¿ûb7¾ð§g¯f>ï¬~±x¦P„`Y¦Û=óãè0P|ÄÚËe±þF8åè¦ìÂŽtá-ç/€á·{šxMð’.yd?mµø„P%=vøctÂöAôÐÑG˜I»Q# Þ’á˜œg?Ý;<Úÿ~½ÞÞÝ?ÚõòP¹3ƒ¶<KÇXžyÒË÷Ód…Í¢è'o­BG:N@Žü˜'Ì?Ö¸Gh$tÙÞX/à'ØOÑeÞÏ);Aòøà…	;G¬&x˜ª/ƒèè*=ãñ;<NÓY²¹ºŽ×º§QtúHXaa‡Ñdu´Ú÷¶¿ÿiï?þy4=ûÓÁ½ñwÏ½þ{ÉîƒËW?^ü|0+-ƒABÓRB8ž8Ë÷ŸÂïˆ*#iÐOÖ§#ñèÒß•§OAÌÁóRòyé–coDÃ{JÓágÐrÊ=
¹Ï§!ÏŠœp	žÓD!~|,›½æ‚ç[Z(ËÙƒÉ«úqLœ6"ÙùîõöÑÞ.ûvÿéÑþËoMdMÆ½XU¤6ƒ¿éÜ!¾	J±Ü_3
9÷â	þÔe/¼÷¢vx"põ&mw6æc1zºÓá»5JoKn@.£‹ç—ÑŸv~ÚØ;8ùÃÁÆdöàhïû‹‹ãg;.Ï×:­ —8Jüù¨…ž¬$º£‚V¤•ƒÅõF—‹ –AB±bji¿?¶QÆÑöáÑ{õ”={õbÏDß¢YûÉxEZ6ÎD¨¨"NŽ‚Ø§:ðÛD/î²§ø÷‹(ØpŒð¹!hQ„|ío¼ŸÎà`Q¯ ÐØ11@¢›ïVªG/…ï¥EYÏ‘`‚7 ‘ïÞÿþ‰÷û§ß?èŸM?ÜûéOûêç{úÓƒ~|ïÏ¯ÞØûŒ9
Î>ì¶œ‡/‚JÀåòå€äÀ^‚èZÇ1^M}v€®Õì¿Þ?únû9{¶lk$¢€QpéÑB£(L~ùûA	q™ŽÅš³©OpI1ƒu?Ã÷{Çqä›€¶ ÿe%à7 ƒWŸOtf"‰´ÊéìÛ'/ŸŽ£'?Ì†G/N7¦ß:¯öF?¼þáäß>Ý»¬ ”Ô÷Âùè„ž¬$º£‚Jó	*ÖÒPÄ_os45˜”½”8mU#Ê¬´Bðs z¡O¤AéN¦«Jíö”ãŒ±o0ó¯„–$%+óz…ÝëõzÒ•üÌ +½r‚!’w‰º)·˜Ž+ªZ÷v9zÙ¶³á ÛÊ¾YãgzWtÄ1ˆX»ï¬*ÆúÐñªâ{¸ÍáŸ€ ö¥yËŠðÍµFÀOòuO´”ª(eDŸ*ßæ_i]S…Ûïq©G`V>ï.á?ûÓWgéRùiw0
ëôTïjéÄ–“—ºÜÝ|+˜¿“S“ƒ9‰‡Ìí1Æ{ajy†#r©+Â‰ ®ø˜ÿÿ›´3DRd?ëSÁ?±âÃkãƒ(†—–¦ ·ˆKåÛK>iKlëá€áºSì“Sdè01Ô©9Ñ4]Ç§×•né0—­×"”‹wbûê $º¢z¬S3\Òç7÷øžçYú…úZC}ÏâÎ›þ=ËòÎQNªýºSCÌNaX9û¹3èe”TB|OKE÷€W)Á³,c3mbô¿Û	}–øu‰­<°øÌ‹À7'öžÆé`ºñ‰î ê‡zC–gí‘%úÏÎ‘ú¨‹×ŸÜPky–á¶ømýžJã–ÝÀÕ¡ëE@ßôºk(/m5i„¼OëQg^ükaÈyöŸ)²µa£ŽS»¤Íl‘ÑÔÃ‰«™`ùîAÏPL5»a½×k6±˜ØˆL#«ErÎ¹q‰ÙÍöì¸o°›·®õb÷ìšãž¥UÙ@•nÄ#èïi‘Ù¢¤(q`é3¸XX¤oG¡6ßêF7™…AÚn­dõÇaŸ¤.õT¾ö½aÚEøB*,
ªTÇt_aë×WDp{ÏòóJìÞûð8†M[þpUí•½7ö ðœDþ*ãBÌ¿‰‡­Á¡óQî\tk¡Úuû†€œ
Ô˜—*°¨5(ËHTÆ2ûÙ×,ABï§_„§E0K½ûÍ&Ø–ÓáºÓE%ùÕÞ`…­­°uQnÉ1XÊ+•èUm˜K¹u5ØæÏýå_îgÿUñîº½Ã×A€£5G¦Û»Ìýtg±÷ÁK½¸;®‚¢þîyô°­o€>®A_G³m	ã°k ë0­€ZÏ3}RØ¼[5FÌm
¿Ùx?¯.Põ£)gÒVúq]*3E"´
œßy(À'²0Ç¥­£¦xÚñ%KñÃ›Ž²¨^!‡Š#.¬DòéÈ5Ù|¸uZ‘]àèÓ$ˆÌ3Êzg¹5'9TBmõçç›Tf¹Úƒv±É6šóPÑBŸžoÎMAÙ\Ff‡Qö1¾}ÉðÎf«°ýoÆr‹ÊpÜ¯±®û5€¢Èœ[SèóÅ±bˆÍ´@;~³Î½‡h)¬tsˆ1‹Rövx3û©¯fjŠËù|Qo;³9»øg—ÿÔ9¾ìOZ—L›#É“j±Xÿ˜ê:Ë³TŒ©+Êä•&žhŒ°noðÖUÐÈñÆ?Öt'îát¹”2cnúájÉó,ýŠñÎÈ‡X[2Ñ­[CÔüì#+?I…ïˆþ¬Ã¯™d˜)yOPWW~´™2"Ž¶4+Bq)]×’§M	uúF`È50"¥°fëÙòn´'kÓc@¡éhÚ‚–O˜“1æd“å­IF[€i¤‹d."JŸ8ïÐK!§‚å××™x×ï§&¥E²gCW¯ât|”æ!IÜ’”}ïµ®Íž¥©ƒ}C¿1£À½\À,}Í”ÄI”våâH}¨Å3I³^-[—eªê3o3¾ËmÇu`ÖÚ*V¬®kÑ&¼ì¼s¯œ|ðPD›¸1œõü äú×@+ªðlÙR^Cé7%¡Ats–—w»å>xá™oÅäà]coz
·µ}â^jHfÛï‚©sê§]jÌ`“(f×#CJÖŽ¹_s yŒ¹ƒ^OËp®Ë`JF…Æ·²ä3­£Ú
˜Ü3T¬¹ßš$PFÛw¤8ÓÊ™,üí8{†:9Ú˜mpÝ š˜¹Ô-Œ·Ïùïä!øyT>¿dT5xš÷OÁÉ	ìá(F¢"6_kõúšðF+W[f½Žgy+µ¹äd ”­c*õÂ’³ÁäY?Ãbµì*,›#¦Ð–5vÕ®ŸØeNHÉ2E¡:æ‚U™DE¦/mÙ:S"?[fŽ•–#²žRŒ¸i-3~T
@Î>FfDw×ó!õð{6æM‡‚G KZGŽôø	XRyjd+ (ÆÙ¤â5÷hF±|R—N|¤>–Ð~*þz¸Êïpx8Ï:YÚ"jÜdÏA§{œŽ·ƒùyCØ¶6h(ËNYÚÂõÜdÛ?7}ÄÙãîl7x¼ÈNYÚâ™½óÎ‡”°R4å4#°oi~ÙûâhºOZ
LpVS˜ ºŽÿÃm‰€—¤²‡eÕÅ!÷Î¬­ZuÊ5ÙµKGERªA¦*‹º%ø†²éVhNEÆwdÃ÷
³°ÌÙxÈ”—…@K¡Á·¹*†ÊA&íGAh·gïšuSâ!NH…Ìù>Pçò¹¸PŽ^O³¿ò»†åf²cq²Ÿr~M¾R''™¤~¥ÇUòµŽ[é­TÆÐ)ÞÕì™ÖÂn­Tè!zÎo’6¦vòÒØO±4“qÌ¥J°kE#KI`ìÉIJIÊµHQŸ²æ¬‡TÎ¸¾bBAµ–íÊ^“R×þåþ}ùá*5ß àÁ
d÷åV¥Ûg†é”JÝYSè5õEPZðâ#”AS¾œú1)…Y¦fIÃtˆæÓUÇŠs5ƒ-›³^g…QÊÿo˜ùßÐ·[¥B°™¤ÛXtï¢~Ñé‹êÇ¸èâ©¿èEoŠ;RÉì@£®èvÂã­ìI0c§¬WvA˜r­ÌVÉ.ëifÙo…+ŠšqO©*Í(–Jøp¸”1®]ñW':9¡C¹fg|¯Aâ§Œl?.á-k¹(4Û!¦¡X’:½N¢*!¿kì"”¾®ì•˜ ¢à•~E­\¸:Ë',<±dèÅé>UéY<'°²í o…€ø„h„_@,kK§;j&qwì%í apµsþn|áÂ>³Gy?+ˆ[=õ1åK)oD¬A•h)N–H6Fcán°œìêÐCeêñåôÊÜÆúÛ¹ÛH-W¯VêÐüsULÿ4‡ 5‹aÈâê”]þ‘”ë"\¡Z­æŸL¹nö:“ÝöþznýÓ©÷yç>#@”î$4àÿäk	„¬µ0ë”³ô†ñ~ùRÖÄ÷YdAÌWp½üýØSA–s˜ãR²– e³ÅGŒå»;PLƒÌ}®Š‡)7G>-åÑý~¯&ò€êûV8e½¨¤µÆ¿Ö¤‚ùáí-P].å`Û·{%T×¨E=Ég2ÃAº)¶²ÉðÜ`¬¾ˆex=º]Q[TäÔ”˜Âµ¢µaZæ'#ëó$F+U¥83p&½ÓhH¨<CÞòÜ›P÷²Wówa˜’
Žs_ Í™û>³ÕvPMíÂ›w™ûgyÕÀY¥ù„á.G¹¸¬‚toPqB®hc©6^±¸a:òb	}u‹ “³ìÙñåfÅ8ì±îv€óÛ­<“´ƒ~§y*ë°)…t¨«Ž\+ôŸ!K•v·BL‹gŽ¼™,¬»ªžpÊ>ä¨}U]T`J§òž^©~à\P¼Jð5ÍøÉ²¯kIòŠÌ[©|¢D†ÅÓåVÑÒõJ¦¶Q÷³OyIÚMÎ†C?IÚï–¾R9ã®€?Ê1#P‰¿ó®¢E·Üž".[ñ’Ï­}i.îûjô¦„ov²Ï‘(•Ã¬WÔáÈ³ªsb¦ZÞT6vååº.§ëœ%‡íÎ¢Ÿ=¹³g–ãï)vÐSKn6[ÜÉ±E=ŠÈÀcø²¬÷ÜÎèJŠ…ŠªkBí}åñEpŒÅ¤@Ä¯$r`÷z#i†ÓÂÃ‘X³Ä’Ûû]ƒv´¹2:‹ªœKÕçºÃ¨˜$¾sQ½	»ƒÀ¾ ³¨
ÎT÷Ö`LíÓ0òhŽ3„vÈqßŸPè,{}@¤”çÞ´ùÕ]?yÿ²ïÿ\	Â­2¸¯H9`òàáûH$'až’ÆêS±9bŒ¾–¤³·e^õõsÁ¡›^–7ËqÈ›½Gx¢u¬iö×æJö¼J'CÒ4Þ‡°á7šwÑž›Ç£$¹>@ßWr‡19Mr\ªN)£êl±ù+Õl<©Ød­d†ÞõÖ
y“üµÉ+Xáäd
‚“aµªê‚îYÀù}o®†Q\d@ÐÃa8ý_u1¬ý[©Š~´Ÿ;oîm¼Õƒ+Hï­wz•+@¼ùO½ýµ·JéDô÷H¾;!òßô~Äª®?®ãÿâÓc¯ý`eÐ_ÙX[éu×—Méòº¥jÉ‰Ð“ÑÝMáòAdwƒç×Ñ mªÚ9¸QJG¨2‚µ“ÿ*‹GàVl6m–ñPO0<é‰ª#	uÈ^¸*›«AZ[óB­–Jª.)ÿtèœ§ÝÑ½?¥bPue÷®4Yé‚uîf®Žäøi,‡;[çÐ™ª'…ÈJiõÏêj'¢7C^ åO;û/««¡ÖMXEryq˜z'LÇíç^×Šõ2”k&NZL?ÂŠöñp5µ0¸©dÃâJ&Ü4¨Á–ÆÃ?ÎÖyQÛn¡]XehžƒÊw“a…!<p…®S’fÇþÚ‰bR“(JÇ-BŸ67ãâ÷òß(³ò”Ë
Í^Ôªè”s‘ØƒÅ3ïö1[¸¦AT›ÒÉHrñÃNx˜5©¬õœ©\Æª¿¦øÜ“4ŽÞû7ko™­8²“§ÝšùNtU#·­˜öÄ;Cí¿Bë/?Xaoô8Àß{E€M¯ä¹+y$ûŠœN°’y¶VtÐî¦Æ[Éà„Œó&Õ5[1U¬2Gm?òŽWìè«>‰"$ä×þ	¼C =¯˜ð W¤­¾¢AK˜?n<¦^$U]•÷;R÷«@àu)©‘°gŸ€æ–¸[lû™’âš•+Ždm‡¸N«Ò±!Ìá~z)™ÇrTž«£COØzŽ9éŸF9Àx<(	Ãµª²eK[°Zg±ŸÛÇWÇ¥Å
?†Žf²´ubþ8t7¯¬G¾°üHd¢ç^^Íð‚—üŽ™wI8ˆš}"èHøEÆÁÒÝ FˆÉýñ<:¦Gq [#>$cV^ïïwY6Ýö"!Êe|æ—]!åsÉãtÚ¦žkaI{:ƒ¶ä¸-öaOI•áV·•+Ü§I=ð.*(sW—Ù)Kðºƒ\]W}yZÆ†¹$§&oeÿ¬ëÔ<!
ŽHÎUÎ€1”þ¯†ÅÌç’9;ž)B] W†S‹Ôvä•ßs¯Ó#Î8÷G 2Š¿ºtä™ü¤ãvëð‡N]³y¿xI§#û€ŠªòÊK¡‹y±ÖéG”¶>‹0LÈô
D£BÀj`tŠN€öÔ$aÆNéàÝyðPýàrW.*°Áˆ/—i&8 ¶RrÌŽE=]Õ·muâbt®aˆ€©d,ƒu,ë2æ]¾Ïä3Ñ¹œè<‡(u'ˆ‡¡ŸU¿«ŸlX¡ãÁMÒi½Z:i
à•iov(„{íÿí†Kˆz±þèšg2ÃÝ¼Ž¦zKë@H C~ózG+p¨‹Æ:'¿KßKzïcöîO²Øâæ#‚ÝÖ’?åaÅ#–äý/»¢4èþî&ûêJð—ëwåÖ7Eë\ñ)n­nýÖŽ>-³j¤ì¶+n­Ê[j¶ZŽž—qÌ^r\~ÛÌRQãf0`+Y#y@ã"ÆkÁ<0ì4w´í†ís/ CüWVV˜ Jï:ý°w’ ¿l×»LZÆ SJ›â'zò†rGcHüI@¥ûæÝK5ûB&Yøõ4H(X¶‹˜ü WaV±qª¶"D_tÂULNw¼Ð;m¤Ä€ rƒ!›õP´– å¶'*Á§Øíó Õ(¤d`z;Ñ¥ªøbAÒ…%nãkGgTØaFÒ—FÖ‚æbèc©—½’—¿ð'^€ž°Ia›|
›VéMî=.ämií|´™âã- 4`^†¤ÈÇ{>ÆŠ¸cŸŸÎà¸ºŸi|À‹)±¾| xZ´2RLÞçÔ÷&ÙM“(F^f¢ëDÑCÐ÷	hÔÛ+|»pëuAn´ïU†e¥ÆÚóóqVùäqõ¯Ù°¹h"u'äôþÂÅ„¿³Ë£aa¾ÝlG~øÏÕ%28Ï•ÍúŠß"%­ÀÞµ€ò“]½»¡pþüÈ#çðk92f®²åb ÌÕÒ­:ËÌ^ü`£WÀÕ5(Õý°`£:ïËšÆ4	¡éufga’§
LaŒ½„‡ÙaêÏ6Ù¡Åi‰Ä‘¿®äý*×5ðã‹D·ÊšñcF<ò‡ý¡Í5Å\t3/M#ú{èßÀÆgÇ]öƒß‚M†ö}f›lHT
S2’oÀÈˆÏÈ[”t§ÀËCžTþš¸Ëº¥y°ÅC”FâàÍ–­àsÝ¶R?äCs¤}âÁÛîyÅ•ª6ž@Ûî94ï:Û3Õg³2vmÍ	.Û¹-.“®¹î­!_¨_Åà÷@g8ßºÙÎÞ<(gy•ik%ûï"Îöh#/ûåÿ©D®a#*ª!¸­Â’=cŽÂ)9¡Jƒ’iNˆôD•î+œñ•ÞŒ·4"·ªR!ôÔHm°º¦y„,5”-Þ cñdåÕ®æß·T+×ÞHË¥ón=S¬KWƒÛÌN¬ªŽiî‹A%‘«OÜ	¥+%-Wt¸˜å[oÅv~=äGT+.g?>¦þ†ÝöüÝ¬µ¼LŽ®îyôXH7t®qÿÍc¶‹ÂÅ²•Ã;´ŠÅ|ÿµ^TŽžä¨†S´Ÿbpý ?:Üî¯žêÐÿWòXªhÃYà¬gHfòK¶°Â“ùPo5Q®¤¼$ÐÍu[¬86’W©Ý·œÉ^3øRÃÆäÞt˜µiÃÕÊ×Fèn›+7V-Qg<É¹ð
\Ø²¤ÔwEM5€‘)­gŸ“"\…4c„ÝÐ¸›1Òµì«r¿iE–¶PŒ°¯zÛ¬FøqÛî9*õRæä‡+Ó~°˜³ï¨³_]•ö
ü6@Ï¼v}®¯Áõþ5úÖtKŽ6MÍÒ¦Liz%]·„7kÒ8!¾f#ZNIuÂÈWÍtXµ^*¥@eœhÌRö3	åâûFëZä0U†ÜÉ~úš…6'a)k·üK&e8Ò+#«|,ÕÎïd	Ùi}<6ãFAB±%—ƒÔo^/n~í“!ó5ÚU>³Q<³MÁâÖ©á-Ìà‚ú7(nªtåíkÅí™Ñlø7¸¨³’XÄdvX•«Zú^FÒ5Êîˆ³è‘öì–õIK(1~Šbüáë’®Qä¥µ&o¸óÎ=6†ÿæHP~Óï—¡€eÁe„¾Â<EÜJŠr(4~ØãÖ
¦`‹Û%u&phaK›-ÛIôzÏ r….1~Äb	–|ÏÌPHwnØï\Ëï´ålÛ£a-HÎl@Î<×u’7•V(±Ä+UtLmµ€¹âÄÅMõmP8Ï3é´óm3Ô0g¶lÉÖÉJÕÉÉÏSª²]m9L‚igÜy³FåuÛ@4Æú›ŒGðœ›H»šàE²êÍ+:`UÄ¸côtµcnêœ|;cî 0D=Ôª%¥Þs¥íÚõ¼lR…`¥¹5§p[È¤,ˆ`©vƒdz—,@"€~–E	Ÿ§¾d¦ù6×MèÄ›æ˜Ý«Âç…²Œ GQMóiïÄÁÚåÀNÆcÑEnŠ‹öxq{VKP\nJ9°TExóÙ°Ö¨•†‘£U¨
ºÐ §b¼	þ1×‰•:™%_<ñN%f;êYåËæ¾7ð–Î)âÔ#c<¯ ÛÁ…-é2ÇqÀCï|	¬è–”mK­<ÛÒÖ0Ëêªœ‡vÍ~ùûÿ-~àÙâh2~%_è¦ÑSL’j–:áJÊ£'»­ªn6¯ç¤–›Òf©@ °N&s”rïä®7ï©õ'¼œ­.‰KqÍ¤Óh.4Ñ÷ibÁWwLažóD¾©>O	yË>nçÿ¦4àóVIPS•W;á´QB.¿+Äç3ØžçÑYHs îÞ#ŽM~°^œt?67š^‚A«ÁÔ¬@šjAzüB[‹<¬Ä?@%·ÛU/b;ÍæÎyü÷ŽÈþ˜£§ÁÅV«äOT7ÕgyƒÃÃ³1ØÈY7ð‹ËSåó`êƒêŒ‹?/;"öýôZ¿ìaíQ
 ›`…µØ7Ìvå@½«îÏaU[ÀkÕOánõõÇèbõs?³hTz.×ôCÕx£E¥êÌFÿØS•¡0®ÞÉºb®*–‚ÅË†ºcØ-šÛ¼IIA?–€6É ÓùQ«Œ}*®›¥&¢<u7*³nŽÙ&AhÕ*fÉîÒ¨v4T˜·b(ß†Ñ±_åÐWî®.9‡V€n{ŒWŠØä’‚ªê*q×üìê³ouR|v¤Ð«ó „0ßÁ¥¬¨ˆŒÓcDäáÔi_ŸHLÉ!v®Bê‡í×{Ï^}w¸÷ãöîîë½ÃÃÏÉÃúÂ~çèö˜Ï0´x?!ûyBÁŸ"vŒ°R-Ÿ€ÏžÕ†²Š1‘«"hõ,©ÑO6oèµÙÊzÉƒÌ9¯R«zx'Â§æÅ¿ÌÚ}%<vÎ1ùA½y‡ëÞ„>úñ06ã.¸§œ¢×4Æ¥äe¿éuÜ[[gÈÆv,ÙhùlTe=;ÍT^ÅEa>uXŽa3â«æÖx #íéù&¶ÈrI¹²óNºí¨Cj7Y–ÅóË?þ1O~U
l™æÆ¾R–4t¢¸Ùû?(Þ¾ë§`ã•w[Éý?øâþ¯qÿÃ¬îb¢;Wá³®<hâ¾7œ#/©zåìJH¹`
/M^ãyÄ&!B7,m=E/5¶[]:¥²
†T‘ÓvË(H¼c‡œô l,™˜V¹æS©
Eãút%/t6¹~RqQKø³@÷˜næI²·(ñágÌ?óPu»]ÑÊŠäRKzèGžÅG)GòšûûâVÂrj0À¼­–““oÐêæl¼Sn}¯ì¡_®rŸÔí”l¯‡¯¢\Ìb¶Ëo`Ã”¶ÍœKQœÊ#¼®®ÛEÛ0ôôö/<Œ’è£R%Ýì3øÙgFõäW~øÿ  ÿÿì}Ýr¹’æý<¬éiR3$ER’-ke÷‘%¹­·­c©ÛsÆáq—È’Xc’ÅSEZÖÑQÄÆFìÜMÌFÌíFLÄÞmÄ>Àîí>ÊyGØÌP  T‘¢äŸcFt[,V( ‘ÈŸ/3—AõÓðÍ/Bódæ¿1ÍgÁ‚4¯ˆ	_”‘Zrq¦/Af’B<zPXç›àt÷‚“êÂº¡ð¤{Ã ŽÉcÖ`OfÑKöÞ‡½ˆáÇË£ºþŸß²M/—tžx6Î·EùÛ­7>O¸wÁãià«–š0±Ç²¤¦oT¾•.€"nLìx° µ1Ü½ ô¥ÿ€¡eqÿÛ6ºÛm¤ëº­óët×76ïWÞxmsãM—¡vªn»¯âäØã˜£2¢ç™f¾tîÖ•FûêbŸé›KB%V•N=Àô½—?¿8yuxpLðþv»ó€‚ñ÷®å[ô®Ã;kü×Ç´.'•åx’}˜ÝOîMöùH;xB?;/óŸþù¿‘§ù=Ì.ô’Œü%Fiú0ÐO©iÕd{R/¨Z·z•
õ;—á”âLpA(£´¤;±,v&IœÔWD¦â3„t fW­¯¸EßpC8ìSj¦I÷Â°ßZñ`®xX¨3½ãºx×]‰¾fï>÷×c&5KnüÜ¢«~};@ ¸c
.ûõo.û—=Î._´Iþ\}öN\™èæó`v? oDù…Âƒio@ïž:€`7Òé®ŽŸ¾øñÝþî‰)I[Êçû/Oÿ	˜ü8¼ ÑÑSN^ç	€/QVmT”eÇ^|ucŠý±’o‘Ò÷|¬«ÁìÔ¤î€}îi fa×ü£&$Bkä}„•Ãiµ±0x¾¤EúVæº1%{=© 7,Â	ßõ‰Ál©õ_“ÀÈ“•fÚô–Ÿ+¤ñBõ¢~xÌ†ÓZƒ]±t4Ø¦$[É´Vˆ 7¼Z±ÃYyL; •N†Ñ´^kÖVßtß^/Ö°2UÙª”®Âü íÜs•ºÃ÷ýàrIsäañã‚æ©µüÅê/‹ 9ÿõûìm|Õ8Øïz÷‚òF–|áûp[ÜºñMR.‘”éOBÆEâY/g£Q\":½_5…5§;œ¹D†¶-/*DcÞ|íµ\ÑÉÖ6+O!·pEïˆµª€2üuOú	^£—‚|MéJÊ´Ùë dÆeQÎ&|mË?°PÉÁÛxéLÝ«Œ°«K™Ji LV–öïW¨f½1ú}K)Ú«ZÞƒ
óe×·¬ÕŸóÐ­¢”:?âyif1Â}ñ‹}”mŸÑËlô1–?v«|$˜üœB±EæÌmû¥¡ƒ”F-ëæ¯‹ã\ƒ†|-•ê–ói§JžJ_Ê•k$l¼Ëõ_•Ð°Ú^“*©âU%<ñ´_„v×Ëôëî¼B¶õA* xGü'ÇÚ‹Óå°Dœã^¡y:5XÄ…ÅÙˆÊ«	PF”…™Á¢yG\´¾ÌéÎÉ:žPÚ,Ú†ˆï¼,#A{ù™Ç]ËgRÕ¨×ýB,(…lP :^µW¥)¬„í'Ÿzhù…
iÄ³	jä×µÉK-P¤Øç¦’©#}ÖV»½¶EU%]æ‰«{Áôÿ°/ÆàNOµˆïºÌ{ýp1ç5y­q´àB.+Ü-q^Þª@=¼÷‚Ï)§Ï£«MŸÁ"s÷èõðíqþgr·q=”:éžÞ@]w¿ùçvæ¶¾
œŠ0õµ7ÿ¸Ûü‡vóáÛµó«ÕlI”ÔM€ßÒxÍÇ>ŠÇ±5Ÿ²ÚŽ5Ä[TAµ <­—æ¹·™ØÑÎ @Iª Oð£Ã_îlúî÷°{«[ó§~£`sdyÀH€¾7¬€kÐPkšD£úª¾ô¾Üø¡ð²M™—Šò3û¤½ìeU¯§Ø±ØÍPYø1 j.›¬7`‹O©þUé¨Êœòã§^9g#tŠðü»4D¬Ç9îs,D¯EãÅ3$›†J“vO´:ï4ýªNÓÊwWY¯×+Xç*@Wsë×;›#õeZQz0&,ÌÒ_‹›®îð½Ðn§|%I¸ðÓ#p˜œüæÏæ„CfÏ7~({›Òyá³-
meóS­Žf[œö÷Ø1iKùïí‚½|ú´tA<™^ð£ŸÖD#–~¬ËÃ rá^óãW.}l½ÄMP¢$ù$EOžÍr£)ŠkÐÚkW4ü±«¥BõKBv	\Mub•Æ•#?;èAB×¤MN”’&ÑJ£ýj%ÉR¥·ü®zÏuŠ³—öŒ)¨Õü	™¼ûÍî”+Šf¹„Û«Ã¥­vŽ±¬¼³|ûêU8Š?˜eäòOÙ¦Zž~eqŸuXi•V—]v®b¬¤sÃëî	Ù«Û[›¶ÔH\tÃ£n“YÒÔë~
¦ƒh"õvƒ›ßÐîÁš¬žùkV÷î@a>[EÆ•=UžÂuîlê>CV,9CHÅ	ù¢‚)×ççJÖjc¿÷ôšÍžL×w¢Îªå`Í](n7œ¾ŸÂé î»­z|~}ß›ºÎæ>#âª×f“¨6ªÆŠ/Í!çÊDþÝÕD7áˆ–ŸNn><ÊEó!Àv—`•”p^‰+ÏÞüóÑá‚Ð»£T{n¾ÄÛ2oªü40`?¿}%l>žôÛŽ®øih€ø±pÅÊããø|"i0Ê?p6ðÛtÔ`»ãK†}Ãá^Òë¼óvõëhÈÊ]4Ñá»©¹xsR®íoAª½ß¶íz•ä~Î§ºÚŽsÐk%Ioöp<¾\šK`I½ éf<‰†ô1¥\Â\'åhg/	ûÑ”°jêÈÏ“-ñÁgÚOá_õ’™Ó/Q4@zÃšò¸ìÀ’FáÇ/ŠU¢Öå2#Þå§ãFÞ¿¢xû*øCœÀû°Òû	íeÏÂ!–ÏûqœÃ;Dm/:Bœ 2•! 7H—H<˜‰0+Ù;Õê¢¬‚nçr~ðìÎñ$HÞÃTòƒn±ØˆBRF5ôµÇ¶I¥Ùô,âœå=òí+ßUì_ ²œa$£`8à$f§—è‰EjÒp¬ÑgÃhMñ—ìíjiþ~6áQFìíªcVö¦3Ís‡Šš¨Bã@Wî7_{˜½|æ%´Nƒ¬}â[üaôx'&ñø\—·A­ä—ÙÞ Žá]Ýnz!×’Ú`œîvÈmQápôÍTÍ"Î}“[ºR\y<…ùF;kØô=„8D,7ïî17äŠ!cXfÈY@õíy½4!Rƒ[;k0S'òE8=Æ¨*³(bdxñGV§`ìã'‡«”ø|îAƒjoËÛ£“¹†¹8œ.=:V•‘þ‹MÎ/Ãòn–s£Óé°Žö?±²<[üÞ/¿8fH÷}®<ît×Å<•ÌÈÎÚÌ•½He§ÑÙbÒÈmÆ%vy£ZQÆmTžÛžá€×ú'²òìEIov9Ò…$¹ÏËTi–¤;»œ“ï±TÉ~ÿ¹Áq˜gqÂ«`UvY¡`„Ó¢øIàÈÐÁzfÃeñYßàCšˆ+m¸óŒpYáš+%øI˜kœ¢U
ùLfžãAóá‡‰PýkÞÔìžCéÉ%xö(eDü*gœ'!Õ3Bž§Ÿ×Ù"Lée‰™ÆÀUðç+þýmtv~,Nÿ=bO”ÝÖ³^qÓ€`ögáU2 ê†O# a…¨IB ™|æ¶–—èØeÅ˜€Æ/þROƒ…“­Û,öš%p³(Q„/¸_…¿Ÿpà
Üfª•ßÉg¡å#D‰À†ºr<¬òLïÎG·Ù¯x÷÷Lm ±—k¿ãÜð›Û^³º˜7„t”ÆÏXŠ²WŠŸÉ4²³ ‚<%N9 +ûáxHçnó‘(òŠ]>é‚rr¿(Ìè¡¶”'ZqÐàé@,Ì¨Z)œG]ÒiL…Uï°9*\À­h°h6Íß¯mèÊ¥M'”¾s»>ì´E´êvÕ]J">*c®£1 íðÑ<>W“êˆÓi0uÚ:ÜÞ54>½%!½/_í€úòÅÓÃW?ì;%'/ˆxÐ-	×r˜©è¶gp'pŠ¼OÙÎkþ £}YmõM›"+j{@ÀÏ’Úõ=·¨Û½‘¨»iA˜Ö nêt¾Ð<‡~€mÿEÜùÉ`t.$ü\ÀÒéìÝþ„ í3Âµ¿lyƒ×·Eã$vs.ãoÌ*i^¹º:Ì!3mºüÏÈ„*•C–ðÎ·Š¬ÃÃÅæ¡™­ƒó{<ß—¯ž¼:x±wÀ÷}%<–­´©ÌU»–®L½÷Ñ/ÍþaŸöÛñ³f»Ýíl,‘.J¤Ë9 L›„gì³ÚNs$NZ½a49áÜn]$@S'0‹uhÒƒlÒá‹5.,½Ê‚8÷a`Ä-ºáQNh”ªZð 	5mE&+ Ó¢¬ø´q8ÛU0Sî5ž\JÅºf£@‹×{´aØoe´½ZÇ|›OV™¦‘åˆp!Vv*­Ñî€Ú’®*©t`p(Æö+/9z,8EÈ®h=ßàÛ½€ÖÆç,û•í&Iô+‡Â1Ôé6;› þ§ a•§à2õ.¹•Û,e7Ÿ"·ò;i¶ÒNë(…?Ï#ô†ý{‰LAŽî£BFö¬Ùiƒ]„¼VF'SË)~%cÑ#IúáŠµ,_Þõz†<ìhê‡Af%C¥NTës#,·Y•ˆ6¯ ´"_rºZåeÉ~FÅƒŠÑÐ3nÒ~_‡ }PÖ‰Þ_øjù(¦a0âƒè)…WóJàJÅUœoß]©é‹®[óhÓ–SÕgaËkÁ¢úrÂÍuGI<šLíÆ¶+	µÇøS|É2a´Vµ¬;2Ý*Z­ê¼íªÞ[VÚ3lñ&—’]<”žP@²ûp}9lsþå2À?(znÅ‰¸é)zpR™ÆÄ²žG¥³²üíšì_‡5Ø
è¹‹†r+ôHñ‚—ÄF >U+,™‘O/m±CÁ70Ç%ñ‘r_ØíõnéÑŒ¯,!
1/<‰ë
I{d»4œgúõ³ ÖÕçK.s–¡ç©°±u¯ùŸ¬"$Ê¼Ã˜¦cNSª*(ÚÓ3—a¾Km,!TYl47;‘´¹"/T¹,!Óåóù1ÆÍ:€Ó<N.í¦=·6cÒ©ý¤V‰Tt$j¿·@ŸÎÛtâtÞ67eZ©ÒJ‘šcä¡J‘
ÏÖiQ±å«Ì}¾`*Ûª»„V¾¼?]r“wJ’ê/˜SˆkuÏÄrXVÝAbvÃ¶ówí«˜oA‰Fz:o£>œzBZköÄ{41çåŠ'f‡Ï·ó¯ë´S·öožåp;ÜÙDÙøJf%×ÜTÙw×–ûÕº)pô§Óq3{ƒSÌì§ÝbV?Ö¨šÄ*? 9É™:²“Ç!N(†ÏCeúêî€’_<GF[h¨É{oR'4$„v(]ÒŸpœŽLÝE}ÜTÀ¤»]5xÞ
œ·¢^•Ó«±†œÐ÷Ù3à/}3cHÕâRŠtÊå¿5¿b(ìç	(°~ÍiÜLØÈ«ZäeÜüÅÃpJß&ÍûEÉQ"r¯ž
‘)³ä »9Ð_Ò]O`ÚýdzÉ­¶ÌÏ•Ù‹\F[o]-Ä
Tq±:öD˜ö‹¦Øþ‘—B|à¤.ˆîÐ|?‰'ÐˆsNîl"3C€ÐæÊ‡U¸¤±Lƒ`³tCŠšéJA}Uw­WýáJcm•’ÎäirDRÇ¬í {»5ê¾#/œÓ.å´FÍikKhI¼—ÑÃ–³Ö‡—ÛÎ	hï=€WÂ-e™uR%ÉužTÞrÖZSûÙƒhxWà,\Û/Bí¬ïû<¿ˆlJ‚&ÓY^Åfð²ïT«Áßæ¨r‚€Öôb Û„€?ÁX¨hÇ9«Ï-„hmùÜÓƒYÍÍÓø<„?“èAõ5ó¢±D&ë#8½x²ÑËüžíI¸(Ø¬0ƒe:™©ZÃÒ’É£~AÈ±ÙséÐã{½ÃSÙã»©¯%Õ§#¿‚¨ï“·‰ô%å+„â?¦sr(„ô°i`«×Uø–ëYÌŒÁyšZxXá¢V~Â:C­÷âT|óâÛÅn²Úü£øU~+øy2wþ
Q±¸Ø¯µa6™]õµ)*ÂÛäå:²AÉ¯¾Æô:šþ)w·Â‹
ŸÆëî§Du¶âcôƒû¹¬ÀTñIñ“g¤²èe°ü'š±Ÿw]æ`W‘k‚Ö»\ª¼)ÝÝ¸  _¿»âÏîf¥`°Êêµy9˜€äBötÐt¬Æþ†¹nØÆJ€¿V#¾]¥ MEÂÛUkÖT&ºÝ¼°Mb«Ê~nŠ²^5\¼™”¢–¾bsÇo‰å£1m~ËjÁ˜ ÌôK:
,¤žsˆËÀt9}_%Áœk›ª{•J›u˜Záì>evqbWæ(¸ mÛXmÑ£.o5€[9ödtê,:R¥9’µËÓ¨t#c[+Ad²ØÇŠ@kíÈ‡Äc ØçòpÈÚ<Âu²åq”G2ÎokâY½Ñ?oÙÜåÑªöD…Ø3ÝåÉ‚!TŠK÷ú¥	…Lïd¥ªÊì¾ppí<6gdxi¨måÎ­Q·]xñnÁªk±n@ÔüqN^§ªG¯$4‘téx4Ô9îâ·Tt£èœ±c—f ŽD<ÌåÓs:Š±À —O­)c3®ÀhöCZPÜ…\v&ÿãßÿí¿VÛ<@ýøÛ2`0síóíIõ‰~È‹B]ÍªÅà7Y1&7>¶TÔi0^;f<…IÔÃê1¸	/À<ãržêÄ”ÌÆ=,²Œ/ü/ó¼ðIœ¿®_ƒ+T<DyöÇR$µë†íyªg¨<+¿×° ºóíÈÂ$”ýî6; Î´;Ži|:5Ÿ;ÓoCÑ7W—ÎöôÃNE¤`‹‰ÚŽœ]ÛXÀi8Œ/Z_…0+fü›8ûg,Î
¸Uö§`r?g‘Öà~w.Î
–”uÿ5É³*…}‰Vvÿç Ó
X³O"m ˆ[ž`q‚ˆÎh‚.fÆš€œ"í$3’J¾l‘öOÿý_þßÿþ×yd¼Q”“6e6Wb[V•0]l`åñSÄËfE¢é@BûÓ?ÿÛÒ¼õÜ›ÃƒÔÄØÝËx¥pC‡˜§‚¥ÝOJ3÷ëÝWÏ^þ||ðnwÿÕÁñq5¹ÐgÐ4çîë°fæËñMü3–\ûmŠ9ãùŒ%As£ß\TáÇUdÁg³SönK_— hÙ'õ Ž¯^|Æ3ç¹…¦”Û¦ €â0Âzƒó°#„JN‚my"lèËÿãßÿõÍ#Â~Ì-~Ñ‚œâ·ou¢o h*D£bñr0/f;,½hC)*ßP•&Å§(é~¯ Û¤žÇçQ¯ P¬‚CÔQˆT+/BÑ4‚¿g‰³;šy¼ŠÞÕBÊøEó”l9ò”xÅ
=h«í‹Ó¯&dØ„”ò%‡fèÌ<ùIÔÄä¾,<‰¼í#ÐJ¡°ÖSdœþ+UJäjRªô5ÚwQ.1;ý½<{w'´á%c`Ç„U9¡†2ª“ÕïØóÒ`—a]1YeJ¦9eVQ…*ñ–ÔèÅÄä×®á•ÜÞá±{P0Õõªí¼òÅ’V¹èˆÄó¦© CßÈKÂõÙh|×k´:Ž/,@Ô,¡]¹WÃ¢ÒV†?PÔ6;†¸Û.&pPaÈF"@3wCžü¨R/J²+,½-œ©xâaBÎOtb)•*ÇV–cÑ†²ï¶>¯òìñŸò´²—'[Þae*°ŸðÀÊŽ&›]$ÖÛ=¦\b0ûÓþv” ˜Vá´Llµý" ‘ó&	¨rÑW+M‰¾t©ïylgW7lµ]Á–9V–’
C/ÚìlI¿Åì© -ÂË‹à©°±+ÝîÛ7ç‚<.=Qø,Í&“’õQÄNåbÕùr*ü»F¹Aæpžíg§w¶ù¥´„¢—E„µæ§²ÇÍëJs$ þ¢ð£»SÉ¶‘‡W9¬.K›%ÝmÅèD,N×‹c±ô•ÐcÅúêt»Ê¡èù’xÆÄ§8åØ‚·.7/®í2ë+uµ]·ô£” 7*m£9²>èiñ\‚ÎYÔ¼MžŠ®ú%#Æ¶^±Zw[•¢²‹ºÊ•VGÔ7qa®wËË‚‡2Q³Œãhµd|LC	ÝÐk„_;i%³3@råí/`µÕ{í{·L©Wrc*¥è”odš2¥ù¹!Š¨ …”žýMø1Àš Þ¾ê¤¦%ðÐo´©|Ú¤ ±Ò¦<»)óä!k/f£SWŸù)ô“É RrÂØ:Öù&Ü.«Œ7$f=&r!š>&e½ÁžÌ"Ò=ì)¼{;Ò~vŒÃßHövI–¬67#U=»‰â
!ÄøÑD¼ýFK%H]FÄBgîúÆæýŠì1!â§"g±ÙÕÈø³£Î=î,ó'w~#½ìcòB>‰7e‡2d¿)¹L_W{/~qòêðà¸5
&õv¹s_ÔûðòÑUïZŽ¿wýþÛYã¿>vt´³Æ×ÿ¦Øfµ—VÌ£k/…ú Z)Toê&éþn9­Š;‡ã³X"7ÜÅR|ˆ½jcÇÃL7%KÏm”2øJ	h	°?”è}zc_!Œ9ìÏ¾!q°<Ëò¨‚~8¥=Í“,i1	ðçxÓi¨dYrw±ÍjR™$aó,"¾ ³â‰|ÔF°B–¯i÷£³Kè3ýŒÃ°Ý8‰|¾”ë…Íb‡âk©Ù”q×–2·:TæòììÃpÜ’Ò„füØÐ^ßÂ*¬YÌü–ô.KG…¬Vv,öÕñ³Ã££Ã?¾Ûß=<‘R”[tø0üu8ˆ‡bvo”×;VòSçN!WØ(žÈµtÍ|ÂUº¢Üç@ ´­	Ú°Vwáòuï±³6}U¤¼/ƒ¤Ìy¿]VÝé*ƒ>õ5°“:õÃ³`6œjP'ŒíG Ó_×k™)q,²~S³¶ú¦ûÖž¤RöçNØ¼ZÕ-e…lúñš²Þ€Ê¬–éôžZƒÁD¤|ÌÎ¦hJì*ž¥iãEìätj®Xi¥ÈuÄpøhêµÙ$ª•Vîts
áI…)Ý †4QGÁE
É" 's©ÑsÑì ¾¿Ó5 BJÊ÷R¨
+2+]DroˆQåx!­ðy^3}d¦Ç\yücŸC$Ø7[…ü65Øîø’a»“É‚fdÉhØfÓ˜]ÀÞ(»|î“ié¾í<+‰&qöå	ÉX™îqFŒ”•ˆsÌìb»¿ì3Ùþ4”O¾ÿsPÖbÛå±z48 i…Ëg ¼#àûá)ü‹=.…ü¥Aƒý`M&\Øü£ðã°ë+‘Ð²¶=ïìÓíûÊ•‚p¿²À•Is+ózÁÄ¦–&òI%–m†+ÿ+LŒP¬î15î¤”«dË[·×°ë“"-E]W+5¥e"!ÊÎÀÕÑ½øÆ£)•ðçÐuŽ#´!akªÔ(…¾„]pÅ,z»1© ²Tz­%@údC25”òŒ'ó¾”•ÝHŸïÐL™¶ìGR
È-Ôôj†yZ)Åƒ¹ÆÁ0«¹ÆË›…¬¦[O6ŸýæxàU]O2îÌ¾“•g6É%,H?<ôŠ¾J"ºë„ìg1ÊEm	·.ì ÞûKXY½„	Î^ä¥jðTšÌ6é
ÊV—ÕI-Bó©¨îP…Ê°éÕîzËŠu¼áïgœ§,Á
ÌTƒ‹é$‡û%ˆ£^˜‘ßy81 ¶Ï‚3
¥Ëbw$Å2†yþöÌIUiÈFŠ öYÊâ3µÞ`4.§Úî‘¬2 ûb€“ê%4'uYh„,ÞÊB]t	O­ÑQ²¡qy›Îî2­ÏWhb=3@9Ë['V†7œÄSX{²/£è†Îð|åñ•Y#ãº¬£Û4“È’,‚¯Íi½p1Çj{x£Ú‹…|EC§s­¤©ÒKÊ¸šb‹¼ÁÖ4~»©wW¯Ù{OZ†Êh®e½vf]¯Ü‘«K™†?ý—ÿsUW¦‚ý5ÆºñN_ÁHÓ7F¿T’¾Ó^]U'm»ªû2ñ*×ý(¥^@Aÿ(“NöÅ/öáµÝ!Ì&³¶»àÅi†”cé[d¢\•yãi€'Ë£¼“¿.Žqšq·c”L+~ªÓf§iV,Ièä*×èÖx›ë¿ò®ÚZ‰“&¨­‰g}ºó\	ñÅÌbU@k2¨ÕºÕär[¼€Ú‹Óå0@œÜü™iÖëõt6j°ˆ›™f#ö7¬µ&	
K¸¯VðßM7>HNÉî„lM(¶‰HÙ »ZB~â‘²R×áÑ²ÞÒg;'fRT©œ¸kæ¥ö³aF^V/Ûçª’€'1ÈstÕWRÜ³¶êŸ²°òl‚af“É0â^wö„Ô;[F¹â`ÌBŽ—Ó‚´ˆÉ^@"u¯îØØ£)ê4®þ¥˜â+x\²*Ö…u­Œªw+qÖ.å¢MŸÕ71=IW½8,Û›1ûâÅc„/ôÜ ½÷‚ÏI˜}tµér”òDÑ‹â{â üÏäX©z(MÙ{zuÌægœë=˜ëú*°)ÂÖ×ÞüãnóÚÍ‡o×Î¬V³ùKÕC·QunÍ1=ŠÇ±ÕE­XÏe4#7s6Ï“øBÇ¢Ù´¤¦M7n"M1»÷âaœ¤*²¶Æ?:öåþÁ¦ÿ~¬ZÉ×°‰ûí²I´ä{Æ“Ó•Ô°æõS¹æ5ÿp‘ª¤´7?bu¶¦I4ª¯êDå.bÍ?(6fmÊrˆ÷€Soº%Gåe)iG˜$qR_\[c£Ê–!?½)pŒM²¸Áß ø·VJG%Å“²ûüûBÎÙ(˜âa›ÍXÚ:ÂäðÂ^‹Æ‹gS6•&ížhuÞiúU¦•ï®²^¯WÐÆ3D}Ì\ÖC,´>…IŒàñ_ïlÖÔ×kEé·
/ùEE‘- ht"È¾!âXÕó×S\L~z•–³Òó–K“C;È7~({›ÒyÑ“ÁÊ™‡IWÇó.„&îDgÏå=vLjZ~sA©a/Ÿ>åêaé9KÜó2dÎ‰[>–pIýpS¼efæžÎ9ýt5ro0§ÄíáVÍ‡›Ynß}'#9óÒw¦x€RòŽÅeÚ,jÙcsÛ-5÷[{­ãÊ·I9s5ƒêœ¹b]ùfýRâ	¥áô°œ³O_É–¶äÌ/I¡êpY³®àLÃ’	iã€;YìÛÒ|®ÎÁ˜Y9×¥Â–Û?®4„s´ÌiW­¬aµ<ÏlI:Ü’ŸKÅ®ªB×\"Wá@[I	û³ˆü5WÒïlðyæ3M†JÂQŒæ!¿¸äe¸ª,j	¹ò§”¨îºÀ&µ¼&Ãó¢4ïžu]¼¢WôÐ…Ÿ7ú˜Ÿ=}ŒçŽÌ—aQwºÕâÈ‚q4ÂY?TJì5b`Šé±dc–"#$·£éí³Þf…µ¶¢•lnóÌœ|—F=UªúÜ„OL-‚À6»#œšùí•]"Cu‘:–ŒÖÊ4ýL­Qð±Þn°|›lEEy!{J[bÇÚ.Çh¸Âð9ož[k‚-t‘NƒdÊ0ô€ªì´aÔXªûECñ¦zEŒÉã'—¨¡žEÉˆBÕÍœ'aˆ(®ÔŠþúqïïßM[¶ŠêÎÇú5{˜Hi:I?n›t¦Ù0$(‚Ànš·ZB$ÑÓêÎÒ«Á®2>“ùØÅ²”…DÊ˜5LRÀAA±F‰?¾³Ô‰°ÇÅ_J"dý`3'Ü
P),õ¬¶Ç×™e’Wáïga:-†Žm35
Á²½”Ö¸›»®`¸V­1sÛù#ß#XÚìõÚ yìz·âhÚÜÂ¤ç[Ž”ç6ÌÄÎ`£BŠµ<)ºÓ{}cåñQ¢ÓÑ-ž0Ø(c Ò‚nS(®Ž^½|vøäðä`ÿüï§ãV
$"wÝX¥ ,ä® ,ê‰‚¬ð®ë
:+!¼ûØÙ†Éô$‰‚1âàêùP€É\ò|4¢êÌÚ£#Ø†Cª4¹Ÿ‚É˜âdÿ…<M×óÝ|vÙ®Jšvã‚öUùBróuƒ½Áõ°tØÏ24˜sÖ`‚¶Á—«¡úÅ•3¶Áú§ÇäÏUi<¦Vjéø†^Gû/òÉ+:Ê¨îeÄ†^:½¡Ô¸o¨çÅÛ…}Ü‡}|7{V_x¯ô§ø4bGdîŒëxN¦U¹Á4áAþNs§ëG‹öÓ`çñØ¸6>Dç0Ë'ñ[X—¿àVÆ`6<	'Í‹†Ç¿Àt¢qsÐL{	Js¥x\%N^ÙN;Øe˜tÕv¥0žÂZ˜yWÄ.ÛPk¾èß‰Û›ù2?Ïñ0xÄ‚ôrÜcªÆ¹W‹ŽÐ[
/éhÇÛ	¨ý³®ô†aÀÁz<0šÊr€_VíCõ•ãƒs*yA·b¸q8ídVjp—ü	rÅ–˜gýÍÛü
éi—äcŠŒ+žS¹ñËaú#q?1ÔÏ‚aæ?Ñ”/×‘žhxÜŒÔXïä¿=-ùIãð*<+t%üéðë‹ð‚·`vz<ˆÅ/â0„‘Cí.¹<Ýé˜—7ò='qD¬äñl ¢¨â|üR¸&1k»4'A4e©¸­…DÞ÷Ê)vÆVV“$7¬÷h·†­‹ ×kf?êHÈÄ¾]kà²ÉüÔ4¢é<Ñb­&×"±]~AdË/è™òë<ýMþ(N½åQž‘9"²$oÚoù×ù©Ì.=ÏÁ¬l"êˆŒêó¿Ú;Ýçqÿ'Ái]&=/Þ’g³ÿ2gGªm¹£ü±\RÆ,8‡Ÿ@ÜˆÒAáä'—¼Q$}E‰™nü%DÀƒø½Ï1#nÜdïÏ÷OÂ^›&3ªå“Z·Ss'—õìÕ‹(³ƒ³38‰‹Àº!ïósÜ3€=¡ú&Jþ [°üôÛY0žÂªlKþö4	ÎáÌ5y’üù£¶y
>kã¯€¨’÷ú<’`c¶ù’‹9‹ä¼•¨›—ŠÉ~kÏ"¬ŸtYÃãLÿú?™gÚnŠ¼h÷œãÅÁ&¤ªmÜ¥¤Çç´/é6ÐÏàµÙ	i¦œ*Ãä]L’ðC‡WjqyFøjc|0!Š4QÑcfÍŸ—CÓÚú¡Ð¸Ã>ý,ŸÒ¸u0‰Z³	Æ¸Ó#õLT¼Êõ)­•mþšˆCMF‰òŸý^œ~÷ü_|‘íü9ùXîèË`||yü—ëT@ÃÊ@[­VìË­Œ.Æ«\¬Ã »Ã4f|Be	‰´Æ¦¨‚cÄ€<ÛÄ^-ˆÓªÇY%Ûª‰?_6Mƒ¨òVHŸªKWõºæÇµî×ì§Àôy¨’xqÅDñ1ðXŽ|èW{’SúÊÔPjÏÃøœ^e—xãI,[S•ÒÚîññá/jê;É×-^ÃêÕ«Œ²®ÕËšJC§Õª	ú —ÿæŸ¨–f¹ÍíÙ«]³˜½N¶Qç~¥ýËKeÍ/–_¿ý—« ÔqT„B$œ ·ÔD9FU“.ðJ.Ûqn¬©G^åtŸ7ùtëéîÓ=Í´ð0sýÞ `˜qÅ“NQ“ÙuU¢’^ÁYØœÆþÇi<Ålõh—;ÆÍÍÞ0šdÊ.r,ßßìI û[2»ºWÜûè‚É¯¢‚Ê¯åä`±K“G–Éèð29®-/KëÓ"ÑRÓñA'yóüÐI…ÐsxïìS©H£aWÎîxOÙžœËû9E+2aoÙ1/”ÈP-Óƒ¯fáR§)Vûb©²ãª~…§~k0±|ÛŒä`¬‡&rrºïY§ƒújá8Ö¦ƒp\±Y€+³N¯XF7Û°CÒ–Ô½öËŒH”4[´ëY"{ô–Í—*xfÕ:D§ªð¬¶±j¤¤^­¨¿´n5r¹ Ë- K¿©úUg¨¾Þ\ÑÖf)ò‰eùŒ´Ùƒ#‡M¢{wž£aˆ7„ãt–„ì—Ã“ƒwÇ?í>Ù=>x÷ó«çdÛÐ¯î¾xùâÝßüŽ"±˜5œáT°ó”]Õ×®ÙÁøC”ÄüXý%H"0Ò–öB‡¥0³p*¼
¨…ÏÝ$Xý˜SWNµ3à¿«Öä<zµÍþ€Ìç"+¾J®¬¤ˆš{?[N‡³¤9Ê<#5îû?ÀC¢È!áÇþ)ÿÍpM[¸ (ó¢‡ÜnhÉ¶PT‡è0ôn;w„˜¬Ç<h‚Í‹æt¹}ä©JMqö4g;Çƒ(öK+)rwµœ‡ÏÙ™ý¬˜bdŸ7ÄU$o‘8Ø©ùZv•ÍÉ¯¬Û*¿ BBúK‘Eãû~”Ž¢E+ºT‡*RØn‡Es¡æ=¬¹­Ön:‚:yzƒ7íwÝÉÇwü_sþ—œŸõÎf£»ÞØè6Ú­öÆê[fì8JÛo;Ã{NÉŽŽót´ÿÞgÃsüw8l`½š’t9²ç{!I`_$ÁÄ Rœ5n0gäÂ@Ã.k²—ãá%û¥ª4T‚áÆ&á+-“Øòß˜ 9ê÷˜‚pYlr×ò¼§5!¾UI7é”ç¤[C¡×qÃ.Ý°ªóëâ!Ë‘žÉû®ÞPðõöF7ØqÇ™Aãuœ¼ç*»ž¥–·i)ÉÇ«Þ«šI”õ…-0!"ÁÊt·Ü ù €°¸»
Ä·¦ïQàV¶îÀi&&Âu…¿aÔN†ê8½ååâpgÎí"¼oW‡N“âHêã¾Ž:‹•wC%Èßíˆ[ÞóíŠŠûbŽay-°"…QqKt(!*²lJÆ‘˜¶87÷”ÉÃB¥öxBà0y×?D½ÐYÎ’x€:Fm–?š²}8µàð;â]ÄÍ?
‰K	Ì… ŒÇ?!º„2«‰Yñ…‹JUg°˜hèy|Ëâå9“¡ú“ÏZ³ËÚú¾—Z®zBàÔÌ]RêQ@‚.ý0k¥Z©	09¥¾Röx4%MÍÎ’„}@pÄ¬¤ïw>ˆq=&y¾·S*ž‹›ßøA–à-þ¢”ÐõtD˜!¨þãsž¨I¼™¸²‰Ç¼Ml‹&rø„ýàÄMªî¨ ‡•®´ä»J‡Îþ\yx}hbI1Î°^ûÐ÷qÓÚp3@>9ÐŸä îÏ:tIÿîÊF8¿I<%±xKh^ùû×Œ¹Ûà‰ÜÜq –rÃ.‡+%aŠ÷¬Ø‡ëÄ7‹æG1e#æ%‰hs]]IkÀ6k7ü¿ÿP\h
Q$ÐZCj(o§SÖHø1šZ†²5×Hr
À¦äÒã³ Î04`ÀZâ?/gpÔ”4¦âKNÓx8U|žAf²NJP§ýÖžlÎ‘:XÑ¹HßZ¿oÓ·¶@ß9	Ø•‘~\ä™íÍæÙ2…Õ? ÜˆÔªÅ£ªDÈÎùªK*œKVôŸm¥!„¥±¥†”j7%«Vk‚ÒâÛ¸¥f<O‚>V*hNcPÊùe,)³ÖÜN·pÒâ_s¤+ÿÎÙuöãÔ8ß9©™½(³øsÂÄç'š¢Z’§;ÕvÄyþ†EkW©jtŠ(ï²lf³¬´­þ¢XÕÔË<bv³~5Û«[hÉ¶jwãa£ƒû7kwsõ­7¶MÌ¦ì@¤à“àÜ®_¦Ó$~6ßt[Ý·Ìz”©cçÕý’ø7êº<îÌ•f,Ô«Á¿ùËN§³Õ}ð6³9Å3L’ÏxÖŠÂü+²EÑ¾Æs›|OPëòl<Ö¡«‡µ¤5áú1“øñN>b2Ä'³K^ÛãpÜ2hŸ‡Sv>ŒOƒ¡¬réIø¨Ny‰ n»}~«C¡|Ÿ¯‚á
Og5†›—óùZ®½ÌÆýÛ`¸JÛKg¸6´Ý>œƒßž$³Ü)qN«¬9²‰/ßÊ¥Ù´ó[‘ÊJ$pº[žûÈ"˜o?Áhºïyž`ü½ÜÄŽÑ\õ…q]E±ÿ3a¼JÌUÎ›§øjY¯’í¼W|éÌWm|éÜ·s¿ÑÙÚltæb¿Gb/‹Ñ¶7¿>Þ‹{½<;cbºî–ùŠÜ"$¥%!e{á«y.éùx¯ïžÜ2å¾ÏS«’ÝÌ& ÔÈmð|•£Ó’»ê˜Ü¹Ûa­6ÌË|Ì­Ç·` ž·Û	Ž7Oõ?råVòÓÚâkk0›~akÌÇüå¬ñëÁ%ûÛèììàïïtiSX8ùÒWŽúËYÞc>âÖ¶Ü-ìÌ†UÙsÉÃ`~;ƒ/¿ÅÓ.WqM®XHÂXy'…(2˜n—4m•¸"ƒY~ñG=£/`BicUÉ<¯T¨Ip£j²#ú?šÜj¬‘6Å´ËV‚uIÒî³¦žÑÜ—:Ïl¿:òYà-j,¦¢D\`uù#)/|æ"-+?‘XEœ¥¨‹ÇWÉO2²4*W™Ö"ÓÊ³	œÁJsI#ìu9]`™L×š^„§#ª.öm]ïz]÷‚i0ŒÏokeýçÁ<«zå\YÁU.SË­.ºZ­¸ê|.
«®˜òeWmÃÁ2'‘Áéokñ«CÀÜÝ%râ'ÛßIðSîp!ä<tÞ•..5&õÇD^†µ¡ñ“¥ LžUeù3ó"Â»•55VÞ-ÜSGTJÒã§1…zmIer”ùj“JG4Mº Rmiæ9 è‹æ&ö ¹Yžiµ˜oì1k{vÓ~•Ák02±ÙaM*‘†F5Í¯dæ~ó-\Í6P,Ö¾SjaU2øé»PÔXuC²Š…I‚^§"b‚oT›¾·~/R
P½ªPâ6n¹ml©wÞ]&ƒùã„cèjd¿ªÛÍQÙÂµ cKÔ@GPëÆjM¸a±™Tnà€•¶hñŒ´jqÇÈ*ÔV¡¦Æ;øIÑ/®r˜²RmÎLl6…=(2 Ž:¯ù è]y {û›ÌSBÙLÚ	gw®@gDêÛùùÆ  ôVEØÖÛFÕ÷Ÿ£t²ˆí ò±yíxîKiÜ§’¹ÐÌð4yÖˆ(ç;áÑ
oò<¾o¢ï½Vz«c‚³i{[oÁt¬ AÂòB…q—ÖÞò@ÐíÃÎZ
ï–	É£dH~j° 7t´sN ¢8P)úYa(6¾‘C ‰'ø@Î%žöª çâ0¼VØì†5kXâ-ŸçüÆˆæ*hfïlÒ
G$ÝpñHTkQÍRðºXU›o7Ç w¢ü*ªb~Œ…žß¾W(·%ò5d5·Œ(Tè§þÚ –v{zþ*,Ec™£S^ˆë˜ÒË @¤ÖúµÞÑèŠŸÎ'@j÷(5ö@éI®½]•x²+qôùìèÔk%€¸?ÔÄbhÑ¢Ïx²*4¨¸…4§±%ÿ“»Â³¬!ÒñâZ±\»*W£±í†¨‘ÁKÑÇÖ³¬Øò=ïz¡&–°¬ ö`"»oËªÎ+NZÔ$[×]>[7^X›ïC~ìYúÅsÞ\ý›”ª¿ƒqú]/èÆÝ~9E¨IM¼Z¿	-•„d>ŽŒTø…Êtâ]=xYLªQéæ/=5Ëëj”Ál…R©Íz&ÙyÀf†‡‰ˆÆ' ×œ‡Éq<Kza½ÖÏ‚ÙPå(tOûJæ è‰0úaHù)BUotëëB?'‹-¦¤@aˆ§¦Ø`“¯¢ÇaCKÞj›4S(WUP*ì0—§¹HƒÖò&OÚ(Úþ6¸íoC³ýÕ$‹DÄ{8vi>.ÒÕÒà2³xX3(TKã1WÞŽÑg*qš·ªïj†i‡YÚofZ¾aÚj†¶’`¹	ºÄè<§É¹ÄàŒ6arÉ¼|Fç­;7:ßŠÉÙmœ°Õpï[s?äUÚ›_
{ó!ì0ä;‚ú‹¶çRË³gãÜ•ÑP¨ž>›¶< …äjåGçŠ}Î§5çYeî.…©-xämY[•'wÊ.åŠ²	~
Ç3¶ŸFF¸2#Ù•,ó€¼œ„VÓ˜Ï æ0ƒñÔ-ð§m1f/ùLBkØ¼ÍÜåíI—8Äùk/DƒþðÌ¼UËaYTÛ‘ŸÓ1ÒÅ]ÒbÍZç•Fåt™´\¥_ÔÔRFj©-WY4—hQ3Ï|Ú+kì>Ï]®“g¹fVÀN¨EÙ0Ý&¬ÐáÙÔ[ŠÈžvå‡"ôA=ÜÀîA»æ¡Ê%fòâoÖcyáUõR9©6î
…*×«-`kÅPîh"+;ùœs¦º²G8/F–Ë"L—‰¡@°2Ð­R¬×H¯…Æ¶¹ÑAuZJ,7ZH5hòYË|ÈŸp9P;¾ fdÙB+ê+ Z¼øI˜×(Nu}bj+‹ÛºsŠâqXÇ¾¬Ûæ"ës[#ÚêÎW¦$zê¶W%CÇ~nëR€ÇÞùÊTG,ÃU -I\¨¹‘C‹²éj|ºBÌÍT™Tõ³RŒ ‰;U(ú…íéà4’þ­©£a¾­îRWWÄÀ°Ÿ‚1H?Éí®î²Uþ9£b>«5×bÔ=ØåVVÝ ³ÀŠßº•g®€X÷”-Yx¾JsÕÔì27Š-x¯\‘¯„‰«TÏ¢kwÚ»V·,vuîÕ­bqœ¢±qš‹¶Q‡jtu¯ÆO=Î-ÞÀþc¡q%¯ÎRÑ­o[wŽH4=÷‹9íÀHÞkÅåvrÓ•øÕÅ­þØi«çG<Yª‚Û-äö§s¢ÖŽåi‡Ž/è¹òX€®ÊÓÙØ£ó;è)»›¢Óc~0¸»W,B“wµ)Ë¿ñMeøR—%S?FÝ2#\ã¬¶$ö…!RáPüsÇÆG9ìÛVzùgN«0C.Âº|”ê2–zež•.ólW#…å‚Ró•º#Pªó±å`F[Ô¢Œá\E@Tl9u„$An@Ñ‰A“à©òc O:$Ûêžlëe7‚Õ 
:!;k°ëå×5^ø/Ãh>#ˆÆXdsŠŽJÀ^·"ê,õË@¬h#€þèjqš&«ÆŠ;ÊÈcO(€6·mÊ¿|ln¨÷m»ªŒÀ¡)"zéÙ2¶¨GeÂ!@ ÖBÅìvíb…gQÅó5OÅŽ-,^?‹ÆÁˆ»PÅ„¿ÏVáúvaŠåiX 1ÞÄ}Ë/…Fò‚Q.³»¶g,”Ïûß°hÙ¦ßºí¬ Ã
{ BŠ4p/#1¤ãºXÚâr‘Š¿(k[ü1'@ã‡|	‹¿e‹c_&šÉ)·<“Yªwž€,þ„ŸÙápãUä‘J…D¯0~a£¸Ç@uh«÷áå£|5tŽèFìpQž CóVGxa³Ø¨»"JW¿Õ€ŸÙNø3øã˜×–¾ö>‘ÓÝÎ.þ)ÒÅöœp~âsä‡¬úœBÎ°;Ûÿ<ŽÎ¢°cÑF½v$°"þ¦túw·ö:,øä\É´-™þ‹ÒC_LñèŠþ± ÷&T}¶p+ÙU®X0x9{¤êh¶;¹+{áÃ>>Q¸hS¿øØüâI81˜ß”ÿ]¼o6éÃæÀß~+ÎðŽ…k®ö±l¶ÖIv¡ø—)©¨-Ð­4’ÊïÅûsýâÑUþwñ>âœGIÜŸõp´¯Å»ÉÌÒ¤öávý»¥õA<Ù£bõQŸöøË	ßõŽ,-ÙÎÑˆó·b;|'Z›qþd}ŸíF*ùK¯c¹îz{®Ÿ,”Ï&p®Àp8ž 1¬ýî™¯¹zJeöý=DD¿ÃŽR¿ZÇ±«?`^1Ÿ1T
´:yßj	ÇÃQyõhjSb}/”+{¤ù[Pÿ«þry6Tgm–
£džûË2ëXö8Äý*þ°Îô‰¼)ÿÛÆ‰Î@›|þ~¦x¯þÝÚî+ã‘Â¥²5,™ãL–#vXé\×Ä¼§âK¥'U!pOÂhTñ<nŽÎGSåPÎŽîgÅs.#ÐéÄ‰uØ!Ï|æ˜Ÿƒ¶æ&-ýÀ¼‡u<ÞMSPè©‚¬<“”K–ÖÏE»çö‘ˆ[²?-l	³ó8‰BäLÙßv¶§Üª}µ‰0Ç°(ð¿X‚ l9¿qlÙÝÊ÷s³xW¬Ï¼K›ýi½ëËkò/ÛªþL"µ÷Oƒé,•’q¹Âó¯ye^óy~ùÓ°$[Ó×€ò¨¢b"
|¯„=ª_¿þ€qÅÝÃ~”’	Té%»äíI}Ðru‘ã>RE€°Îîîl+¬à`œCÐ]¿ØiÕÙŒçÇ›?¹êOmVS+…ßÎºùKÄÎAŒ’ãj—§(ùæÍnuÚ3àö k¦Î§q<ÕÂÏvÎøk)yžMÊ–®˜Ih2mvî£´»Ás)dÆÒ?47Th‚éK,ÚRJ§Jþ•‡iut/´Ù(ÜÙDSw/nuoÛô§Íû/u±äyÁÛi1bÛòe\þöé¨PEd(ŒáwXcš !ÁMÃÇššÀÆFÃ0Me•BÉµ¨za&71ŠvFQ¼Å^c ÀÔ€³K6ŒÏAþŠz)Ü€u7à´C³@°@ÿXËæ›¢‚§³4CG-ãÅµF…y0Ë˜¢ÁÆ\¹”|õw`Ùöâ¬ýåÎÚ`Ãèg6ÔBË)aÁes£¸ÒÃè±tBUÊìYb{¾™B	 =ëwêã«Œ§À÷2ÇÌÎŒ¬ú`ƒa˜Lë5y
±#Ðr{—päŒð[Çã{·8x£Û¾ÄQ}`ðwûz¯žWØY›«î€yqÅ³ô=“!bÌ=3Ç®ñ®âÃÅoF%œÊC›UùŽ³Ë”ma5¿=*Í]öl?œÑ0]Êåx˜Û¹/úbÆLÊ‹åZ·’ÝÞÐUÛ›¾M~fáhzPÉ­ë²,æíŸë2øöNê /jºèÑèš½=n‚0	"úK3%fƒ	nQ‰'Ëç-óq4J°½`Ø›A{q²¸¸a|CûqE±(nmOGƒ~Fƒ–¡¬OÃéEhË¤¥oJ§r´!õ °_×H]ýÿ'ë¶»÷Ù\ïyži2 ›ÃÉÞk±]™(7e¨"'Â~K›ºÉ|Cú˜*©ÂÔàC‰sÃ6aúžÎ†gÑ>FB&¬üóhóÕŸ{Ä•”ZSŸ•Ôî~Y…”s¨¢¥véÎñ xI³#É–ØåO ‚¸|üûY•®}»cgÛ@4C‰`Ð{ƒNF²(k²Wä0î“¾-\aêƒyhÈ¨¢´ šÛp‘©xX1¹8á'Ò£IÏÑc-¼bê…åŽ>RÊbž›íÜ\'êÚ}ø'i?‰)B"ÁÝô‡æ›Îzûmy„„¹W5Ü‹i'sÀ[ò×¨‹ì"skÛa/vàK…ÞôŒÅLÙà{œ)ŽúLà?•,ÙŽ
Ø:–³p¶+EßÇJÑ”¬;BKÉ[øW¤zµŠt•2Ñ÷%·ée»¨CƒâŒÏ‡r»¬w-àQ;
s°^Ø³Ý,ZÆ¡rEL‘$…æhŒlùHÅ¸õBG>[™ÑæV	»ÅÏî˜;¿ûáX”JûïðG4#j±}nü‚©…e¿°àEÌ&ð‚ ’‚^ÁŸÿ¡h#.lpÓ)@ÓÅÝ\(Xy|xÆ.Ã´ÁÛ¾À>OC¹)liôkN<	<¨oGfKþð,Æõ¬Ûè¦z68Ë-èÛ§SPý‘ta{’ÆÏ®Ù#VàtöâöÑÏeˆ,?½êè)ÕÕ¾Œ¬ØËeyédÔÙŽ¢iP-éÜïp‰ˆˆŽåbÒn(N·]}!rHK>¹õ+šðmF xž.r›a(¯œ(þ]—dÍñ˜úL 2Žly¹bêº…˜ºjú"n€Gg1¸Ö5ƒ6»¼ZnÜšÍˆÅÏ¢÷4ž!)Öóù=þ°1.röoá¸ßøvÜ.Ç=†dûEŒ|eG=ßB†þáNÎyÐèàž‰?äÙÍ·?`S‘Ù¬/¥„ã~`'øsÀ]ÅðÄ8žâAkÃVaÖ>ÝQÇéY”Œøüòé_K‚³¤Àupj|Âu?<—á}]sgàÇy"jTr[Gá^½ò_Ê1÷waˆy?ŸsŽ|3óê´¹Cg¾ÃÏ®öÝœ]ª*Sñ»ˆ¦¸¹ìõmiÊ«žû:‰™(…¯ê`Ï&b×fçyáÄÓmm&áè­zÄãÝƒæè±Wbû0hvá–Õ·†Ó›n¸°],jABpÛÀ6áå;m”2ÚÃZ{¨ñ¬M…gUKT_ÊË`“vÛy–
y˜ÿÞ¼êdlff	‚ÒÑ6ÊoÙÒ\r6­YG °ši/‰‡ÃÓ ±¹F£†äQD Ù*Ø¤eýÔzðS›&²h_eÆy³AïºVùš£¿×½²œ‘»Â:Ö«aÁ‰/b›D\¥!ØŽbPýOaÞC¸ë)%	îËqÈžðÔñ4œÐCµ×á°Ö…ÙÜšDÌ®u2Šb&–úe5[L4ÚkÊ¥ÍŠ³à°S`Ö?Qt7NX/	ÑŒ™€Ô&ÃprÀUöP¬-m¸tŽÝú%LFÝEÀÞ¨l„Nþƒ¿•í*¯g¡c-%ð\¡â\
‰ÇÇ³ÚÊ€ŸRž“Ã+N{T|y>³cxcÔ§lF"`Ð?¢Šp€÷ñ»­÷¡Šw-Ÿ@’«ûÚ=Lé>`ûaÝi¤r¶{-—ÖÖ¢uQ8’°ZM€vE8™sD°ÁQO”˜˜ÖøÜ&“/Jy¢ÂGŒ¦A	žøÍ?ÑÎlÕÖlËž'K¬x^¯.Û
Çýôu4Ôk-2Øªm®b¨µÚ©yƒkEÄ]&C[ÞB›I…0å²Aì»Rƒ")ž¿Á’ëêÖõ˜Êþž#	­Bt ±QàS¬wz9î’xÏR¹—¹…
vãxKÓ²:ò[¶¹jí‹¯utØÏVÿö+]z÷Ý•m9“Œæõµ7ÿ4ÿÐn>|»vÞ`µwµÕë_Sˆ‘þÈµ[gÅp¹ÚV‡ódHs_kÈ±4˜²{‘Dø¤½pí¹
Óž±Ø*+œ…?Ù{+\»®f‚Y®ºv\’‡ùG¸á"¸d' ýa¬5vˆ²É˜¨Ô²=pz  RÁœêèD´½ žwÿ«Õó,ÓóMá»+…ÏT÷=.Oæã×èp/=£Ô1¬öâ„÷_,\eÒyž
³NŒ4+tÏË¹2öæAéë¢Ò×UMËó)xš!ÚYÜŽ:·Y–±~µ‚’]psj-E«ó<Iö$›;LÓYhµ8S/Vu ›€2£ñåýWtÞÙÞ™2„¡ áXÄ€âp#!×VúÐ¡ûðØî7Î˜UžWÁâdˆçS”óQd¤)¬Ž2î¸çÈá¸å’?z¶§8UáuÚ(œ‹¾¬2î.y4D‚Oèé%Ððˆ3)—øa•…¢Ï‚SØÌ¦yÞ1Ç¥;IÎ¢]C·!YÍH™¬<~_°‹xT†¾Šaôž\rü‡ýl|ë;p¶ÄÓ&°Î6;ŽFˆ³S_¨G>E/Å--VÏN² EHæóñsY{¢rG ÏÃû’—û´.·×žÁ›ƒÊßÆD„õ•# Øñ>}nrâšV«µÒ@HA›­ÀMÑó
»vøù©“äÒ38Ë0Çó¿DÝÓ¾| ÔQ”¦umdÞçJ…÷Ã×“Ý°:ìß/>8þm·úÊS¶Ã¾fŸàîQ±N¸8¾æ\I÷„`îÿÂSdïÑ‘ýÏ–÷oCóðˆS;KÁìÈ²¹¶i/'® 2¿iõ´Ÿ…7›ØN‡M±(+±’ËÐY³TnÈªÆf	·Ý¥yŽ'Aò~¦ŠáW½W“ÏXOÉrÝU'…þ„ÃaäL.ëILh3×ÎQMž™9›Ç˜!;Ÿõ—6³5,Î-®I!íÖæÊãW tŽF˜ê‚£OO¸µ†}ÏöÃQìëÙm)Î,íþƒ¥»Zã%ÛGØg/{é*þãdáíÎ¹U4>‹á©˜
†¼ÖPNùÍlÕÐ2äoòK”$l OÃ›œìë†,£ Ï4Kæ×\ŠØZ€M,ŸA8½ßÕy„cÜ»pM–S²Jx+µÒÍþÍ“Ž„ÿóÑ![Ë‰w{Œßßl·I¼µÍþär†©!0¥1DàV÷ûú6{=¦éîdÂdy"Ç^¬#$áÙ£•Át:I·×Ö.‚Ö(\{Øy¸Ùî>ØÜêt:öÄ· ÷ž‡ÓG+ï`êÇïí÷€†òheZÂˆ$¶2÷øù7%Wp–¿5e“lsªuNÝž²ïµÅ_|š=*Bä3Z–ô{³-ªÍea“ÂñÄ>D‡GÁ°ÁŽ§I4	xÄ wÀÒy ´„Éb[5¸‘™ÀšêÃõÞ*™O>6ïÔ“³3‘•¤$Œ,A´YÞï¦vRüèU&6©Ê„^vF-[z]?Í2Ó\J‚¬Æ’BðQa0¶%ÜÆi±:Ì'm•Yïe&Ft·,`¼¯„@Þü†@¶ 3<RCžW‡!Ï	JªŒ[‘±›¾µíëy!ÂÄ£	GÀiÍnŸ;Ä¡H¸ÕØ…)uË0©j\Ã*å%+.mœ6\“Í²¬ž*hÞEŽ>K´—þüNÛÃÚê›ª
†ÞT¸ó"b^¤zÑ¦E…ž¢Ñ^³5™J*¯Ëüš›³ÚÆ½"ZÄ™­aåñUîp¿v6ì‘ql$+çæk ”£œúB¨DÑ/f%Y*™üÍÃ¤B3òV,#ù)˜E_
KÁñ»ý>ã‡X|ù_ª!/ñ#èIŒ •N“0œ^WLG¦ÊØ¯öëg‚$Õj×³YóŠWÿYƒnøê|£ls${äÚý2û8‹;ÆÓå–i8{Ó°Ï7Ï>üpÍ‚)3®ŸD79L—K…=K„f€qÈq¾â\sšø]¼ËÂïÞØlÙÜtûÂ4‘bºûÜs„ÅçŠ{»ULuÎjoB¡{QÒ†]©Ã¤*ö=“Ôîµ[~›cýÑÔœxÆ>6ãíÊ’Æd)U+ÏâRecvÐl¥ð<!ŠS~i™XOQOæIƒ¸OPU´è?	T;àU]+üÇ?²ú›šÌL\k°ákko[Ñ¸7œc¬«‰y¶Jx¨V[ÕA¿ðÑG…\SYÎ$n@:¥6ñÜ?CCdÊ(Œ]ÒI°éÜvI±«Þ´ß5·&ß­Ã)ð.9?êÍFw½±Ñm´[íû«oÑõ°ýs§ÁYèÍ#¬Ù:âú6%ìÝäc¡(îÕÓ$K€ž?¬Á†Ái8„¯Ïø×¨‡…˜ð»nØäÅò'OÄwþèq$½óáqxñŽ¦KiàExÁ³Pdg)ü>N·)o†³=™÷6oí8»"Þ%N8ûq6"ÓcæìfWx#™¦­³‰·­Q0©Sžë!Ãëôà#Z­6gž2µH‹^ØŸIÂé,[KÒú¼ÜTŒ·lÉ¯ŽŸùIX(Z'¬béŽ©rØéÇ¼ï¸!tÎ}%ÞvqÿU†fnbÐâs¤20cÒì´*œÙª)5VWŽ^ÁG2Ü¨ímG£¸õ“Å@Ô¹¯¡]@W‰ß‡Í7ëo=¥’ýŽ+{ì-èÎ¦I¬b6"·¶EÔL»Ô­ù¸+‹VðH›¿H¼`U—1E´NÙ>ï¥
ÿP,x)ï-–zÌ2É–×‹Ý›Ãv²7)c•˜GÎÜŒqÃ·<¸”Ùø1{JœŒ/Òâ”ì/€ã‹Ö…Ç®0¼™|,§á Z‹<w(X­æDz.’ÑiùL±‚ñûê×	íAµª°®.ÈúŒä©Ì¾s,·ÜŽÉµ”çœ­Ói{ÂIk†Äm“³má ZåRmÊÙb·Õu1F71¢¨¹>G´(Ú”M½eŽu²Y|}cÎÉ+áÂn|•ÑR)E<ì(hš†Áe<›öá,§¶¸²Hÿfªu³¶É RîoaÒ‚ØOíÂA®žÞ®¦õz¦ÓËIˆ€ðIËºÒÀ~ggX¦b›­oé#,E ß,>Zþ±EEu[Sº6j·¸3®^[Ô¸L>g¿¿gûIp¡—nñ»õU±±Ì¡ojfj\zîM?³¡ëÀ Ÿ=­€7ùâó4ûóŠ“Ç5öãA¡vî­©Ì¼î
èÀµâ>?®ÁÓ†«e[«»©í;”®}pˆCp2v0µfpAW5Ö_ïºs'l£¨:A¤iJNž¢£¤É
™El°
?ª‚Ç€Ä*d¶¢,Ld¿è`Šw´G3t]ÆgŒò>À„G³‘FM³lücu54B¡Ì“G¦äcUµ2ÚÌ~Ž»y]Ô´•°ß¹É¶’kA€¯j<ŠŽâ×;íbì
¦Ú,Ø³sì…ã˜®ÉXo)(ÅÐø;NEwç$™åŽ*[¾DºË)ƒºÝWzì f(3ÑÈè Ívî‹bû1È¢˜ !OY£½›<wK¬mµ3ëëôè!n÷› ƒùžª†é}xépG9}NN˜9nä}<ã³³;ÙÊÿ  ÿÿ <ºéxœìWÛnÛF}÷WÔvÓ”eË©UI@â<4ŽSÄMQyX’Kqë%—Ø]šRýˆ~a¿¤³¼HâÍFRçb táj9;sfÎ™á¥ô©¼ qº®è“_v ã“6'š^‰ý½ŒHŠTÑ½žÍ‹}‘*O
ÎñŽh‘Œap .ÑcØS‘:ÜƒÛN#··‹'J½&Z§`šFÊöh¬©„9Iì0o)ÒØ§¾=\ppç6¨$Ü·Gp…	¶üZÿq4@(n¨oíÆEïÐ’ÄŠi&b›pš.´Íi !³ƒ”s«åå¬Ãï‰Ïn¶Ïì£!„æ£rµîé):”Ÿ”…"´cý+UšËêR…’Å×ö ÞŽüê×V4V—gèÛâ]“9Å>Òéj8¼§3ƒè®ÇtxRK™ˆµQIâ
îª¨ø®ü<¡Ÿ/¥Hà2€hø£ªµ‰žô“lŸ’›[¨ºÙg˜ÌŸi{p8²foC–ÀR¤’2x-À\†©«þýûŸŒ‚O9ÃŠ âJAü‰“|&ÇMµñl§õ×Êy
oC^bj
ž:í:Ÿwwœ'âsÎ¼ëéjÿ	Lg°ê„CQ'd¯ivùÉÌVZÈGÂj¹Há§‹å£×K_Ï•Åæu$}\6¥•°xþ‚Ì¿-ŸOs6çå¾9ç)"xûŒ|«-2£ýÜf.f×/l¨x‰àáÉÿÇÛ›«=´m¶ŸžmnÔJÌ”§	ú’¥}|82¦8·^íÅÒ°ª¹â!Û.Í<sõ¤ÕiA<ê7Vá³ØdEªs{”·pêÂoâDÂtØÀ¼‘„5çyÌ"Œâ¤Šâ1kä˜^—q
Ï=ÃÓð[ŠPÃKI2$ÒF\'-Õ1+…É(ï6¹€Ý]ØßöªAõÈ‡Ì÷i[PXŒ	E®~´ßÀ¤!àÈÕbWƒ¨ÆãX—¾épMíŸlp’,ÆÜ>]­@`]3½DÝm«))¢¬m;jo£¦ï3Õ]µ[@õíTÄU‚§¨xFëê<CŸâu‰„íòTbÖËÌi0,ÇN`=E¨%”ê»ðë‡£µ/?Yw¢×I…Û66<2õ2¡¸W%(èsë |uÃpt Fóƒ˜*…—ƒŽÓºtóøJÓ²ðK²yX"[4—ŠäÚ~?<I}¨z‡i›‰×ô©²[êêÇZHê9h)_OãƒšðTNŠµ°IŠãUäÚ§V+©m“¹"•0¿§C—Ããv‹¨TÙß’¾3Ó-ÿ4Ã]Y¼ØyŽ;löwÂŽéâ¨¾GÖì‚Äfdô©&Œ+Òd-æ™!jÙÑizÚF#þ¹d>˜Û\!´f:î@!W¿åZù¾ø@Ùæþýó$)îy%:Ãæ¢=R–ëµ.»YûêCeyôÃ=#nbé+WT¾ò°º¾éLYú™•›Âÿ¬A²4Õ˜$ß1š•…Rf¬¨8nÆÈDÒ€J3=¨}ÄPòIP}Ÿ.õì…¯GFá_‹4~W.Êþ	|•÷aó¼!b8a*ZÐ÷¾î|Gô_ò9ðþ‰úÇc`¹Þ÷8¹D~$¢½-Ô ’4ÎÈ^x.¸@-K~}ÊÑíÎ   ÿÿ ¾…BŽ