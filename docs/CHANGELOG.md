# CHANGELOG — {{PROJECT_NAME}}

> 소유자: docs | 형식: [Keep a Changelog](https://keepachangelog.com/ko/) 축약. 최신이 위.

## [Unreleased]

### Added
- 2026-11-17 `docs/ToolPacks.md` 웹 프론트엔드 팩에 전역(user 스코프) 설치 4건 반영: emil-design-eng(emilkowalski/skills 20개 중 이것만, 나머지 3개는 미설치), shadcn 공식 스킬(`shadcn-ui/ui`의 `skills/shadcn`), GSAP 공식 스킬(`greensock/gsap-skills`, 8종 설치 후 같은 날 gsap-frameworks 1종 제거해 현재 7종), 21st.dev 플러그인 v0.4.1(스킬 7개 + 원격 MCP 1개, 상시 약 1,513토큰). 같은 저장소의 `apple-design`·`migrate-radix-to-base`는 설치하지 않음으로 기록
- 2026-11-17 `docs/ToolPacks.md` MCP 표(context7·playwright·sequential-thinking 행): 2026-10-27 연결 실패·시간 초과의 원인 확인·해소 기록 — `npx`로 띄우는 서버 3개만 실패, 서버는 정상이나 시작에 40~49초가 걸려 30초 제한 초과, 세 패키지 전역 설치(`npm install -g`) 후 10~14초로 단축되고 `claude mcp list`에서 3개 연결. 빨라진 원인(전역 설치 대 내려받기 캐시)은 미확인으로 표기, 재발 시 `MCP_TIMEOUT` 검토(2026-11-17 사용자 결정)
- 2026-11-17 `docs/ToolPacks.md` 웹 프론트엔드 팩 주의 사항: GSAP 스킬 설명문이 "다른 라이브러리가 지정되지 않으면 GSAP 추천"이라 라이브러리 선택은 Architecture 스택 표를 따름, 8개 전부 설치(이후 1종 제거)는 통합 하네스 통설치에 해당하지 않는다는 판정 근거, 21st.dev의 `API_KEY_21ST`는 사용자가 직접 설정하며 MCP 인증 방식(환경 변수 키 대 `/mcp` 승인)은 미확인
- 2026-11-17 공용 스킬 `.agents/skills/root-cause-debugging/SKILL.md`(원인 진단 절차: 재현 → 위치 좁히기 → 최소화 → 근본 수정 → 재발 방지, 인과 사슬 확인, 재현 불가 분기표)와 Claude 연결 파일 `.claude/skills/root-cause-debugging/SKILL.md`. AGENTS.md 공용 스킬 표에 행 추가
- 2026-11-17 `docs/Lessons.md` — 검증된 틀린 가정·안 통한 시도 기록(행 추가는 메인 세션만, 자격·형태는 문서 안). AGENTS.md 문서 소유권 표에 행, 문서 우선순위 밖 문서임을 명시. planner·architect·implementer·reviewer 역할 원본이 `유효` 행을 참고 자료로 읽고, implementer·QA·reviewer 보고 템플릿에 `교훈 후보:` 전달 칸 추가
- 2026-11-17 `docs/KitFeedback.md`에 "어떤 형태로 고칠 것인가"(5단계 판정표)·"어디에 둘 것인가"·"성공 신호" 절과 행 7·8(Bash 가드 `git commit -n` 오탐 — 2026-11-17 사용자 결정으로 기각, 회피는 git 명령과 `-n` 옵션 명령을 별도 호출로 나눔)
- 2026-11-17 `docs/ToolPacks.md`: "토큰 절약 팩" 절(절약 목적 한정 허용 조건 — 현재 도입한 항목 없음, caveman은 미도입으로 표기), 보안 팩에 cloudflare/security-audit-skill, "참고 자료 (설치 대상 아님)" 절(public-apis, claude-code-best-practice), 전역 코어에 Agent Reach 행, 구현 보조 팩에 graphify 행(설치·전역 등록됨 v0.9.111, 이 킷 저장소 실측 — 노드 505·연결 1,059, 문서 추출에 약 51만 6천 토큰, 전역 설치가 `~/.claude/CLAUDE.md`에 등록 블록을 덧붙이는 점, 갱신 주기는 "작업 완료 시마다" 수동 `/graphify . --update` — 사용자 확정, AGENTS.md에는 미반영이라 강제 아님)
- 2026-10-27 Claude 전용 스킬 `.claude/skills/cli-delegate/SKILL.md` — Codex·안티그래비티에 작업을 넘기는 CLI 위임 절차(프롬프트는 파일·stdin으로 전달)
- 2026-10-27 AGENTS.md "다른 도구 세션과의 핸드오프" 절 — `.artifacts/handoff/{작업ID}/{실행ID}/`의 prompt.md·report.md 규칙, 메인 오케스트레이터는 Claude Code 세션임을 명시
- 2026-10-27 `.codex/DEVELOPMENT.md`, `.codex/FRONTEND.md`(Codex 개발 보조·UI 지침), `.codex/tests/adapters.test.cjs`(연결 파일·훅 배선 검사)
- 2026-10-27 `.claude/hooks/test-contract-check.js` — contract-check C5 워크트리 제외 회귀 검사
- 2026-10-27 docs/CodingRules.md "검증된 명령어"에 회귀 검사 2행과 위임 CLI 명령 2행 추가
- 2026-10-27 `.gitignore`에 `.artifacts/handoff/` 추가
- 2026-10-27 AGENTS.md "메인 세션과 서브에이전트 구분" 절 — 수행 주체 판정표(7행)와 단계별 적용 결과(인터뷰·기획/설계·구현·리뷰/QA/문서화)
- 2026-10-27 `.claude/hooks/test-contract-check.js`에 C5의 `.artifacts/` 제외 회귀 검사 추가
- 2026-10-27 docs/HarnessAudit.md "구성요소 유지·삭제 판정표"
- 2026-10-27 docs/CodingRules.md "검증된 명령어"에 Codex stdin 위임 명령(`-m`·`-o` 포함, 종료 코드 0 실측) 1행 추가
- 2026-10-27 AGENTS.md "사용자 화면 확인" 규칙 — 화면 확인은 사용자가 보는 Browser pane에서 하고 마지막 화면을 닫지 않고 남김, 리뷰·QA 통과 뒤 메인 세션이 `사용자 확인: 통과/보류/미요청 — 사유`를 기록
- 2026-10-27 AGENTS.md "앱 서브 세션 (Claude 데스크톱 앱)" 절 — 생성·보고·검증·제공·정리 5단계(정리는 보관이 기본, 영구 삭제는 명시 지시 시만)
- 2026-10-27 docs/DefinitionOfDone.md에 사용자 확인 기록 항목 추가(planner "완료" 전환 조건, 검증중 전환 조건 아님)
- 2026-10-27 implementer·QA 보고 템플릿에 "남긴 화면" 행 추가
- 2026-10-27 AGENTS.md 검증 루프에 "화면 흐름 회귀" 행 — 웹 UI의 PRD 핵심 사용자 흐름은 E2E 회귀 테스트를 Red-First로 두고, 세션 중 실물 확인과 서로 대신하지 않음(러너를 쓰지 않으면 사유를 Architecture에 기록)
- 2026-10-27 docs/DefinitionOfDone.md에 웹 UI E2E 회귀 항목 추가
- {{DATE}} 프로젝트 초기화 (start_coding 템플릿)

### Changed
- 2026-11-17 `.agents/roles/architect.role.md` 절차 7번: 시각적 완성도는 설계 대상이 아니지만 모션·UI 라이브러리를 쓸지와 무엇을 쓸지(GSAP·Framer Motion·shadcn 등 또는 CSS만)는 설계 대상으로 Architecture 스택 표에 적고, 표에 없는 라이브러리는 구현 단계 스킬이 추천해도 쓰지 않음을 명시(2026-11-17 사용자 결정: 모션 설계 분담은 역할 문서에 명시)
- 2026-11-17 `.agents/roles/implementer.role.md` 사전 읽기 9번: `gsap-*`·`shadcn` 스킬은 Architecture 스택 표에 해당 라이브러리가 있을 때만 쓴다는 불릿과 "모션·UI의 분담" 불릿 추가 — 라이브러리 선택은 스택 표(architect), 스킬 설명문의 특정 라이브러리 추천(GSAP 추천, 21st 먼저 검색)은 스택 표에 없으면 따르지 않음, 모션 배치는 implementer가 스킬로 구현하고 판단은 사용자 화면 확인, 보고에 모션을 화면·요소별로 적음
- 2026-11-17 `docs/ToolPacks.md` GSAP 스킬 행: "8종"을 "7종"으로 정정(gsap-frameworks를 같은 날 제거 — 사용자 결정, `npx skills remove -g -a claude-code -s gsap-frameworks`), 8종 설치 사실과 통설치 비해당 판정 근거(단일 목적 저장소) 유지, 분담은 architect·implementer 역할 원본 참조 안내 추가
- 2026-11-17 `docs/ToolPacks.md` 전역 코어 "스킬 7종" 행에 "이 행이 전역 스킬의 전부는 아니다" 설명 추가: `~/.claude/skills`에는 코어 외에 agent-reach·graphify·emil-design-eng·shadcn·gsap-* 7종(8종 설치 후 gsap-frameworks 제거)과 개인 스킬 2개가 더 있고, 전역 설치 스킬의 설명문은 모든 세션에 상시 로드됨. 같은 행에 플러그인 example-skills·cicd-automation·payment-processing이 2026-11-17 기준 비활성(사용자 결정)임을 기록
- 2026-11-17 `docs/ToolPacks.md`: LLM 게이트웨이 금지 문구에 "한도 우회 목적에 한한다 — 토큰 절약 목적의 로컬 도구·프록시는 해당하지 않는다(2026-11-17 사용자 결정)" 추가. ponytail 행을 실설치 기준(v5.3.3, 이전 "설치됨 (full 모드)" 표기는 설치 흔적이 없어 정정)으로 갱신, debugger 대체 행에 root-cause-debugging 편입 반영. 판정 규칙 "코드베이스 10k줄 이상" 행의 기본 도구를 Serena에서 graphify로 변경(Serena는 대안, 둘 중 하나만 사용 — 2026-11-17 사용자 결정)
- 2026-11-17 implementer·QA·reviewer 역할 원본: 같은 실패 2회 후 원인 분석을 root-cause-debugging 스킬로 연결 (QA·reviewer는 1~3단계 진단까지만). 스킬의 추정 원인 처리에 "서브에이전트는 보고하고 종료하며 승인을 기다리며 멈춰 있지 않는다" 보완
- 2026-11-17 `docs/KitFeedback.md`: 상태값에 부가 설명을 붙일 수 있게 하고 반영 절차에 형태 판정 단계 추가
- 2026-11-17 README: 구조의 docs/ 설명에 Lessons.md 추가
- 2026-10-27 역할 단일 원본을 `.agents/roles/*.role.md`로 통합 — `.claude/agents/*.md`와 `.codex/agents/*.toml`은 원본을 가리키는 연결 파일로 축소
- 2026-10-27 `.codex/EXECUTION.md`·`.agents/skills/vibe-mode/SKILL.md`·`docs/ToolPacks.md`·`docs/KitFeedback.md` 갱신, AGENTS.md 문서 소유권 표에 새 경로 반영
- 2026-10-27 `.claude/hooks/contract-check.js` C5 플레이스홀더 검사가 `.claude/worktrees/`를 제외
- 2026-10-27 `.claude/hooks/contract-check.js` C5 플레이스홀더 검사가 `.artifacts/`도 제외(Git 제외 증거·핸드오프 보관소)
- 2026-10-27 `.claude/hooks/README.md`·`test-guards.js` 헤더·AGENTS.md "강제 장치" 표에 `confirm-agy-delegate.js` 확인 훅 반영
- 2026-10-27 `.agents/skills/vibe-mode/SKILL.md` 완료 판정 상태값 `done` → `완료`(Tasks.md 상태값과 일치)
- 2026-10-27 `docs/UpdateRequests.md` 규칙 문장에서 AGENTS.md 문서 소유권 표와 모순되던 implementer 비교 구절 제거
- 2026-10-27 `.agents/skills/idea-interview/SKILL.md` 인터뷰 수행 주체를 Claude Code 메인 세션으로 명시
- 2026-10-27 AGENTS.md 핸드오프 "상태 전환" 행에 "받은 역할이 planner여도 같다" 보완
- 2026-10-27 `.claude/skills/cli-delegate/SKILL.md` Codex stdin·`-o` 조합 검증 상태를 실측됨으로 갱신
- 2026-10-27 README: 인터뷰 시작 주체를 Claude Code 메인 세션으로 정정, hooks 구조 설명에 확인 훅 반영, 수행 주체 절 참조 추가
- 2026-10-27 안티그래비티 가드(`scripts/agy-guard.js`, `.agents/hooks.json`): `read_file`/`write_file`/`edit_file` 도구와 `Path` 인자의 환경 파일 접근 차단, `-nm`·`-mn` 같은 `-n` 단축 플래그 묶음(커밋 명령 대상) 우회 차단. `scripts/test-agy-hook-cwd.js` 확장
- 2026-10-27 AGENTS.md 핸드오프 표 "리뷰·QA 통과" 행: planner(완료 전환) → docs 앞에 메인 세션의 사용자 확인 단계 추가
- 2026-10-27 AGENTS.md "고정 첫 작업"(T-01): 웹 UI 프로젝트면 dev 서버 실행 설정(Claude Code는 `.claude/launch.json`) 포함
- 2026-10-27 implementer·QA 역할 원본 화면 확인 단계: 사용자가 보는 브라우저 패널에서 확인하고 마지막 화면을 남김. `.claude/agents/implementer.md`·`quality-assurance.md`에 `.claude/launch.json` 이름으로 `preview_start` 안내 추가
- 2026-10-27 AGENTS.md "고정 첫 작업"(T-01): 웹 UI 프로젝트면 Architecture가 정한 E2E 러너 설정과 E2E 스모크 테스트 1개 포함
- 2026-10-27 implementer·QA 역할 원본 4단계와 보고 표에 E2E 회귀 확인 추가

### Removed
- 2026-10-27 `scripts/pipeline.ps1`, `scripts/orchestrator.ps1`, `.agents/role-map.yaml` 삭제(자동 오케스트레이션 폐기, Claude 중심 + CLI 위임 방식으로 전환). 위임 CLI 명령은 docs/CodingRules.md로 이전
