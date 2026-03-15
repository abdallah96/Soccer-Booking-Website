'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/pricing';
import { CONTACT } from '@/lib/config/constants';

interface BookingInfo {
  id: string;
  date: string;
  time_slot: string;
  amount: number;
  payment_method: string;
  status: string;
  payment_expires_at?: string;
  field?: { name: string; location: string };
  user?: { name: string; phone: string };
}

function CountdownTimer({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [remaining, setRemaining] = useState('');
  const [pct, setPct] = useState(100);
  const TOTAL_MS = 30 * 60 * 1000;

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('00:00');
        setPct(0);
        onExpired();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      setPct(Math.min(100, (diff / TOTAL_MS) * 100));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 1s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white font-mono">{remaining}</span>
          <span className="text-xs text-white/50">restant</span>
        </div>
      </div>
      <p className="text-white/60 text-xs text-center">
        La réservation sera annulée automatiquement à expiration
      </p>
    </div>
  );
}

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [screenshotSent, setScreenshotSent] = useState(false);

  useEffect(() => {
    if (!bookingId) { router.push('/fields'); return; }
    Promise.all([fetchBooking(), fetchSettings()]).finally(() => setIsLoading(false));
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch (e) {}
  };

  const handleExpired = useCallback(() => setExpired(true), []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white/60 text-lg">Chargement...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-black text-white mb-4">Réservation introuvable</h1>
          <Link href="/fields">
            <button className="px-8 py-4 bg-red-600 text-white font-black rounded-xl">
              Retour aux terrains
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isWave = booking.payment_method === 'wave';
  const isOrangeMoney = booking.payment_method === 'orange_money';
  const isCash = booking.payment_method === 'cash';
  const isPendingPayment = booking.status === 'pending_payment';
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  const paymentInstructions = isWave
    ? (settings.payment_instructions_wave || '')
    : isOrangeMoney
    ? (settings.payment_instructions_orange_money || '')
    : '';

  const whatsappNumber = (settings.payment_whatsapp_number || CONTACT.WHATSAPP_NUMBER).replace(/\D/g, '');
  const acompte = Math.round(booking.amount * (Number(settings.acompte_percent || 50) / 100));

  const bookingDateFormatted = new Date(booking.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const whatsappMessage = encodeURIComponent(
    `Bonjour Petit Camp 👋\n\nJe viens de réserver le terrain pour le ${bookingDateFormatted} à ${booking.time_slot}.\n\nID: ${booking.id.slice(0, 8).toUpperCase()}\nMontant: ${formatPrice(booking.amount)}\nAcompte à payer (50%): ${formatPrice(acompte)}\nPaiement via: ${booking.payment_method === 'wave' ? 'Wave' : 'Orange Money'}\n\nVeuillez trouver ci-joint la capture de mon paiement. Merci !`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header status */}
        {isConfirmed && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-2xl font-black text-green-400 mb-1">Réservation confirmée !</h1>
            <p className="text-white/60">Votre créneau est réservé. À bientôt sur le terrain !</p>
          </div>
        )}
        {isCancelled && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">❌</div>
            <h1 className="text-2xl font-black text-red-400 mb-1">Réservation annulée</h1>
            <p className="text-white/60">Cette réservation a été annulée.</p>
          </div>
        )}
        {expired && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">⛔</div>
            <h1 className="text-2xl font-black text-red-400 mb-1">Délai expiré</h1>
            <p className="text-white/60">Le délai de paiement de 30 minutes est dépassé. La réservation a été annulée automatiquement.</p>
            <Link href="/fields" className="inline-block mt-4 px-8 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors">
              Faire une nouvelle réservation
            </Link>
          </div>
        )}
        {isPendingPayment && !expired && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">💳</div>
            <h1 className="text-2xl font-black text-white mb-1">En attente de paiement</h1>
            <p className="text-white/60 text-sm">Complétez votre paiement pour confirmer le créneau</p>
          </div>
        )}

        {/* Booking summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-black uppercase tracking-wider text-sm mb-4">Récapitulatif</h2>
          {[
            ['Terrain', booking.field?.name || 'Petit Camp'],
            ['Date', bookingDateFormatted],
            ['Horaire', booking.time_slot],
            ['Montant total', formatPrice(booking.amount)],
            ['Acompte (50%)', formatPrice(acompte)],
            ['Paiement', booking.payment_method === 'wave' ? '💙 Wave' : booking.payment_method === 'orange_money' ? '🟠 Orange Money' : '💵 Espèces'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-white/50">{label}</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <span className="text-white/50 text-xs font-mono">ID</span>
            <span className="text-white/40 text-xs font-mono">{booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Timer + payment instructions — only for pending_payment, non-cash */}
        {isPendingPayment && !expired && (isWave || isOrangeMoney) && (
          <>
            {/* Countdown */}
            {booking.payment_expires_at && (
              <div className="bg-gray-800/60 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
                <CountdownTimer expiresAt={booking.payment_expires_at} onExpired={handleExpired} />
              </div>
            )}

            {/* Payment steps */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-white font-black uppercase tracking-wider text-sm">
                Comment payer — {isWave ? '💙 Wave' : '🟠 Orange Money'}
              </h2>

              <div className="space-y-3">
                {[
                  { n: '1', text: `Envoyez l'acompte de ${formatPrice(acompte)} (50%) via ${isWave ? 'Wave' : 'Orange Money'}` },
                  { n: '2', text: paymentInstructions },
                  { n: '3', text: 'Prenez une capture d\'écran de la confirmation de paiement' },
                  { n: '4', text: 'Envoyez la capture sur WhatsApp avec le bouton ci-dessous' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                      {n}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed pt-0.5">{text}</p>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setScreenshotSent(true)}
                className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-colors text-lg"
              >
                <span className="text-2xl">💬</span>
                Envoyer ma capture sur WhatsApp
              </a>

              {screenshotSent && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <p className="text-green-400 font-black mb-1">✅ Message WhatsApp ouvert !</p>
                  <p className="text-white/60 text-sm">Envoyez votre capture de paiement. L'admin confirmera votre réservation rapidement.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Cash payment instructions */}
        {isPendingPayment && !expired && isCash && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-black uppercase tracking-wider text-sm">💵 Paiement en espèces</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Présentez-vous au terrain avant votre créneau et payez l'acompte de {' '}
              <span className="text-white font-black">{formatPrice(acompte)}</span> en espèces.
              Un reçu vous sera remis et votre réservation sera confirmée sur place.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Bonjour, j'ai une réservation en espèces le ${bookingDateFormatted} à ${booking.time_slot}. ID: ${booking.id.slice(0, 8).toUpperCase()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-colors"
            >
              <span className="text-2xl">💬</span>
              Contacter Petit Camp sur WhatsApp
            </a>
          </div>
        )}

        {/* Cancellation policy */}
        {settings.cancellation_policy && (
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2">Politique d'annulation</h3>
            <p className="text-white/50 text-xs leading-relaxed">{settings.cancellation_policy}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pb-10">
          <Link href="/my-bookings" className="flex-1">
            <button className="w-full py-4 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-colors">
              Mes réservations
            </button>
          </Link>
          <Link href="/fields" className="flex-1">
            <button className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors">
              Retour au terrain
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white/60 text-lg">Chargement...</div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}
