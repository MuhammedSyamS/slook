'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-black text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                    <Download size={20} />
                </div>
                <div>
                    <p className="font-bold text-sm uppercase tracking-wide">Install SLOOK App</p>
                    <p className="text-[10px] text-zinc-400">Add to Home Screen for fast access</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleInstall} className="bg-white text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition">
                    Install
                </button>
                <button onClick={() => setIsVisible(false)} className="p-2 hover:bg-white/10 rounded-lg transition">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
