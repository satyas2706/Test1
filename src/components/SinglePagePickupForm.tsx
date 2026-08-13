import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  Package, 
  ShoppingBag, 
  Box, 
  Boxes, 
  FileText, 
  Clock, 
  Calendar, 
  MapPin, 
  Globe, 
  User as UserIcon, 
  Mail, 
  Info, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  ArrowRight, 
  Sparkles,
  Store,
  Lock,
  X,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES, PICKUP_SLOTS } from '../constants';

interface SinglePagePickupFormProps {
  pickupItemType: string;
  setPickupItemType: (type: string) => void;
  pickupVehicleType: string;
  setPickupVehicleType: (weight: string) => void;
  pickupEstimatedWeight: string;
  setPickupEstimatedWeight: (weight: string) => void;
  selectedPickupDate: string;
  setSelectedPickupDate: (date: string) => void;
  selectedPickupTime: string;
  setSelectedPickupTime: (time: string) => void;
  filteredPickupSlots: Array<{ date: string; times: string[] }>;
  pickupName: string;
  setPickupName: (name: string) => void;
  pickupPhone: string;
  setPickupPhone: (phone: string) => void;
  pickupEmail: string;
  setPickupEmail: (email: string) => void;
  pickupAddress: { street: string; city: string; state: string; zip: string };
  setPickupAddress: (addr: any) => void;
  pickupSpecialInstructions: string;
  setPickupSpecialInstructions: (val: string) => void;
  savePickupToProfile: boolean;
  setSavePickupToProfile: (val: boolean) => void;
  pickupDestination: { fullName: string; phone: string; email?: string; addressLine1: string; city: string; state: string; zipCode: string; country: string };
  setPickupDestination: (addr: any) => void;
  provideDestinationLater: boolean;
  setProvideDestinationLater: (val: boolean) => void;
  pickupConsolidationOption: 'shop_and_ship' | 'pickup_only' | null;
  setPickupConsolidationOption: (opt: 'shop_and_ship' | 'pickup_only' | null) => void;
  shopItemsShippingDestination: 'home' | 'warehouse';
  setShopItemsShippingDestination: (dest: 'home' | 'warehouse') => void;
  hasShopItems: boolean;
  handleSchedulePickup: () => void;
  currentUser: any;
  shippingRates: Record<string, number>;
  shippingDiscounts: Record<string, number>;
  savePickupProfileToDb?: () => void;
  navigateTo?: (tab: string) => void;
}

export const SinglePagePickupForm: React.FC<SinglePagePickupFormProps> = ({
  pickupItemType,
  setPickupItemType,
  pickupVehicleType,
  setPickupVehicleType,
  pickupEstimatedWeight,
  setPickupEstimatedWeight,
  selectedPickupDate,
  setSelectedPickupDate,
  selectedPickupTime,
  setSelectedPickupTime,
  filteredPickupSlots,
  pickupName,
  setPickupName,
  pickupPhone,
  setPickupPhone,
  pickupEmail,
  setPickupEmail,
  pickupAddress,
  setPickupAddress,
  pickupSpecialInstructions,
  setPickupSpecialInstructions,
  savePickupToProfile,
  setSavePickupToProfile,
  pickupDestination,
  setPickupDestination,
  provideDestinationLater,
  setProvideDestinationLater,
  pickupConsolidationOption,
  setPickupConsolidationOption,
  shopItemsShippingDestination,
  setShopItemsShippingDestination,
  hasShopItems,
  handleSchedulePickup,
  currentUser,
  shippingRates,
  shippingDiscounts,
  savePickupProfileToDb,
  navigateTo
}) => {
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showProhibitedModal, setShowProhibitedModal] = useState(false);
  const [dateStartIndex, setDateStartIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const reviewRef = React.useRef<HTMLDivElement>(null);

  const forceScrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    if (reviewRef.current) {
      reviewRef.current.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    }

    // Scroll any parent overflowing containers
    let parent = reviewRef.current?.parentElement;
    while (parent) {
      if (parent.scrollTop > 0) {
        parent.scrollTop = 0;
      }
      parent = parent.parentElement;
    }
  }, []);

  React.useLayoutEffect(() => {
    if (isReviewing) {
      forceScrollToTop();
      const t1 = setTimeout(forceScrollToTop, 20);
      const t2 = setTimeout(forceScrollToTop, 80);
      const t3 = setTimeout(forceScrollToTop, 200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isReviewing, forceScrollToTop]);

  // Sync dateStartIndex when selectedPickupDate changes
  React.useEffect(() => {
    if (selectedPickupDate && filteredPickupSlots.length > 0) {
      const idx = filteredPickupSlots.findIndex(s => s.date === selectedPickupDate);
      if (idx >= 0) {
        const page = Math.floor(idx / 7) * 7;
        setDateStartIndex(page);
      }
    }
  }, [selectedPickupDate, filteredPickupSlots]);

  // Helper for IST time check
  const getISTTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
  };
  const istNow = getISTTime();
  const istDateStr = istNow.toISOString().split('T')[0];

  // Price estimate calculation
  let minWeight = 1;
  let maxWeight = 5;
  let isMoreThan20 = false;

  if (pickupEstimatedWeight) {
    if (pickupEstimatedWeight.includes('Less than 5') || pickupEstimatedWeight.includes('Under 5') || pickupEstimatedWeight.includes('1-5')) {
      minWeight = 1;
      maxWeight = 5;
    } else if (pickupEstimatedWeight.includes('5 to 20') || pickupEstimatedWeight.includes('5–20') || pickupEstimatedWeight.includes('5-20') || pickupEstimatedWeight.includes('5-15') || pickupEstimatedWeight.includes('5 to 15')) {
      minWeight = 5;
      maxWeight = 20;
    } else if (pickupEstimatedWeight.includes('More than 20') || pickupEstimatedWeight.includes('Over 20') || pickupEstimatedWeight.includes('15-50') || pickupEstimatedWeight.includes('20+')) {
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
  const rawRate = shippingRates[targetCountry] || 12;
  const rate = rawRate < 100 ? rawRate * 60 : rawRate;
  const discountPercent = shippingDiscounts[targetCountry] || 0;

  const rawMinQuote = minWeight * rate;
  const rawMaxQuote = maxWeight * rate;

  const minDiscount = rawMinQuote * (discountPercent / 100);
  const maxDiscount = rawMaxQuote * (discountPercent / 100);

  const finalMin = Math.max(0, rawMinQuote - minDiscount);
  const finalMax = Math.max(0, rawMaxQuote - maxDiscount);

  // Form completion validation helper
  const isPickupAddressComplete = Boolean(
    pickupName && pickupName.trim() !== '' &&
    pickupPhone && pickupPhone.trim().length === 10 &&
    pickupAddress.street && pickupAddress.street.trim() !== '' &&
    pickupAddress.city && pickupAddress.city.trim() !== '' &&
    pickupAddress.state && pickupAddress.state.trim() !== '' &&
    pickupAddress.zip && pickupAddress.zip.trim() !== ''
  );

  const isScheduleComplete = Boolean(
    selectedPickupDate && selectedPickupTime
  );

  const isDestinationComplete = Boolean(
    provideDestinationLater || (
      pickupDestination.fullName && pickupDestination.fullName.trim() !== '' &&
      pickupDestination.phone && pickupDestination.phone.trim() !== '' &&
      pickupDestination.addressLine1 && pickupDestination.addressLine1.trim() !== '' &&
      pickupDestination.city && pickupDestination.city.trim() !== '' &&
      pickupDestination.state && pickupDestination.state.trim() !== '' &&
      pickupDestination.zipCode && pickupDestination.zipCode.trim() !== ''
    )
  );

  const isStoreOptionSelected = Boolean(pickupConsolidationOption !== null && pickupConsolidationOption !== undefined);

  const isFormComplete = isPickupAddressComplete && isScheduleComplete && isDestinationComplete && isStoreOptionSelected;

  // Comprehensive Form Validation and Submission
  const validateAndProceedToReview = () => {
    if (!pickupName || !pickupName.trim()) {
      toast.error('Please enter your full name in the Pickup Address section.');
      return;
    }
    if (!pickupPhone || pickupPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile phone number for pickup.');
      return;
    }
    if (!pickupAddress.street || !pickupAddress.street.trim()) {
      toast.error('Please enter street address for pickup.');
      return;
    }
    if (!pickupAddress.city || !pickupAddress.city.trim()) {
      toast.error('Please enter city for pickup address.');
      return;
    }
    if (!pickupAddress.state || !pickupAddress.state.trim()) {
      toast.error('Please enter state for pickup address.');
      return;
    }
    if (!pickupAddress.zip || !pickupAddress.zip.trim()) {
      toast.error('Please enter PIN code for pickup address.');
      return;
    }

    if (!selectedPickupDate) {
      toast.error('Please select a pickup date.');
      return;
    }
    if (!selectedPickupTime) {
      toast.error('Please select a pickup time slot.');
      return;
    }

    if (!provideDestinationLater) {
      if (!pickupDestination.fullName || !pickupDestination.fullName.trim()) {
        toast.error('Please enter receiver full name in Destination details or check "I will provide details later".');
        return;
      }
      if (!pickupDestination.phone || !pickupDestination.phone.trim()) {
        toast.error('Please enter receiver phone number in Destination details.');
        return;
      }
      if (!pickupDestination.addressLine1 || !pickupDestination.addressLine1.trim()) {
        toast.error('Please enter destination street address.');
        return;
      }
      if (!pickupDestination.city || !pickupDestination.city.trim()) {
        toast.error('Please enter destination city.');
        return;
      }
      if (!pickupDestination.state || !pickupDestination.state.trim()) {
        toast.error('Please enter destination state/region.');
        return;
      }
      if (!pickupDestination.zipCode || !pickupDestination.zipCode.trim()) {
        toast.error('Please enter destination ZIP / postal code.');
        return;
      }
    }

    if (!pickupConsolidationOption) {
      toast.error('Please select whether you want to buy items from store or pick up from home.');
      return;
    }

    if (savePickupToProfile && currentUser && savePickupProfileToDb) {
      savePickupProfileToDb();
    }

    setIsReviewing(true);
    forceScrollToTop();
  };

  if (isReviewing) {
    return (
      <div ref={reviewRef} className="space-y-6 pb-12 max-w-3xl mx-auto">
        {/* Page Hero / Header Banner */}
        <div className="bg-gradient-to-r from-[#0A142F] to-[#12224A] text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-amber-500/30">
                <Sparkles size={11} /> Step 2 of 2: Review &amp; Confirm
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Schedule a Home Pickup</h2>
              <p className="text-slate-300 text-xs font-medium">
                Review your pickup details below and confirm your doorstep collection.
              </p>
            </div>
          </div>
        </div>

        {/* Review Details Card */}
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 text-slate-800 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CheckCircle2 size={20} className="text-amber-500 shrink-0" />
            <h3 className="text-base font-black text-[#0A142F]">Review Your Pickup Details</h3>
          </div>
          
          {/* Section 1: Shipment & Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/90 rounded-xl border border-slate-100">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shipment Category</span>
              <span className="text-sm font-extrabold text-[#0A142F] block">
                {pickupItemType === 'Everyday Items' || !pickupItemType
                  ? 'Packages & Parcels'
                  : (pickupItemType === 'Large/Furniture' ? 'Furniture' : pickupItemType)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                Approx. Weight: <strong className="text-slate-800">{pickupVehicleType || pickupEstimatedWeight || '5–20 kg'}</strong>
              </span>
            </div>

            <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Slot</span>
              <span className="text-sm font-extrabold text-amber-600 block">
                {selectedPickupDate ? (
                  <>
                    {new Date(selectedPickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {selectedPickupTime ? ` · ${selectedPickupTime}` : ''}
                  </>
                ) : 'Not selected'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">Agent Arrival Window</span>
            </div>
          </div>

          {/* Section 2: Collection Address (From) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
              <MapPin size={15} className="text-amber-500 shrink-0" />
              <h4 className="font-extrabold text-xs text-[#0A142F]">Collection Address (From)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Sender Name:</span>
                <span className="font-extrabold text-slate-900 block">{pickupName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Mobile Phone:</span>
                <span className="font-bold text-slate-800 block">{pickupPhone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-semibold block text-[10px]">Full Address:</span>
                <span className="font-medium text-slate-800 block leading-snug">
                  {pickupAddress.street}, {pickupAddress.city}, {pickupAddress.state} - {pickupAddress.zip}
                </span>
              </div>
              {pickupSpecialInstructions && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-semibold block text-[10px]">Instructions:</span>
                  <span className="font-medium text-slate-700 block italic">"{pickupSpecialInstructions}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Destination Details (To) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
              <Globe size={15} className="text-indigo-500 shrink-0" />
              <h4 className="font-extrabold text-xs text-[#0A142F]">Destination Details (To)</h4>
            </div>
            {provideDestinationLater ? (
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200/60 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <Info size={14} className="text-amber-600 shrink-0" />
                <span>Destination details will be provided later to agent during doorstep inspection.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Receiver Name:</span>
                  <span className="font-extrabold text-slate-900 block">{pickupDestination.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Receiver Phone:</span>
                  <span className="font-bold text-slate-800 block">{pickupDestination.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-semibold block text-[10px]">Address:</span>
                  <span className="font-medium text-slate-800 block leading-snug">
                    {pickupDestination.addressLine1}, {pickupDestination.city}, {pickupDestination.state} - {pickupDestination.zipCode}, {pickupDestination.country || 'USA'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Shipping Cost Quote */}
          <div className="p-3 bg-[#0A142F] text-white rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-[10px] text-amber-400 uppercase tracking-wider block">Estimated Quote</span>
              <span className="text-base font-black text-white tracking-tight">
                ₹{Math.round(finalMin).toLocaleString('en-IN')} – ₹{Math.round(finalMax).toLocaleString('en-IN')}{isMoreThan20 ? '+' : ''}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-1 bg-white/10 rounded-lg text-[10px] font-semibold text-slate-300">
                Pay at Doorstep
              </span>
            </div>
          </div>

          {/* Action Buttons: Edit Details / Confirm & Schedule */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setIsReviewing(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 active:scale-95"
            >
              <Pencil size={15} />
              Edit Details
            </button>

            <button
              type="button"
              onClick={() => {
                handleSchedulePickup();
              }}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 size={18} />
              Confirm & Schedule Pickup
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Hero / Header Banner */}
      <div className="bg-gradient-to-r from-[#0A142F] to-[#12224A] text-white p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Truck size={32} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-500/30">
                <Sparkles size={12} /> Doorstep Collection
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Schedule a Home Pickup</h2>
              <p className="text-slate-300 text-sm font-medium mt-1">
                Tell us what you're shipping, when you'd like pickup, and where we should collect it.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRequirementsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={16} className="text-amber-400" /> Documents Needed
            </button>
            <button
              onClick={() => setShowProhibitedModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle size={16} /> Prohibited Items
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* SECTION 1: Item Category & Weight */}
          <div className="p-5 md:p-6 rounded-3xl border bg-white border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0A142F] text-amber-400 flex items-center justify-center font-black shadow-md">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0A142F]">1. Package & Item Details</h3>
                <p className="text-xs text-slate-500 font-medium">Select item category and total weight</p>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">What are you shipping?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'Packages & Parcels', label: 'Packages & Parcels', icon: <Package size={16} /> },
                  { id: 'Furniture', label: 'Furniture', icon: <Box size={16} /> },
                  { id: 'Mixed Items', label: 'Mixed Items', icon: <Boxes size={16} /> },
                  { id: 'Documents', label: 'Documents', icon: <FileText size={16} /> }
                ].map(type => {
                  const isSelected = pickupItemType === type.id || 
                    (type.id === 'Packages & Parcels' && pickupItemType === 'Everyday Items') ||
                    (type.id === 'Furniture' && pickupItemType === 'Large/Furniture');
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setPickupItemType(type.id)}
                      className={`px-3 py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-center text-xs font-bold ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-black shadow-sm shadow-amber-500/10' 
                          : 'border-slate-100 bg-slate-50/80 text-slate-600 hover:border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <span className={isSelected ? 'text-amber-600' : 'text-slate-400'}>
                        {type.icon}
                      </span>
                      <span className="truncate">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weight Class Selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">Approximate Weight</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'Under 5 kg', label: 'Under 5 kg' },
                  { id: '5–20 kg', label: '5–20 kg' },
                  { id: 'Over 20 kg', label: 'Over 20 kg' }
                ].map(v => {
                  const isSelected = pickupVehicleType === v.id || pickupEstimatedWeight === v.id ||
                    (v.id === 'Under 5 kg' && (pickupVehicleType.includes('Less than 5') || pickupEstimatedWeight.includes('Less than 5') || pickupVehicleType.includes('Under 5') || pickupEstimatedWeight.includes('Under 5'))) ||
                    (v.id === '5–20 kg' && (pickupVehicleType.includes('5 to 20') || pickupVehicleType.includes('5-20') || pickupVehicleType.includes('5–20') || pickupEstimatedWeight.includes('5 to 20') || pickupEstimatedWeight.includes('5–20'))) ||
                    (v.id === 'Over 20 kg' && (pickupVehicleType.includes('More than 20') || pickupEstimatedWeight.includes('More than 20') || pickupVehicleType.includes('Over 20') || pickupEstimatedWeight.includes('Over 20')));

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setPickupVehicleType(v.id);
                        setPickupEstimatedWeight(v.id);
                      }}
                      className={`px-3 py-2.5 rounded-xl border-2 transition-all flex items-center justify-center text-center text-xs font-bold ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-black shadow-sm shadow-amber-500/10' 
                          : 'border-slate-100 bg-slate-50/80 text-slate-600 hover:border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: Pickup Schedule (Date & Time Window) */}
          <div className="p-5 md:p-6 rounded-3xl border bg-white border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0A142F] text-amber-400 flex items-center justify-center font-black shadow-md">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0A142F]">2. Pickup Schedule</h3>
                <p className="text-xs text-slate-500 font-medium">Select preferred collection date and arrival time slot</p>
              </div>
            </div>

            {/* Date Selector - 7 Dates Visible with Arrows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  Select Pickup Date
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">
                    Showing 7 dates
                  </span>
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      type="button"
                      disabled={dateStartIndex === 0}
                      onClick={() => setDateStartIndex(prev => Math.max(0, prev - 1))}
                      className={`p-1.5 rounded-lg border transition-all ${
                        dateStartIndex === 0 
                          ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-300' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-amber-50 hover:border-amber-400 active:scale-95 shadow-sm'
                      }`}
                      title="Previous date"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={dateStartIndex + 7 >= filteredPickupSlots.length}
                      onClick={() => setDateStartIndex(prev => Math.min(Math.max(0, filteredPickupSlots.length - 7), prev + 1))}
                      className={`p-1.5 rounded-lg border transition-all ${
                        dateStartIndex + 7 >= filteredPickupSlots.length 
                          ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-300' 
                          : 'border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-sm font-bold'
                      }`}
                      title="Next date"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 7 Dates Grid / Horizontal Container */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {filteredPickupSlots.slice(dateStartIndex, dateStartIndex + 7).map(slot => {
                  const d = new Date(slot.date);
                  const isSelected = selectedPickupDate === slot.date;
                  const isDatePast = slot.date < istDateStr || (slot.date === istDateStr && istNow.getHours() >= 19);

                  return (
                    <button
                      key={slot.date}
                      type="button"
                      disabled={isDatePast}
                      onClick={() => setSelectedPickupDate(slot.date)}
                      className={`py-2 px-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center relative ${
                        isDatePast ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100 text-slate-300' :
                        isSelected ? 'border-amber-500 bg-amber-50 text-amber-950 font-black shadow-sm' : 
                        'border-slate-100 bg-slate-50/80 text-slate-600 hover:border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className={`text-base sm:text-lg font-black leading-none ${isSelected ? 'text-amber-600' : 'text-slate-900'}`}>
                        {d.getDate()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 leading-none mt-1">
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Window Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Select Time Window</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PICKUP_SLOTS.find(s => s.date === selectedPickupDate)?.times.map(time => {
                  const isSelected = selectedPickupTime === time;
                  let isPast = false;
                  if (selectedPickupDate < istDateStr) {
                    isPast = true;
                  } else if (selectedPickupDate === istDateStr) {
                    const hourMap: Record<string, number> = {
                      '9–11 AM': 9, '11–1 PM': 11, '1–3 PM': 13,
                      '3–5 PM': 15, '5–7 PM': 17, '7–9 PM': 19
                    };
                    const startHour = hourMap[time];
                    if (istNow.getHours() >= startHour) isPast = true;
                  }

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isPast}
                      onClick={() => setSelectedPickupTime(time)}
                      className={`py-3 px-3 rounded-2xl border-2 transition-all text-center ${
                        isPast ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100 text-slate-300' :
                        isSelected ? 'border-amber-500 bg-amber-500/10 text-amber-900 font-black shadow-sm' : 
                        'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-black">{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: Sender Contact & Pickup Address */}
          <div className="p-6 md:p-8 rounded-[2.5rem] border bg-white border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#0A142F] text-amber-400 flex items-center justify-center font-black shadow-md">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0A142F]">3. Pickup Address (From)</h3>
                <p className="text-xs text-slate-500 font-medium">Where should our agent arrive for item collection?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Full Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full p-3.5 pl-11 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="Sender Full Name"
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Mobile Phone *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">+91</span>
                  <input 
                    type="tel" 
                    className="w-full p-3.5 pl-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
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

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    className="w-full p-3.5 pl-11 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="email@domain.com"
                    value={pickupEmail}
                    onChange={(e) => setPickupEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Street Address *</label>
                <input 
                  type="text" 
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                  placeholder="House No, Apartment, Street / Landmark"
                  value={pickupAddress.street}
                  onChange={(e) => setPickupAddress({...pickupAddress, street: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">City *</label>
                <input 
                  type="text" 
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                  placeholder="e.g. Mumbai"
                  value={pickupAddress.city}
                  onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">State *</label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="Maharashtra"
                    value={pickupAddress.state}
                    onChange={(e) => setPickupAddress({...pickupAddress, state: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">PIN Code *</label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="400001"
                    value={pickupAddress.zip}
                    onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Special Instructions for Agent (Optional)</label>
                <textarea 
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium min-h-[80px] text-sm text-slate-900"
                  placeholder="e.g. Call before coming, gate code 1234, fragile glass inside"
                  value={pickupSpecialInstructions}
                  onChange={(e) => setPickupSpecialInstructions(e.target.value)}
                />
              </div>

              {currentUser && (
                <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="save-pickup-profile-single"
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                    checked={savePickupToProfile}
                    onChange={(e) => setSavePickupToProfile(e.target.checked)}
                  />
                  <label htmlFor="save-pickup-profile-single" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    Save this pickup address to my profile for future orders
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Destination Address (To) */}
          <div className="p-5 md:p-6 rounded-3xl border bg-white border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0A142F] text-amber-400 flex items-center justify-center font-black shadow-md">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0A142F]">4. Destination Address (To)</h3>
                <p className="text-xs text-slate-500 font-medium">Where should we ship your package?</p>
              </div>
            </div>

            {/* Provide Later Option */}
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 flex items-center gap-3">
              <input 
                type="checkbox" 
                id="provide-destination-later-single"
                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600 shrink-0"
                checked={provideDestinationLater}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setProvideDestinationLater(isChecked);
                  if (isChecked) {
                    toast.info("You can provide the destination later. We'll contact you before shipping.");
                  }
                }}
              />
              <label htmlFor="provide-destination-later-single" className="text-xs font-bold text-slate-900 cursor-pointer select-none">
                I don't know the destination yet
              </label>
            </div>

            {provideDestinationLater ? (
              <div className="p-4 bg-amber-50/90 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <Clock size={18} className="shrink-0 text-amber-600" />
                  <p className="text-xs font-bold text-amber-900 leading-snug">
                    You can provide the destination later. We'll contact you before shipping.
                  </p>
                </div>
                <div className="space-y-1 pt-1">
                  <label className="block text-xs font-bold text-slate-700">Expected Destination Country (Optional)</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium text-xs text-slate-900"
                    value={pickupDestination.country || 'United States'}
                    onChange={(e) => setPickupDestination({...pickupDestination, country: e.target.value})}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Receiver Full Name *</label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="Recipient Full Name"
                    value={pickupDestination.fullName || ''}
                    onChange={(e) => setPickupDestination({...pickupDestination, fullName: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Receiver Phone Number *</label>
                  <input 
                    type="tel" 
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="Phone with country code"
                    value={pickupDestination.phone || ''}
                    onChange={(e) => setPickupDestination({...pickupDestination, phone: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Destination Street Address *</label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="Street Address, Building, Suite / Apt"
                    value={pickupDestination.addressLine1 || ''}
                    onChange={(e) => setPickupDestination({...pickupDestination, addressLine1: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Destination City *</label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                    placeholder="City"
                    value={pickupDestination.city || ''}
                    onChange={(e) => setPickupDestination({...pickupDestination, city: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">State / Region *</label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                      placeholder="State / Region"
                      value={pickupDestination.state || ''}
                      onChange={(e) => setPickupDestination({...pickupDestination, state: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">ZIP / Post Code *</label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900"
                      placeholder="Postal Code"
                      value={pickupDestination.zipCode || ''}
                      onChange={(e) => setPickupDestination({...pickupDestination, zipCode: e.target.value})}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Destination Country *</label>
                  <select 
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium text-sm text-slate-900 cursor-pointer"
                    value={pickupDestination.country || 'United States'}
                    onChange={(e) => setPickupDestination({...pickupDestination, country: e.target.value})}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Store Items Selection Card - Required to enable schedule home pickup */}
          <div className="p-6 md:p-8 rounded-[2.5rem] border bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-white border-amber-200/80 shadow-sm space-y-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 text-[11px] font-black uppercase tracking-wider mb-1 border border-amber-500/30">
                <Store size={14} className="text-amber-700" /> Store Items Option *
              </div>
              <h3 className="text-base md:text-lg font-black text-[#0A142F] leading-snug">
                Would you like to add items from the Jiffex Store to your shipment?
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                You can add return gifts and other store items, and we'll ship them together with the items we collect from your home.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {/* Option 1 */}
              <div
                onClick={() => {
                  if (setPickupConsolidationOption) {
                    setPickupConsolidationOption('shop_and_ship');
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  pickupConsolidationOption === 'shop_and_ship'
                    ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      pickupConsolidationOption === 'shop_and_ship' ? 'border-amber-600 bg-amber-500' : 'border-slate-300 bg-white'
                    }`}>
                      {pickupConsolidationOption === 'shop_and_ship' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                    </div>
                    <span className="font-black text-sm text-[#0A142F]">
                      Yes, I'd like to shop from Jiffex Store 🛒
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  I'll choose items from the store to add to my shipment.
                </p>
              </div>

              {/* Option 2 */}
              <div
                onClick={() => {
                  if (setPickupConsolidationOption) {
                    setPickupConsolidationOption('pickup_only');
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  pickupConsolidationOption === 'pickup_only'
                    ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      pickupConsolidationOption === 'pickup_only' ? 'border-amber-600 bg-amber-500' : 'border-slate-300 bg-white'
                    }`}>
                      {pickupConsolidationOption === 'pickup_only' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                    </div>
                    <span className="font-black text-sm text-[#0A142F]">
                      No, just pick up my items 🏠
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  I'll only be shipping the items collected from my home.
                </p>
              </div>
            </div>

            {!pickupConsolidationOption && (
              <p className="text-xs text-amber-800 font-semibold text-center pt-1 animate-pulse">
                ⚠️ Selection required: Please choose "Yes" or "No" above to enable schedule home pickup.
              </p>
            )}
          </div>

          {/* Schedule Home Pickup CTA (Direct CTA button, no surrounding box or details below) */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={validateAndProceedToReview}
              disabled={!isFormComplete}
              className={`w-full max-w-md mx-auto py-4 text-base rounded-2xl transition-all flex items-center justify-center gap-2 group ${
                isFormComplete 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-xl shadow-amber-500/20 active:scale-95' 
                  : 'bg-slate-200 text-slate-400 font-bold cursor-not-allowed opacity-70 shadow-none'
              }`}
            >
              Schedule Home Pickup
              <ArrowRight size={20} className={isFormComplete ? 'group-hover:translate-x-1 transition-transform' : ''} />
            </button>
          </div>

        </div>

      {/* MODAL 1: Requirements Modal */}
      <AnimatePresence>
        {showRequirementsModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowRequirementsModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">Customs Clearance Documents</h4>
                  <p className="text-xs text-slate-500">Standard paperwork for international dispatch</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-900">1. Government Photo ID</h5>
                  <p className="text-[11px] text-slate-500 mt-1">Aadhaar Card, Passport, Voter ID or Driving License copy matching the sender's name.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-900">2. Itemized Packing List</h5>
                  <p className="text-[11px] text-slate-500 mt-1">Simple written list detailing item descriptions and quantities (e.g. 3 sarees, 2 books).</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-900">3. Retail Bills / Invoices (If Any)</h5>
                  <p className="text-[11px] text-slate-500 mt-1">Store purchase receipts for new branded goods or expensive ethnic designer wear.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowRequirementsModal(false)}
                className="w-full py-3 bg-[#0A142F] text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Prohibited Items Modal */}
      <AnimatePresence>
        {showProhibitedModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowProhibitedModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">Prohibited & Restricted Cargo</h4>
                  <p className="text-xs text-slate-500">Items restricted from air freight under aviation safety law</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 pt-2 text-xs">
                {[
                  { title: 'Aerosols & Perfumes', desc: 'Pressurized body sprays, hair sprays, perfume bottles, and liquid hand sanitizers.' },
                  { title: 'Cash & Bullion', desc: 'Physical currency notes, gold/silver biscuits, raw precious stones, or bullion.' },
                  { title: 'Flammables & Chemicals', desc: 'Matches, lighters, fireworks, lithium batteries, paint, or corrosive acids.' },
                  { title: 'Perishables', desc: 'Fresh cooked meals without commercial packaging, raw meat, or fresh fruits.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                    <span className="font-black text-amber-950 block">{item.title}</span>
                    <span className="text-[11px] text-amber-800 font-medium block mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowProhibitedModal(false)}
                className="w-full py-3 bg-[#0A142F] text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Understand Restrictions
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
