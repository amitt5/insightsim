-- Add active_tab field to projects table
-- This field will store the last active tab for each project

ALTER TABLE projects 
ADD COLUMN active_tab VARCHAR(50) DEFAULT 'brief';

-- Add a comment to document the field
COMMENT ON COLUMN projects.active_tab IS 'Stores the last active tab in the project view (brief, discussion, rag, personas, media, studies, interviews)';
