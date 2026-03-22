-- Refinery UGC Features Migration
-- Run this in Supabase SQL Editor

-- 1. Add ugc_thumbnail and ugc_script content types
ALTER TABLE refinery_campaigns DROP CONSTRAINT refinery_campaigns_content_type_check;
ALTER TABLE refinery_campaigns ADD CONSTRAINT refinery_campaigns_content_type_check
  CHECK (content_type IN (
    'cold_email','ad_creative','subject_line','landing_page',
    'social_post','ugc_ad','ugc_thumbnail','ugc_script','other'
  ));

-- 2. Raise iterations ceiling to 50 (thumbnail campaigns need 20–50 images)
ALTER TABLE refinery_campaigns DROP CONSTRAINT refinery_campaigns_iterations_check;
ALTER TABLE refinery_campaigns ADD CONSTRAINT refinery_campaigns_iterations_check
  CHECK (iterations BETWEEN 1 AND 50);

-- 3. Manual vs automatic iteration mode
ALTER TABLE refinery_campaigns
  ADD COLUMN IF NOT EXISTS iteration_mode TEXT NOT NULL DEFAULT 'automatic'
  CHECK (iteration_mode IN ('automatic', 'manual'));

-- 4. Paused status for jobs (manual mode)
ALTER TABLE refinery_jobs DROP CONSTRAINT refinery_jobs_status_check;
ALTER TABLE refinery_jobs ADD CONSTRAINT refinery_jobs_status_check
  CHECK (status IN ('pending','running','completed','failed','paused'));

-- 5. awaiting_review status for iterations (manual mode: content generated, not yet tested)
ALTER TABLE refinery_iterations DROP CONSTRAINT refinery_iterations_status_check;
ALTER TABLE refinery_iterations ADD CONSTRAINT refinery_iterations_status_check
  CHECK (status IN ('pending','running','completed','failed','awaiting_review'));
