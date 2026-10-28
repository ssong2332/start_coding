// contract-check.js 회귀 검사. 단독 실행: node --test .claude/hooks/test-contract-check.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test, after } = require("node:test");

const SCRIPT = path.join(__dirname, "contract-check.js");
// 임시 fixture는 보존 증거가 아니다 — .artifacts/verification/ 밖에 만들고 이 실행이 끝나면 지운다.
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contract-check-"));
after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

const PLACEHOLDER = "# {{PROJECT_NAME}}\n";
function place(rel) {
  const full = path.join(fixtureRoot, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, PLACEHOLDER);
}
place(".claude/worktrees/sample-wt/README.md");
place(".claude/worktrees/sample-wt/scripts/init.sh");
place(".claude/notes.md");
place("src/worktrees/notes.md");
place(".artifacts/handoff/KIT-AUDIT/S9/report.md");
place("src/.artifacts/notes.md");
place("src/docs/notes.md");
place("docs/notes.md");
place("README.md");

function c5Lines() {
  const r = spawnSync(process.execPath, [SCRIPT, "--report"], { cwd: fixtureRoot, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.split("\n").filter((l) => l.startsWith("C5 "));
}

test("C5: .claude/worktrees/ 아래 워크트리 사본은 검사하지 않는다", () => {
  const hits = c5Lines().filter((l) => l.includes(".claude/worktrees/"));
  assert.deepEqual(hits, []);
});

test("C5: .artifacts/ 아래 증거·핸드오프 파일은 검사하지 않는다", () => {
  const hits = c5Lines().filter((l) => l.startsWith("C5 .artifacts/"));
  assert.deepEqual(hits, []);
});

test("C5: 워크트리가 아닌 .claude/ 파일의 플레이스홀더는 계속 잡는다", () => {
  assert.ok(c5Lines().some((l) => l.startsWith("C5 .claude/notes.md:")));
});

test("C5: .claude 밖의 worktrees 이름 폴더는 제외하지 않는다", () => {
  assert.ok(c5Lines().some((l) => l.startsWith("C5 src/worktrees/notes.md:")));
});

// 루트의 docs/·.artifacts/만 제외 대상이다 — 같은 이름의 하위 폴더까지 건너뛰면 검사가 빠진다(2026-10-27 재리뷰 권고 4)
test("C5: 루트가 아닌 .artifacts 이름 폴더는 제외하지 않는다", () => {
  assert.ok(c5Lines().some((l) => l.startsWith("C5 src/.artifacts/notes.md:")));
});

test("C5: 루트가 아닌 docs 이름 폴더는 제외하지 않는다", () => {
  assert.ok(c5Lines().some((l) => l.startsWith("C5 src/docs/notes.md:")));
});

// init 치환 대상인 루트 docs/·README.md는 계속 제외돼야 한다 (2026-10-28 f8fed91 재리뷰 권고 3)
test("C5: 루트 docs/와 README.md는 init 치환 대상이라 검사하지 않는다", () => {
  const hits = c5Lines().filter((l) => l.startsWith("C5 docs/") || l.startsWith("C5 README.md:"));
  assert.deepEqual(hits, []);
});
