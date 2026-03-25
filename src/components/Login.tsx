import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { LogIn, Loader2, AlertCircle, Mail, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onSuccess: (email: string) => void;
}

type LoginMethod = 'email' | 'mobile' | 'test';
type LoginStep = 'identifier' | 'otp';

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<LoginMethod>('email');
  const [step, setStep] = useState<LoginStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const switchMethod = (newMethod: LoginMethod) => {
    setMethod(newMethod);
    setIdentifier('');
    setPassword('');
    setError(null);
    setMessage(null);
    setStep('identifier');
  };

  const handleTestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    
    setLoading(true);
    // Simulate a small delay for "authenticating"
    setTimeout(() => {
      setLoading(false);
      onSuccess(identifier);
    }, 800);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (method === 'email') {
        const { error } = await supabase.auth.signInWithOtp({
          email: identifier,
          options: { shouldCreateUser: true }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          phone: identifier,
          options: { shouldCreateUser: true }
        });
        if (error) throw error;
      }

      setStep('otp');
      setMessage(`OTP sent to your ${method === 'email' ? 'email' : 'mobile number'}`);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || `Failed to send OTP to ${method}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (method === 'email') {
        result = await supabase.auth.verifyOtp({
          email: identifier,
          token: otp,
          type: 'email',
        });
      } else {
        result = await supabase.auth.verifyOtp({
          phone: identifier,
          token: otp,
          type: 'sms',
        });
      }

      const { data, error } = result;

      if (error) throw error;

      if (data.session) {
        onSuccess(data.session.user.email || identifier);
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Login error:', err);
      let friendlyMessage = err.message || 'Failed to sign in with Google';
      if (friendlyMessage.includes('provider is not enabled')) {
        friendlyMessage = 'Google Sign-In is not enabled in the Supabase dashboard. Please enable it in Authentication > Providers.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {step === 'identifier' ? (
          <>
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => switchMethod('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  method === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Mail size={18} />
                Email
              </button>
              <button
                type="button"
                onClick={() => switchMethod('mobile')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  method === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Phone size={18} />
                Mobile
              </button>
              <button
                type="button"
                onClick={() => switchMethod('test')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  method === 'test' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LogIn size={18} />
                Test
              </button>
            </div>

            {method === 'test' ? (
              <form onSubmit={handleTestLogin} className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
                  Testing Mode: Any credentials will work
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Username / Email</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="any_username"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="any_password"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !identifier || !password}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In (Test Mode)'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {method === 'email' ? 'Email Address' : 'Mobile Number'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      {method === 'email' ? <Mail size={20} /> : <Phone size={20} />}
                    </div>
                    <input
                      type={method === 'email' ? 'email' : 'tel'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={method === 'email' ? 'name@example.com' : '+1234567890'}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                    <AlertCircle className="shrink-0" size={18} />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !identifier}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      Send OTP
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-70"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Google
            </button>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Verify OTP</h2>
              <p className="text-slate-500 mt-2">
                Enter the 6-digit code sent to <br />
                <span className="font-bold text-slate-900">{identifier}</span>
              </p>
            </div>

            {message && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-600 text-sm">
                <CheckCircle2 className="shrink-0" size={18} />
                <p>{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                <AlertCircle className="shrink-0" size={18} />
                <p>{error}</p>
              </div>
            )}

            <div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-3xl text-center tracking-[0.5em] font-bold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setStep('identifier')}
              className="w-full py-2 text-slate-500 font-bold hover:text-slate-700 transition-all"
            >
              Change {method === 'email' ? 'Email' : 'Mobile Number'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
