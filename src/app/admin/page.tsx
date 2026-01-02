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
  const [activeTab, setActiveTab] = useState<'bookings' | 'fields' | 'availability' | 'create-booking' | 'weeks'>('bookings');
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);
  const [deletingField, setDeletingField] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
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

  // Manual booking state (for phone reservations)
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
    fetchWeekAvailability();
  }, [user, router]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else if (response.status === 401 || response.status === 403) {
        toast.error('Accès refusé. Admin uniquement.');
        router.push('/');
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
      } else if (response.status === 401 || response.status === 403) {
        toast.error('Accès refusé. Admin uniquement.');
        router.push('/');
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
      } else if (response.status === 401 || response.status === 403) {
        toast.error('Accès refusé. Admin uniquement.');
        router.push('/');
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
    if (!fields || fields.length === 0) {
      // Wait for fields to load
      setTimeout(fetchWeekAvailability, 500);
      return;
    }
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

  // Generate list of weeks (next 12 weeks) - Monday to Sunday
  const generateWeeks = () => {
    const weeks: { weekStart: Date; weekEnd: Date; weekStartStr: string }[] = [];
    const today = new Date();
    
    // Get Monday of current week
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
        credentials: 'include',
        body: JSON.stringify({
          email: adminData.email,
          name: adminData.name,
          password: adminData.password,
          role: 'admin',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Le fichier est trop volumineux. Taille maximale: 5MB');
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
        toast.success('Image uploadée avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload du fichier');
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
      toast.error('Veuillez sélectionner les heures de début et fin');
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

      const result = await response.json();
      if (response.ok) {
        toast.success('Créneau bloqué avec succès');
        setBlockDate('');
        setBlockStartTime('');
        setBlockEndTime('');
        setBlockReason('');
        setBlockFullDay(false);
        fetchBlockedSlots();
      } else {
        toast.error(result.error || 'Erreur lors du blocage');
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
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
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
      // First, try to find existing user by email
      let userId;
      const findUserResponse = await fetch(`/api/users?email=${encodeURIComponent(manualBooking.user_email)}`, {
        credentials: 'include',
      });
      
      if (findUserResponse.ok) {
        const userData = await findUserResponse.json();
        userId = userData.user?.id;
      }

      // If user doesn't exist, create one with a temporary password
      if (!userId) {
        // Generate a random password for phone bookings
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
          
          // Update phone if provided
          if (manualBooking.user_phone) {
            // Phone update can be done later or we can add it to the user creation
          }
        } else {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || 'Impossible de créer l\'utilisateur');
        }
      }

      // Create the booking
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
          status: 'confirmed', // Auto-confirm manual bookings
        }),
      });

      const bookingData = await bookingResponse.json();
      if (bookingResponse.ok) {
        toast.success('Réservation créée avec succès');
        setManualBooking({
          user_name: '',
          user_email: '',
          user_phone: '',
          date: '',
          start_time: '',
          duration: 60,
          payment_method: 'cash',
        });
        fetchBookings();
        setActiveTab('bookings');
      } else {
        toast.error(bookingData.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création de la réservation');
    } finally {
      setCreatingBooking(false);
    }
  };

  // Get min date (today) and max date (6 months ahead for admin flexibility)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(today.getMonth() + 6);
    return sixMonthsLater.toISOString().split('T')[0];
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 md:py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto text-white">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2">PANEL ADMIN</h1>
          <p className="text-white/60 font-light">Gestion des réservations, terrains et disponibilités</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-black transition-colors whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            RÉSERVATIONS
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-6 py-3 font-black transition-colors whitespace-nowrap ${
              activeTab === 'fields'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            TERRAINS
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-6 py-3 font-black transition-colors whitespace-nowrap ${
              activeTab === 'availability'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            DISPONIBILITÉS
          </button>
          <button
            onClick={() => setActiveTab('create-booking')}
            className={`px-6 py-3 font-black transition-colors whitespace-nowrap ${
              activeTab === 'create-booking'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            CRÉER RÉSERVATION
          </button>
          <button
            onClick={() => {
              setActiveTab('weeks');
              fetchWeekAvailability();
            }}
            className={`px-6 py-3 font-black transition-colors whitespace-nowrap ${
              activeTab === 'weeks'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            SEMAINES
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-red-500 mb-2">
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
              <div className="text-3xl font-black text-green-500 mb-2">
                {stats.stats?.confirmed_bookings || 0}
              </div>
              <div className="text-sm text-white/60 font-light">Confirmées</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-2xl font-black text-red-500 mb-2">
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
              <div className="text-2xl font-black text-red-500 mb-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                }).format(stats.stats?.revenue_last_30_days || 0)}
              </div>
              <div className="text-sm text-white/60 font-light">Revenus (30 derniers jours)</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-red-500 mb-2">
                {stats.stats?.total_fields || 0}
              </div>
              <div className="text-sm text-white/60 font-light">Terrains Disponibles</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div className="text-3xl font-black text-gray-400 mb-2">
                {stats.stats?.cancelled_bookings || 0}
              </div>
              <div className="text-sm text-white/60 font-light">Annulées</div>
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
                className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
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
                className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
              />
              <input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                placeholder="Email"
                className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
              />
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                placeholder="Mot de passe"
                className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
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

        {/* Availability Management Tab */}
        {activeTab === 'availability' && (
          <>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl mb-6">
              <h2 className="text-2xl font-black mb-6">Bloquer des créneaux</h2>
              <form onSubmit={handleBlockSlot} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Date *</label>
                    <input
                      type="date"
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      min={getMinDate()}
                      max={getMaxDate()}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blockFullDay}
                        onChange={(e) => setBlockFullDay(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-white/20 bg-gray-800/50 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-white">Bloquer toute la journée</span>
                    </label>
                  </div>
                </div>

                {!blockFullDay && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Heure de début</label>
                      <select
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="">Sélectionner</option>
                        {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'].map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Heure de fin</label>
                      <select
                        value={blockEndTime}
                        onChange={(e) => setBlockEndTime(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="">Sélectionner</option>
                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'].map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-white/60 mb-2">Raison (optionnel)</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ex: Maintenance, Événement privé..."
                    className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingBlock}
                  className="px-6 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {savingBlock ? 'Enregistrement...' : 'Bloquer ce créneau'}
                </button>
              </form>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <h2 className="text-2xl font-black mb-6">Créneaux bloqués</h2>
              {blockedSlots.length === 0 ? (
                <p className="text-white/60 text-center py-8">Aucun créneau bloqué</p>
              ) : (
                <div className="space-y-4">
                  {blockedSlots.map((slot: any) => (
                    <div
                      key={slot.id}
                      className="bg-gray-800/50 border border-white/10 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <div className="font-black text-lg">
                          {new Date(slot.date).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-white/60 text-sm">
                          {slot.full_day ? 'Toute la journée' : `${slot.start_time} - ${slot.end_time}`}
                          {slot.reason && ` · ${slot.reason}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(slot.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-300 text-xs font-black border border-red-500/30 hover:bg-red-500/30 transition-colors"
                      >
                        SUPPRIMER
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
                className="px-6 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
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
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Localisation *</label>
                      <input
                        type="text"
                        value={fieldData.location}
                        onChange={(e) => setFieldData({ ...fieldData, location: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
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
                      className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
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
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
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
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
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
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
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
                        className="flex-1 px-4 py-2 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={addFacility}
                        className="px-4 py-2 bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fieldData.facilities.map((facility, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-sm flex items-center gap-2"
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
                    <label className="block text-sm text-white/60 mb-2">Images</label>
                    
                    <div className="mb-4">
                      <label className="block text-xs text-white/40 mb-2 font-mono uppercase">Upload depuis votre machine</label>
                      <div className="flex gap-2">
                        <label className="flex-1 px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white cursor-pointer hover:border-red-500 transition-colors flex items-center justify-center gap-2">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                          <span>{uploadingImage ? 'Upload en cours...' : '📁 Choisir un fichier'}</span>
                        </label>
                      </div>
                      <p className="text-xs text-white/40 mt-1 font-light">Formats acceptés: JPEG, PNG, WebP (max 5MB)</p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-white/40 mb-2 font-mono uppercase">Ou ajouter via URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newImage}
                          onChange={(e) => setNewImage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-4 py-2 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={addImage}
                          disabled={!newImage.trim()}
                          className="px-4 py-2 bg-red-600 text-white font-black hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {fieldData.images.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-xs text-white/40 mb-2 font-mono uppercase">Images ajoutées ({fieldData.images.length})</label>
                        <div className="flex flex-wrap gap-2">
                          {fieldData.images.map((image, index) => (
                            <div
                              key={index}
                              className="relative group"
                            >
                              <span className="px-3 py-1 bg-gray-500/20 text-gray-300 border border-gray-500/30 text-sm flex items-center gap-2">
                                <a
                                  href={image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline truncate max-w-[200px]"
                                  title={image}
                                >
                                  Image {index + 1}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="text-red-400 hover:text-red-300 ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={savingField}
                      className="px-6 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors disabled:opacity-50"
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
                      className="bg-gray-800/50 border border-white/10 p-6 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-black text-xl mb-2">{field.name}</div>
                          <div className="text-white/60 text-sm mb-2">📍 {field.location}</div>
                          <div className="text-white/70 mb-3">{field.description}</div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-white/40">Prix:</span>
                              <span className="text-red-500 ml-2 font-black">{field.price_per_hour.toLocaleString()} FCFA/h</span>
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
                                  className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-xs"
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
                            className="px-4 py-2 bg-gray-500/20 text-gray-300 text-xs font-black border border-gray-500/30 hover:bg-gray-500/30 transition-colors"
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
                  className="bg-gray-800/50 border border-white/10 p-6 rounded-lg"
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
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
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
                            className="px-4 py-2 bg-green-600 text-white text-xs font-black hover:bg-green-700 transition-colors disabled:opacity-50"
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

        {/* Create Manual Booking Tab */}
        {activeTab === 'create-booking' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
            <h2 className="text-2xl font-black mb-6">Créer une réservation manuelle</h2>
            <p className="text-white/60 mb-6 font-light">
              Utilisez cette fonctionnalité pour créer des réservations faites par téléphone. 
              Vous pouvez réserver jusqu'à 6 mois à l'avance.
            </p>
            
            <form onSubmit={handleCreateManualBooking} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Nom du client *</label>
                  <input
                    type="text"
                    value={manualBooking.user_name}
                    onChange={(e) => setManualBooking({ ...manualBooking, user_name: e.target.value })}
                    required
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email *</label>
                  <input
                    type="email"
                    value={manualBooking.user_email}
                    onChange={(e) => setManualBooking({ ...manualBooking, user_email: e.target.value })}
                    required
                    placeholder="jean@example.com"
                    className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={manualBooking.user_phone}
                  onChange={(e) => setManualBooking({ ...manualBooking, user_phone: e.target.value })}
                  placeholder="+221XXXXXXXXX"
                  className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Date *</label>
                  <input
                    type="date"
                    value={manualBooking.date}
                    onChange={(e) => setManualBooking({ ...manualBooking, date: e.target.value })}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Heure de début *</label>
                  <select
                    value={manualBooking.start_time}
                    onChange={(e) => setManualBooking({ ...manualBooking, start_time: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Sélectionner</option>
                    {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'].map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Durée</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 60, label: '1 Heure' },
                      { value: 90, label: '1 Heure 30' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setManualBooking({ ...manualBooking, duration: option.value as 60 | 90 })}
                        className={`px-4 py-3 border-2 text-sm font-light transition-all ${
                          manualBooking.duration === option.value
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
                  <label className="block text-sm text-white/60 mb-2">Méthode de paiement</label>
                  <select
                    value={manualBooking.payment_method}
                    onChange={(e) => setManualBooking({ ...manualBooking, payment_method: e.target.value as 'wave' | 'orange_money' | 'cash' })}
                    className="w-full px-4 py-3 bg-gray-800/50 border-2 border-white/20 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="cash">Espèces</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creatingBooking}
                  className="px-6 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {creatingBooking ? 'Création...' : 'Créer la réservation'}
                </button>
                <button
                  type="button"
                  onClick={() => setManualBooking({
                    user_name: '',
                    user_email: '',
                    user_phone: '',
                    date: '',
                    start_time: '',
                    duration: 60,
                    payment_method: 'cash',
                  })}
                  className="px-6 py-3 bg-white/10 text-white font-black hover:bg-white/20 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Week Availability Management Tab */}
        {activeTab === 'weeks' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
            <h2 className="text-2xl font-black mb-4">Gestion des Semaines</h2>
            <p className="text-white/60 mb-6 font-light">
              Activez ou désactivez les semaines pour les réservations. Seules les semaines ouvertes seront visibles pour les clients.
            </p>
            
            <div className="space-y-3">
              {generateWeeks().map((week) => {
                const weekData = weekAvailability.find(w => w.week_start_date === week.weekStartStr);
                const isOpen = weekData?.is_open !== false; // Default to open
                const isUpdating = updatingWeek === week.weekStartStr;

                return (
                  <div
                    key={week.weekStartStr}
                    className={`bg-gray-800/50 border-2 rounded-xl p-4 transition-all ${
                      isOpen ? 'border-green-500/30' : 'border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-lg text-white mb-1">
                          Semaine du {week.weekStart.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} au {week.weekEnd.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-white/40 text-sm">
                          {week.weekStart.toLocaleDateString('fr-FR', { weekday: 'long' })} - {week.weekEnd.toLocaleDateString('fr-FR', { weekday: 'long' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-lg font-black text-sm ${
                          isOpen 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {isOpen ? 'OUVERTE' : 'FERMÉE'}
                        </span>
                        <button
                          onClick={() => handleToggleWeek(week.weekStartStr, isOpen)}
                          disabled={isUpdating}
                          className={`px-6 py-3 font-black transition-colors rounded-xl ${
                            isOpen
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                          } disabled:opacity-50`}
                        >
                          {isUpdating ? '...' : isOpen ? 'FERMER' : 'OUVRIR'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
