'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';
import { Mail, ShieldCheck, Lock, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';

export const AuthForgotPasswordView = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0); 

  const { addToast } = useToast();
  const router = useRouter();
  const API_URL = "/users";

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await api.post(`${API_URL}/forgot-password`, {
        email: email.toLowerCase().trim()
      });
      setStep(2);
      setTimer(60); // Start 60s countdown
      addToast("OTP SENT TO YOUR EMAIL", "success");
    } catch (err: any) {
      addToast(err.response?.data?.message || "Error sending code", "error");
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`${API_URL}/reset-password`, {
        email: email.toLowerCase().trim(),
        code: code.trim(),
        newPassword: newPassword.trim()
      });
      addToast("PASSWORD UPDATED SUCCESSFULLY", "success");
      router.push('/login');
    } catch (err: any) {
      addToast(err.response?.data?.message || "Invalid or Expired Code", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 page-top pb-20">
      <div className="max-w-sm w-full">
        <button
          onClick={() => step === 1 ? router.push('/login') : setStep(1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-12 hover:text-black transition-all"
        >
          <ArrowLeft size={14} /> {step === 1 ? 'Back to Login' : 'Back to Email'}
        </button>

        <h1 className="text-xl md:text-3xl font-black uppercase tracking-normal md:tracking-tighter text-center mb-2 whitespace-nowrap text-black">
          Reset <span className="text-red-500">Password</span>
        </h1>
        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] text-center mb-8">Securely recover your studio access</p>

        <form onSubmit={step === 1 ? handleSendOtp : handleReset} className="space-y-6">
          {step === 1 ? (
            <div className="border-b border-zinc-200 py-4 focus-within:border-black transition-colors">
              <input
                type="email" placeholder="ENTER REGISTERED EMAIL" required
                className="w-full bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest text-black"
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-zinc-200 py-4 focus-within:border-black transition-colors">
                <input
                  type="text" placeholder="6-DIGIT CODE" required maxLength={6}
                  className="w-full bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest text-black"
                  value={code} onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="border-b border-zinc-200 py-4 focus-within:border-black transition-colors">
                <input
                  type="password" placeholder="NEW PASSWORD" required
                  className="w-full bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest text-black"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              {/* RESEND TIMER UI */}
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive code?"}
                </p>
                <button
                  type="button"
                  disabled={timer > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${timer > 0 ? 'text-zinc-200' : 'text-black hover:underline'}`}
                >
                  <RotateCcw size={10} /> Resend
                </button>
              </div>
            </div>
          )}

          <button className="w-full bg-black text-white py-5 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin" size={16} /> : step === 1 ? "Get Reset Code" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};
