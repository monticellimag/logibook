"use client";

import { useState, useEffect } from "react";
import { User, Building2, MapPin, Phone, UserRound, Mail, X, Save, ShieldCheck, Key } from "lucide-react";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  contactPerson?: string;
};

interface UserProfileProps {
  userId?: string; // If provided, load this user. Otherwise load current user profile.
  readOnly?: boolean;
  onClose: () => void;
}

export default function UserProfile({ userId, readOnly = false, onClose }: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const url = userId ? `/api/users/${userId}` : '/api/profile';
      const res = await fetch(url);
      if (!res.ok) throw new Error("Errore nel caricamento del profilo");
      const data = await res.json();
      setProfile(data);
      setFormData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Errore durante il salvataggio");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-bold">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="relative p-8 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {readOnly ? "Scheda Vettore" : "Il Tuo Profilo"}
              </h2>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-1">
                {readOnly ? profile?.name : "Gestione Identità Aziendale"}
              </p>
              {!readOnly && (
                <a 
                  href="/change-password" 
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all uppercase tracking-tighter"
                >
                  <Key className="w-3 h-3" /> Cambia Password
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <form onSubmit={handleSave} className="space-y-8">
            {error && (
              <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-sm font-bold">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 text-sm font-bold">
                Profilo aggiornato con successo!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ragione Sociale */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <UserRound className="w-3 h-3" /> Ragione Sociale
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* P.IVA */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <ShieldCheck className="w-3 h-3" /> Partita IVA / CF
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  placeholder="IT00000000000"
                  value={formData.vatNumber || ''} 
                  onChange={e => setFormData({...formData, vatNumber: e.target.value})}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <Mail className="w-3 h-3" /> Email Contatto
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  value={formData.email || ''} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* Telefono */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <Phone className="w-3 h-3" /> Telefono Aziendale
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  placeholder="+39 000 0000000"
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {/* Indirizzo */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <MapPin className="w-3 h-3" /> Sede Legale (Via, Civico)
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  value={formData.address || ''} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              {/* Città */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Città
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  value={formData.city || ''} 
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>

              {/* CAP */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  CAP
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  value={formData.zipCode || ''} 
                  onChange={e => setFormData({...formData, zipCode: e.target.value})}
                />
              </div>

              {/* Referente */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <User className="w-3 h-3" /> Referente incaricato
                </label>
                <input 
                  disabled={readOnly}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                  placeholder="Nome e Cognome del referente"
                  value={formData.contactPerson || ''} 
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
            </div>

            {!readOnly && (
              <div className="flex justify-end pt-4">
                <button 
                  disabled={saving}
                  type="submit" 
                  className="flex items-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Salvataggio..." : "SALVA MODIFICHE"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
