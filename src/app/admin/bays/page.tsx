"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEPOTS } from "@/lib/constants";
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Grid,
  Loader2,
  X
} from "lucide-react";

type Bay = {
  id: string;
  depositId: string;
  bayNumber: number;
  bayName: string;
  status: "available" | "maintenance";
  createdAt: string;
};

export default function BaysManagementPage() {
  const router = useRouter();
  const [selectedDepotId, setSelectedDepotId] = useState(DEPOTS[0].id);
  const [bays, setBays] = useState<Bay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBay, setEditingBay] = useState<Bay | null>(null);
  const [modalData, setModalData] = useState({
    bayNumber: "",
    bayName: "",
    status: "available" as "available" | "maintenance"
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchBays();
  }, [selectedDepotId]);

  const fetchBays = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bays?depositId=${selectedDepotId}`);
      if (res.ok) {
        setBays(await res.json());
      } else {
        const errData = await res.json();
        setError(errData.error || "Errore nel caricamento delle baie");
      }
    } catch (err) {
      console.error("Error fetching bays:", err);
      setError("Errore di rete nel caricamento delle baie");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBay(null);
    setModalData({
      bayNumber: "",
      bayName: "",
      status: "available"
    });
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (bay: Bay) => {
    setEditingBay(bay);
    setModalData({
      bayNumber: bay.bayNumber.toString(),
      bayName: bay.bayName,
      status: bay.status
    });
    setModalError("");
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    const payload = {
      depositId: selectedDepotId,
      bayNumber: parseInt(modalData.bayNumber),
      bayName: modalData.bayName,
      status: modalData.status
    };

    if (isNaN(payload.bayNumber) || payload.bayNumber <= 0) {
      setModalError("Il numero baia deve essere un numero intero positivo");
      setModalLoading(false);
      return;
    }

    if (!payload.bayName.trim()) {
      setModalError("Il nome della baia è obbligatorio");
      setModalLoading(false);
      return;
    }

    try {
      const endpoint = editingBay ? `/api/admin/bays/${editingBay.id}` : "/api/admin/bays";
      const method = editingBay ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingBay ? "Baia aggiornata con successo!" : "Baia aggiunta con successo!");
        setShowModal(false);
        fetchBays();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setModalError(data.error || "Errore nel salvataggio della baia");
      }
    } catch (err) {
      setModalError("Errore di connessione al server");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBay = async (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la baia "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/bays/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccess("Baia eliminata con successo!");
        fetchBays();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json();
        setError(data.error || "Impossibile eliminare la baia");
      }
    } catch (err) {
      setError("Errore durante l'eliminazione della baia");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors pb-12">
      {/* Navbar di test */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Torna al Planning
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <span className="font-black text-slate-700 dark:text-white tracking-wider">GESTIONE STRUTTURA</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Grid className="w-8 h-8 text-indigo-500" /> Gestione Baie di Carico/Scarico
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configura il parco baie fisiche per ciascun deposito dell'ecosistema LogiBook.</p>
          </div>
          
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] font-bold text-white shadow-xl shadow-indigo-600/10 transition-all"
          >
            <Plus className="w-4 h-4" /> Aggiungi Baia
          </button>
        </div>

        {/* Notifiche */}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm font-semibold flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" /> {error}
          </div>
        )}

        {/* Selettore Deposito */}
        <div className="mb-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Seleziona Deposito</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {DEPOTS.map((depot) => (
              <button
                key={depot.id}
                onClick={() => setSelectedDepotId(depot.id)}
                className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all ${
                  selectedDepotId === depot.id 
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-white shadow-lg shadow-indigo-500/5 dark:bg-indigo-600/20" 
                    : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {depot.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabella Baie */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <span className="font-bold text-sm">Caricamento baie...</span>
            </div>
          ) : bays.length === 0 ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Nessuna baia configurata</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mx-auto">Non ci sono ancora baie registrate per questo deposito. Clicca su "Aggiungi Baia" in alto per crearne una.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Numero Baia</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nome / Descrizione</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stato</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {bays.map((bay) => (
                    <tr key={bay.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="p-6 font-mono font-black text-xl text-slate-800 dark:text-white">
                        #{bay.bayNumber}
                      </td>
                      <td className="p-6 font-bold text-slate-700 dark:text-slate-200">
                        {bay.bayName}
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          bay.status === 'available' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${bay.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          {bay.status === 'available' ? 'Attiva' : 'Manutenzione'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(bay)}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                            title="Modifica"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBay(bay.id, bay.bayName)}
                            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 text-rose-500 transition-all"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Aggiungi / Modifica */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingBay ? "Modifica Baia" : "Nuova Baia di Carico"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Numero Baia</label>
                <input
                  type="number"
                  required
                  placeholder="Es. 1"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all"
                  value={modalData.bayNumber}
                  onChange={e => setModalData({ ...modalData, bayNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome Baia / Descrizione</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Baia Nord - Ristretti"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all font-semibold"
                  value={modalData.bayName}
                  onChange={e => setModalData({ ...modalData, bayName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Stato Operativo</label>
                <select
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all font-bold"
                  value={modalData.status}
                  onChange={e => setModalData({ ...modalData, status: e.target.value as any })}
                >
                  <option value="available">Attiva / Disponibile</option>
                  <option value="maintenance">In Manutenzione</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-slate-300 text-sm transition-all"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm transition-all disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingBay ? "Salva Modifiche" : "Crea Baia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
