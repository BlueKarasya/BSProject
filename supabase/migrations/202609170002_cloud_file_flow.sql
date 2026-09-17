begin;

grant insert on public.assets to authenticated;
create policy assets_insert on public.assets for insert to authenticated with check(
 public.is_org_member(organization_id)
 and owner_id=(select auth.uid())
 and status='pending'
 and object_path=organization_id::text||'/'||meeting_id::text||'/'||id::text||'/'||name
);

create function public.mark_asset_ready(p_asset_id uuid) returns public.assets
 language plpgsql security definer set search_path='' as $$
declare v_row public.assets;
begin
 update public.assets a set status='ready'
 where a.id=p_asset_id and a.owner_id=auth.uid() and a.status='pending'
 and public.is_org_member(a.organization_id)
 and exists(select 1 from storage.objects o where o.bucket_id='meeting-inputs' and o.name=a.object_path)
 returning * into v_row;
 if not found then raise exception 'Asset is missing, inaccessible, or already finalized' using errcode='42501'; end if;
 return v_row;
end $$;
revoke all on function public.mark_asset_ready(uuid) from public;
grant execute on function public.mark_asset_ready(uuid) to authenticated;

commit;
