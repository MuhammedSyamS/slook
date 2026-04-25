'use client';

import React, { memo } from 'react';
import { useUIStore } from '@/store/uiStore';

interface PriceProps {
  amount: number;
  className?: string;
}

const Price: React.FC<PriceProps> = memo(({ amount, className = "" }) => {
  const currency = useUIStore(state => state.currency || 'INR');
  const currencyRates = useUIStore(state => state.currencyRates || { 'INR': 1, 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0093 });

  const convertPrice = (val: number) => {
    // Safety check for NaN or invalid numbers
    const safeAmount = (typeof val === 'number' && !isNaN(val)) ? val : 0;
    const rate = currencyRates[currency] || 1;
    return (safeAmount * rate).toLocaleString(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <span className={className}>
      {convertPrice(amount)}
    </span>
  );
});

Price.displayName = 'Price';

export default Price;