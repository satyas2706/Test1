import React from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Clock, 
  ArrowUpDown, 
  Truck, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  Search,
  Image as ImageIcon,
  BarChart3,
  User as UserIcon,
  Warehouse,
  FileText,
  Calculator,
  Share,
  Lock,
  Phone
} from 'lucide-react';
import { ShippingItem, Order } from '../../types';

interface WarehouseManagementSectionProps {
  items: ShippingItem[];
  orders: Order[];
  updateItemStatus: (id: string, status: any) => void;
}

const WarehouseManagementSection = ({
  items,
  orders,
  updateItemStatus
}: WarehouseManagementSectionProps) => {
  const warehouseItems = items.filter(i => i.source === 'Warehouse' || i.source === 'Pickup');
  const pendingItems = warehouseItems.filter(i => i.status !== 'Received at Warehouse');
  const receivedItems = warehouseItems.filter(i => i.status === 'Received at Warehouse');
  
  // Group received items by customer for consolidation
  const itemsByCustomer = receivedItems.reduce((acc, item) => {
    // In a real app, we'd have customer info on the item. 
    // For this demo, we'll use a mock customer name or ID.
    const customerId = 'CUST-' + (item.id.charCodeAt(0) % 5 + 1);
    if (!acc[customerId]) acc[customerId] = [];
    acc[customerId].push(item);
    return acc;
  }, {} as Record<string, ShippingItem[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Warehouse Operations</h2>
          <p className="text-slate-500 mt-1">Operational control for receiving, consolidation, and processing.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Printer size={16} /> Print Manifest
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
            <RefreshCw size={16} /> Sync Inventory
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Inventory', value: warehouseItems.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Receiving', value: pendingItems.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Ready for Consolidation', value: Object.keys(itemsByCustomer).length, icon: ArrowUpDown, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Dispatched Today', value: orders.filter(o => o.status === 'Delivered').length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                  <StatIcon size={24} />
                </div>
                <span className="text-2xl font-black text-slate-900">{stat.value}</span>
              </div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</h4>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Operations Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Receiving Queue */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ArrowUpDown size={20} className="text-indigo-600" /> Receiving Queue
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search items..." 
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Item Details</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Source</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Weight</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Package size={48} className="opacity-20" />
                          <p className="font-bold">No pending items to receive.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                              {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon size={20} />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium">ID: {item.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                            item.source === 'Pickup' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {item.source.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-slate-700">{item.weight > 0 ? `${item.weight} kg` : 'TBD'}</div>
                        </td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => updateItemStatus(item.id, 'Received at Warehouse')}
                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                          >
                            Receive
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consolidation Hub */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-600" /> Consolidation Hub
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium italic">Grouped by customer for international dispatch.</p>
            </div>
            <div className="p-8 space-y-6">
              {Object.entries(itemsByCustomer).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">No items ready for consolidation.</p>
                </div>
              ) : (
                (Object.entries(itemsByCustomer) as [string, ShippingItem[]][]).map(([customerId, customerItems]) => (
                  <div key={customerId} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-purple-200 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">Customer: {customerId}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{customerItems.length} Items Ready</div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">
                        Create Shipment
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {customerItems.map(item => (
                        <div key={item.id} className="px-3 py-2 bg-white rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                          {item.name} ({item.weight}kg)
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Operations */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Warehouse size={120} />
            </div>
            <h3 className="text-lg font-black mb-6 relative z-10">Warehouse Layout</h3>
            <div className="grid grid-cols-4 gap-3 relative z-10">
              {['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'].map(zone => (
                <div key={zone} className="aspect-square bg-white/10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer group">
                  <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors">{zone}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-white/60">
              <span>Capacity: 64% Full</span>
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="w-[64%] h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900">Operational Tools</h3>
            <div className="space-y-3">
              {[
                { label: 'Scan Barcode', icon: Search, color: 'bg-blue-50 text-blue-600' },
                { label: 'Generate Manifest', icon: FileText, color: 'bg-purple-50 text-purple-600' },
                { label: 'Update Weights', icon: Calculator, color: 'bg-amber-50 text-amber-600' },
                { label: 'Export Inventory', icon: Share, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Security Logs', icon: Lock, color: 'bg-slate-50 text-slate-600' },
              ].map((action, i) => {
                const ActionIcon = action.icon;
                return (
                  <button key={i} className="w-full p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center gap-4 group">
                    <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <ActionIcon size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{action.label}</span>
                    <ChevronRight size={16} className="ml-auto text-slate-300" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-black mb-2">Warehouse Support</h3>
            <p className="text-xs text-indigo-100 mb-6 leading-relaxed">Need help with inventory or logistics? Contact your regional manager.</p>
            <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
              <Phone size={16} /> Call Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseManagementSection;

