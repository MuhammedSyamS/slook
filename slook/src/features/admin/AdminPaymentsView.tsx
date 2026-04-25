'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    Search, IndianRupee, CreditCard, RotateCcw, CheckCircle, 
    ArrowDownUp, RefreshCw, Clock, Download, 
    ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, 
    Calendar, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, FileText,
    Zap, Activity, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPaymentsView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const [stats, setStats] = useState({
        grossRevenue: 0,
        netRevenue: 0,
        pending: 0,
        refunded: 0,
        failed: 0,
        transactions: 0
    });

    const fetchPayments = useCallback(async (p = page, search = searchTerm, status = filter) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/orders/admin/all`, {
                params: {
                    page: p,
                    pageSize: 15,
                    keyword: search,
                    status: (status === 'paid' || status === 'pending') ? undefined : (status === 'all' ? undefined : status),
                    isPaid: status === 'paid' ? 'true' : (status === 'pending' ? 'false' : undefined)
                }
            });
            setOrders(data.orders || []);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
            setPage(data.page || 1);
        } catch (err) {
            addToast("Ledger synchronization failed", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast, filter, searchTerm, page]);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/orders/admin/stats');
            setStats({
                grossRevenue: data.totalRevenue || 0,
                netRevenue: data.netRevenue || (data.totalRevenue - (data.refundedAmount || 0)),
                pending: data.pendingRevenue || 0,
                refunded: data.refundedAmount || 0,
                failed: data.failedAmount || 0,
                transactions: data.totalOrders || 0
            });
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchPayments(1);
    }, [fetchStats, fetchPayments]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPayments(1, searchTerm);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchPayments]);

    const handleAction = async (id: string, action: string) => {
        try {
            if (action === 'delete') {
                await api.delete(`/orders/${id}`);
                addToast("Entity purged from ledger", "success");
            } else {
                const endpoint = action === 'pay' ? 'pay' : 'refund';
                await api.put(`/orders/${id}/${endpoint}`, {});
                addToast(`Capital ${action === 'pay' ? 'Verified' : 'Refunded'}`, "success");
            }
            fetchPayments();
            fetchStats();
        } catch (err) {
            addToast(`Transaction aborted: ${action}`, "error");
        }
    };

    const downloadInvoice = async (orderId: string) => {
        try {
            addToast("Preparing proof of purchase...", "info");
            const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.body.appendChild(document.createElement('a'));
            link.href = url;
            link.download = `receipt-${orderId.slice(-8)}.pdf`;
            link.click();
            link.remove();
        } catch (err) {
            addToast("Failed to generate proof", "error");
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Financial <span className="text-zinc-400">Ledger</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Enterprise Treasury & Transaction Registry (MNCS-TREASURY)</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={16} />
                        <input
                            placeholder="FIND LEDGER ENTRIES..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-72 pl-16 pr-8 py-4.5 bg-white border border-zinc-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widest focus:border-black outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => { fetchPayments(); fetchStats(); addToast("Syncing Database...", "info"); }}
                        className="p-4.5 bg-white border border-zinc-100 rounded-[1.5rem] text-zinc-400 hover:text-black hover:border-black transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={async () => {
                            try {
                                addToast("Synthesizing Audit Report...", "info");
                                const response = await api.get('/orders/admin/report', { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.body.appendChild(document.createElement('a'));
                                link.href = url;
                                link.download = 'audit-report.pdf';
                                link.click();
                                link.remove();
                                addToast("Audit Report Ready", "success");
                            } catch (err) {
                                addToast("Failed to compile report", "error");
                            }
                        }}
                        className="flex items-center gap-3 px-8 py-4.5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all italic"
                    >
                        <Download size={16} /> DOWNLOAD LEDGER
                    </button>
                </div>
            </header>

            {/* KPI DYNAMICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Settled Capital', val: stats.netRevenue, icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Pending Inflow', val: stats.pending, icon: Clock, color: 'text-amber-500' },
                    { label: 'Reverse Capital', val: stats.refunded, icon: RotateCcw, color: 'text-rose-500' },
                    { label: 'Total Volume', val: stats.transactions, icon: CreditCard, color: 'text-blue-500', isCount: true }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[3rem] border border-zinc-50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <kpi.icon size={100} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 italic">{kpi.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tighter">
                                {kpi.isCount ? '' : '₹'}{kpi.val.toLocaleString()}
                            </span>
                            {!kpi.isCount && <span className={`w-1.5 h-1.5 rounded-full ${kpi.color} animate-pulse`} />}
                        </div>
                    </div>
                ))}
            </div>

            {/* SECTOR FILTERS */}
            <div className="flex gap-2 p-1.5 bg-zinc-100 rounded-[2rem] border border-zinc-200 mb-10 max-w-max shadow-sm">
                {['all', 'paid', 'pending', 'refunded'].map(f => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-8 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                            filter === f ? 'bg-black text-white shadow-xl' : 'text-zinc-500 hover:text-black hover:bg-white'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* LEDGER MATRIX */}
            <div className="bg-white border border-zinc-50 rounded-[3.5rem] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 italic w-8 text-center">SCAN</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 italic">TRANSACTION ID</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 italic">ENTITY IDENTITY</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 italic text-right">VALUATION</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 italic">SETTLE STATE</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 italic text-right">COMMANDS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {orders.map((o) => (
                                <React.Fragment key={o._id}>
                                    <tr className={`transition-all duration-300 group ${expandedRows.has(o._id) ? 'bg-zinc-50/80 shadow-inner' : 'hover:bg-zinc-50/50'}`}>
                                        <td className="p-10 text-center">
                                            <button 
                                                onClick={() => toggleRow(o._id)}
                                                className={`p-3.5 rounded-2xl border transition-all duration-500 ${expandedRows.has(o._id) ? 'rotate-180 bg-black text-white border-black' : 'bg-white text-zinc-300 border-zinc-100 hover:border-black hover:text-black shadow-sm'}`}
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </td>
                                        <td className="p-10">
                                            <div className="font-black text-xs uppercase tracking-tighter mb-1.5 italic">TXN-{o._id.slice(-12).toUpperCase()}</div>
                                            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Activity size={10} className="text-zinc-300" /> {o.paymentMethod || 'SECURE PROTOCOL'}
                                            </div>
                                        </td>
                                        <td className="p-10">
                                            <div className="font-black text-xs uppercase italic tracking-tight mb-1">{o.user?.firstName || 'GUEST-CLIENT'}</div>
                                            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{o.user?.email || 'N/A'}</div>
                                        </td>
                                        <td className="p-10 text-right">
                                            <div className="text-sm font-black tracking-tight tabular-nums">₹{o.totalPrice.toLocaleString()}</div>
                                        </td>
                                        <td className="p-10">
                                            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border max-w-max ${
                                                o.isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${o.isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                                <span className="text-[9px] font-black uppercase tracking-widest italic">{o.isPaid ? 'VERIFIED' : 'PENDING'}</span>
                                            </div>
                                        </td>
                                        <td className="p-10 text-right">
                                            <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                                {!o.isPaid && (
                                                    <button onClick={() => handleAction(o._id, 'pay')} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Verify Capital Inflow">
                                                        <ShieldCheck size={18} />
                                                    </button>
                                                )}
                                                {o.isPaid && (
                                                    <button onClick={() => downloadInvoice(o._id)} className="p-4 bg-zinc-100 text-zinc-400 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm" title="Synthesize Receipt">
                                                        <Download size={18} />
                                                    </button>
                                                )}
                                                <button onClick={() => window.open(`/admin/orders/${o._id}`, '_blank')} className="p-4 bg-zinc-50 text-zinc-300 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm">
                                                    <ExternalLink size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <AnimatePresence>
                                        {expandedRows.has(o._id) && (
                                            <tr>
                                                <td colSpan={6} className="p-0 border-none">
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <div className="p-12 bg-zinc-950 text-white rounded-[2.5rem] m-6 mt-0 shadow-2xl relative border border-zinc-900">
                                                            <div className="absolute top-0 right-0 p-12 opacity-5">
                                                                <FileText size={160} />
                                                            </div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 italic flex items-center gap-3">
                                                                <Zap size={14} className="text-orange-400" /> TRANSACTION DEEP SCAN
                                                            </p>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                                                <div className="space-y-6">
                                                                    <div>
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block mb-3">INTERNAL REFERENCE</label>
                                                                        <p className="font-mono text-[11px] text-zinc-300 tracking-tight">{o._id.toUpperCase()}</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block mb-3">GATEWAY SIGNATURE</label>
                                                                        <p className="font-mono text-[11px] text-zinc-300 tracking-tight">{o.paymentResult?.id || 'ANONYMOUS-PROTOCOL'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-6">
                                                                    <div>
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block mb-3">TEMPORAL TIMESTAMP</label>
                                                                        <p className="text-[11px] font-black uppercase text-zinc-200">{new Date(o.createdAt).toLocaleString()}</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block mb-3">SETTLED VALUE</label>
                                                                        <div className="flex items-baseline gap-3">
                                                                            <span className="text-2xl font-black italic">₹{o.totalPrice.toLocaleString()}</span>
                                                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">GROSS</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-end">
                                                                    {o.isPaid && (
                                                                        <button onClick={() => handleAction(o._id, 'refund')} className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                                                           INITIATE REVERSE CAPITAL
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION MATRIX */}
                <div className="p-10 bg-zinc-50 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">
                        PROTOCOL CONTEXT: <span className="text-black">{total} LOGS</span> • STAGE {page} / {pages}
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="flex items-center gap-3 px-8 py-4 bg-white border border-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:border-black transition-all shadow-sm"
                        >
                            <ChevronLeft size={16} /> PREV
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page === pages || loading}
                            className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-2xl italic"
                        >
                            NEXT <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
