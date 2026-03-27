import React from 'react';
import { motion } from 'motion/react';
import { Truck, MapPin, Package, Plus, Trash2, ArrowRight, Clock, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { ShippingItem } from '../../types';
import { COUNTRIES, SHIPPING_RATES } from '../../constants';

interface PickupSectionProps {
  pickupDetails: any;
  setPickupDetails: (details: any) => void;
  items: ShippingItem[];
  setItems: (items: ShippingItem[]) => void;
  addItem: (item: ShippingItem, source: 'Pickup' | 'Store' | 'Warehouse', skipConflict?: boolean) => void;
  removeItem: (id: string) => void;
  handleCheckout: () => void;
  totalWeight: number;
  totalCost: number;
}

const PickupSection = ({
  pickupDetails,
  setPickupDetails,
  items,
  setItems,
  addItem,
  removeItem,
  handleCheckout,
  totalWeight,
  totalCost
}: PickupSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-24">
      <div className="lg:col-span-2 space-y-12">
        {/* Pickup Form */}
        <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pickup Details</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Where should we collect from?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" 
                placeholder="Sender's Name"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold transition-all"
                value={pickupDetails.fullName}
                onChange={(e) => setPickupDetails({ ...pickupDetails, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="+91 98765 43210"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold transition-all"
                value={pickupDetails.phone}
                onChange={(e) => setPickupDetails({ ...pickupDetails, phone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pickup Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-400" size={20} />
                <textarea 
                  placeholder="Street address, Apartment, Suite, etc."
                  className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold transition-all min-h-[120px]"
                  value={pickupDetails.address}
                  onChange={(e) => setPickupDetails({ ...pickupDetails, address: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
              <input 
                type="text" 
                placeholder="e.g. Mumbai"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold transition-all"
                value={pickupDetails.city}
                onChange={(e) => setPickupDetails({ ...pickupDetails, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">PIN Code</label>
              <input 
                type="text" 
                placeholder="400001"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold transition-all"
                value={pickupDetails.pinCode}
                onChange={(e) => setPickupDetails({ ...pickupDetails, pinCode: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shipping Items</h2>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">What are you shipping?</p>
              </div>
            </div>
            <button 
              onClick={() => addItem({ id: Math.random().toString(36).substr(2, 9), name: '', weight: 0, status: 'Pending', source: 'Pickup' }, 'Pickup')}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Add Item
            </button>
          </div>

          <div className="space-y-6">
            {items.filter(i => i.source === 'Pickup').length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <Package size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
                <p className="text-slate-500 font-bold">No items added yet.</p>
                <button 
                  onClick={() => addItem({ id: Math.random().toString(36).substr(2, 9), name: '', weight: 0, status: 'Pending', source: 'Pickup' }, 'Pickup')}
                  className="mt-4 text-indigo-600 font-black hover:underline"
                >
                  Add your first item
                </button>
              </div>
            ) : (
              items.filter(i => i.source === 'Pickup').map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-6 group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl border border-slate-100">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <input 
                      type="text" 
                      placeholder="Item Name (e.g. Traditional Saree)"
                      className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold transition-all"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...items];
                        const itemIdx = newItems.findIndex(i => i.id === item.id);
                        newItems[itemIdx].name = e.target.value;
                        setItems(newItems);
                      }}
                    />
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="Weight (kg)"
                        className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-bold transition-all"
                        value={item.weight || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          const itemIdx = newItems.findIndex(i => i.id === item.id);
                          newItems[itemIdx].weight = Number(e.target.value);
                          setItems(newItems);
                        }}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">KG</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Order Summary Card */}
        <div className="bg-slate-900 rounded-[4rem] p-10 text-white shadow-2xl sticky top-24">
          <h3 className="text-2xl font-black mb-8 tracking-tight">Order Summary</h3>
          
          <div className="space-y-6 mb-10">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Destination</span>
              <div className="relative group">
                <select 
                  className="bg-transparent text-white font-bold text-sm outline-none appearance-none pr-6 cursor-pointer"
                  value={pickupDetails.destination}
                  onChange={(e) => setPickupDetails({ ...pickupDetails, destination: e.target.value })}
                >
                  <option value="" className="text-slate-900">Select Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
                <ChevronRight size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-indigo-400 rotate-90 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Items</span>
              <span className="font-bold">{items.length} Items</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Weight</span>
              <span className="font-bold">{totalWeight} kg</span>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Cost</span>
                  <div className="text-4xl font-black mt-1">${totalCost.toLocaleString()}</div>
                </div>
                <div className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">Inc. Taxes</div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={items.length === 0 || !pickupDetails.destination}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
          >
            Proceed to Checkout
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, label: 'Secure' },
              { icon: Clock, label: 'Fast' },
              { icon: CreditCard, label: 'Easy' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <item.icon size={20} />
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prohibited Items Reminder */}
        <div className="bg-amber-50 rounded-[3rem] p-8 border border-amber-100">
          <h4 className="text-sm font-black text-amber-800 mb-2 flex items-center gap-2">
            <Package size={16} /> Shipping Reminder
          </h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            Please ensure no prohibited items are included in your shipment. All packages are inspected at the warehouse.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PickupSection;
