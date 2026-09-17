# 고객 미팅 플랫폼용 GPT API 사용 가이드

> 작성일: 2026-09-17 / 버전: 1.0
> 대상: 현재 Windows 노트북에서 고객 미팅 플랫폼을 준비하는 사용자.
> 현재 상태: 기획 문서와 사용 절차만 작성되었다. 계정 생성, 결제, API 키 발급, 프로그램 설치, 유료 API 호출은 수행하지 않았다.
> 연결 문서: [플랫폼 상세 기획서 v1.2](<C:/Users/Demo/Desktop/BS SA Project/고객사_미팅_회의록_제안서_자동화_플랫폼_상세기획서.md>)
> 배포 방식 추가: [Vercel·Supabase·MCP 개발 설계서](<C:/Users/Demo/Desktop/BS SA Project/Vercel_Supabase_MCP_기반_플랫폼_개발설계서.md>)가 운영 배치에 우선한다. 아래 PowerShell 예제는 로컬 연결 시험용이며, 배포 앱은 GPT 키를 Vercel 서버 환경 변수에 보관한다. 업로드 녹음·TXT와 결과물은 Supabase에 저장하며 참고 문서 원본은 로컬에 유지한다.

## 1. 먼저 이해할 구성

노트북에서 고객 정보·녹음·클로바노트 TXT·참고 문서를 관리하고, 문장을 이해하고 작성하는 작업만 OpenAI API에 요청한다. 대형 로컬 LLM이나 별도 GPU 구매를 전제로 하지 않는다.

| 작업 | 위치 |
|---|---|
| 클로바노트 다운로드 파일 읽기 | 노트북 |
| 녹음 저장·재생 | 노트북 |
| 회의록·요구사항 추출 | 외부 GPT API |
| 제안서 참고 자료 검색 | 노트북 |
| 요구사항·자료 발췌를 이용한 제안서 작성 | 외부 GPT API |
| DOCX·PDF 생성·보관 | 노트북 |

기본 업로드는 **녹음 파일+음성 기록 TXT**이다. TXT가 정상적으로 있으면 녹음을 다시 전사하지 않는다. 이때 외부로 나가는 것은 회의 텍스트와 필요한 자료 발췌이며, 음성 파일은 로컬에 남는다.

클로바노트에서 이미 진행한 처리는 별개의 외부 서비스 사용이다. 이 플랫폼의 로컬 저장 정책이 클로바노트의 처리·보존 정책까지 바꾸지는 않는다.

## 2. OpenAI 계정과 프로젝트 준비

1. [OpenAI Platform](https://platform.openai.com/)에 접속하고 로그인한다.
2. 조직 선택이 있으면 이 업무에 사용할 조직을 선택한다.
3. 플랫폼 설정에서 이 업무용 프로젝트를 만든다. 예시 이름은 `BS-SA-Meeting`이다. 기존 전용 프로젝트가 있으면 재사용한다.
4. 개인 시험과 회사 운영은 프로젝트와 키를 분리하는 구성을 권장한다.
5. 결제 담당자와 실제 프로그램 사용자를 구분한다. 프로젝트 생성·결제 메뉴가 보이지 않으면 조직 관리자 권한을 확인한다.

메뉴 명칭과 배치는 변경될 수 있으므로 링크가 조직 선택 화면으로 연결되면 먼저 해당 조직·프로젝트를 선택한다. 계정별 실제 화면·모델 권한은 이 문서 작성 과정에서 확인하지 않았다. [공식 시작 안내](https://developers.openai.com/api/docs/quickstart), [조직·운영 안내](https://developers.openai.com/api/docs/guides/production-best-practices)

## 3. 결제와 사용 한도 설정

1. [API 결제 화면](https://platform.openai.com/account/billing/overview)을 연다.
2. 현재 API 결제 상태, 결제 수단, 사용 가능한 크레딧을 확인한다.
3. 계정에 표시되는 방식에 따라 결제 수단을 등록하거나 크레딧을 구매한다. 무료 크레딧이 있다고 가정하지 않는다.
4. 초기 시험에는 작은 예산을 정한다. 예를 들어 월 $10은 사용자가 선택할 수 있는 시험 예산 예시이며 서비스의 최소 결제 금액이나 예상 청구액이 아니다.
5. 사용량 알림과 실제 호출을 차단하는 지출 한도는 구분한다. 계정에서 제공되는 지출 한도 기능과 적용 범위를 확인한다.
6. 앱에도 별도 월 예산·작업당 한도를 설정하도록 구현한다. 이미 진행 중인 요청과 집계 지연으로 한도를 약간 넘는 비용이 생길 수 있다.

이 플랫폼은 OpenAI API 결제·사용량을 기준으로 운영한다. 현재 대화 앱의 로그인 상태나 구독만으로 API 사용 준비가 끝났다고 가정하지 말고 API 결제 화면을 확인한다. [공식 결제·한도 운영 안내](https://developers.openai.com/api/docs/guides/production-best-practices)

## 4. API 키 발급과 보관

1. [API Keys 화면](https://platform.openai.com/api-keys)을 연다.
2. 올바른 조직·프로젝트가 선택되었는지 확인한다.
3. 새 비밀 키를 생성한다. 이름은 용도를 알아볼 수 있게 `meeting-local-dev` 등으로 지정한다.
4. 제한 권한 설정을 사용할 수 있다면 필요한 모델 호출·Responses 권한을 부여한다. 음성 전사를 사용할 때만 해당 API 권한을 추가한다. 이 앱 실행에 조직 관리자용 API 키는 필요하지 않다.
5. 키를 개인 비밀번호 관리자 등 안전한 장소에 저장한다. 분실하거나 노출되면 기존 키를 폐기하고 새로 발급한다.
6. 운영 시에는 만료·교체 절차를 정하고, 새 키로 연결을 확인한 뒤 기존 키를 폐기한다.

**키를 이 채팅, 회의록, 기획서, 스크린샷 또는 공유 저장소에 붙여 넣지 않는다.** 실제 프로그램에는 서버 측 환경 변수 또는 비밀 저장소로 전달한다. 브라우저 코드·로컬 스토리지에 키를 보관하지 않는다. [공식 API 인증 안내](https://platform.openai.com/docs/api-reference/introduction), [키 관리 안내](https://developers.openai.com/api/docs/guides/production-best-practices)

환경 변수는 전달 수단이며 암호화된 보관함과 동일하지 않다. 초기 수동 시험은 아래처럼 현재 PowerShell 세션에만 입력하고, 상시 실행 앱은 Windows 자격 증명 저장소 등으로 보호하도록 구현한다.

## 5. 이 플랫폼의 초기 모델 설정

| 설정 이름 | 초기 값 | 목적 |
|---|---|---|
| 회의록 모델 | gpt-4.1-mini | 요약·결정 사항·업무·요구사항 |
| 제안서 모델 | gpt-4.1 | 로컬 자료 발췌 기반 본문 작성 |
| 화자 구분 전사 모델 | gpt-4o-transcribe-diarize | 녹음만 있을 때 화자·구간 전사 |
| 비용 우선 전사 옵션 | gpt-4o-mini-transcribe | 기본 전사, 화자·시간 기능 제한 표시 |
| 외부 문서 저장소 | 사용 안 함 | 검색 저장소를 노트북에서 운영 |
| 외부 음성 전사 | 기본 자동 실행 안 함 | TXT 없는 경우 명시적 모드 선택 |
| Responses 결과 저장 | store=false | 대화 상태는 앱에서 보관 |

이전 검토 모델을 출발점으로 사용하며 최신 모델을 뜻하지 않는다. 모델 접근이 안 되면 API 키·프로젝트의 권한과 해당 모델의 사용 가능 여부를 확인한다. 다른 모델로 교체할 때는 비용·응답 형식·한국어 품질을 다시 검증한다. [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1), [전사 가이드](https://developers.openai.com/api/docs/guides/speech-to-text)

## 6. Windows에서 API 연결 확인하기

### 6.1 시험의 범위

아래는 프로그램 개발 전 API 키·결제·모델 연결을 확인하기 위한 선택적 수동 시험이다. Windows PowerShell에서 실행할 수 있도록 REST 요청을 사용하며 추가 SDK 설치는 필요하지 않다. 실제 고객 파일은 읽거나 전송하지 않는다. 실행하면 소량의 유료 API 사용이 발생할 수 있다.

이 문서의 코드는 구문 검토용 예제이며 실제 키로 실행해 검증한 결과가 아니다.

### 6.2 실행 방법

1. Windows에서 PowerShell을 연다.
2. 아래 블록을 복사해 실행한다.
3. 키 입력 안내가 나오면 발급한 키를 입력한다. 입력한 값이 화면에 표시되지 않는 것은 정상이다.
4. 가상의 회의 내용에 대한 짧은 요약이 출력되는지 확인한다.
5. 키는 현재 세션에서 시험이 끝나면 제거한다. 이 방법은 앱의 영구 연결 설정을 대신하지 않는다.

```powershell
$meetingSecureKey = Read-Host 'OpenAI API 키 입력 (화면에 표시되지 않음)' -AsSecureString
$meetingCredential = [System.Net.NetworkCredential]::new('', $meetingSecureKey)
$env:OPENAI_API_KEY = $meetingCredential.Password

try {
    $meetingPayload = @{
        model = 'gpt-4.1-mini'
        store = $false
        max_output_tokens = 200
        input = '아래 가상 회의 내용을 한국어로 한 문장으로 요약하세요: 시범 도입은 다음 달에 검토하고, 예산과 담당자는 다음 회의에서 정하기로 했습니다.'
    } | ConvertTo-Json -Depth 5

    $meetingHeaders = @{
        Authorization = 'Bearer ' + $env:OPENAI_API_KEY
    }
    $meetingRequest = @{
        Uri = 'https://api.openai.com/v1/responses'
        Method = 'Post'
        Headers = $meetingHeaders
        ContentType = 'application/json; charset=utf-8'
        Body = [System.Text.Encoding]::UTF8.GetBytes($meetingPayload)
        TimeoutSec = 120
        ErrorAction = 'Stop'
    }
    $meetingResponse = Invoke-RestMethod @meetingRequest
    if ($meetingResponse.status -ne 'completed') {
        throw '응답이 완료되지 않았습니다. 출력 제한 또는 응답 상태를 확인하세요.'
    }
    $meetingTexts = @(
        foreach ($meetingItem in $meetingResponse.output) {
            if ($meetingItem.type -eq 'message') {
                foreach ($meetingPart in $meetingItem.content) {
                    if ($meetingPart.type -eq 'output_text') {
                        $meetingPart.text
                    }
                }
            }
        }
    )
    if ($meetingTexts.Count -eq 0) {
        throw '텍스트 응답이 없습니다. 거절 또는 응답 내용을 확인하세요.'
    }
    $meetingTexts -join "`n"
    [pscustomobject]@{
        InputTokens = $meetingResponse.usage.input_tokens
        OutputTokens = $meetingResponse.usage.output_tokens
    }
}
finally {
    Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
    $meetingHeaders = $null
    $meetingRequest = $null
    $meetingCredential = $null
    if ($null -ne $meetingSecureKey) { $meetingSecureKey.Dispose() }
    $meetingSecureKey = $null
}
```

응답 문구는 매번 달라질 수 있다. ‘다음 달 시범 도입을 검토하고 예산과 담당자는 다음 회의에서 정한다’는 의미가 유지되면 된다. PowerShell 창을 닫아 세션을 종료한다. 실행 중에는 인증을 위해 키가 프로세스 메모리에서 사용되며, 위 정리가 메모리의 모든 복사본을 완전히 지운다는 보장은 아니다.

이 예제는 공식 Responses 요청 구조를 사용한다. 정식 앱은 검토 상태·출처·재시도·예산·구조화 출력 검증을 추가해야 한다. [공식 시작 안내](https://developers.openai.com/api/docs/quickstart)

## 7. 오류가 발생했을 때

| 오류·증상 | 확인할 항목 | 대응 |
|---|---|---|
| 401 | 키 오류·만료·프로젝트 또는 IP 정책 | 키와 권한 확인, 필요하면 재발급 |
| 403 또는 모델 접근 오류 | 계정·지역·프로젝트 정책 | 사용 가능한 모델·접근 권한 확인 |
| 400 | 잘못된 입력·지원하지 않는 옵션 | 요청 형식과 모델 지원 항목 확인 |
| 429, 호출 빈도 제한 | 너무 많은 요청 | 지연 후 재시도, 동시 작업 수 감소 |
| 429, 크레딧·지출·사용량 한도 | 결제 부족 또는 한도 도달 | 결제·한도 설정 확인; 반복 재시도로 해결되지 않음 |
| 500·503 | 공급자 일시 오류 | 제한된 재시도 |
| 연결 시간 초과 | 네트워크·방화벽·서비스 지연 | 결과 확인 후 재시도, 무조건 반복 호출 금지 |
| 정상 응답이지만 비어 있음 | 응답 미완료·거절·출력 제한 | 상태 확인, 원문을 성공 결과로 덮어쓰지 않음 |

오류를 공유할 때는 상태 코드와 `error.code` 등 필요한 내용만 전달하고 인증 헤더·API 키·고객 본문은 제거한다. [공식 오류 안내](https://developers.openai.com/api/docs/guides/error-codes)

## 8. 비용 계산 예시

2026-09-17 확인한 표준 텍스트 단가를 사용한 예시다. 세금·환율·추가 호출·도구·오디오 요금은 포함하지 않는다. 할인 캐시 입력은 사용하지 않는 것으로 계산한다.

| 모델 | 입력 100만 토큰 | 출력 100만 토큰 |
|---|---:|---:|
| GPT-4.1 mini | $0.40 | $1.60 |
| GPT-4.1 | $2.00 | $8.00 |

출처: [mini 모델 요금](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [제안서 모델 요금](https://developers.openai.com/api/docs/models/gpt-4.1)

- 회의록: mini에 입력 20,000·출력 4,000토큰 → $0.0144.
- 제안서: GPT-4.1에 입력 20,000·출력 8,000토큰 → $0.104.
- 위 두 작업 합계 → $0.1184.

이는 사용량을 가정한 계산이며 ‘미팅 1건 고정 가격’이 아니다. 분할 요약, 요구사항 분석, 절별 재작성까지 포함한 실제 전체 호출량으로 정산한다. TXT를 제공하면 추가 음성 전사 비용은 발생하지 않지만 GPT 텍스트 처리 비용은 발생한다.

## 9. 데이터 전송·보존 확인

- GPT에 전달한 텍스트는 외부 처리 대상이다. 원본 문서를 로컬에 둬도 발췌는 외부로 나간다.
- 회의록에는 고객의 민감한 정보가 있을 수 있으므로 전송 허용 범위를 문서·미팅별로 적용한다.
- OpenAI API는 별도 동의가 없으면 입력을 모델 학습에 사용하지 않는다.
- 학습 미사용과 무보존은 다르다. 기본 텍스트 API 남용 모니터링 기록은 최대 30일 보존될 수 있으며 예외가 있다.
- `store=false`는 모든 보존을 없애는 설정이 아니다. 엄격한 무보존이 필요하면 Zero Data Retention의 승인 조건과 해당 API 지원 범위를 확인한다.

관련 정책은 출시 전 다시 확인한다. [공식 데이터 정책](https://developers.openai.com/api/docs/guides/your-data)

## 10. 플랫폼 구현 후 사용자 작업 순서

다음은 구현할 화면의 사용 절차다. 현재 이 버튼과 화면이 존재한다는 의미는 아니다.

1. 설정에서 API 연결 정보를 등록하고 가상 문장으로 연결을 확인한다.
2. 고객사·미팅을 등록한다.
3. 클로바노트에서 같은 미팅의 녹음과 TXT 음성 기록을 다운로드한다. 가능하면 시간·참석자 정보를 포함한다.
4. ‘녹음 파일’과 ‘음성 기록 TXT’ 영역에 각각 파일을 첨부한다.
5. 파일별 업로드 완료와 텍스트 미리보기를 확인한다.
6. ‘TXT 활용 / 녹음 외부 전송 없음’ 표시를 확인하고 분석을 시작한다.
7. 회의록과 요구사항을 확인·수정한다.
8. 로컬 저장소에서 찾은 참고 자료의 발췌와 외부 전송 허용 여부를 확인한다.
9. 제안서를 생성하고 검토·승인한다.
10. DOCX·PDF를 저장하고 API 사용량을 확인한다.

음성 파일만 있을 때는 ‘외부 음성 전사’를 선택한다. 입력 파일은 플랫폼에서 지원 형식으로 변환·분할한 후 음성 API에 전달한다. 실제 클로바노트 다운로드 형식과 TXT 레이아웃은 첫 샘플로 확인한다.

## 11. 준비 완료 체크

- [ ] 업무용 OpenAI 조직·프로젝트를 선택했다.
- [ ] API 결제와 사용 한도를 확인했다.
- [ ] 비밀 키를 안전하게 보관하고 채팅에 공유하지 않았다.
- [ ] 가상 문장 연결 시험에서 모델 응답을 확인했다.
- [ ] 업무 자료의 외부 전송 범위를 정했다.
- [ ] 같은 미팅의 녹음+TXT 샘플을 준비했다.
- [ ] 제안서에 참고할 로컬 폴더와 기본 템플릿을 정했다.

이 체크리스트는 사용자가 이후 수행할 준비 절차이며 현재 완료 처리된 항목은 없다.
