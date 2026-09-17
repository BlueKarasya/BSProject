import { NextRequest,NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerEnv } from '@/lib/server-env';
import { validateGeneratedMinutes } from '@/lib/domain';
import type { TranscriptSegment } from '@/lib/types';

const id=z.string().uuid();
const claim=z.object({text:z.string().min(1).max(1000),sourceIds:z.array(z.string()).min(1)});
const generated=z.object({summary:z.array(claim).max(8),decisions:z.array(claim).max(20),requirements:z.array(claim).max(30),actions:z.array(z.object({text:z.string().min(1).max(1000),owner:z.string().nullable(),due:z.string().nullable(),sourceIds:z.array(z.string()).min(1)})).max(30),questions:z.array(z.string().min(1).max(1000)).max(30)});
const schema={type:'object',additionalProperties:false,required:['summary','decisions','requirements','actions','questions'],properties:{summary:{type:'array',items:claimSchema()},decisions:{type:'array',items:claimSchema()},requirements:{type:'array',items:claimSchema()},actions:{type:'array',items:{type:'object',additionalProperties:false,required:['text','owner','due','sourceIds'],properties:{text:{type:'string'},owner:{type:['string','null']},due:{type:['string','null']},sourceIds:{type:'array',items:{type:'string'},minItems:1}}}},questions:{type:'array',items:{type:'string'}}}};
function claimSchema(){return{type:'object',additionalProperties:false,required:['text','sourceIds'],properties:{text:{type:'string'},sourceIds:{type:'array',items:{type:'string'},minItems:1}}};}
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 try{
  const meetingId=id.parse((await context.params).id);const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return NextResponse.json({error:'로그인이 필요합니다.'},{status:401});
  const env=getServerEnv();const supabase=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await supabase.auth.getUser(token);if(userError||!userData.user)return NextResponse.json({error:'유효하지 않은 세션입니다.'},{status:401});
  const {data:meeting,error}=await supabase.from('meetings').select('id,title,participants,segments,status').eq('id',meetingId).single();if(error||!meeting)return NextResponse.json({error:'미팅을 찾을 수 없습니다.'},{status:404});
  const segments=z.array(z.object({id:z.string(),speaker:z.string().nullable(),startMs:z.number().nullable(),endMs:z.number().nullable(),text:z.string(),line:z.number()})).parse(meeting.segments) as TranscriptSegment[];
  if(!segments.length)return NextResponse.json({error:'분석할 발언이 없습니다.'},{status:422});
  const client=new OpenAI({apiKey:env.OPENAI_API_KEY});const response=await client.responses.create({model:env.OPENAI_MINUTES_MODEL,store:false,input:[{role:'system',content:'한국어 고객 미팅 기록을 정리한다. 입력에 없는 사실을 만들지 않는다. 모든 요약·결정·요구·업무에는 실제 segment id를 하나 이상 연결한다. 담당자나 기한이 없으면 null을 사용한다.'},{role:'user',content:JSON.stringify({title:meeting.title,participants:meeting.participants,segments})}],text:{format:{type:'json_schema',name:'meeting_minutes',strict:true,schema}}});
  const parsed=generated.parse(JSON.parse(response.output_text));const minutes=validateGeneratedMinutes(parsed,segments);
  const {data:updated,error:updateError}=await supabase.from('meetings').update({minutes,status:'review'}).eq('id',meetingId).select('minutes,status,version').single();if(updateError)throw updateError;
  return NextResponse.json(updated,{headers:{'Cache-Control':'no-store'}});
 }catch(error){const message=error instanceof Error?error.message:'분석하지 못했습니다.';return NextResponse.json({error:message},{status:500});}
}
