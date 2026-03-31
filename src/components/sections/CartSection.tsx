import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  Heart, 
  ShoppingBag, 
  PlusCircle, 
  Calendar, 
  Info, 
  Trash2, 
  Plus, 
  Minus,
  X,
  AlertTriangle,
  Copy,
  Edit3,
  MapPin,
  Clock,
  Upload
} from 'lucide-react';
import { ShippingItem, Appointment, User } from '../../types';
import { WAREHOUSE_ADDRESS, SHIPPING_RATES, PROHIBITED_ITEMS } from '../../constants';

interface CartSectionProps {
  mode?: 'Pickup' | 'Warehouse';
  items: ShippingItem[];
  appointments: Appointment[];
  currentUser: User | null;
  customerWarehouseId: string;
  cartItemName: string;
  setCartItemName: (val: string) => void;
  cartItemWeight: string | number;
  setCartItemWeight: (val: string | number) => void;
  cartItemQuantity: number;
  setCartItemQuantity: (val: number) => void;
  cartItemFragile: boolean;
  setCartItemFragile: (val: boolean) => void;
  cartItemInvoiceNumber: string;
  setCartItemInvoiceNumber: (val: string) => void;
  cartItemRemarks: string;
  setCartItemRemarks: (val: string) => void;
  cartItemSource: 'Pickup' | 'Warehouse' | 'Store';
  setCartItemSource: (val: 'Pickup' | 'Warehouse' | 'Store') => void;
  addItem: (item: any, source: string) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, delta: number) => void;
  removeStoreItem: (name: string) => void;
  handleCheckout: () => void;
  navigateTo: (tab: any) => void;
  editingPickupId: string | null;
  setEditingPickupId: (id: string | null) => void;
  pickupDetails: any;
  setPickupDetails: (details: any) => void;
  pickupName: string;
  setPickupName: (val: string) => void;
  pickupPhone: string;
  setPickupPhone: (val: string) => void;
  pickupAddress: any;
  setPickupAddress: (val: any) => void;
  selectedSlot: string;
  setSelectedSlot: (val: string) => void;
  confirmPickup: () => void;
  updatePickup: () => void;
  storeProducts: any[];
}

const CartSection = ({
  mode,
  items,
  appointments,
  currentUser,
  customerWarehouseId,
  cartItemName,
  setCartItemName,
  cartItemWeight,
  setCartItemWeight,
  cartItemQuantity,
  setCartItemQuantity,
  cartItemFragile,
  setCartItemFragile,
  cartItemInvoiceNumber,
  setCartItemInvoiceNumber,
  cartItemRemarks,
  setCartItemRemarks,
  cartItemSource,
  setCartItemSource,
  addItem,
  removeItem,
  updateItemQuantity,
  removeStoreItem,
  handleCheckout,
  navigateTo,
  editingPickupId,
  setEditingPickupId,
  pickupDetails,
  setPickupDetails,
  pickupName,
  setPickupName,
  pickupPhone,
  setPickupPhone,
  pickupAddress,
  setPickupAddress,
  selectedSlot,
  setSelectedSlot,
  confirmPickup,
  updatePickup,
  storeProducts
}: CartSectionProps) => {
  const handleAdd = () => {
    if (!cartItemName) return;
    const unitWeight = typeof cartItemWeight === 'number' ? cartItemWeight : 0;
    addItem({ 
      name: cartItemName, 
      weight: unitWeight * cartItemQuantity,
      quantity: cartItemQuantity,
      fragile: cartItemFragile,
      invoiceNumber: cartItemInvoiceNumber,
      remarks: cartItemRemarks
    }, mode || cartItemSource);
    setCartItemName('');
    setCartItemWeight('');
    setCartItemQuantity(1);
    setCartItemFragile(false);
    setCartItemInvoiceNumber('');
    setCartItemRemarks('');
  };

  const handleCopyAddress = () => {
    const addressText = `${WAREHOUSE_ADDRESS.name}\nAttn: ${customerWarehouseId}\n${WAREHOUSE_ADDRESS.street}\n${WAREHOUSE_ADDRESS.city}, ${WAREHOUSE_ADDRESS.state} ${WAREHOUSE_ADDRESS.zip}\n${WAREHOUSE_ADDRESS.country}\nTel: ${WAREHOUSE_ADDRESS.phone}`;
    navigator.clipboard.writeText(addressText);
    alert('Warehouse address copied to clipboard!');
  };

  const hasActivePickup = appointments.some(a => a.status === 'Scheduled');
  const hasCompletedPickup = appointments.some(a => a.status === 'Completed');

  const displayItems = mode 
    ? (mode === 'Warehouse' 
        ? items.filter(i => i.source === 'Warehouse' && !i.submitted)
        : items.filter(i => i.source === mode))
    : items.filter(i => i.source !== 'Warehouse' || i.submitted);

  const displayWeight = displayItems.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);
  const hasTBDWeight = displayItems.some(i => i.weight === 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className={`${mode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
        {/* Progress Bar */}
        {!mode && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Shipment Progress</h4>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {displayItems.every(i => i.status === 'Received at Warehouse') && displayItems.length > 0 ? 'Ready to Ship' : 'In Progress'}
              </span>
            </div>
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-1000" 
                style={{ 
                  width: `${
                    displayItems.every(i => i.status === 'Received at Warehouse') && displayItems.length > 0 ? '100%' :
                    displayItems.some(i => i.status === 'Received at Warehouse') ? '75%' :
                    appointments.length > 0 ? '50%' : '25%'
                  }` 
                }} 
              />
              <div className="relative flex justify-between">
                {[
                  { label: 'Items Added', icon: Package, active: displayItems.length > 0 },
                  { label: 'Pickup Scheduled', icon: Truck, active: appointments.length > 0 },
                  { label: 'Received', icon: CheckCircle2, active: displayItems.some(i => i.status === 'Received at Warehouse') },
                  { label: 'Ready to Ship', icon: ArrowRight, active: displayItems.every(i => i.status === 'Received at Warehouse') && displayItems.length > 0 }
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${step.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                      <step.icon size={18} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${step.active ? 'text-indigo-600' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Unified Cart Header */}
        {!mode && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-black text-slate-900">My Shipping Cart</h2>
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <ShoppingCart size={24} />
              </div>
            </div>
            <p className="text-slate-500">Review and manage all your items before checkout.</p>
          </div>
        )}

        {/* Heart-touching Warehouse Message */}
        {mode === 'Warehouse' && (
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
                <Heart size={240} fill="currentColor" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Heart size={20} className="fill-white" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Connecting Hearts Across Borders</span>
                </div>
                <h2 className="text-3xl font-black mb-4 leading-tight">Distance shouldn't keep you from the things you love.</h2>
                <p className="text-lg text-emerald-50/90 leading-relaxed font-medium">
                  Whether it's a mother's handmade sweets, a piece of home, or something special from India, 
                  you don't need to worry about how to get it to the US. We are here, ready to gather, 
                  consolidate, and safely deliver your world to you.
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Package size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">1. Send Your Own Items</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Have items at home? Pack them up and send them directly to our warehouse. We'll receive them, check the contents, and add them to your global shipment.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">2. Shop Online & Send to Us</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Buying from Amazon, Flipkart, or any online store? Simply use our warehouse address as your delivery address at checkout. We'll handle the rest!
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Add Items / Schedule Pickup Card */}
        {mode && (mode === 'Warehouse' || !appointments.length || editingPickupId) && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                {mode === 'Warehouse' ? <PlusCircle className="text-emerald-600" /> : <Calendar className="text-indigo-600" />}
                {editingPickupId ? 'Update Pickup Schedule' : (mode === 'Warehouse' ? 'Add Your Items' : (currentUser ? 'Schedule Pickup from home' : 'Sign in to Schedule Pickup'))}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mode === 'Warehouse' ? (
                <>
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Warehouse Shipping Address</h4>
                      <div className="space-y-2 text-sm">
                        <p className="font-bold text-slate-900">{WAREHOUSE_ADDRESS.name}</p>
                        <p className="text-indigo-600 font-black">Attn: {customerWarehouseId}</p>
                        <p className="text-slate-600">{WAREHOUSE_ADDRESS.street}</p>
                        <p className="text-slate-600">{WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.state} {WAREHOUSE_ADDRESS.zip}</p>
                        <p className="text-slate-600">{WAREHOUSE_ADDRESS.country}</p>
                        <p className="text-slate-600">Tel: {WAREHOUSE_ADDRESS.phone}</p>
                      </div>
                      <button 
                        onClick={handleCopyAddress}
                        className="mt-6 w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Copy size={14} /> Copy Address
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Item Details</h4>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Item Name (e.g. Amazon Order #123)"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        value={cartItemName}
                        onChange={e => setCartItemName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Weight (kg)"
                          className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                          value={cartItemWeight}
                          onChange={e => setCartItemWeight(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-2">
                          <button onClick={() => setCartItemQuantity(Math.max(1, cartItemQuantity - 1))} className="p-1 hover:bg-slate-200 rounded-lg transition-colors"><Minus size={14} /></button>
                          <span className="w-8 text-center font-bold text-sm">{cartItemQuantity}</span>
                          <button onClick={() => setCartItemQuantity(cartItemQuantity + 1)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors"><Plus size={14} /></button>
                        </div>
                      </div>
                      <button 
                        onClick={handleAdd}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        Add to Warehouse List
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                          value={pickupName}
                          onChange={e => setPickupName(e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                        <input 
                          type="tel" 
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                          value={pickupPhone}
                          onChange={e => setPickupPhone(e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Street Address</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                          value={pickupAddress.street}
                          onChange={e => setPickupAddress({...pickupAddress, street: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Preferred Time Slot</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['09:00 AM - 12:00 PM', '12:00 PM - 03:00 PM', '03:00 PM - 06:00 PM', '06:00 PM - 09:00 PM'].map(slot => (
                        <button 
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border-2 text-[10px] font-bold transition-all ${selectedSlot === slot ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:border-slate-100 text-slate-500'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={editingPickupId ? updatePickup : confirmPickup}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4"
                    >
                      {editingPickupId ? 'Update Pickup' : 'Confirm Pickup Schedule'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="space-y-4">
          {displayItems.length === 0 && appointments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <ShoppingCart size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Your cart is empty</h3>
              <p className="text-slate-500 mt-2 mb-8">Add items or schedule a pickup to get started.</p>
              <button 
                onClick={() => navigateTo('home')}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Pickup Card */}
              {appointments.map(apt => (
                <motion.div 
                  key={apt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl shadow-indigo-500/5 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Truck size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                          <Truck size={28} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Scheduled Pickup</div>
                          <h3 className="text-xl font-black text-slate-900">{apt.id}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingPickupId(apt.id)}
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => removeItem(apt.id)}
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-slate-400" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</div>
                          <div className="text-sm font-bold text-slate-700">{apt.date} • {apt.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-slate-400" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Location</div>
                          <div className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{apt.address}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-slate-400" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Status</div>
                          <div className="text-sm font-bold text-indigo-600">{apt.status}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Items List */}
              <div className="grid grid-cols-1 gap-4">
                {displayItems.map(item => (
                  <motion.div 
                    key={item.id}
                    layout
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden relative">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package size={24} />
                        )}
                        {item.fragile && (
                          <div className="absolute top-1 right-1">
                            <AlertTriangle size={12} className="text-amber-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.source}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.weight} kg</span>
                          {item.status && (
                            <>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${item.status === 'Received at Warehouse' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {item.status}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {item.source === 'Store' && (
                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                          <button 
                            onClick={() => updateItemQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateItemQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm font-black text-slate-900">${(item.price || 0) * (item.quantity || 1)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Warehouse Submission Section */}
              {mode === 'Warehouse' && displayItems.length > 0 && (
                <div className="p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Upload size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Ready to submit?</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Once you submit, we'll wait for these items to arrive at our warehouse. You can track their status here.
                    </p>
                  </div>
                  <div className="flex gap-4 w-full max-w-md">
                    <button 
                      onClick={() => navigateTo('home')}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                    >
                      Add More
                    </button>
                    <button 
                      onClick={() => {
                        // Logic to submit warehouse items
                        alert('Shipment submitted successfully!');
                        navigateTo('cart');
                      }}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Submit Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shop Items for Pickup and Warehouse Pages */}
        {(mode === 'Pickup' || mode === 'Warehouse') && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                  <ShoppingBag className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Shop Items</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">
                    Add essentials to your {mode === 'Pickup' ? 'pickup' : 'shipment'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeProducts.map((product) => {
                const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
                const itemCount = cartItem?.quantity || 0;
                
                return (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative"
                  >
                    <AnimatePresence>
                      {itemCount > 0 && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-3 right-3 z-10 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white"
                        >
                          {itemCount}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3">
                        <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white/20">
                          <span className="text-xs font-bold text-slate-900">${product.price}</span>
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">{product.name}</h4>
                    <p className="text-[10px] text-slate-500 mb-4 line-clamp-2 leading-relaxed">Premium quality {product.category.toLowerCase()} item for your home.</p>
                    
                    {itemCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => removeStoreItem(product.name)}
                          className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                          <ShoppingBag size={14} /> Added ({itemCount})
                        </div>
                        <button 
                          onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image, estimatedDelivery: product.estimatedDelivery }, 'Store')}
                          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image, quantity: 1, estimatedDelivery: product.estimatedDelivery }, 'Store')}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={14} /> Add to {mode === 'Pickup' ? 'Pickup' : 'Shipment'}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!mode && (
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-8">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Package size={20} className="text-indigo-600" /> Order Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total Items</span>
                <span className="font-bold text-slate-900">{displayItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total Weight</span>
                <span className="font-bold text-slate-900">
                  {hasTBDWeight ? 'Est. ' : ''}
                  {displayWeight.toFixed(2)} kg
                </span>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900">Estimated Total</span>
                  <span className="text-xl font-black text-indigo-600">${displayItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0)}</span>
                </div>
              </div>
            </div>

            {/* Apply Coupons Box */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Apply Coupons</h4>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter code" 
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                />
                <button className="px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all">
                  Apply
                </button>
              </div>
            </div>

            {/* Checkout Button */}
            {(displayItems.length > 0 || appointments.length > 0) && !hasCompletedPickup && (
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-6">
                {appointments.some(a => a.status === 'Scheduled') && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                      Payment will be enabled once your scheduled agent pickup is completed and all items are received at our warehouse. This ensures a single consolidated shipment for you.
                    </p>
                  </div>
                )}
                <button 
                  onClick={handleCheckout}
                  className={`w-full py-5 px-8 rounded-2xl font-bold transition-all shadow-2xl flex items-center justify-center gap-2 group ${
                    appointments.some(a => a.status === 'Scheduled')
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                  }`}
                >
                  {currentUser ? 'Checkout' : 'Sign in to Checkout'} <ArrowRight size={20} className={appointments.some(a => a.status === 'Scheduled') ? '' : 'group-hover:translate-x-1 transition-transform'} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSection;
