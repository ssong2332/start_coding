# 훅

세 도구 모두 강제 계층이 있다. **여기 있는 스크립트는 Claude Code와 Codex가 공유**하고(payload 스키마 `tool_name`/`tool_input`와 차단 규약 exit 2가 동일), 안티그래비티만 출력 규약이 달라 별도 어댑터를 쓴다. 규칙의 원본은 언제나 AGENTS.md다 — 훅은 물리 차단 보조 계층이다.

| 도구 | 배선 | 실행 스크립트 | 차단 신호 |
|---|---|---|---|
| Claude Code | `.claude/settings.json` | `.claude/hooks/*.js` | exit `2` |
| Codex | `.codex/hooks.json` | **같은 `.claude/hooks/*.js`** | exit `2` |
| 안티그래비티 | `.agents/hooks.json` | `scripts/agy-guard.js` (본체), `.agents/scripts/agy-guard.js` (진입점) | stdout `{"decision":"deny"}` |

규칙을 고칠 때는 **세 배선과 두 스크립트를 함께** 본다. 특히 안티그래비티 어댑터는 별도 파일이라 드리프트가 생기기 쉽다.

## 도구별 활성 조건과 실행 실패

| 도구 | 조건 |
|---|---|
| Codex | **최초 1회 `/hooks`로 훅 정의를 신뢰 승인해야 한다.** 승인 전에는 훅이 실행되지 않는다 |
| Codex | `sandbox_mode`·`approval_policy`는 리포에 넣어도 무시된다 — `~/.codex/config.toml`에 각자 설정 |
| Codex | 훅 실행 cwd가 워크스페이스 루트라는 전제 — `.codex/hooks.json`의 `node .claude/hooks/*.js`는 상대 경로다 (아래 참조) |
| 안티그래비티 | 루트와 그 아래 .agents cwd를 지원하는 진입점. 가상 입력 회귀 검사와 실제 도구 호출로 확인 (아래 참조) |
| Claude Code | 별도 조건 없음 (프로젝트 settings.json 로드 시 활성) |
| Claude Code | **한 세션에서 다른 리포를 다룰 때는 브랜치 판정이 틀린다** (아래 참조) |

**cwd와 상대 경로**: 안티그래비티에서 기존 `node scripts/agy-guard.js`가 `.agents/scripts/agy-guard.js`를 찾다가 MODULE_NOT_FOUND로 도구 호출을 차단한 오류가 보고됐다. 루트 cwd에서는 기존 `scripts/` 본체가 실행되고, `.agents` cwd에서는 `.agents/scripts/` 진입점이 __dirname 기준 루트로 cwd를 맞춘 뒤 같은 본체를 호출한다. Stop 훅도 같은 방식이다. 가드 본체·차단 규칙은 복제하지 않는다. 이 두 실행 위치 외의 cwd는 보장하지 않는다. Codex 상대 경로의 루트 cwd 전제는 그대로이며 실제 실패 형태는 무동작 또는 도구 차단일 수 있다. C6 파일 존재 검사만으로 실제 로드를 보장하지 않는다. 안티그래비티 회귀 명령은 `node --test scripts/test-agy-hook-cwd.js`이다. 가상 경로 payload로 보호 동작을 검사하며 실제 .env를 열지 않는다.

**교차 리포 세션에서의 브랜치 판정 (Claude Code)**: `block-main-writes.js`는 `git rev-parse --abbrev-ref HEAD`를 cwd 지정 없이 실행한다 — 훅 프로세스 자신의 cwd(세션이 열려 있는 프로젝트 루트)를 본다. 세션이 리포 A(main)에 열려 있는 채로 Bash 명령에서 `cd`로 리포 B(feature 브랜치)로 이동해 `git commit`을 실행하면, 실제로는 정당한 커밋인데도 **리포 A가 main이라는 이유로 차단된다** — Bash 명령의 `cd`를 훅이 따라가지 못한다. 한 세션=한 리포가 일반적인 사용 패턴이라 실사용자는 거의 안 겪지만, 이 킷 자체를 다른 클론에서 실전 테스트할 때처럼 세션이 열린 리포 밖의 다른 리포를 다루면 재현된다. 훅 로직은 그대로 두고(이 경우를 고치려고 cwd 추정 로직을 넣으면 오탐·미탐 둘 다 늘 수 있다), 겪으면 `mcp__ccd_directory__change_directory`(Claude Code) 등으로 세션 루트를 실제 대상 리포로 옮기거나, 그 리포의 커밋은 세션 밖에서 한다.

## 두 종류

| 종류 | 이벤트 | 종료 코드 | 역할 |
|---|---|---|---|
| 가드 | PreToolUse | 차단 시 `2` | 실행 자체를 막는다 |
| 노티파이어 | PostToolUse | 항상 `0` | 경고만 전달, 절대 막지 않는다 |

| 파일 | 종류 | 무엇을 막는가 |
|---|---|---|
| `block-main-writes.js` | 가드 | main/master 체크아웃 상태의 `git commit`, 다른 브랜치를 main에 직접 써넣는 refspec push |
| `block-no-verify.js` | 가드 | `--no-verify`, `--no-gpg-sign`, 훅 우회 config |
| `block-env-access.js` | 가드 | 실제 `.env` 읽기·수정·출력·덮어쓰기 (`.env.example`은 허용) |
| `confirm-agy-delegate.js` | 확인 훅 | 차단하지 않는다. `agy … --dangerously-skip-permissions` 실행이면 `permissionDecision: "ask"`로 매번 사용자 확인 창을 띄운다 (Claude Code에만 배선) |
| `contract-check.js` | 노티파이어 | 규칙 문서 간 모순 7종(C1~C7) 검사 결과를 알림 (Claude Code에서만 자동 실행) |

`block-env-access.js`는 Codex의 `apply_patch`도 처리한다 — 그 도구는 파일 경로가 아니라 **패치 본문**을 `tool_input.command`에 담으므로 `*** Add/Update/Delete File:` 줄에서 대상 경로를 파싱한다.

**근거 기록 (matcher·인자명 출처)**: `.codex/hooks.json`의 matcher(`Bash|shell|local_shell`, `apply_patch|Read|Edit|Write|Grep` — 2026-08-18 재검토에서 두 번째 matcher에 `Grep`이 빠져 있던 것을 발견해 추가, Claude Code 쪽 matcher와 대칭 확보)와 `.agents/hooks.json`의 파일 인자명(`AbsolutePath`·`TargetFile`·`SearchPath`·`DirectoryPath`)은 Codex `codex-cli 0.148.0-alpha.9` 실측(로컬 `~/.codex/hooks.json`의 impeccable 훅 배선 관찰)과 [learn.chatgpt.com/docs/hooks](https://learn.chatgpt.com/docs/hooks)·[antigravity.google/docs/ide/hooks](https://antigravity.google/docs/ide/hooks)를 근거로 정했다. 도구 버전이 바뀌어 이름이 달라지면 훅 로드 또는 matcher가 실패할 수 있으므로 실제 도구 호출과 가상 경로 payload 회귀 검사를 재실행한다. 실제 .env 파일은 열지 않는다.

## 원칙

- **fail-open이 기본이다.** 페이로드 파싱 실패·git 아님 등 예외 상황에서는 exit 0으로 통과시킨다. 훅 버그가 세션 전체를 막는 실패 모드가, 막으려던 것보다 나쁘기 때문이다. 어떤 가드가 **유일한** 방벽이 되는 상황이면 fail-closed로 바꾸고 그 이유를 파일 헤더에 남긴다.
- **문자열 매칭은 최선 노력이지 보안 경계가 아니다.** 의도적 우회(alias, 인코딩, 다른 도구 사용)는 못 막는다. 우발적·습관적 위반을 잡는 용도다.
- **오탐이 나면 패턴을 약화시키지 말고 명령을 다르게 쓴다.** 패턴을 느슨하게 만드는 순간 원래 막으려던 것도 통과한다.
- **복합 명령의 브랜치 판정은 실행 전 HEAD 기준이다.** `git checkout main && git commit` 같은 체인은 판정을 비껴간다 — git 명령은 나눠 실행한다.
- 훅 파일과 `settings.json`은 사용자 소유다. 에이전트가 차단을 우회하려고 편집하는 대상이 아니다.

## 단독 실행

```bash
node .claude/hooks/contract-check.js --report
node .claude/hooks/test-guards.js
```

`test-guards.js`는 가드 3종(block-main-writes·block-no-verify·block-env-access)과 확인 훅(confirm-agy-delegate)의 회귀 테스트다. 아무 훅 이벤트에도 걸려 있지 않다 — 가드 패턴을 고칠 때마다 손으로 돈다. `.claude/hooks/package.json`(프로젝트 루트 `package.json`과는 별개, Node 버전만 명시)에 `npm --prefix .claude/hooks test`로도 같은 걸 실행할 수 있게 등록돼 있다.

## 검사 항목 (contract-check)

| ID | 검사 |
|---|---|
| C1 | 에이전트 frontmatter `name` ↔ 파일명 ↔ AGENTS.md 등재 일치 |
| C2 | 문서가 참조하는 `docs/*.md`·`.agents/skills/*/SKILL.md` 실존 |
| C3 | `.agents/skills/` 실제 스킬이 AGENTS.md 공용 스킬 표에 등재 |
| C4 | 소유권 표에 한 문서의 소유자가 둘 이상이 아닌지 |
| C5 | init 스크립트가 치환하지 않는 위치의 플레이스홀더 |
| C6 | 훅 설정(`.claude/settings.json`·`.codex/hooks.json`·`.agents/hooks.json`)이 가리키는 스크립트 실존 |
| C7 | `.codex/agents/` 역할 6종의 파일·필수 TOML 필드·이름·AGENTS.md 참조 일치 |

**C6의 한계** (기계 검사가 못 잡는 것): ① 파일은 실재하지만 cwd 전제가 어긋나 로드 실패·무동작·도구 차단이 생기는 경우(위 cwd 전제 참조) ② `matcher` 문자열의 오타(도구명이 틀려도 스크립트 경로 검사는 통과) ③ 세 배선 간 강제 규칙 세트의 비대칭(예: 한 도구에만 없는 규칙) ④ Claude Code에서만 자동 실행되므로 Codex·안티그래비티에서 한 편집은 다음에 Claude Code로 돌아올 때까지 미검사 — `--report`로 수동 실행해 보완한다.

사람이 판단해야 하는 것(규칙끼리의 의미 충돌, 게이트가 실제로 판정을 바꾸는지 등)은 기계가 못 잡는다. AGENTS.md·CLAUDE.md·`.claude/agents/*.md`·규칙 담은 `docs/*.md`를 고친 뒤에는 `docs/HarnessAudit.md`를 손으로 돈다. 이 킷 자체의 구조적 문제(규칙 개선이 필요한 경우)는 `docs/KitFeedback.md`에 기록한다 — 둘은 목적이 다르다: HarnessAudit은 "지금 편집이 안전한가"를 커밋 전에 확인하는 체크리스트고, KitFeedback은 "이 킷의 규칙 자체가 다음 프로젝트에서도 고쳐져야 하는가"를 기록하는 별도 문서다.
