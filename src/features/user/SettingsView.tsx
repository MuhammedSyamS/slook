'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { 
    User, Package, MapPin, Heart, Settings, 
    LogOut, ChevronRight, ShieldCheck, Bell, 
    CreditCard, ArrowLeft, Camera, Edit3, ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Reveal from '@/components/shared/Reveal';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';

export const SettingsView = () => {
    const { user, logout, refreshUser, wishlist } = useAuthStore();
    const { items: cartItems } = useCartStore();
    const router = useRouter();
    const { success, error: toastError } = useToast();
    
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await api.put('/users/profile', formData);
            await refreshUser();
            success("Identity Updated Successfully");
        } catch (err: any) {
            toastError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user) return null;

    const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Store Guest';

    return (
        <div className="bg-white min-h-screen pb-40 px-6 pt-40 md:pt-48 selection:bg-black selection:text-white text-black">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 bg-zinc-50 px-4 py-2 rounded-full w-fit group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
                </button>

                <div className="mb-12">
                    <h1 className="!text-xl md:!text-5xl font-black uppercase tracking-tighter leading-none">
                        Account <span className="text-red-600">Settings</span>
                    </h1>
                    <div className="h-0.5 w-10 bg-black mt-2 md:mt-4"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    <div className="lg:col-span-4 space-y-12">
                        <div className="bg-zinc-50 rounded-[3rem] p-10 border border-zinc-100 space-y-10">
                            <div className="relative group w-32 h-32 mx-auto">
                                <div className="w-full h-full rounded-full border-4 border-white shadow-2xl overflow-hidden bg-zinc-100 flex items-center justify-center">
                                    {user.avatar ? (
                                        <img src={resolveMediaURL(user.avatar)} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <User size={48} className="text-zinc-200" />
                                    )}
                                </div>
                                <div className="absolute bottom-1 right-1 bg-black text-white p-2.5 rounded-full border-2 border-white">
                                    <Camera size={14} />
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight">{displayName}</h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user.email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-10 border-t border-zinc-200/50">
                                <div className="text-center space-y-1">
                                    <p className="text-2xl font-black">{wishlist.length}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Wishlist</p>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-2xl font-black">{cartItems.length}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300">In Bag</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-4 py-6 border-2 border-zinc-50 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-red-500 hover:border-red-500 transition-all active:scale-95"
                        >
                            <LogOut size={16} /> Log Out
                        </button>
                    </div>

                    <div className="lg:col-span-8 space-y-20">
                        <section className="space-y-10">
                            <div className="flex items-center gap-4">
                                <Edit3 size={20} />
                                <h3 className="text-2xl font-black uppercase tracking-tight">Profile Details</h3>
                            </div>
                            
                            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">First Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.firstName}
                                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                                        className="w-full border-b border-zinc-100 py-4 outline-none focus:border-black font-black text-sm uppercase" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.lastName}
                                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                                        className="w-full border-b border-zinc-100 py-4 outline-none focus:border-black font-black text-sm uppercase" 
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        disabled
                                        className="w-full border-b border-zinc-100 py-4 outline-none text-zinc-300 font-black text-sm uppercase" 
                                    />
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <button 
                                        disabled={isUpdating}
                                        className="bg-black text-white px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-zinc-800 transition-all active:scale-95"
                                    >
                                        {isUpdating ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="space-y-10">
                            <div className="flex items-center gap-4">
                                <ShieldCheck size={20} />
                                <h3 className="text-2xl font-black uppercase tracking-tight">Account Settings</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'Saved Addresses', icon: <MapPin />, desc: 'Manage your destinations', path: '/account/addresses' },
                                    { label: 'Notifications', icon: <Bell />, desc: 'Configure alerts', path: '/account/notifications' },
                                    { label: 'Payments', icon: <CreditCard />, desc: 'Manage saved methods', path: '/account/payments' },
                                    { label: 'Security', icon: <ShieldCheck />, desc: 'Password & Privacy', path: '/account/security' }
                                ].map((node, i) => (
                                    <div key={i} 
                                        onClick={() => node.path && router.push(node.path)}
                                        className="group p-8 bg-zinc-50 rounded-[2.5rem] border border-transparent hover:border-black hover:bg-white transition-all cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm text-zinc-400 group-hover:text-black transition-colors">{node.icon}</div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">{node.label}</p>
                                                <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">{node.desc}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-zinc-200 group-hover:text-black transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
