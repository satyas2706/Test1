import React from 'react';
import { motion } from 'motion/react';
import { Truck, Store, Package, Warehouse, ArrowRight } from 'lucide-react';

interface BusinessSectionProps {
  navigateTo: (tab: any) => void;
  scrollToQuote: () => void;
  setShowBusinessPopup: (show: boolean) => void;
}

const BusinessSection: React.FC<BusinessSectionProps> = ({ 
  navigateTo, 
  scrollToQuote, 
  setShowBusinessPopup 
}) => {
  return (
    <div className="relative bg-[#FDFCFB] min-h-screen font-serif">
      {/* Decorative Cultural Pattern Overlay (Subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
      
      {/* Hero Section - Blending Home Page Dark with Organic Warmth */}
      <div className="relative bg-slate-900 text-white p-12 md:p-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 transform -rotate-3">
              <Truck size={32} />
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter font-sans">
              JIFF<span className="text-indigo-400 italic">EX</span>
            </h1>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-light leading-[1.1] mb-6"
          >
            Bringing the <span className="italic text-indigo-200">Soul of India</span> <br /> to your Doorstep.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-indigo-100/80 font-light italic max-w-2xl mx-auto"
          >
            We are your cultural bridge, ensuring that distance never separates you from the traditions you cherish.
          </motion.p>
        </div>
      </div>

      {/* Content Area - Warm Organic & Cultural */}
      <div className="p-8 md:p-20 relative">
        <div className="max-w-6xl mx-auto">
          {/* Business Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold tracking-widest uppercase font-sans">
                Our Mission
              </div>
              <h3 className="text-4xl md:text-5xl font-medium text-slate-900 leading-tight">
                A Shipping Company <br /> with a <span className="italic text-[#5A5A40]">Heart.</span>
              </h3>
              <p className="text-xl text-slate-600 leading-relaxed font-light italic">
                JiffEX is a specialized startup dedicated to connecting the global Indian community with their roots. We don't just ship boxes; we ship memories, flavors, and sacred traditions smoothly across borders.
              </p>
              <div className="h-px w-24 bg-indigo-600/20" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[4rem] overflow-hidden rotate-3 shadow-2xl border-[12px] border-white">
                <img 
                  src="https://picsum.photos/seed/indian-culture/800/800" 
                  alt="Indian Culture" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#5A5A40] rounded-full flex items-center justify-center text-white shadow-2xl -rotate-12 border-4 border-white">
                <div className="text-center font-sans">
                  <div className="text-3xl font-bold">India</div>
                  <div className="text-[10px] uppercase tracking-widest">To the World</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Services Grid - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              {
                title: "Shop Jiffy Store",
                desc: "Discover handpicked cultural treasures. From pooja essentials to artisanal return gifts, curated directly from India.",
                icon: Store,
                img: "https://picsum.photos/seed/jiffy-store/400/300"
              },
              {
                title: "Agent Pickup",
                desc: "Schedule a professional agent to collect sweets, gifts, or personal items directly from your home in India.",
                icon: Package,
                img: "https://picsum.photos/seed/agent-pickup/400/300"
              },
              {
                title: "Warehouse Delivery",
                desc: "Shop online in India and send to our secure warehouse. We consolidate and ship smoothly to your country.",
                icon: Warehouse,
                img: "https://picsum.photos/seed/warehouse/400/300"
              }
            ].map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
                    <service.icon size={24} />
                  </div>
                  <h4 className="text-2xl font-medium text-slate-900 mb-4">{service.title}</h4>
                  <p className="text-slate-500 leading-relaxed font-light italic mb-6">
                    {service.desc}
                  </p>
                  <div className="aspect-video rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                    <img src={service.img} alt={service.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 font-sans"
          >
            <button 
              onClick={() => {
                navigateTo('home');
                setShowBusinessPopup(false);
              }}
              className="w-full sm:w-auto px-12 py-5 bg-white text-slate-600 border border-slate-200 rounded-full font-bold text-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              Cancel & Return
            </button>
            <button 
              onClick={() => {
                scrollToQuote();
                navigateTo('home');
                setShowBusinessPopup(false);
              }}
              className="w-full sm:w-auto px-12 py-5 bg-indigo-600 text-white rounded-full font-bold text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-4"
            >
              Start Placing Order <ArrowRight size={24} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSection;
