'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { Bell, ArrowLeft, Package, Tag, CheckCheck, Mail, Sparkles, Info, Truck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationsView = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'all') return notifications;
        if (activeTab === 'orders') return notifications.filter(n => n.type === 'order' || n.title.toLowerCase().includes('order'));
        if (activeTab === 'offers') return notifications.filter(n => n.type === 'promo' || n.title.toLowerCase().includes('offer') || n.title.toLowerCase().includes('drop'));
        return notifications;
    }, [notifications, activeTab]);

    const fetchNotifs = async () => {
        try {
            const { data } = await api.get('/users/notifications');
            setNotifications(data);
        } catch (err) {
            console.error("Fetch Notifs Error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotifs();
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/users/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Error marking read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/users/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Error marking all read", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pt-32 md:pt-40 lg:pt-48 pb-20 font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">

                {/* Header Card */}
                <div className="relative mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10 p-8 rounded-[3rem] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden"
                    >
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/account')}
                                className="group flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-wider hover:text-black transition-all mb-2"
                            >
                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 group-hover:bg-black group-hover:text-white transition-all">
                                    <ArrowLeft size={12} />
                                </div>
                                Account
                            </button>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-black flex items-center gap-4">
                                Inbox
                                {unreadCount > 0 && (
                                    <span className="inline-flex items-center px-4 py-1.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-200 animate-pulse uppercase tracking-widest ml-4">
                                        {unreadCount} NEW
                                    </span>
                                )}
                            </h1>
                            <p className="text-[11px] md:text-sm text-zinc-400 font-bold uppercase tracking-widest">
                                Alerts for Drops, Orders, and Collections
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="bg-white border-2 border-zinc-100 text-black px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:border-black transition-all rounded-2xl flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <CheckCheck size={16} /> Mark All Read
                                </button>
                            )}
                            <button
                                onClick={() => {}} // Push notification logic simplified for now
                                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 rounded-2xl w-full sm:w-auto ${isSubscribed ? 'bg-zinc-50 text-emerald-600 border border-emerald-100' : 'bg-black text-white hover:bg-zinc-800'}`}
                            >
                                {isSubscribed ? <CheckCheck size={16} /> : <Bell size={16} />} 
                                {isSubscribed ? 'Alerts Active' : 'Get Updates'}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-3 mb-10 bg-zinc-100/50 p-2 rounded-[2rem] border border-zinc-200/50 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'All Activity', icon: Mail },
                        { id: 'orders', label: 'Order Updates', icon: Package },
                        { id: 'offers', label: 'Store Drops', icon: Sparkles },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-black'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? "text-blue-600" : ""} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-white rounded-[2rem] shadow-sm animate-pulse border border-zinc-100" />
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-32 rounded-[3.5rem] bg-white border border-zinc-100 shadow-sm text-center px-10"
                    >
                        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6 relative">
                            <Bell size={40} className="text-zinc-100" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-black">Inbox Clear</h3>
                        <p className="text-zinc-400 text-xs mt-3 uppercase tracking-widest leading-loose max-w-[280px] mx-auto">
                            We'll drop alerts here whenever collections drop or order status changes.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.map((notif, idx) => (
                                <motion.div
                                    layout
                                    key={notif._id || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => {
                                        if (!notif.isRead) markAsRead(notif._id);
                                        let targetUrl = notif.data?.url || notif.data?.link;
                                        if (targetUrl && targetUrl.includes('/account/orders/')) {
                                          targetUrl = targetUrl.replace('/account/orders/', '/order/');
                                        }
                                        if (targetUrl) router.push(targetUrl);
                                        else if (notif.type === 'order') router.push('/orders');
                                    }}
                                    className={`group relative p-6 md:p-8 rounded-[2.5rem] transition-all duration-500 cursor-pointer border ${!notif.isRead ? 'bg-white border-blue-100 shadow-2xl shadow-blue-500/5 hover:-translate-y-1' : 'bg-white/40 border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <div className="flex gap-6 md:gap-10 items-start">
                                        <div className="shrink-0">
                                            {notif.data?.image ? (
                                                <div className="w-16 h-20 md:w-20 md:h-24 rounded-2xl overflow-hidden border border-zinc-100 group-hover:scale-105 transition-all">
                                                    <img src={notif.data.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] flex items-center justify-center border transition-all group-hover:scale-110 ${notif.type === 'order' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-zinc-50 border-zinc-100 text-zinc-500'}`}>
                                                    {notif.type === 'order' ? <Package size={24} /> : <Info size={24} />}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                                <h4 className={`text-xl font-black uppercase tracking-tight truncate ${!notif.isRead ? 'text-black' : 'text-zinc-400'}`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full whitespace-nowrap border border-zinc-100">
                                                    {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>

                                            <p className={`text-[13px] leading-relaxed mb-6 font-medium ${!notif.isRead ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                {notif.message}
                                            </p>

                                            <div className="flex items-center gap-4">
                                                {notif.type === 'order' && (
                                                    <button 
                                                        onClick={() => router.push('/orders')}
                                                        className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg"
                                                    >
                                                        <Truck size={14} /> Track Order
                                                    </button>
                                                )}
                                                {notif.data?.url && (
                                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-black transition-all">
                                                        Explore Now <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};
