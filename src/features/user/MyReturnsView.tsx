'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import { Package, Truck, XCircle, ChevronLeft, AlertCircle, Clock, ShieldCheck, CheckCircle, Box, RotateCcw } from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

export const MyReturnsView = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReturns = async () => {
            if (!user) return;
            try {
                const { data } = await api.get('/returns/my');
                setReturns(data);
            } catch (error) {
                console.error("Failed to fetch returns", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, [user]);

    const getStatusStep = (status: string) => {
        if (status === 'Pending' || status === 'Requested') return 1;
        if (status === 'Approved') return 2;
        if (status === 'Pickup Scheduled') return 3;
        if (status === 'Picked Up' || status === 'In Transit') return 4;
        if (status === 'Received' || status === 'QC Pending') return 5;
        if (status === 'QC Passed') return 6;
        if (status === 'Refund Completed' || status === 'Returned' || status === 'Replacement Sent' || status === 'Exchanged') return 7;
        if (status === 'Rejected' || status === 'QC Failed') return -1;
        return 0;
    };

    if (loading) return <div className="min-h-screen bg-white pt-40 text-center text-[10px] font-black uppercase tracking-widest text-zinc-300">Loading...</div>;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-6 selection:bg-black selection:text-white">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button 
                  onClick={() => router.push('/account')} 
                  className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
                </button>

                <div className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="!text-xl md:!text-5xl font-black uppercase tracking-tighter leading-none">
                            My <span className="text-red-600">Returns</span>
                        </h1>
                        <div className="h-0.5 w-10 bg-black mt-2 md:mt-4"></div>
                    </div>
                    {/* REFRESH BTN */}
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-all"
                    >
                        Refresh Status
                    </button>
                </div>

                {returns.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 bg-zinc-50 rounded-[3rem] border border-dashed border-zinc-200"
                    >
                        <Package size={48} className="mx-auto text-zinc-200 mb-6" />
                        <p className="text-zinc-400 font-black uppercase tracking-widest !text-[10px] md:!text-xs">The history is empty</p>
                        <button 
                            onClick={() => router.push('/shop')} 
                            className="mt-8 bg-black text-white px-10 py-5 rounded-full font-black uppercase tracking-widest !text-[9px] md:!text-[10px] shadow-xl"
                        >
                            Back to Shop
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-4 md:space-y-6">
                        {returns.map((ret, idx) => {
                            const step = getStatusStep(ret.status);
                            const isRejected = step === -1;
                            const isDone = step === 7;

                            const getMilestones = () => [
                                { label: 'Requested', icon: Box, stepVal: 1 },
                                { label: 'Approved', icon: CheckCircle, stepVal: 2 },
                                { label: 'Pickup', icon: Truck, stepVal: 3 },
                                { label: 'QC', icon: ShieldCheck, stepVal: 5 },
                                { label: ret.type === 'Exchange' ? 'Exchanged' : 'Resolved', icon: RotateCcw, stepVal: 7 }
                            ];

                            const formatDate = (dateStr: string) => {
                                if (!dateStr) return null;
                                return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short' });
                            };

                            return (
                                <motion.div 
                                    key={ret._id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="relative border border-zinc-100 p-4 md:p-10 rounded-2xl md:rounded-[2rem] bg-white hover:border-black transition-all duration-500 group shadow-sm hover:shadow-xl"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
                                        {/* IMAGE */}
                                        <div className="w-20 h-28 md:w-32 md:h-44 bg-white rounded-2xl overflow-hidden shrink-0 border border-zinc-100 p-2">
                                            <img 
                                              src={resolveMediaURL(ret.orderItem.image)} 
                                              alt="" 
                                              className="w-full h-full object-cover mix-blend-multiply rounded-xl transition-transform duration-500 hover:scale-110" 
                                            />
                                        </div>

                                        {/* DETAILS */}
                                        <div className="flex-1 space-y-8">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                                                            ret.type === 'Exchange' ? 'bg-zinc-900 text-white' : 'bg-orange-500 text-white'
                                                        }`}>
                                                            {ret.type}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
                                                          isRejected ? 'border-red-500 text-red-500' : isDone ? 'border-green-500 text-green-500' : 'border-black text-black'
                                                        }`}>
                                                          {ret.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-black uppercase text-xl md:text-2xl tracking-tight leading-tight">{ret.orderItem.name}</h3>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">REF: {ret.type === 'Exchange' ? 'EXC' : 'RTN'}-#{ret._id.slice(-6).toUpperCase()}</span>
                                                        <span className="text-sm md:text-lg font-black font-mono text-black uppercase tracking-tighter">{ret._id}</span>
                                                        <div className="flex items-center gap-2 text-[9px] font-black text-zinc-300 uppercase tracking-widest mt-1">
                                                            <Box size={10} /> Associated Order: #{ret.order?._id?.slice(-6).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Initiated On</span>
                                                    <div className="text-sm md:text-lg font-black text-black uppercase tracking-tight bg-white px-4 py-2 rounded-xl border border-zinc-100 italic">
                                                        {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2">Reason: {ret.reason}</div>
                                                </div>
                                            </div>

                                            {/* LOGISTICS INFO */}
                                            {ret.pickupDetails?.courier && (
                                                <div className="p-5 bg-white rounded-2xl border border-zinc-100 flex flex-wrap items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                                                            <Truck size={16} className="text-black" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Logistic Agent</p>
                                                            <p className="text-[10px] font-black uppercase">{ret.pickupDetails.courier}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Manifest ID</p>
                                                        <p className="text-[10px] font-black uppercase text-right md:text-left">{ret.pickupDetails.trackingId || 'Preparing...'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* PROGRESS STEPPER */}
                                            <div className="relative pt-8 pb-4">
                                                <div className="absolute top-[41px] left-0 w-full h-[2px] bg-zinc-100 rounded-full" />
                                                <div
                                                    className={`absolute top-[41px] left-0 h-[2px] rounded-full transition-all duration-1000 ${isRejected ? 'bg-red-500' : 'bg-black'}`}
                                                    style={{ width: isRejected ? '100%' : `${(Math.max(0, step) / 7) * 100}%` }}
                                                />

                                                 <div className="relative flex justify-between">
                                                    {getMilestones().map((m, i) => {
                                                        const activeState = step >= m.stepVal && !isRejected;
                                                        const isCurrent = step === m.stepVal;
                                                        const MilestoneIcon = m.icon;
                                                        
                                                        return (
                                                            <div key={m.label} className="flex flex-col items-center gap-4 w-1/5">
                                                                <div className={`w-8 h-8 rounded-xl border-2 z-10 flex items-center justify-center transition-all duration-700 ${
                                                                    isRejected && i === 4 ? 'bg-red-500 border-red-500 text-white' :
                                                                    activeState ? 'bg-black border-black text-white' : 'bg-white border-zinc-100 text-zinc-200'
                                                                }`}>
                                                                    <MilestoneIcon size={14} />
                                                                </div>
                                                                <div className="text-center space-y-1">
                                                                    <span className={`block text-[8px] font-black uppercase tracking-widest ${activeState ? 'text-black' : 'text-zinc-200'}`}>
                                                                        {isRejected && i === 4 ? 'Rejected' : m.label}
                                                                    </span>
                                                                    {activeState && (
                                                                        <span className="block text-[7px] font-black text-zinc-400 uppercase tracking-widest">
                                                                          {formatDate(ret.timeline?.find((t: any) => t.status.includes(m.label))?.date || ret.createdAt)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* ADMIN COMMENT */}
                                            {ret.adminComment && (
                                                <div className="p-4 bg-zinc-900 border border-zinc-900 rounded-2xl flex gap-4">
                                                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-zinc-500" />
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Official Communiqué</p>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed">{ret.adminComment}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
