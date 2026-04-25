import { AdminCoinsView } from '@/features/admin/AdminCoinsView';

export const metadata = {
    title: 'Slook Coin Management | Admin',
    description: 'Manage user loyalty points and coin balances.',
};

export default function AdminCoinsPage() {
    return <AdminCoinsView />;
}
