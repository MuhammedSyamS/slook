'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
    TrendingUp, Users, IndianRupee, Package,
    ArrowUpRight, ArrowDownRight, Activity, Download,
    ShoppingBag, Target, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────
   DESIGN TOKENS & TYPES
───────────────────────────────────────────────── */
const HEX = {
    violet: '#7c3aed',
    emerald: '#059669',
    amber: '#d97706',
    red: '#dc2626',
    blue: '#2563eb',
    pink: '#db2777',
    indigo: '#4338ca',
    teal: '#0d9488',
    sky: '#0284c7',
};
const PIE = [HEX.violet, HEX.emerald, HEX.amber, HEX.blue, HEX.pink, HEX.indigo, HEX.teal];

interface ChartPoint {
    date: string;
    sales?: number;
    profit?: number;
    loss?: number;
    orderCount?: number;
    profitMargin?: number;
    discounts?: number;
    shipping?: number;
    tax?: number;
}

interface AnalyticsStats {
    totalSales: number;
    todaySales: number;
    totalOrders: number;
    totalUsers: number;
    newUsers: number;
    totalExpenses: number;
    chartData: ChartPoint[];
    orderStatusDist: { name: string; value: number }[];
    paymentMethodDist: { name: string; value: number; amount: number }[];
    salesByCategory: { name: string; value: number }[];
    subcategorySales: { name: string; value: number }[];
    trafficSrc: { name: string; value: number }[];
    topSellingProducts: { name: string; sold: number; image?: string }[];
    topCustomers: { name: string; totalSpend: number; orderCount: number }[];
    customerRetention: { new: number; returning: number };
    expenseBreakdown: { discounts: number; shipping: number; tax: number };
    topCartProducts: { name: string; count: number; sold: number; image?: string; price?: number; conversionRate?: number; users?: number }[];
    cartStats: { activeCarts: number; abandonedCarts: number };
    userGrowth: { date: string; count: number }[];
}

/* ─────────────────────────────────────────────────
   CUSTOM DARK TOOLTIP
───────────────────────────────────────────────── */
const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const isCount = (n: string) => ['Orders', 'Vol', 'Count', 'Users', 'Returning', 'New', 'In Cart', 'Sold'].includes(n);
    return (
        <div style={{
            background: 'linear-gradient(135deg,#0f0f1a 0%,#0a0a12 100%)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 14, padding: '12px 16px', minWidth: 150,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        }}>
            {label && <p style={{ color: '#52525b', fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{label}</p>}
            <div className="space-y-2">
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                            <span className="text-[10px] font-bold text-zinc-400">{p.name}</span>
                        </div>
                        <span className="text-[11px] font-black text-white tabular-nums">
                            {isCount(p.name) ? p.value : `₹${Number(p.value || 0).toLocaleString()}`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   SPARKLINE — micro-chart
───────────────────────────────────────────────── */
const Spark = ({ data, dk, color }: { data: any[], dk: string, color: string }) => {
    if (!data?.length) return <div className="h-9" />;
    return (
        <div className="h-9 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id={`spk-${dk}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey={dk} stroke={color} strokeWidth={2} fill={`url(#spk-${dk})`} dot={false} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────────── */
interface KpiProps {
    label: string;
    value: string | number;
    sub?: string;
    accent: string;
    icon: any;
    spark?: any[];
    dk?: string;
    trend?: string;
    trendUp?: boolean;
    onClick?: () => void;
}

const Kpi = ({ label, value, sub, accent, icon: Icon, spark, dk, trend, trendUp, onClick }: KpiProps) => (
    <motion.div 
        whileHover={onClick ? { y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' } : {}}
        onClick={onClick}
        style={{
            background: `linear-gradient(135deg, ${accent}10 0%, rgba(255,255,255,0) 60%)`,
            border: `1px solid ${accent}22`,
        }}
        className={`relative bg-white rounded-2xl p-6 shadow-sm overflow-hidden group transition-all duration-300 ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent},${accent}00)` }} />
        
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-2xl" style={{ background: `${accent}10` }}>
                <Icon size={18} style={{ color: accent }} />
            </div>
            {trend && (
                <span style={{ color: trendUp ? '#059669' : '#dc2626', background: trendUp ? '#05966915' : '#dc262615' }} className="flex items-center gap-0.5 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{trend}
                </span>
            )}
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-[2px] text-zinc-400 mb-1.5">{label}</p>
        <h3 className="text-3xl font-black tracking-tighter text-zinc-900 leading-none mb-1.5">{value}</h3>
        {sub && <p className="text-[10px] font-bold text-zinc-400 mb-4">{sub}</p>}
        
        {spark && dk && <Spark data={spark} dk={dk} color={accent} />}
    </motion.div>
);

/* ─────────────────────────────────────────────────
   CHART CARD WRAPPER
───────────────────────────────────────────────── */
interface CardProps {
    title: string;
    sub?: string;
    badge?: string | number;
    accent?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}

const Card = ({ title, sub, badge, accent = HEX.violet, children, action }: CardProps) => (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
        <div style={{ borderTop: `4px solid ${accent}` }} className="px-8 pt-8 pb-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[2px] text-zinc-900">{title}</h3>
                    {sub && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{sub}</p>}
                </div>
                <div className="flex items-center gap-3">
                    {badge && <span style={{ background: `${accent}10`, color: accent }} className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/50">{badge}</span>}
                    {action}
                </div>
            </div>
        </div>
        <div className="px-8 pb-8 flex-1">
            {children}
        </div>
    </div>
);

const Empty = ({ msg = 'No data for this period' }) => (
    <div className="flex flex-col items-center justify-center gap-4 h-[240px]">
        <div className="w-16 h-16 rounded-full bg-zinc-50 border-2 border-dashed border-zinc-100 flex items-center justify-center">
            <Activity size={24} className="text-zinc-200" />
        </div>
        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[3px]">{msg}</p>
    </div>
);

const ax = { axisLine: false, tickLine: false, tick: { fontSize: 9, fill: '#a1a1aa' } };
const rupee = (v: number) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`;

/* ═════════════════════════════════════════════════
   MAIN VIEW
═════════════════════════════════════════════════ */
export const AnalyticsDashboardView = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('daily');
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.token) return;
            setLoading(true);
            try {
                const [statsRes, alertsRes] = await Promise.all([
                    api.get(`/orders/admin/stats?timeRange=${range}`),
                    api.get('/alerts').catch(() => ({ data: [] }))
                ]);
                setStats(statsRes.data);
                setAlerts(alertsRes.data);
            } catch (err) {
                console.error('Analytics Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.token, range]);

    const exportCSV = () => {
        const d = stats?.chartData || [];
        if (!d.length) return;
        const rows = [['Date', 'Revenue', 'Profit', 'Expenses', 'Orders'], ...d.map(r => [r.date, r.sales || 0, r.profit || 0, r.loss || 0, r.orderCount || 0])];
        const csvContent = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Slook_Analytics_${range}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex h-[70vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-500/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[5px] animate-pulse">Synchronizing Intelligence</p>
            </div>
        </div>
    );

    if (!stats) return (
        <div className="flex h-[70vh] items-center justify-center">
            <div className="text-center p-12 bg-white rounded-[3rem] border border-zinc-100 shadow-xl max-w-md">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-6" />
                <h3 className="text-xl font-black tracking-tighter text-zinc-900 mb-2">Insight Retrieval Failed</h3>
                <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-8">Synchronous database error</p>
                <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                    Retry Synchronization
                </button>
            </div>
        </div>
    );

    /* ── Computed Data ── */
    const cd = stats.chartData || [];
    const statusData = stats.orderStatusDist || [];
    const payData = stats.paymentMethodDist || [];
    const catData = stats.salesByCategory || [];
    const subCat = stats.subcategorySales || [];
    const traffic = stats.trafficSrc || [];
    const ret = stats.customerRetention || { new: 0, returning: 0 };
    const eb = stats.expenseBreakdown || { discounts: 0, shipping: 0, tax: 0 };
    const cartProds = stats.topCartProducts || [];
    const cartStats = stats.cartStats || { activeCarts: 0, abandonedCarts: 0 };

    const totalRev = stats.totalSales || 0;
    const netProfit = cd.reduce((s, d) => s + (d.profit || 0), 0);
    const expenses = stats.totalExpenses || cd.reduce((s, d) => s + (d.loss || 0), 0);
    const periodOrders = cd.reduce((s, d) => s + (d.orderCount || 0), 0);
    const avgMargin = cd.length ? (cd.reduce((s, d) => s + (d.profitMargin || 0), 0) / cd.length).toFixed(1) : 0;
    const retPie = (ret.new + ret.returning) > 0 ? [{ name: 'New', value: ret.new }, { name: 'Returning', value: ret.returning }] : [];
    const cartChartData = cartProds.map(p => ({ name: (p.name || '').slice(0, 18), 'In Cart': p.count || 0, Sold: p.sold || 0 }));
    const profExpData = cd.map(d => ({ date: d.date, Profit: d.profit || 0, Discounts: d.discounts || 0, Shipping: d.shipping || 0, Tax: d.tax || 0 }));

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20 space-y-8">
            {/* ══════════════════════════════════
                DARK HERO HEADER
            ══════════════════════════════════ */}
            <div style={{
                background: 'linear-gradient(135deg,#09090b 0%,#18181b 60%,#1c1917 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 24, padding: '32px 40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[3px]">Synchronous Live Data</span>
                        </div>
                        <h1 style={{ background: 'linear-gradient(135deg,#fff 30%,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                            className="text-3xl font-black italic tracking-tighter leading-none uppercase">
                            Operational Intelligence
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mt-1">Comprehensive Platform Business Insights (MNCS-DATALAKE)</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <button onClick={exportCSV} style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 8px 25px rgba(124,58,237,0.4)' }}
                            className="flex items-center gap-3 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition active:scale-95 shadow-xl">
                            <Download size={14} /> Export Dataset
                        </button>
                        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 5 }} className="flex items-center gap-1">
                            {['daily', 'weekly', 'monthly', 'yearly'].map(r => (
                                <button key={r} onClick={() => setRange(r)} style={range === r ? { background: 'rgba(124,58,237,0.8)', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' } : { color: '#71717a' }}
                                    className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition duration-300">
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inline hero stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                        { l: 'Platform Revenue', v: `₹${totalRev.toLocaleString()}`, c: HEX.violet },
                        { l: 'Net Efficiency', v: `₹${netProfit.toLocaleString()}`, c: HEX.emerald },
                        { l: 'Order Throughput', v: stats.totalOrders || 0, c: HEX.blue },
                        { l: 'Margins (Avg)', v: `${avgMargin}%`, c: HEX.amber },
                    ].map((s, i) => (
                        <div key={i}>
                            <p style={{ color: s.c, fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>{s.l}</p>
                            <p style={{ color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }} className="tabular-nums">{s.v}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ALERTS SYSTEM */}
            <AnimatePresence>
                {alerts.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-between gap-6 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-2xl text-red-500 shadow-sm">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-red-900 uppercase">Attention Required</h4>
                                <p className="text-red-700/60 text-[10px] font-bold uppercase tracking-widest">{alerts.length} Critical inventory thresholds breached.</p>
                            </div>
                        </div>
                        <button onClick={() => router.push('/admin/products')} className="px-6 py-2.5 bg-black text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-lg">
                            Audit Thresholds
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KPI GRID WITH SPARKLINES */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <Kpi label="Platform Revenue" value={`₹${totalRev.toLocaleString()}`} sub={`Today ₹${stats.todaySales.toLocaleString()}`} accent={HEX.violet} icon={IndianRupee} spark={cd} dk="sales" trend="Gross" trendUp onClick={() => router.push('/admin/analytics/revenue')} />
                <Kpi label="Net Profit" value={`₹${netProfit.toLocaleString()}`} sub={`${avgMargin}% margin avg`} accent={HEX.emerald} icon={TrendingUp} spark={cd} dk="profit" trend="Efficiency" trendUp={netProfit > 0} onClick={() => router.push('/admin/analytics/revenue')} />
                <Kpi label="Total Expenses" value={`₹${expenses.toLocaleString()}`} sub="Vouchers & Logistics" accent={HEX.amber} icon={Target} spark={cd} dk="loss" trend="Ops Cost" trendUp={false} />
                <Kpi label="Order Units" value={periodOrders} sub={`${stats.totalOrders} processed`} accent={HEX.blue} icon={ShoppingBag} spark={cd} dk="orderCount" trend="Volume" trendUp onClick={() => router.push('/admin/analytics/orders')} />
                <Kpi label="Platform Growth" value={stats.totalUsers} sub={`+${stats.newUsers} acquisitions`} accent={HEX.pink} icon={Users} spark={stats.userGrowth || []} dk="count" trend="Users" trendUp onClick={() => router.push('/admin/analytics/users')} />
            </div>

            {/* REVENUE TREND — AREA CHART */}
            <Card title="Revenue Stream Mapping" sub={`Area trend distribution · ${cd.length} Intervals · ${range}`} badge={`₹${totalRev.toLocaleString()}`} accent={HEX.violet}>
                {cd.length === 0 ? <Empty /> : (
                    <>
                        <div className="h-[320px] mt-6">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <AreaChart data={cd} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gAreaRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={HEX.violet} stopOpacity={0.4} />
                                            <stop offset="100%" stopColor={HEX.violet} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="date" {...ax} dy={15} />
                                    <YAxis {...ax} tickFormatter={rupee} />
                                    <Tooltip content={<Tip />} />
                                    <ReferenceLine y={totalRev / (cd.length || 1)} stroke={HEX.violet} strokeDasharray="4 4" strokeOpacity={0.2} label={{ value: 'Avg', position: 'insideTopRight', fontSize: 8, fill: HEX.violet, fontWeight: 'bold' }} />
                                    <Area type="monotone" dataKey="sales" name="Revenue" stroke={HEX.violet} strokeWidth={3} fill="url(#gAreaRev)" activeDot={{ r: 6, fill: HEX.violet, stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-10 pt-8 border-t border-zinc-50 grid grid-cols-3 gap-8">
                            {[
                                { l: 'Peak Intake', v: `₹${Math.max(...cd.map(d => d.sales || 0)).toLocaleString()}` },
                                { l: `Interval Avg`, v: `₹${Math.round(totalRev / (cd.length || 1)).toLocaleString()}` },
                                { l: 'Cumulative Value', v: `₹${totalRev.toLocaleString()}` }
                            ].map((idx, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-[9px] font-black uppercase tracking-[3px] text-zinc-400 mb-2">{idx.l}</p>
                                    <p className="text-xl font-black text-zinc-900 tabular-nums">{idx.v}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* EXPENSES BAR CHART */}
                <Card title="Resource Allocation" sub="Stacked expense audit: Discounts · Fulfilment · Tax" badge={`Total ₹${expenses.toLocaleString()}`} accent={HEX.amber}>
                    {profExpData.length === 0 ? <Empty msg="No expense metrics" /> : (
                        <>
                            <div className="h-[280px] mt-6">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={profExpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f4f4f5" />
                                        <XAxis dataKey="date" {...ax} dy={15} />
                                        <YAxis {...ax} tickFormatter={rupee} />
                                        <Tooltip content={<Tip />} />
                                        <Bar dataKey="Discounts" stackId="exp" fill={HEX.amber} radius={[0, 0, 0, 0]} barSize={20} />
                                        <Bar dataKey="Shipping" stackId="exp" fill={HEX.sky} radius={[0, 0, 0, 0]} barSize={20} />
                                        <Bar dataKey="Tax" stackId="exp" fill={HEX.pink} radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-8 pt-8 border-t border-zinc-50 grid grid-cols-3 gap-4">
                                {[
                                    ['Discounts', eb.discounts, HEX.amber],
                                    ['Shipping', eb.shipping, HEX.sky],
                                    ['Tax', eb.tax, HEX.pink],
                                ].map(([l, v, c]: any, i) => (
                                    <div key={i} className="text-center">
                                        <p style={{ color: c }} className="text-[9px] font-black uppercase tracking-[2px] mb-2">{l}</p>
                                        <p className="text-lg font-black text-zinc-900 leading-none">₹{(v || 0).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 mt-1">{expenses > 0 ? ((v / expenses) * 100).toFixed(1) : 0}%</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* ORDER VOLUME CHART */}
                <Card title="Traffic Velocity" sub="Transactional unit volume distribution" badge={`${periodOrders} Processed`} accent={HEX.blue}>
                    {cd.length === 0 ? <Empty /> : (
                        <div className="h-[350px] mt-6">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={cd} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="date" {...ax} dy={15} />
                                    <YAxis {...ax} allowDecimals={false} />
                                    <Tooltip content={<Tip />} />
                                    <Bar dataKey="orderCount" name="Orders" fill={HEX.blue} radius={[6, 6, 0, 0]} barSize={range === 'daily' ? 14 : 35} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* DISTRIBUTION SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fulfillment Status */}
                <Card title="Pipeline Integrity" sub="Real-time order status distribution" accent={HEX.violet}>
                    {statusData.length === 0 ? <Empty msg="Pipeline empty" /> : (
                        <div className="flex flex-col md:flex-row gap-8 items-center h-[300px]">
                            <div className="relative w-64 h-64 shrink-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                                            {statusData.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} className="hover:opacity-80 transition-opacity cursor-pointer shadow-2xl" />)}
                                        </Pie>
                                        <Tooltip content={<Tip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-zinc-900 leading-none tracking-tighter tabular-nums">{stats.totalOrders}</span>
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Lifecycle Count</span>
                                </div>
                            </div>
                            <div className="flex-1 w-full space-y-4">
                                {statusData.slice(0, 5).map((s, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PIE[i % PIE.length] }} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-black transition-colors">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-1.5 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100/50">
                                                <div style={{ width: `${(s.value / (stats.totalOrders || 1)) * 100}%`, backgroundColor: PIE[i % PIE.length] }} className="h-full rounded-full" />
                                            </div>
                                            <span className="text-[11px] font-black text-zinc-900 tabular-nums w-6 text-right">{s.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Categories */}
                <Card title="Market Vertical Share" sub="Category performance distribution" accent={HEX.pink}>
                    {catData.length === 0 ? <Empty /> : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie data={catData} cx="50%" cy="50%" outerRadius={100} paddingAngle={4} dataKey="value" stroke="none"
                                        label={({ name, percent }) => (percent || 0) > 0.05 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ''} 
                                        labelLine={{ stroke: '#e4e4e7', strokeWidth: 1 }}
                                    >
                                        {catData.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '2px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* CART INTELLIGENCE — HIGH VALUE */}
            <Card title="Purchase Propensity" sub="Cart-to-Fulfillment Intelligence Network" badge={`${cartStats.activeCarts} Active Cycles`} accent={HEX.teal}>
                {/* KPI strip */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 mt-6">
                    {[
                        { l: 'Active Units', v: cartStats.activeCarts, c: HEX.teal, hint: 'Items in live sessions' },
                        { l: 'Abandoned (Proj)', v: cartStats.abandonedCarts, v_raw: cartStats.abandonedCarts, c: HEX.amber, hint: 'Inactive cycles > 24h' },
                        { l: 'Avg Asset Price', v: `₹${(cartProds.reduce((s: number, p: any) => s + (p.price || 0), 0) / (cartProds.length || 1)).toLocaleString()}`, c: HEX.violet, hint: 'Platform mean' },
                    ].map((idx, i) => (
                        <div key={i} className="p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm transition-all hover:bg-zinc-50/50" style={{ borderLeft: `6px solid ${idx.c}30` }}>
                            <p className="text-[10px] font-black uppercase tracking-[3px] mb-3" style={{ color: idx.c }}>{idx.l}</p>
                            <p className="text-4xl font-black text-zinc-900 leading-none mb-3 tabular-nums">{idx.v}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{idx.hint}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-400 mb-8 border-b border-zinc-100 pb-4">Demand vs Procurement ratio</h4>
                        {cartProds.length === 0 ? <Empty /> : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={cartChartData} layout="vertical" margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" {...ax} width={100} tick={{ fontSize: 9, fontWeight: 'black', fill: '#09090b' }} />
                                        <Tooltip content={<Tip />} cursor={{ fill: '#f8fafc' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '1px' }} />
                                        <Bar dataKey="In Cart" fill={HEX.teal} radius={[0, 4, 4, 0]} barSize={12} />
                                        <Bar dataKey="Sold" fill={HEX.emerald} radius={[0, 4, 4, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-400 mb-8 border-b border-zinc-100 pb-4">Lifecycle conversion leaderboards</h4>
                        {cartProds.length === 0 ? <Empty /> : (
                            <div className="space-y-6">
                                {cartProds.slice(0, 5).map((p: any, i: number) => {
                                    const rate = p.conversionRate || 0;
                                    const color = rate >= 60 ? HEX.emerald : rate >= 30 ? HEX.amber : HEX.red;
                                    return (
                                        <div key={i} className="flex items-center gap-5 group">
                                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-zinc-50 flex items-center justify-center text-[11px] font-black text-zinc-300 group-hover:bg-black group-hover:text-white transition-all duration-300 shadow-sm border border-zinc-100">
                                                #{i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-end mb-2">
                                                    <p className="text-[11px] font-black text-zinc-900 uppercase tracking-widest truncate">{p.name}</p>
                                                    <span className="text-[11px] font-black tabular-nums" style={{ color }}>{rate}%</span>
                                                </div>
                                                <div className="h-1.5 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100/50 relative">
                                                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(rate, 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                                        style={{ backgroundColor: color }} className="absolute inset-y-0 left-0 rounded-full" />
                                                </div>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2 flex items-center justify-between">
                                                    <span>{p.count} Managed Cycles</span>
                                                    <span>{p.sold} Transactions</span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* COMBINED INTELLIGENCE OVERVIEW */}
            <Card title="Unified Intelligence Matrix" sub="Multimodal visualization: Revenue (Area) · Profit (Line) · Volume (Units)" accent={HEX.violet}>
                {cd.length === 0 ? <Empty /> : (
                    <div className="h-[380px] mt-8">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <ComposedChart data={cd} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="date" {...ax} dy={15} />
                                <YAxis yAxisId="l" {...ax} tickFormatter={rupee} />
                                <YAxis yAxisId="r" orientation="right" {...ax} allowDecimals={false} />
                                <Tooltip content={<Tip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', paddingTop: '30px', textTransform: 'uppercase', letterSpacing: '2px' }} />
                                <Area yAxisId="l" type="monotone" dataKey="sales" name="Revenue" stroke={HEX.violet} strokeWidth={3} fillOpacity={0.1} fill={HEX.violet} />
                                <Line yAxisId="l" type="monotone" dataKey="profit" name="Profit Yield" stroke={HEX.emerald} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: HEX.emerald, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Bar yAxisId="r" dataKey="orderCount" name="Unit Volume" fill={HEX.blue} opacity={0.1} radius={[4, 4, 0, 0]} barSize={16} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </Card>
        </div>
    );
};
