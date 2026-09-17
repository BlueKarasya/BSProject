import type { Minutes, TranscriptSegment } from './types';

type UploadLike = { name: string; size: number };
type IntakeFiles = { audio?: UploadLike | null; text?: UploadLike | null };
const AUDIO_EXTENSIONS = new Set(['m4a', 'mp3', 'wav', 'aac', 'amr']);
const TEXT_EXTENSIONS = new Set(['txt', 'docx']);

function extension(name: string) { return name.split('.').pop()?.toLowerCase() ?? ''; }
function parseClock(value: string): number | null {
  const parts = value.replace(/[\[\]]/g, '').split(':').map(Number);
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) return null;
  const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  if (minutes > 59 || seconds > 59) return null;
  return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
}
function stableId(line: number, speaker: string | null, text: string) {
  let hash = 2166136261;
  for (const character of `${line}:${speaker ?? ''}:${text}`) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `seg-${line}-${(hash >>> 0).toString(36)}`;
}
function matchHeader(line: string): {speaker:string|null;startMs:number|null}|null {
  const timestampFirst = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+(.+)$/);
  if (timestampFirst) { const startMs=parseClock(timestampFirst[1]); if(startMs!==null) return {speaker:timestampFirst[2].trim(),startMs}; }
  const speakerFirst = line.match(/^(.+?)\s+(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (speakerFirst) { const startMs=parseClock(speakerFirst[2]); if(startMs!==null) return {speaker:speakerFirst[1].trim(),startMs}; }
  return null;
}

export function parseTranscript(raw: string): TranscriptSegment[] {
  const cleaned=raw.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  if(!cleaned) throw new Error('음성 기록이 비어 있습니다.');
  const segments:TranscriptSegment[]=[];
  let current:{speaker:string|null;startMs:number|null;line:number;body:string[]}|null=null;
  const flush=()=>{ if(!current)return; const text=current.body.join('\n').trim(); if(text)segments.push({id:stableId(current.line,current.speaker,text),speaker:current.speaker,startMs:current.startMs,endMs:null,text,line:current.line}); current=null; };
  cleaned.split('\n').forEach((source,index)=>{
    const line=source.trim(); if(!line)return;
    const header=matchHeader(line);
    if(header){flush();current={...header,line:index+1,body:[]};}
    else if(current) current.body.push(line);
    else { current={speaker:null,startMs:null,line:index+1,body:[line]}; }
  });
  flush();
  if(!segments.length)throw new Error('분석할 발언을 찾지 못했습니다.');
  return segments;
}

export function validateIntake(input:IntakeFiles):string[]{
  const errors:string[]=[];
  if(!input.audio&&!input.text)errors.push('녹음 또는 음성 기록 파일을 선택해 주세요.');
  if(input.audio){if(!AUDIO_EXTENSIONS.has(extension(input.audio.name)))errors.push('지원하지 않는 녹음 형식입니다.');if(input.audio.size<=0)errors.push('녹음 파일이 비어 있습니다.');if(input.audio.size>500*1024*1024)errors.push('녹음 파일은 500MB 이하여야 합니다.');}
  if(input.text){if(!TEXT_EXTENSIONS.has(extension(input.text.name)))errors.push('음성 기록은 TXT 또는 DOCX 형식이어야 합니다.');if(input.text.size<=0)errors.push('음성 기록 파일이 비어 있습니다.');if(input.text.size>20*1024*1024)errors.push('음성 기록은 20MB 이하여야 합니다.');}
  return errors;
}
export function validateEvidence(ids:string[],segments:TranscriptSegment[]):boolean{const valid=new Set(segments.map(s=>s.id));return ids.length>0&&ids.every(id=>valid.has(id));}
export function editProposal<T extends {content:string;status:'draft'|'approved';version:number}>(proposal:T,content:string):T{return proposal.content===content?proposal:{...proposal,content,status:'draft',version:proposal.version+1};}
export function makeExtractiveDraft(segments:TranscriptSegment[]):Minutes{return{source:'local-extract',summary:segments.slice(0,5).map(s=>({text:s.text,sourceIds:[s.id]})),decisions:[],requirements:[],actions:[],questions:['현재는 연결 전 체험 모드입니다. 결정 사항과 후속 업무를 직접 검토해 주세요.']};}
export function validateGeneratedMinutes(input:Omit<Minutes,'source'>,segments:TranscriptSegment[]):Minutes{
  const claims=[...input.summary,...input.decisions,...input.requirements,...input.actions];
  if(claims.some(claim=>!validateEvidence(claim.sourceIds,segments)))throw new Error('생성 결과가 존재하지 않는 발언 근거를 참조합니다.');
  return{...input,source:'gpt'};
}
export function formatTimestamp(ms:number|null):string{if(ms===null)return'시간 없음';const sec=Math.floor(ms/1000),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;}
