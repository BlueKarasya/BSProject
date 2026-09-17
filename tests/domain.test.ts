import { describe, it, expect } from 'vitest';
import { parseTranscript, validateIntake, validateEvidence, editProposal, makeExtractiveDraft, validateGeneratedMinutes } from '../src/lib/domain';

describe('Clova transcript import', () => {
  it('preserves speakers and real start times without inventing end times', () => {
    const result = parseTranscript('참석자 1 00:03\n모바일 점검 기능이 필요합니다.\n참석자 2 01:12\n예산은 다음에 확인하겠습니다.');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ speaker:'참석자 1', startMs:3000, endMs:null, text:'모바일 점검 기능이 필요합니다.' });
    expect(result[1].startMs).toBe(72000);
  });
  it('retains ordinary text without fabricating a speaker or time', () => {
    const result = parseTranscript('고객은 현장 점검을 디지털화하고 싶다.');
    expect(result[0]).toMatchObject({speaker:null,startMs:null,endMs:null,line:1});
  });
  it('supports timestamp-first records and multi-line utterances', () => {
    const result = parseTranscript('[00:01:05] 김담당\n첫 번째 줄\n두 번째 줄');
    expect(result[0]).toMatchObject({speaker:'김담당',startMs:65000,text:'첫 번째 줄\n두 번째 줄'});
  });
  it('does not misinterpret a date or invalid timestamp as audio position', () => {
    expect(parseTranscript('2026-09-17 고객 미팅\n참석자 1 00:99\n내용')[0].startMs).toBeNull();
  });
  it('rejects empty text instead of generating a meeting', () => {
    expect(() => parseTranscript(' \n\uFEFF')).toThrow();
  });
});
describe('safe intake and generation', () => {
  it('allows audio with text but rejects unsupported or oversized files', () => {
    expect(validateIntake({audio:{name:'meeting.m4a',size:300},text:{name:'meeting.txt',size:120}})).toEqual([]);
    expect(validateIntake({text:{name:'meeting.exe',size:120}}).length).toBeGreaterThan(0);
    expect(validateIntake({audio:{name:'a.wav',size:501*1024*1024}}).length).toBeGreaterThan(0);
    expect(validateIntake({text:{name:'a.txt',size:0}}).length).toBeGreaterThan(0);
    expect(validateIntake({})).not.toEqual([]);
  });
  it('does not accept non-existent sources', () => {
    const segments=parseTranscript('자료 원문');
    expect(validateEvidence([segments[0].id],segments)).toBe(true);
    expect(validateEvidence(['missing'],segments)).toBe(false);
    expect(validateEvidence([],segments)).toBe(false);
  });
  it('invalidates approval and increases version when approved text changes', () => {
    expect(editProposal({content:'이전 내용',status:'approved',version:2},'수정 내용')).toEqual({content:'수정 내용',status:'draft',version:3});
    expect(editProposal({content:'동일',status:'approved',version:2},'동일').status).toBe('approved');
  });
  it('local extractive draft never invents decisions or tasks', () => {
    const draft=makeExtractiveDraft(parseTranscript('예산은 아직 모릅니다.'));
    expect(draft.decisions).toEqual([]);
    expect(draft.actions).toEqual([]);
    expect(draft.source).toBe('local-extract');
    expect(draft.summary[0].text).toBe('예산은 아직 모릅니다.');
  });
  it('rejects generated minutes that cite absent transcript segments', () => {
    const segments=parseTranscript('근거 문장');
    const valid={summary:[{text:'요약',sourceIds:[segments[0].id]}],decisions:[],requirements:[],actions:[],questions:[]};
    expect(validateGeneratedMinutes(valid,segments).source).toBe('gpt');
    expect(()=>validateGeneratedMinutes({...valid,requirements:[{text:'가짜 요구',sourceIds:['not-real']}]},segments)).toThrow('존재하지 않는');
  });
});
