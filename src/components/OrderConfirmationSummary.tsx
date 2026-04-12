import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Package, Weight, Calendar, MapPin, Mail, Send } from 'lucide-react';
import { ShippingItem, Appointment, User } from '../types';

interface OrderConfirmationSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShippingItem[];
  appointment: Appointment;
  user: User | null;
  onConfirm: () => Promise<void>;
  isSending: boolean;
}

export const OrderConfirmationSummary: React.FC<OrderConfirmationSummaryProps> = ({
  isOpen,
  onClose,
  items,
  appointment,
  user,
  onConfirm,
  isSending
}) => {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Confirmation</h2>
                  <p className="text-sm text-slate-500 font-medium">Review your items for the upcoming pickup</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Pickup Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Calendar size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">Pickup Schedule</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900">{appointment.date}</p>
                    <p className="text-sm text-slate-600 font-medium">{appointment.time}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">Pickup Address</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {appointment.customerAddress?.street}, {appointment.customerAddress?.apartment && `${appointment.customerAddress.apartment}, `}
                    {appointment.customerAddress?.city}, {appointment.customerAddress?.state} {appointment.customerAddress?.zip}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Package size={18} />
                    <span className="text-sm font-black uppercase tracking-wider">Items to be Collected</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                    <Weight size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Est. {totalWeight.toFixed(1)} kg</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{item.source} • Qty: {item.quantity || 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{item.weight} kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professional Note */}
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-sm text-emerald-800 leading-relaxed font-medium italic">
                  "Since you have opted for Home Pickup, our agent will verify these items, weigh them accurately, and process the final payment at your doorstep. A professional summary will be sent to your email upon confirmation."
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isSending}
                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Confirmation...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Confirm & Send Email
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
