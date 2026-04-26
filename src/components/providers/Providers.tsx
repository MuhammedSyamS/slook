"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { useSettingsStore } from "@/store/settingsStore";
import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { CookieSync } from "@/components/shared/CookieSync";

export default function Providers({ children }: { children: React.ReactNode }) {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <AuthProvider>
        <CookieSync />
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
