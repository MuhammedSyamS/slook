'use client';

import React from 'react';

interface MarqueeProps {
  text?: string;
  items?: any[];
  reverse?: boolean;
}

const Marquee: React.FC<MarqueeProps> = ({ text, items = [], reverse = false }) => {
  const content = items.length > 0 
    ? items.map(item => item.text).join(" • ") + " • "
    : text || "Premium Artifacts • High Quality • Studio Drops • Handpicked Originals • ";

  return (
    <div className="relative flex overflow-x-hidden bg-black py-4 border-y border-zinc-800 touch-pan-y">
      <div className={`flex whitespace-nowrap ${reverse ? 'flex-row-reverse' : ''} animate-marquee-container`}>
        {[...Array(12)].map((_, i) => (
          <span key={`marquee-msg-${i}`} className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40 px-10">
            {content}
          </span>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-container {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Marquee;
