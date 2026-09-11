import React from 'react';
import { motion } from 'motion/react';
import { Mail, HelpCircle, ArrowRight, Sparkles, Truck, Calculator, Calendar, CheckCircle2 } from 'lucide-react';
import { useJiffexVoiceCall } from '../../hooks/useJiffexVoiceCall';
import { JiffexVoiceCallPanel } from '../support/JiffexVoiceCallPanel';

interface SupportSectionProps {
  currentUser?: any;
  onOpenLogin?: () => void;
}

const SupportSection: React.FC<SupportSectionProps> = ({ currentUser, onOpenLogin }) => {
  const isUserLoggedIn = (): boolean => {
    if (currentUser?.email) return true;
    try {
      const rawUser = localStorage.getItem('jiffex_active_user_session');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.email && (!parsed.expiresAt || parsed.expiresAt > Date.now())) return true;
      }
      const raw = localStorage.getItem('jiffex_active_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email && (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() > Date.now())) {
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  };

  const loggedIn = isUserLoggedIn();
  const voiceCall = useJiffexVoiceCall(onOpenLogin);

  const handleCallSupport = () => {
    voiceCall.startCall(loggedIn);
  };

  const handleSupportContact = () => {
    window.location.href = 'mailto:support@jiffex.com';
  };

  const supportTopics = [
    "Shipping quotes",
    "Pickup scheduling",
    "Shipment tracking",
    "Items allowed/not allowed",
    "Existing orders"
  ];

  const agentCapabilities = [
    {
      icon: Truck,
      title: "Live Shipment Tracking",
      desc: "Ask Jiffex Support to check the live status of any package, latest hub checkpoints, or estimated delivery date.",
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
        <p className="text-slate-500 max-w-2xl mx-auto">Our 24/7 Jiffex Support & logistics operations team are here to assist you with tracking, instant quotes, and bookings.</p>
      </div>

      {/* Customer Care Card */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Jiffex Support • 24/7 Available</span>
          </div>

          <div className="space-y-2">
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">Need Help?</h4>
            <p className="text-base font-bold text-slate-700">
              Talk to Jiffex Support for help with:
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 font-medium">
            {supportTopics.map((topic) => (
              <li key={topic} className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
                <span className="text-indigo-600 font-black">•</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <JiffexVoiceCallPanel
              idPrefix="btn-call-jiffex-support-section"
              isAuthenticated={loggedIn}
              callStatus={voiceCall.callStatus}
              isMuted={voiceCall.isMuted}
              lastTranscript={voiceCall.lastTranscript}
              onStartCall={handleCallSupport}
              onEndCall={voiceCall.endCall}
              onToggleMute={voiceCall.toggleMute}
            />

            <button
              type="button"
              onClick={handleSupportContact}
              className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Mail size={16} className="text-slate-500" />
              <span>Email Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core Agent Functions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={20} />
            What Jiffex Support can do for you:
          </h4>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50 flex items-center gap-1">
            <CheckCircle2 size={12} /> Live Support Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agentCapabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={handleCallSupport}
              className={`p-6 rounded-3xl bg-white border ${cap.border} shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 ${cap.bg} ${cap.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <cap.icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                    Ask Support <ArrowRight size={12} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Mail size={28} />
          </div>
          <h4 className="text-xl font-black text-slate-900 mb-2">Email Support</h4>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">Send us your queries and our human operations team will respond within 24 hours.</p>
          <button 
            onClick={handleSupportContact}
            className="text-sm font-bold text-emerald-600 flex items-center gap-2 hover:underline cursor-pointer"
          >
            support@jiffex.com <ArrowRight size={16} />
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <HelpCircle size={28} />
          </div>
          <h4 className="text-xl font-black text-slate-900 mb-2">Help Center & FAQs</h4>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">Browse international shipping customs guides, prohibited goods, and packaging standards.</p>
          <span className="text-sm font-bold text-amber-600 flex items-center gap-2">
            View Guidelines Below <ArrowRight size={16} />
          </span>
        </div>
      </div>

      {/* Simple FAQ Accordion */}
      <div className="max-w-3xl mx-auto bg-slate-50 rounded-[3rem] p-8 md:p-12">
        <h4 className="text-2xl font-black text-slate-900 mb-8 text-center">Frequently Asked Questions</h4>
        <div className="space-y-4">
          {[
            { q: "How do I track my international shipment?", a: "Enter your Jiffex tracking number in the tracking tab, or ask Jiffex Support for instant live checkpoint details." },
            { q: "How is the shipping cost calculated?", a: "Costs are based on chargeable weight (the greater of actual weight vs volumetric weight) and the destination country tier. Jiffex Support can calculate instant quotes for you." },
            { q: "Can I book a doorstep pickup for free?", a: "Yes! Doorstep pickup is completely free across all serviceable cities. You can schedule it anytime via the website or directly with Jiffex Support." },
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
