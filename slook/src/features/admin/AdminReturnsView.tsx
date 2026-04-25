'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { 
    RefreshCw, Search, Truck, Check, X, 
    AlertCircle, Camera, User, 
    ArrowRight, ChevronLeft, ChevronRight, 
    History, ChevronDown, Package, CheckCircle2, XCircle, Play,
    ArrowLeft
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const AdminReturnsView = () => {
    const { addToast } = useToast();
    const router = useRouter();
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [viewMedia, setViewMedia] = useState<any[] | null>(null);

    const fetchReturns = useCallback(async (p = 1, search = '', status = '') => {
        setLoading(true);
        try {
            const { data } = await api.get(`/returns/admin`, {
                params: {
                    page: p,
                    pageSize: 15,
                    keyword: search,
                    status: status === 'all' ? undefined : status
                }
            });
            setReturns(data.returns || []);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
            setPage(data.page || 1);
        } catch (err) {
            addToast("Failed to fetch returns data", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReturns(1, searchTerm, activeTab);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, activeTab, fetchReturns]);

    const handleAction = async (id: string, status: string, extraData = {}) => {
        setProcessingId(id);
        try {
            await api.put(`/returns/${id}/status`, { status, ...extraData });
            addToast(`Updated: ${status}`, "success");
            setReturns(prev => prev.map(r => r._id === id ? { ...r, status, ...extraData } : r));
        } catch (err: any) {
            addToast(err.response?.data?.message || "Action failed", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const resolveReturn = async (id: string, type: string) => {
        setProcessingId(id);
        try {
            await api.put(`/returns/${id}/resolve`, {});
            addToast(`Success: ${type === 'Return' ? 'Refunded' : 'Exchanged'}`, "success");
            fetchReturns(page, searchTerm, activeTab);
        } catch (err: any) {
            addToast(err.response?.data?.message || "Resolution failed", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            'Requested': 'bg-amber-50 text-amber-600 border-amber-100',
            'Approved': 'bg-blue-50 text-blue-600 border-blue-100',
            'Pickup Scheduled': 'bg-indigo-50 text-indigo-600 border-indigo-100',
            'Picked Up': 'bg-sky-50 text-sky-600 border-sky-100',
            'QC Pending': 'bg-purple-50 text-purple-600 border-purple-100',
            'QC Passed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'QC Failed': 'bg-rose-50 text-rose-600 border-rose-100',
            'Refund Completed': 'bg-zinc-900 text-white border-zinc-900',
            'Replacement Sent': 'bg-zinc-900 text-white border-zinc-900',
            'Rejected': 'bg-zinc-100 text-zinc-400 border-zinc-200',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${styles[status] || styles['Requested']}`}>
                {status}
            </span>
        );
    };

    const tabs = ['all', 'Requested', 'Approved', 'QC Pending', 'QC Passed', 'Refund Completed', 'Replacement Sent', 'Rejected'];

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Pick <span className="text-zinc-400">Up</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Claim Reconciliation & Logistics (MNCS-LOGS)</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={16} />
                        <input
                            placeholder="Find Claim, Order, Client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-zinc-200 pl-12 pr-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest w-80 focus:border-black outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {/* TAB STRIP */}
            <div className="flex gap-2 p-2 bg-zinc-100 rounded-[2rem] border border-zinc-200 mb-8 overflow-x-auto no-scrollbar max-w-max font-outfit">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setPage(1); }}
                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab ? 'bg-black text-white shadow-lg scale-[1.05]' : 'text-zinc-500 hover:text-black hover:bg-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-zinc-100 rounded-[3rem] shadow-sm overflow-hidden font-outfit">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                <th className="p-8 w-16 text-center"></th>
                                <th className="p-8">Unit Info</th>
                                <th className="p-8">Claim Logic</th>
                                <th className="p-8">Status Ops</th>
                                <th className="p-8 text-right">Direct Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {returns.map((r) => (
                                <React.Fragment key={r._id}>
                                    <tr className={`transition-all duration-300 group ${expandedRows.has(r._id) ? 'bg-zinc-50/80 shadow-inner' : 'hover:bg-zinc-50/50'}`}>
                                        <td className="p-8 text-center">
                                            <button 
                                                onClick={() => toggleRow(r._id)}
                                                className={`p-2.5 rounded-xl border border-zinc-100 bg-white shadow-sm transition-all ${expandedRows.has(r._id) ? 'rotate-180 bg-black text-white border-black' : 'text-zinc-300 hover:text-black hover:border-black'}`}
                                            >
                                                <ChevronDown size={14} strokeWidth={3} />
                                            </button>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm p-1">
                                                    <img src={resolveMediaURL(r.orderItem?.image)} alt="" className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-xs uppercase tracking-tight italic">#{r._id.slice(-8)}</div>
                                                    <div className="text-[9px] text-zinc-400 font-bold uppercase mt-1 tracking-widest">{r.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="font-black text-[11px] text-zinc-900 group-hover:text-black transition-colors">&quot;{r.reason}&quot;</div>
                                            <div className="text-[9px] text-zinc-400 font-bold uppercase mt-1 italic tracking-widest">ORD-{r.order?._id.slice(-8)} • {r.user?.email}</div>
                                        </td>
                                        <td className="p-8 text-[11px]">
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                {r.status === 'Requested' && (
                                                    <>
                                                        <button onClick={() => handleAction(r._id, 'Approved')} className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => handleAction(r._id, 'Rejected')} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {r.status === 'QC Pending' && (
                                                    <>
                                                        <button onClick={() => handleAction(r._id, 'QC Passed')} className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleAction(r._id, 'QC Failed')} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {r.status === 'QC Passed' && (
                                                    <button onClick={() => resolveReturn(r._id, r.type)} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg italic">
                                                        Resolve <ArrowRight size={14} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setViewMedia((r.images || []).map((url: string) => ({ type: (url.match(/\.(mp4|mov|avi|mkv|webm)$/i) || url.startsWith('data:video/')) ? 'video' : 'image', url })))}
                                                    className="p-3 bg-zinc-50 text-zinc-300 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm"
                                                >
                                                    <Camera size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    <AnimatePresence>
                                        {expandedRows.has(r._id) && (
                                            <motion.tr 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-zinc-50/50"
                                            >
                                                <td colSpan={5} className="p-0">
                                                    <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-zinc-100">
                                                        <div className="space-y-8">
                                                            <div>
                                                                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2 italic">
                                                                    <Package size={12} /> SKU Integrity
                                                                </h4>
                                                                <div className="p-6 bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm">
                                                                    <p className="text-xs font-black uppercase italic leading-tight">{r.orderItem?.name}</p>
                                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase mt-3 tracking-widest">REF: {r.orderItem?.itemId} • QTY: {r.orderItem?.qty}</p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2 italic">
                                                                    <History size={12} /> Claim Commentary
                                                                </h4>
                                                                <p className="text-xs text-zinc-600 font-medium bg-white p-6 rounded-[2.5rem] border border-zinc-100 leading-relaxed italic shadow-inner">
                                                                    "{r.comment || 'No supplementary intelligence provided.'}"
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-8">
                                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2 italic">
                                                                <Camera size={12} /> Visual Evidence
                                                            </h4>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                {r.images?.map((img: string, i: number) => (
                                                                    <div key={i} onClick={() => setViewMedia([{ url: img, type: (img.match(/\.(mp4|mov|avi|mkv|webm)$/i)) ? 'video' : 'image' }])} className="aspect-square bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:scale-105 transition-all cursor-zoom-in shadow-sm p-1">
                                                                        <img src={resolveMediaURL(img)} alt="" className="w-full h-full object-cover rounded-xl" />
                                                                    </div>
                                                                ))}
                                                                {(!r.images || r.images.length === 0) && (
                                                                    <div className="col-span-3 p-10 border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-center">
                                                                        <AlertCircle size={24} className="mx-auto text-zinc-200 mb-3" />
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 italic">No evidence detected</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-8">
                                                            <div className="p-8 bg-black rounded-[3rem] shadow-2xl relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[60px] rounded-full" />
                                                                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                                                    <User size={12} /> Client Identity
                                                                </h4>
                                                                <p className="text-lg font-black text-white italic tracking-tighter uppercase">{r.user?.firstName} {r.user?.lastName}</p>
                                                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1 italic">{r.user?.email}</p>
                                                                <div className="mt-8 pt-8 border-t border-white/10">
                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-2">Protocol Reference</p>
                                                                    <p className="text-[10px] font-mono text-zinc-400 tracking-tighter">BATCH-CL-RTN-{r._id.slice(-8).toUpperCase()}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                            {returns.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-40 text-center">
                                        <RefreshCw size={40} className="mx-auto text-zinc-100 mb-6 animate-pulse" />
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-300">Operational Log Clear</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-10 bg-zinc-50/50 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Operational Capacity: <span className="text-zinc-900">{total} ACTIVE CLAIMS</span> • Page {page} / {pages}
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-8 py-3.5 bg-white border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-50 transition-all shadow-sm"
                        >
                            Previous
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page === pages || loading}
                            className="px-8 py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-black/10 italic"
                        >
                            Next Cycle
                        </button>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX */}
            <AnimatePresence>
                {viewMedia && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewMedia(null)}
                        className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[500] flex flex-col items-center justify-center p-10"
                    >
                         <button className="absolute top-10 right-10 p-5 bg-white/10 text-white rounded-full hover:bg-red-500 transition-all border border-white/20">
                            <X size={32} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full" onClick={e => e.stopPropagation()}>
                            {viewMedia.map((media, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="aspect-square bg-black rounded-[3rem] overflow-hidden border border-white/10 group shadow-2xl"
                                >
                                    {media.type === 'video' ? (
                                        <video src={resolveMediaURL(media.url)} controls className="w-full h-full object-contain" />
                                    ) : (
                                        <img src={resolveMediaURL(media.url)} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
