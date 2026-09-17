export type View = 'dashboard'|'customers'|'meetings'|'proposals'|'documents'|'settings';
export interface TranscriptSegment { id:string; speaker:string|null; startMs:number|null; endMs:number|null; text:string; line:number }
export interface Claim { text:string; sourceIds:string[] }
export interface Minutes { source:'gpt'|'local-extract'|'sample'; summary:Claim[]; decisions:Claim[]; requirements:Claim[]; actions:{text:string;owner:string|null;due:string|null;sourceIds:string[]}[]; questions:string[] }
export interface Customer { id:string; name:string; industry:string; contact:string; note:string; createdAt:string }
export interface Meeting { id:string; customerId:string; title:string; heldAt:string; participants:string; status:'draft'|'review'|'confirmed'; transcript:string; segments:TranscriptSegment[]; minutes:Minutes|null; audioName:string|null; textName:string|null; audioUrl?:string; version:number; createdAt:string }
export interface Proposal { id:string; meetingId:string; title:string; content:string; status:'draft'|'approved'; version:number; createdAt:string; source:'sample'|'template'|'gpt'; evidenceIds:string[] }
export interface ReferenceDocument { id:string;name:string;category:string;content:string;allowAI:boolean;createdAt:string }
export interface WorkspaceData { customers:Customer[];meetings:Meeting[];proposals:Proposal[];documents:ReferenceDocument[] }
export interface ConnectionStatus { supabase:boolean;openai:boolean;mode:'demo'|'cloud' }
export interface Intake { customerId:string;title:string;heldAt:string;participants:string;audio:File|null;text:File|null }
