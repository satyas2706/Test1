/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Logo } from './components/Logo';
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
    while (baseList.length < 8) {
      baseList = [...baseList, ...storeProducts];
    }
    
    // Double for infinite seamless translation from 0% to -50%
    return [...baseList, ...baseList];
  }, [storeProducts]);

  const duration = useMemo(() => {
    if (!storeProducts || storeProducts.length === 0) return 20;
    let baseCount = storeProducts.length;
    while (baseCount < 8) {
      baseCount += storeProducts.length;
    }
    return baseCount * 5.5; // Beautifully natural scroll speed (5.5s per item)
  }, [storeProducts]);

  if (!storeProducts || storeProducts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[380px] text-xs text-slate-400">
        Loading products...
      </div>
    );
  }

  return (
    <div 
      className="flex-1 relative overflow-hidden w-full select-none"
      style={{ height: '360px' }}
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
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-teal-50 via-teal-50/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-teal-50 via-teal-50/40 to-transparent z-10 pointer-events-none" />

      <div className="marquee-anim-container flex flex-col gap-3">
        {doubledProducts.map((product, index) => {
          const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
          return (
            <div 
              key={`${product.id}-${index}`} 
              className="bg-white/95 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100/45 hover:translate-y-[-1px] transition-all relative group shadow-sm shrink-0"
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 relative border border-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <span className="text-[8px] text-teal-600 font-extrabold uppercase tracking-wider block leading-none mb-1">{product.category}</span>
                    <h4 className="text-[11px] font-extrabold text-slate-800 truncate" title={product.name}>
                      {product.name}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-black text-teal-950">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {product.weight} kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[9px] text-slate-400 font-semibold italic">Consolidated</span>
                {cartItem ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => removeStoreItem(product.name)}
                      className="w-5 h-5 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center font-black text-[10px] hover:bg-rose-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-black min-w-[14px] text-center text-teal-950">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store')}
                      className="w-5 h-5 bg-teal-50 text-teal-600 rounded-md flex items-center justify-center font-black text-[10px] hover:bg-teal-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store');
                      toast.success(`"${product.name}" added to your pickup box!`);
                    }}
                    className="px-2.5 py-1 bg-teal-50 text-teal-750 hover:bg-teal-650 hover:text-white rounded-md text-[9px] font-black cursor-pointer transition-all flex items-center gap-1 border border-teal-100/40"
                  >
                    <Plus size={8} /> Add to Box
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

type Tab = 'home' | 'pickup' | 'warehouse' | 'store' | 'cart' | 'finalize' | 'history' | 'admin' | 'warehouse-mgmt' | 'agent' | 'support' | 'notifications' | 'track' | 'account';


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
  let statusEmoji = '📦';
  let statusDescription = 'has been updated.';
  
  switch(status) {
    case 'Scheduled':
      statusEmoji = '📅';
      statusDescription = 'has been successfully Scheduled! Our agent will contact you for pickup shortly.';
      break;
    case 'Pending Pickup':
      statusEmoji = '🕒';
      statusDescription = 'is currently Pending Pickup.';
      break;
    case 'Picked Up':
      statusEmoji = '🚚';
      statusDescription = 'has been successfully Picked Up by our logistics agent and is on its way to the warehouse.';
      break;
    case 'In Warehouse':
    case 'Received at Warehouse':
      statusEmoji = '🏢';
      statusDescription = 'has been Received at our Warehouse hub and is ready for the next processing stages.';
      break;
    case 'Order Confirmed':
      statusEmoji = '✅';
      statusDescription = 'has been Confirmed.';
      break;
    case 'Processing Order':
      statusEmoji = '⚙️';
      statusDescription = 'is currently being Processed.';
      break;
    case 'Consolidating items':
      statusEmoji = '📥';
      statusDescription = 'is undergoing Consolidation of all package items.';
      break;
    case 'Packed':
      statusEmoji = '📦';
      statusDescription = 'has been securely Packed and ready for dispatch.';
      break;
    case 'Ready to Ship':
      statusEmoji = '✈️';
      statusDescription = 'is fully Packed and Ready to Ship internationally!';
      break;
    case 'In Transit':
      statusEmoji = '🌐';
      statusDescription = 'is In Transit (International Shipping / Air Cargo). It is currently flying to the destination hub.';
      break;
    case 'Out for Delivery':
      statusEmoji = '🛵';
      statusDescription = 'is now Out for Delivery! Our local courier agent is delivering your packages today.';
      break;
    case 'Delivered':
      statusEmoji = '🎉';
      statusDescription = 'has been successfully Delivered! Thank you for shipping with JiffEX. We hope to serve you again soon!';
      break;
    case 'Cancelled':
      statusEmoji = '❌';
      statusDescription = 'has been Cancelled.';
      break;
    default:
      statusDescription = `status is now: *${status}*.`;
  }

  const costString = totalCost ? `\n💰 Total cost: *₹${totalCost.toFixed(2)}*` : '';

  return `*JiffEX Shipment Notification* ${statusEmoji}\n\nDear *${name || 'Customer'}*,\n\nYour shipment *#${orderId.slice(0, 8)}* ${statusDescription}\n\n📍 Destination: *${country || 'N/A'}*${costString}\n\n🔗 Live Tracker: ${trackingUrl}\n\nThank you for choosing JiffEX!`;
};

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    onClick={onClick}
    className="absolute top-1 left-6 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group z-20"
  >
    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
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
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.id} • {t.createdAt}</span>
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
                                    const message = `*JiffEX Support HUB*\n\nRegarding your ticket: ${selectedTicket.id}\nOrder ID: ${order.id}\nStatus: ${order.status}\n\nHere is your current invoice summary.\nTotal: ₹${order.totalCost.toFixed(2)}\n\nHow else can we help you today?`;
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
                    <td className="px-6 py-4 font-black text-slate-900">₹{req.amount.toLocaleString()}</td>
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

  return (
    <div className="space-y-12 pb-24">
      <div className="text-center space-y-4">
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Need Help?</h3>
        <p className="text-slate-500 max-w-2xl mx-auto">Our support team is here to ensure your shipping experience is flawless.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: MessageSquare, 
            title: "Live Chat", 
            desc: "Chat with our logistics experts for immediate assistance with your shipment.",
            action: "Start Chat",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
          },
          { 
            icon: Mail, 
            title: "Email Support", 
            desc: "Send us your queries and we'll get back to you within 24 hours.",
            action: "support@jiffex.com",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          { 
            icon: HelpCircle, 
            title: "Help Center", 
            desc: "Browse our extensive library of FAQs and shipping guides.",
            action: "Visit FAQ",
            color: "text-amber-600",
            bg: "bg-amber-50"
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
            <button className={`text-sm font-bold ${item.color} flex items-center gap-2 hover:underline`}>
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
              { q: "How do I pay for my shipment?", a: "We accept all major credit cards, debit cards, and digital payment methods like PhonePe. Payment is required once all your items are received and weighed at our warehouse." },
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
  const [adminCoupons, setAdminCoupons] = useState<Array<{ code: string; discountPercent: number; isEnabled: boolean }>>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState('');
  const [isSavingShipping, setIsSavingShipping] = useState<boolean>(false);

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
        discounts: parsedDiscounts,
        coupons: adminCoupons
      });
      
      if (setShippingRates) {
        setShippingRates(response.rates);
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
    { label: 'Total Revenue', value: `₹${orders.reduce((acc, o) => acc + (o.totalCost || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-500', tab: 'Reports' },
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
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{apt.date} • {apt.time}</div>
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
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{order.destination.city} • {order.totalWeight}kg</div>
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
                                      <option key={agent.id} value={agent.id}>{agent.name} • {agent.vehicleNumber || 'No Vehicle'}</option>
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
                                      🇮🇳 India Hub
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
                                      🇺🇸 {order.destination.city}
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
                                {order.items.length} Units • {order.totalWeight || order.total_weight || 0}kg Payload
                              </span>
                              <span className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-extrabold text-emerald-700">
                                ₹{(order.totalCost || order.total_cost || 0).toLocaleString()} Cost
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
                      <td className="px-8 py-6 font-black text-slate-900 tracking-tight">₹{req.amount.toLocaleString()}</td>
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
                                    ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} ${product.dimensions.unit}`
                                    : '12 × 10 × 5 cm'}
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
                              <span className="text-2xl font-black text-slate-900">₹{product.price.toLocaleString()}</span>
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
                              <Box size={14} /> Spec Editor Mode — ID: {product.id}
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
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unit Price (₹)</label>
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
                            {entry.type === 'Rate' ? `₹${entry.oldValue}` : `${entry.oldValue}%`}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-900 font-black">
                            {entry.type === 'Rate' ? `₹${entry.newValue}` : `${entry.newValue}%`}
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
                            <label className="block text-[11px] font-bold text-slate-500">Shipping Rate</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
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
                                placeholder="e.g. 10"
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
                      🚀 <strong className="text-indigo-600">Auto-Pilot:</strong> Active background-verified agents are randomly auto-assigned to home pickup requests on booking confirm.
                    </span>
                  ) : (
                    <span>
                      🛑 <strong className="text-rose-600">Manual Assign:</strong> No agent will be assigned to new courier bookings. Admin has to manually coordinate assignment.
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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [tabHistory, setTabHistory] = useState<Tab[]>(['home']);
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navbarTrackingId, setNavbarTrackingId] = useState('');

  const navigateTo = (tab: Tab) => {
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
      } else if (appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone)) && !isSchedulingNewPickup) {
        setShowPickupInProgressModal(true);
        return;
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
  const [items, setItems] = useState<ShippingItem[]>([]);
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
      '9–11 AM': 9,
      '11–1 PM': 11,
      '1–3 PM': 13,
      '3–5 PM': 15,
      '5–7 PM': 17,
      '7–9 PM': 19
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
  const [pickupLanguage, setPickupLanguage] = useState('English');
  const [pickupItemType, setPickupItemType] = useState('Everyday Items');
  const [pickupVehicleType, setPickupVehicleType] = useState('Less than 5 kg');
  const [pickupSpecialInstructions, setPickupSpecialInstructions] = useState('');
  const [pickupCategory, setPickupCategory] = useState('Personal Effects');
  const [pickupEstimatedWeight, setPickupEstimatedWeight] = useState('Less than 5 kg');
  const [savePickupToProfile, setSavePickupToProfile] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; checked: boolean }>({ connected: false, checked: false });
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTriggerSource, setLoginTriggerSource] = useState<'default' | 'checkout' | 'pickup'>('default');
  const [showPickupConfirmModal, setShowPickupConfirmModal] = useState(false);
  const [showPickupInProgressModal, setShowPickupInProgressModal] = useState(false);
  const [activePickupStep, setActivePickupStep] = useState(1);

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
      '9–11 AM': 9,
      '11–1 PM': 11,
      '1–3 PM': 13,
      '3–5 PM': 15,
      '5–7 PM': 17,
      '7–9 PM': 19
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
    return appointments.filter(a => currentUser 
      ? (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone)
      : (lastBookingRef ? a.id === lastBookingRef : false)
    );
  }, [appointments, currentUser, lastBookingRef]);
  const [categories, setCategories] = useState(['Pooja', 'Return Gifts', 'Decorative']);
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
  const quoteRef = React.useRef<HTMLDivElement>(null);
  const warehouseItemsRef = React.useRef<HTMLDivElement>(null);
  const pickupHeaderRef = React.useRef<HTMLDivElement>(null);

  const scrollToQuote = () => {
    quoteRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickQuoteClick = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTabHistory(prev => [...prev, 'home' as Tab]);
      setTimeout(() => {
        scrollToQuote();
      }, 100);
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'phonepe'>('card');

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
  const [woPaymentMethod, setWoPaymentMethod] = useState<'card' | 'phonepe' | 'cash'>('card');
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

    const resolvedCustomerId = overrideCustomerId || currentUser?.id || 'guest-user';
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
        fullName: pickupDestination.fullName || resolvedName,
        email: pickupDestination.email || resolvedEmail,
        phone: pickupDestination.phone || pickupPhone,
        addressLine1: pickupDestination.addressLine1 || '',
        city: pickupDestination.city || '',
        state: pickupDestination.state || '',
        zipCode: pickupDestination.zipCode || '',
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
      customerName: resolvedName
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

    setLastBookingRef(newOrder.id);
    setIsSchedulingNewPickup(false);
    setActivePickupStep(5);
    window.scrollTo(0, 0);
    
    // Sync to DB
    if (dbStatus.checked) {
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
    setPickupLanguage('English');
    setPickupSpecialInstructions('');
    setPickupCategory('Personal Effects');
    setPickupEstimatedWeight('Less than 5 kg');
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
        setAuthLoading(false);
      } catch (err) {
        console.warn('Supabase auth getSession error:', err);
        setAuthLoading(false);
      }

      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
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

      const userId = email ? `guest_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'guest-user';
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
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as ShippingItem;
            setItems(prev => {
              if (prev.some(i => i.id === newItem.id)) return prev;
              return [...prev, newItem];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as ShippingItem;
            setItems(prev => prev.map(i => i.id === updatedItem.id ? { ...i, ...updatedItem } : i));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old.id));
          }
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
  }, [currentUser, dbStatus.connected, normalizeOrder]);

  // Fetch orders when currentUser or activeTab changes, with fast-polling for agents/admins
  useEffect(() => {
    if (dbStatus.checked) {
      const uId = currentUser?.id || 'guest-user';
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
          api.getOrders(uId).then(processOrders).catch(console.error);
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
    if (dbStatus.checked) {
      const uId = currentUser?.id || 'guest-user';
      const roleLower = (currentUser?.role || '').toLowerCase();
      const isAdminOrAgent = currentUser ? ['admin', 'webmaster', 'customer_service', 'agent'].includes(roleLower) : false;
      const fetchId = isAdminOrAgent ? 'all' : uId;

      api.fetchItems(fetchId)
        .then(data => {
          setItems(prev => {
            if (prev.length === data.length && prev.every((item, idx) => item.id === data[idx].id && item.status === data[idx].status && item.weight === data[idx].weight)) {
              return prev;
            }
            return data;
          });
        })
        .catch(err => console.error('Failed to load items from server:', err));
    }
  }, [currentUser, activeTab, dbStatus.checked]);

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

  const cartItems = useMemo(() => {
    return items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);
  }, [items, orderedItemIds]);

  const totalWeight = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  }, [cartItems]);

  const hasAllAgentPickup = useMemo(() => {
    return appointments.some(a => a.status === 'Scheduled' && a.pickupType === 'AllAgent' && (
      currentUser 
        ? (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone)
        : (lastBookingRef ? a.id === lastBookingRef : false)
    ));
  }, [appointments, currentUser, lastBookingRef]);

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
    const isSubmitted = source !== 'Warehouse';
    const existingItemIndex = items.findIndex(i => 
      i.name === item.name && 
      i.source === source && 
      (source !== 'Warehouse' || i.submitted === false)
    );

    if (existingItemIndex !== -1) {
      // Increment quantity
      const quantityToAdd = item.quantity || 1;
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: (existingItem.quantity || 0) + quantityToAdd,
        weight: (existingItem.weight || 0) + (item.weight || 0),
        price: (existingItem.price || 0) + (item.price || 0)
      };
      setItems(updatedItems);
      setShowConflictModal({ show: false, item: null, source: null });
      return;
    }

    const quantityToAdd = item.quantity || 1;
    const newItem: ShippingItem = {
      ...item,
      id: crypto.randomUUID(),
      status: source === 'Store' ? 'Received at Warehouse' : source === 'Warehouse' ? 'Awaiting Warehouse Arrival' : 'Pending',
      source: source,
      quantity: quantityToAdd,
      submitted: source !== 'Warehouse'
    };
    
    // Optimistic update
    setItems([...items, newItem]);
    setShowConflictModal({ show: false, item: null, source: null });

    if (source === 'Store') {
      setShowJiffySuggestion(true);
    }

    // Try to sync to backend database
    if (dbStatus.checked) {
      try {
        await api.createItem({
          ...newItem,
          user_id: currentUser?.id || 'guest-user' // Ensure user_id is passed
        } as any);
      } catch (err: any) {
        console.error('Failed to sync item to DB:', err.message);
      }
    }
  }, [items, dbStatus.checked, currentUser]);

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const removeStoreItem = useCallback((name: string) => {
    const index = items.findIndex(i => i.name === name && i.source === 'Store');
    if (index !== -1) {
      const updatedItems = [...items];
      const item = updatedItems[index];
      if (item.quantity && item.quantity > 1) {
        const unitWeight = item.weight / item.quantity;
        const unitPrice = (item.price || 0) / item.quantity;
        updatedItems[index] = {
          ...item,
          quantity: item.quantity - 1,
          weight: item.weight - unitWeight,
          price: (item.price || 0) - unitPrice
        };
      } else {
        updatedItems.splice(index, 1);
      }
      setItems(updatedItems);
    }
  }, [items]);

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

  const updateItemQuantity = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (delta === -1 && (item.quantity || 1) === 1) {
      removeItem(id);
      return;
    }

    setItems(items.map(i => {
      if (i.id === id) {
        const currentQty = i.quantity || 1;
        const newQuantity = Math.max(1, currentQty + delta);
        const unitWeight = i.weight / currentQty;
        const unitPrice = (i.price || 0) / currentQty;
        return {
          ...i,
          quantity: newQuantity,
          weight: unitWeight * newQuantity,
          price: unitPrice * newQuantity
        };
      }
      return i;
    }));
  };

  const cancelAppointment = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleFinalPayment = async () => {
    if (!currentUser) return;
    const hasScheduledPickup = appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone));
    const cartItems = items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);
    
    // Determine payment status based on pickup and shipping preference
    const isPayAtHome = hasScheduledPickup && shippingPreference === 'International';
    const isWarehouseCheckout = cartItems.some(i => i.source === 'Warehouse');
    const paymentStatus = isWarehouseCheckout ? 'Pending' : isPayAtHome ? 'Pay at Home' : 'Paid';

    // Validate checkout details
    if (shippingPreference !== 'LocalPickup') {
      if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.zipCode) {
        toast.error('Please complete your shipping address details including your contact phone number.');
        return;
      }
    }

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

    const newOrder: Order = {
      id: finalOrderId,
      customerId: currentUser.id,
      items: [...cartItems],
      totalWeight,
      totalCost: finalCostToPay,
      status: isWarehouseCheckout ? 'Request Placed' : (isPickupType ? 'Scheduled' : 'Request Placed'),
      createdAt: new Date().toISOString(),
      shippingDate: selectedDate,
      destination: address,
      paymentStatus: paymentStatus,
      pickupType: isPickupType ? 'AllAgent' : undefined,
      assignedAgent: assignedAgent,
      assignedAgentId: assignedAgent?.id
    } as any;
    
    // Optimistic update
    setOrders([...orders, newOrder]);
    setIsPaid(true);
    // Only remove items that were in the cart (submitted)
    setItems(items.filter(i => i.source === 'Warehouse' && !i.submitted));

    // Sync to DB
    if (dbStatus.connected) {
      try {
        const savedOrder = await api.createOrder({
          ...newOrder,
          id: finalOrderId,
          customer_id: currentUser.id, // Snake case for DB
          total_weight: totalWeight,
          total_cost: finalCostToPay,
          payment_status: paymentStatus,
          shipping_date: selectedDate,
          pickup_type: isPickupType ? 'AllAgent' : undefined,
          assigned_agent: assignedAgent,
          assigned_agent_id: assignedAgent?.id
        } as any);

        let finalSavedOrder = newOrder;
        if (savedOrder && savedOrder.id && savedOrder.id !== finalOrderId) {
          console.log(`[Order] Self-healed unique ID from backend: ${savedOrder.id}`);
          setOrderId(savedOrder.id);
          finalSavedOrder = { ...newOrder, id: savedOrder.id };
          setOrders(prev => prev.map(o => o.id === finalOrderId ? finalSavedOrder : o));
        }

        // Automatically send invoice email with PDF
        const recipientEmail = address.email || currentUser.email;
        if (isWarehouseCheckout) {
          await api.sendOrderConfirmationEmail(recipientEmail, finalSavedOrder, COMPANY_DETAILS);
          toast.success(`Shipment request confirmed! Confirmation sent to ${recipientEmail}.`);
        } else if (isPayAtHome) {
          // Send a special "Pay at Home" confirmation email
          await api.sendOrderConfirmationEmail(recipientEmail, finalSavedOrder, COMPANY_DETAILS);
          toast.success(`Order confirmed! Confirmation sent to ${recipientEmail}. Final billing will be done at your home.`);
        } else {
          await api.sendInvoicePDF(recipientEmail, finalSavedOrder, COMPANY_DETAILS);
          toast.success(`Payment successful! Invoice sent to ${recipientEmail}`);
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
    // Reset coupon code inputs
    setAppliedCoupon(null);
    setCouponCodeInput('');

    // Determine primary source and generate the correct order ID first so it is preserved even across login
    const hasScheduledPickup = currentUser 
      ? appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone))
      : (lastBookingRef ? appointments.some(a => a.id === lastBookingRef && a.status === 'Scheduled') : false);
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
              UPS®
            </span>
          ),
          barColor: 'bg-[#351C15]',
        },
        USPS: {
          logo: (
            <span className="font-black italic tracking-wide text-[#004B87] text-lg">
              USPS®
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
        UPS: 'UPS Worldwide Express® (via JiffEX)',
        FedEx: 'FedEx International Priority® (via JiffEX)',
        DHL: 'DHL Express Worldwide® (via JiffEX)',
        USPS: 'USPS Priority Mail Express® (via JiffEX)'
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
        <div className="space-y-24 pb-24">
          {/* JIFFEX Truck Hero Section */}
          <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 text-white p-12 md:p-20 shadow-2xl">
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 30% 20%, #1e2a78 0%, #0b1220 60%, #05070f 100%)`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center space-y-12">
              <div className="space-y-8 max-w-4xl">
                <div className="space-y-6">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-8xl font-black tracking-tighter leading-tight text-white"
                  >
                    Send Anything from India to Abroad—<span className="relative inline-block">Hassle-Free<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1.5 bg-amber-500 rounded-full" /></span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto"
                  >
                    Shop online, schedule pickup, or send your own items. We handle packing & delivery.
                  </motion.p>
                </div>
              </div>

              <div className="space-y-8 w-full">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-bold text-indigo-400 uppercase tracking-widest"
                >
                  Choose how you want to send:
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto"
                >
                  {/* Card 1: Pickup from Home */}
                  <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-200">
                        Most Popular
                      </span>
                    </div>
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Truck size={40} className="text-indigo-600" />
                    </div>
                    <div className="space-y-3 flex-grow">
                      <h3 className="font-black text-2xl text-slate-900">Pickup from Home</h3>
                      <p className="text-slate-500 leading-relaxed">
                        We collect items from your doorstep, pack & ship internationally
                      </p>
                    </div>
                    <button 
                      onClick={() => navigateTo('pickup')}
                      className="w-full btn-cta"
                    >
                      Schedule Pickup
                    </button>
                  </div>

                  {/* Card 2: Send to Our Warehouse */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Package size={40} className="text-indigo-600" />
                    </div>
                    <div className="space-y-3 flex-grow">
                      <h3 className="font-black text-2xl text-slate-900">Send to Our Warehouse</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Ship your items to our warehouse—we pack & deliver abroad
                      </p>
                    </div>
                    <button 
                      onClick={() => navigateTo('warehouse')}
                      className="w-full btn-cta"
                    >
                      Send to Our Warehouse
                    </button>
                  </div>

                  {/* Card 3: Shop & Send */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <ShoppingBag size={40} className="text-indigo-600" />
                    </div>
                    <div className="space-y-3 flex-grow">
                      <h3 className="font-black text-2xl text-slate-900">Shop & Send</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Buy authentic Indian products—we deliver anywhere abroad
                      </p>
                    </div>
                    <button 
                      onClick={() => navigateTo('store')}
                      className="w-full btn-cta"
                    >
                      Shop Now
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4"
                >
                  <button 
                    onClick={() => {
                      const element = document.getElementById('how-it-works');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-6 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-full font-bold flex items-center gap-2 transition-all group text-lg"
                  >
                    Not sure? <span className="underline underline-offset-4 transition-colors">See how it works</span>
                  </button>
                  
                  <div className="h-6 w-px bg-slate-800 hidden sm:block" />
                  
                  <div className="flex items-center gap-3 text-slate-400 font-medium text-lg">
                    <span className="text-amber-400 text-2xl">⭐</span> Trusted by 1000+ customers • Delivered worldwide
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* How JiffEX Works - Value Prop */}
          <div id="how-it-works" className="space-y-12 scroll-mt-24">
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
            className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white shadow-2xl"
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
                Whether it's your mother's handmade sweets, that specific wedding outfit, or the comfort of Indian spices—we bring India to your doorstep.
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

          {/* Quote Calculator & Protocol */}
          <div ref={quoteRef} className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-100">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Calculator className="text-indigo-600" /> Quick Quote
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Destination</label>
                    <select 
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                      value={qCountry}
                      onChange={(e) => setQCountry(e.target.value)}
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Weight (kg)</label>
                    <input 
                      type="number" 
                      min="0.1" 
                      step="0.1"
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={qWeight}
                      onChange={(e) => setQWeight(Number(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Shipping Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Standard', label: 'Standard', days: '10-14 Days', multiplier: 0.7 },
                        { id: 'Express', label: 'Express', days: '5-7 Days', multiplier: 1.0 }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setQMethod(method.id as any)}
                          className={`p-4 rounded-2xl border-2 transition-all text-left ${
                            qMethod === method.id 
                              ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/5' 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className={`text-sm font-black ${qMethod === method.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                            {method.label}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {method.days}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">
                          Estimated Cost ({qMethod})
                        </span>
                        <div className="text-4xl font-black">
                          ₹{(() => {
                            const rate = shippingRates[qCountry] || 10;
                            const methodMultiplier = qMethod === 'Standard' ? 0.7 : 1.0;
                            const rawQuote = qWeight * rate * methodMultiplier;
                            const discountPercent = shippingDiscounts[qCountry] || 0;
                            const discount = rawQuote * (discountPercent / 100);
                            return Math.max(0, rawQuote - discount).toFixed(2);
                          })()}
                        </div>
                        {(() => {
                          const discountPercent = shippingDiscounts[qCountry] || 0;
                          if (discountPercent > 0) {
                            const rate = shippingRates[qCountry] || 10;
                            const methodMultiplier = qMethod === 'Standard' ? 0.7 : 1.0;
                            const saved = qWeight * rate * methodMultiplier * (discountPercent / 100);
                            return (
                              <div className="text-xs font-bold text-rose-300 mt-1">
                                Discount of {discountPercent}% Applied for {qCountry}! (Save ₹{saved.toFixed(2)})
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-2 flex items-center gap-1">
                          <Clock size={10} /> Est. Delivery: {qMethod === 'Express' ? '5-7' : '10-14'} Business Days
                        </div>
                      </div>
                      <Truck className="opacity-20" size={48} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
                
                <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-2xl">
                  <Info size={48} className="text-indigo-400" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-2xl font-black">Unified Shipping Protocol</h4>
                  <p className="text-slate-400 leading-relaxed">
                    When you schedule an agent pickup, JiffEX activates the <span className="text-white font-bold">Home-First Protocol</span>. All your items—whether from Shop or our warehouse—are consolidated at your doorstep for a truly personalized shipping experience.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Products from Shop - Moved to Last */}
          <div className="space-y-8">
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
                const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
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
                          <span className="text-indigo-600 font-bold">₹{product.price}</span>
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
    if (!currentUser) return null;
    
    // Merge orders and appointments for a complete view
    const customerOrders = orders.filter(o => (o.customerId || o.customer_id) === currentUser.id);
    const customerAppointments = appointments.filter(a => (a.customerId || a.customer_id) === currentUser.id);
    
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

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900">My Orders</h2>
          <button 
            onClick={async () => {
              if (window.confirm("Are you sure you want to clear ALL orders and items? This cannot be undone.")) {
                try {
                  await api.clearAllOrders();
                  toast.success("All orders cleared successfully.");
                  setOrders([]);
                  setItems([]);
                } catch (err) {
                  toast.error("Failed to clear orders.");
                }
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} /> Debug: Clear All
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 gap-6">
            {unifiedHistory.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p>You have no active shipments.</p>
                <button onClick={() => navigateTo('home')} className="mt-4 text-indigo-600 font-bold hover:underline">Start a shipment</button>
              </div>
            ) : (
              unifiedHistory.map(order => (
                <div key={order.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <button 
                        onClick={() => setSelectedOrderForDetails(order)}
                        className="text-left group-hover:text-indigo-600 transition-colors w-full"
                      >
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Order ID</div>
                        <div className="text-lg font-black flex items-center flex-wrap gap-2 text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {order.id}
                          {(order.id.startsWith('PH-') || (order as any).pickupType) && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider rounded-md">
                              Home Pickup Scheduled
                            </span>
                          )}
                        </div>
                      </button>
                      {(order.id.startsWith('PH-') || (order as any).pickupType) && (
                        <div className="mt-2.5 text-xs bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3 text-slate-700 font-sans space-y-1 font-medium transition-all group-hover:bg-indigo-50 max-w-2xl">
                          <div className="font-extrabold flex items-center gap-1.5 text-slate-900 text-xs pb-1.5 mb-1.5 border-b border-indigo-100/40">
                            <Calendar size={13} className="text-indigo-600 font-bold" /> Scheduled Pickup Details
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            <div><span className="text-slate-400">Date:</span> <strong className="text-slate-800">{order.shippingDate || (order as any).shipping_date || 'N/A'}</strong></div>
                            <div><span className="text-slate-400">Time:</span> <strong className="text-slate-800">{(order as any).time || (order as any).destination?.time || 'General Slot'}</strong></div>
                            <div><span className="text-slate-400">Address:</span> <strong className="text-slate-800">{order.destination?.addressLine1 || (order as any).destination?.addressLine1 || 'N/A'}</strong></div>
                            <div><span className="text-slate-400">Weight Est:</span> <strong className="text-slate-800">{order.totalWeight || (order as any).total_weight || 0} kg</strong></div>
                            <div><span className="text-slate-400">Assigned Agent:</span> <strong className="text-slate-800">{order.assignedAgent?.name || (order as any).assignedAgent?.name || (order as any).destination?.assignedAgent?.name || 'Assigning soon...'}</strong></div>
                            <div><span className="text-slate-400">Item Type:</span> <strong className="text-slate-800">{(order as any).itemType || (order as any).destination?.itemType || 'General Store Goods'}</strong></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      order.status === 'Picked Up' || order.status === 'Order Picked Up'
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {order.status === 'Picked Up' || order.status === 'Order Picked Up' ? 'Order Picked Up' : order.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 bg-white p-4 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Country</div>
                      <div className="text-sm font-bold flex items-center gap-1.5">
                        <span className="text-base leading-none">🇮🇳</span>
                        <span>India</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</div>
                      <div className="text-sm font-bold text-slate-800">{order.destination?.country || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Items Shipped</div>
                      <div className="text-sm font-bold text-slate-800">{order.items?.length || 0} items</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                      <div className="text-sm font-bold text-slate-800">{getSafeOrderTotalWeight(order)} kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Paid</div>
                      <div className="text-sm font-bold text-indigo-600">₹{order.totalCost || order.total_cost || 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 w-fit">
                      <Clock size={14} className="text-indigo-600" />
                      <div className="text-xs text-slate-600 font-medium">
                        <span className="text-slate-400 mr-1.5 uppercase tracking-widest text-[9px] font-black">Placed:</span>
                        {new Date(order.createdAt || order.created_at || Date.now()).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => {
                          setTrackingId(order.id);
                          setActiveTab('track');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-indigo-100"
                      >
                        <Search size={12} /> Track Shipment
                      </button>
                      
                      <button 
                        onClick={async () => {
                          const promise = api.shareInvoice(order);
                          toast.promise(promise, {
                            loading: 'Sending invoice...',
                            success: 'Invoice sent to your email!',
                            error: 'Could not send invoice via Email.'
                          });

                          const summary = `JiffEX Invoice\nOrder ID: ${order.id}\nDestination: ${order.destination.fullName || ''}, ${order.destination.country}\nTotal Weight: ${order.totalWeight || order.total_weight || 0} kg\nTotal Cost: ₹${order.totalCost || order.total_cost || 0}`;
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
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-100"
                      >
                        <Share size={12} /> Share Invoice
                      </button>

                      {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button 
                          onClick={() => cancelPickup(order.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-red-100"
                        >
                          <Trash2 size={12} /> Cancel
                        </button>
                      )}
                      
                      {order.status === 'Received at Warehouse' && (
                        <button 
                          onClick={() => simulateNotification('Shipment dispatched', `Your shipment ${order.id} has been dispatched to ${order.destination.country}.`)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          Dispatch
                        </button>
                      )}

                      <button 
                        onClick={() => setSelectedOrderForInvoice(order)}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 hover:underline"
                      >
                        View Invoice <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
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
                              This is a scheduled pickup from home. The item list will be finalized and updated once our agent collects and measures your items at our hub.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedOrderForInvoice.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden">
                                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={20} />}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-slate-900">{item.name}</div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 font-medium">
                                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase text-[9px] font-bold">{item.source}</span>
                                      <span>Weight: <strong className="text-slate-700">{getSafeItemUnitWeight(item)} kg</strong></span>
                                      <span>Qty: <strong className="text-slate-700">{item.quantity || 1}</strong></span>
                                      <span>Total Weight: <strong className="text-slate-800">{getSafeItemTotalWeight(item).toFixed(2)} kg</strong></span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                  {item.price ? `₹${item.price}` : '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900 rounded-2xl p-6 text-white mb-4">
                        {isPendingInvoice ? (
                          <div className="text-center py-4 font-sans">
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest block mb-1">Invoice Notification</span>
                            <div className="text-sm font-bold text-slate-200 max-w-md mx-auto leading-relaxed">
                              Invoice will be displayed once the items are picked and billed.
                            </div>
                            <span className="inline-block mt-3.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[9px] font-bold uppercase tracking-widest">
                              Awaiting Pick & Bill
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Weight</span>
                              <span className="font-bold">{getSafeOrderTotalWeight(selectedOrderForInvoice)} kg</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Grand Total</span>
                                <div className="text-3xl font-black">₹{selectedOrderForInvoice.totalCost}</div>
                              </div>
                              <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {selectedOrderForInvoice.paymentStatus}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}

                <div className="mt-8 flex gap-4">
                  <button className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <Printer size={18} /> Print
                  </button>
                  <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <Share size={18} /> Share
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

          {/* Details Modal (when Clicking Order ID) */}
          <AnimatePresence>
            {selectedOrderForDetails && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-8 custom-scrollbar"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Order Details</h2>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Order ID: {selectedOrderForDetails.id}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedOrderForDetails(null)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <XCircle size={24} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Shipping From</h4>
                      <div className="text-sm font-bold text-slate-900">
                        {selectedOrderForDetails.id?.startsWith('PH-') || (selectedOrderForDetails as any).pickupType
                          ? ((selectedOrderForDetails as any).pickupAddress?.fullName || selectedOrderForDetails.customerName || 'Customer Residence')
                          : 'JiffEX Warehouse'
                        }
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed mt-1">
                        {selectedOrderForDetails.id?.startsWith('PH-') || (selectedOrderForDetails as any).pickupType ? (
                          <>
                            {((selectedOrderForDetails as any).pickupAddress?.addressLine1 || selectedOrderForDetails.destination?.addressLine1 || '').split(',').slice(0, 2).join(',')}<br />
                            {((selectedOrderForDetails as any).pickupAddress?.city || selectedOrderForDetails.destination?.city || '')} {((selectedOrderForDetails as any).pickupAddress?.state || selectedOrderForDetails.destination?.state || '')}<br />
                            {((selectedOrderForDetails as any).pickupAddress?.zipCode || (selectedOrderForDetails as any).pickupAddress?.zip || selectedOrderForDetails.destination?.zipCode || '')} India
                          </>
                        ) : (
                          <>
                            {WAREHOUSE_ADDRESS.street}<br />
                            {WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.state}<br />
                            {WAREHOUSE_ADDRESS.zip}, {WAREHOUSE_ADDRESS.country}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Shipping To</h4>
                      <div className="text-sm font-bold text-slate-900">
                        {selectedOrderForDetails.id?.startsWith('PH-') || (selectedOrderForDetails as any).pickupType
                          ? (selectedOrderForDetails.destination?.fullName || 'Receiver Location')
                          : (selectedOrderForDetails.destination?.fullName || currentUser?.name || 'Receiver Location')
                        }
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed mt-1">
                        {selectedOrderForDetails.destination?.addressLine1 || 'N/A'}<br />
                        {selectedOrderForDetails.destination?.city || ''} {selectedOrderForDetails.destination?.state || ''}<br />
                        {selectedOrderForDetails.destination?.zipCode || ''} {selectedOrderForDetails.destination?.country || ''}
                      </div>
                    </div>
                  </div>

                  {(selectedOrderForDetails.id?.startsWith('PH-') || (selectedOrderForDetails as any).pickupType) && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 text-slate-700">
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-indigo-100/60">
                        <Calendar size={14} className="text-indigo-600" /> Home Pickup Scheduled Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pickup Date</div>
                          <div className="font-bold text-slate-800">{selectedOrderForDetails.shippingDate || (selectedOrderForDetails as any).shipping_date || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Preferred Time</div>
                          <div className="font-bold text-slate-800">{(selectedOrderForDetails as any).time || (selectedOrderForDetails as any).destination?.time || 'General Slot'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assigned Agent</div>
                          <div className="font-bold text-slate-800">
                            {selectedOrderForDetails.assignedAgent?.name || (selectedOrderForDetails as any).assignedAgent?.name || (selectedOrderForDetails as any).destination?.assignedAgent?.name || 'Assigning soon...'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Language Preference</div>
                          <div className="font-bold text-slate-800">{(selectedOrderForDetails as any).languagePreference || (selectedOrderForDetails as any).destination?.languagePreference || 'English'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Item Category</div>
                          <div className="font-bold text-slate-800">{(selectedOrderForDetails as any).itemType || (selectedOrderForDetails as any).destination?.itemType || 'General Cargo'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vehicle Type</div>
                          <div className="font-bold text-slate-800">{(selectedOrderForDetails as any).vehicleType || (selectedOrderForDetails as any).destination?.vehicleType || 'Two-Wheeler'}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Full Pickup Address (From)</div>
                          <div className="font-bold text-slate-800">{(selectedOrderForDetails as any).pickupAddress?.addressLine1 || selectedOrderForDetails.destination?.addressLine1 || 'N/A'}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Destination Delivery Address (To)</div>
                          <div className="font-bold text-slate-800">
                            {selectedOrderForDetails.destination?.addressLine1}, {selectedOrderForDetails.destination?.city}, {selectedOrderForDetails.destination?.state} - {selectedOrderForDetails.destination?.zipCode}, {selectedOrderForDetails.destination?.country}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-6 mb-6">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Item Details</h4>
                    <div className="space-y-3">
                      {(selectedOrderForDetails.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden">
                              {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={20} />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{item.name}</div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 font-medium font-sans">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase text-[9px] font-bold">{item.source}</span>
                                <span>Weight: <strong className="text-slate-700">{getSafeItemUnitWeight(item)} kg</strong></span>
                                <span>Qty: <strong className="text-slate-700">{item.quantity || 1}</strong></span>
                                <span>Total Weight: <strong className="text-slate-800">{getSafeItemTotalWeight(item).toFixed(2)} kg</strong></span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-slate-900">
                              {item.price ? `₹${item.price}` : '-'}
                            </div>
                            <div className="mt-1.5">
                              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                                {item.status || selectedOrderForDetails.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total weight and grand total in TEXT format (No black box) */}
                  <div className="border-t border-slate-200 pt-5 space-y-3">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                      <span>Total Weight:</span>
                      <span className="text-slate-900 font-extrabold text-base">{getSafeOrderTotalWeight(selectedOrderForDetails)} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600 border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Grand Total</span>
                        <div className="text-2xl font-black text-slate-950 mt-1">₹{selectedOrderForDetails.totalCost || selectedOrderForDetails.total_cost || 0}</div>
                      </div>
                      <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold rounded-xl text-xs uppercase tracking-widest">
                        {selectedOrderForDetails.paymentStatus || selectedOrderForDetails.payment_status || 'Paid'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end pt-2">
                    <button 
                      onClick={() => setSelectedOrderForDetails(null)}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      );
    }, [orders, appointments, currentUser, setActiveTab, selectedOrderForInvoice, selectedOrderForDetails]);


  const WorkOrderSection = useMemo(() => {
    if (!currentUser) return null;
    if (!activeWorkOrder) return null;

    const woTotalWeight = woItems.reduce((s, i) => s + (i.weight * (i.quantity || 1)), 0);
    const woRate = shippingRates[woAddress.country] || 10;
    const woRawShippingCost = woTotalWeight * woRate;
    const woDiscountPercent = shippingDiscounts[woAddress.country] || 0;
    const woDiscountAmount = woRawShippingCost * (woDiscountPercent / 100);
    const woTotalCost = Math.max(0, woRawShippingCost - woDiscountAmount);

    if (isWOPaid) {
      return (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black">Payment Successful!</h2>
              <p className="opacity-80">Work Order {activeWorkOrder.id} has been processed and paid.</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Invoice Summary</h3>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Order ID: {woOrderId}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => {
                    const message = `*JiffEX Work Order Invoice*\n\nOrder ID: ${woOrderId}\nCustomer: ${woAddress.fullName}\nTotal Amount: ₹${woTotalCost.toFixed(2)}\nDestination: ${woAddress.country}\nStatus: Processed & Paid\n\nThank you for choosing JiffEX!`;
                    sendWhatsApp(woAddress.phone, message);
                  }}
                  className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold font-sans"
                  title="WhatsApp Invoice"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp Invoice</span>
                </button>
                <button 
                  onClick={() => {
                    const summary = `JiffEX Invoice\nOrder ID: ${woOrderId}\nDestination: ${woAddress.fullName}, ${woAddress.country}\nTotal Weight: ${woTotalWeight.toFixed(1)} kg\nTotal: ₹${woTotalCost.toFixed(2)}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'JiffEX Invoice',
                        text: summary,
                      }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(summary);
                      toast.success('Invoice Summary copied to clipboard!');
                    }
                  }}
                  className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors rounded-xl flex items-center gap-1.5 text-xs font-bold font-sans"
                  title="Share Summary"
                >
                  <Share size={18} />
                  <span>Share Summary</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors rounded-xl"
                  title="Print Invoice"
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin size={12} className="text-red-500" /> Destination Address
                  </h4>
                  <div className="text-sm font-bold text-slate-900">{woAddress.fullName}</div>
                  <div className="text-xs text-slate-600 leading-relaxed mt-1">
                    {woAddress.addressLine1}, {woAddress.city}<br />
                    {woAddress.country}<br />
                    <span className="font-medium">Email: {woAddress.email}</span><br />
                    <span className="font-medium">Phone: {woAddress.phone}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Calendar size={12} className="text-indigo-600" /> Shipment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Shipping Date</div>
                      <div className="text-xs font-bold text-slate-900">{woShippingDate}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Payment Method</div>
                      <div className="text-xs font-bold text-slate-900 uppercase">{woPaymentMethod}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package size={12} className="text-indigo-600" /> Items List
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {woItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">{item.name} <span className="text-[10px] text-slate-400 font-bold ml-1">x{item.quantity || 1}</span></span>
                        <span className="text-slate-400">{(item.weight * (item.quantity || 1)).toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-slate-200 my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">Total Weight</span>
                    <span className="text-sm font-black text-slate-900">{woItems.reduce((s, i) => s + (i.weight * (i.quantity || 1)), 0).toFixed(1)} kg</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Base Shipping Cost</span>
                    <span>₹{woRawShippingCost.toFixed(2)}</span>
                  </div>
                  {woDiscountPercent > 0 && (
                    <div className="flex justify-between items-center text-xs text-rose-400">
                      <span>Shipping Discount ({woDiscountPercent}%)</span>
                      <span>-₹{woDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-800 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Total Amount Paid</span>
                    <span className="text-2xl font-black text-indigo-400">₹{woTotalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 max-w-lg mx-auto w-full">
              <button 
                onClick={() => { setActiveWorkOrder(null); navigateTo('agent'); }}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all text-sm shadow-md cursor-pointer text-center"
              >
                Process New Order
              </button>
              <button 
                onClick={() => { setActiveWorkOrder(null); navigateTo('agent'); }}
                className="flex-1 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-black transition-all text-sm shadow-xs cursor-pointer text-center"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 text-slate-800">
        {/* Header Block with Back Button & Steps Tracker */}
        <div className="bg-white p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-2.5 sm:pb-4 border-b border-slate-100">
            <button 
              type="button"
              onClick={() => setActiveWorkOrder(null)}
              className="text-slate-400 hover:text-slate-900 flex items-center gap-1 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <ChevronRight size={14} className="rotate-180 sm:w-4 sm:h-4" /> Exit
            </button>
            <div className="text-right">
              <h2 className="text-sm sm:text-lg font-black text-slate-900 leading-tight">Order: {activeWorkOrder.id}</h2>
              <p className="hidden sm:block text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Pickup & Shipping Wizard</p>
              {/* Customer Name on mobile view only to save space */}
              <p className="block sm:hidden text-[10px] text-slate-600 font-extrabold mt-0.5 uppercase tracking-tight">
                Cust: {activeWorkOrder.customerName || 'Walk-in'}
              </p>
            </div>
          </div>
 
          {/* Context Banner - Only shown on Desktop / larger screens as requested */}
          <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 p-2.5 sm:p-4 mb-4 sm:mb-6 bg-indigo-50/40 border border-indigo-100/50 rounded-xl sm:rounded-2xl">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[7px] sm:text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 tracking-wider shrink-0">Active Pickup</span>
                <h4 className="text-xs font-black text-slate-800 truncate">Customer: {activeWorkOrder.customerName || 'Walk-in'}</h4>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-1">📍 {activeWorkOrder.address}</p>
            </div>
            <div className="text-[10px] font-black text-slate-600 shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-1">
              <span>📞 {activeWorkOrder.phone}</span>
            </div>
          </div>
 
          {/* Stepper Progress Bar (Line-based, like home pickup style, clickable) */}
          <div className="mb-4 sm:mb-8 select-none">
            <div className="flex items-center gap-1.5 sm:gap-3 w-full">
              {[
                { step: 1, label: 'Cargo', desc: 'Add items' },
                { step: 2, label: 'KYC Docs', desc: 'Verify ID' },
                { step: 3, label: 'Destination', desc: 'Recipient' },
                { step: 4, label: 'Payment', desc: 'Settle cost' }
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < woStep || woItems.length > 0) {
                      setWoStep(s.step);
                    }
                  }}
                  className="flex-1 flex flex-col gap-2 text-left focus:outline-none cursor-pointer group"
                >
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 w-full ${
                      woStep === s.step 
                        ? 'bg-indigo-600 shadow-sm shadow-indigo-200/50' 
                        : s.step < woStep 
                          ? 'bg-emerald-500 shadow-xs' 
                          : 'bg-slate-200'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] uppercase font-black tracking-tight transition-colors truncate ${
                      woStep === s.step 
                        ? 'text-indigo-600 font-black' 
                        : s.step < woStep 
                          ? 'text-emerald-500 font-extrabold' 
                          : 'text-slate-400 group-hover:text-slate-600'
                    }`}>
                      {s.label}
                    </span>
                    <span className={`text-[8px] sm:text-[9px] font-bold text-slate-400 truncate mt-0.5 transition-colors ${
                      woStep === s.step ? 'text-slate-600' : 'text-slate-400/80'
                    }`}>
                      {s.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: CARGO COLLECTION */}
          {woStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Package className="text-indigo-600 animate-pulse" size={20} /> 1. Cargo Collection
                </h3>
                <p className="text-xs text-slate-500 mt-1">Specify items, quantity, weights and snap real-world condition photos.</p>
              </div>

              {/* Hidden universal file camera input */}
              <input 
                type="file" 
                id="universal-wo-camera" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const imgData = reader.result as string;
                      if (capturingItemId === 'new') {
                        setWoItemImage(imgData);
                        toast.success("Photo captured for new item!");
                      } else if (capturingItemId) {
                        setWoItems(prev => prev.map(item => item.id === capturingItemId ? { ...item, image: imgData } : item));
                        toast.success("Photo updated in the item list!");
                      }
                      setCapturingItemId(null);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              {/* Item input box */}
              <div className="bg-slate-50 border border-slate-200/50 p-3 sm:p-5 rounded-2xl space-y-3">
                <div className="space-y-3">
                  {/* Row 1: Item Name */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargo Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., File bundle, Parcel box, Clothes..."
                      className="w-full p-2.5 bg-white text-slate-950 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-xs font-semibold placeholder:text-slate-350"
                      value={woItemName}
                      onChange={(e) => setWoItemName(e.target.value)}
                    />
                  </div>
                  
                  {/* Row 2: Weight, Quantity, Snap in a single line */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Weight (kg)</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 2.5"
                        step="any"
                        className="w-full p-2.5 bg-white text-slate-950 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-xs font-semibold text-center"
                        value={woItemWeight || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          setWoItemWeight(val);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate text-center">Quantity</label>
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1 sm:px-1.5 h-[38px] justify-between">
                        <button
                          type="button"
                          onClick={() => setWoItemQuantity(q => Math.max(1, q - 1))}
                          className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          placeholder="Qty"
                          className="w-10 sm:w-12 text-center bg-transparent border-0 font-bold text-sm sm:text-base p-0 focus:ring-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={woItemQuantity || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10));
                            setWoItemQuantity(val === '' ? 1 : val);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setWoItemQuantity(q => q + 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer active:scale-95 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-center font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Snap Photo</label>
                      <div className="flex gap-1.5 items-center justify-center w-full">
                        <button 
                          type="button"
                          onClick={() => {
                            setCapturingItemId('new');
                            document.getElementById('universal-wo-camera')?.click();
                          }}
                          className={`flex-1 h-[38px] rounded-xl flex items-center justify-center border transition-all cursor-pointer relative ${
                            woItemImage 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 ring-2 ring-emerald-100' 
                              : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300'
                          }`}
                        >
                          <Camera size={14} className={!woItemImage ? "text-indigo-600" : ""} />
                          {woItemImage && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-[8px] text-white">✓</span>
                          )}
                        </button>
                        {woItemImage && (
                          <button 
                            type="button"
                            onClick={() => {
                              setWoItemImage('');
                              toast.info("Cleared item photo!");
                            }}
                            className="w-8 h-8 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-150">
                  <span className="text-[10px] font-bold text-slate-400">Add collected items representing cargo.</span>
                  <button 
                    type="button"
                    onClick={addWOItem}
                    disabled={!woItemName}
                    className={`px-6 py-2 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-xs ${
                      woItemName 
                        ? 'bg-slate-900 text-white hover:bg-black hover:shadow-sm' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Total Summary of Cargo: Items Count, Total Weight, Shipping Rate */}
              {(() => {
                const totalWoItemsCount = woItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
                const totalWoWeightCalculated = woItems.reduce((acc, item) => acc + (item.weight * (item.quantity || 1)), 0);
                const woRate = shippingRates[woAddress.country] || 10;
                return (
                  <div className="grid grid-cols-3 gap-3 p-4 bg-indigo-50/45 border border-indigo-100/70 rounded-2xl">
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Qty</span>
                      <span className="text-sm sm:text-base font-black text-indigo-950 mt-0.5 block">{totalWoItemsCount} {totalWoItemsCount === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div className="text-center border-x border-indigo-100/80 font-sans">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Weight</span>
                      <span className="text-sm sm:text-base font-black text-indigo-950 mt-0.5 block">{totalWoWeightCalculated.toFixed(1)} kg</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Shipping Rate</span>
                      <span className="text-sm sm:text-base font-black text-emerald-600 mt-0.5 block">₹{woRate.toFixed(2)}/kg</span>
                    </div>
                  </div>
                );
              })()}

              {/* Collected List items list */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                    <Boxes size={12} className="text-indigo-600/70" /> Collected Items List
                  </span>
                  {woItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setWoIsEditingItems(!woIsEditingItems)}
                      className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-extrabold cursor-pointer h-7 ${
                        woIsEditingItems 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                      id="wo-edit-list-btn"
                    >
                      <Pencil size={10} />
                      <span>{woIsEditingItems ? 'Done' : 'Edit'}</span>
                    </button>
                  )}
                </div>

                {woItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-medium text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    No items added yet. Enter items details above to start collecting.
                  </div>
                ) : (
                  woItems.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-2xl border border-slate-150 shadow-xs hover:border-slate-350 transition-all gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          onClick={() => {
                            if (woIsEditingItems) {
                              setCapturingItemId(item.id);
                              document.getElementById('universal-wo-camera')?.click();
                            }
                          }}
                          className={`w-10 h-10 rounded-xl bg-slate-50 border overflow-hidden shrink-0 flex items-center justify-center transition-all ${
                            woIsEditingItems 
                              ? 'border-dashed border-slate-250 cursor-pointer hover:border-indigo-400 group relative' 
                              : 'border-slate-150'
                          }`}
                        >
                          {item.image ? (
                            <>
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {woIsEditingItems && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera size={14} className="text-white" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              {woIsEditingItems ? (
                                <>
                                  <Camera size={14} className="text-indigo-500 animate-pulse" />
                                  <span className="text-[6px] text-slate-400 font-extrabold tracking-tighter uppercase mt-0.5">SNAP</span>
                                </>
                              ) : (
                                <Package size={16} className="text-slate-300" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-y-2 gap-x-4 flex-1 min-w-0">
                          {/* Item Name */}
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex-1 min-w-[100px] sm:min-w-[140px]" title={item.name}>
                            {item.name}
                          </div>
                          
                          {/* Item Values/Controls in single line */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-semibold text-slate-600 shrink-0">
                            {/* Quantity Control */}
                            {woIsEditingItems ? (
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-400">Qty</span>
                                <input
                                  type="number"
                                  value={item.quantity || 1}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    setWoItems(woItems.map(i => i.id === item.id ? { ...i, quantity: val } : i));
                                  }}
                                  className="w-10 text-center bg-white border border-slate-200 rounded font-bold text-xs p-0.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-slate-50/70 border border-slate-150 rounded-lg px-2 py-0.5 text-xs">
                                <span className="text-[8px] font-extrabold uppercase text-slate-450">Qty:</span>
                                <span className="font-bold text-slate-800">{item.quantity || 1}</span>
                              </div>
                            )}

                            {/* Weight Control */}
                            {woIsEditingItems ? (
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-400">Wt</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={item.weight}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    setWoItems(woItems.map(i => i.id === item.id ? { ...i, weight: val } : i));
                                  }}
                                  className="w-14 text-center bg-white border border-slate-200 rounded font-bold text-xs p-0.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-[9px] font-bold text-slate-400">kg</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-slate-50/70 border border-slate-150 rounded-lg px-2 py-0.5 text-xs">
                                <span className="text-[8px] font-extrabold uppercase text-slate-450">Wt:</span>
                                <span className="font-bold text-slate-800">{item.weight} kg</span>
                              </div>
                            )}

                            {/* Total calculated field */}
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/30 whitespace-nowrap">
                              Total: {(item.weight * (item.quantity || 1)).toFixed(1)} kg
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end shrink-0">
                        {woIsEditingItems ? (
                          <>
                            <button 
                              type="button"
                              onClick={() => {
                                setCapturingItemId(item.id);
                                document.getElementById('universal-wo-camera')?.click();
                              }}
                              className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-all cursor-pointer"
                              title="Snap Photo"
                            >
                              <Camera size={14} />
                            </button>
                            
                            <button 
                              type="button"
                              onClick={() => setWoItems(woItems.filter(i => i.id !== item.id))}
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
                {woItems.length > 0 && (
                  <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold">Keep cargo list synchronized with servers.</span>
                    <button
                      type="button"
                      onClick={handleWOSaveDetails}
                      className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer animate-pulse hover:animate-none"
                    >
                      <Save size={14} /> Save Collected Cargo List
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: KYC VERIFICATION DOCUMENTS */}
          {woStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600" size={20} /> 2. KYC Verification Proof
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Collect customer identity verification scans or bill copies for outbound clearances.</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-black rounded border border-amber-100 uppercase tracking-widest leading-none shrink-0">
                  KYC MANDATORY
                </span>
              </div>

              {/* Document Camera/File Selector */}
              <input 
                type="file" 
                id="universal-wo-doc-camera" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const imgData = reader.result as string;
                      setWoDocImage(imgData);
                      toast.success("Document photo loaded successfully!");
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              {/* Upload Panel */}
              <div className="bg-slate-50 border border-slate-205 p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 border-none">
                    <label className="block text-[10px] font-black text-slate-505 uppercase tracking-widest mb-1.5">Document Type</label>
                    <select
                      className="w-full p-2.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-semibold"
                      value={woDocType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWoDocType(val);
                        // Set default names
                        if (val === 'Aadhar Card') setWoDocName('Customer Aadhar Card');
                        else if (val === 'Passport') setWoDocName('Customer Passport');
                        else if (val === 'PAN Card') setWoDocName('Customer PAN Card');
                        else if (val === 'Customs Declaration') setWoDocName('Signed Customs Declaration');
                        else if (val === 'Invoice Copy') setWoDocName('Commercial Invoice / Bill');
                        else setWoDocName('');
                      }}
                    >
                      <option value="Aadhar Card">Aadhar Card</option>
                      <option value="Passport">Passport Copy</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Customs Declaration">Customs Declaration form</option>
                      <option value="Invoice Copy">Commercial Invoice / Invoice copy</option>
                      <option value="Other">Other Document Copy</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-black text-slate-505 uppercase tracking-widest mb-1.5">Document Description/Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Aadhar card number or custom label"
                      className="w-full p-2.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-xs font-semibold placeholder:text-slate-350"
                      value={woDocName}
                      onChange={(e) => setWoDocName(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => document.getElementById('universal-wo-doc-camera')?.click()}
                      className={`w-full py-2.5 px-3 rounded-xl border-2 border-dashed font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        woDocImage 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-indigo-200 hover:border-indigo-400 bg-white text-indigo-700'
                      }`}
                    >
                      <Camera size={14} />
                      {woDocImage ? 'Change Photo' : 'Take Picture'}
                    </button>
                  </div>
                </div>

                {woDocImage && (
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="relative w-full max-w-[200px] h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img 
                        src={woDocImage} 
                        alt="Document Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setWoDocImage('')}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const finalName = woDocName || `${woDocType} Copy`;
                      if (!woDocImage) {
                        toast.error('Please snap or upload a copy of the document first.');
                        return;
                      }
                      const newDoc = {
                        id: 'doc_' + Date.now(),
                        name: finalName,
                        type: woDocType,
                        image: woDocImage,
                        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                      setWoDocuments([...woDocuments, newDoc]);
                      setWoDocName('');
                      setWoDocImage('');
                      toast.success(`${woDocType} added to intermediate collected checklist!`);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus size={14} /> Add Document
                  </button>
                </div>
              </div>

              {/* Added Documents list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Collected Documents Database</h4>
                {woDocuments.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                    <FileText className="mx-auto text-slate-350 mb-2" size={32} />
                    <p className="text-xs text-slate-400 font-medium">No documents captured yet.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Ask customer for ID copy, choose type and tap "Take Picture" to log copy.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {woDocuments.map(doc => (
                      <div key={doc.id} className="p-4 bg-slate-50 hover:bg-slate-100/75 transition-all border border-slate-200/60 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 overflow-hidden shrink-0">
                            <img 
                              src={doc.image} 
                              alt={doc.name} 
                              className="w-full h-full object-cover cursor-zoom-in"
                              onClick={() => {
                                const w = window.open();
                                if (w) {
                                  w.document.write(`<img src="${doc.image}" style="max-width:100%; height:auto;" />`);
                                } else {
                                  toast.info("Check screen for document preview.");
                                }
                              }}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate">{doc.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-bold rounded border border-indigo-100">
                                {doc.type}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">{doc.uploadedAt}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            setWoDocuments(woDocuments.filter(d => d.id !== doc.id));
                            toast.info(`${doc.name} removed.`);
                          }}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100 mt-4">
                <span className="text-[10px] text-slate-400 font-bold">Keep KYC documents synchronized with servers.</span>
                <button
                  type="button"
                  onClick={handleWOSaveDetails}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer"
                >
                  <Save size={14} /> Save KYC Progress
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DESTINATION ADDRESS */}
          {woStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="text-red-500 animate-bounce" size={20} /> 3. Destination Address Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">Provide strict destination parameters for duty computation of custom layers.</p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient Full Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm"
                    value={woAddress.fullName}
                    onChange={e => setWoAddress({...woAddress, fullName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email ID</label>
                    <input 
                      type="email" 
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm"
                      value={woAddress.email}
                      onChange={e => setWoAddress({...woAddress, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient Phone</label>
                    <input 
                      type="tel" 
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm"
                      value={woAddress.phone}
                      onChange={e => setWoAddress({...woAddress, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address Line 1</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm"
                    value={woAddress.addressLine1}
                    onChange={e => setWoAddress({...woAddress, addressLine1: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">City</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm"
                      value={woAddress.city}
                      onChange={e => setWoAddress({...woAddress, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Zip Code</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm"
                      value={woAddress.zipCode}
                      onChange={e => setWoAddress({...woAddress, zipCode: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination Country</label>
                  <select 
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm"
                    value={woAddress.country}
                    onChange={e => setWoAddress({...woAddress, country: e.target.value})}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100 mt-6 max-w-xl">
                <span className="text-[10px] text-slate-400 font-bold">Keep destination parameters synchronized with servers.</span>
                <button
                  type="button"
                  onClick={handleWOSaveDetails}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer"
                >
                  <Save size={14} /> Save Destination Details
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SCHEDULE & PAY */}
          {woStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans relative">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={20} /> 4. Shipping Schedule & Status
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Review the designated ship dates, apply localized status rules and configure payment gateway channels.</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar size={12} className="text-indigo-600" /> Select Shipping Date</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {SHIPPING_DATES.map(date => (
                      <button 
                        type="button"
                        key={date}
                        onClick={() => setWoShippingDate(date)}
                        className={`p-3 rounded-xl border-2 transition-all text-center cursor-pointer ${woShippingDate === date ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                      >
                        <div className="text-[8px] font-bold uppercase opacity-60 mb-1">March</div>
                        <div className="text-base font-black">{date.split('-')[2]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🔒 CUSTOMER AUTHORIZATION (OTP via WhatsApp) */}
                <div className="p-5 rounded-2xl border border-emerald-150 bg-emerald-50/10 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <MessageCircle size={18} className="text-emerald-600 shrink-0" /> WhatsApp Cargo Authorization
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Send the collected items list and secure authorization OTP directly as a text message to the customer's WhatsApp in one click.
                      </p>
                    </div>
                    {woOtpVerified ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                        <Check size={12} strokeWidth={3} /> Authorized
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 animate-pulse shrink-0">
                        Pending OTP
                      </span>
                    )}
                  </div>

                  {/* One-Click Send WhatsApp Action */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        setWoOtpCode(code);
                        setWoOtpSent(true);
                        setWoOtpVerified(false);
                        setWoOtpInput('');
                        
                        // Build plain text items list
                        const itemsListText = woItems.map((item, index) => 
                          `• ${item.name} (${item.quantity || 1}x) - ${(item.weight * (item.quantity || 1)).toFixed(1)} kg`
                        ).join('\n');

                        const customerPhoneNumber = (woAddress.phone || activeWorkOrder?.phone || '').replace(/\D/g, '');
                        
                        const whatsappMsg = `📌 *CARGO COLLECTION AUTHORIZATION*\n\n` +
                          `*Work Order:* ${activeWorkOrder?.id || 'NEW'}\n` +
                          `*Customer Name:* ${woAddress.fullName}\n\n` +
                          `*Collected Items:*\n${itemsListText}\n\n` +
                          `--------------------------------\n` +
                          `*Total Weight:* ${woTotalWeight.toFixed(1)} kg\n` +
                          `*Estimated Cost:* ₹${woTotalCost.toFixed(2)}\n` +
                          `--------------------------------\n\n` +
                          `🔑 *SECURE AUTHORIZATION OTP PIN:* *${code}*\n\n` +
                          `Please tell this 6-digit PIN code to our field agent to authorize the cargo collection. Thank you!`;

                        const whatsappUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(customerPhoneNumber)}&text=${encodeURIComponent(whatsappMsg)}`;
                        
                        // Instantly open the WhatsApp API URL to send
                        window.open(whatsappUrl, '_blank');
                        
                        toast.success(`OTP [${code}] generated! Opening WhatsApp chat for: ${woAddress.fullName || 'Customer'}`);
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all border border-emerald-500"
                    >
                      <MessageCircle size={14} /> Send Items List + OTP to Customer WhatsApp (1-Click)
                    </button>
                  </div>

                  {woOtpSent && (
                    <div className="space-y-3 pt-3 border-t border-slate-150">
                      <div className="text-xs font-bold text-slate-700 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <span className="flex items-center gap-1.5"><Lock size={12} className="text-indigo-600" /> Enter Customer Authorization OTP:</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-max">Simulated Code: {woOtpCode}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP code"
                          value={woOtpInput}
                          onChange={(e) => setWoOtpInput(e.target.value.replace(/\D/g, ''))}
                          disabled={woOtpVerified}
                          className="w-full sm:flex-1 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-center font-bold tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-emerald-750 disabled:border-emerald-300 text-sm"
                        />
                        <button
                          type="button"
                          disabled={woOtpVerified || !woOtpInput}
                          onClick={() => {
                            if (woOtpInput === woOtpCode) {
                              setWoOtpVerified(true);
                              toast.success("Customer cargo authorization verified successfully!");
                              confetti({ particleCount: 30, spread: 50 });
                            } else {
                              toast.error("Invalid secure OTP code. Please retry or get a new OTP.");
                            }
                          }}
                          className={`w-full sm:w-auto px-6 py-2.5 font-black rounded-xl text-xs cursor-pointer transition-all shrink-0 ${
                            woOtpVerified 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                          }`}
                        >
                          {woOtpVerified ? 'Verified ✓' : 'Verify'}
                        </button>
                      </div>
                      
                      {!woOtpVerified && (
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                          Ask your customer for the 6-digit PIN that was sent to their WhatsApp. Verify to confirm authorized collection.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipping cost payment setup */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><CreditCard size={11} className="text-emerald-600" /> Payment Method</h4>
                  
                  {!woOtpVerified ? (
                    <div className="p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center py-8">
                      <Lock size={20} className="text-slate-400 mb-1.5 animate-bounce" />
                      <div className="text-xs font-bold text-slate-700">Payment Unlocked via Customer OTP</div>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1">Please complete customer WhatsApp verification above to configure the localized payment gateway channel.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div 
                        onClick={() => setWoPaymentMethod('cash')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${woPaymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}
                        id="wo-payment-cash"
                      >
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shrink-0">
                          <Banknote size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold">Cash On Delivery (Cash)</div>
                          <div className="text-[10px] text-slate-500">Pay cash at doorstep</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${woPaymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {woPaymentMethod === 'cash' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>

                      <div 
                        onClick={() => setWoPaymentMethod('phonepe')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${woPaymentMethod === 'phonepe' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}
                      >
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">Pe</div>
                        <div className="flex-1">
                          <div className="text-sm font-bold">PhonePe</div>
                          <div className="text-[10px] text-slate-500">UPI, Wallet</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${woPaymentMethod === 'phonepe' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {woPaymentMethod === 'phonepe' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>

                      <div 
                        onClick={() => setWoPaymentMethod('card')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${woPaymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}
                      >
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white shrink-0"><CreditCard size={18} /></div>
                        <div className="flex-1">
                          <div className="text-sm font-bold">Credit / Debit Card</div>
                          <div className="text-[10px] text-slate-500">Visa, Mastercard</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${woPaymentMethod === 'card' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {woPaymentMethod === 'card' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price list sidebar inside Step 4 */}
              <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-5 space-y-4 shadow-xl">
                <span className="text-[8px] font-black uppercase text-indigo-400 bg-slate-850 border border-slate-700/60 rounded px-2 py-0.5 tracking-wider inline-block font-mono">Consolidated Pricing</span>
                
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Total Weight</span>
                    <span className="text-white font-bold">{woTotalWeight.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Shipping Rate</span>
                    <span className="text-white font-bold">₹{woRate}/kg</span>
                  </div>
                  {woDiscountPercent > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-rose-400 font-bold">
                      <span>Discount ({woDiscountPercent}%)</span>
                      <span>-₹{woDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-800 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black">Total Cost</span>
                    <span className="text-base sm:text-lg font-black text-indigo-400">₹{woTotalCost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Interactive Simulated Smartphone - WhatsApp Customer View */}
                {showSimulatedWhatsapp && woOtpCode && (
                  <div className="border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden mt-6 text-slate-900 shadow-2xl transition-all duration-300 transform scale-100">
                    <div className="bg-emerald-600 text-white p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
                        <div className="leading-tight">
                          <div className="text-[8px] font-bold uppercase tracking-wider text-emerald-100 opacity-90">Simulation View</div>
                          <div className="text-xs font-black">Customer's WhatsApp Phone</div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowSimulatedWhatsapp(false)} 
                        className="text-[9px] uppercase font-bold tracking-wider text-emerald-100 hover:text-white bg-emerald-700/60 px-2 py-0.5 rounded cursor-pointer"
                      >
                        Hide Screen
                      </button>
                    </div>

                    <div className="p-3.5 bg-[#efeae2] h-64 overflow-y-auto space-y-3 custom-scrollbar flex flex-col justify-end">
                      {/* Document Attachment Message Card */}
                      <div className="bg-white rounded-lg p-2 max-w-[85%] self-start shadow-xs text-[11px] space-y-1.5 border border-slate-200">
                        <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-md border border-emerald-100">
                          <FileText size={16} className="text-rose-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-800 truncate">Cargo_Manifest_{activeWorkOrder?.id || 'NEW'}.pdf</p>
                            <p className="text-[8px] text-slate-550 font-bold">PDF Document • {(woItems.length * 0.12).toFixed(2)} MB</p>
                          </div>
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white ml-auto shrink-0 shadow-xs cursor-pointer hover:bg-emerald-700">
                            <Download size={10} />
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center justify-between">
                          <span>Manifest Attachment list</span>
                          <span className="text-[8px]">05:36 PM ✓✓</span>
                        </div>
                      </div>

                      {/* Text Dialog with OTP block */}
                      <div className="bg-white rounded-lg p-2.5 max-w-[85%] self-start shadow-xs text-[11px] space-y-2 border border-slate-200">
                        <div className="text-[10px] leading-relaxed text-slate-800 space-y-1">
                          <p className="font-extrabold text-indigo-700">📌 Cargo Picked Up Manifest</p>
                          <p className="text-[9px] text-slate-600 font-mono">ID: {activeWorkOrder?.id}</p>
                          <div className="border-t border-dashed my-1 border-slate-200" />
                          <p className="font-bold underline text-slate-700">Items Shipped:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-[8px] text-slate-600 font-mono">
                            {woItems.map(item => (
                              <li key={item.id} className="truncate">
                                {item.name} ({item.quantity || 1}x, {item.weight} kg)
                              </li>
                            ))}
                          </ul>
                          <div className="border-t border-dashed my-1 border-slate-200" />
                          <p className="text-[9px] text-slate-700">Total weight: <b>{woTotalWeight.toFixed(1)} kg</b></p>
                          <p className="text-[9px] text-slate-750">Estimated Bill: <b>₹{woTotalCost.toFixed(2)}</b></p>
                          <div className="bg-amber-50 p-1.5 rounded-md border border-amber-250 mt-2 text-center text-slate-800">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-wider">YOUR SECURE OTP PIN</p>
                            <p className="text-sm font-black tracking-widest text-indigo-950 my-0.5 select-all">{woOtpCode}</p>
                            <p className="text-[7px] text-slate-400 font-medium">Share with agent to confirm cargo collection</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[8px] text-slate-400">
                          <button 
                            type="button"
                            onClick={() => {
                              setWoOtpInput(woOtpCode);
                              toast.info("OTP Pin filled in Agent input box!");
                            }}
                            className="text-[9px] text-indigo-650 font-black hover:underline cursor-pointer bg-slate-50 px-1.5 py-0.5 rounded border border-indigo-100"
                          >
                            ⚡ Autofill PIN
                          </button>
                          <span>05:36 PM ✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-150 flex items-center justify-between gap-4 select-none">
            {woStep > 1 ? (
              <button
                type="button"
                onClick={() => setWoStep(prev => prev - 1)}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                ← Previous Step
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => setActiveWorkOrder(null)}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl border border-slate-200 text-slate-450 hover:text-red-700 hover:border-red-150 font-bold hover:bg-slate-50 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                Cancel & Exit
              </button>
            )}

            {woStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (woStep === 1 && woItems.length === 0) {
                    toast.error("Please add at least 1 collected item to the cargo list first.");
                    return;
                  }
                  setWoStep(prev => prev + 1);
                }}
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
              >
                Next Step →
              </button>
            ) : woStep === 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (!woAddress.fullName.trim()) {
                    toast.error("Please specify Recipient Full Name.");
                    return;
                  }
                  if (!woAddress.addressLine1.trim()) {
                    toast.error("Please specify Address Line 1.");
                    return;
                  }
                  setWoStep(4);
                }}
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
              >
                Next Step →
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleWOComplete}
                disabled={woItems.length === 0 || !woAddress.email || !woAddress.fullName || !woOtpVerified}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-250 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={15} className="shrink-0" /> {!woOtpVerified ? 'Awaiting Customer OTP Verification...' : 'Collect Payment & Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }, [activeWorkOrder, woItems, woItemName, woItemWeight, isWOPaid, woOrderId, woPaymentMethod, woShippingDate, orders, appointments, setActiveWorkOrder, setOrders, woAddress, address, currentUser, handleWOSaveDetails, woStatusInput, setWoStatusInput, woStep, setWoStep, woIsEditingItems, setWoIsEditingItems, woOtpCode, woOtpSent, woOtpVerified, woOtpInput, showSimulatedWhatsapp]);

  const AgentSection = useMemo(() => {
    if (!currentUser) return null;
    
    const agentId = currentUser.id.toUpperCase();
    const scheduledApts = appointments.filter(a => a.status === 'Scheduled' || a.status === 'Pending Pickup');
    const completedApts = appointments.filter(a => a.status === 'Completed' || a.status === 'Picked Up');
    const canceledApts = appointments.filter(a => a.status === 'Cancelled');

    const displayedApts = 
      agentActiveTab === 'Scheduled' ? scheduledApts : 
      agentActiveTab === 'Completed' ? completedApts : 
      agentActiveTab === 'Canceled' ? canceledApts : [];

    // Real dynamic stats calculation
    const agentOrders = orders;

    const totalWeightCollected = agentOrders.reduce((sum, o) => {
      if (['Picked Up', 'Delivered', 'Received at Warehouse', 'In Warehouse', 'Ready to Ship', 'In Transit', 'Out for Delivery'].includes(o.status)) {
        return sum + (o.totalWeight || o.total_weight || 0);
      }
      return sum;
    }, 0);

    const totalRevenuePaid = agentOrders.reduce((sum, o) => {
      if (['Delivered', 'Received at Warehouse', 'In Warehouse', 'Ready to Ship', 'In Transit', 'Out for Delivery'].includes(o.status) && o.paymentStatus === 'Paid') {
        return sum + (o.totalCost || o.total_cost || 0);
      }
      return sum;
    }, 0);

    const totalTasksCount = scheduledApts.length + completedApts.length + canceledApts.length;
    const productivityRate = totalTasksCount > 0 
      ? Math.round((completedApts.length / totalTasksCount) * 100) 
      : 100;

    // Daily historical collection logic for AreaChart
    const dateWeightMap: Record<string, number> = {};
    const dateCountMap: Record<string, number> = {};

    completedApts.forEach(apt => {
      const matchingOrder = orders.find(o => o.id === apt.id);
      const weight = matchingOrder?.totalWeight || 0;
      const dateStr = apt.date; // has YYYY-MM-DD
      dateWeightMap[dateStr] = (dateWeightMap[dateStr] || 0) + weight;
      dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
    });

    const chartData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartData.push({
        date: dStr,
        label,
        weight: dateWeightMap[dStr] || 0,
        pickups: dateCountMap[dStr] || 0,
      });
    }

    // Agent dynamic activities list
    const agentActivities: any[] = [];
    scheduledApts.forEach(apt => {
      agentActivities.push({
        id: `act-sched-${apt.id}`,
        type: 'scheduled',
        title: `Scheduled Pickup Request`,
        desc: `Assigned for ${apt.customerName} [${apt.time}]`,
        details: apt.address,
        timeLabel: 'Scheduled',
        style: 'text-indigo-600 bg-indigo-50 border-indigo-100'
      });
    });

    completedApts.forEach(apt => {
      const matchingOrder = orders.find(o => o.id === apt.id);
      const weightStr = matchingOrder ? `${matchingOrder.totalWeight || 0} kg` : 'N/A';
      const revStr = matchingOrder ? `₹${(matchingOrder.totalCost || 0).toFixed(2)}` : 'N/A';
      agentActivities.push({
        id: `act-comp-${apt.id}`,
        type: 'completed',
        title: `Completed Pickup`,
        desc: `Collected ${weightStr} from ${apt.customerName} (${revStr})`,
        details: apt.address,
        timeLabel: apt.date,
        style: 'text-emerald-600 bg-emerald-50 border-emerald-100'
      });
    });

    canceledApts.forEach(apt => {
      agentActivities.push({
        id: `act-cand-${apt.id}`,
        type: 'cancelled',
        title: `Cancelled Pickup`,
        desc: `Pickup canceled for ${apt.customerName}`,
        details: apt.address,
        timeLabel: apt.date,
        style: 'text-rose-600 bg-rose-50 border-rose-100'
      });
    });

    // Sort: put latest first or keep structured
    agentActivities.sort((a, b) => b.timeLabel.localeCompare(a.timeLabel));

    if (activeWorkOrder) {
      return WorkOrderSection;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Agent Portal</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs sm:max-w-none">Manage & process home pickups.</p>
          </div>
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs sm:text-sm font-bold shrink-0 animate-pulse">
            {scheduledApts.length} Pending
          </div>
        </div>

        {/* Mobile View: 2-Level Navigation tabs */}
        <div className="md:hidden space-y-4">
          {/* Level 1: Main Tabs */}
          <div className="flex border-b border-slate-100 p-0.5">
            <button
              onClick={() => {
                setAgentMainTab('Summary');
                setAgentActiveTab('Summary');
              }}
              className={`flex-1 flex items-center justify-center gap-2 pb-3 border-b-2 font-black text-xs sm:text-sm transition-all relative ${
                agentMainTab === 'Summary' && agentActiveTab === 'Summary'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart3 size={15} />
              <span>Summary</span>
            </button>

            <button
              onClick={() => {
                setAgentMainTab('Home Pickup');
                if (agentActiveTab === 'Summary') {
                  setAgentActiveTab('Scheduled');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 pb-3 border-b-2 font-black text-xs sm:text-sm transition-all relative ${
                agentMainTab === 'Home Pickup' || agentActiveTab !== 'Summary'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Truck size={15} />
              <span>Home Pickup</span>
            </button>
          </div>

          {/* Level 2 Sub-Tabs (only when Home Pickup or active pickup lists is selected) */}
          {(agentMainTab === 'Home Pickup' || agentActiveTab !== 'Summary') && (
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 select-none animate-fadeIn">
              <button
                onClick={() => {
                  setAgentActiveTab('Scheduled');
                  setAgentMainTab('Home Pickup');
                }}
                className={`flex-1 py-1.5 text-[11px] font-black text-center rounded-lg transition-all ${
                  agentActiveTab === 'Scheduled'
                    ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                    : 'text-slate-500'
                }`}
              >
                Scheduled ({scheduledApts.length})
              </button>
              <button
                onClick={() => {
                  setAgentActiveTab('Completed');
                  setAgentMainTab('Home Pickup');
                }}
                className={`flex-1 py-1.5 text-[11px] font-black text-center rounded-lg transition-all ${
                  agentActiveTab === 'Completed'
                    ? 'bg-white text-emerald-600 shadow-sm font-extrabold'
                    : 'text-slate-500'
                }`}
              >
                Completed ({completedApts.length})
              </button>
              <button
                onClick={() => {
                  setAgentActiveTab('Canceled');
                  setAgentMainTab('Home Pickup');
                }}
                className={`flex-1 py-1.5 text-[11px] font-black text-center rounded-lg transition-all ${
                  agentActiveTab === 'Canceled'
                    ? 'bg-white text-rose-600 shadow-sm font-extrabold'
                    : 'text-slate-500'
                }`}
              >
                Canceled ({canceledApts.length})
              </button>
            </div>
          )}
        </div>

        {/* Desktop View Tabs Bar */}
        <div className="hidden md:flex border-b border-slate-100 gap-6 overflow-x-auto">
          <button
            onClick={() => {
              setAgentActiveTab('Summary');
              setAgentMainTab('Summary');
            }}
            className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all px-1 shrink-0 relative ${
              agentActiveTab === 'Summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 size={16} />
            <span>Activity Summary</span>
          </button>

          <button
            onClick={() => {
              setAgentActiveTab('Scheduled');
              setAgentMainTab('Home Pickup');
            }}
            className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all px-1 shrink-0 relative ${
              agentActiveTab === 'Scheduled'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock size={16} />
            <span>Scheduled</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              agentActiveTab === 'Scheduled' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {scheduledApts.length}
            </span>
          </button>

          <button
            onClick={() => {
              setAgentActiveTab('Completed');
              setAgentMainTab('Home Pickup');
            }}
            className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all px-1 shrink-0 relative ${
              agentActiveTab === 'Completed'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Completed</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              agentActiveTab === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {completedApts.length}
            </span>
          </button>

          <button
            onClick={() => {
              setAgentActiveTab('Canceled');
              setAgentMainTab('Home Pickup');
            }}
            className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all px-1 shrink-0 relative ${
              agentActiveTab === 'Canceled'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <XCircle size={16} />
            <span>Canceled</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              agentActiveTab === 'Canceled' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {canceledApts.length}
            </span>
          </button>
        </div>

        {agentActiveTab === 'Summary' ? (
          <div className="space-y-6">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed Jobs</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{completedApts.length}</div>
                  <div className="text-[10px] text-emerald-500 font-bold mt-0.5">{(completedApts.length / Math.max(1, totalTasksCount) * 100).toFixed(0)}% completion</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Box size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Weight Handled</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{totalWeightCollected.toFixed(1)} kg</div>
                  <div className="text-[10px] text-indigo-500 font-bold mt-0.5">Average {(totalWeightCollected / Math.max(1, completedApts.length)).toFixed(1)} kg / job</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Managed</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{totalRevenuePaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">Processed & fully paid</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Productivity Index</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{productivityRate}%</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">{scheduledApts.length} pending operations</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Weekly Weight Analytics</h3>
                    <p className="text-xs text-slate-400">Total volume of physical weight collected in pickups over the week.</p>
                  </div>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="kg" />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }}
                        labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
                      />
                      <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Pie Metrics */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Job Status Mix</h3>
                  <p className="text-xs text-slate-400">Distribution of assigned work orders.</p>
                </div>
                
                <div className="h-[200px] flex items-center justify-center relative">
                  {totalTasksCount === 0 ? (
                    <div className="text-sm text-slate-400 font-bold">No jobs assigned yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Scheduled', value: scheduledApts.length, color: '#4f46e5' },
                            { name: 'Completed', value: completedApts.length, color: '#10b981' },
                            { name: 'Canceled', value: canceledApts.length, color: '#f43f5e' }
                          ].filter(x => x.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { color: '#4f46e5' },
                            { color: '#10b981' },
                            { color: '#f43f5e' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {totalTasksCount > 0 && (
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-800">{totalTasksCount}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Jobs</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <span>Scheduled Pickup Tasks</span>
                    </div>
                    <span>{scheduledApts.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Completed / Picked Up</span>
                    </div>
                    <span>{completedApts.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Canceled Tasks</span>
                    </div>
                    <span>{canceledApts.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activities Timeline Log */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 font-sans">
                <History className="text-indigo-600" size={20} />
                Recent Operations and Activity Log
              </h3>
              
              {agentActivities.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold">
                  No registered activities found for this agent.
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {agentActivities.map((act) => (
                    <div key={act.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${act.style}`}>
                        {act.type === 'scheduled' ? <Clock size={20} /> : act.type === 'completed' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-950 truncate font-sans">{act.title}</h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.timeLabel}</span>
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5 font-medium leading-relaxed font-sans">{act.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-1">
                          <MapPin size={10} /> {act.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedApts.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-100">
                <CheckCircle2 size={64} className="mx-auto mb-4 text-slate-300 opacity-40" />
                <h3 className="text-xl font-bold text-slate-900">No pickups found</h3>
                <p className="text-slate-500">There are no {agentActiveTab.toLowerCase()} pickups assigned.</p>
              </div>
            ) : (
              displayedApts.map(apt => (
                <motion.div 
                  key={apt.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Truck size={24} />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Order</div>
                      <div className="text-sm font-black text-slate-900">{apt.id}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{apt.date}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{apt.time}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={14} className="text-slate-400 mt-1" />
                      <span className="text-slate-600 leading-tight">{apt.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <UserIcon size={14} className="text-slate-400" />
                      <span className="font-bold text-indigo-600">{apt.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Truck size={14} className="text-slate-400" />
                      <span>Agent: <strong className="text-slate-700">{apt.assignedAgent?.name || 'Unassigned / Any Agent'}</strong></span>
                    </div>
                  </div>

                  {apt.status === 'Completed' ? (
                    <div className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 text-md border border-emerald-100">
                      <CheckCircle2 size={16} /> Completed & Processed
                    </div>
                  ) : apt.status === 'Picked Up' ? (
                    <div className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-2 text-md border border-indigo-100">
                      <CheckCircle2 size={16} /> Picked Up
                    </div>
                  ) : apt.status === 'Cancelled' ? (
                    <div className="w-full py-3 bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center justify-center gap-2 text-md border border-rose-100">
                      <XCircle size={16} /> Pickup Canceled
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveWorkOrder(apt)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      Process Pickup <ArrowRight size={18} />
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }, [appointments, activeWorkOrder, setActiveWorkOrder, WorkOrderSection, currentUser, agentActiveTab, setAgentActiveTab, agentMainTab, setAgentMainTab, orders]);
  const renderWarehouseManagementSection = () => {
    const warehouseItems = items.filter(i => !orderedItemIds.has(i.id) && (i.source === 'Warehouse' || i.source === 'Pickup')).map(i => ({ ...i, orderId: null as string | null }));
    const orderWarehouseItems = orders.flatMap(o => 
      o.items.filter(i => (i.source === 'Warehouse' || i.source === 'Pickup') && o.status !== 'Delivered' && o.status !== 'Cancelled')
        .map(i => ({ ...i, orderId: o.id }))
    );
    
    const allItems = [...warehouseItems, ...orderWarehouseItems];
    const pendingItems = allItems.filter(i => i.status !== 'Received at Warehouse');
    const receivedItems = allItems.filter(i => i.status === 'Received at Warehouse');
    
    // Group received items by customer for consolidation
    const itemsByCustomer = receivedItems.reduce((acc, item) => {
      // In a real app, we'd have customer info on the item. 
      // For this demo, we'll use a mock customer name or ID.
      const customerId = 'CUST-' + (item.id.charCodeAt(0) % 5 + 1);
      if (!acc[customerId]) acc[customerId] = [];
      acc[customerId].push(item);
      return acc;
    }, {} as Record<string, ShippingItem[]>);

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Warehouse Operations</h2>
            <p className="text-slate-500 mt-1">Operational control for receiving, consolidation, and processing.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
              <Printer size={16} /> Print Manifest
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
              <RefreshCw size={16} /> Sync Inventory
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Inventory', value: warehouseItems.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Receiving', value: pendingItems.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Ready for Consolidation', value: Object.keys(itemsByCustomer).length, icon: ArrowUpDown, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Dispatched Today', value: orders.filter(o => o.status === 'Delivered').length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                    <StatIcon size={24} />
                  </div>
                  <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                </div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</h4>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Operations Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Receiving Queue */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ArrowUpDown size={20} className="text-indigo-600" /> Receiving Queue
                </h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search items..." 
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Item Details</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Reference</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Source</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Weight</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <Package size={48} className="opacity-20" />
                            <p className="font-bold">No pending items to receive.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pendingItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon size={20} />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{item.name}</div>
                                <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">ID: {item.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {item.orderId ? `Order: ${item.orderId.slice(0, 8)}` : 'Cart/Stock'}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                              item.source === 'Pickup' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {item.source.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" 
                                  className="w-16 p-1 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                  defaultValue={item.weight}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val !== item.weight) {
                                      if (item.orderId) {
                                        updateOrderItemWeight(item.orderId, item.id, val);
                                      } else {
                                        // Update weight for items not in an order yet
                                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, weight: val } : i));
                                        if (dbStatus.connected) {
                                          api.updateItemWeight(item.id, val).catch(err => console.error('Failed to update item weight:', err));
                                        }
                                      }
                                    }
                                  }}
                                />
                                <span className="text-[10px] font-bold text-slate-400">kg</span>
                              </div>
                              <div className="text-[8px] text-amber-600 font-bold max-w-[80px] leading-tight">Official weight update after arrival</div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-2">
                              <select 
                                className="p-1 px-2 text-[10px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                                value={item.status}
                                onChange={(e) => item.orderId ? updateOrderItemStatus(item.orderId, item.id, e.target.value as ShippingStatus) : updateItemStatus(item.id, e.target.value as ShippingStatus)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Awaiting Warehouse Arrival">Awaiting Arrival</option>
                                <option value="Received at Warehouse">Received at Warehouse</option>
                                <option value="Processing Order">Processing</option>
                                <option value="Consolidating items">Consolidating</option>
                                <option value="Packed">Packed</option>
                                <option value="Ready to Ship">Ready to Ship</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                              <button 
                                onClick={() => item.orderId ? updateOrderItemStatus(item.orderId, item.id, 'Received at Warehouse') : updateItemStatus(item.id, 'Received at Warehouse')}
                                className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                              >
                                {item.status === 'Received at Warehouse' ? 'Received' : 'Receive Now'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consolidation Hub */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 size={20} className="text-purple-600" /> Consolidation Hub
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium italic">Grouped by customer for international dispatch.</p>
              </div>
              <div className="p-8 space-y-6">
                {Object.entries(itemsByCustomer).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold">No items ready for consolidation.</p>
                  </div>
                ) : (
                  (Object.entries(itemsByCustomer) as [string, ShippingItem[]][]).map(([customerId, customerItems]) => (
                    <div key={customerId} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-purple-200 transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900">Customer: {customerId}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{customerItems.length} Items Ready</div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">
                          Create Shipment
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {customerItems.map(item => (
                          <div key={item.id} className="px-3 py-2 bg-white rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] font-bold text-slate-600">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            {item.name} ({item.weight}kg)
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Operations */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Warehouse size={120} />
              </div>
              <h3 className="text-lg font-black mb-6 relative z-10">Warehouse Layout</h3>
              <div className="grid grid-cols-4 gap-3 relative z-10">
                {['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'].map(zone => (
                  <div key={zone} className="aspect-square bg-white/10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer group">
                    <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors">{zone}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-white/60">
                <span>Capacity: 64% Full</span>
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[64%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900">Operational Tools</h3>
              <div className="space-y-3">
                {[
                  { label: 'Scan Barcode', icon: Search, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Generate Manifest', icon: FileText, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Update Weights', icon: Calculator, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Export Inventory', icon: Share, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Security Logs', icon: Lock, color: 'bg-slate-50 text-slate-600' },
                ].map((action, i) => {
                  const ActionIcon = action.icon;
                  return (
                    <button key={i} className="w-full p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center gap-4 group">
                      <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <ActionIcon size={18} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{action.label}</span>
                      <ChevronRight size={16} className="ml-auto text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200">
              <h3 className="text-lg font-black mb-2">Warehouse Support</h3>
              <p className="text-xs text-indigo-100 mb-6 leading-relaxed">Need help with inventory or logistics? Contact your regional manager.</p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                <Phone size={16} /> Call Manager
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderShopSidebar = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-black text-slate-900">
            From our <span className="bg-gradient-to-r from-deep-blue to-indigo-600 bg-clip-text text-transparent">Shop</span>
          </h4>
          <button 
            onClick={() => navigateTo('store')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {storeProducts.slice(0, 3).map(product => {
            const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
            const itemCount = cartItem?.quantity || 0;
            return (
              <div key={product.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex gap-4 relative">
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -left-1 z-10 w-6 h-6 bg-jiffex-orange text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white"
                    >
                      {itemCount}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 truncate">{product.name}</h5>
                    <p className="text-[10px] text-slate-500">₹{product.price} • {product.weight} kg</p>
                  </div>
                  <div className="flex justify-center mt-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addItem({ 
                        name: product.name, 
                        weight: product.weight, 
                        price: product.price, 
                        image: product.image,
                        estimatedDelivery: product.estimatedDelivery 
                      }, 'Store')}
                      className="w-8 h-8 bg-deep-blue text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-all shadow-md shadow-deep-blue/10"
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <ShoppingBag size={80} />
          </div>
          <div className="relative z-10 space-y-3">
            <h5 className="font-black text-lg">Consolidate & Save</h5>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Add items from our shop to your pickup or warehouse shipment. We'll pack everything together to save you on global shipping!
            </p>
            <button 
              onClick={() => navigateTo('store')}
              className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUnifiedCartSection = (mode?: 'Pickup' | 'Warehouse') => {
    // States are now in App to prevent focus loss

    const handleAdd = () => {
      if (!cartItemName) return;
      const unitWeight = typeof cartItemWeight === 'number' ? cartItemWeight : 0;
      addItem({ 
        name: cartItemName, 
        weight: unitWeight * cartItemQuantity,
        quantity: cartItemQuantity,
        fragile: cartItemFragile,
        invoiceNumber: cartItemInvoiceNumber,
        remarks: cartItemRemarks,
        purchaseSource: cartItemPurchaseSource,
        image: cartItemImageUrl
      }, mode || cartItemSource);
      setCartItemName('');
      setCartItemWeight('');
      setCartItemQuantity(1);
      setCartItemFragile(false);
      setCartItemInvoiceNumber('');
      setNavbarTrackingId('');
      setCartItemRemarks('');
      setCartItemImageUrl('');
      
      // Scroll to items list after adding
      if (mode === 'Warehouse') {
        toast.success(`"${cartItemName}" added to your shipment! Scroll down to review and click "Submit Order" to finalize.`);
        setTimeout(() => {
          warehouseItemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        toast.success(`"${cartItemName}" added to your pickup list!`);
      }
    };

    const handleCopyAddress = () => {
      const addressText = `${WAREHOUSE_ADDRESS.name}\nAttn: ${customerWarehouseId}\n${WAREHOUSE_ADDRESS.street}\n${WAREHOUSE_ADDRESS.city}, ${WAREHOUSE_ADDRESS.state} ${WAREHOUSE_ADDRESS.zip}\n${WAREHOUSE_ADDRESS.country}\nTel: ${WAREHOUSE_ADDRESS.phone}`;
      navigator.clipboard.writeText(addressText);
      toast.success('Warehouse address copied to clipboard!');
    };

    const hasActivePickup = currentUser 
      ? appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone))
      : (lastBookingRef ? appointments.some(a => a.id === lastBookingRef && a.status === 'Scheduled') : false);
    const activePickup = currentUser 
      ? appointments.find(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone))
      : (lastBookingRef ? appointments.find(a => a.id === lastBookingRef && a.status === 'Scheduled') : undefined);
    const hasCompletedPickup = lastBookingRef ? appointments.some(a => a.id === lastBookingRef && a.status === 'Completed') : false;

    const isCartEmpty = mode === 'Warehouse' 
      ? items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Warehouse' && !i.submitted).length === 0
      : mode === 'Pickup'
        ? items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Pickup' && !i.submitted).length === 0 && (isSchedulingNewPickup ? true : !hasActivePickup)
        : items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true).length === 0 && !hasActivePickup;

    const displayItems = mode 
      ? (mode === 'Warehouse' 
          ? items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Warehouse' && !i.submitted)
          : items.filter(i => !orderedItemIds.has(i.id) && i.source === mode))
      : items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);

    const displayWeight = displayItems.reduce((sum, item) => sum + (item.weight || 0), 0);
    const hasTBDWeight = displayItems.some(i => i.weight === 0);

    return (
      <div className="space-y-6">
        {activeTab === 'warehouse' ? (
          <div className="space-y-8">
            {/* Value Prop Banner */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                 <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-200">
                     <Globe size={14} /> Global Shipping Solutions
                   </div>
                   <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                     Ship from <span className="text-indigo-400">Anywhere</span>,<br />
                     Deliver to the <span className="text-indigo-400">USA</span>.
                   </h2>
                   <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-md">
                     Use our secure warehouse as your domestic shipping hub. We'll receive, verify, and forward your items globally.
                   </p>
                 </div>
                 <div className="hidden lg:grid grid-cols-2 gap-4">
                   {[
                     { icon: ShoppingBag, label: 'Shop Online', desc: 'Amazon, eBay, Flipkart' },
                     { icon: Box, label: 'Offline Goods', desc: 'Sent via local couriers' },
                     { icon: ShieldCheck, label: 'Secure Storage', desc: 'Climate controlled' },
                     { icon: Plane, label: 'Swift Forwarding', desc: 'Direct to your door' }
                   ].map((item, i) => (
                     <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                       <item.icon size={20} className="mb-2 text-indigo-400" />
                       <h4 className="text-sm font-black">{item.label}</h4>
                       <p className="text-[10px] text-slate-400">{item.desc}</p>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Address & Registration */}
              <div className="lg:col-span-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Step 1: Warehouse Address Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                         <MapPin size={24} />
                       </div>
                       <div>
                         <h3 className="text-xl font-black text-slate-900 leading-tight">Step 1: Use Our Address</h3>
                         <p className="text-xs text-slate-500 font-medium">Use this at checkout or hand to your courier</p>
                       </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 relative group">
                      <button 
                        onClick={handleCopyAddress}
                        className="absolute top-4 right-4 p-3 bg-white hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm transition-all border border-slate-200"
                        title="Copy Address"
                      >
                        <Copy size={16} />
                      </button>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Recipient Name / ID</p>
                          <p className="text-lg font-black text-slate-900">{WAREHOUSE_ADDRESS.name} - {customerWarehouseId}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Street Address</p>
                            <p className="text-sm font-bold text-slate-700">{WAREHOUSE_ADDRESS.street}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">City/State/Zip</p>
                            <p className="text-sm font-bold text-slate-700">{WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.state} {WAREHOUSE_ADDRESS.zip}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Country</p>
                          <p className="text-sm font-bold text-slate-700">{WAREHOUSE_ADDRESS.country}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                      <Info size={18} className="shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed font-medium">
                        <span className="font-bold">Pro Tip:</span> Always include your ID (<span className="font-bold">{customerWarehouseId}</span>) in the "Building/Suite" line to avoid processing delays.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Register Incoming Package */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                         <PackagePlus size={24} />
                       </div>
                       <div>
                         <h3 className="text-xl font-black text-slate-900 leading-tight">Step 2: Register Package</h3>
                         <p className="text-xs text-slate-500 font-medium">Pre-alert us about your shipment for faster sorting</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Description</label>
                        <input 
                          type="text" 
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                          placeholder="e.g. 5x Cotton T-Shirts, Laptop..."
                          value={cartItemName}
                          onChange={(e) => setCartItemName(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source</label>
                          <select 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-medium appearance-none"
                            value={cartItemPurchaseSource}
                            onChange={(e) => setCartItemPurchaseSource(e.target.value)}
                          >
                            <option value="Amazon">Amazon</option>
                            <option value="Flipkart">Flipkart</option>
                            <option value="Myntra">Myntra</option>
                            <option value="Ajio">Ajio</option>
                            <option value="Nykaa">Nykaa</option>
                            <option value="FirstCry">FirstCry</option>
                            <option value="Meesho">Meesho</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Image (URL Optional)</label>
                          <input 
                            type="text" 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                            placeholder="https://..."
                            value={cartItemImageUrl}
                            onChange={(e) => setCartItemImageUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tracking ID (if available)</label>
                          <input 
                            type="text" 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-mono text-sm"
                            placeholder="Courier tracking #"
                            value={cartItemInvoiceNumber}
                            onChange={(e) => setCartItemInvoiceNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                          <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1">
                            <button 
                              onClick={() => setCartItemQuantity(Math.max(1, cartItemQuantity - 1))}
                              className="p-3 hover:bg-white rounded-xl transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <input 
                              type="number" 
                              className="w-full bg-transparent text-center font-black outline-none"
                              value={cartItemQuantity}
                              onChange={(e) => setCartItemQuantity(Number(e.target.value))}
                            />
                            <button 
                              onClick={() => setCartItemQuantity(cartItemQuantity + 1)}
                              className="p-3 hover:bg-white rounded-xl transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                          <Info size={16} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-amber-900">Payment Notice</p>
                          <p className="text-[10px] text-amber-700 leading-relaxed">
                            Please ensure payment for all items is completed before they arrive at our warehouse. 
                            Unpaid items may experience delays in processing and forwarding.
                          </p>
                          <div className="pt-2 border-t border-amber-200 mt-2">
                             <p className="text-[10px] text-amber-700 leading-relaxed font-bold italic">
                               Note: The weight of each item will be officially updated by our team after it is physically received and weighed at the warehouse.
                             </p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleAdd}
                        disabled={!cartItemName}
                        className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${
                          cartItemName 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus size={20} /> Register Item
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3: Summary & Finalize */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8" ref={warehouseItemsRef}>
                  <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                         <CheckCircle2 size={24} />
                       </div>
                       <div>
                         <h3 className="text-xl font-black text-slate-900 leading-tight">Step 3: Review & Finalize</h3>
                         <p className="text-xs text-slate-500 font-medium">Confirm expected items for tracking</p>
                       </div>
                    </div>
                    <div className="px-6 py-3 bg-indigo-50 rounded-2xl text-xs font-black text-indigo-600 border border-indigo-100">
                      {displayItems.reduce((acc, item) => acc + (item.quantity || 1), 0)} Registered Items
                    </div>
                  </div>

                  {displayItems.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                        <Package size={40} strokeWidth={1} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900">No items registered yet</p>
                        <p className="text-sm max-w-[250px]">Items added in Step 2 will appear here for final confirmation.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {displayItems.map((item) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={item.id}
                            className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group relative"
                          >
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0 overflow-hidden">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package size={24} />
                                )}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-black text-slate-900 line-clamp-1">{item.name}</h4>
                                <div className="flex flex-wrap gap-2">
                                  <span className="px-2 py-0.5 bg-white rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100">
                                    {item.quantity} Qty
                                  </span>
                                  {item.purchaseSource && (
                                    <span className="px-2 py-0.5 bg-indigo-50 rounded-lg text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase tracking-tight">
                                      {item.purchaseSource}
                                    </span>
                                  )}
                                  {item.invoiceNumber && (
                                    <span className="px-2 py-0.5 bg-indigo-50 rounded-lg text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                      Track: {item.invoiceNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="bg-indigo-600 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
                         <div className="space-y-2 text-center md:text-left">
                           <h4 className="text-2xl font-black text-white leading-tight">Ready to send?</h4>
                           <p className="text-indigo-100 text-sm font-medium">Confirming this pre-alert helps us identify your package instantly on arrival.</p>
                         </div>
                         <button 
                           onClick={() => {
                             setItems(prev => prev.map(i => 
                               i.source === 'Warehouse' && !i.submitted 
                                 ? { ...i, submitted: true } 
                                 : i
                             ));
                             setActiveTab('cart');
                             toast.success('Pre-alert submitted successfully!');
                           }}
                           className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black shadow-lg hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95"
                         >
                           <Send size={24} /> Finalize Shipment
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!mode && hasActivePickup && !displayItems.some(i => i.source === 'Warehouse') && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm mb-6"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <Truck size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900">Home Pickup Scheduled</h4>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Your pickup is confirmed for <span className="text-indigo-600 font-bold">{activePickup?.date}</span> at <span className="text-indigo-600 font-bold">{activePickup?.time}</span>. 
                    Since you have opted for Home Pickup, item collection, weighing, and payment processing will be handled by our agent at your doorstep. <span className="font-bold">Final billing will be done at your home during pickup.</span> Once processed at our warehouse, you can track the full details in <span className="text-indigo-600 font-bold">My Orders</span>.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className={`${mode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
                {mode === 'Warehouse' ? (
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600">
                      <Package size={40} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Warehouse Redesign in Progress</h3>
                      <p className="text-slate-500 mt-2">New interface for shipments is being developed based on updated requirements.</p>
                    </div>
                  </div>
                ) : mode === 'Pickup' ? (
                  <>
                    <div className="space-y-4">
                  {mode === 'Pickup' && activePickupStep !== 5 && (
                    <>
                      {/* Header Section with Progress for Pickup */}
                      <div 
                        ref={pickupHeaderRef} 
                        className="sticky top-[80px] z-30 bg-white pt-4 pb-3 border-b border-slate-100 -mx-8 px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 scroll-mt-[100px]"
                      >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-deep-blue flex items-center justify-center text-jiffex-orange shadow-xl shadow-deep-blue/20">
                        <Truck size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-deep-blue tracking-tight">Home Pickup</h2>
                        <p className="text-sm text-slate-500 font-medium">
                          {activePickupStep === 5 ? 'Booking Confirmed' : (hasActivePickup && !isSchedulingNewPickup) ? 'Add items to your scheduled pickup' : 'Schedule an agent to collect from your home'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Indicator for Pickup */}
                    <div className="flex items-center gap-2 w-full md:w-[450px]">
                      {[
                        { step: 1, label: 'Items' },
                        { step: 2, label: 'Schedule' },
                        { step: 3, label: 'Address' },
                        { step: 4, label: 'Review' },
                        { step: 5, label: 'Done' }
                      ].map((s, idx) => (
                        <div key={s.step} className="flex-1 flex flex-col gap-2">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              activePickupStep === 5 && s.step === 5 ? 'bg-emerald-500 shadow-sm shadow-emerald-100' :
                              activePickupStep === s.step ? 'bg-jiffex-orange shadow-sm shadow-jiffex-orange/20' :
                              activePickupStep > s.step ? 'bg-deep-blue' : 'bg-slate-100'
                            }`}
                          />
                          <span className={`text-[9px] font-black uppercase tracking-tighter text-center transition-colors duration-500 ${
                            activePickupStep === s.step ? 'text-jiffex-orange' : 
                            activePickupStep > s.step ? 'text-deep-blue' : 'text-slate-400'
                          }`}>
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(hasActivePickup && activePickupStep !== 5 && !isSchedulingNewPickup) ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Column: Sticky Add Item Form */}
                      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                          <div className="flex items-center gap-3 text-indigo-600">
                            <PlusCircle size={24} />
                            <h4 className="text-xl font-black">Add Items</h4>
                          </div>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            Add any items you want the agent to collect from your home.
                          </p>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                              <input 
                                type="text" 
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                                placeholder="e.g. Traditional Dress, Spices..."
                                value={cartItemName}
                                onChange={(e) => setCartItemName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Est. Weight (kg)</label>
                              <input 
                                type="number" 
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                                placeholder="1.0"
                                value={cartItemWeight}
                                onChange={(e) => setCartItemWeight(Number(e.target.value))}
                              />
                            </div>
                            <button 
                              onClick={handleAdd}
                              disabled={!cartItemName}
                              className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${
                                cartItemName 
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200' 
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Plus size={20} /> Add to Pickup List
                            </button>
                          </div>
                        </div>

                        {/* Pickup Details Summary */}
                        {mode === 'Pickup' && (
                          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-indigo-600">
                                <Clock size={24} />
                                <h4 className="text-xl font-black">Pickup Details</h4>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                  <Calendar size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled For</p>
                                  <p className="text-sm font-black text-slate-900">
                                    {activePickup?.date} at {activePickup?.time}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                  <MapPin size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup Address</p>
                                  <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">
                                    {activePickup?.address}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Middle Column: Pickup Status & Items */}
                      <div className="lg:col-span-8 space-y-6">
                        {mode === 'Pickup' && (
                          <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 text-center space-y-6 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-200/50">
                              <Truck size={48} />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-2xl font-black text-slate-900">Pickup Scheduled!</h4>
                              <p className="text-slate-600 max-w-sm mx-auto">
                                Your agent is assigned. Add all your items here, and they will be collected during your scheduled slot.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Items List for Pickup */}
                        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xl font-black text-slate-900">Items in this Pickup</h4>
                            <span className="px-4 py-2 bg-indigo-50 rounded-2xl text-xs font-black text-indigo-600 border border-indigo-100">
                              {displayItems.reduce((acc, item) => acc + (item.quantity || 1), 0)} Items
                            </span>
                          </div>
                          
                          {displayItems.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
                              <Package size={48} strokeWidth={1} />
                              <p className="font-medium">No items added yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {displayItems.map((item) => (
                                <motion.div 
                                  layout
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  key={item.id}
                                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                      <Package size={20} />
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-slate-900">{item.name}</h5>
                                      <p className="text-[10px] text-slate-500 font-medium">
                                        {item.quantity} units • {item.weight} kg
                                      </p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      <div className="lg:col-span-12 space-y-6 min-h-[600px]">
                        <AnimatePresence mode="wait">
                        {/* Step 1: What type of items are you sending? */}
                      {activePickupStep === 1 && (
                        <motion.div 
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="p-8 rounded-[2.5rem] border bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10">
                                <Package size={24} />
                              </div>
                              <div>
                                <h4 className="text-xl font-black text-deep-blue">What type of items are you sending?</h4>
                              </div>
                            </div>
                          </div>

                          <div className="pt-8 space-y-8">
                                  <div className="space-y-4">
                                    <h5 className="text-sm font-black text-deep-blue uppercase tracking-wider">Select Item Type</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {[
                                        { id: 'Everyday Items', icon: <ShoppingBag size={20} /> },
                                        { id: 'Large/Furniture', icon: <Box size={20} /> },
                                        { id: 'Mixed Items', icon: <Boxes size={20} /> },
                                        { id: 'Documents', icon: <FileText size={20} /> }
                                      ].map(type => (
                                        <motion.button
                                          key={type.id}
                                          whileHover={{ scale: 1.02, y: -2 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => setPickupItemType(type.id)}
                                          className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center relative overflow-hidden ${
                                            pickupItemType === type.id 
                                              ? 'border-jiffex-orange bg-jiffex-orange/5 text-jiffex-orange shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                                              : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                          }`}
                                        >
                                          {pickupItemType === type.id && (
                                            <motion.div 
                                              layoutId="item-type-glow"
                                              className="absolute inset-0 bg-jiffex-orange/5"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.2 }}
                                            />
                                          )}
                                          <div className="relative z-10">
                                            {type.icon}
                                          </div>
                                          <p className="text-[10px] font-black uppercase tracking-wider leading-tight relative z-10">{type.id}</p>
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <h5 className="text-sm font-black text-deep-blue uppercase tracking-wider">Approximate Weight of Items</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {[
                                        { id: 'Less than 5 kg', label: 'Less than 5 kg', desc: 'Documents, small parcels, or light gift packs', icon: <Package size={22} /> },
                                        { id: '5 to 20 kg', label: '5 to 20 kg', desc: 'Standard suitcases, medium boxes, or household items', icon: <Box size={22} /> },
                                        { id: 'More than 20 kg', label: 'More than 20 kg', desc: 'Heavy cargo, large bulk luggage, or multiple packages', icon: <Truck size={22} /> }
                                      ].map(v => (
                                        <motion.button
                                          key={v.id}
                                          type="button"
                                          whileHover={{ scale: 1.02, y: -2 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => {
                                            setPickupVehicleType(v.id);
                                            setPickupEstimatedWeight(v.id);
                                          }}
                                          className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between text-left relative overflow-hidden h-full min-h-[160px] ${
                                            pickupVehicleType === v.id 
                                              ? 'border-jiffex-orange bg-jiffex-orange/5 text-jiffex-orange shadow-[0_0_25px_rgba(249,115,22,0.1)]' 
                                              : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                          }`}
                                        >
                                          {pickupVehicleType === v.id && (
                                            <motion.div 
                                              layoutId="vehicle-type-glow"
                                              className="absolute inset-0 bg-jiffex-orange/5"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.2 }}
                                            />
                                          )}
                                          
                                          {/* Header with Icon and Radio Dot */}
                                          <div className="flex items-center justify-between w-full relative z-10 mb-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 ${pickupVehicleType === v.id ? 'bg-jiffex-orange text-white shadow-lg shadow-jiffex-orange/20 scale-105' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                              {v.icon}
                                            </div>
                                            
                                            {/* Visual Radio Button Dot */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                              pickupVehicleType === v.id 
                                                ? 'border-jiffex-orange bg-jiffex-orange' 
                                                : 'border-slate-300 bg-white'
                                            }`}>
                                              {pickupVehicleType === v.id && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                              )}
                                            </div>
                                          </div>

                                          {/* Title and Description */}
                                          <div className="relative z-10">
                                            <p className="text-base font-black text-slate-900 leading-tight mb-1">{v.label}</p>
                                            <p className="text-xs font-medium text-slate-500 leading-normal">{v.desc}</p>
                                          </div>
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-700">
                                      <Info size={18} />
                                      <p className="text-sm font-black text-amber-900">You’ll receive a price estimate before confirmation — no payment required yet.</p>
                                    </div>
                                    <p className="text-xs text-amber-600 font-bold leading-relaxed">
                                      Once your pickup is confirmed, our agent will contact you with a final price based on size, weight, and distance before collecting payment.
                                    </p>
                                  </div>

                                  <button 
                                    onClick={() => {
                                      setActivePickupStep(2);
                                    }}
                                    className="w-full py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                  >
                                    Continue to Schedule <ArrowRight size={18} />
                                  </button>
                                </div>
                        </motion.div>
                      )}

                      {/* Step 2: When should we arrive? */}
                      {activePickupStep === 2 && (
                        <motion.div 
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="p-8 rounded-[2.5rem] border bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10">
                                <Clock size={24} />
                              </div>
                              <div>
                                <h4 className="text-xl font-black text-deep-blue">When should we arrive?</h4>
                              </div>
                            </div>
                          </div>

                          <div className="pt-8 space-y-8">
                                  <div className="space-y-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                      {filteredPickupSlots.map(slot => {
                                        const d = new Date(slot.date);
                                        const isSelected = selectedPickupDate === slot.date;
                                        
                                        // IST check for past dates
                                        const getISTTime = () => {
                                          const now = new Date();
                                          const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                                          return new Date(utc + (3600000 * 5.5));
                                        };
                                        const istNow = getISTTime();
                                        const istDateStr = istNow.toISOString().split('T')[0];
                                        
                                        // A date is past if its last slot is past (last slot starts at 7 PM / 19:00)
                                        const isDatePast = slot.date < istDateStr || (slot.date === istDateStr && istNow.getHours() >= 19);
                                        
                                        return (
                                          <button
                                            key={slot.date}
                                            disabled={isDatePast}
                                            onClick={() => setSelectedPickupDate(slot.date)}
                                            className={`flex-shrink-0 w-20 h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                                              isDatePast ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100 text-slate-300' :
                                              isSelected ? 'border-jiffex-orange bg-jiffex-orange/5 text-jiffex-orange' : 
                                              'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                            }`}
                                          >
                                            <span className="text-[10px] font-black uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <span className="text-xl font-black">{d.getDate()}</span>
                                            <span className="text-[10px] font-bold">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Time Window</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {PICKUP_SLOTS.find(s => s.date === selectedPickupDate)?.times.map(time => {
                                        const isSelected = selectedPickupTime === time;
                                        
                                        // IST check for past slots
                                        const getISTTime = () => {
                                          const now = new Date();
                                          const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                                          return new Date(utc + (3600000 * 5.5));
                                        };
                                        
                                        const istNow = getISTTime();
                                        const istDateStr = istNow.toISOString().split('T')[0];
                                        
                                        let isPast = false;
                                        if (selectedPickupDate < istDateStr) {
                                          isPast = true;
                                        } else if (selectedPickupDate === istDateStr) {
                                          const hourMap: Record<string, number> = {
                                            '9–11 AM': 9,
                                            '11–1 PM': 11,
                                            '1–3 PM': 13,
                                            '3–5 PM': 15,
                                            '5–7 PM': 17,
                                            '7–9 PM': 19
                                          };
                                          const startHour = hourMap[time];
                                          if (istNow.getHours() >= startHour) {
                                            isPast = true;
                                          }
                                        }

                                        return (
                                          <button
                                            key={time}
                                            disabled={isPast}
                                            onClick={() => setSelectedPickupTime(time)}
                                            className={`py-4 px-2 rounded-2xl border-2 transition-all text-center ${
                                              isPast ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100 text-slate-300' :
                                              isSelected ? 'border-jiffex-orange bg-jiffex-orange/5 text-jiffex-orange' : 
                                              'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                            }`}
                                          >
                                            <span className="text-xs font-black">{time}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="flex gap-4">
                                    <button 
                                      onClick={() => {
                                        setActivePickupStep(1);
                                      }}
                                      className="flex-1 py-4 bg-white border border-slate-200 text-deep-blue rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                      <ArrowLeft size={18} /> Back
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setActivePickupStep(3);
                                      }}
                                      className="flex-[2] py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                    >
                                      Continue to Address <ArrowRight size={18} />
                                    </button>
                                  </div>
                                </div>
                        </motion.div>
                      )}

                    {/* Step 3: Pickup details */}
                    {activePickupStep === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="p-8 rounded-[2.5rem] border bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10">
                              <MapPin size={24} />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-deep-blue">Pickup & Destination Details</h4>
                            </div>
                          </div>
                        </div>

                        {/* Tab Selector */}
                        <div className="mt-6 flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          <button
                            type="button"
                            onClick={() => setPickupDetailsTab('pickup')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                              pickupDetailsTab === 'pickup' 
                                ? 'bg-deep-blue text-white shadow-md shadow-deep-blue/20' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <MapPin size={14} /> 1. Pickup Address (From)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPickupDetailsTab('destination')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                              pickupDetailsTab === 'destination' 
                                ? 'bg-deep-blue text-white shadow-md shadow-deep-blue/20' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Globe size={14} /> 2. Destination Address (To)
                          </button>
                        </div>

                        <div className="pt-6 space-y-6">
                          {pickupDetailsTab === 'pickup' ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                  <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                      type="text" 
                                      className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                      placeholder="Enter your name"
                                      value={pickupName}
                                      onChange={(e) => setPickupName(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+91</span>
                                    <input 
                                      type="tel" 
                                      className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                      placeholder="10-digit mobile"
                                      value={pickupPhone}
                                      maxLength={10}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setPickupPhone(val);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="email" 
                                    className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="Enter your email for confirmation"
                                    value={pickupEmail}
                                    onChange={(e) => setPickupEmail(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pick up address</label>
                                <input 
                                  type="text" 
                                  className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                  placeholder="House No, Building, Street Name"
                                  value={pickupAddress.street}
                                  onChange={(e) => setPickupAddress({...pickupAddress, street: e.target.value})}
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="City"
                                    value={pickupAddress.city}
                                    onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">State</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="State"
                                    value={pickupAddress.state}
                                    onChange={(e) => setPickupAddress({...pickupAddress, state: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">PIN code</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="PIN Code"
                                    value={pickupAddress.zip}
                                    onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Special Instructions</label>
                                <textarea 
                                  className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium min-h-[100px] text-sm"
                                  placeholder="Any specific instructions for our agent?"
                                  value={pickupSpecialInstructions}
                                  onChange={(e) => setPickupSpecialInstructions(e.target.value)}
                                />
                              </div>

                              {currentUser && (
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex items-start gap-3 mt-4 hover:bg-slate-50 transition-colors">
                                  <input 
                                    type="checkbox" 
                                    id="save-pickup-to-profile"
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer accent-indigo-600"
                                    checked={savePickupToProfile}
                                    onChange={(e) => setSavePickupToProfile(e.target.checked)}
                                  />
                                  <label htmlFor="save-pickup-to-profile" className="text-xs font-bold text-slate-700 leading-relaxed cursor-pointer select-none">
                                    Save these details in my customer profile
                                    <span className="block text-[10px] text-slate-400 font-medium normal-case mt-0.5">
                                      These details will be securely stored and auto-filled next time when logged in with the same ID.
                                    </span>
                                  </label>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Receiver Name</label>
                                  <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                      type="text" 
                                      className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                      placeholder="Receiver full name"
                                      value={pickupDestination.fullName}
                                      onChange={(e) => setPickupDestination({...pickupDestination, fullName: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Receiver Phone</label>
                                  <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                      type="tel" 
                                      className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                      placeholder="Receiver contact phone"
                                      value={pickupDestination.phone}
                                      onChange={(e) => setPickupDestination({...pickupDestination, phone: e.target.value})}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Receiver Email</label>
                                <div className="relative">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="email" 
                                    className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="Receiver email (optional)"
                                    value={pickupDestination.email}
                                    onChange={(e) => setPickupDestination({...pickupDestination, email: e.target.value})}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destination Address</label>
                                <input 
                                  type="text" 
                                  className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                  placeholder="Street Address, Block, Apartment Info"
                                  value={pickupDestination.addressLine1}
                                  onChange={(e) => setPickupDestination({...pickupDestination, addressLine1: e.target.value})}
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destination City</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="Destination City"
                                    value={pickupDestination.city}
                                    onChange={(e) => setPickupDestination({...pickupDestination, city: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destination State</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="Destination State"
                                    value={pickupDestination.state}
                                    onChange={(e) => setPickupDestination({...pickupDestination, state: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ZIP / Post Code</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                                    placeholder="ZIP or Postal Code"
                                    value={pickupDestination.zipCode}
                                    onChange={(e) => setPickupDestination({...pickupDestination, zipCode: e.target.value})}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destination Country</label>
                                <div className="relative">
                                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                                  <select 
                                    className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm appearance-none cursor-pointer pr-10"
                                    value={pickupDestination.country}
                                    onChange={(e) => setPickupDestination({...pickupDestination, country: e.target.value})}
                                  >
                                    {COUNTRIES.map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                    <ChevronDown size={18} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-4 pt-4 border-t border-slate-100">
                            {pickupDetailsTab === 'pickup' ? (
                              <>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setActivePickupStep(2);
                                  }}
                                  className="flex-1 py-4 bg-white border border-slate-200 text-deep-blue rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                  <ArrowLeft size={18} /> Back
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    // Local Validation before going to Destination Address Tab
                                    if (!pickupName || !pickupPhone || !pickupAddress.street || !pickupAddress.city || !pickupAddress.state || !pickupAddress.zip) {
                                      toast.error('Please fill in all required Pickup Address fields before proceeding.');
                                      return;
                                    }
                                    if (pickupPhone.length !== 10) {
                                      toast.error('Phone number must be exactly 10 digits');
                                      return;
                                    }
                                    setPickupDetailsTab('destination');
                                  }}
                                  className="flex-[2] py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                >
                                  Continue to Destination <ArrowRight size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setPickupDetailsTab('pickup');
                                  }}
                                  className="flex-1 py-4 bg-white border border-slate-200 text-deep-blue rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                  <ArrowLeft size={18} /> Back
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (!pickupName || !pickupPhone || !pickupAddress.street || !pickupAddress.city || !pickupAddress.state || !pickupAddress.zip) {
                                      toast.error('Please fill in all required Pickup Address fields');
                                      setPickupDetailsTab('pickup');
                                      return;
                                    }
                                    if (pickupPhone.length !== 10) {
                                      toast.error('Phone number must be 10 digits');
                                      setPickupDetailsTab('pickup');
                                      return;
                                    }
                                    if (!pickupDestination.fullName || !pickupDestination.phone || !pickupDestination.addressLine1 || !pickupDestination.city || !pickupDestination.state || !pickupDestination.zipCode) {
                                      toast.error('Please fill in all required Destination fields');
                                      return;
                                    }
                                    if (savePickupToProfile && currentUser) {
                                      savePickupProfileToDb();
                                    }
                                    setActivePickupStep(4);
                                  }}
                                  className="flex-[2] py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                >
                                  Continue to Review <ArrowRight size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Review your booking */}
                    {activePickupStep === 4 && (
                      <motion.div 
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="p-8 rounded-[2.5rem] border bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10">
                              <CheckCircle2 size={24} />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-deep-blue">Review your booking</h4>
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 space-y-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items</p>
                                      <p className="font-bold text-slate-900">{pickupItemType} ({pickupVehicleType})</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup Slot</p>
                                      <p className="font-bold text-slate-900">{new Date(selectedPickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedPickupTime}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</p>
                                      <p className="font-bold text-slate-900">{pickupName} (+91 {pickupPhone})</p>
                                    </div>
                                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-250/20">
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup Address (From)</p>
                                        <p className="font-bold text-slate-900 text-xs mt-1 leading-relaxed">
                                          {pickupAddress.street}<br />
                                          {pickupAddress.city}, {pickupAddress.state} - {pickupAddress.zip}<br />
                                          India
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination Address (To)</p>
                                        <p className="font-bold text-slate-900 text-xs mt-1 leading-relaxed">
                                          {pickupDestination.fullName} (+{pickupDestination.phone})<br />
                                          {pickupDestination.addressLine1}<br />
                                          {pickupDestination.city}, {pickupDestination.state} - {pickupDestination.zipCode}<br />
                                          {pickupDestination.country}
                                        </p>
                                      </div>
                                    </div>
                                    {pickupSpecialInstructions && (
                                      <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instructions</p>
                                        <p className="font-bold text-slate-900">{pickupSpecialInstructions}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Approximate Price Estimate */}
                                {(() => {
                                  let minWeight = 1;
                                  let maxWeight = 5;
                                  let isMoreThan20 = false;

                                  if (pickupEstimatedWeight) {
                                    if (pickupEstimatedWeight.includes('Less than 5') || pickupEstimatedWeight.includes('1-5')) {
                                      minWeight = 1;
                                      maxWeight = 5;
                                    } else if (pickupEstimatedWeight.includes('5 to 20') || pickupEstimatedWeight.includes('5-15') || pickupEstimatedWeight.includes('5-20') || pickupEstimatedWeight.includes('5 to 15')) {
                                      minWeight = 5;
                                      maxWeight = 20;
                                    } else if (pickupEstimatedWeight.includes('More than 20') || pickupEstimatedWeight.includes('15-50') || pickupEstimatedWeight.includes('20+')) {
                                      minWeight = 20;
                                      maxWeight = 50;
                                      isMoreThan20 = true;
                                    } else {
                                      const match = pickupEstimatedWeight.match(/(\d+)/);
                                      if (match) {
                                        const val = parseInt(match[0], 10);
                                        minWeight = Math.max(1, val - 2);
                                        maxWeight = val + 2;
                                      }
                                    }
                                  }

                                  const targetCountry = pickupDestination.country || COUNTRIES[0];
                                  const rate = shippingRates[targetCountry] || 10;
                                  const discountPercent = shippingDiscounts[targetCountry] || 0;

                                  const rawMinQuote = minWeight * rate;
                                  const rawMaxQuote = maxWeight * rate;

                                  const minDiscount = rawMinQuote * (discountPercent / 100);
                                  const maxDiscount = rawMaxQuote * (discountPercent / 100);

                                  const finalMin = Math.max(0, rawMinQuote - minDiscount);
                                  const finalMax = Math.max(0, rawMaxQuote - maxDiscount);

                                  return (
                                    <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
                                        <Globe size={20} />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <h5 className="font-extrabold text-indigo-950 text-sm">Approximate Price Estimate</h5>
                                          <span className="text-xs font-black bg-indigo-100/80 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                            {minWeight}-{maxWeight}{isMoreThan20 ? '+' : ''} kg
                                          </span>
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                          <span className="text-2xl font-black text-indigo-600">
                                            ₹{finalMin.toFixed(2)} - ₹{finalMax.toFixed(2)}{isMoreThan20 ? '+' : ''}
                                          </span>
                                          <span className="text-xs font-medium text-slate-500">to {targetCountry}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                                          Based on standard rate of <strong className="text-slate-700">₹{rate}/kg</strong> for {targetCountry} over the weight range limit of {minWeight} to {maxWeight} kg.
                                          {discountPercent > 0 && (
                                            <span className="text-emerald-600 font-bold block mt-1">
                                              ✨ Special {discountPercent}% discount applied! Saved ₹{minDiscount.toFixed(2)} - ₹{maxDiscount.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Payment Info Section */}
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                    <CreditCard size={20} />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-emerald-900 text-sm">Payment — agent will quote on arrival</h5>
                                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                      No payment now. Your agent will share the quote when they arrive and collect after your approval.
                                    </p>
                                  </div>
                                </div>

                                {!currentUser && (
                                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0">
                                      <LogIn size={16} />
                                    </div>
                                    <p className="text-xs font-bold text-indigo-900">
                                      Continue as a guest. We'll verify your number via OTP to secure your booking.
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-4">
                                  <button 
                                    onClick={() => {
                                      setActivePickupStep(3);
                                    }}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-deep-blue rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                  >
                                    Edit Details
                                  </button>
                                  <button 
                                    onClick={handleSchedulePickup}
                                    className="flex-[2] py-5 bg-jiffex-orange text-white rounded-[2rem] text-lg font-black hover:bg-amber-600 transition-all shadow-2xl shadow-jiffex-orange/20 flex items-center justify-center gap-3"
                                  >
                                    {currentUser ? 'Confirm Booking' : 'Sign in (OTP-based)'}
                                  </button>
                                </div>
                              </div>
                        </motion.div>
                      )}

                      {/* Step 5: Booking confirmed */}
                     {activePickupStep === 5 && (
                       <motion.div 
                         key="step5"
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         transition={{ duration: 0.3 }}
                         className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-b from-white via-slate-50/10 to-white border border-slate-150/70 shadow-[0_25px_60px_-15px_rgba(99,102,241,0.03)] text-left space-y-6 sm:space-y-8"
                       >
                        {/* Compact Header Alert */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-14 h-14 bg-gradient-to-tr from-teal-500 via-emerald-500 to-emerald-400 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25"
                            >
                              <CheckCircle2 size={28} />
                            </motion.div>
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-50 text-teal-800 rounded-full text-[9px] uppercase font-black tracking-wider leading-none border border-teal-100/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Confirmed & Active
                              </span>
                              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 leading-none">
                                Thanks, {activePickup?.customerName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'there'}!
                              </h2>
                              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                                Your home pickup is scheduled. Our agent is on the way!
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-50/45 to-indigo-50/15 p-3 rounded-2xl border border-indigo-100/40 shrink-0 self-stretch sm:self-auto justify-between md:justify-start">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Booking reference</p>
                              <p className="text-base font-black text-indigo-750 tracking-widest mt-1 font-mono">
                                {lastBookingRef || activePickup?.id}
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                const ref = lastBookingRef || activePickup?.id;
                                if (ref) {
                                  navigator.clipboard.writeText(ref);
                                  toast.success('Reference ID copied to clipboard!');
                                }
                              }}
                              className="p-2.5 bg-white text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl border border-indigo-100/50 transition-all shadow-sm cursor-pointer"
                              title="Copy Reference"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Two Column Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          
                          {/* 📋 GUIDES, EXPECTATIONS & DOCUMENTS (Left Column) */}
                          <div className="lg:col-span-8 space-y-6">
                            
                            {/* What to Expect Timeline (Horizontal, from left to right) */}
                            <div className="bg-gradient-to-b from-indigo-50/30 to-indigo-50/10 border border-indigo-100/20 rounded-3xl p-6 space-y-5">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-100/50">
                                  <Clock size={18} />
                                </div>
                                <h4 className="text-base font-black text-indigo-950 uppercase tracking-wider">What to Expect</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                                {[
                                  { title: "1. Agent Call", desc: "Agent calls 30m before arrival.", active: true },
                                  { title: "2. Pickup & Weighing", desc: "Instant quote given on-site.", active: true },
                                  { title: "3. Secure Sorting", desc: "Packed safely at warehouse.", active: false },
                                  { title: "4. Global Delivery", desc: "Pay online to dispatch package.", active: false }
                                ].map((step, i) => (
                                  <div key={i} className="relative p-4 bg-white/95 border border-slate-100/80 rounded-2xl flex flex-col justify-between shadow-sm hover:border-indigo-100/40 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                                        step.active 
                                          ? 'bg-gradient-to-tr from-teal-400 to-emerald-500 border-teal-100/50 shadow shadow-emerald-500/10' 
                                          : 'bg-white border-slate-200'
                                      }`} />
                                      <p className="font-extrabold text-xs text-slate-800 leading-none">{step.title}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Documents Required & Prohibited Items Side-by-Side (Below What to expect) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              
                              {/* Documents Required */}
                              <div className="bg-gradient-to-b from-sky-50/30 to-sky-50/10 border border-sky-100/20 rounded-3xl p-6 space-y-5">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-sky-450 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10">
                                    <FileText size={18} />
                                  </div>
                                  <h4 className="text-base font-black text-sky-950 uppercase tracking-wider">Documents Required</h4>
                                </div>
                                
                                <div className="space-y-4">
                                  {[
                                    { title: "ID Proof Copy", desc: "Aadhar, Passport or Driving License Copy" },
                                    { title: "Itemized Declaration", desc: "Simple list of contents & quantities" },
                                    { title: "Value Statement", desc: "Bills/Invoices for any luxurious brand garments" }
                                  ].map((doc, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/95 border border-slate-100/60 shadow-sm hover:border-sky-100/50 hover:shadow-md transition-all">
                                      <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-650 flex items-center justify-center shrink-0 border border-sky-100/30">
                                        <ShieldCheck size={14} />
                                      </div>
                                      <div className="text-xs">
                                        <p className="font-extrabold text-sm text-slate-800 leading-snug">{doc.title}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{doc.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Prohibited Items */}
                              <div className="bg-gradient-to-b from-rose-50/25 to-rose-50/10 border border-rose-100/20 rounded-3xl p-6 space-y-5">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-rose-450 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-rose-500/10">
                                    <AlertTriangle size={18} />
                                  </div>
                                  <h4 className="text-base font-black text-rose-950 uppercase tracking-wider">Prohibited Items</h4>
                                </div>
                                
                                <div className="space-y-4">
                                  {[
                                    { title: "Aerosols & Perfumes", desc: "Body sprays, deodorants, or inflammable liquids" },
                                    { title: "Cash & Jewellery", desc: "Currency notes, solid raw gold, silver bullion" },
                                    { title: "Perishables", desc: "Open/homemade liquid curries, raw dairy products" },
                                    { title: "Hazardous Materials", desc: "Ammunition, loose lithium batteries, explosive fuel" }
                                  ].map((item, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-white/95 border border-rose-100/15 rounded-2xl shadow-sm hover:border-rose-100/30 hover:shadow-md transition-all">
                                      <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/30">
                                        <XCircle size={14} />
                                      </div>
                                      <div className="text-xs">
                                        <p className="font-black text-sm text-rose-950 leading-snug">{item.title}</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">{item.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>

                            {/* Actions bar at bottom of info */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                              <button 
                                onClick={() => {
                                  clearPickupInputs();
                                  navigateTo('history');
                                  setActivePickupStep(1);
                                  setLastBookingRef(null);
                                  setIsSchedulingNewPickup(false);
                                  window.scrollTo(0, 0);
                                }}
                                className="flex-1 px-6 py-4 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-100/40 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                <Package size={16} /> View My Orders
                              </button>
                              <button 
                                onClick={() => {
                                  clearPickupInputs();
                                  navigateTo('home');
                                  setActivePickupStep(1);
                                  setLastBookingRef(null);
                                  setIsSchedulingNewPickup(false);
                                  window.scrollTo(0, 0);
                                }}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 hover:opacity-90 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-950/10"
                              >
                                <ArrowLeft size={16} /> Back to Home
                              </button>
                            </div>
                          </div>
                          
                          {/* 🛍️ CONSOLIDATED JIFFEX STORE SHOPPING INTEGRATION (Right Column - Scrollable) */}
                          <div className="lg:col-span-4 space-y-4">
                            <div className="bg-gradient-to-br from-teal-50 via-teal-50/30 to-indigo-50/20 rounded-[2.5rem] border border-teal-500/15 p-5 sm:p-6 space-y-4 flex flex-col justify-between max-h-[660px] h-[660px] shadow-xl relative overflow-hidden backdrop-blur-sm">
                              
                              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between gap-4 shrink-0">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-0.5 bg-teal-500 text-white rounded-full text-[8px] uppercase font-black tracking-widest leading-none shadow-sm">
                                        Co-Shipping Active
                                      </span>
                                      <span className="px-2.5 py-0.5 bg-indigo-50/80 text-indigo-700 rounded-full text-[8px] uppercase font-bold leading-none border border-indigo-100/30">
                                        Zero Base Fees
                                      </span>
                                    </div>
                                    <h3 className="text-[17px] font-black text-slate-900 mt-1">
                                      Shop Indian Products
                                    </h3>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigateTo('store');
                                      window.scrollTo(0, 0);
                                    }}
                                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow transition-all border border-teal-500 whitespace-nowrap"
                                  >
                                    <ShoppingBag size={11} /> See All
                                  </button>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed shrink-0">
                                  Delivered inside your same pickup box with <strong>no extra courier base fees</strong>.
                                </p>

                                {/* Scrollable Shop Items Grid with Infinite Auto-scrolling and Hover Pause */}
                                <AutoScrollingShopProducts 
                                  storeProducts={storeProducts}
                                  items={items}
                                  addItem={addItem}
                                  removeStoreItem={removeStoreItem}
                                />
                              </div>

                              {/* Live Consolidated Cart Items Summary */}
                              {items.filter(i => i.source === 'Store').length > 0 && (
                                <div className="p-3 bg-white border border-teal-500/12 rounded-2xl space-y-2 shrink-0 shadow-sm text-xs mt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                                      Items in Consolidated Box:
                                    </span>
                                    <span className="font-bold text-teal-700 bg-teal-50 border border-teal-100/30 px-2 py-0.5 rounded text-[10px] font-mono">
                                      {items.filter(i => i.source === 'Store').reduce((acc, i) => acc + (i.quantity || 1), 0)} items
                                    </span>
                                  </div>
                                  
                                  <div className="divide-y divide-slate-100 max-h-[110px] overflow-y-auto pr-1">
                                    {items.filter(i => i.source === 'Store').map((storeIt) => (
                                      <div key={storeIt.id} className="flex items-center justify-between py-1.5 text-[11px]">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="font-medium text-slate-900 truncate">{storeIt.name}</span>
                                          <span className="text-[9px] text-slate-400 font-semibold shrink-0">x{storeIt.quantity}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="font-mono text-slate-400">{(storeIt.weight * (storeIt.quantity || 1)).toFixed(2)} kg</span>
                                          <span className="font-bold text-teal-650 font-mono">${(storeIt.price * (storeIt.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="border-t border-slate-100 pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                                    <div>
                                      <p className="text-[10px] text-slate-500 font-bold">
                                        Consolidated Est. Weight: <span className="font-mono text-indigo-600 font-black">
                                          {(items.filter(i => i.source === 'Store').reduce((acc, i) => acc + (i.weight * (i.quantity || 1)), 0) + 3.0).toFixed(1)} kg
                                        </span>
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        navigateTo('cart');
                                        window.scrollTo(0, 0);
                                      }}
                                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer border border-teal-500/20"
                                    >
                                      Checkout & Pay
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                          </div>
                        </div>
                       </motion.div>
                     )}
                    </AnimatePresence>

                    {/* Info Card */}
                    {activePickupStep !== 5 && (
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-deep-blue shadow-sm flex-shrink-0">
                          {activePickupStep === 2 ? <Clock size={28} /> : activePickupStep === 3 ? <Lock size={28} /> : <ShieldCheck size={28} />}
                        </div>
                        <div>
                          <h5 className="font-black text-deep-blue text-lg">
                            {activePickupStep === 2 ? 'Flexible Rescheduling Available' : 
                             activePickupStep === 3 ? 'Your data is Secure & private' : 
                             'Safe & Verified Agents'}
                          </h5>
                          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                            {activePickupStep === 2 ? 'Plans changed? No worries. You can reschedule your pickup window anytime up to 2 hours before our agent arrives.' : 
                             activePickupStep === 3 ? 'Your privacy is our priority. We use end-to-end encryption to ensure your address and contact details remain strictly confidential.' : 
                             'All our pickup agents are background-verified and follow strict safety protocols. They will call you 30 minutes before arrival.'}
                          </p>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}

        {/* Item List Card - Visible in all tabs, but specific parts are conditional */}
        {!(mode === 'Pickup' && (isCartEmpty || activePickupStep === 5 || !hasActivePickup || isSchedulingNewPickup)) && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
            {!mode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Your Shipment Items</h3>
                <p className="text-sm text-slate-500">Manage items collected or received at our warehouse.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-indigo-50 rounded-2xl text-xs font-bold text-indigo-600 border border-indigo-100">
                  {displayItems.reduce((acc, item) => acc + (item.quantity || 1), 0)} Items
                </div>
                <div className="px-4 py-2 bg-emerald-50 rounded-2xl text-xs font-bold text-emerald-600 border border-emerald-100">
                  {hasTBDWeight ? 'Est. ' : ''}{displayWeight.toFixed(2)} kg Total
                </div>
              </div>
            </div>
          )}
            
            {isCartEmpty ? (
                <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Package size={40} strokeWidth={1} />
                  </div>
                  <p className="font-medium">Your cart is empty.</p>
                  {!mode && (
                    <>
                      <p className="text-sm mb-6">Add items from the store or schedule a pickup to get started.</p>
                      <button 
                        onClick={() => navigateTo('store')}
                        className="btn-cta flex items-center gap-2"
                      >
                        <Store size={18} /> Visit Shop
                      </button>
                    </>
                  )}
                  {mode === 'Pickup' && (
                    <p className="text-sm">Schedule a pickup to add items to your shipment.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Order Completed Message */}
                  {!mode && hasCompletedPickup && (
                    <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center space-y-4 mb-8">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                        <CheckCircle2 size={32} />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-lg font-black text-slate-900">Order Completed</h4>
                        <p className="text-sm text-slate-600 mt-2">
                          Your agent pickup order has been completed and paid. You can now see the summary of your items below. Your shipment is being processed at our warehouse.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Pickups */}
                  {(mode === 'Pickup') && userAppointments.some(a => a.status === 'Scheduled' || a.status === 'Picked Up') && activePickupStep !== 5 && !isSchedulingNewPickup && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Truck size={18} className="text-indigo-600" /> Scheduled Pickups
                      </h4>
                      {userAppointments.filter(a => a.status === 'Scheduled' || a.status === 'Picked Up').map((apt, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={`apt-${idx}`}
                          className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl shadow-indigo-500/5"
                        >
                          <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                <Truck size={24} />
                              </div>
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Appointment ID</div>
                                <div className="text-lg font-black">{apt.id}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest">
                                {apt.status}
                              </div>
                              <button 
                                onClick={() => cancelPickup(apt.id)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pickup Details</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3 text-sm">
                                    <UserIcon size={16} className="text-indigo-600" />
                                    <span className="font-bold text-slate-900">{apt.customerName || 'Guest User'}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm">
                                    <Calendar size={16} className="text-indigo-600" />
                                    <span className="font-bold text-slate-700">{apt.date}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-600">{apt.time}</span>
                                  </div>
                                  <div className="flex items-start gap-3 text-sm">
                                    <MapPin size={16} className="text-indigo-600 mt-1" />
                                    <span className="text-slate-600 leading-relaxed font-medium">{apt.address}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm">
                                    <Phone size={16} className="text-indigo-600" />
                                    <span className="font-bold text-slate-900">{apt.phone}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assigned Agent</h4>
                                {apt.assignedAgent ? (
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                      <UserIcon size={20} />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-900">{apt.assignedAgent.name}</div>
                                      <div className="text-[10px] text-slate-500">{apt.assignedAgent.vehicleNumber}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
                                    <Clock size={14} /> Assigning Agent...
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Next Steps Workflow</h4>
                                <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                  {[
                                    { title: "Agent Arrival", desc: "Agent will arrive at your door during the selected slot.", icon: Truck },
                                    { title: "On-site Weighing", desc: "Items are weighed using digital scales for accuracy.", icon: Calculator },
                                    { title: "Digital Receipt", desc: "Receive instant confirmation of collected items.", icon: CheckCircle2 }
                                  ].map((step, i) => (
                                    <div key={i} className="relative">
                                      <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 z-10" />
                                      <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Grouped Items by Source */}
                  <div ref={warehouseItemsRef} className="space-y-8">
                    {(mode ? [mode] : ['Store', 'Warehouse']).map(source => {
                    const sourceItems = displayItems.filter(i => i.source === source);
                    
                    // Special case: If Pickup from home is scheduled, show message instead of item list for Pickup source
                    if (mode === 'Pickup' && source === 'Pickup' && hasActivePickup && !isSchedulingNewPickup) {
                      return (
                        <div key={source} className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-center space-y-4">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
                            <Truck size={32} />
                          </div>
                          <div className="max-w-md mx-auto">
                            <h4 className="text-lg font-black text-slate-900">Pickup from home Scheduled</h4>
                            <p className="text-sm text-slate-600 mt-2">
                              Your agent pickup is currently scheduled. The items list here will be updated automatically once our agent completes the pickup and weighs your items on-site.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (sourceItems.length === 0) return null;
                    
                    // Hide Store items if we are in Pickup or Warehouse mode
                    if (mode && source === 'Store') return null;
                    
                    // Only show items matching the current mode (Pickup or Warehouse)
                    if (mode && mode !== source) return null; 

                    const SourceIcon = source === 'Store' ? Store : source === 'Pickup' ? Package : Database;
                    const sourceColor = source === 'Store' ? 'text-emerald-600' : source === 'Pickup' ? 'text-indigo-600' : 'text-slate-600';
                    const sourceLabel = source === 'Store' ? 'Shop Items' : source === 'Pickup' ? 'Items for Pickup from home' : 'Items sent to warehouse';

                    return (
                      <div key={source} className="space-y-4">
                        <h4 className={`text-sm font-black ${sourceColor} uppercase tracking-widest flex items-center gap-2`}>
                          <SourceIcon size={18} /> {sourceLabel}
                        </h4>
                        {source === 'Warehouse' && (
                          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-800 text-xs flex items-start gap-2.5">
                            <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed font-medium">
                              The weights of the items will be updated once they are received at our warehouse. You can check the final verified details in <span className="font-bold">My Orders</span>.
                            </p>
                          </div>
                        )}
                        <div className="space-y-3">
                          {sourceItems.map(item => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={item.id} 
                              className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group items-center"
                            >
                              <div className={item.source === 'Store' ? "md:col-span-3" : item.source === 'Warehouse' ? "md:col-span-4" : "md:col-span-2"}>
                                <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {item.fragile && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-amber-100">
                                      <AlertTriangle size={8} /> Fragile
                                    </span>
                                  )}
                                  {item.invoiceNumber && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-100">
                                      <FileText size={8} /> {item.invoiceNumber}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {item.source === 'Warehouse' && (
                                <div className="md:col-span-3">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source</div>
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100/50 w-fit">
                                    <ShoppingBag size={12} className="text-indigo-500" />
                                    <span>{item.purchaseSource || 'Other'}</span>
                                  </div>
                                </div>
                              )}

                              {item.source !== 'Warehouse' && (
                                <div className={item.source === 'Store' ? "md:col-span-2" : "md:col-span-1"}>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Unit Price</div>
                                  <div className="text-xs font-bold text-emerald-600">
                                    {item.price ? (
                                      <span>₹{(item.price / (item.quantity || 1)).toFixed(2)}</span>
                                    ) : (
                                      <span className="text-slate-400">N/A</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className={item.source === 'Warehouse' ? "md:col-span-3" : item.source === 'Store' ? "md:col-span-2" : "md:col-span-2"}>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                  {item.source === 'Store' ? 'Unit Weight' : 'Weight'}
                                </div>
                                <div className="text-xs font-bold text-indigo-600">
                                  {item.weight > 0 ? (
                                    <div className="flex flex-col">
                                      <span>{(item.weight / (item.quantity || 1)).toFixed(2)} kg</span>
                                      {item.source !== 'Store' && (item.quantity || 1) > 1 && (
                                        <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                                          Total: {item.weight.toFixed(2)} kg
                                        </span>
                                      )}
                                    </div>
                                  ) : 'TBD'}
                                </div>
                              </div>

                              {item.source === 'Store' && (
                                <div className="md:col-span-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Weight</div>
                                  <div className="text-xs font-bold text-indigo-600">
                                    {item.weight > 0 ? (
                                      <span>{item.weight.toFixed(2)} kg</span>
                                    ) : 'TBD'}
                                  </div>
                                </div>
                              )}

                              <div className={item.source === 'Store' ? "md:col-span-2" : "md:col-span-1"}>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Qty</div>
                                <div className="flex items-center gap-2">
                                  {!mode && !hasCompletedPickup ? (
                                    <>
                                      <button 
                                        onClick={() => updateItemQuantity(item.id, -1)}
                                        className="w-6 h-6 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                                      >
                                        <Minus size={12} />
                                      </button>
                                      <span className="text-xs font-black text-slate-900 min-w-[20px] text-center">{item.quantity || 1}</span>
                                      <button 
                                        onClick={() => updateItemQuantity(item.id, 1)}
                                        className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs font-black text-slate-900 min-w-[20px] text-center">{item.quantity || 1}</span>
                                  )}
                                </div>
                              </div>

                              {item.source !== 'Store' && item.source !== 'Warehouse' && (
                                <div className="md:col-span-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                  <div className="flex items-center gap-2">
                                    {item.status === 'Received at Warehouse' ? (
                                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 inline-block">
                                        RECEIVED
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => updateItemStatus(item.id, 'Received at Warehouse')}
                                        className="text-[9px] bg-indigo-600 text-white px-2 py-1 rounded-lg font-black hover:bg-indigo-700 transition-colors shadow-sm"
                                      >
                                        MARK RECEIVED
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {item.source !== 'Store' && item.source !== 'Warehouse' && (
                                <div className={item.source === 'Store' ? "md:col-span-2" : "md:col-span-3"}>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Total Amount</div>
                                  <div className="text-xs font-black text-slate-900">
                                    {item.price ? (
                                      <span>₹{item.price.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-slate-400">N/A</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="md:col-span-1 flex justify-end">
                                {!mode && !hasCompletedPickup && (
                                  <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                              
                              {item.remarks && (
                                <div className="md:col-span-12 mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400 italic flex items-start gap-1">
                                  <MessageSquare size={10} className="mt-0.5 shrink-0" /> {item.remarks}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          )}
              
              {/* Action Buttons - Only show in My Cart tab (!mode) */}
              {!mode && (displayItems.length > 0 || hasActivePickup) && !hasCompletedPickup && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleCheckout}
                      className={`flex-1 py-5 px-8 rounded-2xl font-bold transition-all shadow-2xl flex items-center justify-center gap-2 group ${
                        hasActivePickup && displayItems.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                      }`}
                    >
                      {hasActivePickup 
                        ? (displayItems.length > 0 ? 'Confirm Order' : 'Checkout')
                        : (currentUser ? 'Checkout' : 'Sign in to Checkout')} 
                      <ArrowRight size={20} className={hasActivePickup && displayItems.length === 0 ? '' : 'group-hover:translate-x-1 transition-transform'} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          {!mode && (
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-8">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Package size={20} className="text-indigo-600" /> Order Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Total Items</span>
                    <span className="font-bold text-slate-900">{displayItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Total Weight</span>
                    <span className="font-bold text-slate-900">
                      {hasTBDWeight ? 'Est. ' : ''}
                      {displayWeight.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-slate-900">Estimated Total</span>
                      <span className="text-xl font-black text-indigo-600">₹{displayItems.reduce((acc, item) => acc + (item.price || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Coupons Box */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Apply Coupons</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter code" 
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                    <button className="px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </div>
    );
  };

  const StoreSection = useMemo(() => {
    let filteredProducts = storeProducts.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMinPrice = minPrice === '' || p.price >= minPrice;
      const matchesMaxPrice = maxPrice === '' || p.price <= maxPrice;
      return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice;
    });

    // Sorting logic
    filteredProducts = [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'weight-low': return a.weight - b.weight;
        case 'weight-high': return b.weight - a.weight;
        default: return 0;
      }
    });

    const hasActivePickup = currentUser 
      ? appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone))
      : (lastBookingRef ? appointments.some(a => a.id === lastBookingRef && a.status === 'Scheduled') : false);

    const ShopHeroSlider = () => {
      const [currentSlide, setCurrentSlide] = useState(0);
      const slides = [
        {
          title: "Bring a Piece of India to Your Doorstep",
          subtitle: "FESTIVE TRADITIONS",
          desc: "Authentic sweets, pooja items, and gifts delivered worldwide. Experience the joy of Indian festivals wherever you are.",
          image: "https://lh3.googleusercontent.com/d/1aAVjEX_ZdnuYP7hULa1_EsD9yO_xzPph",
          accent: "text-amber-400",
          bg: "from-slate-900 via-slate-900 to-amber-900/20",
          glow: "bg-amber-500/20",
          badge: "Festive Special",
          fullImage: true
        },
        {
          title: "Perfect Return Gifts for Every Celebration",
          subtitle: "CURATED GIFTING",
          desc: "Curated Indian gift packs for weddings, festivals & housewarmings. Make your special moments memorable with authentic Indian gifts.",
          image: "https://lh3.googleusercontent.com/d/1dxLyoYCj5EPfQP5mp9TEVxxbHCvyw4jg",
          accent: "text-rose-400",
          bg: "from-slate-900 via-slate-900 to-rose-900/20",
          glow: "bg-rose-500/20",
          badge: "Celebration Ready",
          fullImage: true
        },
        {
          title: "Missing Indian Sweets?",
          subtitle: "TASTE OF HOME",
          desc: "Get fresh, authentic sweets shipped directly from India. From Moti choor laddoo to Kaju Katli, we bring your favorite treats to your doorstep.",
          image: "https://lh3.googleusercontent.com/d/1UkJBaJFV91unv7jYqOXwEYY91r7ZOkvE",
          accent: "text-amber-400",
          bg: "from-slate-900 via-slate-900 to-amber-900/20",
          glow: "bg-amber-500/20",
          badge: "Fresh & Authentic",
          fullImage: true
        },
        {
          title: "All Your Pooja Essentials in One Place",
          subtitle: "SPIRITUAL HERITAGE",
          desc: "From diyas to idols—everything you need for rituals abroad. Maintain your spiritual traditions with authentic pooja items.",
          image: "https://lh3.googleusercontent.com/d/1gpGBNFhoBWpcTMg5nV2-OEdWRWfQGFEy",
          accent: "text-teal-400",
          bg: "from-slate-900 via-slate-900 to-teal-900/20",
          glow: "bg-teal-500/20",
          badge: "Spiritual Essentials",
          fullImage: true
        }
      ];

      useEffect(() => {
        const timer = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 7000);
        
        return () => {
          clearInterval(timer);
        };
      }, [currentSlide]);

      return (
        <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white shadow-2xl mb-12 h-[500px] group">
          <AnimatePresence>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {slides[currentSlide].fullImage ? (
                <img 
                  src={slides[currentSlide].image} 
                  alt={slides[currentSlide].title}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].bg} z-10`}
                  />
                  <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[700px] h-[700px] ${slides[currentSlide].glow} rounded-full blur-[150px] z-0`} />
                </>
              )}
              
              {!slides[currentSlide].fullImage && (
                <div className="relative z-20 h-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-10 md:px-24">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full ${slides[currentSlide].accent} text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 shadow-lg`}>
                          <Sparkles size={12} /> {slides[currentSlide].subtitle}
                        </div>
                        <div className="px-4 py-1.5 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                          {slides[currentSlide].badge}
                        </div>
                      </motion.div>
                      <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] drop-shadow-2xl"
                      >
                        {slides[currentSlide].title.split(',').map((part, i) => (
                          <React.Fragment key={i}>
                            {part}{i === 0 && slides[currentSlide].title.includes(',') && <br />}
                          </React.Fragment>
                        ))}
                      </motion.h1 >
                    </div>

                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl"
                    >
                      {slides[currentSlide].desc}
                    </motion.p>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center gap-8"
                    >
                      <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl">
                            <img src={`https://i.pravatar.cc/150?img=${i + 20}`} alt="User" />
                          </div>
                        ))}
                        <div className="w-12 h-12 rounded-full border-4 border-slate-900 bg-indigo-600 flex items-center justify-center text-xs font-black shadow-xl">
                          +5k
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-400 leading-tight">
                        <span className="text-white text-base">Trusted by thousands</span> <br /> of Indians living abroad
                      </div>
                    </motion.div>
                  </div>

                  <div className="hidden lg:block relative h-full py-16">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, x: 50 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                      className="relative z-10 h-full group/img"
                    >
                      <div className="absolute -inset-4 bg-gradient-to-br from-white/10 to-transparent rounded-[4rem] blur-3xl opacity-50 group-hover/img:opacity-100 transition-opacity duration-700" />
                      <img 
                        src={slides[currentSlide].image} 
                        alt={slides[currentSlide].title} 
                        className="relative z-10 rounded-[4rem] shadow-2xl border border-white/10 object-cover w-full h-full transform transition-transform duration-700 group-hover/img:scale-[1.02]"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Indicators */}
          <div className="absolute bottom-10 left-10 md:left-24 z-30 flex items-center gap-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentSlide(i);
                }}
                className="group flex items-center gap-2"
              >
                <div className={`h-2 rounded-full transition-all duration-500 ${
                  currentSlide === i ? 'w-12 bg-white' : 'w-2 bg-white/20 group-hover:bg-white/40'
                }`} />
                <span className={`text-[10px] font-black tracking-widest transition-opacity duration-500 ${currentSlide === i ? 'opacity-100' : 'opacity-0'}`}>
                  0{i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <ShopHeroSlider />
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl justify-center items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm ${
                  showFilters || minPrice !== '' || maxPrice !== ''
                    ? 'bg-jiffex-orange/10 border-jiffex-orange/30 text-jiffex-orange' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
                {(minPrice !== '' || maxPrice !== '') && (
                  <span className="w-2 h-2 bg-jiffex-orange rounded-full"></span>
                )}
              </button>
              <div className="relative group">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-slate-600 cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                  <option value="weight-low">Weight: Low to High</option>
                  <option value="weight-high">Weight: High to Low</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col items-center">
          <div className="flex flex-wrap gap-2 justify-center">
            {['All', ...categories].map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                  selectedCategory === cat 
                    ? 'bg-deep-blue border-deep-blue text-white shadow-lg shadow-deep-blue/20' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Range (₹)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400">-</span>
                      <input 
                        type="number" 
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => { setMinPrice(''); setMaxPrice(''); setSortBy('featured'); setSelectedCategory('All'); setSearchQuery(''); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                    >
                      Reset all filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? filteredProducts.map(product => {
            const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
            const itemCount = cartItem?.quantity || 0;
            
            return (
              <motion.div 
                layout
                key={product.id} 
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col"
              >
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-4 right-4 z-10 w-8 h-8 bg-jiffex-orange text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white"
                    >
                      {itemCount}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="aspect-square overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {product.category}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-deep-blue leading-tight truncate flex-1 mr-2">{product.name}</h3>
                    <span className="text-jiffex-orange font-bold shrink-0">₹{product.price}</span>
                  </div>
                  <div className="flex flex-col gap-1 mb-4">
                    <p className="text-[10px] text-slate-500">Weight: {product.weight} kg</p>
                    {product.estimatedDelivery && (
                      <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Calendar size={10} /> Ready to ship by: {product.estimatedDelivery}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto">
                    <div className="flex justify-center">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addItem({ 
                          name: product.name, 
                          weight: product.weight, 
                          price: product.price, 
                          image: product.image,
                          estimatedDelivery: product.estimatedDelivery 
                        }, 'Store')}
                        className="w-12 h-12 bg-deep-blue text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/20"
                      >
                        <Plus size={24} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No products found</h3>
              <p className="text-slate-500">Try adjusting your search or category filter.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-indigo-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-8">
          <AnimatePresence>
            {showJiffySuggestion && !hasActivePickup && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-3xl"
              >
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                      <Package className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 leading-tight">Ship more from home or Pickup from home?</h4>
                      <p className="text-slate-500 text-sm">Want to get some items from home or anywhere to ship along with your Shop items? Add warehouse items or schedule an agent pickup.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        navigateTo('warehouse');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      <Package size={16} /> Add warehouse items <ArrowRight size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        navigateTo('pickup');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                    >
                      <Truck size={16} /> Schedule Pickup from home <ArrowRight size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowJiffySuggestion(false)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }, [selectedCategory, searchQuery, sortBy, minPrice, maxPrice, showFilters, addItem, removeStoreItem, handleCheckout, items, storeProducts, currentUser, showJiffySuggestion, setActiveTab, appointments, lastBookingRef]);

  const FinalizeSection = useMemo(() => {
    if (!currentUser) return null;
    const cartItems = items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);
    const isWarehouseCheckout = orderId ? orderId.startsWith('SW-') : cartItems.some(i => i.source === 'Warehouse');

    if (isPaid) {
      const hasScheduledPickup = appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone));
      const isPayAtHome = hasScheduledPickup && shippingPreference === 'International';
      
      return (
        <div className="max-w-2xl mx-auto text-center space-y-8 pb-12">
          {!isWarehouseCheckout && <CheckoutProgressTracker />}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 size={64} />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900">
              {isWarehouseCheckout ? 'Shipment Request Confirmed!' : isPayAtHome ? 'Order Confirmed!' : 'Payment Successful!'}
            </h2>
            <p className="text-slate-500">
              {isWarehouseCheckout 
                ? `Your shipment request has been placed successfully. Order ID: ${orderId}` 
                : `Your order ${orderId} has been placed successfully.`
              }
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <span className="font-black text-indigo-600">{isWarehouseCheckout ? 'Awaiting Warehouse Arrival' : '12-15 Business Days'}</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              {isWarehouseCheckout 
                ? "Your shipment request has been successfully registered. You can check the status of your order in My Orders."
                : isPayAtHome 
                  ? "Your order is confirmed. Our agent will collect your items and finalize the billing at your home during pickup. You'll receive a confirmation email shortly."
                  : shippingPreference === 'LocalPickup'
                    ? "Your payment is successful. Our agent will bring these items when they come for your scheduled home pickup. You'll receive a confirmation email shortly."
                    : `We have received your payment. Our team will consolidate your items and ship them on ${selectedDate}. You can track your shipment in your history.`
              }
            </p>
          </div>
          <div className="flex justify-center">
            <button 
              onClick={() => { navigateTo('history'); setIsPaid(false); setOrderId(null); }}
              className="w-full md:w-2/3 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
            >
              {isWarehouseCheckout ? 'Go to My Orders' : 'View Order History'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!isWarehouseCheckout && <CheckoutProgressTracker />}
          
          {/* Shipping Preference Selection */}
          {!isWarehouseCheckout && appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone)) && cartItems.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Truck className="text-indigo-600" /> How should we deliver your shop items?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => {
                    setShippingPreference('International');
                    setAddress({
                      fullName: pickupName || currentUser?.name || '',
                      email: currentUser?.email || '',
                      phone: pickupPhone || '',
                      addressLine1: `${pickupAddress.street}${pickupAddress.apartment ? ', ' + pickupAddress.apartment : ''}`,
                      city: pickupAddress.city,
                      state: pickupAddress.state,
                      zipCode: pickupAddress.zip,
                      country: 'India'
                    });
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${shippingPreference === 'International' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shippingPreference === 'International' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe size={20} />
                    </div>
                    <div className="font-bold">Ship to my home</div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Consolidate with your pickup items and ship to your home address. <span className="font-bold text-indigo-600">Pay at Home enabled.</span>
                  </p>
                </div>
                <div 
                  onClick={() => {
                    setShippingPreference('LocalPickup');
                    setAddress(WAREHOUSE_ADDRESS);
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${shippingPreference === 'LocalPickup' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shippingPreference === 'LocalPickup' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Package size={20} />
                    </div>
                    <div className="font-bold">Bring items during Home Pickup</div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Our agent will bring these items when they come for your pickup. <span className="font-bold text-emerald-600">Pay Now to confirm.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order ID Header */}
          {orderId && !isWarehouseCheckout && (
            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-80">Order Reference</div>
                <div className="text-2xl font-black">{orderId}</div>
              </div>
              <div className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-xs font-bold">
                Awaiting Payment
              </div>
            </div>
          )}

          {/* Address Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="text-red-500" /> {shippingPreference === 'LocalPickup' ? 'Warehouse Destination' : 'Destination Address'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  disabled={shippingPreference === 'LocalPickup'}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={address.fullName}
                  onChange={e => setAddress({...address, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  disabled={shippingPreference === 'LocalPickup'}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={address.email}
                  onChange={e => setAddress({...address, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone</label>
                <input 
                  type="tel" 
                  disabled={shippingPreference === 'LocalPickup'}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={address.phone}
                  onChange={e => setAddress({...address, phone: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Address Line 1</label>
                <input 
                  type="text" 
                  disabled={shippingPreference === 'LocalPickup'}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={address.addressLine1}
                  onChange={e => setAddress({...address, addressLine1: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">City</label>
                <input 
                  type="text" 
                  disabled={shippingPreference === 'LocalPickup'}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={address.city}
                  onChange={e => setAddress({...address, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Zip Code</label>
                <input 
                  type="text" 
                  disabled={shippingPreference === 'LocalPickup'}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="e.g. 123456"
                  value={address.zipCode}
                  onChange={e => setAddress({...address, zipCode: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Country</label>
                <select 
                  disabled={shippingPreference === 'LocalPickup'}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={address.country}
                  onChange={e => setAddress({...address, country: e.target.value})}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {shippingPreference && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-xs text-amber-700">
                <Info size={14} />
                <span>
                  {shippingPreference === 'LocalPickup' 
                    ? 'Warehouse address is used for local pickup items.' 
                    : 'Address pre-filled from your pickup location. You can modify it if needed.'}
                </span>
              </div>
            )}
          </div>

          {/* Shipping Date */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-indigo-600" /> Select Shipping Date
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SHIPPING_DATES.map(date => (
                <button 
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${selectedDate === date ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                >
                  <div className="text-xs font-bold uppercase opacity-60 mb-1">
                    {new Date(date).toLocaleString('default', { month: 'long' })}
                  </div>
                  <div className="text-xl font-black">{date.split('-')[2]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          {!isWarehouseCheckout && (
            (!appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone)) || shippingPreference === 'LocalPickup') ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="text-emerald-600" /> Payment Method
                </h3>
                <div className="space-y-4">
                  <div 
                    onClick={() => setPaymentMethod('phonepe')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${paymentMethod === 'phonepe' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                  >
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">Pe</div>
                    <div>
                      <div className="font-bold">PhonePe</div>
                      <div className="text-xs text-slate-500">UPI, Wallet & Cards</div>
                    </div>
                    <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'phonepe' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'phonepe' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                  >
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-white"><CreditCard size={24} /></div>
                    <div>
                      <div className="font-bold">Credit / Debit Card</div>
                      <div className="text-xs text-slate-500">Visa, Mastercard, Amex</div>
                    </div>
                    <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'card' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Home size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Pay at Home enabled</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Since you have a scheduled pickup and opted to ship to your home, you can pay for your shop items along with your shipping charges. 
                    <span className="block mt-2 font-bold text-emerald-700">Final billing will be done at your home during pickup.</span>
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-6 rounded-3xl sticky top-8">
            {isWarehouseCheckout ? (
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold mb-2">Shipment Information</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  No payment is required right now. Final billing and invoice will be generated after all items are received at our warehouse. You can check the status of your order in <span className="font-bold text-indigo-400">My Orders</span>.
                </p>
                <div className="h-px bg-slate-800 my-4" />
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300 text-sm">
                    <span className="font-medium">Total Items</span>
                    <span className="font-black text-indigo-400 text-lg">{cartItems.length} Items</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Total Weight</span>
                    <span className="text-white font-medium">{totalWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Shipping ({address.country})</span>
                    <span className="text-white font-medium">₹{(totalWeight * (shippingRates[address.country] || 10)).toFixed(2)}</span>
                  </div>
                  {(() => {
                    const discountPercent = shippingDiscounts[address.country] || 0;
                    if (discountPercent > 0) {
                      const baseShip = totalWeight * (shippingRates[address.country] || 10);
                      const saved = baseShip * (discountPercent / 100);
                      return (
                        <div className="flex justify-between text-rose-400 text-sm font-semibold">
                          <span>Shipping Discount ({discountPercent}%)</span>
                          <span>-₹{saved.toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Items Cost</span>
                    <span className="text-white font-medium">₹{cartItems.reduce((sum, i) => sum + (i.price || 0), 0).toFixed(2)}</span>
                  </div>
                  {appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone)) && (
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>Shop Item Delivery</span>
                      <span className="text-emerald-400 font-medium">{shippingPreference === 'LocalPickup' ? 'During Home Pickup' : 'To my Home'}</span>
                    </div>
                  )}

                  {/* Coupon Application Block */}
                  <div className="py-3 border-t border-b border-slate-800/60 my-2">
                    {!appliedCoupon ? (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apply Coupon Code (5 Chars)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={5}
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            className="bg-slate-800 text-white text-xs font-mono font-bold uppercase rounded-xl px-3 py-2 flex-grow outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-500"
                            placeholder="CODE5"
                            id="coupon-apply-input"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const codeClean = couponCodeInput.trim().toUpperCase();
                              if (codeClean.length !== 5) {
                                toast.error("Coupon code must be exactly 5 characters.");
                                return;
                              }
                              const matched = coupons.find(c => c.code === codeClean);
                              if (!matched) {
                                toast.error(`Coupon code "${codeClean}" is invalid or does not exist.`);
                                return;
                              }
                              if (!matched.isEnabled) {
                                toast.error(`Coupon code "${codeClean}" is currently inactive.`);
                                return;
                              }
                              setAppliedCoupon({
                                code: matched.code,
                                discountPercent: matched.discountPercent
                              });
                              toast.success(`Coupon "${matched.code}" applied successfully! Saved ${matched.discountPercent}% OFF total.`);
                            }}
                            id="apply-coupon-btn"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4 py-2 transition-all active:scale-95 shrink-0"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-2.5">
                        <div className="flex items-center gap-2">
                          <TicketIcon size={14} className="text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider font-mono">Coupon applied</div>
                            <div className="text-[11px] text-slate-300 font-semibold">{appliedCoupon.code} ({appliedCoupon.discountPercent}% OFF)</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponCodeInput('');
                            toast.info("Coupon code removed.");
                          }}
                          className="text-[10px] bg-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400 text-sm font-semibold animate-fadeIn">
                      <span>Coupon Discount ({appliedCoupon.discountPercent}%)</span>
                      <span>-₹{(totalCost * (appliedCoupon.discountPercent / 100)).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="h-px bg-slate-800 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount</span>
                    <span className="text-2xl font-black text-indigo-400">
                      ₹{(appliedCoupon ? Math.max(0, totalCost - (totalCost * (appliedCoupon.discountPercent / 100))) : totalCost).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="bg-slate-800 p-4 rounded-2xl mb-6">
              <div className="flex items-start gap-3 text-xs text-slate-300">
                <Info size={16} className="text-indigo-400 shrink-0" />
                <p>By confirming, you agree to our shipping terms and conditions.</p>
              </div>
            </div>

            <button 
              disabled={cartItems.length === 0}
              onClick={handleFinalPayment}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
            >
              {isWarehouseCheckout 
                ? 'Confirm Shipment Request'
                : (appointments.some(a => a.status === 'Scheduled' && (a.customerId === currentUser.id || a.email?.toLowerCase() === currentUser.email?.toLowerCase() || a.phone === currentUser.phone)) && shippingPreference === 'International') 
                  ? 'Confirm Order (Pay at Home)' 
                  : 'Confirm & Pay'
              }
            </button>

            <div className="mt-8 pt-8 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Prohibited Items</h4>
              <div className="space-y-2">
                {PROHIBITED_ITEMS.slice(0, 4).map(item => (
                  <div key={item} className="flex items-center gap-2 text-[10px] text-slate-400">
                    <AlertTriangle size={12} className="text-amber-500" /> {item}
                  </div>
                ))}
                <button className="text-[10px] text-indigo-400 font-bold mt-2">View Full List</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isPaid, orderId, address, selectedDate, paymentMethod, items, totalWeight, totalCost, dbStatus.connected, currentUser?.id, handleFinalPayment, shippingPreference, appointments, pickupAddress, pickupName, pickupPhone, orderedItemIds]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!currentUser && activeTab === 'finalize') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Secure Checkout</h2>
          <p className="text-slate-500 leading-relaxed">Please sign in to your account to securely complete your payment and finalize your shipment.</p>
          <button 
            onClick={() => { setLoginTriggerSource('checkout'); setShowLoginModal(true); }}
            className="w-full btn-cta flex items-center justify-center gap-2"
          >
            <UserIcon size={20} /> Sign In to Pay
          </button>
          <button 
            onClick={() => navigateTo('cart')}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const wasGuest = isGuestMode;
    setIsGuestMode(false);
    setGuestEmail('');
    
    // Clear all local state on logout
    setItems([]);
    setOrders([]);
    setActivePickupStep(1);
    setLastBookingRef(null);
    setIsSchedulingNewPickup(false);
    setShowPickupConfirmModal(false);
    
    setAddress({
      fullName: '',
      email: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '',
      zipCode: '',
      country: COUNTRIES[0],
    });
    setPickupAddress({
      street: '',
      apartment: '',
      city: '',
      state: '',
      zip: ''
    });
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
    setPickupName('');
    setPickupPhone('');
    setPickupLanguage('English');
    setPickupItemType('Everyday Items');
    setPickupVehicleType('Less than 5 kg');
    setPickupSpecialInstructions('');
    setPickupCategory('Personal Effects');
    setPickupEstimatedWeight('Less than 5 kg');
    setCartItemName('');
    setCartItemWeight('');
    setCartItemQuantity(1);
    setCartItemFragile(false);
    setCartItemInvoiceNumber('');
    setCartItemRemarks('');
    setIsPaid(false);
    setOrderId(null);
    setActiveTab('home');
    setTabHistory(['home']);
  };

  const handleAssignAgent = async (orderId: string, agent: AgentProfile | null) => {
    try {
      const previousOrder = orders.find(o => o.id === orderId);
      const prevAgent = previousOrder?.assignedAgent;
      
      await api.updateOrder(orderId, { 
        assignedAgent: agent || undefined, 
        assignedAgentId: agent ? agent.id : undefined 
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { 
        ...o, 
        assignedAgent: agent || undefined, 
        assignedAgentId: agent ? agent.id : undefined 
      } : o));

      // Also update 'pickups' table in Supabase
      if (dbStatus.connected) {
        try {
          await api.updatePickup(orderId, {
            assignedAgentId: agent ? agent.id : null,
          });
        } catch (e) {
          console.warn('Failed to update pickup agent assignment in Supabase:', e);
        }
      }

      if (agent) {
        logAgentActionToSupabase(
          'ASSIGN',
          agent.id,
          agent.name,
          { orderId },
          currentUser?.email || 'admin@jiffex.com'
        );
      } else if (prevAgent) {
        logAgentActionToSupabase(
          'DEASSIGN',
          prevAgent.id,
          prevAgent.name,
          { orderId },
          currentUser?.email || 'admin@jiffex.com'
        );
      }
    } catch (err) {
      console.error('Failed to assign agent:', err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 safe-top safe-bottom overflow-x-hidden">
      {/* Supabase Status Banner */}
      {!dbStatus.connected && dbStatus.checked && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-amber-700 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Database size={12} />
            Database Not Connected. Using Local Storage Mode.
            <button 
              onClick={() => {
                setDbStatus(prev => ({ ...prev, checked: false }));
                api.checkHealth()
                  .then(res => setDbStatus({ connected: res.supabaseConnected, checked: true }))
                  .catch(() => setDbStatus({ connected: false, checked: true }));
              }}
              className="ml-2 px-2 py-0.5 bg-amber-200 hover:bg-amber-300 transition-colors rounded text-[8px]"
            >
              Retry
            </button>
          </div>
          <p className="text-[8px] opacity-70 normal-case font-medium">
            Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Settings {'>'} Environment Variables.
          </p>
        </div>
      )}
      
      {/* Header Area (Sticky) */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-md">
        {/* Error Banner */}
        {dbError && (
          <div className="bg-red-500 text-white p-4 text-center font-bold relative z-20 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
              <ShieldCheck size={20} />
              <span>{dbError}</span>
              <button 
                onClick={() => setDbError(null)}
                className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="border-b border-slate-200 bg-white sticky top-0 z-[100]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer shrink-0 mr-4 sm:mr-6 md:mr-10" 
              onClick={() => {
                if (currentUser?.role === 'admin' || currentUser?.role === 'Admin') navigateTo('admin');
                else if (currentUser?.role === 'agent' || currentUser?.role === 'Agent') {
                  setActiveWorkOrder(null);
                  navigateTo('agent');
                } else navigateTo('home');
              }}
            >
              <Logo height="h-12 sm:h-14" />
            </div>
            
            <div className="flex-1 flex items-center justify-between gap-2 sm:gap-6 md:gap-10 lg:gap-14">
              <div className="hidden md:flex items-center gap-6">
                {currentUser?.role !== 'agent' && (
                  <button 
                    onClick={() => navigateTo('store')}
                    className={`text-sm lg:text-base font-bold transition-all ${activeTab === 'store' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Shop
                  </button>
                )}

                {currentUser?.role !== 'agent' && (
                  <div 
                    className="relative group"
                    onMouseEnter={() => setShowSendDropdown(true)}
                    onMouseLeave={() => setShowSendDropdown(false)}
                  >
                    <button 
                      onClick={() => setShowSendDropdown(!showSendDropdown)}
                      className={`flex items-center gap-2 text-base lg:text-lg font-black transition-all px-4 lg:px-5 py-2.5 rounded-2xl border-2 ${
                        activeTab === 'pickup' || activeTab === 'warehouse'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
                          : 'border-transparent text-slate-900 hover:text-black hover:bg-slate-100/60 hover:border-slate-200/40'
                      }`}
                    >
                      Send <ChevronDown size={20} strokeWidth={3} className={`transition-transform duration-500 ${showSendDropdown ? 'rotate-180 text-indigo-600' : 'text-slate-900'}`} />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {showSendDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-3 dropdown-send z-50 flex flex-row gap-4 p-3 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/50"
                        >
                          <button 
                            onClick={() => { navigateTo('pickup'); setShowSendDropdown(false); }}
                            className="w-44 aspect-square flex flex-col items-center justify-center text-center gap-4 p-4 rounded-xl bg-[#f8fafc] hover:bg-white hover:-translate-y-[3px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)] text-slate-600 hover:text-indigo-600 transition-all duration-200 ease-in-out border border-transparent hover:border-indigo-100 group/item"
                          >
                            <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all duration-300">
                              <Truck size={28} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm">Pickup from Home</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Agent collects from you</span>
                            </div>
                          </button>

                          <button 
                            onClick={() => { navigateTo('warehouse'); setShowSendDropdown(false); }}
                            className="w-44 aspect-square flex flex-col items-center justify-center text-center gap-4 p-4 rounded-xl bg-[#f8fafc] hover:bg-white hover:-translate-y-[3px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)] text-slate-600 hover:text-indigo-600 transition-all duration-200 ease-in-out border border-transparent hover:border-indigo-100 group/item"
                          >
                            <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all duration-300">
                              <Package size={28} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm">Send to Warehouse</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Ship from our facility</span>
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}



                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => navigateTo('admin')}
                    className={`text-sm lg:text-base font-bold transition-all px-3 py-1.5 rounded-xl border border-indigo-100 ${activeTab === 'admin' ? 'text-white bg-indigo-600' : 'text-indigo-600 hover:bg-indigo-50'}`}
                  >
                    Admin
                  </button>
                )}
                {currentUser?.role === 'webmaster' && (
                  <button 
                    onClick={() => navigateTo('admin')}
                    className={`text-sm lg:text-base font-bold transition-all px-3 py-1.5 rounded-xl border border-indigo-100 ${activeTab === 'admin' ? 'text-white bg-indigo-600' : 'text-indigo-600 hover:bg-indigo-50'}`}
                  >
                    Catalog
                  </button>
                )}
                {currentUser?.role === 'agent' && (
                  <button 
                    onClick={() => { setActiveWorkOrder(null); navigateTo('agent'); }}
                    className={`text-sm lg:text-base font-bold transition-all px-3 py-1.5 rounded-xl border border-emerald-100 ${activeTab === 'agent' ? 'text-white bg-emerald-600' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  >
                    Work Portal
                  </button>
                )}
                {currentUser?.role === 'customer_service' && (
                  <button 
                    onClick={() => navigateTo('support')}
                    className={`text-sm lg:text-base font-bold transition-all px-3 py-1.5 rounded-xl border border-indigo-100 ${activeTab === 'support' ? 'text-white bg-indigo-600' : 'text-indigo-600 hover:bg-indigo-50'}`}
                  >
                    Support Desk
                  </button>
                )}

                {currentUser?.role !== 'customer_service' && currentUser?.role !== 'agent' && (
                  <div className="flex items-center gap-4 lg:gap-6">
                    <button 
                      onClick={() => navigateTo('track')}
                      className={`text-sm lg:text-base font-medium transition-all ${activeTab === 'track' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Track
                    </button>
                    <button 
                      onClick={() => navigateTo('support')}
                      className={`text-sm lg:text-base font-medium transition-all ${activeTab === 'support' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Support
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
                {currentUser?.role !== 'agent' && (
                  <button 
                    onClick={handleQuickQuoteClick}
                    className="hidden sm:block text-sm lg:text-base font-bold text-indigo-600 hover:text-indigo-700 transition-all text-nowrap"
                  >
                    Quick Quote
                  </button>
                )}
                {/* Cart Icon Only */}
                {currentUser?.role !== 'agent' && (
                  <button 
                    onClick={() => navigateTo('cart')}
                    className={`relative p-1.5 sm:p-3 rounded-2xl transition-all ${activeTab === 'cart' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black border-2 border-white">
                        {cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}
                      </span>
                    )}
                  </button>
                )}

                {currentUser ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowUserDropdown(true)}
                    onMouseLeave={() => setShowUserDropdown(false)}
                  >
                    <button 
                      className={`flex items-center gap-1.5 sm:gap-3 px-2 py-1.5 sm:px-4 sm:py-2 rounded-2xl transition-all border-2 ${
                        showUserDropdown ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden md:flex flex-col items-start leading-none">
                        {currentUser.role.toLowerCase() !== 'customer' && (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{currentUser.role}</span>
                        )}
                        <span className="text-sm font-black text-slate-900">{currentUser.name}</span>
                      </div>
                      <ChevronDown size={16} className={`hidden md:block transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showUserDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="absolute top-full right-0 mt-2 w-56 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 py-2 z-50"
                        >
                          <div className="px-4 py-3 border-b border-slate-50 mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Signed in as</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{currentUser.email}</p>
                          </div>
                          
                          {currentUser?.role !== 'agent' && (
                            <>
                              <button 
                                onClick={() => { navigateTo('history'); setShowUserDropdown(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                              >
                                <History size={18} /> My Orders
                              </button>
                              
                              <button 
                                onClick={() => { navigateTo('account'); setShowUserDropdown(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                              >
                                <UserIcon size={18} /> My Account
                              </button>
                            </>
                          )}

                          <div className="h-px bg-slate-50 my-1 mx-2" />
                          
                          <button 
                            onClick={() => { handleLogout(); setShowUserDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                          >
                            <LogOut size={18} /> Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setLoginTriggerSource('default'); setShowLoginModal(true); }}
                    className="bg-deep-blue text-white flex items-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <UserIcon size={16} className="sm:w-[18px] sm:h-[18px]" /> <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t border-slate-100 bg-white overflow-hidden"
              >
                <div className="flex flex-col p-4 gap-2">
                  <div className="px-3 py-4 mb-2 border-b border-slate-50">
                    <Logo height="h-10" />
                  </div>
                  {currentUser?.role !== 'agent' && (
                    <button 
                      onClick={() => { navigateTo('store'); setIsMobileMenuOpen(false); }}
                      className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'store' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Shop
                    </button>
                  )}
                  {currentUser?.role !== 'agent' && (
                    <div className="flex flex-col gap-1">
                      <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Send Items</div>
                      <button 
                        onClick={() => { navigateTo('pickup'); setIsMobileMenuOpen(false); }}
                        className={`text-lg font-bold p-3 rounded-xl text-left transition-all flex items-center gap-3 ${activeTab === 'pickup' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Truck size={20} /> Pickup from Home
                      </button>
                      <button 
                        onClick={() => { navigateTo('warehouse'); setIsMobileMenuOpen(false); }}
                        className={`text-lg font-bold p-3 rounded-xl text-left transition-all flex items-center gap-3 ${activeTab === 'warehouse' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Package size={20} /> Send to Warehouse
                      </button>
                    </div>
                  )}
                  {currentUser?.role !== 'agent' && (
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => { navigateTo('track'); setIsMobileMenuOpen(false); }}
                        className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'track' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        Track Shipment
                      </button>
                      <button 
                        onClick={() => { navigateTo('support'); setIsMobileMenuOpen(false); }}
                        className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'support' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {currentUser?.role === 'customer_service' ? 'Support Desk' : 'Support'}
                      </button>
                    </div>
                  )}

                  {currentUser?.role === 'admin' && (
                    <button 
                      onClick={() => { navigateTo('admin'); setIsMobileMenuOpen(false); }}
                      className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Admin Dashboard
                    </button>
                  )}
                  {currentUser?.role === 'webmaster' && (
                    <button 
                      onClick={() => { navigateTo('admin'); setIsMobileMenuOpen(false); }}
                      className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Catalog Manager
                    </button>
                  )}
                  {currentUser?.role === 'agent' && (
                    <button 
                      onClick={() => { setActiveWorkOrder(null); navigateTo('agent'); setIsMobileMenuOpen(false); }}
                      className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'agent' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Work Portal
                    </button>
                  )}
                  {currentUser?.role !== 'agent' && (
                    <button 
                      onClick={handleQuickQuoteClick}
                      className="text-lg font-bold p-3 rounded-xl text-left text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      Quick Quote
                    </button>
                  )}
                  
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    {!currentUser ? (
                      <button 
                        onClick={() => { setLoginTriggerSource('default'); setShowLoginModal(true); setIsMobileMenuOpen(false); }}
                        className="w-full bg-deep-blue text-white flex items-center justify-center gap-2 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                      >
                        <UserIcon size={20} />
                        <span>Sign In</span>
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="px-3 py-2 flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Account</span>
                          <span className="text-lg font-black text-slate-900 leading-tight">{currentUser.name}</span>
                          <span className="text-xs text-slate-500 font-medium truncate">{currentUser.email}</span>
                        </div>
                        <div className="h-px bg-slate-100 my-2 mx-3" />
                        {currentUser?.role !== 'agent' && (
                          <>
                            <button 
                              onClick={() => { navigateTo('history'); setIsMobileMenuOpen(false); }}
                              className={`text-lg font-bold p-3 rounded-xl text-left transition-all flex items-center gap-3 ${activeTab === 'history' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <History size={20} /> My Orders
                            </button>
                            <button 
                              onClick={() => { navigateTo('account'); setIsMobileMenuOpen(false); }}
                              className="text-lg font-bold p-3 rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3"
                            >
                              <UserIcon size={20} /> My Account
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                          className="w-full p-3 rounded-xl text-left font-bold text-red-600 bg-red-50 flex items-center gap-2 mt-2"
                        >
                          <LogOut size={20} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                    

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* Main Content */}
      <main className={`relative max-w-7xl mx-auto px-4 pb-20 ${
        activeTab === 'home' || activeTab === 'store' || activeTab === 'warehouse' || activeTab === 'pickup' || activeTab === 'cart' || activeTab === 'finalize' 
          ? 'pt-8' 
          : activeTab === 'history' 
            ? 'pt-6' 
            : activeTab === 'admin' || activeTab === 'support' || currentUser?.role === 'agent'
              ? 'pt-4' 
              : 'pt-20'
      }`}>
        <AnimatePresence>
          {activeTab !== 'home' && activeTab !== 'pickup' && activeTab !== 'warehouse' && activeTab !== 'store' && activeTab !== 'finalize' && activeTab !== 'history' && activeTab !== 'agent' && activeTab !== 'support' && activeTab !== 'admin' && <BackButton onClick={goBack} />}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && HomeSection}
            {activeTab === 'track' && <TrackSection />}
            {activeTab === 'pickup' && renderUnifiedCartSection('Pickup')}
            {activeTab === 'warehouse' && renderUnifiedCartSection('Warehouse')}
            {activeTab === 'cart' && renderUnifiedCartSection()}
            {activeTab === 'notifications' && NotificationCenter}
            {activeTab === 'support' && (
              <SupportSection 
                currentUser={currentUser} 
                orders={orders}
                tickets={tickets}
                setTickets={setTickets}
                refundRequests={refundRequests}
                setRefundRequests={setRefundRequests}
              />
            )}
            {activeTab === 'store' && StoreSection}
            {activeTab === 'finalize' && FinalizeSection}
            {activeTab === 'history' && CustomerHistory}
            {activeTab === 'warehouse-mgmt' && renderWarehouseManagementSection()}
            {activeTab === 'admin' && (
              <AdminDashboard 
                currentUser={currentUser}
                orders={orders}
                appointments={appointments}
                onAssignAgent={handleAssignAgent}
                agents={agents}
                setAgents={setAgents}
                categories={categories}
                setCategories={setCategories}
                adminTab={adminTab as any}
                setAdminTab={setAdminTab as any}
                storeProducts={storeProducts}
                setStoreProducts={setStoreProducts}
                setOrders={setOrders}
                setItems={setItems}
                onUpdateOrderItemStatus={updateOrderItemStatus}
                onUpdateOrderItemWeight={updateOrderItemWeight}
                refundRequests={refundRequests}
                setRefundRequests={setRefundRequests}
                isWebmaster={currentUser?.role === 'webmaster'}
                shippingRates={shippingRates}
                setShippingRates={setShippingRates}
                shippingDiscounts={shippingDiscounts}
                setShippingDiscounts={setShippingDiscounts}
                coupons={coupons}
                setCoupons={setCoupons}
                isAutoAssignAgentEnabled={isAutoAssignAgentEnabled}
                setIsAutoAssignAgentEnabled={setIsAutoAssignAgentEnabled}
              />
            )}
            {activeTab === 'agent' && AgentSection}
            {activeTab === 'account' && (
              <AccountSection 
                currentUser={currentUser} 
                onUpdateProfile={handleUpdateProfile}
                customerWarehouseId={customerWarehouseId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`bg-slate-50 border-t border-slate-200 pt-16 pb-24 px-4 relative z-40 ${
        currentUser?.role?.toLowerCase() === 'agent' ? 'hidden md:block' : ''
      }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Logo height="h-12" />
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed text-sm">
              Your trusted partner for seamless global shipping and warehouse solutions. We simplify logistics so you can focus on growing your business.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Company</h4>
            <ul className="space-y-4">
              <li><button onClick={() => navigateTo('support')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Contact</button></li>
              <li><button onClick={() => alert('Shipping Policy coming soon!')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Shipping Policy</button></li>
              <li><button onClick={() => alert('Privacy Policy coming soon!')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Privacy Policy</button></li>
            </ul>
          </div>
          
          {currentUser?.role !== 'agent' && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Account</h4>
              <ul className="space-y-4">
                <li><button onClick={() => { setLoginTriggerSource('default'); setShowLoginModal(true); }} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Sign In</button></li>
                <li><button onClick={() => navigateTo(currentUser ? 'account' : 'home')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">My Account Details</button></li>
                <li><button onClick={() => navigateTo('history')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">My Shipments</button></li>
                <li><button onClick={() => navigateTo('history')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Order History</button></li>
                <li><button onClick={() => navigateTo('notifications')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Notifications</button></li>
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Services</h4>
            <ul className="space-y-4">
              <li><button onClick={() => navigateTo('pickup')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Pickup from home</button></li>
              <li><button onClick={() => navigateTo('warehouse')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Send to Our Warehouse</button></li>
              <li><button onClick={() => navigateTo('store')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Shop</button></li>
              <li><button onClick={() => navigateTo('home')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Rate Calculator</button></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2026 Global Logistics Pro Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-600 transition-colors"><Share size={20} /></button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors"><MessageSquare size={20} /></button>
          </div>
        </div>
      </footer>

      {/* Pickup Choice Modal - Removed for Unified Workflow */}

      {/* Conflict Modal */}
      <AnimatePresence>
        {showConflictModal.show && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Order in Progress</h3>
              <p className="text-slate-500 text-center mb-8 leading-relaxed">
                An agent pickup order is currently in progress. Do you still want to place this order? 
                <span className="block mt-2 font-bold text-indigo-600">If yes, this will be processed as a separate order.</span>
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    const { item, source } = showConflictModal;
                    if (item && source) {
                      addItem(item, source, true);
                    }
                  }}
                  className="w-full btn-cta"
                >
                  Yes, Place Separate Order
                </button>
                <button 
                  onClick={() => setShowConflictModal({ show: false, item: null, source: null })}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  No, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {cancellingPickupId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Cancel Pickup?</h3>
              <p className="text-slate-500 text-center mb-8 leading-relaxed">
                Are you sure you want to cancel this scheduled pickup request? This action cannot be undone.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmCancelPickup}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Yes, Cancel Pickup
                </button>
                <button 
                  onClick={() => setCancellingPickupId(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  No, Keep It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-5 right-5 w-10 h-10 bg-slate-100/90 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all z-20 shadow-sm"
              >
                <X size={20} />
              </button>
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mx-auto mb-3">
                    <Logo height="h-14 sm:h-16" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {loginTriggerSource === 'checkout' ? 'Almost There!' : loginTriggerSource === 'pickup' ? 'One Last Step!' : 'Welcome to Jiffex'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    {loginTriggerSource === 'checkout' 
                      ? 'Sign in or create an account to complete your secure checkout' 
                      : loginTriggerSource === 'pickup'
                      ? 'Verify your identity to confirm your pickup'
                      : 'Sign in or create an account to continue'}
                  </p>
                </div>
                <Login onSuccess={(email, name) => {
                  setGuestEmail(email);
                  if (name) setGuestName(name);
                  setIsGuestMode(true);
                  setShowLoginModal(false);
                  
                  // Auto-redirect based on role for smoother testing
                  const isAdmin = email === 'admin@jiffex.com';
                  const isAgent = email.toLowerCase().endsWith('.agent@jiffex.com') || email === 'agent@jiffex.com';
                  if (isAdmin) {
                    navigateTo('admin');
                  } else if (isAgent) {
                    navigateTo('agent');
                  } else if (loginTriggerSource === 'pickup') {
                    // Start guest/member session and direct synchronous confirmation to next step (Step 5)
                    const guestId = email ? `guest_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'guest-user';
                    confirmPickup('AllAgent', guestId, email, name || pickupName);
                  } else if (loginTriggerSource === 'checkout') {
                    navigateTo('finalize');
                  }
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPickupConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900">Confirm Pickup</h3>
                <button 
                  onClick={() => setShowPickupConfirmModal(false)}
                  className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</p>
                      <p className="text-base font-bold text-slate-900">{pickupName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                      <p className="text-base font-bold text-slate-900">+91 {pickupPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup Address</p>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed">
                        {pickupAddress.street}{pickupAddress.apartment ? `, ${pickupAddress.apartment}` : ''}, {pickupAddress.city}, {pickupAddress.zip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled Slot</p>
                      <p className="text-base font-bold text-slate-900">{selectedPickupDate} at {selectedPickupTime}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setShowPickupConfirmModal(false);
                      confirmPickup('AllAgent');
                    }}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-lg font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={24} /> Confirm & Schedule
                  </button>
                  <button 
                    onClick={() => setShowPickupConfirmModal(false)}
                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                  >
                    Back to Edit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPickupInProgressModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Active Pickup Order</h3>
                </div>
                <button 
                  onClick={() => setShowPickupInProgressModal(false)}
                  className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-slate-700">
                  <AlertCircle size={20} className="shrink-0 text-amber-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">Order Already in Progress</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      An existing order is already in progress. Do you want to place another order?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setIsSchedulingNewPickup(true);
                      setActivePickupStep(1);
                      setShowPickupInProgressModal(false);
                      setTabHistory(prev => [...prev, 'pickup']);
                      setActiveTab('pickup');
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] text-md font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    Yes, Place Another Order <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setIsSchedulingNewPickup(false);
                      setActivePickupStep(5);
                      setShowPickupInProgressModal(false);
                      setTabHistory(prev => [...prev, 'pickup']);
                      setActiveTab('pickup');
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full py-4 bg-slate-100 text-slate-700 rounded-[1.5rem] text-md font-black hover:bg-slate-200 transition-all border border-slate-200 flex items-center justify-center"
                  >
                    No, View Existing Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster position="top-center" richColors />
    </div>
  );
}
