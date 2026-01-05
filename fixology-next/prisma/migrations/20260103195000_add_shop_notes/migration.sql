-- Add ShopNote table for CEO admin internal notes

CREATE TABLE IF NOT EXISTS "shop_notes" (
  "id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "admin_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shop_notes_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_notes_shop_id_fkey'
  ) THEN
    ALTER TABLE "shop_notes"
      ADD CONSTRAINT "shop_notes_shop_id_fkey"
      FOREIGN KEY ("shop_id") REFERENCES "shops"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_notes_admin_id_fkey'
  ) THEN
    ALTER TABLE "shop_notes"
      ADD CONSTRAINT "shop_notes_admin_id_fkey"
      FOREIGN KEY ("admin_id") REFERENCES "platform_admins"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "shop_notes_shop_id_idx" ON "shop_notes"("shop_id");
CREATE INDEX IF NOT EXISTS "shop_notes_admin_id_idx" ON "shop_notes"("admin_id");

