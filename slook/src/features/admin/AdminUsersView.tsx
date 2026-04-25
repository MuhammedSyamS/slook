'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { Trash2, Search, CheckCircle, Ban, Shield } from 'lucide-react';

export const AdminUsersView = () => {
    const { user, setUser } = useAuthStore();
    const { addToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    // PERMISSIONS EDITOR STATE
    const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
    const [tempPermissions, setTempPermissions] = useState<string[]>([]);

    const AVAILABLE_PERMISSIONS = [
        { key: 'manage_products', label: 'Manage Products' },
        { key: 'manage_orders', label: 'Manage Orders' },
        { key: 'manage_users', label: 'Manage Users' },
        { key: 'view_stats', label: 'View Analytics' },
        { key: 'manage_marketing', label: 'Manage Offers' },
        { key: 'manage_support', label: 'Manage Support' },
        { key: 'manage_reviews', label: 'Manage Reviews' },
        { key: 'manage_blog', label: 'Manage Blog' },
        { key: 'manage_looks', label: 'Manage Looks' }
    ];

    const fetchUsers = useCallback(async (p = 1, search = '') => {
        try {
            setLoading(true);
            const { data } = await api.get(`/users?page=${p}&search=${search}`);

            setUsers(data.users || []);
            setPage(data.page || 1);
            setPages(data.pages || 1);
            setTotal(data.total || 0);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.token) fetchUsers(1, searchTerm);
    }, [user?.token, searchTerm, fetchUsers]);

    const deleteUser = async (id: string) => {
        if (!window.confirm("Permanently Delete User?")) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            addToast("User Deleted", "success");
        } catch (err) {
            addToast("Delete failed", "error");
        }
    };

    const updateRoleDirectly = async (userToUpdate: any, value: string) => {
        try {
            let newRole = 'customer';
            let newPermissions: string[] = [];

            if (value === 'admin') {
                newRole = 'admin';
            } else if (value.startsWith('manager')) {
                newRole = 'manager';
                if (value === 'manager_p') newPermissions = ['manage_products'];
                else if (value === 'manager_o') newPermissions = ['manage_orders'];
                else if (value === 'manager_op') newPermissions = ['manage_products', 'manage_orders'];
            } else if (value === 'client_support_executive') {
                newRole = 'client_support_executive';
            } else if (value === 'digital_marketing_executive') {
                newRole = 'digital_marketing_executive';
            }

            const payload = {
                role: newRole,
                permissions: newPermissions
            };

            const { data } = await api.put(`/users/${userToUpdate._id}/role`, payload);

            // Update local list
            setUsers(users.map(u =>
                u._id === userToUpdate._id
                    ? { ...u, isAdmin: data.isAdmin, role: data.role, permissions: data.permissions }
                    : u
            ));

            // CRITICAL: If updating SELF, update global store to reflect Sidebar changes immediately
            if (user && userToUpdate._id === user._id) {
                setUser({ ...user, isAdmin: data.isAdmin, role: data.role, permissions: data.permissions });
            }

            addToast(`Role Updated to ${value.replace('_', ' ').toUpperCase()}`, "success");
        } catch (err: any) {
            console.error("Role Update Failed:", err);
            const errorMessage = err.response?.data?.message || "Update failed";
            addToast(errorMessage, "error");
        }
    };

    const toggleBlock = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/users/${id}/block`, {});
            setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !currentStatus } : u));
            addToast(currentStatus ? "User Unblocked" : "User Blocked", "success");
        } catch (err) {
            addToast("Block action failed", "error");
        }
    };

    const openPermissionEditor = (u: any) => {
        setEditingPermissions(u._id);
        setTempPermissions(u.permissions || []);
    };

    const savePermissions = async (id: string) => {
        try {
            await api.put(`/users/${id}/permissions`, { permissions: tempPermissions });

            setUsers(users.map(u => u._id === id ? { ...u, permissions: tempPermissions } : u));
            setEditingPermissions(null);
            addToast("Permissions Updated", "success");
        } catch (err) {
            addToast("Update failed", "error");
        }
    };

    const filteredUsers = users.filter(u => {
        if (!u) return false;
        const search = searchTerm.toLowerCase();
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return (
            (u.firstName || "").toLowerCase().includes(search) ||
            (u.lastName || "").toLowerCase().includes(search) ||
            fullName.includes(search) ||
            (u.email || "").toLowerCase().includes(search) ||
            (u.phone || "").toLowerCase().includes(search)
        );
    });

    const getRoleValue = (u: any) => {
        if (u.role === 'admin' || (u.isAdmin && !u.role)) return 'admin';
        if (u.role === 'manager') {
            const p = u.permissions || [];
            const hasProd = p.includes('manage_products');
            const hasOrder = p.includes('manage_orders');

            if (hasProd && hasOrder) return 'manager_op';
            if (hasProd) return 'manager_p';
            if (hasOrder) return 'manager_o';
            return 'manager_op';
        }
        if (u.role === 'client_support_executive') return 'client_support_executive';
        if (u.role === 'digital_marketing_executive') return 'digital_marketing_executive';
        return 'customer';
    };

    if (loading) return <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 p-8">Loading Users...</div>;

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        User <span className="text-zinc-400">Management</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Team & Partner Registry (MNCS-AUTH)</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                    <input
                        type="text"
                        placeholder="Search Users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 rounded-full bg-white border border-zinc-100 focus:border-black outline-none text-xs font-bold uppercase tracking-widest shadow-sm w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                <th className="px-8 py-6">User</th>
                                <th className="px-8 py-6">Role</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Permissions</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredUsers.map(u => (
                                <tr key={u._id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 uppercase">
                                                {u.firstName?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase">{u.firstName} {u.lastName}</div>
                                                <div className="text-[9px] text-zinc-900 font-black mt-1 uppercase tracking-tighter">{u.phone || 'No Number'}</div>
                                                <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="relative">
                                            <select
                                                value={getRoleValue(u)}
                                                onChange={(e) => updateRoleDirectly(u, e.target.value)}
                                                className={`appearance-none pl-3 pr-8 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-zinc-200 outline-none cursor-pointer hover:border-zinc-400 transition-all ${(u.role === 'admin' || (u.isAdmin && !u.role))
                                                    ? 'bg-black text-white border-black hover:bg-zinc-800'
                                                    : u.role === 'client_support_executive'
                                                        ? 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200'
                                                        : u.role === 'digital_marketing_executive'
                                                            ? 'bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-200'
                                                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                                                    }`}
                                            >
                                                <option value="customer" className="text-zinc-600 bg-white">Customer</option>
                                                <option value="manager_p" className="text-purple-600 bg-purple-50">Manager (Product)</option>
                                                <option value="manager_o" className="text-purple-600 bg-purple-50">Manager (Order)</option>
                                                <option value="manager_op" className="text-purple-600 bg-purple-50">Manager (All)</option>
                                                <option value="client_support_executive" className="text-blue-600 bg-blue-50">Client Support Executive</option>
                                                <option value="digital_marketing_executive" className="text-orange-600 bg-orange-50">Digital Marketing Executive</option>
                                                <option value="admin" className="text-black bg-zinc-100">Admin</option>
                                            </select>
                                            <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${(u.role === 'admin' || u.isAdmin) ? 'text-white' : 'text-zinc-400'}`}>
                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => toggleBlock(u._id, u.isBlocked)}
                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${u.isBlocked
                                                ? 'bg-red-100 text-red-600'
                                                : 'bg-green-100 text-green-600'
                                                }`}
                                        >
                                            {u.isBlocked ? <Ban size={10} /> : <CheckCircle size={10} />}
                                            {u.isBlocked ? 'Blocked' : 'Active'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        {(u.isAdmin || u.role === 'manager') && (
                                            <div className="w-64">
                                                {editingPermissions === u._id ? (
                                                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                                                        {AVAILABLE_PERMISSIONS.map(p => (
                                                            <label key={p.key} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 p-1 rounded select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={tempPermissions.includes(p.key)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setTempPermissions([...tempPermissions, p.key]);
                                                                        else setTempPermissions(tempPermissions.filter(k => k !== p.key));
                                                                    }}
                                                                    className="accent-black h-3 w-3"
                                                                />
                                                                <span className="text-[9px] font-bold uppercase">{p.label}</span>
                                                            </label>
                                                        ))}
                                                        <div className="flex gap-2 mt-2">
                                                            <button onClick={() => savePermissions(u._id)} className="flex-1 bg-black text-white text-[9px] font-bold rounded py-1 hover:bg-zinc-800">Save</button>
                                                            <button onClick={() => setEditingPermissions(null)} className="flex-1 bg-zinc-200 text-zinc-600 text-[9px] font-bold rounded py-1 hover:bg-zinc-300">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => openPermissionEditor(u)}
                                                        className="cursor-pointer hover:bg-zinc-50 p-2 rounded-lg group border border-transparent hover:border-zinc-100 transition-all"
                                                        title="Edit Permissions"
                                                    >
                                                        {u.permissions && u.permissions.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {u.permissions.map((p: string) => (
                                                                    <span key={p} className="text-[8px] font-bold uppercase bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">{p.replace('manage_', '')}</span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-zinc-300 group-hover:text-zinc-500">
                                                                <Shield size={12} />
                                                                <span className="text-[9px] font-bold uppercase italic">No specific permissions</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => deleteUser(u._id)}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 ml-auto"
                                        >
                                            <Trash2 size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {pages > 1 && (
                    <div className="bg-zinc-50 border-t border-zinc-100 px-8 py-4 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            Showing page {page} of {pages} ({total} Users)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setPage(page - 1); fetchUsers(page - 1, searchTerm); }}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => { setPage(page + 1); fetchUsers(page + 1, searchTerm); }}
                                disabled={page === pages}
                                className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
