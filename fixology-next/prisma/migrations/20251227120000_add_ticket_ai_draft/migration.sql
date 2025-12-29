-- Add AI & risk intelligence fields to tickets
ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "ai_draft" JSONB,
  ADD COLUMN IF NOT EXISTS "risk_report" JSONB;


