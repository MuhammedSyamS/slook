'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    MessageSquare, CheckCircle, Clock, ShieldAlert,
    RefreshCw, Send, Mail, User, Phone, 
    ChevronRight, ExternalLink, Zap
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminSupportView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();

    // UI State
    const [viewMode, setViewMode] = useState('tickets'); // 'tickets', 'contacts', or 'chat'
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(Date.now());
    
    // Data State
    const [tickets, setTickets] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]); 
    const [activeChats, setActiveChats] = useState<any[]>([]);
    const [chatHistory, setChatHistory] = useState<any[]>([]);

    // Selection State
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [selectedContact, setSelectedContact] = useState<any>(null); 
    const [selectedChat, setSelectedChat] = useState<any>(null);

    // Form State
    const [reply, setReply] = useState('');
    const [chatMessage, setChatMessage] = useState('');
    const [statusUpdate, setStatusUpdate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            if (viewMode === 'tickets') {
                const { data } = await api.get('/support/admin/all');
                setTickets(data);
            } else if (viewMode === 'contacts') {
                const { data } = await api.get('/support/admin/contacts');
                setContacts(data);
            } else if (viewMode === 'chat') {
                const { data } = await api.get('/chat/active');
                setActiveChats(data);
            }
        } catch (err) {
            console.error(err);
            addToast("Support data sync failed", "error");
        } finally {
            setLoading(false);
        }
    }, [viewMode, user?.token, addToast]);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchData();

        // --- SOCKET.IO ---
        if (!socketRef.current && user?.token) {
            const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5005';
            socketRef.current = io(socketUrl, {
                auth: { token: user.token }
            });

            socketRef.current.on('new-ticket', (data) => {
                addToast(`Incoming Ticket: ${data.subject}`, "info");
                if (viewMode === 'tickets') fetchData();
            });

            socketRef.current.on('admin-receive-message', (msg) => {
                if (selectedChat?._id === msg.user) {
                    setChatHistory(prev => {
                        if (prev.some(m => m._id === msg._id)) return prev;
                        return [...prev, msg];
                    });
                    api.put(`/chat/read/${msg.user}`);
                }
                fetchData(); // Refresh active chat list for unread counts
            });
        }

        return () => {
             // We keep socket open for duration of the component lifecycle in this view
        };
    }, [fetchData, user?.token, selectedChat?._id, viewMode, addToast]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSelectChat = async (chat: any) => {
        setSelectedChat(chat);
        setLoading(true);
        try {
            const { data } = await api.get(`/chat/history/${chat._id}`);
            setChatHistory(data);
            await api.put(`/chat/read/${chat._id}`);
            setActiveChats(prev => prev.map(c => c._id === chat._id ? { ...c, unreadCount: 0 } : c));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !selectedChat || !socketRef.current) return;

        const msgData = {
            userId: selectedChat._id,
            senderId: user?._id,
            message: chatMessage,
            isAdmin: true,
            createdAt: new Date().toISOString()
        };

        socketRef.current.emit('send-message', msgData);
        setChatHistory(prev => [...prev, { ...msgData, _id: Date.now().toString() }]);
        setChatMessage('');
    };

    const handleUpdateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await api.put(`/support/${selectedTicket._id}`, {
                adminResponse: reply,
                status: statusUpdate || selectedTicket.status
            });
            addToast("Intelligence Transmitted", "success");
            setTickets(prev => prev.map(t => t._id === data._id ? data : t));
            setSelectedTicket(null);
            setReply('');
        } catch (err) {
            addToast("Update failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && tickets.length === 0 && activeChats.length === 0) return (
        <div className="h-[60vh] flex flex-col items-center justify-center font-black uppercase tracking-[0.3em] text-[10px] text-zinc-400">
            <RefreshCw className="animate-spin mb-4" size={24} /> INITIALISING OMNICHANNEL FEED...
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Support <span className="text-zinc-400">Desk</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Service Excellence & Communication Hub (MNCS-SUPPORT)</p>
                </div>

                <div className="flex bg-zinc-100 p-1.5 rounded-[2rem] border border-zinc-200">
                    {['tickets', 'contacts', 'chat'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => { setViewMode(mode); setSelectedChat(null); setSelectedTicket(null); }}
                            className={`px-8 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-black text-white shadow-xl scale-[1.05]' : 'text-zinc-500 hover:text-black hover:bg-white'}`}
                        >
                            {mode === 'contacts' ? 'Inquiries' : mode}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[75vh]">
                {/* LISTING COLUMN */}
                <div className="lg:col-span-4 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                    {viewMode === 'tickets' && tickets.map(ticket => (
                        <div key={ticket._id} onClick={() => { setSelectedTicket(ticket); setStatusUpdate(ticket.status); }} className={`p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${selectedTicket?._id === ticket._id ? 'bg-black text-white border-black shadow-2xl scale-[1.02]' : 'bg-white border-zinc-100 hover:border-black shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ticket.status === 'Open' ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                    {ticket.status}
                                </span>
                                <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-black text-sm uppercase italic tracking-tight mb-2 truncate">{ticket.subject}</h3>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedTicket?._id === ticket._id ? 'text-zinc-400' : 'text-zinc-300'}`}>FROM: {ticket.user?.firstName} {ticket.user?.lastName}</p>
                        </div>
                    ))}

                    {viewMode === 'chat' && activeChats.map(chat => (
                        <div key={chat._id} onClick={() => handleSelectChat(chat)} className={`p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${selectedChat?._id === chat._id ? 'bg-black text-white border-black shadow-2xl scale-[1.02]' : 'bg-white border-zinc-100 hover:border-black shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${chat.user.chatEnabledUntil && new Date(chat.user.chatEnabledUntil).getTime() > currentTime ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedChat?._id === chat._id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {chat.user.chatEnabledUntil && new Date(chat.user.chatEnabledUntil).getTime() > currentTime ? 'ACTIVE' : 'LOCKED'}
                                    </span>
                                </div>
                                {chat.unreadCount > 0 && <span className="p-1 px-2.5 bg-red-500 text-white rounded-full text-[9px] font-black">! {chat.unreadCount}</span>}
                            </div>
                            <h3 className="font-black text-sm uppercase italic tracking-tight mb-1">{chat.user.firstName} {chat.user.lastName}</h3>
                            <p className={`text-[10px] font-medium italic truncate ${selectedChat?._id === chat._id ? 'text-zinc-400' : 'text-zinc-500'}`}>"{chat.lastMessage}"</p>
                        </div>
                    ))}

                    {viewMode === 'contacts' && contacts.map(contact => (
                        <div key={contact._id} onClick={() => setSelectedContact(contact)} className={`p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${selectedContact?._id === contact._id ? 'bg-black text-white border-black shadow-2xl scale-[1.02]' : 'bg-white border-zinc-100 hover:border-black shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[9px] font-black uppercase tracking-widest">ENQUIRY</span>
                                <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{new Date(contact.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-black text-sm uppercase italic tracking-tight mb-2 truncate">{contact.subject || 'GENERAL INQUIRY'}</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SENDER: {contact.name}</p>
                        </div>
                    ))}
                </div>

                {/* DETAIL COLUMN */}
                <div className="lg:col-span-8 bg-white border border-zinc-100 rounded-[3.5rem] shadow-2xl overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {selectedTicket && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-12 h-full flex flex-col">
                                <div className="mb-10">
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{selectedTicket.subject}</h2>
                                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 italic text-zinc-600 text-sm leading-relaxed shadow-inner">
                                        "{selectedTicket.message}"
                                    </div>
                                </div>
                                <form onSubmit={handleUpdateTicket} className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Protocol Status</label>
                                            <select className="w-full bg-zinc-100 p-4 rounded-2xl border-none outline-none font-black text-[10px] uppercase tracking-widest focus:ring-2 ring-black transition"
                                                value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
                                                <option value="Open">OPEN PROTOCOL</option>
                                                <option value="In Progress">IN TRANSIT</option>
                                                <option value="Resolved">RESOLVED</option>
                                                <option value="Closed">ARCHIVED</option>
                                            </select>
                                        </div>
                                        <button disabled={submitting} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-95 shadow-xl transition-all">
                                            {submitting ? 'TRANSMITTING...' : 'SAVE ENCRYPTED UPDATE'}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Official Response</label>
                                        <textarea className="w-full h-32 bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 outline-none focus:border-black text-xs font-medium resize-none transition"
                                            placeholder="Initialising official response protocol..."
                                            value={reply} onChange={e => setReply(e.target.value)} />
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {selectedChat && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                                <div className="p-8 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-black text-white flex items-center justify-center font-black rounded-2xl italic text-xl">
                                            {selectedChat.user.firstName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-black uppercase italic tracking-tight">{selectedChat.user.firstName} {selectedChat.user.lastName}</h3>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedChat.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="px-5 py-2 bg-black text-white rounded-full text-[9px] font-black tracking-widest flex items-center gap-3">
                                            <Zap size={12} className="text-orange-400" /> SECURE CHANNEL
                                        </div>
                                    </div>
                                </div>
                                <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto space-y-6 custom-scrollbar bg-white">
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] p-6 rounded-[2rem] text-[13px] font-medium leading-relaxed italic ${msg.isAdmin ? 'bg-zinc-950 text-white rounded-tr-none shadow-xl' : 'bg-zinc-50 text-zinc-900 border border-zinc-100 rounded-tl-none'}`}>
                                                {msg.message}
                                                <p className={`text-[8px] font-black uppercase mt-3 opacity-30 ${msg.isAdmin ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-8 border-t border-zinc-100 bg-zinc-50/10">
                                    <form onSubmit={handleSendChat} className="flex gap-4">
                                        <input className="flex-1 bg-white p-5 rounded-2xl border border-zinc-100 outline-none focus:border-black text-xs font-black uppercase tracking-widest transition-all shadow-inner"
                                            placeholder="Transmit message to secure channel..."
                                            value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                                        <button className="px-10 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl">
                                            DISPATCH
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {!selectedTicket && !selectedChat && !selectedContact && (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 filter grayscale">
                                <ShieldAlert size={64} />
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] italic">Awaiting Operator selection</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
