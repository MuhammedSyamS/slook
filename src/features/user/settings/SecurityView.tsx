'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import { Lock, ArrowLeft, ShieldCheck, Save, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

export const SecurityView = () => {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const { success, error: toastError } = useToast();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOTP = async () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setMessage({ type: 'error', text: "Please fill all password fields first" });
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match!" });
            return;
        }

        try {
            setSendingOtp(true);
            await api.post('/users/security/send-otp', {});
            setOtpSent(true);
            setMessage({ type: 'success', text: "Verification code sent to your email!" });
            success("Verification code sent!");
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to send code";
            setMessage({ type: 'error', text: msg });
            toastError(msg);
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!otpSent) {
            setMessage({ type: 'error', text: "Please request a verification code first" });
            return;
        }

        if (!otp) {
            setMessage({ type: 'error', text: "Please enter the verification code" });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match!" });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters" });
            return;
        }

        try {
            setLoading(true);

            const updateData = {
                firstName: user.firstName,
                lastName: user.lastName,
                password: formData.newPassword,
                currentPassword: formData.currentPassword,
                otp: otp
            };

            const { data } = await api.put('/users/profile', updateData);

            // Update Global Store
            setUser({ ...data, token: user.token });

            setMessage({ type: 'success', text: "Security Updated Successfully!" });
            success("Security Updated Successfully!");
            setLoading(false);
            setOtpSent(false);
            setOtp('');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });

        } catch (err: any) {
            console.error("Security Update Error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Update failed";
            setMessage({ type: 'error', text: errorMsg });
            toastError(errorMsg);
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white pt-40 lg:pt-48 pb-20 px-6 font-sans">
            <div className="max-w-xl mx-auto">

                <button 
                    onClick={() => router.push('/account')} 
                    className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-[10px] hover:text-black mb-12 transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Account
                </button>

                <div className="flex items-center gap-6 mb-12">
                    <div className="p-5 bg-zinc-50 rounded-[2rem] border border-zinc-100 shadow-sm">
                        <ShieldCheck size={32} className="text-black" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">Security <span className="text-zinc-200">Settings</span></h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Authentication & Privacy</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className={`p-6 mb-10 flex items-center gap-4 rounded-[2rem] border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}
                        >
                            {message.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100 shadow-xl shadow-black/[0.02]">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Current Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    className="w-full bg-white border border-transparent focus:border-black rounded-2xl py-5 pl-14 pr-14 outline-none font-bold text-sm transition-all shadow-sm"
                                    placeholder="Verify current password"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="w-full bg-white border border-transparent focus:border-black rounded-2xl py-5 pl-14 pr-14 outline-none font-bold text-sm transition-all shadow-sm"
                                    placeholder="Minimum 6 characters"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-black transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-white border border-transparent focus:border-black rounded-2xl py-5 pl-14 pr-6 outline-none font-bold text-sm transition-all shadow-sm"
                                    placeholder="Retype password"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {otpSent && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 pt-4 overflow-hidden"
                                >
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Verification Code (OTP)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-white border-2 border-amber-100 focus:border-amber-400 rounded-2xl py-6 px-4 outline-none font-black text-center text-2xl tracking-[0.8em] transition-all"
                                        placeholder="000000"
                                    />
                                    <p className="text-[9px] text-amber-600 font-bold uppercase text-center tracking-widest">Check your email for the 6-digit code</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-6 space-y-4">
                            {!otpSent ? (
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={sendingOtp}
                                    className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] disabled:opacity-50"
                                >
                                    {sendingOtp ? 'Processing...' : <><Lock size={16} /> Send Verification Code</>}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]"
                                >
                                    {loading ? 'Updating...' : <><Save size={16} /> Update Password</>}
                                </button>
                            )}

                            {otpSent && (
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    className="w-full text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                                >
                                    Resend Code
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="mt-12 p-8 bg-zinc-50 rounded-[2.5rem] border border-dashed border-zinc-200">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed text-center">
                        Security is our priority. <br />
                        Changes to your credentials will log you out from all other devices.
                    </p>
                </div>

            </div>
        </div>
    );
};
