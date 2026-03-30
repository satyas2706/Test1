import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../Logo';
import { 
  Calculator, 
  MapPin, 
  Sparkles, 
  Truck, 
  Store, 
  Package, 
  Warehouse, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  AlertTriangle,
  Calendar,
  ShoppingBag,
  Heart,
  Users,
  Info,
  Trash2,
  Plus
} from 'lucide-react';
import { COUNTRIES, SHIPPING_RATES, PROHIBITED_ITEMS } from '../../constants';
import { User, Appointment, ShippingItem } from '../../types';

interface HomeSectionProps {
  trackingId: string;
  setTrackingId: (id: string) => void;
  handleTrackShipment: (e: React.FormEvent) => void;
  navigateTo: (tab: any) => void;
  scrollToQuote: () => void;
  quote: any;
  setQuote: (quote: any) => void;
  calculateQuote: () => void;
  addItem: (item: any, source: string) => void;
  removeStoreItem: (name: string) => void;
  items: ShippingItem[];
  storeProducts: any[];
  currentUser: User | null;
  appointments: Appointment[];
  quoteRef: React.RefObject<HTMLDivElement>;
}

const HomeSection = ({
  trackingId,
  setTrackingId,
  handleTrackShipment,
  navigateTo,
  scrollToQuote,
  quote,
  setQuote,
  calculateQuote,
  addItem,
  removeStoreItem,
  items,
  storeProducts,
  currentUser,
  appointments,
  quoteRef
}: HomeSectionProps) => {
  const [qCountry, setQCountry] = useState(COUNTRIES[0]);
  const [qWeight, setQWeight] = useState(1);
  const [qMethod, setQMethod] = useState<'Standard' | 'Express'>('Express');

  return (
    <div className="space-y-24 pb-24">
      {/* JIFFEX Truck Hero Section */}
      <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 text-white p-12 md:p-20 shadow-2xl">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 20%, #1e2a78 0%, #0b1220 60%, #05070f 100%)`,
          }}
        />

        {/* Tracking Box - Top Right */}
        <div className="absolute top-8 right-8 z-20 hidden lg:block">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-72"
          >
            <div className="text-right mb-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Track Shipment</span>
            </div>
            <form 
              onSubmit={handleTrackShipment}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative flex items-center bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/10 p-1.5">
                <div className="pl-3 text-slate-400">
                  <MapPin size={16} />
                </div>
                <input 
                  type="text" 
                  placeholder="Tracking ID"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 px-2 py-2 text-sm font-medium"
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-indigo-500 transition-all active:scale-95"
                >
                  Track
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-12">
          <div className="space-y-8 max-w-4xl">
            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-8xl font-black tracking-tighter leading-tight text-white"
              >
                Send Anything from India to Abroad—<span className="relative inline-block">Hassle-Free<div className="absolute -bottom-2 left-0 w-full h-1.5 bg-amber-500 rounded-full" /></span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto"
              >
                Shop online, schedule pickup, or send your own items. We handle packing & delivery.
              </motion.p>
            </div>
          </div>

          <div className="space-y-8 w-full">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-bold text-indigo-400 uppercase tracking-widest"
            >
              Choose how you want to send:
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {/* Card 1: Pickup from Home */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Truck size={40} className="text-indigo-600" />
                </div>
                <div className="space-y-3 flex-grow">
                  <h3 className="font-black text-2xl text-slate-900">Pickup from Home</h3>
                  <p className="text-slate-500 leading-relaxed">
                    We collect items from your doorstep, pack & ship internationally
                  </p>
                </div>
                <button 
                  onClick={() => navigateTo('pickup')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors active:scale-95 shadow-lg shadow-indigo-100"
                >
                  Schedule Pickup
                </button>
              </div>

              {/* Card 2: Send to Our Warehouse */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Package size={40} className="text-indigo-600" />
                </div>
                <div className="space-y-3 flex-grow">
                  <h3 className="font-black text-2xl text-slate-900">Send to Our Warehouse</h3>
                  <p className="text-slate-500 leading-relaxed">
                    Ship your items to our warehouse—we pack & deliver abroad
                  </p>
                </div>
                <button 
                  onClick={() => navigateTo('warehouse')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors active:scale-95 shadow-lg shadow-indigo-100"
                >
                  Send to Our Warehouse
                </button>
              </div>

              {/* Card 3: Shop & Send */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag size={40} className="text-indigo-600" />
                </div>
                <div className="space-y-3 flex-grow">
                  <h3 className="font-black text-2xl text-slate-900">Shop & Send</h3>
                  <p className="text-slate-500 leading-relaxed">
                    Buy authentic Indian products—we deliver anywhere abroad
                  </p>
                </div>
                <button 
                  onClick={() => navigateTo('store')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors active:scale-95 shadow-lg shadow-indigo-100"
                >
                  Shop Now
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4"
            >
              <button 
                onClick={() => navigateTo('support')}
                className="px-6 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-full font-bold flex items-center gap-2 transition-all group text-lg"
              >
                Not sure? <span className="underline underline-offset-4 transition-colors">See how it works</span>
              </button>
              
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              
              <div className="flex items-center gap-3 text-slate-400 font-medium text-lg">
                <span className="text-amber-400 text-2xl">⭐</span> Trusted by 1000+ customers • Delivered worldwide
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How JiffEX Works - Value Prop */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">How JiffEX Works</h3>
          <p className="text-slate-500 max-w-2xl mx-auto">A seamless, unified shipping experience designed for your convenience.</p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden lg:block" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              { icon: Calendar, title: "1. Schedule Pickup", desc: "Start by scheduling an agent pickup. This becomes the heart of your shipment process.", color: "bg-indigo-600", shadow: "shadow-indigo-200" },
              { icon: ShoppingBag, title: "2. Add Everything", desc: "Add items from your home, our Jiffy Store, or even items you've sent to our warehouse.", color: "bg-amber-500", shadow: "shadow-amber-200" },
              { icon: Truck, title: "3. Home Consolidation", desc: "Our agent brings your warehouse and store items to your home for a final unified collection.", color: "bg-emerald-500", shadow: "shadow-emerald-200" },
              { icon: CheckCircle2, title: "4. Global Shipping", desc: "Everything is weighed and packed at your home, then shipped globally in one go.", color: "bg-blue-500", shadow: "shadow-blue-200" }
            ].map((step, i) => (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center h-full">
                  <div className={`w-16 h-16 ${step.color} text-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl ${step.shadow} group-hover:scale-110 transition-transform duration-500`}>
                    <step.icon size={32} />
                  </div>
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm border-4 border-white shadow-lg">
                    0{i + 1}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-3">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Emotional Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-xs font-bold uppercase tracking-widest">
            <Heart size={14} className="text-pink-300 fill-pink-300" /> Made for the Global Indian
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Stop waiting for a <span className="text-indigo-200 italic">friend's suitcase.</span>
          </h2>
          <p className="text-xl text-indigo-100 leading-relaxed font-medium">
            Your connection to home shouldn't depend on someone else's travel plans. 
            Whether it's your mother's handmade sweets, that specific wedding outfit, or the comfort of Indian spices—we bring India to your doorstep.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">No More Waiting</div>
                <div className="text-xs text-indigo-200">Ship whenever you want</div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">No More Asking</div>
                <div className="text-xs text-indigo-200">Independence in shipping</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quote Calculator & Protocol */}
      <div ref={quoteRef} className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calculator className="text-indigo-600" /> Quick Quote
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Destination</label>
                <select 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  value={qCountry}
                  onChange={(e) => setQCountry(e.target.value)}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Weight (kg)</label>
                <input 
                  type="number" 
                  min="0.1" 
                  step="0.1"
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={qWeight}
                  onChange={(e) => setQWeight(Number(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Shipping Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Standard', label: 'Standard', days: '10-14 Days', multiplier: 0.7 },
                    { id: 'Express', label: 'Express', days: '5-7 Days', multiplier: 1.0 }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setQMethod(method.id as any)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        qMethod === method.id 
                          ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`text-sm font-black ${qMethod === method.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {method.label}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {method.days}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">
                      Estimated Cost ({qMethod})
                    </span>
                    <div className="text-4xl font-black">
                      ${(qWeight * SHIPPING_RATES[qCountry] * (qMethod === 'Standard' ? 0.7 : 1.0)).toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-2 flex items-center gap-1">
                      <Clock size={10} /> Est. Delivery: {qMethod === 'Express' ? '5-7' : '10-14'} Business Days
                    </div>
                  </div>
                  <Truck className="opacity-20" size={48} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-2xl">
              <Info size={48} className="text-indigo-400" />
            </div>
            <div className="space-y-3 relative z-10">
              <h4 className="text-2xl font-black">Unified Shipping Protocol</h4>
              <p className="text-slate-400 leading-relaxed">
                When you schedule an agent pickup, JiffEX activates the <span className="text-white font-bold">Home-First Protocol</span>. All your items—whether from Jiffy Store or our warehouse—are consolidated at your doorstep for a truly personalized shipping experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products from Jiffy Store - Moved to Last */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-3xl font-black text-slate-900">Featured from <span className="text-indigo-600">Jiffy Store</span></h3>
            <p className="text-slate-500">Premium products curated for your special occasions.</p>
          </div>
          <button 
            onClick={() => navigateTo('store')}
            className="text-indigo-600 font-bold flex items-center gap-1 hover:underline"
          >
            View All <ChevronRight size={18} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {storeProducts.slice(0, 4).map(product => {
            const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
            const itemCount = cartItem?.quantity || 0;
            
            return (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col">
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
                <div className="aspect-square overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {product.category}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-900 mb-1 truncate">{product.name}</h4>
                  <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-600 font-bold">${product.price}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{product.weight}kg</span>
                    </div>
                    
                    {itemCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => removeStoreItem(product.name)}
                          className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-indigo-100">
                          <ShoppingBag size={12} /> Added ({itemCount})
                        </div>
                        <button 
                          onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image, estimatedDelivery: product.estimatedDelivery }, 'Store')}
                          className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addItem({ name: product.name, weight: product.weight, price: product.price, image: product.image, estimatedDelivery: product.estimatedDelivery }, 'Store')}
                        className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} /> Add to Shipment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default HomeSection;
