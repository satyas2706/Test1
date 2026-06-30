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
  Check
} from 'lucide-react';
import { toast } from 'sonner';

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
  pickupConsolidationOption: 'shop_and_ship' | 'pickup_only' | null;
  setPickupConsolidationOption: (opt: 'shop_and_ship' | 'pickup_only' | null) => void;
  handleSchedulePickup: () => void;
  currentUser: any;
  activePickup: any;
  lastBookingRef: string;
  navigateTo: (tab: string) => void;
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
  pickupConsolidationOption,
  setPickupConsolidationOption,
  handleSchedulePickup,
  currentUser,
  activePickup,
  lastBookingRef,
  navigateTo,
}) => {

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
              <h2 className="text-lg font-black tracking-tight leading-none text-white">Home Pickup</h2>
              <p className="text-[10px] text-slate-300 font-bold mt-1.5 leading-tight">
                Schedule an agent to collect from your home
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Street Address</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                    value={pickupAddress.street || ''}
                    onChange={(e) => setPickupAddress({...pickupAddress, street: e.target.value})}
                    placeholder="Flat, House no., Building, Company"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">City</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                      value={pickupAddress.city || ''}
                      onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">State</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                    value={pickupAddress.zip || ''}
                    onChange={(e) => setPickupAddress({...pickupAddress, zip: e.target.value})}
                    placeholder="6-digit pincode"
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
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Receiver Full Name</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                    value={pickupDestination.fullName || ''}
                    onChange={(e) => setPickupDestination({...pickupDestination, fullName: e.target.value})}
                    placeholder="Enter receiver's name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Receiver Phone Number</label>
                  <input 
                    type="tel"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                    value={pickupDestination.phone || ''}
                    onChange={(e) => setPickupDestination({...pickupDestination, phone: e.target.value})}
                    placeholder="Enter phone with country code"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Destination Street Address</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                    value={pickupDestination.addressLine1 || ''}
                    onChange={(e) => setPickupDestination({...pickupDestination, addressLine1: e.target.value})}
                    placeholder="Street Address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">City</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                      value={pickupDestination.city || ''}
                      onChange={(e) => setPickupDestination({...pickupDestination, city: e.target.value})}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">State / Region</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                      value={pickupDestination.state || ''}
                      onChange={(e) => setPickupDestination({...pickupDestination, state: e.target.value})}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Zip / Postal Code</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-slate-900 shadow-sm"
                      value={pickupDestination.zipCode || ''}
                      onChange={(e) => setPickupDestination({...pickupDestination, zipCode: e.target.value})}
                      placeholder="Zipcode"
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
                      if (!pickupDestination.fullName || !pickupDestination.phone || !pickupDestination.addressLine1 || !pickupDestination.city || !pickupDestination.state || !pickupDestination.zipCode) {
                        toast.error('Please fill in all required Destination fields.');
                        return;
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
                <p className="text-xs font-black text-[#0A142F] mt-0.5">{pickupDestination.fullName} ({pickupDestination.phone})</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{pickupDestination.addressLine1}, {pickupDestination.city}, {pickupDestination.state} {pickupDestination.zipCode}, {pickupDestination.country}</p>
              </div>
            </div>

            {/* Online Store Purchases Consolidation (Optional) */}
            <div className="p-3.5 rounded-xl border border-indigo-150 bg-indigo-50/20 text-left space-y-2.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-indigo-600" size={15} />
                <span className="text-[9.5px] font-black uppercase text-[#091535] tracking-wider">Consolidate Store Purchases? (Optional)</span>
              </div>
              <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                Would you like to combine online orders with your home pickup items to save up to 60% on shipping?
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button 
                  type="button"
                  onClick={() => setPickupConsolidationOption('shop_and_ship')}
                  className={`p-2.5 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-0.5 bg-white shadow-sm cursor-pointer ${
                    pickupConsolidationOption === 'shop_and_ship' 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-black text-slate-900 leading-none">Yes, Consolidate</span>
                  <span className="text-[7.5px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">Save on Shipping</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setPickupConsolidationOption('pickup_only')}
                  className={`p-2.5 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-0.5 bg-white shadow-sm cursor-pointer ${
                    pickupConsolidationOption === 'pickup_only' 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-black text-slate-900 leading-none">No, Direct Only</span>
                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Home Collected</span>
                </button>
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
          <div className="p-4 rounded-xl border border-slate-100 bg-white text-left space-y-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 text-white rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 text-teal-800 rounded-full text-[8px] uppercase font-black leading-none border border-teal-100/50">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Confirmed
                </span>
                <h2 className="text-sm font-black text-slate-900 mt-1">
                  Thanks, {activePickup?.customerName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'there'}!
                </h2>
                <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">Your home pickup is scheduled. Our agent is on the way!</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/45 rounded-xl border border-indigo-100/40 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Booking reference</p>
                <p className="text-sm font-black text-indigo-750 tracking-widest mt-1 font-mono">
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
                className="p-2 bg-white text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg border border-indigo-100/50 transition shadow-sm cursor-pointer"
              >
                <Copy size={11} />
              </button>
            </div>

            <div className="bg-indigo-50/20 border border-indigo-100/20 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Clock className="text-indigo-600" size={13} />
                <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">What to Expect</h4>
              </div>
              <div className="space-y-1.5 text-[9px] text-slate-500 font-medium">
                <p>1. Our background-verified agent will call you 30 minutes before arrival.</p>
                <p>2. They will inspect your items, perform clean and professional packaging, and determine the exact physical dimensions and weight.</p>
                <p>3. A final invoice rate will be generated on your dashboard. No prepayment is collected before the visit.</p>
              </div>
            </div>

            <button
              onClick={() => {
                navigateTo('history');
                window.scrollTo(0, 0);
              }}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View My Bookings</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
