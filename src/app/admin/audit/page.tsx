"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  History, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  User, 
  Activity, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Shield,
  Eye,
  ArrowLeft,
  X,
  ShieldAlert
} from "lucide-react";

type AuditLog = {
  id: number;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ERROR';
  entity: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  ipAddress: string;
  userAgent: string;
  details: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    action: "",
    entity: "",
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.action) params.append('action', filters.action);
      if (filters.entity) params.append('entity', filters.entity);
      
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DELETE': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'LOGIN': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'LOGOUT': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'ERROR': return 'bg-red-600 text-white animate-pulse';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatJSON = (json: string) => {
    try {
      if (!json) return "—";
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <a href="/admin" className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
                <History className="w-8 h-8 text-indigo-600" /> Audit Logs
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Tracciamento attività di sistema LogiBook</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
              <CalendarIcon className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="date" 
                value={filters.date} 
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="bg-transparent text-slate-900 text-sm font-bold outline-none dark:text-white cursor-pointer"
              />
            </div>
            
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
              <Activity className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                value={filters.action} 
                onChange={(e) => setFilters({...filters, action: e.target.value})}
                className="bg-transparent text-slate-900 text-sm font-bold outline-none dark:text-white cursor-pointer"
              >
                <option value="">Tutte le Azioni</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
              <Database className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                value={filters.entity} 
                onChange={(e) => setFilters({...filters, entity: e.target.value})}
                className="bg-transparent text-slate-900 text-sm font-bold outline-none dark:text-white cursor-pointer"
              >
                <option value="">Tutte le Entità</option>
                <option value="booking">Booking</option>
                <option value="user">User</option>
                <option value="slot">Slot</option>
                <option value="auth">Auth</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Data / Ora</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Utente</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Azione</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Entità</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Dettagli</th>
                  <th className="px-6 py-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest">Dati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 bg-slate-50/50 dark:bg-slate-800/20"></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <ShieldAlert className="w-12 h-12 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">Nessun log trovato per i filtri selezionati</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {log.timestamp.split(' ')[1] || log.timestamp}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {log.timestamp.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.userEmail || "Sistema"}</span>
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{log.userRole}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{log.entity}</span>
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                            ID: {log.entityId?.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-[300px] truncate" title={log.details}>
                          {log.details || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded uppercase tracking-tighter">IP: {log.ipAddress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all hover:scale-110"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Dettaglio Log #{selectedLog.id}</h3>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{selectedLog.action} su {selectedLog.entity}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Utente</p>
                  <p className="text-sm font-bold dark:text-white">{selectedLog.userEmail}</p>
                  <p className="text-xs font-bold text-indigo-500 uppercase">{selectedLog.userRole}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Data / Ora</p>
                  <p className="text-sm font-bold dark:text-white">{selectedLog.timestamp}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Variazioni Dati</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-rose-500 uppercase">Valore Precedente</p>
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-2xl text-[10px] overflow-x-auto h-48 border border-slate-800">
                        {formatJSON(selectedLog.oldValue)}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">Nuovo Valore</p>
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-2xl text-[10px] overflow-x-auto h-48 border border-slate-800">
                        {formatJSON(selectedLog.newValue)}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Metadata Connessione</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <p className="font-medium text-slate-600 dark:text-slate-300"><span className="font-bold">IP:</span> {selectedLog.ipAddress}</p>
                    <p className="font-medium text-slate-600 dark:text-slate-300"><span className="font-bold">User Agent:</span> {selectedLog.userAgent}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-transform uppercase tracking-widest text-xs"
              >
                Chiudi Dettaglio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
