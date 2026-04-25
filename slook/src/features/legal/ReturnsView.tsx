'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ReturnsView = () => {
  return (
    <div className="bg-white min-h-screen pt-32 md:pt-48 pb-20 px-4 md:px-6 selection:bg-black selection:text-white page-top">
      <div className="max-w-5xl mx-auto space-y-16 md:space-y-24">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
            RETURNS <span className="text-zinc-200">& REFUNDS</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Inventory reconciliation protocols</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-[10px]">01</span>
              7-Day Guarantee
            </h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed uppercase tracking-wide">
              We stand by the quality of our goods. If you are not completely satisfied with your purchase,
              you may return it within 7 days of receiving your order for a full refund or exchange.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-[10px]">02</span>
              How to Return
            </h2>
            <ol className="space-y-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <li className="flex items-start gap-4"><span className="text-black shrink-0">I.</span> Log in to your account and go to My Orders.</li>
              <li className="flex items-start gap-4"><span className="text-black shrink-0">II.</span> Select the order containing the item.</li>
              <li className="flex items-start gap-4"><span className="text-black shrink-0">III.</span> Click the Return button next to the item.</li>
              <li className="flex items-start gap-4"><span className="text-black shrink-0">IV.</span> Select motive, choose Refund or Exchange.</li>
              <li className="flex items-start gap-4"><span className="text-black shrink-0">V.</span> We will review and schedule a pickup.</li>
            </ol>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight text-orange-900 flex items-center gap-4">
              <AlertTriangle className="text-orange-600" size={32} />
              Mandatory Requirement
            </h2>
            <p className="text-sm md:text-xl font-black text-orange-800 leading-tight uppercase tracking-tight max-w-2xl">
              Returns and exchanges will <span className="underline decoration-4">ONLY</span> be accepted if you provide an <span className="italic">Unboxing Video</span> showing the package condition and product defect.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-orange-200/50">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest leading-loose">
                • Record the unboxing from the moment you receive the package.<br />
                • Ensure the shipping label is clearly visible.<br />
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest leading-loose">
                • Requests without video and picture proof will be automatically rejected.<br />
                • Tags must be intact and item originally packed.<br />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
