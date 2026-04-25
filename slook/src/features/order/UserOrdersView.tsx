'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import Price from '@/components/shared/Price';
import { Package, ChevronRight, ShoppingBag, Loader2, ArrowLeft } from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { IOrder } from '@/types/order';

export const UserOrdersView = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async (isInitial = false) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (isInitial) setLoading(true);

        const res = await api.get(`/orders/myorders?t=${Date.now()}`);

        const data = Array.isArray(res.data) ? res.data : (res.data.orders || []);
        setOrders(data);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Fetch failed";
        console.error("Fetch Error:", errorMsg);
        setOrders([]);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchOrders(true);
    window.scrollTo(0, 0);
    const interval = setInterval(() => fetchOrders(false), 15000); // 15s Polling
    return () => clearInterval(interval);
  }, [user]); 

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white pt-40">
      <Loader2 className="animate-spin text-black" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-20 px-4 md:px-6 font-sans text-[#1a1a1a] page-top">
      <div className="container mx-auto max-w-5xl">
        {/* BACK TO ACCOUNT */}
        <button
            onClick={() => router.push('/account')}
            className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 bg-zinc-50 px-4 py-2 rounded-full w-fit group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
        </button>

        <div className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="!text-xl md:!text-5xl font-black uppercase tracking-tighter leading-none">
              My <span className="text-red-500">Orders</span>
            </h1>
            <div className="h-0.5 w-10 bg-black mt-2 md:mt-4"></div>
          </div>
          {/* REFRESH BTN */}
          <button onClick={() => window.location.reload()} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black">
            Refresh Status
          </button>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {orders.map((order: IOrder) => (
              <div key={order._id} className="relative border border-zinc-100 p-4 md:p-10 rounded-2xl md:rounded-[2rem] bg-white hover:border-black transition-all duration-500 group shadow-sm hover:shadow-xl">
                <div className="flex flex-col lg:flex-row justify-between gap-6 md:gap-10">

                  {/* LEFT: Order Info & Product Thumbnails */}
                  <div className="space-y-4 md:space-y-6 flex-grow">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <p className="font-black !text-[10px] md:!text-xl tracking-tighter uppercase">#{order._id.slice(-8).toUpperCase()}</p>

                      {/* STATUS BADGE LOGIC */}
                      {(() => {
                        const status = order.orderStatus || (order.isDelivered ? 'Delivered' : order.isDispatched ? 'Shipped' : 'Pending');
                        let colorClass = 'bg-zinc-100 text-zinc-600';

                        switch (status) {
                          case 'Pending': colorClass = 'bg-yellow-100 text-yellow-600'; break;
                          case 'Processing': colorClass = 'bg-teal-100 text-teal-600'; break;
                          case 'Confirmed': colorClass = 'bg-blue-100 text-blue-600'; break;
                          case 'Dispatched': colorClass = 'bg-indigo-100 text-indigo-600'; break;
                          case 'Shipped': colorClass = 'bg-purple-100 text-purple-600'; break;
                          case 'Delivered': colorClass = 'bg-green-100 text-green-600'; break;
                          case 'Cancelled': colorClass = 'bg-red-50 text-red-500'; break;
                          case 'Returned': colorClass = 'bg-orange-50 text-orange-500'; break;
                          case 'Return Requested': colorClass = 'bg-orange-50 text-orange-400'; break;
                          case 'Exchanged': colorClass = 'bg-indigo-100 text-indigo-600'; break; // NEW
                          default: colorClass = 'bg-zinc-100 text-zinc-600';
                        }

                        // Get the date for the current status
                        const statusDates: Record<string, string | undefined> = {
                          'Pending': order.createdAt,
                          'Processing': order.processingAt,
                          'Confirmed': order.confirmedAt,
                          'Dispatched': order.dispatchedAt,
                          'Shipped': order.shippedAt,
                          'Delivered': order.deliveredAt,
                          'Return Requested': order.returnRequestedAt,
                          'Returned': order.returnedAt
                        };
                        const currentDate = statusDates[status] || order.updatedAt;

                        return (
                          <div className="flex items-center gap-3">
                            <span className={`px-2 md:px-4 py-1 rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest ${colorClass}`}>
                              {status}
                            </span>
                            {currentDate && (
                              <span className="text-[9px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                {new Date(currentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* PRODUCT IMAGES PREVIEW */}
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {order.orderItems && order.orderItems.map((item, idx: number) => (
                        <div key={idx} className="relative w-12 h-16 md:w-20 md:h-24 bg-zinc-50 rounded-lg md:rounded-xl overflow-hidden border border-zinc-100">
                          <img
                            src={resolveMediaURL(item.image) || "/placeholder.jpg"}
                            alt={item.name}
                            className="w-full h-full object-cover transition-all duration-500 hover:scale-110"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: Price & Action */}
                  <div className="flex flex-col justify-between items-end gap-4 md:gap-6 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-4 md:pt-6 lg:pt-0 lg:pl-10 w-full lg:w-auto">
                    <div className="text-right">
                      <p className="text-[9px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">Grand Total</p>
                      <Price amount={order.totalPrice} className="!text-lg md:!text-3xl font-black tracking-tighter" />
                    </div>

                    <button
                      onClick={() => router.push(`/orders/${order._id}`)}
                      className="w-full lg:w-auto px-6 py-3 md:px-10 md:py-5 bg-black text-white font-black uppercase tracking-[0.2em] !text-[9px] hover:bg-zinc-800 transition shadow-xl active:scale-95 flex items-center justify-center gap-2 rounded-xl"
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-zinc-50 rounded-[3rem] border border-dashed border-zinc-200">
            <ShoppingBag size={48} className="mx-auto text-zinc-200 mb-6" />
            <p className="text-zinc-400 font-black uppercase tracking-widest !text-[10px] md:!text-xs">The history is empty</p>
            <button onClick={() => router.push('/shop')} className="mt-8 bg-black text-white px-10 py-5 rounded-full font-black uppercase tracking-widest !text-[9px] md:!text-[10px] shadow-xl">Back to Shop</button>
          </div>
        )}
      </div>
    </div>
  );
};
