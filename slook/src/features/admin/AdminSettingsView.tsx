'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { 
    Save, Bell, Shield, Globe, ToggleLeft, ToggleRight, 
    Truck, Image, Plus, Trash2, ArrowUp, ArrowDown, 
    Upload, MessageSquare, RefreshCw 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { resolveMediaURL } from '@/utils/mediaUtils';

// --- SUB-COMPONENTS ---

const GeneralSettings = ({ settings, handleChange, handleToggle }: any) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Platform Name</label>
                <input
                    name="siteName"
                    value={settings.siteName}
                    onChange={handleChange}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-black transition"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Support Email</label>
                <input
                    name="supportEmail"
                    value={settings.supportEmail}
                    onChange={handleChange}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-black transition"
                />
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
            <h4 className="font-black text-zinc-900 mb-4 uppercase tracking-widest text-xs italic">Financial Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Tax Rate (%)</label>
                    <input
                        type="number"
                        name="taxRate"
                        value={settings.taxRate}
                        onChange={handleChange}
                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:border-black transition"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Shipping Charge</label>
                    <input
                        type="number"
                        name="shippingCharge"
                        value={settings.shippingCharge}
                        onChange={handleChange}
                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:border-black transition"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Free Delivery Over</label>
                    <input
                        type="number"
                        name="freeShippingThreshold"
                        value={settings.freeShippingThreshold}
                        onChange={handleChange}
                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:border-black transition"
                    />
                </div>
            </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2rem] flex items-center justify-between">
            <div>
                <h4 className="font-black text-orange-900 mb-1 uppercase tracking-tighter text-lg italic">Maintenance Mode</h4>
                <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Disable the store for customers temporarily.</p>
            </div>
            <button onClick={() => handleToggle('maintenanceMode')} className="text-orange-500 hover:text-orange-700 transition">
                {settings.maintenanceMode ? <ToggleRight size={48} className="fill-current" /> : <ToggleLeft size={48} />}
            </button>
        </div>
    </div>
);

const HeroSettings = ({ settings, setSettings, addToast }: any) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit">
        <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-zinc-900 uppercase tracking-widest text-xs italic">Home Hero Carousel</h4>
            <button
                onClick={() => setSettings((prev: any) => ({ ...prev, heroSlides: [...(prev.heroSlides || []), { img: '', title: '', subtitle: '', link: '' }] }))}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-xl"
            >
                <Plus size={14} /> Add Slide
            </button>
        </div>

        <div className="space-y-4">
            {settings.heroSlides?.map((slide: any, idx: number) => (
                <div key={idx} className="bg-white border border-zinc-100 p-6 rounded-[2.5rem] shadow-sm hover:border-black transition group">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-32 h-32 bg-zinc-50 rounded-2xl overflow-hidden relative border border-zinc-100 shrink-0">
                            {slide.img ? (
                                <img src={resolveMediaURL(slide.img)} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                    <Image size={24} />
                                </div>
                            )}
                            <button
                                onClick={() => document.getElementById(`hero-upload-${idx}`)?.click()}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white backdrop-blur-sm"
                            >
                                <Upload size={16} />
                            </button>
                            <input
                                id={`hero-upload-${idx}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const uploadData = new FormData();
                                    uploadData.append('file', file);
                                    try {
                                        const { data } = await api.post('/upload', uploadData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        const newSlides = [...settings.heroSlides];
                                        newSlides[idx].img = data.filePath;
                                        setSettings({ ...settings, heroSlides: newSlides });
                                    } catch (err) {
                                        addToast("Upload failed", "error");
                                    }
                                }}
                            />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    placeholder="Title (e.g. The 2026 Collection)"
                                    className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-black"
                                    value={slide.title}
                                    onChange={(e) => {
                                        const newSlides = [...settings.heroSlides];
                                        newSlides[idx].title = e.target.value;
                                        setSettings({ ...settings, heroSlides: newSlides });
                                    }}
                                />
                                <input
                                    placeholder="Subtitle (e.g. Modern Essentials)"
                                    className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-black"
                                    value={slide.subtitle}
                                    onChange={(e) => {
                                        const newSlides = [...settings.heroSlides];
                                        newSlides[idx].subtitle = e.target.value;
                                        setSettings({ ...settings, heroSlides: newSlides });
                                    }}
                                />
                            </div>
                            <input
                                placeholder="Link URL (e.g. /shop)"
                                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:border-black"
                                value={slide.link}
                                onChange={(e) => {
                                    const newSlides = [...settings.heroSlides];
                                    newSlides[idx].link = e.target.value;
                                    setSettings({ ...settings, heroSlides: newSlides });
                                }}
                            />
                        </div>

                        <div className="flex md:flex-col gap-2 justify-end">
                            <button
                                onClick={() => {
                                    if (idx === 0) return;
                                    const newSlides = [...settings.heroSlides];
                                    [newSlides[idx], newSlides[idx - 1]] = [newSlides[idx - 1], newSlides[idx]];
                                    setSettings({ ...settings, heroSlides: newSlides });
                                }}
                                className="p-3 hover:bg-zinc-100 rounded-2xl transition text-zinc-400 hover:text-black disabled:opacity-30"
                                disabled={idx === 0}
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button
                                onClick={() => {
                                    const newSlides = settings.heroSlides.filter((_: any, i: number) => i !== idx);
                                    setSettings({ ...settings, heroSlides: newSlides });
                                }}
                                className="p-3 hover:bg-red-50 rounded-2xl transition text-zinc-400 hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const AdminSettingsView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({
        siteName: '',
        supportEmail: '',
        maintenanceMode: false,
        taxRate: 0,
        shippingCharge: 0,
        freeShippingThreshold: 0,
        heroSlides: [],
        topNavbarMessages: [],
        marqueeMessages: []
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                setSettings(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = (key: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setSettings((prev: any) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSave = async () => {
        try {
            await api.put('/settings', settings);
            addToast("Settings Synced Successfully", "success");
            window.dispatchEvent(new Event('settings-updated'));
        } catch (err) {
            addToast("Failed to save configuration", "error");
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <Globe size={16} /> },
        { id: 'hero', label: 'Hero', icon: <Image size={16} /> },
        { id: 'logistics', label: 'Logistics', icon: <Truck size={16} /> },
        { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    ];

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <RefreshCw className="animate-spin text-zinc-200 mb-4" size={32} />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Downloading Global Config...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Global <span className="text-zinc-400">Settings</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Platform Core Configuration (MNCS-CONFIG)</p>
                </div>
                <button onClick={handleSave} className="bg-black text-white px-10 py-4 rounded-full font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 transition shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 font-sans">
                    <Save size={16} /> Sync Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:bg-white hover:text-black border border-transparent hover:border-zinc-100'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 min-h-[500px]">
                        {activeTab === 'general' && <GeneralSettings settings={settings} handleChange={handleChange} handleToggle={handleToggle} />}
                        {activeTab === 'hero' && <HeroSettings settings={settings} setSettings={setSettings} addToast={addToast} />}
                        {activeTab === 'logistics' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit">
                                <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
                                    <h4 className="font-black text-zinc-900 mb-6 uppercase tracking-widest text-xs italic">Estimation Algorithm</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Min Lead Days</label>
                                            <input
                                                type="number"
                                                name="minDeliveryDays"
                                                value={settings.minDeliveryDays}
                                                onChange={handleChange}
                                                className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-black transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Max Lead Days</label>
                                            <input
                                                type="number"
                                                name="maxDeliveryDays"
                                                value={settings.maxDeliveryDays}
                                                onChange={handleChange}
                                                className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-black transition"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-zinc-400 mt-6 font-bold uppercase tracking-widest leading-relaxed">System applies these bounds to calculate global delivery SLAs during checkout.</p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit">
                                <div className="bg-zinc-950 p-10 rounded-[2.5rem] border border-zinc-900 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[80px] rounded-full" />
                                    <h4 className="font-black text-white mb-6 uppercase tracking-widest text-xs italic">Administrative Authorization</h4>
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl italic">
                                            {user?.firstName?.[0] || 'A'}
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-xl tracking-tighter uppercase italic">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Status: Superuser Access</p>
                                        </div>
                                        <span className="ml-auto px-4 py-1.5 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20">Identified</span>
                                    </div>
                                    <button className="w-full bg-zinc-900 text-zinc-500 font-black py-4 rounded-2xl uppercase text-[10px] tracking-[0.3em] cursor-not-allowed border border-zinc-800">
                                        Access Matrix Locked (v1.4)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
