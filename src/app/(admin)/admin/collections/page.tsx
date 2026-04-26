import { AdminCollectionsView } from '@/features/admin/AdminCollectionsView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collection Management | SLOOK Admin',
  description: 'Manage studio badges and curated product groups.',
};

export default function Page() {
  return <AdminCollectionsView />;
}
