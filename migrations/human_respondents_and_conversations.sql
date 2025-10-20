-- Create human_respondents table
create table human_respondents (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) not null,
  name text not null,
  age integer not null,
  gender text not null,
  email text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for human_respondents
create index human_respondents_project_id_idx on human_respondents(project_id);
create index human_respondents_status_idx on human_respondents(status);

-- Create human_conversations table
create table human_conversations (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) not null,
  human_respondent_id uuid references human_respondents(id) not null,
  sender_type text not null check (sender_type in ('moderator', 'respondent')),
  message text not null,
  message_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Add indexes for human_conversations
create index human_conversations_project_id_idx on human_conversations(project_id);
create index human_conversations_human_respondent_id_idx on human_conversations(human_respondent_id);
create index human_conversations_message_order_idx on human_conversations(message_order);
