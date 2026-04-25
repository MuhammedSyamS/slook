'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2, Loader2, Plus, X, Upload, AlertCircle, Package, Copy } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import StockHistory from '@/components/admin/StockHistory';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { resolveMediaURL } from '@/utils/mediaUtils';
import Price from '@/components/shared/Price';

interface Variant {
  size: string;
  color: string;
  stock: number;
  image?: string;
}

interface Spec {
  key: string;
  value: string;
}

interface SEO {
  metaTitle: string;
  metaDescription: string;
}

interface ProductFormData {
  name: string;
  price: string | number;
  discountPrice: string | number;
  category: string;
  subcategory: string;
  image: string;
  images: string[];
  description: string;
  countInStock: number;
  isBestSeller: boolean;
  isNewArrival: boolean;
  variants: Variant[];
  seo: SEO;
  tags: string[];
  specs: Spec[];
  badge: string;
  richDescription: string;
  stockReason: string;
  stockNote: string;
  video?: string;
}

const EditProductPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    discountPrice: '',
    category: '',
    subcategory: '',
    image: '',
    images: [],
    description: '',
    countInStock: 0,
    isBestSeller: false,
    isNewArrival: false,
    variants: [],
    seo: { metaTitle: '', metaDescription: '' },
    tags: [],
    specs: [],
    badge: '',
    richDescription: '',
    stockReason: 'Admin Adjustment',
    stockNote: ''
  });

  const [previewVariantIdx, setPreviewVariantIdx] = useState<number | null>(null);
  
  // Quick Variant State
  const [showQuickVariant, setShowQuickVariant] = useState<boolean>(false);
  const [quickVariantType, setQuickVariantType] = useState<'clothing' | 'shoes' | ''>('');
  const [quickVariantColor, setQuickVariantColor] = useState<string>('');

  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const handleImageUpload = async (file: File | null, type: 'main' | 'gallery' | 'variant' | 'video', variantIdx: number | null = null) => {
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setFormData({
          name: data.name || '',
          price: data.price || '',
          discountPrice: data.discountPrice || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          image: data.image || '',
          images: data.images || [],
          description: data.description || '',
          countInStock: data.countInStock || 0,
          isBestSeller: data.isBestSeller || false,
          isNewArrival: data.isNewArrival || false,
          variants: data.variants || [],
          seo: data.seo || { metaTitle: '', metaDescription: '' },
          tags: data.tags || [],
          specs: data.specs || [],
          richDescription: data.richDescription || '',
          badge: data.badge || '',
          video: data.video || '',
          stockReason: 'Admin Adjustment',
          stockNote: ''
        });
      } catch (error) {
        addToast("Failed to load product", "error");
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router, addToast]);

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData({ ...formData, images: [...formData.images, newImageUrl] });
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalTags = formData.tags || [];
      const tagInput = document.getElementById('tagInput') as HTMLInputElement;
      if (tagInput && tagInput.value.trim()) {
        const val = tagInput.value.trim();
        if (!finalTags.includes(val)) {
           finalTags = [...finalTags, val];
        }
        tagInput.value = '';
      }
      
      const payload = { ...formData, tags: finalTags };
      await api.put(`/products/${id}`, payload);
      setFormData(payload);
      addToast("Product Updated Successfully", "success");
      router.push('/admin/products');
    } catch (err: any) {
      addToast(err.response?.data?.message || "Update Failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      await api.delete(`/products/${id}`);
      addToast("Product Deleted", "success");
      router.push('/admin/products');
    } catch (err) {
      addToast("Delete Failed", "error");
    }
  };

  /* --- NEXT/PREV NAVIGATION LOGIC --- */
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await api.get('/products');
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load product list for navigation");
      }
    };
    fetchAll();
  }, []);

  const currentIndex = allProducts.findIndex(p => p._id === id);
  const prevProduct = currentIndex > 0 ? allProducts[currentIndex - 1] : null;
  const nextProduct = currentIndex !== -1 && currentIndex < allProducts.length - 1 ? allProducts[currentIndex + 1] : null;

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 pt-32">
      <div className="container mx-auto px-6 max-w-6xl">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/products')} className="p-2 bg-white rounded-full shadow hover:bg-zinc-100 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tight">
              Edit <span className="text-zinc-400">Inventory</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-xl shadow p-1">
              <button
                disabled={!prevProduct}
                onClick={() => router.push(`/admin/products/edit/${prevProduct?._id}`)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-50 rounded-lg transition"
              >
                Prev
              </button>
              <div className="w-px bg-zinc-100 my-1"></div>
              <button
                disabled={!nextProduct}
                onClick={() => router.push(`/admin/products/edit/${nextProduct?._id}`)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-zinc-50 rounded-lg transition"
              >
                Next
              </button>
            </div>

            <button onClick={handleDelete} className="text-red-500 hover:text-red-700 p-3 bg-white rounded-xl shadow hover:bg-red-50 transition">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT FORM */}
          <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-zinc-100">
            <form onSubmit={handleSave} className="space-y-8">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Product Name</label>
                <input
                  type="text"
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold uppercase text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Regular Price (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Sale Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1499"
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold"
                    value={formData.discountPrice}
                    onChange={e => setFormData({ ...formData, discountPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Category</label>
                  <select
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold uppercase text-sm"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Rings">Rings</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Necklaces">Necklaces</option>
                    <option value="Bracelets">Bracelets</option>
                    <option value="Pendants">Pendants</option>
                    <option value="Apparel">Apparel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Subcategory (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold uppercase text-sm"
                    value={formData.subcategory}
                    onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                  />
                </div>
              </div>

              {/* IMAGES SECTION */}
              <div className="space-y-4 border-t border-zinc-100 pt-8">
                <h3 className="text-xs font-black uppercase tracking-widest">Product Imagery</h3>

                <div>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black text-xs pr-12"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
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
                      onChange={(e) => handleImageUpload(e.target.files ? e.target.files[0] : null, 'main')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Additional Images ({formData.images.length}/4)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Add another image URL..."
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs pr-10"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl.trim()) addImage();
                        else document.getElementById('multiImageInput')?.click();
                      }}
                      className="bg-black text-white px-4 rounded-xl hover:bg-zinc-800 flex items-center gap-2"
                    >
                      {newImageUrl.trim() ? <Plus size={18} /> : <Upload size={16} />}
                    </button>
                    <input
                      id="multiImageInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleImageUpload(e.target.files ? e.target.files[0] : null, 'gallery');
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* Image List */}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-zinc-200">
                        <img src={resolveMediaURL(img)} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Description</label>
                <textarea
                  rows={6}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black text-sm"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest text-red-500 font-black">Product Story (The "Story" Tab Content)</label>
                <textarea
                  rows={10}
                  placeholder="Tell the narrative of this product. This shows in the 'Story' tab on the live page..."
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black text-sm italic border-l-4 border-l-red-500"
                  value={formData.richDescription}
                  onChange={e => setFormData({ ...formData, richDescription: e.target.value })}
                />
                <p className="text-[9px] text-zinc-400 mt-2">Supports multi-line narrative. Use this for the emotional and high-fidelity product story.</p>
              </div>

              {/* CONTENT & SEO */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Meta Title</label>
                    <input
                      type="text"
                      placeholder="Google Search Title..."
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold text-xs"
                      value={formData.seo?.metaTitle || ''}
                      onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Meta Description</label>
                    <input
                      type="text"
                      placeholder="Brief summary for Google results..."
                      className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold text-xs"
                      value={formData.seo?.metaDescription || ''}
                      onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })}
                    />
                  </div>
                </div>

                {/* TAGS */}
                <div className="pt-4">
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Product Badges (Tags)</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      id="tagInput"
                      placeholder="e.g. New Arrival"
                      className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:border-black text-xs font-bold uppercase"
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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

              {/* VARIANTS & INVENTORY */}
              <div className="space-y-6 pt-6 border-t border-zinc-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-100 pb-2">Inventory Data</h3>

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
                               const newVariants = sizes.map(size => ({ size, color: quickVariantColor.trim(), stock: 10 }));
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
                             const newVariants = sizes.map(size => ({ size, color: quickVariantColor.trim(), stock: 10 }));
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
                      {formData.variants.map((variant, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewVariantIdx(idx)}
                          className={`flex gap-3 items-center p-3 rounded-2xl border transition-all cursor-pointer group ${previewVariantIdx === idx ? 'bg-zinc-900 border-zinc-900 shadow-lg' : 'bg-zinc-50 border-zinc-200 hover:border-black'}`}
                        >
                           <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 group-hover:border-white/20 transition-colors">
                             {variant.image ? (
                               <img src={resolveMediaURL(variant.image)} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                <Package size={14} />
                              </div>
                            )}
                          </div>
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
                              input.onchange = (e) => handleImageUpload((e.target as HTMLInputElement).files ? (e.target as HTMLInputElement).files![0] : null, 'variant', idx);
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
                  <label className="block text-[10px] font-bold uppercase mb-2 text-zinc-400 tracking-widest">Total Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl outline-none focus:border-black font-bold"
                    value={formData.countInStock}
                    onChange={e => setFormData({ ...formData, countInStock: Number(e.target.value) })}
                    placeholder="0"
                    readOnly={formData.variants && formData.variants.length > 0}
                  />
                  {formData.variants && formData.variants.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mt-2 flex items-start gap-2">
                      <div className="mt-0.5 text-amber-500"><AlertCircle size={14} /></div>
                      <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                        The <strong>Total Stock</strong> is automatically calculated as the sum of all variant quantities.
                      </p>
                    </div>
                  )}
                </div>

                {/* SYSTEMATIC STOCK REASON */}
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <AlertCircle size={16} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Stock Adjustment Reason</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase mb-2 text-purple-400 tracking-widest">Reason</label>
                      <select
                        className="w-full bg-white border border-purple-200 p-3 rounded-xl outline-none focus:border-purple-500 font-bold uppercase text-xs"
                        value={formData.stockReason}
                        onChange={e => setFormData({ ...formData, stockReason: e.target.value })}
                      >
                        <option value="Admin Adjustment">Admin Adjustment</option>
                        <option value="Restock">Restock</option>
                        <option value="Correction">Inventory Correction</option>
                        <option value="Return to Shelf">Return to Shelf</option>
                        <option value="Damaged/Loss">Damaged / Loss</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase mb-2 text-purple-400 tracking-widest">Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Restocked from warehouse..."
                        className="w-full bg-white border border-purple-200 p-3 rounded-xl outline-none focus:border-purple-500 font-bold text-xs"
                        value={formData.stockNote}
                        onChange={e => setFormData({ ...formData, stockNote: e.target.value })}
                      />
                    </div>
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
              </div>

              {/* VISIBILITY BADGES */}
              <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Visibility Badges</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <input
                      type="checkbox"
                      id="isNewArrival"
                      className="mt-1 w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                      checked={formData.isNewArrival}
                      onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    />
                    <label htmlFor="isNewArrival" className="flex flex-col cursor-pointer">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">New Arrival</span>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight mt-1">Shows in the "Fresh Drops" section</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <input
                      type="checkbox"
                      id="isBestSeller"
                      className="mt-1 w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                      checked={formData.isBestSeller}
                      onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    />
                    <label htmlFor="isBestSeller" className="flex flex-col cursor-pointer">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Trending Now</span>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight mt-1">Shows in the "Trending Now" section</span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                disabled={uploading}
                className="w-full bg-black text-white py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-800 transition shadow-xl mt-4 disabled:opacity-50"
              >
                {uploading ? 'Uploading Media...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* RIGHT PREVIEW */}
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
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">{formData.category} {formData.subcategory ? `• ${formData.subcategory}` : ''}</p>
                    <h3 className="font-black text-xl uppercase italic tracking-tighter leading-none">{formData.name || "Untitled Product"}</h3>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mt-4 border-t border-zinc-100 pt-4">
                  {Number(formData.discountPrice) > 0 ? (
                    <>
                      <Price amount={Number(formData.discountPrice)} className="font-bold text-lg" />
                      <Price amount={Number(formData.price || 0)} className="text-zinc-400 text-xs line-through decoration-red-500 decoration-2" />
                    </>
                  ) : (
                    <Price amount={Number(formData.price || 0)} className="font-bold text-lg" />
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div >

      <div className="mt-12">
        <StockHistory productId={id || ''} />
      </div>
    </div >

  );
};

export default EditProductPage;
