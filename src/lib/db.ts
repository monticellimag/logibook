import db, { initDb as sqliteInit } from './sqlite';
import { DEPOTS } from './constants';

export function init() {
  sqliteInit();
}

export function readDb(table: string) {
  // Solo per compatibilità temporanea dove usato. 
  // È preferibile fare query dirette al db importato da sqlite.ts
  try {
    const stmt = db.prepare(`SELECT * FROM ${table}`);
    return stmt.all();
  } catch(e) {
    return [];
  }
}

// Inizializza al caricamento
init();
