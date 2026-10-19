
create or replace function public.enforce_project_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text; cnt int; lim int;
begin
  select plan into p from public.organizations where id = new.org_id;
  lim := case p when 'agency' then 25 when 'starter' then 5 else 1 end;
  select count(*) into cnt from public.projects where org_id = new.org_id;
  if cnt >= lim then raise exception 'Project limit reached for plan %', p; end if;
  return new;
end $$;
create trigger trg_project_limit before insert on public.projects for each row execute function public.enforce_project_limit();
