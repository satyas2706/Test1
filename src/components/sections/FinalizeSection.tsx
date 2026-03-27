import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { ShippingItem, User, DestinationAddress } from '../../types';
import { COUNTRIES, SHIPPING_DATES, SHIPPING_RATES, PROHIBITED_ITEMS } from '../../constants';

interface FinalizeSectionProps {
  currentUser: User | null;
  items: ShippingItem[];
  isPaid: boolean;
  setIsPaid: (val: boolean) => void;
  orderId: string | null;
  setOrderId: (val: string | null) => void;
  address: DestinationAddress;
  setAddress: (val: DestinationAddress) => void;
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  totalWeight: number;
  totalCost: number;
  handleFinalPayment: () => void;
  navigateTo: (tab: any) => void;
  CheckoutProgressTracker: React.FC;
}

const FinalizeSection = ({
  currentUser,
  items,
  isPaid,
  setIsPaid,
  orderId,
  setOrderId,
  address,
  setAddress,
  selectedDate,
  setSelectedDate,
  paymentMethod,
  setPaymentMethod,
  totalWeight,
  totalCost,
  handleFinalPayment,
  navigateTo,
  CheckoutProgressTracker
}: FinalizeSectionProps) => {
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
};

export default FinalizeSection;
