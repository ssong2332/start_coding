#!/usr/bin/env node
// PreToolUse 확인 훅 (Bash): 안티그래비티를 전체 권한 우회 플래그로 실행하는 명령은
// 매번 사용자 확인 창을 띄운다. AGENTS.md "다른 도구 세션과의 핸드오프" 위험도 행을
// 문서 규칙에서 강제로 올린 것이다(2026-10-27 리뷰 권고 4). 차단하지 않는다 —
// 사용자가 확인하면 실행된다.
const { readHookInput } = require("./lib/read-hook-input");
const { runsAgyWithoutPermissions } = require("./lib/shell-args");

readHookInput((payload) => {
  const command = payload?.tool_input?.command;
  if (typeof command !== "string" || !/\bagy\b/i.test(command)) process.exit(0);
  if (runsAgyWithoutPermissions(command)) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason:
            "안티그래비티를 전체 권한 우회(--dangerously-skip-permissions)로 실행한다 — AGENTS.md 핸드오프 위험도 규칙상 실행마다 사용자 확인이 필요하다.",
        },
      })
    );
  }
  process.exit(0);
});
