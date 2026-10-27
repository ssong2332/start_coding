#!/usr/bin/env node
// PreToolUse 가드 (Bash): 훅·서명을 우회하는 git 플래그를 차단한다.
// docs/GitWorkflow.md 금지 조항("--no-verify 등 훅 우회 금지")을 강제한다.
const { readHookInput } = require("./lib/read-hook-input");
// 공용 모듈을 못 찾으면 훅이 exit 1로 죽어 우회 플래그가 전부 통과한다(2026-10-27 재리뷰 권고 1).
// scripts/agy-guard.js와 같이 예전 정규식으로 대체한다 — 이 대체 경로는 bash -c 문자열 등은 잡지만
// 따옴표로 감싼 "-n" 인자는 놓친다.
let findCommitNoVerifyShortFlag;
try {
  ({ findCommitNoVerifyShortFlag } = require("./lib/shell-args"));
} catch {
  findCommitNoVerifyShortFlag = (command) => {
    const m = command.match(/\bcommit\b[^\n]*\s(-[aceCimnopqsSuvF]*n[aceCimnopqsSuvF]*)\b/);
    return m ? m[1] : null;
  };
}

readHookInput((payload) => {
  const command = payload?.tool_input?.command;
  if (typeof command !== "string" || !/\bgit\b/.test(command)) process.exit(0);

  const skipPatterns = [
    /--no-verify\b/,
    /--no-gpg-sign\b/,
    /-c\s*commit\.gpgsign=false\b/,
    /-c\s*core\.hooksPath=/,
    /\bconfig\b[^\n]*core\.hooksPath\b/, // git config core.hooksPath <경로> (영구 설정, "=" 없음)
  ];
  // git commit -n / -nm 등 짧은 플래그 묶음은 인자 단위로 검사한다(lib/shell-args.js) —
  // 2026-08-18에 "-nm" 누락, 2026-10-27에 메시지 따옴표 안 텍스트 오탐과 "-n" 따옴표 누락을 고쳤다.
  const shortFlag = findCommitNoVerifyShortFlag(command);
  const hit = shortFlag ? `git commit ${shortFlag}` : skipPatterns.find((p) => p.test(command));
  if (hit) {
    console.error(
      `차단: 훅/서명을 우회하는 git 플래그 (${hit}) — docs/GitWorkflow.md: 훅 우회 금지. 사용자가 이번 턴에 이 명령을 명시적으로 요청한 경우에만 예외.`
    );
    process.exit(2);
  }

  process.exit(0);
});
