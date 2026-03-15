'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { trackPageView, trackBooking } from '@/lib/utils/analytics';
import { BookingWithField } from '@/types';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils/pricing';

// Countdown timer component for pending_payment bookings
function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setRemaining('Expiré');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${String(secs).padStart(2, '0')}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className={`mt-3 p-3 rounded-lg border flex items-center gap-3 ${
      expired
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-orange-500/10 border-orange-500/30'
    }`}>
      <span className="text-xl">{expired ? '⛔' : '⏱️'}</span>
      <div>
        <p className="text-xs font-mono uppercase text-orange-400/80 mb-0.5">
          {expired ? 'Paiement expiré' : 'Temps restant pour payer'}
        </p>
        <p className={`font-black text-lg ${expired ? 'text-red-400' : 'text-orange-300'}`}>
          {remaining}
        </p>
        {!expired && (
          <p className="text-white/40 text-xs mt-0.5">
            La réservation sera annulée automatiquement à l'expiration
          </p>
        )}
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<BookingWithField[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'subscriptions'>('bookings');

  useEffect(() => {
    trackPageView('my_bookings');
    if (!user) { router.push('/auth/login'); return; }
    fetchBookings();
    fetchSubscriptions();
  }, [user, router]);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions', { credentials: 'include' });
      if (res.ok) { const d = await res.json(); setSubscriptions(d.subscriptions || []); }
    } catch (e) { console.error(e); }
  };

  const fetchBookings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        if (response.status === 401) {
          router.push('/auth/login');
        } else {
          toast.error('Erreur lors du chargement des réservations');
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Réservation annulée avec succès');
        trackBooking('booking_cancelled');
        fetchBookings();
      } else {
        toast.error(result.error || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pending_payment':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅ Confirmée';
      case 'pending':
        return '⏳ En attente';
      case 'pending_payment':
        return '💳 En attente de paiement';
      case 'cancelled':
        return '❌ Annulée';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'wave':
        return 'Wave';
      case 'orange_money':
        return 'Orange Money';
      case 'cash':
        return 'Espèces';
      default:
        return method;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-16 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">
            MES RÉSERVATIONS
          </h1>
          <p className="text-xl text-white/60 font-light">
            Gérez toutes vos réservations de terrains
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${
              activeTab === 'bookings'
                ? 'bg-red-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            📅 Réservations
            {bookings.length > 0 && (
              <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">{bookings.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-red-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            🔄 Abonnements
            {subscriptions.filter(s => s.status === 'active').length > 0 && (
              <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {subscriptions.filter(s => s.status === 'active').length}
              </span>
            )}
          </button>
        </div>

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          bookings.length === 0 ? (
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-3xl text-center">
              <div className="text-6xl mb-6">📅</div>
              <h2 className="text-2xl font-black text-white mb-4">Aucune réservation</h2>
              <p className="text-lg text-white/70 mb-8">
                Vous n'avez pas encore de réservations. Commencez à réserver un terrain maintenant !
              </p>
              <Link href="/fields">
                <button className="px-8 py-4 bg-red-600 text-white font-black hover:bg-red-700 transition-colors rounded-lg">
                  RÉSERVER MAINTENANT
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-black text-white mb-2">
                            {booking.field?.name || 'Terrain'}
                          </h3>
                          <p className="text-white/60 font-light">
                            {booking.field?.location || 'Localisation non disponible'}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-white/40 text-sm font-light mb-1">Date</p>
                          <p className="text-white font-semibold">{formatDate(booking.date)}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-sm font-light mb-1">Horaire</p>
                          <p className="text-white font-semibold">{booking.time_slot}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-sm font-light mb-1">Méthode de paiement</p>
                          <p className="text-white font-semibold">{getPaymentMethodText(booking.payment_method)}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-sm font-light mb-1">Montant</p>
                          <p className="text-red-500 font-black text-xl">{formatPrice(booking.amount)}</p>
                        </div>
                      </div>

                      <p className="text-white/40 text-sm font-light">
                        Réservé le {new Date(booking.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>

                      {booking.status === 'pending_payment' && (booking as any).payment_expires_at && (
                        <PaymentCountdown expiresAt={(booking as any).payment_expires_at} />
                      )}

                      {booking.status === 'cancelled' && (booking as any).cancellation_reason && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-400/80 text-xs font-mono uppercase mb-1">Motif d'annulation</p>
                          <p className="text-red-300 text-sm">{(booking as any).cancellation_reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:min-w-[200px]">
                      {booking.status === 'pending_payment' && (
                        <Link href={`/booking-confirmation?id=${booking.id}`}>
                          <button className="w-full px-6 py-3 bg-orange-600 text-white border border-orange-500/50 rounded-lg font-bold hover:bg-orange-700 transition-colors text-center">
                            💳 Finaliser le paiement
                          </button>
                        </Link>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === booking.id ? 'Annulation...' : 'Annuler'}
                        </button>
                      )}
                      <Link
                        href={`/fields/${booking.field_id}`}
                        className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-lg font-bold hover:bg-white/20 transition-colors text-center"
                      >
                        Voir le terrain
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && (
          subscriptions.length === 0 ? (
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-3xl text-center">
              <div className="text-6xl mb-6">🔄</div>
              <h2 className="text-2xl font-black text-white mb-4">Aucun abonnement</h2>
              <p className="text-lg text-white/70 mb-8">
                Vous n'avez pas encore d'abonnement. Contactez-nous pour réserver un créneau récurrent avec une remise.
              </p>
              <a
                href={`https://wa.me/221789251834?text=${encodeURIComponent("Bonjour Petit Camp, je souhaite m'abonner à un créneau hebdomadaire.")}`}
                target="_blank" rel="noopener noreferrer"
              >
                <button className="px-8 py-4 bg-green-600 text-white font-black hover:bg-green-700 transition-colors rounded-lg">
                  💬 Contacter Petit Camp
                </button>
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                const statusColor = sub.status === 'active'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : sub.status === 'paused'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30';
                const statusText = sub.status === 'active' ? '● Actif' : sub.status === 'paused' ? '⏸ Pausé' : '✕ Annulé';

                return (
                  <div key={sub.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-xl font-black text-white">
                            {sub.field?.name || 'Terrain'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                            {statusText}
                          </span>
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold border border-purple-500/30">
                            -{sub.discount_percent}% remise abonné
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                          <div>
                            <p className="text-white/40 text-xs mb-0.5">Jour</p>
                            <p className="text-white font-semibold text-sm">{DAYS_FR[sub.day_of_week]}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-0.5">Heure</p>
                            <p className="text-white font-semibold text-sm">{sub.start_time} · {sub.duration === 60 ? '1h' : '1h30'}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-0.5">Paiement</p>
                            <p className="text-white font-semibold text-sm">
                              {sub.payment_method === 'wave' ? 'Wave' : sub.payment_method === 'orange_money' ? 'Orange Money' : 'Espèces'}
                            </p>
                          </div>
                          {sub.next_booking_date && sub.status === 'active' && (
                            <div className="col-span-2 sm:col-span-3">
                              <p className="text-white/40 text-xs mb-0.5">Prochain créneau</p>
                              <p className="text-blue-400 font-semibold text-sm">
                                {new Date(sub.next_booking_date + 'T12:00:00').toLocaleDateString('fr-FR', {
                                  weekday: 'long', day: 'numeric', month: 'long',
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-white/40 text-xs">
                        Abonnement depuis le {new Date(sub.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {sub.end_date && ` · jusqu'au ${new Date(sub.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
