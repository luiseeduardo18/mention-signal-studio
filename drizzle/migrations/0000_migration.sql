
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  owner_id uuid not null,
  plan text not null default 'free' check (plan in ('free','starter','agency')),
  created_at timestamptz not null default now()
);
create table public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  website text check (website is null or char_length(website) <= 255),
  sector text not null check (char_length(sector) between 1 and 120),
  city text not null check (char_length(city) between 1 and 120),
  country text not null check (char_length(country) between 1 and 120),
  created_at timestamptz not null default now()
);
create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  website text check (website is null or char_length(website) <= 255),
  created_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  text text not null check (char_length(text) between 5 and 500),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null,
  provider text not null,
  model text not null,
  status text not null default 'running' check (status in ('running','completed','failed','partial')),
  error text,
  questions_total int not null default 0,
  questions_ok int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.analysis_runs(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  question_text text not null,
  system_prompt text not null,
  user_prompt text not null,
  raw_response text,
  provider text not null,
  model text not null,
  status text not null check (status in ('ok','error')),
  error text,
  created_at timestamptz not null default now()
);
create table public.mentions (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.analysis_results(id) on delete cascade,
  run_id uuid not null references public.analysis_runs(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_name text not null,
  entity_type text not null check (entity_type in ('brand','competitor')),
  mentioned boolean not null,
  match_method text,
  matched_snippet text,
  first_index int,
  created_at timestamptz not null default now()
);
create index on public.projects(org_id);
create index on public.questions(project_id);
create index on public.competitors(project_id);
create index on public.analysis_runs(org_id, started_at desc);
create index on public.analysis_results(run_id);
create index on public.mentions(run_id);

grant select, update on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select, insert, update, delete on public.projects, public.competitors, public.questions to authenticated;
grant select on public.analysis_runs, public.analysis_results, public.mentions to authenticated;
grant all on public.organizations, public.organization_members, public.projects, public.competitors, public.questions, public.analysis_runs, public.analysis_results, public.mentions to service_role;

create or replace function public.is_org_member(_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where org_id = _org and user_id = auth.uid())
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.competitors enable row level security;
alter table public.questions enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.analysis_results enable row level security;
alter table public.mentions enable row level security;

create policy "members read org" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "owner updates org name" on public.organizations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members read membership" on public.organization_members for select to authenticated using (public.is_org_member(org_id));

create policy "members all projects" on public.projects for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "members all competitors" on public.competitors for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "members all questions" on public.questions for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "members read runs" on public.analysis_runs for select to authenticated using (public.is_org_member(org_id));
create policy "members read results" on public.analysis_results for select to authenticated using (public.is_org_member(org_id));
create policy "members read mentions" on public.mentions for select to authenticated using (public.is_org_member(org_id));

-- plan cannot be changed by users (only service role), owner_id immutable
create or replace function public.protect_org_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated' and (new.plan <> old.plan or new.owner_id <> old.owner_id) then
    raise exception 'plan and owner cannot be changed from the client';
  end if;
  return new;
end $$;
create trigger trg_protect_org before update on public.organizations for each row execute function public.protect_org_fields();

-- child rows must match parent project's org; limits 3 competitors / 10 questions
create or replace function public.enforce_project_child()
returns trigger language plpgsql security definer set search_path = public as $$
declare p_org uuid; cnt int;
begin
  select org_id into p_org from public.projects where id = new.project_id;
  if p_org is null or p_org <> new.org_id then raise exception 'project/org mismatch'; end if;
  if tg_op = 'INSERT' then
    if tg_table_name = 'competitors' then
      select count(*) into cnt from public.competitors where project_id = new.project_id;
      if cnt >= 3 then raise exception 'Maximum of 3 competitors per project'; end if;
    elsif tg_table_name = 'questions' then
      select count(*) into cnt from public.questions where project_id = new.project_id;
      if cnt >= 10 then raise exception 'Maximum of 10 questions per project'; end if;
    end if;
  end if;
  return new;
end $$;
create trigger trg_comp before insert or update on public.competitors for each row execute function public.enforce_project_child();
create trigger trg_q before insert or update on public.questions for each row execute function public.enforce_project_child();

-- auto-create org on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_org uuid;
begin
  insert into public.organizations (name, owner_id)
  values (coalesce(nullif(new.raw_user_meta_data->>'org_name',''), split_part(new.email,'@',1) || ' agency'), new.id)
  returning id into new_org;
  insert into public.organization_members (org_id, user_id, role) values (new_org, new.id, 'owner');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
