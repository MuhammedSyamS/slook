'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, MessageSquare, Clock, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export const SupportTicketsView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const router = useRouter();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'Medium' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            // Wait a bit for auth to initialize
            const timer = setTimeout(() => {
                if (!user) router.push('/login');
            }, 1000);
            return () => clearTimeout(timer);
        }
        fetchTickets();
    }, [user, router]);

    const fetchTickets = async () => {
        try {
            const { data } = await api.get('/support/my-tickets');
            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("SUPPORT: Fetch Tickets Error:", err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/support', newTicket);
            addToast("Support Ticket Initialized Successfully", "success");
            setShowCreate(false);
            setNewTicket({ subject: '', message: '', priority: 'Medium' });
            fetchTickets();
        } catch (err) {
            addToast("Failed to initialize support frequency", "error");
        } finally {
            setSubmitting(false);
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
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tracing Support Frequencies...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 selection:bg-black selection:text-white pt-44 md:pt-52 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 px-2">
                    <div>
                        <Link href="/support" className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-black mb-4 transition-all decoration-none w-fit">
                            <ArrowLeft size={14} /> Back to Support Hub
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-black leading-none">My <span className="text-zinc-200">Tickets.</span></h1>
                    </div>
                    <button 
                        onClick={() => setShowCreate(!showCreate)} 
                        className={`px-8 py-4 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border-none cursor-pointer shadow-xl ${showCreate ? 'bg-zinc-100 text-zinc-500' : 'bg-black text-white hover:bg-zinc-800 shadow-black/10'}`}
                    >
                        {showCreate ? 'Dismiss Request' : <><Plus size={16} strokeWidth={3} /> New Frequency</>}
                    </button>
                </div>

                {/* CREATE FORM (Synced for Slook Premium) */}
                {showCreate && (
                    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-zinc-100 shadow-2xl mb-16 animate-in slide-in-from-top-8 duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                            <MessageSquare size={120} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-black text-2xl uppercase italic tracking-tighter mb-8 text-black">Request Intervention</h3>
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-4">Subject / Issue Manifest</label>
                                        <input 
                                            required 
                                            type="text" 
                                            className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-[1.5rem] text-sm font-bold outline-none focus:border-black focus:bg-white transition-all text-black"
                                            placeholder="e.g. Order #SLK-8822 Frequency Drop"
                                            value={newTicket.subject} 
                                            onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-4">Priority Protocol</label>
                                        <select 
                                            className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-[1.5rem] text-sm font-bold outline-none focus:border-black focus:bg-white transition-all text-black appearance-none"
                                            value={newTicket.priority} 
                                            onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        >
                                            <option value="Low">Low - General Feedback</option>
                                            <option value="Medium">Medium - System Anomaly</option>
                                            <option value="High">High - Critical / Financial</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-4">Detailed Manifest</label>
                                    <textarea 
                                        required 
                                        className="w-full bg-zinc-50 border border-zinc-100 p-6 rounded-[2rem] text-sm font-medium outline-none focus:border-black focus:bg-white transition-all h-40 resize-none text-black leading-relaxed"
                                        placeholder="Describe the anomaly in detail for our agents..."
                                        value={newTicket.message} 
                                        onChange={e => setNewTicket({ ...newTicket, message: e.target.value })} 
                                    />
                                </div>
                                <button 
                                    disabled={submitting} 
                                    className="w-full bg-black text-white py-6 rounded-full font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl shadow-black/10 border-none cursor-pointer mt-4"
                                >
                                    {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Initialize Frequency'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TICKET LIST */}
                <div className="space-y-4">
                    {tickets.length === 0 ? (
                        <div className="text-center py-32 bg-white rounded-[3.5rem] border border-zinc-100 shadow-sm flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                                <MessageSquare size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight text-black mb-1">Silence detected.</h3>
                                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">No support frequencies recorded</p>
                            </div>
                        </div>
                    ) : (
                        tickets.map((ticket, idx) => (
                            <Link 
                                href={`/support/tickets/${ticket._id}`} 
                                key={ticket._id} 
                                className="block bg-white p-8 rounded-[2.5rem] border border-zinc-100 hover:shadow-2xl hover:border-black transition-all group relative overflow-hidden decoration-none animate-in fade-in slide-in-from-bottom-4 duration-500"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                {!ticket.isReadByUser && ticket.adminResponse && (
                                    <div className="absolute top-0 right-0 p-3 bg-red-600 rounded-bl-2xl z-20 shadow-lg">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                )}
                                <div className="flex justify-between items-start md:items-center relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <Clock size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${ticket.priority === 'High' ? 'bg-red-50 text-red-500' : 'text-zinc-300'}`}>
                                                {ticket.priority} Priority
                                            </span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-black mb-2 group-hover:translate-x-1 transition-transform duration-300">
                                            {ticket.subject}
                                        </h3>
                                        <p className="text-zinc-500 text-[11px] font-medium mt-1 line-clamp-1 group-hover:text-zinc-600 transition-colors">
                                            {ticket.message}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-300 group-hover:text-black group-hover:border-black group-hover:scale-110 transition-all duration-300 shrink-0">
                                        <ChevronRight size={24} strokeWidth={1.5} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                
                {/* FOOTER CTA */}
                <div className="mt-20 pt-12 border-t border-zinc-100 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-4">Baseline Protocol Requirement?</p>
                    <Link href="/support" className="text-[10px] font-black uppercase tracking-widest text-black hover:text-zinc-400 transition-all decoration-none">
                        Self-Service Manual (FAQs)
                    </Link>
                </div>
            </div>
        </div>
    );
};
