'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [adminData, setAdminData] = useState({ email: '', name: '', password: '' });
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      toast.error('Accès refusé. Admin uniquement.');
      router.push('/');
      return;
    }

    setIsLoading(false);
    fetchBookings();
  }, [user, router]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, user_id: user?.id }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Mot de passe mis à jour avec succès');
        setNewPassword('');
        setShowPasswordForm(false);
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du mot de passe');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminData.email || !adminData.name || !adminData.password) {
      toast.error('Tous les champs sont requis');
      return;
    }

    if (adminData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminData.email,
          name: adminData.name,
          password: adminData.password,
          role: 'admin',
          admin_user_id: user?.id,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Admin créé avec succès');
        setAdminData({ email: '', name: '', password: '' });
        setShowCreateAdminForm(false);
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création de l\'admin');
    }
  };

  const handleConfirmBooking = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingBooking(bookingId);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(status === 'confirmed' ? 'Réservation confirmée' : 'Réservation annulée');
        fetchBookings();
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingBooking(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="min-h-screen bg-black py-12 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto text-white">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2">PANEL ADMIN</h1>
          <p className="text-white/60 font-light">Gestion des réservations et des administrateurs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
            <div className="text-3xl font-black text-emerald-400 mb-2">{bookings.length}</div>
            <div className="text-sm text-white/60 font-light">Total Réservations</div>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors text-left"
          >
            <div className="text-lg font-black mb-2">🔒</div>
            <div className="text-sm font-light">Modifier mot de passe</div>
          </button>
          <button
            onClick={() => setShowCreateAdminForm(!showCreateAdminForm)}
            className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors text-left"
          >
            <div className="text-lg font-black mb-2">➕</div>
            <div className="text-sm font-light">Créer un admin</div>
          </button>
        </div>

        {showPasswordForm && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl mb-6">
            <h2 className="text-xl font-black mb-4">Modifier mon mot de passe</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
                >
                  Mettre à jour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setNewPassword('');
                  }}
                  className="px-6 py-3 bg-white/10 text-white font-black hover:bg-white/20 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {showCreateAdminForm && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl mb-6">
            <h2 className="text-xl font-black mb-4">Créer un nouvel administrateur</h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <input
                type="text"
                value={adminData.name}
                onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                placeholder="Nom complet"
                className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                placeholder="Email"
                className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                placeholder="Mot de passe"
                className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
                >
                  Créer admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAdminForm(false);
                    setAdminData({ email: '', name: '', password: '' });
                  }}
                  className="px-6 py-3 bg-white/10 text-white font-black hover:bg-white/20 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
          <h2 className="text-2xl font-black mb-6">Réservations à confirmer</h2>
          {bookings.length === 0 ? (
            <p className="text-white/60 text-center py-8">Aucune réservation pour le moment</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-black/50 border border-white/10 p-6 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="font-black text-xl mb-2">
                        {new Date(booking.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-lg text-white/80 mb-1">⏰ {booking.time_slot}</div>
                      <div className="text-white/60 text-sm mb-2">💰 {booking.amount.toLocaleString()} FCFA</div>
                      <div className="text-white/60 text-sm mb-3">💳 {booking.payment_method}</div>
                      
                      {booking.user && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="text-sm text-white/40 mb-1">Réservé par:</div>
                          <div className="text-white font-black">{booking.user.name}</div>
                          <div className="text-white/60 text-sm">{booking.user.email}</div>
                          {booking.user.phone && (
                            <div className="text-white/60 text-sm">{booking.user.phone}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-black ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : booking.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}
                      >
                        {booking.status === 'confirmed' ? 'CONFIRMÉ' : booking.status === 'cancelled' ? 'ANNULÉ' : 'EN ATTENTE'}
                      </span>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmBooking(booking.id, 'confirmed')}
                            disabled={updatingBooking === booking.id}
                            className="px-4 py-2 bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
                          >
                            {updatingBooking === booking.id ? '...' : 'CONFIRMER'}
                          </button>
                          <button
                            onClick={() => handleConfirmBooking(booking.id, 'cancelled')}
                            disabled={updatingBooking === booking.id}
                            className="px-4 py-2 bg-red-500/20 text-red-300 text-xs font-black border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            ANNULER
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

