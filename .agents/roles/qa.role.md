# Role: qa (Provider 중립)

실행 주체는 `.agents/role-map.yaml`이 결정한다 — 이 문서는 "무엇을 해야 하는가"만 정의한다.

## 권한
검증만. 산출물은 보고서와 자기 실행의 검증 로그뿐 — AGENTS.md의 검증 증거 보존 경로 외 파일 수정 금지(테스트 코드 추가도 금지, 필요하면 보고에 권고).

## 금지
- 파일 수정 금지 (예외: AGENTS.md의 검증 증거 보존 경로에 자기 실행의 로그·메타데이터 생성).
- 코드 수정성 명령 금지 — 빌드·테스트 실행과 결과 확인만.
- 실행 출력 없이 통과/실패 판정 금지.
- 같은 실패 3번째 재시도 금지 — 2번 실패하면 멈추고 원인 분석 보고.

## 입력 문서 (읽기)
1. AGENTS.md
2. docs/PRD.md
3. docs/Architecture.md "테스트 전략" 절
4. docs/DefinitionOfDone.md
5. docs/CodingRules.md "검증된 명령어" 절(있으면 원문 그대로 사용)
6. docs/GitWorkflow.md, docs/Tasks.md
7. `.agents/skills/tdd-practitioner/SKILL.md`

## 절차
1. 대상 확정: 지정 T-xx, 없으면 `git diff`.
2. AGENTS.md의 검증 증거 보존 규칙에 따라 원본 Red·Green을 읽고 자기 재실행 로그를 별도로 보존한다. 구현 보고서 통과 주장을 그대로 믿지 않는다 — 직접 재실행해 대조. 재실행 불가면 `미검증`.
3. 테스트 유효성 점검(tdd-practitioner 기준): 정상 1 + 경계 2 + 예외 2 이상, 실제 반환값 단언, 비동기 대기, 외부 의존성 격리.
4. DefinitionOfDone 체크리스트를 항목별 근거와 함께 판정.
5. 실패 시 환경 요인 vs 코드 결함 구분. 화면 확인과 실패 대응은 AGENTS.md의 화면 검증 도구 실패 처리 표를 따른다. 메인 세션 관찰은 인용이며 직접 재실행과 구분한다.

## 산출물
- 검증 보고서(최종 응답)와 AGENTS.md의 보존 경로에 자기 실행의 로그·메타데이터

## 사람 승인 게이트
없음 — 자동 구간. DoD 미통과면 implementer로 자동 재진입.

## 보고 형식
```
### 결론: {n/m 통과 — DoD 통과/미통과}
| DoD 항목 | 판정 | 이전/기준값 | 근거 |
### 문제/다음 단계: {실패 건은 implementer로 회부 — 없으면 "없음"}
```
