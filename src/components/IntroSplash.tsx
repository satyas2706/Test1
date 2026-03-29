import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Store, 
  Truck, 
  Warehouse, 
  ArrowRight, 
  Sparkles,
  Heart,
  Globe,
  ShoppingBag,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface IntroSplashProps {
  onClose: () => void;
  onProceed: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onClose, onProceed }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white text-slate-900 overflow-y-auto font-sans"
    >
      {/* Organic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/30 to-transparent" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-6 py-8 md:py-12 flex flex-col items-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 transition-all bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-slate-100 z-10"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-1"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Globe size={16} />
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-900">
              JIFFEX
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-slate-900 leading-tight"
          >
            Your Premium Gateway <br />
            <span className="text-indigo-600">to Authentic India.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium"
          >
            Connecting the global Indian community with reliable logistics and curated heritage products.
          </motion.p>
        </div>

        {/* Educational Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-10">
          {[
            { 
              title: "The Jiffex Store", 
              subtitle: "Curated authenticity for Indians worldwide.",
              desc: "Discover a refined selection of high-quality gifts, sweets, sports goods, and more—crafted to bring tradition, elegance, and trust to your doorstep.",
              image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800",
              icon: ShoppingBag,
              color: "text-amber-500",
              bgColor: "bg-amber-50"
            },
            { 
              title: "Agent Pickup", 
              subtitle: "Seamless pickup, expertly handled.",
              desc: "Schedule a collection from your home—our professional agents ensure secure handling and reliable delivery to your doorstep.",
              image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop",
              icon: Truck,
              color: "text-indigo-600",
              bgColor: "bg-indigo-50"
            },
            { 
              title: "Warehouse Hub", 
              subtitle: "Secure Consolidation & Shipping",
              desc: "Send items to our warehouse and we are going to ship. Consolidate your purchases from multiple vendors into one secure shipment to save on global delivery costs.",
              image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800",
              icon: Warehouse,
              color: "text-emerald-600",
              bgColor: "bg-emerald-50"
            }
          ].map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="group flex flex-col bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-500"
            >
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // prevent infinite loop
                    target.src = `https://picsum.photos/seed/${service.title.replace(/\s+/g, '-')}/800/600`;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className={`absolute top-3 left-3 w-8 h-8 ${service.bgColor} rounded-lg flex items-center justify-center ${service.color} shadow-sm`}>
                  <service.icon size={16} />
                </div>
              </div>
              
              <div className="p-5 space-y-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-600/70">
                    {service.subtitle}
                  </p>
                  <h3 className="text-lg font-black text-slate-900">
                    {service.title}
                  </h3>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                  {service.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10"
        >
          <button 
            onClick={onProceed}
            className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            Proceed to Website
          </button>
          
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-3.5 bg-white text-slate-500 border border-slate-200 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
          >
            Skip Intro
          </button>
        </motion.div>

        {/* Footer Detail */}
        <div className="flex flex-wrap justify-center gap-6 text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 pb-8">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={10} />
            <span>Secure Logistics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={10} />
            <span>Real-time Tracking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={10} />
            <span>Indian Heritage</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};







