BEGIN;

-- 1. Add a new column `code` to tracks table. Allows for upper case letters + numbers only.
ALTER TABLE tracks
ADD code TEXT UNIQUE CHECK (code ~ '^[A-Z0-9]+$');

-- 2. Backfill a unique code for every existing row
UPDATE tracks SET code = 'PMP' WHERE id = '33333333-3333-4333-8333-333333333333';
UPDATE tracks SET code = 'RMP' WHERE id = '44444444-4444-4444-8444-444444444444';

-- 3. Lock it down once every row has a code
ALTER TABLE tracks ALTER COLUMN code SET NOT NULL;

COMMIT;