import type { WorkspaceData } from './types';

export const EMPTY_WORKSPACE: WorkspaceData = { customers: [], meetings: [], proposals: [], documents: [] };

export const SAMPLE_WORKSPACE: WorkspaceData = {
  customers: [
    { id:'sample-c1', name:'한빛물류', industry:'물류·유통', contact:'김현우 팀장', note:'현장 점검 프로세스 디지털화 검토', createdAt:'2026-09-16T09:00:00+09:00' },
    { id:'sample-c2', name:'세림바이오', industry:'바이오', contact:'박서연 매니저', note:'문서 승인 흐름 개선', createdAt:'2026-09-12T09:00:00+09:00' },
  ],
  meetings: [{
    id:'sample-m1', customerId:'sample-c1', title:'현장 점검 시스템 도입 미팅', heldAt:'2026-09-16T14:00:00+09:00', participants:'김현우 팀장, 이지훈 매니저', status:'review',
    transcript:'참석자 1 00:03\n현장 점검 결과를 모바일에서 바로 입력하고 싶습니다.\n참석자 2 01:12\n기존 ERP 연동 범위는 기술팀 확인이 필요합니다.\n참석자 1 02:20\n다음 회의에서 예산과 일정을 정하겠습니다.',
    segments:[
      {id:'sample-s1',speaker:'참석자 1',startMs:3000,endMs:null,text:'현장 점검 결과를 모바일에서 바로 입력하고 싶습니다.',line:1},
      {id:'sample-s2',speaker:'참석자 2',startMs:72000,endMs:null,text:'기존 ERP 연동 범위는 기술팀 확인이 필요합니다.',line:3},
      {id:'sample-s3',speaker:'참석자 1',startMs:140000,endMs:null,text:'다음 회의에서 예산과 일정을 정하겠습니다.',line:5},
    ],
    minutes:{source:'sample',summary:[{text:'모바일 현장 점검과 ERP 연동 가능성을 논의했습니다.',sourceIds:['sample-s1','sample-s2']}],decisions:[],requirements:[{text:'현장 점검 결과를 모바일에서 입력할 수 있어야 합니다.',sourceIds:['sample-s1']}],actions:[{text:'ERP 연동 범위를 기술팀과 확인합니다.',owner:null,due:null,sourceIds:['sample-s2']}],questions:['예산과 상세 일정은 다음 회의에서 확인해야 합니다.']},
    audioName:'hanbit-meeting.m4a',textName:'hanbit-meeting.txt',version:1,createdAt:'2026-09-16T14:00:00+09:00'
  }],
  proposals:[{id:'sample-p1',meetingId:'sample-m1',title:'한빛물류 현장 점검 디지털화 제안',content:'# 제안 요약\n\n현장 점검 결과를 모바일로 수집하고 기존 ERP 연동 가능성을 검토합니다.\n\n## 확인이 필요한 사항\n\n- ERP 연동 범위\n- 예산 및 도입 일정',status:'draft',version:1,createdAt:'2026-09-16T16:00:00+09:00',source:'sample',evidenceIds:['sample-s1','sample-s2']}],
  documents:[{id:'sample-d1',name:'모바일 점검 서비스 소개.md',category:'서비스 소개',content:'모바일 점검표 작성 및 현장 사진 등록 기능을 제공합니다.',allowAI:true,createdAt:'2026-09-10T09:00:00+09:00'}]
};
