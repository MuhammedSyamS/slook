'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import Price from '@/components/shared/Price';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft, MapPin, CreditCard, Truck, Package,
  Loader2, ChevronRight, Star, AlertTriangle, RotateCcw,
  Calendar, CheckCircle, Copy, Clock, ShieldCheck, Box, Play, Camera, Video, X, Send
} from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import Reveal from '@/components/shared/Reveal';
import Link from 'next/link';

interface OrderDetailsProps {
    orderId: string;
}

export const UserOrderDetailsView = ({ orderId }: OrderDetailsProps) => {
    const router = useRouter();
    const { user, refreshUser } = useAuthStore();
    const { success, error: toastError, info } = useToast();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [confirmModal, setConfirmModal] = useState<any>({ show: false, itemId: null, actionType: 'cancel', requestType: 'Return', comment: '' });
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [returnFiles, setReturnFiles] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Exchange Logic
    const [variants, setVariants] = useState<any[]>([]);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [selectedExchangeVariant, setSelectedExchangeVariant] = useState<any>(null);

    const fetchOrder = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data } = await api.get(`/orders/${orderId}`);
            setOrder(data);
        } catch (err: any) {
            console.error("Order Detail Error:", err);
            setError(err.response?.data?.message || "Could not load order details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
        window.scrollTo(0, 0);
    }, [orderId, user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);
                
                const { data } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (data.secure_url) {
                    uploadedUrls.push(data.secure_url);
                }
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
            setReturnFiles(prev => [...prev, ...uploadedUrls]);
            success(`Attached ${files.length} visual proof(s)`);
        } catch (err) {
            toastError("Secure upload failed");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleAction = async () => {
        try {
            if (confirmModal.actionType === 'cancel') {
                await api.put(`/orders/${order._id}/cancel/${confirmModal.itemId}`);
                success("Cancelled Successfully");
            } else {
                if (!returnReason) return toastError("Please select a reason");
                if (returnFiles.length === 0) return toastError("Unboxing proof is required");
                if (confirmModal.requestType === 'Exchange' && !selectedExchangeVariant) return toastError("Please select a size for exchange");

                await api.post('/returns', {
                    orderId: order._id,
                    itemId: confirmModal.itemId,
                    type: confirmModal.requestType,
                    reason: returnReason,
                    comment: confirmModal.comment,
                    images: returnFiles,
                    selectedVariant: selectedExchangeVariant
                });

                success(`${confirmModal.requestType} Requested Successfully`);
            }
            setConfirmModal({ ...confirmModal, show: false });
            fetchOrder();
        } catch (err: any) {
            toastError(err.response?.data?.message || "Action failed");
        }
    };

    const downloadInvoice = async () => {
        try {
            info("Downloading Invoice...");
            const response = await api.get(`/orders/${order._id}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${order._id.slice(-8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toastError("Failed to download invoice");
        }
    };

    const fetchVariants = async (productId: string) => {
        setVariantsLoading(true);
        try {
            const { data } = await api.get(`/products/${productId}/variants`);
            setVariants(data.filter((v: any) => v.stock > 0));
        } catch (err) {
            toastError("Failed to fetch available variants");
        } finally {
            setVariantsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center pt-20">
                <Loader2 className="animate-spin text-zinc-200" size={40} />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-300">Loading Order Details...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
                <div className="text-center space-y-6">
                    <p className="font-black text-red-500 uppercase tracking-widest text-xs">{error || "Object Not Found"}</p>
                    <button onClick={() => router.push('/orders')} className="bg-black text-white px-12 py-5 rounded-full uppercase tracking-widest text-[10px] font-black shadow-xl">
                        Return to Archive
                    </button>
                </div>
            </div>
        );
    }

    const orderRef = order._id?.slice(-8).toUpperCase();

    return (
        <div className="min-h-screen bg-zinc-50/50 pb-20 font-sans text-[#1a1a1a] page-top">
            <div className="container-responsive">
                {/* BREADCRUMB / BACK */}
                <button
                    onClick={() => {
                        if (user?.role === 'admin' || user?.role === 'manager' || (user as any)?.permissions?.includes('manage_orders')) {
                            router.push('/admin/orders');
                        } else {
                            router.push('/orders');
                        }
                    }}
                    className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-8 hover:text-black transition-colors"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to {user?.role === 'admin' || user?.role === 'manager' || (user as any)?.permissions?.includes('manage_orders') ? 'Orders' : 'Order History'}
                </button>

                {/* HEADER SECTION */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-sm border border-zinc-100 mb-6 md:mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="w-full lg:w-auto">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                    order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                    order.orderStatus === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                                    order.orderStatus === 'Dispatched' ? 'bg-indigo-100 text-indigo-700' :
                                    order.orderStatus === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                                    order.orderStatus === 'Processing' ? 'bg-teal-100 text-teal-700' :
                                    order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    order.orderStatus === 'Returned' ? 'bg-orange-100 text-orange-700' :
                                    order.orderStatus === 'Exchanged' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {order.orderStatus || 'Pending'}
                                </span>
                                <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest">
                                    Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            <h1 className="!text-[10px] md:!text-xl font-black uppercase tracking-tight mb-4">
                                Order #{order._id?.slice(-6).toUpperCase()}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                                    <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">{order._id}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(order._id); success("ID Copied!"); }} className="text-zinc-300 hover:text-black transition-colors" title="Copy ID">
                                        <Copy size={10} />
                                    </button>
                                </div>

                                <button onClick={downloadInvoice} className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95">
                                    <Package size={12} className="w-3 h-3" /> Download Invoice
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-1 border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Total Amount</span>
                            <Price amount={order.totalPrice} className="!text-xl md:!text-2xl font-black tracking-tighter" />
                        </div>
                    </div>
                </div>

                {/* UNBOXING REMINDER FOR DELIVERED ORDERS */}
                {order.orderStatus === 'Delivered' && (
                    <Reveal>
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 md:mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0 text-orange-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[8px] font-black uppercase tracking-widest text-orange-700 mb-0.5">Unboxing Reminder</h4>
                                <p className="text-[9px] font-bold text-orange-800 leading-tight uppercase tracking-tight">
                                    Please ensure you have recorded an <strong>Unboxing Video</strong>. It is <strong>Mandatory</strong> for any return or exchange requests.
                                </p>
                            </div>
                        </div>
                    </Reveal>
                )}

                {/* ORDER TRACKING */}
                <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 lg:p-8 shadow-sm border border-zinc-100 mb-6 md:mb-8 overflow-hidden relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
                        <div>
                            <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1.5">Shipment Status</p>
                            <h2 className="!text-sm md:!text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                                <Truck className="text-black" size={14} />
                                {order.returnId ? (
                                    <div className="flex flex-col">
                                        <span className="text-orange-500 flex items-center gap-2 !text-xs">
                                            Track {order.returnType === 'Exchange' ? 'Exchange' : 'Return'}: {order.returnId}
                                            <span className="!text-[8px] bg-orange-100 px-2 py-0.5 rounded-full text-orange-600 not-italic">
                                                {order.returnQty} {order.returnQty === 1 ? 'PC' : 'PCS'}
                                            </span>
                                        </span>
                                        {order.returnTrackingId && (
                                            <span className="!text-[8px] text-zinc-400 font-bold tracking-widest not-italic mt-1">
                                                {order.returnType === 'Exchange' ? 'EXC' : 'RTN'} TRK: {order.returnTrackingId} <span className="text-zinc-200">/</span> {order.returnCourier || 'LOGISTICS'}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    'Tracking Your Look'
                                )}
                            </h2>
                        </div>

                        {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                            <div className="bg-zinc-50 px-3 py-2 md:px-4 md:py-3 rounded-2xl border border-zinc-100 flex items-center gap-3">
                                <div className="w-7 h-7 md:w-8 md:h-8 bg-black text-white rounded-full flex items-center justify-center animate-pulse">
                                    <Calendar size={14} />
                                </div>
                                <div>
                                    <p className="!text-[7px] md:!text-[8px] font-black uppercase tracking-widest text-zinc-400">Estimated Arrival</p>
                                    <p className="!text-[9px] md:!text-[10px] font-black uppercase">{new Date(new Date(order.createdAt).setDate(new Date(order.createdAt).getDate() + 5)).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative pt-10 pb-4 overflow-x-auto no-scrollbar">
                        <div className="min-w-[800px] relative px-4">
                            {(() => {
                                const getMilestones = () => {
                                    const base = [
                                        { label: 'Order Placed', icon: Box, key: 'createdAt', id: 'Pending' },
                                        { label: 'Processing', icon: Clock, key: 'processingAt', id: 'Processing' },
                                        { label: 'Quality Check', icon: ShieldCheck, key: 'confirmedAt', id: 'Confirmed' },
                                        { label: 'In Transit', icon: Truck, key: 'shippedAt', id: 'Shipped' },
                                        { label: 'Delivered', icon: CheckCircle, key: 'deliveredAt', id: 'Delivered' }
                                    ];

                                    if (order.orderStatus === 'Return Requested' || order.orderStatus === 'Returned') {
                                        base.push({ label: 'Return Initiated', icon: RotateCcw, key: 'returnRequestedAt', id: 'Return Requested' });
                                    }
                                    if (order.orderStatus === 'Returned') {
                                        base.push({ label: 'Finalized', icon: ShieldCheck, key: 'returnedAt', id: 'Returned' });
                                    }
                                    return base;
                                };

                                const milestones = getMilestones();
                                const statusFlow: any = {
                                    'Pending': 0, 'Processing': 1, 'Confirmed': 2, 'Dispatched': 3, 'Shipped': 3, 'Delivered': 4,
                                    'Return Requested': 5, 'Returned': 6
                                };
                                const currentLevel = statusFlow[order.orderStatus] || 0;

                                return (
                                    <>
                                        <div className="absolute top-[19px] left-0 w-full h-[2px] bg-zinc-100 z-0"></div>
                                        <div
                                            className="absolute top-[19px] left-0 h-[3px] bg-black z-0 transition-all duration-[2s] ease-in-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                                            style={{ width: `${(currentLevel / (milestones.length - 1)) * 100}%` }}
                                        ></div>

                                        <div className="relative z-10 flex justify-between">
                                            {milestones.map((step, idx) => {
                                                const Icon = step.icon;
                                                const isCompleted = currentLevel > idx;
                                                const isActive = currentLevel === idx;
                                                const date = order[step.key];

                                                return (
                                                    <div key={idx} className="flex flex-col items-center group w-24 md:w-32">
                                                        <div className={`
                                                            w-6 h-6 md:w-10 md:h-10 rounded-2xl flex items-center justify-center transition-all duration-700 relative border
                                                            ${isActive ? 'bg-black border-black text-white shadow-xl scale-110' :
                                                            isCompleted ? 'bg-zinc-50 border-zinc-200 text-black' :
                                                            'bg-white border-zinc-100 text-zinc-200'}
                                                            ${isActive ? 'ring-[6px] ring-zinc-50' : ''}
                                                        `}>
                                                            <div className="flex items-center justify-center">
                                                                <Icon size={12} />
                                                            </div>
                                                            {isActive && (
                                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-bounce" />
                                                            )}
                                                        </div>

                                                        <div className="mt-3 md:mt-4 text-center">
                                                            <p className={`!text-[7px] md:!text-[9px] font-black uppercase tracking-widest mb-1 transition-colors ${isActive ? 'text-black' : isCompleted ? 'text-zinc-600' : 'text-zinc-300'}`}>
                                                                {step.label}
                                                            </p>
                                                            {date && (
                                                                <p className="!text-[6px] md:!text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mt-0.5">
                                                                    {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-10 border-t border-zinc-100">
                    {/* SHIPPING INFO */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <MapPin size={14} />
                            <span className="!text-[8px] md:!text-[10px] font-black uppercase tracking-widest">Shipping Address</span>
                        </div>
                        <div className="!text-[10px] md:!text-sm font-bold text-zinc-700 leading-relaxed uppercase">
                            <p>{order.shippingAddress?.address}</p>
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                            <p className="text-zinc-400 mt-1">Ph: {order.shippingAddress?.phone}</p>
                        </div>
                    </div>

                    {/* PAYMENT INFO */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard size={14} />
                            <span className="!text-[8px] md:!text-[10px] font-black uppercase tracking-widest">Payment Method</span>
                        </div>
                        <div>
                            <p className="!text-[10px] md:!text-sm font-bold text-zinc-700 uppercase">
                                {order.paymentMethod === 'cod' ? 'Cash On Delivery' : order.paymentMethod}
                            </p>
                            <p className="!text-[8px] md:!text-[10px] font-bold text-green-600 mt-1 uppercase flex items-center gap-1">
                                <CheckCircle size={10} /> Payment {order.isPaid ? 'Completed' : 'Pending'}
                            </p>
                        </div>
                    </div>

                    {/* DELIVERY STATUS */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Truck size={14} />
                            <span className="!text-[8px] md:!text-[10px] font-black uppercase tracking-widest">Delivery Details</span>
                        </div>
                        <div className="!text-[10px] md:!text-sm font-bold text-zinc-700">
                            {order.isDispatched ? (
                                <div className="space-y-1">
                                    <p className="uppercase">{order.deliveryPartner || 'Standard Courier'}</p>
                                    <p className="font-mono text-zinc-400 !text-[9px] md:!text-xs">TRK: {order.trackingId || 'Pending'}</p>
                                    <button onClick={() => router.push('/track-order')} className="!text-[8px] md:!text-[10px] font-black underline mt-2 hover:text-black">
                                        TRACK PACKAGE
                                    </button>
                                </div>
                            ) : (
                                <p className="text-zinc-500 font-medium">Expected dispatch within 24hrs</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* FINANCIAL SUMMARY */}
                <div className="mt-8 bg-zinc-900 text-white rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 flex items-center gap-2">
                            <CreditCard size={12} /> Financial Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Items Subtotal</p>
                                <p className="text-xl font-black">₹{order.orderItems?.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Shipping & Handling</p>
                                <p className="text-xl font-black">₹{(order.shippingPrice || 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Tax / GST</p>
                                <p className="text-xl font-black">₹{(order.taxPrice || 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">Total Valuation</p>
                                <p className="text-2xl md:text-3xl font-black text-white italic">₹{order.totalPrice.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SPECIAL INSTRUCTIONS */}
                {order.orderNote && (
                    <div className="mt-8 pt-8 border-t border-zinc-100">
                        <div className="flex items-center gap-2 text-zinc-400 mb-3">
                            <Clock size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Special Delivery Instructions</span>
                        </div>
                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                            <p className="!text-[10px] md:!text-xs font-bold text-zinc-600 leading-relaxed uppercase tracking-tight">
                                "{order.orderNote}"
                            </p>
                        </div>
                    </div>
                )}

                {/* ITEMS SECTION */}
                <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mt-12">
                    <div className="p-8 border-b border-zinc-100">
                        <h2 className="!text-lg md:!text-xl font-black uppercase tracking-tight">Order Items ({order.orderItems?.length})</h2>
                    </div>

                    <div className="hidden lg:block">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    <th className="py-6 px-8">Product Details</th>
                                    <th className="py-6 px-4">Unit Price</th>
                                    <th className="py-6 px-4 text-center">Quantity</th>
                                    <th className="py-6 px-4">Total</th>
                                    <th className="py-6 px-8 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {order.orderItems.map((item: any, i: number) => {
                                    const productLink = item.product?.slug || item.product?._id || item.product;
                                    const isLinkable = typeof productLink === 'string';
                                    return (
                                        <tr key={i} className="hover:bg-zinc-50/50 transition-colors group">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-20 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                                                        <img src={resolveMediaURL(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={isLinkable ? `/product/${productLink}` : '#'}
                                                            className={`font-bold text-sm uppercase block mb-1 ${isLinkable ? 'hover:underline' : 'pointer-events-none'}`}
                                                        >
                                                            {item.name}
                                                        </Link>
                                                        {item.size && (
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                                                                {item.size} {item.color && `/ ${item.color}`}
                                                            </p>
                                                        )}
                                                        {item.status !== 'Ordered' && (
                                                            <span className="bg-zinc-100 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">{item.status}</span>
                                                        )}
                                                        {(item.isReturned || item.isExchanged) && (
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2 mt-2">
                                                                <Clock size={10} /> Service Requested
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-sm font-medium font-mono"><Price amount={item.price} /></td>
                                            <td className="py-6 px-4 text-center text-sm font-bold">x {item.qty}</td>
                                            <td className="py-6 px-4 text-sm font-bold font-mono"><Price amount={item.price * item.qty} /></td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex justify-end gap-3">
                                                    {!order.isDispatched && item.status === 'Ordered' && (
                                                        <button onClick={() => { setConfirmModal({ show: true, itemId: item._id, actionType: 'cancel' }); }} className="text-[9px] font-bold uppercase tracking-wider text-red-500 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition">Cancel</button>
                                                    )}
                                                    {order.orderStatus === 'Delivered' && item.status === 'Ordered' && (
                                                        <>
                                                            <button onClick={() => router.push(`/product/${productLink}#reviews`)} className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-100 transition">Review</button>
                                                            <button onClick={() => { setConfirmModal({ show: true, itemId: item._id, actionType: 'return', requestType: 'Return' }); }} className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-100 transition">Return</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL SYSTEM */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setConfirmModal({ ...confirmModal, show: false })} />
                    <div className="relative bg-white w-full max-w-lg rounded-3xl p-6 md:p-10 overflow-y-auto max-h-[90vh] shadow-2xl">
                        <button 
                            onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                            className="absolute top-6 right-6 text-zinc-300 hover:text-black transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">
                            {confirmModal.actionType === 'cancel' ? 'Cancel Item' : 'Request Service'}
                        </h3>

                        {confirmModal.actionType === 'cancel' ? (
                            <p className="text-zinc-500 text-[10px] font-bold mb-8 uppercase tracking-widest leading-relaxed">
                                Are you sure you want to cancel this item? This action cannot be undone and the refund will be processed to the original payment source.
                            </p>
                        ) : (
                            <div className="space-y-6 mb-8">
                                <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-100">
                                    {['Return', 'Exchange'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setConfirmModal({ ...confirmModal, requestType: type });
                                                if (type === 'Exchange') {
                                                    const item = order.orderItems.find((it: any) => it._id === confirmModal.itemId);
                                                    fetchVariants(item.product?._id || item.product);
                                                }
                                            }}
                                            className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                confirmModal.requestType === type ? 'bg-black text-white shadow-md' : 'text-zinc-400 hover:text-black'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                {confirmModal.requestType === 'Exchange' && (
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-2">Select Replacement Size</label>
                                        {variantsLoading ? (
                                            <div className="p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 flex items-center justify-center gap-3">
                                                <Loader2 size={14} className="animate-spin text-zinc-300" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Checking stock...</span>
                                            </div>
                                        ) : variants.length === 0 ? (
                                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-red-500">No other sizes in stock</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {variants.map((v, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedExchangeVariant(v)}
                                                        className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                                                            selectedExchangeVariant?._id === v._id ? 'border-black bg-black text-white' : 'border-zinc-50 bg-zinc-50 text-zinc-400'
                                                        }`}
                                                    >
                                                        {v.size} {v.color && `/ ${v.color}`}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-2">Reason</label>
                                    <select
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-black appearance-none"
                                        value={returnReason}
                                        onChange={e => setReturnReason(e.target.value)}
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="Damaged Product">Damaged Product</option>
                                        <option value="Wrong Item">Wrong Item Received</option>
                                        <option value="Size/Fit Issue">Size/Fit Issue</option>
                                        <option value="Quality Issue">Quality Issue</option>
                                        <option value="Change of Mind">Change of Mind</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-2">Comments</label>
                                    <textarea
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-[11px] font-bold outline-none focus:border-black h-24 resize-none"
                                        placeholder="Tell us more..."
                                        value={confirmModal.comment}
                                        onChange={e => setConfirmModal({...confirmModal, comment: e.target.value})}
                                    />
                                </div>

                                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-orange-600 ml-2 flex items-center gap-2">
                                            <Camera size={14} /> Proof of Unboxing
                                        </label>
                                        <button 
                                            // @ts-ignore
                                            onClick={() => document.getElementById('return-upload')?.click()}
                                            className="text-[8px] font-black uppercase bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full hover:bg-orange-200"
                                        >
                                            Attach Proof
                                        </button>
                                    </div>
                                    <input
                                        id="return-upload"
                                        type="file"
                                        accept="video/*,image/*"
                                        multiple
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    
                                    {uploading && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-orange-400">
                                                <span>Uploading...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-orange-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {returnFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {returnFiles.map((url, idx) => (
                                                <div key={idx} className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-orange-100 relative group">
                                                    <img src={resolveMediaURL(url)} className="w-full h-full object-cover" alt="" />
                                                    <button 
                                                        onClick={() => setReturnFiles(prev => prev.filter((_, i) => i !== idx))}
                                                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="flex-1 py-4 border border-zinc-100 font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-zinc-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={uploading}
                                className={`flex-1 py-4 font-black uppercase tracking-widest text-[9px] rounded-xl text-white shadow-xl transition-all ${
                                    confirmModal.actionType === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-zinc-800'
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
