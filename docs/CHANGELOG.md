# CHANGELOG — {{PROJECT_NAME}}

> 소유자: docs | 형식: [Keep a Changelog](https://keepachangelog.com/ko/) 축약. 최신이 위.

## [Unreleased]

### Added
- 2026-11-17 `docs/ToolPacks.md` "디자인·콘텐츠 참고 사이트" 표 목업 행에 ogfolio.com(OG 이미지 큐레이션 라이브러리) 추가(사용자 제공 주소 https://www.ogfolio.com/ — 메인 세션이 curl로 HTTP 200과 제목 "OGFolio | Curated Library of Open Graph Images" 확인, 인용). 직전 행의 "ogfoli.com"은 사용자 목록의 오기였고 실제 주소는 ogfolio.com. 라이선스는 다른 참고 사이트와 같이 미확인
- 2026-11-17 `.gitignore`에 `.artifacts/learn-mode/` 추가(사용자 지시: "제외해" — 학습 모드 개인 진도 상태 파일을 Git 추적에서 제외, `git check-ignore -v`로 .gitignore:38 확인). `docs/ToolPacks.md` "디자인·콘텐츠 참고 사이트" 표에 svgl.app·icon.museum(아이콘), kexsio.com(UI 컴포넌트), app-mockup.com(목업)과 "웹사이트 레퍼런스" 행(inspo.page→details.so/inspo, brandlogo.co, admiretheweb.com, umanmade.com) 추가. 사용자 목록의 ogfoli.com은 DNS가 풀리지 않아(메인 세션 실측 — 인용) 제외
- 2026-11-17 AGENTS.md 상시 로드 분량 축소(사용자 지시: "1~4 진행", 20855자 → 18978자 — 메인 세션 보고값, 인용). ① "앱 서브 세션" 하위 절 본문을 Claude 전용 스킬 `.claude/skills/app-subsession/SKILL.md`로 이관(AGENTS.md엔 한 줄 참조) ② "강제 장치 (도구별)" 표를 요약 문단과 `.claude/hooks/README.md` 참조로 축소 ③ "진행 중 요구사항 변경" 분류 표를 `.agents/roles/planner.role.md`로 이관(AGENTS.md엔 원칙만, architect 역할 원본 9항 참조 경로도 갱신) ④ 날짜·근거 꼬리·이유 산문·문서 우선순위 괄호 정리
- 2026-11-17 하네스 비교 조사의 부분 차용 후보 3건 반영(사용자 지시: "1·3·4 반영"). `.agents/skills/tdd-practitioner/SKILL.md`에 "유효하지 않은 Red" 표(테스트 0개·로드 오류·러너 비정상 종료·무관한 테스트만 실패·구현 전 통과는 Red로 인정하지 않음, Red 증거에 실패 이름·메시지가 "기대 동작 없음"을 가리키는지 한 줄 기록 — gsd-core `gate-tdd-red-evidence` 판정 기준의 개념 차용). `.agents/roles/implementer.role.md`에 7항 "리뷰·QA 지적을 받아 반영할 때" 추가(지적을 코드·테스트·요구사항과 대조해 맞으면 Red→수정→Green, 틀리면 반증 근거를 보고, 판단 불가면 확인할 것을 보고 — superpowers `receiving-code-review` 절차의 개념 차용)
- 2026-11-17 학습 모드(learn-mode): 공용 스킬 `.agents/skills/learn-mode/SKILL.md`(사용자가 설계를 먼저 말하고 AI가 피드백·개념 설명·합의된 구현을 맡는 진행 방식, `nykooi1/vibe-wise`(MIT)의 행동 규칙 차용 — 사용자 지시: "grill-me는 개념만 차용하고 vibewise도 행동 규칙을 주입해서 유사한 경험을 하도록 진행"), Claude 연결 파일 `.claude/skills/learn-mode/SKILL.md`. 사용자가 명시적으로 켰을 때만 시작, 상태 파일은 `.artifacts/learn-mode/`(profile·progress·project-map). AGENTS.md 공용 스킬 표에 행, 문서 소유권 표에 `.artifacts/learn-mode/` 행(메인 세션이 생성·갱신)
- 2026-11-17 `.claude/hooks/learn-mode-session.js` SessionStart 주입 훅 — `.artifacts/learn-mode/profile.md`에 `Learning mode: active`가 있으면 세션 시작·재개·압축 때 스킬과 상태 파일을 읽으라는 안내를 넣음(차단·쓰기 없음), `.claude/settings.json`에 배선, 회귀 검사 `.claude/hooks/test-learn-mode.js`, `.claude/hooks/README.md` 훅 표에 행
- 2026-11-17 learn-mode 스킬 끝에 "출처와 라이선스 고지" 절 — `nykooi1/vibe-wise`(`skills/learn/behavior.md`·`onboarding.md`·`state-templates.md`·`hooks/session_start.py`)를 한국어로 옮기고 고친 것임을 밝히고 원본 MIT 라이선스 고지문(Copyright (c) 2026 Noah Kim) 전문 수록. `learn-mode-session.js` 머리 주석에도 MIT 표기와 고지문 위치 추가
- 2026-11-17 `.claude/hooks/test-learn-mode.js` 회귀 검사 추가 — BOM·CRLF가 붙은 active, 첫 표시 줄이 paused면 본문의 active 줄 무시, `inactive` 등 active가 아닌 값, 상태 폴더가 링크(정션)면 무시(링크를 만들 수 없는 환경에서는 건너뜀). 검사 전체 12건(파일 내 `t(` 호출 수 직접 센 값, 실행 결과는 미실행)
- 2026-11-17 `docs/ToolPacks.md` 콘텐츠·영상·마케팅 팩에 marketingskills 행(`coreyhaines31/marketingskills` — 마케팅 작업 지침 스킬): 전역(user 스코프) 설치됨(사용자 지시 — "marketingskills 설치·등록"), `claude plugin marketplace add coreyhaines31/marketingskills` → `claude plugin install marketing-skills@marketingskills`, v2.14.12, 스킬 53개, MIT(조사 에이전트 보고 — 인용). 설치본에 훅·MCP 정의 파일 없음(마켓플레이스 폴더에서 `hooks*.json`·`.mcp.json` 검색 0건). 주의: 스킬 설명문 합계 약 18,800자가 모든 세션에 상시 로드되므로 마케팅 작업이 없는 기간에는 `claude plugin disable marketing-skills@marketingskills`로 끔(토큰 수는 계측하지 않음), 파트너 서비스 연동 안내 스킬은 가입·키 입력 전에 사용자 확인, 6-에이전트 파이프라인에서는 쓰지 않음
- 2026-11-17 `docs/ToolPacks.md` "참고 자료" 절에 "디자인·콘텐츠 참고 사이트" 카테고리 표(일러스트·폰트·아이콘·UI 컴포넌트·인터랙션·애니메이션·3D 에셋·이미지·영상·컬러 팔레트·목업·영상 프롬프트 모음 — 10개 카테고리). 설치 대상 아님, 사이트별 라이선스(출처 표기·유료 구간·상업 이용)는 등록 시점에 미확인으로 명시. 영상 프롬프트 모음에 awesome-opus5-5-videos(사용자가 말한 "amazing opus 5.5 videos"와 같은 것인지는 이름 유사성뿐이라 추정으로 표기)
- 2026-11-17 `docs/ToolPacks.md` 새 절 "콘텐츠·영상 팩 (개인용 — 킷의 개발 파이프라인 밖)" 4행: ① hyperframes v0.9.60 전역 설치(사용자 결정 — 영상 도구는 remotion 대신 이것 하나로), 렌더용 FFmpeg 9.0.2를 `winget install --id Gyan.FFmpeg --exact`로 설치(사용자 지시, 설치 전 열린 셸은 재시작 필요), 텔레메트리 비컨은 2026-11-17 기준 끄지 않은 상태로 기록 ② brag v0.6.0 전역 설치(조사 판정 "조건부"), Opus 5.5·Sonnet 5.5·Fable 5.2에서는 `/brag`가 `brag-slim`으로 자동 전환되며 hyperframes 렌더는 `/brag --full` ③ ppt-master는 기존 `pptx` 스킬과 6장 실측 비교 후 미도입(토큰 약 2배, 파이썬 패키지 95개, 3D 모델 삽입 기능은 문서에서 찾지 못함) ④ 3D 발표 자료: PowerPoint 365로 3D 모델(GLB) 삽입·모핑 경로 확인, 발표 화면 재생은 미검증, Blender는 미설치
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
- 2026-11-17 `AGENTS.md` 개발 파이프라인 표 리뷰 행 통과 게이트: "치명 결함 0건" 뒤에 "(재검증이 `미확정`인 치명 후보도 치명으로 센다 — `.agents/roles/reviewer.role.md`)" 추가(2026-11-17 사용자 결정 "고치고") — reviewer 역할 원본의 `미확정` 치명 후보 규칙과 파이프라인 게이트 표기를 일치시킴. 규칙 문서 변경이라 실행할 테스트 없음, contract-check 통과
- 2026-11-17 `.agents/roles/reviewer.role.md` 5항 심각도 판정: 재검증이 `미확정`인 지적은 맞다면 어느 등급일지로 매기고, 치명 후보인 `미확정`은 치명으로 세어 병합 불가로 판정(2026-11-17 사용자 결정 "병합 불가로") — 이 지적에는 해소에 필요한 확인 내용을 반드시 적고 implementer의 확인 결과(실재 → 수정, 반증 → 근거 제출)를 받아 재리뷰에서 다시 판정. 보고 결론 줄을 `치명 {n}건(그중 미확정 {k}건), 권고 {m}건`으로 변경(이전: `치명 {n}건, 권고 {m}건`). 규칙 문서 변경이라 실행할 테스트 없음, contract-check 통과
- 2026-11-17 `.agents/roles/reviewer.role.md`: 정확성 단계에 "테스트가 실제로 지키는가" 관점 추가(바뀐 동작마다 망가지면 실패할 테스트가 있는지 — 테스트 없음·바뀐 동작을 건드리지 않음·무력함 구분), 새 4항 "지적 재검증"(`실재`/`반증`/`미확정`, 반증된 지적은 "반증된 후보" 목록으로 — BMAD-METHOD `bmad-code-review` triage 단계의 개념 차용), 심각도 판정은 4항에서 5항으로, 결함 표에 "재검증" 열 추가(이전: 5열 `# | 심각도 | 파일:줄 | 지적 | 재현`, 이후: 6열)
- 2026-11-17 `.agents/roles/qa.role.md`와 `docs/DefinitionOfDone.md` Red-First 항목: 보존된 Red가 tdd-practitioner "유효하지 않은 Red" 표에 해당하면 DoD Red-First 항목을 미통과로 판정(이전: 실패 여부만 대조)
- 2026-11-17 AGENTS.md 기획 착수 조건에 학습 모드 예외 추가 — 사용자가 학습 모드(`.agents/skills/learn-mode/SKILL.md`)를 켰으면 설계 성격 항목은 사용자 접근을 먼저 묻고, 추천·반대는 사용자가 도움을 청하거나 막혔을 때 줌(인터뷰 필수·서브에이전트 위임 금지 문구는 그대로)
- 2026-11-17 `.claude/hooks/learn-mode-session.js` 판정 보강 — 파일 앞 BOM 제거, `Learning mode:` 첫 번째 표시 줄의 값만 기준(본문에 같은 문구가 또 있어도 무시, `active` 외 값은 무동작), `.artifacts`·`learn-mode`·`profile.md` 세 경로 모두 링크·정션이면 무시(이전: `profile.md` 파일 링크만 검사)
- 2026-11-17 learn-mode 스킬 단계별 표 "구현" 행: 학습 모드는 구현 체크포인트마다 사용자 승인이 필요하므로 여러 파일에 걸친 기능이어도 메인 세션 직접 구현 행이 "여러 파일·모듈에 걸친 기능 구현" 행보다 우선한다는 근거 추가
- 2026-11-17 `.agents/skills/idea-interview/SKILL.md` 라운드 절차 2·3단계: 지금 물을 수 있는 질문이 1개뿐이면 그 1개만 묻기(2개 하한보다 우선), 질문이 여러 개면 번호를 붙이고 "1 추천대로, 2 반대 방향"처럼 번호와 함께 답하라고 안내, 선행 결정 우선·사실 직접 확인은 `mattpocock/skills`의 grill-me 스킬에서 개념만 차용(문구는 옮기지 않음)했다는 표기
- 2026-11-17 `.agents/skills/idea-interview/SKILL.md` 라운드 절차: 빈칸 선택 시 "지금 물을 수 있는 질문"만 고르고 답이 열린 다른 질문에 달린 질문은 뒤로 미룸(번호 순서와 부딪히면 이 규칙 우선), 추천을 받아들일 때 "추천대로"만 답해도 되게 묻기, "사실은 직접 찾고, 결정만 묻는다" 단락 추가(환경에서 확인 가능한 사실은 읽기 전용으로 직접 확인, 시크릿 규칙이 막는 확인은 하지 않음)
- 2026-11-17 `docs/ToolPacks.md` 절 제목 "콘텐츠·영상 팩 (개인용 — 킷의 개발 파이프라인 밖)"을 "콘텐츠·영상·마케팅 팩 (개인용 — 킷의 개발 파이프라인 밖)"으로 변경(marketingskills 행 추가에 따름). 아래 Added의 이전 항목에 적힌 옛 절 제목은 당시 기록이라 그대로 둠
- 2026-11-17 `docs/ToolPacks.md` "3D 발표 자료" 행: 판정을 "PPT Master + Blender 조합 도입 기각"으로 명시(사용자 결정 — "기존으로도 3d ppt가 가능하면 도입 기각"). 기존 도구(PowerPoint 365 16.0.20527 + 기존 `pptx` 스킬)로 3D 모델 삽입·정적 렌더까지 확인했으므로 새로 설치하지 않음, 발표 재생은 미검증 유지. 판단 기준은 삽입·정적 렌더 수준이며, 기각 범위는 ppt-master 도입과 이 용도의 Blender 상시 설치 — 모델을 직접 만들 때 Blender를 따로 설치하는 것은 그때 판단(c880c54, 48aa501). 위 Added의 "콘텐츠·영상 팩" 항목 ④("경로 확인", Blender 미설치)는 그대로 유효하며 이 항목이 판정을 덧붙인다
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
