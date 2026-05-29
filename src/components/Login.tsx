import React, { useState } from 'react';
import { Mail, Phone, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface LoginProps {
  onSuccess: (identifier: string, name?: string) => void;
  initialEmail?: string;
  initialPhone?: string;
  initialMethod?: 'email' | 'phone';
}

interface AgentProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  vehicleNumber?: string;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, initialEmail = '', initialPhone = '', initialMethod = 'email' }) => {
  const [method, setMethod] = useState<'email' | 'phone'>(initialMethod);
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to validate agent work email against agent management list
  const checkAgentEmailValidity = (enteredEmail: string): { isValid: boolean; error?: string } => {
    const emailLower = enteredEmail.trim().toLowerCase();
    const isAgentPattern = emailLower.endsWith('.agent@jiffex.com') || emailLower === 'agent@jiffex.com';

    if (!isAgentPattern) {
      return { isValid: true };
    }

    // Default agents list
    let agents: AgentProfile[] = [
      { id: '10001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: '10001.agent@jiffex.com', status: 'Active', vehicleNumber: 'KA-01-AB-1234' },
      { id: '10002', name: 'Priya Patel', phone: '+91 87654 32109', email: '10002.agent@jiffex.com', status: 'Active', vehicleNumber: 'MH-02-CD-5678' },
      { id: '12345', name: 'Test Agent (You)', phone: '+91 00000 00000', email: '12345.agent@jiffex.com', status: 'Active', vehicleNumber: 'TEST-001' },
    ];

    // Load from localStorage if present
    const saved = localStorage.getItem('jiffex_agents_list');
    if (saved) {
      try {
        agents = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved agents list:', e);
      }
    }

    // Check matches in list:
    // 1. Matches customized email explicitly
    // 2. Matches [id].agent@jiffex.com pattern
    const matchesExplicit = agents.some(a => a.email && a.email.trim().toLowerCase() === emailLower);
    const matchesDefaultPattern = agents.some(a => `${a.id.trim().toLowerCase()}.agent@jiffex.com` === emailLower);
    const isTestAgent = emailLower === 'agent@jiffex.com';

    if (matchesExplicit || matchesDefaultPattern || isTestAgent) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'This email is not registered under Agent Management. Access Denied.'
    };
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Login] Sending OTP request for method:", method);
    setIsLoading(true);
    
    if (method === 'email') {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Check agent email validation
      const agentCheck = checkAgentEmailValidity(email);
      if (!agentCheck.isValid) {
        toast.error(agentCheck.error || 'Access Denied');
        setIsLoading(false);
        return;
      }
    } else {
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        toast.error('Please enter a valid 10-digit mobile number');
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = method === 'email' ? { email: email.trim().toLowerCase() } : { phone: phone.trim() };
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log("[Login] Send OTP Response:", data);
      if (data.success) {
        setStep('otp');
        toast.success(`OTP sent to your ${method}`);
        if (data.devCode) {
          console.log(`DEV MODE: ${method} OTP is`, data.devCode);
          // Auto-fill OTP for easier testing
          setOtp(data.devCode.split(''));
          toast.info(`DEV MODE: Auto-filling code ${data.devCode}`, {
            duration: 8000,
            description: "In production, this would be sent to your " + method
          });
        }
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const otpCode = otp.join('');
    
    if (method === 'email') {
      const agentCheck = checkAgentEmailValidity(email);
      if (!agentCheck.isValid) {
        toast.error(agentCheck.error || 'Access Denied');
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = method === 'email' ? { email: email.trim().toLowerCase(), code: otpCode } : { phone: phone.trim(), code: otpCode };
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Login successful!');
        onSuccess(method === 'email' ? email : phone);
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error("Verification Error:", err);
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Testing Mode Banner */}
      <div className="bg-indigo-600 border border-indigo-700 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col gap-3 md:gap-4 shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 text-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-md">
            <ShieldCheck size={22} className="md:w-7 md:h-7" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-black text-white tracking-tight">System in Testing Mode</p>
            <p className="text-[10px] md:text-[11px] text-indigo-100 font-bold uppercase tracking-wider opacity-80">Demo SMS/Email auto-fills</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 relative z-10">
          <p className="text-[11px] md:text-xs text-indigo-50 font-medium leading-relaxed">
            Use any <span className="text-white font-black underline decoration-indigo-400 underline-offset-4 decoration-2">6 digits (e.g. 123456)</span> to verify. 
            We'll also auto-fill the code for you after you click "Send OTP".
          </p>
        </div>
      </div>

      {step === 'input' ? (
        <>
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                method === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Mail size={16} /> Email
            </button>
            <button
              onClick={() => setMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                method === 'phone' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Phone size={16} /> Phone
            </button>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {method === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {method === 'email' ? <Mail size={18} /> : <Phone size={18} />}
                </div>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={method === 'email' ? 'name@example.com' : '10-digit mobile number'}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  value={method === 'email' ? email : phone}
                  onChange={(e) => method === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Send OTP <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Login</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
              <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                We'll send a one-time password to verify your account. No password required.
              </p>
            </div>
            {method === 'email' && (
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/40 text-left">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  <span className="font-bold text-indigo-600">Field Agent Login:</span> Use your unique 5-digit ID to log in, e.g., <span className="font-bold font-mono text-indigo-700">12345.agent@jiffex.com</span>.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Verify Identity</h3>
            <p className="text-sm text-slate-500">
              Enter the 6-digit code sent to <span className="font-bold text-slate-900">{method === 'email' ? email : phone}</span>
            </p>
            <div className="mt-2 p-2 bg-indigo-50 rounded-lg text-[10px] font-bold text-indigo-600 uppercase tracking-widest inline-block">
              Testing Mode: Use any 6 digits (e.g. 123456)
            </div>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-14 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  'Verify & Continue'
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full py-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Change {method === 'email' ? 'email' : 'phone number'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};
