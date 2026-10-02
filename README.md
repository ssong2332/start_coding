# {{PROJECT_NAME}}

> 이 리포는 [start_coding](https://github.com/) 템플릿에서 생성되었다. 초기화 전이라면 아래 "새 프로젝트 시작"을 먼저 실행할 것.

## 새 프로젝트 시작 (템플릿 사용법)

1. GitHub에서 **Use this template** → 새 리포 생성 → clone
2. 초기화 스크립트 실행 (Windows):

```bash
powershell -ExecutionPolicy Bypass -File scripts/init.ps1 -ProjectName "프로젝트명"
```

   macOS/Linux:

```bash
bash scripts/init.sh "프로젝트명"
```

3. **Codex를 쓸 계획이면 먼저 `/hooks`로 훅 정의를 신뢰 승인한다** — 승인 전에는 main 직접 커밋·`.env` 접근 차단이 조용히 무동작한다. 안티그래비티 훅은 루트와 `.agents` cwd용 진입점을 사용한다. 실제 앱 연결은 `git status` 같은 읽기 명령으로 재확인한다. 실제 `.env` 파일을 열어 시험하지 않는다.
4. 아이디어를 도구(Claude Code·Codex·안티그래비티 아무거나)에 말한다 → **대화형 인터뷰**로 명세를 완성한 뒤 `docs/PRD.md`가 작성된다 (파이프라인 0~1단계)
5. Claude Code / Codex / 안티그래비티 어느 도구로 열어도 같은 규칙(AGENTS.md)이 적용된다.

| 도구 | 규칙 읽는 방식 | 강제 계층 활성 조건 |
|---|---|---|
| Claude Code | CLAUDE.md의 `@AGENTS.md` import | 자동 |
| Codex | 루트 AGENTS.md 직접 읽음, `.codex/agents/`의 역할 정의 사용 | **최초 1회 `/hooks` 신뢰 승인 필요 — 안 하면 무동작** |
| 안티그래비티 (Gemini) | 루트 AGENTS.md 직접 읽음 | 루트·`.agents` cwd 진입점 제공 — 첫 사용 시 `git status` 같은 읽기 명령으로 도구 호출이 막히지 않는지 확인 |

## 프로젝트 개요

<!-- 초기화 후 docs 에이전트가 채운다 -->

## 구조

```
{{PROJECT_NAME}}/
├── AGENTS.md          # 마스터 규칙 (단일 원본)
├── CLAUDE.md          # Claude Code 어댑터
├── docs/              # 프로젝트 문서 + ToolPacks.md(스킬·MCP 팩) + KitFeedback.md(템플릿 개선 대기열)
├── scripts/           # 초기화 스크립트 init.ps1·init.sh(1회 실행) + agy-guard.js(안티그래비티 가드, 상주)
├── .agents/skills/    # 공용 스킬 원본 (안티그래비티·Codex 직접 사용)
├── .agents/scripts/   # .agents cwd에서 기존 안티그래비티 가드를 호출하는 진입점
├── .claude/agents/    # 6-에이전트 팩 (Claude Code 전용)
├── .claude/skills/    # Claude Code의 공용 스킬 연결 파일
├── .claude/hooks/     # 강제 가드 3종 + 정합성 검사 (Claude Code·Codex 공유)
├── .codex/agents/     # 6-에이전트 팩 (Codex 전용)
├── .codex/EXECUTION.md # Codex 실행 출력·세션 수집 안내
├── .codex/hooks.json  # Codex 배선 (최초 1회 /hooks 신뢰 승인 필요)
└── .agents/hooks.json # 안티그래비티 배선 → cwd별 scripts/agy-guard.js 진입점
```

## 개발 파이프라인

아이디어 인터뷰 → 기획 → 설계 → 구현 → 리뷰/검증 → 문서화. 단계별 산출물과 게이트는 [AGENTS.md](AGENTS.md) 참조.

인터뷰는 아이디어를 받아 적는 단계가 아니라 **같이 설계하는 대화**다: 개인/팀·언어·배포·기능 범위 등 빈칸을 질문으로 채우고, 선택지마다 추천 방향과 반대 방향을 함께 제시하며, 사용자가 "완성"을 선언할 때까지 계속된다. 절차는 [.agents/skills/idea-interview/SKILL.md](.agents/skills/idea-interview/SKILL.md).

기술 스택을 정하기 전에 런타임·버전, 설치 허용 범위, 테스트 실행 수단, 실제 화면 확인 도구를 읽기 전용으로 확인한다. 확인한 환경 제약은 [Architecture의 사전 확인 표](docs/Architecture.md#실행환경-사전-확인-기술-선택-전)에 기록한다. 기획에서는 승인 기준과 화면 상태를 담당 작업에 배정해 후속 기능 때문에 선행 작업의 완료가 막히지 않도록 한다.

구현·검증에서는 Red·Green·회귀 실행의 전체 출력과 종료 코드를 작업별 `.artifacts/verification/`에 보존한다. 이 경로는 Git 추적에서 제외된다. 실제 화면 확인은 현재 도구의 가용성과 실패 결과에 따라 담당·미검증 범위를 기록한다. 공통 판정은 [AGENTS.md](AGENTS.md#검증-증거-보존)와 [DefinitionOfDone.md](docs/DefinitionOfDone.md)를 따르고, Codex의 세션 출력 수집 방법은 [.codex/EXECUTION.md](.codex/EXECUTION.md)를 참조한다. 자동 로그 수집 프로그램은 제공하지 않는다.

## 이 킷 자체의 문제를 발견하면

규칙 때문에 막히거나 우회했다면 **여기서 규칙을 고치지 말고** [docs/KitFeedback.md](docs/KitFeedback.md)에 행을 추가한다. 나중에 템플릿 리포에서 그 표를 읽고 원본을 고치면 다음 프로젝트부터 반영된다.

## 실행/빌드/테스트

<!-- 검증된 명령어는 docs/CodingRules.md "검증된 명령어" 절에 기록 후 여기에 반영 -->
