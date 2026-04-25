'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronRight, MessageSquare, ArrowLeft } from 'lucide-react';

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
        if (!user) { router.push('/login'); return; }
        fetchTickets();
    }, [user]);

    const fetchTickets = async () => {
        try {
            const { data } = await api.get('/support/my-tickets');
            setTickets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/support', newTicket);
            addToast("Ticket Created", "success");
            setShowCreate(false);
            setNewTicket({ subject: '', message: '', priority: 'Medium' });
            fetchTickets();
        } catch (err) {
            addToast("Failed to create ticket", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-700';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700';
            case 'Resolved': return 'bg-green-100 text-green-700';
            case 'Closed': return 'bg-zinc-100 text-zinc-500';
            default: return 'bg-zinc-100 text-zinc-500';
        }
    };

    if (loading) return <div className="text-center pt-52">Loading...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 pt-40 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <Link href="/account" className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-black mb-2 transition-colors decoration-none">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-black leading-none">My Tickets</h1>
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)} className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all border-none cursor-pointer">
                        {showCreate ? 'Cancel' : <><Plus size={16} /> New Ticket</>}
                    </button>
                </div>

                {/* CREATE FORM */}
                {showCreate && (
                    <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl mb-12 animate-in slide-in-from-top-4">
                        <h3 className="font-black text-xl uppercase italic mb-6 text-black">Submit a Request</h3>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-2">Subject / Issue</label>
                                <input required type="text" className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl font-bold outline-none focus:border-black text-black"
                                    placeholder="e.g. Order #1234 Status"
                                    value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-2">Priority</label>
                                <select className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl font-bold outline-none focus:border-black text-black cursor-pointer"
                                    value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}>
                                    <option value="Low">Low - General Inquiry</option>
                                    <option value="Medium">Medium - Order Issue</option>
                                    <option value="High">High - Urgent / Payment Issue</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-2">Message</label>
                                <textarea required className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl font-medium outline-none focus:border-black h-32 resize-none text-black"
                                    placeholder="Describe your issue in detail..."
                                    value={newTicket.message} onChange={e => setNewTicket({ ...newTicket, message: e.target.value })} />
                            </div>
                            <button disabled={submitting} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs border-none cursor-pointer">
                                {submitting ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </form>
                    </div>
                )}

                {/* TICKET LIST */}
                <div className="space-y-4">
                    {tickets.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
                            <MessageSquare size={48} className="mx-auto text-zinc-200 mb-4" />
                            <h3 className="text-lg font-bold text-black">No tickets yet</h3>
                            <p className="text-zinc-500 text-sm">Need help? Create a new support ticket.</p>
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <Link href={`/support-tickets/${ticket._id}`} key={ticket._id} className="block bg-white p-6 rounded-2xl border border-zinc-100 hover:border-black hover:shadow-lg transition-all group relative overflow-hidden decoration-none">
                                {!ticket.isReadByUser && ticket.adminResponse && (
                                    <div className="absolute top-0 right-0 p-2 bg-red-500 rounded-bl-xl z-10">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                )}
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold group-hover:underline text-black decoration-zinc-300 underline-offset-4">{ticket.subject}</h3>
                                        <p className="text-zinc-500 text-sm mt-1 line-clamp-1">{ticket.message}</p>
                                    </div>
                                    <ChevronRight className="text-zinc-300 group-hover:text-black transition-colors" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
