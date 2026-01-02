'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Field } from '@/types';
import toast from 'react-hot-toast';

type ActiveSection = 'dashboard' | 'bookings' | 'availability' | 'fields' | 'settings';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);
  const [deletingField, setDeletingField] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  
  // Availability blocking state
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockFullDay, setBlockFullDay] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  
  // Week availability state
  const [weekAvailability, setWeekAvailability] = useState<any[]>([]);
  const [updatingWeek, setUpdatingWeek] = useState<string | null>(null);
  const [showBlockForm, setShowBlockForm] = useState(false);

  // Manual booking state
  const [manualBooking, setManualBooking] = useState({
    user_name: '',
    user_email: '',
    user_phone: '',
    date: '',
    start_time: '',
    duration: 60 as 60 | 90,
    payment_method: 'cash' as 'wave' | 'orange_money' | 'cash',
  });
  const [creatingBooking, setCreatingBooking] = useState(false);

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
    fetchBlockedSlots();
  }, [user, router]);

  useEffect(() => {
    if (fields.length > 0) {
      fetchWeekAvailability();
    }
  }, [fields]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings', {
        credentials: 'include',
      });
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
      const response = await fetch('/api/admin/fields', {
        credentials: 'include',
      });
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
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchBlockedSlots = async () => {
    try {
      const response = await fetch('/api/admin/blocked-slots', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedSlots(data.blockedSlots || []);
      }
    } catch (error) {
      console.error('Failed to fetch blocked slots:', error);
    }
  };

  const fetchWeekAvailability = async () => {
    if (!fields || fields.length === 0) return;
    try {
      const response = await fetch(`/api/admin/week-availability?field_id=${fields[0].id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWeekAvailability(data.weeks || []);
      }
    } catch (error) {
      console.error('Failed to fetch week availability:', error);
    }
  };

  const handleToggleWeek = async (weekStartDate: string, isOpen: boolean) => {
    if (!fields[0]?.id) return;
    
    setUpdatingWeek(weekStartDate);
    try {
      const response = await fetch('/api/admin/week-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          field_id: fields[0].id,
          week_start_date: weekStartDate,
          is_open: !isOpen,
        }),
      });

      if (response.ok) {
        toast.success(isOpen ? 'Semaine fermée' : 'Semaine ouverte');
        fetchWeekAvailability();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingWeek(null);
    }
  };

  const generateWeeks = () => {
    const weeks: { weekStart: Date; weekEnd: Date; weekStartStr: string }[] = [];
    const today = new Date();
    
    const getMonday = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };
    
    const currentMonday = getMonday(today);
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(currentMonday.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        weekStart,
        weekEnd,
        weekStartStr: weekStart.toISOString().split('T')[0],
      });
    }
    
    return weeks;
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
        credentials: 'include',
        body: JSON.stringify({ password: newPassword, user_id: user?.id }),
      });

      if (response.ok) {
        toast.success('Mot de passe mis à jour');
        setNewPassword('');
        setShowPasswordForm(false);
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminData.email || !adminData.name || !adminData.password) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: adminData.email,
          name: adminData.name,
          password: adminData.password,
          role: 'admin',
        }),
      });

      if (response.ok) {
        toast.success('Admin créé avec succès');
        setAdminData({ email: '', name: '', password: '' });
        setShowCreateAdminForm(false);
      } else {
        toast.error('Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleConfirmBooking = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingBooking(bookingId);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(status === 'confirmed' ? 'Réservation confirmée' : 'Réservation annulée');
        fetchBookings();
        fetchStats();
      } else {
        toast.error('Erreur lors de la mise à jour');
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
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingField ? 'Terrain mis à jour' : 'Terrain créé');
        setShowFieldForm(false);
        setEditingField(null);
        resetFieldForm();
        fetchFields();
        fetchStats();
      } else {
        toast.error('Erreur lors de la sauvegarde');
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce terrain ?')) return;

    setDeletingField(fieldId);
    try {
      const response = await fetch(`/api/admin/fields/${fieldId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Terrain supprimé');
        fetchFields();
        fetchStats();
      } else {
        toast.error('Erreur lors de la suppression');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non autorisé');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5MB)');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setFieldData({
          ...fieldData,
          images: [...fieldData.images, result.url],
        });
        toast.success('Image uploadée');
      } else {
        toast.error('Erreur lors de l\'upload');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFieldData({
      ...fieldData,
      images: fieldData.images.filter((_, i) => i !== index),
    });
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    if (!blockFullDay && (!blockStartTime || !blockEndTime)) {
      toast.error('Veuillez sélectionner les heures');
      return;
    }

    setSavingBlock(true);
    try {
      const response = await fetch('/api/admin/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: blockDate,
          start_time: blockFullDay ? '08:00' : blockStartTime,
          end_time: blockFullDay ? '02:00' : blockEndTime,
          full_day: blockFullDay,
          reason: blockReason,
          field_id: fields[0]?.id,
        }),
      });

      if (response.ok) {
        toast.success('Créneau bloqué');
        setBlockDate('');
        setBlockStartTime('');
        setBlockEndTime('');
        setBlockReason('');
        setBlockFullDay(false);
        setShowBlockForm(false);
        fetchBlockedSlots();
      } else {
        toast.error('Erreur lors du blocage');
      }
    } catch (error) {
      toast.error('Erreur lors du blocage');
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const response = await fetch(`/api/admin/blocked-slots/${blockId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Blocage supprimé');
        fetchBlockedSlots();
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualBooking.user_name || !manualBooking.user_email || !manualBooking.date || !manualBooking.start_time) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!fields[0]?.id) {
      toast.error('Aucun terrain disponible');
      return;
    }

    setCreatingBooking(true);
    try {
      let userId;
      const findUserResponse = await fetch(`/api/users?email=${encodeURIComponent(manualBooking.user_email)}`, {
        credentials: 'include',
      });
      
      if (findUserResponse.ok) {
        const userData = await findUserResponse.json();
        userId = userData.user?.id;
      }

      if (!userId) {
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        const userResponse = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: manualBooking.user_email,
            name: manualBooking.user_name,
            password: tempPassword,
            role: 'user',
          }),
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.user.id;
        } else {
          throw new Error('Impossible de créer l\'utilisateur');
        }
      }

      const bookingResponse = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          field_id: fields[0].id,
          date: manualBooking.date,
          start_time: manualBooking.start_time,
          duration: manualBooking.duration,
          payment_method: manualBooking.payment_method,
          status: 'confirmed',
        }),
      });

      if (bookingResponse.ok) {
        toast.success('Réservation créée');
        setManualBooking({
          user_name: '',
          user_email: '',
          user_phone: '',
          date: '',
          start_time: '',
          duration: 60,
          payment_method: 'cash',
        });
        setShowManualBooking(false);
        fetchBookings();
      } else {
        toast.error('Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setCreatingBooking(false);
    }
  };

  const getMinDate = () => new Date().toISOString().split('T')[0];
  const getMaxDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Header - Fixed */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-white">ADMIN</h1>
              <p className="text-xs text-white/50">Bienvenue, {user?.name}</p>
        </div>

            {/* Quick stats on mobile */}
            {pendingCount > 0 && (
          <button
                onClick={() => setActiveSection('bookings')}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg"
              >
                <span className="text-yellow-400 font-black text-lg">{pendingCount}</span>
                <span className="text-yellow-300 text-xs">en attente</span>
          </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex overflow-x-auto no-scrollbar border-t border-white/5">
          {[
            { id: 'dashboard', label: '🏠', fullLabel: 'Accueil' },
            { id: 'bookings', label: '📅', fullLabel: 'Réservations', badge: pendingCount },
            { id: 'availability', label: '📆', fullLabel: 'Disponibilités' },
            { id: 'fields', label: '⚽', fullLabel: 'Terrain' },
            { id: 'settings', label: '⚙️', fullLabel: 'Paramètres' },
          ].map((item) => (
          <button
              key={item.id}
              onClick={() => setActiveSection(item.id as ActiveSection)}
              className={`flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 transition-colors relative ${
                activeSection === item.id
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-white/60'
              }`}
            >
              <span className="text-lg">{item.label}</span>
              <span className="text-[10px] mt-1">{item.fullLabel}</span>
              {item.badge ? (
                <span className="absolute top-1 right-2 w-5 h-5 bg-yellow-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
          </button>
          ))}
        </div>
        </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-24 max-w-4xl mx-auto">
        
        {/* DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveSection('bookings')}
                className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-4 rounded-2xl text-left"
              >
                <div className="text-3xl font-black text-yellow-400 mb-1">
                  {pendingCount}
              </div>
                <div className="text-sm text-yellow-300/80">À confirmer</div>
              </button>
              
              <button
                onClick={() => setShowManualBooking(true)}
                className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 p-4 rounded-2xl text-left"
              >
                <div className="text-2xl mb-1">📞</div>
                <div className="text-sm text-red-300/80">Nouvelle résa</div>
              </button>
              
              <button
                onClick={() => setActiveSection('availability')}
                className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-4 rounded-2xl text-left"
              >
                <div className="text-2xl mb-1">📆</div>
                <div className="text-sm text-green-300/80">Semaines</div>
              </button>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 p-4 rounded-2xl text-left"
              >
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm text-blue-300/80">Statistiques</div>
              </button>
            </div>

            {/* Expandable Stats */}
            {showStats && stats && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Total réservations</span>
                  <span className="text-white font-black">{stats.stats?.total_bookings || 0}</span>
              </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Confirmées</span>
                  <span className="text-green-400 font-black">{stats.stats?.confirmed_bookings || 0}</span>
            </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Revenus total</span>
                  <span className="text-red-400 font-black">
                    {new Intl.NumberFormat('fr-FR').format(stats.stats?.total_revenue || 0)} FCFA
                  </span>
              </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">30 derniers jours</span>
                  <span className="text-red-400 font-black">
                    {new Intl.NumberFormat('fr-FR').format(stats.stats?.revenue_last_30_days || 0)} FCFA
                  </span>
            </div>
              </div>
            )}

            {/* Recent Pending Bookings */}
            {pendingCount > 0 && (
              <div className="space-y-3">
                <h3 className="text-white font-black">Réservations en attente</h3>
                {bookings
                  .filter(b => b.status === 'pending')
                  .slice(0, 3)
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-white font-black">
                            {new Date(booking.date).toLocaleDateString('fr-FR', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
            </div>
                          <div className="text-yellow-300 text-sm">⏰ {booking.time_slot}</div>
                          <div className="text-white/60 text-xs mt-1">{booking.user?.name || 'N/A'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 font-black">{booking.amount?.toLocaleString()} FCFA</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmBooking(booking.id, 'confirmed')}
                          disabled={updatingBooking === booking.id}
                          className="flex-1 py-2 bg-green-600 text-white text-sm font-black rounded-lg disabled:opacity-50"
                        >
                          ✓ Confirmer
                        </button>
                        <button
                          onClick={() => handleConfirmBooking(booking.id, 'cancelled')}
                          disabled={updatingBooking === booking.id}
                          className="px-4 py-2 bg-red-500/20 text-red-400 text-sm font-black rounded-lg border border-red-500/30"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                {pendingCount > 3 && (
                  <button
                    onClick={() => setActiveSection('bookings')}
                    className="w-full py-3 bg-white/5 text-white/60 text-sm rounded-xl border border-white/10"
                  >
                    Voir les {pendingCount - 3} autres →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {activeSection === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">Réservations</h2>
              <button
                onClick={() => setShowManualBooking(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-black rounded-lg"
              >
                + Nouvelle
              </button>
              </div>

            {bookings.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                Aucune réservation
            </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`rounded-xl p-4 border ${
                      booking.status === 'pending'
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : booking.status === 'confirmed'
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-gray-500/10 border-gray-500/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-white font-black">
                          {new Date(booking.date).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
              </div>
                        <div className="text-white/80 text-sm">⏰ {booking.time_slot}</div>
                        <div className="text-white/50 text-xs mt-2">
                          👤 {booking.user?.name || 'N/A'} · {booking.user?.email || ''}
            </div>
              </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-black rounded ${
                          booking.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : booking.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {booking.status === 'pending' ? 'EN ATTENTE' : 
                           booking.status === 'confirmed' ? 'CONFIRMÉ' : 'ANNULÉ'}
                        </span>
                        <div className="text-white font-black mt-2">{booking.amount?.toLocaleString()} FCFA</div>
            </div>
                    </div>
                    
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => handleConfirmBooking(booking.id, 'confirmed')}
                          disabled={updatingBooking === booking.id}
                          className="flex-1 py-2 bg-green-600 text-white text-sm font-black rounded-lg disabled:opacity-50"
                        >
                          ✓ Confirmer
                        </button>
                        <button
                          onClick={() => handleConfirmBooking(booking.id, 'cancelled')}
                          disabled={updatingBooking === booking.id}
                          className="flex-1 py-2 bg-red-500/20 text-red-400 text-sm font-black rounded-lg border border-red-500/30"
                        >
                          ✕ Annuler
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AVAILABILITY */}
        {activeSection === 'availability' && (
          <div className="space-y-6">
            {/* Week Management */}
            <div>
              <h2 className="text-xl font-black text-white mb-4">Semaines ouvertes</h2>
              <p className="text-white/50 text-sm mb-4">
                Activez les semaines pour permettre les réservations
              </p>
              
              <div className="space-y-2">
                {generateWeeks().slice(0, 6).map((week) => {
                  const weekData = weekAvailability.find(w => w.week_start_date === week.weekStartStr);
                  const isOpen = weekData?.is_open !== false;
                  const isUpdating = updatingWeek === week.weekStartStr;

                  return (
                    <div
                      key={week.weekStartStr}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isOpen ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div>
                        <div className="text-white font-black text-sm">
                          {week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                        <div className="text-white/40 text-xs">
                          {week.weekStart.toLocaleDateString('fr-FR', { weekday: 'long' }).charAt(0).toUpperCase() + week.weekStart.toLocaleDateString('fr-FR', { weekday: 'long' }).slice(1)}
                </div>
                      </div>
                      <button
                        onClick={() => handleToggleWeek(week.weekStartStr, isOpen)}
                        disabled={isUpdating}
                        className={`px-4 py-2 rounded-lg font-black text-sm transition-all ${
                          isOpen
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        } disabled:opacity-50`}
                      >
                        {isUpdating ? '...' : isOpen ? 'OUVERT' : 'FERMÉ'}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={() => {
                  const el = document.getElementById('all-weeks');
                  if (el) el.classList.toggle('hidden');
                }}
                className="w-full mt-3 py-2 text-white/50 text-sm"
              >
                Voir plus de semaines ↓
              </button>
              
              <div id="all-weeks" className="hidden space-y-2 mt-2">
                {generateWeeks().slice(6).map((week) => {
                  const weekData = weekAvailability.find(w => w.week_start_date === week.weekStartStr);
                  const isOpen = weekData?.is_open !== false;
                  const isUpdating = updatingWeek === week.weekStartStr;

                  return (
                    <div
                      key={week.weekStartStr}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isOpen ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div>
                        <div className="text-white font-black text-sm">
                          {week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleWeek(week.weekStartStr, isOpen)}
                        disabled={isUpdating}
                        className={`px-4 py-2 rounded-lg font-black text-sm ${
                          isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        } disabled:opacity-50`}
                      >
                        {isUpdating ? '...' : isOpen ? 'OUVERT' : 'FERMÉ'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Block Specific Slots */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-white">Bloquer créneaux</h2>
                  <p className="text-white/50 text-sm">Bloquer des heures spécifiques</p>
                </div>
                <button
                  onClick={() => setShowBlockForm(!showBlockForm)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-black rounded-lg"
                >
                  + Bloquer
                </button>
              </div>

              {showBlockForm && (
                <form onSubmit={handleBlockSlot} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-4">
                  <div>
                    <label className="text-white/60 text-sm">Date</label>
                    <input
                      type="date"
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={blockFullDay}
                      onChange={(e) => setBlockFullDay(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-white">Toute la journée</span>
                  </label>

                  {!blockFullDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-sm">Début</label>
                        <select
                          value={blockStartTime}
                          onChange={(e) => setBlockStartTime(e.target.value)}
                          className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                        >
                          <option value="">--</option>
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">Fin</label>
                        <select
                          value={blockEndTime}
                          onChange={(e) => setBlockEndTime(e.target.value)}
                          className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                        >
                          <option value="">--</option>
                          {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
            </div>
          </div>
        )}

                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Raison (optionnel)"
                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  />

                  <div className="flex gap-2">
          <button
                      type="submit"
                      disabled={savingBlock}
                      className="flex-1 py-3 bg-red-600 text-white font-black rounded-lg disabled:opacity-50"
          >
                      {savingBlock ? '...' : 'Bloquer'}
          </button>
          <button
                      type="button"
                      onClick={() => setShowBlockForm(false)}
                      className="px-6 py-3 bg-white/10 text-white rounded-lg"
          >
                      Annuler
          </button>
        </div>
                </form>
              )}

              {blockedSlots.length > 0 && (
                <div className="space-y-2">
                  {blockedSlots.map((slot: any) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      <div>
                        <div className="text-white font-black text-sm">
                          {new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-red-300/60 text-xs">
                          {slot.full_day ? 'Toute la journée' : `${slot.start_time} - ${slot.end_time}`}
                          {slot.reason && ` · ${slot.reason}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(slot.id)}
                        className="text-red-400 text-lg px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FIELDS */}
        {activeSection === 'fields' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">Terrain</h2>
              {fields.length === 0 && (
                <button
                  onClick={() => {
                    resetFieldForm();
                    setEditingField(null);
                    setShowFieldForm(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-black rounded-lg"
                >
                  + Ajouter
                </button>
              )}
            </div>

            {fields.map((field) => (
              <div
                key={field.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-black text-lg">{field.name}</h3>
                    <p className="text-white/50 text-sm">📍 {field.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditField(field)}
                      className="px-3 py-1 bg-white/10 text-white text-xs rounded"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      disabled={deletingField === field.id}
                      className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded"
                    >
                      {deletingField === field.id ? '...' : '✕'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-red-400 font-black">{field.price_per_hour.toLocaleString()}</div>
                    <div className="text-white/40 text-xs">FCFA/h</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-white font-black">{field.capacity}</div>
                    <div className="text-white/40 text-xs">joueurs</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-yellow-400 font-black">{field.rating}★</div>
                    <div className="text-white/40 text-xs">note</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white mb-4">Paramètres</h2>
            
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="text-white font-black">Mot de passe</div>
                  <div className="text-white/50 text-sm">Modifier mon mot de passe</div>
                </div>
              </div>
            </button>

        {showPasswordForm && (
              <form onSubmit={handleUpdatePassword} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
              />
                <div className="flex gap-2">
                <button
                  type="submit"
                    className="flex-1 py-3 bg-red-600 text-white font-black rounded-lg"
                >
                  Mettre à jour
                </button>
                <button
                  type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </form>
            )}

            <button
              onClick={() => setShowCreateAdminForm(!showCreateAdminForm)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="text-white font-black">Créer un admin</div>
                  <div className="text-white/50 text-sm">Ajouter un nouvel administrateur</div>
                </div>
              </div>
            </button>

        {showCreateAdminForm && (
              <form onSubmit={handleCreateAdmin} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={adminData.name}
                onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                placeholder="Nom complet"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
              />
              <input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                placeholder="Email"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
              />
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                placeholder="Mot de passe"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
              />
                <div className="flex gap-2">
                <button
                  type="submit"
                    className="flex-1 py-3 bg-red-600 text-white font-black rounded-lg"
                >
                    Créer
                </button>
                <button
                  type="button"
                    onClick={() => setShowCreateAdminForm(false)}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </form>
            )}
          </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Nouvelle réservation</h2>
              <button
                onClick={() => setShowManualBooking(false)}
                className="text-white/50 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateManualBooking} className="p-4 space-y-4">
              <div>
                <label className="text-white/60 text-sm">Nom du client *</label>
                <input
                  type="text"
                  value={manualBooking.user_name}
                  onChange={(e) => setManualBooking({ ...manualBooking, user_name: e.target.value })}
                  required
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="text-white/60 text-sm">Email *</label>
                <input
                  type="email"
                  value={manualBooking.user_email}
                  onChange={(e) => setManualBooking({ ...manualBooking, user_email: e.target.value })}
                  required
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="text-white/60 text-sm">Téléphone</label>
                <input
                  type="tel"
                  value={manualBooking.user_phone}
                  onChange={(e) => setManualBooking({ ...manualBooking, user_phone: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-sm">Date *</label>
                  <input
                    type="date"
                    value={manualBooking.date}
                    onChange={(e) => setManualBooking({ ...manualBooking, date: e.target.value })}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                    className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm">Heure *</label>
                  <select
                    value={manualBooking.start_time}
                    onChange={(e) => setManualBooking({ ...manualBooking, start_time: e.target.value })}
                    required
                    className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  >
                    <option value="">--</option>
                    {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-white/60 text-sm">Durée</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { value: 60, label: '1 Heure' },
                    { value: 90, label: '1h30' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setManualBooking({ ...manualBooking, duration: opt.value as 60 | 90 })}
                      className={`py-3 rounded-lg text-sm font-black ${
                        manualBooking.duration === opt.value
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-white/60 text-sm">Paiement</label>
                <select
                  value={manualBooking.payment_method}
                  onChange={(e) => setManualBooking({ ...manualBooking, payment_method: e.target.value as 'wave' | 'orange_money' | 'cash' })}
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                >
                  <option value="cash">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={creatingBooking}
                className="w-full py-4 bg-red-600 text-white font-black rounded-xl disabled:opacity-50"
              >
                {creatingBooking ? 'Création...' : 'Créer la réservation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Field Form Modal */}
      {showFieldForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">
                {editingField ? 'Modifier terrain' : 'Nouveau terrain'}
              </h2>
              <button
                onClick={() => {
                  setShowFieldForm(false);
                  setEditingField(null);
                  resetFieldForm();
                }}
                className="text-white/50 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveField} className="p-4 space-y-4">
                    <div>
                <label className="text-white/60 text-sm">Nom *</label>
                      <input
                        type="text"
                        value={fieldData.name}
                        onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
                        required
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                      />
                    </div>
              
                    <div>
                <label className="text-white/60 text-sm">Localisation *</label>
                      <input
                        type="text"
                        value={fieldData.location}
                        onChange={(e) => setFieldData({ ...fieldData, location: e.target.value })}
                        required
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                      />
                  </div>

                  <div>
                <label className="text-white/60 text-sm">Description *</label>
                    <textarea
                      value={fieldData.description}
                      onChange={(e) => setFieldData({ ...fieldData, description: e.target.value })}
                      required
                  rows={3}
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                    />
                  </div>

              <div className="grid grid-cols-3 gap-3">
                    <div>
                  <label className="text-white/60 text-sm">Prix/h *</label>
                      <input
                        type="number"
                        value={fieldData.price_per_hour}
                        onChange={(e) => setFieldData({ ...fieldData, price_per_hour: e.target.value })}
                        required
                    className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                    <div>
                  <label className="text-white/60 text-sm">Capacité *</label>
                      <input
                        type="number"
                        value={fieldData.capacity}
                        onChange={(e) => setFieldData({ ...fieldData, capacity: e.target.value })}
                        required
                    className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                    <div>
                  <label className="text-white/60 text-sm">Note</label>
                      <input
                        type="number"
                        value={fieldData.rating}
                        onChange={(e) => setFieldData({ ...fieldData, rating: e.target.value })}
                        min="0"
                        max="5"
                        step="0.1"
                    className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                <label className="text-white/60 text-sm">Équipements</label>
                <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                    placeholder="Ajouter..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                      />
                      <button
                        type="button"
                        onClick={addFacility}
                    className="px-4 bg-red-600 text-white rounded-lg"
                      >
                        +
                      </button>
                    </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {fieldData.facilities.map((f, i) => (
                    <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 text-sm rounded flex items-center gap-1">
                      {f}
                      <button type="button" onClick={() => removeFacility(i)} className="text-red-400">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                <label className="text-white/60 text-sm">Images</label>
                <div className="mt-1">
                  <label className="block w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white/50 text-center cursor-pointer">
                          <input
                            type="file"
                      accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                    {uploadingImage ? 'Upload...' : '📁 Choisir une image'}
                        </label>
                      </div>
                    {fieldData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {fieldData.images.map((img, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-500/20 text-gray-300 text-sm rounded flex items-center gap-1">
                        Image {i + 1}
                        <button type="button" onClick={() => removeImage(i)} className="text-red-400">✕</button>
                              </span>
                          ))}
                      </div>
                    )}
                  </div>

                    <button
                      type="submit"
                      disabled={savingField}
                className="w-full py-4 bg-red-600 text-white font-black rounded-xl disabled:opacity-50"
                    >
                      {savingField ? 'Enregistrement...' : editingField ? 'Mettre à jour' : 'Créer'}
                    </button>
                </form>
              </div>
                            </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
