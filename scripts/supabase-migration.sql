-- Aggiungi colonne mancanti alla tabella bookings
-- Esegui questo nel SQL Editor di Supabase

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS "orderRefScarico" text,
  ADD COLUMN IF NOT EXISTS "orderRefCarico" text,
  ADD COLUMN IF NOT EXISTS "operationTypeScarico" text,
  ADD COLUMN IF NOT EXISTS "palletsScarico" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "operationTypeCarico" text,
  ADD COLUMN IF NOT EXISTS "palletsCarico" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bay" text;

-- Rendi orderRef nullable (era NOT NULL nell'SQL originale)
ALTER TABLE bookings ALTER COLUMN "orderRef" DROP NOT NULL;
