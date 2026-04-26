import Providers from "@/components/providers/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Inter, Outfit, Syne, Cormorant_Garamond } from 'next/font/google';
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: 'SLOOK | Premium Streetwear Hub',
    template: '%s | SLOOK'
  },
  description: 'Elevated minimalism and high-quality streetwear artifacts. Curated for the digital elite.',
  keywords: ['streetwear', 'luxury fashion', 'minimalist style', 'premium artifacts', 'SLOOK'],
  authors: [{ name: 'SLOOK Studio' }],
  creator: 'SLOOK Studio',
  publisher: 'SLOOK Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://slook.luxury'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SLOOK | Premium Streetwear Hub',
    description: 'Elevated minimalism and high-quality streetwear artifacts.',
    url: 'https://slook.luxury',
    siteName: 'SLOOK',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SLOOK Premium Streetwear',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SLOOK | Premium Streetwear Hub',
    description: 'Elevated minimalism and high-quality streetwear artifacts.',
    creator: '@slook_luxury',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/slook.png',
    shortcut: '/slook.png',
    apple: '/slook.png',
  },
  manifest: '/manifest.json',
};

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-outfit',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${outfit.variable} ${syne.variable} ${cormorant.variable}`}>
      <body>
        <Providers>
          <ScrollToTop />
          <CartDrawer />
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
