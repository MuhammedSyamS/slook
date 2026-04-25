'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { IndianRupee, ArrowLeft, Download, Activity, TrendingUp, RefreshCw, ShoppingCart, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#6366f1'];

const EmptyChart = ({ message = 'No data for this period' }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
        <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Activity size={18} className="text-zinc-300" />
        </div>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{message}</p>
    </div>
);

export const AnalyticsRevenueView = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const { addToast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('daily');

    const fetchStats = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/orders/admin/stats?timeRange=${timeRange}`);
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            addToast('Failed to load financial analytics', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.token, timeRange, addToast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const downloadCSV = () => {
        const chartData = stats?.chartData || [];
        if (!chartData.length) {
            addToast('No data to export for this period.', 'error');
            return;
        }
        const headers = ['Date', 'Revenue', 'Profit', 'Expenses', 'Margin %'];
        const rows = chartData.map((d: any) => [d.date, d.sales || 0, d.profit || 0, d.loss || 0, d.profitMargin || 0]);
        const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading && !stats) return (
        <div className="flex h-96 items-center justify-center font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse italic">Analysing Financial Stream...</p>
            </div>
        </div>
    );

    const chartData = stats?.chartData || [];
    const salesByCategory = stats?.salesByCategory || [];
    const subcategorySales = stats?.subcategorySales || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-zinc-100 pb-8">
                <div>
                    <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-zinc-400 hover:text-black text-[10px] font-black uppercase tracking-widest mb-4 transition-all">
                        <ArrowLeft size={12} /> Back to Authority
                    </button>
                    <h1 className="text-3xl font-black italic tracking-tighter text-zinc-950 uppercase">
                        Financial <span className="text-zinc-300">Intelligence</span>
                    </h1>
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2 italic">
                        <TrendingUp size={12} className="text-emerald-500" /> Yield Analysis Protocol (MNCS-FIN)
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 bg-zinc-950 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <div className="flex items-center gap-1 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
                        {['daily', 'weekly', 'monthly', 'yearly'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === r ? 'bg-black text-white shadow-lg translate-y-[-1px]' : 'text-zinc-400 hover:text-black hover:bg-white'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Gross Yield', value: `₹${(stats?.totalSales || 0).toLocaleString()}`, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Net Profit', value: `₹${chartData.reduce((s: number, d: any) => s + (d.profit || 0), 0).toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Campaign Cost', value: `₹${(stats?.totalDiscounts || 0).toLocaleString()}`, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Live Intake', value: `₹${(stats?.todaySales || 0).toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((kpi, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className={`p-6 rounded-3xl shadow-sm border border-zinc-100 hover:shadow-xl hover:border-black transition-all group relative overflow-hidden bg-white`}
                    >
                        <p className={`text-[9px] font-black uppercase tracking-widest ${kpi.color} mb-2 relative z-10`}>{kpi.label}</p>
                        <p className="text-2xl font-black text-zinc-950 tracking-tighter relative z-10">{kpi.value}</p>
                        <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                            <Activity size={100} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 1. Revenue & Profit Margin Area Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950 italic">Yield Performance Graph</h3>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Cross-reference sales logic vs profit margin</p>
                    </div>
                    {(stats?.totalDiscounts || 0) > 0 && (
                        <div className="bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-full text-[9px] font-black text-rose-600 uppercase tracking-widest shadow-sm">
                            Discount Impact: ₹{stats.totalDiscounts.toLocaleString()}
                        </div>
                    )}
                </div>
                <div className="h-[400px]">
                    {chartData.length === 0 ? (
                        <EmptyChart message={`No yield data in ${timeRange} view`} />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 'bold' }} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 'bold' }} 
                                    tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} 
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                                    formatter={(value, name) => [
                                        name === 'Margin %' ? `${value}%` : `₹${Number(value).toLocaleString()}`,
                                        name
                                    ]}
                                />
                                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }} />
                                <Area type="monotone" dataKey="sales" name="Gross Revenue" stroke="#10b981" strokeWidth={4} fill="url(#revGrad)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="profit" name="Net Yield" stroke="#3b82f6" strokeWidth={3} fill="url(#profitGrad)" strokeDasharray="6 6" />
                                <Area type="monotone" dataKey="profitMargin" name="Margin %" stroke="#f59e0b" strokeWidth={2} fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* 2. Sales by Category & Subcategory */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Pie */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950 italic mb-8">Taxonomy Distribution</h3>
                    <div className="h-[320px]">
                        {salesByCategory.length === 0 ? (
                            <EmptyChart message="No taxonomy yield data" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={salesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={105}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {salesByCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'black' }}
                                        formatter={v => [`₹${Number(v).toLocaleString()}`, 'Yield']} 
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Subcategory Bar */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950 italic mb-8">Micro-Segment Performance</h3>
                    <div className="h-[320px]">
                        {subcategorySales.length === 0 ? (
                            <EmptyChart message="No sub-segment yield recorded" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subcategorySales} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={100} 
                                        tick={{ fontSize: 9, fontWeight: 'black', fill: '#18181b' }} 
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#fafafa' }} 
                                        contentStyle={{ borderRadius: '15px', border: 'none', fontSize: '10px', fontWeight: 'black' }}
                                        formatter={v => [`₹${Number(v).toLocaleString()}`, 'Yield']} 
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={22} name="Revenue" stroke="none" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
