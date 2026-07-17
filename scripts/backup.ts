import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DB_PATH = path.join(process.cwd(), 'data', 'logibook.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const LOGS_DIR = path.join(process.cwd(), 'logs');

// Create directories if they don't exist
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(path.join(LOGS_DIR, 'backup.log'), logMessage);
  console.log(logMessage.trim());
}

async function performBackup() {
  log('Inizio procedura di backup automatico...');

  if (!fs.existsSync(DB_PATH)) {
    log(`ERRORE: Database non trovato in ${DB_PATH}`);
    process.exit(1);
  }

  const date = new Date();
  const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
  const backupFileName = `logibook_${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);
  const compressedFilePath = `${backupFilePath}.gz`;

  try {
    const db = new Database(DB_PATH, { readonly: true });
    log(`Database aperto in sola lettura per il backup.`);

    // Perform the safe backup using better-sqlite3 API
    await db.backup(backupFilePath);
    db.close();
    log(`Backup non compresso creato in: ${backupFilePath}`);

    // Compress the backup
    log(`Inizio compressione zlib...`);
    const gzip = zlib.createGzip();
    const source = fs.createReadStream(backupFilePath);
    const destination = fs.createWriteStream(compressedFilePath);

    await new Promise<void>((resolve, reject) => {
      source.pipe(gzip).pipe(destination)
        .on('finish', () => resolve())
        .on('error', (err) => reject(err));
    });

    // Remove the uncompressed backup
    fs.unlinkSync(backupFilePath);
    log(`Compressione completata. File salvato in: ${compressedFilePath}`);

    // Clean up old backups
    cleanOldBackups();

    // Verify integrity of the compressed backup
    await verifyIntegrity(compressedFilePath);

    log('Procedura di backup completata con successo.');
  } catch (error) {
    log(`!!! ERRORE CRITICO !!! durante il backup o la verifica: ${error}`);
    console.error(`\x1b[31m[NOTIFICA] Errore nel backup di LogiBook: ${error}\x1b[0m`);
    process.exit(1);
  }
}

async function verifyIntegrity(compressedFilePath: string) {
  log(`Inizio verifica integrità del backup compresso...`);
  const tempUncompressedPath = compressedFilePath.replace('.gz', '.temp_verify');
  
  try {
    // Decompress to temp file
    const gunzip = zlib.createGunzip();
    const source = fs.createReadStream(compressedFilePath);
    const destination = fs.createWriteStream(tempUncompressedPath);

    await new Promise<void>((resolve, reject) => {
      source.pipe(gunzip).pipe(destination)
        .on('finish', () => resolve())
        .on('error', (err) => reject(err));
    });

    // Check integrity
    const db = new Database(tempUncompressedPath, { readonly: true });
    const result = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    db.close();

    if (result.integrity_check !== 'ok') {
      throw new Error(`Integrità database NON VALIDA: ${result.integrity_check}`);
    }

    log(`Verifica integrità completata: OK.`);
    return true;
  } finally {
    // Cleanup temp file
    if (fs.existsSync(tempUncompressedPath)) {
      fs.unlinkSync(tempUncompressedPath);
    }
  }
}

function cleanOldBackups() {
  const retentionDays = 7;
  const now = new Date().getTime();

  fs.readdirSync(BACKUP_DIR).forEach(file => {
    if (file.startsWith('logibook_') && file.endsWith('.db.gz')) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAgeDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      if (fileAgeDays > retentionDays) {
        fs.unlinkSync(filePath);
        log(`Eliminato backup vecchio di oltre 7 giorni: ${file}`);
      }
    }
  });
}

performBackup();
