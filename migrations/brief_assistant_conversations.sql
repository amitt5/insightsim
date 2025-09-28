-- Create brief_assistant_conversations table
create table brief_assistant_conversations (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) not null,
  conversation_history jsonb default '[]'::jsonb,
  is_ready_to_generate boolean default false,
  brief_generated boolean default false,
  generated_brief text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for brief_assistant_conversations
create index brief_assistant_conversations_project_id_idx on brief_assistant_conversations(project_id);
create index brief_assistant_conversations_is_active_idx on brief_assistant_conversations(is_active);
create index brief_assistant_conversations_created_at_idx on brief_assistant_conversations(created_at);

-- Add trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_brief_assistant_conversations_updated_at
    before update on brief_assistant_conversations
    for each row
    execute function update_updated_at_column();
