import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Truck, Package, CheckCircle2, MapPin, ArrowRight, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import { ShippingItem } from '../../types';
import { WAREHOUSE_ADDRESS } from '../../constants';

interface WorkOrderSectionProps {
  items: ShippingItem[];
  pickupDetails: any;
  totalWeight: number;
  totalCost: number;
  handlePayment: () => void;
  isProcessing: boolean;
}

const WorkOrderSection = ({
  items,
  pickupDetails,
  totalWeight,
  totalCost,
  handlePayment,
  isProcessing
}: WorkOrderSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-24">
      <div className="lg:col-span-2 space-y-12">
        {/* Shipment Summary */}
        <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shipment Summary</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Review your items and details</p>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package size={24} />}
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">{item.name}</div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.source}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.weight} kg</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">{item.price ? `$${item.price}` : '-'}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity || 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Truck size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Pickup From</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sender</div>
                <div className="text-sm font-bold text-slate-900">{pickupDetails.fullName}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</div>
                <div className="text-sm font-bold text-slate-900 leading-relaxed">{pickupDetails.address}</div>
                <div className="text-sm font-bold text-slate-900">{pickupDetails.city}, {pickupDetails.pinCode}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Shipping To</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination</div>
                <div className="text-sm font-bold text-slate-900">{pickupDetails.destination}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Warehouse Address</div>
                <div className="text-sm font-bold text-slate-900 leading-relaxed">{WAREHOUSE_ADDRESS.street}</div>
                <div className="text-sm font-bold text-slate-900">{WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.state}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Payment Card */}
        <div className="bg-slate-900 rounded-[4rem] p-10 text-white shadow-2xl sticky top-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
              <CreditCard size={20} />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Payment</h3>
          </div>

          <div className="space-y-6 mb-10">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Subtotal</span>
              <span className="font-bold">${(totalCost * 0.85).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Shipping & Handling</span>
              <span className="font-bold">${(totalCost * 0.1).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tax (GST 5%)</span>
              <span className="font-bold">${(totalCost * 0.05).toLocaleString()}</span>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Amount</span>
                  <div className="text-4xl font-black mt-1">${totalCost.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                Pay & Schedule Pickup
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="mt-8 space-y-4">
            {[
              { icon: ShieldCheck, label: 'Secure SSL Encryption' },
              { icon: CheckCircle2, label: 'Money Back Guarantee' },
              { icon: Clock, label: '24/7 Support' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 text-slate-500">
                <item.icon size={14} className="text-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderSection;
