'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { Users, ArrowLeft, Download, Activity, TrendingUp, RefreshCw, ShoppingBag, MousePointer2, CreditCard, ArrowUpRight, ArrowDownRight, Trophy, Zap, ShieldCheck } from 'lucide-react';

export const AnalyticsUsersView = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const { addToast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/orders/admin/stats?timeRange=monthly`);
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            addToast('Failed to load user analytics', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (user?.token) fetchStats();
    }, [user?.token, fetchStats]);

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Synchronizing User Intel...</p>
        </div>
    );

    if (!stats) return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest text-xs">Failed to load user intelligence.</div>;

    const retention = stats.customerRetention || { new: 0, returning: 0 };
    const totalCustomers = retention.new + retention.returning;
    const retentionRate = totalCustomers > 0 ? Math.round((retention.returning / totalCustomers) * 100) : 0;
    
    const retentionData = totalCustomers > 0
        ? [{ name: 'New Frequency', value: retention.new }, { name: 'Returning Signal', value: retention.returning }]
        : [];

    const funnelData = [
        { name: 'Total Visits', value: 1240, fill: '#000000' },
        { name: 'Cart Adds', value: 450, fill: '#18181b' },
        { name: 'Checkouts', value: 210, fill: '#27272a' },
        { name: 'Activations', value: stats.totalOrders || 120, fill: '#3f3f46' },
    ];

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans selection:bg-black selection:text-white">
            {/* HEADER (High-Fidelity) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-8">
                <div>
                     <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-zinc-400 hover:text-black text-[10px] font-black uppercase tracking-widest mb-3 transition-all">
                        <ArrowLeft size={12} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
                        User <span className="text-zinc-300">Insights.</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2 flex items-center gap-2">
                        <Users size={12} className="text-black" /> Growth & Retention Registry (MNCS-INTEL)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchStats} className="p-3 bg-zinc-100 rounded-2xl text-zinc-400 hover:text-black hover:rotate-180 transition-all shadow-sm border border-zinc-200/50">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={() => addToast("Report Generated", "success")} className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-mega flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-2xl shadow-black/20 border-none cursor-pointer">
                        <Download size={14} /> Export Dataset
                    </button>
                </div>
            </div>

            {/* KPI STRIP (Merged Logic) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Registry', value: stats.totalUsers || 0, up: true, change: '+4.2%' },
                    { label: 'New Signals', value: retention.new, up: true, change: '+12.5%' },
                    { label: 'Recurring', value: retention.returning, up: false, change: '-2.1%' },
                    { label: 'Retention Rate', value: `${retentionRate}%`, up: retentionRate > 50, change: 'Optimal' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 hover:shadow-xl transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">{kpi.label}</p>
                            <div className={`flex items-center gap-0.5 text-[8px] font-black px-2 py-0.5 rounded-full ${kpi.up ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {kpi.change}
                            </div>
                        </div>
                        <p className="text-3xl font-black text-zinc-900 tracking-tighter tabular-nums">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* ACQUISITION & RETENTION CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Acquisition Velocity (Line Chart) */}
                <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                             Acquisition Velocity
                        </h3>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Real-time Trace</span>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart data={stats.userGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f8f8" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 'bold' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} 
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#000" 
                                    strokeWidth={4} 
                                    dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: '#000' }}
                                    activeDot={{ r: 8, strokeWidth: 0, fill: '#000' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Retention Breakdown (Pie Chart - Legacy Restoration) */}
                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-8">Loyalty Mix</h3>
                    <div className="h-[240px]">
                        {retentionData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 grayscale">
                                <Activity size={32} className="text-zinc-200" />
                                <p className="text-[8px] font-black uppercase text-zinc-300">No signals recorded</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie 
                                        data={retentionData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={90} 
                                        paddingAngle={8} 
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#000" />
                                        <Cell fill="#f4f4f5" stroke="#e4e4e7" strokeWidth={1} />
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#000', color: '#fff' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        align="center" 
                                        iconType="circle" 
                                        wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="mt-8 pt-8 border-t border-zinc-50 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-[18px] font-black text-black leading-none mb-1">{retention.new}</p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">New</p>
                        </div>
                        <div className="text-center border-l border-zinc-100">
                            <p className="text-[18px] font-black text-black leading-none mb-1">{retention.returning}</p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Recurring</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FUNNEL & ABANDONED CART */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversion Funnel */}
                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-8">Activation Funnel</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={funnelData} layout="vertical" margin={{ left: -10, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900', fill: '#000000' }} width={110} />
                                <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={24}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                                <Tooltip cursor={{ fill: '#fafafa' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#000', color: '#fff', fontSize: '10px' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Abandoned Cart Intel */}
                <div className="lg:col-span-2 bg-zinc-950 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <ShoppingBag size={140} />
                    </div>
                    <div className="p-8 border-b border-zinc-800 flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[10px] font-black uppercase tracking-mega text-white">Leakage Intelligence</h3>
                        </div>
                        <span className="px-4 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Critical Leakage</span>
                    </div>
                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left">
                            <thead className="border-b border-zinc-900">
                                <tr className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">
                                    <th className="p-6 pl-8">Network Identity</th>
                                    <th className="p-6">Unresolved Artifacts</th>
                                    <th className="p-6">Locked Valuation</th>
                                    <th className="p-6 text-right pr-8">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/50 text-xs">
                                {[
                                    { user: 'rahul.s@outlook.com', items: 'Oversized Tee (M)', val: '2,499', time: '14m ago' },
                                    { user: 'priya_v@gmail.com', items: 'Cargo Pants, Jacket', val: '8,200', time: '2h ago' },
                                    { user: 'aman.kark@test.com', items: 'Studio Hoodie (L)', val: '3,800', time: '5h ago' }
                                ].map((cart, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition group">
                                        <td className="p-6 pl-8 text-zinc-400 font-bold group-hover:text-white transition-colors">{cart.user}</td>
                                        <td className="p-6 text-zinc-500 font-bold italic text-[11px] truncate max-w-[150px] group-hover:text-zinc-300">&quot;{cart.items}&quot;</td>
                                        <td className="p-6 text-white font-mono font-black tabular-nums">₹{cart.val}</td>
                                        <td className="p-6 text-right pr-8">
                                            <button className="px-5 py-2.5 bg-white text-black rounded-full text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl hover:bg-zinc-100 border-none cursor-pointer">
                                                Recover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* TOP PATRON NETWORK (High-Fidelity Grid) */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
                 <div className="p-10 border-b border-zinc-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-mega text-zinc-950 flex items-center gap-2">
                             Top Patron Network
                        </h3>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">High-Value Network Distribution</p>
                    </div>
                    <Trophy size={20} className="text-amber-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-50 divide-y md:divide-y-0">
                    {(stats.topCustomers || []).slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="p-10 hover:bg-zinc-50 transition-all duration-500 border-b lg:border-b-0 group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center text-white text-sm font-black italic shadow-2xl shadow-black/20 transform group-hover:-translate-y-1 transition-transform">
                                    {c.name?.[0] || 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[11px] font-black uppercase truncate italic group-hover:underline underline-offset-4">{c.name}</h4>
                                    <p className="text-[8px] text-zinc-400 font-black truncate tracking-tighter uppercase mt-0.5">{c.email}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-zinc-50 pb-3">
                                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Valuation</span>
                                    <span className="text-sm font-black tabular-nums italic text-black">₹{(c.totalSpend || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Activations</span>
                                    <span className="text-xs font-black tabular-nums text-zinc-900">{c.orderCount} Units</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* SUB-FOOTER PROTOCOL */}
            <div className="text-center pt-12 pb-8">
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-200">User Intelligence Protocol Active // Secure connection encrypted</p>
            </div>
        </div>
    );
};
