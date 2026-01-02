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

export default function MyBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<BookingWithField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    trackPageView('my_bookings');
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchBookings();
  }, [user, router]);

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
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
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
        <div className="mb-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">
            MES RÉSERVATIONS
          </h1>
          <p className="text-xl text-white/60 font-light">
            Gérez toutes vos réservations de terrains
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-3xl text-center">
            <div className="text-6xl mb-6">📅</div>
            <h2 className="text-2xl font-black text-white mb-4">
              Aucune réservation
            </h2>
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
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-white/40 text-sm font-light mb-1">Date</p>
                        <p className="text-white font-semibold">
                          {formatDate(booking.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-sm font-light mb-1">Horaire</p>
                        <p className="text-white font-semibold">{booking.time_slot}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-sm font-light mb-1">Méthode de paiement</p>
                        <p className="text-white font-semibold">
                          {getPaymentMethodText(booking.payment_method)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-sm font-light mb-1">Montant</p>
                        <p className="text-red-500 font-black text-xl">
                          {formatPrice(booking.amount)}
                        </p>
                      </div>
                    </div>

                    <p className="text-white/40 text-sm font-light">
                      Réservé le {new Date(booking.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:min-w-[200px]">
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
        )}
      </div>
    </div>
  );
}
