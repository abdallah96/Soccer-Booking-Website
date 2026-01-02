'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Calendar } from '@/components/ui/Calendar';
import { PriceDisplay } from '@/components/fields/PriceDisplay';
import { ReviewModal } from '@/components/fields/ReviewModal';
import { useField } from '@/lib/hooks/useField';
import { useAuthStore } from '@/lib/stores/authStore';
import toast from 'react-hot-toast';
import { AVAILABLE_HOURS, PAYMENT_METHODS } from '@/lib/utils/constants';
import { calculateBookingPrice, formatPrice, isDayRate } from '@/lib/utils/pricing';
import { PRICING } from '@/lib/config/constants';
import { trackPageView, trackField, trackPayment, trackBooking } from '@/lib/utils/analytics';

// Star Rating Component (for display only)
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { field, isLoading, error } = useField(params.id as string);
  const [imageError, setImageError] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<60 | 90>(60);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wave' | 'orange_money' | 'cash'>('wave');
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      trackPageView('field_detail', { field_id: params.id });
      fetchReviews();
      fetchWeekAvailability();
    }
  }, [params.id]);

  const fetchWeekAvailability = async () => {
    if (!field?.id) return;
    try {
      const response = await fetch(`/api/week-availability?field_id=${field.id}`);
      if (response.ok) {
        const data = await response.json();
        // Create a set of open week start dates
        const openWeekSet = new Set<string>(
          (data.weeks || [])
            .filter((w: { is_open: boolean; week_start_date: string }) => w.is_open !== false)
            .map((w: { week_start_date: string }) => w.week_start_date)
        );
        setOpenWeeks(openWeekSet);
      }
    } catch (error) {
      console.error('Failed to fetch week availability:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?field_id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        // Check if current user has already reviewed
        if (user) {
          const hasReviewed = (data.reviews || []).some((r: any) => r.user_id === user.id);
          setUserHasReviewed(hasReviewed);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate || !field?.id) {
        setBookedSlots(new Set());
        setBlockedSlots(new Set());
        return;
      }

      try {
        const response = await fetch(
          `/api/bookings/availability?field_id=${field.id}&date=${selectedDate}`
        );
        const data = await response.json();
        if (data.bookedSlots) {
          setBookedSlots(new Set(data.bookedSlots));
          trackField('availability_checked', field.id, { date: selectedDate });
        }
        if (data.blockedSlots) {
          setBlockedSlots(new Set(data.blockedSlots));
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      }
    };

    fetchAvailability();
  }, [selectedDate, field?.id]);

  useEffect(() => {
    if (field?.id) {
      fetchWeekAvailability();
    }
  }, [field?.id]);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour réserver');
      router.push('/auth/login');
      return;
    }

    if (!selectedDate || !selectedStartTime) {
      toast.error('Veuillez sélectionner une date et une heure de début');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          field_id: field?.id,
          date: selectedDate,
          start_time: selectedStartTime,
          duration: selectedDuration,
          payment_method: selectedPaymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erreur lors de la réservation');
        trackBooking('booking_created', { 
          success: false, 
          error: result.error,
          field_id: field?.id 
        });
        return;
      }

      trackBooking('booking_created', {
        success: true,
        booking_id: result.booking?.id,
        field_id: field?.id,
        date: selectedDate,
        start_time: selectedStartTime,
        duration: selectedDuration,
        payment_method: selectedPaymentMethod,
        amount: calculatedPrice,
      });

      toast.success('Réservation créée avec succès !');
      router.push('/my-bookings');
    } catch (error) {
      toast.error('Erreur lors de la réservation');
    }
  };


  // Calculate price dynamically
  const calculatedPrice = selectedStartTime && field
    ? calculateBookingPrice(selectedStartTime, selectedDuration, field.price_per_hour || PRICING.DEFAULT_DAY_RATE)
    : 0;

  // Week-limited calendar: only current week + next week (max 14 days)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 14); // Only 2 weeks ahead

  const getMinDate = () => {
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    return maxDate.toISOString().split('T')[0];
  };

  // Check if a date is in an open week
  const isDateInOpenWeek = (date: Date): boolean => {
    if (openWeeks.size === 0) return true; // Default to open if no data yet
    
    // Get Monday of the week for this date (same logic as API)
    const getMonday = (d: Date) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(d);
      monday.setDate(diff);
      return monday.toISOString().split('T')[0];
    };
    
    const weekStart = getMonday(date);
    return openWeeks.has(weekStart);
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement du terrain..." />;
  }

  if (error || !field) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl mb-6">⚽</div>
          <h1 className="text-4xl font-black text-white mb-4">TERRAIN INTROUVABLE</h1>
          <p className="text-white/60 mb-8 font-light">
            {error || 'Le terrain que vous recherchez n\'existe pas.'}
          </p>
          <Link href="/fields">
            <button className="px-8 py-4 bg-red-600 text-white font-black hover:bg-red-700 transition-colors">
              RETOUR AUX TERRAINS
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        <Link href="/fields" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 font-light font-mono text-sm transition-colors">
          ← RETOUR
        </Link>

        <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-7 space-y-8">
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-red-500/30"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                {field.images && field.images[0] && !imageError ? (
                  <img
                    src={field.images[0]}
                    alt={field.name}
                    className="w-full h-96 object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-red-500/20 to-gray-500/20 flex items-center justify-center">
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
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-white/20">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white font-black">{averageRating > 0 ? averageRating.toFixed(1) : field.rating}</span>
                      <span className="text-white/40 text-sm">({reviews.length} avis)</span>
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
                        className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-mono uppercase"
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
                    <PriceDisplay 
                      pricePerHour={field.price_per_hour || 20000} 
                      variant="detailed"
                      showLabel={true}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-2xl font-black text-white mb-4 uppercase">Localisation</h2>
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-white/10">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(field.location)}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-light"
                  >
                    <span>📍</span>
                    <span>Voir sur Google Maps</span>
                  </a>
              </div>
            </div>
          </div>

            {/* Reviews Section */}
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-full h-full border-2 border-red-500/20"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10">
                <h2 className="text-2xl font-black text-white mb-6 uppercase">Avis des clients</h2>
                
                {/* Average Rating Display */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                  <div className="text-5xl font-black text-white">{averageRating > 0 ? averageRating.toFixed(1) : '—'}</div>
                  <div>
                    <StarRating rating={Math.round(averageRating)} />
                    <p className="text-white/60 text-sm mt-1">{reviews.length} avis</p>
                  </div>
                </div>

                {/* Leave a Review Button */}
                {user && !userHasReviewed && (
                  <div className="mb-8 pb-6 border-b border-white/10 text-center">
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-black hover:from-red-700 hover:to-red-800 transition-all rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/30 transform hover:scale-105"
                    >
                      ✍️ Laisser un avis
                    </button>
                  </div>
                )}

                {!user && (
                  <div className="mb-8 pb-6 border-b border-white/10 text-center">
                    <p className="text-white/60 mb-4">Connectez-vous pour laisser un avis</p>
                    <Link href="/auth/login">
                      <button className="px-6 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors rounded-xl">
                        SE CONNECTER
                      </button>
                    </Link>
                  </div>
                )}

                {userHasReviewed && (
                  <div className="mb-8 pb-6 border-b border-white/10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                      <span className="text-green-400">✓</span>
                      <p className="text-green-400 font-light">Vous avez déjà laissé un avis</p>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-white/60 text-center py-8">Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="bg-gray-800/30 p-6 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                              {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-white font-black">{review.user?.name || 'Anonyme'}</div>
                              <div className="text-white/40 text-xs">
                                {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-white/80 font-light">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="relative">
                <div className="absolute -bottom-4 -left-4 w-full h-full border-2 border-gray-500/30"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10">
                  <h2 className="text-3xl font-black text-white mb-4 uppercase">RÉSERVER</h2>
                  <p className="text-white/60 text-sm mb-8 font-light">
                    📅 Réservation disponible pour les 2 prochaines semaines uniquement
                  </p>

                  {!user ? (
                    <div className="space-y-6">
                      <p className="text-white/60 font-light">Vous devez être connecté pour réserver un terrain.</p>
                      <Link href="/auth/login">
                        <button className="w-full px-6 py-4 bg-red-600 text-white font-black hover:bg-red-700 transition-colors">
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
                        <Calendar
                          selectedDate={selectedDate}
                          onDateSelect={setSelectedDate}
                          minDate={getMinDate()}
                          maxDate={getMaxDate()}
                          isDateAvailable={isDateInOpenWeek}
                        />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                        Heure de début
                      </label>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {AVAILABLE_HOURS.map((hour) => {
                          const isDay = isDayRate(hour);
                          const isBooked = bookedSlots.has(hour);
                            const isBlocked = blockedSlots.has(hour);
                            const isDisabled = isBooked || isBlocked;
                          
                          return (
                            <button
                              key={hour}
                              onClick={() => !isDisabled && setSelectedStartTime(hour)}
                              disabled={isDisabled}
                              className={`px-3 py-2 border-2 text-xs font-light transition-all relative ${
                                isDisabled
                                    ? 'border-gray-600/50 bg-gray-800/50 text-gray-500 cursor-not-allowed'
                                  : selectedStartTime === hour
                                    ? 'border-red-500 bg-red-500/20 text-red-300'
                                  : isDay
                                    ? 'border-red-500/30 bg-gray-800/50 text-white/60 hover:border-red-500/50'
                                    : 'border-gray-500/30 bg-gray-800/50 text-white/60 hover:border-gray-500/50'
                              }`}
                                title={isBooked ? 'Créneau réservé' : isBlocked ? 'Créneau non disponible' : ''}
                            >
                              {hour}
                                {(isBooked || isBlocked) && (
                                  <span className="absolute top-0 right-0 w-2 h-2 bg-gray-500 rounded-full"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                        {(bookedSlots.size > 0 || blockedSlots.size > 0) && (
                        <p className="text-xs text-white/40 mt-2 font-light">
                            ⚠️ Les créneaux grisés ne sont pas disponibles
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                        Durée
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 60, label: '1 Heure' },
                          { value: 90, label: '1 Heure 30' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedDuration(option.value as 60 | 90)}
                            className={`px-4 py-3 border-2 text-sm font-light transition-all ${
                              selectedDuration === option.value
                                  ? 'border-red-500 bg-red-500/20 text-red-300'
                                  : 'border-white/20 bg-gray-800/50 text-white/60 hover:border-white/30'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
                        Méthode de paiement
                      </label>
                      <div className="space-y-3">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => {
                              setSelectedPaymentMethod(method.id as 'wave' | 'orange_money' | 'cash');
                              trackPayment('payment_method_selected', { method: method.id });
                            }}
                            className={`w-full px-4 py-3 border-2 text-left font-light transition-all ${
                              selectedPaymentMethod === method.id
                                  ? 'border-red-500 bg-red-500/20 text-red-300'
                                  : 'border-white/20 bg-gray-800/50 text-white/60 hover:border-white/30'
                            }`}
                          >
                            {method.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <div className="space-y-3 mb-6">
                        {selectedStartTime && field && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60 font-light">
                              {isDayRate(selectedStartTime) ? 'Tarif jour' : 'Tarif nuit'}
                            </span>
                            <span className="text-white font-mono">
                              {isDayRate(selectedStartTime) 
                                ? (field.price_per_hour || 20000).toLocaleString()
                                : Math.round((field.price_per_hour || 20000) * 1.25).toLocaleString()
                              } FCFA/h
                            </span>
                          </div>
                        )}
                        {selectedStartTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60 font-light">Durée</span>
                            <span className="text-white font-mono">
                              {selectedDuration === 60 ? '1h' : '1h30'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <span className="text-white/80 font-light">Total</span>
                            <span className="text-3xl font-black text-red-500">
                            {calculatedPrice > 0 ? formatPrice(calculatedPrice) : '---'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleBooking}
                        disabled={!selectedDate || !selectedStartTime || calculatedPrice === 0}
                          className="w-full px-6 py-4 bg-red-600 text-white font-black hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        fieldId={params.id as string}
        onReviewSubmitted={fetchReviews}
      />
    </div>
  );
}
