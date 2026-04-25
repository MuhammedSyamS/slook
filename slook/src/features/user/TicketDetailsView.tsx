'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, User, MessageSquare, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

export const TicketDetailsView = () => {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) fetchTicket();
    }, [id, user]);

    const fetchTicket = async () => {
        try {
            const { data } = await api.get(`/support/${id}`);
            setTicket(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center pt-52">Loading...</div>;
    if (!ticket) return <div className="text-center pt-52">Ticket not found</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-700';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700';
            case 'Resolved': return 'bg-green-100 text-green-700';
            case 'Closed': return 'bg-zinc-100 text-zinc-500';
            default: return 'bg-zinc-100 text-zinc-500';
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 pt-40 pb-20 px-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/support-tickets" className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-black mb-8 transition-colors decoration-none">
                    <ArrowLeft size={14} /> Back to My Tickets
                </Link>

                <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-zinc-100">
                    {/* HEADER */}
                    <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                ID: {ticket._id}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-black leading-none">{ticket.subject}</h1>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Priority: <span className="text-black">{ticket.priority}</span></p>
                    </div>

                    {/* CONVERSATION */}
                    <div className="p-8 space-y-8">
                        {/* USER MESSAGE */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shrink-0">
                                <User size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className="font-bold text-sm text-black">You</span>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(ticket.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="bg-zinc-50 p-6 rounded-2xl rounded-tl-none border border-zinc-100 text-sm text-zinc-700 leading-relaxed">
                                    {ticket.message}
                                </div>
                            </div>
                        </div>

                        {/* ADMIN RESPONSE */}
                        {ticket.adminResponse ? (
                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                                    <Zap size={20} fill="currentColor" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline justify-between mb-1 flex-row-reverse">
                                        <span className="font-bold text-sm text-indigo-600">Support Team</span>
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(ticket.updatedAt).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-indigo-50 p-6 rounded-2xl rounded-tr-none border border-indigo-100 text-sm text-indigo-900 leading-relaxed shadow-sm">
                                        {ticket.adminResponse}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 border-t border-dashed border-zinc-200">
                                <Clock className="mx-auto text-zinc-300 mb-2" size={32} />
                                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Waiting for response...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
