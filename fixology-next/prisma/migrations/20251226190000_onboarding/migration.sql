-- Add onboarding fields to shops
ALTER TABLE "shops"
  ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "business_hours" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "repair_focus" TEXT[] DEFAULT ARRAY[]::TEXT[];


