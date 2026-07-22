"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordClient({ role, mustChange = true }: { role: string, mustChange?: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string) => {
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*()_+~|}{[\]:;?><,./-=]/.test(pwd);
    return hasLength && hasUpper && hasNumber && hasSymbol;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("Le nuove password non coincidono.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("La nuova password non rispetta i requisiti di sicurezza.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          if (role === 'admin') router.replace('/admin');
          else if (role === 'gate') router.replace('/admin/gate');
          else router.replace('/');
        }, 2000);
      } else {
        setError(data.error || "Errore durante il cambio password.");
      }
    } catch (err) {
      setError("Errore di connessione al server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden selection:bg-brand-action selection:text-white">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-40 blur-sm"
        style={{ backgroundImage: "url('/images/loading_docks_hero.png')" }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/80 to-slate-900/95" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-2xl animate-fade-in-up">
        
        {success ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Password Aggiornata</h2>
            <p className="text-slate-300 font-medium">L'account è ora sicuro. Reindirizzamento in corso...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-rose-500/30">
                <ShieldAlert className="w-8 h-8 text-rose-400" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Azione Richiesta</h1>
              <p className="text-slate-300 text-sm font-medium">
                È il tuo primo accesso. Per motivi di sicurezza devi impostare una nuova password permanente.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-500/10 text-rose-200 text-sm font-medium rounded-xl border border-rose-500/20">
                  {error}
                </div>
              )}

              {!mustChange && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <KeyRound className="w-3 h-3" /> Password Attuale
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} required
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-action outline-none text-white transition-all placeholder:text-slate-600 font-mono"
                      placeholder="Inserisci password attuale"
                      value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}



              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Nuova Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-action outline-none text-white transition-all placeholder:text-slate-600 font-mono"
                    placeholder="Crea nuova password"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Requisiti dinamici */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className={`text-xs flex items-center gap-1 font-medium ${newPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> 8+ caratteri
                  </div>
                  <div className={`text-xs flex items-center gap-1 font-medium ${/[A-Z]/.test(newPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> 1 Maiuscola
                  </div>
                  <div className={`text-xs flex items-center gap-1 font-medium ${/[0-9]/.test(newPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> 1 Numero
                  </div>
                  <div className={`text-xs flex items-center gap-1 font-medium ${/[!@#$%^&*()_+~|}{[\]:;?><,./-=]/.test(newPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> 1 Simbolo speciale
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Conferma Nuova Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-action outline-none text-white transition-all placeholder:text-slate-600 font-mono"
                    placeholder="Ripeti la nuova password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className={`w-full py-5 rounded-2xl shadow-xl text-lg font-black text-white transition-all active:scale-[0.98] bg-brand-action hover:opacity-90 mt-8
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? "AGGIORNAMENTO..." : "IMPOSTA PASSWORD E ACCEDI"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
