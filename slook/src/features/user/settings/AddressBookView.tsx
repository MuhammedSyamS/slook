'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { client as api } from '@/lib/api/client';
import { MapPin, Plus, Trash2, ArrowLeft, Home, Building, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AddressBookView = () => {
    const { user, setUser } = useAuthStore();
    const router = useRouter();
    const { addToast } = useToast();
    const [addresses, setAddresses] = useState<any[]>(user?.addresses || []);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        label: 'Home',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        alternatePhone: '',
        isDefault: false
    });

    useEffect(() => {
        if (user?.addresses) setAddresses(user.addresses);
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            addToast("Session expired. Please Login again.", "error");
            return;
        }

        try {
            const { data } = await api.post('/users/addresses', formData);
            setAddresses(data);
            setUser({ ...user, addresses: data });
            setShowForm(false);
            setFormData({ label: 'Home', street: '', city: '', state: '', zip: '', phone: '', alternatePhone: '', isDefault: false });
            addToast("Address Artifact Synchronized", "success");
        } catch (err: any) {
            addToast(err.response?.data?.message || err.message || "Failed to add address", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Purge this address from manifest?")) return;
        try {
            const { data } = await api.delete(`/users/addresses/${id}`);
            setAddresses(data);
            setUser({ ...user, addresses: data });
            addToast("Address Removed", "success");
        } catch (err) {
            addToast("Failed to delete", "error");
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white page-top pt-40 lg:pt-48 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">
                <button onClick={() => router.push('/account')} className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-[10px] hover:text-black mb-8 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </button>

                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-black leading-none italic">Address <span className="text-zinc-300">Book</span></h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">Manage Shipping Destinations</p>
                    </div>
                    <button 
                        onClick={() => setShowForm(!showForm)} 
                        className="bg-black text-white px-8 py-4 rounded-full font-black uppercase text-[10px] flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
                    >
                        {showForm ? <X size={16} /> : <Plus size={16} />} 
                        {showForm ? "Cancel" : "Add Protocol"}
                    </button>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-12"
                        >
                            <div className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-1">
                                        <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">Target Label</label>
                                        <input required placeholder="e.g. Home, Studio" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">Protocol Phone</label>
                                        <input required placeholder="+91 00000 00000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">Street Address</label>
                                        <input required placeholder="House No, Building, Area" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">City Hub</label>
                                        <input required placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">State Protocol</label>
                                        <input required placeholder="State" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">ZIP Manifest</label>
                                        <input required placeholder="000 000" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">Backup Comms</label>
                                        <input placeholder="Alternate Phone (Optional)" value={formData.alternatePhone} onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                                    </div>
                                    <button type="submit" className="md:col-span-2 bg-black text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition shadow-xl active:scale-[0.98]">Authorize Destination</button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {addresses.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-zinc-100 rounded-[3rem] bg-zinc-50/50">
                        <MapPin size={48} className="mx-auto text-zinc-200 mb-6" strokeWidth={1} />
                        <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">No Active Shipping Nodes Found</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        {addresses.map((addr, idx) => (
                            <motion.div 
                                key={addr._id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-10 border border-zinc-100 rounded-[2.5rem] relative hover:shadow-2xl hover:border-black/5 transition-all group bg-white overflow-hidden shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <span className="bg-zinc-900 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                        {addr.label.toLowerCase() === 'home' ? <Home size={10}/> : (addr.label.toLowerCase() === 'office' ? <Building size={10}/> : <Package size={10}/>)}
                                        {addr.label}
                                    </span>
                                    <button onClick={() => handleDelete(addr._id)} className="text-zinc-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full border-none bg-transparent cursor-pointer group-hover:scale-110"><Trash2 size={16} /></button>
                                </div>
                                <div className="relative z-10">
                                    <p className="font-black text-2xl mb-2 text-black leading-tight tracking-tight">{addr.street}</p>
                                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">{addr.city}, {addr.state} <span className="text-black ml-1">{addr.zip}</span></p>
                                    <div className="mt-8 pt-8 border-t border-zinc-50 flex items-center justify-between">
                                        <p className="text-zinc-500 text-[9px] font-mono tracking-tighter flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
                                            {addr.phone}
                                        </p>
                                        {addr.alternatePhone && <span className="text-zinc-300 text-[9px] font-mono">| {addr.alternatePhone}</span>}
                                    </div>
                                </div>

                                {/* Subtle Icon Flair */}
                                <div className="absolute -bottom-8 -right-8 opacity-[0.03] scale-[2] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                   <MapPin size={100} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
