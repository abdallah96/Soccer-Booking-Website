'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Field } from '@/types';
import { useAuthStore } from '@/lib/stores/authStore';
import toast from 'react-hot-toast';
import { TIME_SLOTS } from '@/lib/utils/constants';

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [field, setField] = useState<Field | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wave' | 'orange_money' | 'cash'>('wave');

  useEffect(() => {
    const fetchField = async () => {
      try {
        const response = await fetch(`/api/fields/${params.id}`);
        const data = await response.json();
        setField(data.field);
      } catch (error) {
        console.error('Failed to fetch field:', error);
        toast.error('Erreur lors du chargement du terrain');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchField();
    }
  }, [params.id]);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour réserver');
      router.push('/auth/login');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      toast.error('Veuillez sélectionner une date et un créneau horaire');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_id: field?.id,
          date: selectedDate,
          time_slot: selectedTimeSlot,
          payment_method: selectedPaymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erreur lors de la réservation');
        return;
      }

      toast.success('Réservation créée avec succès !');
      router.push('/my-bookings');
    } catch (error) {
      toast.error('Erreur lors de la réservation');
    }
  };

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  const getMinDate = () => {
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    return maxDate.toISOString().split('T')[0];
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement du terrain..." />;
  }

  if (!field) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl mb-6">⚽</div>
          <h1 className="text-4xl font-black text-white mb-4">TERRAIN INTROUVABLE</h1>
          <p className="text-white/60 mb-8 font-light">Le terrain que vous recherchez n'existe pas.</p>
          <Link href="/fields">
            <button className="px-8 py-4 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors">
              RETOUR AUX TERRAINS
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        <Link href="/fields" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 font-light font-mono text-sm transition-colors">
          ← RETOUR
        </Link>

        <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-7 space-y-8">
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-emerald-500/30"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                {field.images && field.images[0] ? (
                  <img
                    src={field.images[0]}
                    alt={field.name}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-8xl">⚽</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-white/10"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white">{field.name.toUpperCase()}</h1>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/20">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white font-black">{field.rating}</span>
                    </div>
                  </div>
                  <p className="text-white/60 text-lg font-light flex items-center">
                    <span className="mr-2">📍</span>
                    {field.location}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-2xl font-black text-white mb-4 uppercase">Description</h2>
                  <p className="text-white/70 leading-relaxed font-light">{field.description}</p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-2xl font-black text-white mb-4 uppercase">Équipements</h2>
                  <div className="flex flex-wrap gap-3">
                    {field.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-mono uppercase"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-white/40 font-mono uppercase mb-2">Capacité</div>
                    <div className="text-3xl font-black text-white">{field.capacity} joueurs</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/40 font-mono uppercase mb-2">Prix / heure</div>
                    <div className="text-3xl font-black text-emerald-400">{field.price_per_hour.toLocaleString()} FCFA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -bottom-4 -left-4 w-full h-full border-2 border-blue-500/30"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10">
                <h2 className="text-3xl font-black text-white mb-8 uppercase">RÉSERVER</h2>

                {!user ? (
                  <div className="space-y-6">
                    <p className="text-white/60 font-light">Vous devez être connecté pour réserver un terrain.</p>
                    <Link href="/auth/login">
                      <button className="w-full px-6 py-4 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors">
                        SE CONNECTER
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                        Date
                      </label>
                      <input
                        type="date"
                        min={getMinDate()}
                        max={getMaxDate()}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500 transition-all font-light"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                        Créneau horaire
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`px-4 py-3 border-2 text-sm font-light transition-all ${
                              selectedTimeSlot === slot
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                : 'border-white/20 bg-black/50 text-white/60 hover:border-white/30'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                        Méthode de paiement
                      </label>
                      <div className="space-y-3">
                        {[
                          { id: 'wave', name: 'Wave' },
                          { id: 'orange_money', name: 'Orange Money' },
                          { id: 'cash', name: 'Espèces' },
                        ].map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id as 'wave' | 'orange_money' | 'cash')}
                            className={`w-full px-4 py-3 border-2 text-left font-light transition-all ${
                              selectedPaymentMethod === method.id
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                : 'border-white/20 bg-black/50 text-white/60 hover:border-white/30'
                            }`}
                          >
                            {method.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-white/60 font-light">Total</span>
                        <span className="text-3xl font-black text-emerald-400">{field.price_per_hour.toLocaleString()} FCFA</span>
                      </div>
                      <button
                        onClick={handleBooking}
                        className="w-full px-6 py-4 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
                      >
                        CONFIRMER LA RÉSERVATION
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

