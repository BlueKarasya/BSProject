# Supabase 개발 프로젝트 설정

1. 실제 고객 자료를 넣지 않는 개발 프로젝트를 생성합니다.
2. SQL Editor 또는 CLI로 `supabase/migrations/202609170001_initial.sql`을 적용합니다.
3. 새 테스트 사용자를 두 명 만들고 각자 `bootstrap_organization` RPC를 한 번 호출합니다.
4. `supabase/tests/access.sql`의 플레이스홀더 UUID를 테스트 값으로 바꾼 뒤 개발 DB에서만 실행합니다.
5. 다른 조직의 고객·미팅·파일을 읽거나 수정하지 못하는지 확인합니다.
6. `meeting-inputs` 버킷이 private이며 예약된 `assets.object_path`만 업로드 가능한지 확인합니다.
7. Publishable key는 브라우저에서 사용할 수 있지만 RLS를 끄지 않습니다. Secret/service-role 키는 Vercel 서버 환경 변수에만 등록합니다.

이 저장소에는 실제 키를 넣지 않습니다. `.env.local`은 `.gitignore`에 포함되어 있습니다.

## MCP 연결

초기 확인은 개발 프로젝트에 한정한 읽기 전용 주소를 사용합니다.

```text
https://mcp.supabase.com/mcp?project_ref=<개발프로젝트ID>&read_only=true
```

스키마 변경이 필요하면 쓰기 권한을 잠시 사용하더라도 동일 변경을 반드시 migration 파일로 남깁니다. 운영 프로젝트 연결은 개발 검증 이후 별도로 진행합니다.
