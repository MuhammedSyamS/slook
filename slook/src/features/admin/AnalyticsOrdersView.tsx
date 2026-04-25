'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';
import { 
    Activity, ArrowLeft, Truck, Download, AlertTriangle, 
    RefreshCw, Package, Clock, CheckCircle2, ShoppingBag 
} from 'lucide-react';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
    Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#6366f1'];

interface OrderStatusDist {
    name: string;
    value: number;
}

interface ChartData {
    date: string;
    orderCount: number;
    sales: number;
}

interface AnalyticsStats {
    totalOrders: number;
    refundRequests: number;
    failedPayments: number;
    avgDeliveryDays: number;
    orderStatusDist: OrderStatusDist[];
    chartData: ChartData[];
}

const EmptyChart = ({ message = 'No data available' }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Activity size={18} className="text-zinc-300" />
        </div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{message}</p>
    </div>
);

export const AnalyticsOrdersView = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const { addToast } = useToast();
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('daily');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/orders/admin/stats?timeRange=${timeRange}`);
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
                addToast('Failed to load analytics data', 'error');
            } finally {
                setLoading(false);
            }
        };
        if (user?.token) fetchStats();
    }, [user?.token, timeRange, addToast]);

    const downloadCSV = async () => {
        try {
            addToast('Preparing Export...', 'info');
            const { data } = await api.get(`/orders/admin/all?pageSize=10000`);

            if (!data.orders?.length) {
                addToast('No orders to export', 'error');
                return;
            }

            const escape = (text: any) => {
                if (text === null || text === undefined) return '';
                return `"${String(text).replace(/"/g, '""')}"`;
            };

            const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Payment', 'Method'];
            const rows = data.orders.map((o: any) => [
                escape(o._id),
                escape(new Date(o.createdAt).toLocaleDateString()),
                escape(o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest'),
                escape(o.user?.email || ''),
                escape(o.orderItems?.length || 0),
                escape(o.totalPrice),
                escape(o.orderStatus || (o.isDelivered ? 'Delivered' : 'Pending')),
                escape(o.isPaid ? 'Paid' : 'Unpaid'),
                escape(o.paymentMethod)
            ]);

            const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Order_Export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            addToast('Export Complete ✓', 'success');
        } catch (error) {
            console.error('Export Failed:', error);
            addToast('Failed to export orders', 'error');
        }
    };

    if (!user) return <div className="p-8 text-center text-zinc-400">Please log in.</div>;
    
    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Loading Order Data...</p>
            </div>
        </div>
    );

    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load order data.</div>;

    const orderStatusDist = stats.orderStatusDist || [];
    const chartData = stats.chartData || [];

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <button onClick={() => router.push('/admin/analytics')} className="flex items-center gap-2 text-zinc-400 hover:text-black text-[10px] font-black uppercase tracking-widest mb-4 transition group">
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Intelligence
                    </button>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Order <span className="text-zinc-400">Ops</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Fulfillment & Status Reports (MNCS-TRANSIT)</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg shadow-zinc-200"
                    >
                        <Download size={12} /> Export Orders CSV
                    </button>
                    <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-100">
                        {['daily', 'weekly', 'monthly'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${timeRange === r ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:text-black hover:bg-zinc-200'}`}
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
                    { label: 'Total Orders', value: stats.totalOrders || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Delivered', value: orderStatusDist.find(d => d.name === 'Delivered')?.value || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Return Requests', value: stats.refundRequests || 0, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: 'Avg. Delivery', value: `${stats.avgDeliveryDays || 0}d`, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((kpi, i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 cursor-default"
                    >
                        <p className={`text-[10px] font-black uppercase tracking-widest ${kpi.color} mb-2`}>{kpi.label}</p>
                        <p className="text-3xl font-black text-zinc-900 tracking-tighter">{kpi.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Order Status Pie + Problematic Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Donut */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Order Status Distribution</h3>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-50 text-zinc-400 px-3 py-1 rounded-full border border-zinc-100">{stats.totalOrders || 0} Total</span>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        {orderStatusDist.length === 0 ? (
                            <EmptyChart message="No order status data" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={orderStatusDist}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        labelLine={false}
                                    >
                                        {orderStatusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                        formatter={(v: any) => [v + ' orders', 'Count']} 
                                    />
                                    <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Problematic Orders */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-8 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" /> Critical Order Intelligence
                    </h3>
                    <div className="space-y-4 flex-1">
                        <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center justify-between group hover:bg-red-100/50 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="bg-white p-4 rounded-2xl text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                                    <RefreshCw size={20} />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-red-900 tracking-tighter leading-none mb-1">{stats.refundRequests || 0}</h4>
                                    <p className="text-red-700/50 text-[9px] font-black uppercase tracking-[0.2em]">Return / Refund Claims</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/returns')} 
                                className="px-5 py-2.5 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-900/10 hover:scale-105 active:scale-95 transition-all"
                            >
                                Audit
                            </button>
                        </div>

                        <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-center gap-5">
                            <div className="bg-white p-4 rounded-2xl text-orange-600 shadow-sm">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-orange-900 tracking-tighter leading-none mb-1">{stats.failedPayments || 0}</h4>
                                <p className="text-orange-700/50 text-[9px] font-black uppercase tracking-[0.2em]">Failed Payment Entries</p>
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] flex items-center gap-5">
                            <div className="bg-white p-4 rounded-2xl text-zinc-600 shadow-sm">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none mb-1">
                                    {stats.avgDeliveryDays || 0} <span className="text-sm text-zinc-400 font-normal uppercase tracking-widest">Days</span>
                                </h4>
                                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Platform Avg. Delivery</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Order Volume Bar Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-1">Order Volume Streams</h3>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Dynamic throughput visualization</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 border border-zinc-100 px-4 py-2 rounded-xl">
                        {timeRange} Interval · {chartData.length} Points
                    </span>
                </div>
                <div className="h-[350px]">
                    {chartData.length === 0 ? (
                        <EmptyChart message={`No order throughput in ${timeRange} interval`} />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f4f4f5" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 'bold' }} 
                                    dy={15} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 'bold' }} 
                                    allowDecimals={false} 
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', radius: 4 }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                    formatter={(v: any) => [v, 'Orders Managed']}
                                />
                                <Bar dataKey="orderCount" name="Orders" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={timeRange === 'daily' ? 12 : 30} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                {/* Revenue vs Orders secondary insight */}
                {chartData.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-zinc-50 flex flex-wrap items-center gap-x-12 gap-y-4 text-[10px] font-black uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-zinc-400">Total volume this cycle:</span>
                            <span className="text-zinc-900">{chartData.reduce((s, d) => s + (d.orderCount || 0), 0)} Units</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-zinc-400">Projected Value:</span>
                            <span className="text-zinc-900">₹{chartData.reduce((s, d) => s + (d.sales || 0), 0).toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
