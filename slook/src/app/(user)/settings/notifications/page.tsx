import { NotificationsView } from '@/features/user/NotificationsView';

export const metadata = {
  title: 'Notification Inbox | SLOOK',
  description: 'Manage your store alerts and order updates.',
};

export default function Page() {
    return <NotificationsView />;
}
