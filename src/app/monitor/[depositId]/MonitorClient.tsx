"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Truck, Maximize } from "lucide-react";
import { format } from "date-fns";

type Bay = {
  id: string;
  bayNumber: number;
  bayName: string;
  computedState: 'free' | 'occupied' | 'maintenance';
  activeTransit?: { id: string; licensePlate: string; carrierName?: string; operationType?: string; pallets?: number } | null;
  queuedCount?: number;
  queuedTransits?: { id: string; licensePlate: string; time: string; operationType?: string }[];
  maxQueue?: number;
};

type Transit = {
  id: string;
  licensePlate: string;
  time: string; // Arrival time expected
  operationStartedAt?: string;
  completedAt?: string;
  bay?: string;
  bayId?: string;
  gateStatus: string;
  operationType: string;
  queuePos?: number;
  totalQueue?: number;
  isEmergency?: number;
};

export default function MonitorClient({ depositId }: { depositId: string }) {
  const searchParams = useSearchParams();
  const fullscreenParam = searchParams.get("fullscreen");
  
  const [bays, setBays] = useState<Bay[]>([]);
  const [transits, setTransits] = useState<Transit[]>([]);
  const [now, setNow] = useState(new Date());
  const [hasStarted, setHasStarted] = useState(false);

  // Polling data
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/monitor/${depositId}`);
      if (res.ok) {
        const data = await res.json();
        setBays(data.bays || []);
        setTransits(data.transits || []);
      }
    } catch (err) {
      console.error("Monitor fetch error:", err);
    }
  };

  useEffect(() => {
    if (hasStarted) {
      fetchData();
      const fetchInterval = setInterval(fetchData, 5000); // 5 seconds polling
      const timeInterval = setInterval(() => setNow(new Date()), 1000); // 1 second clock update
      return () => {
        clearInterval(fetchInterval);
        clearInterval(timeInterval);
      };
    }
  }, [hasStarted, depositId]);

  // Handle Fullscreen
  const tryFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen requires user interaction");
    }
    setHasStarted(true);
  };

  useEffect(() => {
    if (fullscreenParam === "true" && !hasStarted) {
      // Prompt user or start directly
    }
  }, [fullscreenParam, hasStarted]);

  if (!hasStarted) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center font-roboto overflow-hidden">
        <button 
          onClick={tryFullscreen}
          className="px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-3xl font-black shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4"
        >
          <Maximize className="w-10 h-10" />
          Avvia Live Monitor Baie
        </button>
      </div>
    );
  }

  const getDuration = (startedAt?: string, completedAt?: string, status?: string) => {
    if (!startedAt) return "—";
    
    let endTime = now.getTime();
    if (status === 'completed' && completedAt) {
      endTime = new Date(completedAt).getTime();
    }

    const diff = endTime - new Date(startedAt).getTime();
    if (diff < 0) return "00:00";

    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Dynamic grid column and typography scaling depending on the total bay count
  let gridCols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  let numberSize = "text-4xl lg:text-6xl";
  let nameSize = "text-lg lg:text-xl";
  let badgeSize = "text-xs lg:text-sm px-3 py-1";
  let cardPadding = "p-3";

  if (bays.length > 15) {
    gridCols = "grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6";
    numberSize = "text-xl lg:text-2xl font-black";
    nameSize = "text-[10px] font-semibold";
    badgeSize = "text-[8px] lg:text-[9px] px-1.5 py-0.5";
    cardPadding = "p-1";
  } else if (bays.length > 10) {
    gridCols = "grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
    numberSize = "text-2xl lg:text-3xl font-black";
    nameSize = "text-xs font-semibold";
    badgeSize = "text-[9px] lg:text-[10px] px-2 py-0.5";
    cardPadding = "p-1.5";
  } else if (bays.length > 6) {
    gridCols = "grid-cols-3 md:grid-cols-4 lg:grid-cols-4";
    numberSize = "text-3xl lg:text-4xl font-black";
    nameSize = "text-sm font-semibold";
    badgeSize = "text-xs px-2.5 py-0.5";
    cardPadding = "p-2";
  }

  return (
    <div className="h-screen w-screen max-h-screen max-w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-roboto selection:bg-indigo-500/30">
      {/* GLOBAL STYLES FOR ROBOTO & HIDING SCROLLBARS */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        .font-roboto { font-family: 'Roboto', sans-serif; }
        ::-webkit-scrollbar { display: none; }
        html, body { overflow: hidden !important; height: 100%; margin: 0; padding: 0; }
      `}} />

      {/* HEADER BAR (Minimal) */}
      <div className="h-[6vh] min-h-[40px] bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-indigo-500" />
          <h1 className="text-xl font-black tracking-widest uppercase text-slate-200">
            LOGIBOOK <span className="text-indigo-400">LIVE</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={tryFullscreen}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all active:scale-95"
            title="Attiva Schermo Intero"
          >
            <Maximize className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Tutto Schermo</span>
          </button>
          <div className="flex items-center gap-3 text-emerald-400 font-black tracking-widest text-lg">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
            {format(now, 'HH:mm:ss')}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT (94vh) - Strictly Flexed without page scrolling */}
      <div className="flex-1 flex flex-col p-3 gap-3 h-[94vh] overflow-hidden box-border">
        
        {/* BAYS SECTION (Dynamic 58-62%) */}
        <div className="flex-[0.6] min-h-0 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h2 className="text-lg lg:text-xl font-black uppercase text-slate-400 tracking-widest">
              Stato Baie in Tempo Reale
            </h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Totale: {bays.length} baie
            </span>
          </div>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className={`grid ${gridCols} gap-2.5 h-full auto-rows-fr overflow-y-auto pr-1`}>
              {bays.length === 0 ? (
                <div className="col-span-full flex items-center justify-center text-slate-500 font-bold text-xl">
                  Nessuna baia configurata.
                </div>
              ) : (
                bays.map((bay) => {
                  let bgColor = "bg-emerald-500/10";
                  let borderColor = "border-emerald-500/30";
                  let textColor = "text-emerald-400"; // #10B981 equivalent
                  let statusText = "● LIBERA";
                  let shadowClass = "shadow-[0_0_20px_rgba(16,185,129,0.08)]";

                  if (bay.computedState === 'occupied') {
                    bgColor = "bg-pink-500/10";
                    borderColor = "border-pink-500/40";
                    textColor = "text-pink-400"; // #EC4899 equivalent
                    statusText = "● OCCUPATA";
                    shadowClass = "shadow-[0_0_25px_rgba(236,72,153,0.15)]";
                  } else if (bay.computedState === 'maintenance') {
                    bgColor = "bg-amber-500/10";
                    borderColor = "border-amber-500/40";
                    textColor = "text-amber-400"; // #F59E0B equivalent
                    statusText = "● MANUTENZIONE";
                    shadowClass = "shadow-[0_0_20px_rgba(245,158,11,0.08)]";
                  }

                  const isActive = bay.computedState === 'occupied';

                  return (
                    <div 
                      key={bay.id} 
                      className={`relative flex flex-col items-center justify-between rounded-xl border-2 transition-all duration-300 ${bgColor} ${borderColor} ${shadowClass} ${cardPadding} ${isActive ? 'scale-[1.01]' : 'scale-100'} overflow-hidden min-h-0 h-full`}
                    >
                      {/* Top: Main Bay Name (e.g. A1, A2 or 1) */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <span className={`${numberSize} leading-none ${textColor} drop-shadow-md`}>
                          {bay.bayName || bay.bayNumber}
                        </span>
                      </div>

                      {/* Middle: Status Badge */}
                      <div className={`rounded-full border border-current bg-slate-950/60 backdrop-blur-sm ${textColor} ${badgeSize} shrink-0 ${isActive ? 'animate-pulse' : ''}`}>
                        <span className="font-black tracking-wider uppercase whitespace-nowrap">{statusText}</span>
                      </div>

                      {/* Bottom: Active Plate + Operation Type & Pallets or Queue Count */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-full min-h-[22px] gap-0.5">
                        {bay.activeTransit ? (
                          <div className="flex flex-col items-center gap-0.5 max-w-full">
                            <div className="font-mono text-[9px] lg:text-[10px] font-black text-pink-300 bg-pink-950/80 border border-pink-500/40 px-1.5 py-0.5 rounded-md truncate max-w-full text-center leading-none">
                              🚚 {bay.activeTransit.licensePlate}
                            </div>
                            <div className="text-[8px] lg:text-[9px] font-bold text-slate-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1 leading-none truncate max-w-full">
                              <span className={bay.activeTransit.operationType?.toLowerCase().includes('scarico') ? 'text-amber-400 font-black' : 'text-blue-400 font-black'}>
                                {bay.activeTransit.operationType || 'Carico'}
                              </span>
                              {bay.activeTransit.pallets !== undefined && (
                                <>
                                  <span className="text-slate-500">•</span>
                                  <span className="font-mono text-slate-200">{bay.activeTransit.pallets} panc.</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : bay.queuedCount && bay.queuedCount > 0 ? (
                          <div className="text-[8px] lg:text-[9px] font-black text-amber-400 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded-md animate-pulse text-center leading-none">
                            ⏳ In coda ({bay.queuedCount}/5)
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* TRANSITS SECTION (Dynamic 38-40%) */}
        <div className="flex-[0.4] min-h-0 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4 shadow-2xl flex flex-col overflow-hidden">
          <h2 className="text-lg lg:text-xl font-black uppercase text-slate-400 mb-2 tracking-widest shrink-0">
            Ultimi Transiti
          </h2>
          
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-800/50 bg-slate-950/50 flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 sticky top-0 z-10">
                  <tr className="border-b border-slate-800">
                    <th className="p-2.5 text-slate-400 font-black uppercase tracking-wider text-sm lg:text-base">Targa</th>
                    <th className="p-2.5 text-slate-400 font-black uppercase tracking-wider text-sm lg:text-base">Arrivo</th>
                    <th className="p-2.5 text-slate-400 font-black uppercase tracking-wider text-sm lg:text-base">Baia</th>
                    <th className="p-2.5 text-slate-400 font-black uppercase tracking-wider text-sm lg:text-base">Tipo</th>
                    <th className="p-2.5 text-slate-400 font-black uppercase tracking-wider text-sm lg:text-base">Stato</th>
                    <th className="p-2.5 text-slate-400 font-black uppercase tracking-wider text-sm lg:text-base">Durata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {transits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 font-bold text-base">
                        Nessun transito registrato per oggi.
                      </td>
                    </tr>
                  ) : (
                    transits.map((transit, index) => {
                      const isFirst = index === 0;
                      const isCompleted = transit.gateStatus === 'completed';
                      const isInProgress = ['arrived', 'loading', 'unloading'].includes(transit.gateStatus);
                      const isScarico = transit.operationType?.toLowerCase().includes('scarico');
                      const opLabel = isScarico ? 'SCARICO' : 'CARICO';
                      
                      return (
                        <tr 
                          key={transit.id} 
                          className={`transition-colors ${isFirst ? 'bg-indigo-950/30' : 'hover:bg-slate-900/50'}`}
                        >
                          {/* Targa */}
                          <td className="p-2.5 font-mono text-base lg:text-lg font-black text-slate-100 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span>{transit.licensePlate}</span>
                              {transit.isEmergency === 1 && (
                                <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-md animate-pulse tracking-tight shrink-0 shadow-sm">
                                  ⚡ PRIORITÀ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Orario Arrivo */}
                          <td className="p-2.5 text-sm lg:text-base font-bold text-slate-300">
                            {transit.operationStartedAt ? new Date(transit.operationStartedAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'}) : transit.time}
                          </td>

                          {/* Baia */}
                          <td className="p-2.5">
                            {transit.bay ? (
                              <span className="font-mono text-sm lg:text-base font-black text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 px-2 py-0.5 rounded-lg inline-block">
                                {transit.bay}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-bold text-sm">—</span>
                            )}
                          </td>

                          {/* Tipo Operazione */}
                          <td className="p-2.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider inline-block ${
                              isScarico 
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}>
                              {opLabel}
                            </span>
                          </td>

                          {/* Stato */}
                          <td className="p-2.5">
                            {isCompleted ? (
                              <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black text-xs rounded-full uppercase tracking-wider inline-block">
                                ✓ COMPLETATO
                              </span>
                            ) : isInProgress ? (
                              <span className="px-2.5 py-0.5 bg-pink-500/15 text-pink-400 border border-pink-500/30 font-black text-xs rounded-full uppercase tracking-wider inline-block animate-pulse">
                                ● IN CORSO
                              </span>
                            ) : transit.bay ? (
                              <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black text-xs rounded-full uppercase tracking-wider inline-block">
                                ⏳ IN CODA ({transit.queuePos || 1}/{transit.totalQueue || 1})
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs rounded-full uppercase tracking-wider inline-block">
                                IN ATTESA
                              </span>
                            )}
                          </td>

                          {/* Durata */}
                          <td className="p-2.5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono tracking-widest border inline-block ${
                              isInProgress 
                                ? 'bg-pink-950/70 text-pink-300 border-pink-500/40 shadow-sm' 
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              {getDuration(transit.operationStartedAt, transit.completedAt, transit.gateStatus)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
