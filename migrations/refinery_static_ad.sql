-- Refinery Static Ad Migration
-- Run this in Supabase SQL Editor

-- Add static_ad content type
ALTER TABLE refinery_campaigns DROP CONSTRAINT refinery_campaigns_content_type_check;
ALTER TABLE refinery_campaigns ADD CONSTRAINT refinery_campaigns_content_type_check
  CHECK (content_type IN (
    'cold_email','ad_creative','subject_line','landing_page',
    'social_post','ugc_ad','ugc_thumbnail','ugc_script','static_ad','other'
  ));
