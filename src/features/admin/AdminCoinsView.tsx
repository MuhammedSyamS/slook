'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    Search, Coins, ArrowUpRight, ArrowDownLeft, 
    History, User, Plus, Minus, Filter, Clock
} from 'lucide-react';
import Price from '@/components/shared/Price';

export const AdminCoinsView = () => {
    const { user: currentUser } = useAuthStore();
    const { success, error: toastError } = useToast();
    
    // USERS LIST STATE
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    
    // TRANSACTIONS STATE
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'history' | 'settings'>('users');

    // GLOBAL SETTINGS STATE
    const [globalSettings, setGlobalSettings] = useState<any>(null);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    
    // ADJUSTMENT MODAL STATE
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustType, setAdjustType] = useState('bonus');
    const [adjustDesc, setAdjustDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = useCallback(async (p = 1, search = '') => {
        try {
            setLoadingUsers(true);
            const { data } = await api.get(`/users?page=${p}&search=${search}`);
            setUsers(data.users || []);
            setPages(data.pages || 1);
            setPage(data.page || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoadingTransactions(true);
            const { data } = await api.get('/users/admin/loyalty-transactions');
            setTransactions(data.transactions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    const fetchGlobalSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/settings');
            setGlobalSettings(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Optimized Effect: Debounce Search & Fetch only for active tab
    useEffect(() => {
        if (activeTab !== 'users') return;
        
        const timeoutId = setTimeout(() => {
            fetchUsers(1, searchTerm);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, activeTab, fetchUsers]);

    // Fetch data based on tab
    useEffect(() => {
        if (activeTab === 'history') {
            fetchTransactions();
        } else if (activeTab === 'settings') {
            fetchGlobalSettings();
        }
    }, [activeTab, fetchTransactions, fetchGlobalSettings]);

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            await api.put('/settings', globalSettings);
            success("Global coin settings updated successfully");
        } catch (err: any) {
            toastError("Failed to update settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleAdjustCoins = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !adjustAmount || isNaN(Number(adjustAmount))) {
            return toastError("Please enter a valid amount");
        }

        setIsSubmitting(true);
        try {
            await api.put(`/users/${selectedUser._id}/coins`, {
                amount: Number(adjustAmount),
                type: adjustType,
                description: adjustDesc || `Admin adjustment by ${currentUser?.firstName}`
            });
            
            success(`Successfully updated coins for ${selectedUser.firstName}`);
            setSelectedUser(null);
            setAdjustAmount('');
            setAdjustDesc('');
            fetchUsers(page, searchTerm);
        } catch (err: any) {
            toastError(err.response?.data?.message || "Adjustment failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'earn': return 'text-green-600 bg-green-50';
            case 'bonus': return 'text-amber-600 bg-amber-50';
            case 'spend': return 'text-red-600 bg-red-50';
            case 'expire': return 'text-zinc-600 bg-zinc-50';
            case 'refund': return 'text-blue-600 bg-blue-50';
            default: return 'text-zinc-500 bg-zinc-50';
        }
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Slook <span className="text-zinc-400">Coins</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Loyalty Program & Wallet Administration</p>
                </div>
                <div className="flex gap-2 bg-zinc-100 p-1 rounded-full">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:text-black'}`}
                    >
                        User Balances
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:text-black'}`}
                    >
                        Audit Trail
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:text-black'}`}
                    >
                        Configuration
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <>
                    <div className="mb-6 flex justify-between items-center">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name, email or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3 rounded-full bg-white border border-zinc-100 focus:border-black outline-none text-xs font-bold uppercase tracking-widest shadow-sm w-full transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-zinc-50 border-b border-zinc-100 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        <th className="px-8 py-6">User</th>
                                        <th className="px-8 py-6">Tier</th>
                                        <th className="px-8 py-6 text-center">Current Balance</th>
                                        <th className="px-8 py-6 text-center">Total Spent</th>
                                        <th className="px-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {loadingUsers ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center text-[10px] font-bold uppercase text-zinc-400">Loading Balances...</td></tr>
                                    ) : users.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center text-[10px] font-bold uppercase text-zinc-400">No users found</td></tr>
                                    ) : users.map(u => (
                                        <tr key={u._id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 uppercase">
                                                        {u.firstName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold uppercase">{u.firstName} {u.lastName}</div>
                                                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                                    u.membershipTier === 'Platinum' ? 'bg-zinc-900 text-white border-zinc-900' :
                                                    u.membershipTier === 'Gold' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                    u.membershipTier === 'Silver' ? 'bg-zinc-50 text-zinc-600 border-zinc-200' :
                                                    'bg-orange-50 text-orange-600 border-orange-200'
                                                }`}>
                                                    {u.membershipTier || 'Bronze'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Coins size={14} className="text-amber-500" />
                                                    <span className="text-sm font-black tracking-tight">{u.loyaltyPoints || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Price amount={u.totalSpent || 0} className="text-[11px] font-bold text-zinc-500" />
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button 
                                                    onClick={() => setSelectedUser(u)}
                                                    className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md active:scale-95"
                                                >
                                                    Adjust Coins
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : activeTab === 'history' ? (
                <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-100 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    <th className="px-8 py-6">Timestamp</th>
                                    <th className="px-8 py-6">User</th>
                                    <th className="px-8 py-6">Type</th>
                                    <th className="px-8 py-6">Amount</th>
                                    <th className="px-8 py-6">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {loadingTransactions ? (
                                    <tr><td colSpan={5} className="px-8 py-20 text-center text-[10px] font-bold uppercase text-zinc-400">Loading History...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-20 text-center text-[10px] font-bold uppercase text-zinc-400">No transactions recorded</td></tr>
                                ) : transactions.map(tx => (
                                    <tr key={tx._id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold">{new Date(tx.createdAt).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-[10px] font-bold uppercase">{tx.user?.firstName} {tx.user?.lastName}</div>
                                            <div className="text-[9px] text-zinc-400 font-medium">{tx.user?.email}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${getTypeColor(tx.type)}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`flex items-center gap-1 font-black ${tx.type === 'spend' || tx.type === 'expire' ? 'text-red-500' : 'text-green-500'}`}>
                                                {tx.type === 'spend' || tx.type === 'expire' ? <Minus size={10} /> : <Plus size={10} />}
                                                {tx.amount}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] text-zinc-600 font-medium italic max-w-xs truncate">{tx.description}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {globalSettings ? (
                        <form onSubmit={handleUpdateSettings} className="space-y-8">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Program Control */}
                                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-zinc-50 pb-4">Program Status</h3>
                                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest">Enable Slook Coins</p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Global toggle for earning and redeeming</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setGlobalSettings({...globalSettings, loyaltyPointsEnabled: !globalSettings.loyaltyPointsEnabled})}
                                            className={`w-12 h-6 rounded-full relative transition-all ${globalSettings.loyaltyPointsEnabled ? 'bg-green-500' : 'bg-zinc-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${globalSettings.loyaltyPointsEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className="mt-8 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Min Coins to Redeem</label>
                                            <input 
                                                type="number"
                                                value={globalSettings.minCoinsToRedeem}
                                                onChange={(e) => setGlobalSettings({...globalSettings, minCoinsToRedeem: Number(e.target.value)})}
                                                className="w-full px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-xs font-bold"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Coins Flat Cap</label>
                                                <input 
                                                    type="number"
                                                    value={globalSettings.maxCoinsPerOrder}
                                                    onChange={(e) => setGlobalSettings({...globalSettings, maxCoinsPerOrder: Number(e.target.value)})}
                                                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-xs font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max % of Order</label>
                                                <input 
                                                    type="number"
                                                    value={globalSettings.maxCoinsPercentage}
                                                    onChange={(e) => setGlobalSettings({...globalSettings, maxCoinsPercentage: Number(e.target.value)})}
                                                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-xs font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Earning Rates */}
                                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-zinc-50 pb-4">Earning Parameters</h3>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase mb-6 italic">Coins earned per ₹1,000 spent</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Online Rate</label>
                                            <input 
                                                type="number"
                                                step="0.1"
                                                value={globalSettings.earnRateOnline}
                                                onChange={(e) => setGlobalSettings({...globalSettings, earnRateOnline: Number(e.target.value)})}
                                                className="w-full px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-xs font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">COD Rate</label>
                                            <input 
                                                type="number"
                                                step="0.1"
                                                value={globalSettings.earnRateCOD}
                                                onChange={(e) => setGlobalSettings({...globalSettings, earnRateCOD: Number(e.target.value)})}
                                                className="w-full px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tier Multipliers</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['silver', 'gold', 'platinum'].map((tier) => (
                                                <div key={tier} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2">{tier}</p>
                                                    <input 
                                                        type="number"
                                                        step="0.1"
                                                        value={globalSettings[`${tier}Multiplier`]}
                                                        onChange={(e) => setGlobalSettings({...globalSettings, [`${tier}Multiplier`]: Number(e.target.value)})}
                                                        className="w-full bg-transparent outline-none text-xs font-black"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Tier Thresholds */}
                                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm xl:col-span-2">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-zinc-50 pb-4">Membership Thresholds (Spend Goal)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {['silver', 'gold', 'platinum'].map((tier) => (
                                            <div key={tier} className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{tier} Entry (₹)</label>
                                                <input 
                                                    type="number"
                                                    value={globalSettings[`${tier}Threshold`]}
                                                    onChange={(e) => setGlobalSettings({...globalSettings, [`${tier}Threshold`]: Number(e.target.value)})}
                                                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-xs font-bold"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-8">
                                <button 
                                    type="submit"
                                    disabled={isSavingSettings}
                                    className="px-12 py-5 bg-black text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
                                >
                                    {isSavingSettings ? 'Saving Configuration...' : 'Save Global Settings'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="py-20 text-center text-zinc-400 font-bold uppercase text-[10px]">Loading Settings...</div>
                    )}
                </div>
            )}

            {/* ADJUSTMENT MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-black p-8 text-white">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Adjust <span className="text-amber-400">Coins</span></h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">For {selectedUser.firstName} {selectedUser.lastName}</p>
                        </div>
                        
                        <form onSubmit={handleAdjustCoins} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transaction Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'bonus', label: 'Bonus (+) ', icon: <ArrowUpRight size={14} className="text-green-500" /> },
                                        { id: 'spend', label: 'Deduct (-)', icon: <ArrowDownLeft size={14} className="text-red-500" /> },
                                        { id: 'refund', label: 'Refund (+)', icon: <RefreshCw size={14} className="text-blue-500" /> },
                                        { id: 'expire', label: 'Expire (-)', icon: <Clock size={14} className="text-zinc-500" /> }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setAdjustType(type.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${adjustType === type.id ? 'border-black bg-black text-white' : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'}`}
                                        >
                                            {type.icon} {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Amount (Coins)</label>
                                <div className="relative">
                                    <Coins size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                                    <input 
                                        type="number"
                                        required
                                        placeholder="Enter amount..."
                                        value={adjustAmount}
                                        onChange={(e) => setAdjustAmount(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-sm font-black"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reason / Description</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Explain why this adjustment is being made..."
                                    value={adjustDesc}
                                    onChange={(e) => setAdjustDesc(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-black outline-none text-[11px] font-bold"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 px-8 py-4 rounded-2xl border border-zinc-100 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Processing...' : 'Apply Change'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Add missing icon
const RefreshCw = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
);
