'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { client as api } from '@/lib/api/client';
import { CreditCard, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PaymentsView = () => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { addToast } = useToast();
  const [cards, setCards] = useState<any[]>(user?.savedCards || []);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({
    cardNumber: '',
    brand: 'Visa',
    expMonth: '',
    expYear: '',
    cvv: ''
  });

  const [deleteModal, setDeleteModal] = useState({ show: false, cardId: null as string | null });

  useEffect(() => {
    if (user?.savedCards) setCards(user.savedCards);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        addToast("Session expired. Please Login again.", "error");
        return;
    }

    const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
    const cardToSave = {
      last4: last4 || '0000',
      brand: formData.brand,
      expMonth: formData.expMonth,
      expYear: formData.expYear,
      cvv: formData.cvv
    };

    try {
      const { data } = await api.post('/users/cards', cardToSave);
      setCards(data);
      setUser({ ...user, savedCards: data });
      setShowForm(false);
      setFormData({ cardNumber: '', brand: 'Visa', expMonth: '', expYear: '', cvv: '' });
      addToast("Card Saved Successfully", "success");
    } catch (err: any) {
      addToast(err.response?.data?.message || err.message || "Failed to save card", "error");
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteModal({ show: true, cardId: id });
  };

  const handleDelete = async () => {
    if (!deleteModal.cardId) return;
    try {
      const { data } = await api.delete(`/users/cards/${deleteModal.cardId}`);
      setCards(data);
      setUser({ ...user, savedCards: data });
      addToast("Card Removed", "success");
    } catch (err) {
      addToast("Failed to delete card", "error");
    } finally {
      setDeleteModal({ show: false, cardId: null });
    }
  };

  if (!user) return null;

  const displayName = `${user.firstName} ${user.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-white pt-40 lg:pt-48 pb-20 page-top">
      <div className="container mx-auto px-6 max-w-4xl">
        <button onClick={() => router.push('/account')} className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-[10px] hover:text-black mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black leading-none">Payments</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">Manage Saved Cards</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-black text-white px-8 py-4 rounded-full font-black uppercase text-[10px] flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />} 
            {showForm ? "Cancel" : "Add Card"}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">Card Number</label>
                    <input required maxLength={19} placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={e => setFormData({ ...formData, cardNumber: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-sm font-mono outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">Expiry Month</label>
                    <input required maxLength={2} placeholder="MM" value={formData.expMonth} onChange={e => setFormData({ ...formData, expMonth: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-sm font-mono outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">Expiry Year</label>
                    <input required maxLength={4} placeholder="YYYY" value={formData.expYear} onChange={e => setFormData({ ...formData, expYear: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-sm font-mono outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase mb-3 block text-zinc-400 tracking-widest">CVV</label>
                    <input required maxLength={4} placeholder="123" value={formData.cvv || ''} onChange={e => setFormData({ ...formData, cvv: e.target.value })} className="w-full bg-white p-5 rounded-2xl text-sm font-mono outline-none border border-zinc-100 focus:border-black text-black transition-all" />
                  </div>
                  <button type="submit" className="md:col-span-2 bg-black text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition shadow-lg active:scale-[0.98]">Save Card Protocol</button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {cards.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-zinc-100 rounded-[3rem] bg-zinc-50/50">
            <CreditCard size={48} className="mx-auto text-zinc-200 mb-6" strokeWidth={1} />
            <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">No Active Payment Artifacts Found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {cards.map((card, idx) => (
              <motion.div 
                key={card._id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-10 rounded-[2.5rem] relative h-56 flex flex-col justify-between shadow-2xl transition-all group overflow-hidden ${idx % 2 === 0 ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-400 border border-zinc-100'}`}
              >
                <div className="flex justify-between items-start relative z-10">
                  <span className={`font-mono text-[10px] tracking-widest font-black uppercase py-1 px-3 rounded-full ${idx % 2 === 0 ? 'bg-white/10 text-white' : 'bg-zinc-100 text-black'}`}>{card.brand || 'Card'}</span>
                  <button onClick={() => confirmDelete(card._id)} className="opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-red-500 hover:text-white rounded-full bg-zinc-100 text-zinc-400 shadow-lg translate-y-2 group-hover:translate-y-0"><Trash2 size={16} /></button>
                </div>
                
                <div className="absolute -bottom-10 -right-10 opacity-[0.03] scale-[2] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                    <CreditCard size={120} />
                </div>

                <div className="relative z-10">
                  <p className={`font-mono text-3xl tracking-widest mb-4 ${idx % 2 === 0 ? 'text-white' : 'text-black'}`}>•••• {card.last4}</p>
                  <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest opacity-60">
                    <span className="truncate max-w-[150px]">{displayName.toUpperCase()}</span>
                    <span>{card.expMonth}/{card.expYear.toString().slice(-2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* DELETE MODAL */}
        <AnimatePresence>
          {deleteModal.show && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-12 rounded-[3.5rem] max-w-sm w-full shadow-3xl text-center"
              >
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">Purge Card?</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-10 leading-relaxed">
                  This action will immediately remove the payment artifact from our secure ledger.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDelete}
                    className="w-full py-5 rounded-2xl font-black bg-black text-white uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition shadow-xl active:scale-95"
                  >
                    Confirm Purge
                  </button>
                  <button
                    onClick={() => setDeleteModal({ show: false, cardId: null })}
                    className="w-full py-5 rounded-2xl font-black border border-zinc-100 text-zinc-400 uppercase text-[10px] tracking-widest hover:bg-zinc-50 transition active:scale-95"
                  >
                    Abort
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
