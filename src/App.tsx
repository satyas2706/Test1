/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Store, 
  Calculator, 
  Calendar, 
  MapPin, 
  CreditCard, 
  AlertTriangle, 
  Plus, 
  PlusCircle,
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Share,
  Printer,
  Copy,
  Image as ImageIcon,
  User as UserIcon,
  ShoppingBag,
  Info,
  LayoutDashboard,
  History,
  Users,
  BarChart3,
  Search,
  ArrowRight,
  LogOut,
  Database,
  Loader2,
  Check,
  Phone,
  Edit3,
  Upload,
  X,
  XCircle,
  Bell,
  Heart,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShippingItem, 
  ShippingStatus, 
  StoreProduct, 
  DestinationAddress,
  Appointment,
  User,
  UserRole,
  Order,
  AgentProfile
} from './types';
import { 
  SHIPPING_RATES, 
  COUNTRIES, 
  STORE_PRODUCTS, 
  PROHIBITED_ITEMS, 
  SHIPPING_DATES,
  PICKUP_SLOTS,
  WAREHOUSE_ADDRESS
} from './constants';
import { api } from './services/api';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Login } from './components/Login';
import { Session } from '@supabase/supabase-js';

type Tab = 'home' | 'cart' | 'store' | 'finalize' | 'history' | 'admin' | 'agent';


export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isPaid, setIsPaid] = useState(false);
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
  ]);

  // Cart Section States
  const [cartMode, setCartMode] = useState<'Warehouse' | 'Pickup'>('Pickup');
  const [selectedPickupDate, setSelectedPickupDate] = useState(PICKUP_SLOTS[0].date);
  const [selectedPickupTime, setSelectedPickupTime] = useState(PICKUP_SLOTS[0].times[0]);
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    apartment: '',
    city: '',
    state: '',
    zip: ''
  });
  const [pickupLanguage, setPickupLanguage] = useState('English');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; checked: boolean }>({ connected: false, checked: false });
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [categories, setCategories] = useState(['Pooja', 'Return Gifts', 'Decorative']);

  // Home Section States
  const [qCountry, setQCountry] = useState(COUNTRIES[0]);
  const [qWeight, setQWeight] = useState(1);

  // Admin Section States
  const [adminTab, setAdminTab] = useState<'Overview' | 'Agents' | 'Inventory'>('Overview');
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', email: '', vehicleNumber: '' });
  const [newProduct, setNewProduct] = useState<Partial<StoreProduct>>({ name: '', price: 0, category: 'Pooja', image: '', weight: 0 });

  // Store Section States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart Add States
  const [cartItemName, setCartItemName] = useState('');
  const [cartItemWeight, setCartItemWeight] = useState(1);

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
  const [editingPickupId, setEditingPickupId] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState<{ show: boolean; item: any; source: any }>({ show: false, item: null, source: null });
  const [cancellingPickupId, setCancellingPickupId] = useState<string | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  const handleSchedulePickup = () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    if (!pickupName || !pickupPhone || !pickupAddress.street || !pickupAddress.city) {
      alert('Please provide your name, phone number, street address, and city.');
      return;
    }
    setShowPickupChoiceModal(true);
  };

  const confirmPickup = (type: 'AllAgent' | 'Mixed') => {
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
      languagePreference: pickupLanguage
    };
    setAppointments([...appointments, newAppointment]);
    setPickupName('');
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
      setCancellingPickupId(null);
    }
  };

  const startEditingPickup = (apt: Appointment) => {
    setEditingPickupId(apt.id);
    setSelectedPickupDate(apt.date);
    setSelectedPickupTime(apt.time);
    setPickupName(apt.customerName || '');
    setPickupPhone(apt.phone);
    // Parse address back if possible, or just set street
    setPickupAddress({ street: apt.address, apartment: '', city: '', state: '', zip: '' });
    setPickupLanguage(apt.languagePreference || 'English');
    setCartMode('Pickup');
    setActiveTab('cart');
  };

  const saveEditedPickup = () => {
    const fullAddress = `${pickupAddress.street}${pickupAddress.apartment ? ', ' + pickupAddress.apartment : ''}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zip}`;
    setAppointments(prev => prev.map(a => a.id === editingPickupId ? {
      ...a,
      date: selectedPickupDate,
      time: selectedPickupTime,
      customerName: pickupName,
      phone: pickupPhone,
      address: fullAddress,
      languagePreference: pickupLanguage
    } : a));
    setEditingPickupId(null);
    setPickupName('');
    setPickupPhone('');
    setPickupAddress({ street: '', apartment: '', city: '', state: '', zip: '' });
    setPickupLanguage('English');
    alert('Pickup schedule updated successfully!');
  };

  const ShipmentTracker = () => {
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
      setCurrentUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: (session.user.user_metadata?.role as UserRole) || 'Customer'
      });
    } else if (isGuestMode) {
      setCurrentUser({
        id: 'guest-user',
        name: guestEmail === 'admin@jiffex.com' ? 'Admin User' : 'Guest User',
        email: guestEmail || 'guest@example.com',
        role: guestEmail === 'admin@jiffex.com' ? 'Admin' : 'Customer'
      });
    } else {
      setCurrentUser(null);
    }
  }, [session, isGuestMode]);

  // Fetch orders when currentUser or activeTab changes
  useEffect(() => {
    if (dbStatus.connected && currentUser) {
      if (activeTab === 'history' || activeTab === 'home') {
        api.getOrders(currentUser.id).then(setOrders).catch(console.error);
      }
    }
  }, [currentUser, activeTab, dbStatus.connected]);

  // Scroll to top when major state changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, activeWorkOrder, isPaid]);

  // --- Helpers ---
  const totalWeight = useMemo(() => items.reduce((sum, item) => sum + item.weight, 0), [items]);
  const totalCost = useMemo(() => {
    const rate = SHIPPING_RATES[address.country] || 800;
    const shippingCost = totalWeight * rate;
    const itemsCost = items.reduce((sum, item) => sum + (item.price || 0), 0);
    return shippingCost + itemsCost;
  }, [items, totalWeight, address.country]);

  const addItem = async (item: Omit<ShippingItem, 'id' | 'status' | 'source'>, source: 'Warehouse' | 'Pickup' | 'Store', force = false) => {
    const activePickup = appointments.find(a => a.status === 'Scheduled');
    const hasActivePickup = !!activePickup;
    const isMixedPickup = activePickup?.pickupType === 'Mixed';
    
    if (hasActivePickup && !isMixedPickup && !showConflictModal.show && !force) {
      setShowConflictModal({ show: true, item, source });
      return;
    }

    // Check if item already exists in cart (same name and source)
    const existingItemIndex = items.findIndex(i => i.name === item.name && i.source === source);

    if (existingItemIndex !== -1) {
      // Increment quantity
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: (existingItem.quantity || 1) + 1,
        weight: existingItem.weight + item.weight // Also update total weight for this entry
      };
      setItems(updatedItems);
      setShowConflictModal({ show: false, item: null, source: null });
      return;
    }

    const newItem: ShippingItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      status: source === 'Store' ? 'Received at Warehouse' : 'Pending',
      source,
      quantity: 1,
    };
    
    // Optimistic update
    setItems([...items, newItem]);
    setShowConflictModal({ show: false, item: null, source: null });

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
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const removeStoreItem = (name: string) => {
    const index = items.findIndex(i => i.name === name && i.source === 'Store');
    if (index !== -1) {
      const updatedItems = [...items];
      const item = updatedItems[index];
      if (item.quantity && item.quantity > 1) {
        updatedItems[index] = {
          ...item,
          quantity: item.quantity - 1,
          weight: item.weight - (item.weight / item.quantity) // This is tricky if weights are different, but for store items they are same
        };
      } else {
        updatedItems.splice(index, 1);
      }
      setItems(updatedItems);
    }
  };

  const updateItemStatus = (id: string, status: ShippingStatus) => {
    setItems(items.map(i => i.id === id ? { ...i, status } : i));
  };

  const handleFinalPayment = async () => {
    if (!currentUser) return;
    const newOrder: Order = {
      id: orderId!,
      customerId: currentUser.id,
      items: [...items],
      totalWeight,
      totalCost,
      status: 'Received at Warehouse',
      createdAt: new Date().toISOString(),
      shippingDate: selectedDate,
      destination: address,
      paymentStatus: 'Paid'
    };
    
    // Optimistic update
    setOrders([...orders, newOrder]);
    setIsPaid(true);
    setItems([]);

    // Sync to DB
    if (dbStatus.connected) {
      try {
        await api.createOrder({
          ...newOrder,
          customer_id: currentUser.id, // Snake case for DB
          total_weight: totalWeight,
          total_cost: totalCost,
          payment_status: 'Paid',
          shipping_date: selectedDate
        } as any);
      } catch (err: any) {
        console.error('Failed to sync order to DB:', err.message);
      }
    }
  };

  const addWOItem = () => {
    if (!woItemName) return;
    const newItem: ShippingItem = {
      id: Math.random().toString(36).substr(2, 9),
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
    setAppointments(prev => prev.map(apt => 
      apt.id === activeWorkOrder.id 
        ? { ...apt, status: 'Completed', orderId: newOrderId, paymentStatus: 'Paid' } 
        : apt
    ));
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    const hasScheduledPickup = appointments.some(a => a.status === 'Scheduled');
    if (hasScheduledPickup) {
      alert("You have an active agent pickup scheduled. To ensure all your items are shipped together, payment is only available once the agent has collected your items and they are received at our warehouse.");
      return;
    }

    const pendingItems = items.filter(i => i.status === 'Pending');
    if (pendingItems.length > 0) {
      alert(`You have ${pendingItems.length} item(s) with PENDING status. All items must be 'Received at Warehouse' before you can proceed to checkout.`);
      return;
    }
    const newOrderId = 'BB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setOrderId(newOrderId);
    setActiveTab('finalize');
  };

  // --- Components ---

   const HomeSection = useMemo(() => {
    return (
      <div className="space-y-12">
        {/* Hero Message */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm"
          >
            <MapPin size={14} className="animate-pulse" />
            Operating only in Hyderabad, India
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100"
          >
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
            Your Global Logistics Partner
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]"
          >
            Ship Anything, <br />
            <span className="text-indigo-600 relative">
              Shop Everything.
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto"
          >
            Consolidate your international shipments and shop premium Indian products from our curated <span className="text-indigo-600 font-bold">J Store</span>.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <button 
              onClick={() => setActiveTab('cart')}
              className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center gap-3 group"
            >
              <Package size={24} className="group-hover:rotate-12 transition-transform" /> Start Shipment
            </button>
            <button 
              onClick={() => setActiveTab('store')}
              className="px-10 py-5 bg-white text-indigo-600 border-2 border-indigo-600 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl active:scale-95 flex items-center gap-3"
            >
              <Store size={24} /> Visit J Store
            </button>
          </motion.div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Quote Calculator */}
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
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={qWeight}
                    onChange={(e) => setQWeight(Number(e.target.value))}
                  />
                </div>
                <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Estimated Cost</span>
                      <div className="text-4xl font-black">₹{(qWeight * SHIPPING_RATES[qCountry]).toFixed(2)}</div>
                    </div>
                    <Truck className="opacity-20" size={48} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-tighter">
                  * Final cost calculated upon warehouse arrival
                </p>
              </div>
            </div>
          </div>

          {/* Business Flow Explanation */}
          <div className="lg:col-span-3 space-y-8">
            <h3 className="text-2xl font-black text-slate-900">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Package,
                  title: "1. Shop & Send",
                  desc: `Shop from any store and send items to our warehouse at ${WAREHOUSE_ADDRESS.street}, ${WAREHOUSE_ADDRESS.city}. We'll track every arrival for you.`,
                  color: "bg-blue-500"
                },
                {
                  icon: Users,
                  title: "2. Agent Pickup",
                  desc: "Schedule a pickup and our agent will visit your location to collect and weigh your items professionally.",
                  color: "bg-amber-500"
                },
                {
                  icon: Store,
                  title: "3. Shop J Store",
                  desc: "Add premium Pooja items, return gifts, and decorative pieces directly from our curated store to your shipment.",
                  color: "bg-emerald-500"
                },
                {
                  icon: CheckCircle2,
                  title: "4. Consolidate & Ship",
                  desc: "Once all items are received, select your preferred shipping date, provide the address, and we handle the rest.",
                  color: "bg-indigo-500"
                }
              ].map((step, i) => (
                <motion.div 
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className={`w-12 h-12 ${step.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-${step.color.split('-')[1]}-100 group-hover:scale-110 transition-transform`}>
                    <step.icon size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center gap-6">
              <div className="hidden sm:flex w-16 h-16 bg-white/10 rounded-2xl items-center justify-center shrink-0">
                <Info size={32} className="text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Ready to get started?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Join thousands of customers who trust JiffEX for their international logistics needs. Fast, secure, and transparent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products from J Store */}
        <div className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black text-slate-900">Featured from J Store</h3>
              <p className="text-slate-500">Premium products curated for your special occasions.</p>
            </div>
            <button 
              onClick={() => setActiveTab('store')}
              className="text-indigo-600 font-bold flex items-center gap-1 hover:underline"
            >
              View All <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {storeProducts.slice(0, 4).map(product => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="aspect-square overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {product.category}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-slate-900 mb-1 truncate">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-600 font-bold">₹{product.price}</span>
                    <button 
                      onClick={() => {
                        addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store');
                        setActiveTab('cart');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, [qCountry, qWeight, setActiveTab, setQuote, addItem, storeProducts, currentUser]);

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, newProduct: any, setNewProduct: any) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct({ ...newProduct, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  }
};

interface AdminDashboardProps {
  currentUser: User | null;
  orders: Order[];
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  agents: AgentProfile[];
  setAgents: React.Dispatch<React.SetStateAction<AgentProfile[]>>;
  newAgent: any;
  setNewAgent: React.Dispatch<React.SetStateAction<any>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  adminTab: 'Overview' | 'Agents' | 'Inventory';
  setAdminTab: React.Dispatch<React.SetStateAction<'Overview' | 'Agents' | 'Inventory'>>;
  newProduct: Partial<StoreProduct>;
  setNewProduct: React.Dispatch<React.SetStateAction<Partial<StoreProduct>>>;
  storeProducts: StoreProduct[];
  setStoreProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
}

const AdminDashboard = ({
  currentUser,
  orders,
  appointments,
  setAppointments,
  agents,
  setAgents,
  newAgent,
  setNewAgent,
  categories,
  setCategories,
  adminTab,
  setAdminTab,
  newProduct,
  setNewProduct,
  storeProducts,
  setStoreProducts
}: AdminDashboardProps) => {
  const [categoryInput, setCategoryInput] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');

  if (!currentUser) return null;
  const stats = [
    { label: 'Total Shipments', value: orders.length + appointments.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Pending Pickups', value: appointments.filter(a => a.status === 'Scheduled').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'Active Shipments', value: orders.filter(o => o.status !== 'Delivered').length, icon: Truck, color: 'bg-indigo-500' },
    { label: 'Total Revenue', value: `₹${orders.reduce((sum, o) => sum + o.totalCost, 0).toLocaleString()}`, icon: BarChart3, color: 'bg-emerald-500' },
  ];

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900">Admin Dashboard</h2>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setAdminTab('Overview')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'Overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setAdminTab('Agents')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'Agents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Manage Agents
          </button>
          <button 
            onClick={() => setAdminTab('Inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'Inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Inventory
          </button>
        </div>
      </div>

      {adminTab === 'Overview' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="text-amber-500" /> Recent Appointments
              </h3>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No appointments scheduled</p>
                ) : (
                  appointments.map(apt => (
                    <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{apt.id}</div>
                          <div className="text-xs font-bold text-indigo-600">{apt.customerName || 'Customer'}</div>
                          <div className="text-xs text-slate-500">{apt.date} at {apt.time}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-indigo-600">{apt.phone}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">{apt.status}</div>
                        </div>
                      </div>

                      {apt.assignedAgent ? (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                              <Users size={16} />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Assigned Agent</div>
                              <div className="text-xs font-bold text-slate-900">{apt.assignedAgent.name}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, assignedAgent: undefined, assignedAgentId: undefined } : a))}
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select 
                            className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) => handleAssignAgent(apt.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>Select Agent to Assign</option>
                            {agents.filter(a => a.status === 'Active').map(agent => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                          <div className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle size={12} /> Unassigned
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Truck className="text-indigo-500" /> Recent Shipments
              </h3>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No shipments found</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900">{order.id}</div>
                        <div className="text-xs text-slate-500">{order.destination.country} • {order.totalWeight}kg</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">₹{order.totalCost}</div>
                        <div className="text-[10px] text-indigo-600 uppercase font-bold">{order.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : adminTab === 'Agents' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h3 className="text-xl font-bold mb-6">Add New Agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Agent Name"
                  value={newAgent.name}
                  onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="+91 XXXXX XXXXX"
                  value={newAgent.phone}
                  onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="agent@jiffex.com"
                  value={newAgent.email}
                  onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle Number</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="KA-01-XX-XXXX"
                  value={newAgent.vehicleNumber}
                  onChange={e => setNewAgent({...newAgent, vehicleNumber: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAddAgent}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Create Agent Profile
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Active Agents ({agents.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map(agent => (
                  <div key={agent.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <UserIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{agent.name}</div>
                      <div className="text-xs text-slate-500">{agent.phone}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{agent.vehicleNumber || 'No Vehicle'}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                          {agent.status}
                        </span>
                        <button 
                          onClick={() => setAgents(agents.filter(a => a.id !== agent.id))}
                          className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
              <h3 className="text-xl font-bold mb-6">Add New Product</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. Brass Diya"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      value={newProduct.price || ''}
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      value={newProduct.weight || ''}
                      onChange={e => setNewProduct({...newProduct, weight: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                  <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Product Image</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Image URL (https://...)"
                        value={newProduct.image}
                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      />
                      <label className="cursor-pointer px-4 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all border border-slate-200">
                        <Upload size={18} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, newProduct, setNewProduct)} />
                      </label>
                    </div>
                    {newProduct.image && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img src={newProduct.image} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => setNewProduct({...newProduct, image: ''})}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
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
                      weight: newProduct.weight || 0.5
                    };
                    setStoreProducts([...storeProducts, prod]);
                    setNewProduct({ name: '', price: 0, category: categories[0], image: '', weight: 0 });
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Add to Store
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Manage Categories</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="New Category Name"
                    value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value)}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-bold text-slate-700">{cat}</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Store Inventory ({storeProducts.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storeProducts.map(product => (
                  <div key={product.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={product.image} className="w-full h-full object-cover" alt={product.name} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.category} • {product.weight}kg</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm font-black text-slate-900">₹{product.price}</div>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                            {editingProductId === product.id ? (
                              <div className="flex gap-1">
                                <input 
                                  type="number" 
                                  className="w-20 p-1 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={editPriceValue}
                                  onChange={e => setEditPriceValue(e.target.value)}
                                  autoFocus
                                />
                                <button 
                                  onClick={() => {
                                    setStoreProducts(storeProducts.map(p => p.id === product.id ? {...p, price: Number(editPriceValue)} : p));
                                    setEditingProductId(null);
                                  }}
                                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingProductId(null)}
                                  className="text-[10px] text-slate-400 font-bold hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingProductId(product.id);
                                  setEditPriceValue(product.price.toString());
                                }}
                                className="text-[10px] text-indigo-600 font-bold hover:underline"
                              >
                                Edit Price
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => setStoreProducts(storeProducts.filter(p => p.id !== product.id))}
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



  const CustomerHistory = useMemo(() => {
    if (!currentUser) return null;
    const customerOrders = orders.filter(o => o.customerId === currentUser.id);

    return (
      <div className="space-y-8">
        <ShipmentTracker />
        <h2 className="text-3xl font-black text-slate-900">My Orders & History</h2>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Truck className="text-indigo-600" /> Active Shipments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customerOrders.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p>You have no active shipments.</p>
                <button onClick={() => setActiveTab('home')} className="mt-4 text-indigo-600 font-bold hover:underline">Start a shipment</button>
              </div>
            ) : (
              customerOrders.map(order => (
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
                      <div className="text-sm font-bold">{order.destination.country}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Weight</div>
                      <div className="text-sm font-bold">{order.totalWeight} kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Paid</div>
                      <div className="text-sm font-bold">₹{order.totalCost}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                      <Clock size={12} className="text-indigo-600" />
                      <span className="text-[10px] text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      View Invoice <ChevronRight size={14} />
                    </button>
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
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <Truck size={18} />
                      </div>
                      <span className="text-xl font-black tracking-tighter text-slate-900">JIFF<span className="text-indigo-600">EX</span></span>
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
  }, [orders, currentUser, setActiveTab, selectedOrderForInvoice]);


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
                    <span className="text-2xl font-black text-indigo-400">₹{(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 800)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => { setActiveWorkOrder(null); setActiveTab('agent'); }}
                className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Back to Portal
              </button>
              <button 
                onClick={() => {
                  const summary = `JiffEX Invoice\nOrder ID: ${woOrderId}\nDestination: ${woAddress.fullName}, ${woAddress.country}\nTotal: ₹${(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 800)).toFixed(2)}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'JiffEX Invoice',
                      text: summary,
                    }).catch(console.error);
                  } else {
                    alert('Invoice Summary copied to clipboard!\n\n' + summary);
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
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Agent Pickup Processing</p>
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
                <span className="text-white font-bold">₹{SHIPPING_RATES[woAddress.country] || 800}/kg</span>
              </div>
              <div className="h-px bg-slate-800 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-xl font-black text-indigo-400">₹{(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 800)).toFixed(2)}</span>
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
      <div className="space-y-8">
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
  const CartSection = useMemo(() => {
    // States are now in App to prevent focus loss

    const handleAdd = () => {
      if (!cartItemName) return;
      addItem({ name: cartItemName, weight: cartItemWeight }, cartMode);
      setCartItemName('');
      setCartItemWeight(1);
    };

    const handleCopyAddress = () => {
      const addressText = `${WAREHOUSE_ADDRESS.name}\n${WAREHOUSE_ADDRESS.street}\n${WAREHOUSE_ADDRESS.city}, ${WAREHOUSE_ADDRESS.state} ${WAREHOUSE_ADDRESS.zip}\n${WAREHOUSE_ADDRESS.country}\nTel: ${WAREHOUSE_ADDRESS.phone}`;
      navigator.clipboard.writeText(addressText);
      alert('Warehouse address copied to clipboard!');
    };

    const hasAllAgentPickup = appointments.some(a => a.pickupType === 'AllAgent');
    const hasMixedPickup = appointments.some(a => a.pickupType === 'Mixed');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Add Items / Schedule Pickup Card */}
          {(!appointments.length || editingPickupId || hasMixedPickup) && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {cartMode === 'Warehouse' ? <PlusCircle className="text-emerald-600" /> : <Calendar className="text-indigo-600" />}
                  {editingPickupId ? 'Update Pickup Schedule' : (cartMode === 'Warehouse' ? 'Add Your Items' : 'Schedule Agent Pickup')}
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button 
                    onClick={() => setCartMode('Pickup')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      cartMode === 'Pickup' 
                        ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Users size={14} /> Agent Pickup
                  </button>
                  <button 
                    onClick={() => setCartMode('Warehouse')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      cartMode === 'Warehouse' 
                        ? 'bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-100' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Package size={14} /> Warehouse
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {cartMode === 'Warehouse' ? (
                  <>
                    <div className="space-y-4">
                      <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3 relative group">
                        <button 
                          onClick={handleCopyAddress}
                          className="absolute top-3 right-3 p-2 bg-white rounded-xl text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50"
                          title="Copy Address"
                        >
                          <Copy size={16} />
                        </button>
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Our Warehouse Address</div>
                        <div className="text-sm font-bold text-indigo-900">{WAREHOUSE_ADDRESS.name}</div>
                        <div className="text-xs text-indigo-700 leading-relaxed">
                          {WAREHOUSE_ADDRESS.street}<br />
                          {WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.state} {WAREHOUSE_ADDRESS.zip}<br />
                          {WAREHOUSE_ADDRESS.country}
                        </div>
                        <div className="pt-2 border-t border-indigo-100 flex items-center gap-2 text-xs font-bold text-indigo-900">
                          <Phone size={14} /> {WAREHOUSE_ADDRESS.phone}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                        <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Send your items to our warehouse. Once shipped, enter the details here to track them in your shipment.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Item Description</label>
                        <input 
                          type="text" 
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                          placeholder="e.g. Laptop, Wedding Clothes..."
                          value={cartItemName}
                          onChange={(e) => setCartItemName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Approx Weight (kg)</label>
                        <input 
                          type="number" 
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                          value={cartItemWeight}
                          onChange={(e) => setCartItemWeight(Number(e.target.value))}
                        />
                      </div>
                      <button 
                        onClick={handleAdd}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                      >
                        <Plus size={20} /> Add to Shipment
                      </button>
                    </div>
                  </>
                ) : (appointments.length > 0 && !editingPickupId) ? (
                  <div className="md:col-span-2 p-8 bg-amber-50 rounded-3xl border border-amber-100 flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                      <Clock size={32} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-amber-900 mb-2">Pickup Scheduled</h4>
                      <p className="text-amber-700 leading-relaxed">
                        {appointments.some(a => a.pickupType === 'Mixed') 
                          ? "Mixed Collection: Agent will collect items from you, but invoicing & shipping will be managed from our warehouse. You can still add items to your warehouse list or shop from J Store. Payment will be enabled once all items are received at our warehouse."
                          : "Your agent pickup is confirmed. Payment will be enabled once the agent has collected your items and they are received at our warehouse. No further actions are required until the agent arrives."
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Pickup Date</label>
                          <select 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all text-sm font-medium"
                            value={selectedPickupDate}
                            onChange={(e) => setSelectedPickupDate(e.target.value)}
                          >
                            {PICKUP_SLOTS.map(slot => <option key={slot.date} value={slot.date}>{slot.date}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Time Slot</label>
                          <select 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all text-sm font-medium"
                            value={selectedPickupTime}
                            onChange={(e) => setSelectedPickupTime(e.target.value)}
                          >
                            {PICKUP_SLOTS.find(s => s.date === selectedPickupDate)?.times.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Name</label>
                        <input 
                          type="text" 
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                          placeholder="Full Name"
                          value={pickupName}
                          onChange={(e) => setPickupName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Number</label>
                        <input 
                          type="tel" 
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                          placeholder="Mobile number for agent"
                          value={pickupPhone}
                          onChange={(e) => setPickupPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Language Preference</label>
                        <select 
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all text-sm"
                          value={pickupLanguage}
                          onChange={(e) => setPickupLanguage(e.target.value)}
                        >
                          {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Gujarati', 'Marathi', 'Punjabi'].map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Pickup Address</label>
                        <div className="space-y-3">
                          <input 
                            type="text" 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all text-sm"
                            placeholder="House No, Street Name"
                            value={pickupAddress.street}
                            onChange={(e) => setPickupAddress({...pickupAddress, street: e.target.value})}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all text-sm"
                              placeholder="City"
                              value={pickupAddress.city}
                              onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})}
                            />
                            <input 
                              type="text" 
                              className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all text-sm"
                              placeholder="ZIP Code"
                              value={pickupAddress.zip}
                              onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={editingPickupId ? saveEditedPickup : handleSchedulePickup}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                      >
                        {editingPickupId ? <Check size={20} /> : <Truck size={20} />}
                        {editingPickupId ? 'Update Schedule' : 'Schedule Agent Pickup'}
                      </button>
                      {editingPickupId && (
                        <button 
                          onClick={() => {
                            setEditingPickupId(null);
                            setPickupPhone('');
                            setPickupAddress({ street: '', apartment: '', city: '', state: '', zip: '' });
                          }}
                          className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
            {!hasAllAgentPickup && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Your Shipment Items</h3>
                  <p className="text-sm text-slate-500">Manage items collected or received at our warehouse.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-indigo-50 rounded-2xl text-xs font-bold text-indigo-600 border border-indigo-100">
                    {items.length} Items
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 rounded-2xl text-xs font-bold text-emerald-600 border border-emerald-100">
                    {totalWeight.toFixed(2)} kg Total
                  </div>
                </div>
              </div>
            )}
            
            {items.length === 0 && appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Package size={40} strokeWidth={1} />
                </div>
                <p className="font-medium">Your shipment is empty.</p>
                <p className="text-sm">Add items from the store or schedule a pickup to get started.</p>
              </div>
            ) : (
              <div className="space-y-6">
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
                          onClick={() => startEditingPickup(apt)}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                          title="Modify Schedule"
                        >
                          <Edit3 size={18} />
                        </button>
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
                              <span className="font-bold text-slate-900">{apt.customerName || 'Customer'}</span>
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

                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Info size={16} className="text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Pro Tip</span>
                          </div>
                          <p className="text-[11px] text-indigo-700 leading-relaxed">
                            Keep your items ready and sorted to speed up the collection process.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {items.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Individual Items</div>
                    {items.map(item => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={item.id} 
                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                      >
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 overflow-hidden border border-slate-100">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-slate-900">
                              {item.name}
                              {item.quantity && item.quantity > 1 && (
                                <span className="ml-2 text-indigo-600 font-black">x{item.quantity}</span>
                              )}
                            </h4>
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-indigo-600">{item.weight} kg</span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-lg text-slate-500 font-bold uppercase tracking-widest">
                              {item.source}
                            </span>
                            <div className="flex items-center gap-1 ml-auto">
                              {item.status === 'Received at Warehouse' ? (
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                  <CheckCircle2 size={12} /> RECEIVED
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                    <Clock size={12} /> PENDING
                                  </span>
                                  <button 
                                    onClick={() => updateItemStatus(item.id, 'Received at Warehouse')}
                                    className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                  >
                                    Mark Received
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            {(items.length > 0 || appointments.length > 0) && cartMode !== 'Pickup' && (
              <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col gap-6">
                {appointments.some(a => a.status === 'Scheduled') && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                      Payment will be enabled once your scheduled agent pickup is completed and all items are received at our warehouse. This ensures a single consolidated shipment for you.
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setActiveTab('store')}
                    className="flex-1 py-5 px-8 rounded-2xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    Continue Shopping
                  </button>
                  <button 
                    onClick={handleCheckout}
                    className={`flex-1 py-5 px-8 rounded-2xl font-bold transition-all shadow-2xl flex items-center justify-center gap-2 group ${
                      appointments.some(a => a.status === 'Scheduled')
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                    }`}
                  >
                    Proceed to Payment <ArrowRight size={20} className={appointments.some(a => a.status === 'Scheduled') ? '' : 'group-hover:translate-x-1 transition-transform'} />
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Quick Add from Store - Redesigned and Repositioned */}
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 sticky top-8 overflow-hidden">
            <div className="bg-slate-50 p-8 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">J Store</h3>
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <ShoppingBag size={20} />
                </div>
              </div>
              <p className="text-slate-500 text-xs font-medium">Curated premium Indian products</p>
            </div>

            <div className="p-6">
              <div className={`space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar ${cartMode === 'Pickup' && appointments.length > 0 && !editingPickupId && !appointments.some(a => a.pickupType === 'Mixed') ? 'opacity-50 pointer-events-none' : ''}`}>
                {STORE_PRODUCTS.map(product => {
                  const isInCart = items.some(i => i.name === product.name && i.source === 'Store');
                  return (
                    <div key={product.id} className="group relative bg-white hover:bg-slate-50 rounded-2xl p-3 border border-slate-100 transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                          <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">{product.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-black text-indigo-600">₹{product.price}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.weight}kg</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store')}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isInCart 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                              : 'bg-slate-100 text-slate-900 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-100'
                          }`}
                        >
                          {isInCart ? <Check size={20} /> : <Plus size={20} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setActiveTab('store')}
                  disabled={cartMode === 'Pickup' && appointments.length > 0 && !editingPickupId && !appointments.some(a => a.pickupType === 'Mixed')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
                >
                  Browse Full Catalog <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [cartMode, selectedPickupDate, selectedPickupTime, pickupPhone, pickupAddress, pickupLanguage, appointments, cartItemName, cartItemWeight, items, totalWeight, totalCost, dbStatus.connected, currentUser?.id, addItem, updateItemStatus, handleCheckout, setActiveTab, setAppointments, setCartItemName, setCartItemWeight, setCartMode, setPickupAddress, setPickupPhone, setSelectedPickupDate, setSelectedPickupTime, handleSchedulePickup, cancelPickup, startEditingPickup, saveEditedPickup, editingPickupId]);

  const StoreSection = useMemo(() => {
    const filteredProducts = storeProducts.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900">J Store</h2>
            <p className="text-slate-500">Premium Indian products delivered globally.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', ...categories].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? filteredProducts.map(product => {
            const itemCount = items.filter(i => i.name === product.name && i.source === 'Store').length;
            
            return (
              <motion.div 
                layout
                key={product.id} 
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative"
              >
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-4 right-4 z-10 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white"
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
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 leading-tight">{product.name}</h3>
                    <span className="text-indigo-600 font-bold">₹{product.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Weight: {product.weight} kg</p>
                  {itemCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => removeStoreItem(product.name)}
                        className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                        <ShoppingBag size={16} /> Added ({itemCount})
                      </div>
                      <button 
                        onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store')}
                        className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store')}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} /> Add to Shipment
                    </button>
                  )}
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
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setActiveTab('home')}
            className="py-4 px-12 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Continue Shopping
          </button>
          <button 
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="py-4 px-12 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Checkout <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }, [selectedCategory, searchQuery, addItem, handleCheckout, items.length, storeProducts, currentUser]);

  const FinalizeSection = useMemo(() => {
    if (!currentUser) return null;
    if (isPaid) {
      return (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <ShipmentTracker />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 size={64} />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900">Payment Successful!</h2>
            <p className="text-slate-500">Your order <span className="font-bold text-indigo-600">{orderId}</span> has been placed successfully.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Estimated Delivery</span>
              <span className="font-black text-slate-900">12-15 Business Days</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              We have received your payment. Our team will consolidate your items and ship them on <span className="font-bold">{selectedDate}</span>. You can track your shipment in your history.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { setActiveTab('history'); setIsPaid(false); setOrderId(null); }}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
            >
              View Order History
            </button>
            <button 
              onClick={() => { setActiveTab('home'); setIsPaid(false); setOrderId(null); }}
              className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ShipmentTracker />
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
              <MapPin className="text-red-500" /> Destination Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={address.fullName}
                  onChange={e => setAddress({...address, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={address.email}
                  onChange={e => setAddress({...address, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone</label>
                <input 
                  type="tel" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={address.phone}
                  onChange={e => setAddress({...address, phone: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Address Line 1</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={address.addressLine1}
                  onChange={e => setAddress({...address, addressLine1: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">City</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={address.city}
                  onChange={e => setAddress({...address, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Zip Code</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. 123456"
                  value={address.zipCode}
                  onChange={e => setAddress({...address, zipCode: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Country</label>
                <select 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={address.country}
                  onChange={e => setAddress({...address, country: e.target.value})}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
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
                  <div className="text-xs font-bold uppercase opacity-60 mb-1">March</div>
                  <div className="text-xl font-black">{date.split('-')[2]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
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
                <span className="text-white font-medium">₹{(totalWeight * (SHIPPING_RATES[address.country] || 800)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Items Cost</span>
                <span className="text-white font-medium">₹{items.reduce((sum, i) => sum + (i.price || 0), 0).toFixed(2)}</span>
              </div>
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
              disabled={items.length === 0}
              onClick={handleFinalPayment}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
            >
              Confirm & Pay
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
  }, [isPaid, orderId, address, selectedDate, paymentMethod, items, totalWeight, totalCost, dbStatus.connected, currentUser?.id, handleFinalPayment]);

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
            onClick={() => setShowLoginModal(true)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <UserIcon size={20} /> Sign In to Pay
          </button>
          <button 
            onClick={() => setActiveTab('cart')}
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
    setIsGuestMode(false);
    setGuestEmail('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 safe-top safe-bottom">
      {/* Supabase Status Banner */}
      {!dbStatus.connected && dbStatus.checked && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-widest">
          <Database size={12} />
          Database Not Connected. Using Local Storage Mode.
        </div>
      )}
      
      {/* Header Area (Sticky) */}
      <div className="sticky top-0 z-50">
        {/* Global Pickup Notification Banner */}
        <AnimatePresence>
          {appointments.some(a => a.status === 'Scheduled') && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="bg-indigo-600 text-white py-3 px-6 shadow-2xl relative z-[60]"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Bell size={16} className="animate-ring" />
                  </div>
                  <div>
                    <h4 className="font-black text-[10px] uppercase tracking-widest">Active Pickup Scheduled</h4>
                    <p className="text-[10px] text-indigo-100">
                      Agent collection on <span className="font-bold text-white">{appointments.find(a => a.status === 'Scheduled')?.date}</span>. 
                      Check <button onClick={() => { setActiveTab('history'); window.scrollTo(0,0); }} className="underline font-bold hover:text-white">My Orders</button> after pickup.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveTab('cart'); window.scrollTo(0,0); }}
                  className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg font-bold text-[10px] hover:bg-indigo-50 transition-all shadow-lg"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => {
                if (currentUser?.role === 'Admin') setActiveTab('admin');
                else if (currentUser?.role === 'Agent') setActiveTab('agent');
                else setActiveTab('home');
              }}
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Truck size={24} />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">JIFF<span className="text-indigo-600">EX</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'home', icon: Calculator, label: 'Home', roles: ['Customer'], public: true },
                { id: 'store', icon: Store, label: 'J Store', roles: ['Customer'], public: true },
                { id: 'cart', icon: Package, label: 'My Cart', roles: ['Customer'], public: true },
                { id: 'history', icon: History, label: 'My Orders', roles: ['Customer'], public: false },
                { id: 'admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin'], public: false },
                { id: 'agent', icon: Users, label: 'Agent Portal', roles: ['Agent'], public: false },
              ].filter(tab => tab.public || (currentUser && tab.roles.includes(currentUser.role))).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                  {tab.id === 'cart' && items.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</span>
                    <span className="text-sm font-black text-slate-900">{currentUser.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                  <UserIcon size={18} /> Sign In
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && HomeSection}
            {activeTab === 'cart' && CartSection}
            {activeTab === 'store' && StoreSection}
            {activeTab === 'finalize' && FinalizeSection}
            {activeTab === 'history' && CustomerHistory}
            {activeTab === 'admin' && (
              <AdminDashboard 
                currentUser={currentUser}
                orders={orders}
                appointments={appointments}
                setAppointments={setAppointments}
                agents={agents}
                setAgents={setAgents}
                newAgent={newAgent}
                setNewAgent={setNewAgent}
                categories={categories}
                setCategories={setCategories}
                adminTab={adminTab}
                setAdminTab={setAdminTab}
                newProduct={newProduct}
                setNewProduct={setNewProduct}
                storeProducts={storeProducts}
                setStoreProducts={setStoreProducts}
              />
            )}
            {activeTab === 'agent' && AgentSection}
          </motion.div>
        </AnimatePresence>
      </main>

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

      {/* Pickup Choice Modal */}
      <AnimatePresence>
        {showPickupChoiceModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Truck size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Pickup Preference</h3>
              <p className="text-slate-500 text-center mb-8">How would you like to handle your items for this shipment?</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => confirmPickup('AllAgent')}
                  className="w-full p-6 rounded-2xl border-2 border-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-indigo-900">All items by Agent</span>
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <Check size={14} />
                    </div>
                  </div>
                  <p className="text-xs text-indigo-700 leading-relaxed">Our agent will collect all items from your location. No need to send anything to the warehouse yourself.</p>
                </button>

                <button 
                  onClick={() => confirmPickup('Mixed')}
                  className="w-full p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-slate-900">Mixed Collection</span>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-indigo-200" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">Agent will collect items from you, but invoicing & shipping will be managed from our warehouse. You can also send items to the warehouse yourself or shop from J Store.</p>
                </button>
              </div>

              <button 
                onClick={() => setShowPickupChoiceModal(false)}
                className="w-full mt-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
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
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-200">
                    <Truck size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Welcome Back</h2>
                  <p className="text-slate-500 mt-2">Sign in to continue your shipment</p>
                </div>
                <Login onSuccess={(email) => {
                  setGuestEmail(email);
                  setIsGuestMode(true);
                  setShowLoginModal(false);
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
