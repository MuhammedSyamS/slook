'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { Save, Search, AlertCircle, ArrowLeft, Loader2, Edit3, Package, Layers } from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface Product {
    _id: string;
    name: string;
    price: number;
    countInStock: number;
    category: string;
    isActive: boolean;
    image: string;
}

interface EditDraft {
    price?: number;
    countInStock?: number;
    category?: string;
    isActive?: boolean;
}

export const AdminBulkEditorView = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { addToast } = useToast();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [stockReason, setStockReason] = useState('Admin Adjustment');
    const [stockNote, setStockNote] = useState('');
    const [edits, setEdits] = useState<Record<string, EditDraft>>({});

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/products');
            setProducts(data.products || (Array.isArray(data) ? data : []));
        } catch (err: any) {
            addToast("Inventory sync failed", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleEdit = (productId: string, field: keyof EditDraft, value: any) => {
        setEdits(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value
            }
        }));
    };

    const saveAll = async () => {
        const editsArray = Object.values(edits);
        const hasStockEdit = editsArray.some(e => e.countInStock !== undefined);

        if (hasStockEdit && !stockReason) {
            addToast("Please provide a reason for stock changes", "error");
            return;
        }

        const updatedCount = Object.keys(edits).length;
        if (updatedCount === 0) return;

        setSaving(true);
        try {
            await api.put('/products/bulk-update', {
                edits,
                stockReason: hasStockEdit ? stockReason : undefined,
                stockNote: hasStockEdit ? stockNote : undefined
            });
            addToast(`Successfully updated ${updatedCount} products`, "success");
            setEdits({});
            setStockNote('');
            await fetchProducts();
        } catch (err: any) {
            addToast(err.response?.data?.message || "Bulk update failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
            const matchesStock = !showLowStockOnly || p.countInStock < 5;
            return matchesSearch && matchesCategory && matchesStock;
        });
    }, [products, searchTerm, filterCategory, showLowStockOnly]);

    const bulkToggleStatus = (active: boolean) => {
        const newEdits = { ...edits };
        filteredProducts.forEach(p => {
            newEdits[p._id] = {
                ...newEdits[p._id],
                isActive: active
            };
        });
        setEdits(newEdits);
        addToast(`Marked ${filteredProducts.length} items as ${active ? 'Active' : 'Disabled'}`, "info");
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="animate-spin text-zinc-900" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Accessing Inventory Cache...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <button onClick={() => router.push('/admin/products')} className="flex items-center gap-2 text-zinc-400 hover:text-black transition mb-4 text-[9px] font-black uppercase tracking-[0.2em] italic">
                        <ArrowLeft size={12} /> Return to Warehouse
                    </button>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 leading-none mb-2">
                        Bulk <span className="text-zinc-400">Inventory</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded shadow-lg">ADMIN-CORE</div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Registry Batch Processing (MNCS-BULK)</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={saveAll}
                        disabled={saving || Object.keys(edits).length === 0}
                        className={`
                            flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
                            ${Object.keys(edits).length > 0
                                ? 'bg-black text-white hover:scale-105 shadow-2xl active:scale-95'
                                : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'}
                        `}
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Commit Sequence ({Object.keys(edits).length} staged)
                    </button>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col lg:flex-row gap-6 items-center bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Layers size={120} />
                </div>
                
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="FILTER REGISTRY BY PRODUCT NAME OR CATEGORY..."
                        className="w-full pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-50 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 ring-black outline-none transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <select
                        className="bg-zinc-50 border border-zinc-50 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-black transition-all shadow-inner cursor-pointer"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">All Intelligence Segments</option>
                        <option value="Home Decor">Home Decor</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Lighting">Lighting</option>
                        <option value="Kitchenware">Kitchenware</option>
                        <option value="Textiles">Textiles</option>
                    </select>

                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${showLowStockOnly ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-zinc-50 text-zinc-400 border border-zinc-100 hover:border-black'}`}
                    >
                        Focus Low Assets
                    </button>
                </div>

                <div className="flex items-center gap-3 pt-6 lg:pt-0 lg:border-l border-zinc-100 lg:pl-6 w-full lg:w-auto">
                    <button
                        onClick={() => bulkToggleStatus(true)}
                        className="flex-1 lg:flex-none px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                    >
                        Activate Batch
                    </button>
                    <button
                        onClick={() => bulkToggleStatus(false)}
                        className="flex-1 lg:flex-none px-6 py-4 bg-red-50 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    >
                        Disable Batch
                    </button>
                </div>
            </div>

            {/* STAGING ALERTS */}
            <AnimatePresence>
                {(Object.keys(edits).length > 0 || Object.values(edits).some(e => e.countInStock !== undefined)) && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-6 bg-amber-50 border border-amber-100 p-6 rounded-[2rem] text-amber-800 shadow-sm">
                            <AlertCircle size={24} className="shrink-0 animate-pulse" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Staging Area Active</p>
                                <p className="text-[10px] font-bold uppercase tracking-tighter opacity-70 italic">
                                    {Object.keys(edits).length} Assets modified. Commit to database for permanent effect.
                                </p>
                            </div>
                        </div>

                        {Object.values(edits).some(e => e.countInStock !== undefined) && (
                            <div className="flex flex-col md:flex-row gap-4 bg-zinc-950 p-6 rounded-[2rem] shadow-2xl">
                                <div className="flex-1">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-2 italic">Ajustment Reason</label>
                                    <select
                                        value={stockReason}
                                        onChange={(e) => setStockReason(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-1 ring-violet-500 transition-all"
                                    >
                                        <option value="Admin Adjustment">Admin Adjustment</option>
                                        <option value="Restock">Restock Cycle</option>
                                        <option value="Correction">Audit Correction</option>
                                        <option value="Damaged/Loss">Damage / Logistical Loss</option>
                                    </select>
                                </div>
                                <div className="flex-[2]">
                                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-2 italic">Intelligence Note</label>
                                    <input
                                        type="text"
                                        placeholder="INPUT PROTOCOL NOTE..."
                                        value={stockNote}
                                        onChange={(e) => setStockNote(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-1 ring-violet-500 placeholder:text-zinc-700 transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PRODUCT LIST / TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Inventory Fragment</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 w-48">Market Price (₹)</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 w-48">Asset Count</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 w-64">Intelligence Log</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 w-40 text-right">Visibility</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredProducts.map(product => {
                                const isStaged = edits[product._id];
                                return (
                                    <tr key={product._id} className={`group hover:bg-zinc-50/50 transition-all duration-300 ${isStaged ? 'bg-violet-50/30' : ''}`}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="relative shrink-0">
                                                    <img src={resolveMediaURL(product.image)} alt="" className="w-16 h-16 object-cover rounded-2xl bg-zinc-100 shadow-md transition-transform group-hover:scale-110" />
                                                    {isStaged && <div className="absolute -top-2 -right-2 w-4 h-4 bg-violet-600 border-2 border-white rounded-full animate-pulse shadow-lg" />}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-tight text-zinc-900 group-hover:text-violet-600 transition-colors">{product.name}</p>
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">UUID: {product._id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="relative group/input">
                                                <input
                                                    type="number"
                                                    className={`
                                                        w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-[11px] font-black outline-none focus:ring-2 ring-black transition-all shadow-inner tabular-nums
                                                        ${edits[product._id]?.price !== undefined ? 'bg-white border-violet-500 text-violet-600 ring-violet-500 shadow-xl' : ''}
                                                    `}
                                                    defaultValue={product.price}
                                                    onChange={(e) => handleEdit(product._id, 'price', Number(e.target.value))}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <input
                                                type="number"
                                                className={`
                                                    w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-[11px] font-black outline-none focus:ring-2 ring-black transition-all shadow-inner tabular-nums
                                                    ${edits[product._id]?.countInStock !== undefined ? 'bg-white border-violet-500 text-violet-600 ring-violet-500 shadow-xl' : ''}
                                                `}
                                                defaultValue={product.countInStock}
                                                onChange={(e) => handleEdit(product._id, 'countInStock', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-10 py-8">
                                            <select
                                                className={`
                                                    w-full bg-zinc-50 border border-zinc-50 rounded-xl px-5 py-3 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-black appearance-none cursor-pointer transition-all shadow-inner
                                                    ${edits[product._id]?.category !== undefined ? 'bg-white border-violet-500 text-violet-600 ring-violet-500 shadow-xl' : ''}
                                                `}
                                                defaultValue={product.category}
                                                onChange={(e) => handleEdit(product._id, 'category', e.target.value)}
                                            >
                                                <option value="Home Decor">Home Decor</option>
                                                <option value="Furniture">Furniture</option>
                                                <option value="Lighting">Lighting</option>
                                                <option value="Kitchenware">Kitchenware</option>
                                                <option value="Textiles">Textiles</option>
                                            </select>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => handleEdit(product._id, 'isActive', !(edits[product._id]?.isActive ?? product.isActive))}
                                                className={`
                                                    px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 active:scale-95
                                                    ${(edits[product._id]?.isActive ?? product.isActive)
                                                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                                                        : 'bg-zinc-100 text-zinc-400 border-zinc-200'}
                                                `}
                                            >
                                                {(edits[product._id]?.isActive ?? product.isActive) ? 'ACTIVE' : 'OFFLINE'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
