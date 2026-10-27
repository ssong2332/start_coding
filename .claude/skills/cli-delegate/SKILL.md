---
name: cli-delegate
description: Claude 메인 세션이 작업 하나를 Codex·안티그래비티에 넘길 때 사용한다 — CLI 위임 실행 또는 사용자가 직접 여는 세션용 프롬프트 파일 작성.
---

Claude Code 메인 세션 전용 절차다. 핸드오프 파일 위치·보고 의무·동시 작업 규칙의 원본은 AGENTS.md "다른 도구 세션과의 핸드오프" 절이며, 이 스킬은 그것을 Claude 쪽에서 수행하는 방법만 담는다.

## 금지
- 프롬프트 본문을 명령줄 인자(argv)로 넘기지 않는다 — 따옴표 분할·명령 길이 제한·주입 위험. 본문은 항상 `prompt.md` 파일에 쓰고 stdin 또는 파일 경로로만 전달한다.
- 사용자가 요청하거나 승인하지 않은 위임 금지. 안티그래비티 CLI 실행은 매번 사용자 확인을 받는다(아래 표 위험도).
- 위임 세션이 끝나기 전에 같은 작업 트리에서 겹치는 파일을 수정하지 않는다.
- 위임 결과 보고를 검증 없이 완료로 전달하지 않는다 — 보고는 근거이지 증명이 아니다.

## 1. 실행 ID와 폴더
`.artifacts/handoff/{작업ID}/{실행ID}/` — 실행ID는 `{도구}-{YYYYMMDD-HHMMSS}`. 작업 ID가 없으면 `ADHOC`.
작업ID·실행ID는 `^[A-Za-z0-9._-]+$`에 맞아야 한다(공백·따옴표·경로 구분자 금지). 맞지 않으면 폴더를 만들거나 실행하지 말고 사용자에게 ID를 다시 정하자고 보고한다 — 이 경로 조각이 아래 명령에 그대로 들어간다.

## 2. prompt.md 작성 (아래 틀을 빈칸 없이 채운다)
```
# 핸드오프: {작업ID} — {한 줄 목표}
- 오늘 날짜: {YYYY-MM-DD}
- 역할: .agents/roles/{역할}.role.md 전체를 읽고 이 역할로 수행한다 (AGENTS.md가 최상위 원본)
- 범위: {수정해도 되는 파일·폴더} / 범위 밖: {건드리면 안 되는 것}
- 완료 조건: {검증 가능한 조건}
- 근거 문서: {PRD F-xx, Architecture 절, 사용자 원문 인용 등 — 사용자 답변은 축어 인용}
- 금지: docs/Tasks.md 상태 변경, 커밋·푸시, 다른 도구·에이전트 호출
- 보고: 끝나면 이 폴더의 report.md에 AGENTS.md 보고 템플릿으로 남긴다 (실행한 명령 원문·종료 코드·증거 경로 포함)
```

## 3. 실행 방식 선택

| 상황 | 방식 |
|---|---|
| 사용자가 Codex·안티그래비티를 직접 열어 수행하겠다고 함 | 실행하지 않는다. 사용자에게 폴더 경로와 입력할 한 줄을 준다: `{폴더}/prompt.md를 읽고 그대로 수행해` |
| Codex로 자동 위임 | 아래 Codex 명령을 백그라운드로 실행 |
| 안티그래비티로 자동 위임 | 위험도와 명령을 사용자에게 보여주고 확인을 받은 뒤 실행 |

아래 명령은 POSIX 셸 문법(`<`·`>` 리다이렉트)이므로 **Bash 도구(Git Bash)로 실행한다**. PowerShell은 `<` 입력 리다이렉트를 지원하지 않는다(`The '<' operator is reserved for future use.` — 2026-10-27 확인). `{D}`는 리포 루트 기준 상대 경로로 쓰고 cwd는 리포 루트로 둔다.

| 도구 | 명령 (`{D}` = 실행 폴더) | 위험도 | 검증 상태 |
|---|---|---|---|
| Codex | `codex exec --approve-for-me -o {D}/last-message.md - < {D}/prompt.md > {D}/stdout.txt 2> {D}/stderr.txt` | 낮음 — workspace-write 샌드박스 내 자동 승인 | `codex exec --approve-for-me`만 실측됨(CodingRules 위임 CLI 표). stdin(`-`)·`-o` 조합은 `codex exec --help`(0.153.4)로 옵션 존재만 확인, 첫 성공 시 CodingRules에 등록 |
| 안티그래비티 | `agy --dangerously-skip-permissions -p "Read {D}/prompt.md and follow it exactly." > {D}/stdout.txt 2> {D}/stderr.txt` | 높음 — 전체 권한 우회. `.claude/hooks/confirm-agy-delegate.js`가 실행마다 사용자 확인 창을 강제한다 | 원 명령은 실측됨(`-p`가 마지막이어야 함). 인자에는 파일 경로가 담긴 고정 문장만 넣는다 |

실행 후 `{D}/meta.json`에 실행 주체·시각·cwd·명령 원문·종료 코드를 기록한다(AGENTS.md 검증 증거 보존과 같은 항목).

## 4. 결과 회수
1. `report.md`(없으면 `last-message.md`·stdout)를 읽는다. 둘 다 없으면 미완료로 보고한다.
2. `git status`·`git diff`로 범위 밖 변경이 없는지 확인한다.
3. 보고의 테스트 통과 주장은 검증된 명령으로 직접 재실행해 대조한다. 재실행하지 못한 항목은 `미검증`.
4. 그다음 AGENTS.md 핸드오프 표대로 planner(상태 전환)나 reviewer·QA로 넘긴다.
