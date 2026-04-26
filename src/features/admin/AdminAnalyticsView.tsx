'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import {
    AreaChart, Area, BarChart, Bar, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, Users, IndianRupee,
    ArrowUpRight, ArrowDownRight, RefreshCw, Star,
    ShoppingBag, Target, Package, Activity
} from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';

/* ─────────────────────────────────────────────────
   DESIGN TOKENS (LEGACY PARITY)
   ───────────────────────────────────────────────── */
const HEX = {
    violet: '#7c3aed',
    emerald: '#059669',
    amber: '#d97706',
    red: '#dc2626',
    blue: '#2563eb',
    pink: '#db2777',
};

const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-xl">
            {label && <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1">{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-[10px] font-medium text-zinc-500">{p.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-900">
                        {p.name.includes('Count') ? p.value : `₹${Number(p.value || 0).toLocaleString()}`}
                    </span>
                </div>
            ))}
        </div>
    );
};

const Kpi = ({ label, value, sub, accent, icon: Icon, trend, trendUp }: any) => (
    <div className="bg-white rounded-xl p-6 border border-zinc-100 shadow-sm transition-all hover:border-zinc-300">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg" style={{ background: `${accent}10` }}>
                <Icon size={18} style={{ color: accent }} />
            </div>
            {trend && (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{trend}
                </span>
            )}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{value}</h3>
        {sub && <p className="text-[10px] text-zinc-400 mt-1">{sub}</p>}
    </div>
);

const Section = ({ title, sub, children }: any) => (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6">
        <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">{title}</h3>
            {sub && <p className="text-[10px] text-zinc-400 font-medium mt-1">{sub}</p>}
        </div>
        <div className="h-[300px]">
            {children}
        </div>
    </div>
);

const ax = { axisLine: false, tickLine: false, tick: { fontSize: 9, fill: '#a1a1aa' } };

export const AdminAnalyticsView = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('monthly');

    useEffect(() => {
        setLoading(true);
        api.get(`/orders/admin/stats?timeRange=${range}`)
            .then(r => setStats(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [range]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <RefreshCw className="animate-spin text-zinc-300 mb-4" size={32} />
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loading Analytics...</p>
        </div>
    );

    if (!stats) return null;

    const chartData = stats.chartData || [];
    const catData = stats.salesByCategory || [];
    const statusData = stats.orderStatusDist || [];
    const totalRev = stats.totalSales || 0;
    const topProducts = (stats.topCartProducts || []).slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Analytics <span className="text-zinc-400">Overview</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Platform Performance Intelligence (MNCS-INTEL)</p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(r => (
                        <button 
                            key={r} 
                            onClick={() => setRange(r)} 
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${range === r ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Kpi label="Total Revenue" value={`₹${totalRev.toLocaleString()}`} accent={HEX.violet} icon={IndianRupee} trend="+12.5%" trendUp />
                <Kpi label="Total Users" value={stats.totalUsers || 0} accent={HEX.blue} icon={Users} trend="+4.2%" trendUp />
                <Kpi label="Gross Margin" value="34.8%" accent={HEX.emerald} icon={TrendingUp} trend="Stable" trendUp />
                <Kpi label="Conversion" value="2.4%" accent={HEX.pink} icon={Target} trend="-0.5%" />
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Section title="Revenue Forecast" sub="Historical sales trend vs current period">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={HEX.violet} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={HEX.violet} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" {...ax} />
                                <YAxis {...ax} />
                                <Tooltip content={<Tip />} />
                                <Area type="monotone" dataKey="sales" name="Revenue" stroke={HEX.violet} strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Section>
                </div>
                <Section title="Sales by Category" sub="Market share distribution">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={catData} 
                                cx="50%" cy="50%" 
                                innerRadius={60} outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                            >
                                {catData.map((_: any, i: number) => <Cell key={i} fill={[HEX.violet, HEX.blue, HEX.emerald, HEX.pink, HEX.amber][i % 5]} />)}
                            </Pie>
                            <Tooltip content={<Tip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </Section>
            </div>

            {/* CHARTS ROW 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Order Status" sub="Current operational volume distribution">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" {...ax} width={100} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="value" name="Orders" fill={HEX.blue} radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </Section>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <ShoppingBag size={120} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2">Abandoned Cart Intel</h3>
                        <p className="text-[10px] text-zinc-500 mb-6 uppercase font-bold">Conversion opportunities discovered</p>
                        
                        <div className="space-y-4 mb-auto">
                            {topProducts.map((p: any, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white">
                                        #{i+1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-white truncate uppercase">{p.name}</p>
                                        <p className="text-[9px] text-zinc-500 font-medium">{p.count} Carts • ₹{p.price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black text-emerald-500 uppercase">{p.conversionRate}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-4 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition">
                            Sync Marketing Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
