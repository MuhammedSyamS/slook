'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { GoogleLogin as GoogleAuthButton } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';

export const AuthRegisterView = () => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', referralCode: '' });
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const { setUser, syncGuestWishlist } = useAuthStore();
  const { addToast } = useToast();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    try {
      const res = await api.post('/users/google-login', {
        token: credentialResponse.credential
      });

      if (res.data.token) {
        // Set cookie for middleware
        document.cookie = `token=${res.data.token}; path=/; max-age=31104000; SameSite=Lax`;
        
        setUser(res.data);
        if (syncGuestWishlist) syncGuestWishlist();
        addToast("Logged in with Google", "success");
        if (res.data.isAdmin || res.data.role === 'manager') router.push('/admin');
        else router.push('/account');
      }
    } catch (err: any) {
      console.error("Google Signup Backend Error:", err.response?.data || err);
      addToast("Google Login Failed", "error");
    }
  };

  const handleGoogleError = () => {
    addToast("Login Failed", "error");
  };

  // --- AUTO-VANISH STATUS MESSAGE ---
  useEffect(() => {
    if (status.msg) {
      const timerId = setTimeout(() => {
        setStatus({ type: '', msg: '' });
      }, 4000);
      return () => clearTimeout(timerId);
    }
  }, [status.msg]);

  // --- OTP TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtp && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOtp, timer]);

  // --- STEP 1: SEND OTP ---
  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      await api.post('/users/send-otp', { email: formData.email.toLowerCase().trim() });
      setShowOtp(true);
      setTimer(60);
      setCanResend(false);
      setStatus({ type: 'success', msg: 'OTP SENT TO YOUR EMAIL' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.message || "COULD NOT SEND OTP" });
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP & CREATE ACCOUNT ---
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.post('/users/register', {
        ...formData,
        email: formData.email.toLowerCase().trim(),
        password: formData.password.trim(),
        code: otp.join('')
      });

      setStatus({ type: 'success', msg: 'ACCOUNT CREATED SUCCESSFULLY!' });

      // Set cookie for middleware
      document.cookie = `token=${data.token}; path=/; max-age=31104000; SameSite=Lax`;

      setUser(data);
      if (syncGuestWishlist) syncGuestWishlist();

      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.message || "INVALID CODE" });
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    // Auto-focus next input
    if (val && e.target.nextElementSibling) {
      (e.target.nextElementSibling as HTMLInputElement).focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 page-top pb-20">
      <div className="w-full max-w-md">
        <h1 className="text-xl md:text-3xl font-black uppercase tracking-normal md:tracking-tighter text-center mb-2 whitespace-nowrap">
          {showOtp ? <span>Verify <span className="text-red-500">OTP</span></span> : <span>Create <span className="text-red-500">Account</span></span>}
        </h1>

        <div className="mb-2 min-h-[20px]">
          {status.msg && (
            <div className={`p-2 text-[9px] font-bold uppercase tracking-widest text-center ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-black text-white'
              }`}>
              {status.msg}
            </div>
          )}
        </div>

        {!showOtp && (
          <div className="mb-8 flex justify-center flex-col items-center gap-4">
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              type="standard"
              theme="filled_black"
              size="large"
              text="signup_with"
              shape="pill"
            />
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-[10px] md:text-[10px] uppercase font-bold tracking-widest"><span className="bg-white px-2 text-gray-400">Or using email</span></div>
            </div>
          </div>
        )}

        {!showOtp ? (
          <div className="space-y-6">
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full border-b border-gray-300 py-3 outline-none focus:border-black placeholder-gray-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest bg-transparent"
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full border-b border-gray-300 py-3 outline-none focus:border-black placeholder-gray-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest bg-transparent"
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                className="w-full border-b border-gray-300 py-3 outline-none focus:border-black placeholder-gray-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest bg-transparent"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full border-b border-gray-300 py-3 outline-none focus:border-black placeholder-gray-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest bg-transparent"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full border-b border-gray-300 py-3 outline-none focus:border-black placeholder-gray-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest pr-10 bg-transparent"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-3 text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input
                type="text"
                placeholder="Referral Code (Optional)"
                className="w-full border-b border-gray-300 py-3 outline-none focus:border-black placeholder-gray-500 uppercase font-bold text-[9px] md:text-[10px] tracking-widest bg-transparent"
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              />
              <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 font-black uppercase tracking-widest text-sm md:text-sm hover:bg-gray-800 transition active:scale-95">
                {loading ? "Sending OTP..." : "Create Account"}
              </button>
            </form>
            <div className="text-center mt-4">
              <p className="text-xs md:text-xs font-medium text-gray-500">
                Already a user? <Link href="/login" className="text-black font-bold uppercase tracking-wide border-b border-black pb-1 ml-1 text-xs md:text-xs">Login</Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <form onSubmit={handleOtpVerify} className="space-y-8">
              <div className="flex justify-between gap-1 md:gap-2">
                {otp.map((data, i) => (
                  <input key={i} type="text" maxLength={1} className="w-10 h-12 md:w-12 md:h-14 border-b-2 border-gray-300 text-center text-lg md:text-xl font-bold focus:border-black outline-none bg-transparent" value={data} onChange={(e) => handleOtpChange(e, i)} />
                ))}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 font-black uppercase tracking-widest text-sm md:text-sm active:scale-95 transition-all">
                {loading ? "Verifying..." : "Verify & Create"}
              </button>
            </form>
            <div className="text-center">
              {canResend ? (
                <button onClick={() => handleRegisterSubmit()} className="text-xs md:text-xs font-black uppercase border-b border-black pb-1">Resend OTP</button>
              ) : (
                <p className="text-xs md:text-xs text-gray-400 font-black uppercase">Resend in {timer}s</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
