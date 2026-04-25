'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const FlashSaleBanner = () => {
    const flashSale = useUIStore(state => state.flashSale);
    const fetchFlashSale = useUIStore(state => state.fetchFlashSale);
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        fetchFlashSale();
        const interval = setInterval(fetchFlashSale, 60000);
        return () => clearInterval(interval);
    }, [fetchFlashSale]);

    useEffect(() => {
        if (!flashSale) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const difference = new Date(flashSale.endTime).getTime() - new Date().getTime();
            if (difference > 0) {
                setTimeLeft({
                    hours: Math.floor((difference / (1000 * 60 * 60))),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [flashSale]);

    if (!flashSale || !timeLeft) return null;

    return (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-3 flex flex-col md:flex-row items-center justify-between relative z-10 gap-2 md:gap-8">
                <div className="flex items-center gap-4">
                    <div className="bg-white text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                        <Zap size={12} fill="currentColor" />
                        Live Now
                    </div>
                    <p className="font-bold text-sm md:text-base uppercase tracking-wide">
                        {flashSale.name}: <span className="font-black">{flashSale.discountPercentage}% OFF</span> Selected Items
                    </p>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4 font-mono text-sm md:text-lg font-bold tabular-nums">
                        <div className="flex flex-col items-center leading-none">
                            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[8px] font-sans font-normal opacity-70 uppercase">Hrs</span>
                        </div>
                        <span className="opacity-50 -mt-2">:</span>
                        <div className="flex flex-col items-center leading-none">
                            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[8px] font-sans font-normal opacity-70 uppercase">Min</span>
                        </div>
                        <span className="opacity-50 -mt-2">:</span>
                        <div className="flex flex-col items-center leading-none">
                            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="text-[8px] font-sans font-normal opacity-70 uppercase">Sec</span>
                        </div>
                    </div>

                    <Link href="/shop" className="bg-white text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center gap-2">
                        Shop Now <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FlashSaleBanner;
