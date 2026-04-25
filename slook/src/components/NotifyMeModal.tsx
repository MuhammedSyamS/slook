'use client';

import React, { useState } from 'react';
import { X, Bell, Loader2, CheckCircle2 } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';

interface NotifyMeModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    variant?: any;
}

const NotifyMeModal: React.FC<NotifyMeModalProps> = ({ isOpen, onClose, product, variant }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            await api.post(`/products/${product._id}/waitlist`, {
                email,
                variant: variant ? { size: variant.size, color: variant.color } : null
            });

            setSuccess(true);
            addToast('We will notify you once it is back!', 'success');
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setEmail('');
            }, 3000);
        } catch (err) {
            console.error(err);
            addToast('Failed to set notification', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
                    <X size={20} />
                </button>

                <div className="p-10">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
                            <Bell size={28} className="text-black" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Back in Stock Notification</h2>
                        <p className="text-sm md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            {product.name} {variant ? `(${variant.size} / ${variant.color})` : ''}
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <p className="text-sm md:text-xs text-zinc-500 font-medium leading-relaxed">
                                This item is currently out of stock. Enter your email below, and we'll send you an exclusive alert the moment it returns to our studio.
                            </p>
                            <div className="space-y-2">
                                <label className="text-sm md:text-[9px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@example.com"
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-4 text-sm md:text-xs font-bold outline-none focus:border-black transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-5 rounded-xl text-base md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-zinc-800"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Notify Me'}
                            </button>
                        </form>
                    ) : (
                        <div className="py-12 text-center animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-xl md:text-lg font-black uppercase tracking-tight mb-2">Request Saved</h3>
                            <p className="text-sm md:text-xs text-zinc-400 font-bold uppercase tracking-widest leading-loose">
                                You're on the list. Keep an eye on your inbox.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotifyMeModal;
