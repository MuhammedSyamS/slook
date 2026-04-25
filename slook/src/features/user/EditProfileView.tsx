'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import { User, Mail, Save, ArrowLeft, Camera, ChevronLeft } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const EditProfileView = () => {
    const router = useRouter();
    const { user, setUser, refreshUser } = useAuthStore();
    const { success, error: toastError } = useToast();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });

    const [loading, setLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
            };

            const { data } = await api.put('/users/profile', updateData);
            setUser({ ...data, token: user?.token });
            success("Profile identity updated successfully!");
        } catch (err: any) {
            toastError(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        const fd = new FormData();
        fd.append('file', file);

        try {
            const { data } = await api.post('/users/profile/avatar', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await refreshUser();
            success("Profile picture updated!");
        } catch (err: any) {
            toastError(err.response?.data?.message || "Avatar update failed");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white pt-40 lg:pt-48 pb-20 px-6 font-sans">
            <div className="max-w-xl mx-auto">
                <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 bg-zinc-50 px-4 py-2 rounded-full w-fit group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
                </button>

                <div className="mb-12">
                    <h1 className="!text-xl md:!text-5xl font-black uppercase tracking-tighter leading-none">
                        Edit <span className="text-red-600">Profile</span>
                    </h1>
                    <div className="h-0.5 w-10 bg-black mt-2 md:mt-4"></div>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-10">
                    <div 
                        className="relative group cursor-pointer"
                        //@ts-ignore
                        onClick={() => document.getElementById('avatar-edit-input')?.click()}
                    >
                        <div className="w-24 h-24 rounded-full border-4 border-zinc-50 shadow-lg overflow-hidden bg-zinc-100 flex items-center justify-center transition-transform group-hover:scale-105">
                            {user.avatar ? (
                                <img 
                                    src={resolveMediaURL(user.avatar)} 
                                    alt="Profile" 
                                    className={`w-full h-full object-cover ${(loading || isUploadingAvatar) ? 'opacity-50' : 'opacity-100'}`}
                                />
                            ) : (
                                <User size={40} className="text-zinc-400" />
                            )}
                            
                            {(loading || isUploadingAvatar) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg border-2 border-white">
                            <User size={12} />
                        </div>
                        
                        <input 
                            id="avatar-edit-input"
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <p className="text-[9px] font-bold uppercase text-zinc-400 mt-3 tracking-widest">Tap to change photo</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">First Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full bg-zinc-50 border border-transparent focus:border-black rounded-xl py-3 pl-12 pr-4 outline-none font-bold text-sm transition-all"
                                    placeholder="First Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-zinc-50 border border-transparent focus:border-black rounded-xl py-3 px-4 outline-none font-bold text-sm transition-all"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-zinc-50 border border-transparent focus:border-black rounded-xl py-3 px-4 outline-none font-bold text-sm transition-all"
                            placeholder="Phone Number"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full bg-zinc-100 text-zinc-400 border border-transparent rounded-xl py-3 pl-12 pr-4 outline-none font-bold text-sm cursor-not-allowed"
                            />
                        </div>
                        <p className="text-[9px] text-zinc-400 mt-2 uppercase font-bold tracking-wider">Contact support to change email.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 mt-8 shadow-xl"
                    >
                        {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </form>
            </div>
        </div>
    );
};
