import { SupportTicketsView } from '@/features/support/SupportTicketsView';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Tickets | SLOOK Support',
    description: 'Track and manage your active support frequencies and styling anomalies.',
};

export default function SupportTicketsPage() {
    return <SupportTicketsView />;
}
