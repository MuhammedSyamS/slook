'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, CheckCircle, AlertCircle,
  Loader, Box, ShieldCheck, Clock, RotateCcw, Copy, ArrowRight
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();
  const typeParam = searchParams.get('type') || 'order'; // 'order', 'return', 'exchange'

  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeType, setActiveType] = useState(typeParam);

  // Auto-detect type based on ID prefix
  useEffect(() => {
    const upperId = orderId.toUpperCase();
    if (upperId.startsWith('RTN-')) {
      setActiveType('return');
    } else if (upperId.startsWith('EXC-')) {
      setActiveType('exchange');
    } else if (orderId.length === 0) {
      setActiveType(typeParam);
    }
  }, [orderId, typeParam]);

  const getPageConfig = () => {
    switch (activeType) {
      case 'return':
        return {
          title: 'Track',
          subtitle: 'Return',
          label: 'Return ID / System ID',
          placeholder: 'RTN-XXXXXXXX',
          buttonText: 'Trace Return'
        };
      case 'exchange':
        return {
          title: 'Track',
          subtitle: 'Exchange',
          label: 'Exchange ID / System ID',
          placeholder: 'EXC-XXXXXXXX',
          buttonText: 'Trace Exchange'
        };
      default:
        return {
          title: 'Track',
          subtitle: 'Order',
          label: 'Order ID',
          placeholder: 'ID CODE',
          buttonText: 'Trace Order'
        };
    }
  };

  const config = getPageConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const trimmedId = orderId.trim();
      const trimmedEmail = email.trim();
      const { data } = await api.post('/orders/track', { orderId: trimmedId, email: trimmedEmail });
      setOrderData(data);
      toastSuccess("Order Located Successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || 'Trace failed. Please verify your credentials.');
      toastError("Trace Signal Failed");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMilestones = () => {
    if (activeType === 'return' || activeType === 'exchange') {
      return [
        { label: 'Requested', icon: Box, status: 'Requested' },
        { label: 'Approved', icon: CheckCircle, status: 'Approved' },
        { label: 'Pick-up', icon: Truck, status: ['Pickup Scheduled', 'Picked Up', 'In Transit'] },
        { label: 'Quality Check', icon: ShieldCheck, status: ['Received', 'QC Pending', 'QC Passed', 'QC Failed'] },
        { label: activeType === 'exchange' ? 'Exchanged' : 'Refunded', icon: RotateCcw, status: ['Refund Initiated', 'Refund Completed', 'Replacement Sent', 'Exchanged', 'Replacement Delivered'] }
      ];
    }

    const base = [
      { label: 'Order Placed', icon: Box, dateKey: 'createdAt' },
      { label: 'Processing', icon: Clock, dateKey: 'processingAt' },
      { label: 'Quality Check', icon: ShieldCheck, dateKey: 'confirmedAt' },
      { label: 'In Transit', icon: Truck, dateKey: 'shippedAt' },
      { label: 'Delivered', icon: CheckCircle, dateKey: 'deliveredAt' }
    ];

    if (orderData?.orderStatus === 'Return Requested' || orderData?.orderStatus === 'Returned') {
      base.push({ label: 'Return', icon: RotateCcw, dateKey: 'returnRequestedAt' });
    }
    if (orderData?.orderStatus === 'Returned') {
      base.push({ label: 'Finalized', icon: ShieldCheck, dateKey: 'returnedAt' });
    }
    return base;
  };

  const getStepStatus = (index: number, milestone: any) => {
    if (!orderData) return 'pending';

    if (activeType === 'return' || activeType === 'exchange') {
      const milestones = getMilestones();
      const currentStatus = orderData.returnStatus || 'Requested';

      let activeIdx = -1;
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i] as any;
        const targetStatus = m.status;
        if (Array.isArray(targetStatus)) {
          if (targetStatus.includes(currentStatus)) activeIdx = i;
        } else {
          if (targetStatus === currentStatus) activeIdx = i;
        }
      }

      if (activeIdx === -1) {
        const resolved = ['Refund Initiated', 'Refund Completed', 'Replacement Sent', 'Exchanged', 'Replacement Delivered'];
        if (resolved.includes(currentStatus)) activeIdx = 4;
        else if (['Received', 'QC Pending', 'QC Passed', 'QC Failed'].includes(currentStatus)) activeIdx = 3;
        else if (['Pickup Scheduled', 'Picked Up', 'In Transit'].includes(currentStatus)) activeIdx = 2;
        else if (currentStatus === 'Approved') activeIdx = 1;
        else activeIdx = 0;
      }

      if (activeIdx > index) return 'completed';
      if (activeIdx === index) return 'active';
      return 'pending';
    }

    const statusFlow: any = {
      'Pending': 0, 'Processing': 1, 'Confirmed': 2, 'Dispatched': 3, 'Shipped': 3, 'Delivered': 4,
      'Return Requested': 5, 'Returned': 6
    };
    const currentLevel = statusFlow[orderData.orderStatus] || 0;
    if (currentLevel > index) return 'completed';
    if (currentLevel === index) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white min-h-screen pt-32 md:pt-48 pb-12 md:pb-20 px-4 md:px-6 selection:bg-black selection:text-white flex flex-col items-center">
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 md:mb-16 text-center space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
            {config.title} <span className="text-zinc-200">{config.subtitle}</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Real-time logistic surveillance</p>
        </motion.div>

        {/* Tracking Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-50/50 border border-zinc-100 p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] relative group"
        >
          <form onSubmit={handleSubmit} className="w-full flex flex-col md:flex-row gap-4 md:gap-6 items-end relative z-10">
            <div className="flex-1 w-full space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 ml-2">Type</label>
              <select
                value={activeType}
                onChange={(e) => setActiveType(e.target.value)}
                className="w-full bg-white border border-zinc-200 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer"
              >
                <option value="order">ORDER</option>
                <option value="return">RETURN</option>
                <option value="exchange">EXCHANGE</option>
              </select>
            </div>

            <div className="flex-1 w-full space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 ml-2">{config.label}</label>
              <input
                type="text" required value={orderId} onChange={(e) => setOrderId(e.target.value)}
                placeholder={config.placeholder}
                className="w-full bg-white border border-zinc-200 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
              />
            </div>

            <div className="flex-1 w-full space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 ml-2">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="w-full bg-white border border-zinc-200 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full md:w-auto px-10 h-[58px] bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>{config.buttonText} <ArrowRight size={14} /></>}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-8"
              >
                <div className="p-4 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center gap-4">
                  <AlertCircle size={16} />
                  <p className="text-[9px] font-black uppercase tracking-widest">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {orderData && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 space-y-16"
            >
              <div className="text-center group flex flex-col items-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Live Status</p>
                <h3 className="text-3xl md:text-5xl font-black uppercase italic text-black tracking-tighter flex items-center gap-4">
                  <Truck className="text-black" size={32} />
                  {orderData.orderStatus}
                </h3>

                <div className="mt-6 flex flex-col items-center gap-2">
                  {orderData.returnId ? (
                    <div className="text-center">
                      <span className="text-orange-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        {orderData.returnType === 'Exchange' ? 'EXC' : 'RTN'} ID: {orderData.returnId}
                        <span className="bg-orange-100 px-2 py-0.5 rounded text-[8px]">
                          {orderData.returnQty} {orderData.returnQty === 1 ? 'PC' : 'PCS'}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                      REF: {orderData.trackingId} <span className="text-zinc-200">/</span> {orderData.deliveryPartner || 'SLOOK DISPATCH'}
                    </p>
                  )}
                  
                  <button onClick={() => { navigator.clipboard.writeText(orderData._id); toastSuccess("Artifact ID Copied!") }} className="flex items-center gap-3 bg-zinc-100 px-6 py-3 rounded-2xl text-sm md:text-lg font-black text-black hover:bg-zinc-200 transition-all font-mono">
                    <Copy size={16} /> {orderData._id}
                  </button>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="max-w-3xl mx-auto w-full relative pt-12">
                <div className="absolute top-[84px] left-0 w-full h-[2px] bg-zinc-100" />
                <div className="relative flex justify-between">
                  {getMilestones().map((m: any, idx) => {
                    const status = getStepStatus(idx, m);
                    const isActive = status === 'active';
                    const isCompleted = status === 'completed';
                    const Icon: any = m.icon;
                    const date = m.dateKey ? orderData[m.dateKey] : null;

                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center w-24 md:w-32">
                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-700 border ${isActive ? 'bg-black border-black text-white shadow-2xl scale-110' :
                          isCompleted ? 'bg-zinc-50 border-zinc-200 text-black' :
                            'bg-white border-zinc-100 text-zinc-200'
                          }`}>
                          <Icon size={16} />
                        </div>

                        <div className="mt-6 text-center space-y-1">
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-black' : isCompleted ? 'text-zinc-500' : 'text-zinc-200'}`}>
                            {m.label}
                          </p>
                          {(date || (orderData.returnStatus && m.status && (Array.isArray(m.status) ? m.status.includes(orderData.returnStatus) : m.status === orderData.returnStatus))) && (
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                              {formatDate(date || orderData.updatedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-12 text-center">
                <Link href="/support" className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all group">
                  Require Reinforcement? <span className="underline decoration-2 underline-offset-4 decoration-zinc-100 hover:decoration-black">Contact Support Hub</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader className="animate-spin text-zinc-200" size={40} />
            </div>
        }>
            <TrackOrderContent />
        </Suspense>
    );
}
