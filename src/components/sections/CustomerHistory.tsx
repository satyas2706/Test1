import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../Logo';
import { Truck, Package, Clock, ChevronRight, XCircle, Printer, Share, Mail, MessageCircle } from 'lucide-react';
import { User, Order } from '../../types';
import { WAREHOUSE_ADDRESS } from '../../constants';

interface CustomerHistoryProps {
  currentUser: User | null;
  orders: Order[];
  navigateTo: (tab: any) => void;
  selectedOrderForInvoice: Order | null;
  setSelectedOrderForInvoice: (order: Order | null) => void;
  simulateNotification: (title: string, message: string) => void;
  StaticShipmentTracker: React.FC;
}

const CustomerHistory = ({
  currentUser,
  orders,
  navigateTo,
  selectedOrderForInvoice,
  setSelectedOrderForInvoice,
  simulateNotification,
  StaticShipmentTracker
}: CustomerHistoryProps) => {
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

                {/* Quick Share Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => {
                      const subject = `Invoice for Order ${order.id}`;
                      const body = `Hi ${order.destination.fullName},\n\nHere is your invoice for order ${order.id}.\nTotal Amount: $${order.totalCost}\nDestination: ${order.destination.country}\n\nThank you for choosing JiffEX!`;
                      window.location.href = `mailto:${order.destination.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-1"
                  >
                    <Mail size={12} /> Email
                  </button>
                  <button 
                    onClick={() => {
                      const message = `*JiffEX Invoice*\n\nOrder ID: ${order.id}\nCustomer: ${order.destination.fullName}\nTotal Amount: $${order.totalCost}\nDestination: ${order.destination.country}\nStatus: ${order.status}\n\nThank you for choosing JiffEX!`;
                      const cleanPhone = order.destination.phone.replace(/\D/g, '');
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-1"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </button>
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
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package size={20} />}
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

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => window.print()}
                    className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={18} /> Print
                  </button>
                  <button 
                    onClick={() => {
                      const subject = `Invoice for Order ${selectedOrderForInvoice.id}`;
                      const body = `Hi ${selectedOrderForInvoice.destination.fullName},\n\nHere is your invoice for order ${selectedOrderForInvoice.id}.\nTotal Amount: $${selectedOrderForInvoice.totalCost}\nDestination: ${selectedOrderForInvoice.destination.country}\n\nThank you for choosing JiffEX!`;
                      window.location.href = `mailto:${selectedOrderForInvoice.destination.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                    className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={18} /> Email
                  </button>
                  <button 
                    onClick={() => {
                      const message = `*JiffEX Invoice*\n\nOrder ID: ${selectedOrderForInvoice.id}\nCustomer: ${selectedOrderForInvoice.destination.fullName}\nTotal Amount: $${selectedOrderForInvoice.totalCost}\nDestination: ${selectedOrderForInvoice.destination.country}\nStatus: ${selectedOrderForInvoice.status}\n\nThank you for choosing JiffEX!`;
                      const cleanPhone = selectedOrderForInvoice.destination.phone.replace(/\D/g, '');
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `JiffEX Invoice - ${selectedOrderForInvoice.id}`,
                          text: `Invoice for order ${selectedOrderForInvoice.id} to ${selectedOrderForInvoice.destination.country}. Total: $${selectedOrderForInvoice.totalCost}`,
                          url: window.location.href
                        }).catch(console.error);
                      }
                    }}
                    className="py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Share size={18} /> Share
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerHistory;
