"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { format, addDays, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { Truck, ChevronLeft, ChevronRight, LogOut, Printer, Home, Download, Paperclip, Clock, User, MapPin, Users, Plus, Trash2, ShieldCheck, AlertCircle, Camera, Building2, Phone, UserCircle2, X } from "lucide-react";
import { DEPOTS } from "@/lib/constants";
import UserProfile from "./UserProfile";

type Booking = {
  id: string;
  date: string;
  userId: string;
  depotId: string;
  time: string;
  carrierName: string;
  licensePlate: string;
  notes: string;
  attachment?: string;
  createdAt: string;
  gateStatus: string;
  operationType: string;
  company: string;
  orderRef: string;
  operationStartedAt?: string;
  completedAt?: string;
  pallets: number;
  difficulty: string;
  isEmergency: number;
};

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

type Analytics = {
  avgDuration: number;
  reliability: number;
  peakHour: string;
  volumeByDay: { date: string, count: number }[];
};

export default function AdminDashboard({ adminUser }: { adminUser: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepotId, setSelectedDepotId] = useState(adminUser.depotId || DEPOTS[0].id);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'agenda' | 'users' | 'stats'>('agenda');
  const [metrics, setMetrics] = useState<Analytics | null>(null);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', depotId: '' });
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [selectedUserIdProfile, setSelectedUserIdProfile] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const printRef = useRef<HTMLDivElement>(null);

  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const currentDepot = DEPOTS.find(d => d.id === selectedDepotId);

  const displayHours = [...new Set([...HOURS, ...bookings.map(b => b.time)])].sort();

  useEffect(() => {
    if (view === 'agenda') {
      fetchBookings();
    } else if (view === 'users') {
      fetchUsers();
    } else if (view === 'stats') {
      fetchMetrics();
      fetchHeatmap();
    }
  }, [formattedDate, selectedDepotId, view, selectedMonth]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?depotId=${selectedDepotId}`);
      if (res.ok) setMetrics(await res.json());
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await fetch(`/api/bookings/heatmap?month=${selectedMonth}&depotId=${selectedDepotId}`);
      if (res.ok) setHeatmapData(await res.json());
    } catch (err) {
      console.error("Error fetching heatmap:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
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

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Confermi la cancellazione di questa prenotazione?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) await fetchBookings();
    } catch (err) {
      console.error("Error deleting booking:", err);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert("Utente creato con successo!");
      setNewUser({ name: '', email: '', password: '', role: 'user', depotId: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo utente?")) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) return alert("Nessun dato da esportare.");
    const headers = ["Data", "Ora", "Autista", "Azienda", "Targa", "Bancali", "Rif. Ordine", "Tipo Operazione", "Stato", "Inizio", "Fine", "Durata (min)", "SOS"];
    const rows = bookings.map(b => {
      const start = b.operationStartedAt || "";
      const end = b.completedAt || "";
      const duration = (b.operationStartedAt && b.completedAt) 
        ? Math.round((new Date(b.completedAt).getTime() - new Date(b.operationStartedAt).getTime()) / 60000)
        : "";
      
      return [
        format(new Date(b.date), "dd/MM/yyyy"),
        b.time,
        `"${b.carrierName}"`,
        `"${b.company || ""}"`,
        b.licensePlate,
        b.pallets || 0,
        `"${b.orderRef || ""}"`,
        `"${b.operationType || "Carico completo o parziale"}"`,
        b.gateStatus || "expected",
        start, end, duration, b.isEmergency ? "SI" : "NO"
      ].join(";");
    });
    
    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `slotify_export_${formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBookingsForSlot = (time: string) => bookings.filter((b) => b.time === time);

  const totalBooked = bookings.length;
  const totalFree = (HOURS.length * 10) - totalBooked;

  const getDurationMins = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / 60000);
  };

  return (
    <>
      {/* Stili solo per stampa */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .print-area { padding: 0 !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 no-print transition-colors">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Slotify</h1>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  {adminUser.depotId ? `Admin ${currentDepot?.name}` : "Super Admin Modality"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">👤 {adminUser.name}</span>
              {!adminUser.depotId && (
                 <select 
                  value={selectedDepotId} 
                  onChange={(e) => setSelectedDepotId(e.target.value)}
                  className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none dark:text-slate-100"
                >
                  {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
              <a href="/admin/gate" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <MapPin className="w-4 h-4" /> Portineria
              </a>
               <button 
                onClick={() => setView('agenda')}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-colors ${view === 'agenda' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Home className="w-4 h-4" /> Agenda
              </button>
              <button 
                onClick={() => setView('users')}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-colors ${view === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Users className="w-4 h-4" /> Utenti
              </button>
              <button 
                onClick={() => setView('stats')}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-colors ${view === 'stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <ShieldCheck className="w-4 h-4" /> Statistiche
              </button>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                <LogOut className="w-4 h-4" /> Esci
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 print-area">
          {view === 'agenda' ? (
            <>
              {/* Controlli Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Planning: {currentDepot?.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Visualizzazione completa delle prenotazioni per questo deposito.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
                <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-2 text-center min-w-[160px]">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">{format(currentDate, "EEEE", { locale: it })}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{format(currentDate, "d MMMM yyyy", { locale: it })}</p>
                </div>
                <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors">
                Oggi
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl shadow-sm transition-colors">
                <Download className="w-4 h-4" /> CSV
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl shadow-sm transition-colors">
                <Printer className="w-4 h-4" /> Stampa
              </button>
            </div>
          </div>

          {/* Intestazione stampa */}
          <div className="print-only mb-6 border-b pb-4">
            <h1 className="text-3xl font-bold text-slate-900">Slotify — Planning {currentDepot?.name}</h1>
            <p className="text-lg text-slate-600 mt-1 capitalize">{format(currentDate, "EEEE d MMMM yyyy", { locale: it })}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 no-print">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Slot Prenotati</p>
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-500">{totalBooked}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cella / Posti Liberi Totali</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{totalFree}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Capacità Massima (Giornaliera)</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{HOURS.length * 10}</p>
            </div>
          </div>

          {/* Planning Table */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 w-28">Orario</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Vettore / Autista</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">Azienda</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Rif. Ordine</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-20">Bancali</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Stato Check-in</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-20">Doc.</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-24 no-print">Azioni</th>
                  </tr>
                </thead>
                <tbody className="dark:divide-slate-800/50">
                  {displayHours.map((time) => {
                    const slotBookings = getBookingsForSlot(time);
                    
                    return (
                      <Fragment key={time}>
                        {slotBookings.length === 0 ? (
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {time}
                              </div>
                            </td>
                            <td colSpan={7} className="px-4 py-4 text-slate-400 dark:text-slate-500 italic text-xs">
                              Nessun mezzo prenotato in questo slot.
                            </td>
                          </tr>
                        ) : (
                          slotBookings.map((booking, idx) => (
                            <tr key={booking.id} className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${booking.isEmergency ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-900'} hover:bg-slate-50 dark:hover:bg-slate-800/50 ${idx === slotBookings.length - 1 ? 'border-b-2 border-slate-200 dark:border-slate-700' : ''}`}>
                              {idx === 0 && (
                                <td className="px-4 py-4 align-top" rowSpan={slotBookings.length}>
                                  <div className={`flex items-center gap-1.5 font-bold ${booking.isEmergency ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    {time}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1">{slotBookings.length}/10 occupati</div>
                                  {booking.isEmergency === 1 && (
                                     <div className="mt-2 px-2 py-0.5 bg-rose-600 text-[10px] text-white font-black rounded-lg animate-pulse inline-block">URGENZA SOS</div>
                                  )}
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${booking.operationType === 'Scarico' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {booking.operationType || 'Carico'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div 
                                  className="flex flex-col cursor-pointer group"
                                  onClick={() => {
                                    setSelectedUserIdProfile(booking.userId);
                                    setShowProfile(true);
                                  }}
                                >
                                  <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{booking.carrierName}</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-mono">{booking.licensePlate}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-slate-400 text-xs font-bold hover:text-indigo-600 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedUserIdProfile(booking.userId);
                                    setShowProfile(true);
                                  }}
                              >
                                {booking.company || "—"}
                              </td>
                              <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400 text-xs max-w-[150px] truncate" title={booking.orderRef}>
                                {booking.orderRef || "—"}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                {booking.pallets || 0}
                              </td>
                              <td className="px-4 py-3">
                                <select 
                                  value={booking.gateStatus || 'expected'}
                                  onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                  className={`text-xs font-semibold rounded-lg px-2 py-1 border outline-none cursor-pointer transition-colors
                                      ${booking.gateStatus === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 
                                      booking.gateStatus === 'arrived' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400' :
                                      'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`
                                  }
                                >
                                  <option value="expected">In Attesa</option>
                                  <option value="arrived">Mezzo in Gate</option>
                                  <option value="completed">Completato</option>
                                </select>
                                {booking.gateStatus === 'completed' && booking.operationStartedAt && booking.completedAt && (
                                  <div className="mt-1 pl-1">
                                    {(() => {
                                      const mins = getDurationMins(booking.operationStartedAt, booking.completedAt) || 0;
                                      let colorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
                                      if (mins > 60) colorClass = "text-rose-600 bg-rose-50 dark:bg-rose-900/20";
                                      else if (mins > 30) colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
                                      
                                      return (
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${colorClass}`}>
                                          ⏱️ {mins} min
                                        </span>
                                      );
                                    })()}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {booking.attachment ? (
                                    <a href={booking.attachment} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 rounded-lg transition-colors" title="Vedi Allegato">
                                      <Paperclip className="w-4 h-4" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center no-print">
                                <button onClick={() => handleDeleteBooking(booking.id)} className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded-lg transition-colors">
                                  Cancella
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </>
          ) : view === 'stats' ? (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                     <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl w-fit mb-4">
                        <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Durata Media Gate</p>
                     <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{metrics?.avgDuration || 0} min</h4>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                     <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl w-fit mb-4">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Affidabilità Vettori</p>
                     <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{metrics?.reliability || 100}%</h4>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                     <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl w-fit mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ora di Punta</p>
                     <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{metrics?.peakHour || "-"}</h4>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                     <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl w-fit mb-4">
                        <Truck className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Totale Mezzi (7gg)</p>
                     <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {metrics?.volumeByDay.reduce((a,b) => a + b.count, 0) || 0}
                     </h4>
                  </div>
                  <div className={`p-6 rounded-[2rem] border shadow-sm transition-all ${metrics?.sosCount && metrics.sosCount > 0 ? 'bg-rose-600 border-rose-500 text-white animate-pulse' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                     <div className={`p-3 rounded-2xl w-fit mb-4 ${metrics?.sosCount && metrics.sosCount > 0 ? 'bg-white/20' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
                        <AlertCircle className={`w-6 h-6 ${metrics?.sosCount && metrics.sosCount > 0 ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
                     </div>
                     <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${metrics?.sosCount && metrics.sosCount > 0 ? 'text-white/70' : 'text-slate-400'}`}>Urgenze SOS</p>
                     <h4 className="text-3xl font-black tracking-tight">{metrics?.sosCount || 0}</h4>
                  </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight uppercase">Trend Volumi Ultimi 7 Giorni</h3>
                  <div className="h-64 flex items-end gap-3 px-4">
                     {metrics?.volumeByDay.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center group">
                           <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl relative overflow-hidden flex items-end transition-all hover:bg-slate-200 dark:hover:bg-slate-700" style={{ height: '100%' }}>
                              <div 
                                className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 rounded-t-xl transition-all duration-700 ease-out"
                                style={{ height: `${(day.count / Math.max(...metrics.volumeByDay.map(d => d.count), 1)) * 100}%` }}
                              ></div>
                           </div>
                           <span className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-tighter">{format(new Date(day.date), "dd MMM", { locale: it })}</span>
                           <span className="text-xs font-black text-slate-900 dark:text-white mt-1">{day.count}</span>
                        </div>
                     ))}
                     {(!metrics || metrics.volumeByDay.length === 0) && (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-sm">Nessun dato disponibile</div>
                     )}
                  </div>
               </div>

               {/* Heatmap Section */}
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                     <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Saturazione Mensile Deposito</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Carico di lavoro giornaliero nel mese selezionato</p>
                     </div>
                     <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                     />
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                     {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(d => (
                        <div key={d} className="text-[10px] font-black text-slate-400 uppercase text-center pb-2">{d}</div>
                     ))}
                     {(() => {
                        const start = new Date(selectedMonth + "-01");
                        const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                        const firstDayIdx = (start.getDay() + 6) % 7; // Align to Monday
                        
                        const cells = [];
                        for (let i = 0; i < firstDayIdx; i++) {
                           cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                        }
                        
                        for (let d = 1; d <= daysInMonth; d++) {
                           const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
                           const count = heatmapData[dateStr] || 0;
                           
                           // Color intensity based on 10 vehicles per hour, approx 80 per day max
                           // Let's say 40+ is "very busy"
                           const intensity = Math.min(count / 40, 1);
                           const opacity = 0.1 + (intensity * 0.9);
                           
                           cells.push(
                              <div 
                                 key={dateStr}
                                 className="aspect-square rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center group relative cursor-help transition-all hover:scale-105 hover:z-10 bg-white dark:bg-slate-900"
                              >
                                 <div 
                                    className="absolute inset-0 rounded-lg transition-colors" 
                                    style={{ 
                                       backgroundColor: count > 0 ? `rgba(79, 70, 229, ${opacity})` : 'transparent',
                                       border: count > 30 ? '2px solid rgba(79, 70, 229, 0.5)' : 'none'
                                    }}
                                 ></div>
                                 <span className={`relative text-[10px] font-bold ${count > 20 ? 'text-white' : 'text-slate-500'}`}>{d}</span>
                                 {count > 0 && (
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded pointer-events-none whitespace-nowrap shadow-xl z-50">
                                       {count} PRENOTAZIONI
                                    </div>
                                 )}
                              </div>
                           );
                        }
                        return cells;
                     })()}
                  </div>
                  
                  <div className="mt-8 flex items-center justify-end gap-6">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-indigo-500/10"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Libero</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-indigo-500/50"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Medio</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-indigo-600 border border-indigo-400"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Saturo</span>
                     </div>
                  </div>
               </div>
         </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  {/* Form Creazione */}
                  <div className="w-full md:w-80 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-indigo-600" /> Nuovo Utente
                    </h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Nome</label>
                        <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Email</label>
                        <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                        <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Ruolo</label>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100">
                          <option value="user">Vettore (User)</option>
                          <option value="gate">Portineria (Gate)</option>
                          <option value="admin">Amministratore (Admin)</option>
                        </select>
                      </div>
                      {(newUser.role === 'gate' || newUser.role === 'admin') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Deposito Associato</label>
                          <select value={newUser.depotId} onChange={e => setNewUser({...newUser, depotId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100">
                            <option value="">Nessuno (Super Admin)</option>
                            {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                      )}
                      <button disabled={userActionLoading} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                        {userActionLoading ? "Creazione..." : <><Plus className="w-4 h-4"/> Crea Utente</>}
                      </button>
                    </form>
                  </div>

                  {/* Tabella Utenti */}
                  <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Utenti Registrati</h3>
                      <span className="text-xs text-slate-500">{users.length} utenti totali</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Nome / Email</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Ruolo</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Deposito</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400 w-20">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-4 text-xs">
                                <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                                <p className="text-slate-500">{u.email}</p>
                              </td>
                              <td className="px-4 py-4 text-xs">
                                <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                                  u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                  u.role === 'gate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 italic">
                                {u.depotId ? DEPOTS.find(d => d.id === u.depotId)?.name : <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400"><ShieldCheck className="w-3 h-3"/> Tutti</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Profile Modal */}
      {showProfile && selectedUserIdProfile && (
        <UserProfile userId={selectedUserIdProfile} readOnly onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}
