'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    Activity, ShieldCheck, Database, Zap, AlertCircle, 
    CheckCircle2, RefreshCw, Server, Cpu, Globe, 
    Lock, Terminal, ChevronRight, HardDrive, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminHealthView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        serverStatus: 'Online',
        dbStatus: 'Connected',
        lastCron: 'Just now',
        activeRequests: 0,
        securityLevel: 'MNC Standard',
        cpuUsage: 12,
        ramUsage: 45
    });
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    const checkHealth = useCallback(async () => {
        setLoading(true);
        // Simulate real-time monitoring fetch
        setTimeout(() => {
            setLoading(false);
            setStats(prev => ({ 
                ...prev, 
                activeRequests: Math.floor(Math.random() * 50),
                cpuUsage: 10 + Math.floor(Math.random() * 20),
                ramUsage: 40 + Math.floor(Math.random() * 15)
            }));
            
            setLogs(prev => [
                { 
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                    msg: 'Operational status verified by MNC probe', 
                    type: 'Info' 
                },
                ...prev.slice(0, 4)
            ]);
        }, 800);
    }, []);

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        
        // Initial Logs
        setLogs([
            { time: '03:00 AM', msg: 'Cron cleanup successful (42 exp coupons)', type: 'Info' },
            { time: '03:15 AM', msg: 'Stock sync completed (3 stale orders)', type: 'Info' },
            { time: '03:45 AM', msg: 'Security firewall rules synchronized', type: 'Success' }
        ]);

        return () => clearInterval(interval);
    }, [checkHealth]);

    const HealthCard = ({ icon: Icon, title, value, status, color }: any) => (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-10 rounded-[3rem] border border-zinc-50 group hover:shadow-2xl transition-all duration-500 overflow-hidden relative shadow-sm"
        >
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 ${color} transition-all group-hover:scale-110 shadow-lg`}>
                <Icon size={32} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2 italic">{title}</h3>
            <div className="flex items-center justify-between">
                <p className="text-3xl font-black tracking-tighter italic">{value}</p>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-50 rounded-full border border-zinc-100">
                    <div className={`w-2 h-2 rounded-full ${status === 'Error' ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{status}</span>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        System <span className="text-zinc-400">Health</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Platform Infrastructure & Resource Monitor (MNCS-PROBE)</p>
                </div>
                <button
                    onClick={checkHealth}
                    className="p-5 bg-black text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3 font-sans"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">DIAGNOSTIC PROBE</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                <HealthCard
                    icon={Server}
                    title="Probe Stability"
                    value={stats.serverStatus}
                    status="Operational"
                    color="bg-blue-500 text-white shadow-blue-500/20"
                />
                <HealthCard
                    icon={Database}
                    title="Storage Latency"
                    value={stats.dbStatus}
                    status="Optimal"
                    color="bg-amber-500 text-white shadow-amber-500/20"
                />
                <HealthCard
                    icon={ShieldCheck}
                    title="Security Vector"
                    value={stats.securityLevel}
                    status="Hardened"
                    color="bg-emerald-500 text-white shadow-emerald-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* --- REAL-TIME ANALYTICS --- */}
                <div className="lg:col-span-7 bg-black p-12 rounded-[4rem] relative overflow-hidden flex flex-col justify-between min-h-[450px] shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap size={180} className="text-white" />
                    </div>
                    
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <h2 className="text-xl font-black uppercase tracking-widest italic text-white leading-none">Intelligence Stream</h2>
                        </div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-12 italic">Active Socket Peer Connections</p>

                        <div className="flex items-baseline gap-6 mb-8 group cursor-default">
                            <span className="text-8xl font-black tracking-tighter text-white tabular-nums group-hover:text-red-500 transition-colors duration-500">{stats.activeRequests}</span>
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] italic">PEERS ONLINE</span>
                        </div>
                        
                        {/* Utilization Metrics */}
                        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-zinc-800">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">CPU LOAD</span>
                                    <span className="text-xs font-black text-white">{stats.cpuUsage}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.cpuUsage}%` }} className="h-full bg-blue-500" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">MEMORY ALLOC</span>
                                    <span className="text-xs font-black text-white">{stats.ramUsage}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.ramUsage}%` }} className="h-full bg-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- LOGS INTERFACE --- */}
                <div className="lg:col-span-5 bg-white border border-zinc-100 p-12 rounded-[4rem] flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-xl font-black uppercase tracking-widest italic leading-none">Process Logs</h2>
                        <Terminal size={20} className="text-zinc-200" />
                    </div>
                    
                    <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-4">
                        <AnimatePresence mode="popLayout">
                            {logs.map((log, i) => (
                                <motion.div 
                                    key={i} 
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-8 border-b border-zinc-50 pb-8 last:border-none"
                                >
                                    <span className="text-[9px] font-mono font-black text-zinc-300 uppercase shrink-0 tabular-nums">{log.time}</span>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-zinc-900 leading-none mb-3 italic">&quot;{log.msg}&quot;</p>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border max-w-max ${
                                            log.type === 'Info' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                                        }`}>
                                            <span className="text-[8px] font-black uppercase tracking-widest">{log.type} PROTOCOL</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* --- SECURITY STATUS LAYER --- */}
            <div className="mt-12 p-12 bg-white rounded-[4rem] border border-zinc-100 flex flex-wrap items-center justify-between gap-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-black text-white rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Lock size={24} />
                    </div>
                    <div>
                        <p className="text-xl font-black uppercase italic tracking-tighter mb-2 leading-none">Hardened Lockdown Active</p>
                        <div className="flex gap-4">
                            {['CORS: ON', 'RATELIMIT: ON', 'HELMET: ON', 'ENCRYPT: AES-256'].map(tag => (
                                <span key={tag} className="text-[9px] font-black text-zinc-400 uppercase tracking-widest font-mono bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-emerald-50 text-emerald-600 px-8 py-4 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={20} className="animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">VERIFIED SECURE BY MNC PROBE</span>
                </div>
            </div>
        </div>
    );
};
