# CHANGELOG — {{PROJECT_NAME}}

> 소유자: docs | 형식: [Keep a Changelog](https://keepachangelog.com/ko/) 축약. 최신이 위.

## [Unreleased]

### Added
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
- {{DATE}} 프로젝트 초기화 (start_coding 템플릿)

### Changed
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

### Removed
- 2026-10-27 `scripts/pipeline.ps1`, `scripts/orchestrator.ps1`, `.agents/role-map.yaml` 삭제(자동 오케스트레이션 폐기, Claude 중심 + CLI 위임 방식으로 전환). 위임 CLI 명령은 docs/CodingRules.md로 이전
