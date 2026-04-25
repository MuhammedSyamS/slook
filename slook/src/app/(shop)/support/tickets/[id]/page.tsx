import { TicketDetailsView } from '@/features/support/TicketDetailsView';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Support Manifest | SLOOK Support',
    description: 'Detailed analysis of your active support frequency and Studio intervention.',
};

export default function TicketDetailsPage() {
    return <TicketDetailsView />;
}
