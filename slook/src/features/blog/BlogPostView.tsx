'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChevronLeft } from 'lucide-react';

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

export const BlogPostView = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/blog/${slug}`);
        setPost(data);
      } catch (err: any) {
        setError(err.response?.status === 404 ? 'Article not found.' : 'Failed to load article.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) return (
    <div className="page-top container-responsive px-4 md:px-6 pb-20 max-w-3xl mx-auto space-y-8">
      <Skeleton className="aspect-[16/7] w-full rounded-3xl bg-zinc-100" />
      <Skeleton className="h-10 w-3/4 rounded-full bg-zinc-100" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-full rounded-full bg-zinc-50" />)}
      </div>
    </div>
  );

  if (error || !post) return (
    <div className="page-top min-h-screen flex flex-col items-center justify-center gap-6">
      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{error || 'Article not found'}</p>
      <Link href="/blog" className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-all">
        Back to Blog
      </Link>
    </div>
  );

  const imgSrc = post.coverImage ? resolveMediaURL(post.coverImage) : null;
  const date = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="bg-white min-h-screen selection:bg-black selection:text-white">
      {/* Cover */}
      {imgSrc && (
        <div className="relative w-full h-[45vh] md:h-[60vh] bg-zinc-100">
          <Image src={imgSrc} alt={post.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white" />
        </div>
      )}

      <article className={`container-responsive max-w-3xl mx-auto px-4 md:px-6 pb-24 ${imgSrc ? '-mt-24 relative z-10' : 'page-top'}`}>
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-8">
          <ChevronLeft size={12} />
          Back to Blog
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {post.tags.map(tag => (
              <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight mb-4">{post.title}</h1>
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-12 pb-12 border-b border-zinc-100">{date}</p>

        {/* Content */}
        <div
          className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed text-[14px] font-medium
            prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
            prose-h2:text-2xl prose-h3:text-xl
            prose-strong:text-black
            prose-a:text-black prose-a:underline
            prose-img:rounded-2xl prose-img:w-full"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
};
