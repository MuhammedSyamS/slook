'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { MessageCircle, Send, X, Loader2, User, ShieldCheck } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
    _id: string;
    tempId?: string;
    user: string;
    sender: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
    isOptimistic?: boolean;
}

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
    const { user, setUser } = useAuthStore();
    const { addToast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [enabledUntil, setEnabledUntil] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const socketUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '');

    useEffect(() => {
        if (user?._id) {
            setupSocket();
        }
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [user?._id]);

    // REACTIVE TIMER: Watch the global user object for chat authorization
    useEffect(() => {
        if (user?.chatEnabledUntil) {
            const expiry = new Date(user.chatEnabledUntil).getTime();
            if (expiry > Date.now()) {
                startTimer(expiry);
            } else {
                setTimeLeft(0);
                setEnabledUntil(null);
            }
        } else {
            setTimeLeft(0);
            setEnabledUntil(null);
        }
    }, [user?.chatEnabledUntil]);

    useEffect(() => {
        if (isOpen && user?._id && timeLeft > 0) {
            fetchHistory();
        }
    }, [isOpen, user?._id, timeLeft]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startTimer = (expiry: number) => {
        setEnabledUntil(expiry);
        if (timerRef.current) clearInterval(timerRef.current);
        
        const update = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expiry - now) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) {
                if (timerRef.current) clearInterval(timerRef.current);
                setEnabledUntil(null);
                if (user?.chatEnabledUntil) {
                    setUser({ ...user, chatEnabledUntil: null });
                }
            }
        };

        update();
        timerRef.current = setInterval(update, 1000);
    };

    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/chat/history/${user._id}`);
            setMessages(data);
            await api.put(`/chat/read/${user._id}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = () => {
        if (!user) return;
        socketRef.current = io(socketUrl);
        socketRef.current.emit('join-user-room', user._id);

        socketRef.current.on('receive-message', (msg: ChatMessage) => {
            setMessages(prev => {
                const isDuplicate = prev.some(m => m._id === msg._id || (m.tempId && m.tempId === msg.tempId));
                if (isDuplicate) return prev;
                return [...prev, msg];
            });
            if (isOpen) api.put(`/chat/read/${user._id}`);
        });

        socketRef.current.on('chat-error', (data: any) => {
            addToast(data.message, "error");
        });

        socketRef.current.on('user-typing', (data: any) => {
            if (data.isAdmin) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        });
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || timeLeft <= 0 || !socketRef.current) return;

        const tempId = Date.now().toString();
        const optimisticMsg: ChatMessage = {
            _id: tempId,
            tempId: tempId,
            user: user._id,
            sender: user._id,
            message: newMessage,
            isAdmin: false,
            createdAt: new Date().toISOString(),
            isOptimistic: true
        };

        setMessages(prev => [...prev, optimisticMsg]);

        const msgData = {
            userId: user._id,
            senderId: user._id,
            message: newMessage,
            isAdmin: false,
            tempId: tempId
        };

        socketRef.current.emit('send-message', msgData);
        setNewMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSendMessage(e);
        }
        if (timeLeft > 0 && socketRef.current && user) {
            socketRef.current.emit('typing', { userId: user._id, isAdmin: false });
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 max-w-[90vw] h-[550px] bg-white rounded-[2rem] shadow-2xl flex flex-col z-[100] border border-zinc-100 overflow-hidden animate-in slide-in-from-bottom-10">
            {/* HEADER */}
            <div className={`p-6 flex justify-between items-center text-white transition-colors duration-500 ${timeLeft > 0 ? 'bg-black' : 'bg-zinc-400'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                        <User size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold font-inter">Support Session</h3>
                        <p className="text-[10px] font-medium opacity-60 font-inter">
                            {timeLeft > 0 ? `Active: ${formatTime(timeLeft)} Left` : 'Session Locked'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div 
                ref={scrollRef}
                className="flex-grow p-6 overflow-y-auto bg-zinc-50 space-y-4 custom-scrollbar"
            >
                {timeLeft <= 0 ? (
                    <div className="text-center py-20 px-8">
                        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="text-zinc-300" size={40} />
                        </div>
                        <h4 className="text-sm font-bold mb-2 font-inter">Chat Restricted</h4>
                        <p className="text-[11px] font-medium text-zinc-400 leading-relaxed font-inter">
                            Submit a ticket below. Once an admin replies, a 5-minute live chat session will unlock here.
                        </p>
                        <button 
                            onClick={() => { onClose(); document.getElementById('still-need-help')?.scrollIntoView({ behavior: 'smooth' }); }}
                            className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] bg-black text-white px-6 py-3 rounded-full"
                        >
                            Submit Ticket
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Authenticating Session...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="text-zinc-300" size={30} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Connection Established!<br/>How can we help you?</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                                msg.isAdmin 
                                ? 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none' 
                                : 'bg-black text-white rounded-tr-none'
                            }`}>
                                {msg.message}
                                <div className={`text-[8px] mt-1 opacity-40 uppercase font-black ${msg.isAdmin ? 'text-zinc-400' : 'text-zinc-300'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {isTyping && timeLeft > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-zinc-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
                            <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* INPUT */}
            <div className={`p-6 bg-white border-t border-zinc-100 ${timeLeft <= 0 ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                <form onSubmit={handleSendMessage} className="relative group">
                    <textarea
                        rows={1}
                        placeholder={timeLeft > 0 ? "Type a message..." : "Session Expired"}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-6 pr-14 text-xs font-bold outline-none focus:border-black transition-all resize-none"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={timeLeft <= 0}
                    />
                    <button 
                        type="submit"
                        disabled={timeLeft <= 0}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 group-focus-within:bg-black border-none cursor-pointer"
                    >
                        <Send size={16} />
                    </button>
                </form>
                {timeLeft > 0 && <p className="text-[8px] font-black uppercase tracking-widest text-center mt-4 text-zinc-300">Session ends in {formatTime(timeLeft)}</p>}
            </div>
        </div>
    );
};

export default ChatWidget;
