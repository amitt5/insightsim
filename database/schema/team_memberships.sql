CREATE TABLE team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'researcher', 'viewer')),
    invited_by UUID REFERENCES users(user_id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique user per organization
    UNIQUE(organization_id, user_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_team_memberships_organization_id ON team_memberships(organization_id);
CREATE INDEX idx_team_memberships_user_id ON team_memberships(user_id);
