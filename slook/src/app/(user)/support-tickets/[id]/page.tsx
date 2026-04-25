import { TicketDetailsView } from '@/features/user/TicketDetailsView';

export const metadata = {
  title: 'Ticket Details | SLOOK',
  description: 'View the status and conversation details of your support request.',
};

export default function TicketDetailsPage() {
  return <TicketDetailsView />;
}
