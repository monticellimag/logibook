import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-[2rem] shadow-xl border border-slate-100">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-logistica-action mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Torna alla Home
        </Link>
        <h1 className="text-4xl font-black text-slate-900 mb-8">Cookies Policy</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
          <p>
            Questo sito web ("LogiBook") utilizza i cookie per offrirti un'esperienza di navigazione personalizzata e per comprendere come gli utenti interagiscono con i nostri servizi.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Cosa sono i cookie?</h2>
          <p>
            I cookie sono piccoli file di testo che vengono salvati sul tuo dispositivo quando visiti un sito web. Consentono al sito di ricordare le tue azioni e preferenze (come login, lingua, dimensione dei caratteri e altre impostazioni di visualizzazione) per un periodo di tempo prolungato.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Tipologie di cookie utilizzati</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cookie Tecnici (Essenziali):</strong> Sono strettamente necessari per il funzionamento del sito web e per l'utilizzo delle sue funzionalità, come l'accesso alle aree sicure della piattaforma LogiBook.</li>
            <li><strong>Cookie di Analisi:</strong> Ci aiutano a capire come i visitatori interagiscono con il sito raccogliendo e trasmettendo informazioni in forma anonima.</li>
            <li><strong>Cookie di Profilazione:</strong> Sono utilizzati per tracciare i visitatori attraverso i siti web con l'intento di mostrare annunci pertinenti e coinvolgenti. (LogiBook non utilizza cookie di profilazione di prima parte).</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Gestione dei cookie</h2>
          <p>
            Puoi controllare e/o cancellare i cookie come preferisci. Puoi cancellare tutti i cookie già presenti sul tuo computer e impostare quasi tutti i browser in modo da bloccarne l'installazione. Tuttavia, se scegli di farlo, potresti dover regolare manualmente alcune preferenze ogni volta che visiti il sito e alcuni servizi o funzionalità potrebbero non funzionare.
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
