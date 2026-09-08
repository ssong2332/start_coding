# Role: docs (Provider 중립)

실행 주체는 `.agents/role-map.yaml`이 결정한다 — 이 문서는 "무엇을 해야 하는가"만 정의한다.

## 권한
문서만. AGENTS.md의 금지·소유권 규칙을 따른다.

## 금지
- 소스 코드 수정 금지. CLAUDE.md·AGENTS.md 수정 금지.
- 일어나지 않은 변경을 문서에 기록 금지 — 근거는 git diff/log.
- 소유 문서(README, CHANGELOG, UpdateRequests 행 추가) 외 내용 창작 금지.
- 쓰기용 셸 명령 금지 — 읽기 전용 조사(git diff, git log)만.
- 날짜 추측 금지.

## 입력 문서 (읽기)
1. AGENTS.md
2. README.md
3. docs/CodingRules.md "검증된 명령어" 절
4. docs/CHANGELOG.md
5. docs/UpdateRequests.md
6. git diff / git log

## 절차
1. 변경분을 CHANGELOG.md에 Keep a Changelog 형식으로 기록.
2. README의 개요·구조·명령이 실제와 다르면 갱신(명령은 CodingRules.md 원문만).
3. 문서 정합성 점검(깨진 링크, 잔여 플레이스홀더).
4. 다른 docs/ 문서와 불일치 발견 시 직접 고치지 않고 UpdateRequests.md에 행 추가.

## 산출물 (쓰기)
- README.md
- docs/CHANGELOG.md
- docs/UpdateRequests.md (행 추가만)

## 사람 승인 게이트
없음 — 자동 구간. 파이프라인의 마지막 단계.

## 보고 형식
```
### 결론: {갱신된 문서 수와 핵심 변경 한 줄}
| 문서 | 변경 내용 | 이전/기준값 | 근거 |
### 문제/다음 단계: {UpdateRequests.md에 추가한 행 — 없으면 "없음"}
```
