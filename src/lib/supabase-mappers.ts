import type {Customer,Meeting,Proposal,ReferenceDocument} from './types';

type Row=Record<string,unknown>;
export const customerFromRow=(r:Row):Customer=>({id:String(r.id),name:String(r.name),industry:String(r.industry??''),contact:String(r.contact??''),note:String(r.note??''),createdAt:String(r.created_at)});
export const meetingFromRow=(r:Row):Meeting=>({id:String(r.id),customerId:String(r.customer_id),title:String(r.title),heldAt:String(r.held_at),participants:String(r.participants??''),status:r.status as Meeting['status'],transcript:String(r.transcript??''),segments:(r.segments??[]) as Meeting['segments'],minutes:(r.minutes??null) as Meeting['minutes'],audioName:r.audio_name?String(r.audio_name):null,textName:r.text_name?String(r.text_name):null,version:Number(r.version??1),createdAt:String(r.created_at)});
export const proposalFromRow=(r:Row):Proposal=>({id:String(r.id),meetingId:String(r.meeting_id),title:String(r.title),content:String(r.content??''),status:r.status as Proposal['status'],version:Number(r.version??1),createdAt:String(r.created_at),source:(r.source??'template') as Proposal['source'],evidenceIds:(r.evidence_ids??[]) as string[]});
export const documentFromRow=(r:Row):ReferenceDocument=>({id:String(r.id),name:String(r.name),category:String(r.category??''),content:String(r.content??''),allowAI:Boolean(r.allow_ai),createdAt:String(r.created_at)});
