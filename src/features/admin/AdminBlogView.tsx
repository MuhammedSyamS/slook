'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    Plus, Trash2, Edit, ExternalLink, FileText, 
    Eye, EyeOff, Upload, RefreshCw, ChevronRight,
    Settings, Layout, ArrowRight, Zap
} from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminBlogView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '', 
        coverImage: '',
        tags: '',
        isPublished: false
    });

    const fetchPosts = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const { data } = await api.get('/blog/admin/all');
            setPosts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            addToast("Failed to fetch content cache", "error");
        } finally {
            setLoading(false);
        }
    }, [user?.token, addToast]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        setUploading(true);

        try {
            const { data } = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, coverImage: data.filePath }));
            addToast("Visual Asset Synchronised", "success");
        } catch (err) {
            addToast("Upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            };

            if (isEditing) {
                await api.put(`/blog/${currentPostId}`, payload);
                addToast("Post Updated", "success");
            } else {
                await api.post('/blog', payload);
                addToast("Post Created", "success");
            }
            fetchPosts();
            resetForm();
        } catch (err) {
            addToast("Operation failed", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this blog post?")) return;
        try {
            await api.delete(`/blog/${id}`);
            setPosts(prev => prev.filter(p => p._id !== id));
            addToast("Post Deleted", "success");
            if (currentPostId === id) resetForm();
        } catch (err) {
            addToast("Purge failed", "error");
        }
    };

    const startEdit = (post: any) => {
        setIsEditing(true);
        setCurrentPostId(post._id);
        setFormData({
            title: post.title,
            content: post.content,
            coverImage: post.coverImage || '',
            tags: post.tags ? post.tags.join(', ') : '',
            isPublished: post.isPublished
        });
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentPostId(null);
        setFormData({
            title: '',
            content: '',
            coverImage: '',
            tags: '',
            isPublished: false
        });
    };

    if (loading && posts.length === 0) return (
        <div className="h-[60vh] flex flex-col items-center justify-center font-black uppercase tracking-[0.3em] text-[10px] text-zinc-400">
            <RefreshCw className="animate-spin mb-4" size={24} /> ACCESSING EDITORIAL CACHELINE...
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-20">
            {/* Header Synchronization */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-10">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
                        Intelligence <span className="text-zinc-400">Hub</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">Editorial Content & Research Registry (MNCS-BLOG)</p>
                </div>
                {isEditing && (
                    <button onClick={resetForm} className="px-6 py-2.5 bg-zinc-100 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm italic">
                        Cancel Editorial Cycle
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LIST (1/3 COL) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-400 italic">Historical Context ({posts.length})</h2>
                    </div>
                    
                    <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {posts.map(post => (
                                <motion.div 
                                    key={post._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => startEdit(post)} 
                                    className={`p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer group relative overflow-hidden ${currentPostId === post._id ? 'bg-black text-white border-black shadow-xl ring-2 ring-black ring-offset-2' : 'bg-white border-zinc-100 hover:border-black shadow-sm'}`}
                                >
                                    <h3 className="font-black text-xs uppercase tracking-tighter mb-3 line-clamp-1">{post.title}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${post.isPublished ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400'} ${currentPostId === post._id ? 'bg-white/20' : ''}`}>
                                            {post.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                        <span className="text-[9px] font-bold opacity-30 uppercase">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {posts.length === 0 && (
                            <div className="py-20 text-center opacity-20 border-2 border-dashed border-zinc-100 rounded-[2rem]">
                                <FileText size={40} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Intelligence Assets Detected</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* EDITOR (2/3 COL) */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                            <Layout size={160} />
                        </div>
                        
                        <h2 className="text-xl font-black uppercase italic tracking-tighter mb-10 flex items-center gap-4">
                            {isEditing ? 'Modify Active Fragment' : 'Initialise New Registry'}
                            <ArrowRight size={18} className="text-zinc-200" />
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    {/* TITLE */}
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-3 italic">Identify Fragment (Title)</label>
                                        <input required placeholder="SYSTEM PROTOCOL 01" className="w-full bg-zinc-50 p-5 rounded-2xl font-black uppercase tracking-widest border border-zinc-50 focus:border-black outline-none transition shadow-inner"
                                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>

                                    {/* COVER IMAGE */}
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-3 italic">Visual Carrier (Cover URL)</label>
                                        <div className="flex gap-3">
                                            <input placeholder="/assets/image_01.png" className="flex-1 bg-zinc-50 p-5 rounded-2xl text-[10px] font-bold tracking-widest border border-zinc-50 outline-none focus:border-black transition shadow-inner"
                                                value={formData.coverImage} onChange={e => setFormData({ ...formData, coverImage: e.target.value })} />
                                            <button 
                                                type="button" 
                                                onClick={() => document.getElementById('coverInput')?.click()}
                                                className="px-6 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                                            >
                                                <Upload size={18} className={uploading ? 'animate-bounce' : ''} />
                                            </button>
                                            <input id="coverInput" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </div>
                                    </div>

                                    {/* TAGS */}
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-3 italic">Metadata Labels (Comma separated)</label>
                                        <input placeholder="FASHION, TECH, PROTOCOL" className="w-full bg-zinc-50 p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-zinc-50 outline-none focus:border-black transition"
                                            value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                                    </div>

                                    {/* STATUS */}
                                    <div className="pt-4">
                                        <label className="flex items-center gap-4 cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only" checked={formData.isPublished} onChange={e => setFormData({ ...formData, isPublished: e.target.checked })} />
                                                <div className={`w-14 h-7 rounded-full transition-all duration-500 ${formData.isPublished ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 ${formData.isPublished ? 'right-1' : 'left-1'}`} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-black transition-colors italic">Broadcast Immediate</span>
                                        </label>
                                    </div>
                                </div>

                                {/* CONTENT (HTML) */}
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-3 italic">Core Payload (HTML Syntax)</label>
                                    <textarea required rows={18} className="w-full bg-zinc-50 p-8 rounded-[2rem] text-xs font-mono border border-zinc-50 outline-none focus:border-black transition shadow-inner leading-relaxed overflow-y-auto custom-scrollbar"
                                        placeholder="<h1>TITLE</h1><p>INITIALIZING PROTOCOL...</p>"
                                        value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex items-center gap-4 pt-10 border-t border-zinc-50">
                                <button type="submit" className="flex-1 py-6 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-0.98 transition-all shadow-2xl flex items-center justify-center gap-4 italic group">
                                    <Zap size={16} className="text-orange-400 group-hover:animate-pulse" /> {isEditing ? 'Commit Changes' : 'Publish Asset'}
                                </button>
                                {isEditing && (
                                    <button type="button" onClick={() => handleDelete(currentPostId!)} className="px-10 py-6 bg-red-50 text-red-500 rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                        <Trash2 size={24} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
