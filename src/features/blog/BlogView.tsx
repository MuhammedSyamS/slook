'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { client as api } from '@/lib/api/client';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { Skeleton } from '@/components/ui/Skeleton';

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  publishedAt: string;
  createdAt: string;
}

export const BlogView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/blog');
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Blog fetch error:', err);
        setError('Failed to load articles.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="bg-white min-h-screen selection:bg-black selection:text-white">
      {/* Hero */}
      <section className="page-top pb-12 px-6 border-b border-zinc-100">
        <div className="container-responsive">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-3">SLOOK Editorial</p>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            Studio <span className="text-zinc-200">Blog</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-4">
            Perspectives · Culture · Style
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="container-responsive py-12 md:py-20 px-4 md:px-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[16/9] w-full rounded-2xl bg-zinc-100" />
                <Skeleton className="h-5 w-3/4 rounded-full bg-zinc-100" />
                <Skeleton className="h-3 w-1/2 rounded-full bg-zinc-50" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-32 text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-all"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300">No articles published yet</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-200 mt-2">Check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {posts.map((post, idx) => {
              const imgSrc = post.coverImage ? resolveMediaURL(post.coverImage) : null;
              const date = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
              });

              return (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: `${Math.min(idx * 60, 300)}ms` }}
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-100">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">SLOOK</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-2">
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-lg font-black uppercase tracking-tight leading-tight group-hover:text-zinc-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">{date}</p>
                    <p className="text-[10px] font-bold text-zinc-400 leading-relaxed line-clamp-2">
                      {post.content?.replace(/<[^>]+>/g, '').substring(0, 120)}...
                    </p>
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-widest border-b border-black pb-0.5 w-fit group-hover:text-zinc-600 group-hover:border-zinc-400 transition-all">
                    Read Article →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
