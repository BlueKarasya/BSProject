'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import * as tus from 'tus-js-client';

let singleton:SupabaseClient|null|undefined;
export function getSupabaseBrowser(){
 if(singleton!==undefined)return singleton;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 singleton=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
 return singleton;
}

export async function uploadPrivateAsset(file:File,objectName:string,onProgress?:(percent:number)=>void){
 const client=getSupabaseBrowser();if(!client)throw new Error('Supabase가 연결되지 않았습니다.');
 const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('로그인이 필요합니다.');
 const projectId=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
 return new Promise<void>((resolve,reject)=>{
  const upload=new tus.Upload(file,{endpoint:`https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,retryDelays:[0,3000,5000,10000,20000],headers:{authorization:`Bearer ${session.access_token}`,'x-upsert':'false'},uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,chunkSize:6*1024*1024,metadata:{bucketName:'meeting-inputs',objectName,contentType:file.type||'application/octet-stream',cacheControl:'3600'},onError:error=>reject(error),onProgress:(sent,total)=>onProgress?.(Math.round(sent/total*100)),onSuccess:()=>resolve()});
  upload.findPreviousUploads().then(previous=>{if(previous.length)upload.resumeFromPreviousUpload(previous[0]);upload.start();}).catch(reject);
 });
}
