import { CollectionsView } from '@/features/collections/CollectionsView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections | SLOOK Discovery',
  description: 'Explore curated artifacts and themed studio drops at SLOOK.',
};

export default function Page() {
  return <CollectionsView />;
}
