import { db, audit_logs } from '@/db';

export interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ERROR';
  entity: 'booking' | 'user' | 'slot' | 'deposit' | 'auth';
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
}

/**
 * Registra un'azione di audit nel database.
 * Implementata per essere sicura: un errore nel log non blocca mai l'operazione principale.
 */
export function logAudit(params: AuditLogParams) {
  // Mapping dei ruoli per salvare nomi più leggibili
  let finalRole = params.userRole;
  if (finalRole === 'user') finalRole = 'vettore';
  if (finalRole === 'gate') finalRole = 'hub';

  // Usiamo setTimeout con delay 0 per rendere l'operazione asincrona e "non bloccante"
  setTimeout(async () => {
    try {
      await db.insert(audit_logs).values({
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: finalRole || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: params.details || null
      });
    } catch (err) {
      // L'errore viene solo loggato in console, senza interrompere l'app
      console.error('--- ERRORE DURANTE IL LOG DI AUDIT ---');
      console.error('Dati:', params.action, params.entity);
      console.error('Errore:', err);
    }
  }, 0);
}

