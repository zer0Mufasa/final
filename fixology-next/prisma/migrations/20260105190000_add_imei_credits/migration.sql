-- Add IMEI Deep Scan Credits to shops
-- Needed for IMEI deep scan credits UI/API and for shop creation returning full row.

ALTER TABLE "shops"
  ADD COLUMN IF NOT EXISTS "imei_credits" INTEGER NOT NULL DEFAULT 0;

