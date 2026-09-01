import React from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Box, 
  Boxes, 
  FileText, 
  Truck, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  Copy,
  Check,
  X,
  AlertTriangle,
  Home,
  Store,
  Warehouse,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { SinglePagePickupForm } from './SinglePagePickupForm';
import { ShopIndianProductsCarousel } from './ShopIndianProductsCarousel';

interface MobilePickupFlowProps {
  activePickupStep: number;
  setActivePickupStep: (step: number) => void;
  pickupItemType: string;
  setPickupItemType: (type: string) => void;
  pickupEstimatedWeight: string;
  setPickupEstimatedWeight: (weight: string) => void;
  selectedPickupDate: string;
  setSelectedPickupDate: (date: string) => void;
  selectedPickupTime: string;
  setSelectedPickupTime: (time: string) => void;
  filteredPickupSlots: Array<{ date: string; times: string[] }>;
  pickupDetailsTab: 'pickup' | 'destination';
  setPickupDetailsTab: (tab: 'pickup' | 'destination') => void;
  pickupName: string;
  setPickupName: (name: string) => void;
  pickupPhone: string;
  setPickupPhone: (phone: string) => void;
  pickupAddress: { street: string; city: string; state: string; zip: string };
  setPickupAddress: (addr: any) => void;
  pickupDestination: { fullName: string; phone: string; addressLine1: string; city: string; state: string; zipCode: string; country: string };
  setPickupDestination: (addr: any) => void;
  provideDestinationLater?: boolean;
  setProvideDestinationLater?: (val: boolean) => void;
  pickupConsolidationOption: 'shop_and_ship' | 'pickup_only' | null;
  setPickupConsolidationOption: (opt: 'shop_and_ship' | 'pickup_only' | null) => void;
  shopConsolidationOption?: 'pickup' | 'warehouse' | 'store_only' | null;
  setShopConsolidationOption?: (option: 'pickup' | 'warehouse' | 'store_only' | null) => void;
  shopItemsShippingDestination?: 'home' | 'custom' | 'warehouse';
  setShopItemsShippingDestination?: (dest: 'home' | 'custom' | 'warehouse') => void;
  hasShopItems?: boolean;
  handleSchedulePickup: () => void;
  currentUser: any;
  activePickup: any;
  lastBookingRef: string;
  navigateTo: (tab: string) => void;
  shippingRates?: Record<string, number>;
  shippingDiscounts?: Record<string, number>;
  pickupVehicleType?: string;
  setPickupVehicleType?: (weight: string) => void;
  pickupEmail?: string;
  setPickupEmail?: (email: string) => void;
  pickupSpecialInstructions?: string;
  setPickupSpecialInstructions?: (val: string) => void;
  savePickupToProfile?: boolean;
  setSavePickupToProfile?: (val: boolean) => void;
  savePickupProfileToDb?: () => void;
}

export const MobilePickupFlow: React.FC<MobilePickupFlowProps> = ({
  activePickupStep,
  setActivePickupStep,
  pickupItemType,
  setPickupItemType,
  pickupEstimatedWeight,
  setPickupEstimatedWeight,
  selectedPickupDate,
  setSelectedPickupDate,
  selectedPickupTime,
  setSelectedPickupTime,
  filteredPickupSlots,
  pickupDetailsTab,
  setPickupDetailsTab,
  pickupName,
  setPickupName,
  pickupPhone,
  setPickupPhone,
  pickupAddress,
  setPickupAddress,
  pickupDestination,
  setPickupDestination,
  provideDestinationLater = false,
  setProvideDestinationLater,
  pickupConsolidationOption,
  setPickupConsolidationOption,
  shopConsolidationOption,
  setShopConsolidationOption,
  shopItemsShippingDestination = 'home',
  setShopItemsShippingDestination,
  hasShopItems = false,
  handleSchedulePickup,
  currentUser,
  activePickup,
  lastBookingRef,
  navigateTo,
  shippingRates,
  shippingDiscounts,
  pickupVehicleType,
  setPickupVehicleType,
  pickupEmail,
  setPickupEmail,
  pickupSpecialInstructions,
  setPickupSpecialInstructions,
  savePickupToProfile,
  setSavePickupToProfile,
  savePickupProfileToDb,
}) => {

  const [showRequirementsModal, setShowRequirementsModal] = React.useState(false);
  const [showProhibitedModal, setShowProhibitedModal] = React.useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = React.useState<number | null>(null);
  const [selectedProhibitedIndex, setSelectedProhibitedIndex] = React.useState<number | null>(null);

  const requirementsData = [
    {
      title: 'ID Proof Copy',
      subtext: 'Aadhar, Passport or Driving License Copy',
      icon: <ShieldCheck size={20} className="text-blue-600" />,
      guidelines: [
        'Standard government-issued photo identification is mandatory.',
        'Acceptable IDs: Aadhaar Card, Indian/Global Passport, Voter ID, or Driving License.',
        'Please provide clear, legible front and back color copies of the document.',
        'The name listed on your ID document must exactly match the sender name declared on the shipping bill.'
      ]
    },
    {
      title: 'Itemized Declaration',
      subtext: 'Simple list of contents & quantities',
      icon: <FileText size={20} className="text-blue-600" />,
      guidelines: [
        'A comprehensive declaration list detailing every item inside your package is required.',
        'Please list exact descriptions and quantities of all products (e.g. "4 Cotton Shirts, 2 Packets of dry sweets").',
        'This form helps customs officials easily verify the packages, avoiding unnecessary border delays.',
        'No professional invoice is needed; a simple hand-written or digitally typed list is fully acceptable.'
      ]
    },
    {
      title: 'Value Statement',
      subtext: 'Bills/Invoices for any luxurious brand garments',
      icon: <FileText size={20} className="text-blue-600" />,
      guidelines: [
        'Mandatory for newly purchased retail items, branded luxurious goods, or heavy designer ethnic garments.',
        'Please produce purchase invoices or digital store receipts detailing actual paid pricing.',
        'Value statement ensures correct custom duty calculations and prevents arbitrary valuation adjustments by destination customs.',
        'For older used personal belongings, a simple self-declared estimated fair value is sufficient.'
      ]
    }
  ];

  const prohibitedData = [
    {
      title: 'Aerosols & Perfumes',
      subtext: 'Body sprays, deodorants, or inflammable liquids',
      icon: <span className="text-lg">💨</span>,
      reason: 'Under aviation safety law, pressurized aerosol sprays, body sprays, dry shampoos, sanitizers, and oil-based perfumes are treated as combustible hazardous cargo and cannot be boarded on cargo planes.'
    },
    {
      title: 'Cash & Jewellery',
      subtext: 'Currency notes, solid raw gold, silver bullion',
      icon: <span className="text-lg">💵</span>,
      reason: 'Standard express courier lines are strictly forbidden from carrying raw bullion metals, physical fiat banknotes, loose precious gems, gold/silver biscuits, or high-value ornaments due to global anti-money laundering controls and transit security guidelines.'
    },
    {
      title: 'Perishables',
      subtext: 'Open/homemade liquid curries, raw dairy products',
      icon: <span className="text-lg">🍲</span>,
      reason: 'Wet curries, unsealed pickles with high oil content, raw cheese, or items needing refrigeration are barred. They are highly prone to spoilage, odor emissions, and fluid leakages that can ruin entire multi-shipment containers.'
    },
    {
      title: 'Hazardous Materials',
      subtext: 'Ammunition, loose lithium batteries, explosive',
      icon: <span className="text-lg">🔋</span>,
      reason: 'Loose lithium-ion power cells, matches, fireworks, magnetic toys, combustible chemicals, and weapons of any category are completely banned. These products represent high-risk fire and explosion hazards under international air safety regulations.'
    },
    {
      title: 'Restricted Drugs & Plants',
      subtext: 'Prescription medicines without paperwork, live plants',
      icon: <span className="text-lg">🌱</span>,
      reason: 'Unprescribed medicine capsules or active pharmacy formulas are not permitted. Live flowers, plant saplings, soil bags, and raw unsterilized agricultural seeds are subject to biological quarantine laws in most destination countries.'
    }
  ];

  const COUNTRIES = ['United States', 'India', 'Canada', 'United Kingdom', 'United Arab Emirates', 'Australia', 'Singapore', 'Germany'];
  const PICKUP_SLOTS_TIMES = ['9–11 AM', '11–1 PM', '1–3 PM', '3–5 PM', '5–7 PM', '7–9 PM'];

  // Handle step 1 action
  const handleStep1Continue = () => {
    if (!pickupItemType) {
      toast.error('Please select item category first.');
      return;
    }
    setActivePickupStep(2);
    window.scrollTo(0, 0);
  };

  // Helper to handle date and times
  const getISTTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
  };
  const istNow = getISTTime();
  const istDateStr = istNow.toISOString().split('T')[0];

  if (activePickupStep !== 5) {
    return (
      <SinglePagePickupForm
        pickupItemType={pickupItemType}
        setPickupItemType={setPickupItemType}
        pickupVehicleType={pickupVehicleType || pickupEstimatedWeight || '5 to 20 kg'}
        setPickupVehicleType={setPickupVehicleType || setPickupEstimatedWeight}
        pickupEstimatedWeight={pickupEstimatedWeight}
        setPickupEstimatedWeight={setPickupEstimatedWeight}
        selectedPickupDate={selectedPickupDate}
        setSelectedPickupDate={setSelectedPickupDate}
        selectedPickupTime={selectedPickupTime}
        setSelectedPickupTime={setSelectedPickupTime}
        filteredPickupSlots={filteredPickupSlots}
        pickupName={pickupName}
        setPickupName={setPickupName}
        pickupPhone={pickupPhone}
        setPickupPhone={setPickupPhone}
        pickupEmail={pickupEmail || ''}
        setPickupEmail={setPickupEmail || (() => {})}
        pickupAddress={pickupAddress}
        setPickupAddress={setPickupAddress}
        pickupSpecialInstructions={pickupSpecialInstructions || ''}
        setPickupSpecialInstructions={setPickupSpecialInstructions || (() => {})}
        savePickupToProfile={savePickupToProfile ?? true}
        setSavePickupToProfile={setSavePickupToProfile || (() => {})}
        pickupDestination={pickupDestination}
        setPickupDestination={setPickupDestination}
        provideDestinationLater={provideDestinationLater}
        setProvideDestinationLater={setProvideDestinationLater || (() => {})}
        pickupConsolidationOption={pickupConsolidationOption}
        setPickupConsolidationOption={setPickupConsolidationOption}
        setShopConsolidationOption={setShopConsolidationOption}
        shopItemsShippingDestination={shopItemsShippingDestination}
        setShopItemsShippingDestination={setShopItemsShippingDestination || (() => {})}
        hasShopItems={hasShopItems}
        handleSchedulePickup={handleSchedulePickup}
        currentUser={currentUser}
        shippingRates={shippingRates || {}}
        shippingDiscounts={shippingDiscounts || {}}
        savePickupProfileToDb={savePickupProfileToDb}
        navigateTo={navigateTo}
      />
    );
  }

  return (
    <div className="space-y-4 px-3 py-1">
      {/* 1. Header & Home Pickup Banner */}
      {activePickupStep !== 5 && (
        <div className="bg-gradient-to-br from-[#091535] to-[#122352] text-white p-5 rounded-2xl shadow-md flex items-center justify-between relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-yellow-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Truck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-none text-white">Schedule a Home Pickup</h2>
              <p className="text-[10px] text-slate-300 font-bold mt-1.5 leading-tight">
                Tell us what you're shipping, when you'd like pickup, and where we should collect it.
              </p>
            </div>
          </div>
          <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
            {/* Simple visual box icon to serve as clean illustration */}
            <Box size={28} className="text-slate-200/40 animate-bounce" />
          </div>
        </div>
      )}

      {/* 2. Progress Stepper */}
      {activePickupStep !== 5 && (
        <div className="grid grid-cols-5 gap-1 items-center justify-between text-center py-3 border border-slate-100 bg-white rounded-xl shadow-sm">
          {[
            { step: 1, label: 'Items' },
            { step: 2, label: 'Schedule' },
            { step: 3, label: 'Address' },
            { step: 4, label: 'Review' },
            { step: 5, label: 'Done' }
          ].map((s) => {
            const isActive = activePickupStep === s.step;
            const isCompleted = activePickupStep > s.step;
            return (
              <div key={s.step} className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  isCompleted ? 'bg-indigo-600 text-white' :
                  isActive ? 'bg-[#091535] text-white ring-4 ring-indigo-100' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {s.step}
                </div>
                <span className={`text-[9px] font-black tracking-tight mt-1 transition-colors ${
                  isActive || isCompleted ? 'text-[#091535] font-black' : 'text-slate-400 font-bold'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Steps Dynamic Renderer */}
      <div className="min-y-[350px]">
        {/* Step 1: Items Selector */}
        {activePickupStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2.5 text-left">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">What type of items are you sending?</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Everyday Items', label: 'Everyday Items', icon: ShoppingBag },
                  { id: 'Large/Furniture', label: 'Large/Furniture', icon: Box },
                  { id: 'Mixed Items', label: 'Mixed Items', icon: Boxes },
                  { id: 'Documents', label: 'Documents', icon: FileText }
                ].map(type => {
                  const isSelected = pickupItemType === type.id;
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setPickupItemType(type.id)}
                      className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-start gap-2 text-left relative overflow-hidden ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/20 text-orange-600 shadow-[0_4px_12px_rgba(249,115,22,0.06)]' 
                          : 'border-slate-100 bg-white text-slate-500 shadow-sm'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-black uppercase tracking-wider leading-none mt-1">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 text-left pt-1">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Approximate weight of items</h4>
              <div className="space-y-2">
                {[
                  { id: 'Less than 5 kg', label: 'Less than 5 kg', desc: 'Documents, small parcels, or light gift packs', icon: Box },
                  { id: '5 to 20 kg', label: '5 to 20 kg', desc: 'Standard suitcases, medium boxes, or household items', icon: Box },
                  { id: 'More than 20 kg', label: 'More than 20 kg', desc: 'Heavy cargo, large bulk luggage, or multiple packages', icon: Truck }
                ].map(v => {
                  const isSelected = pickupEstimatedWeight === v.id;
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setPickupEstimatedWeight(v.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between text-left relative overflow-hidden ${
                        isSelected 
                          ? 'border-orange-400 bg-orange-50/20 text-slate-900 shadow-sm' 
                          : 'border-slate-100 bg-white text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#0A142F]">{v.label}</p>
                          <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5 max-w-[210px]">{v.desc}</p>
                        </div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-orange-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Information note panels */}
            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-amber-50/65 border border-amber-100 rounded-xl flex items-start gap-2.5 text-left">
                <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">
                  i
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-[10px] font-black text-slate-900 leading-tight">
                    You’ll receive a price estimate before confirmation — no payment required yet.
                  </h5>
                  <p className="text-[9px] text-orange-600 font-medium leading-relaxed mt-0.5">
                    Once your pickup is confirmed, our agent will contact you with a final price based on size, weight, and distance before collecting payment.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/40 border border-indigo-100/60 rounded-xl flex items-start gap-2.5 text-left">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-[10px] font-black text-indigo-950 leading-tight">
                    Safe & Verified Agents
                  </h5>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-0.5">
                    All our pickup agents are background-verified and follow strict safety protocols. They will call you 30 minutes before arrival.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleStep1Continue}
                className="w-full py-3.5 bg-[#091535] text-white rounded-xl text-xs font-black hover:bg-[#122352] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Continue to Schedule</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {activePickupStep === 2 && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 text-[#0A142F]">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-black uppercase tracking-wider">When should we arrive?</h4>
            </div>
            
            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Select Date</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filteredPickupSlots.map(slot => {
                  const d = new Date(slot.date);
                  const isSelected = selectedPickupDate === slot.date;
                  const isDatePast = slot.date < istDateStr || (slot.date === istDateStr && istNow.getHours() >= 19);

                  return (
                    <button
                      key={slot.date}
                      disabled={isDatePast}
                      onClick={() => setSelectedPickupDate(slot.date)}
                      className={`flex-shrink-0 w-15 h-18 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isDatePast ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-50 text-slate-300' :
                        isSelected ? 'border-orange-500 bg-orange-50/20 text-orange-600' : 
                        'border-slate-100 bg-white text-slate-500 shadow-sm'
                      }`}
                    >
                      <span className="text-[8px] font-black uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-sm font-black">{d.getDate()}</span>
                      <span className="text-[8px] font-black uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Select Time Window</label>
              <div className="grid grid-cols-2 gap-2">
                {PICKUP_SLOTS_TIMES.map(time => {
                  const isSelected = selectedPickupTime === time;
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
                    const startHour = hourMap[time] || 9;
                    if (istNow.getHours() >= startHour) {
                      isPast = true;
                    }
                  }

                  return (
                    <button
                      key={time}
                      disabled={isPast}
                      onClick={() => setSelectedPickupTime(time)}
                      className={`py-3 px-1 rounded-xl border-2 transition-all text-center ${
                        isPast ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-50 text-slate-300' :
                        isSelected ? 'border-orange-500 bg-orange-50/20 text-orange-600 font-bold' : 
                        'border-slate-100 bg-white text-slate-500 shadow-sm'
                      }`}
                    >
                      <span className="text-[10px] font-black">{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setActivePickupStep(1)}
                className="flex-1 py-3 bg-white border border-slate-200 text-indigo-950 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button 
                onClick={() => {
                  if (!selectedPickupTime) {
                    toast.error('Please select a time window.');
                    return;
                  }
                  setActivePickupStep(3);
                  window.scrollTo(0, 0);
                }}
                className="flex-[2] py-3 bg-[#091535] text-white rounded-xl text-xs font-black hover:bg-[#122352] active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                Continue to Address <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Address */}
        {activePickupStep === 3 && (
          <div className="space-y-4 text-left">
            {/* Tab selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPickupDetailsTab('pickup')}
                className={`flex-1 py-2 text-center text-xs font-black rounded-lg transition-all ${
                  pickupDetailsTab === 'pickup' ? 'bg-white text-[#091535] shadow-sm' : 'text-slate-400'
                }`}
              >
                Pickup Details
              </button>
              <button
                onClick={() => setPickupDetailsTab('destination')}
                className={`flex-1 py-2 text-center text-xs font-black rounded-lg transition-all ${
                  pickupDetailsTab === 'destination' ? 'bg-white text-[#091535] shadow-sm' : 'text-slate-400'
                }`}
              >
                Destination Details
              </button>
            </div>

            {pickupDetailsTab === 'pickup' ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Phone Number (10 digits)</label>
                  <input 
                    type="tel"
                    maxLength={10}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Street Address</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                    value={pickupAddress.street || ''}
                    onChange={(e) => setPickupAddress({...pickupAddress, street: e.target.value})}
                    placeholder="Flat, House no., Building, Street / Landmark"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">City</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                      value={pickupAddress.city || ''}
                      onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">State</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                      value={pickupAddress.state || ''}
                      onChange={(e) => setPickupAddress({...pickupAddress, state: e.target.value})}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pincode</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                    value={pickupAddress.zip || ''}
                    onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})}
                    placeholder="PIN Code"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    onClick={() => setActivePickupStep(2)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-[#091535] rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button 
                    onClick={() => {
                      if (!pickupName || !pickupPhone || !pickupAddress.street || !pickupAddress.city || !pickupAddress.state || !pickupAddress.zip) {
                        toast.error('Please fill in all required fields.');
                        return;
                      }
                      if (pickupPhone.length !== 10) {
                        toast.error('Phone number must be exactly 10 digits.');
                        return;
                      }
                      setPickupDetailsTab('destination');
                    }}
                    className="flex-[2] py-3 bg-[#091535] text-white rounded-xl text-xs font-black hover:bg-[#122352] active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Continue to Destination <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Option to provide destination details later */}
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    id="provide-destination-later-mobile"
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 mt-0.5 cursor-pointer accent-amber-600"
                    checked={provideDestinationLater}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      if (setProvideDestinationLater) setProvideDestinationLater(isChecked);
                      if (isChecked) {
                        toast.info("Destination details set to be provided later before warehouse dispatch.");
                      }
                    }}
                  />
                  <label htmlFor="provide-destination-later-mobile" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    I don't know the destination yet
                  </label>
                </div>

                {provideDestinationLater ? (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl space-y-2 text-left">
                    <div className="flex items-center gap-2 text-amber-900">
                      <Clock size={16} className="shrink-0 text-amber-600" />
                      <p className="text-xs font-bold leading-snug">
                        You can provide the destination later. We'll contact you before shipping.
                      </p>
                    </div>

                    <div className="pt-1 text-left space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Expected Destination Country (Optional)</label>
                      <select 
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm h-[38px]"
                        value={pickupDestination.country || 'United States'}
                        onChange={(e) => setPickupDestination({...pickupDestination, country: e.target.value})}
                      >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Receiver Full Name</label>
                      <input 
                        type="text"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                        value={pickupDestination.fullName || ''}
                        onChange={(e) => setPickupDestination({...pickupDestination, fullName: e.target.value})}
                        placeholder="Enter receiver's name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Receiver Phone Number</label>
                      <input 
                        type="tel"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                        value={pickupDestination.phone || ''}
                        onChange={(e) => setPickupDestination({...pickupDestination, phone: e.target.value})}
                        placeholder="Phone number with country code"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Destination Street Address</label>
                      <input 
                        type="text"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                        value={pickupDestination.addressLine1 || ''}
                        onChange={(e) => setPickupDestination({...pickupDestination, addressLine1: e.target.value})}
                        placeholder="Street address, apartment, suite"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">City</label>
                        <input 
                          type="text"
                          className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                          value={pickupDestination.city || ''}
                          onChange={(e) => setPickupDestination({...pickupDestination, city: e.target.value})}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">State / Region</label>
                        <input 
                          type="text"
                          className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                          value={pickupDestination.state || ''}
                          onChange={(e) => setPickupDestination({...pickupDestination, state: e.target.value})}
                          placeholder="State / Region"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Zip / Postal Code</label>
                        <input 
                          type="text"
                          className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm placeholder:text-slate-300 placeholder:font-light"
                          value={pickupDestination.zipCode || ''}
                          onChange={(e) => setPickupDestination({...pickupDestination, zipCode: e.target.value})}
                          placeholder="Postal code"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Country</label>
                        <select 
                          className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm h-[38px]"
                          value={pickupDestination.country || 'United States'}
                          onChange={(e) => setPickupDestination({...pickupDestination, country: e.target.value})}
                        >
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-3">
                  <button 
                    onClick={() => setPickupDetailsTab('pickup')}
                    className="flex-1 py-3 bg-white border border-slate-200 text-[#091535] rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button 
                    onClick={() => {
                      if (!pickupName || !pickupPhone || !pickupAddress.street || !pickupAddress.city || !pickupAddress.state || !pickupAddress.zip) {
                        toast.error('Please fill in all required Pickup Address fields.');
                        setPickupDetailsTab('pickup');
                        return;
                      }
                      if (pickupPhone.length !== 10) {
                        toast.error('Phone number must be exactly 10 digits.');
                        setPickupDetailsTab('pickup');
                        return;
                      }
                      if (!provideDestinationLater) {
                        if (!pickupDestination.fullName || !pickupDestination.phone || !pickupDestination.addressLine1 || !pickupDestination.city || !pickupDestination.state || !pickupDestination.zipCode) {
                          toast.error('Please fill in all required Destination fields or check "I will provide details later".');
                          return;
                        }
                      }
                      setActivePickupStep(4);
                      window.scrollTo(0, 0);
                    }}
                    className="flex-[2] py-3 bg-[#091535] text-white rounded-xl text-xs font-black hover:bg-[#122352] active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Continue to Review <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {activePickupStep === 4 && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 text-[#0A142F]">
              <Eye className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-black uppercase tracking-wider">Review your booking</h4>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Item Details</p>
                <p className="text-xs font-black text-[#0A142F] mt-0.5">{pickupItemType} • {pickupEstimatedWeight}</p>
              </div>
              <div className="border-t border-slate-200/50 pt-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pickup Schedule</p>
                <p className="text-xs font-black text-[#0A142F] mt-0.5">{new Date(selectedPickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedPickupTime}</p>
              </div>
              <div className="border-t border-slate-200/50 pt-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pickup Address</p>
                <p className="text-xs font-black text-[#0A142F] mt-0.5">{pickupName} ({pickupPhone})</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{pickupAddress.street}, {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}</p>
              </div>
              <div className="border-t border-slate-200/50 pt-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Destination Address</p>
                {provideDestinationLater ? (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                      <Clock size={11} /> Provide Details Later
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">Address will be collected prior to warehouse dispatch. Country: {pickupDestination.country || 'USA'}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-black text-[#0A142F] mt-0.5">{pickupDestination.fullName} ({pickupDestination.phone})</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{pickupDestination.addressLine1}, {pickupDestination.city}, {pickupDestination.state} {pickupDestination.zipCode}, {pickupDestination.country}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button 
                onClick={() => setActivePickupStep(3)}
                className="flex-1 py-3 bg-white border border-slate-200 text-[#091535] rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  handleSchedulePickup();
                  window.scrollTo(0, 0);
                }}
                className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                {currentUser ? 'Confirm Booking' : 'Sign in (OTP-based)'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Done (Confirmed) */}
        {activePickupStep === 5 && (
          <div className="space-y-5 text-left">
            {/* Confirmation Card */}
            <div className="bg-[#ecfdf5] border border-[#a7f3d0] p-4 rounded-2xl flex flex-col gap-3.5 shadow-sm relative overflow-hidden">
              <div className="flex items-start gap-3.5 z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <span className="inline-block text-[9px] font-black text-emerald-800 tracking-wider bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1">
                    CONFIRMED & ACTIVE
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Thanks, {activePickup?.customerName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'there'}! 🎉
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold leading-normal mt-0.5">
                    Your home pickup is scheduled. Our agent is on the way!
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3 shrink-0 shadow-xs">
                <div className="text-left">
                  <p className="text-[9px] font-black text-indigo-900 uppercase tracking-widest leading-none">BOOKING REFERENCE</p>
                  <p className="text-sm font-black text-[#091535] tracking-wider mt-1 font-mono">
                    {lastBookingRef || activePickup?.id || 'PH-00072'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const ref = lastBookingRef || activePickup?.id || 'PH-00072';
                    if (ref) {
                      navigator.clipboard.writeText(ref);
                      toast.success('Reference ID copied to clipboard!');
                    }
                  }}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <Copy size={14} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* WHAT TO EXPECT Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-left">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Clock size={13} className="stroke-[2.5]" />
                </div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">WHAT TO EXPECT</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    step: 1,
                    title: 'Agent Call',
                    subtext: 'Agent calls 30m before arrival.',
                    completed: true
                  },
                  {
                    step: 2,
                    title: 'Pickup & Weighing',
                    subtext: 'Instant quote given on-site.',
                    completed: true
                  },
                  {
                    step: 3,
                    title: 'Secure Sorting',
                    subtext: 'Packed safely at warehouse.',
                    completed: false
                  },
                  {
                    step: 4,
                    title: 'Global Delivery',
                    subtext: 'Pay online to dispatch package.',
                    completed: false
                  }
                ].map((item) => (
                  <div 
                    key={item.step} 
                    className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">STEP {item.step}</span>
                        {item.completed ? (
                          <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                            <Check size={11} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center shrink-0 text-[9px] font-bold">
                            {item.step}
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mt-2 leading-tight">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{item.subtext}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-Column Information Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column: DOCUMENTS REQUIRED */}
              <div className="space-y-2.5 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={13} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-xs font-black uppercase text-[#091535] tracking-wider">DOCUMENTS REQUIRED</h3>
                </div>

                <div className="space-y-2">
                  {[
                    { title: 'ID Proof Copy', subtext: 'Aadhar, Passport or Driving License Copy' },
                    { title: 'Itemized Declaration', subtext: 'Simple list of contents & quantities' },
                    { title: 'Value Statement', subtext: 'Bills/Invoices for brand items' },
                    { title: 'Receiver Address Info', subtext: 'Full overseas address & contact number' }
                  ].map((doc, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-slate-200/80 p-3 sm:p-3.5 rounded-xl shadow-2xs flex items-center justify-between gap-3 hover:border-blue-200 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedDocIndex(idx);
                        setShowRequirementsModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                          <ShieldCheck size={18} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-[13px] font-black text-[#0A142F]">{doc.title}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">{doc.subtext}</p>
                        </div>
                      </div>
                      <span className="text-slate-300 font-bold text-xs select-none mr-1">&gt;</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setSelectedDocIndex(null);
                    setShowRequirementsModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline tracking-wider uppercase pt-0.5 cursor-pointer"
                >
                  View all requirements &gt;
                </button>
              </div>

              {/* Right Column: PROHIBITED ITEMS */}
              <div className="space-y-2.5 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 fill-current text-red-600" viewBox="0 0 24 24">
                      <path d="M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
                    </svg>
                  </div>
                  <h3 className="text-xs font-black uppercase text-red-800 tracking-wider">PROHIBITED ITEMS</h3>
                </div>

                <div className="space-y-2">
                  {[
                    { title: 'Aerosols & Perfumes', subtext: 'Body sprays, deodorants, or inflammable liquids' },
                    { title: 'Cash & Jewellery', subtext: 'Currency notes, solid raw gold, silver bullion' },
                    { title: 'Perishables & Liquids', subtext: 'Open/homemade liquid curries, raw dairy products' },
                    { title: 'Hazardous Materials', subtext: 'Ammunition, loose lithium batteries, explosive' }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-slate-200/80 p-3 sm:p-3.5 rounded-xl shadow-2xs flex items-center justify-between gap-3 hover:border-red-200 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedProhibitedIndex(idx);
                        setShowProhibitedModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100">
                          <span className="text-xs font-extrabold font-mono">✕</span>
                        </div>
                        <div>
                          <p className="text-xs sm:text-[13px] font-black text-[#0A142F]">{item.title}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">{item.subtext}</p>
                        </div>
                      </div>
                      <span className="text-slate-300 font-bold text-xs select-none mr-1">&gt;</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setSelectedProhibitedIndex(null);
                    setShowProhibitedModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 hover:underline tracking-wider uppercase pt-0.5 cursor-pointer"
                >
                  View all prohibited items &gt;
                </button>
              </div>
            </div>

            {/* Back to Bookings CTA */}
            <button
              onClick={() => {
                navigateTo('history');
                window.scrollTo(0, 0);
              }}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md mt-2"
            >
              <span>View My Bookings</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          </div>
        )}

      {/* Documentation Requirements Modal */}
      {showRequirementsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950">Documents Required</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Official Shipping Requirements</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRequirementsModal(false);
                  setSelectedDocIndex(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-left">
              {selectedDocIndex !== null ? (
                // Focused Doc view
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      {requirementsData[selectedDocIndex].icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-950">{requirementsData[selectedDocIndex].title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{requirementsData[selectedDocIndex].subtext}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-[#091535] tracking-wider uppercase">Fulfillment Guidelines</h5>
                    <ul className="space-y-2.5">
                      {requirementsData[selectedDocIndex].guidelines.map((guide, gIdx) => (
                        <li key={gIdx} className="flex gap-2 text-[10px] text-slate-500 font-medium leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          <span>{guide}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => setSelectedDocIndex(null)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black transition-all cursor-pointer border border-slate-100"
                  >
                    {"←"} View All Requirements
                  </button>
                </div>
              ) : (
                // Complete list view
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Please prepare and hand over these three documents to our pickup agent during their visit. This guarantees smooth clearing at international customs.
                  </p>
                  
                  <div className="space-y-3">
                    {requirementsData.map((doc, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedDocIndex(idx)}
                        className="p-4 bg-slate-50/50 hover:bg-blue-50/20 border border-slate-100 hover:border-blue-100 rounded-2xl transition cursor-pointer flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          {doc.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-950">{doc.title}</h4>
                            <span className="text-blue-500 text-[10px] font-black uppercase tracking-wider">Details {"→"}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 leading-normal">{doc.subtext}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <button 
                onClick={() => {
                  setShowRequirementsModal(false);
                  setSelectedDocIndex(null);
                }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition cursor-pointer text-center"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prohibited Items Modal */}
      {showProhibitedModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50/50 to-orange-50/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-950">Prohibited Items</h3>
                  <p className="text-[10px] text-red-500 font-bold">Strict Safety Regulations</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowProhibitedModal(false);
                  setSelectedProhibitedIndex(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-left">
              {selectedProhibitedIndex !== null ? (
                // Focused item view
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-red-50/50 rounded-2xl border border-red-100/30">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      {prohibitedData[selectedProhibitedIndex].icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-red-950">{prohibitedData[selectedProhibitedIndex].title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{prohibitedData[selectedProhibitedIndex].subtext}</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h5 className="text-[10px] font-black text-red-800 tracking-wider uppercase">Reason For Restriction</h5>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      {prohibitedData[selectedProhibitedIndex].reason}
                    </p>
                  </div>

                  <button 
                    onClick={() => setSelectedProhibitedIndex(null)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black transition-all cursor-pointer border border-slate-100"
                  >
                    {"←"} View All Prohibited Items
                  </button>
                </div>
              ) : (
                // Complete list view
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Under aviation laws and security guidelines, the following categories cannot be shipped. Please check your package carefully to ensure none of these are included.
                  </p>
                  
                  <div className="space-y-3">
                    {prohibitedData.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedProhibitedIndex(idx)}
                        className="p-4 bg-slate-50/50 hover:bg-red-50/20 border border-slate-100 hover:border-red-100 rounded-2xl transition cursor-pointer flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-950">{item.title}</h4>
                            <span className="text-red-600 text-[10px] font-black uppercase tracking-wider">Why? {"→"}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 leading-normal">{item.subtext}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <button 
                onClick={() => {
                  setShowProhibitedModal(false);
                  setSelectedProhibitedIndex(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer text-center"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
