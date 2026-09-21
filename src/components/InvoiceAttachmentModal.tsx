import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Download, 
  Printer, 
  Mail, 
  FileText, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Order } from '../types';
import { COMPANY_DETAILS } from '../constants';
import { api } from '../services/api';
import { Logo } from './Logo';
import { toast } from 'sonner';

interface InvoiceAttachmentModalProps {
  order: Order;
  onClose: () => void;
  cachedOrder?: Order;
  isLoadingDetail?: boolean;
}

export const InvoiceAttachmentModal: React.FC<InvoiceAttachmentModalProps> = ({
  order,
  onClose,
  cachedOrder,
  isLoadingDetail = false
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const activeOrder = cachedOrder || order;

  // Compute tracking ID consistent with server.ts
  const orderIdStr = String(activeOrder.id || '');
  const isPrefixed = ['SH-', 'SW-', 'PH-', 'BB-'].some(p => orderIdStr.startsWith(p));
  const trackingId = isPrefixed ? orderIdStr : `BB-${orderIdStr.slice(0, 8).toUpperCase()}`;
  const invoiceNumber = `INV-${orderIdStr.slice(0, 8).toUpperCase()}`;

  // Formatted invoice date
  const formatDate = (dateVal: any) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  const invoiceDate = formatDate(activeOrder.createdAt || (activeOrder as any).created_at || Date.now());

  const dest = activeOrder.destination || {};
  const destName = dest.fullName || dest.name || (activeOrder as any).customerName || 'Valued Customer';
  const destAddressParts = [dest.addressLine1, dest.city, dest.state, dest.zipCode, dest.country].filter(Boolean);
  const destAddrStr = destAddressParts.length > 0 ? destAddressParts.join(', ') : 'Destination Address on file';
  const destPhone = dest.phone || (activeOrder as any).customerPhone || (activeOrder as any).phone || 'N/A';
  const destEmail = dest.email || (activeOrder as any).customerEmail || (activeOrder as any).email || 'N/A';

  // Normalize items array
  let rawItems = activeOrder.items;
  if (typeof rawItems === 'string') {
    try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
  }
  const items = Array.isArray(rawItems) ? rawItems : [];
  const productCost = items.reduce((acc: number, item: any) => acc + (Number(item.price) || 0), 0);
  const totalCost = Number(activeOrder.totalCost || (activeOrder as any).total_cost || 0);
  const shippingCharges = Math.max(0, totalCost - productCost);

  // Total items calculation
  const calculatedItemsCount = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0);
  const totalItemsCount = calculatedItemsCount > 0
    ? calculatedItemsCount
    : Number((activeOrder as any).totalItems || (activeOrder as any).total_items || (items.length > 0 ? items.length : 1));

  const serviceType = items.length > 0 && items[0].source ? items[0].source : (
    orderIdStr.startsWith('PH-') ? 'Home Pickup & International Courier' : 'International Express Shipping'
  );

  // Download PDF handler
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = await api.downloadInvoicePDF(activeOrder, COMPANY_DETAILS);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${trackingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Downloaded Invoice_${trackingId}.pdf`);
      } else {
        // Fallback: print to PDF
        window.print();
      }
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
      toast.error('Could not download PDF. Opening print dialog instead.');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // Send Email handler
  const handleSendEmail = async () => {
    if (!destEmail || destEmail === 'N/A' || !destEmail.includes('@')) {
      toast.error('No valid recipient email address found for this order.');
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await api.sendInvoicePDF(destEmail, activeOrder, COMPANY_DETAILS);
      if (res && res.success) {
        toast.success(`Invoice PDF attachment sent to ${destEmail}!`);
      } else {
        toast.error('Failed to send invoice email.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invoice email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div 
      id="invoice-attachment-modal-overlay"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed-none"
    >
      <motion.div
        id="invoice-attachment-modal-card"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-100 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-300/60 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white"
      >
        {/* Attachment Header Bar (Dark slate styled as email attachment bar) */}
        <div className="bg-slate-900 text-white px-4 py-3.5 sm:px-6 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
                <Paperclip size={12} />
                <span>Email Attachment</span>
              </div>
              <div className="text-sm font-bold truncate text-slate-100">
                Invoice_{trackingId}.pdf
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="invoice-download-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              title="Download PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              id="invoice-print-btn"
              onClick={() => window.print()}
              title="Print Invoice"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              id="invoice-email-btn"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              title={`Email PDF to ${destEmail}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              <span className="hidden sm:inline">Email</span>
            </button>

            <button
              id="invoice-modal-close-btn"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="overflow-y-auto p-3 sm:p-6 custom-scrollbar print:overflow-visible print:p-0">
          {isLoadingDetail && (
            <div className="mb-4 py-2 px-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 flex items-center justify-center gap-2 print:hidden">
              <Loader2 size={14} className="animate-spin" />
              <span>Verifying latest item details...</span>
            </div>
          )}

          {/* The Tax Invoice Sheet (Exact Layout of the PDF attached to email) */}
          <div 
            id="invoice-print-sheet"
            className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 text-slate-900 font-sans max-w-2xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none"
          >
            {/* Header: Logo & Company details */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
              <div>
                <Logo iconSize={22} />
              </div>
              <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-900 text-xs">{COMPANY_DETAILS.name}</div>
                <div>{COMPANY_DETAILS.address}</div>
                <div className="font-semibold text-slate-800">GSTIN: {COMPANY_DETAILS.gstin}</div>
                <div>Email: {COMPANY_DETAILS.email} | Web: {COMPANY_DETAILS.website}</div>
              </div>
            </div>

            {/* Document Title: TAX INVOICE */}
            <div className="text-center my-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                Tax Invoice
              </h2>
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 mb-5">
              <div>
                <span className="text-slate-500 font-medium">Invoice No: </span>
                <strong className="text-slate-900 font-black">{invoiceNumber}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Invoice Date: </span>
                <strong className="text-slate-900 font-bold">{invoiceDate}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Place of Supply: </span>
                <strong className="text-slate-800 font-semibold">Telangana (36)</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Reverse Charge: </span>
                <strong className="text-slate-800 font-semibold">No</strong>
              </div>
            </div>

            {/* Billing Address & Shipping Address Side-by-Side Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5 text-xs">
              {/* Billing Address */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Billing Address
                </div>
                <div className="font-bold text-slate-900 mb-1">{destName}</div>
                <div className="text-slate-600 leading-relaxed text-[11px] mb-2">{destAddrStr}</div>
                <div className="text-[11px] text-slate-500">Phone: <strong className="text-slate-700">{destPhone}</strong></div>
                <div className="text-[11px] text-slate-500">Email: <strong className="text-slate-700">{destEmail}</strong></div>
              </div>

              {/* Shipping Address */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Shipping Address
                </div>
                <div className="font-bold text-slate-900 mb-1">{destName}</div>
                <div className="text-slate-600 leading-relaxed text-[11px] mb-2">{destAddrStr}</div>
                <div className="text-[11px] text-slate-500">Phone: <strong className="text-slate-700">{destPhone}</strong></div>
                <div className="text-[11px] text-slate-500">Email: <strong className="text-slate-700">{destEmail}</strong></div>
              </div>
            </div>

            {/* Order Details Table */}
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Order Details
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                {/* Dark Header matching PDF */}
                <div className="bg-[#0f172a] text-white text-[11px] font-bold px-3 py-2 grid grid-cols-12 gap-2 uppercase tracking-wider">
                  <div className="col-span-6 sm:col-span-5">Item Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="hidden sm:block sm:col-span-1 text-right">Tax</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Total</div>
                </div>

                {/* Rows */}
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => {
                    const qty = item.quantity || 1;
                    const totalItemPrice = Number(item.price) || 0;
                    const unitPrice = qty > 0 ? totalItemPrice / qty : totalItemPrice;
                    const isEven = idx % 2 === 1;

                    return (
                      <div 
                        key={idx}
                        className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs text-slate-800 ${
                          isEven ? 'bg-[#f8fafc]' : 'bg-white'
                        } border-t border-slate-100`}
                      >
                        <div className="col-span-6 sm:col-span-5">
                          <div className="font-semibold text-slate-900">{item.name || 'Courier Item'}</div>
                          {(item.weight || item.source) && (
                            <div className="text-[10px] text-slate-500">
                              {item.weight ? `${item.weight} kg` : ''} {item.source ? `• ${item.source}` : ''}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 text-center font-medium text-slate-600">{qty}</div>
                        <div className="col-span-2 text-right font-medium text-slate-700">₹{Math.round(unitPrice).toLocaleString()}</div>
                        <div className="hidden sm:block sm:col-span-1 text-right text-slate-500 text-[11px]">₹0 (0%)</div>
                        <div className="col-span-2 sm:col-span-2 text-right font-bold text-slate-900">₹{Math.round(totalItemPrice).toLocaleString()}</div>
                      </div>
                    );
                  })
                ) : (
                  /* Fallback row when items have not yet been broken down separately */
                  <div className="grid grid-cols-12 gap-2 px-3 py-3 items-center text-xs text-slate-800 bg-white border-t border-slate-100">
                    <div className="col-span-6 sm:col-span-5">
                      <div className="font-semibold text-slate-900">
                        {orderIdStr.startsWith('PH-') ? 'Home Pickup & International Courier Shipment' : 'Doorstep Courier & Delivery Service'}
                      </div>
                      <div className="text-[10px] text-slate-500">Scheduled delivery to {dest.country || 'Destination'}</div>
                    </div>
                    <div className="col-span-2 text-center font-medium text-slate-600">1</div>
                    <div className="col-span-2 text-right font-medium text-slate-700">₹{Math.round(totalCost).toLocaleString()}</div>
                    <div className="hidden sm:block sm:col-span-1 text-right text-slate-500 text-[11px]">₹0 (0%)</div>
                    <div className="col-span-2 sm:col-span-2 text-right font-bold text-slate-900">₹{Math.round(totalCost).toLocaleString()}</div>
                  </div>
                )}

                {/* Total Items Summary Row */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs text-slate-900 bg-slate-100 border-t-2 border-slate-300 font-bold">
                  <div className="col-span-6 sm:col-span-5 font-black uppercase text-[11px] tracking-wider text-slate-900">
                    Total Items
                  </div>
                  <div className="col-span-2 text-center font-black text-indigo-700 text-sm">
                    {totalItemsCount}
                  </div>
                  <div className="col-span-2 text-right text-slate-400 font-normal text-[11px]">
                    —
                  </div>
                  <div className="hidden sm:block sm:col-span-1 text-right text-slate-400 font-normal text-[11px]">
                    ₹0
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-right font-black text-slate-900 text-xs sm:text-sm">
                    ₹{Math.round(items.length > 0 ? productCost : totalCost).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Summary: Shipping Details & Cost Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2 border-t border-slate-200 mb-6">
              {/* Shipping Details */}
              <div className="text-xs space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                  Shipping Details
                </div>
                <div><span className="text-slate-500">Service Type: </span><strong className="text-slate-800">{serviceType}</strong></div>
                <div><span className="text-slate-500">Total Items: </span><strong className="text-slate-900 font-bold">{totalItemsCount}</strong></div>
                <div><span className="text-slate-500">Origin: </span><strong className="text-slate-800">Hyderabad, Telangana, India</strong></div>
                <div><span className="text-slate-500">Destination: </span><strong className="text-slate-800">{dest.country || 'International'}</strong></div>
                <div><span className="text-slate-500">Tracking ID: </span><strong className="text-slate-900 font-mono">{trackingId}</strong></div>
                <div><span className="text-slate-500">GST Status: </span><strong className="text-slate-800">Tax Invoice under GST Rules (Telangana)</strong></div>
              </div>

              {/* Cost Breakdown Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Total Items:</span>
                  <span className="font-bold text-slate-900">{totalItemsCount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-medium text-slate-800">₹{Math.round(productCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling:</span>
                  <span className="font-medium text-slate-800">₹{Math.round(shippingCharges).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax / GST (0%):</span>
                  <span className="font-medium text-slate-800">₹0</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total Amount:</span>
                  <span className="font-black text-slate-900 text-lg">₹{Math.round(totalCost).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {activeOrder.paymentStatus || 'Paid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Computer Generated Disclaimer Footer */}
            <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
              <p className="italic">
                This is a computer-generated invoice and does not require a physical signature.
              </p>
              <p>
                Support: {COMPANY_DETAILS.email} | Website: {COMPANY_DETAILS.website} | GSTIN: {COMPANY_DETAILS.gstin}
              </p>
              <p className="text-slate-400">
                {COMPANY_DETAILS.name} • {COMPANY_DETAILS.address}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar (visible on mobile / desktop) */}
        <div className="p-3 bg-white border-t border-slate-200 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="text-xs text-slate-500 hidden sm:block">
            Sent to <span className="font-semibold text-slate-800">{destEmail}</span> as an attachment
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Download PDF Attachment</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default InvoiceAttachmentModal;
