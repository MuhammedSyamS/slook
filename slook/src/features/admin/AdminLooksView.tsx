'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    Check, X, Trash2, Camera, User, Clock, 
    CheckCircle2, XCircle, Pencil, RefreshCw, 
    ChevronRight, Eye, MoreHorizontal, Heart, Info, Package
} from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export const AdminLooksView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [looks, setLooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [editingLook, setEditingLook] = useState<any>(null);

    const fetchLooks = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const { data } = await api.get('/looks/admin');
            setLooks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            addToast("Failed to fetch community intelligence", "error");
        } finally {
            setLoading(false);
        }
    }, [user?.token, addToast]);

    useEffect(() => {
        fetchLooks();
    }, [fetchLooks]);

    const handleStatusUpdate = async (lookId: string, newStatus: string) => {
        try {
            await api.patch(`/looks/${lookId}/status`, { status: newStatus });
            addToast(`Protocol Updated: ${newStatus}`, "success");
            setLooks(prev => prev.map(l => l._id === lookId ? { ...l, status: newStatus } : l));
        } catch (err) {
            addToast("Communication failed", "error");
        }
    };

    const handleDelete = async (lookId: string) => {
        if (!window.confirm("Terminate this visual asset permanently?")) return;
        try {
            await api.delete(`/looks/${lookId}`);
            addToast("Asset Purged", "success");
            setLooks(prev => prev.filter(l => l._id !== lookId));
        } catch (err) {
            addToast("Purge failed", "error");
        }
    };

    const handleEdit = async () => {
        if (!editingLook) return;
        try {
            await api.put(`/looks/${editingLook._id}`, { caption: editingLook.caption });
            addToast("Metadata Synchronised", "success");
            setLooks(prev => prev.map(l => l._id === editingLook._id ? { ...l, caption: editingLook.caption } : l));
            setEditingLook(null);
        } catch (err) {
            addToast("Sync failed", "error");
        }
    };

    const filteredLooks = looks.filter(l => filter === 'all' || l.status === filter);

    if (loading && looks.length === 0) return (
        <div className="h-[60vh] flex flex-col items-center justify-center font-black uppercase tracking-[0.3em] text-[10px] text-zinc-400">
            <RefreshCw className="animate-spin mb-4" size={24} /> SCANNING COMMUNITY LOOKBOOK...
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 font-sans pb-20">
            <AnimatePresence>
                {editingLook && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl bg-black/60"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-5xl overflow-hidden border border-white/20"
                        >
                            <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[700px]">
                                {/* PREVIEW PANEL */}
                                <div className="w-full md:w-3/5 relative bg-zinc-950 aspect-square md:aspect-auto group overflow-hidden">
                                    <Image 
                                        src={resolveMediaURL(editingLook.image || (looks.find(l => l._id === editingLook._id)?.image))} 
                                        fill
                                        className="object-contain" 
                                        alt="Preview"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-12">
                                        <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50">Studio Intelligence</p>
                                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Visual Protocol <span className="text-red-500">v4.0</span></h3>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 font-mono">HASH: {editingLook._id}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* EDITING PANEL */}
                                <div className="flex-1 p-8 md:p-14 flex flex-col justify-between bg-white overflow-y-auto">
                                    <div>
                                        <div className="flex justify-between items-center mb-12">
                                            <div>
                                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Metadata <span className="text-zinc-300">Editor</span></h2>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-3">Synthesising Community Signals</p>
                                            </div>
                                            <button 
                                                onClick={() => setEditingLook(null)} 
                                                className="w-12 h-12 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all active:scale-90"
                                            >
                                                <X size={20} className="text-zinc-400" />
                                            </button>
                                        </div>

                                        <div className="space-y-10">
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 block group-focus-within:text-black transition-colors">Visual Storytelling / Caption</label>
                                                <textarea 
                                                    autoFocus
                                                    value={editingLook.caption}
                                                    onChange={(e) => setEditingLook({...editingLook, caption: e.target.value})}
                                                    className="w-full bg-zinc-50 border-2 border-zinc-50 rounded-[2rem] p-8 text-sm font-medium outline-none focus:border-black focus:bg-white transition-all min-h-[220px] resize-none shadow-inner text-zinc-800 leading-relaxed"
                                                    placeholder="Inject creative metadata here..."
                                                />
                                                <div className="flex justify-between mt-4">
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <Info size={12} className="text-zinc-300" /> Public Broadcast Protocol
                                                    </p>
                                                    <p className="text-[9px] text-zinc-300 font-mono italic">{editingLook.caption?.length || 0} CHR</p>
                                                </div>
                                            </div>

                                            {/* TAGGED PRODUCTS METADATA */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Tagged Artifacts</label>
                                                    <span className="text-[9px] font-black bg-zinc-100 px-3 py-1 rounded-full">{editingLook.products?.length || 0} ITEMS</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {editingLook.products?.map((p: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-2xl border border-transparent hover:border-zinc-200 transition-all group">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-zinc-100 flex-shrink-0">
                                                                <img src={resolveMediaURL(p.image)} className="w-full h-full object-cover" alt="" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[11px] font-black uppercase truncate">{p.name}</p>
                                                                <p className="text-[10px] font-bold text-zinc-400 tracking-tight italic">₹{p.price}</p>
                                                            </div>
                                                            <ChevronRight size={14} className="text-zinc-200 group-hover:text-black transition-colors" />
                                                        </div>
                                                    ))}
                                                    {(!editingLook.products || editingLook.products.length === 0) && (
                                                        <div className="py-8 text-center border-2 border-dashed border-zinc-100 rounded-[2rem]">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 italic">No products tagged</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* PROTOCOL OVERRIDE (Status) */}
                                            <div className="pt-6 border-t border-zinc-50">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 block">Visual Status Protocol</label>
                                                <div className="flex gap-4">
                                                    {['approved', 'pending', 'rejected'].map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleStatusUpdate(editingLook._id, s as any)}
                                                            className={`flex-1 py-4 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                                                                editingLook.status === s 
                                                                ? (s === 'approved' ? 'bg-emerald-600 text-white shadow-lg' : s === 'rejected' ? 'bg-red-600 text-white shadow-lg' : 'bg-black text-white shadow-lg')
                                                                : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                                                            }`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 pt-12">
                                        <button 
                                            onClick={handleEdit}
                                            className="w-full py-6 bg-black text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.5em] hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 group"
                                        >
                                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />}
                                            Commit Changes
                                        </button>
                                        <button 
                                            onClick={() => setEditingLook(null)}
                                            className="w-full py-6 text-zinc-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] hover:text-black transition-all"
                                        >
                                            Discard Buffer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER SYSTEM */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-16 px-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-1px bg-black hidden md:block"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Content Moderation Matrix</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black leading-[0.8]">
                        Community <br />
                        <span className="text-zinc-200 outline-text">Gallery</span>
                    </h1>
                    <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Signals: {looks.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Awaiting: {looks.filter(l => l.status === 'pending').length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="flex bg-zinc-100/80 backdrop-blur-md p-1.5 rounded-[2rem] border border-zinc-200 shadow-inner w-full md:w-auto">
                        {['all', 'pending', 'approved', 'rejected'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 md:flex-none px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${filter === f ? 'bg-black text-white shadow-2xl scale-[1.02]' : 'text-zinc-500 hover:text-black'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={fetchLooks}
                        className="w-full md:w-auto px-6 py-4 bg-white border border-zinc-200 text-black rounded-[2rem] hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* GRID ARCHITECTURE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                <AnimatePresence mode='popLayout'>
                    {filteredLooks.map((look, index) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05, duration: 0.6 }}
                            key={look._id}
                            className="bg-white rounded-[3rem] overflow-hidden border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-700 group relative"
                        >
                            {/* IMAGE PORTAL */}
                            <div className="aspect-[4/5] relative overflow-hidden m-3 rounded-[2.5rem] cursor-pointer" onClick={() => setEditingLook(look)}>
                                <Image 
                                    src={resolveMediaURL(look.image)} 
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out" 
                                    alt="Community Look"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                                
                                {/* STATUS BADGE */}
                                <div className="absolute top-6 left-6 z-10">
                                    <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-xl shadow-2xl border border-white/20 flex items-center gap-2 ${
                                        look.status === 'approved' ? 'bg-emerald-500/90 text-white' :
                                        look.status === 'rejected' ? 'bg-red-500/90 text-white' :
                                        'bg-amber-500/90 text-white animate-pulse'
                                    }`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                        {look.status}
                                    </div>
                                </div>

                                {/* PRODUCT COUNT INDICATOR */}
                                {look.products?.length > 0 && (
                                    <div className="absolute top-6 right-6 z-10">
                                        <div className="px-4 py-2 bg-black/80 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                                            <Package size={10} />
                                            {look.products.length}
                                        </div>
                                    </div>
                                )}

                                {/* HOVER OVERLAY */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                                        <Eye size={20} className="text-black" />
                                    </div>
                                </div>
                            </div>

                            {/* INFORMATION PANEL */}
                            <div className="p-8 pt-4 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-zinc-50 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                                        <div className="absolute inset-0 bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-md group-hover:-translate-y-1 transition-transform duration-500">
                                            {look.user?.avatar ? (
                                                <Image 
                                                    src={resolveMediaURL(look.user.avatar)} 
                                                    fill
                                                    className="object-cover" 
                                                    alt="User"
                                                    sizes="56px"
                                                />
                                            ) : <div className="w-full h-full flex items-center justify-center bg-zinc-50"><User size={24} className="text-zinc-200" /></div>}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-black uppercase tracking-tight truncate group-hover:text-red-600 transition-colors">
                                            {look.user?.firstName || 'Anonymous'} {look.user?.lastName || 'Style'}
                                        </p>
                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] truncate mt-0.5">{look.user?.email || 'unverified@signal.com'}</p>
                                    </div>
                                </div>

                                <div className="relative group/caption">
                                    <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-zinc-100 group-hover/caption:bg-black transition-colors"></div>
                                    <p className="text-[12px] text-zinc-500 font-medium leading-relaxed line-clamp-3 italic pl-4">
                                        &ldquo;{look.caption || 'No metadata provided for this visual asset.'}&rdquo;
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Timestamp</span>
                                        <span className="text-[10px] font-bold text-zinc-900 mt-1">{new Date(look.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Engagement</span>
                                        <div className="flex items-center gap-2 text-black mt-1">
                                            <Heart size={12} className="fill-red-500 text-red-500" />
                                            <span className="text-[11px] font-black">{look.likes?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* HIGH-FIDELITY ACTIONS */}
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-50">
                                    {look.status !== 'approved' && (
                                        <button
                                            onClick={() => handleStatusUpdate(look._id, 'approved')}
                                            className="flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-[1.2rem] hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                                        >
                                            APPROVE
                                        </button>
                                    )}
                                    {look.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleStatusUpdate(look._id, 'rejected')}
                                            className="flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-[1.2rem] hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                                        >
                                            REJECT
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingLook(look)}
                                        className="col-span-1 flex items-center justify-center gap-2 py-4 bg-zinc-50 text-zinc-500 rounded-[1.2rem] hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                                    >
                                        EDIT
                                    </button>
                                    <button
                                        onClick={() => handleDelete(look._id)}
                                        className="col-span-1 flex items-center justify-center gap-2 py-4 bg-zinc-50 text-zinc-300 rounded-[1.2rem] hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                                    >
                                        DELETE
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredLooks.length === 0 && (
                     <div className="col-span-full py-40 text-center flex flex-col items-center justify-center space-y-6">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center">
                            <Camera size={32} className="text-zinc-200" />
                        </div>
                        <div>
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-300">No signals detected</p>
                            <p className="text-[10px] text-zinc-400 mt-2">Adjust your filters to scan different frequencies</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
