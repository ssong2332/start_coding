# CodingRules — {{PROJECT_NAME}}

> 소유자: 사용자 | 최종 수정: {{DATE}}

## 금지

- 기존 코드 스타일과 다른 새 스타일 도입 금지 (주변 코드를 따른다).
- 요청 범위 밖 파일 수정 금지.
- 주석으로 변경 이력·자기 설명 남기기 금지 (코드가 못 보여주는 제약만 주석으로).
- 테스트 없이 "동작 확인됨" 보고 금지.
- **코드 교체 시 주변 변수/문맥 소실 금지**: `edit_file`(`Target`/`Replacement`) 또는 `replace_file_content`(`StartLine`~`EndLine`) 사용 시 교체 범위를 변경 대상 전후 1~2줄 이내로 외과적으로 한정하며, 상하위 필수 변수 선언문이나 import문이 함께 삭제되지 않도록 반드시 확인한다.
- **CSS `!important` 남용 및 무분별한 트랜지션 덮어쓰기 금지**: 기존 `transition`이 적용된 속성(`transform`, `opacity` 등)을 리셋할 때는 단일 속성 강제 주입 대신 상태 클래스(`.is-settled`) 분리 또는 `transition: none` 사전 지정을 필수로 한다.
- **`setTimeout` 다중 체이닝을 통한 UI 시퀀스 제어 금지**: 레이스 컨디션 및 유저 클릭 중복 방지를 위해 Web Animations API(`animation.finished`)나 `transitionend` Promise, 혹은 유한 상태 기계(FSM)로 상태 전이를 제어한다.

## 규칙 (언어 확정 후 채운다)

| 항목 | 규칙 |
|---|---|
| 네이밍 | 미정 — 언어 확정 후 사용자 또는 요청받은 architect가 작성 |
| 포맷터/린터 | 미정 — 언어·도구 확정 후 사용자 또는 요청받은 architect가 작성 |
| 에러 처리 | 미정 — 설계에서 오류 경계 확정 후 사용자 또는 요청받은 architect가 작성 |
| 로깅 | 미정 — 설계에서 진단 범위 확정 후 사용자 또는 요청받은 architect가 작성 |
| 테스트 작성 기준 | 미정 — 테스트 방식 확정 후 사용자 또는 요청받은 architect가 작성 |
| 디렉토리 배치 | 미정 — 계층·모듈 설계 확정 후 사용자 또는 요청받은 architect가 작성 |
| 설정 및 상수 | 수치·타이머·텍스트 등 마이크로 요구사항은 코드 내 하드코딩하지 않고 `config.js` 또는 상수 객체로 단일 진실화(Single Source of Truth)한다. |

## 검증된 명령어

성공한 원문 그대로 기록하고, 이후 변형 없이 재사용한다 (AGENTS.md 규칙). implementer는 새 행을 추가할 수 있다 — 기존 명령을 완전히 교체해야 하면(예: 패키지 매니저 변경) 옛 행을 지우지 말고 ~~취소선~~ 처리 + 교체 사유 한 줄을 남기고 새 행을 추가한다. 행 삭제는 사용자만 한다(AGENTS.md 문서 소유권).

### 프로젝트 명령

새 프로젝트의 빌드·실행·테스트 명령은 T-01에서 실제 성공한 원문만 이 표에 추가한다.

| 용도 | 명령 (원문) | 검증일 |
|---|---|---|

### 킷 자체 회귀 검사 (프로젝트 명령 아님)

템플릿에 포함된 훅·스크립트의 회귀 검사다. 프로젝트의 빌드·실행·테스트 명령으로 쓰지 않는다.

| 용도 | 명령 (원문) | 검증일 |
|---|---|---|
| 안티그래비티 훅 회귀 검사 (cwd·Stop 시간 예산) | `node --test scripts/test-agy-hook-cwd.js` | 2026-10-02 |
| 정합성 검사 회귀 (contract-check C5 워크트리 제외) | `node --test .claude/hooks/test-contract-check.js` | 2026-10-27 |
| Codex 연결 파일·훅 배선 검사 | `node --test .codex/tests/adapters.test.cjs` | 2026-10-27 |

### 위임 CLI 명령 (킷 자체, `.claude/skills/cli-delegate` 참조)

삭제된 `.agents/role-map.yaml`에 기록돼 있던 실측 명령을 옮겼다. 프롬프트 본문은 인자가 아니라 stdin·파일 경로로 전달한다.

| 용도 | 명령 (원문) | 검증일 |
|---|---|---|
| Codex 비대화형 위임 (workspace-write 자동 승인) | `codex exec --approve-for-me` | 2026-09-08 (role-map 기록에서 인용) |
| Codex 위임 — prompt.md를 stdin으로, 마지막 메시지를 파일로 (Git Bash에서 실행. `-m`은 그 실행 환경의 기본 모델이 미지원이라 사용자 지시로 붙인 것) | `codex exec --approve-for-me -m gpt-6-astra -o {D}/last-message.md - < {D}/prompt.md > {D}/stdout.txt 2> {D}/stderr.txt` | 2026-10-27 (KIT-AUDIT S1 블라인드 재채점, 종료 코드 0) |
| 안티그래비티 비대화형 위임 (전체 권한 우회 — 실행마다 사용자 확인, `-p`는 항상 마지막) | `agy --dangerously-skip-permissions -p` | 2026-09-09 (role-map 기록에서 인용) |
