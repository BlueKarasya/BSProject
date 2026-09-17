'use client';
import { useEffect, useState } from 'react';
import { editProposal, makeExtractiveDraft, parseTranscript, validateIntake } from './domain';
import { EMPTY_WORKSPACE, SAMPLE_WORKSPACE } from './demo';
import type { ConnectionStatus, Customer, Intake, Minutes, Proposal, ReferenceDocument, WorkspaceData } from './types';

const STORAGE_KEY='meeting-workspace-demo-v1';
const uid=(prefix:string)=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export function useWorkspace(){
  const [data,setData]=useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [hydrated,setHydrated]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [connection,setConnection]=useState<ConnectionStatus>({supabase:false,supabaseConfigured:false,supabaseReachable:false,openai:false,mode:'demo'});
  useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);const stored:WorkspaceData=raw?JSON.parse(raw):SAMPLE_WORKSPACE;setData({...stored,meetings:stored.meetings.map(({audioUrl:_discarded,...meeting})=>meeting)});}catch{setData(SAMPLE_WORKSPACE);}setHydrated(true);},[]);
  useEffect(()=>{fetch('/api/status',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(setConnection).catch(()=>setConnection({supabase:false,supabaseConfigured:false,supabaseReachable:false,openai:false,mode:'demo'}));},[]);
  useEffect(()=>{if(hydrated)localStorage.setItem(STORAGE_KEY,JSON.stringify(data));},[data,hydrated]);
  const run=async<T,>(work:()=>Promise<T>|T)=>{setBusy(true);setError(null);try{return await work();}catch(e){const message=e instanceof Error?e.message:'처리 중 오류가 발생했습니다.';setError(message);throw e;}finally{setBusy(false);}};
  return {data,hydrated,busy,error,connection,clearError:()=>setError(null),
    addCustomer:(input:Omit<Customer,'id'|'createdAt'>)=>run(()=>setData(d=>({...d,customers:[{...input,id:uid('cus'),createdAt:new Date().toISOString()},...d.customers]}))),
    createMeeting:(input:Intake)=>run(async()=>{
      const validation=validateIntake({audio:input.audio,text:input.text});if(validation.length)throw new Error(validation.join(' '));
      if(!input.text)throw new Error('첫 실행 버전에서는 클로바노트 TXT가 필요합니다. 녹음만 사용하는 외부 전사는 연결 후 제공됩니다.');
      if(input.text.name.toLowerCase().endsWith('.docx'))throw new Error('첫 실행 버전은 TXT 기록을 지원합니다. DOCX 기록은 TXT로 내려받아 주세요.');
      const transcript=await input.text.text();const segments=parseTranscript(transcript);const id=uid('mtg');
      setData(d=>({...d,meetings:[{id,customerId:input.customerId,title:input.title,heldAt:input.heldAt,participants:input.participants,status:'draft',transcript,segments,minutes:null,audioName:input.audio?.name??null,textName:input.text?.name??null,audioUrl:input.audio?URL.createObjectURL(input.audio):undefined,version:1,createdAt:new Date().toISOString()},...d.meetings]}));return id;
    }),
    analyze:(id:string)=>run(()=>setData(d=>({...d,meetings:d.meetings.map(m=>m.id===id?{...m,minutes:makeExtractiveDraft(m.segments),status:'review'}:m)}))),
    saveMinutes:(id:string,minutes:Minutes)=>run(()=>setData(d=>({...d,meetings:d.meetings.map(m=>m.id===id?{...m,minutes,status:'review',version:m.version+1}:m)}))),
    confirmMeeting:(id:string)=>run(()=>setData(d=>({...d,meetings:d.meetings.map(m=>m.id===id&&m.minutes?{...m,status:'confirmed'}:m)}))),
    generateProposal:(meetingId:string,documentIds:string[])=>run(()=>{const proposalId=uid('prp');setData(d=>{const m=d.meetings.find(x=>x.id===meetingId);if(!m?.minutes)throw new Error('먼저 회의록을 생성해 주세요.');const docs=d.documents.filter(x=>documentIds.includes(x.id)&&x.allowAI);const content=`# ${m.title} 제안서 초안\n\n## 고객 요구 이해\n\n${m.minutes.requirements.map(x=>`- ${x.text}`).join('\n')||'- 회의록에서 확정된 요구사항을 추가해 주세요.'}\n\n## 제안 근거\n\n${docs.map(x=>`- ${x.name}: ${x.content.slice(0,160)}`).join('\n')||'- 선택된 내부 자료 없음'}\n\n## 확인이 필요한 사항\n\n${m.minutes.questions.map(x=>`- ${x}`).join('\n')}`;const p:Proposal={id:proposalId,meetingId,title:`${m.title} 제안서`,content,status:'draft',version:1,createdAt:new Date().toISOString(),source:'template',evidenceIds:m.minutes.requirements.flatMap(x=>x.sourceIds)};return{...d,proposals:[p,...d.proposals]};});return proposalId;}),
    saveProposal:(id:string,content:string)=>run(()=>setData(d=>({...d,proposals:d.proposals.map(p=>p.id===id?editProposal(p,content):p)}))),
    approveProposal:(id:string)=>run(()=>setData(d=>({...d,proposals:d.proposals.map(p=>p.id===id?{...p,status:'approved'}:p)}))),
    addDocument:(file:File,category:string,allowAI:boolean)=>run(async()=>{if(!/\.(txt|md)$/i.test(file.name))throw new Error('참고 문서는 TXT 또는 MD만 등록할 수 있습니다.');const content=await file.text();const doc:ReferenceDocument={id:uid('doc'),name:file.name,category,content,allowAI,createdAt:new Date().toISOString()};setData(d=>({...d,documents:[doc,...d.documents]}));}),
    toggleDocument:(id:string)=>run(()=>setData(d=>({...d,documents:d.documents.map(x=>x.id===id?{...x,allowAI:!x.allowAI}:x)}))),
    resetDemo:()=>{localStorage.removeItem(STORAGE_KEY);setData(SAMPLE_WORKSPACE);},
  };
}
