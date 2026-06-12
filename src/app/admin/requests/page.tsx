"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Building2, 
  Mail, 
  Phone, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";

type Request = {
  id: string;
  name: string;
  email: string;
  vatNumber: string;
  contactPerson: string;
  phone: string;
  interested_depots: string;
  notes: string;
  requested_at: string;
  status: string;
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [tempPassword, setTempPassword] = useState<{ id: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/requests");
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Confermi di voler approvare questa richiesta di accesso? Verrà attivato l'account e generata una password temporanea.")) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      
      let data: any = {};
      try { data = await res.json(); } catch {}
      
      if (res.ok) {
        setTempPassword({ id, password: data.tempPassword });
        setRequests(prev => prev.filter(r => r.id !== id));
      } else {
        const errorMsg = data.message || data.error || 'Risposta non valida dal server';
        alert(`Errore ${res.status}: ${errorMsg}`);
      }
    } catch (err) {
      alert("Errore di connessione al server");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert("La motivazione è obbligatoria per rifiutare una richiesta.");
      return;
    }
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
        setRejectingId(null);
        setRejectReason("");
      } else {
        alert(data.error || "Errore durante il rifiuto");
      }
    } catch (err) {
      alert("Errore di connessione");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/admin')}
            className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
              <UserCheck className="w-8 h-8 text-indigo-600" /> Richieste Accesso
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestione approvazioni nuovi vettori</p>
          </div>
        </div>

        {/* Temporary Password Modal */}
        {tempPassword && (
          <div className="mb-8 p-6 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-2xl animate-fade-in-up">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-black text-orange-800 dark:text-orange-400 mb-2 uppercase">Richiesta Approvata!</h3>
                <p className="text-orange-700 dark:text-orange-300 font-medium mb-4">
                  L'account è stato attivato con successo. L'utente dovrà cambiare password al primo accesso.
                </p>
                <div className="bg-white dark:bg-orange-950 p-4 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm inline-flex items-center gap-4">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Password Temporanea (NON SALVATA)</p>
                    <p className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-wider">{tempPassword.password}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword.password);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    title="Copia password"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {copied && (
                  <span className="ml-3 text-xs font-bold text-green-600 animate-pulse uppercase">Copiato negli appunti!</span>
                )}
                <div className="mt-4 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg inline-flex">
                  <AlertCircle className="w-4 h-4" />
                  Copia e comunica questa password al vettore ORA. Non sarà più visibile.
                </div>
                <button 
                  onClick={() => setTempPassword(null)}
                  className="block mt-6 px-6 py-2 bg-orange-600 text-white font-bold rounded-xl shadow-md hover:bg-orange-700 transition-colors"
                >
                  Ho copiato la password, chiudi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
              <UserCheck className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Nessuna richiesta in sospeso</h3>
              <p className="text-slate-500 mt-2">Tutte le richieste di accesso sono state gestite.</p>
            </div>
          ) : (
            requests.map((req) => {
              const depots = req.interested_depots ? JSON.parse(req.interested_depots) : [];
              return (
                <div key={req.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col lg:flex-row gap-8 justify-between">
                    
                    {/* Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">{req.name}</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-24 flex-shrink-0">P.IVA</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono">{req.vatNumber || "—"}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-24 flex-shrink-0">Referente</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{req.contactPerson || "—"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <a href={`mailto:${req.email}`} className="text-sm font-medium text-indigo-600 hover:underline">{req.email}</a>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{req.phone || "—"}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-4 text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">
                            Richiesta del {format(new Date(req.requested_at), "dd MMM yyyy, HH:mm", { locale: it })}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {req.notes && (
                            <div>
                              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Note Aggiuntive</span>
                              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                {req.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-6 justify-center">
                      {rejectingId === req.id ? (
                        <div className="space-y-3 animate-fade-in-up">
                          <textarea 
                            autoFocus
                            placeholder="Motivazione del rifiuto..."
                            className="w-full text-sm p-3 border border-rose-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 resize-none bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800 dark:text-white"
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setRejectingId(null)}
                              className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                              Annulla
                            </button>
                            <button 
                              onClick={() => handleReject(req.id)}
                              disabled={processingId === req.id}
                              className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                              Conferma Rifiuto
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              handleApprove(req.id);
                            }}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <UserCheck className="w-5 h-5" /> Approva Richiesta
                          </button>
                          <button 
                            onClick={() => { setRejectingId(req.id); setRejectReason(""); }}
                            disabled={processingId === req.id || !!tempPassword}
                            className="w-full py-3 bg-white dark:bg-slate-900 border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <UserX className="w-5 h-5" /> Rifiuta
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
