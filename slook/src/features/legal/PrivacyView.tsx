'use client';

import React from 'react';

export const PrivacyView = () => {
    return (
        <div className="bg-white min-h-screen pt-44 md:pt-52 pb-20 px-6 selection:bg-black selection:text-white page-top">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Privacy Policy</h1>
                <p className="text-xs text-zinc-500 leading-relaxed">
                    Last Updated: February 2026
                </p>

                <section className="space-y-2">
                    <h2 className="text-sm font-black uppercase">1. Information Collection</h2>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        We collect information you provide directly to us, such as when you create an account, update your profile, make a purchase, or communicate with us. This includes name, email, shipping address, and payment information.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm font-black uppercase">2. Use of Information</h2>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        We use your information to process transactions, send order updates, and improve our services. We do not sell your personal data to third parties.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm font-black uppercase">3. Security</h2>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        We implement industry-standard security measures, including SSL encryption, to protect your personal information during transmission and storage.
                    </p>
                </section>
            </div>
        </div>
    );
};
