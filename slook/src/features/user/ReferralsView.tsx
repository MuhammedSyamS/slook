'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { Copy, Gift, Share2, Users, ArrowRight, DollarSign, Calendar, CheckCircle2, ChevronLeft, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export const ReferralsView = () => {
    const { user } = useAuthStore();
    const { success, error: toastError } = useToast();
    const router = useRouter();
    const [referralData, setReferralData] = useState<any>({
        referralCode: user?.referralCode || '...',
        referralEarnings: user?.referralEarnings || 0,
        referredFriends: []
    });
    const [loading, setLoading] = useState(true);

    const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralData.referralCode}` : '';

    useEffect(() => {
        const fetchReferralStats = async () => {
            try {
                const { data } = await api.get('/users/referrals');
                setReferralData(data);
            } catch (err) {
                console.error("Error fetching referrals:", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchReferralStats();
    }, [user]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        success("Referral Link Encoded to Clipboard");
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Join SLOOK Artifacts',
                text: 'Decrypt exclusive access on SLOOK. Use my referal for 10% value reduction!',
                url: referralLink,
            })
                .then(() => success("Broadcast Successful"))
                .catch((error) => console.log('Error sharing', error));
        } else {
            copyToClipboard();
        }
    };

    if (loading) return <div className="text-center pt-52 font-black uppercase tracking-widest text-zinc-300 animate-pulse">Syncing Social Network...</div>;

    return (
        <div className="min-h-screen bg-white pt-40 md:pt-48 pb-20 px-4 md:px-6 page-top">
            <div className="max-w-6xl mx-auto space-y-16">
                
                <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 bg-zinc-50 px-4 py-2 rounded-full w-fit group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
                </button>

                <div className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="!text-xl md:!text-5xl font-black uppercase tracking-tighter leading-none">
                            My <span className="text-red-600">Referrals</span>
                        </h1>
                        <div className="h-0.5 w-10 bg-black mt-2 md:mt-4"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* LEFT SIDE: THE OFFER */}
                    <div className="lg:col-span-7 space-y-12">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-950 text-white rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
                            <div className="relative z-10 space-y-10">
                                <span className="bg-white/10 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                                    <Sparkles size={12} className="text-amber-400 animate-pulse" />
                                    Growth Stimulus Verified
                                </span>
                                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] italic">
                                    Accelerate <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">The Collective</span>
                                </h2>
                                <p className="text-zinc-400 text-lg md:text-xl font-medium italic leading-relaxed max-w-xl">
                                    Distribute 10% value reduction to your network. Upon acquisition completion, your ledger receives ₹500 store credit.
                                </p>

                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/5 p-4 md:p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
                                        <div className="bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shrink-0 italic">
                                            {referralData.referralCode}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate flex-1 italic">
                                            {referralLink}
                                        </p>
                                        <div className="flex gap-4">
                                            <button onClick={copyToClipboard} className="p-4 bg-white/10 hover:bg-white hover:text-black rounded-full transition-all">
                                                <Copy size={16} />
                                            </button>
                                            <button onClick={handleShare} className="p-4 bg-white text-black hover:bg-zinc-200 rounded-full transition-all">
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* STATS GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {[
                                { icon: <DollarSign size={20} />, label: "Aggregate Earnings", val: `₹${referralData.referralEarnings}`, color: "bg-green-50 text-green-600" },
                                { icon: <Users size={20} />, label: "Network Size", val: referralData.referredFriends.length, color: "bg-blue-50 text-blue-600" },
                                { icon: <Gift size={20} />, label: "Friend Reduction", val: "10%", color: "bg-amber-50 text-amber-600" }
                            ].map((s, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-zinc-50/50 p-8 rounded-[2.5rem] border border-zinc-100 flex flex-col items-center text-center space-y-4 shadow-sm hover:shadow-xl transition-all"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color} shadow-inner`}>
                                        {s.icon}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black uppercase tracking-tighter italic">{s.val}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1">{s.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE: NETWORK LOG */}
                    <div className="lg:col-span-5 space-y-12">
                        <div className="bg-white border border-zinc-100 rounded-[3.5rem] p-10 md:p-12 shadow-sm space-y-12">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 italic border-b border-zinc-50 pb-8">Network Log</h2>

                            {referralData.referredFriends.length === 0 ? (
                                <div className="py-20 text-center space-y-6">
                                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 italic">No node connections detected</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {referralData.referredFriends.map((friend: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-6 rounded-3xl bg-zinc-50/50 border border-zinc-50 hover:border-black transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center text-xs font-black shadow-lg">
                                                    {friend.firstName[0]}{friend.lastName[0]}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black uppercase tracking-tighter">{friend.firstName} {friend.lastName}</p>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 italic">Connected {new Date(friend.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${friend.hasMadeFirstOrder ? 'bg-green-50 text-green-600 border-green-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                                                {friend.hasMadeFirstOrder ? 'Incentive Claimed' : 'Awaiting Action'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-8 border-t border-zinc-50">
                                <div className="space-y-6">
                                    {[
                                        { s: "01", t: "DISTRIBUTION", d: "Transmit link to your chosen node." },
                                        { s: "02", t: "ACQUISITION", d: "Node completes purchase with 10% reduction." },
                                        { s: "03", t: "SETTLEMENT", d: "₹500 value injected into your ledger." }
                                    ].map((step, i) => (
                                        <div key={i} className="flex gap-6">
                                            <span className="text-4xl font-black text-zinc-100 italic shrink-0 leading-none">{step.s}</span>
                                            <div className="space-y-1">
                                                <h4 className="text-[9px] font-black uppercase tracking-widest text-black">{step.t}</h4>
                                                <p className="text-[10px] font-medium text-zinc-400 uppercase leading-relaxed italic">{step.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
