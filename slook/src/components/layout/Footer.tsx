'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { client as api } from '@/lib/api/client';
import { Instagram, Facebook, Mail, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

import { usePathname } from 'next/navigation';

const Footer: React.FC = () => {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // No footer on admin routes
  if (pathname?.startsWith('/admin')) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const { data } = await api.post('/marketing/subscribe', { email });
      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch (error: any) {
      console.error("Subscription Error:", error);
      const errMsg = error.response?.data?.message || error.message || 'Something went wrong';
      setStatus('error');
      setMessage(errMsg);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <footer id="site-footer" className="bg-[#0a0a0a] text-white border-t border-zinc-900">
      <div className="border-b border-zinc-900 py-6 md:py-10 px-2 md:px-6">
        <div className="container-responsive mx-auto grid grid-cols-3 gap-2 md:gap-8 text-center">
          <div className="flex flex-col items-center justify-start gap-1.5 md:gap-2 group cursor-default">
            <Truck strokeWidth={1.5} className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-white transition-colors" />
            <p className="text-[6.5px] md:text-[10px] font-black uppercase tracking-widest md:tracking-extrawide text-zinc-300">Free Shipping</p>
          </div>
          <div className="flex flex-col items-center justify-start gap-1.5 md:gap-2 group cursor-default">
            <ShieldCheck strokeWidth={1.5} className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-white transition-colors" />
            <p className="text-[6.5px] md:text-[10px] font-black uppercase tracking-widest md:tracking-extrawide text-zinc-300">Secured</p>
          </div>
          <div className="flex flex-col items-center justify-start gap-1.5 md:gap-2 group cursor-default">
            <RotateCcw strokeWidth={1.5} className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-white transition-colors" />
            <p className="text-[6.5px] md:text-[10px] font-black uppercase tracking-widest md:tracking-extrawide text-zinc-300">7-Day Easy Returns</p>
          </div>
        </div>
      </div>

      <div className="container-responsive mx-auto pt-20 pb-12 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          <div className="lg:col-span-3 space-y-4 md:space-y-6 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">SLOOK</h2>
            <p className="text-zinc-500 text-[11px] md:text-xs leading-relaxed max-w-sm font-medium mx-auto lg:mx-0">
              Premium essentials for the modern lifestyle.
              Curated for quality, designed for life.
            </p>
            <div className="flex justify-center lg:justify-start gap-6 pt-2 md:pt-4">
              <Instagram className="w-4 h-4 cursor-pointer text-zinc-500 hover:text-white transition-all" />
              <XIcon className="w-4 h-4 cursor-pointer text-zinc-500 hover:text-white transition-all" />
              <Facebook className="w-4 h-4 cursor-pointer text-zinc-500 hover:text-white transition-all" />
              <Mail className="w-4 h-4 cursor-pointer text-zinc-500 hover:text-white transition-all" />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 md:space-y-6 mt-8 md:mt-0 text-center md:text-left">
            <h3 className="text-[12px] md:text-[11px] font-black uppercase tracking-extrawide text-white">Shop</h3>
            <ul className="space-y-3 md:space-y-4 text-[10px] md:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
              <li><Link href="/shop" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop?filter=best-sellers" className="hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>

          <div id="footer-support" className="lg:col-span-2 space-y-4 md:space-y-6 mt-8 md:mt-0 text-center md:text-left">
            <h3 className="text-[12px] md:text-[11px] font-black uppercase tracking-extrawide text-white">Support</h3>
            <ul className="space-y-3 md:space-y-4 text-[10px] md:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
              <li><Link href="/contact" className="hover:text-white transition-colors text-orange-400">Contact Us</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">Support Hub & FAQ</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Returns & Exchange</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/care-guide" className="hover:text-white transition-colors">Care Guide</Link></li>
            </ul>
          </div>

          <div id="footer-track" className="lg:col-span-2 space-y-4 md:space-y-6 mt-8 md:mt-0 text-center md:text-left">
            <h3 className="text-[12px] md:text-[11px] font-black uppercase tracking-extrawide text-white">Track</h3>
            <ul className="space-y-3 md:space-y-4 text-[10px] md:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
              <li><Link href="/track-order?type=order" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/track-order?type=return" className="hover:text-white transition-colors">Track Return</Link></li>
              <li><Link href="/track-order?type=exchange" className="hover:text-white transition-colors">Track Exchange</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-4 md:space-y-6 mt-8 md:mt-0 text-center md:text-left">
            <h3 className="text-[12px] md:text-[11px] font-black uppercase tracking-extrawide text-white">The Inner Circle</h3>
            <p className="text-zinc-500 text-[10px] md:text-[10px] font-bold uppercase tracking-widest leading-loose">
              Join for early access to drops and exclusive updates.
            </p>
            <div className="relative group">
              {status === 'success' ? (
                <div className="py-6 px-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center animate-in zoom-in duration-500">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                    <ShieldCheck size={20} className="text-black" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-2">Welcome to the Inner Circle</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-loose">
                    Your exclusive access is now confirmed. <br /> Check your inbox soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe}>
                  <input
                    suppressHydrationWarning
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    placeholder="EMAIL ADDRESS"
                    className="w-full bg-transparent border-b border-zinc-800 py-4 text-[10px] font-black text-white outline-none focus:border-white transition-all placeholder:text-zinc-700 disabled:opacity-50"
                  />
                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={status === 'loading' || !email}
                    className="absolute right-0 bottom-4 text-[10px] font-black uppercase tracking-widest text-white hover:translate-x-1 transition-transform disabled:opacity-50"
                  >
                    {status === 'loading' ? 'Joining...' : 'Join →'}
                  </button>
                  {status === 'error' && (
                    <p className="absolute -bottom-6 left-0 text-[9px] font-bold text-red-500 uppercase tracking-wider">{message}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-24 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} SLOOK. All rights reserved.
          </p>
          <div className="flex gap-8 text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
