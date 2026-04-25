'use client';

import React from 'react';

interface MarqueeRibbonProps {
  children: React.ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

const MarqueeRibbon: React.FC<MarqueeRibbonProps> = ({ children, speed = 25, pauseOnHover = true, className = "" }) => {
  return (
    <div className={`relative flex overflow-x-hidden ${className}`}>
      <div className={`flex whitespace-nowrap animate-marquee-ribbon ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}>
        <div className="flex shrink-0">
          {children}
        </div>
        <div className="flex shrink-0">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                key: (child.key ? `${child.key}-duplicate` : undefined)
              } as any);
            }
            return child;
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-ribbon {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-ribbon {
          animation: marquee-ribbon ${speed}s linear infinite;
          display: flex;
          width: max-content;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default MarqueeRibbon;
