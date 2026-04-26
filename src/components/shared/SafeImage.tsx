'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1594432242095-234246961633?auto=format&fit=crop&q=60&w=800";

/**
 * SafeImage: A wrapper around Next.js Image that handles broken URLs/404s gracefully
 * without blocking page rendering or throwing upstream errors.
 */
export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<any>(src);
  const [hasError, setHasError] = useState(false);

  // Reset state if src changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <Image
      {...props}
      src={hasError ? fallbackSrc : (imgSrc || fallbackSrc)}
      alt={alt || "Product image"}
      className={`${className} transition-opacity duration-300 ${hasError ? 'opacity-90' : 'opacity-100'}`}
      onError={() => {
        if (!hasError) {
          console.warn(`[SafeImage] Failed to load: ${src}. Switching to fallback.`);
          setHasError(true);
        }
      }}
      // Use unoptimized for external images if needed, or rely on remotePatterns
      unoptimized={typeof src === 'string' && src.startsWith('http') && !src.includes('localhost')}
    />
  );
};

export default SafeImage;
