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
  const [calendarBookingInfo, setCalendarBookingInfo] = useState<Record<string, { total: number; booked: number; isFullyBooked: boolean }>>({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSlotDate, setBookingSlotDate] = useState('');
  const [bookingSlotTime, setBookingSlotTime] = useState('');
  const [guestBookingData, setGuestBookingData] = useState({ phone: '', name: '', email: '' });
  const [isBooking, setIsBooking] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] = useState<{ valid: boolean; discount?: any; error?: string } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<{ id: string; rating: number; comment: string } | null>(null);

  useEffect(() => {
    if (params.id) {
      trackPageView('field_detail', { field_id: params.id });
      fetchReviews();
      fetchWeekAvailability();
    }
  }, [params.id]);

  // Fetch calendar booking info when field loads
  useEffect(() => {
    const fetchCalendarBookingInfo = async () => {
      if (!field?.id) return;
      
      // Get dates for current month and next month
      const today = new Date();
      const monthStart = today.toISOString().split('T')[0];
      const monthEnd = new Date(today);
      monthEnd.setDate(monthEnd.getDate() + 60); // 2 months ahead
      const monthEndStr = monthEnd.toISOString().split('T')[0];
      
      try {
        const response = await fetch(
          `/api/bookings/availability?field_id=${field.id}&month_start=${monthStart}&month_end=${monthEndStr}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.bookingInfo) {
            setCalendarBookingInfo(data.bookingInfo);
          }
        }
      } catch (error) {
        console.error('Failed to fetch calendar booking info:', error);
      }
    };

    fetchCalendarBookingInfo();
  }, [field?.id]);

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
        } else {
          setUserHasReviewed(false); // Anonymous users can always review
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

  const handleTimeSlotClick = (time: string) => {
    if (!selectedDate) {
      toast.error('Veuillez d\'abord sélectionner une date');
      return;
    }
    setBookingSlotDate(selectedDate);
    setBookingSlotTime(time);
    setSelectedStartTime(time);
    setShowBookingModal(true);
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return;
    setValidatingCode(true);
    try {
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode }),
      });
      const data = await res.json();
      setDiscountValidation(data);
      if (!data.valid) toast.error(data.error || 'Code invalide');
    } catch {
      setDiscountValidation({ valid: false, error: 'Erreur de validation' });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleBooking = async () => {
    const date = bookingSlotDate || selectedDate;
    const time = bookingSlotTime || selectedStartTime;

    if (!date || !time) {
      toast.error('Date et heure requises');
      return;
    }

    if (!user && !guestBookingData.phone) {
      toast.error('Numéro de téléphone requis');
      return;
    }

    setIsBooking(true);
    try {
      const bookingPayload: any = {
        field_id: field?.id,
        date: date,
        start_time: time,
        duration: selectedDuration,
        payment_method: selectedPaymentMethod,
      };

      if (discountValidation?.valid && discountCode.trim()) {
        bookingPayload.discount_code = discountCode.trim();
      }

      if (!user) {
        bookingPayload.phone = guestBookingData.phone;
        if (guestBookingData.name) bookingPayload.name = guestBookingData.name;
        if (guestBookingData.email) bookingPayload.email = guestBookingData.email;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingPayload),
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
        date: date,
        start_time: time,
        duration: selectedDuration,
        payment_method: selectedPaymentMethod,
        amount: calculatedPrice,
      });

      toast.success('Réservation créée ! Finalisez votre paiement.');
      setShowBookingModal(false);
      setGuestBookingData({ phone: '', name: '', email: '' });
      setDiscountCode('');
      setDiscountValidation(null);

      // Always redirect to confirmation page with payment instructions
      router.push(`/booking-confirmation?id=${result.booking?.id}`);
    } catch (error) {
      toast.error('Erreur lors de la réservation');
    } finally {
      setIsBooking(false);
    }
  };


  // Calculate price dynamically
  const timeForPrice = bookingSlotTime || selectedStartTime;
  const calculatedPrice = timeForPrice && field
    ? calculateBookingPrice(timeForPrice, selectedDuration, field.price_per_hour || PRICING.DEFAULT_DAY_RATE)
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
    // Default to open if no weeks data has been loaded yet
    // This prevents blocking all dates before the API responds
    if (openWeeks.size === 0) return true;
    
    // Get Monday of the week for this date (same logic as API)
    const getMonday = (d: Date) => {
      // Use local date to avoid timezone issues
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();
      const dayOfWeek = d.getDay();
      const diff = day - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(year, month, diff);
      // Format as YYYY-MM-DD
      const yyyy = monday.getFullYear();
      const mm = String(monday.getMonth() + 1).padStart(2, '0');
      const dd = String(monday.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
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
    <div className="min-h-screen bg-gray-900 py-6 md:py-12 lg:py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        <Link href="/fields" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 md:mb-8 font-light font-mono text-sm transition-colors">
          ← RETOUR
        </Link>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12">
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-red-500/30 hidden md:block"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden rounded-lg md:rounded-none">
                {field.images && field.images[0] && !imageError ? (
                  <img
                    src={field.images[0]}
                    alt={field.name}
                    className="w-full h-64 md:h-96 object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-64 md:h-96 bg-gradient-to-br from-red-500/20 to-gray-500/20 flex items-center justify-center">
                    <span className="text-6xl md:text-8xl">⚽</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-white/10 hidden md:block"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-8 lg:p-10 rounded-lg md:rounded-none">
                <div className="mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">{field.name.toUpperCase()}</h1>
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg">
                      <span className="text-yellow-400 text-sm md:text-base">★</span>
                      <span className="text-white font-black text-sm md:text-base">{averageRating > 0 ? averageRating.toFixed(1) : field.rating}</span>
                      <span className="text-white/40 text-xs md:text-sm">({reviews.length} avis)</span>
                    </div>
                  </div>
                  <p className="text-white/60 text-base md:text-lg font-light flex items-center">
                    <span className="mr-2">📍</span>
                    {field.location}
                  </p>
                </div>

                <div className="pt-4 md:pt-6 border-t border-white/10">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-3 md:mb-4 uppercase">Description</h2>
                  <p className="text-white/70 leading-relaxed font-light text-sm md:text-base">{field.description}</p>
                </div>

                <div className="pt-4 md:pt-6 border-t border-white/10">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-3 md:mb-4 uppercase">Équipements</h2>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {field.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-red-500/20 text-red-300 border border-red-500/30 text-xs md:text-sm font-mono uppercase rounded"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 md:pt-6 border-t border-white/10 grid grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <div className="text-xs md:text-sm text-white/40 font-mono uppercase mb-2">Capacité</div>
                    <div className="text-2xl md:text-3xl font-black text-white">{field.capacity} joueurs</div>
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
              <div className="absolute -top-4 -right-4 w-full h-full border-2 border-red-500/20 hidden md:block"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-8 lg:p-10 rounded-lg md:rounded-none">
                <h2 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6 uppercase">Avis des clients</h2>
                
                {/* Average Rating Display */}
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-white/10">
                  <div className="text-4xl md:text-5xl font-black text-white">{averageRating > 0 ? averageRating.toFixed(1) : '—'}</div>
                  <div>
                    <StarRating rating={Math.round(averageRating)} />
                    <p className="text-white/60 text-xs md:text-sm mt-1">{reviews.length} avis</p>
                  </div>
                </div>

                {/* Leave a Review Button */}
                {!userHasReviewed && (
                  <div className="mb-6 md:mb-8 pb-4 md:pb-6 border-b border-white/10 text-center">
                    <button
                      onClick={() => {
                        setEditingReview(null);
                        setShowReviewModal(true);
                      }}
                      className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-black hover:from-red-700 hover:to-red-800 transition-all rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/30 transform hover:scale-105 text-sm md:text-base"
                    >
                      ✍️ Laisser un avis
                    </button>
                    {!user && (
                      <p className="text-white/50 text-xs md:text-sm mt-3">
                        Vous pouvez laisser un avis sans vous connecter
                      </p>
                    )}
                  </div>
                )}

                {userHasReviewed && user && (
                  <div className="mb-8 pb-6 border-b border-white/10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-3">
                      <span className="text-green-400">✓</span>
                      <p className="text-green-400 font-light">Vous avez déjà laissé un avis</p>
                    </div>
                    <button
                      onClick={() => {
                        const userReview = reviews.find((r: any) => r.user_id === user.id);
                        if (userReview) {
                          setEditingReview({
                            id: userReview.id,
                            rating: userReview.rating,
                            comment: userReview.comment,
                          });
                          setShowReviewModal(true);
                        }
                      }}
                      className="px-6 py-3 bg-white/10 text-white font-black hover:bg-white/20 transition-colors rounded-xl border border-white/20"
                    >
                      ✏️ Modifier mon avis
                    </button>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-white/60 text-center py-8">Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="bg-gray-800/30 p-4 md:p-6 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-black flex-shrink-0">
                              {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-white font-black">{review.user?.name || 'Anonyme'}</div>
                                {review.user_id && user && review.user_id === user.id && (
                                  <button
                                    onClick={() => {
                                      setEditingReview({
                                        id: review.id,
                                        rating: review.rating,
                                        comment: review.comment,
                                      });
                                      setShowReviewModal(true);
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300 font-light underline"
                                  >
                                    Modifier
                                  </button>
                                )}
                              </div>
                              <div className="text-white/40 text-xs">
                                {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                                {review.updated_at && review.updated_at !== review.created_at && (
                                  <span className="ml-2 text-white/30">(modifié)</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                        <p className="text-white/80 font-light leading-relaxed">{review.comment}</p>
                        
                        {/* Admin Reply */}
                        {review.admin_reply && (
                          <div className="mt-4 pt-4 border-t border-white/10 bg-blue-500/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-blue-400 font-black text-xs">👑 ADMIN</span>
                              <span className="text-white/50 text-xs">
                                {review.admin?.name || 'Admin'} • {review.admin_replied_at && new Date(review.admin_replied_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-white/90 font-light leading-relaxed text-sm md:text-base">{review.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-6 md:top-24">
              <div className="relative">
                <div className="absolute -bottom-4 -left-4 w-full h-full border-2 border-gray-500/30 hidden md:block"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-8 lg:p-10 rounded-lg md:rounded-none">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4 uppercase">RÉSERVER</h2>
                  <p className="text-white/60 text-xs md:text-sm mb-6 md:mb-8 font-light">
                    📅 Réservation disponible pour les 2 prochaines semaines uniquement
                  </p>

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
                          bookingInfo={calendarBookingInfo}
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
                              onClick={() => !isDisabled && handleTimeSlotClick(hour)}
                              disabled={isDisabled}
                              className={`px-3 py-2 border-2 text-xs font-light transition-all relative ${
                                isDisabled
                                    ? 'border-gray-600/50 bg-gray-800/50 text-gray-500 cursor-not-allowed'
                                  : selectedStartTime === hour
                                    ? 'border-red-500 bg-red-500/20 text-red-300'
                                  : isDay
                                    ? 'border-red-500/30 bg-gray-800/50 text-white/60 hover:border-red-500/50 hover:scale-105'
                                    : 'border-gray-500/30 bg-gray-800/50 text-white/60 hover:border-gray-500/50 hover:scale-105'
                              }`}
                                title={isBooked ? 'Créneau réservé' : isBlocked ? 'Créneau non disponible' : 'Cliquez pour réserver'}
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
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] my-auto overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-white">Réserver</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingSlotDate('');
                  setBookingSlotTime('');
                  setGuestBookingData({ phone: '', name: '', email: '' });
                }}
                className="text-white/50 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 md:p-6 space-y-6">
              {/* Booking Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Date</span>
                  <span className="text-white font-medium">
                    {bookingSlotDate && new Date(bookingSlotDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Heure</span>
                  <span className="text-white font-medium">{bookingSlotTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Terrain</span>
                  <span className="text-white font-medium">{field?.name}</span>
                </div>
              </div>

              {!user ? (
                /* Guest Booking Form */
                <form onSubmit={(e) => { e.preventDefault(); handleBooking(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-white/80 mb-2">
                      Téléphone * <span className="text-white/40 font-normal">(requis)</span>
                    </label>
                    <input
                      type="tel"
                      value={guestBookingData.phone}
                      onChange={(e) => setGuestBookingData({ ...guestBookingData, phone: e.target.value })}
                      placeholder="Ex: 77 123 45 67"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-white/80 mb-2">
                      Nom <span className="text-white/40 font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={guestBookingData.name}
                      onChange={(e) => setGuestBookingData({ ...guestBookingData, name: e.target.value })}
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-white/80 mb-2">
                      Email <span className="text-white/40 font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="email"
                      value={guestBookingData.email}
                      onChange={(e) => setGuestBookingData({ ...guestBookingData, email: e.target.value })}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                    />
                  </div>

                  {/* Duration & Payment for guests */}
                  <div>
                    <label className="block text-sm font-black text-white/80 mb-2">Durée</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ value: 60, label: '1 Heure' }, { value: 90, label: '1h30' }].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedDuration(opt.value as 60 | 90)}
                          className={`px-4 py-3 border-2 text-sm font-light transition-all rounded-lg ${
                            selectedDuration === opt.value
                              ? 'border-red-500 bg-red-500/20 text-red-300'
                              : 'border-white/20 bg-gray-800/50 text-white/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-white/80 mb-2">Paiement</label>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPaymentMethod(method.id as 'wave' | 'orange_money' | 'cash')}
                          className={`w-full px-4 py-3 border-2 text-left font-light transition-all rounded-lg ${
                            selectedPaymentMethod === method.id
                              ? 'border-red-500 bg-red-500/20 text-red-300'
                              : 'border-white/20 bg-gray-800/50 text-white/60'
                          }`}
                        >
                          {method.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 font-medium">Total</span>
                      <span className="text-2xl font-black text-red-500">
                        {calculatedPrice > 0 ? formatPrice(calculatedPrice) : '---'}
                      </span>
                    </div>
                    {calculatedPrice > 0 && (
                      <div className="flex items-center justify-between mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                        <span className="text-orange-300 text-sm font-black">Acompte à payer (50%)</span>
                        <span className="text-orange-300 text-sm font-black">{formatPrice(Math.round(calculatedPrice * 0.5))}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isBooking || !guestBookingData.phone}
                      className="w-full px-6 py-4 bg-red-600 text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                    >
                      {isBooking ? 'Réservation...' : 'Confirmer la réservation'}
                    </button>
                    <p className="text-xs text-white/40 mt-3 text-center">
                      Un compte sera créé automatiquement avec votre numéro de téléphone
                    </p>
                  </div>
                </form>
              ) : (
                /* Logged-in User Quick Confirm */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-white/80 mb-2">Durée</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ value: 60, label: '1 Heure' }, { value: 90, label: '1h30' }].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedDuration(opt.value as 60 | 90)}
                          className={`px-4 py-3 border-2 text-sm font-light transition-all rounded-lg ${
                            selectedDuration === opt.value
                              ? 'border-red-500 bg-red-500/20 text-red-300'
                              : 'border-white/20 bg-gray-800/50 text-white/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-white/80 mb-2">Paiement</label>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id as 'wave' | 'orange_money' | 'cash')}
                          className={`w-full px-4 py-3 border-2 text-left font-light transition-all rounded-lg ${
                            selectedPaymentMethod === method.id
                              ? 'border-red-500 bg-red-500/20 text-red-300'
                              : 'border-white/20 bg-gray-800/50 text-white/60'
                          }`}
                        >
                          {method.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {user && (
                    <div>
                      <label className="block text-sm font-black text-white/80 mb-2">Code de réduction (optionnel)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value.toUpperCase());
                            setDiscountValidation(null);
                          }}
                          placeholder="PC-XXXXXX"
                          className="flex-1 px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={validateDiscountCode}
                          disabled={!discountCode.trim() || validatingCode}
                          className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 hover:bg-purple-700 transition-colors"
                        >
                          {validatingCode ? '...' : 'Vérifier'}
                        </button>
                      </div>
                      {discountValidation?.valid && (
                        <div className="mt-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-xs font-bold">
                          {discountValidation.discount?.discount_type === 'free_session'
                            ? 'Séance gratuite appliquée !'
                            : `Réduction de ${discountValidation.discount?.discount_value}% appliquée !`}
                        </div>
                      )}
                      {discountValidation && !discountValidation.valid && (
                        <div className="mt-2 text-red-400 text-xs">{discountValidation.error}</div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 font-medium">Total</span>
                      {discountValidation?.valid && discountValidation.discount?.discount_type === 'free_session' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 line-through text-sm">{formatPrice(calculatedPrice)}</span>
                          <span className="text-2xl font-black text-green-400">GRATUIT</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-black text-red-500">
                          {calculatedPrice > 0 ? formatPrice(calculatedPrice) : '---'}
                        </span>
                      )}
                    </div>
                    {calculatedPrice > 0 && !(discountValidation?.valid) && (
                      <div className="flex items-center justify-between mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                        <span className="text-orange-300 text-sm font-black">Acompte à payer (50%)</span>
                        <span className="text-orange-300 text-sm font-black">{formatPrice(Math.round(calculatedPrice * 0.5))}</span>
                      </div>
                    )}
                    <button
                      onClick={handleBooking}
                      disabled={isBooking || !bookingSlotDate || !bookingSlotTime}
                      className="w-full px-6 py-4 bg-red-600 text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                    >
                      {isBooking ? 'Réservation...' : 'Confirmer la réservation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReview(null);
        }}
        fieldId={params.id as string}
        onReviewSubmitted={fetchReviews}
        editingReview={editingReview}
      />
    </div>
  );
}
