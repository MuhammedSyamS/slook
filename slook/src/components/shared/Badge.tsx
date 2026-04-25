import React from 'react';

interface BadgeProps {
  count: number;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ count, className = "" }) => {
  if (count <= 0) return null;

  return (
    <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white ${className}`}>
      {count > 9 ? '9+' : count}
    </span>
  );
};

export default Badge;
