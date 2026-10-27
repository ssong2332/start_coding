#!/usr/bin/env node
/**
 * scripts/check-syntax.js
 *
 * 변경된 JavaScript 파일의 순수 구문 오류(SyntaxError)를 사전에 감지하는 가벼운 가드.
 * 외부 라이브러리/린터 의존성 없이 Node.js 내장 `node --check`를 사용한다.
 *
 * 연동:
 * - Antigravity: .agents/hooks.json의 "Stop" 이벤트
 * - Claude Code: .claude/settings.json의 "PostToolUse" 이벤트
 *
 * 원칙:
 * - 오류 발생 시 항상 fail-open (allow / exit 0) — 가드 오류가 세션을 중단시키지 않는다.
 * - 훅 시간 제한보다 먼저 응답한다 — 시간 예산을 넘기면 남은 파일은 검사하지 않고 fail-open하며,
 *   미검사 파일은 stderr와 Claude 응답에 남긴다.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const STARTED_AT = Date.now();
// .agents/hooks.json Stop 훅 timeout(10초)보다 여유를 둔 검사 예산. SYNTAX_GUARD_BUDGET_MS는 양의 정수만 받는다.
const DEFAULT_BUDGET_MS = 7000;
const BUDGET_MS = (() => {
  const value = Number(process.env.SYNTAX_GUARD_BUDGET_MS);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_BUDGET_MS;
})();

// deadline까지 남은 ms. deadline이 없으면(Infinity) undefined를 돌려 timeout을 걸지 않는다.
function timeoutUntil(deadline) {
  return Number.isFinite(deadline) ? deadline - Date.now() : undefined;
}

function toRel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function getChangedJsFiles(deadline = Infinity) {
  const timeout = timeoutUntil(deadline);
  if (timeout !== undefined && timeout <= 0) return { files: [], timedOut: true };
  try {
    const output = execFileSync("git", ["status", "--porcelain"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
      timeout,
    });

    const files = [];
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // 상태 코드(2자리) 뒤의 파일 경로 추출
      const filePath = trimmed.slice(2).trim().replace(/^"|"$/g, "");
      if (/\.(js|mjs|cjs)$/.test(filePath)) {
        // 삭제된 파일이나 외부 디렉터리 제외
        const fullPath = path.join(ROOT, filePath);
        if (
          fs.existsSync(fullPath) &&
          !filePath.includes("node_modules") &&
          !filePath.startsWith(".git")
        ) {
          files.push(fullPath);
        }
      }
    }
    return { files, timedOut: false };
  } catch (e) {
    return { files: [], timedOut: e.code === "ETIMEDOUT" };
  }
}

// 셸 없이 node를 직접 실행한다 — timeout 시 검사 프로세스 자체가 종료되도록.
function checkSyntax(files, deadline = Infinity) {
  const errors = [];
  const unchecked = [];
  for (const file of files) {
    const timeout = timeoutUntil(deadline);
    if (timeout !== undefined && timeout <= 0) {
      unchecked.push(file);
      continue;
    }
    try {
      execFileSync(process.execPath, ["--check", file], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout,
      });
    } catch (e) {
      if (e.code === "ETIMEDOUT") {
        unchecked.push(file);
        continue;
      }
      const stderr = (e.stderr || e.message || "").trim();
      errors.push(`- ${toRel(file)}:\n  ${stderr.split("\n").slice(0, 3).join("\n  ")}`);
    }
  }
  return { errors, unchecked };
}

function budgetNotice(scanTimedOut, unchecked) {
  if (scanTimedOut) {
    return `[SyntaxGuard] 시간 예산(${BUDGET_MS}ms) 초과로 변경 파일 목록을 확인하지 못해 검사를 건너뛰었습니다(미검사).`;
  }
  if (unchecked.length) {
    return `[SyntaxGuard] 시간 예산(${BUDGET_MS}ms) 초과로 ${unchecked.length}개 파일을 검사하지 못했습니다(미검사):\n${unchecked
      .map((file) => `- ${toRel(file)}`)
      .join("\n")}`;
  }
  return "";
}

function main() {
  if (process.argv.includes("--report")) {
    const { files } = getChangedJsFiles();
    if (!files.length) {
      console.log("검사 대상 JS 파일 없음");
      process.exit(0);
    }
    const { errors } = checkSyntax(files);
    if (errors.length) {
      console.log(`구문 오류 발견 (${errors.length}건):\n${errors.join("\n")}`);
      process.exit(1);
    } else {
      console.log(`구문 검사 통과 (${files.length}개 파일)`);
      process.exit(0);
    }
  }

  let input = "";
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", () => {
    try {
      let payload = {};
      if (input.trim()) {
        try {
          payload = JSON.parse(input);
        } catch {
          payload = {};
        }
      }

      // 검사 대상 파일 추출
      let targetFiles = [];

      // Claude Code PostToolUse 인풋 (payload.tool_input.file_path 등)
      if (payload?.tool_input?.file_path) {
        const fp = path.resolve(ROOT, payload.tool_input.file_path);
        if (/\.(js|mjs|cjs)$/.test(fp) && fs.existsSync(fp)) {
          targetFiles.push(fp);
        }
      }

      const deadline = STARTED_AT + BUDGET_MS;
      let scanTimedOut = false;

      // 파일 지정이 없으면 git 변경 파일 전체 검사
      if (!targetFiles.length) {
        const scan = getChangedJsFiles(deadline);
        targetFiles = scan.files;
        scanTimedOut = scan.timedOut;
      }

      const { errors, unchecked } = targetFiles.length
        ? checkSyntax(targetFiles, deadline)
        : { errors: [], unchecked: [] };
      const notice = budgetNotice(scanTimedOut, unchecked);
      if (notice) process.stderr.write(`${notice}\n`);

      // 1. Antigravity Stop 훅 응답 형태 — 예산 초과만 있으면 allow(fail-open), 미검사 안내는 stderr에만 남긴다
      if (payload.terminationReason !== undefined || payload.executionNum !== undefined) {
        if (errors.length > 0) {
          process.stdout.write(
            JSON.stringify({
              decision: "continue",
              reason: `[SyntaxGuard] 수정된 JavaScript 파일에 구문 오류가 있습니다. 종료 전 수정하세요:\n${errors.join(
                "\n"
              )}${notice ? `\n${notice}` : ""}`,
            })
          );
        } else {
          process.stdout.write(JSON.stringify({ decision: "allow" }));
        }
        process.exit(0);
      }

      // 2. Claude Code PostToolUse 응답 형태
      const contexts = [];
      if (errors.length > 0) {
        contexts.push(`[SyntaxGuard] JavaScript 구문 오류(SyntaxError)가 감지되었습니다:\n${errors.join("\n")}`);
      }
      if (notice) contexts.push(notice);
      if (contexts.length > 0) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: "PostToolUse",
              additionalContext: contexts.join("\n"),
            },
          })
        );
      } else {
        process.stdout.write(JSON.stringify({}));
      }
      process.exit(0);
    } catch {
      // 오류 시 무조건 fail-open
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      process.exit(0);
    }
  });
}

main();
