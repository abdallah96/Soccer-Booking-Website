'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackPageView, trackBooking } from '@/lib/utils/analytics';

export default function MyBookingsPage() {
  useEffect(() => {
    trackPageView('my_bookings');
    trackBooking('booking_viewed');
  }, []);

  return (
    <div className="min-h-screen bg-black py-16 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto text-white text-center">
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl font-black mb-4">MES RÉSERVATIONS</h1>
          <p className="text-xl text-white/60 font-light">En cours de développement</p>
        </div>
        
        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-3xl">
          <div className="text-6xl mb-6">🚧</div>
          <p className="text-lg text-white/70 mb-8">Cette page est en cours de développement.</p>
          <Link href="/fields">
            <button className="px-8 py-4 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors">
              RETOUR AUX TERRAINS
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

