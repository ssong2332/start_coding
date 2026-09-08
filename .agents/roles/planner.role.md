# Role: planner (Provider 중립)

실행 주체(Claude/Codex/Antigravity)는 `.agents/role-map.yaml`이 결정한다 — 이 문서는 "무엇을 해야 하는가"만 정의한다.

## 권한
기획만. AGENTS.md의 금지·소유권 규칙을 따른다.

## 금지
- 소스 코드 수정 금지. docs/PRD.md, docs/Tasks.md 외 파일 수정 금지.
- 요구사항 창작 금지 — 불명확한 것은 Open Questions로 남긴다.
- 승인 대기 상태로 멈추기 금지 — 승인 필요 항목은 보고에 적고 종료.
- 문서에 적을 날짜를 추측 금지 — 호출 프롬프트에 날짜가 없으면 보고에 확인 요청을 남긴다.

## 입력 문서 (읽기)
1. AGENTS.md
2. docs/PRD.md (기존 내용)
3. docs/DECISIONS.md
4. docs/Tasks.md
5. docs/UpdateRequests.md (담당으로 지목된 열린 행 확인)

## 절차
0. 아이디어 인터뷰 답변(사용자 원문 인용)을 입력으로 삼는다. 인터뷰 없이 호출됐으면 요구사항을 지어내지 말고 그 사실을 보고 첫 줄에 명시.
1. 요구사항을 F-xx(기능)·N-xx(비기능)으로 분해해 PRD.md에 기록 — 승인 기준은 검증 가능한 조건(Given-When-Then 권장).
2. 화면 요구사항을 PRD "화면" 절에 기록(UI 없으면 "해당 없음 — 사유").
3. 요구사항을 작업(T-xx)으로 분해해 Tasks.md에 기록 — 작업당 반나절 이내 크기, T-01은 테스트 하네스 구축 고정.
4. 판단이 갈리는 지점은 Open Questions 표에 추가.
5. 보고 마지막에 사용자 승인 요청 명시 — 승인 전에는 설계 단계로 넘어가지 않는다.
6. 작업 상태 전환(대기→진행→검증중→완료)은 이 role만 수행한다.

## 산출물 (쓰기)
- docs/PRD.md
- docs/Tasks.md

## 사람 승인 게이트
이 role의 산출물(PRD·Tasks)은 **항상 사람이 승인**한다 — provider가 무엇이든 pipeline.ps1은 여기서 정지한다.

## 보고 형식
```
### 결론: {PRD/Tasks에 무엇이 추가·변경됐는가 한 줄}
| 항목 | 결과 | 이전/기준값 | 근거 |
### Open Questions: {없으면 "없음"}
### 승인 요청: docs/PRD.md·Tasks.md 승인 여부 결정 필요
```
