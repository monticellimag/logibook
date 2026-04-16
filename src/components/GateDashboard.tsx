"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Truck, LogOut, Home, Clock, Search, MapPin, CheckCircle2, User, Building2, LayoutDashboard, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Paperclip, Phone, UserCircle2, AlertCircle, Camera, ClipboardList, X } from "lucide-react";
import { DEPOTS, OPERATION_TYPES, DIFFICULTY_LEVELS } from "@/lib/constants";
import UserProfile from "./UserProfile";

type Booking = {
  id: string;
  date: string;
  userId: string;
  depotId: string;
  time: string;
  carrierName: string;
  licensePlate: string;
  gateStatus: string;
  operationType: string;
  company: string;
  orderRef: string;
  phone?: string;
  notes?: string;
  attachment?: string;
  operationStartedAt?: string;
  completedAt?: string;
  pallets: number;
  difficulty: string;
  isEmergency: number;
};

export default function GateDashboard({ adminUser }: { adminUser: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepotId, setSelectedDepotId] = useState(adminUser.depotId || DEPOTS[0].id);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "expected" | "active" | "completed">("all");
  const [selectedUserIdProfile, setSelectedUserIdProfile] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerId, setScannerId] = useState("");
  const [showArrivalModal, setShowArrivalModal] = useState<Booking | null>(null);

  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const currentDepot = DEPOTS.find(d => d.id === selectedDepotId);

  useEffect(() => {
    fetchBookings();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBookings(true); // silent fetch
    }, 30000);
    
    return () => clearInterval(interval);
  }, [formattedDate, selectedDepotId]);

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${formattedDate}&depotId=${selectedDepotId}`);
      if (res.ok) setBookings(await res.json());
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const prevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const nextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };
  
  const handleStatusChange = async (id: string, gateStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateStatus }),
      });
      if (res.ok) await fetchBookings();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleScan = () => {
    const booking = bookings.find(b => b.id === scannerId);
    if (booking) {
      setSearchTerm(booking.licensePlate);
      setShowScanner(false);
      setScannerId("");
    } else {
      alert("QR/ID non trovato");
    }
  };

  const handleDifficultyChange = async (id: string, difficulty: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      if (res.ok) await fetchBookings();
    } catch (err) {
      console.error("Error updating difficulty:", err);
    }
  };

  // Filtriamo i booking
  const filteredBookings = bookings
    .filter((b) => {
      // Filtro ricerca testuale
      const s = searchTerm.toLowerCase();
      if (s) {
        const cName = (b.carrierName || "").toLowerCase();
        const plate = (b.licensePlate || "").toLowerCase();
        const ref = (b.orderRef || "").toLowerCase();
        if (!cName.includes(s) && !plate.includes(s) && !ref.includes(s)) {
          return false;
        }
      }
      
      // Filtro per stato macro
      const stat = b.gateStatus || "expected";
      if (statusFilter === "expected" && stat !== "expected") return false;
      if (statusFilter === "active" && !["arrived", "loading", "unloading"].includes(stat)) return false;
      if (statusFilter === "completed" && stat !== "completed") return false;

      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time)); // Ordina per ora

  const getDurationMins = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / 60000);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-500 tracking-tight">
                Slotify Gate
              </h1>
              <div className="flex items-center gap-1.5 leading-none">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Monitor</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!adminUser.depotId && (
               <select 
                value={selectedDepotId} 
                onChange={(e) => setSelectedDepotId(e.target.value)}
                className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none dark:text-slate-100 font-semibold"
              >
                {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {adminUser.role === 'admin' && (
              <a href="/admin" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Admin
              </a>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
              <LogOut className="w-4 h-4" /> Esci
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={prevDay} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:border-slate-300" />
              </button>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 capitalize min-w-[280px] text-center">
                {format(currentDate, "EEEE d MMMM yyyy", { locale: it })}
              </h2>
              <button onClick={nextDay} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <ChevronRight className="w-5 h-5 text-slate-600 dark:border-slate-300" />
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center lg:text-left">
              Totale mezzi previsti in data selezionata: <span className="font-bold text-slate-800 dark:text-slate-200">{bookings.length}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cerca targa o vettore..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <button 
              onClick={() => setShowScanner(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm group"
            >
              <ClipboardList className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              Scansiona QR
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 inline-flex overflow-x-auto w-full sm:w-auto">
          <button onClick={() => setStatusFilter("all")} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
            Tutti i mezzi
          </button>
          <button onClick={() => setStatusFilter("expected")} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${statusFilter === 'expected' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
            In Attesa ({(bookings.filter(b => !b.gateStatus || b.gateStatus === 'expected').length)})
          </button>
          <button onClick={() => setStatusFilter("active")} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${statusFilter === 'active' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
            In Gestione ({(bookings.filter(b => ['arrived', 'loading', 'unloading'].includes(b.gateStatus)).length)})
          </button>
          <button onClick={() => setStatusFilter("completed")} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${statusFilter === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
            Completati ({(bookings.filter(b => b.gateStatus === 'completed').length)})
          </button>
        </div>

        {/* Card Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nessun veicolo trovato</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Corrispondente ai criteri di ricerca forniti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBookings.map((booking, index) => {
              const isEmergency = booking.isEmergency === 1;
              const isExpected = !booking.gateStatus || booking.gateStatus === 'expected';
              const isCompleted = booking.gateStatus === 'completed';
              const isInGate = ['arrived', 'loading', 'unloading'].includes(booking.gateStatus);
              const isFast = booking.pallets < 5 && booking.pallets > 0;

              let cardClasses = isEmergency 
                ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 animate-pulse-subtle shadow-lg shadow-rose-200 dark:shadow-none ring-2 ring-rose-500"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";
                
              let headerClasses = isEmergency
                ? "bg-rose-600 border-rose-600 text-white"
                : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800";
                
              let timeColor = isEmergency ? "text-white" : "text-slate-700 dark:text-slate-200";

              if (!isEmergency) {
                if (isFast) {
                  cardClasses = "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-md";
                  headerClasses = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
                } else if (booking.difficulty === 'standard') {
                  cardClasses = "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/50";
                  headerClasses = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30";
                  timeColor = "text-emerald-900 dark:text-emerald-100";
                } else if (booking.difficulty === 'difficult') {
                  cardClasses = "bg-amber-50/30 dark:bg-amber-950/10 border-amber-300 dark:border-amber-700/50";
                  headerClasses = "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/40";
                  timeColor = "text-amber-900 dark:text-amber-100";
                }
              }

              if (isCompleted) {
                cardClasses = "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-70";
                headerClasses = "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700";
              }

              return (
                <div key={booking.id || `booking-${index}`} className={`rounded-3xl border shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${cardClasses} ${isInGate ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950 scale-[1.02]' : ''}`}>
                  <div className={`px-6 py-4 border-b flex items-center justify-between ${headerClasses}`}>
                    <div className="flex items-center gap-2">
                       {isEmergency ? <AlertCircle className="w-5 h-5 text-white animate-pulse" /> : <Clock className={`w-5 h-5 ${isFast ? 'text-slate-400' : booking.difficulty === 'standard' ? 'text-emerald-500' : booking.difficulty === 'difficult' ? 'text-amber-600' : 'text-rose-500'}`} />}
                       <span className={`text-lg font-bold ${timeColor}`}>{booking.time} {isEmergency && "(URGENTE)"}</span>
                    </div>
                      <div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${booking.operationType === 'Scarico' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {booking.operationType || 'Carico'}
                        </span>
                         {booking.attachment && (
                            <a href={booking.attachment} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-slate-400 hover:text-indigo-600 transition-colors" title="Vedi Allegato">
                              <Paperclip className="w-4 h-4" />
                            </a>
                         )}
                      </div>
                    </div>

                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6 align-top">
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono uppercase mb-2">{booking.licensePlate}</h3>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                          <User className="w-4 h-4 text-slate-400" />
                          {booking.carrierName}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {booking.company && (
                             <button 
                               onClick={() => {
                                 setSelectedUserIdProfile(booking.userId);
                                 setShowProfile(true);
                               }}
                               className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
                             >
                               <Building2 className="w-4 h-4" />
                               {booking.company}
                             </button>
                          )}
                          {booking.phone && (
                             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                               <Phone className="w-3.5 h-3.5 text-slate-400" />
                               {booking.phone}
                             </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Difficulty selection (Restored) */}
                    {!isCompleted && !isFast && (
                      <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-2">Complessità Operazione</p>
                        <div className="flex gap-1 justify-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          {DIFFICULTY_LEVELS.map((lvl) => (
                            <button
                              key={lvl.id}
                              onClick={() => handleDifficultyChange(booking.id, lvl.id)}
                              className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-black transition-all border ${
                                booking.difficulty === lvl.id 
                                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 border-slate-800 shadow-md scale-[1.05]' 
                                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-400'
                              }`}
                            >
                              {lvl.name.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mb-1">Riferimento / Bancali</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {booking.orderRef} — <span className={booking.pallets < 5 ? 'text-indigo-600 font-black' : ''}>{booking.pallets} PLT</span>
                        </p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mb-1">Note</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1 italic" title={booking.notes}>{booking.notes || '—'}</p>
                      </div>
                    </div>

                    {!isCompleted && (
                      <div className="space-y-4 mt-auto">
                        <div className="flex gap-2">
                          {isExpected && (
                             <button onClick={() => setShowArrivalModal(booking)} className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-amber-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                               <Truck className="w-4 h-4" /> REGISTRA ARRIVO
                             </button>
                          )}
                          {isInGate && (
                             <button onClick={() => handleStatusChange(booking.id, 'completed')} className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                               <CheckCircle2 className="w-4 h-4" /> REGISTRA USCITA
                             </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {isCompleted && (
                      <div className="mt-auto text-center">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50 mb-2">
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">✓ Transito Completato</p>
                        {booking.operationStartedAt && booking.completedAt && (
                          <div className="mt-1">
                            {(() => {
                              const mins = getDurationMins(booking.operationStartedAt, booking.completedAt) || 0;
                              let colorClass = "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30";
                              if (mins > 60) colorClass = "text-rose-700 bg-rose-100 dark:bg-rose-900/30";
                              else if (mins > 30) colorClass = "text-amber-700 bg-amber-100 dark:bg-amber-900/30";
                              
                              return (
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tight ${colorClass}`}>
                                  ⏱️ Durata: {mins} min
                                </span>
                              );
                            })()}
                          </div>
                        )}
                        </div>
                        <button onClick={() => handleStatusChange(booking.id, 'expected')} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-tight">
                          Annulla completamento
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {showProfile && selectedUserIdProfile && (
        <UserProfile userId={selectedUserIdProfile} readOnly onClose={() => setShowProfile(false)} />
      )}

      {/* Arrival Confirmation Modal */}
      {showArrivalModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500 p-6 flex items-center justify-between text-white">
               <div className="flex items-center gap-3">
                  <Truck className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Registra Arrivo Mezzo</h3>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{showArrivalModal.time} — {showArrivalModal.licensePlate}</p>
                  </div>
               </div>
               <button onClick={() => setShowArrivalModal(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vettore</p>
                   <p className="font-bold text-slate-800 dark:text-slate-200">{showArrivalModal.carrierName}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Azienda</p>
                   <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{showArrivalModal.company || "—"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                 <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex items-start gap-4">
                    <div className="p-2 bg-amber-500 rounded-lg text-white mt-1">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Verifica documenti e DPI</p>
                      <p className="text-xs text-amber-800/70 dark:text-amber-500/70 italic">Assicurarsi che l'autista indossi scarpe antinfortunistiche e gilet ad alta visibilità prima di procedere al gate.</p>
                    </div>
                 </div>

                 <button 
                   onClick={() => {
                     handleStatusChange(showArrivalModal.id, 'arrived');
                     setShowArrivalModal(null);
                   }}
                   className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-lg font-black shadow-xl transition-all active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 className="w-6 h-6" /> CONFERMA INGRESSO GATE
                 </button>
                 
                 <button 
                   onClick={() => setShowArrivalModal(null)}
                   className="w-full py-3 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                 >
                   ANNULLA
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
