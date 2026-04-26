import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse bg-zinc-100/80 rounded-[1rem] ${className}`}
            {...props}
        />
    );
};

export { Skeleton };
