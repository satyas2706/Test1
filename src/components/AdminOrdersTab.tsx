import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Search, 
  Copy, 
  Phone, 
  Mail, 
  Globe, 
  Printer, 
  Eye, 
  FileSpreadsheet, 
  RefreshCw, 
  X, 
  Box, 
  User as UserIcon, 
  Send,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Order, AgentProfile, ShippingStatus } from '../types';
import { api } from '../services/api';

interface AdminOrdersTabProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  agents: AgentProfile[];
  handleUpdateOrderStatus: (orderId: string, status: ShippingStatus) => Promise<void>;
  handleAssignAgent: (orderId: string, agentId: string) => Promise<void>;
  isLoading?: boolean;
  ordersLoadError?: string | null;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  setOrders,
  agents,
  handleUpdateOrderStatus,
  handleAssignAgent,
  isLoading = false,
  ordersLoadError = null,
}) => {
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('All');
  const [ordersPaymentFilter, setOrdersPaymentFilter] = useState('All');
  const [ordersSort, setOrdersSort] = useState<'newest' | 'oldest' | 'weight_desc' | 'cost_desc'>('newest');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  const handleRefreshAllOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const refreshed = await api.getAllOrders();
      if (refreshed === null) {
        toast.error('Unable to reach server. Please check your connection.');
      } else if (refreshed.length > 0) {
        setOrders(refreshed);
        toast.success(`Successfully loaded ${refreshed.length} total orders from database.`);
      } else {
        toast.info('Orders list is up to date.');
      }
    } catch (err: any) {
      toast.error('Failed to refresh orders: ' + err.message);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  const handleExportOrdersCsv = () => {
    try {
      const headers = ['Order ID', 'Created Date', 'Customer Name', 'Phone', 'Email', 'Origin', 'Destination City', 'Destination Country', 'Fulfillment Status', 'Payment Status', 'Total Weight (kg)', 'Total Cost (INR)', 'Items Count'];
      const rows = filteredOrdersList.map(o => [
        `"${o.id}"`,
        `"${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''}"`,
        `"${(o.pickupAddress?.fullName || o.customerName || o.destination?.fullName || '').replace(/"/g, '""')}"`,
        `"${(o.pickupAddress?.phone || o.phone || o.destination?.phone || '').replace(/"/g, '""')}"`,
        `"${(o.pickupAddress?.email || o.email || o.destination?.email || '').replace(/"/g, '""')}"`,
        `"${(o.pickupAddress?.addressLine1 || (o as any).address || 'Hyderabad').replace(/"/g, '""')}"`,
        `"${(o.destination?.city || 'Hyderabad').replace(/"/g, '""')}"`,
        `"${(o.destination?.country || 'India').replace(/"/g, '""')}"`,
        `"${o.status}"`,
        `"${o.paymentStatus || 'Pending'}"`,
        o.totalWeight || 0,
        o.totalCost || 0,
        o.items?.length || 0
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `jiffex_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${rows.length} orders to CSV.`);
    } catch (e) {
      toast.error('Failed to export orders to CSV.');
    }
  };

  const filteredOrdersList = useMemo(() => {
    return orders.filter(order => {
      // Status Filter
      if (ordersStatusFilter !== 'All') {
        if (ordersStatusFilter === 'Scheduled') {
          if (order.status !== 'Scheduled' && order.status !== 'Pending Pickup') return false;
        } else if (ordersStatusFilter === 'Picked Up') {
          if (order.status !== 'Picked Up') return false;
        } else if (ordersStatusFilter === 'In Warehouse') {
          if (order.status !== 'In Warehouse' && order.status !== 'Received at Warehouse') return false;
        } else if (ordersStatusFilter === 'Ready to Ship') {
          if (order.status !== 'Ready to Ship') return false;
        } else if (ordersStatusFilter === 'In Transit') {
          if (order.status !== 'In Transit') return false;
        } else if (ordersStatusFilter === 'Out for Delivery') {
          if (order.status !== 'Out for Delivery') return false;
        } else if (ordersStatusFilter === 'Delivered') {
          if (order.status !== 'Delivered' && order.status !== 'Completed') return false;
        } else if (ordersStatusFilter === 'Cancelled') {
          if (order.status !== 'Cancelled') return false;
        } else {
          if (order.status !== ordersStatusFilter) return false;
        }
      }

      // Payment Filter
      if (ordersPaymentFilter !== 'All') {
        const pStatus = (order.paymentStatus || 'Pending').toLowerCase();
        if (ordersPaymentFilter === 'Paid' && pStatus !== 'paid') return false;
        if (ordersPaymentFilter === 'Pending' && pStatus !== 'pending') return false;
      }

      // Search Query
      if (ordersSearch.trim()) {
        const q = ordersSearch.toLowerCase().trim();
        const idMatch = (order.id || '').toLowerCase().includes(q);
        const nameMatch = ((order.pickupAddress?.fullName || order.customerName || order.destination?.fullName || '')).toLowerCase().includes(q);
        const phoneMatch = ((order.pickupAddress?.phone || order.phone || order.destination?.phone || '')).toLowerCase().includes(q);
        const emailMatch = ((order.pickupAddress?.email || order.email || order.destination?.email || '')).toLowerCase().includes(q);
        const destCityMatch = ((order.destination?.city || '')).toLowerCase().includes(q);
        const destCountryMatch = ((order.destination?.country || '')).toLowerCase().includes(q);
        const trackMatch = ((order.trackingNumber || '')).toLowerCase().includes(q);
        const agentMatch = ((order.assignedAgent?.name || '')).toLowerCase().includes(q);
        const itemsMatch = (order.items || []).some(it => (it.name || '').toLowerCase().includes(q));

        if (!idMatch && !nameMatch && !phoneMatch && !emailMatch && !destCityMatch && !destCountryMatch && !trackMatch && !agentMatch && !itemsMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (ordersSort === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (ordersSort === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (ordersSort === 'weight_desc') {
        return (b.totalWeight || 0) - (a.totalWeight || 0);
      } else if (ordersSort === 'cost_desc') {
        return (b.totalCost || 0) - (a.totalCost || 0);
      }
      return 0;
    });
  }, [orders, ordersSearch, ordersStatusFilter, ordersPaymentFilter, ordersSort]);

  return (
    <div className="space-y-6">
      {/* Header & Controls Panel */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Consignments & Orders Directory</h2>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black border border-indigo-100">
                {orders.length} Total
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Complete master list of all cross-border consignments, home pickups, warehouse receipts, and deliveries.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAllOrders}
              disabled={isRefreshingOrders}
              className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <RefreshCw size={15} className={isRefreshingOrders ? "animate-spin text-indigo-600" : "text-slate-500"} />
              {isRefreshingOrders ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleExportOrdersCsv}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <FileSpreadsheet size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Bookings</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {isLoading && orders.length === 0 ? <span className="text-slate-300 animate-pulse">--</span> : ordersLoadError && orders.length === 0 ? <span className="text-amber-400">--</span> : orders.length}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Weight Volume</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {isLoading && orders.length === 0 ? <span className="text-indigo-300 animate-pulse">--</span> : ordersLoadError && orders.length === 0 ? <span className="text-amber-400">--</span> : `${orders.reduce((sum, o) => sum + (o.totalWeight || 0), 0).toFixed(1)} kg`}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Declared Value</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {isLoading && orders.length === 0 ? <span className="text-emerald-300 animate-pulse">--</span> : ordersLoadError && orders.length === 0 ? <span className="text-amber-400">--</span> : `₹${orders.reduce((sum, o) => sum + (o.totalCost || 0), 0).toLocaleString()}`}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending Fulfillment</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">
              {isLoading && orders.length === 0 ? <span className="text-amber-300 animate-pulse">--</span> : ordersLoadError && orders.length === 0 ? <span className="text-amber-400">--</span> : orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={ordersSearch}
              onChange={(e) => setOrdersSearch(e.target.value)}
              placeholder="Search by Order ID, Customer Name, Phone, Email, Destination, City, Tracking #..."
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
            {ordersSearch && (
              <button
                onClick={() => setOrdersSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Payment Filter & Sort Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment:</span>
              <select
                value={ordersPaymentFilter}
                onChange={(e) => setOrdersPaymentFilter(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Payment</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending / COD</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sort:</span>
              <select
                value={ordersSort}
                onChange={(e) => setOrdersSort(e.target.value as any)}
                className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="weight_desc">Weight: High to Low</option>
                <option value="cost_desc">Cost: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'All', label: 'All Orders', count: orders.length },
            { id: 'Scheduled', label: 'Scheduled / Pickups', count: orders.filter(o => o.status === 'Scheduled' || o.status === 'Pending Pickup').length },
            { id: 'Picked Up', label: 'Picked Up', count: orders.filter(o => o.status === 'Picked Up').length },
            { id: 'In Warehouse', label: 'In Warehouse', count: orders.filter(o => o.status === 'In Warehouse' || o.status === 'Received at Warehouse').length },
            { id: 'Ready to Ship', label: 'Ready to Ship', count: orders.filter(o => o.status === 'Ready to Ship').length },
            { id: 'In Transit', label: 'In Transit', count: orders.filter(o => o.status === 'In Transit').length },
            { id: 'Out for Delivery', label: 'Out for Delivery', count: orders.filter(o => o.status === 'Out for Delivery').length },
            { id: 'Delivered', label: 'Delivered', count: orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length },
            { id: 'Cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setOrdersStatusFilter(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                ordersStatusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                ordersStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Master Orders Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        {isLoading && orders.length === 0 ? (
          <div className="text-center py-24 px-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Loading dashboard data...</h3>
            <p className="text-sm text-slate-400 mt-1">
              Synchronizing consignment and booking records with database.
            </p>
          </div>
        ) : ordersLoadError && orders.length === 0 ? (
          <div className="text-center py-24 px-4">
            <RefreshCw className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Unable to load dashboard data. Retrying...</h3>
            <p className="text-sm text-slate-400 mt-1">
              Failed to connect to the orders service. A background retry will automatically update once available.
            </p>
          </div>
        ) : filteredOrdersList.length === 0 ? (
          <div className="text-center py-24 px-4">
            <Box className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No Orders Found</h3>
            <p className="text-sm text-slate-400 mt-2">
              {ordersSearch ? `No orders matching "${ordersSearch}"` : 'No orders in this category.'}
            </p>
            {ordersSearch && (
              <button
                onClick={() => { setOrdersSearch(''); setOrdersStatusFilter('All'); }}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer & Contact</th>
                  <th className="px-6 py-4">Route & Destination</th>
                  <th className="px-6 py-4">Items & Weight</th>
                  <th className="px-6 py-4">Amount & Payment</th>
                  <th className="px-6 py-4">Fulfillment Status</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {filteredOrdersList.map((order) => {
                  const customerName = order.pickupAddress?.fullName || order.customerName || order.destination?.fullName || order.destination?.customerName || 'Customer';
                  const phone = order.pickupAddress?.phone || order.phone || order.destination?.phone || '';
                  const email = order.pickupAddress?.email || order.email || order.destination?.email || '';
                  const destCity = order.destination?.city || 'Hyderabad';
                  const destCountry = order.destination?.country || 'India';
                  const originAddress = order.pickupAddress?.addressLine1 || (order as any).address || 'Pickup Point';
                  const itemCount = order.items?.length || 0;
                  const weight = order.totalWeight || 0;
                  const cost = order.totalCost || 0;
                  const createdDateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                  const createdTimeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group">
                      {/* Order ID & Date */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                              #{order.id}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.id);
                                toast.success(`Copied ${order.id} to clipboard!`);
                              }}
                              title="Copy Order ID"
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {createdDateStr} {createdTimeStr ? `• ${createdTimeStr}` : ''}
                          </div>
                        </div>
                      </td>

                      {/* Customer & Contact */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <div className="font-black text-slate-900 text-sm">{customerName}</div>
                          {phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span>{phone}</span>
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[170px]" title={email}>
                              <Mail size={10} className="text-slate-400 shrink-0" />
                              <span className="truncate">{email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Route & Destination */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1 max-w-[200px]">
                          <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs">
                            <Globe size={13} className="text-indigo-500 shrink-0" />
                            <span>{destCity}, {destCountry}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1" title={originAddress}>
                            From: {originAddress}
                          </div>
                        </div>
                      </td>

                      {/* Items & Weight */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-black">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {weight > 0 ? `${weight} kg` : 'Weight pending'}
                            </span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[160px]" title={order.items.map(i => i.name).join(', ')}>
                              {order.items.map(i => i.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Amount & Payment */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <div className="font-black text-slate-900 text-sm">
                            ₹{cost.toLocaleString()}
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                            order.status === 'Delivered' || order.status === 'Completed'
                              ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200'
                              : order.status === 'In Transit' || order.status === 'Out for Delivery'
                              ? 'bg-blue-100/70 text-blue-800 border border-blue-200'
                              : order.status === 'In Warehouse' || order.status === 'Received at Warehouse' || order.status === 'Ready to Ship'
                              ? 'bg-indigo-100/70 text-indigo-800 border border-indigo-200'
                              : order.status === 'Picked Up'
                              ? 'bg-purple-100/70 text-purple-800 border border-purple-200'
                              : order.status === 'Cancelled'
                              ? 'bg-red-100/70 text-red-800 border border-red-200'
                              : 'bg-amber-100/70 text-amber-800 border border-amber-200'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {order.status}
                          </span>

                          {/* Quick Status Change */}
                          <div className="relative mt-1">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as ShippingStatus)}
                              className="w-full text-[10px] font-black p-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 cursor-pointer text-slate-700"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Pending Pickup">Pending Pickup</option>
                              <option value="Picked Up">Picked Up</option>
                              <option value="In Warehouse">In Warehouse</option>
                              <option value="Ready to Ship">Ready to Ship</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Agent */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1.5 min-w-[150px]">
                          {order.assignedAgent ? (
                            <div className="flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1.5 rounded-xl border border-indigo-100">
                              <UserIcon size={12} className="text-indigo-600 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[11px] font-black text-indigo-900 truncate">{order.assignedAgent.name}</div>
                                <div className="text-[9px] text-indigo-500 truncate">{order.assignedAgent.phone || order.assignedAgent.vehicleNumber}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/60 inline-block">
                              Unassigned
                            </div>
                          )}

                          {/* Reassign Agent Dropdown */}
                          <select
                            className="w-full text-[10px] font-black p-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 cursor-pointer text-slate-700 hover:bg-slate-100 transition-colors"
                            onChange={(e) => {
                              handleAssignAgent(order.id, e.target.value);
                            }}
                            value={order.assignedAgentId || (order as any).destination?.assignedAgentId || ''}
                          >
                            <option value="">{order.assignedAgent ? 'Change Agent...' : 'Assign Field Agent...'}</option>
                            {order.assignedAgent && (
                              <option value="">✕ Unassign Agent</option>
                            )}
                            {agents.filter(a => a.status === 'Active').map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.vehicleNumber || a.phone || 'Field'})</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderDetail(order)}
                            className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-sm"
                            title="View Full Order Details"
                          >
                            <Eye size={14} />
                          </button>
                          {phone && (
                            <button
                              onClick={() => {
                                const cleanPhone = phone.replace(/\D/g, '');
                                const msg = encodeURIComponent(`Hi ${customerName}, this is Jiffex Fulfilment regarding your order #${order.id} (${order.status}).`);
                                window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, '_blank');
                              }}
                              className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-xs font-black transition-all shadow-sm"
                              title="WhatsApp Customer"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              window.open(`/manifest/${order.id}`, '_blank');
                            }}
                            className="p-2 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-xl text-xs font-black transition-all shadow-sm"
                            title="Print Waybill / Manifest"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black">
                    #{selectedOrderDetail.id}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                    selectedOrderDetail.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {selectedOrderDetail.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">Consignment Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">Pickup / Origin</h4>
                <div className="text-sm font-black text-slate-900">
                  {selectedOrderDetail.pickupAddress?.fullName || selectedOrderDetail.customerName || selectedOrderDetail.destination?.fullName || 'Customer'}
                </div>
                <div className="text-xs text-slate-600">
                  {selectedOrderDetail.pickupAddress?.phone || selectedOrderDetail.phone || selectedOrderDetail.destination?.phone || 'No phone'}
                </div>
                <div className="text-xs text-slate-600">
                  {selectedOrderDetail.pickupAddress?.addressLine1 || (selectedOrderDetail as any).address || 'Hyderabad, India'}
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">Destination</h4>
                <div className="text-sm font-black text-slate-900">
                  {selectedOrderDetail.destination?.fullName || selectedOrderDetail.customerName || 'Recipient'}
                </div>
                <div className="text-xs text-slate-600">
                  {selectedOrderDetail.destination?.phone || 'No recipient phone'}
                </div>
                <div className="text-xs text-slate-600">
                  {selectedOrderDetail.destination?.addressLine1 || ''} {selectedOrderDetail.destination?.city || ''}, {selectedOrderDetail.destination?.country || 'India'}
                </div>
              </div>
            </div>

            {/* Assigned Field Agent Section */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Assigned Field Agent</h4>
                  {selectedOrderDetail.assignedAgent ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black uppercase">Unassigned</span>
                  )}
                </div>
                {selectedOrderDetail.assignedAgent ? (
                  <p className="text-xs text-slate-700 font-bold">
                    {selectedOrderDetail.assignedAgent.name} • {selectedOrderDetail.assignedAgent.phone || selectedOrderDetail.assignedAgent.vehicleNumber || 'Field Specialist'}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    No field agent has been dispatched for this consignment.
                  </p>
                )}
              </div>

              <div className="min-w-[200px]">
                <select
                  className="w-full text-xs font-black p-2.5 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 cursor-pointer text-slate-800 shadow-sm"
                  value={selectedOrderDetail.assignedAgentId || (selectedOrderDetail as any).destination?.assignedAgentId || ''}
                  onChange={async (e) => {
                    const agentId = e.target.value;
                    await handleAssignAgent(selectedOrderDetail.id, agentId);
                    const updatedAgent = agents.find(a => a.id === agentId) || undefined;
                    setSelectedOrderDetail(prev => prev ? {
                      ...prev,
                      assignedAgent: updatedAgent,
                      assignedAgentId: agentId || undefined
                    } : null);
                  }}
                >
                  <option value="">{selectedOrderDetail.assignedAgent ? 'Change Agent...' : 'Assign Field Agent...'}</option>
                  {selectedOrderDetail.assignedAgent && (
                    <option value="">✕ Unassign Agent</option>
                  )}
                  {agents.filter(a => a.status === 'Active').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.vehicleNumber || a.phone || 'Field'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Itemized Cargo ({selectedOrderDetail.items?.length || 0} items)</h4>
              {selectedOrderDetail.items && selectedOrderDetail.items.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {selectedOrderDetail.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-slate-900">{item.name}</span>
                        {item.category && <span className="ml-2 text-[10px] text-slate-400">({item.category})</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500 font-bold">Qty: {item.quantity || 1}</span>
                        <span className="font-black text-indigo-600">{item.weight || 0} kg</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">{item.status || 'Pending'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  No item list specified. General cargo load.
                </div>
              )}
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                <div className="text-[10px] font-black uppercase text-slate-400">Total Weight</div>
                <div className="text-lg font-black text-slate-900">{selectedOrderDetail.totalWeight || 0} kg</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                <div className="text-[10px] font-black uppercase text-slate-400">Total Cost</div>
                <div className="text-lg font-black text-emerald-600">₹{(selectedOrderDetail.totalCost || 0).toLocaleString()}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                <div className="text-[10px] font-black uppercase text-slate-400">Payment</div>
                <div className="text-lg font-black text-slate-900">{selectedOrderDetail.paymentStatus || 'Pending'}</div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => window.open(`/manifest/${selectedOrderDetail.id}`, '_blank')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center gap-2"
              >
                <Printer size={15} /> Print Manifest
              </button>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
