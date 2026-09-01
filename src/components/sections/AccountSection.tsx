import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, Save, UserCheck, ShieldCheck, CreditCard, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AccountSectionProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    address?: string;
  } | null;
  onUpdateProfile: (updatedData: { name: string; email: string; phone: string; address: string }) => void;
  customerWarehouseId: string;
}

const AccountSection = ({ currentUser, onUpdateProfile, customerWarehouseId }: AccountSectionProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state whenever currentUser loads or changes
  useEffect(() => {
    if (currentUser) {
      setName(prev => (prev === (currentUser.name || '') ? prev : (currentUser.name || '')));
      setEmail(prev => (prev === (currentUser.email || '') ? prev : (currentUser.email || '')));
      setPhone(prev => (prev === (currentUser.phone || '') ? prev : (currentUser.phone || '')));
      setAddress(prev => (prev === (currentUser.address || '') ? prev : (currentUser.address || '')));
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.phone, currentUser?.address]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(customerWarehouseId);
    setCopied(true);
    toast.success('Warehouse ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Name field cannot be empty');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!phone.trim()) {
      toast.error('Mobile number is required');
      return;
    }

    setIsSaving(true);
    
    // Simulate a brief secure database sync
    setTimeout(() => {
      onUpdateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim()
      });
      setIsSaving(false);
      toast.success('Your account profile has been securely updated and saved.');
    }, 600);
  };

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">My Account</h3>
        <p className="text-slate-500 max-w-lg mx-auto">
          Manage your JiffEX shipping profile, default pickup/delivery address, and contact preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - ID and Role Card */}
        <div className="md:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-[2rem] border border-indigo-950/20 shadow-md relative overflow-hidden"
          >
            {/* Ambient pattern */}
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="absolute -left-10 -top-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                <User size={38} className="text-indigo-200" />
              </div>
              
              <div>
                <h4 className="text-xl font-black truncate max-w-[200px]" title={name || 'Valued Customer'}>
                  {name || 'Valued Customer'}
                </h4>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200 mt-1 border border-white/5 capitalize">
                  <ShieldCheck size={12} />
                  {currentUser?.role || 'Guest Customer'}
                </div>
              </div>

              <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 text-left space-y-2">
                <div className="text-[10px] text-slate-300 font-extrabold uppercase tracking-widest leading-none">
                  Your Hub Warehouse ID
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-mono text-base font-black text-indigo-300 tracking-wider">
                    {customerWarehouseId}
                  </span>
                  <button 
                    onClick={handleCopyId}
                    type="button"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-medium pt-1">
                  Use this Hub ID when purchasing items from foreign stores (Amazon, eBay etc.) for storage and consolidation.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4"
          >
            <h5 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-2">Member Benefits</h5>
            <div className="space-y-3 text-xs text-slate-500">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-green-50 text-green-600 mt-0.5">
                  <UserCheck size={12} />
                </div>
                <span>Pre-filled checkout and booking forms for lightning-fast shipments.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-green-50 text-green-600 mt-0.5">
                  <CreditCard size={12} />
                </div>
                <span>Access to standard shipping rates, live shipment tracker, and continuous email updates.</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column - Account Form */}
        <div className="md:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"
          >
            <h4 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              Personal Information
            </h4>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-xs font-extrabold text-slate-700 uppercase tracking-widest block">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-extrabold text-slate-700 uppercase tracking-widest block">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Mobile No / Phone */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="mobile" className="text-xs font-extrabold text-slate-700 uppercase tracking-widest block">
                    Mobile/Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs select-none">
                      <Phone size={18} />
                    </div>
                    <input
                      id="mobile"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Address Line */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="address" className="text-xs font-extrabold text-slate-700 uppercase tracking-widest block">
                    Default Shipping/Pickup Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-3.5 left-3.5 pointer-events-none text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <textarea
                      id="address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter flat/room/house number, building, street, and landmark details here"
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold font-sans text-sm transition-all shadow-md shadow-indigo-600/15"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AccountSection;
