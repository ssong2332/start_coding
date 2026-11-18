#!/usr/bin/env node
// PreToolUse 가드 (Read/Edit/Write/NotebookEdit/Grep, Bash·PowerShell, Codex apply_patch):
// 실제 .env 파일(.env.local 등 변형 포함)의 읽기·수정·출력·덮어쓰기를 차단한다.
// AGENTS.md "시크릿 관리" 절을 강제한다: 추적·공유는 .env.example만.
//
// Claude Code와 Codex가 같은 payload 스키마(tool_name/tool_input)와 같은 차단
// 규약(exit 2)을 쓰므로 이 스크립트 한 벌이 두 도구를 모두 담당한다.
// 단 Codex의 apply_patch 는 파일 경로가 아니라 패치 본문을 tool_input.command 에
// 담으므로 별도 분기에서 대상 경로를 파싱한다.
//
// 셸(Bash·PowerShell) 문자열 매칭은 최선 노력 계층이지 보안 경계가 아니다 — 우발적·습관적
// 위반을 잡는 용도이며, 의도적 우회는 막지 못한다(.claude/hooks/README.md).
const { readHookInput } = require("./lib/read-hook-input");
// 판정 규칙은 안티그래비티 가드와 공유한다 (lib/env-rules.js)
const { isEnvPath, commandTouchesEnv } = require("./lib/env-rules");

readHookInput((payload) => {
  const toolName = payload?.tool_name;
  const ti = payload?.tool_input || {};

  const block = (what) => {
    console.error(
      `차단: ${what} — AGENTS.md "시크릿 관리": 실제 .env(변형 포함)는 에이전트가 읽거나 노출하지 않는다. 추적·공유는 .env.example만. .env 관리는 사용자에게 요청할 것.`
    );
    process.exit(2);
  };

  if (["Read", "Edit", "Write", "NotebookEdit"].includes(toolName)) {
    // NotebookEdit는 notebook_path를 쓴다
    for (const p of [ti.file_path, ti.notebook_path]) if (isEnvPath(p)) block(`${toolName} "${p}"`);
    process.exit(0);
  }

  // Codex apply_patch: "*** Add/Update/Delete File: <경로>" / "*** Move to: <경로>"
  if (toolName === "apply_patch") {
    const patch = typeof ti.command === "string" ? ti.command : typeof ti.patch === "string" ? ti.patch : "";
    for (const m of patch.matchAll(/^\*\*\*\s+(?:Add|Update|Delete)\s+File:\s*(.+?)\s*$/gm)) {
      if (isEnvPath(m[1])) block(`apply_patch 대상 "${m[1]}"`);
    }
    for (const m of patch.matchAll(/^\*\*\*\s+Move\s+to:\s*(.+?)\s*$/gm)) {
      if (isEnvPath(m[1])) block(`apply_patch 이동 대상 "${m[1]}"`);
    }
    process.exit(0);
  }

  if (toolName === "Grep") {
    const globRefsEnv = typeof ti.glob === "string" && /\.env(?!\.example\b)/.test(ti.glob);
    if (isEnvPath(ti.path) || globRefsEnv) block(`Grep (path/glob이 .env를 겨냥)`);
    process.exit(0);
  }

  // PowerShell 도구도 같은 셸 명령 문자열을 받는다 (2026-11-18 PowerShell 배선)
  if (toolName === "Bash" || toolName === "PowerShell") {
    const command = ti.command;
    if (commandTouchesEnv(command)) block(`.env를 읽거나 덮어쓰는 명령: ${command}`);
  }

  process.exit(0);
});
