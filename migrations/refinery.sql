-- =============================================================
-- Refinery Migration
-- All tables are isolated from existing InsightSim tables.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. refinery_campaigns
--    The top-level entity: what is being optimized, ICP, config.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE refinery_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  content_type    TEXT NOT NULL CHECK (content_type IN (
                    'cold_email', 'ad_creative', 'subject_line',
                    'landing_page', 'social_post', 'other'
                  )),
  initial_draft   TEXT,                        -- optional starting copy
  icp             TEXT NOT NULL,               -- ideal customer profile
  rag_text        TEXT,                        -- pasted RAG data
  rag_files       JSONB DEFAULT '[]'::jsonb,   -- uploaded file refs: [{name, path, size}]
  metrics         TEXT[] NOT NULL DEFAULT '{}',-- selected metric names
  extra_context   TEXT,                        -- step 5 optional context
  iterations      INTEGER NOT NULL DEFAULT 3 CHECK (iterations BETWEEN 1 AND 10),
  users_per_iter  INTEGER NOT NULL DEFAULT 10 CHECK (users_per_iter BETWEEN 5 AND 50),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (
                    status IN ('pending', 'running', 'completed', 'failed')
                  ),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refinery_campaigns_user_id    ON refinery_campaigns(user_id);
CREATE INDEX idx_refinery_campaigns_status     ON refinery_campaigns(status);
CREATE INDEX idx_refinery_campaigns_created_at ON refinery_campaigns(created_at DESC);

ALTER TABLE refinery_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
  ON refinery_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON refinery_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON refinery_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON refinery_campaigns FOR DELETE
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 2. refinery_panels
--    A panel is the set of synthetic users generated for one
--    campaign run (one panel per campaign).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE refinery_panels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES refinery_campaigns(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refinery_panels_campaign_id ON refinery_panels(campaign_id);

ALTER TABLE refinery_panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access panels for their campaigns"
  ON refinery_panels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM refinery_campaigns
      WHERE refinery_campaigns.id = refinery_panels.campaign_id
        AND refinery_campaigns.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 3. refinery_synthetic_users
--    Individual personas within a panel.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE refinery_synthetic_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id     UUID NOT NULL REFERENCES refinery_panels(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES refinery_campaigns(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  age          INTEGER,
  gender       TEXT,
  profession   TEXT,
  bio          TEXT,                          -- 1–2 line persona summary
  persona_data JSONB DEFAULT '{}'::jsonb,    -- full generated persona blob
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refinery_synthetic_users_panel_id    ON refinery_synthetic_users(panel_id);
CREATE INDEX idx_refinery_synthetic_users_campaign_id ON refinery_synthetic_users(campaign_id);

ALTER TABLE refinery_synthetic_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access synthetic users for their campaigns"
  ON refinery_synthetic_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM refinery_campaigns
      WHERE refinery_campaigns.id = refinery_synthetic_users.campaign_id
        AND refinery_campaigns.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 4. refinery_iterations
--    One row per loop cycle: the content version shown and the
--    aggregate score after all synthetic users respond.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE refinery_iterations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID NOT NULL REFERENCES refinery_campaigns(id) ON DELETE CASCADE,
  iteration_number  INTEGER NOT NULL,
  content           TEXT NOT NULL,            -- the copy shown this round
  aggregate_score   NUMERIC(4,2),             -- NULL until all responses in
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (
                      status IN ('pending', 'running', 'completed', 'failed')
                    ),
  improvement_notes TEXT,                     -- AI-generated changelog vs prev iteration
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, iteration_number)
);

CREATE INDEX idx_refinery_iterations_campaign_id      ON refinery_iterations(campaign_id);
CREATE INDEX idx_refinery_iterations_number           ON refinery_iterations(campaign_id, iteration_number);
CREATE INDEX idx_refinery_iterations_status           ON refinery_iterations(status);

ALTER TABLE refinery_iterations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access iterations for their campaigns"
  ON refinery_iterations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM refinery_campaigns
      WHERE refinery_campaigns.id = refinery_iterations.campaign_id
        AND refinery_campaigns.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 5. refinery_responses
--    One row per (synthetic user × iteration): score + feedback.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE refinery_responses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iteration_id      UUID NOT NULL REFERENCES refinery_iterations(id) ON DELETE CASCADE,
  campaign_id       UUID NOT NULL REFERENCES refinery_campaigns(id) ON DELETE CASCADE,
  synthetic_user_id UUID NOT NULL REFERENCES refinery_synthetic_users(id) ON DELETE CASCADE,
  score             NUMERIC(4,2) NOT NULL CHECK (score BETWEEN 1 AND 10),
  feedback          TEXT,                     -- qualitative response from this user
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (iteration_id, synthetic_user_id)
);

ALTER TABLE refinery_responses ADD COLUMN IF NOT EXISTS personalized_content TEXT;
ALTER TABLE refinery_iterations ADD COLUMN IF NOT EXISTS rag_recommendations TEXT;

CREATE INDEX idx_refinery_responses_iteration_id      ON refinery_responses(iteration_id);
CREATE INDEX idx_refinery_responses_campaign_id       ON refinery_responses(campaign_id);
CREATE INDEX idx_refinery_responses_synthetic_user_id ON refinery_responses(synthetic_user_id);

ALTER TABLE refinery_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access responses for their campaigns"
  ON refinery_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM refinery_campaigns
      WHERE refinery_campaigns.id = refinery_responses.campaign_id
        AND refinery_campaigns.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 6. refinery_jobs
--    Background job queue. One job per campaign run.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE refinery_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID NOT NULL REFERENCES refinery_campaigns(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (
                      status IN ('pending', 'running', 'completed', 'failed')
                    ),
  current_iteration INTEGER NOT NULL DEFAULT 0,  -- last completed iteration
  total_iterations  INTEGER NOT NULL,
  error             TEXT,                         -- last error message if failed
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refinery_jobs_campaign_id ON refinery_jobs(campaign_id);
CREATE INDEX idx_refinery_jobs_status      ON refinery_jobs(status);

ALTER TABLE refinery_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access jobs for their campaigns"
  ON refinery_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM refinery_campaigns
      WHERE refinery_campaigns.id = refinery_jobs.campaign_id
        AND refinery_campaigns.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
-- updated_at trigger (shared function for all refinery tables)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refinery_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refinery_campaigns_updated_at
  BEFORE UPDATE ON refinery_campaigns
  FOR EACH ROW EXECUTE FUNCTION refinery_set_updated_at();

CREATE TRIGGER trg_refinery_iterations_updated_at
  BEFORE UPDATE ON refinery_iterations
  FOR EACH ROW EXECUTE FUNCTION refinery_set_updated_at();

CREATE TRIGGER trg_refinery_jobs_updated_at
  BEFORE UPDATE ON refinery_jobs
  FOR EACH ROW EXECUTE FUNCTION refinery_set_updated_at();
