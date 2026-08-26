# GitWorkflow — {{PROJECT_NAME}}

> 소유자: 사용자 | implementer는 이 규칙대로만 커밋한다.

## 금지

- main 브랜치 직접 커밋 금지.
- force push 금지 (사용자가 명시 요청한 경우만 예외).
- 사용자 요청 없는 커밋·푸시 금지.
- `--no-verify` 등 훅 우회 금지.

## 브랜치 전략

| 브랜치 | 용도 | 규칙 |
|---|---|---|
| main | 항상 동작하는 상태 | 병합으로만 갱신 (PR 또는 사용자·메인 세션의 로컬 병합) — 직접 커밋 금지 |
| feat/{작업ID}-{설명} | 기능 구현 | Tasks.md의 ID 사용 (예: feat/T-01-login) |
| fix/{설명} | 버그 수정 | |

**브랜치 생성과 커밋을 한 명령 호출에 함께 넣지 않는다.** `git checkout -b X && ... && git commit`처럼 커밋을 포함한 복합 명령은, main 직접 커밋 차단 훅이 checkout이 실행되기도 전에 명령 문자열 전체를 현재 HEAD 기준으로 미리 스캔해 통째로 막는다(`.claude/hooks/README.md` "복합 명령의 브랜치 판정은 실행 전 HEAD 기준" 참조) — 실제로는 정당한 커밋인데도 차단된다. `git checkout -b X`를 먼저 별도로 실행해 브랜치 전환을 확인한 뒤, `git add`·`git commit`을 다음 호출로 실행한다.

## 커밋 메시지 (Conventional Commits)

```
{type}: {한 줄 요약}
```

| type | 용도 |
|---|---|
| feat | 기능 추가 |
| fix | 버그 수정 |
| docs | 문서만 변경 |
| refactor | 동작 불변 구조 변경 |
| test | 테스트만 변경 |
| chore | 빌드·설정 등 그 외 |

## 병합 조건

- [ ] DefinitionOfDone.md 전부 통과
- [ ] 리뷰 보고서에 치명 결함 0건

병합 수행 주체는 사용자 또는 메인 세션이다 — 서브에이전트는 병합하지 않는다. 병합 후 main에서의 push는 정상적인 마지막 단계다.
