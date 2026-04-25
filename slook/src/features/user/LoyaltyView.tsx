'use client';

import React, { useEffect, useState } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeft, Coins, TrendingUp, TrendingDown,
    Calendar, Gift, RotateCcw, UserPlus, Sparkles,
    Clock, ShoppingBag, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

const TIERS = [
    { name: 'Bronze', threshold: 0, color: 'from-orange-700 to-orange-900', text: 'Base Tier', perk: '1x Coins' },
    { name: 'Silver', threshold: 5000, color: 'from-zinc-300 to-zinc-500', text: '1.2x Coins', perk: 'Unlock at ₹5,000' },
    { name: 'Gold', threshold: 20000, color: 'from-amber-400 to-amber-600', text: '1.5x Coins', perk: 'Unlock at ₹20,000' },
    { name: 'Platinum', threshold: 50000, color: 'from-zinc-100 to-zinc-400', text: '2x Coins', perk: 'Unlock at ₹50,000' },
];

export const LoyaltyView = () => {
    const { user, refreshUser } = useAuthStore();
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Use local state directly from the self-healing API response
    const [freshPoints, setFreshPoints] = useState<number | null>(null);
    const [freshTotalSpent, setFreshTotalSpent] = useState<number | null>(null);
    const [freshTier, setFreshTier] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fire all calls in parallel
                const [historyRes, profileRes, ordersRes] = await Promise.all([
                    api.get('/users/loyalty-history'),
                    api.get('/users/profile'),
                    api.get('/orders/myorders').catch(() => ({ data: [] }))
                ]);

                // History: new shape { transactions, loyaltyPoints, totalSpent } or plain array
                const histData = historyRes.data;
                const txList = histData.transactions ?? histData;
                const apiPoints = histData.loyaltyPoints ?? null;

                setTransactions(Array.isArray(txList) ? txList : []);
                if (apiPoints !== null) setFreshPoints(apiPoints);

                // Calculate totalSpent from actual orders (handles COD isPaid=false)
                const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
                const calculatedSpent = orders
                    .filter((o: any) => !['Cancelled', 'Returned', 'Refunded'].includes(o.orderStatus))
                    .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

                // Use calculated > profile > api fallback
                const profileSpent = profileRes.data.totalSpent ?? 0;
                const finalSpent = calculatedSpent > 0 ? calculatedSpent : profileSpent;
                setFreshTotalSpent(finalSpent);

                // Tier calculation (Client-side source of truth for UI)
                const profileTier = profileRes.data.membershipTier ?? 'Bronze';
                let calculatedTier = 'Bronze';
                if (finalSpent >= 50000) calculatedTier = 'Platinum';
                else if (finalSpent >= 20000) calculatedTier = 'Gold';
                else if (finalSpent >= 5000) calculatedTier = 'Silver';

                // Use the highest tier between what the server thinks and what we calculated
                const finalTier = [profileTier, calculatedTier].includes('Platinum') ? 'Platinum' :
                    ([profileTier, calculatedTier].includes('Gold') ? 'Gold' :
                        ([profileTier, calculatedTier].includes('Silver') ? 'Silver' : 'Bronze'));

                setFreshTier(finalTier);

                // Sync store in background
                refreshUser();
            } catch (err) {
                console.error('Failed to fetch loyalty data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, refreshUser]);

    // Calculate coin balance directly from the transaction list (source of truth on screen)
    // earn/bonus/referral/refund = credits, spend/expire = debits
    const calculatedPoints = transactions.reduce((sum, tx) => {
        if (['earn', 'bonus', 'referral', 'refund'].includes(tx.type)) return sum + (tx.amount || 0);
        if (['spend', 'expire'].includes(tx.type)) return sum - (tx.amount || 0);
        return sum;
    }, 0);
    const points = Math.max(0, freshPoints !== null ? freshPoints : (user?.loyaltyPoints ?? calculatedPoints));
    const totalSpent = freshTotalSpent ?? user?.totalSpent ?? 0;
    const tierName = freshTier ?? user?.membershipTier ?? 'Bronze';
    const nextTier = TIERS.find(t => t.threshold > totalSpent);
    const nextThreshold = nextTier?.threshold || 50000;
    // Determine the previous tier's threshold to calculate progress within current bracket
    const currentTierObj = [...TIERS].reverse().find(t => totalSpent >= t.threshold) || TIERS[0];
    const prevThreshold = currentTierObj.threshold;
    const bracket = nextThreshold - prevThreshold;
    const progressPct = bracket > 0 ? Math.min(100, ((totalSpent - prevThreshold) / bracket) * 100) : 100;

    const getTransactionMeta = (tx: any) => {
        switch (tx.type) {
            case 'earn':
                return {
                    icon: <ShoppingBag size={14} />,
                    bg: 'bg-green-50',
                    text: 'text-green-600',
                    badge: 'bg-green-100 text-green-700',
                    label: 'Order Reward',
                    amountColor: 'text-green-600'
                };
            case 'spend':
                return {
                    icon: <TrendingDown size={14} />,
                    bg: 'bg-red-50',
                    text: 'text-red-500',
                    badge: 'bg-red-100 text-red-700',
                    label: 'Coins Used',
                    amountColor: 'text-red-500'
                };
            case 'bonus':
                return {
                    icon: <Gift size={14} />,
                    bg: 'bg-purple-50',
                    text: 'text-purple-500',
                    badge: 'bg-purple-100 text-purple-700',
                    label: 'Bonus',
                    amountColor: 'text-purple-600'
                };
            case 'refund':
                return {
                    icon: <RotateCcw size={14} />,
                    bg: 'bg-blue-50',
                    text: 'text-blue-500',
                    badge: 'bg-blue-100 text-blue-700',
                    label: 'Product Return',
                    amountColor: 'text-blue-600'
                };
            case 'referral':
                return {
                    icon: <UserPlus size={14} />,
                    bg: 'bg-amber-50',
                    text: 'text-amber-600',
                    badge: 'bg-amber-100 text-amber-800',
                    label: 'Referral Bonus',
                    amountColor: 'text-amber-600'
                };
            case 'expire':
                return {
                    icon: <AlertTriangle size={14} />,
                    bg: 'bg-zinc-100',
                    text: 'text-zinc-500',
                    badge: 'bg-zinc-200 text-zinc-600',
                    label: 'Expired',
                    amountColor: 'text-zinc-500'
                };
            default:
                return {
                    icon: <Coins size={14} />,
                    bg: 'bg-zinc-50',
                    text: 'text-zinc-500',
                    badge: 'bg-zinc-100 text-zinc-500',
                    label: 'Transaction',
                    amountColor: 'text-zinc-600'
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-28 pb-20 px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Skeleton className="w-40 h-8" />
                    <Skeleton className="w-full h-40 rounded-3xl" />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full h-16 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-44 md:pt-52 pb-24 overflow-x-hidden">
            <div className="max-w-2xl mx-auto px-4">

                <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 bg-zinc-50 px-4 py-2 rounded-full w-fit group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
                </button>

                <div className="mb-12">
                    <h1 className="!text-xl md:!text-5xl font-black uppercase tracking-tighter leading-none">
                        Loyalty <span className="text-red-600">Ledger</span>
                    </h1>
                    <div className="h-0.5 w-10 bg-black mt-2 md:mt-4"></div>
                </div>

                {/* Tier Status Card */}
                <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:p-10 mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative z-10">

                        {/* Top Row */}
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500 mb-1 flex items-center gap-1">
                                    <Sparkles size={10} className="animate-pulse" /> Current Status
                                </p>
                                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Elite {tierName}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl sm:text-3xl font-black text-amber-400">{points.toLocaleString()}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Available Coins</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                <span>{nextTier ? `Progress to ${nextTier.name}` : 'Max Tier Reached'}</span>
                                <span>₹{totalSpent.toLocaleString()} spent</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
                                />
                            </div>
                            {nextTier && (
                                <p className="text-[9px] text-zinc-500 font-medium">
                                    ₹{(nextThreshold - totalSpent).toLocaleString()} more to spend to reach {nextTier.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tier Milestone Scroll */}
                <div className="mb-8">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3 px-1">Tier Milestones</h3>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {TIERS.map((tier) => {
                            const isActive = tierName === tier.name;
                            return (
                                <div
                                    key={tier.name}
                                    className={`shrink-0 w-36 p-4 rounded-2xl border transition-all ${isActive ? 'border-amber-400/50 bg-zinc-900 text-white shadow-lg shadow-amber-500/10' : 'border-zinc-100 bg-zinc-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tier.color} mb-3 shadow-md`} />
                                    <p className={`text-xs font-black uppercase tracking-tight mb-0.5 ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                                        {isActive && '✓ '}Elite {tier.name}
                                    </p>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}>{tier.text}</p>
                                    <p className={`text-[8px] font-medium mt-1 ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>{tier.perk}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Transactions */}
                <div className="space-y-3 mb-8">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-3 mb-4">Recent Activity</h3>

                    {transactions.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                            <Coins size={32} className="mx-auto text-zinc-200 mb-3" />
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">No transactions yet</p>
                            <Link href="/shop" className="text-[9px] font-black uppercase text-black underline">Start Shopping to Earn</Link>
                        </div>
                    ) : (
                        transactions.map((tx) => {
                            const meta = getTransactionMeta(tx);
                            const isDebit = tx.type === 'spend' || tx.type === 'expire';
                            return (
                                <div key={tx._id} className="bg-white border border-zinc-100 hover:border-zinc-300 p-4 sm:p-5 rounded-2xl transition-all">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
                                                {meta.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-zinc-900">{meta.label}</p>
                                                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${meta.badge}`}>{tx.type}</span>
                                                </div>
                                                <p className="text-[9px] text-zinc-500 leading-relaxed truncate max-w-[200px] sm:max-w-xs">{tx.description}</p>
                                                <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                    <Calendar size={8} />
                                                    {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-right shrink-0 ${meta.amountColor}`}>
                                            <p className="text-sm sm:text-base font-black tabular-nums">
                                                {isDebit ? '-' : '+'}{tx.amount ?? 0}
                                            </p>
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Coins</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* How it Works */}
                <div className="p-5 sm:p-8 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <h4 className="text-[9px] font-black uppercase tracking-widest mb-4">How It Works</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Earn Points</p>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                                Earn 1 coin for every ₹100 spent. Silver, Gold & Platinum tiers earn up to 2x more.
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Redeem Instantly</p>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                                Use coins at checkout for instant discounts. 1 coin = ₹1 off.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
