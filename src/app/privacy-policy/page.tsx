import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-[2rem] shadow-xl border border-slate-100">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-logistica-action mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Torna alla Home
        </Link>
        <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
          <p>
            Benvenuto sulla piattaforma LogiBook gestita da Logistica Uno Europe S.r.l. La tutela della tua privacy è di fondamentale importanza per noi.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">1. Titolare del Trattamento</h2>
          <p>
            Il Titolare del trattamento dei dati raccolti tramite questa piattaforma è Logistica Uno Europe S.r.l., con sede legale e operativa in Italia.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">2. Tipologia dei Dati Raccolti</h2>
          <p>
            Raccogliamo le seguenti categorie di dati:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dati di navigazione:</strong> Indirizzi IP, nomi a dominio dei computer utilizzati dagli utenti che si connettono al sito, URI/URL delle risorse richieste, l'orario della richiesta.</li>
            <li><strong>Dati forniti volontariamente dall'utente:</strong> Nome, cognome, indirizzo e-mail aziendale, numero di telefono, dettagli sull'azienda di appartenenza per la creazione dell'account e la prenotazione degli slot di carico/scarico.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">3. Finalità del Trattamento</h2>
          <p>
            I dati raccolti vengono elaborati per le seguenti finalità:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Consentire l'accesso all'area riservata della piattaforma LogiBook.</li>
            <li>Gestire in modo efficiente le prenotazioni degli appuntamenti di carico e scarico.</li>
            <li>Ottemperare agli obblighi di legge e alle normative applicabili.</li>
            <li>Migliorare la qualità dei nostri servizi attraverso analisi aggregate anonime.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">4. Diritti dell'Utente (GDPR)</h2>
          <p>
            In conformità al Regolamento UE 2016/679 (GDPR), in qualsiasi momento l'utente ha il diritto di:
            accedere ai propri dati personali, chiederne la rettifica o la cancellazione, la limitazione del trattamento o opporsi allo stesso, oltre al diritto alla portabilità dei dati.
          </p>

          <p className="mt-12 text-sm text-slate-500">
            Ultimo aggiornamento: Aprile 2026<br/>
            Logistica Uno Europe S.r.l.
          </p>
        </div>
      </div>
    </div>
  );
}
