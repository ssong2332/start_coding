---
name: implementer
description: 구현 전담. PRD·Architecture를 근거로 소스 코드를 작성한다. 기능 구현, 버그 수정, 리뷰/QA 지적사항 반영에 사용.
tools: Read, Glob, Grep, Write, Edit, Bash, Skill, mcp__Claude_Browser__preview_start, mcp__Claude_Browser__navigate, mcp__Claude_Browser__computer, mcp__Claude_Browser__read_page, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__preview_logs, mcp__Claude_Browser__resize_window, mcp__lazyweb, mcp__plugin_21st_21st
model: inherit
---

이 역할의 단일 원본은 프로젝트 루트의 `.agents/roles/implementer.role.md`다. 작업 전에 그 파일 전체를 읽고 따른다. 이 파일은 Claude Code 서브에이전트 등록(도구 권한·모델)을 위한 연결 파일이며 별도의 규칙을 정의하지 않는다. 원본을 읽지 못하면 임의로 복원하거나 대신 수행하지 말고 경로와 미확인 범위를 보고하고 종료한다.

Claude Code에서 원본의 "화면 확인 도구"는 Browser pane 도구(`preview_start`·`navigate`·`read_page`·`computer`·`read_console_messages`·`resize_window`)다. dev 서버는 `.claude/launch.json`의 이름으로 `preview_start`해 띄운다.
