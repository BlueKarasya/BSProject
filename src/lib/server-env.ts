import 'server-only';
import { z } from 'zod';
const schema=z.object({NEXT_PUBLIC_SUPABASE_URL:z.string().url(),NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:z.string().min(10),OPENAI_API_KEY:z.string().min(20),OPENAI_MINUTES_MODEL:z.string().default('gpt-4.1-mini')});
export function getServerEnv(){const parsed=schema.safeParse(process.env);if(!parsed.success)throw new Error('클라우드 연결 환경 변수가 준비되지 않았습니다.');return parsed.data;}
export function connectionFlags(){return{supabase:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),openai:Boolean(process.env.OPENAI_API_KEY)};}
export async function connectionStatus(){
 const flags=connectionFlags();let reachable=false;
 if(flags.supabase){try{const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},cache:'no-store',signal:AbortSignal.timeout(5000)});reachable=response.ok;}catch{reachable=false;}}
 return{supabase:flags.supabase&&reachable,supabaseConfigured:flags.supabase,supabaseReachable:reachable,openai:flags.openai,mode:'demo' as const};
}
