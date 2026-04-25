'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { useRouter, useSearchParams } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';
import {
    Package,
    Heart,
    User,
    MapPin,
    CreditCard,
    Bell,
    LogOut,
    ChevronRight,
    ShieldCheck,
    Star,
    RotateCcw,
    MessageSquare,
    Trophy,
    Crown,
    Info,
    X,
    Camera,
    Image as ImageIcon,
    PlusCircle,
    Search,
    Trash2,
    CheckCircle2,
    Plus,
    UserPlus
} from 'lucide-react';

export const AccountView = () => {
    const { user, logout, refreshUser } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { success, error: toastError, info } = useToast();
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [myLooks, setMyLooks] = useState<any[]>([]);
    const [loadingLooks, setLoadingLooks] = useState(true);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload Modal State
    const [uploadStep, setUploadStep] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');
    const [taggedProducts, setTaggedProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tagCoords, setTagCoords] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (searchParams.get('action') === 'upload') {
            setShowUploadModal(true);
        }
    }, [searchParams]);

    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchMyLooks = async () => {
            try {
                const { data } = await api.get('/looks/my');
                setMyLooks(data);
            } catch (err) {
                console.error('Error fetching my looks:', err);
            } finally {
                setLoadingLooks(false);
            }
        };

        if (user) {
            fetchMyLooks();
            refreshUser();
        }
    }, [user, refreshUser]);

    if (!user) {
        return null; // Will be handled by middleware or layout if needed
    }

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Store Guest';

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/users/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await refreshUser();
            success("Profile picture updated!");
        } catch (err: any) {
            toastError(err.response?.data?.message || "Failed to update profile picture");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const AccountCard = ({ icon: Icon, title, subtext, onClick, danger = false }: any) => (
        <button
            onClick={onClick}
            className={`group flex items-center p-6 border rounded-[2rem] transition-all duration-300 text-left ${danger ? 'bg-red-50 border-red-100 hover:bg-red-100' : 'bg-white border-zinc-100 hover:border-black hover:shadow-xl'}`}
        >
            <div className={`p-4 rounded-full mr-5 transition-colors ${danger ? 'bg-red-100 text-red-600' : 'bg-zinc-50 text-black group-hover:bg-black group-hover:text-white'}`}>
                <Icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
                <h3 className={`font-black uppercase tracking-tight text-lg mb-1 ${danger ? 'text-red-700' : 'text-black'}`}>{title}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${danger ? 'text-red-400' : 'text-zinc-400'}`}>{subtext}</p>
            </div>
            <ChevronRight className={`w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${danger ? 'text-red-400' : 'text-zinc-300'}`} />
        </button>
    );

    return (
        <div className="min-h-screen bg-white pb-20 px-4 md:px-6 pt-40 md:pt-48 font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Profile Header */}
                <div className="mb-16 text-center">
                    <div className="flex flex-col items-center mb-10 relative">
                        <div 
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-zinc-50 flex items-center justify-center transition-transform group-hover:scale-105">
                                {user.avatar ? (
                                    <img src={resolveMediaURL(user.avatar)} alt={displayName} className={`w-full h-full object-cover ${isUploadingAvatar ? 'opacity-50' : 'opacity-100'}`} />
                                ) : (
                                    <User size={48} className="text-zinc-200" />
                                )}
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black text-white p-2.5 rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                                <Camera size={16} />
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} accept="image/*" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <div className="bg-zinc-950 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-xl border border-white/10">
                            <Crown size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{user?.membershipTier || 'Bronze'} Elite</span>
                        </div>
                        <div className="bg-white text-zinc-950 px-6 py-2 rounded-full flex items-center gap-2 shadow-lg border border-zinc-100">
                            <Trophy size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{user?.loyaltyPoints ?? 0} Coins</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="!text-3xl md:!text-5xl font-black text-black mb-2 md:mb-4 uppercase tracking-tighter leading-none">
                            My <span className="text-red-600">Account</span>
                        </h1>
                        <div className="h-0.5 w-10 bg-black mt-4 mx-auto"></div>
                    </div>
                    <p className="text-zinc-500 text-[10px] md:text-sm font-bold uppercase tracking-widest">
                        Welcome back, <span className="text-black font-black">{displayName}</span>
                    </p>
                    {user?.phone && (
                        <p className="text-zinc-400 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] mt-2">
                            {user.phone}
                        </p>
                    )}
                </div>

                {/* Dashboard Sections */}
                <div className="space-y-16 mt-12">
                    {/* Section 1: Profile & Security */}
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-6 px-2">Profile & Security</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <AccountCard icon={User} title="My Profile" subtext="View current identity data" onClick={() => router.push('/account/edit')} />
                            <AccountCard icon={ShieldCheck} title="Security" subtext="Password & account protection" onClick={() => router.push('/settings/security')} />
                            <AccountCard icon={MapPin} title="Addresses" subtext="Manage shipping locations" onClick={() => router.push('/settings/addresses')} />
                            <AccountCard icon={CreditCard} title="Payments" subtext="Saved cards & billing info" onClick={() => router.push('/settings/payments')} />
                        </div>
                    </div>

                    {/* Section 2: Shopping & Transactions */}
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-6 px-2">Shopping & Activity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <AccountCard icon={Package} title="My Orders" subtext="Track shipments & history" onClick={() => router.push('/orders')} />
                            <AccountCard icon={RotateCcw} title="My Returns" subtext="Track returns & exchanges" onClick={() => router.push('/my-returns')} />
                            <AccountCard icon={Heart} title="Wishlist" subtext="Your curated collection" onClick={() => router.push('/wishlist')} />
                        </div>
                    </div>

                    {/* Section 3: Rewards & Community */}
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-6 px-2">Rewards & Studio Community</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <AccountCard icon={Trophy} title="Loyalty Rewards" subtext="Manage SLOOK coins & Elite status" onClick={() => router.push('/account/loyalty')} />
                            <AccountCard icon={UserPlus} title="Referrals" subtext="Invite friends & earn credits" onClick={() => router.push('/account/referrals')} />
                            <AccountCard icon={Camera} title="My SLOOKS" subtext="Your contribution to community" onClick={() => {
                                const el = document.getElementById('slooks-section');
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }} />
                            <AccountCard icon={Star} title="My Reviews" subtext="Feedback you have shared" onClick={() => router.push('/my-reviews')} />
                        </div>
                    </div>

                    {/* Section 4: Support & Management */}
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-6 px-2">Support & Management</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <AccountCard icon={Info} title="Help Center" subtext="FAQ & Support Hub" onClick={() => router.push('/support')} />
                            <AccountCard icon={MessageSquare} title="My Tickets" subtext="Manage support requests" onClick={() => router.push('/support-tickets')} />
                            <AccountCard icon={Bell} title="Notifications" subtext="Shop offers & updates" onClick={() => router.push('/settings/notifications')} />
                            <AccountCard icon={LogOut} title="Sign Out" subtext="Securely log out of device" onClick={handleLogout} danger={true} />
                        </div>
                    </div>
                </div>

                {/* SLOOKS Gallery Section */}
                <div id="slooks-section" className="mt-32 pt-20 border-t border-zinc-100">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-extrawide text-amber-500 mb-3">Community Hub</p>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">Your <span className="text-zinc-200">Signature</span> Looks</h2>
                        </div>
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="bg-black text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-2xl flex items-center gap-3 active:scale-95 group"
                        >
                            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" /> Upload Style
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
                        <div 
                            onClick={() => setShowUploadModal(true)}
                            className="aspect-[3/4] border-2 border-dashed border-zinc-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center hover:border-black hover:bg-zinc-50 transition-all cursor-pointer group"
                        >
                            <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ImageIcon size={28} className="text-zinc-200 group-hover:text-black" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-black">Drop a Photo</p>
                        </div>

                        {loadingLooks ? (
                            [1, 2, 3, 4, 5].map(i => <div key={`skeleton-${i}`} className="aspect-[3/4] rounded-[2.5rem] bg-zinc-50 animate-pulse" />)
                        ) : (
                            myLooks.map((look: any, idx: number) => (
                          <div
                            key={`${look._id || 'look'}-${idx}`} className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden group shadow-sm border border-zinc-100">
                                    <img src={resolveMediaURL(look.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${look.status === 'approved' ? 'bg-green-400 text-black' : look.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-400 text-black'}`}>
                                            {look.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upload Modal */}
                <AnimatePresence>
                    {showUploadModal && (
                        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowUploadModal(false)} />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="relative bg-white w-full max-w-5xl md:h-[80vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl"
                            >
                                {/* Modal content simplified for brevity, following original logic */}
                                <div className="w-full md:w-1/2 bg-zinc-50 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-100 h-[40vh] md:h-auto group">
                                    {selectedImage ? (
                                        <div className="w-full h-full relative cursor-crosshair" onClick={(e) => {
                                            if (uploadStep !== 2) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                                            setTagCoords({ x, y });
                                        }}>
                                            <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                                            {tagCoords && (
                                                <div 
                                                    className="absolute w-6 h-6 bg-white rounded-full border-2 border-black flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-xl"
                                                    style={{ left: `${tagCoords.x}%`, top: `${tagCoords.y}%` }}
                                                >
                                                    <div className="w-2 h-2 bg-black rounded-full animate-ping" />
                                                </div>
                                            )}
                                            {uploadStep === 2 && !tagCoords && (
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                                    <p className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full shadow-2xl">Tap to Pin Tag Position</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-zinc-300">
                                            <Camera size={48} strokeWidth={1} className="mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Capture</p>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setSelectedImage(reader.result as string);
                                                        setSelectedFile(file);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 p-8 md:p-12 flex flex-col justify-between overflow-y-auto no-scrollbar">
                                    <div className="mb-12">
                                        <div className="flex justify-between items-center mb-10">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Step {uploadStep}/3</h3>
                                            <button onClick={() => setShowUploadModal(false)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {uploadStep === 1 && (
                                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Caption</label>
                                                        <textarea 
                                                            value={caption} onChange={e => setCaption(e.target.value)}
                                                            placeholder="Tell the community about this look..." 
                                                            className="w-full h-32 p-6 bg-zinc-50 rounded-3xl outline-none focus:border-black border border-transparent transition-all resize-none text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                                                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide leading-relaxed">
                                                            💡 Tip: Engage your audience with a story behind this look.
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {uploadStep === 2 && (
                                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tag Products</label>
                                                        <div className="relative">
                                                            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" />
                                                            <input 
                                                                type="text" value={searchQuery}
                                                                onChange={async (e) => {
                                                                    setSearchQuery(e.target.value);
                                                                    if (e.target.value.length > 2) {
                                                                        setIsSearching(true);
                                                                        try {
                                                                            const { data } = await api.get(`/products/search?keyword=${e.target.value}`);
                                                                            setSearchResults(Array.isArray(data) ? data : (data.products || []));
                                                                        } catch (err) { console.error(err); } finally { setIsSearching(false); }
                                                                    } else { setSearchResults([]); }
                                                                }}
                                                                placeholder="Search products to link..."
                                                                className="w-full bg-zinc-50 pl-14 pr-6 py-4 rounded-2xl outline-none focus:border-black border border-transparent text-sm font-bold uppercase transition-all"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {searchResults.map(prod => (
                                                            <button 
                                                                key={prod._id}
                                                                disabled={!tagCoords}
                                                                onClick={() => {
                                                                    if (!taggedProducts.find(p => p.product === prod._id)) {
                                                                        setTaggedProducts([...taggedProducts, {
                                                                            product: prod._id,
                                                                            name: prod.name,
                                                                            x: tagCoords!.x,
                                                                            y: tagCoords!.y,
                                                                            image: prod.image,
                                                                            slug: prod.slug
                                                                        }]);
                                                                        setTagCoords(null);
                                                                        setSearchQuery('');
                                                                        setSearchResults([]);
                                                                    }
                                                                }}
                                                                className={`w-full flex items-center gap-4 p-3 rounded-xl border border-zinc-100 hover:border-black transition-all text-left ${!tagCoords ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                                            >
                                                                <img src={resolveMediaURL(prod.image)} className="w-10 h-10 object-cover rounded-md" alt="" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-black uppercase truncate">{prod.name}</p>
                                                                    <p className="text-[8px] font-bold text-zinc-400">TAG AT PINNED LOCATION</p>
                                                                </div>
                                                                <Plus size={14} className="text-zinc-300" />
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {taggedProducts.length > 0 && (
                                                        <div className="pt-4 border-t border-zinc-100 flex flex-wrap gap-2">
                                                            {taggedProducts.map((p, i) => (
                                                                <div key={i} className="bg-zinc-900 text-white px-4 py-2 rounded-full flex items-center gap-2 group shadow-xl">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">{p.name}</span>
                                                                    <button onClick={() => setTaggedProducts(taggedProducts.filter((_, idx) => idx !== i))}>
                                                                        <X size={10} className="hover:text-red-500 transition-colors" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}

                                            {uploadStep === 3 && (
                                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center justify-center py-10 text-center">
                                                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-glow-green">
                                                        <CheckCircle2 size={40} />
                                                    </div>
                                                    <h4 className="text-xl font-black uppercase tracking-tighter mb-4">Style Ready</h4>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                                                        Your style will be reviewed by curators and shared across the community gallery.
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex gap-4">
                                        {uploadStep > 1 && (
                                            <button 
                                                onClick={() => setUploadStep(uploadStep - 1)}
                                                className="flex-1 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 hover:border-black transition-all active:scale-95"
                                            >
                                                Back
                                            </button>
                                        )}
                                        {uploadStep < 3 ? (
                                            <button 
                                                disabled={uploadStep === 1 && !selectedImage}
                                                onClick={() => setUploadStep(uploadStep + 1)}
                                                className={`flex-1 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-2xl ${selectedImage || uploadStep > 1 ? 'bg-black text-white hover:bg-zinc-800 shadow-black/10' : 'bg-zinc-50 text-zinc-300'}`}
                                            >
                                                Next
                                            </button>
                                        ) : (
                                            <button 
                                                disabled={isSubmitting}
                                                onClick={async () => {
                                                    setIsSubmitting(true);
                                                    try {
                                                        const fd = new FormData();
                                                        fd.append('image', selectedFile!);
                                                        fd.append('caption', caption);
                                                        fd.append('products', JSON.stringify(taggedProducts));
                                                        const { data } = await api.post('/looks', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                        setMyLooks(prev => [data, ...prev]);
                                                        setShowUploadModal(false);
                                                        success("Look synchronized with the gallery!");
                                                    } catch (err) { toastError("Upload failed"); } 
                                                    finally { setIsSubmitting(false); }
                                                }}
                                                className="flex-1 bg-black text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-black/10 hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? "Syncing..." : "Publish Style"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
