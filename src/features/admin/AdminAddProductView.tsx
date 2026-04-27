'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Upload, Video, Copy, Loader2 } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { resolveMediaURL } from '@/utils/mediaUtils';

// --- TYPES ---
interface Variant {
  size: string;
  color: string;
  stock: number;
  image?: string;
}

interface Specification {
  key: string;
  value: string;
}

interface ProductForm {
  name: string;
  price: string;
  discountPrice: string;
  category: string;
  subcategory: string;
  image: string;
  images: string[];
  tags: string[];
  description: string;
  specs: Specification[];
  countInStock: number;
  isBestSeller: boolean;
  isNewArrival: boolean;
  video: string;
  variants: Variant[];
  seo: { metaTitle: string; metaDescription: string };
  badge: string;
  richDescription: string;
}

export const AdminAddProductView = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    price: '',
    discountPrice: '',
    category: '',
    subcategory: '',
    image: '',
    images: [],
    tags: [],
    description: '',
    specs: [],
    countInStock: 0,
    isBestSeller: false,
    isNewArrival: false,
    video: '',
    variants: [],
    seo: { metaTitle: '', metaDescription: '' },
    badge: '',
    richDescription: ''
  });

  const [previewVariantIdx, setPreviewVariantIdx] = useState<number | null>(null);
  
  // Quick Variant State
  const [showQuickVariant, setShowQuickVariant] = useState(false);
  const [quickVariantType, setQuickVariantType] = useState<'clothing' | 'shoes' | ''>('');
  const [quickVariantColor, setQuickVariantColor] = useState('');

  const [newImageUrl, setNewImageUrl] = useState('');

  // --- HANDLERS ---
  const handleImageUpload = async (file: File, type: 'main' | 'gallery' | 'variant' | 'video', variantIdx: number | null = null) => {
    if (!file) return;
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    setUploading(true);

    try {
      const { data } = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const uploadedUrl = data.filePath;

      if (type === 'main') {
        setFormData(prev => ({ ...prev, image: uploadedUrl }));
      } else if (type === 'gallery') {
        if (formData.images.length >= 4) {
          addToast("Max 4 gallery images allowed", "error");
          return;
        }
        setFormData(prev => ({ ...prev, images: [...prev.images, uploadedUrl] }));
      } else if (type === 'variant' && variantIdx !== null) {
        const newVar = [...formData.variants];
        newVar[variantIdx].image = uploadedUrl;
        setFormData(prev => ({ ...prev, variants: newVar }));
      } else if (type === 'video') {
        setFormData(prev => ({ ...prev, video: uploadedUrl }));
      }
      
      addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`, "success");
    } catch (err: any) {
      addToast(err.response?.data?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const addImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      if (formData.images.length >= 4) return addToast("Max 4 images allowed", "error");
      setFormData(prev => ({ ...prev, images: [...prev.images, newImageUrl] }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_: string, i: number) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Auto-add pending tag
      let finalTags = formData.tags || [];
      const tagInput = document.getElementById('tagInput') as HTMLInputElement;
      if (tagInput && tagInput.value.trim()) {
        const val = tagInput.value.trim();
        if (!finalTags.includes(val)) finalTags = [...finalTags, val];
        tagInput.value = '';
      }
      
      const payload = { ...formData, tags: finalTags };
      await api.post('/products', payload);
      addToast("Product Published", "success");
      router.push('/admin/products');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to create product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndAddNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Auto-add pending tag
      let finalTags = formData.tags || [];
      const tagInput = document.getElementById('tagInput') as HTMLInputElement;
      if (tagInput && tagInput.value.trim()) {
        const val = tagInput.value.trim();
        if (!finalTags.includes(val)) finalTags = [...finalTags, val];
        tagInput.value = '';
      }
      
      const payload = { ...formData, tags: finalTags };
      await api.post('/products', payload);
      addToast("Product Saved. Add another!", "success");

      // Reset Form but keep Category/Subcategory/Tags for speed
      setFormData(prev => ({
        ...prev,
        name: '',
        price: '',
        discountPrice: '',
        image: '',
        images: [],
        description: '',
        specs: [],
        countInStock: 0,
        isBestSeller: false,
        isNewArrival: false,
        video: '',
        variants: [],
        seo: { metaTitle: '', metaDescription: '' },
        richDescription: ''
        // Keep category, subcategory, tags
      }));
      setNewImageUrl('');
      window.scrollTo(0, 0);

    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to create product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#Fdfdfd] text-zinc-900 font-sans pb-20 -mx-4 px-4">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-100 -mx-4 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/products')} className="p-2 hover:bg-zinc-50 rounded-full transition">
              <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                    Add <span className="text-zinc-400">New Piece</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Registry Creation (MNCS-NEW)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/admin/products')} className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black">
              Cancel
            </button>
            <button
              onClick={handleSaveAndAddNext}
              disabled={loading}
              className="hidden md:block bg-zinc-100 text-zinc-900 border border-zinc-200 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Save & Add Next
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : uploading ? 'Uploading Media...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT: FORM INPUTS */}
          <div className="lg:col-span-2 space-y-10">
            <form onSubmit={handleSubmit} className="space-y-10">

              {/* --- 1. BASIC INFO --- */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-100 pb-2">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Price (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold text-lg"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Sale Price (Optional)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold text-lg"
                      value={formData.discountPrice}
                      onChange={e => setFormData({ ...formData, discountPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium Cotton T-Shirt"
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold uppercase text-sm"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Category</label>
                    <input
                      list="categoryOptions"
                      type="text"
                      placeholder="Select or Type..."
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold uppercase text-sm"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    />
                    <datalist id="categoryOptions">
                      <option value="Clothing" />
                      <option value="Footwear" />
                      <option value="Electronics" />
                      <option value="Home & Living" />
                      <option value="Accessories" />
                      <option value="Beauty" />
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Subcategory (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Gold Plated"
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold uppercase text-sm"
                      value={formData.subcategory}
                      onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* --- 2. MEDIA (Images + Video) --- */}
              <div className="space-y-6 pt-6 border-t border-zinc-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-100 pb-2">Media</h3>

                {/* VIDEO URL */}
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest flex items-center gap-2">
                    <Video size={14} /> Product Video
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Paste YouTube Link or Upload..."
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black text-xs font-mono"
                      value={formData.video || ''}
                      onChange={e => setFormData({ ...formData, video: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('videoInput')?.click()}
                      className="bg-black text-white px-4 py-4 rounded-xl hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Upload size={16} />
                      <span className="text-[10px] font-bold uppercase hidden md:inline">Upload</span>
                    </button>
                    <input
                      id="videoInput"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'video')}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400 mt-1 pl-1">Supports YouTube, Vimeo, or upload a file (Max 100MB).</p>
                </div>

                {/* Main Image Upload */}
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Main Product Image</label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Paste URL or Upload..."
                        className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black text-xs pr-12"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('mainImageInput')?.click()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition"
                      >
                        <Upload size={18} />
                      </button>
                    </div>
                    <input
                      id="mainImageInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'main')}
                    />
                  </div>
                </div>

                {/* Additional Images */}
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Gallery ({formData.images.length}/4)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Paste URL or click + to upload..."
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs pr-10"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (newImageUrl.trim()) addImage(e);
                        else document.getElementById('multiImageInput')?.click();
                      }}
                      className="bg-black text-white px-4 rounded-xl hover:bg-zinc-800 flex items-center gap-2"
                    >
                      {newImageUrl.trim() ? <Save size={16} /> : <Upload size={16} />}
                      <span className="text-[10px] font-bold uppercase hidden md:inline">{newImageUrl.trim() ? "ADD" : "UPLOAD"}</span>
                    </button>
                    <input
                      id="multiImageInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        e.target.files?.[0] && handleImageUpload(e.target.files[0], 'gallery');
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {formData.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
                        <img src={resolveMediaURL(img)} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* --- 3. DESCRIPTION & SEO --- */}
              <div className="space-y-6 pt-6 border-t border-zinc-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-100 pb-2">Content & SEO</h3>
                  {(!formData.seo?.metaTitle || !formData.seo?.metaDescription) && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-pulse mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider">SEO Missing</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Description</label>
                  <textarea
                    rows={6}
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black text-sm"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-red-500 tracking-widest font-black">Product Story (The "Story" Tab Content)</label>
                  <textarea
                    rows={10}
                    placeholder="Tell the narrative of this product. This shows in the 'Story' tab on the live page..."
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black text-sm italic border-l-4 border-l-red-500"
                    value={formData.richDescription}
                    onChange={e => setFormData({ ...formData, richDescription: e.target.value })}
                  />
                  <p className="text-[9px] text-zinc-400 mt-2">Supports multi-line narrative. Use this for the emotional and high-fidelity product story.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Meta Title (SEO)</label>
                    <input
                      type="text"
                      placeholder="SEO Title (Optional)"
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs"
                      value={formData.seo?.metaTitle || ''}
                      onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Meta Description (SEO)</label>
                    <input
                      type="text"
                      placeholder="Brief summary for Google..."
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs"
                      value={formData.seo?.metaDescription || ''}
                      onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              {/* --- 4. DATA & VARIANTS --- */}
              <div className="space-y-6 pt-6 border-t border-zinc-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-100 pb-2">Inventory Data</h3>

                {/* VARIANTS SECTION */}
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Product Variants (Size/Color)</label>
                    <div className="flex flex-wrap gap-2">
                       <button
                        type="button"
                        onClick={() => {
                          setShowQuickVariant(true);
                          setQuickVariantType('clothing');
                        }}
                        className="text-[10px] font-bold uppercase bg-zinc-100 border border-zinc-200 text-black px-3 py-1 rounded-full hover:bg-zinc-200"
                      >
                        + Quick Sizes (S-XL)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickVariant(true);
                          setQuickVariantType('shoes');
                        }}
                        className="text-[10px] font-bold uppercase bg-zinc-100 border border-zinc-200 text-black px-3 py-1 rounded-full hover:bg-zinc-200"
                      >
                        + Quick Shoes (6-11)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, variants: [...(formData.variants || []), { size: '', color: '', stock: 0 }] })}
                        className="text-[10px] font-bold uppercase bg-black text-white px-3 py-1 rounded-full hover:bg-zinc-800"
                      >
                        + Custom Variant
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick Variant UI */}
                  {showQuickVariant && (
                    <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl mb-4 flex flex-col md:flex-row items-end gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="w-full md:flex-1">
                        <label className="block text-[9px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">
                          Base Color for {quickVariantType === 'clothing' ? 'Sizes S-XL' : 'Shoes 6-11'} (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Black, Navy, Gold..."
                          className="w-full bg-white border border-zinc-200 p-3 rounded-lg outline-none focus:border-black text-xs font-bold uppercase"
                          value={quickVariantColor}
                          onChange={(e) => setQuickVariantColor(e.target.value)}
                          onKeyDown={(e) => {
                             if(e.key === 'Enter') {
                               e.preventDefault();
                               const sizes = quickVariantType === 'clothing' ? ['S', 'M', 'L', 'XL'] : ['6', '7', '8', '9', '10', '11'];
                               const newVariants = sizes.map((size: string) => ({ size, color: quickVariantColor.trim(), stock: 10 }));
                               const updatedVariants = [...(formData.variants || []), ...newVariants];
                               const total = updatedVariants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
                               setFormData({ ...formData, variants: updatedVariants, countInStock: total });
                               setShowQuickVariant(false);
                               setQuickVariantColor('');
                             }
                          }}
                        />
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                           type="button"
                           onClick={() => {
                             setShowQuickVariant(false);
                             setQuickVariantColor('');
                           }}
                           className="flex-1 md:flex-none px-4 py-3 border border-zinc-200 rounded-lg text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-100 transition"
                        >
                          Cancel
                        </button>
                         <button
                           type="button"
                           onClick={() => {
                             const sizes = quickVariantType === 'clothing' ? ['S', 'M', 'L', 'XL'] : ['6', '7', '8', '9', '10', '11'];
                             const newVariants = sizes.map((size: string) => ({ size, color: quickVariantColor.trim(), stock: 10 }));
                             const updatedVariants = [...(formData.variants || []), ...newVariants];
                             const total = updatedVariants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
                             setFormData({ ...formData, variants: updatedVariants, countInStock: total });
                             setShowQuickVariant(false);
                             setQuickVariantColor('');
                           }}
                           className="flex-1 md:flex-none px-6 py-3 bg-black text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition"
                         >
                           Generate Details
                         </button>
                      </div>
                    </div>
                  )}

                  {formData.variants && formData.variants.length > 0 ? (
                    <div className="space-y-3">
                      {formData.variants.map((variant: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewVariantIdx(idx)}
                          className={`flex gap-2 items-center p-3 rounded-2xl border transition-all cursor-pointer group ${previewVariantIdx === idx ? 'bg-zinc-900 border-zinc-900 shadow-lg' : 'bg-zinc-50 border-zinc-200 hover:border-black'}`}
                        >
                          <input
                            type="text"
                            placeholder="Size"
                            className={`w-16 bg-transparent outline-none text-xs font-bold uppercase ${previewVariantIdx === idx ? 'text-white' : 'text-zinc-900'}`}
                            value={variant.size}
                            onChange={(e) => {
                              const newVar = [...formData.variants];
                              newVar[idx].size = e.target.value;
                              setFormData({ ...formData, variants: newVar });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Color"
                            className={`flex-1 bg-transparent outline-none text-xs font-bold uppercase ${previewVariantIdx === idx ? 'text-zinc-300' : 'text-zinc-900'}`}
                            value={variant.color}
                            onChange={(e) => {
                              const newVar = [...formData.variants];
                              newVar[idx].color = e.target.value;
                              setFormData({ ...formData, variants: newVar });
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            className={`w-12 bg-transparent outline-none text-xs font-bold ${previewVariantIdx === idx ? 'text-white' : 'text-zinc-900'}`}
                            value={variant.stock}
                            onChange={(e) => {
                              const newVar = [...formData.variants];
                              newVar[idx].stock = Number(e.target.value);
                              // Auto-update total stock
                              const total = newVar.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
                              setFormData({ ...formData, variants: newVar, countInStock: total });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Image URL"
                            className={`flex-1 bg-transparent outline-none text-[10px] font-mono ${previewVariantIdx === idx ? 'text-zinc-400' : 'text-zinc-400'}`}
                            value={variant.image || ''}
                            onChange={(e) => {
                              const newVar = [...formData.variants];
                              newVar[idx].image = e.target.value;
                              setFormData({ ...formData, variants: newVar });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => (e.target as HTMLInputElement).files?.[0] && handleImageUpload((e.target as HTMLInputElement).files![0], 'variant', idx);
                              input.click();
                            }}
                            className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200"
                            title="Upload Variant Image"
                          >
                            <Upload size={14} />
                          </button>
                          
                          {variant.image && variant.color && (
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if (window.confirm(`Apply this image to all variants with color "${variant.color}"?`)) {
                                    const newVar = formData.variants.map(v => 
                                       (v.color || '').trim().toLowerCase() === (variant.color || '').trim().toLowerCase() 
                                       ? { ...v, image: variant.image } 
                                       : v
                                    );
                                    setFormData({ ...formData, variants: newVar });
                                    addToast(`Image applied to all ${variant.color} variants`, "success");
                                 }
                               }}
                               className="p-3 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100 transition-colors"
                               title={`Apply image to all ${variant.color} variants`}
                             >
                                <Copy size={14} />
                             </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newVar = formData.variants.filter((_, i) => i !== idx);
                              const total = newVar.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
                              setFormData({ ...formData, variants: newVar, countInStock: total });
                              if (previewVariantIdx === idx) setPreviewVariantIdx(null);
                            }}
                            className={`p-3 rounded-xl transition-colors ${previewVariantIdx === idx ? 'bg-zinc-800 text-red-400 hover:bg-zinc-700' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 italic mb-4">No variants added. Using simple stock count below.</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Total Stock Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold"
                    value={formData.countInStock}
                    onChange={e => setFormData({ ...formData, countInStock: Number(e.target.value) })}
                    required
                    readOnly={formData.variants && formData.variants.length > 0} // Read-only if variants exist
                  />
                  {formData.variants && formData.variants.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mt-2 flex items-start gap-2">
                      <div className="mt-0.5 text-amber-500"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
                      <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                        The <strong>Total Stock</strong> is automatically calculated as the sum of all variant quantities. You cannot edit it manually while variants exist.
                      </p>
                    </div>
                  )}
                </div>

                {/* BADGES / TOGGLES */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Visibility Badges</label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition w-full md:w-1/2">
                      <input 
                        type="checkbox" 
                        checked={formData.isNewArrival}
                        onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })}
                        className="w-5 h-5 accent-black" 
                      />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-black">New Arrival</p>
                        <p className="text-[9px] text-zinc-500 font-medium mt-1">Shows in the "Fresh Drops" section</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition w-full md:w-1/2">
                      <input 
                        type="checkbox" 
                        checked={formData.isBestSeller}
                        onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                        className="w-5 h-5 accent-black" 
                      />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-black">Trending Now</p>
                        <p className="text-[9px] text-zinc-500 font-medium mt-1">Shows in the "Trending Now" section</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* DEDICATED BADGE */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Featured Badge (Primary)</label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/2">
                      <input
                        type="text"
                        placeholder="e.g. Home Appliances, Limited Edition"
                        className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-black uppercase text-[10px] tracking-widest"
                        value={formData.badge || ''}
                        onChange={e => setFormData({ ...formData, badge: e.target.value })}
                      />
                      <p className="text-[9px] text-zinc-400 mt-2 pl-1">This badge appears prominently on the product card and creates a special section on the homepage.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-1/2">
                      {['Trending Now', 'New Arrival', 'Best Seller', 'Home Appliances', 'Special Offer'].map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setFormData({ ...formData, badge: b })}
                          className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition ${formData.badge === b ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TAGS */}
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Product Badges</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      id="tagInput"
                      placeholder="e.g. New Arrival"
                      className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs font-bold uppercase"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !formData.tags?.includes(val)) {
                            setFormData({ ...formData, tags: [...(formData.tags || []), val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('tagInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !formData.tags?.includes(val)) {
                          setFormData({ ...formData, tags: [...(formData.tags || []), val] });
                          input.value = '';
                        }
                      }}
                      className="bg-black text-white px-4 rounded-xl hover:bg-zinc-800 text-[10px] font-bold uppercase"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags?.map((tag, i) => (
                      <span key={i} className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        {tag}
                        <button type="button" onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* SPECS */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Specifications</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, specs: [...formData.specs, { key: '', value: '' }] })}
                      className="text-[10px] font-bold uppercase bg-black text-white px-3 py-1 rounded-full hover:bg-zinc-800"
                    >
                      + Spec
                    </button>
                  </div>

                  {formData.specs.map((spec, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Label"
                        className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs font-bold uppercase"
                        value={spec.key}
                        onChange={e => {
                          const newSpecs = [...formData.specs];
                          newSpecs[index].key = e.target.value;
                          setFormData({ ...formData, specs: newSpecs });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs"
                        value={spec.value}
                        onChange={e => {
                          const newSpecs = [...formData.specs];
                          newSpecs[index].value = e.target.value;
                          setFormData({ ...formData, specs: newSpecs });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, specs: formData.specs.filter((_, i) => i !== index) })}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-black text-white py-5 rounded-full font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition shadow-xl disabled:opacity-50 mt-8">
                {loading ? 'Publishing...' : 'Publish Product'}
              </button>

            </form>
          </div>

          {/* RIGHT: LIVE PREVIEW */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-black uppercase text-zinc-400 mb-6 tracking-widest sticky top-32">Listing Preview</h3>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 sticky top-44">
              <div className="aspect-[4/5] bg-zinc-100 rounded-2xl overflow-hidden mb-6 relative">
                {previewVariantIdx !== null && formData.variants[previewVariantIdx]?.image ? (
                  <img src={resolveMediaURL(formData.variants[previewVariantIdx].image)} className="w-full h-full object-cover" alt="Variant Preview" />
                ) : formData.image ? (
                  <img src={resolveMediaURL(formData.image)} className="w-full h-full object-cover" alt="Main Preview" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                    <Upload size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                  </div>
                )}

                {/* Variant Overlay */}
                {previewVariantIdx !== null && (
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 uppercase tracking-widest rounded-full z-10 border border-white/20">
                    Previewing: {formData.variants[previewVariantIdx].color || 'Unnamed'} {formData.variants[previewVariantIdx].size || ''}
                  </div>
                )}

                {/* Sale Badge */}
                {Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price) && (
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest rounded-full">
                    Sale
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-1">{formData.category} {formData.subcategory && `• ${formData.subcategory}`}</p>
                    <h3 className="font-black text-xl uppercase italic tracking-tighter leading-none">{formData.name || "Untitled Product"}</h3>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mt-4 border-t border-zinc-100 pt-4">
                  {Number(formData.discountPrice) > 0 ? (
                    <>
                      <span className="font-bold text-lg">₹{Number(formData.discountPrice).toLocaleString()}</span>
                      <span className="text-zinc-400 text-xs line-through decoration-red-500 decoration-2">₹{Number(formData.price || 0).toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="font-bold text-lg">₹{Number(formData.price || 0).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
