'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    path: string;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items = [] }) => {
    if (!items || items.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest overflow-x-auto no-scrollbar py-2">
            <Link
                href="/"
                className="text-zinc-400 hover:text-black transition-colors flex items-center gap-1.5 shrink-0"
            >
                <Home size={10} strokeWidth={3} />
                <span>Studio</span>
            </Link>

            {items.map((item, idx) => (
                <React.Fragment key={idx}>
                    <ChevronRight size={8} className="text-zinc-300 shrink-0" strokeWidth={4} />
                    {idx === items.length - 1 ? (
                        <span className="text-black truncate">{item.label}</span>
                    ) : (
                        <Link
                            href={item.path}
                            className="text-zinc-400 hover:text-black transition-colors truncate shrink-0"
                        >
                            {item.label}
                        </Link>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
