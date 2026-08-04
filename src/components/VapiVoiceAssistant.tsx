import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, Minimize2, Radio, AlertCircle, CheckCircle2, Navigation, ShoppingBag, Truck, PackageSearch, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { SHIPPING_RATES, STORE_PRODUCTS } from '../constants';

const VAPI_PUBLIC_KEY = '0155606e-3371-42c1-8c6d-2f770bfccd59';
const VAPI_AGENT_ID = 'dacb9850-8ae8-4a49-83ab-745fb1863a0f';

export interface VapiVoiceAssistantProps {
  onCallStateChange?: (isConnecting: boolean, isConnected: boolean) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  currentUser?: any;
  orders?: any[];
  userAppointments?: any[];
  cartItems?: any[];
  storeProducts?: any[];
  addItem?: (item: any, source: 'Warehouse' | 'Pickup' | 'Store', force?: boolean) => Promise<void> | void;
  setItems?: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedOrderForDetails?: (order: any) => void;
  setShowLoginModal?: (show: boolean) => void;
  api?: any;
  shippingRates?: Record<string, number>;
  shippingDiscounts?: Record<string, number>;
  coupons?: any[];
  qCountry?: string;
  setQCountry?: (c: string) => void;
  qWeight?: number;
  setQWeight?: (w: number) => void;
  qMethod?: 'Standard' | 'Express';
  setQMethod?: (m: 'Standard' | 'Express') => void;
}

export const VapiVoiceAssistant: React.FC<VapiVoiceAssistantProps> = ({
  onCallStateChange,
  activeTab = 'home',
  setActiveTab,
  currentUser,
  orders = [],
  userAppointments = [],
  cartItems = [],
  storeProducts = [],
  addItem,
  setItems,
  setSelectedOrderForDetails,
  setShowLoginModal,
  api,
  shippingRates,
  shippingDiscounts,
  coupons = [],
  qCountry = 'USA',
  setQCountry,
  qWeight = 1,
  setQWeight,
  qMethod = 'Express',
  setQMethod
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [activeTranscript, setActiveTranscript] = useState<string>('');
  const [lastExecutedAction, setLastExecutedAction] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTranscriptRef = useRef<string>('');

  // Always keep latest props in ref so event callbacks never capture stale props or trigger re-subscriptions
  const propsRef = useRef({
    activeTab,
    setActiveTab,
    currentUser,
    orders,
    userAppointments,
    cartItems,
    storeProducts,
    addItem,
    setItems,
    setSelectedOrderForDetails,
    setShowLoginModal,
    api,
    shippingRates,
    shippingDiscounts,
    coupons,
    qCountry,
    setQCountry,
    qWeight,
    setQWeight,
    qMethod,
    setQMethod
  });

  useEffect(() => {
    propsRef.current = {
      activeTab,
      setActiveTab,
      currentUser,
      orders,
      userAppointments,
      cartItems,
      storeProducts,
      addItem,
      setItems,
      setSelectedOrderForDetails,
      setShowLoginModal,
      api,
      shippingRates,
      shippingDiscounts,
      coupons,
      qCountry,
      setQCountry,
      qWeight,
      setQWeight,
      qMethod,
      setQMethod
    };
  });

  // Track connection states in refs for async timeouts/closures
  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    isConnectedRef.current = isConnected;
    isConnectingRef.current = isConnecting;
  }, [isConnected, isConnecting]);

  const clearConnectionTimeout = () => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  };

  // Helper to normalize country names from voice input or tool calls
const normalizeCountryName = (input: string, availableRates: Record<string, number>, fallback: string = 'USA'): string => {
  if (!input) return fallback;
  const clean = input.trim().toLowerCase();
  
  if (clean === 'us' || clean === 'usa' || clean.includes('united states') || clean.includes('america')) return 'USA';
  if (clean === 'uk' || clean.includes('united kingdom') || clean.includes('britain') || clean.includes('england')) return 'UK';
  if (clean.includes('canada')) return 'Canada';
  if (clean.includes('australia') || clean === 'oz' || clean === 'aus') return 'Australia';
  if (clean.includes('uae') || clean.includes('emirates') || clean.includes('dubai') || clean.includes('abu dhabi')) return 'UAE';
  if (clean.includes('germany') || clean.includes('deutschland')) return 'Germany';
  if (clean.includes('singapore')) return 'Singapore';
  if (clean.includes('india') || clean.includes('bharat')) return 'India';

  const keys = Object.keys(availableRates);
  const matched = keys.find(k => k.toLowerCase() === clean || clean.includes(k.toLowerCase()) || k.toLowerCase().includes(clean));
  return matched || fallback;
};

// --- CORE TOOL / ACTION EXECUTION ENGINE ---
  const executeWebsiteAction = async (actionName: string, params: any = {}): Promise<any> => {
    console.log('[VAPI TOOL EXECUTION]', actionName, params);
    const p = propsRef.current;
    const action = actionName.toLowerCase().replace(/[^a-z0-9_]/g, '');

    // 1. Navigation Actions
    if (action.includes('navigate') || action.includes('goto') || action.includes('open_tab') || action === 'tab') {
      const target = (params.tab || params.page || params.destination || '').toLowerCase();
      let mappedTab = 'home';
      if (target.includes('store') || target.includes('shop') || target.includes('gift') || target.includes('product')) mappedTab = 'store';
      else if (target.includes('pickup') || target.includes('schedule') || target.includes('collect')) mappedTab = 'pickup';
      else if (target.includes('cart') || target.includes('basket') || target.includes('checkout')) mappedTab = 'cart';
      else if (target.includes('warehouse') || target.includes('storage')) mappedTab = 'warehouse';
      else if (target.includes('history') || target.includes('order') || target.includes('track')) mappedTab = 'history';
      else if (target.includes('support') || target.includes('help') || target.includes('contact') || target.includes('faq')) mappedTab = 'support';
      else if (target.includes('quote') || target.includes('rate') || target.includes('calc')) mappedTab = 'quote';
      else if (target.includes('account') || target.includes('profile')) mappedTab = 'account';

      if (p.setActiveTab) {
        p.setActiveTab(mappedTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setLastExecutedAction(`Navigated to ${mappedTab.toUpperCase()} tab`);
      toast.success(`Voice Assistant: Opened ${mappedTab.toUpperCase()} page`, {
        icon: <Navigation className="w-4 h-4 text-indigo-500" />
      });
      return { success: true, message: `Successfully navigated to ${mappedTab} page.` };
    }

    // 2. Track Order / Search Order in DB or state (get_shipment_status)
    if (action.includes('track') || action.includes('order_status') || action.includes('shipment_status') || action.includes('get_shipment_status') || action.includes('find_order')) {
      const orderId = (params.orderId || params.order_id || params.trackingId || params.tracking_id || params.id || params.trackingNumber || '').trim().toUpperCase();
      const phone = (params.phone || params.phoneNumber || params.number || '').trim();
      const orderList = p.orders || [];
      let foundOrder = orderList.find((o: any) => 
        (orderId && o.id?.toUpperCase() === orderId) || 
        (orderId && o.id?.toUpperCase().includes(orderId)) ||
        (orderId && o.tracking_number?.toUpperCase() === orderId)
      );

      if (!foundOrder) {
        try {
          const res = await fetch('/api/get_shipment_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, trackingId: orderId, phone })
          });
          if (res.ok) {
            const data = await res.json();
            return {
              success: true,
              status: data.status,
              trackingId: data.trackingId,
              orderId: data.orderId,
              estimatedDelivery: data.estimatedDelivery,
              customerName: data.customerName,
              message: `Shipment status for ${data.trackingId || data.orderId} is ${data.status}. Estimated delivery date is ${data.estimatedDelivery}.`
            };
          }
        } catch (e) {
          console.warn('[VAPI] /api/get_shipment_status lookup failed:', e);
        }
      }

      if (!foundOrder && p.api && orderId) {
        try {
          foundOrder = await p.api.trackOrder(orderId);
        } catch (e) {
          console.warn('[VAPI] DB trackOrder lookup failed:', e);
        }
      }

      if (foundOrder) {
        if (p.setSelectedOrderForDetails) {
          p.setSelectedOrderForDetails(foundOrder);
        }
        if (p.setActiveTab) {
          p.setActiveTab('history');
        }
        setLastExecutedAction(`Found order ${foundOrder.id}`);
        toast.success(`Voice Assistant: Located Order ${foundOrder.id}`);
        return {
          success: true,
          orderId: foundOrder.id,
          trackingId: foundOrder.tracking_number || foundOrder.trackingNumber || foundOrder.id,
          status: foundOrder.status || foundOrder.shipment_status || 'In Transit',
          estimatedDelivery: foundOrder.shipping_date || foundOrder.shippingDate || '2026-08-08',
          totalCost: foundOrder.totalCost || foundOrder.total_cost,
          destination: foundOrder.destination?.country || 'International',
          itemCount: foundOrder.items?.length || 0,
          message: `Order ${foundOrder.id} status is ${foundOrder.status || 'In Transit'}, estimated delivery is ${foundOrder.shipping_date || '2026-08-08'}.`
        };
      } else {
        return {
          success: false,
          status: 'Unknown',
          trackingId: orderId || '123456789',
          estimatedDelivery: '2026-08-08',
          message: orderId ? `Could not locate order or shipment ID ${orderId}. Please verify the number.` : 'Please specify a valid order ID, tracking ID, or phone number.'
        };
      }
    }

    // 3. Get User Orders list
    if (action.includes('my_orders') || action.includes('list_orders') || action.includes('get_orders')) {
      if (p.setActiveTab) p.setActiveTab('history');
      const userOrderList = (p.orders && p.orders.length > 0) ? p.orders : [];
      setLastExecutedAction(`Listed ${userOrderList.length} orders`);
      toast.info(`Voice Assistant: Displaying ${userOrderList.length} orders on screen`);
      
      const summaryList = userOrderList.slice(0, 3).map((o: any) => `${o.id} (${o.status || 'Active'})`).join(', ');
      return {
        success: true,
        count: userOrderList.length,
        summary: summaryList,
        message: userOrderList.length > 0 
          ? `You have ${userOrderList.length} orders in total. Recent orders: ${summaryList}.`
          : 'You do not have any active orders right now.'
      };
    }

    // 4. Add Product to Cart / Store Search
    if (action.includes('add_to_cart') || action.includes('buy') || action.includes('add_item')) {
      const query = (params.productName || params.product || params.item || '').toLowerCase().trim();
      const catalog = (p.storeProducts && p.storeProducts.length > 0) ? p.storeProducts : STORE_PRODUCTS;
      
      const matched = catalog.find((prod: any) => prod.name.toLowerCase().includes(query) || query.includes(prod.name.toLowerCase()));
      if (matched && p.addItem) {
        await p.addItem({
          name: matched.name,
          category: matched.category,
          price: matched.price,
          weight: matched.weight || 0.5,
          quantity: params.quantity || 1,
          value: matched.price,
          image: matched.image
        }, 'Store', true);

        if (p.setActiveTab) p.setActiveTab('cart');
        setLastExecutedAction(`Added ${matched.name} to Cart`);
        toast.success(`Voice Assistant: Added ${matched.name} to cart`, {
          icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />
        });
        return {
          success: true,
          productName: matched.name,
          price: matched.price,
          message: `Added ${matched.name} (₹${matched.price}) to your cart.`
        };
      } else {
        return {
          success: false,
          message: query ? `Could not find "${query}" in our store catalog.` : 'Please specify a product name to add to cart.'
        };
      }
    }

    // 5. View or Clear Cart
    if (action.includes('view_cart') || action.includes('show_cart')) {
      if (p.setActiveTab) p.setActiveTab('cart');
      const cart = p.cartItems || [];
      const totalCost = cart.reduce((acc: number, i: any) => acc + (i.price || 0) * (i.quantity || 1), 0);
      setLastExecutedAction(`Opened Cart (${cart.length} items)`);
      toast.info(`Voice Assistant: Switched to Cart`);
      return {
        success: true,
        itemCount: cart.length,
        totalCost,
        message: `Your cart currently has ${cart.length} items totaling ₹${totalCost}.`
      };
    }

    if (action.includes('clear_cart') || action.includes('empty_cart')) {
      if (p.setItems) p.setItems([]);
      setLastExecutedAction('Cleared Cart');
      toast.success('Voice Assistant: Cart cleared');
      return { success: true, message: 'Your cart has been cleared.' };
    }

    // 6. Calculate Shipping Rate / Quick Quote
    if (action.includes('calculate') || action.includes('rate') || action.includes('shipping') || action.includes('quote') || action.includes('cost') || action.includes('price')) {
      const countryRaw = (params.country || params.destination || params.destinationCountry || params.countryName || params.targetCountry || params.to || params.toCountry || p.qCountry || 'USA').toString();
      
      let weightVal = parseFloat(String(params.weightKg || params.weight || params.weight_kg || params.weightInKg || params.kg || params.packageWeight || params.weightInKgs || ''));
      if (isNaN(weightVal) || weightVal <= 0) {
        weightVal = parseFloat(String(p.qWeight)) || 1;
      }

      const methodInput = (params.method || params.shippingMethod || params.deliveryMethod || params.type || params.service || p.qMethod || 'Express').toString().toLowerCase();
      const method: 'Standard' | 'Express' = methodInput.includes('standard') || methodInput.includes('economy') ? 'Standard' : 'Express';

      const availableRates = p.shippingRates || SHIPPING_RATES;
      const normalizedCountry = normalizeCountryName(countryRaw, availableRates, p.qCountry || 'USA');

      // Update Quick Quote UI form controls on screen immediately
      if (p.setQCountry) p.setQCountry(normalizedCountry);
      if (p.setQWeight) p.setQWeight(weightVal);
      if (p.setQMethod) p.setQMethod(method);

      // Perform exact Quick Quote formula from site
      const ratePerKg = availableRates[normalizedCountry] !== undefined ? availableRates[normalizedCountry] : 10;
      const methodMultiplier = method === 'Standard' ? 0.7 : 1.0;
      const rawQuote = weightVal * ratePerKg * methodMultiplier;

      const discountPercent = (p.shippingDiscounts && p.shippingDiscounts[normalizedCountry]) || 0;
      const discountAmount = rawQuote * (discountPercent / 100);
      const finalPriceInr = Math.max(0, rawQuote - discountAmount);
      const finalPriceUsd = (finalPriceInr / 83).toFixed(2);

      // Scroll to Quick Quote section or open home/quote
      const desktopQuoteEl = document.getElementById('desktop-quick-quote');
      if (desktopQuoteEl) {
        desktopQuoteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (p.setActiveTab) {
        p.setActiveTab('home');
      }

      const quoteMessage = `Quick Quote for ${weightVal} kg to ${normalizedCountry} via ${method} shipping: ₹${finalPriceInr.toFixed(2)} ($${finalPriceUsd} USD). Estimated delivery: ${method === 'Express' ? '5-7' : '10-14'} business days.${discountPercent > 0 ? ` Includes a ${discountPercent}% discount for ${normalizedCountry}!` : ''}`;

      setLastExecutedAction(`Quick Quote: ₹${finalPriceInr.toFixed(2)} (${weightVal}kg to ${normalizedCountry})`);
      toast.success(`Voice Assistant: Quick Quote ₹${finalPriceInr.toFixed(2)} for ${weightVal}kg to ${normalizedCountry}`, {
        icon: <Calculator className="w-4 h-4 text-amber-500" />
      });

      const ratesSummary = Object.entries(availableRates).map(([c, r]) => `${c}: ₹${r}/kg`).join(', ');

      const formattedPriceStr = `₹${Math.round(finalPriceInr).toLocaleString('en-IN')}`;
      const deliveryTimeStr = method === 'Express' ? '5–7 business days' : '10–14 business days';

      return {
        success: true,
        country: normalizedCountry,
        destinationCountry: normalizedCountry,
        price: formattedPriceStr,
        deliveryTime: deliveryTimeStr,
        currency: 'INR',
        weightKg: weightVal,
        deliveryMethod: method,
        ratePerKg: ratePerKg,
        rawCostInr: parseFloat(rawQuote.toFixed(2)),
        discountPercent: discountPercent,
        discountSavedInr: parseFloat(discountAmount.toFixed(2)),
        totalCostInr: parseFloat(finalPriceInr.toFixed(2)),
        totalCostUsd: parseFloat(finalPriceUsd),
        estimatedDeliveryDays: deliveryTimeStr,
        shippingRatesTable: ratesSummary,
        quoteSummary: quoteMessage,
        message: quoteMessage
      };
    }

    // 7. Schedule Pickup
    if (action.includes('pickup') || action.includes('schedule')) {
      if (p.setActiveTab) p.setActiveTab('pickup');
      setLastExecutedAction('Opened Home Pickup Booking');
      toast.success('Voice Assistant: Opened Home Pickup form', {
        icon: <Truck className="w-4 h-4 text-indigo-500" />
      });
      return { success: true, message: 'Opened the Home Pickup scheduling section.' };
    }

    // 8. Open Login Modal
    if (action.includes('login') || action.includes('signin') || action.includes('account_modal')) {
      if (p.setShowLoginModal) p.setShowLoginModal(true);
      setLastExecutedAction('Opened Sign In Modal');
      toast.info('Voice Assistant: Opened Sign In dialog');
      return { success: true, message: 'Opened the Sign In dialog for you.' };
    }

    // Fallback for any other detail or action request
    const currentRates = p.shippingRates || SHIPPING_RATES;
    const ratesSummary = Object.entries(currentRates).map(([c, r]) => `${c}: ₹${r}/kg`).join(', ');
    const userDetail = p.currentUser ? `User: ${p.currentUser.name} (${p.currentUser.email})` : 'User: Guest';
    const activeCartCount = p.cartItems?.length || 0;
    const activeOrderCount = p.orders?.length || 0;
    const currentQuoteInr = `₹${((p.qWeight || 1) * (currentRates[p.qCountry || 'USA'] || 10) * (p.qMethod === 'Standard' ? 0.7 : 1.0)).toFixed(2)}`;

    const fallbackSummary = `Details: Quick quote for ${p.qWeight || 1}kg to ${p.qCountry || 'USA'} via ${p.qMethod || 'Express'} is ${currentQuoteInr}. Rates: ${ratesSummary}. ${userDetail}.`;

    return {
      success: true,
      action: actionName,
      user: userDetail,
      cartCount: activeCartCount,
      orderCount: activeOrderCount,
      currentQuickQuote: `${p.qWeight || 1}kg to ${p.qCountry || 'USA'}: ${currentQuoteInr}`,
      shippingRates: ratesSummary,
      quoteSummary: fallbackSummary,
      message: fallbackSummary
    };
  };

  // --- TRANSCRIPT INTENT PARSING FALLBACK ---
  const parseTranscriptIntent = (transcript: string) => {
    if (!transcript || transcript === lastProcessedTranscriptRef.current) return;
    const lower = transcript.toLowerCase().trim();

    if (lower.length < 3) return;

    // Quick Quote / Rate calculation intent parsing
    const isQuoteQuery = lower.includes('quote') || lower.includes('rate') || lower.includes('cost') || lower.includes('price') || lower.includes('how much') || lower.includes('calculate');

    if (isQuoteQuery) {
      let matchedCountry: string | null = null;
      if (lower.includes('usa') || lower.includes('us') || lower.includes('united states') || lower.includes('america')) matchedCountry = 'USA';
      else if (lower.includes('uk') || lower.includes('united kingdom') || lower.includes('britain') || lower.includes('england')) matchedCountry = 'UK';
      else if (lower.includes('canada')) matchedCountry = 'Canada';
      else if (lower.includes('australia') || lower.includes('oz') || lower.includes('aus')) matchedCountry = 'Australia';
      else if (lower.includes('uae') || lower.includes('emirates') || lower.includes('dubai') || lower.includes('abu dhabi')) matchedCountry = 'UAE';
      else if (lower.includes('germany') || lower.includes('deutschland')) matchedCountry = 'Germany';
      else if (lower.includes('singapore')) matchedCountry = 'Singapore';
      else if (lower.includes('india') || lower.includes('bharat')) matchedCountry = 'India';

      const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilo|gram|g|lb|lbs)?/i);
      let parsedWeight: number | undefined = undefined;
      if (weightMatch && weightMatch[1]) {
        const num = parseFloat(weightMatch[1]);
        if (!isNaN(num) && num > 0) {
          parsedWeight = num;
        }
      }

      const method = lower.includes('standard') || lower.includes('economy') ? 'Standard' : 'Express';

      if (matchedCountry || parsedWeight !== undefined || lower.includes('quick quote')) {
        lastProcessedTranscriptRef.current = transcript;
        executeWebsiteAction('calculate_quote', {
          country: matchedCountry || propsRef.current.qCountry || 'USA',
          weightKg: parsedWeight !== undefined ? parsedWeight : (propsRef.current.qWeight || 1),
          method
        });
        return;
      }
    }

    const trackMatch = lower.match(/(?:track|status|where is)\b.*?(sh-[0-9a-z-]+|jf-[0-9a-z-]+|[0-9a-f]{8}-[0-9a-f]{4})/i);
    if (trackMatch && trackMatch[1]) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('track_order', { orderId: trackMatch[1] });
      return;
    }

    if (lower.includes('go to store') || lower.includes('open store') || lower.includes('show store') || lower.includes('show products') || lower.includes('buy gifts')) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('navigate_tab', { tab: 'store' });
      return;
    }
    if (lower.includes('go to cart') || lower.includes('open cart') || lower.includes('show my cart') || lower.includes('view cart')) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('navigate_tab', { tab: 'cart' });
      return;
    }
    if (lower.includes('my orders') || lower.includes('order history') || lower.includes('show my orders') || lower.includes('track shipment')) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('navigate_tab', { tab: 'history' });
      return;
    }
    if (lower.includes('schedule pickup') || lower.includes('book pickup') || lower.includes('home pickup')) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('navigate_tab', { tab: 'pickup' });
      return;
    }
    if (lower.includes('calculator') || lower.includes('quick quote') || lower.includes('check price')) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('navigate_tab', { tab: 'quote' });
      return;
    }
    if (lower.includes('support') || lower.includes('help') || lower.includes('contact')) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('navigate_tab', { tab: 'support' });
      return;
    }
    if (lower.includes('sign in') || lower.includes('login') || lower.includes('log in')) {
      lastProcessedTranscriptRef.current = transcript;
      executeWebsiteAction('open_login', {});
      return;
    }

    if (lower.includes('add') && (lower.includes('diya') || lower.includes('incense') || lower.includes('pouch') || lower.includes('elephant') || lower.includes('kalash') || lower.includes('lantern') || lower.includes('thali') || lower.includes('sweets') || lower.includes('chocolate'))) {
      lastProcessedTranscriptRef.current = transcript;
      let matchedProd = 'diya';
      if (lower.includes('incense')) matchedProd = 'incense';
      else if (lower.includes('pouch')) matchedProd = 'pouch';
      else if (lower.includes('elephant')) matchedProd = 'elephant';
      else if (lower.includes('kalash')) matchedProd = 'kalash';
      else if (lower.includes('lantern')) matchedProd = 'lantern';
      else if (lower.includes('thali')) matchedProd = 'thali';
      else if (lower.includes('sweets')) matchedProd = 'sweets';
      else if (lower.includes('chocolate')) matchedProd = 'chocolate';

      executeWebsiteAction('add_to_cart', { productName: matchedProd });
      return;
    }
  };

  // --- INITIALIZE VAPI ONCE ON MOUNT ---
  useEffect(() => {
    let vapi: Vapi | null = null;
    try {
      vapi = new Vapi(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        clearConnectionTimeout();
        setIsConnecting(false);
        isConnectingRef.current = false;
        setIsConnected(true);
        isConnectedRef.current = true;
        setIsExpanded(true);
        setErrorMessage(null);
        toast.success('Connected to JiffEX AI Voice Agent');
      });

      vapi.on('call-start-failed', (evt: any) => {
        clearConnectionTimeout();
        console.error('Vapi Call Start Failed:', evt);
        setIsConnecting(false);
        isConnectingRef.current = false;
        setIsConnected(false);
        isConnectedRef.current = false;
        const errMsg = evt?.error || 'Could not connect to Voice Agent';
        setErrorMessage(errMsg);
        toast.error(`Call failed: ${errMsg}`);
      });

      vapi.on('call-end', () => {
        clearConnectionTimeout();
        setIsConnecting(false);
        isConnectingRef.current = false;
        setIsConnected(false);
        isConnectedRef.current = false;
        setIsSpeaking(false);
        setVolumeLevel(0);
        setActiveTranscript('');
        toast.info('Voice Call Ended');
      });

      vapi.on('speech-start', () => setIsSpeaking(true));
      vapi.on('speech-end', () => setIsSpeaking(false));
      vapi.on('volume-level', (level: number) => setVolumeLevel(level));

      vapi.on('message', async (message: any) => {
        console.log('[VAPI MESSAGE RECEIVED]', message);

        const sendToolResponseToVapi = (fnName: string, execResult: any, toolCallId?: string) => {
          const resultStr = typeof execResult === 'string' ? execResult : JSON.stringify(execResult);
          
          if (toolCallId) {
            try {
              vapi.send({
                type: 'tool-calls-result',
                toolCallResult: {
                  toolCallId: toolCallId,
                  result: resultStr
                }
              });
            } catch (_) {}

            try {
              vapi.send({
                type: 'tool-calls-result',
                toolCallResults: [
                  {
                    toolCallId: toolCallId,
                    result: resultStr
                  }
                ]
              });
            } catch (_) {}
          }

          try {
            vapi.send({
              type: 'add-message',
              message: {
                role: 'tool',
                content: resultStr,
                ...(toolCallId ? { toolCallId } : {})
              }
            });
          } catch (_) {}

          try {
            vapi.send({
              type: 'add-message',
              message: {
                role: 'system',
                content: `Tool '${fnName}' result: ${execResult.quoteSummary || execResult.message || resultStr}`
              }
            });
          } catch (_) {}

          const textToSpeak = execResult.quoteSummary || execResult.message;
          if (textToSpeak) {
            try {
              if (vapiRef.current && typeof (vapiRef.current as any).say === 'function') {
                (vapiRef.current as any).say(textToSpeak);
              }
            } catch (_) {}
          }
        };

        if (message.type === 'tool-calls' || message.type === 'tool-call' || message.type === 'call-tool') {
          const toolList = message.toolWithToolCallList || message.toolCalls || message.toolCallList || (message.toolCall ? [message.toolCall] : []);
          for (const tc of toolList) {
            const fnName = tc.function?.name || tc.name || 'calculate_quote';
            let args = {};
            try {
              args = typeof tc.function?.arguments === 'string' 
                ? JSON.parse(tc.function.arguments) 
                : (tc.function?.arguments || tc.parameters || {});
            } catch (pErr) {
              args = {};
            }

            const execResult = await executeWebsiteAction(fnName, args);
            const toolCallId = tc.id || tc.toolCallId || tc.function?.id || message.toolCallId || message.id;
            sendToolResponseToVapi(fnName, execResult, toolCallId);
          }
        }

        if (message.type === 'function-call') {
          const fnName = message.functionCall?.name || message.name || 'calculate_quote';
          const args = message.functionCall?.parameters || message.parameters || {};
          const execResult = await executeWebsiteAction(fnName, args);
          const toolCallId = message.toolCallId || message.id;
          sendToolResponseToVapi(fnName, execResult, toolCallId);
        }

        if (message.type === 'transcript' && message.transcript) {
          setActiveTranscript(message.transcript);
          parseTranscriptIntent(message.transcript);
        }
      });

      vapi.on('error', (e: any) => {
        clearConnectionTimeout();
        console.error('Vapi Error:', e);
        setIsConnecting(false);
        isConnectingRef.current = false;
        setIsConnected(false);
        isConnectedRef.current = false;
        const errStr = typeof e === 'string' ? e : e?.message || e?.error || 'Voice service error';
        setErrorMessage(errStr);
        toast.error(`Voice Agent: ${errStr}`);
      });
    } catch (err) {
      console.error('Failed to initialize Vapi Web SDK:', err);
    }

    return () => {
      clearConnectionTimeout();
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (_) {}
        vapiRef.current = null;
      }
    };
  }, []); // Run ONLY ONCE on mount!

  // Sync state changes with parent callback
  useEffect(() => {
    onCallStateChange?.(isConnecting, isConnected);
  }, [isConnecting, isConnected, onCallStateChange]);

  // Call duration counter
  useEffect(() => {
    if (isConnected) {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  const startCall = async () => {
    setErrorMessage(null);
    setIsConnecting(true);
    isConnectingRef.current = true;
    setIsExpanded(true);
    setActiveTranscript('Connecting to JiffEX Voice Assistant...');

    // Ensure Vapi instance exists
    if (!vapiRef.current) {
      try {
        const vapi = new Vapi(VAPI_PUBLIC_KEY);
        vapiRef.current = vapi;
      } catch (initErr: any) {
        console.error('Failed to initialize Vapi instance:', initErr);
        setIsConnecting(false);
        isConnectingRef.current = false;
        toast.error('Failed to initialize Vapi Web SDK');
        return;
      }
    }

    try {
      // Connection timeout fallback (25s) using refs
      clearConnectionTimeout();
      connectionTimeoutRef.current = setTimeout(() => {
        if (isConnectingRef.current && !isConnectedRef.current) {
          console.warn('Vapi connection timed out');
          setIsConnecting(false);
          isConnectingRef.current = false;
          setIsConnected(false);
          isConnectedRef.current = false;
          if (vapiRef.current) {
            try {
              vapiRef.current.stop();
            } catch (_) {}
          }
          toast.error('Connection timed out. Please verify microphone permissions and try again.');
        }
      }, 25000);

      const p = propsRef.current;
      const currentRates = p.shippingRates || SHIPPING_RATES;
      const ratesSummary = Object.entries(currentRates).map(([c, r]) => `${c}: ₹${r}/kg`).join(', ');
      const discountsSummary = p.shippingDiscounts 
        ? Object.entries(p.shippingDiscounts).filter(([_, d]) => d > 0).map(([c, d]) => `${c}: ${d}% OFF`).join(', ')
        : 'None';

      const currentQuoteRate = currentRates[p.qCountry || 'USA'] || 10;
      const currentMultiplier = p.qMethod === 'Standard' ? 0.7 : 1.0;
      const currentRaw = (p.qWeight || 1) * currentQuoteRate * currentMultiplier;
      const currentDiscount = (p.shippingDiscounts && p.shippingDiscounts[p.qCountry || 'USA']) || 0;
      const currentFinalInr = Math.max(0, currentRaw - (currentRaw * (currentDiscount / 100)));

      await vapiRef.current.start(VAPI_AGENT_ID, {
        variableValues: {
          userName: p.currentUser?.name || 'Customer',
          userEmail: p.currentUser?.email || 'Guest',
          activeTab: p.activeTab,
          cartItemCount: p.cartItems?.length || 0,
          orderCount: p.orders?.length || 0,
          recentOrders: p.orders?.slice(0, 3).map((o: any) => o.id).join(', ') || '',
          quickQuoteCountry: p.qCountry || 'USA',
          quickQuoteWeightKg: String(p.qWeight || 1),
          quickQuoteMethod: p.qMethod || 'Express',
          quickQuoteCalculatedInr: `₹${currentFinalInr.toFixed(2)}`,
          shippingRatesTable: ratesSummary,
          activeShippingDiscounts: discountsSummary,
          rateCardContext: `Rate Card: ${ratesSummary}. Discounts: ${discountsSummary}`
        }
      });
    } catch (err: any) {
      clearConnectionTimeout();
      console.error('Failed to start Vapi call:', err);
      setIsConnecting(false);
      isConnectingRef.current = false;
      setIsConnected(false);
      isConnectedRef.current = false;
      toast.error(`Could not initiate call: ${err?.message || 'Check microphone or network'}`);
    }
  };

  // Expose global event handler for external voice triggers
  useEffect(() => {
    const handleTrigger = () => {
      if (!isConnectedRef.current && !isConnectingRef.current) {
        startCall();
      } else {
        setIsExpanded(true);
      }
    };

    window.addEventListener('jiffex-start-vapi-call', handleTrigger);
    return () => {
      window.removeEventListener('jiffex-start-vapi-call', handleTrigger);
    };
  }, []);

  const stopCall = () => {
    clearConnectionTimeout();
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.error('Error stopping call:', err);
      }
    }
    setIsConnecting(false);
    isConnectingRef.current = false;
    setIsConnected(false);
    isConnectedRef.current = false;
  };

  const toggleMute = () => {
    if (vapiRef.current && isConnected) {
      const nextMuteState = !isMuted;
      vapiRef.current.setMuted(nextMuteState);
      setIsMuted(nextMuteState);
      toast.info(nextMuteState ? 'Microphone Muted' : 'Microphone Active');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[250]">
      <AnimatePresence>
        {/* Expanded Modal View */}
        {isExpanded && (isConnected || isConnecting) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            className="w-[360px] sm:w-[400px] bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-2xl border border-slate-800 backdrop-blur-xl relative overflow-hidden mb-4"
          >
            {/* Background glowing aura */}
            <div
              className={`absolute inset-0 bg-gradient-to-tr transition-all duration-700 pointer-events-none opacity-20 ${
                isSpeaking ? 'from-indigo-500 via-purple-500 to-emerald-400' : 'from-indigo-600 to-slate-900'
              }`}
            />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                    <Sparkles size={20} className={isSpeaking ? 'animate-spin' : ''} />
                  </div>
                  {isConnected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white tracking-wide">JiffEX AI Voice Agent</h4>
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                    {isConnecting && <span className="text-amber-400 animate-pulse">Connecting...</span>}
                    {isConnected && (
                      <>
                        <Radio size={12} className="text-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 font-bold">{formatTime(callDuration)}</span>
                        <span>• Active Call</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </div>

            {/* Central Animated Orb Visualizer */}
            <div className="relative z-10 my-6 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-28 h-28">
                {/* Ripple Rings */}
                <motion.div
                  animate={{
                    scale: isSpeaking ? [1, 1.3, 1] : [1, 1.05, 1],
                    opacity: isSpeaking ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2],
                  }}
                  transition={{ repeat: Infinity, duration: isSpeaking ? 1 : 2.5 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 blur-xl"
                />

                {/* Main Orb */}
                <motion.div
                  animate={{
                    scale: 1 + volumeLevel * 0.5,
                  }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg border-2 border-white/20 relative z-10"
                >
                  <Volume2
                    size={32}
                    className={`text-white transition-transform ${isSpeaking ? 'scale-110' : 'scale-90 opacity-80'}`}
                  />
                </motion.div>
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4">
                {isSpeaking ? 'Agent Speaking...' : isConnected ? 'Listening & Controlling Site...' : 'Connecting...'}
              </p>

              {/* Action Banner Pill */}
              {lastExecutedAction && (
                <div className="mt-3 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>{lastExecutedAction}</span>
                </div>
              )}

              {/* Error Alert Display */}
              {errorMessage && (
                <div className="mt-3 px-3.5 py-2 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-300 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Transcript Display */}
              {activeTranscript && !errorMessage && (
                <div className="mt-4 px-4 py-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 max-w-xs text-center">
                  <p className="text-xs text-slate-300 font-medium italic leading-relaxed line-clamp-2">
                    "{activeTranscript}"
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action Badges */}
            <div className="relative z-10 grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => executeWebsiteAction('navigate_tab', { tab: 'store' })}
                className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShoppingBag size={12} className="text-indigo-400" /> Open Store
              </button>
              <button
                onClick={() => executeWebsiteAction('navigate_tab', { tab: 'history' })}
                className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <PackageSearch size={12} className="text-emerald-400" /> My Orders
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 flex items-center justify-center gap-4 pt-1">
              <button
                onClick={toggleMute}
                disabled={!isConnected}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={stopCall}
                className="px-6 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <PhoneOff size={18} /> End Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button - Compact Phone Icon */}
      {(!isExpanded || (!isConnected && !isConnecting)) && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isConnected || isConnecting) {
              setIsExpanded(true);
            } else {
              startCall();
            }
          }}
          title={
            isConnected
              ? `Voice Call Active (${formatTime(callDuration)})`
              : isConnecting
              ? 'Connecting...'
              : 'AI Voice Assistant'
          }
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer border text-white ${
            isConnected
              ? 'bg-slate-900 border-emerald-500 shadow-emerald-500/20'
              : isConnecting
              ? 'bg-amber-500 border-amber-400 animate-pulse'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 border-indigo-400/40 hover:shadow-indigo-500/40'
          }`}
        >
          {isConnecting ? (
            <Sparkles size={22} className="animate-spin text-white" />
          ) : isConnected ? (
            <Radio size={22} className="animate-pulse text-emerald-400" />
          ) : (
            <Phone size={22} className="text-white hover:rotate-12 transition-transform" />
          )}

          {isConnected && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
          )}
        </motion.button>
      )}
    </div>
  );
};
