'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { 
    Package, Truck, Eye, FileText, Search, RefreshCw, 
    Download, ChevronLeft, ChevronRight, ShoppingBag, 
    MapPin, CreditCard, ChevronDown, CheckCircle, Clock, X 
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const AdminOrdersView = () => {
    const router = useRouter();
    const { addToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
    const [shippingModal, setShippingModal] = useState({ show: false, orderId: null as string|null, status: null as string|null, partner: '', tracking: '' });

    const fetchOrders = useCallback(async (p = page, search = searchTerm, status = activeTab) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/orders/admin/all`, {
                params: {
                    page: p,
                    pageSize: 15,
                    keyword: search,
                    status: status === 'all' ? undefined : status
                }
            });
            setOrders(data.orders || []);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            addToast("Failed to fetch orders", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast, searchTerm, activeTab, page]);

    useEffect(() => {
        fetchOrders(page);
    }, [page, activeTab, fetchOrders]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                setPage(1);
                fetchOrders(1, searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchOrders]);

    const handleStatusChange = async (orderId: string, newStatus: string, logistics = { partner: '', tracking: '' }) => {
        if ((newStatus === 'Shipped' || newStatus === 'Dispatched') && !logistics.partner) {
            setShippingModal({ show: true, orderId, status: newStatus, partner: '', tracking: '' });
            return;
        }

        setStatusUpdating(orderId);
        try {
            await api.put(`/orders/${orderId}/status`, { 
                status: newStatus,
                deliveryPartner: logistics.partner,
                trackingId: logistics.tracking
            });
            addToast(`Order marked as ${newStatus}`, "success");
            setOrders(prev => prev.map(o => o._id === orderId ? { 
                ...o, 
                orderStatus: newStatus,
                deliveryPartner: logistics.partner || o.deliveryPartner,
                trackingId: logistics.tracking || o.trackingId
            } : o));
            setShippingModal({ show: false, orderId: null, status: null, partner: '', tracking: '' });
        } catch (err) {
            addToast("Status update failed", "error");
        } finally {
            setStatusUpdating(null);
        }
    };

    const downloadInvoice = async (orderId: string) => {
        try {
            const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            addToast("Failed to download invoice", "error");
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-red-50 text-red-600 border-red-100';
            case 'Confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Shipped': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'Delivered': return 'bg-green-50 text-green-600 border-green-100';
            default: return 'bg-zinc-50 text-zinc-600 border-zinc-100';
        }
    };

    const tabs = ['all', 'Pending', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Exchanged'];
    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Order <span className="text-zinc-400">Manager</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Registry Fulfillment Operations (MNCS-OPS)</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                        <input
                            placeholder="Find Reference ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 rounded-full bg-white border border-zinc-100 focus:border-black outline-none text-xs font-bold uppercase tracking-widest shadow-sm w-full md:w-64 transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-full text-[11px] font-black uppercase tracking-widest hover:text-black transition-all">
                        <Download size={14} /> Export
                    </button>
                    <button onClick={() => fetchOrders()} className="p-3 bg-zinc-100 rounded-full text-zinc-400 hover:text-black hover:rotate-180 transition-all shadow-sm">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* STATUS TABS */}
            <div className="flex gap-1 p-1 bg-zinc-900/5 rounded-xl border border-white overflow-x-auto no-scrollbar max-w-max">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab ? 'bg-black text-white' : 'text-zinc-500 hover:bg-white hover:text-black'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ORDER TABLE */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                <th className="px-6 py-4 w-12"></th>
                                <th className="px-6 py-4">Registry ID</th>
                                <th className="px-6 py-4">Identity</th>
                                <th className="px-6 py-4">Financials</th>
                                <th className="px-6 py-4">Status Authority</th>
                                <th className="px-6 py-4 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-zinc-50 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Package className="mx-auto text-zinc-200 mb-4" size={48} />
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest italic">No matching lifecycle entries</p>
                                    </td>
                                </tr>
                            ) : orders.map((o) => (
                                <React.Fragment key={o._id}>
                                    <tr className={`hover:bg-blue-50/30 transition-colors group ${expandedRows.has(o._id) ? 'bg-zinc-50' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => toggleRow(o._id)}
                                                className={`p-1.5 rounded-full border transition-all ${expandedRows.has(o._id) ? 'bg-black text-white border-black rotate-180' : 'text-zinc-400 border-zinc-200'}`}
                                            >
                                                <ChevronDown size={14} strokeWidth={3} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-black uppercase tracking-tight text-zinc-900">#SLK-{o._id.slice(-8).toUpperCase()}</div>
                                            <div className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5 tabular-nums">{new Date(o.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-zinc-900">{o.user?.firstName} {o.user?.lastName}</div>
                                            <div className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5 tabular-nums">{o.user?.phone || 'PRIVATE-UID'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-zinc-900 tabular-nums">₹{(o.totalPrice || 0).toLocaleString()}</div>
                                            <div className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 flex items-center gap-1">
                                                <CreditCard size={10} /> {o.paymentMethod}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                disabled={statusUpdating === o._id}
                                                value={o.orderStatus}
                                                onChange={(e) => handleStatusChange(o._id, e.target.value)}
                                                className={`appearance-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border focus:ring-2 ring-black/5 outline-none transition-all cursor-pointer ${getStatusStyles(o.orderStatus)}`}
                                            >
                                                {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Exchanged'].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 text-zinc-400">
                                                <button 
                                                    onClick={() => downloadInvoice(o._id)}
                                                    className="p-2 hover:text-black hover:bg-zinc-100 rounded transition-all"
                                                    title="Bill Piece"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => router.push(`/orders/${o._id}`)}
                                                    className="p-2 hover:text-black hover:bg-zinc-100 rounded transition-all"
                                                    title="Audit Data"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <AnimatePresence>
                                        {expandedRows.has(o._id) && (
                                            <tr>
                                                <td colSpan={6} className="bg-zinc-50 border-y border-zinc-100 p-0 overflow-hidden">
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
                                                    >
                                                        {/* SKUs */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 mb-2">
                                                                <ShoppingBag size={12} /> Registry Elements
                                                            </div>
                                                            {o.orderItems?.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-4 bg-white p-3 border border-zinc-100 rounded-lg shadow-sm">
                                                                    <div className="w-12 h-12 bg-zinc-50 rounded border border-zinc-100 overflow-hidden flex-shrink-0">
                                                                        <img src={resolveMediaURL(item.image)} alt="" className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs font-bold uppercase truncate">{item.name}</div>
                                                                        <div className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                                                                            {item.selectedVariant?.size} / {item.selectedVariant?.color} • Qty {item.qty}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-[11px] font-black italic">₹{(item.price || 0).toLocaleString()}</div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Logistics */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm">
                                                                <div className="text-[9px] font-black uppercase text-zinc-400 mb-3 flex items-center gap-2">
                                                                    <MapPin size={12} className="text-zinc-400" /> Target Protocol
                                                                </div>
                                                                <p className="text-[11px] font-bold text-zinc-600 leading-relaxed uppercase">
                                                                    {o.shippingAddress?.address}<br/>
                                                                    {o.shippingAddress?.city}, {o.shippingAddress?.postalCode}<br/>
                                                                    {o.shippingAddress?.state}
                                                                </p>
                                                            </div>
                                                            <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm">
                                                                <div className="text-[9px] font-black uppercase text-zinc-400 mb-3 flex items-center gap-2">
                                                                    <Truck size={12} className="text-zinc-400" /> Dispatch Authority
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="text-xs font-black uppercase italic text-zinc-900">{o.deliveryPartner || 'Pending Data'}</div>
                                                                    <div className="text-[9px] font-bold text-zinc-500 tabular-nums uppercase tracking-widest truncate">{o.trackingId || 'AWB-VOID'}</div>
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

                {/* PAGINATION */}
                <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Showing Page {page} of {pages} (<span className="text-zinc-900">{total} Cycles</span>)
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-zinc-200 rounded text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-100 transition-all font-sans"
                        >
                            <ChevronLeft size={12} /> Prev
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page === pages || loading}
                            className="flex items-center gap-1 px-4 py-2 bg-black text-white rounded text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-800 transition-all shadow-md font-sans"
                        >
                            Next <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* LOGISTICS MODAL */}
            <AnimatePresence>
                {shippingModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShippingModal({ show: false, orderId: null, status: null, partner: '', tracking: '' })}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white w-full max-w-sm rounded-xl p-8 shadow-2xl border border-zinc-200"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <Truck className="text-zinc-900" size={24} />
                                <h3 className="text-xl font-black uppercase tracking-tighter">Logistics <span className="text-zinc-400">Entry</span></h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Carrier Partner</label>
                                    <input 
                                        autoFocus
                                        placeholder="e.g. Shiprocket"
                                        value={shippingModal.partner}
                                        onChange={(e) => setShippingModal(prev => ({ ...prev, partner: e.target.value }))}
                                        className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-lg text-xs font-bold uppercase outline-none focus:border-black transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">AWB Tracking ID</label>
                                    <input 
                                        placeholder="ID Number..."
                                        value={shippingModal.tracking}
                                        onChange={(e) => setShippingModal(prev => ({ ...prev, tracking: e.target.value }))}
                                        className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-lg text-xs font-bold uppercase outline-none focus:border-black transition-all"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button onClick={() => setShippingModal({ show: false, orderId: null, status: null, partner: '', tracking: '' })} className="flex-1 px-4 py-3 bg-zinc-100 text-[10px] font-black uppercase rounded-lg hover:bg-zinc-200 transition-all">Void</button>
                                    <button onClick={() => handleStatusChange(shippingModal.orderId!, shippingModal.status!, { partner: shippingModal.partner, tracking: shippingModal.tracking })} className="flex-1 px-4 py-3 bg-black text-white text-[10px] font-black uppercase rounded-lg shadow-lg hover:bg-zinc-800 transition-all">Commit</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
