import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle2, ShieldCheck, RefreshCw, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface LoginProps {
  onSuccess: (email: string, name?: string) => void;
  initialEmail?: string;
  initialPhone?: string;
  initialMethod?: string;
}

interface AgentProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  vehicleNumber?: string;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, initialEmail = '' }) => {
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    let interval: any = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Helper to validate agent work email against agent management list
  const checkAgentEmailValidity = (enteredEmail: string): { isValid: boolean; error?: string } => {
    const emailLower = enteredEmail.trim().toLowerCase();
    const isAgentPattern = emailLower.endsWith('.agent@jiffex.com') || 
                           emailLower.endsWith('.agent@jiffex.in') || 
                           emailLower === 'agent@jiffex.com' ||
                           emailLower === 'agent@jiffex.in';

    if (!isAgentPattern) {
      return { isValid: true };
    }

    // Default agents list
    let agents: AgentProfile[] = [
      { id: '10001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: '10001.agent@jiffex.com', status: 'Active', vehicleNumber: 'KA-01-AB-1234' },
      { id: '10002', name: 'Priya Patel', phone: '+91 87654 32109', email: '10002.agent@jiffex.com', status: 'Active', vehicleNumber: 'MH-02-CD-5678' },
      { id: '12345', name: 'Field Agent', phone: '+91 00000 00000', email: '12345.agent@jiffex.com', status: 'Active', vehicleNumber: 'TEST-001' },
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
    // 2. Matches [id].agent@jiffex.com or [id].agent@jiffex.in pattern
    const matchesExplicit = agents.some(a => a.email && a.email.trim().toLowerCase() === emailLower);
    const matchesDefaultPattern = agents.some(a => 
      `${a.id.trim().toLowerCase()}.agent@jiffex.com` === emailLower ||
      `${a.id.trim().toLowerCase()}.agent@jiffex.in` === emailLower
    );
    const isTestAgent = emailLower === 'agent@jiffex.com' || emailLower === 'agent@jiffex.in';

    if (matchesExplicit || matchesDefaultPattern || isTestAgent) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'This email is not registered under Agent Management. Access Denied.'
    };
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check agent email validation if applicable
    const agentCheck = checkAgentEmailValidity(cleanEmail);
    if (!agentCheck.isValid) {
      toast.error(agentCheck.error || 'Access Denied');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setErrorMessage(null);
        setResendCooldown(45); // 45 seconds cooldown before resend
        toast.success(data.message || `Verification code sent to ${cleanEmail}`);
        // Focus first OTP field after state transition
        setTimeout(() => {
          document.getElementById('otp-0')?.focus();
        }, 150);
      } else {
        throw new Error(data.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      console.error("[Login] Send OTP Error:", err);
      const msg = err.message || 'Failed to send verification code. Please check your connection.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerVerification = async (enteredOtp: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const otpCode = enteredOtp.trim();

    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code');
      return;
    }

    const agentCheck = checkAgentEmailValidity(cleanEmail);
    if (!agentCheck.isValid) {
      toast.error(agentCheck.error || 'Access Denied');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail, 
          code: otpCode 
        })
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Authentication successful! Welcome to Jiffex.');
        onSuccess(cleanEmail, data.user?.name);
      } else {
        const errorMsg = data.error || 'Invalid verification code. Please check your email and try again.';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        // Highlight inputs and select first
        setTimeout(() => {
          document.getElementById('otp-0')?.focus();
        }, 100);
      }
    } catch (err: any) {
      console.error("[Login] Verification Error:", err);
      const msg = err.message || 'Verification failed. Please check the code.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await triggerVerification(otp.join(''));
  };

  const handleOtpChange = (index: number, value: string) => {
    setErrorMessage(null);
    // Handle pasting a full 6-digit code
    if (value.length > 1) {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      if (digitsOnly.length > 0) {
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = digitsOnly[i] || '';
        }
        setOtp(newOtp);
        if (digitsOnly.length === 6) {
          triggerVerification(digitsOnly);
        } else {
          const nextFocusIndex = Math.min(digitsOnly.length, 5);
          document.getElementById(`otp-${nextFocusIndex}`)?.focus();
        }
        return;
      }
    }

    if (!/^\d*$/.test(value)) return;

    const singleDigit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);

    // Auto-focus next input or auto-submit on complete 6 digits
    if (singleDigit && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    } else if (singleDigit && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        triggerVerification(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtp(newOtp);
      if (pastedData.length === 6) {
        triggerVerification(pastedData);
      } else {
        const targetIndex = Math.min(pastedData.length, 5);
        document.getElementById(`otp-${targetIndex}`)?.focus();
      }
    }
  };

  return (
    <div className="space-y-6">
      {step === 'input' ? (
        <div className="space-y-6">
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] font-bold text-indigo-600 lowercase tracking-normal">passwordless sign-in</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send One-Time Password</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                We will send a secure 6-digit one-time password (OTP) to your email to verify your session.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-indigo-100 shadow-sm">
              <KeyRound size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Check Your Email</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {['srikanth.satya@jiffex.in', 'arun.dubba@jiffex.in', 'admin@jiffex.com', 'admin@jiffex.in'].includes(email.trim().toLowerCase()) ? (
                <>
                  We sent a 6-digit admin verification code to <span className="font-bold text-slate-900 block mt-1">srikanth.satya@jiffex.in & arun.dubba@jiffex.in</span>
                </>
              ) : email.trim().toLowerCase().includes('.agent@') || email.trim().toLowerCase() === 'agent@jiffex.com' || email.trim().toLowerCase() === 'agent@jiffex.in' ? (
                <>
                  Agent verification code for <span className="font-bold text-slate-900">{email}</span> sent to <span className="font-bold text-indigo-600 block mt-1">srikanth.satya@jiffex.in (Testing Mode)</span>
                </>
              ) : (
                <>
                  We sent a 6-digit verification code to <span className="font-bold text-slate-900 block sm:inline">{email}</span>
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete="one-time-code"
                  className={`w-11 sm:w-12 h-14 text-center text-2xl font-black rounded-xl focus:ring-2 outline-none transition-all shadow-sm ${
                    errorMessage
                      ? 'bg-rose-50 border-2 border-rose-300 text-rose-900 focus:ring-rose-400'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 focus:ring-indigo-500 focus:bg-white'
                  }`}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700"
              >
                {errorMessage}
              </motion.div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={() => handleSendOTP()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};
