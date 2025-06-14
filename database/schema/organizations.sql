CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#64748B',
    font_family TEXT DEFAULT 'Inter',
    include_logo BOOLEAN DEFAULT true,
    show_participant_details BOOLEAN DEFAULT true,
    executive_summary BOOLEAN DEFAULT true,
    default_report_format TEXT DEFAULT 'PDF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
