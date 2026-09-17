import {describe,expect,it} from 'vitest';
import {customerFromRow,documentFromRow,meetingFromRow,proposalFromRow} from '../src/lib/supabase-mappers';

describe('Supabase row mappers',()=>{
 it('maps snake_case customer columns',()=>expect(customerFromRow({id:'c1',name:'한빛',industry:'물류',contact:'김팀장',note:'',created_at:'2026-09-17T00:00:00Z'})).toMatchObject({id:'c1',name:'한빛',createdAt:'2026-09-17T00:00:00Z'}));
 it('maps meeting JSON and file metadata',()=>expect(meetingFromRow({id:'m1',customer_id:'c1',title:'미팅',held_at:'2026-09-17T01:00:00Z',participants:'A',status:'review',transcript:'원문',segments:[{id:'s1',speaker:null,startMs:0,endMs:null,text:'내용',line:1}],minutes:null,audio_name:'a.m4a',text_name:'a.txt',version:2,created_at:'2026-09-17T00:00:00Z'})).toMatchObject({customerId:'c1',audioName:'a.m4a',textName:'a.txt',version:2}));
 it('maps proposal evidence and source',()=>expect(proposalFromRow({id:'p1',meeting_id:'m1',title:'제안',content:'x',status:'draft',version:1,created_at:'2026-09-17T00:00:00Z',source:'gpt',evidence_ids:['s1']})).toMatchObject({meetingId:'m1',source:'gpt',evidenceIds:['s1']}));
 it('maps reference document policy',()=>expect(documentFromRow({id:'d1',name:'a.md',category:'소개',content:'x',allow_ai:true,created_at:'2026-09-17T00:00:00Z'})).toMatchObject({allowAI:true,category:'소개'}));
});
