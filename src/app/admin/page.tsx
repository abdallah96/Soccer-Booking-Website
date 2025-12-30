'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Field } from '@/types';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'fields'>('bookings');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [adminData, setAdminData] = useState({ email: '', name: '', password: '' });
  const [fieldData, setFieldData] = useState({
    name: '',
    description: '',
    location: '',
    price_per_hour: '',
    capacity: '',
    rating: '',
    facilities: [] as string[],
    images: [] as string[],
  });
  const [newFacility, setNewFacility] = useState('');
  const [newImage, setNewImage] = useState('');
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);
  const [deletingField, setDeletingField] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

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
    fetchFields();
    fetchStats();
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

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/admin/fields');
      if (response.ok) {
        const data = await response.json();
        setFields(data.fields || []);
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
        fetchStats();
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingBooking(null);
    }
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingField(true);

    try {
      const payload = {
        name: fieldData.name,
        description: fieldData.description,
        location: fieldData.location,
        price_per_hour: Number(fieldData.price_per_hour),
        capacity: Number(fieldData.capacity),
        rating: fieldData.rating ? Number(fieldData.rating) : 0,
        facilities: fieldData.facilities,
        images: fieldData.images,
      };

      const url = editingField 
        ? `/api/admin/fields/${editingField.id}`
        : '/api/admin/fields';
      const method = editingField ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(editingField ? 'Terrain mis à jour' : 'Terrain créé avec succès');
        setShowFieldForm(false);
        setEditingField(null);
        resetFieldForm();
        fetchFields();
        fetchStats();
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingField(false);
    }
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setFieldData({
      name: field.name,
      description: field.description,
      location: field.location,
      price_per_hour: field.price_per_hour.toString(),
      capacity: field.capacity.toString(),
      rating: field.rating.toString(),
      facilities: field.facilities || [],
      images: field.images || [],
    });
    setShowFieldForm(true);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce terrain ?')) {
      return;
    }

    setDeletingField(fieldId);
    try {
      const response = await fetch(`/api/admin/fields/${fieldId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Terrain supprimé avec succès');
        fetchFields();
        fetchStats();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingField(null);
    }
  };

  const resetFieldForm = () => {
    setFieldData({
      name: '',
      description: '',
      location: '',
      price_per_hour: '',
      capacity: '',
      rating: '',
      facilities: [],
      images: [],
    });
    setNewFacility('');
    setNewImage('');
  };

  const addFacility = () => {
    if (newFacility.trim()) {
      setFieldData({
        ...fieldData,
        facilities: [...fieldData.facilities, newFacility.trim()],
      });
      setNewFacility('');
    }
  };

  const removeFacility = (index: number) => {
    setFieldData({
      ...fieldData,
      facilities: fieldData.facilities.filter((_, i) => i !== index),
    });
  };

  const addImage = () => {
    if (newImage.trim()) {
      setFieldData({
        ...fieldData,
        images: [...fieldData.images, newImage.trim()],
      });
      setNewImage('');
    }
  };

  const removeImage = (index: number) => {
    setFieldData({
      ...fieldData,
      images: fieldData.images.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="min-h-screen bg-black py-12 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto text-white">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2">PANEL ADMIN</h1>
          <p className="text-white/60 font-light">Gestion des réservations, terrains et administrateurs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-black transition-colors ${
              activeTab === 'bookings'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            RÉSERVATIONS
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-6 py-3 font-black transition-colors ${
              activeTab === 'fields'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            TERRAINS
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-emerald-400 mb-2">
                {stats.stats?.total_bookings || 0}
              </div>
              <div className="text-sm text-white/60 font-light">Total Réservations</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-yellow-400 mb-2">
                {stats.stats?.pending_bookings || 0}
              </div>
              <div className="text-sm text-white/60 font-light">En Attente</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-emerald-400 mb-2">
                {stats.stats?.confirmed_bookings || 0}
              </div>
              <div className="text-sm text-white/60 font-light">Confirmées</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-2xl font-black text-emerald-400 mb-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                }).format(stats.stats?.total_revenue || 0)}
              </div>
              <div className="text-sm text-white/60 font-light">Revenus Total</div>
            </div>
          </div>
        )}

        {/* Additional Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-2xl font-black text-emerald-400 mb-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                }).format(stats.stats?.revenue_last_30_days || 0)}
              </div>
              <div className="text-sm text-white/60 font-light">Revenus (30 derniers jours)</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-emerald-400 mb-2">
                {stats.stats?.total_fields || 0}
              </div>
              <div className="text-sm text-white/60 font-light">Terrains Disponibles</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-red-400 mb-2">
                {stats.stats?.cancelled_bookings || 0}
              </div>
              <div className="text-sm text-white/60 font-light">Annulées</div>
            </div>
          </div>
        )}

        {/* Popular Fields */}
        {stats?.popular_fields && stats.popular_fields.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-4">Terrains Populaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.popular_fields.map((field: any, index: number) => (
                <div
                  key={field.field_id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-emerald-400">#{index + 1}</span>
                    <span className="text-xl font-black text-white">{field.bookings_count}</span>
                  </div>
                  <div className="text-white font-semibold">{field.name}</div>
                  <div className="text-sm text-white/60 font-light mt-1">réservations</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
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

        {/* Fields Management */}
        {activeTab === 'fields' && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-black">Gestion des Terrains</h2>
              <button
                onClick={() => {
                  resetFieldForm();
                  setEditingField(null);
                  setShowFieldForm(true);
                }}
                className="px-6 py-3 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
              >
                + AJOUTER UN TERRAIN
              </button>
            </div>

            {showFieldForm && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl mb-6">
                <h2 className="text-xl font-black mb-4">
                  {editingField ? 'Modifier le terrain' : 'Créer un nouveau terrain'}
                </h2>
                <form onSubmit={handleSaveField} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Nom du terrain *</label>
                      <input
                        type="text"
                        value={fieldData.name}
                        onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Localisation *</label>
                      <input
                        type="text"
                        value={fieldData.location}
                        onChange={(e) => setFieldData({ ...fieldData, location: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Description *</label>
                    <textarea
                      value={fieldData.description}
                      onChange={(e) => setFieldData({ ...fieldData, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Prix jour (8h-18h) FCFA/h *</label>
                      <input
                        type="number"
                        value={fieldData.price_per_hour}
                        onChange={(e) => setFieldData({ ...fieldData, price_per_hour: e.target.value })}
                        required
                        min="0"
                        className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        Prix nuit (19h-2h): {fieldData.price_per_hour ? Math.round(Number(fieldData.price_per_hour) * 1.25).toLocaleString() : '---'} FCFA/h (automatique)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Capacité (joueurs) *</label>
                      <input
                        type="number"
                        value={fieldData.capacity}
                        onChange={(e) => setFieldData({ ...fieldData, capacity: e.target.value })}
                        required
                        min="1"
                        className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Note (0-5)</label>
                      <input
                        type="number"
                        value={fieldData.rating}
                        onChange={(e) => setFieldData({ ...fieldData, rating: e.target.value })}
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-4 py-3 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Équipements</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                        placeholder="Ajouter un équipement"
                        className="flex-1 px-4 py-2 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={addFacility}
                        className="px-4 py-2 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fieldData.facilities.map((facility, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm flex items-center gap-2"
                        >
                          {facility}
                          <button
                            type="button"
                            onClick={() => removeFacility(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Images (URLs)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-2 bg-black/50 border-2 border-white/20 text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={addImage}
                        className="px-4 py-2 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fieldData.images.map((image, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm flex items-center gap-2"
                        >
                          Image {index + 1}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={savingField}
                      className="px-6 py-3 bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                      {savingField ? 'Enregistrement...' : editingField ? 'Mettre à jour' : 'Créer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFieldForm(false);
                        setEditingField(null);
                        resetFieldForm();
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
              <h2 className="text-2xl font-black mb-6">Liste des Terrains</h2>
              {fields.length === 0 ? (
                <p className="text-white/60 text-center py-8">Aucun terrain pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-black/50 border border-white/10 p-6 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-black text-xl mb-2">{field.name}</div>
                          <div className="text-white/60 text-sm mb-2">📍 {field.location}</div>
                          <div className="text-white/70 mb-3">{field.description}</div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-white/40">Prix:</span>
                              <span className="text-emerald-400 ml-2 font-black">{field.price_per_hour.toLocaleString()} FCFA/h</span>
                            </div>
                            <div>
                              <span className="text-white/40">Capacité:</span>
                              <span className="text-white ml-2 font-black">{field.capacity} joueurs</span>
                            </div>
                            <div>
                              <span className="text-white/40">Note:</span>
                              <span className="text-yellow-400 ml-2 font-black">{field.rating}★</span>
                            </div>
                            <div>
                              <span className="text-white/40">Équipements:</span>
                              <span className="text-white ml-2">{field.facilities?.length || 0}</span>
                            </div>
                          </div>
                          {field.facilities && field.facilities.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {field.facilities.map((facility, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs"
                                >
                                  {facility}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleEditField(field)}
                            className="px-4 py-2 bg-blue-500/20 text-blue-300 text-xs font-black border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                          >
                            MODIFIER
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            disabled={deletingField === field.id}
                            className="px-4 py-2 bg-red-500/20 text-red-300 text-xs font-black border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {deletingField === field.id ? '...' : 'SUPPRIMER'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Bookings Management */}
        {activeTab === 'bookings' && (
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
        )}
      </div>
    </div>
  );
}

