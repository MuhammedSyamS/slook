'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Tag, 
    Shield, Package, CreditCard, MessageSquare, TrendingUp, X, 
    RefreshCw, HelpCircle, FileText, Edit3, Activity, Camera, Inbox,
    ChevronLeft, ChevronRight, Menu, Coins
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const SidebarLinks = ({ user, getNavClass, isAdmin }: { user: any, getNavClass: any, isAdmin: boolean }) => (
    <nav className="space-y-2">
        {/* DASHBOARD - ADMIN & MANAGER ONLY */}
        {(user?.isAdmin || user?.role === 'admin' || user?.role === 'manager') && (
            <Link href="/admin" className={getNavClass('/admin', true)}>
                <LayoutDashboard size={18} className="flex-shrink-0" /> Dashboard
            </Link>
        )}

        {/* ANALYTICS - ADMIN & MANAGER ONLY */}
        {(user?.isAdmin || user?.role === 'admin' || user?.permissions?.includes('view_stats') || user?.role === 'manager') && (
            <Link href="/admin/analytics" className={getNavClass('/admin/analytics')}>
                <TrendingUp size={18} className="flex-shrink-0" /> Analytics
            </Link>
        )}

        {(user?.isAdmin || user?.role === 'admin' || user?.role === 'digital_marketing_executive' || user?.permissions?.includes('manage_products')) && (
            <>
                <Link href="/admin/products" className={getNavClass('/admin/products', true)}>
                    <Package size={18} className="flex-shrink-0" /> Inventory
                </Link>
                <Link href="/admin/products/bulk" className={getNavClass('/admin/products/bulk')}>
                    <Edit3 size={18} className="flex-shrink-0" /> Bulk Editor
                </Link>
                <Link href="/admin/collections" className={getNavClass('/admin/collections')}>
                    <Tag size={18} className="flex-shrink-0" /> Collections
                </Link>
            </>
        )}

        {(user?.isAdmin || user?.role === 'admin' || user?.permissions?.includes('manage_orders')) && (
            <>
                <Link href="/admin/orders" className={getNavClass('/admin/orders')}>
                    <ShoppingBag size={18} className="flex-shrink-0" /> Orders
                </Link>
                <Link href="/admin/returns" className={getNavClass('/admin/returns')}>
                    <RefreshCw size={18} className="flex-shrink-0" /> Returns
                </Link>
            </>
        )}

        {/* ADMIN & MANAGER ACTIONS */}
        {(user?.isAdmin || user?.role === 'admin' || user?.permissions?.includes('manage_users')) && (
            <>
                <Link href="/admin/users" className={getNavClass('/admin/users')}>
                    <Users size={18} className="flex-shrink-0" /> Users
                </Link>
                <Link href="/admin/coins" className={getNavClass('/admin/coins')}>
                    <Coins size={18} className="flex-shrink-0" /> Slook Coins
                </Link>
            </>
        )}

        {(user?.isAdmin || user?.role === 'admin' || user?.role === 'client_support_executive' || user?.permissions?.includes('manage_looks')) && (
            <Link href="/admin/looks" className={getNavClass('/admin/looks')}>
                <Camera size={18} className="flex-shrink-0" /> Community Styles
            </Link>
        )}

        {(user?.isAdmin || user?.role === 'admin' || user?.role === 'digital_marketing_executive' || user?.permissions?.includes('manage_blog')) && (
            <Link href="/admin/blog" className={getNavClass('/admin/blog')}>
                <FileText size={18} className="flex-shrink-0" /> Blog
            </Link>
        )}

        {(user?.isAdmin || user?.role === 'admin' || user?.permissions?.includes('manage_marketing')) && (
            <Link href="/admin/marketing" className={getNavClass('/admin/marketing')}>
                <Tag size={18} className="flex-shrink-0" /> Offers
            </Link>
        )}

        {/* REVIEWS */}
        {(user?.isAdmin || user?.role === 'admin' || user?.role === 'client_support_executive' || user?.permissions?.includes('manage_reviews')) && (
            <Link href="/admin/reviews" className={getNavClass('/admin/reviews')}>
                <MessageSquare size={18} className="flex-shrink-0" /> Reviews
            </Link>
        )}

        {/* SUPPORT DESK */}
        {(user?.isAdmin || user?.role === 'admin' || user?.role === 'client_support_executive' || user?.permissions?.includes('manage_support')) && (
            <Link href="/admin/support" className={getNavClass('/admin/support')}>
                <HelpCircle size={18} className="flex-shrink-0" /> Support Desk
            </Link>
        )}

        {/* SETTINGS (Admin Only) */}
        {isAdmin && (
            <>
                <Link href="/admin/payments" className={getNavClass('/admin/payments')}>
                    <CreditCard size={18} className="flex-shrink-0" /> Payments
                </Link>
                <Link href="/admin/settings" className={getNavClass('/admin/settings')}>
                    <Settings size={18} className="flex-shrink-0" /> Settings
                </Link>
                <Link href="/admin/health" className={getNavClass('/admin/health')}>
                    <Activity size={18} className="flex-shrink-0" /> System Health
                </Link>
            </>
        )}
    </nav>
);

export const AdminSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const { 
        isDesktopSidebarOpen, isMobileSidebarOpen, 
        closeMobileSidebar, toggleDesktopSidebar, toggleMobileSidebar
    } = useUIStore();

    // MOUNT GUARD FOR HYDRATION
    useEffect(() => {
        setMounted(true);
    }, []);

    // FORCE OPEN ON MOUNT FOR ADMIN PAGES
    useEffect(() => {
        if (mounted && !isDesktopSidebarOpen) {
            toggleDesktopSidebar();
        }
    }, [mounted]); // Only on mount

    // CLOSE MOBILE DRAWER ON NAVIGATE
    useEffect(() => {
        closeMobileSidebar();
    }, [pathname, closeMobileSidebar]);

    // PREVENT SCROLL ON MOBILE OPEN
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isMobileSidebarOpen]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isAdmin = user?.role === 'admin' || user?.isAdmin;

    const getNavClass = (path: string, end = false) => {
        const isActive = end ? pathname === path : pathname.startsWith(path);
        return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest ${
            isActive ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'
        }`;
    };

    if (!mounted) return null;

    return (
        <>
            {/* --- DESKTOP SIDEBAR --- */}
            <div className={`fixed left-0 top-[140px] bottom-0 bg-white border-r border-zinc-100 flex-col justify-between p-6 hidden md:flex transition-all duration-300 overflow-hidden z-40 ${isDesktopSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 p-0 border-none'}`}>
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 whitespace-nowrap">
                    <SidebarLinks user={user} getNavClass={getNavClass} isAdmin={!!isAdmin} />
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100 space-y-1">
                    <a href="mailto:support@slook.in" className="flex items-center gap-3 px-4 py-3 text-zinc-500 font-bold text-[11px] uppercase tracking-widest hover:text-black hover:bg-zinc-50 rounded-xl transition whitespace-nowrap">
                        <HelpCircle size={18} className="flex-shrink-0" /> Help & Support
                    </a>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition w-full">
                        <LogOut size={18} className="flex-shrink-0" /> Logout
                    </button>
                </div>
            </div>

            {/* --- MOBILE SIDEBAR DRAWER --- */}
            <div className={`fixed inset-0 z-[200] md:hidden transition-all duration-300 ${isMobileSidebarOpen ? 'visible' : 'invisible'}`}>
                <div 
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeMobileSidebar}
                />
                <div className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white shadow-2xl transition-transform duration-300 flex flex-col p-6 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="mb-8 flex justify-between items-center flex-shrink-0">
                        <h1 className="text-2xl font-black tracking-tighter">SLOOK<span className="text-red-500">ADMIN</span></h1>
                        <button onClick={closeMobileSidebar} className="p-3 bg-zinc-100 rounded-full text-zinc-500 hover:bg-black hover:text-white transition">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <SidebarLinks user={user} getNavClass={getNavClass} isAdmin={!!isAdmin} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 flex-shrink-0 space-y-2">
                        <a href="mailto:support@slook.in" className="flex items-center gap-3 px-4 py-3 text-zinc-500 font-bold text-[11px] uppercase tracking-widest hover:text-black hover:bg-zinc-50 rounded-xl transition w-full">
                            <HelpCircle size={18} /> Help & Support
                        </a>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition w-full">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
