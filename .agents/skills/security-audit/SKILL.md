---
name: security-audit
description: 보안 취약점 감사 가이드. OWASP Top 10 점검, 시크릿 하드코딩 탐지, 입력값 검증, 안전한 인증/인가, 웹 요청 보호, 의존성 공급망을 확인할 때 사용.
---

# Security Audit Guide

이 스킬은 코드 작성 및 리뷰 단계에서 치명적인 보안 결함을 사전에 탐지하고 방어 코드를 작성하도록 안내합니다.

## 핵심 감사 체크리스트

### 1. 시크릿 및 인증 정보 노출 방지
- [ ] API 키, DB 비밀번호, JWT Secret, 비대칭키가 소스 코드에 하드코딩되어 있지 않은가?
- [ ] `.env`, `.env.local` 등 민감 파일이 `.gitignore`에 등록되어 있는가?
- [ ] 에러 메시지나 로그에 비밀번호, 세션 토큰, 개인정보(주민번호/이메일/카드번호 등)가 출력되지 않는가?

### 2. 주입 공격 방어 (Injection Prevention)
- [ ] **SQL Injection**: 모든 데이터베이스 쿼리에 Parameterized Query (PreparedStatement 또는 ORM 매개변수 바인딩)를 사용하는가? 문자열 연결(`+` 또는 f-string)로 쿼리를 조립하지 않았는가?
- [ ] **Command Injection**: `exec`, `eval`, `child_process`, `os.system` 등에 검증되지 않은 사용자 입력을 직접 전달하지 않는가?
- [ ] **XSS (Cross-Site Scripting)**: 사용자 입력 텍스트를 HTML로 렌더링할 때 적절한 이스케이프(Sanitization) 처리를 하였는가?

### 3. 인증 및 인가 (Auth & Authorization)
- [ ] 사용자의 신원(Authentication)뿐만 아니라 해당 리소스에 접근할 권한(Authorization)을 서버 측에서 매 요청마다 검증하는가? (IDOR 취약점 방지)
- [ ] 비밀번호는 bcrypt, argon2 등 단방향 솔트 해시 알고리즘으로 안전하게 저장되는가?
- [ ] JWT 토큰의 만료 시간(Expiration)이 적절히 짧게 설정되어 있고, 서명 검증이 누락되지 않았는가?

### 4. 입력값 유효성 검사 및 에러 처리
- [ ] 모든 API 엔드포인트에서 입력값의 타입, 길이, 정규식 포맷, 허용 범위(White-listing)를 검증하는가?
- [ ] 서버 내부 스택 트레이스(Stack Trace)나 DB 에러가 클라이언트 응답으로 직접 노출되지 않는가?
- [ ] 파일 업로드는 크기·확장자·MIME 타입을 서버에서 제한하고, 저장 경로에 사용자 입력 파일 이름을 그대로 쓰지 않는가?
- [ ] 서버가 사용자가 준 URL로 요청을 보내는 기능(웹훅·미리보기·가져오기)은 내부망·메타데이터 주소를 막는가? (SSRF)

### 5. 웹 요청 보호 (웹 API·브라우저 앱만 — 해당 없으면 "해당 없음 — 사유")
- [ ] 세션·인증 토큰은 `httpOnly`·`Secure`·`SameSite` 쿠키에 두고 `localStorage`에 두지 않는가?
- [ ] 상태를 바꾸는 요청(POST·PUT·DELETE)에 CSRF 방어(SameSite 쿠키 또는 CSRF 토큰)가 있는가?
- [ ] 로그인·비밀번호 재설정·비용이 큰 엔드포인트에 요청 횟수 제한(rate limit)이 있는가?
- [ ] CORS 허용 출처가 와일드카드(`*`)가 아닌 명시 목록이고, 자격 증명 포함 요청과 `*`를 함께 쓰지 않는가?
- [ ] 보안 헤더(CSP, `X-Frame-Options` 또는 CSP `frame-ancestors`)와 운영 환경 HTTPS 강제가 설정돼 있는가?

### 6. 의존성 공급망 (reviewer 검토 순서·DoD "신규 의존성 출처 확인"의 근거)
- [ ] 이번 변경에서 새로 추가한 패키지마다 출처(공식 저장소·관리 주체)와 이름 철자를 확인했는가? (오타 스쿼팅 방지 — 비슷한 이름의 가짜 패키지)
- [ ] 새 패키지가 Architecture 스택 표에 있거나, 없으면 architect 결정(DECISIONS/ADR)이 있는가?
- [ ] 잠금 파일(`package-lock.json`·`pnpm-lock.yaml`·`poetry.lock` 등)이 커밋돼 있어 설치 버전이 고정되는가?
- [ ] 패키지 관리자의 취약점 점검(`npm audit`, `pip-audit` 등 프로젝트의 검증된 명령)에서 높음·치명 등급이 0건인가? 남기면 사유와 대응 계획을 보고에 적는가?
- [ ] 설치 스크립트(`postinstall` 등)가 있는 새 패키지는 그 내용을 확인했는가?
- [ ] 비밀값이 Git 이력에 한 번이라도 들어간 적이 있으면 키를 폐기·교체했는가? (커밋 삭제만으로는 부족하다)

(5·6절 항목 일부는 `affaan-m/ECC` `skills/security-review` 체크리스트(MIT)에서 스택에 무관한 것만 골라 차용했다 — 2026-11-18.)
