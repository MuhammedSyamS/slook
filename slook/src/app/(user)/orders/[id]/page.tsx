import { UserOrderDetailsView } from '@/features/order/UserOrderDetailsView';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <UserOrderDetailsView orderId={id} />;
}
