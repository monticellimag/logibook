# LOGIBOOK - Project Status & Roadmap

Questo documento fornisce un riepilogo dello stato di avanzamento dello sviluppo di **LogiBook** (in precedenza Slotify) e definisce le priorità per le prossime implementazioni necessarie prima del rilascio in produzione.

---

## 📊 Stato Attuale del Progetto (Implementato)

Il sistema è strutturato come un'applicazione Next.js 16 (App Router) con database relazionale PostgreSQL gestito tramite Supabase e integrato con Drizzle ORM. L'interfaccia utente adotta uno stile enterprise premium in Dark/Light Mode.

### 1. Fondamenta e Sicurezza
*   **Database Cloud-Native**: Schema PostgreSQL completo per utenti, prenotazioni, depositi, sessioni e log di audit.
*   **Autenticazione basata sui Ruoli**: Tre permessi distinti: **Vettori (User)**, **Amministratori (Admin)** e **Portineria (Gate)**.
*   **Protezione degli Accessi**: Hash crittografici (`bcryptjs`) e policy di sicurezza con obbligo di cambio password al primo accesso per le password temporanee.
*   **Gestione Onboarding**: Flusso completo per i vettori con registrazione in stato `PENDING` e modulo di approvazione/rifiuto lato Admin.

### 2. Area Vettori (Booking Dashboard)
*   **Agenda Digitale**: Visualizzazione della disponibilità degli slot orari (limite 10 mezzi per ora).
*   **Prenotazione Intelligente**: Selezione di tipo operazione, numero bancali, nome autista e targa del mezzo.
*   **Gestione "ENTRAMBI" (Scarico + Carico)**: Interfaccia a tab coordinata (Scarico Arancio / Carico Blu) per l'inserimento di referenze e bancali separati.
*   **Vincolo Temporale e SOS**: Blocco prenotazioni dopo le ore 15:00 del giorno precedente con toggle SOS/Emergenza per sblocco istantaneo.
*   **Digital Pass**: Generazione automatica di un pass con QR Code per ogni prenotazione, per il check-in rapido al gate.
*   **Caricamento Documentale**: Possibilità di allegare DDT o patente durante la prenotazione.

### 3. Area Amministratori (Admin Dashboard)
*   **Multi-Deposito**: Cambiamento di contesto immediato magazzino/hub (Monticelli, Oppeano, Caivano).
*   **Gestione Flussi**: Visualizzazione, cancellazione e aggiornamento delle prenotazioni.
*   **Cruscotto Statistiche**: Calcolo volumi "Bancali IN" e "Bancali OUT", distribuzione % delle operazioni e tempo di permanenza medio dei mezzi nel deposito.
*   **Mappa Termica (Heatmap)**: Calendario mensile della saturazione dei depositi con funzionalità "Jump-to-Day".
*   **Data Export**: Esportazione in formato CSV nativo per analisi avanzate su Excel.
*   **Audit Dashboard**: Visualizzazione in tempo reale delle variazioni JSON (`oldValue` vs `newValue`) per ragioni di sicurezza aziendale.

### 4. Area Hub / Portineria (Gate Dashboard)
*   **Live Monitor**: Visualizzazione in tempo reale degli arrivi giornalieri previsti.
*   **Check-in & Check-out**: Gestione dello stato del mezzo (In Attesa -> Arrivato -> Completato) con calcolo automatico del tempo di permanenza (KPI).
*   **Assegnazione Baie**: Assegnazione contestuale della baia di carico/scarico all'autista all'arrivo.
*   **Stampa Foglio di Marcia**: Stampa A4 ottimizzata della lista mezzi giornaliera per portineria con spazi firma.

---

## 🚦 Roadmap delle Implementazioni Future (MoSCoW)

### 🔴 MUST (Indispensabili per il lancio)
1.  **Supporto Multilingua (i18n)**:
    *   Gli autisti dei vettori provengono spesso da contesti internazionali. È essenziale tradurre l'interfaccia vettori e i pass in lingua **Inglese, Polacca e Rumena**.
2.  **Validazione Targa/Partita IVA avanzata**:
    *   Sanitizzazione e controllo formale delle targhe inserite (es. formati europei standard) per evitare dati sporchi.

### 🟡 SHOULD (Importanti ma non bloccanti)
1.  **Notifica Mail automatica**:
    *   Invio automatico di una mail al vettore con il riepilogo della prenotazione e il **QR Code in allegato** (indicato come "Coming Soon" in homepage).
2.  **Integrazione SMS**:
    *   Invio di un SMS all'autista al momento dell'arrivo al gate con l'indicazione della baia assegnata per ridurre la congestione in portineria.
3.  **Gestione Anagrafica Depositi da UI**:
    *   Possibilità per il Super Admin di aggiungere o disattivare Baie e Hub magazzino direttamente dal pannello impostazioni (attualmente sono costanti cablate in `constants.ts`).

### 🟢 COULD (Utili per il valore aggiunto)
1.  **Yard Management (Monitor Piazzale)**:
    *   Interfaccia pubblica da riprodurre su uno schermo esterno al piazzale per mostrare la coda dei camion in attesa e chiamare visivamente il mezzo alla baia corretta.
2.  **Integrazione WMS / ERP**:
    *   Webhook di notifica per inviare i dettagli del check-in direttamente al software di gestione magazzino della logistica.

### ⚪ WON'T (Inclusi in versioni future / V2)
1.  **Riconoscimento Automatico Targhe (OCR)**:
    *   Integrazione con telecamere all'ingresso per eseguire il check-in automatico confrontando le prenotazioni attive con la targa scansionata.
