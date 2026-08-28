import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Mail, HelpCircle, ArrowRight, Bot, Sparkles, Truck, Calculator, Calendar, CheckCircle2 } from 'lucide-react';

export const triggerOmniDimensionWidget = (prefillMessage?: string) => {
  try {
    const omniElements = document.querySelectorAll(
      '#omnidimension-web-widget, [id*="omnidim"], [class*="omnidim"], button[aria-label*="chat"], button[aria-label*="bot"], iframe[id*="omnidim"]'
    );
    if (omniElements.length > 0) {
      (omniElements[0] as HTMLElement).click();
      return;
    }
    if (typeof (window as any).OmniDimension?.open === 'function') {
      (window as any).OmniDimension.open();
      return;
    }
  } catch (e) {
    console.log('OmniDimension widget trigger:', e);
  }
};

const SupportSection = () => {
  const handleOpenOmniDimension = () => {
    triggerOmniDimensionWidget();
  };

  const handleSupportContact = () => {
    window.location.href = 'mailto:support@jiffex.com';
  };

  const agentCapabilities = [
    {
      icon: Truck,
      title: "Live Shipment Tracking",
      desc: "Ask the agent to check the live status of any package, latest hub checkpoints, or estimated delivery date.",
      example: '"What is the status of shipment #JFX-89421?"',
      color: "text-blue-500",
      bg: "bg-blue-50/80",
      border: "border-blue-100"
    },
    {
      icon: Calculator,
      title: "Instant Shipping Quote",
      desc: "Get immediate freight rates, discounts, and transit duration for any country and weight tier.",
      example: '"How much to ship 5 kg of sweets to USA?"',
      color: "text-indigo-500",
      bg: "bg-indigo-50/80",
      border: "border-indigo-100"
    },
    {
      icon: Calendar,
      title: "Book Home Pickup",
      desc: "Schedule doorstep collection with your preferred date, time slot, and location with an instant booking ID.",
      example: '"Please schedule a doorstep pickup for tomorrow morning."',
      color: "text-emerald-500",
      bg: "bg-emerald-50/80",
      border: "border-emerald-100"
    }
  ];

  return (
    <div className="space-y-12 pb-24">
      <div className="text-center space-y-4">
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Need Help?</h3>
        <p className="text-slate-500 max-w-2xl mx-auto">Our 24/7 Jiffex AI Agent & logistics support team are here to assist you with tracking, instant quotes, and bookings.</p>
      </div>

      {/* Featured Jiffex Agent Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-indigo-500/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 max-w-xl text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} className="animate-spin text-indigo-400" />
            <span>Jiffex Agent Active • OmniDimension Powered</span>
          </div>
          <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Instant 24/7 Logistics Assistant
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Equipped with real-time tools for <strong className="text-white">Live Tracking</strong>, <strong className="text-white">Shipping Rate Calculations</strong>, and <strong className="text-white">Doorstep Pickup Scheduling</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenOmniDimension}
          className="relative z-10 shrink-0 px-8 py-5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center gap-3 transition-all active:scale-95 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Bot size={18} />
          </div>
          <span>Talk to Jiffex Agent</span>
        </button>
      </motion.div>

      {/* 3 Core Agent Functions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Bot className="text-indigo-600" size={20} />
            What the Jiffex Agent can do for you:
          </h4>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50 flex items-center gap-1">
            <CheckCircle2 size={12} /> Live API Tools Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agentCapabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={handleOpenOmniDimension}
              className={`p-6 rounded-3xl bg-white border ${cap.border} shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 ${cap.bg} ${cap.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <cap.icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                    Try with Agent <ArrowRight size={12} />
                  </span>
                </div>
                <div>
                  <h5 className="text-base font-black text-slate-900 mb-1.5">{cap.title}</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">{cap.desc}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl font-medium italic border border-slate-100">
                  {cap.example}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: Bot, 
            title: "Jiffex Agent", 
            desc: "24/7 AI Assistant for immediate answers, rates calculation, tracking, and pickup booking.",
            action: "Open Jiffex Agent",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            onClick: handleOpenOmniDimension
          },
          { 
            icon: Mail, 
            title: "Email Support", 
            desc: "Send us your queries and our human operations team will respond within 24 hours.",
            action: "support@jiffex.com",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            onClick: handleSupportContact
          },
          { 
            icon: HelpCircle, 
            title: "Help Center & FAQs", 
            desc: "Browse international shipping customs guides, prohibited goods, and packaging standards.",
            action: "View Guidelines",
            color: "text-amber-600",
            bg: "bg-amber-50",
            onClick: undefined
          }
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <item.icon size={28} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{item.title}</h4>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{item.desc}</p>
            <button 
              onClick={item.onClick}
              className={`text-sm font-bold ${item.color} flex items-center gap-2 hover:underline cursor-pointer`}
            >
              {item.action} <ArrowRight size={16} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Simple FAQ Accordion */}
      <div className="max-w-3xl mx-auto bg-slate-50 rounded-[3rem] p-8 md:p-12">
        <h4 className="text-2xl font-black text-slate-900 mb-8 text-center">Frequently Asked Questions</h4>
        <div className="space-y-4">
          {[
            { q: "How do I track my international shipment?", a: "Enter your JiffEX tracking number in the tracking tab, or ask the Jiffex Agent 'Track my package JFX-XXXXX' for instant live checkpoint details." },
            { q: "How is the shipping cost calculated?", a: "Costs are based on chargeable weight (the greater of actual weight vs volumetric weight) and the destination country tier. The Jiffex Agent can calculate instant quotes for you." },
            { q: "Can I book a doorstep pickup for free?", a: "Yes! Doorstep pickup is completely free across all serviceable cities. You can schedule it anytime via the website or directly with the Jiffex Agent." },
            { q: "What items are prohibited?", a: "We cannot ship hazardous materials, flammable items, currency, or restricted electronics. Please consult our support team for specialized commodities." }
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="font-bold text-slate-900 mb-2 flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">?</div>
                {faq.q}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed pl-9">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
