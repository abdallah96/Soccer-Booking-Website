'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Field } from '@/lib/hooks/useField';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// ── Pricing Rules Section ───────────────────────────────────────────────────

function PricingSection({ fields }: { fields: any[] }) {
  const [rules, setRules] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState('');
  const [form, setForm] = useState({ name: '', day_type: 'all', hour_start: 8, hour_end: 18, price_per_hour: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fieldId = selectedField || fields[0]?.id;

  useEffect(() => {
    if (!fieldId) return;
    fetch(`/api/admin/pricing-rules?field_id=${fieldId}`, { credentials: 'include' })
      .then(r => r.json()).then(d => setRules(d.rules || []));
  }, [fieldId]);

  const DAY_LABELS: Record<string, string> = { all: 'Tous les jours', weekday: 'Semaine (Lun–Ven)', weekend: 'Week-end (Sam–Dim)' };

  const save = async () => {
    if (!form.name || !form.price_per_hour) return toast.error('Nom et prix requis');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pricing-rules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...form, field_id: fieldId, hour_start: Number(form.hour_start), hour_end: Number(form.hour_end), price_per_hour: Number(form.price_per_hour) }),
      });
      if (res.ok) {
        const d = await res.json();
        setRules(prev => [...prev, d.rule]);
        setForm({ name: '', day_type: 'all', hour_start: 8, hour_end: 18, price_per_hour: '' });
        toast.success('Règle créée ✅');
      } else toast.error('Erreur création');
    } finally { setSaving(false); }
  };

  const toggle = async (rule: any) => {
    const res = await fetch('/api/admin/pricing-rules', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
    });
    if (res.ok) setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
  };

  const del = async (id: string) => {
    if (!confirm('Supprimer cette règle ?')) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/pricing-rules?id=${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setRules(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl lg:text-3xl font-black text-white mb-1">Grille tarifaire</h2>
        <p className="text-white/50 text-sm">Définissez des prix différents selon le jour et l'heure. Les règles remplacent le tarif de base du terrain.</p>
      </div>

      {fields.length > 1 && (
        <select value={fieldId} onChange={e => setSelectedField(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-sm">
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      )}

      {/* Existing rules */}
      {rules.length > 0 && (
        <div className="space-y-2">
          <div className="text-white/60 text-xs font-mono uppercase mb-2">Règles actives</div>
          {rules.map(rule => (
            <div key={rule.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${rule.is_active ? 'bg-white/5 border-white/10' : 'bg-gray-800/30 border-white/5 opacity-50'}`}>
              <div className="flex-1 min-w-0">
                <div className="text-white font-black text-sm truncate">{rule.name}</div>
                <div className="text-white/50 text-xs mt-0.5">
                  {DAY_LABELS[rule.day_type]} · {String(rule.hour_start).padStart(2,'0')}h → {String(rule.hour_end).padStart(2,'0')}h
                </div>
              </div>
              <div className="text-red-400 font-black text-sm mx-4 whitespace-nowrap">
                {Number(rule.price_per_hour).toLocaleString('fr-FR')} FCFA/h
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(rule)} className={`px-3 py-1 text-xs font-black rounded-lg transition-colors ${rule.is_active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                  {rule.is_active ? 'Actif' : 'Inactif'}
                </button>
                <button onClick={() => del(rule.id)} disabled={deleting === rule.id} className="px-3 py-1 text-xs font-black rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add rule form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="text-white font-black text-sm uppercase tracking-wider">+ Nouvelle règle tarifaire</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
            placeholder="Nom ex: Tarif soirée week-end"
            className="px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50" />
          <select value={form.day_type} onChange={e => setForm(f => ({...f, day_type: e.target.value}))}
            className="px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm">
            <option value="all">Tous les jours</option>
            <option value="weekday">Semaine (Lun–Ven)</option>
            <option value="weekend">Week-end (Sam–Dim)</option>
          </select>
          <div className="flex gap-2 items-center">
            <label className="text-white/60 text-xs w-12">De</label>
            <input type="number" min={0} max={23} value={form.hour_start} onChange={e => setForm(f => ({...f, hour_start: Number(e.target.value)}))}
              className="flex-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50" />
            <label className="text-white/60 text-xs w-4">h</label>
            <label className="text-white/60 text-xs w-8">à</label>
            <input type="number" min={0} max={23} value={form.hour_end} onChange={e => setForm(f => ({...f, hour_end: Number(e.target.value)}))}
              className="flex-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50" />
            <label className="text-white/60 text-xs w-4">h</label>
          </div>
          <div className="flex gap-2 items-center">
            <input type="number" min={0} value={form.price_per_hour} onChange={e => setForm(f => ({...f, price_per_hour: e.target.value}))}
              placeholder="Prix/heure ex: 25000"
              className="flex-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50" />
            <span className="text-white/50 text-xs">FCFA/h</span>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm">
          {saving ? 'Création...' : 'Créer la règle'}
        </button>
      </div>
    </div>
  );
}

// ── Subscriptions Section ───────────────────────────────────────────────────

function SubscriptionsSection({ fields, allUsers }: { fields: any[]; allUsers: any[] }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    user_id: '', field_id: '', day_of_week: 1, start_time: '19:00',
    duration: 60, payment_method: 'wave', discount_percent: 10,
    start_date: new Date().toISOString().split('T')[0], end_date: '',
  });

  const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    fetch('/api/admin/subscriptions', { credentials: 'include' })
      .then(r => r.json()).then(d => { setSubs(d.subscriptions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.user_id || !form.field_id) return toast.error('Utilisateur et terrain requis');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...form, end_date: form.end_date || null }),
      });
      if (res.ok) {
        const d = await res.json();
        setSubs(prev => [d.subscription, ...prev]);
        setShowForm(false);
        toast.success('Abonnement créé ✅');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Erreur création');
      }
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/subscriptions', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    else toast.error('Erreur mise à jour');
  };

  const statusColor = (s: string) => s === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : s === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl lg:text-3xl font-black text-white mb-1">Abonnements</h2>
          <p className="text-white/50 text-sm">Créneaux récurrents hebdomadaires avec remise automatique. Un booking est généré automatiquement chaque semaine.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-red-600 text-white text-sm font-black rounded-xl hover:bg-red-700 transition-colors">
          + Nouvel abonnement
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="text-white font-black text-sm uppercase tracking-wider mb-2">Nouveau abonnement</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Client *</label>
              <select value={form.user_id} onChange={e => setForm(f => ({...f, user_id: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm">
                <option value="">Sélectionner un client</option>
                {allUsers.filter(u => u.role === 'user').map(u => (
                  <option key={u.id} value={u.id}>{u.name} {u.phone ? `(${u.phone})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Terrain *</label>
              <select value={form.field_id} onChange={e => setForm(f => ({...f, field_id: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm">
                <option value="">Sélectionner</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Jour de la semaine</label>
              <select value={form.day_of_week} onChange={e => setForm(f => ({...f, day_of_week: Number(e.target.value)}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm">
                {['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Heure de début</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Durée</label>
              <select value={form.duration} onChange={e => setForm(f => ({...f, duration: Number(e.target.value)}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm">
                <option value={60}>1 heure</option>
                <option value={90}>1h30</option>
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Remise abonné (%)</label>
              <input type="number" min={0} max={50} value={form.discount_percent} onChange={e => setForm(f => ({...f, discount_percent: Number(e.target.value)}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Date de début</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Date de fin (optionnel)</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Paiement</label>
              <select value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm">
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="cash">Espèces</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm">
              {saving ? 'Création...' : 'Créer l\'abonnement'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      {loading ? (
        <div className="text-center py-12 text-white/40">Chargement...</div>
      ) : subs.length === 0 ? (
        <div className="text-center py-12 text-white/40">Aucun abonnement actif</div>
      ) : (
        <div className="space-y-3">
          {subs.map(sub => (
            <div key={sub.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-black">{sub.user?.name || 'Client inconnu'}</span>
                    <span className={`px-2 py-0.5 text-xs font-black rounded border ${statusColor(sub.status)}`}>
                      {sub.status === 'active' ? '● Actif' : sub.status === 'paused' ? '⏸ Pausé' : '✕ Annulé'}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 font-black">
                      -{sub.discount_percent}%
                    </span>
                  </div>
                  <div className="text-white/60 text-sm">
                    {DAYS_FR[sub.day_of_week]} · {sub.start_time} · {sub.duration === 60 ? '1h' : '1h30'} · {sub.field?.name}
                  </div>
                  {sub.user?.phone && <div className="text-white/40 text-xs mt-0.5">📞 {sub.user.phone}</div>}
                  {sub.next_booking_date && (
                    <div className="text-blue-400/70 text-xs mt-1">
                      Prochain booking : {new Date(sub.next_booking_date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {sub.status === 'active' && (
                    <button onClick={() => updateStatus(sub.id, 'paused')}
                      className="px-3 py-2 bg-yellow-500/20 text-yellow-400 text-xs font-black rounded-lg border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors">
                      ⏸ Pausé
                    </button>
                  )}
                  {sub.status === 'paused' && (
                    <button onClick={() => updateStatus(sub.id, 'active')}
                      className="px-3 py-2 bg-green-500/20 text-green-400 text-xs font-black rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-colors">
                      ▶ Reprendre
                    </button>
                  )}
                  {sub.status !== 'cancelled' && (
                    <button onClick={() => updateStatus(sub.id, 'cancelled')}
                      className="px-3 py-2 bg-red-500/20 text-red-400 text-xs font-black rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors">
                      ✕ Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function BookingSearchFilter({ bookings, onFiltered }: { bookings: any[]; onFiltered: (b: any[]) => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let filtered = bookings;
    if (status !== 'all') filtered = filtered.filter(b => b.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.phone?.includes(q) ||
        b.user?.email?.toLowerCase().includes(q) ||
        b.date?.includes(q)
      );
    }
    onFiltered(filtered);
  }, [search, status, bookings]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom, téléphone, date..."
        className="flex-1 px-4 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50"
      />
      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="px-4 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-sm focus:outline-none"
      >
        <option value="all">Tous les statuts</option>
        <option value="pending_payment">En attente paiement</option>
        <option value="confirmed">Confirmées</option>
        <option value="pending">En attente</option>
        <option value="cancelled">Annulées</option>
      </select>
    </div>
  );
}

function CancellationPolicyEditor() {
  const [policy, setPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setPolicy(d.settings?.cancellation_policy || ''); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cancellation_policy: policy }),
      });
      if (res.ok) toast.success('Politique d\'annulation sauvegardée ✅');
      else toast.error('Erreur lors de la sauvegarde');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">📋</span>
        <div>
          <div className="text-white font-black">Politique d'annulation</div>
          <div className="text-white/50 text-sm">Visible par les clients sur la page de confirmation</div>
        </div>
      </div>
      {loading ? (
        <div className="text-white/40 text-sm">Chargement...</div>
      ) : (
        <>
          <textarea
            value={policy}
            onChange={e => setPolicy(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-red-500/50"
          />
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white font-black rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </>
      )}
    </div>
  );
}

function PaymentInstructionsEditor() {
  const [wave, setWave] = useState('');
  const [om, setOm] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const s = d.settings || {};
        setWave(s.payment_instructions_wave || '');
        setOm(s.payment_instructions_orange_money || '');
        setWhatsapp(s.payment_whatsapp_number || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          payment_instructions_wave: wave,
          payment_instructions_orange_money: om,
          payment_whatsapp_number: whatsapp,
        }),
      });
      if (res.ok) toast.success('Instructions de paiement sauvegardées ✅');
      else toast.error('Erreur lors de la sauvegarde');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">💳</span>
        <div>
          <div className="text-white font-black">Instructions de paiement</div>
          <div className="text-white/50 text-sm">Affichées sur la page de confirmation selon la méthode choisie</div>
        </div>
      </div>
      {loading ? (
        <div className="text-white/40 text-sm">Chargement...</div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-black text-white/60 uppercase mb-2">Numéro WhatsApp de réception</label>
            <input
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="+221789251834"
              className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-white/60 uppercase mb-2">💙 Instructions Wave</label>
            <textarea
              value={wave}
              onChange={e => setWave(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-white/60 uppercase mb-2">🟠 Instructions Orange Money</label>
            <textarea
              value={om}
              onChange={e => setOm(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white font-black rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
          </button>
        </>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

type ActiveSection = 'dashboard' | 'bookings' | 'availability' | 'fields' | 'pricing' | 'subscriptions' | 'users' | 'reviews' | 'settings' | 'admins' | 'loyalty';

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
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingReview, setDeletingReview] = useState<string | null>(null);
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [showContactUserForm, setShowContactUserForm] = useState(false);
  const [contactUserData, setContactUserData] = useState({ name: '', email: '', phone: '', password: '' });
  // Cancellation modal state
  const [cancellationModal, setCancellationModal] = useState<{ bookingId: string; bookingInfo: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  
  // Availability blocking state
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [blockDate, setBlockDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState(''); // For date range blocking
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockFullDay, setBlockFullDay] = useState(false);
  const [blockDateRange, setBlockDateRange] = useState(false); // Toggle for date range
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

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      toast.error('Accès refusé. Admin uniquement.');
      router.push('/');
      return;
    }

    setIsLoading(false);
    fetchBookings();
    fetchFields();
    fetchStats();
    fetchBlockedSlots();
    fetchUsers();
    fetchAdmins();
    fetchReviews();
  }, [user, router]);

  useEffect(() => {
    if (fields.length > 0) {
      fetchWeekAvailability();
    }
  }, [fields]);

  useEffect(() => {
    if (activeSection === 'loyalty' && !loyaltyData && !loyaltyLoading) {
      fetchLoyalty();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showManualBooking || showFieldForm) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showManualBooking, showFieldForm]);

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

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (user?.role !== 'super_admin') return;
    
    setAdminsLoading(true);
    try {
      const response = await fetch('/api/admin/users?role=admin', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await fetch('/api/admin/reviews', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchLoyalty = async () => {
    setLoyaltyLoading(true);
    try {
      const response = await fetch('/api/admin/loyalty', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data);
      }
    } catch (error) {
      console.error('Failed to fetch loyalty:', error);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    setDeletingReview(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Commentaire supprimé');
        fetchReviews();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingReview(null);
    }
  };

  const handleSubmitReply = async (reviewId: string, isEdit: boolean = false) => {
    if (!replyText.trim() || replyText.trim().length < 5) {
      toast.error('La réponse doit contenir au moins 5 caractères');
      return;
    }

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(`/api/admin/reviews/${reviewId}/reply`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reply: replyText }),
      });

      if (response.ok) {
        toast.success(isEdit ? 'Réponse mise à jour' : 'Réponse ajoutée');
        setReplyingToReview(null);
        setEditingReply(null);
        setReplyText('');
        fetchReviews();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!confirm('Supprimer cette réponse ?')) return;

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Réponse supprimée');
        fetchReviews();
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleCreateContactUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactUserData.name || !contactUserData.phone || !contactUserData.password) {
      toast.error('Nom, téléphone et mot de passe sont requis');
      return;
    }

    try {
      // Create contact user with role 'user' but mark them specially if needed
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: contactUserData.email || `${contactUserData.phone.replace(/\D/g, '')}@petitcamp.sn`,
          name: contactUserData.name,
          phone: contactUserData.phone,
          password: contactUserData.password,
          role: 'user', // Contact users are regular users but can be marked in admin
        }),
      });

      if (response.ok) {
        toast.success('Contact utilisateur créé');
        setContactUserData({ name: '', email: '', phone: '', password: '' });
        setShowContactUserForm(false);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'admin "${adminName}" ? Cette action est irréversible.`)) {
      return;
    }

    setDeletingAdmin(adminId);
    try {
      const response = await fetch(`/api/admin/users?id=${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Admin supprimé avec succès');
        fetchAdmins();
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingAdmin(null);
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
    
    // Get Monday of a date using local time (same as API)
    const getMonday = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const dayOfWeek = date.getDay();
      const diff = day - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      return new Date(year, month, diff);
    };
    
    // Format date as YYYY-MM-DD using local time (same as API)
    const formatDate = (date: Date): string => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
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
        weekStartStr: formatDate(weekStart),
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
    
    // Only super_admin can create admins
    if (user?.role !== 'super_admin') {
      toast.error('Seul le Super Admin peut créer des admins');
      return;
    }

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
        fetchAdmins();
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleConfirmBooking = async (bookingId: string, status: 'confirmed' | 'cancelled', cancellation_reason?: string) => {
    setUpdatingBooking(bookingId);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, cancellation_reason }),
      });

      if (response.ok) {
        toast.success(status === 'confirmed' ? 'Réservation confirmée ✅' : 'Réservation annulée');
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

  const openCancellationModal = (bookingId: string, booking: any) => {
    const info = `${booking.user?.name || 'Client'} — ${new Date(booking.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${booking.time_slot}`;
    setCancellationModal({ bookingId, bookingInfo: info });
    setCancellationReason('');
  };

  const confirmCancellation = async () => {
    if (!cancellationModal) return;
    await handleConfirmBooking(cancellationModal.bookingId, 'cancelled', cancellationReason || undefined);
    setCancellationModal(null);
    setCancellationReason('');
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
      description: field.description || '',
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
      toast.error('Veuillez sélectionner une date de début');
      return;
    }

    if (blockDateRange && !blockEndDate) {
      toast.error('Veuillez sélectionner une date de fin');
      return;
    }

    if (blockDateRange && blockEndDate < blockDate) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    if (!blockFullDay && !blockDateRange && (!blockStartTime || !blockEndTime)) {
      toast.error('Veuillez sélectionner les heures');
      return;
    }

    setSavingBlock(true);
    try {
      // If date range, create blocks for each day in the range
      if (blockDateRange) {
        const startDate = new Date(blockDate);
        const endDate = new Date(blockEndDate);
        const promises = [];
        
        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          promises.push(
            fetch('/api/admin/blocked-slots', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                date: dateStr,
                start_time: '08:00',
                end_time: '02:00',
                full_day: true,
                reason: blockReason || `Fermé du ${blockDate} au ${blockEndDate}`,
                field_id: fields[0]?.id,
              }),
            })
          );
        }
        
        await Promise.all(promises);
        toast.success(`${promises.length} jours bloqués`);
      } else {
        // Single day block
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

        if (!response.ok) {
          throw new Error('Erreur lors du blocage');
        }
        toast.success('Créneau bloqué');
      }

      setBlockDate('');
      setBlockEndDate('');
      setBlockStartTime('');
      setBlockEndTime('');
      setBlockReason('');
      setBlockFullDay(false);
      setBlockDateRange(false);
      setShowBlockForm(false);
      fetchBlockedSlots();
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
    
    if (!manualBooking.user_name || !manualBooking.user_phone || !manualBooking.date || !manualBooking.start_time) {
      toast.error('Veuillez remplir tous les champs obligatoires (nom, téléphone, date, heure)');
      return;
    }

    if (!fields[0]?.id) {
      toast.error('Aucun terrain disponible');
      return;
    }

    setCreatingBooking(true);
    try {
      let userId;
      
      // Try to find user by phone first
      const findUserResponse = await fetch(`/api/users?phone=${encodeURIComponent(manualBooking.user_phone)}`, {
        credentials: 'include',
      });
      
      if (findUserResponse.ok) {
        const userData = await findUserResponse.json();
        userId = userData.user?.id;
      }

      // If no user found by phone, create a new one
      if (!userId) {
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        // Generate email from phone if not provided
        const userEmail = manualBooking.user_email || `${manualBooking.user_phone.replace(/\D/g, '')}@petitcamp.sn`;
        
        const userResponse = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: userEmail,
            name: manualBooking.user_name,
            phone: manualBooking.user_phone,
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

  const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'pending_payment').length;
  const pendingPaymentCount = bookings.filter(b => b.status === 'pending_payment').length;

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
        <div className="px-4 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
  <div>
              <h1 className="text-xl lg:text-3xl font-black text-white">PANEL ADMIN</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs lg:text-sm text-white/50">Bienvenue, {user?.name}</p>
                {user?.role === 'super_admin' && (
                  <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-black rounded">
                    SUPER ADMIN
                  </span>
                )}
              </div>
            </div>
        </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4">
              {pendingCount > 0 && (
          <button
                  onClick={() => setActiveSection('bookings')}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors"
                >
                  <span className="text-yellow-400 font-black text-lg lg:text-2xl">{pendingCount}</span>
                  <span className="text-yellow-300 text-xs lg:text-sm">en attente</span>
          </button>
              )}
          <button
                onClick={() => setShowManualBooking(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-black hover:bg-red-700 transition-colors"
              >
                📞 Nouvelle réservation
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 lg:px-8 max-w-7xl mx-auto">
          <div className="flex overflow-x-auto no-scrollbar border-t border-white/5 lg:border-0 lg:gap-2">
            {[
              { id: 'dashboard', label: '🏠', fullLabel: 'Accueil' },
              { id: 'bookings', label: '📅', fullLabel: 'Réservations', badge: pendingCount },
              { id: 'availability', label: '📆', fullLabel: 'Disponibilités' },
              { id: 'fields', label: '⚽', fullLabel: 'Terrain' },
              { id: 'pricing', label: '💰', fullLabel: 'Tarifs' },
              { id: 'subscriptions', label: '🔄', fullLabel: 'Abonnements' },
              { id: 'users', label: '👥', fullLabel: 'Utilisateurs' },
              { id: 'reviews', label: '💬', fullLabel: 'Commentaires' },
              { id: 'loyalty', label: '🎁', fullLabel: 'Fidélité' },
              ...(user?.role === 'super_admin' ? [{ id: 'admins', label: '👑', fullLabel: 'Admins' }] : []),
              { id: 'settings', label: '⚙️', fullLabel: 'Paramètres' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as ActiveSection)}
                className={`flex-1 lg:flex-none min-w-[70px] lg:min-w-0 flex flex-col lg:flex-row items-center lg:gap-2 py-3 px-2 lg:px-6 lg:py-4 transition-colors relative rounded-t-xl ${
                  activeSection === item.id
                    ? 'text-red-500 bg-red-500/10 lg:bg-red-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg lg:text-xl">{item.label}</span>
                <span className="text-[10px] lg:text-sm mt-1 lg:mt-0 font-medium">{item.fullLabel}</span>
                {item.badge ? (
                  <span className="absolute top-1 right-2 lg:relative lg:top-0 lg:right-0 w-5 h-5 lg:w-6 lg:h-6 bg-yellow-500 text-black text-[10px] lg:text-xs font-black rounded-full flex items-center justify-center lg:ml-2">
                    {item.badge}
                  </span>
                ) : null}
          </button>
            ))}
          </div>
        </div>
        </div>

      {/* Main Content */}
      <div className="px-4 lg:px-8 py-6 pb-24 max-w-7xl mx-auto">
        
        {/* DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveSection('bookings')}
                className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl text-left hover:scale-105 transition-transform"
              >
                <div className="text-3xl lg:text-5xl font-black text-yellow-400 mb-1 lg:mb-2">
                  {pendingCount}
                </div>
                <div className="text-sm lg:text-base text-yellow-300/80">À confirmer</div>
              </button>
              
              <button
                onClick={() => setShowManualBooking(true)}
                className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 p-4 lg:p-6 rounded-2xl text-left hover:scale-105 transition-transform"
              >
                <div className="text-2xl lg:text-4xl mb-1 lg:mb-2">📞</div>
                <div className="text-sm lg:text-base text-red-300/80">Nouvelle résa</div>
              </button>
              
              <button
                onClick={() => setActiveSection('availability')}
                className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-4 lg:p-6 rounded-2xl text-left hover:scale-105 transition-transform"
              >
                <div className="text-2xl lg:text-4xl mb-1 lg:mb-2">📆</div>
                <div className="text-sm lg:text-base text-green-300/80">Semaines</div>
              </button>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 p-4 lg:p-6 rounded-2xl text-left hover:scale-105 transition-transform"
              >
                <div className="text-2xl lg:text-4xl mb-1 lg:mb-2">📊</div>
                <div className="text-sm lg:text-base text-blue-300/80">Statistiques</div>
              </button>
            </div>

            {/* Financial Dashboard - Always visible on desktop */}
            {stats && (
              <div className={`space-y-4 ${showStats ? '' : 'hidden lg:block'}`}>
                {/* Revenue Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 lg:p-6">
                    <div className="text-green-400/80 text-xs lg:text-sm font-mono uppercase tracking-wider mb-2">✅ Encaissé</div>
                    <div className="text-xl lg:text-3xl font-black text-green-400">
                      {new Intl.NumberFormat('fr-FR').format(stats.stats?.total_revenue || 0)}
                    </div>
                    <div className="text-green-400/60 text-xs mt-1">FCFA</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 lg:p-6">
                    <div className="text-orange-400/80 text-xs lg:text-sm font-mono uppercase tracking-wider mb-2">⏳ En attente</div>
                    <div className="text-xl lg:text-3xl font-black text-orange-400">
                      {new Intl.NumberFormat('fr-FR').format(stats.stats?.pending_revenue || 0)}
                    </div>
                    <div className="text-orange-400/60 text-xs mt-1">FCFA</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 lg:p-6">
                    <div className="text-red-400/80 text-xs lg:text-sm font-mono uppercase tracking-wider mb-2">❌ Annulé</div>
                    <div className="text-xl lg:text-3xl font-black text-red-400">
                      {new Intl.NumberFormat('fr-FR').format(stats.stats?.cancelled_revenue || 0)}
                    </div>
                    <div className="text-red-400/60 text-xs mt-1">FCFA</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 lg:p-6">
                    <div className="text-blue-400/80 text-xs lg:text-sm font-mono uppercase tracking-wider mb-2">📅 30 jours</div>
                    <div className="text-xl lg:text-3xl font-black text-blue-400">
                      {new Intl.NumberFormat('fr-FR').format(stats.stats?.revenue_last_30_days || 0)}
                    </div>
                    <div className="text-blue-400/60 text-xs mt-1">FCFA</div>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 lg:p-6">
                    <div className="text-cyan-400/80 text-xs lg:text-sm font-mono uppercase tracking-wider mb-2">📆 Cette semaine</div>
                    <div className="text-xl lg:text-3xl font-black text-cyan-400">
                      {new Intl.NumberFormat('fr-FR').format(stats.stats?.revenue_this_week || 0)}
                    </div>
                    <div className="text-cyan-400/60 text-xs mt-1">FCFA</div>
                  </div>
                </div>

                {/* Booking Count Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white/50 text-xs lg:text-sm mb-2">Total réservations</div>
                    <div className="text-2xl lg:text-4xl font-black text-white">{stats.stats?.total_bookings || 0}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white/50 text-xs lg:text-sm mb-2">Confirmées</div>
                    <div className="text-2xl lg:text-4xl font-black text-green-400">{stats.stats?.confirmed_bookings || 0}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white/50 text-xs lg:text-sm mb-2">Annulées</div>
                    <div className="text-2xl lg:text-4xl font-black text-red-400">{stats.stats?.cancelled_bookings || 0}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white/50 text-xs lg:text-sm mb-2">Taux d'occupation</div>
                    <div className="text-2xl lg:text-4xl font-black text-blue-400">{stats.stats?.occupation_rate || 0}%</div>
                    <div className="text-white/30 text-xs mt-1">30 derniers jours</div>
                  </div>
                </div>

                {/* Clients stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 lg:p-6">
                    <div className="text-purple-400/80 text-xs lg:text-sm font-mono uppercase tracking-wider mb-2">🔄 Clients récurrents</div>
                    <div className="text-2xl lg:text-4xl font-black text-purple-400">{stats.stats?.recurring_clients || 0}</div>
                    <div className="text-white/30 text-xs mt-1">clients avec 2+ réservations</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white/50 text-xs lg:text-sm mb-2">Clients uniques</div>
                    <div className="text-2xl lg:text-4xl font-black text-white">{stats.stats?.total_unique_clients || 0}</div>
                    <div className="text-white/30 text-xs mt-1">ayant réservé au moins 1x</div>
                  </div>
                </div>

                {/* Monthly Revenue Bar Chart (Recharts) */}
                {stats.monthly_revenue && stats.monthly_revenue.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white font-black text-sm lg:text-base mb-4 uppercase tracking-wider">Revenus par mois (6 derniers mois)</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.monthly_revenue}>
                        <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} width={45} />
                        <Tooltip
                          contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 13 }}
                          formatter={(value: number) => [`${new Intl.NumberFormat('fr-FR').format(value)} FCFA`, 'Revenu']}
                        />
                        <Bar dataKey="revenue" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Cancellation Rate + Popular Slots */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Cancellation Rate */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white font-black text-sm mb-4 uppercase tracking-wider">Taux d&apos;annulation</div>
                    {(() => {
                      const rate = stats.stats?.cancellation_rate || 0;
                      const pieData = [
                        { name: 'Confirmées', value: 100 - rate },
                        { name: 'Annulées', value: rate },
                      ];
                      const COLORS = ['#22c55e', '#ef4444'];
                      return (
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                              <Pie data={pieData} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={2}>
                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-2">
                            <div className="text-3xl font-black text-white">{rate}%</div>
                            <div className="text-white/50 text-xs">des réservations annulées</div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> <span className="text-white/60">Confirmées</span>
                              <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-2" /> <span className="text-white/60">Annulées</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Popular Time Slots */}
                  {stats.popular_slots && stats.popular_slots.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                      <div className="text-white font-black text-sm mb-4 uppercase tracking-wider">Créneaux les plus réservés</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.popular_slots} layout="vertical">
                          <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="slot" type="category" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                          <Tooltip
                            contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 13 }}
                            formatter={(value: number) => [`${value} réservations`, '']}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Weekly Revenue Chart */}
                {stats.weekly_revenue && stats.weekly_revenue.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
                    <div className="text-white font-black text-sm mb-4 uppercase tracking-wider">Revenus par semaine (8 dernières semaines)</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={stats.weekly_revenue}>
                        <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} width={45} />
                        <Tooltip
                          contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 13 }}
                          formatter={(value: number) => [`${new Intl.NumberFormat('fr-FR').format(value)} FCFA`, 'Revenu']}
                        />
                        <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* 🔔 Reminder Flags — bookings in next 48h needing a reminder */}
            {(() => {
              const now = Date.now();
              const reminders = bookings.filter(b => {
                if (b.status !== 'confirmed') return false;
                const bookingTime = new Date(b.date).getTime();
                const hoursUntil = (bookingTime - now) / 3600000;
                return hoursUntil > 0 && hoursUntil <= 48;
              });
              if (reminders.length === 0) return null;
              const getBand = (h: number) => {
                if (h <= 1) return { label: '🚨 Dans 1h', color: 'bg-red-500/20 border-red-500/40', badge: 'bg-red-500/30 text-red-300' };
                if (h <= 8) return { label: '🔴 Dans 8h', color: 'bg-red-500/10 border-red-500/30', badge: 'bg-red-500/20 text-red-400' };
                if (h <= 24) return { label: '🟠 Dans 24h', color: 'bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400' };
                return { label: '🟡 Dans 48h', color: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400' };
              };
              return (
                <div className="space-y-3">
                  <h3 className="text-xl lg:text-2xl text-white font-black flex items-center gap-2">
                    <span>🔔</span> Rappels à envoyer
                    <span className="text-sm text-yellow-400 font-normal">({reminders.length} match(s) dans les 48h)</span>
                  </h3>
                  <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {reminders.map(booking => {
                      const phone = booking.user?.phone?.replace(/\D/g, '');
                      const bookingDate = new Date(booking.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                      const hoursUntil = (new Date(booking.date).getTime() - now) / 3600000;
                      const band = getBand(hoursUntil);
                      const msg = encodeURIComponent(`Bonjour ${booking.user?.name || ''} 👋\n\nRappel : vous avez un match chez Petit Camp !\n\n📅 ${bookingDate}\n⏰ ${booking.time_slot}\n\nÀ bientôt ! ⚽`);
                      return (
                        <div key={booking.id} className={`rounded-xl p-4 border ${band.color}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-white font-black text-sm">{booking.user?.name || 'N/A'}</div>
                              <div className="text-white/70 text-xs">📅 {bookingDate} · ⏰ {booking.time_slot}</div>
                              {booking.user?.phone && <div className="text-white/50 text-xs mt-1">📞 {booking.user.phone}</div>}
                            </div>
                            <span className={`text-xs font-black px-2 py-1 rounded ${band.badge}`}>
                              {Math.round(hoursUntil)}h
                            </span>
                          </div>
                          <div className="text-xs text-white/50 mb-2">{band.label}</div>
                          {phone ? (
                            <a
                              href={`https://wa.me/${phone}?text=${msg}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-lg transition-colors"
                            >
                              <span>💬</span> Envoyer rappel WhatsApp
                            </a>
                          ) : (
                            <div className="text-white/30 text-xs text-center">Pas de numéro enregistré</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Recent Pending Bookings */}
            {pendingCount > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl lg:text-2xl text-white font-black">
                  Réservations en attente
                  {pendingPaymentCount > 0 && (
                    <span className="ml-2 text-sm text-orange-400 font-normal">
                      ({pendingPaymentCount} en attente de paiement)
                    </span>
                  )}
                </h3>
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {bookings
                    .filter(b => b.status === 'pending' || b.status === 'pending_payment')
                    .slice(0, 6)
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className={`rounded-xl p-4 lg:p-6 ${
                          booking.status === 'pending_payment' 
                            ? 'bg-orange-500/10 border border-orange-500/20' 
                            : 'bg-yellow-500/10 border border-yellow-500/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            {booking.status === 'pending_payment' && (
                              <span className="inline-block px-2 py-0.5 text-xs font-black bg-orange-500/30 text-orange-300 rounded mb-2">
                                💰 EN ATTENTE PAIEMENT
                              </span>
                            )}
                            <div className="text-white font-black text-lg">
                              {new Date(booking.date).toLocaleDateString('fr-FR', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                            <div className={`text-sm lg:text-base ${booking.status === 'pending_payment' ? 'text-orange-300' : 'text-yellow-300'}`}>
                              ⏰ {booking.time_slot}
                            </div>
                            <div className="text-white/60 text-sm mt-1">
                              {booking.user?.name || 'N/A'}
                              {booking.user?.phone && <span className="ml-2">📞 {booking.user.phone}</span>}
                            </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-black ${booking.status === 'pending_payment' ? 'text-orange-400' : 'text-yellow-400'}`}>
                            {booking.amount?.toLocaleString()} FCFA
                          </div>
                        </div>
                      </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmBooking(booking.id, 'confirmed')}
                            disabled={updatingBooking === booking.id}
                            className="flex-1 py-2 lg:py-3 bg-green-600 text-white text-sm lg:text-base font-black rounded-lg disabled:opacity-50 hover:bg-green-700 transition-colors"
                          >
                            ✓ {booking.status === 'pending_payment' ? 'Paiement reçu' : 'Confirmer'}
                          </button>
                          <button
                            onClick={() => openCancellationModal(booking.id, booking)}
                            disabled={updatingBooking === booking.id}
                            className="px-4 py-2 lg:py-3 bg-red-500/20 text-red-400 text-sm lg:text-base font-black rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                {pendingCount > 6 && (
                  <button
                    onClick={() => setActiveSection('bookings')}
                    className="w-full py-3 bg-white/5 text-white/60 text-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Voir les {pendingCount - 6} autres →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {activeSection === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl lg:text-3xl font-black text-white">Réservations</h2>
              <button
                onClick={() => setShowManualBooking(true)}
                className="px-4 lg:px-6 py-2 lg:py-3 bg-red-600 text-white text-sm lg:text-base font-black rounded-lg hover:bg-red-700 transition-colors"
              >
                + Nouvelle réservation
              </button>
            </div>

            <BookingSearchFilter bookings={bookings} onFiltered={setFilteredBookings} />

            {bookings.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                Aucune réservation
            </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                Aucun résultat pour cette recherche
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`rounded-xl p-4 border ${
                      booking.status === 'pending'
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : booking.status === 'pending_payment'
                        ? 'bg-orange-500/10 border-orange-500/20'
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
                          {booking.user?.phone && <span className="ml-2">📞 {booking.user.phone}</span>}
            </div>
              </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-black rounded ${
                          booking.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : booking.status === 'pending_payment'
                            ? 'bg-orange-500/20 text-orange-300'
                            : booking.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {booking.status === 'pending' ? 'EN ATTENTE' : 
                           booking.status === 'pending_payment' ? 'EN ATTENTE PAIEMENT' :
                           booking.status === 'confirmed' ? 'CONFIRMÉ' : 'ANNULÉ'}
                        </span>
                        <div className="text-white font-black mt-2">{booking.amount?.toLocaleString()} FCFA</div>
            </div>
                    </div>
                    
                    {/* Payment Info */}
                    <div className="bg-white/5 rounded-lg p-3 mb-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black ${
                            booking.payment_method === 'wave' ? 'bg-blue-500/20 text-blue-300' :
                            booking.payment_method === 'orange_money' ? 'bg-orange-500/20 text-orange-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {booking.payment_method === 'wave' ? '💙 Wave' :
                             booking.payment_method === 'orange_money' ? '🟠 Orange Money' :
                             '💵 Espèces'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black ${
                            booking.payment_status === 'paid' ? 'bg-green-500/20 text-green-300' :
                            booking.payment_status === 'partial' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {booking.payment_status === 'paid' ? '✓ Payé' :
                             booking.payment_status === 'partial' ? '◐ Partiel' :
                             '✕ Non payé'}
                          </span>
                        </div>
                      </div>
                      {booking.payment_date && (
                        <div className="text-white/40 mt-2">
                          Payé le {new Date(booking.payment_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Cancellation reason */}
                    {booking.status === 'cancelled' && booking.cancellation_reason && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3 text-xs">
                        <div className="text-red-400/80 font-mono uppercase mb-1">
                          Motif · {booking.cancelled_by === 'system' ? 'Système (expiration)' : booking.cancelled_by === 'admin' ? 'Admin' : 'Client'}
                        </div>
                        <div className="text-red-300">{booking.cancellation_reason}</div>
                      </div>
                    )}

                    {/* Receipt download - for confirmed bookings */}
                    {booking.status === 'confirmed' && (
                      <a
                        href={`/api/bookings/${booking.id}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 mt-2 bg-white/5 border border-white/20 rounded-lg text-xs font-bold text-white/70 hover:bg-white/10 transition-colors"
                      >
                        <span>📄</span> Télécharger reçu PDF
                      </a>
                    )}

                    {/* WhatsApp contact button - show for pending and confirmed bookings with a phone */}
                    {booking.user?.phone && booking.status !== 'cancelled' && (() => {
                      const phone = booking.user.phone.replace(/\D/g, '');
                      const bookingDate = new Date(booking.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                      const isReminder = booking.status === 'confirmed' && (() => {
                        const bookingDateTime = new Date(booking.date);
                        const hoursUntil = (bookingDateTime.getTime() - Date.now()) / 3600000;
                        return hoursUntil > 0 && hoursUntil <= 48;
                      })();
                      const msgConfirm = encodeURIComponent(`Bonjour ${booking.user.name || ''} 👋\n\nVotre réservation chez Petit Camp est confirmée ✅\n\n📅 ${bookingDate}\n⏰ ${booking.time_slot}\n💰 ${booking.amount?.toLocaleString()} FCFA\n\nÀ bientôt sur le terrain !`);
                      const msgReminder = encodeURIComponent(`Bonjour ${booking.user.name || ''} 👋\n\nRappel : vous avez un match chez Petit Camp demain !\n\n📅 ${bookingDate}\n⏰ ${booking.time_slot}\n\nÀ bientôt ! ⚽`);
                      const msgPayment = encodeURIComponent(`Bonjour ${booking.user.name || ''} 👋\n\nVotre réservation Petit Camp est en attente de paiement.\n\n📅 ${bookingDate}\n⏰ ${booking.time_slot}\n💰 Acompte : ${Math.round((booking.amount || 0) * 0.5).toLocaleString()} FCFA\n\nMerci d'effectuer le paiement pour confirmer votre créneau.`);
                      const msg = booking.status === 'pending_payment' ? msgPayment : isReminder ? msgReminder : msgConfirm;
                      return (
                        <div className="flex gap-2 mt-2">
                          <a
                            href={`https://wa.me/${phone}?text=${msg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black transition-colors ${
                              isReminder
                                ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30'
                                : 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30'
                            }`}
                          >
                            <span>💬</span>
                            {booking.status === 'pending_payment'
                              ? 'Relance paiement'
                              : isReminder
                              ? '🔔 Envoyer rappel'
                              : 'WhatsApp client'}
                          </a>
                        </div>
                      );
                    })()}

                    {(booking.status === 'pending' || booking.status === 'pending_payment') && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => handleConfirmBooking(booking.id, 'confirmed')}
                          disabled={updatingBooking === booking.id}
                          className="flex-1 py-2 bg-green-600 text-white text-sm font-black rounded-lg disabled:opacity-50"
                        >
                          ✓ {booking.status === 'pending_payment' ? 'Paiement reçu' : 'Confirmer'}
                        </button>
                        <button
                          onClick={() => openCancellationModal(booking.id, booking)}
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
          <div className="space-y-8">
            {/* Week Management */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl lg:text-3xl font-black text-white">Semaines ouvertes</h2>
                  <p className="text-white/50 text-sm lg:text-base mt-1">
                    Cliquez pour ouvrir ou fermer une semaine aux réservations
                  </p>
                </div>
              </div>
              
              <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {generateWeeks().slice(0, 6).map((week) => {
                  const weekData = weekAvailability.find(w => w.week_start_date === week.weekStartStr);
                  const isOpen = weekData?.is_open !== false;
                  const isUpdating = updatingWeek === week.weekStartStr;

                  return (
                    <div
                      key={week.weekStartStr}
                      className={`flex items-center justify-between p-4 lg:p-6 rounded-xl border-2 transition-all ${
                        isOpen ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div>
                        <div className="text-white font-black text-sm lg:text-lg">
                          {week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-white/40 text-xs lg:text-sm">
                          Semaine du {week.weekStart.toLocaleDateString('fr-FR', { weekday: 'long' })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleWeek(week.weekStartStr, isOpen)}
                        disabled={isUpdating}
                        className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-black text-sm lg:text-base transition-all cursor-pointer hover:opacity-80 ${
                          isOpen
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
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
                className="w-full mt-4 py-3 text-white/50 text-sm lg:text-base hover:text-white/70 transition-colors"
              >
                Voir plus de semaines ↓
              </button>
              
              <div id="all-weeks" className="hidden grid lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {generateWeeks().slice(6).map((week) => {
                  const weekData = weekAvailability.find(w => w.week_start_date === week.weekStartStr);
                  const isOpen = weekData?.is_open !== false;
                  const isUpdating = updatingWeek === week.weekStartStr;

                  return (
                    <div
                      key={week.weekStartStr}
                      className={`flex items-center justify-between p-4 lg:p-6 rounded-xl border-2 transition-all ${
                        isOpen ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div>
                        <div className="text-white font-black text-sm lg:text-lg">
                          {week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-white/40 text-xs lg:text-sm">
                          Semaine du {week.weekStart.toLocaleDateString('fr-FR', { weekday: 'long' })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleWeek(week.weekStartStr, isOpen)}
                        disabled={isUpdating}
                        className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-black text-sm lg:text-base cursor-pointer hover:opacity-80 transition-all ${
                          isOpen ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'
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
            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-white">Bloquer créneaux</h2>
                  <p className="text-white/50 text-sm lg:text-base mt-1">Bloquer des heures spécifiques pour maintenance, etc.</p>
                </div>
                <button
                  onClick={() => setShowBlockForm(!showBlockForm)}
                  className="px-4 lg:px-6 py-2 lg:py-3 bg-red-600 text-white text-sm lg:text-base font-black rounded-lg hover:bg-red-700 transition-colors"
                >
                  + Bloquer
                </button>
              </div>

              {showBlockForm && (
                <form onSubmit={handleBlockSlot} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-4">
                  {/* Toggle between single day and date range */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setBlockDateRange(false)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-black transition-colors ${
                        !blockDateRange 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      📅 Un jour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBlockDateRange(true);
                        setBlockFullDay(true);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-black transition-colors ${
                        blockDateRange 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      📆 Période (Du ... au ...)
                    </button>
                  </div>

                  {blockDateRange ? (
                    /* Date range inputs */
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-sm">Du</label>
                        <input
                          type="date"
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          min={getMinDate()}
                          max={getMaxDate()}
                          className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">Au</label>
                        <input
                          type="date"
                          value={blockEndDate}
                          onChange={(e) => setBlockEndDate(e.target.value)}
                          min={blockDate || getMinDate()}
                          max={getMaxDate()}
                          className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Single day input */
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
                  )}
                  
                  {!blockDateRange && (
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={blockFullDay}
                        onChange={(e) => setBlockFullDay(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-white">Toute la journée</span>
                    </label>
                  )}

                  {!blockFullDay && !blockDateRange && (
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
                      {savingBlock ? '...' : blockDateRange ? 'Bloquer la période' : 'Bloquer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlockForm(false);
                        setBlockDateRange(false);
                      }}
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-3xl font-black text-white">Gestion des terrains</h2>
                <p className="text-white/50 text-sm lg:text-base mt-1">Créez et gérez vos terrains</p>
              </div>
              <button
                onClick={() => {
                  resetFieldForm();
                  setEditingField(null);
                  setShowFieldForm(true);
                }}
                className="px-4 lg:px-6 py-2 lg:py-3 bg-red-600 text-white text-sm lg:text-base font-black rounded-lg hover:bg-red-700 transition-colors"
              >
                + Nouveau terrain
              </button>
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

        {/* USERS */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-3xl font-black text-white">Utilisateurs</h2>
                <p className="text-white/50 text-sm lg:text-base mt-1">
                  {users.length} utilisateurs inscrits
                </p>
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-12 text-white/40">
                Chargement...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                Aucun utilisateur
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-white/60 text-sm border-b border-white/10">
                        <th className="pb-3 font-medium">Nom</th>
                        <th className="pb-3 font-medium">Contact</th>
                        <th className="pb-3 font-medium">Rôle</th>
                        <th className="pb-3 font-medium text-center">Réservations</th>
                        <th className="pb-3 font-medium">Inscrit le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="text-white font-medium">{u.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-white/80 text-sm">{u.email}</div>
                            {u.phone && (
                              <div className="text-white/50 text-xs">📞 {u.phone}</div>
                            )}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 text-xs font-black rounded ${
                              u.role === 'super_admin'
                                ? 'bg-amber-500/20 text-amber-300'
                                : u.role === 'admin'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-white/10 text-white/60'
                            }`}>
                              {u.role === 'super_admin' ? 'SUPER ADMIN' : u.role === 'admin' ? 'ADMIN' : 'CLIENT'}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-white font-black">{u.booking_stats?.total || 0}</span>
                              {u.booking_stats?.confirmed > 0 && (
                                <span className="text-green-400 text-xs">✓{u.booking_stats.confirmed}</span>
                              )}
                              {u.booking_stats?.cancelled > 0 && (
                                <span className="text-red-400 text-xs">✕{u.booking_stats.cancelled}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-white/50 text-sm">
                            {new Date(u.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-white font-black">{u.name}</div>
                            <span className={`px-2 py-0.5 text-xs font-black rounded ${
                              u.role === 'super_admin'
                                ? 'bg-amber-500/20 text-amber-300'
                                : u.role === 'admin'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-white/10 text-white/60'
                            }`}>
                              {u.role === 'super_admin' ? 'SUPER ADMIN' : u.role === 'admin' ? 'ADMIN' : 'CLIENT'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-black text-lg">{u.booking_stats?.total || 0}</div>
                          <div className="text-white/50 text-xs">réservations</div>
                        </div>
                      </div>
                      <div className="text-white/60 text-sm space-y-1">
                        <div>📧 {u.email}</div>
                        {u.phone && <div>📞 {u.phone}</div>}
                        <div className="text-white/40 text-xs mt-2">
                          Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOYALTY */}
        {activeSection === 'loyalty' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-3xl font-black text-white">Programme de fidélité</h2>
                <p className="text-white/50 text-sm lg:text-base mt-1">
                  Tous les {loyaltyData?.threshold || 10} matchs confirmés = 1 séance gratuite
                </p>
              </div>
              <button
                onClick={fetchLoyalty}
                disabled={loyaltyLoading}
                className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {loyaltyLoading ? '...' : '🔄 Actualiser'}
              </button>
            </div>

            {loyaltyData && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
                  <div className="text-purple-400/80 text-xs font-mono uppercase mb-2">Codes générés</div>
                  <div className="text-2xl font-black text-purple-400">{loyaltyData.total_codes_generated}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                  <div className="text-green-400/80 text-xs font-mono uppercase mb-2">Codes utilisés</div>
                  <div className="text-2xl font-black text-green-400">{loyaltyData.total_codes_used}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                  <div className="text-blue-400/80 text-xs font-mono uppercase mb-2">Clients fidèles</div>
                  <div className="text-2xl font-black text-blue-400">{loyaltyData.loyalty?.length || 0}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-white/50 text-xs font-mono uppercase mb-2">Seuil récompense</div>
                  <div className="text-2xl font-black text-white">{loyaltyData.threshold} matchs</div>
                </div>
              </div>
            )}

            {loyaltyLoading ? (
              <div className="text-center py-12 text-white/40">Chargement...</div>
            ) : !loyaltyData?.loyalty?.length ? (
              <div className="text-center py-12 text-white/40">
                Aucun client avec des réservations confirmées
              </div>
            ) : (
              <div className="space-y-3">
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-white/60 text-sm border-b border-white/10">
                        <th className="pb-3 font-medium">Client</th>
                        <th className="pb-3 font-medium text-center">Matchs confirmés</th>
                        <th className="pb-3 font-medium text-center">Prochain cadeau</th>
                        <th className="pb-3 font-medium text-center">Codes dispo</th>
                        <th className="pb-3 font-medium text-center">Codes utilisés</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loyaltyData.loyalty.map((client: any) => {
                        const progress = ((loyaltyData.threshold - client.next_reward_in) / loyaltyData.threshold) * 100;
                        return (
                          <tr key={client.user_id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                                  {client.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <div className="text-white font-medium">{client.name}</div>
                                  <div className="text-white/50 text-xs">{client.phone || client.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <span className="text-white font-black text-lg">{client.confirmed_bookings}</span>
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-white/50 text-xs">
                                  {client.next_reward_in === loyaltyData.threshold
                                    ? `dans ${loyaltyData.threshold} matchs`
                                    : `dans ${client.next_reward_in} matchs`}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              {client.codes_available > 0 ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-black rounded">
                                  {client.codes_available} dispo
                                </span>
                              ) : (
                                <span className="text-white/30 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-4 text-center">
                              <span className="text-white/60">{client.codes_used}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3">
                  {loyaltyData.loyalty.map((client: any) => {
                    const progress = ((loyaltyData.threshold - client.next_reward_in) / loyaltyData.threshold) * 100;
                    return (
                      <div key={client.user_id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                            {client.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-bold">{client.name}</div>
                            <div className="text-white/50 text-xs">{client.phone || client.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-black text-lg">{client.confirmed_bookings}</div>
                            <div className="text-white/40 text-xs">matchs</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-white/50 text-xs whitespace-nowrap">
                            {client.next_reward_in === loyaltyData.threshold ? `${loyaltyData.threshold}` : client.next_reward_in} restant(s)
                          </span>
                        </div>
                        {client.codes_available > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {client.discount_codes.filter((c: any) => !c.is_used).map((code: any) => (
                              <span key={code.id} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-mono rounded">
                                {code.code}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {activeSection === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-3xl font-black text-white">Commentaires</h2>
                <p className="text-white/50 text-sm lg:text-base mt-1">
                  {reviews.length} commentaires au total
                </p>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="text-center py-12 text-white/40">Chargement...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                Aucun commentaire
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 lg:p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                            {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-white font-black">{review.user?.name || review.reviewer_name || 'Anonyme'}</div>
                            <div className="text-white/50 text-xs">
                              {review.field?.name} • {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${review.rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-white/80 text-sm lg:text-base mb-3">{review.comment}</p>
                        
                        {/* Admin Reply */}
                        {review.admin_reply && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-blue-400 font-black text-xs">👑 ADMIN</span>
                              <span className="text-white/50 text-xs">
                                {review.admin?.name} • {review.admin_replied_at && new Date(review.admin_replied_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-white/90 text-sm">{review.admin_reply}</p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setEditingReply(review.id);
                                  setReplyText(review.admin_reply);
                                  setReplyingToReview(null);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 underline"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteReply(review.id)}
                                className="text-xs text-red-400 hover:text-red-300 underline"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Reply Form */}
                        {(replyingToReview === review.id || editingReply === review.id) && (
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Votre réponse..."
                              rows={3}
                              className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubmitReply(review.id, editingReply === review.id)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-black rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                {editingReply === review.id ? 'Mettre à jour' : 'Répondre'}
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingToReview(null);
                                  setEditingReply(null);
                                  setReplyText('');
                                }}
                                className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {!review.admin_reply && replyingToReview !== review.id && (
                          <button
                            onClick={() => {
                              setReplyingToReview(review.id);
                              setReplyText('');
                              setEditingReply(null);
                            }}
                            className="px-3 py-2 bg-blue-500/20 text-blue-300 text-xs font-black rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                          >
                            Répondre
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReview === review.id}
                          className="px-3 py-2 bg-red-500/20 text-red-400 text-xs font-black rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {deletingReview === review.id ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRICING RULES */}
        {activeSection === 'pricing' && (
          <div className="space-y-6">
            <PricingSection fields={fields} />
          </div>
        )}

        {/* SUBSCRIPTIONS */}
        {activeSection === 'subscriptions' && (
          <div className="space-y-6">
            <SubscriptionsSection fields={fields} allUsers={users} />
          </div>
        )}

        {/* ADMINS (Super Admin only) */}
        {activeSection === 'admins' && user?.role === 'super_admin' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white mb-4">👑 Gestion des Admins</h2>
            <p className="text-white/60 text-sm mb-4">Créez ou supprimez des administrateurs. Seul le Super Admin peut gérer cette section.</p>

            {adminsLoading ? (
              <div className="text-center py-12 text-white/40">Chargement...</div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-white/40">Aucun admin pour le moment.</div>
            ) : (
              <div className="space-y-2 mb-6">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div>
                      <div className="text-white font-medium">{admin.name}</div>
                      <div className="text-white/50 text-sm">{admin.email}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                      disabled={deletingAdmin === admin.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 text-sm font-black rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {deletingAdmin === admin.id ? '...' : 'Supprimer'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCreateAdminForm(!showCreateAdminForm)}
              className="w-full bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-left hover:bg-red-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <div className="text-white font-black">Créer un admin</div>
                  <div className="text-white/50 text-sm">Ajouter un nouvel administrateur (email, nom, mot de passe)</div>
                </div>
              </div>
            </button>

            {showCreateAdminForm && (
              <form onSubmit={handleCreateAdmin} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <input
                  type="text"
                  value={adminData.name}
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  placeholder="Nom complet *"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  required
                />
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  placeholder="Email *"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  required
                />
                <input
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  placeholder="Mot de passe (min. 6 caractères) *"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  required
                  minLength={6}
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-3 bg-red-600 text-white font-black rounded-lg">
                    Créer l&apos;admin
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

        {/* SETTINGS */}
        {activeSection === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white mb-4">Paramètres</h2>

            {/* Export CSV */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="text-white font-black">Export des réservations</div>
                    <div className="text-white/50 text-sm">Télécharger en CSV (compatible Excel)</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/admin/export"
                    download
                    className="px-4 py-2 bg-green-600 text-white text-sm font-black rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Tout exporter
                  </a>
                  <a
                    href="/api/admin/export?status=confirmed"
                    download
                    className="px-4 py-2 bg-blue-600/80 text-white text-sm font-black rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Confirmées
                  </a>
                </div>
              </div>
            </div>

            {/* Cancellation policy editor */}
            <CancellationPolicyEditor />

            {/* Payment instructions editor */}
            <PaymentInstructionsEditor />
            
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

{/* Admin Management - Only for Super Admin */}
            {/* Contact User Management */}
            <div className="border-t border-white/10 pt-4 mt-4">
              <button
                onClick={() => setShowContactUserForm(!showContactUserForm)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <div className="text-white font-black">Ajouter un contact utilisateur</div>
                    <div className="text-white/50 text-sm">Ajouter un utilisateur de contact</div>
                  </div>
                </div>
              </button>

              {showContactUserForm && (
                <form onSubmit={handleCreateContactUser} className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4 space-y-3">
                  <input
                    type="text"
                    value={contactUserData.name}
                    onChange={(e) => setContactUserData({ ...contactUserData, name: e.target.value })}
                    placeholder="Nom complet *"
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  />
                  <input
                    type="tel"
                    value={contactUserData.phone}
                    onChange={(e) => setContactUserData({ ...contactUserData, phone: e.target.value })}
                    placeholder="Téléphone *"
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  />
                  <input
                    type="email"
                    value={contactUserData.email}
                    onChange={(e) => setContactUserData({ ...contactUserData, email: e.target.value })}
                    placeholder="Email (optionnel)"
                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  />
                  <input
                    type="password"
                    value={contactUserData.password}
                    onChange={(e) => setContactUserData({ ...contactUserData, password: e.target.value })}
                    placeholder="Mot de passe *"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContactUserForm(false);
                        setContactUserData({ name: '', email: '', phone: '', password: '' });
                      }}
                      className="px-6 py-3 bg-white/10 text-white rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] my-auto overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
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
                <label className="text-white/60 text-sm">Téléphone *</label>
                <input
                  type="tel"
                  value={manualBooking.user_phone}
                  onChange={(e) => setManualBooking({ ...manualBooking, user_phone: e.target.value })}
                  required
                  placeholder="Ex: 77 123 45 67"
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="text-white/60 text-sm">Email (optionnel)</label>
                <input
                  type="email"
                  value={manualBooking.user_email}
                  onChange={(e) => setManualBooking({ ...manualBooking, user_email: e.target.value })}
                  placeholder="exemple@email.com"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] my-auto overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
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

      {/* Cancellation Modal with Motif */}
      {cancellationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-white mb-1">Annuler la réservation</h3>
            <p className="text-white/50 text-sm mb-5">{cancellationModal.bookingInfo}</p>

            <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-wider">
              Motif d'annulation
            </label>
            {/* Quick presets */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                'Retard de paiement',
                'Retard de réservation',
                'Terrain indisponible',
                'Demande du client',
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCancellationReason(preset)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all text-left ${
                    cancellationReason === preset
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ou saisissez un motif personnalisé... (optionnel)"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-red-500/50 mb-5"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setCancellationModal(null); setCancellationReason(''); }}
                className="flex-1 py-3 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={confirmCancellation}
                disabled={!!updatingBooking}
                className="flex-1 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updatingBooking ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
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
