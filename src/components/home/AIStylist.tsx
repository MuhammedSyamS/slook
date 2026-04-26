'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Sparkles, Loader2, ShoppingBag, User, ArrowRight, Minus, Maximize2, Zap, Layout, Heart, Command } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import Link from 'next/link';
import Image from 'next/image';
import Price from '@/components/shared/Price';
import { useToast } from '@/context/ToastContext';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

export const AIStylist = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<any[]>([
        { 
            role: 'ai', 
            content: "Welcome to the Elite Studio. I'm your SLOOK AI Stylist. How shall we refine your aesthetic today?",
            suggestions: ["Minimalist", "Quiet Luxury", "Avant-Garde", "Latest Drops"]
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { success } = useToast();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!isMinimized) scrollToBottom();
    }, [messages, loading, isMinimized]);

    const handleSend = async (textOverride?: string) => {
        const query = textOverride || input;
        if (!query.trim()) return;

        const userMsg = { role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await api.post('/ai/stylist', { query });
            setMessages(prev => [...prev, {
                role: 'ai',
                content: data.text,
                recommendations: data.recommendations
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: "System recalibration in progress. One moment, elite." 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* FLOATING TRIGGER */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                        <Bot className="relative z-10 w-6 h-6" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" 
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* CHAT INTERFACE */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            height: isMinimized ? '60px' : '500px'
                        }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        className="fixed bottom-6 right-6 w-[85vw] md:w-80 bg-white border border-zinc-100 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] flex flex-col z-[100] overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-white cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-black text-white rounded-2xl flex items-center justify-center shadow-inner">
                                    <Sparkles size={16} className="text-amber-400" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-900 leading-none">SLOOK AI</h2>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Zap size={8} className="text-green-500 fill-green-500" />
                                        <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Active Intelligence</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} 
                                    className="w-7 h-7 flex items-center justify-center hover:bg-zinc-50 rounded-xl transition-colors text-zinc-400"
                                >
                                    {isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                                    className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-xl transition-colors text-zinc-400 hover:text-white"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>

                        {/* MESSAGES */}
                        {!isMinimized && (
                            <>
                                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar scroll-smooth bg-gradient-to-b from-white to-zinc-50/30">
                                    {messages.map((msg, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={i} 
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[90%] space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                                <div className={`p-4 rounded-3xl text-[11px] leading-relaxed font-medium shadow-sm transition-all hover:shadow-md ${
                                                    msg.role === 'user' 
                                                        ? 'bg-zinc-900 text-white rounded-tr-none' 
                                                        : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none'
                                                }`}>
                                                    {msg.content}
                                                </div>

                                                {/* Suggestions */}
                                                {msg.suggestions && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {msg.suggestions.map((s: string, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleSend(s)}
                                                                className="px-3 py-1.5 bg-white hover:bg-zinc-900 hover:text-white border border-zinc-100 rounded-full text-[8px] font-black uppercase tracking-tight transition-all active:scale-95 shadow-sm"
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Recommendations */}
                                                {msg.recommendations && (
                                                    <div className="w-full flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
                                                        {msg.recommendations.map((prod: any) => (
                                                            <Link 
                                                                key={prod._id} 
                                                                href={`/product/${prod.slug}`}
                                                                className="flex-shrink-0 w-32 bg-white border border-zinc-100 rounded-[1.5rem] overflow-hidden hover:border-black transition-all shadow-sm hover:shadow-xl group/prod"
                                                            >
                                                                <div className="aspect-square relative bg-zinc-50 overflow-hidden">
                                                                    <Image src={resolveMediaURL(prod.images?.[0]) || "/placeholder.jpg"} fill alt="" className="object-cover group-hover/prod:scale-110 transition-transform duration-700" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/prod:bg-black/5 transition-colors" />
                                                                </div>
                                                                <div className="p-3">
                                                                    <p className="text-[8px] font-black uppercase truncate text-zinc-900 tracking-tighter">{prod.name}</p>
                                                                    <Price amount={prod.price} className="text-[10px] font-bold text-zinc-400" />
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-zinc-100 p-3 rounded-2xl flex items-center gap-2 shadow-sm">
                                                <Loader2 size={12} className="animate-spin text-zinc-400" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Curating...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* INPUT */}
                                <div className="p-5 bg-white">
                                    <form 
                                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                        className="relative flex items-center gap-2"
                                    >
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Consult the studio..."
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3.5 pl-5 pr-12 text-[11px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-300 focus:bg-white transition-all shadow-inner"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300">
                                                <Command size={14} />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || loading}
                                            className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all shadow-lg group"
                                        >
                                            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </form>
                                    <p className="text-[7px] text-center text-zinc-300 mt-3 font-bold uppercase tracking-[0.3em]">Proprietary SLOOK Intelligence</p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIStylist;
