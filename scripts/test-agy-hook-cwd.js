const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, after } = require("node:test");

const root = path.resolve(__dirname, "..");
const hooks = JSON.parse(fs.readFileSync(path.join(root, ".agents/hooks.json"), "utf8"));
const guardMatcher = hooks["safety-guard"].PreToolUse[0].matcher;
const guardCommand = hooks["safety-guard"].PreToolUse[0].hooks[0].command;
const stopCommand = hooks["syntax-guard"].Stop[0].command;

test("PreToolUse matcher covers both current (read_file/write_file/edit_file) and legacy file/command tools", () => {
  const matcherRegex = new RegExp(`^(?:${guardMatcher})$`);
  for (const tool of [
    "read_file",
    "write_file",
    "edit_file",
    "view_file",
    "replace_file_content",
    "multi_replace_file_content",
    "write_to_file",
    "grep_search",
    "run_command",
  ]) {
    assert.ok(matcherRegex.test(tool), `Matcher "${guardMatcher}" must match tool "${tool}"`);
  }
});
// 임시 fixture는 보존 증거가 아니다 — .artifacts/verification/ 밖에 만들고 이 실행이 끝나면 지운다.
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-cwd-"));
after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
const invalidFile = path.join(fixtureDir, "invalid.cjs");
fs.writeFileSync(invalidFile, "const broken = ;\n");

function run(command, cwd, payload, env = {}) {
  const [runtime, ...args] = command.split(" ");
  assert.equal(runtime, "node", "Hook command must use the recorded Node runtime");
  const result = spawnSync(process.execPath, args, {
    cwd,
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    encoding: "utf8",
    timeout: 10000,
    env: { ...process.env, ...env },
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

for (const [label, cwd] of [["root", root], [".agents", path.join(root, ".agents")]]) {
  const cases = [
    ["safe command", { toolCall: { name: "run_command", args: { CommandLine: "node --version" } } }, "allow"],
    ["example boundary (legacy view_file)", { toolCall: { name: "view_file", args: { AbsolutePath: "dummy/.env.example" } } }, "allow"],
    ["secret boundary without file access (legacy view_file)", { toolCall: { name: "view_file", args: { AbsolutePath: "dummy/.env" } } }, "deny"],
    ["example boundary (read_file Path)", { toolCall: { name: "read_file", args: { Path: "dummy/.env.example" } } }, "allow"],
    ["secret boundary (read_file Path)", { toolCall: { name: "read_file", args: { Path: "dummy/.env" } } }, "deny"],
    ["secret variant boundary (edit_file Path)", { toolCall: { name: "edit_file", args: { Path: "dummy/.env.local" } } }, "deny"],
    ["secret boundary (write_file Path)", { toolCall: { name: "write_file", args: { Path: "dummy/.env.production" } } }, "deny"],
    ["bypass command payload without git execution", { toolCall: { name: "run_command", args: { CommandLine: "git commit --no-verify" } } }, "deny"],
    ["short bypass flag cluster (-nm)", { toolCall: { name: "run_command", args: { CommandLine: 'git commit -nm "x"' } } }, "deny"],
    ["short bypass flag cluster (-mn)", { toolCall: { name: "run_command", args: { CommandLine: 'git commit -mn "x"' } } }, "deny"],
    ["malformed JSON retains fail-open contract", "{invalid", "allow"],
    ["empty input", "", "allow"],
  ];
  for (const [name, payload, decision] of cases) {
    test(`${label}: ${name}`, () => {
      const response = run(guardCommand, cwd, payload);
      assert.equal(response.decision, decision);
      if (decision === "deny") assert.ok(response.reason.length > 0);
    });
  }
  test(`${label}: Stop empty input`, () => {
    // 빈 입력은 작업 트리의 변경 JS 전체를 검사하므로, 부하가 크면 예산 초과 안내가 정상 응답이다.
    const response = run(stopCommand, cwd, "");
    if (response.hookSpecificOutput) {
      assert.match(response.hookSpecificOutput.additionalContext, /^\[SyntaxGuard\] 시간 예산/);
      assert.doesNotMatch(response.hookSpecificOutput.additionalContext, /구문 오류/);
    } else {
      assert.deepEqual(response, {});
    }
  });
  test(`${label}: Stop detects invalid JS relative to project root`, () => {
    const response = run(stopCommand, cwd, {
      terminationReason: "completed",
      tool_input: { file_path: path.relative(root, invalidFile) },
    });
    assert.equal(response.decision, "continue");
    assert.match(response.reason, /구문 오류/);
    assert.match(response.reason, /const broken = ;/);
    assert.ok(response.reason.includes(path.relative(root, invalidFile).replace(/\\/g, "/")));
  });
}

// Stop 훅은 훅 시간 제한(.agents/hooks.json 10초) 안에 응답해야 한다 — 예산을 넘기면 검사를 멈추고 fail-open한다.
const invalidRel = path.relative(root, invalidFile);
test("Stop budget exhausted: Antigravity payload fails open instead of hanging", () => {
  const response = run(stopCommand, root, {
    terminationReason: "completed",
    tool_input: { file_path: invalidRel },
  }, { SYNTAX_GUARD_BUDGET_MS: "1" });
  assert.deepEqual(response, { decision: "allow" });
});
test("Stop budget exhausted: Claude payload names the unchecked file", () => {
  const response = run(stopCommand, root, { tool_input: { file_path: invalidRel } }, { SYNTAX_GUARD_BUDGET_MS: "1" });
  const context = response.hookSpecificOutput?.additionalContext ?? "";
  assert.match(context, /^\[SyntaxGuard\] 시간 예산\(1ms\)/);
  assert.ok(context.includes(invalidRel.replace(/\\/g, "/")));
  assert.doesNotMatch(context, /구문 오류/);
});
for (const raw of ["60000", "abc", "0", "-5"]) {
  test(`Stop budget "${raw}" still detects invalid JS (invalid values fall back to the default)`, () => {
    const response = run(stopCommand, root, {
      terminationReason: "completed",
      tool_input: { file_path: invalidRel },
    }, { SYNTAX_GUARD_BUDGET_MS: raw });
    assert.equal(response.decision, "continue");
    assert.match(response.reason, /구문 오류/);
  });
}
