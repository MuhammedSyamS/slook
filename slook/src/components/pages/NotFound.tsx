'use client';

import React from 'react';
import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-9xl font-black text-gray-100 select-none">404</h1>
      <h2 className="text-3xl font-bold uppercase tracking-tighter -mt-12 mb-4">Lost in the sauce?</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
        Don't worry, the collection is still here.
      </p>
      <Link href="/" className="bg-black text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-gray-800 transition">
        Back Home
      </Link>
    </div>
  );
};

export default NotFound;
