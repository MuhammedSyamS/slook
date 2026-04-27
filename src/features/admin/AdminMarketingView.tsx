'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    Ticket, Zap, Plus, Minus, Trash2, Mail, Send, 
    Users, Clock, ShoppingCart, Pencil, Search, 
    ChevronRight, ExternalLink, RefreshCw, X, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const AdminMarketingView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('Coupons');
    
    // DATA STATES
    const [coupons, setCoupons] = useState<any[]>([]);
    const [flashSales, setFlashSales] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [referralStats, setReferralStats] = useState<any>(null);
    const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [togglingReferral, setTogglingReferral] = useState(false);
    
    // UI STATES
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
    const [editingFlashSaleId, setEditingFlashSaleId] = useState<string | null>(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);
    const [sending, setSending] = useState(false);
    const [previewContent, setPreviewContent] = useState<string | null>(null);

    // FORM STATES
    const [newCoupon, setNewCoupon] = useState<any>({
        code: '',
        discountType: 'percentage',
        discountAmount: '',
        minPurchase: '',
        expiryDate: '',
        isFirstOrderOnly: false,
        eligibleProducts: [],
        eligibleCategories: [],
        usageLimit: '',
        perUserLimit: '',
        specificUsers: []
    });

    const [newFlashSale, setNewFlashSale] = useState<any>({
        name: '',
        discountPercentage: '',
        startTime: '',
        endTime: '',
        products: []
    });

    const [newBroadcast, setNewBroadcast] = useState<any>({
        subject: '',
        content: '',
        targetAudience: 'Subscribers'
    });

    const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

    const fetchData = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            if (activeTab === 'Coupons') {
                const { data } = await api.get('/marketing/coupons');
                setCoupons(data);
                if (products.length === 0) {
                    const { data: pData } = await api.get('/products');
                    setProducts(pData.products || []);
                }
            } else if (activeTab === 'Flash Sales') {
                const { data } = await api.get('/marketing/flash-sales');
                setFlashSales(data);
                if (products.length === 0) {
                    const { data: pData } = await api.get('/products');
                    setProducts(pData.products || []);
                }
            } else if (activeTab === 'Campaigns') {
                const { data } = await api.get('/marketing/broadcasts');
                setBroadcasts(data);
            } else if (activeTab === 'Referrals') {
                const { data } = await api.get('/orders/admin/stats');
                setReferralStats({
                    topReferrers: data.topReferrers,
                    referralRevenue: data.referralRevenue
                });
                // Fetch settings for toggle
                const { data: sData } = await api.get('/settings');
                setSettings(sData);
            } else if (activeTab === 'Retargeting') {
                const { data } = await api.get('/users/admin/abandoned-carts');
                setAbandonedCarts(data);
            }
        } catch (err) {
            console.error("Marketing Fetch Error", err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, user?.token, products.length]);

    useEffect(() => {
        fetchData();
        setSearchQuery('');
    }, [fetchData]);

    const searchUsers = async (query: string) => {
        setUserSearchQuery(query);
        if (query.length < 2) {
            setFoundUsers([]);
            return;
        }
        try {
            const { data } = await api.get(`/users?search=${query}&pageSize=5`);
            setFoundUsers(data.users || []);
        } catch (err) {
            console.error(err);
        }
    };

    // --- COUPON ACTIONS ---
    const handleCouponSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newCoupon,
                specificUsers: newCoupon.specificUsers.map((u: any) => u._id || u)
            };
            if (editingCouponId) {
                await api.put(`/marketing/coupons/${editingCouponId}`, payload);
                addToast("Coupon Updated Successfully", "success");
            } else {
                await api.post('/marketing/coupons', payload);
                addToast("Coupon Created Successfully", "success");
            }
            setEditingCouponId(null);
            setNewCoupon({ code: '', discountType: 'percentage', discountAmount: '', minPurchase: '', expiryDate: '', isFirstOrderOnly: false, eligibleProducts: [], eligibleCategories: [], usageLimit: '', perUserLimit: '', specificUsers: [] });
            setShowAdvanced(false);
            fetchData();
        } catch (err) {
            addToast("Operation failed", "error");
        }
    };

    const startEditCoupon = (coupon: any) => {
        setEditingCouponId(coupon._id);
        setNewCoupon({
            code: coupon.code,
            discountType: coupon.discountType,
            discountAmount: coupon.discountAmount,
            minPurchase: coupon.minPurchase,
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
            isFirstOrderOnly: coupon.isFirstOrderOnly || false,
            eligibleProducts: coupon.eligibleProducts || [],
            eligibleCategories: coupon.eligibleCategories || [],
            usageLimit: coupon.usageLimit || '',
            perUserLimit: coupon.perUserLimit || '',
            specificUsers: coupon.specificUsers || []
        });
        setShowAdvanced(coupon.eligibleProducts?.length > 0 || coupon.eligibleCategories?.length > 0 || coupon.specificUsers?.length > 0);
    };

    const deleteCoupon = async (id: string) => {
        if (!window.confirm("Delete this coupon?")) return;
        try {
            await api.delete(`/marketing/coupons/${id}`);
            addToast("Coupon Deleted", "success");
            fetchData();
        } catch (err) {
            addToast("Failed to delete", "error");
        }
    };

    const toggleCouponStatus = async (id: string) => {
        try {
            await api.put(`/marketing/coupons/${id}/toggle`);
            addToast("Coupon status updated", "success");
            fetchData();
        } catch (err) {
            addToast("Toggle failed", "error");
        }
    };

    const handleFlashSaleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFlashSaleId) {
                await api.put(`/marketing/flash-sales/${editingFlashSaleId}`, newFlashSale);
                addToast("Flash Sale Updated", "success");
            } else {
                await api.post('/marketing/flash-sales', newFlashSale);
                addToast("Flash Sale Launched", "success");
            }
            setEditingFlashSaleId(null);
            setNewFlashSale({ name: '', discountPercentage: '', startTime: '', endTime: '', products: [] });
            fetchData();
        } catch (err) {
            addToast("Launch failed", "error");
        }
    };

    const startEditFlashSale = (sale: any) => {
        setEditingFlashSaleId(sale._id);
        setNewFlashSale({
            name: sale.name,
            discountPercentage: sale.discountPercentage,
            startTime: sale.startTime.substring(0, 16),
            endTime: sale.endTime.substring(0, 16),
            products: sale.products
        });
    };

    const sendBroadcast = async (e: React.FormEvent, status = 'Sent') => {
        if (e) e.preventDefault();
        if (status === 'Sent' && !window.confirm(`Send this campaign to all ${newBroadcast.targetAudience}? This cannot be undone.`)) return;

        setSending(true);
        try {
            const { data } = await api.post('/marketing/broadcasts', { ...newBroadcast, status });
            addToast(status === 'Sent' ? `Campaign Sent to ${data.sentCount} recipients` : "Campaign Saved as Draft", "success");
            fetchData();
            if (status === 'Sent') setNewBroadcast({ subject: '', content: '', targetAudience: 'Subscribers' });
        } catch (err) {
            addToast("Broadcast Error", "error");
        } finally {
            setSending(false);
        }
    };

    const sendNudge = async (userId: string) => {
        try {
            await api.post(`/users/admin/nudge/${userId}`);
            addToast("Recovery nudge sent!", "success");
            fetchData();
        } catch (err) {
            addToast("Failed to send nudge", "error");
        }
    };

    const toggleReferralSystem = async () => {
        setTogglingReferral(true);
        try {
            const newValue = !settings?.isReferralEnabled;
            await api.put('/settings', { isReferralEnabled: newValue });
            setSettings({ ...settings, isReferralEnabled: newValue });
            addToast(`Referral System ${newValue ? 'Enabled' : 'Disabled'}`, "success");
        } catch (err) {
            addToast("Failed to update settings", "error");
        } finally {
            setTogglingReferral(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            {/* Header */}
            <div className="mb-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-2">Growth Engine</p>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-black">Offers & <span className="text-zinc-300">Outreach</span></h1>
            </div>

            <div className="flex gap-6 mb-8 border-b border-zinc-100 pb-1 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('Coupons')} className={`flex items-center gap-2 pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'Coupons' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}>
                    <Ticket size={14} /> Coupons
                </button>
                <button onClick={() => setActiveTab('Flash Sales')} className={`flex items-center gap-2 pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'Flash Sales' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}>
                    <Zap size={14} /> Flash Sales
                </button>
                <button onClick={() => setActiveTab('Campaigns')} className={`flex items-center gap-2 pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'Campaigns' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}>
                    <Mail size={14} /> Campaigns
                </button>
                <button onClick={() => setActiveTab('Referrals')} className={`flex items-center gap-2 pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'Referrals' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}>
                    <Users size={14} /> Referrals
                </button>
                <button onClick={() => setActiveTab('Retargeting')} className={`flex items-center gap-2 pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'Retargeting' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}>
                    <Clock size={14} /> Retargeting
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="mt-8">
                {/* COUPONS TAB */}
                {activeTab === 'Coupons' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {coupons.length === 0 ? <div className="text-center py-10 text-zinc-400 uppercase font-black text-[10px] tracking-widest">No Active Coupons</div> : coupons.map((coupon: any) => (
                                <div key={coupon._id} className="bg-white p-6 rounded-2xl border border-zinc-100 flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${coupon.isActive ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                            {coupon.discountType === 'percentage' ? '%' : '₹'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-black text-lg tracking-tight uppercase italic ${!coupon.isActive && 'text-zinc-400 line-through'}`}>{coupon.code}</h3>
                                                <button onClick={() => { navigator.clipboard.writeText(coupon.code); addToast("Code copied", "success"); }} className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-black transition-colors">
                                                    <Plus size={12} className="rotate-45" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                                                {coupon.discountType === 'percentage' ? `${coupon.discountAmount}% OFF` : `₹${coupon.discountAmount} FLAT OFF`}
                                                {' • '} Min: ₹{coupon.minPurchase}
                                                {coupon.isFirstOrderOnly && <span className="text-blue-600 ml-2">★ First Order Only</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] font-bold uppercase text-zinc-400">Used</p>
                                            <p className="text-xs font-black">{coupon.usedCount || 0}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleCouponStatus(coupon._id)}
                                                className={`w-10 h-5 rounded-full relative transition-colors ${coupon.isActive ? 'bg-green-500' : 'bg-zinc-200'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${coupon.isActive ? 'right-1' : 'left-1'}`}></div>
                                            </button>
                                            <button onClick={() => startEditCoupon(coupon)} className="p-2 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => deleteCoupon(coupon._id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FORM */}
                        <div className="bg-zinc-50 p-8 rounded-3xl h-fit border border-zinc-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-lg uppercase italic">{editingCouponId ? 'Edit Coupon' : 'Create Coupon'}</h3>
                                {editingCouponId && (
                                    <button onClick={() => { setEditingCouponId(null); setNewCoupon({ code: '', discountType: 'percentage', discountAmount: '', minPurchase: '', expiryDate: '', isFirstOrderOnly: false, eligibleProducts: [], eligibleCategories: [], usageLimit: '', perUserLimit: '', specificUsers: [] }); setShowAdvanced(false); }} className="text-[9px] font-black uppercase text-red-500">Cancel</button>
                                )}
                            </div>
                            <form onSubmit={handleCouponSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-400">Code</label>
                                    <input required placeholder="e.g. SUMMER20" className="w-full bg-white p-3 rounded-xl text-sm font-bold uppercase outline-none focus:ring-2 ring-black/10"
                                        value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-zinc-400">Type</label>
                                        <select className="w-full bg-white p-3 rounded-xl text-xs font-bold uppercase outline-none"
                                            value={newCoupon.discountType} onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-zinc-400">Value</label>
                                        <input required type="number" placeholder="20" className="w-full bg-white p-3 rounded-xl text-sm font-bold outline-none"
                                            value={newCoupon.discountAmount} onChange={e => setNewCoupon({ ...newCoupon, discountAmount: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-zinc-400">Min Purchase</label>
                                        <input required type="number" placeholder="1000" className="w-full bg-white p-3 rounded-xl text-sm font-bold outline-none"
                                            value={newCoupon.minPurchase} onChange={e => setNewCoupon({ ...newCoupon, minPurchase: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-zinc-400">Expiry</label>
                                        <input required type="date" className="w-full bg-white p-3 rounded-xl text-xs font-bold outline-none"
                                            value={newCoupon.expiryDate} onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })} />
                                    </div>
                                </div>

                                {/* ADVANCED TOGGLE */}
                                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="pt-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-zinc-400 hover:text-black transition-colors">
                                    {showAdvanced ? <Minus size={12} /> : <Plus size={12} />}
                                    {showAdvanced ? 'Simple Mode' : 'Advanced Targeting'}
                                </button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 border-l-2 border-zinc-200 pl-4 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-zinc-400">Eligible Categories</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {categories.map((cat: string) => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setNewCoupon((prev: any) => ({
                                                                ...prev,
                                                                eligibleCategories: prev.eligibleCategories.includes(cat) ? prev.eligibleCategories.filter((c: any) => c !== cat) : [...prev.eligibleCategories, cat]
                                                            }))}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border ${newCoupon.eligibleCategories.includes(cat) ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200'}`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-zinc-400 block">Identities (Whitelist)</label>
                                                <input 
                                                    placeholder="Search users..." 
                                                    value={userSearchQuery}
                                                    onChange={e => searchUsers(e.target.value)}
                                                    className="w-full bg-white p-2 rounded-lg text-xs font-bold border border-zinc-100 outline-none"
                                                />
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {newCoupon.specificUsers.map((u: any) => (
                                                        <div key={u._id || u} className="bg-zinc-900 text-white px-3 py-1 rounded-full text-[9px] font-bold flex items-center gap-2">
                                                            {u.firstName || 'User'}
                                                            <button onClick={() => setNewCoupon((prev: any) => ({ ...prev, specificUsers: prev.specificUsers.filter((item: any) => (item._id || item) !== (u._id || u)) }))}>
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isFirst" checked={newCoupon.isFirstOrderOnly} onChange={e => setNewCoupon({ ...newCoupon, isFirstOrderOnly: e.target.checked })} />
                                    <label htmlFor="isFirst" className="text-[10px] font-black uppercase text-zinc-500">First Order Only</label>
                                </div>

                                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform">
                                    {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* FLASH SALES TAB */}
                {activeTab === 'Flash Sales' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {flashSales.length === 0 ? <div className="text-center py-10 text-zinc-400 uppercase font-black text-[10px] tracking-widest">No Active Sales</div> : flashSales.map((sale: any) => (
                                <div key={sale._id} className="bg-white p-6 rounded-2xl border border-zinc-100 flex items-center justify-between group hover:shadow-lg transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 bg-red-500 text-white text-[9px] font-black uppercase rounded-bl-xl z-20">
                                        {sale.discountPercentage}% OFF
                                    </div>
                                    <div className="flex items-center gap-4 z-10">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black shadow-inner transition-colors ${sale.isActive ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h3 className={`font-black text-lg tracking-tight uppercase italic ${!sale.isActive && 'text-zinc-400 line-through'}`}>{sale.name}</h3>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                                                {new Date(sale.startTime).toLocaleString()} - {new Date(sale.endTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 z-10">
                                        <button onClick={() => startEditFlashSale(sale)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => { if(window.confirm("Delete sale?")) api.delete(`/marketing/flash-sales/${sale._id}`).then(fetchData); }} className="p-2 hover:bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-zinc-50 p-8 rounded-3xl h-fit border border-zinc-100 shadow-sm">
                            <h3 className="font-black text-lg uppercase italic mb-6">{editingFlashSaleId ? 'Edit Flash Sale' : 'Launch Flash Sale'}</h3>
                            <form onSubmit={handleFlashSaleSubmit} className="space-y-4">
                                <input required placeholder="SALE NAME" className="w-full bg-white p-3 rounded-xl text-sm font-bold uppercase border border-zinc-100 outline-none"
                                    value={newFlashSale.name} onChange={e => setNewFlashSale({ ...newFlashSale, name: e.target.value })} />
                                <input required type="number" placeholder="DISCOUNT %" className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-zinc-100 outline-none"
                                    value={newFlashSale.discountPercentage} onChange={e => setNewFlashSale({ ...newFlashSale, discountPercentage: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="datetime-local" className="w-full bg-white p-3 rounded-xl text-[10px] font-black border border-zinc-100 outline-none"
                                        value={newFlashSale.startTime} onChange={e => setNewFlashSale({ ...newFlashSale, startTime: e.target.value })} />
                                    <input required type="datetime-local" className="w-full bg-white p-3 rounded-xl text-[10px] font-black border border-zinc-100 outline-none"
                                        value={newFlashSale.endTime} onChange={e => setNewFlashSale({ ...newFlashSale, endTime: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform shadow-lg">
                                    {editingFlashSaleId ? 'Update Sale' : 'Start Sale'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* CAMPAIGNS TAB */}
                {activeTab === 'Campaigns' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {broadcasts.map((broadcast: any) => (
                                <div key={broadcast._id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-black text-lg tracking-tight uppercase italic">{broadcast.subject}</h3>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-2">
                                                <Users size={12} /> {broadcast.targetAudience} • {new Date(broadcast.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${broadcast.status === 'Sent' ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                            {broadcast.status}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 border rounded-xl text-xs text-zinc-600 line-clamp-3">
                                        <div dangerouslySetInnerHTML={{ __html: broadcast.content }} />
                                    </div>
                                    <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase text-zinc-400">
                                        <span>Sent To: {broadcast.sentCount} Users</span>
                                        <button onClick={() => setPreviewContent(broadcast.content)} className="p-1 hover:text-black"><Eye size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-zinc-50 p-8 rounded-3xl h-fit border border-zinc-100 shadow-sm">
                            <h3 className="font-black text-lg uppercase italic mb-6">New Campaign</h3>
                            <form onSubmit={(e) => sendBroadcast(e, 'Sent')} className="space-y-4">
                                <input required placeholder="SUBJECT" className="w-full bg-white p-3 rounded-xl text-sm font-bold uppercase border border-zinc-100 outline-none"
                                    value={newBroadcast.subject} onChange={e => setNewBroadcast({ ...newBroadcast, subject: e.target.value })} />
                                <select className="w-full bg-white p-3 rounded-xl text-[10px] font-black uppercase border border-zinc-100 outline-none"
                                    value={newBroadcast.targetAudience} onChange={e => setNewBroadcast({ ...newBroadcast, targetAudience: e.target.value })}>
                                    <option value="Subscribers">Subscribers</option>
                                    <option value="Customers">Active Customers</option>
                                    <option value="All">Everyone</option>
                                </select>
                                <textarea required rows={7} placeholder="HTML Content..." className="w-full bg-white p-3 rounded-xl text-xs font-medium border border-zinc-100 outline-none font-mono resize-none"
                                    value={newBroadcast.content} onChange={e => setNewBroadcast({ ...newBroadcast, content: e.target.value })} />
                                <div className="flex gap-2">
                                    <button type="submit" disabled={sending} className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                                        <Send size={14} /> {sending ? 'Sending...' : 'Send Broadcast'}
                                    </button>
                                    <button type="button" onClick={() => setPreviewContent(newBroadcast.content)} className="p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all">
                                        <Eye size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* REFERRALS TAB */}
                {activeTab === 'Referrals' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-black text-white p-10 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-center min-h-[250px] shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[100px]" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Growth Performance</p>
                                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${settings?.isReferralEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/70">System {settings?.isReferralEnabled ? 'Live' : 'Paused'}</span>
                                            <button 
                                                onClick={toggleReferralSystem}
                                                disabled={togglingReferral}
                                                className={`w-8 h-4 rounded-full relative transition-all ${settings?.isReferralEnabled ? 'bg-green-500' : 'bg-zinc-700'} ${togglingReferral ? 'opacity-50' : 'hover:scale-110 active:scale-90'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings?.isReferralEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <h2 className="text-5xl font-black italic tracking-tighter mb-4">₹{referralStats?.referralRevenue?.toLocaleString() || 0}</h2>
                                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Total Referral Revenue</p>
                                </div>
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <Users size={200} />
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden">
                                <h3 className="font-black text-lg uppercase italic mb-8 flex items-center gap-3"><Users size={20} className="text-purple-600" /> Top Referrers</h3>
                                <div className="space-y-4">
                                    {referralStats?.topReferrers?.map((ref: any, idx: number) => (
                                        <div key={ref._id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                                                <div>
                                                    <p className="text-xs font-black uppercase italic">{ref.name}</p>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">{ref.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-green-600 italic">₹{ref.referralEarnings.toLocaleString()}</p>
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase">{ref.conversions} Impact Nodes</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            {[
                                { title: "Inviter Reward", value: "₹500", desc: "Added to wallet after friend's first order delivery." },
                                { title: "Friend Discount", value: "10% OFF", desc: "Applied via referral link signup code." },
                                { title: "Eligibility", value: "Verified", desc: "Credit issued after lifecycle completion." }
                            ].map((rule: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">{rule.title}</p>
                                    <h4 className="text-2xl font-black italic">{rule.value}</h4>
                                    <p className="text-[11px] text-zinc-400 font-medium px-4">{rule.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RETARGETING TAB */}
                {activeTab === 'Retargeting' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Abandoned Sessions</p>
                                <h4 className="text-4xl font-black italic">{abandonedCarts.length}</h4>
                            </div>
                            <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-[2rem] shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Avg. Conversion Gap</p>
                                <h4 className="text-4xl font-black italic">
                                    ₹{abandonedCarts.length > 0
                                        ? Math.round(abandonedCarts.reduce((acc, c) => acc + (c.cart?.reduce((ia: any, it: any) => ia + (it.price * it.quantity), 0) || 0), 0) / abandonedCarts.length).toLocaleString()
                                        : 0}
                                </h4>
                            </div>
                        </div>

                        <div className="bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/50">
                                <h3 className="font-black text-lg uppercase italic flex items-center gap-3">
                                    <ShoppingCart size={20} className="text-amber-500" /> Abandoned Bag Recovery
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-zinc-50 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                            <th className="px-8 py-5">Customer</th>
                                            <th className="px-8 py-5">Value</th>
                                            <th className="px-8 py-5">Last Activity</th>
                                            <th className="px-8 py-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {abandonedCarts.length === 0 ? <tr><td colSpan={4} className="py-20 text-center text-zinc-400 text-[10px] uppercase font-black">No leaks detected</td></tr> : abandonedCarts.map((cartUser: any) => {
                                            const total = cartUser.cart?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
                                            return (
                                                <tr key={cartUser._id} className="hover:bg-zinc-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs font-black uppercase italic">{cartUser.firstName} {cartUser.lastName}</p>
                                                        <p className="text-[9px] text-zinc-400 font-bold uppercase">{cartUser.email}</p>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-sm italic tabular-nums">₹{total.toLocaleString()}</td>
                                                    <td className="px-8 py-6 text-[10px] font-bold text-zinc-500 uppercase">{new Date(cartUser.updatedAt).toLocaleDateString()}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button onClick={() => sendNudge(cartUser._id)} className="px-6 py-2 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black hover:bg-amber-600 hover:text-white transition-all shadow-sm">
                                                            SEND RECOVERY NUDGE
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
                )}
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {previewContent && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-4xl h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b flex justify-between items-center bg-zinc-50">
                                <h3 className="font-black text-xl uppercase italic">Campaign Preview</h3>
                                <button onClick={() => setPreviewContent(null)} className="p-3 bg-white text-black rounded-full shadow-sm hover:scale-110 active:scale-90 transition-all"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 bg-zinc-100/30">
                                <div className="mx-auto max-w-2xl bg-white shadow-2xl rounded-xl p-8 border" dangerouslySetInnerHTML={{ __html: previewContent }} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
