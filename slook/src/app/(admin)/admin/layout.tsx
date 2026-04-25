'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isDesktopSidebarOpen, toggleDesktopSidebar } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    if (!isDesktopSidebarOpen) {
      toggleDesktopSidebar();
    }
  }, [isDesktopSidebarOpen, toggleDesktopSidebar]);

  React.useEffect(() => {
    // Wait for hydration/auth state to resolve
    if (user === undefined) return; 

    const isStaff = user && (user.isAdmin || ['admin', 'manager', 'client_support_executive', 'digital_marketing_executive'].includes(user.role));
    
    if (!user) {
      router.push('/login?redirect=/admin');
    } else if (!isStaff) {
      router.push('/');
    } else {
      setAuthorized(true);
    }
  }, [user, router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Verifying Authority...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <AdminSidebar />
      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 transition-all duration-300 ${isDesktopSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          <div className="pt-[160px] md:pt-[180px] p-4 md:p-6 max-w-7xl mx-auto">
              {children}
          </div>
      </div>
    </div>
  );
}
