import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Mail, HelpCircle, ArrowRight } from 'lucide-react';

const SupportSection = () => {
  return (
    <div className="space-y-12 pb-24">
      <div className="text-center space-y-4">
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Need Help?</h3>
        <p className="text-slate-500 max-w-2xl mx-auto">Our support team is here to ensure your shipping experience is flawless.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: MessageSquare, 
            title: "Live Chat", 
            desc: "Chat with our logistics experts for immediate assistance with your shipment.",
            action: "Start Chat",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
          },
          { 
            icon: Mail, 
            title: "Email Support", 
            desc: "Send us your queries and we'll get back to you within 24 hours.",
            action: "support@jiffex.com",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          { 
            icon: HelpCircle, 
            title: "Help Center", 
            desc: "Browse our extensive library of FAQs and shipping guides.",
            action: "Visit FAQ",
            color: "text-amber-600",
            bg: "bg-amber-50"
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
            <button className={`text-sm font-bold ${item.color} flex items-center gap-2 hover:underline`}>
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
