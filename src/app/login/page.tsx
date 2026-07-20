"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Truck, MapPin, UserSquare2, ArrowLeft, ShieldCheck, Globe, Zap, Clock, Users, CalendarDays, Warehouse, Layers, Settings2, FileText, FileMinus, ListChecks, Network, Mail, Laptop, ParkingCircle } from "lucide-react";

type LoginMode = "vettore" | "admin" | "gate";

const DEV_CREDENTIALS: Record<LoginMode, { label: string; email: string; password: string; badge?: string }[]> = {
  vettore: [
    { label: "LCT", email: "LCT@LCT.IT", password: "password", badge: "Vettore" },
  ],
  admin: [
    { label: "Super Admin", email: "admin@logibook.local", password: "admin", badge: "Globale" },
    { label: "Monticelli", email: "monticelli@logisticauno.it", password: "password", badge: "Hub" },
    { label: "S. Giorgio", email: "sangiorgiobi@logisticauno.it", password: "password", badge: "Hub" },
    { label: "Oppeano 1", email: "oppeano1@logisticauno.it", password: "password", badge: "Hub" },
  ],
  gate: [
    { label: "Super Admin", email: "admin@logibook.local", password: "admin", badge: "Gate" },
    { label: "Gate Monticelli", email: "gate.monticelli@logisticauno.it", password: "password", badge: "Gate" },
    { label: "Gate S.Giorgio", email: "gate.sangiorgiobi@logisticauno.it", password: "password", badge: "Gate" },
  ],
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as LoginMode | null;

  const [isRegister, setIsRegister] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', 
    vatNumber: '', contactPerson: '', phone: '', notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (featuresRef.current) {
        const rect = featuresRef.current.getBoundingClientRect();
        setIsScrolled(rect.top <= 120);
      } else {
        setIsScrolled(window.scrollY > 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mode]);

  // Reset form when mode changes
  useEffect(() => {
    setFormData({ 
      name: '', email: '', password: '', 
      vatNumber: '', contactPerson: '', phone: '', notes: ''
    });
    setError('');
    setIsRegister(false);
    setRequestSent(false);
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

      if (isRegister) {
        setRequestSent(true);
      } else {
        // Role validation against selected mode
        if (mode === 'vettore' && data.role !== 'user') {
          throw new Error("Questo account non è registrato come Vettore. Usa la sezione Amministratori.");
        }
        if (mode === 'admin' && data.role !== 'admin') {
          throw new Error("Accesso negato. Questa sezione è riservata agli Amministratori.");
        }
        if (mode === 'gate' && data.role !== 'gate' && data.role !== 'admin') {
          throw new Error("Accesso negato. Questa sezione è riservata al personale di Portineria.");
        }

        if (data.role === 'admin' || data.role === 'gate') {
          router.replace(mode === 'gate' || data.role === 'gate' ? '/admin/gate' : '/admin');
        } else {
          router.replace('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const goSelect = () => router.push('/login');
  
  const setMode = async (m: LoginMode) => {
    // Check if already authenticated with correct role
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const user = await res.json();
        const isAdmin = user.role === 'admin';
        const isGate = user.role === 'gate';
        const isUser = user.role === 'user';

        if ((m === 'vettore' && isUser) || 
            (m === 'admin' && isAdmin) || 
            (m === 'gate' && (isGate || isAdmin))) {
          router.replace(m === 'vettore' ? '/' : m === 'gate' ? '/admin/gate' : '/admin');
          return;
        }
      }
    } catch (e) {
      // Ignore error and proceed to login form
    }
    router.push(`/login?mode=${m}`);
  };

  const renderForm = () => (
    <div className={`p-8 sm:p-12 w-full animate-fade-in-up bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl transition-all duration-500 ${isRegister && mode === 'vettore' ? 'max-w-5xl' : 'max-w-lg'}`}>
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

      {mode === 'vettore' && isRegister && requestSent ? (
        <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in-up">
          <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-white mb-2">Richiesta Inviata</h3>
          <p className="text-slate-300 text-sm font-medium leading-relaxed">
            La tua richiesta di registrazione è stata inoltrata con successo e si trova in stato <span className="font-bold text-white">PENDING</span>.<br/><br/>
            Un amministratore verificherà i dati. Verrai contattato entro 24 ore.
          </p>
          <button onClick={() => { setRequestSent(false); setIsRegister(false); }} className="mt-8 px-6 py-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            Torna al Login
          </button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-rose-500/10 text-rose-200 text-sm rounded-2xl border border-rose-500/20 backdrop-blur-md">
              {error}
            </div>
          )}

          {mode === 'vettore' && isRegister ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 animate-fade-in-up">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ragione Sociale Azienda</label>
                <input type="text" required autoComplete="organization"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600 font-bold"
                  placeholder="Nome dell'azienda"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Partita IVA</label>
                <input type="text" required autoComplete="off"
                  placeholder="IT01234567890"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600 font-bold"
                  value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome e Cognome Referente</label>
                <input type="text" required autoComplete="name"
                  placeholder="Mario Rossi"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600 font-bold"
                  value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Aziendale</label>
                <input type="email" required autoComplete="off"
                  placeholder="email@azienda.it"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600 font-bold"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Numero di Telefono</label>
                <input type="tel" required autoComplete="tel"
                  placeholder="+39 012 3456789"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600 font-bold"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Note Aggiuntive (Opzionale)</label>
                <textarea
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600 resize-none h-24 font-bold"
                  placeholder="Eventuali dettagli per la richiesta..."
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Aziendale</label>
                <input type="email" required
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-logistica-action outline-none text-white transition-all placeholder:text-slate-600"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder={mode === 'vettore' ? 'tuamail@azienda.it' : 'admin@logisticauno.it'}
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
            </>
          )}

          <button
            type="submit" disabled={loading}
            className={`w-full py-5 rounded-2xl shadow-2xl text-lg font-black text-white transition-all active:scale-[0.98]
              ${mode === 'admin' ? 'bg-slate-800 hover:bg-slate-700' : mode === 'gate' ? 'bg-logistica-action hover:opacity-90' : 'bg-indigo-600 hover:bg-indigo-500'}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "ELABORAZIONE..." : (isRegister ? "INVIA RICHIESTA" : "ACCEDI")}
          </button>

          {/* Dev Quick-Login Panel */}
          {!isRegister && mode && (
            <div className="mt-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-xs font-black text-amber-400/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                🔧 Accessi Demo
              </p>
              <div className="flex flex-wrap gap-2">
                {DEV_CREDENTIALS[mode].map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, email: cred.email, password: cred.password }))}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 transition-all group"
                  >
                    <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">{cred.label}</span>
                    {cred.badge && (
                      <span className="text-[10px] font-bold text-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 rounded-md">{cred.badge}</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2 font-medium">Clicca per precompilare le credenziali</p>
            </div>
          )}
        </form>
      )}

      {mode === 'vettore' && !requestSent && (
        <p className="mt-8 text-center text-slate-400 font-medium">
          {isRegister ? "Hai già un account? " : "Nuovo fornitore? "}
          <button 
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setFormData({ name: '', email: '', password: '', vatNumber: '', contactPerson: '', phone: '', notes: '' });
              setError('');
            }} 
            className="font-black text-white hover:underline decoration-logistica-action underline-offset-4 decoration-2"
          >
            {isRegister ? "Accedi ora" : "Richiedi Accesso"}
          </button>
        </p>
      )}
    </div>
  );

  const renderSelect = () => (
    <div className="w-full animate-fade-in-up flex flex-col items-center">
      <div className="max-w-5xl w-full text-center mb-16 pt-20">
        <h1 className="text-7xl sm:text-9xl font-roboto-condensed font-black text-white tracking-tight mb-6 uppercase">
          LogiBook<span className="text-logistica-action">.</span>
        </h1>
        <p className="text-slate-300 text-lg sm:text-xl font-medium max-w-3xl mx-auto leading-relaxed drop-shadow-md">
          La piattaforma web può essere resa accessibile da esterno a clienti, fornitori e vettori per la prenotazione degli appuntamenti di carico e scarico merce secondo le disponibilità e gli slot resi visibili dalla logistica, il tutto attraverso un'interfaccia utente semplice ed intuitiva.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 px-4 max-w-6xl w-full z-10 mb-20 sm:mb-32">
        {[
          { 
            id: 'vettore', 
            icon: Truck, 
            title: "Vettori", 
            description: "Prenotazione slot e gestione documenti di viaggio.",
            color: "bg-indigo-500/20",
            iconColor: "text-indigo-400",
            hoverBorder: "hover:border-indigo-500/50"
          },
          { 
            id: 'admin', 
            icon: UserSquare2, 
            title: "Amministratori", 
            description: "Dashboard completa, planning e gestione utenti.",
            color: "bg-slate-500/20",
            iconColor: "text-slate-300",
            hoverBorder: "hover:border-slate-400/50"
          },
          { 
            id: 'gate', 
            icon: MapPin, 
            title: "Hub", 
            description: "Controllo ingressi e check-in rapido dei transiti.",
            color: "bg-logistica-action/20",
            iconColor: "text-logistica-action",
            hoverBorder: "hover:border-logistica-action/50"
          }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id as LoginMode)}
            className={`p-10 flex flex-col items-center text-center group border border-white/10 shadow-2xl backdrop-blur-xl ${item.hoverBorder} bg-slate-900/60 hover:bg-slate-900/80 transition-all duration-300 rounded-[1.5rem]`}
          >
            <div className={`p-6 rounded-3xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${item.color}`}>
              <item.icon className={`w-12 h-12 transition-colors ${item.iconColor}`} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 group-hover:text-logistica-action transition-colors">{item.title}</h2>
            <p className="text-sm text-slate-100 font-medium leading-relaxed">{item.description}</p>
            <div className="mt-8 flex items-center text-xs font-black text-white tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
              Inizia qui <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </button>
        ))}
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="w-full bg-slate-50/95 backdrop-blur-md rounded-t-[3rem] py-24 px-4 sm:px-8 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.25)] relative z-10 border-t border-white/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Funzionalità Principali</h2>
            <div className="w-24 h-1 bg-logistica-action mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {[
              { icon: Users, title: "Accesso web per vettori e hub" },
              { icon: CalendarDays, title: "Gestione multi calendario" },
              { icon: Layers, title: "Gestione multi slot orari" },
              { icon: Settings2, title: "Configurazione disponibilità e parametri" },
              { icon: ListChecks, title: "Prenotazione per quantità intere o parziali" },
              { icon: Mail, title: "Invio mail QRcode prenotazione", badge: "Coming Soon" },
              { icon: Laptop, title: "Gestione ricevimento mezzi" },
              { icon: ParkingCircle, title: "Gestione piazzola e mezzi in attesa" },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 text-slate-700 group-hover:text-logistica-action group-hover:-translate-y-2 group-hover:shadow-logistica-action/20 transition-all duration-300">
                  <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-700 max-w-[200px] leading-snug">
                  {feature.title}
                  {feature.badge && (
                    <span className="block mt-3 text-[10px] uppercase font-black tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit mx-auto border border-indigo-100/50">
                      {feature.badge}
                    </span>
                  )}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Links */}
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium text-slate-500 pb-8">
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/cookies-policy" className="hover:text-logistica-action transition-colors">Cookies Policy</Link>
            <Link href="/privacy-policy" className="hover:text-logistica-action transition-colors">Privacy Policy</Link>
            <a href="https://www.logisticauno.com/wp-content/uploads/2024/08/MOD_PRI_02-Informativa-trattamento-Clienti-fornitori.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-logistica-action transition-colors">Informativa Fornitori</a>
          </div>
          <div>
            &copy; {new Date().getFullYear()} <span className="hover:text-logistica-action font-bold transition-colors">Alessandro Baiamonte</span> Tutti i diritti riservati.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden selection:bg-logistica-action selection:text-white">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center transition-transform duration-[10s] scale-110 hover:scale-105"
        style={{ backgroundImage: "url('/images/loading_docks_hero.png')" }}
      />
      <div className="fixed inset-0 z-0 bg-slate-900/70 backdrop-blur-[2px]" />

      {/* Logistica Uno Brand Anchor - FIXED and dynamically colored */}
      <div className={`fixed top-8 left-8 sm:top-10 sm:left-10 z-50 transition-all duration-500 group ${isScrolled ? 'brightness-0 opacity-100' : 'opacity-90 hover:opacity-100'}`}>
         <img src="/images/logo_logistica_uno_white.png" alt="Logistica Uno" className={`h-10 sm:h-14 w-auto object-contain transition-all duration-500 ${isScrolled ? '' : 'drop-shadow-2xl'}`} />
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col">
        {mode ? (
          <div className="flex-1 flex items-center justify-center p-4 py-24 min-h-screen">
             {renderForm()}
          </div>
        ) : renderSelect()}
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
