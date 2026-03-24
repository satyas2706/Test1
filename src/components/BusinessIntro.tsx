import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  X,
  Globe,
  Zap,
  Box,
  Truck,
  ShoppingBag,
  ShieldCheck,
  Leaf,
  Sparkles,
  MapPin,
  Clock
} from 'lucide-react';

interface BusinessIntroProps {
  onClose: () => void;
}

export const BusinessIntro: React.FC<BusinessIntroProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fdfcfb] p-4 sm:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-xl shadow-indigo-100/50 overflow-hidden flex flex-col lg:flex-row border border-indigo-50"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-50 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-900 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* Left Side: Soft Visuals */}
        <div className="w-full lg:w-5/12 bg-[#f9f9ff] p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <div className="mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                  <Zap size={28} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter uppercase">JIFFEX</span>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1 whitespace-nowrap">
                    Global Logistics Partner
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">Live Tracking</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Full Visibility</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">Secure Packing</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">100% Safe Delivery</span>
                </div>
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif text-slate-900 leading-tight mb-6">
              From India, <br />
              <span className="italic text-indigo-700">With Care.</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-xs">
              JIFFEX connects you to the soul of India, delivering authentic products and memories to your global doorstep.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex -space-x-3 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/culture${i}/100/100`} alt="Culture" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Trusted by 5000+ families</p>
          </div>
        </div>

        {/* Right Side: Organic Features */}
        <div className="w-full lg:w-7/12 p-12 lg:p-20 bg-white">
          <div className="max-w-md">
            <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-[0.3em] mb-12 flex items-center gap-3">
              <Leaf size={14} />
              Our Promise
            </h2>

            <div className="space-y-10 mb-16">
              <OrganicFeature 
                icon={<Box className="text-indigo-700" size={24} />}
                title="Thoughtful Packing"
                description="We treat every item like a gift. Our consolidation process ensures your treasures arrive safely and affordably."
              />
              <OrganicFeature 
                icon={<Truck className="text-indigo-700" size={24} />}
                title="Personal Collection"
                description="Our friendly JIFFEX agents visit your home, making international shipping as easy as a neighborly visit."
              />
              <OrganicFeature 
                icon={<ShoppingBag className="text-indigo-700" size={24} />}
                title="Curated Selection"
                description="Handpicked Indian essentials, from sacred pooja items to artisanal crafts, ready for your journey."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              <button 
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 group"
              >
                Start Your Journey
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 text-slate-400">
                <Sparkles size={16} />
                <span className="text-xs font-medium uppercase tracking-widest">Safe & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const OrganicFeature = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex gap-6 group">
    <div className="shrink-0 w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
      {icon}
    </div>
    <div>
      <h3 className="text-slate-900 font-bold text-xl mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);
