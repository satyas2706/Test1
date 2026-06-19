import React from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  ShieldCheck, 
  Award, 
  Users, 
  Boxes, 
  ArrowRight, 
  Compass, 
  ShoppingBag, 
  Truck, 
  Package, 
  CheckCircle, 
  Sparkles, 
  BadgePercent,
  LifeBuoy
} from 'lucide-react';

const AboutSection = () => {
  return (
    <div className="space-y-20 pb-24 max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto pt-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-600 text-xs font-black uppercase tracking-widest"
        >
          <Sparkles size={12} className="text-orange-500 animate-pulse" /> Why JiffEX
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight"
        >
          International Shipping <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-orange-500 bg-clip-text text-transparent">Made Simple</span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
        >
          Sending packages abroad shouldn't be complicated. Whether you're shipping gifts to family, documents to clients, or products to customers overseas, Jiffex makes international shipping easy, affordable, and stress-free.
        </motion.p>
      </div>

      {/* Grid Highlights: Everything you need in one place */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Everything You Need in One Place
          </h3>
          <p className="text-slate-400 text-sm">
            Streamlining every phase of global transit with professional care
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: ShoppingBag,
              title: "Shop Online & Ship Internationally",
              desc: "Found something online that doesn't ship internationally? Have it delivered to us, and we'll forward it to your destination anywhere in the world.",
              color: "text-indigo-600",
              bg: "bg-indigo-50/50 border-indigo-100/40"
            },
            {
              icon: Package,
              title: "Send Your Own Items",
              desc: "From personal belongings and gifts to business shipments, send anything eligible for international delivery with confidence.",
              color: "text-orange-600",
              bg: "bg-orange-50/50 border-orange-100/40"
            },
            {
              icon: Truck,
              title: "Doorstep Pickup",
              desc: "No need to visit a courier office. Schedule a pickup, and we'll collect your package from your home or office.",
              color: "text-emerald-600",
              bg: "bg-emerald-50/50 border-emerald-100/40"
            },
            {
              icon: Boxes,
              title: "Professional Packing",
              desc: "Our team ensures your items are securely packed to withstand international transit, reducing the risk of damage.",
              color: "text-amber-600",
              bg: "bg-amber-50/50 border-amber-100/40"
            },
            {
              icon: Globe,
              title: "End-to-End Delivery",
              desc: "From pickup to final delivery, we manage the entire shipping process so you don't have to.",
              color: "text-violet-600",
              bg: "bg-violet-50/50 border-violet-100/40"
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`p-8 bg-white border ${item.bg} rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] ${item.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                    <Icon size={22} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
          
          {/* Sixth placeholder to balance layout gracefully */}
          <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-4 relative z-10">
              <span className="text-orange-400 font-bold text-[10px] uppercase tracking-widest">Global Logistics</span>
              <h4 className="text-xl font-extrabold tracking-tight leading-snug">
                Ready to ship your next global package?
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Experience the convenience of streamlined global delivery with JiffEX tracking.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 group cursor-pointer hover:text-white transition-colors">
                Explore tracking tools
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Customers Choose Jiffex */}
      <div className="space-y-10 border-t border-slate-100 pt-16">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Why Customers Choose Jiffex
          </h3>
          <p className="text-slate-400 text-sm">
            Experience that delivers trust at every destination
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              icon: Truck,
              title: "Fast & Reliable",
              desc: "We partner with trusted global logistics networks to ensure your shipments reach their destination safely and on time."
            },
            {
              icon: BadgePercent,
              title: "Transparent Pricing",
              desc: "No hidden charges. Get clear shipping costs before you send."
            },
            {
              icon: Globe,
              title: "Global Reach",
              desc: "Ship to major destinations across the world through a single, easy-to-use platform."
            },
            {
              icon: CheckCircle,
              title: "Hassle-Free Experience",
              desc: "We simplify paperwork, packing, pickup, and delivery so you can focus on what matters."
            },
            {
              icon: LifeBuoy,
              title: "Dedicated Support",
              desc: "Questions about customs, shipping options, or tracking? Our team is here to help every step of the way."
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-6 bg-slate-50/60 border border-slate-100 rounded-2xl flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                  <Icon size={18} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm tracking-tight">{item.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Perfect For */}
      <div className="space-y-10 border-t border-slate-100 pt-16">
        <div className="bg-slate-50/45 border border-slate-100 rounded-[2.5rem] p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-indigo-600 font-black text-xs uppercase tracking-widest">Tailored Solutions</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                Perfect For Every Shipping Need
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Whether you're a student, dynamic online shopper, or standard NRI receiving parcels from India, Jiffex adapts to deliver.
              </p>
            </div>
            
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Families sending gifts overseas",
                "Students shipping personal belongings",
                "Professionals sending important docs",
                "Online shoppers buying from Indian stores",
                "Small businesses exporting globally",
                "NRIs receiving products from India"
              ].map((value, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <CheckCircle className="text-indigo-500 shrink-0" size={16} />
                  <span className="text-slate-700 text-xs font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Our Promise (Banner callout) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-[2.5rem] p-10 md:p-14 overflow-hidden relative shadow-xl">
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <span className="text-orange-400 font-black text-xs uppercase tracking-widest">Our Promise</span>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            International shipping should be as simple as sending a package across town.
          </h3>
          <p className="text-slate-350 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            That's why we combine convenience, reliability, and customer-first service to create a seamless, end-to-end global transit experience.
          </p>
          <div className="border-t border-slate-800 pt-6 mt-4">
            <h4 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-300 via-white to-orange-300 bg-clip-text text-transparent italic">
              Ship Smarter. Ship Globally. Ship with Jiffex.
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
