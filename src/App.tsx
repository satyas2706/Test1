/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Logo } from './components/Logo';
import { 
  Package, 
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
  CheckCircle,
  AlertCircle,
  PieChart as PieChartIcon,
  Plus, 
  Minus,
  PlusCircle,
  Trash2, 
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
  User as UserIcon,
  ShoppingBag,
  Info,
  LayoutDashboard,
  History,
  Home,
  Users,
  BarChart3,
  Search,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  LogOut,
  Zap,
  Database,
  Loader2,
  Check,
  Phone,
  Upload,
  X,
  XCircle,
  Cpu,
  Shield,
  ChevronDown,
  Bell,
  Heart,
  Lock,
  MessageSquare,
  MessageCircle,
  Mail,
  SlidersHorizontal,
  ArrowUpDown,
  HelpCircle,
  ShoppingCart,
  Warehouse,
  Menu,
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
import { supabase } from './lib/supabase';
import { Login } from './components/Login';
import { Session } from '@supabase/supabase-js';

type Tab = 'home' | 'pickup' | 'warehouse' | 'store' | 'cart' | 'finalize' | 'history' | 'admin' | 'warehouse-mgmt' | 'agent' | 'support' | 'notifications' | 'track';


const API_URL = window.location.origin;

const sendWhatsApp = (phone: string, message: string) => {
  if (!phone) {
    toast.error('No phone number provided');
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

const StaticShipmentTracker = () => {
  const steps = [
    { label: 'Order Placed', status: 'completed', date: 'Oct 24', icon: CheckCircle2 },
    { label: 'In Transit', status: 'current', date: 'Oct 26', icon: Truck },
    { label: 'Out for Delivery', status: 'upcoming', date: 'Oct 28', icon: Package },
    { label: 'Delivered', status: 'upcoming', date: 'Oct 30', icon: CheckCircle2 },
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900">Track Shipment</h3>
          <p className="text-sm text-slate-500">Real-time updates for your package</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 rounded-2xl text-xs font-bold text-indigo-600 border border-indigo-100">
          ID: JFX-99283-IN
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
        <div className="absolute top-1/2 left-0 w-1/3 h-1 bg-indigo-600 -translate-y-1/2 rounded-full" />
        
        <div className="relative flex justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-3 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                step.status === 'completed' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' :
                step.status === 'current' ? 'bg-white border border-indigo-600 text-indigo-600 shadow-md shadow-indigo-50' :
                'bg-white border border-slate-100 text-slate-300'
              }`}>
                <step.icon size={20} />
              </div>
              <div className="text-center">
                <div className={`text-[10px] font-black uppercase tracking-widest ${step.status !== 'upcoming' ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </div>
                <div className="text-[9px] font-bold text-slate-400 mt-0.5">{step.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  currentUser: User | null;
  orders: Order[];
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  agents: AgentProfile[];
  setAgents: React.Dispatch<React.SetStateAction<AgentProfile[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  adminTab: 'Overview' | 'Agents' | 'Inventory' | 'Reports' | 'Settings' | 'Refunds';
  setAdminTab: React.Dispatch<React.SetStateAction<'Overview' | 'Agents' | 'Inventory' | 'Reports' | 'Settings' | 'Refunds'>>;
  storeProducts: StoreProduct[];
  setStoreProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  refundRequests: RefundRequest[];
  setRefundRequests: React.Dispatch<React.SetStateAction<RefundRequest[]>>;
  isWebmaster: boolean;
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
  setAppointments,
  agents,
  setAgents,
  categories,
  setCategories,
  adminTab,
  setAdminTab,
  storeProducts,
  setStoreProducts,
  setOrders,
  refundRequests,
  setRefundRequests,
  isWebmaster: isWebmasterProp
}: AdminDashboardProps) => {
  const [categoryInput, setCategoryInput] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [editDeliveryValue, setEditDeliveryValue] = useState<string>('');

  // Local state for drafts to prevent global re-renders and focus loss
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', email: '', vehicleNumber: '' });
  const [newProduct, setNewProduct] = useState<Partial<StoreProduct>>({ name: '', price: 0, category: categories[0] || 'Pooja', image: '', weight: 0, estimatedDelivery: '' });

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
    { label: 'Total Shipments', value: orders.length + appointments.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Pending Pickups', value: appointments.filter(a => a.status === 'Scheduled').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'Active Shipments', value: orders.filter(o => o.status !== 'Delivered').length, icon: Truck, color: 'bg-indigo-500' },
    { label: 'Pending Refunds', value: refundRequests.filter(r => r.status === 'Pending Approval').length, icon: RefreshCw, color: 'bg-red-500' },
  ].filter((_, i) => !isWebmaster || i !== 3);

  const availableTabs = (isWebmaster 
    ? ['Inventory', 'Settings'] 
    : ['Overview', 'Agents', 'Inventory', 'Reports', 'Refunds', 'Settings']) as any[];

  // Force tab if webmaster is on restricted tab
  useEffect(() => {
    if (isWebmaster && !['Inventory', 'Reports', 'Settings'].includes(adminTab)) {
      setAdminTab('Inventory');
    }
  }, [isWebmaster, adminTab, setAdminTab]);

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.phone) return;
    const agent: AgentProfile = {
      id: 'AG-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
      ...newAgent,
      status: 'Active'
    };
    setAgents([...agents, agent]);
    setNewAgent({ name: '', phone: '', email: '', vehicleNumber: '' });
  };

  const handleAssignAgent = (aptId: string, agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    setAppointments(prev => prev.map(apt => 
      apt.id === aptId ? { ...apt, assignedAgent: agent, assignedAgentId: agent.id } : apt
    ));
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
                         tab === 'Agents' ? Users : 
                         tab === 'Inventory' ? Package : 
                         tab === 'Reports' ? BarChart3 : 
                         tab === 'Refunds' ? RefreshCw :
                         tab === 'Settings' ? ShieldCheck : LayoutDashboard;
            
            return (
              <button 
                key={tab}
                onClick={() => setAdminTab(tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${
                  adminTab === tab 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={`${adminTab === tab ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {tab === 'Inventory' && isWebmaster ? 'Catalog' : (tab === 'Agents' ? 'Logistics' : tab)}
                {adminTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"
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
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:p-8 lg:pt-3 lg:pb-8 space-y-6 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {adminTab === 'Overview' && 'Dashboard Overview'}
              {adminTab === 'Agents' && 'Logistics & Agent Network'}
              {adminTab === 'Inventory' && (isWebmaster ? 'Product Catalog' : 'Inventory Management')}
              {adminTab === 'Reports' && 'Business Intelligence'}
              {adminTab === 'Refunds' && 'Refund Management'}
              {adminTab === 'Settings' && 'Control Panel Settings'}
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="text-amber-500" /> Pending Pickups
                </h3>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-100">
                  Action Required
                </span>
              </div>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No appointments scheduled</p>
                  </div>
                ) : (
                  appointments.map(apt => (
                    <div key={apt.id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <UserIcon size={18} />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm tracking-tight">{apt.id}</div>
                            <div className="text-xs font-bold text-indigo-600 truncate max-w-[120px]">{apt.customerName || 'Guest User'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">{apt.date}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apt.time}</div>
                        </div>
                      </div>

                      {apt.assignedAgent ? (
                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Car size={14} />
                            </div>
                            <div>
                              <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Assigned Agent</div>
                              <div className="text-xs font-black text-slate-900">{apt.assignedAgent.name}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, assignedAgent: undefined, assignedAgentId: undefined } : a))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Unassign Agent"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <select 
                              className="w-full p-2.5 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
                              onChange={(e) => handleAssignAgent(apt.id, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>Dispatch Agent...</option>
                              {agents.filter(a => a.status === 'Active').map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                          <div className="px-3 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-100">
                            Waiting
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Truck className="text-indigo-500" /> Active Logistics
                </h3>
                <div className="flex gap-2">
                  <button className="text-[10px] font-black px-3 py-1 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-all uppercase tracking-widest">View All</button>
                </div>
              </div>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No active shipments</p>
                  </div>
                ) : (
                  orders.slice(0, 5).map(order => (
                    <div key={order.id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Box size={18} />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm tracking-tight">{order.id}</div>
                            <div className="text-xs font-bold text-slate-500">{order.destination.country} • {order.totalWeight}kg</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">₹{order.totalCost.toLocaleString()}</div>
                          <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full mt-1">
                            {order.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <div className="relative flex-1">
                          <select 
                            className="w-full p-2.5 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as ShippingStatus)}
                          >
                            <option value="Request Placed">Request Placed</option>
                            <option value="Order Confirmed">Order Confirmed</option>
                            <option value="Processing Order">Processing Order</option>
                            <option value="Consolidating items">Consolidating items</option>
                            <option value="Packed">Packed</option>
                            <option value="Ready to Ship">Ready to Ship</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <button 
                          onClick={() => {
                            const message = `*JiffEX Invoice Update*\n\nOrder ID: ${order.id}\nCustomer: ${order.destination.fullName}\nTotal Amount: ₹${order.totalCost.toLocaleString()}\nCurrent Status: ${order.status}\n\nTrack your shipment: ${window.location.origin}?tab=track&id=${order.id}\n\nThank you for choosing JiffEX!`;
                            sendWhatsApp(order.destination.phone, message);
                          }}
                          className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all group/btn" 
                          title="Send Invoice via WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group/btn" title="Notify Customer via SMS/Email">
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-fit sticky top-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <PlusCircle size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Onboard Agent</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Identity</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                    placeholder="Enter full name"
                    value={newAgent.name}
                    onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contact</label>
                    <input 
                      type="tel" 
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                      placeholder="Phone"
                      value={newAgent.phone}
                      onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Plate #</label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                      placeholder="KA-01-..."
                      value={newAgent.vehicleNumber}
                      onChange={e => setNewAgent({...newAgent, vehicleNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Work Email</label>
                  <input 
                    type="email" 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                    placeholder="agent@jiffex.com"
                    value={newAgent.email}
                    onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                  />
                </div>
              </div>
              <button 
                onClick={handleAddAgent}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group"
              >
                Register Field Agent <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Agent Network</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{agents.length} active operators deployed</p>
                </div>
                <div className="flex gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
                    <Search size={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map(agent => (
                  <div key={agent.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 flex items-start gap-4 hover:border-indigo-200 transition-colors group">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0 border border-slate-100">
                      <UserIcon size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-black text-slate-900 text-lg tracking-tight truncate mb-0.5">{agent.name}</div>
                          <div className="text-xs font-bold text-indigo-600">{agent.phone}</div>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
                          {agent.status}
                        </span>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-2">
                          <Car size={12} /> {agent.vehicleNumber || 'No Vehicle'}
                        </div>
                        <button 
                          onClick={() => setAgents(agents.filter(a => a.id !== agent.id))}
                          className="ml-auto p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Box size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">New Product</h3>
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
                  onClick={() => {
                    if (!newProduct.name || !newProduct.price) return;
                    const prod: StoreProduct = {
                      id: 'p' + (storeProducts.length + 1),
                      name: newProduct.name,
                      price: newProduct.price,
                      category: newProduct.category as any,
                      image: newProduct.image || 'https://picsum.photos/seed/product/400/400',
                      weight: newProduct.weight || 0.5,
                      estimatedDelivery: newProduct.estimatedDelivery
                    };
                    setStoreProducts([...storeProducts, prod]);
                    setNewProduct({ name: '', price: 0, category: categories[0], image: '', weight: 0, estimatedDelivery: '' });
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                >
                  Publish to Catalog
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Boxes size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">Categories</h3>
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
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Store Catalog</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global Inventory Persistence</p>
                </div>
                <div className="flex gap-4">
                   <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Filter items..."
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storeProducts.map(product => (
                  <div key={product.id} className="p-5 bg-white rounded-[2.5rem] border border-slate-100 flex items-start gap-5 hover:border-indigo-200 transition-colors shadow-sm group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={product.name} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-black text-slate-900 text-lg tracking-tight truncate leading-tight">{product.name}</div>
                        <button 
                          onClick={() => setStoreProducts(storeProducts.filter(p => p.id !== product.id))}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-wider">{product.category}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{product.weight}kg</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-black text-slate-900 leading-none">₹{product.price.toLocaleString()}</div>
                        <button 
                          onClick={() => {
                            setEditingProductId(product.id);
                            setEditPriceValue(product.price.toString());
                            setEditDeliveryValue(product.estimatedDelivery || '');
                          }}
                          className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-black transition-all"
                        >
                          Edit Item
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : adminTab === 'Settings' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
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

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
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
              <button className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Logs</div>
                <div className="text-sm font-bold text-slate-900">Download .CSV</div>
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
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
                Explore {t} <ArrowRight size={14} />
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
    if (tab === 'pickup' && appointments.some(a => a.status === 'Scheduled') && !isSchedulingNewPickup) {
      setActivePickupStep(5);
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
      const newHistory = [...tabHistory];
      newHistory.pop(); // remove current
      const prevTab = newHistory[newHistory.length - 1];
      setTabHistory(newHistory);
      setActiveTab(prevTab);
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>(STORE_PRODUCTS);
  const [activeWorkOrder, setActiveWorkOrder] = useState<Appointment | null>(null);
  const [agents, setAgents] = useState<AgentProfile[]>([
    { id: 'AG-1', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@jiffex.com', status: 'Active', vehicleNumber: 'KA-01-AB-1234' },
    { id: 'AG-2', name: 'Priya Patel', phone: '+91 87654 32109', email: 'priya@jiffex.com', status: 'Active', vehicleNumber: 'MH-02-CD-5678' },
    { id: 'AG-TEST', name: 'Test Agent (You)', phone: '+91 00000 00000', email: 'agent@jiffex.com', status: 'Active', vehicleNumber: 'TEST-001' },
  ]);

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
  const [pickupLanguage, setPickupLanguage] = useState('English');
  const [pickupItemType, setPickupItemType] = useState('Everyday Items');
  const [pickupVehicleType, setPickupVehicleType] = useState('Fits in a car');
  const [pickupSpecialInstructions, setPickupSpecialInstructions] = useState('');
  const [pickupCategory, setPickupCategory] = useState('Personal Effects');
  const [pickupEstimatedWeight, setPickupEstimatedWeight] = useState('1-5 kg');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; checked: boolean }>({ connected: false, checked: false });
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTriggerSource, setLoginTriggerSource] = useState<'default' | 'checkout' | 'pickup'>('default');
  const [showPickupConfirmModal, setShowPickupConfirmModal] = useState(false);
  const [activePickupStep, setActivePickupStep] = useState(1);

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
  const [lastBookingRef, setLastBookingRef] = useState<string | null>(null);
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
  const [adminTab, setAdminTab] = useState<'Overview' | 'Agents' | 'Inventory' | 'Reports' | 'Settings'>('Overview');

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
  const [woOrderId, setWoOrderId] = useState<string | null>(null);
  const [woPaymentMethod, setWoPaymentMethod] = useState<'card' | 'phonepe'>('card');
  const [woShippingDate, setWoShippingDate] = useState<string>(SHIPPING_DATES[0]);
  const [showPickupChoiceModal, setShowPickupChoiceModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState<{ show: boolean; item: any; source: any }>({ show: false, item: null, source: null });
  const [cancellingPickupId, setCancellingPickupId] = useState<string | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoadingNotifications(true);
    try {
      const response = await fetch(`${API_URL}/notifications/${currentUser.id}`);
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
      await fetch(`${API_URL}/notifications/simulate`, {
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

  const confirmPickup = async (type: 'AllAgent' | 'Mixed' = 'AllAgent') => {
    const assignedAgent = type === 'AllAgent' ? agents[Math.floor(Math.random() * agents.length)] : undefined;
    const fullAddress = `${pickupAddress.street}${pickupAddress.apartment ? ', ' + pickupAddress.apartment : ''}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zip}`;
    
    const newAppointment: Appointment = { 
      id: 'WO-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      date: selectedPickupDate, 
      time: selectedPickupTime, 
      address: fullAddress, 
      phone: pickupPhone,
      customerName: pickupName,
      status: 'Scheduled',
      items: [],
      paymentStatus: 'Pending',
      customerId: currentUser?.id || 'guest-user',
      pickupType: type,
      assignedAgent: assignedAgent,
      assignedAgentId: assignedAgent?.id,
      languagePreference: pickupLanguage,
      itemType: pickupItemType,
      vehicleType: pickupVehicleType
    };
    setAppointments([...appointments, newAppointment]);
    
    // Also add to orders so it reflects in "My Orders"
    const newOrder: Order = {
      id: newAppointment.id,
      customerId: newAppointment.customerId!,
      items: [],
      totalWeight: 0,
      totalCost: 0,
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      shippingDate: newAppointment.date,
      destination: {
        fullName: newAppointment.customerName || currentUser?.name || 'Guest User',
        email: pickupEmail || currentUser?.email || '',
        phone: newAppointment.phone,
        addressLine1: newAppointment.address,
        city: pickupAddress.city,
        state: pickupAddress.state,
        zipCode: pickupAddress.zip,
        country: 'India'
      },
      paymentStatus: 'Pending'
    };
    setOrders([...orders, newOrder]);

    // Send confirmation email
    const recipientEmail = pickupEmail || currentUser?.email;
    if (recipientEmail && recipientEmail.includes('@') && recipientEmail !== 'user@example.com') {
      api.sendOrderConfirmationEmail(recipientEmail, newOrder, COMPANY_DETAILS)
        .then(() => toast.success(`Confirmation email sent to ${recipientEmail}`))
        .catch(err => {
          console.error('Failed to send pickup confirmation email:', err);
          toast.error(`Pickup scheduled, but ${err.message || 'failed to send email'}`);
        });
    }

    setLastBookingRef(newAppointment.id);
    setIsSchedulingNewPickup(false);
    setActivePickupStep(5);
    window.scrollTo(0, 0);
    
    // Sync to DB if connected
    if (dbStatus.connected && currentUser) {
      try {
        const orderData = {
          ...newAppointment,
          customer_id: currentUser.id,
          total_weight: 0,
          total_cost: 0,
          destination: newOrder.destination,
          payment_status: 'Pending',
          shipping_date: selectedPickupDate
        } as any;

        await api.createOrder(orderData);
      } catch (err) {
        console.error('Failed to sync pickup to DB:', err);
      }
    }

    setPickupName('');
    setPickupEmail('');
    setPickupPhone('');
    setPickupAddress({ street: '', apartment: '', city: '', state: '', zip: '' });
    setPickupLanguage('English');
    setShowPickupChoiceModal(false);
  };

  const cancelPickup = (id: string) => {
    setCancellingPickupId(id);
  };

  const confirmCancelPickup = () => {
    if (cancellingPickupId) {
      setAppointments(prev => prev.filter(a => a.id !== cancellingPickupId));
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
    // Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    api.checkHealth()
      .then(res => {
        setDbStatus({ connected: res.supabaseConnected, checked: true });
      })
      .catch(() => setDbStatus({ connected: false, checked: true }));

    return () => subscription.unsubscribe();
  }, []);

  // Sync currentUser with session or Guest Mode
  useEffect(() => {
    if (session?.user) {
      const email = session.user.email || '';
      let role: UserRole = 'customer';
      
      // Auto-assign roles based on official emails
      if (email === 'admin@jiffex.com') role = 'admin';
      else if (email === 'service@jiffex.com') role = 'customer_service';
      else if (email === 'agent@jiffex.com') role = 'agent';
      else if (email === 'webmaster@jiffex.com') role = 'webmaster';
      else role = (session.user.user_metadata?.role as UserRole) || 'customer';

      setCurrentUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || email.split('@')[0] || 'User',
        email: email,
        role: role
      });
    } else if (isGuestMode) {
      const email = guestEmail || '';
      let role: UserRole = 'customer';
      
      if (email === 'admin@jiffex.com') role = 'admin';
      else if (email === 'service@jiffex.com') role = 'customer_service';
      else if (email === 'agent@jiffex.com') role = 'agent';
      else if (email === 'webmaster@jiffex.com') role = 'webmaster';

      setCurrentUser({
        id: 'guest-user',
        name: guestName || (role === 'admin' ? 'Admin User' : role === 'agent' ? 'Agent User' : role === 'customer_service' ? 'Support CSR' : role === 'webmaster' ? 'Webmaster' : 'Guest User'),
        email: email || 'guest@example.com',
        role: role
      });
    } else {
      setCurrentUser(null);
    }
  }, [session, isGuestMode, guestEmail, guestName]);

  // Fetch orders when currentUser or activeTab changes
  useEffect(() => {
    if (dbStatus.connected && currentUser) {
      if (activeTab === 'history' || activeTab === 'home') {
        api.getOrders(currentUser.id).then(data => {
          const normalized = data.map(o => ({
            ...o,
            customerId: o.customerId || o.customer_id,
            totalWeight: o.totalWeight || o.total_weight,
            totalCost: o.totalCost || o.total_cost,
            paymentStatus: o.paymentStatus || o.payment_status,
            shippingDate: o.shippingDate || o.shipping_date,
            createdAt: o.createdAt || o.created_at
          }));
          setOrders(normalized);
        }).catch(console.error);
      }
    }
  }, [currentUser, activeTab, dbStatus.connected]);

  // Scroll to top when major state changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, activeWorkOrder, isPaid]);

  // --- Helpers ---
  const cartItems = useMemo(() => {
    return items.filter(i => i.source !== 'Warehouse' || i.submitted);
  }, [items]);

  const totalWeight = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  }, [cartItems]);

  const hasAllAgentPickup = useMemo(() => {
    return appointments.some(a => a.status === 'Scheduled' && a.pickupType === 'AllAgent');
  }, [appointments]);

  const totalCost = useMemo(() => {
    const rate = SHIPPING_RATES[address.country] || 10;
    const shippingCost = totalWeight * rate;
    const itemsCost = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    return shippingCost + itemsCost;
  }, [cartItems, totalWeight, address.country]);

  const minPickupDate = useMemo(() => {
    const storeItems = items.filter(i => i.source === 'Store' && i.estimatedDelivery);
    if (storeItems.length === 0) return null;
    
    let latestDate = new Date(0);
    storeItems.forEach(item => {
      const itemDate = new Date(item.estimatedDelivery!);
      if (itemDate > latestDate) {
        latestDate = itemDate;
      }
    });
    return latestDate;
  }, [items]);

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
      status: source === 'Store' ? 'Received at Warehouse' : 'Pending',
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

    // If Supabase is connected, try to sync
    if (dbStatus.connected && currentUser) {
      try {
        await api.createItem({
          ...newItem,
          user_id: currentUser.id // Ensure user_id is passed for Supabase
        } as any);
      } catch (err: any) {
        console.error('Failed to sync item to DB:', err.message);
        // Optional: show a toast or alert
      }
    }
  }, [items, dbStatus.connected, currentUser]);

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
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const handleFinalPayment = async () => {
    if (!currentUser) return;
    const hasScheduledPickup = appointments.some(a => a.status === 'Scheduled');
    const cartItems = items.filter(i => i.source !== 'Warehouse' || i.submitted);
    
    // Determine payment status based on pickup and shipping preference
    const isPayAtHome = hasScheduledPickup && shippingPreference === 'International';
    const paymentStatus = isPayAtHome ? 'Pay at Home' : 'Paid';

    const newOrder: Order = {
      id: orderId!,
      customerId: currentUser.id,
      items: [...cartItems],
      totalWeight,
      totalCost,
      status: 'Request Placed',
      createdAt: new Date().toISOString(),
      shippingDate: selectedDate,
      destination: address,
      paymentStatus: paymentStatus
    };
    
    // Optimistic update
    setOrders([...orders, newOrder]);
    setIsPaid(true);
    // Only remove items that were in the cart (submitted)
    setItems(items.filter(i => i.source === 'Warehouse' && !i.submitted));

    // Sync to DB
    if (dbStatus.connected) {
      try {
        await api.createOrder({
          ...newOrder,
          customer_id: currentUser.id, // Snake case for DB
          total_weight: totalWeight,
          total_cost: totalCost,
          payment_status: paymentStatus,
          shipping_date: selectedDate
        } as any);

        // Automatically send invoice email with PDF
        const recipientEmail = address.email || currentUser.email;
        if (isPayAtHome) {
          // Send a special "Pay at Home" confirmation email
          await api.sendOrderConfirmationEmail(recipientEmail, newOrder, COMPANY_DETAILS);
          toast.success(`Order confirmed! Confirmation sent to ${recipientEmail}. Final billing will be done at your home.`);
        } else {
          await api.sendInvoicePDF(recipientEmail, newOrder, COMPANY_DETAILS);
          toast.success(`Payment successful! Invoice sent to ${recipientEmail}`);
        }
      } catch (err: any) {
        console.error('Failed to sync order or send email:', err.message);
        const successMsg = isPayAtHome ? 'Order confirmed' : 'Payment successful';
        toast.error(`${successMsg}, but ${err.message || 'failed to send confirmation email'}.`);
      }
    } else {
      const successMsg = isPayAtHome ? 'Order confirmed (Offline Mode)' : 'Payment successful (Offline Mode)';
      toast.success(successMsg);
    }
  };

  const addWOItem = () => {
    if (!woItemName) return;
    const newItem: ShippingItem = {
      id: crypto.randomUUID(),
      name: woItemName,
      weight: woItemWeight,
      status: 'Pending',
      source: 'Pickup'
    };
    setWoItems([...woItems, newItem]);
    setWoItemName('');
    setWoItemWeight(1);
  };

  const handleWOComplete = () => {
    if (!activeWorkOrder) return;
    const newOrderId = 'BB-WO-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setWoOrderId(newOrderId);
    setIsWOPaid(true);
    
    const totalW = woItems.reduce((s, i) => s + i.weight, 0);
    const totalC = totalW * (SHIPPING_RATES[woAddress.country] || 800);

    const newOrder: Order = {
      id: newOrderId,
      customerId: activeWorkOrder.customerId,
      items: woItems,
      totalWeight: totalW,
      totalCost: totalC,
      status: 'Received at Warehouse',
      createdAt: new Date().toISOString(),
      shippingDate: woShippingDate,
      destination: woAddress,
      paymentStatus: 'Paid'
    };

    setOrders([...orders, newOrder]);
    
    // Add items to the main items list as well, marked as received
    const itemsWithStatus = woItems.map(item => ({
      ...item,
      status: 'Received at Warehouse' as ShippingStatus,
      source: 'Pickup' as const,
      submitted: true
    }));
    setItems(prev => [...prev, ...itemsWithStatus]);

    setAppointments(prev => prev.map(apt => 
      apt.id === activeWorkOrder.id 
        ? { ...apt, status: 'Completed', orderId: newOrderId, paymentStatus: 'Paid' } 
        : apt
    ));

    // Automatically send invoice email for Work Order
    if (dbStatus.connected) {
      const recipientEmail = woAddress.email || currentUser?.email || '';
      api.shareInvoice(newOrder)
        .then(() => toast.success(`Payment successful! Invoice sent to ${recipientEmail}`))
        .catch(err => {
          console.error('Failed to send invoice:', err.message);
          toast.error(`Payment successful, but ${err.message || 'failed to send invoice email'}.`);
        });
    } else {
      toast.success('Payment successful!');
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      setLoginTriggerSource('checkout');
      setShowLoginModal(true);
      return;
    }

    const hasScheduledPickup = appointments.some(a => a.status === 'Scheduled');
    const cartItems = items.filter(i => i.source !== 'Warehouse' || i.submitted);

    if (hasScheduledPickup && cartItems.length > 0) {
      const newOrderId = 'BB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setOrderId(newOrderId);
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
    const newOrderId = 'BB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setOrderId(newOrderId);
    navigateTo('finalize');
  };

  // --- Components ---

    const TrackSection = useMemo(() => {
      return (
        <div className="max-w-3xl mx-auto py-12 px-4 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Track Your Shipment</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Enter your tracking ID to see the real-time status of your global delivery.</p>
          </div>
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-50">
            <StaticShipmentTracker />
          </div>
        </div>
      );
    }, []);

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
                          ₹{(qWeight * SHIPPING_RATES[qCountry] * (qMethod === 'Standard' ? 0.7 : 1.0)).toFixed(2)}
                        </div>
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
                onClick={() => simulateNotification('Out for delivery', 'Your shipment BB-X7291 is out for delivery today!')}
                className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Simulate Out for Delivery
              </button>
              <button 
                onClick={() => simulateNotification('Delivered', 'Success! Your shipment BB-X7291 has been delivered.')}
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
        <StaticShipmentTracker />
        <h2 className="text-3xl font-black text-slate-900">My Orders & History</h2>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Truck className="text-indigo-600" /> Active Shipments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <button 
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="text-left group-hover:text-indigo-600 transition-colors"
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Order ID</div>
                      <div className="text-lg font-black">{order.id}</div>
                    </button>
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {order.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Destination</div>
                      <div className="text-sm font-bold">{order.destination?.country || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Weight</div>
                      <div className="text-sm font-bold">{order.totalWeight || order.total_weight || 0} kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Paid</div>
                      <div className="text-sm font-bold">₹{order.totalCost || order.total_cost || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                      <Clock size={12} className="text-indigo-600" />
                      <span className="text-[10px] text-slate-600">{new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button 
                          onClick={() => cancelPickup(order.id)}
                          className="px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Cancel
                        </button>
                      )}
                      {order.status === 'Received at Warehouse' && (
                        <button 
                          onClick={() => simulateNotification('Shipment dispatched', `Your shipment ${order.id} has been dispatched to ${order.destination.country}.`)}
                          className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded hover:bg-indigo-700 transition-colors"
                        >
                          Dispatch
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrderForInvoice(order)}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
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

                <div className="border-t border-slate-100 pt-6 mb-8">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Item Details</h4>
                  <div className="space-y-3">
                    {selectedOrderForInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={20} />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-500">{item.source} • {item.weight}kg</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {item.price ? `₹${item.price}` : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Weight</span>
                    <span className="font-bold">{selectedOrderForInvoice.totalWeight} kg</span>
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
                </div>

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
      </div>
    );
  }, [orders, appointments, currentUser, setActiveTab, selectedOrderForInvoice]);


  const WorkOrderSection = useMemo(() => {
    if (!currentUser) return null;
    if (!activeWorkOrder) return null;

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
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900">Invoice Summary</h3>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Order ID: {woOrderId}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400" title="Print Invoice">
                  <Printer size={20} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400" title="Share Invoice">
                  <Share size={20} />
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
                        <span className="text-slate-600 font-medium">{item.name}</span>
                        <span className="text-slate-400">{item.weight} kg</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-slate-200 my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">Total Weight</span>
                    <span className="text-sm font-black text-slate-900">{woItems.reduce((s, i) => s + i.weight, 0).toFixed(1)} kg</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Total Amount Paid</span>
                    <span className="text-2xl font-black text-indigo-400">₹{(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 10)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => { setActiveWorkOrder(null); navigateTo('agent'); }}
                className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Back to Portal
              </button>
              <button 
                onClick={() => {
                  const totalW = woItems.reduce((s, i) => s + i.weight, 0);
                  const totalC = totalW * (SHIPPING_RATES[woAddress.country] || 10);
                  const message = `*JiffEX Work Order Invoice*\n\nOrder ID: ${woOrderId}\nCustomer: ${woAddress.fullName}\nTotal Amount: ₹${totalC.toFixed(2)}\nDestination: ${woAddress.country}\nStatus: Processed & Paid\n\nThank you for choosing JiffEX!`;
                  sendWhatsApp(woAddress.phone, message);
                }}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
              >
                <MessageCircle size={20} /> WhatsApp Invoice
              </button>
              <button 
                onClick={() => {
                  const summary = `JiffEX Invoice\nOrder ID: ${woOrderId}\nDestination: ${woAddress.fullName}, ${woAddress.country}\nTotal: ₹${(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 10)).toFixed(2)}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'JiffEX Invoice',
                      text: summary,
                    }).catch(console.error);
                  } else {
                    toast.success('Invoice Summary copied to clipboard!');
                  }
                }}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                Share Summary <Share size={20} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setActiveWorkOrder(null)}
                className="text-slate-400 hover:text-slate-900 flex items-center gap-1 text-sm font-bold"
              >
                <ChevronRight size={16} className="rotate-180" /> Back
              </button>
              <div className="text-right">
                <h2 className="text-2xl font-black text-slate-900">Work Order: {activeWorkOrder.id}</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Pickup from home Processing</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Customer Phone</label>
                <div className="font-bold text-slate-900">{activeWorkOrder.phone}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pickup Address</label>
                <div className="text-sm text-slate-600 leading-tight">{activeWorkOrder.address}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Package className="text-indigo-600" size={20} /> Collected Items
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Item Name"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={woItemName}
                    onChange={(e) => setWoItemName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Weight (kg)"
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={woItemWeight}
                      onChange={(e) => setWoItemWeight(Number(e.target.value))}
                    />
                    <button 
                      onClick={addWOItem}
                      className="px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-all">
                  <ImageIcon size={32} />
                  <span className="text-xs mt-2">Upload Picture</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {woItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{item.weight} kg</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setWoItems(woItems.filter(i => i.id !== item.id))}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <MapPin className="text-red-500" /> Destination Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={woAddress.fullName}
                  onChange={e => setWoAddress({...woAddress, fullName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={woAddress.email}
                    onChange={e => setWoAddress({...woAddress, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={woAddress.phone}
                    onChange={e => setWoAddress({...woAddress, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address Line 1</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={woAddress.addressLine1}
                  onChange={e => setWoAddress({...woAddress, addressLine1: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">City</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={woAddress.city}
                    onChange={e => setWoAddress({...woAddress, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Zip Code</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={woAddress.zipCode}
                    onChange={e => setWoAddress({...woAddress, zipCode: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Country</label>
                <select 
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={woAddress.country}
                  onChange={e => setWoAddress({...woAddress, country: e.target.value})}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-indigo-600" /> Select Shipping Date
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {SHIPPING_DATES.map(date => (
                <button 
                  key={date}
                  onClick={() => setWoShippingDate(date)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${woShippingDate === date ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                >
                  <div className="text-[10px] font-bold uppercase opacity-60 mb-1">March</div>
                  <div className="text-lg font-black">{date.split('-')[2]}</div>
                </button>
              ))}
            </div>

            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CreditCard className="text-emerald-600" /> Payment Method
            </h3>
            <div className="space-y-3 mb-6">
              <div 
                onClick={() => setWoPaymentMethod('phonepe')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${woPaymentMethod === 'phonepe' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">Pe</div>
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
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${woPaymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
              >
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white"><CreditCard size={18} /></div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Credit / Debit Card</div>
                  <div className="text-[10px] text-slate-500">Visa, Mastercard</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${woPaymentMethod === 'card' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                  {woPaymentMethod === 'card' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Total Weight</span>
                <span className="text-white font-bold">{woItems.reduce((s, i) => s + i.weight, 0).toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Shipping Rate</span>
                <span className="text-white font-bold">₹{SHIPPING_RATES[woAddress.country] || 10}/kg</span>
              </div>
              <div className="h-px bg-slate-800 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-xl font-black text-indigo-400">₹{(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 10)).toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleWOComplete}
              disabled={woItems.length === 0 || !woAddress.email || !woAddress.fullName}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
            >
              Collect Payment & Complete
            </button>
          </div>
        </div>
      </div>
    );
  }, [activeWorkOrder, woItems, woItemName, woItemWeight, isWOPaid, woOrderId, woPaymentMethod, woShippingDate, orders, appointments, setActiveWorkOrder, setOrders, setAppointments, woAddress, address, currentUser]);

  const AgentSection = useMemo(() => {
    if (!currentUser) return null;
    const assignedApts = appointments.filter(a => a.status === 'Scheduled' && a.assignedAgentId);

    if (activeWorkOrder) {
      return WorkOrderSection;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Agent Portal</h2>
            <p className="text-slate-500">Manage and process assigned pickups.</p>
          </div>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold">
            {assignedApts.length} Assigned Tasks
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedApts.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100">
              <CheckCircle2 size={64} className="mx-auto mb-4 text-emerald-500 opacity-20" />
              <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
              <p className="text-slate-500">No pending pickups assigned to you.</p>
            </div>
          ) : (
            assignedApts.map(apt => (
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
                </div>

                <button 
                  onClick={() => setActiveWorkOrder(apt)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  Process Pickup <ArrowRight size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }, [appointments, activeWorkOrder, setActiveWorkOrder, WorkOrderSection, currentUser]);
  const renderWarehouseManagementSection = () => {
    const warehouseItems = items.filter(i => i.source === 'Warehouse' || i.source === 'Pickup');
    const pendingItems = warehouseItems.filter(i => i.status !== 'Received at Warehouse');
    const receivedItems = warehouseItems.filter(i => i.status === 'Received at Warehouse');
    
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
                                <div className="text-[10px] text-slate-500 font-medium">ID: {item.id.slice(0, 8)}</div>
                              </div>
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
                            <div className="text-sm font-bold text-slate-700">{item.weight > 0 ? `${item.weight} kg` : 'TBD'}</div>
                          </td>
                          <td className="px-8 py-5">
                            <button 
                              onClick={() => updateItemStatus(item.id, 'Received at Warehouse')}
                              className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                            >
                              Receive
                            </button>
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
        remarks: cartItemRemarks
      }, mode || cartItemSource);
      setCartItemName('');
      setCartItemWeight('');
      setCartItemQuantity(1);
      setCartItemFragile(false);
      setCartItemInvoiceNumber('');
      setNavbarTrackingId('');
      setCartItemRemarks('');
      
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

    const hasActivePickup = appointments.some(a => a.status === 'Scheduled');
    const hasCompletedPickup = appointments.some(a => a.status === 'Completed');

    const isCartEmpty = mode === 'Warehouse' 
      ? items.filter(i => i.source === 'Warehouse' && !i.submitted).length === 0
      : mode === 'Pickup'
        ? items.filter(i => i.source === 'Pickup').length === 0 && appointments.length === 0
        : items.filter(i => i.source !== 'Warehouse' || i.submitted).length === 0 && appointments.length === 0;

    const displayItems = mode 
      ? (mode === 'Warehouse' 
          ? items.filter(i => i.source === 'Warehouse' && !i.submitted)
          : items.filter(i => i.source === mode))
      : items.filter(i => i.source !== 'Warehouse' || i.submitted);

    const displayWeight = displayItems.reduce((sum, item) => sum + (item.weight || 0), 0);
    const hasTBDWeight = displayItems.some(i => i.weight === 0);

    return (
      <div className="space-y-6">
        {activeTab === 'warehouse' ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 bg-white rounded-[3rem] border border-slate-100 p-12 shadow-sm">
             <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
               <Package size={48} className="animate-pulse" />
             </div>
             <div className="max-w-md space-y-4">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Warehouse Redesign in Progress</h2>
               <p className="text-slate-500 font-medium leading-relaxed">
                 We are creating a more intuitive experience for sending your items to our facility. 
                 Please provide the step-by-step points for the new design.
               </p>
             </div>
             <div className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest">
               <Zap size={16} className="text-yellow-400" /> Awaiting Instructions
             </div>
          </div>
        ) : (
          <>
            {!mode && hasActivePickup && (
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
                    Your pickup is confirmed for <span className="text-indigo-600 font-bold">{appointments.find(a => a.status === 'Scheduled')?.date}</span> at <span className="text-indigo-600 font-bold">{appointments.find(a => a.status === 'Scheduled')?.time}</span>. 
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
                ) : (
                <div className="space-y-4">
                  {/* Header Section with Progress for Pickup */}
                  {mode === 'Pickup' && (
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
                            {activePickupStep === 5 ? 'Booking Confirmed' : hasActivePickup ? 'Add items to your scheduled pickup' : 'Schedule an agent to collect from your home'}
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
                                    {appointments.find(a => a.status === 'Scheduled')?.date} at {appointments.find(a => a.status === 'Scheduled')?.time}
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
                                    {appointments.find(a => a.status === 'Scheduled')?.address.street}
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
                              {displayItems.length} Items
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
                                    <h5 className="text-sm font-black text-deep-blue uppercase tracking-wider">How much to pick up?</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {[
                                        { id: 'Fits in a car', desc: 'Luggage / boxes, small items', icon: <Car size={24} />, badge: 'Most customers choose this' },
                                        { id: 'Need a Van', desc: 'Furniture, large boxes, bulk shipments', icon: <Truck size={24} /> }
                                      ].map(v => (
                                        <motion.button
                                          key={v.id}
                                          whileHover={{ scale: 1.02, x: 4 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => setPickupVehicleType(v.id)}
                                          className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-5 text-left relative overflow-hidden ${
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
                                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10 transition-transform duration-200 ${pickupVehicleType === v.id ? 'bg-jiffex-orange text-white shadow-lg shadow-jiffex-orange/20 scale-110' : 'bg-white text-slate-400'}`}>
                                            {v.icon}
                                          </div>
                                          <div className="relative z-10 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="text-base font-black text-slate-900">{v.id}</p>
                                              {v.badge && (
                                                <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                  {v.badge}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{v.desc}</p>
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
                              <h4 className="text-xl font-black text-deep-blue">Pickup details</h4>
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                      <input 
                                        type="text" 
                                        className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium"
                                        placeholder="Enter your name"
                                        value={pickupName}
                                        onChange={(e) => setPickupName(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+91</span>
                                      <input 
                                        type="tel" 
                                        className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium"
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
                                      className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium"
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
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium"
                                    placeholder="House No, Building, Street Name"
                                    value={pickupAddress.street}
                                    onChange={(e) => setPickupAddress({...pickupAddress, street: e.target.value})}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                                    <input 
                                      type="text" 
                                      className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium"
                                      placeholder="City"
                                      value={pickupAddress.city}
                                      onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">PIN code</label>
                                    <input 
                                      type="text" 
                                      className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium"
                                      placeholder="PIN Code"
                                      value={pickupAddress.zip}
                                      onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Special Instructions</label>
                                  <textarea 
                                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-jiffex-orange outline-none bg-slate-50 focus:bg-white transition-all font-medium min-h-[100px]"
                                    placeholder="Any specific instructions for our agent?"
                                    value={pickupSpecialInstructions}
                                    onChange={(e) => setPickupSpecialInstructions(e.target.value)}
                                  />
                                </div>

                                <div className="flex gap-4">
                                  <button 
                                    onClick={() => {
                                      setActivePickupStep(2);
                                    }}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-deep-blue rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                  >
                                    <ArrowLeft size={18} /> Back
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (!pickupName || !pickupPhone || !pickupAddress.street || !pickupAddress.city || !pickupAddress.zip) {
                                        toast.error('Please fill in all required fields');
                                        return;
                                      }
                                      if (pickupPhone.length !== 10) {
                                        toast.error('Phone number must be 10 digits');
                                        return;
                                      }
                                      setActivePickupStep(4);
                                    }}
                                    className="flex-[2] py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                  >
                                    Continue to Review <ArrowRight size={18} />
                                  </button>
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
                                    <div className="col-span-2">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                                      <p className="font-bold text-slate-900">{pickupAddress.street}, {pickupAddress.city}, {pickupAddress.zip}</p>
                                    </div>
                                    {pickupSpecialInstructions && (
                                      <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instructions</p>
                                        <p className="font-bold text-slate-900">{pickupSpecialInstructions}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

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
                                    {currentUser ? 'Confirm Booking' : 'Guest Checkout (OTP-based)'}
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
                        className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-indigo-500/5 text-center space-y-10"
                      >
                        <div className="space-y-6">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ 
                              scale: [1, 1.1, 1],
                              transition: { 
                                scale: {
                                  repeat: Infinity,
                                  duration: 2,
                                  ease: "easeInOut"
                                }
                              }
                            }}
                            className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20"
                          >
                            <CheckCircle2 size={48} />
                          </motion.div>
                          
                          <div className="space-y-3">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                              Thanks, {appointments.find(a => a.id === lastBookingRef)?.customerName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'there'}! Your pickup is confirmed.
                            </h2>
                            <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed font-medium">
                              Our agent will arrive at your selected time to collect your items. You can still <button onClick={() => navigateTo('store')} className="text-indigo-600 font-bold hover:underline">add products from our shop</button> before shipping.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 inline-block relative group">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Booking ref</p>
                              <div className="flex items-center justify-center gap-3">
                                <p className="text-3xl font-black text-deep-blue tracking-wider">
                                  {lastBookingRef || appointments.find(a => a.status === 'Scheduled')?.id}
                                </p>
                                <button 
                                  onClick={() => {
                                    const ref = lastBookingRef || appointments.find(a => a.status === 'Scheduled')?.id;
                                    if (ref) {
                                      navigator.clipboard.writeText(ref);
                                      toast.success('Booking reference copied!');
                                    }
                                  }}
                                  className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                  title="Copy Reference"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                              <button 
                                onClick={() => {
                                  const ref = lastBookingRef || appointments.find(a => a.status === 'Scheduled')?.id;
                                  if (ref) {
                                    setNavbarTrackingId(ref);
                                    navigateTo('track');
                                  }
                                }}
                                className="flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors"
                              >
                                <Share size={14} /> Track this booking
                              </button>
                              
                              <button 
                                onClick={() => {
                                  const ref = lastBookingRef || appointments.find(a => a.status === 'Scheduled')?.id;
                                  if (ref) {
                                    const message = `*JiffEX Pickup Confirmation*\n\nBooking Reference: ${ref}\nDestination: India\nStatus: Confirmed\n\nTrack your shipment at: ${window.location.origin}?tab=track&id=${ref}\n\nThank you for choosing JiffEX!`;
                                    sendWhatsApp(pickupPhone, message);
                                  }
                                }}
                                className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors mt-1"
                              >
                                <MessageCircle size={14} /> Send Confirmation via WhatsApp
                              </button>

                            </div>
                          </div>

                          <div className="flex flex-wrap justify-center gap-3 pt-2">
                            {[
                              { icon: Check, text: "No payment required yet", color: "text-emerald-600", bg: "bg-emerald-50" },
                              { icon: ShieldCheck, text: "Secure handling & packaging", color: "text-indigo-600", bg: "bg-indigo-50" },
                              { icon: Users, text: "Trusted by 1000+ customers", color: "text-amber-600", bg: "bg-amber-50" }
                            ].map((badge, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className={`flex items-center gap-2 px-4 py-2 ${badge.bg} rounded-full border border-white shadow-sm`}
                              >
                                <badge.icon size={14} className={badge.color} />
                                <span className="text-[11px] font-bold text-slate-700">{badge.text}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Next Steps & Documents Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-t border-slate-100 pt-10">
                          {/* Next Steps */}
                          <div className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-deep-blue">
                                <Clock size={20} className="text-indigo-600" />
                              </div>
                              <h4 className="text-xl font-black text-deep-blue">What to Expect</h4>
                            </div>
                            
                            <div className="relative pl-8 space-y-8">
                              {/* Timeline Line */}
                              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                              
                              {[
                                { time: "Today", title: "Agent Call", desc: "Agent will call 30 mins before arrival", active: true },
                                { time: "Today", title: "Pickup & Weighing", desc: "Agent collects items and gives final quote", active: true },
                                { time: "Next 1-2 days", title: "Warehouse Processing", desc: "Items received and prepared for shipping", active: false },
                                { time: "Then", title: "Payment & Dispatch", desc: "Pay securely to release for global delivery", active: false }
                              ].map((step, i) => (
                                <div key={i} className="relative group">
                                  {/* Dot */}
                                  <div className={`absolute -left-[26px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                                    step.active ? 'bg-indigo-600 border-indigo-200 scale-110' : 'bg-white border-slate-200'
                                  }`} />
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {step.time}
                                      </span>
                                      {step.active && (
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                      )}
                                    </div>
                                    <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{step.title}</p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Documents Required */}
                          <div className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-jiffex-orange">
                                <FileText size={20} />
                              </div>
                              <h4 className="text-xl font-black text-deep-blue">Documents Required</h4>
                            </div>
                            <p className="text-xs text-slate-500 font-medium -mt-4 ml-[52px]">Keep these ready for a smooth pickup</p>
                            <div className="space-y-4">
                              {[
                                { title: "ID Proof", desc: "Aadhar Card or Passport copy for verification." },
                                { title: "Item List", desc: "Simple list of items for customs declaration." },
                                { title: "Invoices", desc: "Purchase bills for any new items." }
                              ].map((doc, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-jiffex-orange/30 transition-all">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-jiffex-orange shadow-sm shrink-0">
                                    <ShieldCheck size={16} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900">{doc.title}</p>
                                    <p className="text-xs text-slate-500 font-medium">{doc.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-10 border-t border-slate-100 space-y-6">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Need help? Contact support</p>
                            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                              <button className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 hover:border-indigo-100 group">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  <MessageSquare size={16} className="text-indigo-600" />
                                </div>
                                <span className="text-sm font-black tracking-tight">Live Chat</span>
                              </button>
                              
                              <button className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 hover:border-indigo-100 group">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  <Phone size={16} className="text-indigo-600" />
                                </div>
                                <span className="text-sm font-black tracking-tight">Call Us</span>
                              </button>

                              <button className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100 group">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  <MessageSquare size={16} className="text-emerald-600" />
                                </div>
                                <span className="text-sm font-black tracking-tight">WhatsApp</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 pt-6">
                          <button 
                            onClick={() => {
                              navigateTo('history');
                              setActivePickupStep(1);
                              setLastBookingRef(null);
                              setIsSchedulingNewPickup(false);
                              window.scrollTo(0, 0);
                            }}
                            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                          >
                            <Package size={20} /> View My Orders
                          </button>
                          <button 
                            onClick={() => {
                              navigateTo('home');
                              setActivePickupStep(1);
                              setLastBookingRef(null);
                              setIsSchedulingNewPickup(false);
                              window.scrollTo(0, 0);
                            }}
                            className="px-12 py-4 bg-deep-blue text-white rounded-2xl font-black hover:bg-slate-900 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                          >
                            <ArrowLeft size={20} /> Back to Home
                          </button>
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

        {/* Item List Card - Visible in all tabs, but specific parts are conditional */}
        {!((mode === 'Pickup') && (isCartEmpty || activePickupStep === 5)) && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
            {!mode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Your Shipment Items</h3>
                <p className="text-sm text-slate-500">Manage items collected or received at our warehouse.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-indigo-50 rounded-2xl text-xs font-bold text-indigo-600 border border-indigo-100">
                  {displayItems.length} Items
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
                  {(mode === 'Pickup') && appointments.length > 0 && activePickupStep !== 5 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Truck size={18} className="text-indigo-600" /> Scheduled Pickups
                      </h4>
                      {appointments.map((apt, idx) => (
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
                    if (mode === 'Pickup' && source === 'Pickup' && hasActivePickup) {
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
                        <div className="space-y-3">
                          {sourceItems.map(item => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={item.id} 
                              className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group items-center"
                            >
                              <div className={item.source === 'Store' ? "md:col-span-3" : "md:col-span-2"}>
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

                              <div className="md:col-span-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</div>
                                <div className="text-xs font-bold text-indigo-600">
                                  {item.weight > 0 ? (
                                    <div className="flex flex-col">
                                      <span>{(item.weight / (item.quantity || 1)).toFixed(2)} kg</span>
                                      {(item.quantity || 1) > 1 && (
                                        <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                                          Total: {item.weight.toFixed(2)} kg
                                        </span>
                                      )}
                                    </div>
                                  ) : 'TBD'}
                                </div>
                              </div>

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

                              {item.source !== 'Store' && (
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

                  {/* Add More Items section removed as per user request */}
                </div>
              )}
              
              {/* Action Buttons - Only show in My Cart tab (!mode) */}
              {!mode && (displayItems.length > 0 || appointments.length > 0) && !hasCompletedPickup && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col gap-6">
                  {appointments.some(a => a.status === 'Scheduled') && (
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <Home size={20} />
                      </div>
                      <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                        Since you have opted for Home Pickup, you can add items from our store and pay for them along with your shipping charges. <span className="font-black">Final billing will be done at your home during pickup.</span>
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleCheckout}
                      className={`flex-1 py-5 px-8 rounded-2xl font-bold transition-all shadow-2xl flex items-center justify-center gap-2 group ${
                        appointments.some(a => a.status === 'Scheduled') && displayItems.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                      }`}
                    >
                      {appointments.some(a => a.status === 'Scheduled') 
                        ? (displayItems.length > 0 ? 'Confirm Order' : 'Checkout')
                        : (currentUser ? 'Checkout' : 'Sign in to Checkout')} 
                      <ArrowRight size={20} className={appointments.some(a => a.status === 'Scheduled') && displayItems.length === 0 ? '' : 'group-hover:translate-x-1 transition-transform'} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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

    const hasActivePickup = appointments.some(a => a.status === 'Scheduled');

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
  }, [selectedCategory, searchQuery, sortBy, minPrice, maxPrice, showFilters, addItem, removeStoreItem, handleCheckout, items, storeProducts, currentUser, showJiffySuggestion, setActiveTab, appointments]);

  const FinalizeSection = useMemo(() => {
    if (!currentUser) return null;
    const cartItems = items.filter(i => i.source !== 'Warehouse' || i.submitted);
    if (isPaid) {
      const hasScheduledPickup = appointments.some(a => a.status === 'Scheduled');
      const isPayAtHome = hasScheduledPickup && shippingPreference === 'International';
      
      return (
        <div className="max-w-2xl mx-auto text-center space-y-8 pb-12">
          <CheckoutProgressTracker />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 size={64} />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900">
              {isPayAtHome ? 'Order Confirmed!' : 'Payment Successful!'}
            </h2>
            <p className="text-slate-500">Your order <span className="font-bold text-indigo-600">{orderId}</span> has been placed successfully.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Estimated Delivery</span>
              <span className="font-black text-slate-900">12-15 Business Days</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              {isPayAtHome 
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
              View Order History
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CheckoutProgressTracker />
          
          {/* Shipping Preference Selection */}
          {appointments.some(a => a.status === 'Scheduled') && cartItems.length > 0 && (
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
          {orderId && (
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
          {(!appointments.some(a => a.status === 'Scheduled') || shippingPreference === 'LocalPickup') ? (
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
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-6 rounded-3xl sticky top-8">
            <h3 className="text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Total Weight</span>
                <span className="text-white font-medium">{totalWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Shipping ({address.country})</span>
                <span className="text-white font-medium">₹{(totalWeight * (SHIPPING_RATES[address.country] || 10)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Items Cost</span>
                <span className="text-white font-medium">₹{cartItems.reduce((sum, i) => sum + (i.price || 0), 0).toFixed(2)}</span>
              </div>
              {appointments.some(a => a.status === 'Scheduled') && (
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Shop Item Delivery</span>
                  <span className="text-emerald-400 font-medium">{shippingPreference === 'LocalPickup' ? 'During Home Pickup' : 'To my Home'}</span>
                </div>
              )}
              <div className="h-px bg-slate-800 my-4" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-indigo-400">₹{totalCost.toFixed(2)}</span>
              </div>
            </div>

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
              {(appointments.some(a => a.status === 'Scheduled') && shippingPreference === 'International') ? 'Confirm Order (Pay at Home)' : 'Confirm & Pay'}
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
  }, [isPaid, orderId, address, selectedDate, paymentMethod, items, totalWeight, totalCost, dbStatus.connected, currentUser?.id, handleFinalPayment, shippingPreference, appointments, pickupAddress, pickupName, pickupPhone]);

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
    setAppointments([]);
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
    setPickupName('');
    setPickupPhone('');
    setPickupLanguage('English');
    setPickupItemType('Everyday Items');
    setPickupVehicleType('Fits in a car');
    setPickupSpecialInstructions('');
    setPickupCategory('Personal Effects');
    setPickupEstimatedWeight('1-5 kg');
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 safe-top safe-bottom">
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
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer shrink-0 mr-10" 
              onClick={() => {
                if (currentUser?.role === 'Admin') navigateTo('admin');
                else if (currentUser?.role === 'Agent') navigateTo('agent');
                else navigateTo('home');
              }}
            >
              <Logo height="h-12 sm:h-14" />
            </div>
            
            <div className="flex-1 flex items-center justify-between gap-10 lg:gap-14">
              <div className="hidden md:flex items-center gap-6">
                <button 
                  onClick={() => navigateTo('store')}
                  className={`text-sm lg:text-base font-bold transition-all ${activeTab === 'store' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Shop
                </button>

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

                <div className="hidden xl:flex items-center gap-2 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-none">
                  <input 
                    type="text" 
                    placeholder="Enter Tracking ID" 
                    value={navbarTrackingId}
                    onChange={(e) => setNavbarTrackingId(e.target.value)}
                    autoComplete="new-password"
                    className="bg-transparent border-none focus:ring-0 text-sm w-24 lg:w-32 placeholder:text-slate-400 font-medium"
                  />
                  <button 
                    onClick={() => {
                      if (navbarTrackingId.trim()) {
                        toast.success(`Tracking shipment: ${navbarTrackingId}`);
                        navigateTo('track');
                        setNavbarTrackingId('');
                      }
                    }}
                    className="bg-deep-blue text-white shadow-none py-1 px-3 text-xs rounded-lg font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Track
                  </button>
                </div>

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
                    onClick={() => navigateTo('agent')}
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

                {currentUser?.role !== 'customer_service' && (
                  <button 
                    onClick={() => navigateTo('support')}
                    className={`text-sm lg:text-base font-medium transition-all ${activeTab === 'support' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Support
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 lg:gap-6">
                <button 
                  onClick={handleQuickQuoteClick}
                  className="text-sm lg:text-base font-bold text-indigo-600 hover:text-indigo-700 transition-all"
                >
                  Quick Quote
                </button>
                {/* Cart Icon Only */}
                <button 
                  onClick={() => navigateTo('cart')}
                  className={`relative p-2 sm:p-3 rounded-2xl transition-all ${activeTab === 'cart' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black border-2 border-white">
                      {cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}
                    </span>
                  )}
                </button>

                {currentUser ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowUserDropdown(true)}
                    onMouseLeave={() => setShowUserDropdown(false)}
                  >
                    <button 
                      className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all border-2 ${
                        showUserDropdown ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start leading-none">
                        {currentUser.role.toLowerCase() !== 'customer' && (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{currentUser.role}</span>
                        )}
                        <span className="text-sm font-black text-slate-900">{currentUser.name}</span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
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
                          
                          <button 
                            onClick={() => { navigateTo('history'); setShowUserDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <History size={18} /> My Orders
                          </button>
                          
                          <button 
                            onClick={() => { /* Account page doesn't exist yet, but we'll show a toast */ toast.info("Account settings coming soon!"); setShowUserDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <UserIcon size={18} /> My Account
                          </button>

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
                  <button 
                    onClick={() => { navigateTo('store'); setIsMobileMenuOpen(false); }}
                    className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'store' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Shop
                  </button>
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
                  <button 
                    onClick={() => { navigateTo('support'); setIsMobileMenuOpen(false); }}
                    className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'support' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {currentUser?.role === 'customer_service' ? 'Support Desk' : 'Support'}
                  </button>

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
                      onClick={() => { navigateTo('agent'); setIsMobileMenuOpen(false); }}
                      className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'agent' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Work Portal
                    </button>
                  )}
                  <button 
                    onClick={handleQuickQuoteClick}
                    className="text-lg font-bold p-3 rounded-xl text-left text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    Quick Quote
                  </button>
                  
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
                        <button 
                          onClick={() => { navigateTo('history'); setIsMobileMenuOpen(false); }}
                          className={`text-lg font-bold p-3 rounded-xl text-left transition-all flex items-center gap-3 ${activeTab === 'history' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <History size={20} /> My Orders
                        </button>
                        <button 
                          onClick={() => { toast.info("Account settings coming soon!"); setIsMobileMenuOpen(false); }}
                          className="text-lg font-bold p-3 rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3"
                        >
                          <UserIcon size={20} /> My Account
                        </button>
                        <button 
                          onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                          className="w-full p-3 rounded-xl text-left font-bold text-red-600 bg-red-50 flex items-center gap-2 mt-2"
                        >
                          <LogOut size={20} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <input 
                        type="text" 
                        placeholder="Enter Tracking ID" 
                        value={navbarTrackingId}
                        onChange={(e) => setNavbarTrackingId(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm flex-1 placeholder:text-slate-400 font-medium"
                      />
                      <button 
                        onClick={() => {
                          if (navbarTrackingId.trim()) {
                            toast.success(`Tracking shipment: ${navbarTrackingId}`);
                            navigateTo('track');
                            setNavbarTrackingId('');
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        className="bg-deep-blue text-white py-1.5 px-4 text-xs rounded-lg font-bold hover:bg-slate-800 transition-all active:scale-95"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* Main Content */}
      <main className={`relative max-w-7xl mx-auto px-4 pb-20 ${activeTab === 'pickup' ? 'pt-0' : (activeTab === 'warehouse' ? 'pt-0' : (activeTab === 'store' ? 'pt-8' : (activeTab === 'cart' ? 'pt-8' : (activeTab === 'history' ? 'pt-6' : (activeTab === 'finalize' ? 'pt-8' : (activeTab === 'admin' ? 'pt-4' : (activeTab === 'support' ? 'pt-4' : (activeTab === 'pickup' || activeTab === 'warehouse' ? 'pt-0' : (currentUser?.role === 'agent' ? 'pt-4' : 'pt-20')))))))))}`}>
        <AnimatePresence>
          {activeTab !== 'home' && activeTab !== 'pickup' && activeTab !== 'warehouse' && activeTab !== 'store' && activeTab !== 'finalize' && <BackButton onClick={goBack} />}
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
            {activeTab === 'track' && TrackSection}
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
                setAppointments={setAppointments}
                agents={agents}
                setAgents={setAgents}
                categories={categories}
                setCategories={setCategories}
                adminTab={adminTab as 'Overview' | 'Agents' | 'Inventory' | 'Reports' | 'Settings'}
                setAdminTab={setAdminTab as React.Dispatch<React.SetStateAction<'Overview' | 'Agents' | 'Inventory' | 'Reports' | 'Settings'>>}
                storeProducts={storeProducts}
                setStoreProducts={setStoreProducts}
                setOrders={setOrders}
                refundRequests={refundRequests}
                setRefundRequests={setRefundRequests}
                isWebmaster={currentUser?.role === 'webmaster'}
              />
            )}
            {activeTab === 'agent' && AgentSection}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-24 px-4 relative z-40">
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
          
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Account</h4>
            <ul className="space-y-4">
              <li><button onClick={() => { setLoginTriggerSource('default'); setShowLoginModal(true); }} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Sign In</button></li>
              <li><button onClick={() => navigateTo('history')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">My Shipments</button></li>
              <li><button onClick={() => navigateTo('history')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Order History</button></li>
              <li><button onClick={() => navigateTo('notifications')} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">Notifications</button></li>
            </ul>
          </div>

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

      {/* Disclaimer Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white py-3 px-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <p className="text-xs text-slate-300">
              <span className="font-bold text-white">Disclaimer:</span> Items like knives, chemicals, and explosives are prohibited. Unshipped items will be returned to the sender.
            </p>
          </div>
          <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4">
            Full Policy Details
          </button>
        </div>
      </div>

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
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mx-auto mb-4">
                    <Logo height="h-16" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {loginTriggerSource === 'checkout' ? 'Almost There!' : loginTriggerSource === 'pickup' ? 'One Last Step!' : 'Welcome to Jiffex'}
                  </h2>
                  <p className="text-slate-500 mt-2">
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
                  const isAgent = email === 'agent@jiffex.com';
                  if (isAdmin) navigateTo('admin');
                  else if (isAgent) navigateTo('agent');
                  else if (loginTriggerSource === 'pickup') navigateTo('pickup');
                  else if (loginTriggerSource === 'checkout') navigateTo('finalize');
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
      <Toaster position="top-center" richColors />
    </div>
  );
}
