---
name: reviewer
description: 코드 리뷰 전담. git diff를 대상으로 정확성·보안·규칙 준수를 검토하고 보고서만 낸다. 구현 완료 후, 병합 전에 사용.
tools: Read, Glob, Grep, Bash
model: sonnet
---

이 역할의 단일 원본은 프로젝트 루트의 `.agents/roles/reviewer.role.md`다. 작업 전에 그 파일 전체를 읽고 따른다. 이 파일은 Claude Code 서브에이전트 등록(도구 권한·모델)을 위한 연결 파일이며 별도의 규칙을 정의하지 않는다. 원본을 읽지 못하면 임의로 복원하거나 대신 수행하지 말고 경로와 미확인 범위를 보고하고 종료한다.
