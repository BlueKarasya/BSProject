-- Initial contract. Run with the Supabase migration owner, never a browser key.
begin;
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 160)
);
create table public.memberships (
 organization_id uuid not null references public.organizations(id),
 user_id uuid not null references auth.users(id),
 role text not null check(role in ('owner','member')),
 primary key(organization_id,user_id)
);
create index memberships_user_idx on public.memberships(user_id);
create table public.customers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null check(length(trim(name)) between 1 and 200), industry text not null default '',
 contact text not null default '', note text not null default '', created_at timestamptz not null default now(),
 unique(organization_id,id)
);
create table public.meetings (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 customer_id uuid not null, title text not null check(length(trim(title)) between 1 and 300),
 held_at timestamptz not null default now(), participants text not null default '', transcript text not null default '',
 segments jsonb not null default '[]'::jsonb check(jsonb_typeof(segments)='array'), minutes jsonb,
 status text not null default 'draft' check(status in ('draft','review','confirmed')),
 version integer not null default 1 check(version>0), created_at timestamptz not null default now(),
 unique(organization_id,id), foreign key(organization_id,customer_id) references public.customers(organization_id,id)
);
create table public.proposals (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), meeting_id uuid not null,
 title text not null check(length(trim(title)) between 1 and 300), content text not null default '',
 status text not null default 'draft' check(status in ('draft','approved')),
 version integer not null default 1 check(version>0), created_at timestamptz not null default now(),
 foreign key(organization_id,meeting_id) references public.meetings(organization_id,id)
);
create table public.assets (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), meeting_id uuid not null,
 owner_id uuid not null references auth.users(id), kind text not null check(kind in ('audio','transcript')),
 object_path text not null unique, name text not null check(name ~ '^[^/\\]+$' and name not in ('.','..')),
 size bigint not null check(size>0 and size<=524288000), status text not null default 'pending' check(status in ('pending','ready')),
 check(kind<>'transcript' or size<=20971520),
 check(object_path=organization_id::text||'/'||meeting_id::text||'/'||id::text||'/'||name),
 foreign key(organization_id,meeting_id) references public.meetings(organization_id,id),
 foreign key(organization_id,owner_id) references public.memberships(organization_id,user_id)
);
create table public.jobs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), meeting_id uuid not null,
 kind text not null check(kind in ('minutes','proposal')), status text not null default 'queued' check(status in ('queued','running','succeeded','failed')),
 payload jsonb not null default '{}'::jsonb, result jsonb, error text, created_at timestamptz not null default now(),
 idempotency_key text not null check(length(idempotency_key) between 1 and 300),
 lease_token uuid, claimed_at timestamptz, completed_at timestamptz,
 unique(organization_id,idempotency_key), foreign key(organization_id,meeting_id) references public.meetings(organization_id,id)
);
create index meetings_org_idx on public.meetings(organization_id);
create index proposals_org_idx on public.proposals(organization_id);
create index assets_org_idx on public.assets(organization_id);
create index jobs_queue_idx on public.jobs(created_at) where status='queued';

create function public.is_org_member(p_organization_id uuid) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships where organization_id=p_organization_id and user_id=(select auth.uid()));
$$;
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.customers enable row level security;
alter table public.meetings enable row level security;
alter table public.proposals enable row level security;
alter table public.assets enable row level security;
alter table public.jobs enable row level security;
revoke all on public.organizations,public.memberships,public.customers,public.meetings,public.proposals,public.assets,public.jobs from anon,authenticated;
grant select on public.organizations,public.memberships,public.customers,public.meetings,public.proposals,public.assets,public.jobs to authenticated;
grant insert,update,delete on public.customers,public.meetings,public.proposals to authenticated;
grant all on public.organizations,public.memberships,public.customers,public.meetings,public.proposals,public.assets,public.jobs to service_role;
create policy org_read on public.organizations for select to authenticated using(public.is_org_member(id));
create policy membership_read on public.memberships for select to authenticated using(public.is_org_member(organization_id));
create policy customers_read on public.customers for select to authenticated using(public.is_org_member(organization_id));
create policy customers_insert on public.customers for insert to authenticated with check(public.is_org_member(organization_id));
create policy customers_update on public.customers for update to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy customers_delete on public.customers for delete to authenticated using(public.is_org_member(organization_id));
create policy meetings_read on public.meetings for select to authenticated using(public.is_org_member(organization_id));
create policy meetings_insert on public.meetings for insert to authenticated with check(public.is_org_member(organization_id) and status in ('draft','review') and version=1);
create policy meetings_update on public.meetings for update to authenticated using(public.is_org_member(organization_id) and status in ('draft','review')) with check(public.is_org_member(organization_id) and status in ('draft','review'));
create policy meetings_delete on public.meetings for delete to authenticated using(public.is_org_member(organization_id) and status='draft');
create policy proposals_read on public.proposals for select to authenticated using(public.is_org_member(organization_id));
create policy proposals_insert on public.proposals for insert to authenticated with check(public.is_org_member(organization_id) and status='draft' and version=1);
create policy proposals_update on public.proposals for update to authenticated using(public.is_org_member(organization_id) and status='draft') with check(public.is_org_member(organization_id) and status='draft');
create policy proposals_delete on public.proposals for delete to authenticated using(public.is_org_member(organization_id) and status='draft');
create policy assets_read on public.assets for select to authenticated using(public.is_org_member(organization_id));
create policy jobs_read on public.jobs for select to authenticated using(public.is_org_member(organization_id));

create function public.guard_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id<>old.id or new.organization_id<>old.organization_id then
  raise exception 'Identity and organization are immutable' using errcode='42501';
 end if;
 if old.status in ('confirmed','approved') then
  raise exception 'Finalized records are immutable; create a new draft' using errcode='42501';
 end if;
 new.version := old.version+1;
 return new;
end $$;
revoke all on function public.guard_revision() from public;
create trigger meetings_revision before update on public.meetings for each row execute function public.guard_revision();
create trigger proposals_revision before update on public.proposals for each row execute function public.guard_revision();

create function public.bootstrap_organization(p_name text) returns uuid
 language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_org uuid;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
 -- Serialize bootstrap by locking the existing Auth user, preventing concurrent double creation.
 perform 1 from auth.users where id=v_user for update;
 if not found then raise exception 'Unknown user' using errcode='42501'; end if;
 if exists(select 1 from public.memberships where user_id=v_user) then
  raise exception 'User already belongs to an organization' using errcode='42501';
 end if;
 insert into public.organizations(name) values(trim(p_name)) returning id into v_org;
 insert into public.memberships(organization_id,user_id,role) values(v_org,v_user,'owner');
 return v_org;
end $$;
create function public.approve_proposal(p_proposal_id uuid,p_expected_version integer) returns public.proposals
 language plpgsql security definer set search_path='' as $$
declare v_row public.proposals;
begin
 update public.proposals set status='approved'
 where id=p_proposal_id and version=p_expected_version and status='draft'
 and public.is_org_member(organization_id) and length(trim(content))>0 returning * into v_row;
 if not found then raise exception 'Not accessible, empty, finalized, or stale version' using errcode='42501'; end if;
 return v_row;
end $$;
create function public.confirm_meeting(p_meeting_id uuid,p_expected_version integer) returns public.meetings
 language plpgsql security definer set search_path='' as $$
declare v_row public.meetings;
begin
 update public.meetings set status='confirmed'
 where id=p_meeting_id and version=p_expected_version and status in ('draft','review')
 and public.is_org_member(organization_id) and minutes is not null returning * into v_row;
 if not found then raise exception 'Not accessible, missing minutes, finalized, or stale version' using errcode='42501'; end if;
 return v_row;
end $$;
revoke all on function public.bootstrap_organization(text),public.approve_proposal(uuid,integer),public.confirm_meeting(uuid,integer) from public;
grant execute on function public.bootstrap_organization(text),public.approve_proposal(uuid,integer),public.confirm_meeting(uuid,integer) to authenticated;

-- Minimal durable queue primitive. No automatic retries of ambiguous paid calls.
create function public.claim_job() returns public.jobs language plpgsql security definer set search_path='' as $$
declare v_row public.jobs;
begin
 with candidate as (select id from public.jobs where status='queued' order by created_at for update skip locked limit 1)
 update public.jobs j set status='running',lease_token=gen_random_uuid(),claimed_at=now()
 from candidate c where j.id=c.id returning j.* into v_row;
 return v_row;
end $$;
create function public.finish_job(p_job_id uuid,p_lease_token uuid,p_result jsonb,p_error text default null)
 returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.jobs set status=case when p_error is null then 'succeeded' else 'failed' end,
 result=p_result,error=p_error,completed_at=now()
 where id=p_job_id and status='running' and lease_token=p_lease_token;
 return found;
end $$;
revoke all on function public.claim_job(),public.finish_job(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.claim_job(),public.finish_job(uuid,uuid,jsonb,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit)
 values('meeting-inputs','meeting-inputs',false,524288000)
 on conflict(id) do update set public=false;
create policy meeting_inputs_insert on storage.objects for insert to authenticated with check(
 bucket_id='meeting-inputs' and owner_id=(select auth.uid())::text and exists(
 select 1 from public.assets a where a.object_path=storage.objects.name and a.status='pending'
 and a.owner_id=(select auth.uid()) and public.is_org_member(a.organization_id))
);
create policy meeting_inputs_read on storage.objects for select to authenticated using(
 bucket_id='meeting-inputs' and exists(select 1 from public.assets a
 where a.object_path=storage.objects.name and a.status='ready' and public.is_org_member(a.organization_id))
);
-- No browser UPDATE/DELETE policy: paths cannot be overwritten. Pending files are quarantined.
commit;
