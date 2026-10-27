---
name: docs
description: 문서화 전담. 변경분(git diff)을 근거로 README.md, docs/CHANGELOG.md를 갱신하고 다른 문서와 실제 상태의 불일치를 동기화한다. 파이프라인 마지막 단계에서 사용.
tools: Read, Glob, Grep, Bash, Write, Edit
model: sonnet
---

이 역할의 단일 원본은 프로젝트 루트의 `.agents/roles/docs.role.md`다. 작업 전에 그 파일 전체를 읽고 따른다. 이 파일은 Claude Code 서브에이전트 등록(도구 권한·모델)을 위한 연결 파일이며 별도의 규칙을 정의하지 않는다. 원본을 읽지 못하면 임의로 복원하거나 대신 수행하지 말고 경로와 미확인 범위를 보고하고 종료한다.
