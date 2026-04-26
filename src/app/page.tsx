import { HomeView } from '@/features/home/HomeView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SLOOK | Premium Artifacts & Studio Drops',
  description: 'Discover curated high-quality artifacts, elite collections, and studio-tier drops at SLOOK.',
};

export default function Page() {
  return <HomeView />;
}
