"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Truck, MapPin, UserSquare2, ArrowLeft, ShieldCheck, Globe, Zap, Clock } from "lucide-react";

type LoginMode = "vettore" | "admin" | "gate";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as LoginMode | null;

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when mode changes
  useEffect(() => {
    setFormData({ name: '', email: '', password: '' });
    setError('');
    setIsRegister(false);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isLogin = !isRegister;
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.role === 'admin' || data.role === 'gate') {
        router.replace(mode === 'gate' || data.role === 'gate' ? '/admin/gate' : '/admin');
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const goSelect = () => router.push('/login');
  const setMode = (m: LoginMode) => router.push(`/login?mode=${m}`);

  const renderForm = () => (
    <div className="glass-card p-8 sm:p-12 max-w-lg w-full animate-fade-in-up border-white/20">
      <button
        onClick={goSelect}
        className="flex items-center text-sm font-semibold text-slate-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
        Torna alla selezione
      </button>

      <div className="mb-8 flex items-center gap-4">
        <div className={`p-3 rounded-2xl shadow-lg ${
          mode === 'vettore' ? 'bg-indigo-600' : 
          mode === 'admin' ? 'bg-slate-800' : 
          'bg-logistica-action'
        }`}>
          {mode === 'vettore' && <Truck className="w-7 h-7 text-white" />}
          {mode === 'admin' && <UserSquare2 className="w-7 h-7 text-white" />}
          {mode === 'gate' && <MapPin className="w-7 h-7 text-white" />}
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {mode === 'vettore' ? (isRegister ? "Registrazione" : "Accesso Vettori") :
             mode === 'admin' ? "Accesso Admin" :
             "Accesso Portineria"}
          </h2>
          <p className="text-slate-400 text-sm font-medium">BENVENUTO NELL'ECOSISTEMA LOGISTICA UNO</p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 bg-rose-500/10 text-rose-200 text-sm rounded-2xl border border-rose-500/20 backdrop-blur-md">
            {error}
          </div>
        )}

        {mode === 'vettore' && isRegister && (
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome Azienda</label>
            <input type="text" required
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600"
              placeholder="Inserisci il nome della tua azienda"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Aziendale</label>
          <input type="email" required
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder={mode === 'vettore' ? 'tuamail@azienda.it' : 'admin@slotify.local'}
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
          <input type="password" required
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600"
            placeholder="••••••••"
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <button
          type="submit" disabled={loading}
          className={`w-full py-5 rounded-2xl shadow-2xl text-lg font-black text-white transition-all active:scale-[0.98]
            ${mode === 'admin' ? 'bg-slate-800 hover:bg-slate-700' : mode === 'gate' ? 'bg-logistica-action hover:opacity-90' : 'bg-indigo-600 hover:bg-indigo-500'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? "ELABORAZIONE..." : (isRegister ? "CREA ACCOUNT" : "ACCEDI")}
        </button>
      </form>

      {mode === 'vettore' && (
        <p className="mt-8 text-center text-slate-400 font-medium">
          {isRegister ? "Hai già un account? " : "Nuovo fornitore? "}
          <button onClick={() => setIsRegister(!isRegister)} className="font-black text-white hover:underline decoration-logistica-action underline-offset-4 decoration-2">
            {isRegister ? "Accedi ora" : "Registrati subito"}
          </button>
        </p>
      )}
    </div>
  );

  const renderSelect = () => (
    <div className="max-w-5xl w-full animate-fade-in-up">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md mb-6 animate-float">
          <Zap className="w-4 h-4 text-logistica-action" />
          <span className="text-xs font-black text-white tracking-widest uppercase">Digital Excellence in Logistics</span>
        </div>
        <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter mb-4">
          Slotify<span className="text-logistica-action">.</span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto">
          La piattaforma di Logistica Uno per la gestione intelligente dei transiti e delle prenotazioni slot.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 px-4">
        {[
          { 
            id: 'vettore', 
            icon: Truck, 
            title: "Vettori", 
            description: "Prenotazione slot e gestione documenti di viaggio.",
            color: "bg-indigo-500/10",
            iconColor: "text-indigo-400",
            hoverBorder: "hover:border-indigo-500/50"
          },
          { 
            id: 'admin', 
            icon: UserSquare2, 
            title: "Amministratori", 
            description: "Dashboard completa, planning e gestione utenti.",
            color: "bg-slate-500/10",
            iconColor: "text-slate-300",
            hoverBorder: "hover:border-slate-400/50"
          },
          { 
            id: 'gate', 
            icon: MapPin, 
            title: "Portineria", 
            description: "Controllo ingressi e check-in rapido dei transiti.",
            color: "bg-logistica-action/10",
            iconColor: "text-logistica-action",
            hoverBorder: "hover:border-logistica-action/50"
          }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id as LoginMode)}
            className={`glass-card p-10 flex flex-col items-center text-center group ${item.hoverBorder}`}
          >
            <div className={`p-6 rounded-3xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${item.color}`}>
              <item.icon className={`w-12 h-12 transition-colors ${item.iconColor}`} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 group-hover:text-logistica-action transition-colors">{item.title}</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed leading-relaxed">{item.description}</p>
            <div className="mt-8 flex items-center text-xs font-black text-white tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
              Inizia qui <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </button>
        ))}
      </div>

      {/* Modern Footer inspired by the reference rows */}
      <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 px-8 border-t border-white/5 pt-12">
        <div className="flex flex-col items-center text-center opacity-40 hover:opacity-100 transition-opacity group">
           <Globe className="w-6 h-6 text-white mb-2 group-hover:text-logistica-action transition-colors" />
           <span className="text-[10px] font-black text-white tracking-widest uppercase">Distribuzione</span>
        </div>
        <div className="flex flex-col items-center text-center opacity-40 hover:opacity-100 transition-opacity group">
           <ShieldCheck className="w-6 h-6 text-white mb-2 group-hover:text-logistica-action transition-colors" />
           <span className="text-[10px] font-black text-white tracking-widest uppercase">Sostenibilità</span>
        </div>
        <div className="flex flex-col items-center text-center opacity-40 hover:opacity-100 transition-opacity group">
           <Zap className="w-6 h-6 text-white mb-2 group-hover:text-logistica-action transition-colors" />
           <span className="text-[10px] font-black text-white tracking-widest uppercase">Integrazione</span>
        </div>
        <div className="flex flex-col items-center text-center opacity-40 hover:opacity-100 transition-opacity group">
           <Clock className="w-6 h-6 text-white mb-2 group-hover:text-logistica-action transition-colors" />
           <span className="text-[10px] font-black text-white tracking-widest uppercase">Performance</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center py-20 px-4 overflow-hidden selection:bg-logistica-action selection:text-white">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[10s] scale-110 hover:scale-105"
        style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-logistica-deep/95 via-logistica-deep/80 to-transparent backdrop-blur-[2px]" />
      
      {/* Logistica Uno Brand Anchor */}
      <div className="absolute top-10 left-10 z-20 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity group cursor-default">
         <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-logistica-deep group-hover:bg-logistica-action group-hover:text-white transition-all shadow-xl">L1</div>
         <span className="text-xl font-black text-white tracking-tighter">Logistica<span className="text-logistica-action">Uno</span></span>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        {mode ? renderForm() : renderSelect()}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
