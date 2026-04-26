'use client';

import React, { useEffect, useRef, useState, memo } from 'react';

interface RevealProps {
    children: React.ReactNode;
    width?: string;
    delay?: number;
}

const Reveal: React.FC<RevealProps> = memo(({ children, width = "fit-content", delay = 0.2 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1200);

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    clearTimeout(timer);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => {
            clearTimeout(timer);
            if (ref.current) observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out will-change-[transform,opacity] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
            style={{ width, transitionDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
});

Reveal.displayName = 'Reveal';

export default Reveal;
