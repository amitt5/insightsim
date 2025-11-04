-- Add conversation JSONB column to human_respondents
alter table human_respondents
add column if not exists conversation jsonb not null default '[]'::jsonb;

-- Optional: index if we query by length or existence
-- create index if not exists human_respondents_conversation_gin on human_respondents using gin (conversation);


