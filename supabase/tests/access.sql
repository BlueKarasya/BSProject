-- Run as postgres against a disposable Supabase development database.
-- Every assertion operates under the actual authenticated/anon role and RLS.
-- ON_ERROR_STOP causes any unexpected success/failure to fail the command.
\set ON_ERROR_STOP on
begin;
insert into auth.users (id) values
 ('10000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002');
insert into public.organizations(id,name) values
 ('20000000-0000-0000-0000-000000000001','A'),
 ('20000000-0000-0000-0000-000000000002','B');
insert into public.memberships(organization_id,user_id,role) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','member'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','owner');
insert into public.customers(id,organization_id,name) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','A customer'),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','B customer');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
do $$
declare n integer;
begin
 select count(*) into n from public.customers;
 if n <> 1 then raise exception 'Cross-org SELECT isolation failed'; end if;
 update public.customers set name='owned edit' where id='30000000-0000-0000-0000-000000000001';
 get diagnostics n = row_count;
 if n <> 1 then raise exception 'Own-org update failed'; end if;
 update public.customers set name='attack' where id='30000000-0000-0000-0000-000000000002';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'Cross-org UPDATE succeeded'; end if;
 begin
  insert into public.customers(organization_id,name) values('20000000-0000-0000-0000-000000000002','attack');
  raise exception 'Cross-org INSERT succeeded';
 exception when insufficient_privilege then null; end;
 begin
  update public.customers set organization_id='20000000-0000-0000-0000-000000000002' where id='30000000-0000-0000-0000-000000000001';
  raise exception 'Organization move succeeded';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.meetings(organization_id,customer_id,title) values('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','attack');
  raise exception 'Cross-org customer link succeeded';
 exception when foreign_key_violation then null; end;
 begin
  update public.memberships set role='owner' where user_id=auth.uid();
  raise exception 'Role escalation succeeded';
 exception when insufficient_privilege then null; end;
 begin
  perform public.bootstrap_organization('duplicate');
  raise exception 'Second organization bootstrap succeeded';
 exception when insufficient_privilege then null; end;
 begin
  perform public.claim_job();
  raise exception 'Browser claimed privileged job';
 exception when insufficient_privilege then null; end;
 begin
  insert into storage.objects(bucket_id,name,owner_id) values('meeting-inputs','unreserved/path',auth.uid()::text);
  raise exception 'Unreserved Storage upload succeeded';
 exception when insufficient_privilege then null; end;
end $$;
insert into public.meetings(id,organization_id,customer_id,title) values
 ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Own meeting');
insert into public.proposals(id,organization_id,meeting_id,title,content) values
 ('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Draft','Content');
do $$
declare n integer;
begin
 begin
  update public.proposals set status='approved' where id='50000000-0000-0000-0000-000000000001';
  raise exception 'Direct approval succeeded';
 exception when insufficient_privilege then null; end;
 perform public.approve_proposal('50000000-0000-0000-0000-000000000001',1);
 update public.proposals set content='tamper' where id='50000000-0000-0000-0000-000000000001';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'Approved proposal changed'; end if;
end $$;
reset role;
insert into public.assets(id,organization_id,meeting_id,kind,object_path,name,size) values
 ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','transcript','20000000-0000-0000-0000-000000000001/40000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000001/input.txt','input.txt',10);
set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values
 ('meeting-inputs','20000000-0000-0000-0000-000000000001/40000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000001/input.txt','10000000-0000-0000-0000-000000000001');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from storage.objects where bucket_id='meeting-inputs') then
  raise exception 'Cross-org Storage SELECT succeeded';
 end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform 1 from public.customers;
  raise exception 'Anonymous table access granted';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
\echo 'Access assertions passed; all test data rolled back.'
