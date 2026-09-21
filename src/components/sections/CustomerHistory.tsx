import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../Logo';
import { Truck, Package, Clock, ChevronRight, XCircle, Printer, Share, Mail, MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { User, Order } from '../../types';
import { WAREHOUSE_ADDRESS, COMPANY_DETAILS } from '../../constants';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { PickupItemThumbnail } from '../PickupItemThumbnail';
import { InvoiceAttachmentModal } from '../InvoiceAttachmentModal';

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
  const [isSendingInvoice, setIsSendingInvoice] = React.useState<string | null>(null);
  const [detailCache, setDetailCache] = React.useState<Record<string, Order>>({});
  const [loadingDetail, setLoadingDetail] = React.useState<boolean>(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const fetchDetail = React.useCallback(async (order: Order) => {
    if (!order || !order.id) return;
    if (order.items && order.items.length > 0) return;
    if (detailCache[order.id]) return;

    setLoadingDetail(true);
    setDetailError(null);
    try {
      const detailed = await api.getOrderDetail(order.id, currentUser?.id, currentUser?.email, currentUser?.role);
      if (detailed) {
        setDetailCache(prev => ({ ...prev, [order.id]: detailed }));
      }
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load order items');
    } finally {
      setLoadingDetail(false);
    }
  }, [currentUser, detailCache]);

  React.useEffect(() => {
    if (selectedOrderForInvoice) {
      fetchDetail(selectedOrderForInvoice);
    } else {
      setDetailError(null);
      setLoadingDetail(false);
    }
  }, [selectedOrderForInvoice, fetchDetail]);

  const activeInvoiceOrder = (selectedOrderForInvoice && detailCache[selectedOrderForInvoice.id]) || selectedOrderForInvoice;

  if (!currentUser) return null;
  const customerOrders = orders.filter(o => o.customerId === currentUser.id);

  return (
    <div className="space-y-8">
      <StaticShipmentTracker />
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold transition-all shadow-sm group cursor-pointer"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-indigo-600" />
          <span>Back</span>
        </button>
        <h2 className="text-3xl font-black text-slate-900">My Orders & History</h2>
      </div>
      
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
                  <div className="text-left select-text">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Order ID</div>
                    <div className="text-lg font-black text-slate-900">{order.id}</div>
                  </div>
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
                    <div className="text-sm font-bold">₹{order.totalCost}</div>
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
                    disabled={isSendingInvoice === order.id}
                    onClick={async () => {
                      setIsSendingInvoice(order.id);
                      try {
                        await api.sendInvoicePDF(order.destination.email, order, COMPANY_DETAILS);
                        toast.success('Invoice sent to email successfully!');
                      } catch (err: any) {
                        console.error(err);
                        toast.error(err.message || 'Failed to send invoice email.');
                        
                        // Fallback to mailto if server send fails
                        const subject = `Invoice for Order ${order.id}`;
                        const body = `Hi ${order.destination.fullName},\n\nHere is your invoice for order ${order.id}.\nTotal Amount: ₹${order.totalCost}\nDestination: ${order.destination.country}\n\nThank you for choosing Jiffex!`;
                        window.location.href = `mailto:${order.destination.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      } finally {
                        setIsSendingInvoice(null);
                      }
                    }}
                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {isSendingInvoice === order.id ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />} Email
                  </button>
                  <button 
                    onClick={() => {
                      const message = `*Jiffex Invoice*\n\nOrder ID: ${order.id}\nCustomer: ${order.destination.fullName}\nTotal Amount: ₹${order.totalCost}\nDestination: ${order.destination.country}\nStatus: ${order.status}\n\nThank you for choosing Jiffex!`;
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

      {/* Invoice Modal (Email Attachment View) */}
      <AnimatePresence>
        {selectedOrderForInvoice && (
          <InvoiceAttachmentModal
            order={selectedOrderForInvoice}
            onClose={() => setSelectedOrderForInvoice(null)}
            cachedOrder={activeInvoiceOrder}
            isLoadingDetail={loadingDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerHistory;
