import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus,
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Clock,
  Truck,
  Building2,
  Box,
  Ticket,
  ArrowLeft,
  X
} from 'lucide-react';
import { ShippingItem, Appointment, User } from '../../types';
import { toast } from 'sonner';

interface MobileCartSectionProps {
  items: ShippingItem[];
  appointments: Appointment[];
  currentUser: User | null;
  customerWarehouseId: string;
  addItem: (item: any, source: string) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, delta: number) => void;
  removeStoreItem: (name: string) => void;
  handleCheckout: () => void;
  navigateTo: (tab: any) => void;
  storeProducts: any[];
  orderedItemIds: Set<string>;
  shopConsolidationOption: 'pickup' | 'warehouse' | 'store_only' | null;
  setShopConsolidationOption: (option: 'pickup' | 'warehouse' | 'store_only' | null) => void;
  showConsolidationError: boolean;
  setShowConsolidationError: (val: boolean) => void;
  couponCodeInput: string;
  setCouponCodeInput: (val: string) => void;
  coupons: Array<{ code: string; discountPercent: number; isEnabled: boolean }>;
  appliedCoupon: { code: string; discountPercent: number } | null;
  setAppliedCoupon: (val: { code: string; discountPercent: number } | null) => void;
}

export const MobileCartSection: React.FC<MobileCartSectionProps> = ({
  items,
  appointments,
  currentUser,
  customerWarehouseId,
  addItem,
  removeItem,
  updateItemQuantity,
  removeStoreItem,
  handleCheckout,
  navigateTo,
  storeProducts,
  orderedItemIds,
  shopConsolidationOption,
  setShopConsolidationOption,
  showConsolidationError,
  setShowConsolidationError,
  couponCodeInput,
  setCouponCodeInput,
  coupons,
  appliedCoupon,
  setAppliedCoupon
}) => {
  const hasActivePickup = appointments.some(a => a.status === 'Scheduled');
  const activePickup = appointments.find(a => a.status === 'Scheduled');
  const hasCompletedPickup = appointments.some(a => a.status === 'Completed');

  // Filter items in cart (active cart items, which are not ordered yet)
  const displayItems = items.filter(i => !orderedItemIds.has(i.id) && i.submitted === true);
  const displayWeight = displayItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  const hasTBDWeight = displayItems.some(i => i.weight === 0);

  const storeItems = displayItems.filter(i => i.source === 'Store');
  const nonStoreItems = displayItems.filter(i => i.source !== 'Store');

  const totalItemsCount = displayItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const baseSubtotal = displayItems.reduce((acc, item) => acc + (item.price || 0), 0);
  
  // Calculate discount if coupon applied
  const discountAmount = appliedCoupon ? (baseSubtotal * appliedCoupon.discountPercent) / 100 : 0;
  const estimatedTotal = Math.max(0, baseSubtotal - discountAmount);

  const getButtonText = () => {
    if (hasActivePickup) {
      return displayItems.length > 0 ? 'Confirm Order' : 'Checkout';
    }
    return currentUser ? 'Checkout' : 'Sign in to Checkout';
  };

  const isCartEmpty = displayItems.length === 0 && !hasActivePickup;

  if (isCartEmpty) {
    return (
      <div className="flex flex-col min-h-[90vh] bg-[#F9FAFB] pb-12 animate-fade-in px-4 pt-10">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 py-12 px-6 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={40} className="text-slate-350" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Your cart is empty</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">
              Add items from the JiffEX Store or register packages sent to our warehouse to get started.
            </p>
            <button 
              onClick={() => navigateTo('store')}
              className="mt-6 px-6 py-3 bg-[#4E36F5] hover:bg-opacity-90 text-white font-bold rounded-xl text-sm transition-all"
            >
              Browse Shop Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[90vh] bg-[#F9FAFB] pb-12 animate-fade-in px-4 pt-10">
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* 2. Page Title & Meta Badges */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#111827] tracking-tight">Your Shipment Items</h1>
            <p className="text-[13px] text-[#4B5563] mt-1 font-normal leading-snug">
              Manage items collected or received at our warehouse.
            </p>
          </div>
          
          {/* Horizontally aligned Pill Badges */}
          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-1 bg-[#EEF2FF] rounded-full text-[11px] font-bold text-[#4F46E5]">
              {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
            </span>
            <span className="px-3 py-1 bg-emerald-50 rounded-full text-[11px] font-bold text-[#10B981]">
              {hasTBDWeight ? 'Est. ' : ''}{displayWeight.toFixed(2)} kg Total
            </span>
          </div>
        </div>

        {/* 3. "SHOP ITEMS" Section */}
        {storeItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[#10B981] font-black text-xs tracking-widest uppercase">
              <span className="text-base">🏠</span>
              <span>SHOP ITEMS</span>
            </div>

            {/* Loop through Jiffex Store items */}
            <div className="space-y-4">
              {storeItems.map((item) => {
                const unitPrice = (item.price || 0) / (item.quantity || 1);
                const unitWeight = (item.weight || 0) / (item.quantity || 1);
                return (
                  <div 
                    key={item.id} 
                    className="p-4 bg-white rounded-xl border border-[#E5E7EB] flex flex-col gap-3 relative"
                  >
                    {/* Item Details Row */}
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      {/* Title and Metadata Grid */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-extrabold text-[#111827] text-sm leading-snug truncate">
                          {item.name}
                        </h3>

                        {/* Compact Metadata Rows */}
                        <div className="flex flex-col gap-1 mt-1.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400 text-[10px]">Unit Price:</span>
                            <span className="font-extrabold text-emerald-650">₹{unitPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Unit Wt:</span>
                              <span className="font-extrabold text-[#4E36F5]">{unitWeight.toFixed(2)} kg</span>
                            </span>
                            <span className="w-px h-2.5 bg-slate-200" />
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Total Wt:</span>
                              <span className="font-extrabold text-[#4E36F5]">{item.weight.toFixed(2)} kg</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trash Delete Icon */}
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer self-start p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Quantity Controller Box */}
                    <div className="flex items-center gap-2 border-t border-slate-50 pt-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QTY</span>
                      <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                        <button 
                          onClick={() => updateItemQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                        >
                          <Minus size={10} strokeWidth={2.5} />
                        </button>
                        <span className="text-xs font-extrabold text-slate-800 px-3 min-w-[20px] text-center">
                          {item.quantity || 1}
                        </span>
                        <button 
                          onClick={() => updateItemQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-[#EEF2FF] hover:bg-indigo-150 text-[#4E36F5] rounded-full transition-colors"
                        >
                          <Plus size={10} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3b. Non-Store Items Section (e.g. Warehouse Forwarded or Pickup Items) */}
        {nonStoreItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs tracking-widest uppercase">
              <Box size={14} />
              <span>FORWARDED / PICKUP ITEMS</span>
            </div>

            <div className="space-y-4">
              {nonStoreItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 bg-white rounded-xl border border-[#E5E7EB] flex flex-col gap-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                      <p className="text-[10px] text-[#4F46E5] font-extrabold uppercase tracking-wide mt-1 bg-[#EEF2FF] px-2 py-0.5 rounded-md w-fit">
                        Source: {item.source}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-1 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">WEIGHT</span>
                      <span className="font-extrabold text-slate-700">{item.weight.toFixed(2)} kg</span>
                    </div>
                    {item.fragile && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">FRAGILE</span>
                        <span className="font-extrabold text-amber-600">Yes</span>
                      </div>
                    )}
                    {item.invoiceNumber && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">TRACKING / INVOICE</span>
                        <span className="font-mono text-slate-600">{item.invoiceNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. "Consolidation Preference" Card */}
        {storeItems.length > 0 && (
          <div id="consolidation-prompt-section" className={`p-4 bg-[#F5F6FF] rounded-2xl space-y-3 transition-all duration-300 ${
            showConsolidationError ? 'ring-2 ring-rose-500 shadow-md shadow-rose-100' : ''
          }`}>
            <div className="flex flex-col gap-2">
              {/* Badge */}
              <span className="px-3 py-1 bg-[#EEF2FF] rounded-full text-[9px] font-black text-[#4F46E5] uppercase tracking-wider w-fit">
                CONSOLIDATION PREFERENCE
              </span>
              
              {/* Question */}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center rounded-full bg-[#4F46E5] text-white text-[10px] font-black shrink-0">
                  ?
                </div>
                <h4 className="text-xs font-extrabold text-[#0B1528] leading-tight">
                  Do you want to send other items along with these?
                </h4>
              </div>
            </div>

            {/* Error Message */}
            {showConsolidationError && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold flex items-center gap-2">
                <AlertTriangle size={13} className="shrink-0" />
                <span>Please select a consolidation option.</span>
              </div>
            )}

            {/* Stacked Option Cards */}
            <div className="space-y-2">
              {/* Option 1: Home Pickup */}
              <div 
                onClick={() => {
                  setShopConsolidationOption('pickup');
                  setShowConsolidationError(false);
                }}
                className={`p-2.5 bg-white rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  shopConsolidationOption === 'pickup' ? 'border-[#4E36F5] shadow-sm' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EEF2FF] text-[#4E36F5] rounded-lg shrink-0">
                    <Truck size={15} />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">Yes, schedule Home Pickup</h5>
                </div>
                
                {/* Radio Circle */}
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  shopConsolidationOption === 'pickup' ? 'border-[#4E36F5]' : 'border-slate-200'
                }`}>
                  {shopConsolidationOption === 'pickup' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4E36F5]" />
                  )}
                </div>
              </div>

              {/* Option 2: Warehouse Freight */}
              <div 
                onClick={() => {
                  setShopConsolidationOption('warehouse');
                  setShowConsolidationError(false);
                }}
                className={`p-2.5 bg-white rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  shopConsolidationOption === 'warehouse' ? 'border-[#4E36F5] shadow-sm' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EEF2FF] text-[#4E36F5] rounded-lg shrink-0">
                    <Building2 size={15} />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">Yes, send to JiffEX Warehouse</h5>
                </div>
                
                {/* Radio Circle */}
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  shopConsolidationOption === 'warehouse' ? 'border-[#4E36F5]' : 'border-slate-200'
                }`}>
                  {shopConsolidationOption === 'warehouse' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4E36F5]" />
                  )}
                </div>
              </div>

              {/* Option 3: Direct Shipping */}
              <div 
                onClick={() => {
                  setShopConsolidationOption('store_only');
                  setShowConsolidationError(false);
                }}
                className={`p-2.5 bg-white rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  shopConsolidationOption === 'store_only' ? 'border-[#4E36F5] shadow-sm' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EEF2FF] text-[#4E36F5] rounded-lg shrink-0">
                    <ShoppingBag size={15} />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">No, send only shop items</h5>
                </div>
                
                {/* Radio Circle */}
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  shopConsolidationOption === 'store_only' ? 'border-[#4E36F5]' : 'border-slate-200'
                }`}>
                  {shopConsolidationOption === 'store_only' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4E36F5]" />
                  )}
                </div>
              </div>
            </div>

            {/* Nice feedback info helper card */}
            {shopConsolidationOption && (
              <div className="mt-4 p-3 bg-white border border-[#E5E7EB] rounded-xl text-[11px] text-slate-600 flex items-start gap-2.5">
                <div className="text-emerald-500 mt-0.5 shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">
                    {shopConsolidationOption === 'pickup' 
                      ? 'Home Pickup Confirmed!' 
                      : shopConsolidationOption === 'warehouse' 
                        ? 'Warehouse forwarding option recorded!' 
                        : 'Direct express shipment selected!'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug font-medium">
                    {shopConsolidationOption === 'pickup' 
                      ? "After checking out, we will smoothly guide you to schedule our courier booking agent slot for your other items."
                      : shopConsolidationOption === 'warehouse'
                        ? "Perfect! We'll generate a dedicated JiffEX warehouse shipping address so you can self-forward packages from Amazon, eBay, etc."
                        : "We will handle packaging and dispatch of your shop items immediately without any extra consolidation steps."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Order Summary Section */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Box size={16} className="text-[#4E36F5]" /> Order Summary
          </h3>
          
          <div className="space-y-3 text-xs font-medium">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Total Items</span>
              <span className="font-extrabold text-[#111827]">{totalItemsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Total Weight</span>
              <span className="font-extrabold text-[#111827]">
                {hasTBDWeight ? 'Est. ' : ''}
                {displayWeight.toFixed(2)} kg
              </span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-650 font-bold">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-{appliedCoupon.discountPercent}%</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5E7EB]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#111827]">Estimated Total</span>
                <span className="text-base font-extrabold text-[#4E36F5]">
                  ₹{estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              APPLY COUPONS
            </span>
            
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={5}
                  placeholder="Enter code" 
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-[#4E36F5]/40"
                />
                <button 
                  onClick={() => {
                    const codeClean = couponCodeInput.trim().toUpperCase();
                    if (codeClean.length !== 5) {
                      toast.error("Coupon code must be exactly 5 characters.");
                      return;
                    }
                    const matched = coupons.find(c => c.code === codeClean);
                    if (!matched) {
                      toast.error(`Coupon code "${codeClean}" is invalid.`);
                      return;
                    }
                    if (!matched.isEnabled) {
                      toast.error(`Coupon code "${codeClean}" is inactive.`);
                      return;
                    }
                    setAppliedCoupon({
                      code: matched.code,
                      discountPercent: matched.discountPercent
                    });
                    toast.success(`Coupon "${matched.code}" applied!`);
                  }}
                  className="px-4 py-2 bg-[#0B1528] text-white rounded-lg font-bold text-xs hover:bg-black transition-all"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                  <Ticket size={14} />
                  <span>Coupon {appliedCoupon.code} Applied ({appliedCoupon.discountPercent}% OFF)</span>
                </div>
                <button 
                  onClick={() => setAppliedCoupon(null)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 6. Checkout Button (No longer sticky, scrolls with page items) */}
        <div className="pt-2">
          <button 
            onClick={handleCheckout}
            className="w-full bg-[#4E36F5] hover:bg-opacity-95 text-white font-extrabold py-4 px-6 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm active:scale-[0.98] shadow-lg shadow-indigo-150"
          >
            <span>{getButtonText()}</span>
            <span className="text-base font-bold">→</span>
          </button>
        </div>
      </div>

    </div>
  );
};
