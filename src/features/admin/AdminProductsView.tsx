'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { 
    Package, IndianRupee, Plus, Trash2, Edit, 
    ExternalLink, Search, RefreshCw, ChevronRight, ChevronLeft 
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const AdminProductsView = () => {
    const router = useRouter();
    const { addToast } = useToast();
    const { user } = useAuthStore();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchAdminData = useCallback(async (p = 1, search = '') => {
        try {
            setLoading(true);
            const res = await api.get(`/products?page=${p}&search=${search}&t=${Date.now()}`);
            const data = res.data;
            setProducts(data.products || []);
            setPage(data.page || 1);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            console.error("Admin Fetch Error:", err);
            addToast("Failed to fetch inventory", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAdminData(1, searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchAdminData]);

    const handleRefresh = () => {
        fetchAdminData(page, searchTerm);
        addToast("Inventory Refreshed", "success");
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Permanently archive this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p._id !== id));
            addToast("Product archived", "success");
        } catch (err) {
            addToast("Archive failed", "error");
        }
    };

    if (loading && page === 1) return (
        <div className="h-[60vh] flex items-center justify-center font-bold uppercase tracking-widest text-[10px] text-zinc-400">
            Initialising Studio Logic...
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 font-sans">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Studio <span className="text-zinc-400">Inventory</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Registry Management (MNCS-INTL)</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                        <input
                            placeholder="Find Pieces..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 rounded-full bg-white border border-zinc-100 focus:border-black outline-none text-xs font-bold uppercase tracking-widest shadow-sm w-full md:w-64 transition-all"
                        />
                    </div>
                    <Link
                        href="/admin/products/add"
                        className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                    >
                        <Plus size={14} /> Add New Piece
                    </Link>
                    <button onClick={handleRefresh} className="p-3 bg-zinc-100 rounded-full text-zinc-400 hover:text-black hover:rotate-180 transition-all shadow-sm">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 border border-zinc-200 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Active Collection</p>
                        <h3 className="text-3xl font-black tracking-tighter tabular-nums">{total} <span className="text-zinc-300 text-lg uppercase font-bold">Pieces</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center shadow-lg shadow-zinc-200">
                        <Package className="text-white" size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 border border-zinc-200 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Registry Capital Valuation</p>
                        <h3 className="text-3xl font-black tracking-tighter tabular-nums">
                            ₹{products.reduce((acc, curr) => acc + ((typeof curr.price === 'number' ? curr.price : 0) * (curr.countInStock || 0)), 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center">
                        <IndianRupee className="text-zinc-900" size={20} />
                    </div>
                </div>
            </div>

            {/* PRODUCT LEDGER */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Reference Piece</th>
                                <th className="px-6 py-4">Taxonomy</th>
                                <th className="px-6 py-4">Financials</th>
                                <th className="px-6 py-4">Inventory</th>
                                <th className="px-6 py-4 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {products.map((product) => (
                                <tr key={product._id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-sm bg-zinc-50 border border-zinc-100 overflow-hidden flex-shrink-0">
                                                <img src={resolveMediaURL(product.image) || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-tight text-zinc-900">{product.name}</div>
                                                <div className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5 tabular-nums">
                                                    ID: #{product._id.slice(-6).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                                            {product.category || "General"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-zinc-900 tabular-nums">₹{(product.price || 0).toLocaleString()}</div>
                                        <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Base Rate</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-[10px] font-black tabular-nums ${product.countInStock > 5 ? 'text-zinc-900' : 'text-red-600'}`}>
                                            {product.countInStock || 0} PCS
                                        </div>
                                        <div className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${product.countInStock > 0 ? 'text-zinc-400' : 'text-red-500'}`}>
                                            {product.countInStock > 0 ? 'In Stock' : 'Depleted'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/product/${product.slug}`)}
                                                className="px-3 py-1.5 bg-zinc-50 text-zinc-500 rounded-md hover:text-black hover:bg-zinc-200 transition-all border border-zinc-200 flex items-center gap-1"
                                                title="View Piece"
                                            >
                                                <ExternalLink size={12} />
                                                <span className="text-[9px] font-bold uppercase">View</span>
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/products/edit/${product._id}`)}
                                                className="px-3 py-1.5 bg-zinc-950 text-white rounded-md hover:bg-zinc-800 transition-all flex items-center gap-1 shadow-md shadow-zinc-200"
                                                title="Edit Data"
                                            >
                                                <Edit size={12} />
                                                <span className="text-[9px] font-bold uppercase">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="px-3 py-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-all border border-red-100 flex items-center gap-1"
                                                title="Archive Piece"
                                            >
                                                <Trash2 size={12} />
                                                <span className="text-[9px] font-bold uppercase">Delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION LOGIC */}
                <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Showing Page {page} of {pages} (<span className="text-zinc-900">{total} Items</span>)
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => { setPage(p => Math.max(1, p - 1)); fetchAdminData(page - 1, searchTerm); }}
                            disabled={page === 1 || loading}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-zinc-200 rounded text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-100 transition-all"
                        >
                            <ChevronLeft size={12} /> Prev
                        </button>
                        <button 
                            onClick={() => { setPage(p => Math.min(pages, p + 1)); fetchAdminData(page + 1, searchTerm); }}
                            disabled={page === pages || loading}
                            className="flex items-center gap-1 px-4 py-2 bg-black text-white rounded text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-800 transition-all shadow-md"
                        >
                            Next <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
