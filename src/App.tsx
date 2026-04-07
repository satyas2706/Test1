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
  Plus, 
  Minus,
  PlusCircle,
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
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
  Users,
  BarChart3,
  Search,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
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
  MessageSquare,
  Mail,
  SlidersHorizontal,
  ChevronDown,
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
import { supabase } from './lib/supabase';
import { Login } from './components/Login';
import { Session } from '@supabase/supabase-js';

type Tab = 'home' | 'pickup' | 'warehouse' | 'store' | 'cart' | 'finalize' | 'history' | 'admin' | 'warehouse-mgmt' | 'agent' | 'support' | 'notifications' | 'send-options' | 'track';


const API_URL = window.location.origin;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [tabHistory, setTabHistory] = useState<Tab[]>(['home']);
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navbarTrackingId, setNavbarTrackingId] = useState('');

  const navigateTo = (tab: Tab) => {
    if (tab === 'pickup' && appointments.some(a => a.status === 'Scheduled') && !isSchedulingNewPickup) {
      setActivePickupStep(5);
    }
    if (tab !== activeTab) {
      setTabHistory(prev => [...prev, tab]);
      setActiveTab(tab);
      window.scrollTo(0, 0);
    }
  };

  const goBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // remove current
      const prevTab = newHistory[newHistory.length - 1];
      setTabHistory(newHistory);
      setActiveTab(prevTab);
      window.scrollTo(0, 0);
    } else {
      setActiveTab('home');
      setTabHistory(['home']);
      window.scrollTo(0, 0);
    }
  };

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={onClick}
    className="mb-3 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
  >
    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
      <ArrowRight size={16} className="rotate-180" />
    </div>
    <span>Go Back</span>
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

  // Scroll to pickup header when step changes
  useEffect(() => {
    if (activePickupStep > 1 && activePickupStep < 5) {
      setTimeout(() => {
        pickupHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activePickupStep]);
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
  const [adminTab, setAdminTab] = useState<'Overview' | 'Agents' | 'Inventory'>('Overview');
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', email: '', vehicleNumber: '' });
  const [newProduct, setNewProduct] = useState<Partial<StoreProduct>>({ name: '', price: 0, category: 'Pooja', image: '', weight: 0 });

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
  const [editingPickupId, setEditingPickupId] = useState<string | null>(null);
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
    setLastBookingRef(newAppointment.id);
    setIsSchedulingNewPickup(false);
    setActivePickupStep(5);
    window.scrollTo(0, 0);
    
    // Sync to DB and trigger notification
    if (dbStatus.connected && currentUser) {
      try {
        await api.createOrder({
          ...newAppointment,
          customer_id: currentUser.id,
          total_weight: 0,
          total_cost: 0,
          destination: { 
            addressLine1: fullAddress, 
            city: pickupAddress.city, 
            country: 'India',
            email: currentUser.email,
            phone: pickupPhone,
            fullName: pickupName || currentUser.name
          },
          payment_status: 'Pending',
          shipping_date: selectedPickupDate
        } as any);
      } catch (err) {
        console.error('Failed to sync pickup to DB:', err);
      }
    }

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
    navigateTo('pickup');
  };

  const saveEditedPickup = () => {
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
    toast.success('Pickup schedule updated successfully!');
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
      setCurrentUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: (session.user.user_metadata?.role as UserRole) || 'Customer'
      });
    } else if (isGuestMode) {
      const isAdmin = guestEmail === 'admin@jiffex.com';
      const isAgent = guestEmail === 'agent@jiffex.com';
      setCurrentUser({
        id: 'guest-user',
        name: isAdmin ? 'Admin User' : isAgent ? 'Agent User' : 'Guest User',
        email: guestEmail || 'guest@example.com',
        role: isAdmin ? 'Admin' : isAgent ? 'Agent' : 'Customer'
      });
    } else {
      setCurrentUser(null);
    }
  }, [session, isGuestMode, guestEmail]);

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
  const cartItems = useMemo(() => {
    return items.filter(i => i.source !== 'Warehouse' || i.submitted);
  }, [items]);

  const totalWeight = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);
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
      source: source,
      quantity: item.quantity || 1,
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
        updatedItems[index] = {
          ...item,
          quantity: item.quantity - 1,
          weight: item.weight - unitWeight
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
    setItems(items.map(i => {
      if (i.id === id) {
        const newQuantity = Math.max(1, (i.quantity || 1) + delta);
        const unitWeight = i.weight / (i.quantity || 1);
        return {
          ...i,
          quantity: newQuantity,
          weight: unitWeight * newQuantity
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
    const cartItems = items.filter(i => i.source !== 'Warehouse' || i.submitted);
    const newOrder: Order = {
      id: orderId!,
      customerId: currentUser.id,
      items: [...cartItems],
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
          payment_status: 'Paid',
          shipping_date: selectedDate
        } as any);

        // Automatically send invoice email with PDF
        const companyDetails = {
          name: "JiffEX Shipping & Logistics",
          address: "123 Logistics Hub, Mumbai, India",
          email: "support@jiffex.com"
        };

        const recipientEmail = address.email || currentUser.email;
        await api.sendInvoicePDF(recipientEmail, newOrder, companyDetails);
        toast.success(`Payment successful! Invoice sent to ${recipientEmail}`);
      } catch (err: any) {
        console.error('Failed to sync order or send invoice:', err.message);
        if (err.message.includes('Email service not configured')) {
          toast.error('Payment successful, but email service is not configured. Please check your settings.');
        } else {
          toast.error('Payment successful, but failed to send invoice email.');
        }
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
    if (currentUser && dbStatus.connected) {
      const invoiceDetails = `
Items: ${woItems.map(i => `${i.name} (${i.weight}kg)`).join(', ')}
Total Weight: ${totalW}kg
Total Cost: ₹${totalC.toLocaleString()}
Destination: ${woAddress.city}, ${woAddress.country}
Date: ${new Date().toLocaleDateString()}
      `.trim();

      const recipientEmail = woAddress.email || currentUser.email;
      api.shareInvoice(recipientEmail, newOrderId, invoiceDetails)
        .then(() => toast.success(`Payment successful! Invoice sent to ${recipientEmail}`))
        .catch(err => {
          console.error('Failed to send invoice:', err.message);
          if (err.message.includes('Email service not configured')) {
            toast.error('Payment successful, but email service is not configured. Please check your settings.');
          } else {
            toast.error('Payment successful, but failed to send invoice email.');
          }
        });
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      setLoginTriggerSource('checkout');
      setShowLoginModal(true);
      return;
    }

    const hasScheduledPickup = appointments.some(a => a.status === 'Scheduled');
    if (hasScheduledPickup) {
      toast.warning("You have an active agent pickup scheduled. To ensure all your items are shipped together, payment is only available once the agent has collected your items and they are received at our warehouse.");
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

    const SendSelectionPage = useMemo(() => {
      return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">How would you like to send?</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Choose the most convenient way to get your items to our global warehouse.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => navigateTo('pickup')}
              className="group relative bg-white p-10 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-indigo-500 transition-all duration-500 text-left flex flex-col gap-8 overflow-hidden"
            >
              <div className="absolute top-6 right-6 z-20">
                <span className="px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-200">
                  Most Popular
                </span>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all duration-500 group-hover:bg-indigo-100" />
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Truck size={40} />
              </div>
              <div className="space-y-4 relative z-10">
                <h3 className="text-3xl font-black text-slate-900">Pickup from Home</h3>
                <p className="text-slate-500 text-lg leading-relaxed">Our agent will come to your doorstep, pack your items professionally, and bring them to our warehouse.</p>
              </div>
              <div className="flex items-center gap-3 text-indigo-600 font-black text-lg mt-auto relative z-10">
                Get Started <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </button>

            <button 
              onClick={() => navigateTo('warehouse')}
              className="group relative bg-white p-10 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-indigo-500 transition-all duration-500 text-left flex flex-col gap-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all duration-500 group-hover:bg-slate-100" />
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Package size={40} />
              </div>
              <div className="space-y-4 relative z-10">
                <h3 className="text-3xl font-black text-slate-900">Send to Warehouse</h3>
                <p className="text-slate-500 text-lg leading-relaxed">Ship your items directly to our warehouse using any local courier. We'll receive and process them for global shipping.</p>
              </div>
              <div className="flex items-center gap-3 text-slate-900 font-black text-lg mt-auto relative z-10">
                Get Started <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      );
    }, [navigateTo]);

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
                  { icon: Calendar, title: "1. Schedule Pickup", desc: "Start by scheduling an agent pickup. This becomes the heart of your shipment process.", color: "bg-indigo-600", shadow: "shadow-indigo-200" },
                  { icon: ShoppingBag, title: "2. Add Everything", desc: "Add items from your home, our Shop, or even items you've sent to our warehouse.", color: "bg-amber-500", shadow: "shadow-amber-200" },
                  { icon: Truck, title: "3. Home Consolidation", desc: "Our agent brings your warehouse and store items to your home for a final unified collection.", color: "bg-emerald-500", shadow: "shadow-emerald-200" },
                  { icon: CheckCircle2, title: "4. Global Shipping", desc: "Everything is weighed and packed at your home, then shipped globally in one go.", color: "bg-blue-500", shadow: "shadow-blue-200" }
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
                      <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm border-4 border-white shadow-lg">
                        0{i + 1}
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
                          ${(qWeight * SHIPPING_RATES[qCountry] * (qMethod === 'Standard' ? 0.7 : 1.0)).toFixed(2)}
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
                <h3 className="text-3xl font-black text-slate-900">Featured from <span className="text-indigo-600">Shop</span></h3>
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
                          className="absolute top-3 right-3 z-10 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white"
                        >
                          {itemCount}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="aspect-square overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        {product.category}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-900 mb-1 truncate">{product.name}</h4>
                      <div className="flex flex-col gap-3 mt-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-600 font-bold">${product.price}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{product.weight}kg</span>
                        </div>
                        
                        {itemCount > 0 ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => removeStoreItem(product.name)}
                              className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-indigo-100">
                              <ShoppingBag size={12} /> Added ({itemCount})
                            </div>
                            <button 
                              onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store')}
                              className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image }, 'Store')}
                            className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={14} /> Add to Shipment
                          </button>
                        )}
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

  const SupportSection = useMemo(() => {
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
    }, []);


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
  adminTab: 'Overview' | 'Agents' | 'Inventory' | 'Settings';
  setAdminTab: React.Dispatch<React.SetStateAction<'Overview' | 'Agents' | 'Inventory' | 'Settings'>>;
  newProduct: Partial<StoreProduct>;
  setNewProduct: React.Dispatch<React.SetStateAction<Partial<StoreProduct>>>;
  storeProducts: StoreProduct[];
  setStoreProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
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
  setStoreProducts,
  setOrders
}: AdminDashboardProps) => {
  const [categoryInput, setCategoryInput] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [editDeliveryValue, setEditDeliveryValue] = useState<string>('');

  if (!currentUser) return null;
  const stats = [
    { label: 'Total Shipments', value: orders.length + appointments.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Pending Pickups', value: appointments.filter(a => a.status === 'Scheduled').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'Active Shipments', value: orders.filter(o => o.status !== 'Delivered').length, icon: Truck, color: 'bg-indigo-500' },
    { label: 'Total Revenue', value: `$${orders.reduce((sum, o) => sum + o.totalCost, 0).toLocaleString()}`, icon: BarChart3, color: 'bg-emerald-500' },
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
          <button 
            onClick={() => setAdminTab('Settings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'Settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Settings
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
                    <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{order.id}</div>
                          <div className="text-xs text-slate-500">{order.destination.country} • {order.totalWeight}kg</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">${order.totalCost.toLocaleString()}</div>
                          <div className="text-[10px] text-indigo-600 uppercase font-bold">{order.status}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select 
                          className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as ShippingStatus)}
                        >
                          <option value="Received at Warehouse">Received at Warehouse</option>
                          <option value="Processing">Processing</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-bold uppercase flex items-center gap-1">
                          <MessageSquare size={10} /> WhatsApp
                        </div>
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
                className="w-full btn-cta"
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
      ) : adminTab === 'Inventory' ? (
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
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price ($)</label>
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Delivery</label>
                      <input 
                        type="date" 
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={newProduct.estimatedDelivery || ''}
                        onChange={e => setNewProduct({...newProduct, estimatedDelivery: e.target.value})}
                      />
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
                      weight: newProduct.weight || 0.5,
                      estimatedDelivery: newProduct.estimatedDelivery
                    };
                    setStoreProducts([...storeProducts, prod]);
                    setNewProduct({ name: '', price: 0, category: categories[0], image: '', weight: 0, estimatedDelivery: '' });
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
                      {product.estimatedDelivery && (
                        <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                          <Calendar size={10} /> Delivery: {product.estimatedDelivery}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm font-black text-slate-900">${product.price}</div>
                          <div className="flex gap-2">
                            <div className="flex flex-col gap-1">
                              {editingProductId === product.id ? (
                                <div className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase w-12">Price</label>
                                    <input 
                                      type="number" 
                                      className="flex-1 p-1 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                      value={editPriceValue}
                                      onChange={e => setEditPriceValue(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase w-12">Delivery</label>
                                    <input 
                                      type="date" 
                                      className="flex-1 p-1 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                      value={editDeliveryValue}
                                      onChange={e => setEditDeliveryValue(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      onClick={() => {
                                        setStoreProducts(storeProducts.map(p => p.id === product.id ? {
                                          ...p, 
                                          price: Number(editPriceValue),
                                          estimatedDelivery: editDeliveryValue
                                        } : p));
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
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingProductId(product.id);
                                    setEditPriceValue(product.price.toString());
                                    setEditDeliveryValue(product.estimatedDelivery || '');
                                  }}
                                  className="text-[10px] text-indigo-600 font-bold hover:underline"
                                >
                                  Edit Product
                                </button>
                              )}
                            </div>
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
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : adminTab === 'Settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-indigo-600" /> System Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-600" />
                    <span className="font-bold text-slate-900">Twilio SMS/WhatsApp</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Configured</span>
                </div>
                <p className="text-xs text-slate-500">Handles automated shipping alerts and agent pickup confirmations.</p>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Troubleshooting: SMS Permissions</span>
                  </div>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    If you see errors like <strong>"Permission to send an SMS has not been enabled for the region"</strong>, you must enable <strong>Geo-Permissions</strong> for the destination country in your Twilio Console.
                  </p>
                  <a 
                    href="https://console.twilio.com/us1/develop/sms/settings/geo-permissions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    Open Twilio Geo-Permissions →
                  </a>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-indigo-600" />
                    <span className="font-bold text-slate-900">SMTP Email Service</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Active</span>
                </div>
                <p className="text-xs text-slate-500">Sends digital invoices and detailed order summaries to customers.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-indigo-600" />
                    <span className="font-bold text-slate-900">Supabase Database</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Connected</span>
                </div>
                <p className="text-xs text-slate-500">Persistent storage for orders, inventory, and notification history.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Bell className="text-indigo-600" /> Test Notifications
            </h3>
            <p className="text-sm text-slate-500">Send a test alert to verify your configuration is working correctly.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Test Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <MessageSquare size={14} /> Test SMS
                </button>
                <button className="p-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <Mail size={14} /> Test Email
                </button>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] text-indigo-600 leading-relaxed">
                  <strong>Note:</strong> Test notifications will use the credentials defined in your environment variables. Ensure your Twilio balance is sufficient.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};



  const CustomerHistory = useMemo(() => {
    if (!currentUser) return null;
    const customerOrders = orders.filter(o => o.customerId === currentUser.id);

    return (
      <div className="space-y-8">
        <StaticShipmentTracker />
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
                <button onClick={() => navigateTo('home')} className="mt-4 text-indigo-600 font-bold hover:underline">Start a shipment</button>
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
                      <div className="text-sm font-bold">${order.totalCost}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                      <Clock size={12} className="text-indigo-600" />
                      <span className="text-[10px] text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
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
                          {item.price ? `$${item.price}` : '-'}
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
                      <div className="text-3xl font-black">${selectedOrderForInvoice.totalCost}</div>
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
                    <span className="text-2xl font-black text-indigo-400">${(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 10)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => { setActiveWorkOrder(null); navigateTo('agent'); }}
                className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Back to Portal
              </button>
              <button 
                onClick={() => {
                  const summary = `JiffEX Invoice\nOrder ID: ${woOrderId}\nDestination: ${woAddress.fullName}, ${woAddress.country}\nTotal: $${(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 10)).toFixed(2)}`;
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
                <span className="text-white font-bold">${SHIPPING_RATES[woAddress.country] || 10}/kg</span>
              </div>
              <div className="h-px bg-slate-800 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-xl font-black text-indigo-400">${(woItems.reduce((s, i) => s + i.weight, 0) * (SHIPPING_RATES[woAddress.country] || 10)).toFixed(2)}</span>
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
          <h4 className="text-xl font-black text-slate-900">From our Shop</h4>
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
              <div key={product.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 truncate">{product.name}</h5>
                    <p className="text-[10px] text-slate-500">${product.price} • {product.weight} kg</p>
                  </div>
                  <button 
                    onClick={() => addItem({ 
                      name: product.name, 
                      weight: product.weight, 
                      price: product.price, 
                      image: product.image,
                      estimatedDelivery: product.estimatedDelivery 
                    }, 'Store')}
                    className={`mt-2 py-2 px-3 rounded-lg text-[10px] font-black flex items-center justify-center gap-2 transition-all ${
                      itemCount > 0 
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                        : 'bg-slate-900 text-white hover:bg-black'
                    }`}
                  >
                    {itemCount > 0 ? <><CheckCircle2 size={12} /> Added</> : <><Plus size={12} /> Add to Cart</>}
                  </button>
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

    const displayWeight = displayItems.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);
    const hasTBDWeight = displayItems.some(i => i.weight === 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`${mode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
          {/* Progress Bar - Moved to top */}
          {!mode && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Shipment Progress</h4>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {displayItems.every(i => i.status === 'Received at Warehouse') && displayItems.length > 0 ? 'Ready to Ship' : 'In Progress'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${
                      displayItems.every(i => i.status === 'Received at Warehouse') && displayItems.length > 0 ? '100%' :
                      displayItems.some(i => i.status === 'Received at Warehouse') ? '75%' :
                      appointments.length > 0 ? '50%' : '25%'
                    }` 
                  }} 
                />
                <div className="relative flex justify-between">
                  {[
                    { label: 'Items Added', icon: Package, active: displayItems.length > 0 },
                    { label: 'Pickup Scheduled', icon: Truck, active: appointments.length > 0 },
                    { label: 'Received', icon: CheckCircle2, active: displayItems.some(i => i.status === 'Received at Warehouse') },
                    { label: 'Ready to Ship', icon: ArrowRight, active: displayItems.every(i => i.status === 'Received at Warehouse') && displayItems.length > 0 }
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${step.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                        <step.icon size={18} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tight ${step.active ? 'text-indigo-600' : 'text-slate-400'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Unified Cart Header */}
          {!mode && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black text-slate-900">My Shipping Cart</h2>
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                  <ShoppingCart size={24} />
                </div>
              </div>
              <p className="text-slate-500">Review and manage all your items before checkout.</p>
            </div>
          )}

          {/* Heart-touching Warehouse Message */}
          {mode === 'Warehouse' && (
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
                  <Heart size={240} fill="currentColor" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Heart size={20} className="fill-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Connecting Hearts Across Borders</span>
                  </div>
                  <h2 className="text-3xl font-black mb-4 leading-tight">Distance shouldn't keep you from the things you love.</h2>
                  <p className="text-lg text-emerald-50/90 leading-relaxed font-medium">
                    Whether it's a mother's handmade sweets, a piece of home, or something special from India, 
                    you don't need to worry about how to get it to the US. We are here, ready to gather, 
                    consolidate, and safely deliver your world to you.
                  </p>
                </div>
              </motion.div>
            </div>
          )}


          {/* Add Items / Schedule Pickup Card */}
          {(mode || hasActivePickup || editingPickupId) && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              {mode === 'Warehouse' ? (
                <div className="space-y-8">
                  {/* Header Section */}
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                      <Database size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Warehouse Shipment</h2>
                      <p className="text-sm text-slate-500 font-medium">Register items you're sending to our facility</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Sticky Inputs & Address */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                      {/* Step 1: Warehouse Address Card */}
                      <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                          <MapPin size={120} />
                        </div>
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin size={18} />
                              <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Shipping Address</span>
                            </div>
                            <button 
                              onClick={handleCopyAddress}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                              title="Copy Address"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Recipient</p>
                              <p className="text-sm font-black">{WAREHOUSE_ADDRESS.name} (ID: {customerWarehouseId})</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Address</p>
                              <p className="text-sm font-medium leading-relaxed">
                                {WAREHOUSE_ADDRESS.street}, {WAREHOUSE_ADDRESS.city}<br />
                                {WAREHOUSE_ADDRESS.state} {WAREHOUSE_ADDRESS.zip}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Register Package Form */}
                      <div className="p-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 text-indigo-600">
                          <Package size={24} />
                          <h4 className="text-xl font-black">Register Item</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Item Description</label>
                            <input 
                              type="text" 
                              className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                              placeholder="e.g. iPhone 15 Pro, Winter Jacket..."
                              value={cartItemName}
                              onChange={(e) => setCartItemName(e.target.value)}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                              <input 
                                type="number" 
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-bold"
                                placeholder="1"
                                min="1"
                                value={cartItemQuantity}
                                onChange={(e) => setCartItemQuantity(Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                              <input 
                                type="number" 
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-bold"
                                placeholder="0.5"
                                step="0.1"
                                value={cartItemWeight}
                                onChange={(e) => setCartItemWeight(Number(e.target.value))}
                              />
                            </div>
                          </div>

                          <button 
                            onClick={handleAdd}
                            disabled={!cartItemName}
                            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${
                              cartItemName 
                                ? 'bg-slate-900 text-white hover:bg-black shadow-xl' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Plus size={20} /> Add to Shipment
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: How it Works & Review */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* How it Works Bento Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Package size={20} />
                          </div>
                          <h5 className="font-black text-slate-900">1. Send Items</h5>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Pack your items and send them to our warehouse address.
                          </p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                            <ShoppingBag size={20} />
                          </div>
                          <h5 className="font-black text-slate-900">2. Shop Online</h5>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Use our address at checkout on Amazon, Flipkart, etc.
                          </p>
                        </div>
                      </div>

                      {/* Review & Finalize Card */}
                      <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3 text-indigo-600">
                            <CheckCircle2 size={24} />
                            <h4 className="text-xl font-black">3. Review Shipment</h4>
                          </div>
                          <div className="px-4 py-2 bg-indigo-50 rounded-2xl text-xs font-black text-indigo-600 border border-indigo-100">
                            {displayItems.filter(i => i.source === 'Warehouse' && !i.submitted).length} Items
                          </div>
                        </div>

                        {displayItems.filter(i => i.source === 'Warehouse' && !i.submitted).length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                              <Package size={40} strokeWidth={1} />
                            </div>
                            <p className="font-medium text-center max-w-[200px]">No items registered yet.</p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col">
                            <div className="space-y-3 mb-8">
                              {displayItems.filter(i => i.source === 'Warehouse' && !i.submitted).map((item) => (
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

                            <div className="mt-auto pt-8 border-t border-slate-100">
                              <div className="grid grid-cols-2 gap-4">
                                <button 
                                  onClick={() => setActiveTab('cart')}
                                  className="py-4 px-6 bg-slate-50 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                >
                                  <RefreshCw size={18} /> Save
                                </button>
                                <button 
                                  onClick={() => {
                                    setItems(prev => prev.map(i => 
                                      i.source === 'Warehouse' && !i.submitted 
                                        ? { ...i, submitted: true } 
                                        : i
                                    ));
                                    setActiveTab('cart');
                                    toast.success('Shipment submitted!');
                                  }}
                                  className="py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                                >
                                  <CheckCircle2 size={20} /> Submit
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Shop Sidebar */}
                      <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
                        {renderShopSidebar()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Header Section with Progress for Pickup */}
                  <div ref={pickupHeaderRef} className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-deep-blue flex items-center justify-center text-jiffex-orange shadow-xl shadow-deep-blue/20">
                        <Truck size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-deep-blue tracking-tight">Home Pickup</h2>
                        <p className="text-sm text-slate-500 font-medium">
                          {activePickupStep === 5 ? 'Booking Confirmed' : (hasActivePickup && !editingPickupId) ? 'Add items to your scheduled pickup' : 'Schedule an agent to collect from your home'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Indicator for Pickup */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { step: 1, label: 'Items' },
                        { step: 2, label: 'Schedule' },
                        { step: 3, label: 'Address' },
                        { step: 4, label: 'Review' },
                        { step: 5, label: 'Confirmation' }
                      ].map((s, idx) => (
                        <div key={s.step} className="flex items-center gap-2 shrink-0">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all ${
                            (activePickupStep === 5 && s.step === 5) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' :
                            activePickupStep === s.step ? 'bg-jiffex-orange/10 border-jiffex-orange text-jiffex-orange' : 
                            activePickupStep > s.step ? 'bg-deep-blue text-white border-deep-blue' :
                            'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              (activePickupStep === 5 && s.step === 5) ? 'bg-white text-emerald-600' :
                              activePickupStep === s.step ? 'bg-jiffex-orange text-white' : 
                              activePickupStep > s.step ? 'bg-white text-deep-blue' :
                              'bg-slate-200 text-slate-500'
                            }`}>
                              {(activePickupStep > s.step || (activePickupStep === 5 && s.step === 5)) ? <CheckCircle2 size={12} /> : s.step}
                            </div>
                            <span className="text-[11px] font-black whitespace-nowrap">{s.label}</span>
                          </div>
                          {idx < 4 && <div className={`w-4 h-0.5 rounded-full ${activePickupStep > s.step ? 'bg-deep-blue' : 'bg-slate-100'}`} />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {(hasActivePickup && !editingPickupId && activePickupStep !== 5 && !isSchedulingNewPickup) ? (
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
                        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-indigo-600">
                              <Clock size={24} />
                              <h4 className="text-xl font-black">Pickup Details</h4>
                            </div>
                            <button 
                              onClick={() => {
                                const activePickup = appointments.find(a => a.status === 'Scheduled');
                                if (activePickup) {
                                  setEditingPickupId(activePickup.id);
                                  setPickupName(activePickup.name || '');
                                  setPickupPhone(activePickup.phone || '');
                                  setPickupAddress(activePickup.address || { street: '', apartment: '', city: '', state: '', zip: '' });
                                  setSelectedPickupDate(activePickup.date);
                                  setSelectedPickupTime(activePickup.time);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <Edit3 size={18} />
                            </button>
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
                      </div>

                      {/* Middle Column: Pickup Status & Items */}
                      <div className="lg:col-span-8 space-y-6">
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
                      <div className="lg:col-span-12 space-y-6">
                        {/* Step 1: What type of items are you sending? */}
                      {activePickupStep === 1 && (
                        <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${activePickupStep === 1 ? 'bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${activePickupStep === 1 ? 'bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10' : 'bg-deep-blue/5 text-deep-blue'}`}>
                                <Package size={24} />
                              </div>
                              <div>
                                <h4 className="text-xl font-black text-deep-blue">1. What type of items are you sending?</h4>
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {activePickupStep === 1 && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
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
                                        { id: 'Fits in a car', desc: 'Small boxes, luggage, less than 50kg', icon: <Car size={24} /> },
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
                                          <div className="relative z-10">
                                            <p className="text-base font-black text-slate-900">{v.id}</p>
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
                                      window.scrollTo(0, 0);
                                    }}
                                    className="w-full py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                  >
                                    Continue to Schedule <ArrowRight size={18} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Step 2: When should we arrive? */}
                      {activePickupStep === 2 && (
                        <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${activePickupStep === 2 ? 'bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${activePickupStep === 2 ? 'bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10' : 'bg-deep-blue/5 text-deep-blue'}`}>
                                <Clock size={24} />
                              </div>
                              <div>
                                <h4 className="text-xl font-black text-deep-blue">2. When should we arrive?</h4>
                                <p className="text-sm font-bold text-slate-400 mt-1">Choose your preferred date and time window.</p>
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {activePickupStep === 2 && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
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
                                        window.scrollTo(0, 0);
                                      }}
                                      className="flex-1 py-4 bg-white border border-slate-200 text-deep-blue rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                      <ArrowLeft size={18} /> Back
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setActivePickupStep(3);
                                        window.scrollTo(0, 0);
                                      }}
                                      className="flex-[2] py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                    >
                                      Continue to Address <ArrowRight size={18} />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                    {/* Step 3: Pickup details */}
                    {activePickupStep === 3 && (
                      <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${activePickupStep === 3 ? 'bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${activePickupStep === 3 ? 'bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10' : 'bg-deep-blue/5 text-deep-blue'}`}>
                              <MapPin size={24} />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-deep-blue">3. Pickup details</h4>
                              <p className="text-sm font-bold text-slate-400 mt-1">Where should our agent come? We'll confirm via SMS.</p>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {activePickupStep === 3 && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
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
                                      window.scrollTo(0, 0);
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
                                      window.scrollTo(0, 0);
                                    }}
                                    className="flex-[2] py-4 bg-deep-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
                                  >
                                    Continue to Review <ArrowRight size={18} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Step 4: Review your booking */}
                    {activePickupStep === 4 && (
                      <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${activePickupStep === 4 ? 'bg-white border-jiffex-orange/30 shadow-xl shadow-jiffex-orange/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${activePickupStep === 4 ? 'bg-deep-blue text-jiffex-orange shadow-lg shadow-deep-blue/10' : 'bg-deep-blue/5 text-deep-blue'}`}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-deep-blue">4. Review your booking</h4>
                          </div>
                        </div>

                        <AnimatePresence>
                          {activePickupStep === 4 && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
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
                                      Please sign in to schedule your pickup. You can review everything before confirming.
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-4">
                                  <button 
                                    onClick={() => {
                                      setActivePickupStep(3);
                                      window.scrollTo(0, 0);
                                    }}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-deep-blue rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                  >
                                    Edit Details
                                  </button>
                                  <button 
                                    onClick={editingPickupId ? saveEditedPickup : handleSchedulePickup}
                                    className="flex-[2] py-5 bg-jiffex-orange text-white rounded-[2rem] text-lg font-black hover:bg-amber-600 transition-all shadow-2xl shadow-jiffex-orange/20 flex items-center justify-center gap-3"
                                  >
                                    {editingPickupId ? 'Update Schedule' : (currentUser ? 'Confirm Booking' : 'Sign In to Confirm')}
                                  </button>
                                </div>
                                
                                {editingPickupId && (
                                  <button 
                                    onClick={() => {
                                      setEditingPickupId(null);
                                      setPickupPhone('');
                                      setPickupAddress({ street: '', apartment: '', city: '', state: '', zip: '' });
                                    }}
                                    className="w-full mt-4 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                                  >
                                    Cancel Editing
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Step 5: Booking confirmed */}
                    {activePickupStep === 5 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-2xl shadow-indigo-500/5 text-center space-y-10"
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
                            <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                              Your agent has been notified. Expect a call or SMS shortly to confirm the arrival window.
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
                              
                              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                                <Mail size={12} />
                                <span className="text-[10px] font-bold">Confirmation sent to your email</span>
                              </div>
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
                          {appointments.some(a => a.status === 'Scheduled') && (
                            <button 
                              onClick={() => {
                                setActivePickupStep(1);
                                window.scrollTo(0, 0);
                              }}
                              className="w-full max-w-xs py-5 bg-jiffex-orange text-white rounded-[2rem] text-lg font-black hover:bg-amber-600 transition-all shadow-2xl shadow-jiffex-orange/20 flex items-center justify-center gap-3"
                            >
                              <PlusCircle size={24} /> Add Items to Pickup
                            </button>
                          )}
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

                    {/* Info Card */}
                    {activePickupStep !== 5 && (
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-deep-blue shadow-sm flex-shrink-0">
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <h5 className="font-black text-deep-blue text-lg">Safe & Verified Agents</h5>
                          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                            All our pickup agents are background-verified and follow strict safety protocols. They will call you 30 minutes before arrival.
                          </p>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          )}

          {/* Item List Card - Visible in all tabs, but specific parts are conditional */}
          {mode !== 'Warehouse' && !((mode === 'Pickup') && (isCartEmpty || activePickupStep === 5)) && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
              {!mode && !hasAllAgentPickup && (
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
                              className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group items-center"
                            >
                              <div className="md:col-span-1">
                                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 overflow-hidden border border-slate-100">
                                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                                </div>
                              </div>
                              
                              <div className="md:col-span-4">
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

                              <div className="md:col-span-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</div>
                                <div className="text-xs font-bold text-indigo-600">
                                  {item.weight > 0 ? (
                                    <div className="flex flex-col">
                                      <span>{(item.weight / (item.quantity || 1)).toFixed(2)} kg</span>
                                      {(item.quantity || 1) > 1 && (
                                        <span className="text-[9px] text-slate-400 font-medium">
                                          Total: {item.weight.toFixed(2)} kg
                                        </span>
                                      )}
                                    </div>
                                  ) : 'TBD'}
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</div>
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

                              <div className="md:col-span-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
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
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                      <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                        Payment will be enabled once your scheduled agent pickup is completed and all items are received at our warehouse. This ensures a single consolidated shipment for you.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleCheckout}
                      className={`flex-1 py-5 px-8 rounded-2xl font-bold transition-all shadow-2xl flex items-center justify-center gap-2 group ${
                        appointments.some(a => a.status === 'Scheduled')
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                      }`}
                    >
                      {currentUser ? 'Checkout' : 'Sign in to Checkout'} <ArrowRight size={20} className={appointments.some(a => a.status === 'Scheduled') ? '' : 'group-hover:translate-x-1 transition-transform'} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shop Items for Pickup and Warehouse Pages */}
          {(mode === 'Pickup' || mode === 'Warehouse') && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                    <ShoppingBag className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Shop Items</h3>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">
                      Add essentials to your {mode === 'Pickup' ? 'pickup' : 'shipment'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeProducts.map((product) => {
                  const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
                  const itemCount = cartItem?.quantity || 0;
                  
                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative"
                    >
                      <AnimatePresence>
                        {itemCount > 0 && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-3 right-3 z-10 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white"
                          >
                            {itemCount}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3">
                          <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white/20">
                            <span className="text-xs font-bold text-slate-900">${product.price}</span>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{product.name}</h4>
                      <p className="text-[10px] text-slate-500 mb-4 line-clamp-2 leading-relaxed">Premium quality {product.category.toLowerCase()} item for your home.</p>
                      
                      {itemCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => removeStoreItem(product.name)}
                            className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                            <ShoppingBag size={14} /> Added ({itemCount})
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
                          onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image, quantity: 1 }, 'Store')}
                          className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> Add to {mode === 'Pickup' ? 'Pickup' : 'Shipment'}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
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
                  <span className="font-bold text-slate-900">{displayItems.length}</span>
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
                    <span className="text-xl font-black text-indigo-600">${displayItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0)}</span>
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

    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900"><span className="text-indigo-600">Shop</span></h2>
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
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm ${
                  showFilters || minPrice !== '' || maxPrice !== ''
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
                {(minPrice !== '' || maxPrice !== '') && (
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                )}
              </button>
              <div className="relative group">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-slate-600 cursor-pointer"
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

        <div className="space-y-4">
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Range ($)</label>
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
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 leading-tight truncate flex-1 mr-2">{product.name}</h3>
                    <span className="text-indigo-600 font-bold shrink-0">${product.price}</span>
                  </div>
                  <div className="flex flex-col gap-1 mb-4">
                    <p className="text-[10px] text-slate-500">Weight: {product.weight} kg</p>
                    {product.estimatedDelivery && (
                      <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Calendar size={10} /> Ready by: {product.estimatedDelivery}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto">
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
                          onClick={() => addItem({ 
                            name: product.name, 
                            weight: product.weight, 
                            price: product.price, 
                            image: product.image,
                            estimatedDelivery: product.estimatedDelivery 
                          }, 'Store')}
                          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addItem({ 
                          name: product.name, 
                          weight: product.weight, 
                          price: product.price, 
                          image: product.image,
                          estimatedDelivery: product.estimatedDelivery 
                        }, 'Store')}
                        className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={16} /> Add to Shipment
                      </button>
                    )}
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
      return (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <CheckoutProgressTracker />
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
              onClick={() => { navigateTo('history'); setIsPaid(false); setOrderId(null); }}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
            >
              View Order History
            </button>
            <button 
              onClick={() => { navigateTo('home'); setIsPaid(false); setOrderId(null); }}
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
          <CheckoutProgressTracker />
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
                <span className="text-white font-medium">${(totalWeight * (SHIPPING_RATES[address.country] || 10)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Items Cost</span>
                <span className="text-white font-medium">${cartItems.reduce((sum, i) => sum + (i.price || 0), 0).toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-800 my-4" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-indigo-400">${totalCost.toFixed(2)}</span>
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
                  onClick={() => navigateTo('send-options')}
                  className={`flex items-center gap-2 text-base lg:text-lg font-black transition-all px-4 lg:px-5 py-2.5 rounded-2xl border-2 ${
                    activeTab === 'send-options' || activeTab === 'pickup' || activeTab === 'warehouse'
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
                    className="btn-cta shadow-none py-1 px-3 text-xs"
                  >
                    Track
                  </button>
                </div>

                <button 
                  onClick={() => navigateTo('support')}
                  className={`text-sm lg:text-base font-medium transition-all ${activeTab === 'support' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Support
                </button>
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
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{currentUser.role}</span>
                      <span className="text-sm font-black text-slate-900 leading-none">{currentUser.name}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200"
                      title="Logout"
                    >
                      <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setLoginTriggerSource('default'); setShowLoginModal(true); }}
                    className="btn-cta flex items-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm"
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
                  <button 
                    onClick={() => { navigateTo('send-options'); setIsMobileMenuOpen(false); }}
                    className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'send-options' || activeTab === 'pickup' || activeTab === 'warehouse' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Send
                  </button>
                  <button 
                    onClick={() => { navigateTo('support'); setIsMobileMenuOpen(false); }}
                    className={`text-lg font-bold p-3 rounded-xl text-left transition-all ${activeTab === 'support' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Support
                  </button>
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
                        className="w-full btn-cta flex items-center justify-center gap-2 py-3"
                      >
                        <UserIcon size={20} />
                        <span>Sign In</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full p-3 rounded-xl text-left font-bold text-red-600 bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={20} />
                        <span>Logout</span>
                      </button>
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
                        className="btn-cta py-1.5 px-4 text-xs"
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
      <main className={`max-w-7xl mx-auto px-4 pb-20 ${activeTab === 'pickup' ? 'pt-0' : (activeTab === 'warehouse' || activeTab === 'store' ? 'pt-12' : 'pt-20')}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && HomeSection}
            {activeTab !== 'home' && activeTab !== 'pickup' && activeTab !== 'warehouse' && activeTab !== 'store' && <BackButton onClick={goBack} />}
            {activeTab === 'send-options' && SendSelectionPage}
            {activeTab === 'track' && TrackSection}
            {activeTab === 'pickup' && renderUnifiedCartSection('Pickup')}
            {activeTab === 'warehouse' && renderUnifiedCartSection('Warehouse')}
            {activeTab === 'cart' && renderUnifiedCartSection()}
            {activeTab === 'notifications' && NotificationCenter}
            {activeTab === 'support' && SupportSection}
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
                setOrders={setOrders}
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
                    {loginTriggerSource === 'checkout' ? 'Almost There!' : loginTriggerSource === 'pickup' ? 'One Last Step!' : 'Welcome Back'}
                  </h2>
                  <p className="text-slate-500 mt-2">
                    {loginTriggerSource === 'checkout' 
                      ? 'Sign in to complete your secure checkout' 
                      : loginTriggerSource === 'pickup'
                      ? 'Sign in to schedule your agent pickup'
                      : 'Sign in to continue your shipment'}
                  </p>
                </div>
                <Login onSuccess={(email) => {
                  setGuestEmail(email);
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
