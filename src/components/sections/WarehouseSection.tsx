import React from 'react';
import { motion } from 'motion/react';
import { Warehouse, MapPin, Copy, CheckCircle2, Package, Truck, AlertTriangle, ArrowRight, ShieldCheck, Clock, ShoppingBag } from 'lucide-react';
import { WAREHOUSE_ADDRESS } from '../../constants';

interface WarehouseSectionProps {
  currentUser: any;
  copyToClipboard: (text: string, label: string) => void;
  navigateTo: (tab: any) => void;
}

const WarehouseSection = ({
  currentUser,
  copyToClipboard,
  navigateTo
}: WarehouseSectionProps) => {
  return (
    <div className="space-y-12 pb-24">
      {/* Warehouse Hero */}
      <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 text-white p-12 md:p-20 shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-black uppercase tracking-[0.2em]"
            >
              <Warehouse size={14} /> Global Hub
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              Your Virtual <br /> <span className="text-indigo-500 italic">Address in India</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
              Shop from any Indian website (Myntra, Amazon.in, Flipkart) and send your packages to our warehouse. We'll consolidate and ship them to you.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-500" /> Free Consolidation
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-500" /> 30 Days Free Storage
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-500" /> Photo Verification
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <MapPin size={20} />
                </div>
                <h3 className="text-xl font-black">Warehouse Address</h3>
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                Active
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Full Name', value: currentUser ? currentUser.fullName : 'Your Name' },
                { label: 'Street', value: WAREHOUSE_ADDRESS.street },
                { label: 'City', value: WAREHOUSE_ADDRESS.city },
                { label: 'State', value: WAREHOUSE_ADDRESS.state },
                { label: 'ZIP Code', value: WAREHOUSE_ADDRESS.zip },
                { label: 'Country', value: WAREHOUSE_ADDRESS.country },
                { label: 'Phone', value: WAREHOUSE_ADDRESS.phone },
              ].map((item, i) => (
                <div key={item.label} className="group flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-sm font-bold text-white">{item.value}</div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(item.value, item.label)}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* How it Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            step: '01', 
            title: 'Shop Online', 
            desc: 'Buy from any Indian store and use our warehouse address at checkout.', 
            icon: ShoppingBag,
            color: 'bg-amber-100 text-amber-600'
          },
          { 
            step: '02', 
            title: 'We Receive', 
            desc: 'We notify you when your package arrives. We can take photos and verify items.', 
            icon: Package,
            color: 'bg-indigo-100 text-indigo-600'
          },
          { 
            step: '03', 
            title: 'Global Ship', 
            desc: 'Consolidate multiple packages into one box to save up to 80% on shipping.', 
            icon: Truck,
            color: 'bg-emerald-100 text-emerald-600'
          },
        ].map((item, i) => (
          <div key={item.step} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              <item.icon size={32} />
            </div>
            <div className="text-4xl font-black text-slate-100 mb-4">{item.step}</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Warehouse Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 -translate-y-32" />
          <div className="relative z-10 space-y-8">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-4xl font-black tracking-tight">Consolidation Service</h3>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Why pay for multiple international shipments? We can wait for all your packages to arrive, remove unnecessary packaging, and combine them into a single, efficient box.
            </p>
            <button 
              onClick={() => navigateTo('pickup')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-xl"
            >
              Start Consolidating <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm space-y-8">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Important Note</h3>
          <p className="text-slate-500 text-lg leading-relaxed">
            Please ensure your <strong>Full Name</strong> and <strong>Unique ID</strong> (if provided) are clearly mentioned on all incoming packages to avoid processing delays.
          </p>
          <div className="space-y-4">
            {[
              { label: 'Storage Limit', value: '30 Days Free', icon: Clock },
              { label: 'Photo Service', value: 'Available', icon: Package },
              { label: 'Returns', value: 'Supported', icon: Truck },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-indigo-600" />
                  <span className="text-sm font-bold text-slate-600">{item.label}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseSection;
