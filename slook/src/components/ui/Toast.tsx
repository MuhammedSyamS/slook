'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {

    const icons = {
        success: <Check size={16} className="text-green-500" />,
        error: <AlertCircle size={16} className="text-red-500" />,
        info: <Info size={16} className="text-blue-500" />,
        warning: <AlertTriangle size={16} className="text-yellow-500" />
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-black/90 backdrop-blur-md text-white px-4 py-3 md:px-6 md:py-4 rounded-xl shadow-2xl flex items-center gap-3 md:gap-4 min-w-[260px] md:min-w-[300px] border border-white/10"
        >
            <div className={`p-2 rounded-full bg-white/10`}>
                {icons[type] || icons.info}
            </div>

            <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-wider">{type}</p>
                <p className="text-xs font-medium text-white/80">{message}</p>
            </div>

            <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};