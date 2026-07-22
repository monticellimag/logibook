"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addDays, subDays, setHours, setMinutes, isAfter, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Truck, CheckCircle2, Clock, MapPin, X, LogOut, Upload, User, Phone, Building2, ClipboardList, Calendar, AlertCircle, Plus, LayoutDashboard, UserCircle2 } from "lucide-react";
import { DEPOTS, OPERATION_TYPES } from "@/lib/constants";
import UserProfile from "./UserProfile";

type Booking = {
  id: string;
  date: string;
  depotId: string;
  time: string;
  carrierName: string;
  licensePlate: string;
  company: string;
  phone: string;
  orderRef: string;
  notes: string;
  status: 'pending' | 'completed';
  pallets: number;
  difficulty: string;
  operationType: string;
};

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const EXTRA_HOURS = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

export default function BookingDashboard({ user }: { user: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepotId, setSelectedDepotId] = useState(DEPOTS[0].id);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [selectedPass, setSelectedPass] = useState<Booking | null>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    const lastDepot = localStorage.getItem('logibook_last_depot');
    const savedView = localStorage.getItem('logibook_view_mode') as 'grid' | 'table';
    
    if (lastDepot) setSelectedDepotId(lastDepot);
    if (savedView) setViewMode(savedView);
  }, []);
  const [driverName, setDriverName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [company, setCompany] = useState(user.name || "");
  const [phone, setPhone] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [notes, setNotes] = useState("");
  const [operationType, setOperationType] = useState(OPERATION_TYPES[0]);
  const [macroActivity, setMacroActivity] = useState<'Scarico' | 'Carico' | 'Entrambi'>('Scarico');
  const [cargoType, setCargoType] = useState<'pallets' | 'sfuso'>('pallets');
  const [pallets, setPallets] = useState<number | string>(0);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'Scarico' | 'Carico'>('Scarico');
  const [operationTypeScarico, setOperationTypeScarico] = useState(OPERATION_TYPES[0]);
  const [palletsScarico, setPalletsScarico] = useState<number | string>(0);
  const [operationTypeCarico, setOperationTypeCarico] = useState(OPERATION_TYPES[0]);
  const [palletsCarico, setPalletsCarico] = useState<number | string>(0);
  const [orderRefScarico, setOrderRefScarico] = useState("");
  const [orderRefCarico, setOrderRefCarico] = useState("");

  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const isToday = formattedDate === format(new Date(), "yyyy-MM-dd");
  
  const isFormValid = useMemo(() => {
    // Base mandatory fields for everyone
    const baseValid = driverName.trim() !== "" && licensePlate.trim() !== "" && selectedSlot !== "";
    
    if (!baseValid) return false;

    if (macroActivity === 'Entrambi') {
      return (Number(palletsScarico) > 0) && (Number(palletsCarico) > 0) && (orderRefScarico.trim() !== "") && (orderRefCarico.trim() !== "");
    }
    return Number(pallets) > 0 && orderRef.trim() !== "";
  }, [macroActivity, pallets, palletsScarico, palletsCarico, orderRef, orderRefScarico, orderRefCarico, driverName, licensePlate, selectedSlot]);

  const isSlotInPast = (slotTime: string) => {
    const now = new Date();
    const [h, m] = slotTime.split(':').map(Number);
    const slotDate = new Date(currentDate);
    slotDate.setHours(h, m, 0, 0);
    return isAfter(now, slotDate);
  };

  useEffect(() => {
    fetchBookings();
    fetchHeatmap();
    if (typeof window !== 'undefined') {
       localStorage.setItem('logibook_view_mode', viewMode);
       localStorage.setItem('logibook_last_depot', selectedDepotId);
    }
  }, [formattedDate, selectedDepotId, viewMode]);

  const fetchHeatmap = async () => {
    const month = format(currentDate, "yyyy-MM");
    try {
      const res = await fetch(`/api/bookings/heatmap?month=${month}&depotId=${selectedDepotId}`);
      if (res.ok) {
        const data = await res.json();
        setHeatmap(data);
      }
    } catch (err) {
      console.error("Heatmap fetch error:", err);
    }
  };

  const fetchBookings = async () => {
    if (!selectedDepotId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${formattedDate}&depotId=${selectedDepotId}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleSlotClick = (time: string, isFull: boolean, isLockedByTime: boolean) => {
    if (isFull || isLockedByTime) return;
    setError(null);
    setSelectedSlot(time);
    setDriverName("");
    setLicensePlate("");
    setCompany(user.name || "");
    setPhone("");
    setOrderRef("");
    setNotes("");
    setPallets(0);
    setOperationType(OPERATION_TYPES[0]);
    setOperationTypeScarico(OPERATION_TYPES[0]);
    setPalletsScarico(0);
    setOperationTypeCarico(OPERATION_TYPES[0]);
    setPalletsCarico(0);
    setOrderRefScarico("");
    setOrderRefCarico("");
    setActiveTab('Scarico');
    setFile(null);
  };

  const handleCloseModal = () => {
    setSelectedSlot(null);
    setError(null);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const canSubmit = macroActivity === 'Entrambi' 
      ? (orderRefScarico.trim() !== "" && orderRefCarico.trim() !== "")
      : (orderRef.trim() !== "");

    if (!selectedSlot || !driverName || !licensePlate || !selectedDepotId || !canSubmit) return;

    setIsBooking(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('date', formattedDate);
      formData.append('time', selectedSlot);
      formData.append('depotId', selectedDepotId);
      formData.append('carrierName', driverName);
      formData.append('licensePlate', licensePlate);
      formData.append('company', company);
      formData.append('phone', phone);
      const finalOrderRef = macroActivity === 'Entrambi'
        ? `S:${orderRefScarico} | C:${orderRefCarico}`
        : orderRef;

      formData.append('orderRef', finalOrderRef);
      formData.append('notes', notes);
      
      let fullOperationType = macroActivity === 'Entrambi' 
        ? `Carico+Scarico: ${operationType}` 
        : `${macroActivity}: ${operationType}`;
        
      if (cargoType === 'sfuso' && !fullOperationType.toLowerCase().includes('sfuso')) {
        fullOperationType += ' (Sfuso)';
      }
        
      const totalPallets = macroActivity === 'Entrambi' 
        ? (Number(palletsScarico) || 0) + (Number(palletsCarico) || 0)
        : pallets;

      formData.append('operationType', fullOperationType);
      formData.append('pallets', String(totalPallets));
      formData.append('operationTypeScarico', operationTypeScarico);
      formData.append('palletsScarico', String(palletsScarico));
      formData.append('operationTypeCarico', operationTypeCarico);
      formData.append('palletsCarico', String(palletsCarico));
      formData.append('orderRefScarico', orderRefScarico);
      formData.append('orderRefCarico', orderRefCarico);
      formData.append('difficulty', 'standard');
      formData.append('isEmergency', String(isEmergencyMode));
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore durante la prenotazione");
      }

      await fetchBookings();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBooking(false);
      setIsEmergencyMode(false); // Reset emergency mode after booking
    }
  };

  return (
    <>
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-700 selection:bg-indigo-500 selection:text-white ${isEmergencyMode ? 'shadow-[inset_0_0_100px_rgba(225,29,72,0.15)] bg-rose-50/30' : ''}`}>
      {isEmergencyMode && (
        <div className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 flex items-center justify-center gap-2 animate-pulse sticky top-0 z-[60]">
          <AlertCircle className="w-3 h-3" />
          Modalità Urgenza SOS Attiva — Inserimento Prioritario
          <AlertCircle className="w-3 h-3" />
        </div>
      )}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`p-2.5 rounded-2xl transition-all duration-500 ${isEmergencyMode ? 'bg-rose-600 rotate-12' : 'bg-indigo-600'}`}>
                <Truck className="w-7 h-7 text-white" />
             </div>
             <div>
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-500 tracking-tighter">LogiBook<span className="text-indigo-600">.</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Logistica Uno Ecosystem</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">{user.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{user.role} Vettore</span>
             </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
               <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Griglia"
               >
                 <LayoutDashboard className="w-4 h-4" />
               </button>
               <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Tabella"
               >
                 <ClipboardList className="w-4 h-4" />
               </button>
            </div>

            <button 
              onClick={() => setShowProfile(true)}
              className="text-sm text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1"
            >
              <UserCircle2 className="w-4 h-4" /> Profilo
            </button>
            <button 
              onClick={() => setIsEmergencyMode(!isEmergencyMode)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-lg ${isEmergencyMode ? 'bg-rose-600 text-white shadow-rose-200 ring-4 ring-rose-100 animate-bounce' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 shadow-slate-100'}`}
            >
              <AlertCircle className={`w-4 h-4 ${isEmergencyMode ? 'animate-pulse' : ''}`} />
              {isEmergencyMode ? 'SOS ATTIVO' : 'SOS / EMERGENZA'}
            </button>
            <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Esci">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className={`bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all duration-500 ${isEmergencyMode ? 'border-rose-200' : 'border-slate-100 dark:border-slate-800'}`}>
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isEmergencyMode ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'}`}></div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Agenda Magazzino</h2>
             </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Seleziona il deposito e uno slot libero per la tua prenotazione.</p>
            
            <div className="mt-6 max-w-xs">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Deposito Logistica Uno</label>
              <select 
                value={selectedDepotId} 
                onChange={(e) => setSelectedDepotId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none"
              >
                {DEPOTS.map(d => (
                  <option key={d.id} value={d.id} className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 transition-colors">
            <button onClick={handlePrevDay} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center px-4 w-40 cursor-pointer" onClick={handleToday}>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">{format(currentDate, "EEEE", { locale: it })}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{format(currentDate, "d MMMM yyyy", { locale: it })}</span>
                {heatmap[formattedDate] !== undefined && (
                  <div className={`w-2 h-2 rounded-full ${heatmap[formattedDate] >= 10 ? 'bg-rose-500' : heatmap[formattedDate] >= 7 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                )}
              </div>
            </div>
            <button onClick={handleNextDay} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HOURS.map((time) => {
                const count = bookings.filter((b) => b.time === time).length;
                const isFull = count >= 10;
                const isPast = isSlotInPast(time);
                
                // Rule: block today's bookings unless SOS/Emergency is active
                // Also block full slots or slots in the past
                const isLocked = isFull || isPast || (isToday && !isEmergencyMode);
                
                return (
                  <div key={time} onClick={() => !isLocked && handleSlotClick(time, isFull, isLocked)} className={`relative group p-6 rounded-2xl border transition-all duration-200 ${isLocked ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-70 cursor-not-allowed" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer hover:-translate-y-1"}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center text-lg font-bold text-slate-700 dark:text-slate-200">
                        <Clock className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" />
                        {time}
                      </div>
                      {isFull ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm">Completo</span>
                      ) : isPast ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700">Scaduto</span>
                      ) : (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mezzi</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200 leading-none">{count} / 10</span>
                        </div>
                      )}
                    </div>
                    {isFull ? (
                      <div className="text-sm text-slate-500 flex items-center bg-slate-100/50 p-3 rounded-xl border border-slate-100"><div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>Slot al completo</div>
                    ) : isPast ? (
                      <div className="text-sm text-slate-500 flex items-center bg-slate-100/50 p-3 rounded-xl border border-slate-100"><Clock className="w-4 h-4 mr-2" />Tempo scaduto</div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="text-base font-black tracking-tight text-emerald-700 group-hover:text-white">{10 - count} POSTI LIBERI</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {bookings.some(b => b.time === time && b.id) && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const userBooking = bookings.find(b => b.time === time && b.id);
                                 if (userBooking) setSelectedPass(userBooking);
                               }}
                               className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
                               title="Visualizza Pass"
                             >
                               <ClipboardList className="w-4 h-4" />
                             </button>
                           )}
                           <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Extra Slot Card (SOS) omitted for brevity or integrated if needed */}
            </div>
          ) : (
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                         <th className="px-6 py-4">Orario</th>
                         <th className="px-6 py-4">Stato saturazione</th>
                         <th className="px-6 py-4">Disponibilità</th>
                         <th className="px-6 py-4 text-right">Azione</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {HOURS.map(time => {
                         const count = bookings.filter(b => b.time === time).length;
                         const isFull = count >= 10;
                         const isPast = isSlotInPast(time);
                         const isLocked = isFull || isPast || (isToday && !isEmergencyMode);
                         
                         return (
                            <tr key={time} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isLocked ? 'opacity-50' : ''}`}>
                               <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-400" /> {time}
                               </td>
                               <td className="px-6 py-4">
                                  <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                     <div 
                                      className={`h-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                      style={{ width: `${(count/10)*100}%` }}
                                     ></div>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">{count}/10 Occupati</span>
                               </td>
                               <td className="px-6 py-4">
                                  {isFull ? (
                                     <span className="text-xs font-black text-rose-600 uppercase">Esaurito</span>
                                  ) : isPast ? (
                                     <span className="text-xs font-black text-slate-400 uppercase">Scaduto</span>
                                  ) : (
                                     <span className="text-xs font-black text-emerald-600 uppercase">{10-count} Posti liberi</span>
                                  )}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                     {bookings.some(b => b.time === time && b.id) && (
                                       <button 
                                          onClick={() => {
                                            const userBooking = bookings.find(b => b.time === time && b.id);
                                            if (userBooking) setSelectedPass(userBooking);
                                          }}
                                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                       >
                                          <ClipboardList className="w-4 h-4" />
                                       </button>
                                     )}
                                     <button 
                                        disabled={isLocked}
                                        onClick={() => handleSlotClick(time, isFull, isLocked)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'}`}
                                     >
                                        PRENOTA
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          )}

              {/* Extra Slot Card (SOS only) */}
              {isEmergencyMode && (
                <div 
                  onClick={() => handleSlotClick("", false, false)} 
                  className="relative group p-6 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-800/50 bg-rose-50/30 dark:bg-rose-950/10 hover:border-rose-500 transition-all cursor-pointer hover:-translate-y-1 flex flex-col items-center justify-center gap-4 min-h-[160px]"
                >
                  <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-200 animate-pulse">
                     <Plus className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight uppercase">Orario Personalizzato</span>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mt-1">Sblocca una fascia extra a tua scelta</span>
                  </div>
                </div>
              )}

          {/* Booked Extra Slots Section */}
          {!loading && bookings.filter(b => !HOURS.includes(b.time)).length > 0 && (
            <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2 uppercase tracking-tight">
                <AlertCircle className="w-5 h-5" /> I Tuoi Slot Extra / SOS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.filter(b => !HOURS.includes(b.time)).map((booking) => (
                  <div key={booking.id} className="relative p-6 rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/20 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-lg font-bold text-rose-700 dark:text-rose-400">
                        <Clock className="w-5 h-5 mr-2" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedPass(booking)}
                          className="p-1.5 bg-white dark:bg-slate-800 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shadow-sm border border-rose-100 dark:border-rose-900/40"
                          title="Visualizza Pass"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white uppercase">Emergenza</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2 flex flex-col gap-1">
                      <div className="flex justify-between border-b border-rose-100 dark:border-rose-900/20 pb-1">
                        <span>Targa:</span>
                        <span className="text-slate-900 dark:text-slate-100">{booking.licensePlate}</span>
                      </div>
                      <div className="flex justify-between border-b border-rose-100 dark:border-rose-900/20 pb-1">
                        <span>Tipo:</span>
                        <span className="text-slate-900 dark:text-slate-100">{booking.operationType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rif:</span>
                        <span className="text-slate-900 dark:text-slate-100">{booking.orderRef || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl shadow-lg ${isEmergencyMode ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                  {isEmergencyMode ? <AlertCircle className="w-8 h-8 text-white animate-pulse" /> : <ClipboardList className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isEmergencyMode ? (selectedSlot === "" ? "Richiesta Orario Extra" : "Prenotazione d'Urgenza") : "Nuova Prenotazione"}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">{DEPOTS.find(d => d.id === selectedDepotId)?.name} — {selectedSlot || "Inserimento Orario..."}</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={submitBooking} className="p-8 space-y-6">
              {isEmergencyMode && (
                <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                  Attenzione: Stai effettuando una prenotazione extra fuori slot per emergenza.
                </div>
              )}
              {error && <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-sm font-bold">{error}</div>}
              
              <div className="space-y-8">
                {/* Tipologia Merce / Imballo Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipologia Merce / Imballo</label>
                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
                    <button
                      type="button"
                      onClick={() => setCargoType('pallets')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        cargoType === 'pallets' 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      📦 MERCE SU PALLET / BANCALI
                    </button>
                    <button
                      type="button"
                      onClick={() => setCargoType('sfuso')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        cargoType === 'sfuso' 
                          ? 'bg-amber-600 text-white shadow-md' 
                          : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      🚛 SFUSO (ES. LAVATRICI / COLLI)
                    </button>
                  </div>
                </div>

                {/* Macro Activity Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Direzione Attività</label>
                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
                    {(['Scarico', 'Carico', 'Entrambi'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setMacroActivity(type);
                          if (type === 'Entrambi') setActiveTab('Scarico');
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                          macroActivity === type 
                            ? type === 'Scarico' ? 'bg-amber-500 text-white shadow-md' : type === 'Carico' ? 'bg-blue-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {macroActivity === 'Entrambi' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('Scarico')}
                        className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'Scarico' 
                            ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${Number(palletsScarico) > 0 && orderRefScarico.trim() !== "" ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></div>
                        DETTAGLI SCARICO
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Carico')}
                        className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'Carico' 
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${Number(palletsCarico) > 0 && orderRefCarico.trim() !== "" ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></div>
                        DETTAGLI CARICO
                      </button>
                    </div>
                  </div>
                )}

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl transition-colors duration-500 ${
                  macroActivity === 'Entrambi' 
                    ? activeTab === 'Scarico' ? 'bg-amber-500/5 border-2 border-dashed border-amber-200/50' : 'bg-blue-600/5 border-2 border-dashed border-blue-200/50'
                    : ''
                }`}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      {selectedSlot === "" ? "Ora Personalizzata (HH:mm)" : `Dettaglio Operazione ${macroActivity === 'Entrambi' ? activeTab.toUpperCase() : ''}`}
                    </label>
                    {selectedSlot === "" || EXTRA_HOURS.includes(selectedSlot) ? (
                      <select 
                        required 
                        value={selectedSlot} 
                        onChange={(e) => setSelectedSlot(e.target.value)} 
                        className="w-full px-5 py-4 bg-rose-50 dark:bg-slate-800 border border-rose-200 dark:border-rose-700 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-slate-900 dark:text-white font-bold"
                      >
                        <option value="" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">Seleziona Orario Extra</option>
                        {EXTRA_HOURS.map(h => <option key={h} value={h} className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">{h}</option>)}
                      </select>
                    ) : (
                      <select 
                        value={macroActivity === 'Entrambi' ? (activeTab === 'Scarico' ? operationTypeScarico : operationTypeCarico) : operationType} 
                        onChange={(e) => {
                          if (macroActivity === 'Entrambi') {
                            if (activeTab === 'Scarico') setOperationTypeScarico(e.target.value);
                            else setOperationTypeCarico(e.target.value);
                          } else {
                            setOperationType(e.target.value);
                          }
                        }} 
                        className={`w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none transition-all text-slate-900 dark:text-white font-bold ${
                          macroActivity === 'Entrambi' ? (activeTab === 'Scarico' ? 'focus:ring-amber-500' : 'focus:ring-blue-600') : 'focus:ring-indigo-500'
                        }`}
                      >
                        {OPERATION_TYPES.map(op => (
                          <option key={op} value={op} className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                            {op}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      {cargoType === 'sfuso' 
                        ? `Quantità Pezzi / Colli Sfusi ${macroActivity === 'Entrambi' ? activeTab.toUpperCase() : ''}` 
                        : `Numero Bancali ${macroActivity === 'Entrambi' ? activeTab.toUpperCase() : ''}`}
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={macroActivity === 'Entrambi' ? (activeTab === 'Scarico' ? palletsScarico : palletsCarico) : pallets} 
                      onChange={(e) => {
                        if (macroActivity === 'Entrambi') {
                          if (activeTab === 'Scarico') setPalletsScarico(e.target.value);
                          else setPalletsCarico(e.target.value);
                        } else {
                          setPallets(e.target.value);
                        }
                      }} 
                      className={`w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none transition-all text-slate-900 dark:text-white font-bold ${
                        macroActivity === 'Entrambi' ? (activeTab === 'Scarico' ? 'focus:ring-amber-500' : 'focus:ring-blue-600') : 'focus:ring-indigo-500'
                      }`}
                      placeholder={cargoType === 'sfuso' ? "Es. 180 (Pezzi / Colli Sfusi)" : "Es. 33 (Pallet)"}
                      disabled={isBooking} 
                    />
                  </div>
                  {macroActivity === 'Entrambi' && (
                    <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Riferimento Ordine {activeTab.toUpperCase()}</label>
                      <input 
                        type="text" 
                        required 
                        value={activeTab === 'Scarico' ? orderRefScarico : orderRefCarico} 
                        onChange={(e) => {
                          if (activeTab === 'Scarico') setOrderRefScarico(e.target.value);
                          else setOrderRefCarico(e.target.value);
                        }} 
                        className={`w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none transition-all text-slate-900 dark:text-white font-bold ${
                          activeTab === 'Scarico' ? 'focus:ring-amber-500' : 'focus:ring-blue-600'
                        }`}
                        placeholder={`Inserisci riferimento ordine per lo ${activeTab.toLowerCase()}`}
                        disabled={isBooking} 
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome Autista</label>
                    <input type="text" required value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-bold" placeholder="Nome completo" disabled={isBooking} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Targa Camion</label>
                    <input type="text" required value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-bold uppercase" placeholder="Es. AB123CD" disabled={isBooking} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Azienda</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-bold" disabled={isBooking} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Telefono</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-bold" placeholder="+39 3XX..." disabled={isBooking} />
                  </div>
                </div>

                {macroActivity !== 'Entrambi' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ordine di Carico/Scarico</label>
                    <input type="text" required value={orderRef} onChange={(e) => setOrderRef(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-bold" placeholder="Riferimento ordine" disabled={isBooking} />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Allegato (patente o DDT)</label>
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>

                <button 
                  type="submit" 
                  disabled={isBooking || !isFormValid}
                  className={`w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl ${
                    !isFormValid 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  {isBooking ? "ELABORAZIONE..." : "CONFERMA PRENOTAZIONE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      {/* Digital Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-sm:max-w-xs max-w-sm rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="bg-indigo-600 p-8 text-center text-white relative">
                <button onClick={() => setSelectedPass(null)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                  <Truck className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-2xl font-black tracking-tight mb-1 uppercase">Pass di Accesso</h4>
                <p className="text-white/70 text-sm font-medium">LogiBook Logistics System</p>
             </div>
             
             <div className="p-8 text-center">
                <div className="bg-white p-4 rounded-3xl shadow-inner border border-slate-100 flex items-center justify-center mb-6">
                   <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${selectedPass.id}&size=200x200&bgcolor=ffffff`} 
                      alt="QR Code Pass" 
                      className="w-48 h-48"
                   />
                </div>
                
                <div className="space-y-4 text-left bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                   <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-[10px] uppercase font-black text-slate-400">Deposito</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{DEPOTS.find(d => d.id === selectedPass.depotId)?.name}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-[10px] uppercase font-black text-slate-400">Orario</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{selectedPass.time}</span>
                   </div>
                   <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] uppercase font-black text-slate-400">Targa Mezzo</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{selectedPass.licensePlate}</span>
                   </div>
                </div>
                
                <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">
                   Mostra questo QR Code al gate per velocizzare le operazioni di check-in.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
