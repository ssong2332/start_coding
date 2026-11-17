# KitFeedback — 템플릿 개선 대기열

> 소유자: 사용자 | **이 문서는 프로젝트가 아니라 템플릿(start_coding)에 대한 기록이다.**

프로젝트를 진행하다 이 킷의 규칙·문서·스크립트 때문에 막히거나 불편했던 지점을 여기에 적는다. 나중에 템플릿 리포에서 이 표를 읽고 원본을 고친다. 프로젝트 리포에서 규칙 파일을 직접 고치면 그 개선은 그 프로젝트에서만 살고 다음 프로젝트에서 같은 문제를 다시 겪는다.

## 금지

- 이 문서를 근거로 **현재 프로젝트의 규칙 파일(AGENTS.md·에이전트·훅)을 고치는 것 금지.** 여기 적고 그대로 진행한다.
- 기록 없이 규칙을 우회하는 것 금지. 우회했으면 우회했다고 적는다.
- 과거 행의 증상·근거를 수정하는 것 금지 (상태 열만 갱신).
- 프로젝트 고유 문제를 여기 적는 것 금지 — 그건 docs/Tasks.md나 이슈로. **다른 프로젝트에서도 똑같이 겪을 문제만** 여기 적는다.

## 무엇을 적는가 (판정표)

| 상황 | 여기 적는가 |
|---|---|
| 규칙대로 했더니 진행이 막혔다 (모순·순환·불가능한 조건) | 적는다 |
| 규칙이 이 프로젝트 유형에 안 맞아 매번 "해당 없음"을 쓰게 된다 | 적는다 |
| 문서 템플릿에 필요한 칸이 없거나, 안 쓰는 칸이 많다 | 적는다 |
| 훅이 정상 작업을 오탐으로 막았다 | 적는다 (명령 원문 포함) |
| 스크립트가 실패했다 | 적는다 (출력 원문 포함) |
| 세 도구(Claude·Codex·안티그래비티) 중 한 곳에서만 규칙이 안 먹혔다 | 적는다 (도구명 포함) |
| 이 프로젝트의 코드 버그 | 적지 않는다 |
| 내 실수로 규칙을 잘못 읽은 것 | 적지 않는다 (단, 오해하기 쉬운 문구였다면 적는다) |

## 기록 방법

**행 추가는 메인 세션(사용자를 직접 상대하는 세션) 또는 사용자만 한다.** 6-에이전트(planner·architect·implementer·reviewer·quality-assurance·docs)는 이 문서를 수정할 권한이 없다 — 소유 문서 외 수정 금지 규칙이 여기도 적용된다.

에이전트가 재발할 성질의 문제를 겪으면, 자기 보고서의 "문제/다음 단계"(또는 그에 준하는 절)에 증상·원인 위치·제안을 적어 보고한다. 메인 세션이 그 보고를 읽고 이 표에 행을 추가한다.

| # | 날짜 | 프로젝트 | 도구 | 증상 (무엇이 막혔나) | 원인 위치 (파일:줄) | 제안 | 상태 |
|---|---|---|---|---|---|---|---|
| 예시 | 2026-08-17 | book-log | Codex | T-01 완료 전엔 기능 작업 금지인데 T-01 자신도 막혔다 | AGENTS.md 검증 루프 표 | "T-02 이후"로 한정 | 반영됨 (756add0) |
| 1 | 2026-08-18 | 북마크함 (킷 실전 테스트) | Claude Code | planner·architect가 작성한 ADR·DECISIONS의 날짜가 전부 "2026-08-26"으로, 실제 세션 날짜(2026-08-18)와 8일 어긋났다 — 서브에이전트를 호출할 때 오늘 날짜를 알려주지 않아서 생긴 것으로 추정 | planner.md·architect.md 절차(호출 시 날짜 컨텍스트 전달 규칙 없음) | 메인 세션이 서브에이전트 호출 프롬프트에 오늘 날짜를 명시하거나, 각 에이전트 파일에 "날짜가 필요하면 호출자에게 확인, 추측 금지" 규칙 추가 | 반영됨 (e1ccf73) |
| 2 | 2026-08-18 | 북마크함 (킷 실전 테스트) | Claude Code | 마스터 템플릿 개선사항을 진행 중인 프로젝트에 반영할 안전한 절차가 없다 — `docs/*.md`는 init.sh가 이미 프로젝트명을 치환해 놓은 상태라, 마스터 파일을 통째로 덮으면 `{{PROJECT_NAME}}` 플레이스홀더가 되살아난다. 이번엔 4개 파일을 손으로 골라 반영했다 | scripts/ 에 init만 있고 update/sync 스크립트가 없음 | `scripts/sync-from-template.ps1`·`.sh` 신설 검토(변경된 파일만, 프로젝트별 치환값은 보존) — 최소한 HarnessAudit.md나 README에 "마스터 갱신을 기존 프로젝트에 반영하는 법(수동, 파일별 diff 검토)" 절차만이라도 문서화 | 반영됨 (e1ccf73) |
| 3 | 2026-08-18 | 북마크함 (킷 실전 테스트) | Claude Code | `git checkout -b X && git add ... && git commit ...`처럼 커밋을 포함한 복합 명령을 한 Bash 호출에 담으면 block-main-writes.js가 (checkout이 실행되기도 전에) 명령 문자열 전체를 현재 HEAD 기준으로 미리 스캔해 통째로 차단한다 — 실제로는 checkout 이후 브랜치가 바뀌어 정당한 커밋인데도 막힘. 이번 세션에 3회 반복해서 부딪혔다 | `.claude/hooks/block-main-writes.js`(문서화된 한계, `.claude/hooks/README.md`에 "복합 명령의 브랜치 판정은 실행 전 HEAD 기준"으로 이미 안내는 돼 있음) | 안내를 아는 것과 실전에서 반복해서 부딪히는 것은 다르다 — AGENTS.md "명령어는 검증된 원문 재사용" 절이나 GitWorkflow.md에 "git checkout -b와 commit은 반드시 별도 Bash 호출로 나눠 실행"이라는 실행 팁을 명시적으로 추가하면 반복 실수를 줄일 수 있다 | 반영됨 (e1ccf73) |
| 4 | 2026-08-31 | 변경테스트 (진행 중 요구사항 변경 실전 테스트) | Claude Code | "진행 중 요구사항 변경" 표 3행(완료 태스크 재작업)을 실전 검증하다가 발견: `docs/CodingRules.md` "검증된 명령어" 절은 문서 소유권 표상 implementer가 **행 추가만** 가능하고 사용자만 전체 수정 가능하다. 패키지 매니저를 npm→pnpm처럼 완전히 교체하는 변경에서는 옛 명령 행을 "지워야" 하는데 그 권한이 아무 에이전트에게도 없다 — planner가 이 문제를 스스로 발견해 Open Question(OQ-20)으로 올리고 "미해결이면 재작업 태스크 완료 불가"라고 명시했다 | AGENTS.md 문서 소유권 표 "docs/CodingRules.md — 검증된 명령어 절만 implementer 추가 가능" (교체·삭제 권한 없음) | "진행 중 요구사항 변경" 표에 "검증된 명령어를 교체해야 하는 변경"을 별도 행으로 추가하거나, CodingRules.md 소유권 각주에 "기존 명령을 교체할 때는 implementer가 옛 행에 취소선 + 새 행을 추가하고 사용자 확인을 받는다"처럼 명시적 절차를 두는 것을 검토 | 반영됨 (0b95738) |
| 5 | 2026-09-28 | start_coding | Claude Code | `.agents/skills/`의 공용 스킬 6종이 Claude Code 프로젝트 스킬 자동 발견 경로에는 없어서 `.claude/skills/` 연결 파일을 별도로 추가했다 | docs/ToolPacks.md:10 (`.agents/skills/`를 세 도구가 공유한다고만 설명) | Claude Code의 자동 발견 경로는 `.claude/skills/`이며 `.agents/skills/`는 공용 원본이라는 구분과 연결 절차를 명시한다 | 반영됨 — docs/ToolPacks.md:10 갱신, 사용자 지시로 커밋 미생성 |
| 6 | 2026-10-02 | start_coding (도구 간 검증) | 안티그래비티 | PreToolUse가 .agents/scripts/agy-guard.js를 찾다가 MODULE_NOT_FOUND로 모든 도구 호출을 차단했다 (사용자 로그 인용). 기존 설정은 node scripts/agy-guard.js이며 본체는 scripts/에 존재한다 | .agents/hooks.json의 상대 경로와 실행 cwd 의존성; 기존 C6는 루트에서 파일 존재만 검사 | .agents/scripts/에 기존 본체를 호출하는 진입점을 추가하고 PreToolUse·Stop을 루트/.agents 두 cwd에서 재현·회귀 검증한다. 가드 본체 복제·차단 해제는 하지 않는다 | 반영됨 — 로컬 회귀 16/16·기존 가드 34/34 통과, 실제 앱 재시도 미검증; 사용자 지시로 커밋 미생성 |
| 7 | 2026-11-17 | start_coding (외부 스킬 대조 검증) | Claude Code | 읽기 전용 Bash 명령이 `차단: 훅/서명을 우회하는 git 플래그 (git commit -n)`으로 막혔다. 명령에 실제 `git commit`은 없었고 git 명령은 끝의 `git status --short && git branch --show-current`뿐이었다. 명령 발췌(중간 생략): `for p in ... "git-workflow-and-versioning\|36\|own commit"; do ...; sed -n "${l}p" "$file" \| cut -c1-140; done ... cd $K && git status --short && git branch --show-current` — 스킬 이름 속 `git`, 검색어 속 `commit`, `sed -n`의 `-n`이 한 명령 문자열에 함께 있었다. 우회하지 않고 같은 확인을 Grep 도구로 수행했다 | `.claude/hooks/block-no-verify.js:32` → `.claude/hooks/lib/shell-args.js`의 `findCommitNoVerifyShortFlag` (같은 날 가상 입력으로 재현함 — 최소 명령 `echo "own commit"; sed -n 3p file.txt; git status --short`도 exit 2로 차단된다. `shell-args.js` 안의 어느 줄이 일치시키는지는 미확인) | `-n` 판정을 "같은 단순 명령 안에서 `git` 실행 파일 뒤 하위 명령이 `commit`일 때"로 좁힌다 — 따옴표 안 문자열, 다른 명령(`sed`·`grep`)의 인자, `;`·`&&`·파이프로 나뉜 다른 명령은 제외. 재현 케이스를 훅 회귀 테스트에 추가 | 대기 |
| 8 | 2026-11-17 | start_coding (외부 스킬 대조 검증) | Claude Code | 7번 행의 보충 — 7번은 막힌 명령을 발췌로만 실었다(판정표는 "명령 원문 포함"을 요구). 차단된 명령 원문(사용자 홈 경로만 `<홈>`·`<스크래치패드>`로 가림, 그 외 무편집): `S="<스크래치패드>/agent-skills"; K=~/start_coding; ls "$S" \| head -40; echo "files=$(ls "$S" \| wc -l)"; f(){ find "$S" -iname "*$1*" \| head -1; }; echo "--- 외부 인용"; for p in "interview-me\|211\|batching" "code-review-and-quality\|183\|severity" "ci-cd-and-automation\|279\|env.test" "test-driven-development\|246\|Over-mocking" "constraint-driven-development\|140\|AGENTS.md" "debugging-and-error-recovery\|38\|in order" "git-workflow-and-versioning\|36\|own commit"; do IFS='\|' read n l k <<< "$p"; file=$(f "$n"); printf "%s:%s => " "$n" "$l"; sed -n "${l}p" "$file" \| cut -c1-140; done; echo "--- 킷 줄"; sed -n '18p;14p;17p' $K/.agents/skills/idea-interview/SKILL.md \| cut -c1-120; sed -n '8p;32p' $K/.agents/roles/reviewer.role.md \| cut -c1-120; sed -n '9p;21p;46p' $K/docs/GitWorkflow.md \| cut -c1-120; sed -n '46p' $K/.agents/skills/tdd-practitioner/SKILL.md \| cut -c1-120; sed -n '36p' $K/docs/ToolPacks.md \| cut -c1-80; wc -l $K/.agents/skills/security-audit/SKILL.md; grep -rn -i -E "SSRF\|STRIDE\|bisect\|eslint-disable" $K --include=*.md -l 2>/dev/null \| grep -v node_modules \| head; cd $K && git status --short && git branch --show-current` (원문은 줄바꿈으로 나뉜 여러 줄이며 여기서는 `;`로 이었다) | 7번 행과 같음 | 7번 행과 같음 | 대기 (7번과 함께 처리) |

상태값: `대기` (템플릿에 미반영) / `반영됨` (템플릿 커밋 해시 함께) / `기각` (사유 한 줄). 값 뒤에 부가 설명(커밋 해시, 성공 신호, 함께 처리할 행 번호)을 붙일 수 있다.

## 템플릿에 반영하는 절차 (start_coding 리포에서)

1. 각 프로젝트의 `docs/KitFeedback.md`에서 `대기` 행을 모은다.
2. 같은 증상이 2개 이상 프로젝트에서 나왔으면 우선 처리한다 — 1회성은 그 프로젝트 특성일 수 있다.
3. 행마다 아래 "어떤 형태로 고칠 것인가" 표로 고칠 형태와 위치를 정한다.
4. 고친 뒤 `node .claude/hooks/contract-check.js --report`로 새 모순이 생기지 않았는지 확인한다.
5. 규칙 문구를 바꿨으면 **옛 문구를 리포 전체에서 검색해 잔존분을 함께 고친다** (문구 하나가 여러 문서에 흩어져 있다).
6. 반영 후 원래 행의 상태를 `반영됨 + 커밋 해시`로 갱신한다.

## 어떤 형태로 고칠 것인가 (템플릿 리포에서 대기 행을 처리할 때)

대기 행마다 아래 표를 위에서부터 적용해 **처음 맞는 형태**로 고친다. 아래로 갈수록 이후 모든 세션이 읽어야 할 양이 늘어난다.

| 순서 | 형태 | 맞는 경우 | 예 |
|---|---|---|---|
| 1 | 없애기·바로잡기 | 마찰의 원인이 낡았거나 틀렸거나 아무 일도 하지 않는 규칙·문구다. 검사가 이미 덮는 규칙도 여기에 해당한다 | 틀린 경로·명령 수정, 중복 조항 삭제 |
| 2 | 검사 | 실수의 모양이 일정해서 도구가 잡을 수 있다 | contract-check 항목, 훅 회귀 케이스, check-syntax |
| 3 | 가리키기 | 필요한 내용이 이미 있는데 에이전트가 못 찾았다 | 에이전트가 먼저 보는 문서에 경로 한 줄 |
| 4 | 판정 기준 한 줄 | 리뷰어가 diff에서 볼 수 있고 도구로는 못 잡는다 | reviewer 검토 순서, CodingRules |
| 5 | 새 규칙 | 위 넷이 모두 안 맞을 때만 | AGENTS.md 조항 |

같은 실수가 반복되는 행은 **가장 일찍 막는 형태**를 고른다: 원인 제거 → 실수하는 순간 걸리는 검사 → 피하라는 안내 순.

### 어디에 둘 것인가

| 위치 | 넣는 것 | 비용 |
|---|---|---|
| 항상 읽히는 문서 (AGENTS.md) | 모든 세션에 필요한 규칙과 경로만 | 모든 세션, 모든 턴 |
| 역할 원본 (.agents/roles/) | 그 역할만 지켜야 하는 것 | 그 역할이 호출될 때 |
| 필요할 때 읽는 문서 (.agents/skills/, docs/) | 절차·체크리스트 같은 상세 | 그 작업을 할 때만 |

5번(새 규칙)을 항상 읽히는 문서에 넣으려면, 같은 증상이 **2개 이상 프로젝트**에서 나왔거나(위 절차 2번) 한 번이라도 세션 밖으로 피해가 나간 경우(잘못된 커밋, 데이터 손실, 시크릿 노출)여야 한다. 그 외에는 필요할 때 읽는 문서에 둔다. 이 문턱은 5번에만 적용한다 — 1~3번은 값이 싸므로 한 번만 나와도 고친다.

### 성공 신호

고칠 때 "고쳐졌다면 다음에 무엇이 보이는가"를 한 줄 정한다 — 명령이 더 이상 실패하지 않는다, 검사가 그 실수를 잡는다, 같은 행이 다시 추가되지 않는다. 관찰할 수 없는 수정은 나중에 효과를 판정할 수 없다. 신호는 행의 상태 열에 `반영됨 ({커밋}) — 신호: …`로 덧붙인다.

(이 절의 형태 순서·위치·성공 신호는 `EveryInc/compound-engineering-plugin`의 `ce-retro`(MIT)에서 가져와 이 킷 규칙에 맞춰 다시 썼다 — 2026-11-17.)

## 반대 방향: 마스터 갱신을 진행 중 프로젝트로 가져오는 법

`scripts/init.ps1`·`init.sh`는 템플릿→프로젝트 방향(1회성 초기화)만 다룬다. 프로젝트를 진행하다 start_coding 마스터가 개선되면, 그 개선을 이미 시작한 프로젝트로 가져오는 자동화된 절차는 이 킷에 없다 — 아래는 수동 절차다.

1. start_coding 마스터에서 무엇이 바뀌었는지 `git log`·`git diff`로 확인한다.
2. 바뀐 파일이 `{{PROJECT_NAME}}`·`{{DATE}}` 플레이스홀더를 담지 않는 파일(`AGENTS.md`, `.claude/agents/*.md`, `.claude/hooks/*`, `.codex/hooks.json`, `.agents/hooks.json`, `.agents/skills/*` 등 — init 스크립트의 치환 대상이 아닌 파일)이면, 마스터의 최신 버전을 프로젝트에 그대로 덮어써도 안전하다.
3. 바뀐 파일이 `docs/*.md`·`README.md`(init 스크립트의 치환 대상)면 통째로 덮지 않는다 — 이미 프로젝트명·날짜가 치환돼 있고, 실제 프로젝트 내용(PRD 요구사항 등)이 같은 파일에 섞여 있을 수 있다. 마스터의 diff를 보고 **바뀐 줄만** 프로젝트 파일에 수동으로 반영한다.
4. 반영 후 프로젝트에서 `node .claude/hooks/contract-check.js --report`로 확인한다.

이 문제 자체가 `대기` 행으로 기록된 적 있다 — 여러 프로젝트에서 이 수작업이 반복되면 `scripts/sync-from-template`류 스크립트 신설을 검토한다.
