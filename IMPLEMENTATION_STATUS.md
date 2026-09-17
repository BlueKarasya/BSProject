# 구현 상태 — 2026-09-17

## 구현 및 로컬 검증 완료

- Next.js 기반 반응형 한국어 웹 UI
- 대시보드, 고객사, 미팅, 회의록, 제안서, 자료 저장소, 설정 화면
- 클로바노트 TXT 파서: 화자·시간 보존, 누락 정보 미생성
- 녹음/TXT 확장자·크기·빈 파일 검증
- 브라우저 저장형 체험 흐름과 명시적인 샘플/규칙 기반 표시
- 회의록 편집·확정, 제안서 생성·수정 시 승인 무효화, Markdown 다운로드
- OpenAI 구조화 출력과 전사 구간 출처 검증 코드
- Supabase 초기 스키마·조직별 RLS·비공개 Storage 정책·작업 임대 함수
- Supabase `BSProject` 운영 프로젝트에 8개 테이블·22개 RLS/Storage 정책 적용 및 확인
- Vercel/로컬 환경에서 Supabase Auth API 도달 여부를 확인하는 상태 검사
- 실제 브라우저에서 클로바노트 TXT 등록 → 3개 발화 구간 파싱 → 회의록 생성·확정 → 제안서 생성 흐름 검증
- Next.js 운영 빌드와 API Route 포함 전체 TypeScript 검사

## 코드가 준비됐지만 외부 환경에서 미검증

- Supabase SQL 교차 조직 접근 시험
- 로그인 토큰과 RLS를 사용하는 GPT 회의록 분석 Route Handler

Supabase 스키마와 Vercel 배포는 연결했습니다. 사용자 로그인·조직 생성 전이므로 실제 고객 데이터 저장과 OpenAI 호출은 아직 실행하지 않았습니다.

## 최근 검증 결과

- `npm test`: 10개 시험 통과
- `npm run typecheck`: 통과
- `npm run build`: 통과 (`/`, `/api/status`, `/api/meetings/[id]/analyze` 생성 확인)
- 브라우저 콘솔 오류·경고: 없음

## 다음 개발 단계

- Supabase 로그인/초대 UI와 클라우드 데이터 어댑터
- 브라우저 → Supabase Storage TUS 직접 업로드
- 파일 검사 완료 처리와 입력 묶음 API
- Supabase Queue + Vercel Cron 작업자
- OpenAI 제안서 생성 API 및 비용 예약/집계
- Windows 로컬 폴더 연결 프로그램과 문서 추출·검색
- DOCX/PDF 렌더링 및 시각 품질 검사
- 실계정 RLS·Storage 교차 조직 통합 시험

## 알려진 한계

- 체험 모드는 실제 파일 바이트를 영구 저장하지 않습니다.
- 체험 모드의 회의록은 AI 결과가 아니며 결정·업무를 추정하지 않습니다.
- DOCX 음성 기록, 녹음 단독 외부 전사, DOCX/PDF 출력은 아직 동작하지 않습니다.
- 현재 화면은 클라우드 연결 상태를 ‘미연결’로 고정 표시합니다.
