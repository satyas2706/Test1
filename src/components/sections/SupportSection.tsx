import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Mail, HelpCircle, ArrowRight, Phone, Sparkles } from 'lucide-react';

const SupportSection = () => {
  const triggerVoiceCall = () => {
    window.dispatchEvent(new CustomEvent('jiffex-start-vapi-call'));
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="text-center space-y-4">
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Need Help?</h3>
        <p className="text-slate-500 max-w-2xl mx-auto">Our support team and AI Voice Agent are here to ensure your shipping experience is flawless.</p>
      </div>

      {/* Featured Vapi AI Voice Call Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 max-w-xl text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} className="animate-spin text-indigo-400" />
            <span>24/7 AI Voice Assistant</span>
          </div>
          <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Speak Directly with our AI Agent
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Have questions about your rates, scheduled home pickup, shop & ship consolidation, or tracking? Call our Vapi-powered voice assistant right in your browser.
          </p>
        </div>

        <button
          onClick={triggerVoiceCall}
          className="relative z-10 shrink-0 px-8 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center gap-3 transition-all active:scale-95 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Phone size={18} />
          </div>
          <span>Start Voice Call Now</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: MessageSquare, 
            title: "Live Chat", 
            desc: "Chat with our logistics experts for immediate assistance with your shipment.",
            action: "Start Chat",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            onClick: triggerVoiceCall
          },
          { 
            icon: Mail, 
            title: "Email Support", 
            desc: "Send us your queries and we'll get back to you within 24 hours.",
            action: "support@jiffex.com",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            onClick: undefined
          },
          { 
            icon: HelpCircle, 
            title: "Help Center", 
            desc: "Browse our extensive library of FAQs and shipping guides.",
            action: "Visit FAQ",
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
            { q: "How long does shipping to India take?", a: "Typically, express shipments take 5-7 business days, while standard shipments may take 10-14 business days depending on the destination city." },
            { q: "What items are prohibited?", a: "We cannot ship hazardous materials, perishables, currency, or restricted electronics. Please check our full prohibited items list for details." },
            { q: "How is the shipping cost calculated?", a: "Costs are based on the actual weight or volumetric weight (whichever is higher) and the destination country's specific rate." }
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
