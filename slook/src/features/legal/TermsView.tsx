'use client';

import React from 'react';

export const TermsView = () => {
    return (
        <div className="bg-white min-h-screen pt-44 md:pt-52 pb-20 px-6 selection:bg-black selection:text-white page-top">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="space-y-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Terms of Service</h1>
                    <p className="text-sm font-bold text-zinc-400 max-w-lg mx-auto uppercase tracking-widest">
                        Effective Date: {new Date().getFullYear()}
                    </p>
                </div>

                <div className="space-y-8 text-sm text-zinc-600 leading-loose">
                    <section>
                        <h2 className="text-lg font-black uppercase text-black mb-4">1. Overview</h2>
                        <p>
                            This website is operated by <strong className="text-black">SLOOK</strong>. Throughout the site, the terms "we", "us" and "our" refer to SLOOK. SLOOK offers this website, including all information, tools and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black uppercase text-black mb-4">2. Online Store Terms</h2>
                        <p>
                            By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black uppercase text-black mb-4">3. General Conditions</h2>
                        <p>
                            We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices. Credit card information is always encrypted during transfer over networks.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black uppercase text-black mb-4">4. Products & Services</h2>
                        <p>
                            Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy. We have made every effort to display as accurately as possible the colors and images of our products.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black uppercase text-black mb-4">5. Accuracy of Billing</h2>
                        <p>
                            We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black uppercase text-black mb-4">6. Governing Law</h2>
                        <p>
                            These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-zinc-100">
                        <p className="text-xs text-zinc-400">
                            Questions about the Terms of Service should be sent to us at <a href="mailto:support@slook.com" className="text-black underline">support@slook.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
