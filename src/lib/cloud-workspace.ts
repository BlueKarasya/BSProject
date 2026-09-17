import type {SupabaseClient} from '@supabase/supabase-js';
import {customerFromRow,documentFromRow,meetingFromRow,proposalFromRow} from './supabase-mappers';
import type {WorkspaceData} from './types';

const fail=(error:{message:string}|null)=>{if(error)throw new Error(error.message);};

export async function ensureOrganization(client:SupabaseClient,email:string){
 const current=await client.from('memberships').select('organization_id').limit(1).maybeSingle();fail(current.error);
 if(current.data?.organization_id)return String(current.data.organization_id);
 const label=(email.split('@')[0]||'내')+' 워크스페이스';const created=await client.rpc('bootstrap_organization',{p_name:label});fail(created.error);
 return String(created.data);
}

export async function loadCloudWorkspace(client:SupabaseClient):Promise<WorkspaceData>{
 const [customers,meetings,proposals,documents]=await Promise.all([
  client.from('customers').select('*').order('created_at',{ascending:false}),
  client.from('meetings').select('*').order('held_at',{ascending:false}),
  client.from('proposals').select('*').order('created_at',{ascending:false}),
  client.from('reference_documents').select('*').order('created_at',{ascending:false}),
 ]);
 fail(customers.error);fail(meetings.error);fail(proposals.error);fail(documents.error);
 return{customers:(customers.data??[]).map(customerFromRow),meetings:(meetings.data??[]).map(meetingFromRow),proposals:(proposals.data??[]).map(proposalFromRow),documents:(documents.data??[]).map(documentFromRow)};
}

export function unwrap<T>(result:{data:T|null;error:{message:string}|null}){fail(result.error);if(result.data===null)throw new Error('Supabase 응답에 데이터가 없습니다.');return result.data;}
