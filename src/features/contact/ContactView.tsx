'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Phone, MessageSquare, Loader2 } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';

export const ContactView = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const { success: toastSuccess, error: toastError } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/support/contact', formData);
      toastSuccess('Message sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error("Contact Error:", error);
      toastError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-44 md:pt-52 pb-20 px-6 selection:bg-black selection:text-white page-top">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-20 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Contact Us
          </h1>
          <p className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.5em]">
            Reach out to the SLOOK Studio
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* Left: Contact Form */}
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  className="w-full border-b border-zinc-200 py-4 outline-none focus:border-black transition-colors bg-transparent font-medium text-sm"
                  required
                  disabled={loading}
                  value={formData.name}
                  onChange={handleChange}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full border-b border-zinc-200 py-4 outline-none focus:border-black transition-colors bg-transparent font-medium text-sm"
                  required
                  disabled={loading}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                className="w-full border-b border-zinc-200 py-4 outline-none focus:border-black transition-colors bg-transparent font-medium text-sm"
                disabled={loading}
                value={formData.subject}
                onChange={handleChange}
              />
              <textarea
                name="message"
                rows={5}
                placeholder="How can we help you?"
                className="w-full border-b border-zinc-200 py-4 outline-none focus:border-black transition-colors bg-transparent font-medium resize-none text-sm"
                required
                disabled={loading}
                value={formData.message}
                onChange={handleChange}
              ></textarea>

              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Right: Contact Info */}
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

              {/* Support */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Customer Support</h3>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Available Mon-Fri, 9am - 6pm .<br />
                  Average response time: 24h.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={18} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Email Us</h3>
                </div>
                <p className="text-zinc-500 text-sm">
                  help.slook@gmail.com<br />
                  press.slook@gmail.com
                </p>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin size={18} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Our Studio</h3>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  HiTech Building Trivandrum<br />
                  Kerala, India, 695608
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone size={18} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Call Us</h3>
                </div>
                <p className="text-zinc-500 text-sm">
                  +1 (234) 567-890<br />
                  International charges apply.
                </p>
              </div>

            </div>

            {/* Subtle Map Placeholder / Visual Element */}
            <div className="w-full h-64 bg-zinc-50 flex items-center justify-center grayscale opacity-50 border border-zinc-100 italic text-zinc-400 text-xs tracking-widest">
              [ Interactive Map View ]
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
