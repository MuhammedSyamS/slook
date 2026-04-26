'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, MessageSquare, Clock, Zap, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TicketDetailsView = () => {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
             const timer = setTimeout(() => {
                if (!user) router.push('/login');
            }, 1000);
            return () => clearTimeout(timer);
        }
        fetchTicket();
    }, [id, user, router]);

    const fetchTicket = async () => {
        try {
            const { data } = await api.get(`/support/${id}`);
            setTicket(data);
        } catch (err) {
            console.error("SUPPORT: Fetch Ticket Error:", err);
            setTicket(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-50 text-blue-600 border border-blue-100';
            case 'In Progress': return 'bg-amber-50 text-amber-600 border border-amber-100';
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            case 'Closed': return 'bg-zinc-100 text-zinc-500 border border-zinc-200';
            default: return 'bg-zinc-50 text-zinc-400 border border-zinc-100';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-zinc-300" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Decrypting Support Frequency...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-8 px-6 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-200 rounded-full flex items-center justify-center">
                    <AlertTriangle size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black mb-2">Frequency Unavailable</h3>
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-8">The requested support manifest does not exist or access was denied.</p>
                    <Link href="/support/tickets" className="bg-black text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all decoration-none border-none cursor-pointer shadow-xl shadow-black/10">Return to Grid</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 selection:bg-black selection:text-white pt-44 md:pt-52 pb-20 px-6">
            <div className="max-w-3xl mx-auto">
                {/* HEADER BREADCRUMB */}
                <Link href="/support/tickets" className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-black mb-12 transition-all decoration-none w-fit">
                    <ArrowLeft size={14} /> Back to My Grid
                </Link>

                <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-black/5 overflow-hidden border border-zinc-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* MANIFEST HEADER */}
                    <div className="p-10 md:p-14 border-b border-zinc-50 bg-zinc-50/30 relative">
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex flex-col gap-2">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${getStatusColor(ticket.status)}`}>
                                    {ticket.status} Protocol
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-extrawide px-3 py-1 bg-white rounded-lg border w-fit ${ticket.priority === 'High' ? 'text-red-500 border-red-100 animate-pulse' : 'text-zinc-400 border-zinc-100'}`}>
                                    {ticket.priority} Tier Priority
                                </span>
                            </div>
                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-mega">
                                Frequency Ref: {ticket._id}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 text-black leading-tight">{ticket.subject}</h1>
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Clock size={12} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Initialized {new Date(ticket.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* CONVERSATION STREAM */}
                    <div className="p-10 md:p-14 space-y-12 bg-white">
                        {/* USER MESSAGE (ORIGIN) */}
                        <div className="flex gap-6 group">
                            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-black/5 transform group-hover:-translate-y-1 transition-transform">
                                <User size={24} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline justify-between mb-3 px-2">
                                    <span className="font-black text-[10px] uppercase tracking-widest text-black">Requester (You)</span>
                                    <span className="text-[8px] text-zinc-300 font-black uppercase tracking-tighter">Origin Status: Transmitted</span>
                                </div>
                                <div className="bg-zinc-50 p-8 rounded-[2rem] rounded-tl-none border border-zinc-100 text-sm md:text-base text-zinc-600 leading-relaxed font-medium shadow-sm">
                                    "{ticket.message}"
                                </div>
                            </div>
                        </div>

                        {/* STATUS SEPARATOR */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-dashed border-zinc-100"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-[8px] font-black uppercase tracking-[0.5em] text-zinc-300">Synchronicity Stream</span>
                            </div>
                        </div>

                        {/* ADMIN RESPONSE (INTERVENTION) */}
                        {ticket.adminResponse ? (
                            <div className="flex gap-6 flex-row-reverse group animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-200 transform group-hover:-translate-y-1 transition-transform">
                                    <Zap size={24} fill="currentColor" strokeWidth={1} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline justify-between mb-3 flex-row-reverse px-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={12} className="text-indigo-600" />
                                            <span className="font-black text-[10px] uppercase tracking-widest text-indigo-600">Studio Team Response</span>
                                        </div>
                                        <span className="text-[8px] text-zinc-300 font-black uppercase tracking-tighter">Intervention: Received</span>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] rounded-tr-none border-2 border-indigo-100 text-sm md:text-base text-indigo-900 leading-relaxed font-semibold shadow-2xl shadow-indigo-100/50">
                                        {ticket.adminResponse}
                                    </div>
                                    <div className="mt-4 flex flex-row-reverse">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 ml-4">Processed {new Date(ticket.updatedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 border-t border-dashed border-zinc-100 rounded-[2rem] bg-zinc-50/50">
                                <Clock className="mx-auto text-zinc-200 mb-4 animate-pulse" size={40} />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Response Frequency Pending</h4>
                                <p className="text-[9px] font-bold text-zinc-300 mt-2">Active Intervention Phase 1/3</p>
                            </div>
                        )}
                    </div>
                    
                    {/* FOOTER ACTION */}
                    <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Secure Protocol Connection</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border-none cursor-pointer active:scale-95">Print Manifest</button>
                            <button 
                                onClick={() => router.push('/support')}
                                className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-all border-none cursor-pointer active:scale-95 shadow-xl shadow-black/10"
                            >
                                Close Manifest
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-2">RefID: {ticket._id}</p>
                    <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-widest">Studio Support Synchronicity Engine v3.0</p>
                </div>
            </div>
        </div>
    );
};
