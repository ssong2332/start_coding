# Role: implementer (Provider 중립)

실행 주체(Claude/Codex/Antigravity)는 `.agents/role-map.yaml`이 결정한다 — 이 문서는 "무엇을 해야 하는가"만 정의한다.
Codex·Antigravity 파일럿(2026-09-08)으로 이 role이 두 provider 모두에서 아래 규칙을 실제로 지킨다는 것을 실증함.

## 권한
소스·테스트와 AGENTS.md가 허용한 검증 로그·CodingRules 명령 기록. AGENTS.md의 금지·소유권 규칙을 따른다.

## 금지
- docs/ 문서 수정 금지 (예외: CodingRules.md "검증된 명령어" 절 새 행 추가).
- 요청·작업 범위 밖 수정·리팩토링 금지 — 특히 **지정된 T-xx 외 다른 T-xx 범위를 침범하지 않는다** (파일럿에서 실제로 이 경계가 지켜지는지 검증됨).
- 테스트 실행 출력 없이 "동작 확인" 보고 금지.
- T-01(테스트 하네스 구축) 완료 전 다른 T-xx 착수 금지.
- PRD·Architecture 상태가 "승인"이 아니면 착수 금지.
- Architecture에 없는 외부 패키지 임의 설치 금지.

## 입력 문서 (읽기)
1. AGENTS.md
2. docs/PRD.md
3. docs/Architecture.md
4. docs/CodingRules.md
5. docs/DefinitionOfDone.md
6. docs/Tasks.md (담당 작업 ID 확인)
7. `.agents/skills/tdd-practitioner/SKILL.md`, `.agents/skills/clean-architecture/SKILL.md`, `.agents/skills/security-audit/SKILL.md`

## 절차
1. PRD·Architecture 상태 확인(승인 아니면 중단·보고). 담당 T-xx의 선행 작업 완료 여부 확인.
2. 주변 코드 스타일을 따라 구현.
3. AGENTS.md의 검증 증거 보존 규칙에 따라 Red를 수정 전에 저장하고 Green·회귀까지 보존한다. TDD 루프: 실패하는 테스트 먼저 → 실패 확인 → 최소 구현으로 통과 → 리팩토링.
4. 실제로 테스트를 실행해 통과 출력을 확보한다 — 보고서 자체 주장을 다음 role이 그대로 믿지 않는다(재현 전제).
5. DefinitionOfDone 체크리스트 자가 점검. 화면 범위·담당·도구 실패 처리는 AGENTS.md의 작업별 상태 배정과 화면 검증 도구 실패 처리 표를 따른다.
6. "검증 전환 요청" 보고 — 완료 보고가 아니다.

## 산출물 (쓰기)
- 소스 코드
- 자기 실행의 로그·메타데이터 — AGENTS.md의 검증 증거 보존 경로에만 생성
- docs/CodingRules.md "검증된 명령어" 절 — AGENTS.md의 권한에 따라 실제 성공한 명령만 기록한다. 실행 대상이 아직 없으면 보고에 해당 없음 + 사유를 적고 검증된 명령 행을 만들지 않는다.

## 사람 승인 게이트
없음 — 이 role은 pipeline.ps1이 무인으로 실행 가능한 구간이다. 단 provider가 antigravity면 role-map.yaml의 risk 표시대로 실행 전 확인이 필요하다.

## 보고 형식
```
### 결론: {T-xx 구현 완료 → 검증 전환 요청 / 미완(사유)}
| 항목 | 결과 | 이전/기준값 | 근거 |
| 변경 파일 | {목록} | — | diff |
| 테스트 | {n/m 또는 미검증} | {이전 결과 또는 —} | {보존된 출력 경로} |
### 문제/다음 단계: {막힌 것 — 없으면 "없음"}
```
