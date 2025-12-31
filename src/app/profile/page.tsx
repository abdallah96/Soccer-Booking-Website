'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { trackPageView } from '@/lib/utils/analytics';
import toast from 'react-hot-toast';
import { User } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
  });

  useEffect(() => {
    trackPageView('profile');
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });

    fetchBookingStats();
  }, [user, router]);

  const fetchBookingStats = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/bookings?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const bookings = data.bookings || [];
        
        setBookingStats({
          total: bookings.length,
          confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
          pending: bookings.filter((b: any) => b.status === 'pending').length,
          cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch booking stats:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission when in editing mode
    if (!isEditing) {
      return;
    }
    
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        // Update user in store
        const updatedUser: User = {
          ...user,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        };
        setUser(updatedUser);
        setIsEditing(false);
        toast.success('Profil mis à jour avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black py-16 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">
            MON PROFIL
          </h1>
          <p className="text-xl text-white/60 font-light">
            Gérez vos informations personnelles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📅</div>
            <div className="text-3xl font-black text-white mb-2">
              {bookingStats.total}
            </div>
            <div className="text-white/60 font-light text-sm">Total réservations</div>
          </div>
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-3xl font-black text-emerald-400 mb-2">
              {bookingStats.confirmed}
            </div>
            <div className="text-white/60 font-light text-sm">Confirmées</div>
          </div>
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <div className="text-3xl font-black text-yellow-400 mb-2">
              {bookingStats.pending}
            </div>
            <div className="text-white/60 font-light text-sm">En attente</div>
          </div>
        </div>

        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSave} onKeyDown={(e) => {
            // Prevent form submission when pressing Enter if not in editing mode
            if (!isEditing && e.key === 'Enter') {
              e.preventDefault();
            }
          }}>
            <div className="space-y-6">
              <div>
                <label className="block text-white/60 text-sm font-light mb-2">
                  Nom complet
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                ) : (
                  <p className="text-white font-semibold text-lg">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-white/60 text-sm font-light mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                ) : (
                  <p className="text-white font-semibold text-lg">{user.email}</p>
                )}
              </div>

              <div>
                <label className="block text-white/60 text-sm font-light mb-2">
                  Téléphone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="+221 XX XXX XX XX"
                  />
                ) : (
                  <p className="text-white font-semibold text-lg">
                    {user.phone || 'Non renseigné'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white/60 text-sm font-light mb-2">
                  Date d'inscription
                </label>
                <p className="text-white/60 font-light">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                {isEditing ? (
                  <>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-emerald-500 text-black font-black rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-white/10 text-white border border-white/20 font-bold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="flex-1 px-6 py-3 bg-emerald-500 text-black font-black rounded-lg hover:bg-emerald-400 transition-colors"
                  >
                    Modifier le profil
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

