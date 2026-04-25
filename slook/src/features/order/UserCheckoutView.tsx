'use client'; // Re-sync build to clear stale cache

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToast } from '@/context/ToastContext';
import { 
    ShieldCheck, ArrowLeft, Smartphone, CreditCard, 
    Landmark, Truck, CheckCircle2, Wallet, Star, Zap, X, MapPin
} from 'lucide-react';
import { client as api } from '@/lib/api/client';
import Price from '@/components/shared/Price';
import Reveal from '@/components/shared/Reveal';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const UserCheckoutView = () => {
    const router = useRouter();
    const { user, refreshUser } = useAuthStore();
    const { items: cartItems, coupon: storeCoupon, clearCart } = useCartStore();
    const { settings: siteSettings } = useSettingsStore();
    const { success, error: toastError, info } = useToast();

    const [step, setStep] = useState('shipping');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState<any>(null);
    const [discountError, setDiscountError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        alternatePhone: '',
        orderNote: ''
    });

    // Support for single item checkout (Buy Now)
    const [singleItem, setSingleItem] = useState<any>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('checkoutSingleItem');
        if (stored) {
            try {
                setSingleItem(JSON.parse(stored));
            } catch (e) {
                console.error("Single item parse fail");
            }
        }
    }, []);

    const activeItems = singleItem ? [singleItem] : cartItems;

    const calculateSubtotal = () => {
        return activeItems.reduce((acc, item) => {
            const price = item.price || item.product?.price || 0;
            const qty = item.quantity || 1;
            return acc + (price * qty);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    
    // Loyalty Logic: Match Backend Rules (Max 100 coins OR 30% of order)
    const MAX_COINS_FLAT = 100;
    const MAX_PCT = 0.30;
    const maxRedeemPct = Math.floor(subtotal * MAX_PCT);
    const maxAllowed = Math.min(MAX_COINS_FLAT, maxRedeemPct);
    
    const finalRoyaltyDiscount = useLoyaltyPoints ? Math.min(maxAllowed, user?.loyaltyPoints || 0) : 0;
    
    const currentDiscount = couponApplied ? couponApplied.discountAmount : (storeCoupon ? storeCoupon.discount : 0);
    const calculatedTax = (subtotal * (siteSettings.taxRate / 100));
    const currentShipping = subtotal >= siteSettings.freeShippingThreshold ? 0 : siteSettings.shippingCharge;
    const finalTotal = Math.max(0, subtotal - currentDiscount + calculatedTax + currentShipping - finalRoyaltyDiscount);

    useEffect(() => {
        const stored = sessionStorage.getItem('checkoutSingleItem');
        if (activeItems.length === 0 && !isSubmitting && !stored) {
            router.push('/shop');
        }
        window.scrollTo(0, 0);
    }, [activeItems.length, isSubmitting, router]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        setDiscountError('');
        try {
            const { data } = await api.post('/marketing/verify-coupon', {
                code: couponCode,
                cartTotal: subtotal,
                userId: user?._id
            });
            setCouponApplied({ code: data.code, discountAmount: data.discount });
            success('Coupon Applied Successfully!');
        } catch (error: any) {
            setDiscountError(error.response?.data?.message || 'Invalid Coupon');
            setCouponApplied(null);
            toastError("Invalid Coupon");
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCouponApplied(null);
        setCouponCode('');
        setDiscountError('');
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const getDeliveryEstimate = () => {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        return `Arriving by ${deliveryDate.toLocaleDateString('en-US', options)}`;
    };

    const paymentRef = useRef<HTMLDivElement>(null);
    const actionButtonRef = useRef<HTMLDivElement>(null);

    const goToSelection = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('selection');
        setTimeout(() => {
            if (paymentRef.current) {
                paymentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    const goToPayment = (type: string) => {
        setStep(type);
        setTimeout(() => {
            if (actionButtonRef.current) {
                actionButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            router.push(`/login?callbackUrl=${window.location.pathname}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const orderData = {
                orderItems: activeItems.map(item => ({
                    name: item.name || item.product?.name || 'Unknown Item',
                    qty: item.quantity || 1,
                    image: item.image || item.product?.image,
                    price: item.price || item.product?.price || 0,
                    selectedVariant: item.selectedVariant,
                    product: item.product?._id || item.product || item._id
                })),
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    postalCode: formData.zip,
                    phone: formData.phone,
                    alternatePhone: formData.alternatePhone
                },
                paymentMethod: step,
                totalPrice: finalTotal,
                taxPrice: calculatedTax,
                shippingPrice: currentShipping,
                discountAmount: currentDiscount,
                couponCode: couponApplied?.code || '',
                pointsToRedeem: finalRoyaltyDiscount,
                orderNote: formData.orderNote,
            };

            if (step !== 'cod') {
                const { data: { key } } = await api.get('/payments/key');
                const { data: paymentOrder } = await api.post('/payments/create-order', { amount: finalTotal });

                if (key === 'rzp_test_placeholder' || paymentOrder.id.startsWith('order_mock_')) {
                    success("Simulating Secure Payment...");
                    setTimeout(async () => {
                        try {
                            const orderRes = await api.post('/orders', orderData);
                            await api.post('/payments/verify', {
                                razorpay_order_id: paymentOrder.id,
                                razorpay_payment_id: `pay_mock_${Date.now()}`,
                                razorpay_signature: 'mock_signature_bypass',
                                orderId: orderRes.data._id
                            });
                            
                            if (singleItem) sessionStorage.removeItem('checkoutSingleItem');
                            else clearCart();
                            
                            await refreshUser();
                            router.push(`/order-success?orderId=${orderRes.data.order?._id || orderRes.data._id}`);
                        } catch (err) {
                            toastError("Mock Payment Failed");
                            setIsSubmitting(false);
                        }
                    }, 2000);
                    return;
                }

                const rzpRes = await loadRazorpay();
                if (!rzpRes) {
                    toastError("Razorpay SDK failed to load. Are you online?");
                    setIsSubmitting(false);
                    return;
                }

                const options = {
                    key: key,
                    amount: paymentOrder.amount,
                    currency: paymentOrder.currency,
                    name: "SLOOK",
                    description: "Luxury Purchase",
                    image: "/logo.png",
                    order_id: paymentOrder.id,
                    handler: async function (response: any) {
                        try {
                            const orderRes = await api.post('/orders', orderData);
                            await api.post('/payments/verify', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: orderRes.data._id
                            });
                            if (singleItem) sessionStorage.removeItem('checkoutSingleItem');
                            else clearCart();
                            await refreshUser();
                            router.push(`/order-success?orderId=${orderRes.data.order?._id || orderRes.data._id}`);
                        } catch (vErr) {
                            toastError("Payment verification failed");
                            setIsSubmitting(false);
                        }
                    },
                    prefill: { name: `${formData.firstName} ${formData.lastName}`, email: user.email, contact: formData.phone },
                    theme: { color: "#000000" },
                    modal: { ondismiss: () => setIsSubmitting(false) }
                };

                const rzp1 = new (window as any).Razorpay(options);
                rzp1.open();
            } else {
                const { data } = await api.post('/orders', orderData);
                if (singleItem) sessionStorage.removeItem('checkoutSingleItem');
                else clearCart();
                await refreshUser();
                router.push(`/order-success?orderId=${data.order?._id || data._id}`);
            }
        } catch (err: any) {
            toastError(err.response?.data?.message || "Order failed. Please check details.");
            setIsSubmitting(false);
        }
    };

    if (activeItems.length === 0 && !isSubmitting) return null;

    return (
        <div className="bg-white min-h-screen page-top pb-20 font-sans text-[#1a1a1a]">
            <div className="container-responsive">
                {/* TOP NAV */}
                <button
                    onClick={() => {
                        if (step === 'shipping') router.back();
                        else if (step === 'selection') setStep('shipping');
                        else setStep('selection');
                    }}
                    className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-8 hover:text-black transition"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    {step === 'shipping' ? 'Back to Bag' : 'Change Method'}
                </button>

                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-12">
                    Secure Checkout
                </h1>

                {/* GRID LAYOUT: LEFT (FORM) | RIGHT (SUMMARY) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    <div className="lg:col-span-7 xl:col-span-8 order-1 scroll-mt-40 md:scroll-mt-52" ref={paymentRef}>
                        
                        {/* STEP INDICATOR */}
                        <div className="flex items-center gap-4 mb-10 !text-[9px] md:!text-[10px] font-black uppercase tracking-widest text-zinc-300">
                            <span className={`flex items-center gap-2 ${step === 'shipping' ? 'text-black' : 'text-green-500'}`}>
                                <span className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-current flex items-center justify-center text-[8px] md:text-[9px]">1</span> Shipping
                            </span>
                            <div className="w-8 h-px bg-zinc-200"></div>
                            <span className={`flex items-center gap-2 ${step !== 'shipping' ? 'text-black' : ''}`}>
                                <span className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-current flex items-center justify-center text-[8px] md:text-[9px]">2</span> Payment
                            </span>
                        </div>

                        {/* STEP 1: SHIPPING FORM */}
                        {step === 'shipping' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="!text-[10px] md:!text-[12px] font-black uppercase tracking-widest mb-8 text-zinc-800">Shipping Details</h2>

                                <form id="checkout-form" onSubmit={goToSelection} className="space-y-8">
                                    {user?.addresses?.length > 0 && (
                                        <div className="mb-10">
                                            <p className="text-sm md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Saved Locations</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {user.addresses.map((addr: any, i: number) => (
                                                    <div key={i} onClick={() => {
                                                        setFormData({ 
                                                            ...formData, 
                                                            firstName: user.firstName || '',
                                                            lastName: user.lastName || '',
                                                            address: addr.street, 
                                                            city: addr.city, 
                                                            state: addr.state || '', 
                                                            zip: addr.zip, 
                                                            phone: addr.phone || formData.phone, 
                                                            alternatePhone: addr.alternatePhone || formData.alternatePhone 
                                                        });
                                                    }} className="p-5 border border-zinc-200 rounded-2xl cursor-pointer hover:border-black hover:bg-zinc-50 transition-all text-left">
                                                        <p className="font-bold text-sm md:text-xs uppercase mb-1">{addr.label}</p>
                                                        <p className="text-sm md:text-[11px] text-zinc-500 leading-relaxed font-medium">{addr.street}, {addr.city}{addr.state ? `, ${addr.state}` : ''}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 my-8">
                                                <div className="h-px bg-zinc-100 flex-1"></div>
                                                <span className="!text-[8px] md:!text-[9px] font-black uppercase text-zinc-300">OR ENTER NEW</span>
                                                <div className="h-px bg-zinc-100 flex-1"></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">First Name</label>
                                            <input type="text" required className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">Last Name</label>
                                            <input type="text" required className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">Address</label>
                                        <input type="text" required className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">City</label>
                                            <input type="text" required className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">State</label>
                                            <input type="text" required className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">Postal Code</label>
                                        <input type="text" required className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">Phone</label>
                                            <input type="tel" required className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="!text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-400">Alternate Phone <span className="text-[8px] font-normal tracking-normal lowercase">(Optional)</span></label>
                                            <input type="tel" className="!text-[12px] md:!text-[14px] w-full border-b border-zinc-200 py-2 outline-none focus:border-black bg-transparent font-bold" value={formData.alternatePhone} onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })} />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* STEP 2: PAYMENT METHOD */}
                        {step !== 'shipping' && (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                <h2 className="!text-[10px] md:!text-[12px] font-black uppercase tracking-widest mb-8 text-zinc-800">Select Payment Method</h2>
                                
                                <div className="space-y-4">
                                    {[
                                        { id: 'upi', name: 'UPI / QR Code', icon: <Smartphone />, desc: 'Google Pay, PhonePe, Paytm' },
                                        { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard />, desc: 'Visa, Mastercard, RuPay' },
                                        { id: 'netbanking', name: 'Net Banking', icon: <Landmark />, desc: 'All Indian Banks' },
                                        { id: 'wallet', name: 'Wallets', icon: <Wallet />, desc: 'Paytm, PhonePe, Amazon Pay' },
                                        { id: 'cod', name: 'Cash On Delivery', icon: <Truck />, desc: 'Pay with cash upon delivery' }
                                    ].map(method => (
                                        <div 
                                            key={method.id} 
                                            className={`
                                                relative overflow-hidden rounded-2xl border transition-all duration-300
                                                ${step === method.id ? 'border-black bg-zinc-900 text-white shadow-xl scale-[1.02]' : 'border-zinc-200 bg-white hover:border-zinc-300 cursor-pointer'}
                                            `}
                                        >
                                            <button onClick={() => goToPayment(method.id)} className="w-full p-6 md:p-8 flex items-center text-left">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-6 text-xl transition-colors ${step === method.id ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-black'}`}>
                                                    {method.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="!text-[11px] md:!text-[13px] font-black uppercase tracking-wide">{method.name}</h3>
                                                    <p className={`!text-[9px] md:!text-[10px] font-medium mt-1 uppercase tracking-widest ${step === method.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{method.desc}</p>
                                                </div>
                                                {step === method.id && <CheckCircle2 className="text-green-500" size={24} />}
                                            </button>

                                            {/* Saved Cards Logic */}
                                            {method.id === 'card' && step === 'card' && user?.savedCards?.length > 0 && (
                                                <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                                                    <div className="h-px bg-zinc-800 w-full mb-4 opacity-50"></div>
                                                    <p className="text-[10px] font-bold uppercase text-zinc-500 mb-3">Saved Cards</p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {user.savedCards.map((card: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700 w-max pr-8 cursor-pointer hover:bg-zinc-700">
                                                                <div className="text-[10px] font-mono p-1 bg-white text-black rounded uppercase">{card.brand}</div>
                                                                <span className="font-mono text-xs text-white">•••• {card.last4}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* COUPON SECTION */}
                                <div className="mt-8 pt-8 border-t border-zinc-100 flex flex-col gap-8 animate-in slide-in-from-top-4 duration-700">
                                    <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Zap size={18} className="text-zinc-900" />
                                            <h3 className="!text-[11px] md:!text-[13px] font-black uppercase tracking-widest">Applying a Promo Code?</h3>
                                        </div>

                                        {couponApplied ? (
                                            <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-2xl">
                                                <div>
                                                    <p className="text-[10px] md:text-xs font-black uppercase text-green-700 tracking-widest">{couponApplied.code}</p>
                                                    <p className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">
                                                        Savings applied to your order
                                                    </p>
                                                </div>
                                                <button onClick={removeCoupon} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">Remove</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 relative">
                                                <input 
                                                    type="text"
                                                    placeholder="ENTER COUPON CODE" 
                                                    className="flex-1 bg-white border border-zinc-200 rounded-2xl px-4 py-3 !text-[11px] md:!text-xs font-bold uppercase tracking-widest outline-none focus:border-black transition-colors shadow-sm"
                                                    value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                                />
                                                <button 
                                                    onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponCode}
                                                    className="bg-black text-white px-6 rounded-2xl !text-[10px] md:!text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md"
                                                >
                                                    {isValidatingCoupon ? 'Wait' : 'Apply'}
                                                </button>
                                            </div>
                                        )}
                                        {discountError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-2">{discountError}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: STICKY SUMMARY */}
                    <div className="lg:col-span-5 xl:col-span-4 order-2">
                        <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 lg:sticky lg:top-32">
                            <h3 className="!text-[12px] md:!text-[14px] font-black uppercase tracking-widest mb-6 border-b border-zinc-200 pb-4">Bag Summary</h3>
                            
                            <div className="space-y-4 mb-8 custom-scrollbar max-h-[40vh] overflow-y-auto pr-2">
                                {activeItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="w-10 h-14 md:w-12 md:h-16 bg-white rounded-lg border border-zinc-200 overflow-hidden shrink-0">
                                            <img src={resolveMediaURL(item.image)} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="!text-[11px] md:!text-xs font-bold uppercase truncate">{item.name}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="!text-[9px] md:!text-[10px] text-zinc-500 font-mono">Qty: {item.quantity}</span>
                                                <Price amount={item.price} className="!text-[10px] md:!text-[11px] font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 border-t border-dashed border-zinc-200 pt-6">
                                {user?.loyaltyPoints >= 100 && (
                                    <div className={`p-4 rounded-2xl border transition-all cursor-pointer mb-4 ${useLoyaltyPoints ? 'bg-amber-50 border-amber-200' : 'bg-white border-zinc-100'}`} onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-full ${useLoyaltyPoints ? 'bg-amber-400 text-white' : 'bg-zinc-100 text-zinc-400'}`}><Star size={10} fill="currentColor" /></div>
                                                <div>
                                                    <p className="!text-[10px] md:!text-[11px] font-black uppercase tracking-tight">Redeem {finalRoyaltyDiscount} Coins</p>
                                                    <p className="!text-[8px] md:!text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Saves ₹{finalRoyaltyDiscount} on this order (Max {maxAllowed})</p>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-4 rounded-full relative transition-colors ${useLoyaltyPoints ? 'bg-amber-400' : 'bg-zinc-200'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${useLoyaltyPoints ? 'left-4.5' : 'left-0.5'}`} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between !text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                                    <span>Subtotal</span>
                                    <Price amount={subtotal} />
                                </div>
                                {currentDiscount > 0 && (
                                    <div className="flex justify-between !text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-green-600">
                                        <span>Coupon Discount</span>
                                        <Price amount={currentDiscount} />
                                    </div>
                                )}
                                {finalRoyaltyDiscount > 0 && (
                                    <div className="flex justify-between !text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-amber-600">
                                        <span>Loyalty Redemption</span>
                                        <span>-₹{finalRoyaltyDiscount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between !text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                                    <span>Tax ({siteSettings.taxRate}%)</span>
                                    <Price amount={calculatedTax} />
                                </div>
                                <div className="flex justify-between !text-[10px] md:!text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                                    <span>Shipping</span>
                                    <span>{currentShipping === 0 ? 'FREE' : <Price amount={currentShipping} />}</span>
                                </div>
                                <div className="flex justify-between !text-[14px] md:!text-base font-black uppercase pt-2">
                                    <span>Total</span>
                                    <Price amount={finalTotal} className="!text-[18px] md:!text-xl" />
                                </div>
                            </div>

                            {/* DELIVERY ESTIMATE */}
                            <div className="mt-8 pt-6 border-t border-zinc-100">
                                <div className="flex items-center gap-3 text-zinc-400 mb-2">
                                    <Truck size={14} />
                                    <span className="!text-[10px] md:!text-[12px] font-black uppercase tracking-widest">Estimated Delivery</span>
                                </div>
                                <p className="!text-[11px] md:!text-[13px] font-bold text-black">{getDeliveryEstimate()}</p>
                                <p className="!text-[9px] md:!text-[11px] text-zinc-400 mt-1">Standard Shipping to {formData.city || 'your city'}</p>
                            </div>

                            {/* ACTION BUTTON */}
                            <div className="mt-8" ref={actionButtonRef}>
                                {step === 'shipping' ? (
                                    <button 
                                        form="checkout-form"
                                        type="submit"
                                        className="w-full bg-black text-white py-5 rounded-full font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 !text-[12px] md:!text-[14px]"
                                    >
                                        Confirm Shipping
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmitting || step === 'selection'}
                                        className={`w-full py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 !text-[12px] md:!text-[14px] ${step === 'selection' || isSubmitting
                                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none transform-none'
                                            : 'bg-black text-white hover:bg-zinc-900'
                                        }`}
                                    >
                                        {isSubmitting ? 'Confirming...' : 'Complete Payment'}
                                    </button>
                                )}

                                <p className="!text-[9px] md:!text-[10px] text-zinc-400 text-center mt-4 font-bold uppercase tracking-widest">
                                    <ShieldCheck size={12} className="inline mr-1 mb-0.5" />
                                    Secure 256-bit SSL Encrypted
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
