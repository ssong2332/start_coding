#!/usr/bin/env node
// learn-mode-session.js 회귀 검사. 임시 fixture는 OS 임시 폴더에 만들고 끝나면 지운다.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { decide } = require("./learn-mode-session");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "learn-mode-"));
const dir = path.join(root, ".artifacts", "learn-mode");
const ev = (cwd, name = "SessionStart") => ({ hook_event_name: name, cwd });
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("통과:", name); };

try {
  t("상태 폴더 없음 → 아무것도 안 함", () => assert.strictEqual(decide(ev(root)), null));
  fs.mkdirSync(dir, { recursive: true });
  const profile = path.join(dir, "profile.md");

  fs.writeFileSync(profile, "# Learner Profile\n\nLearning mode: active\nOnboarding: complete\n");
  t("active → 안내 주입", () => {
    const out = decide(ev(root));
    assert.strictEqual(out.hookSpecificOutput.hookEventName, "SessionStart");
    assert.match(out.hookSpecificOutput.additionalContext, /learn-mode\/SKILL\.md/);
  });
  t("다른 이벤트 → 무시", () => assert.strictEqual(decide(ev(root, "PreToolUse")), null));
  t("상대 경로 cwd → 무시", () => assert.strictEqual(decide(ev(".")), null));
  t("cwd 없음·payload 없음 → 무시", () => {
    assert.strictEqual(decide({ hook_event_name: "SessionStart" }), null);
    assert.strictEqual(decide(null), null);
  });

  fs.writeFileSync(profile, "Learning mode: paused\nOnboarding: complete\n");
  t("paused → 아무것도 안 함", () => assert.strictEqual(decide(ev(root)), null));

  fs.writeFileSync(profile, "Learning mode: active\n");
  t("실행 파일: 잘못된 JSON은 조용히 종료(코드 0, 출력 없음)", () => {
    const out = execFileSync(process.execPath, [path.join(__dirname, "learn-mode-session.js")], { input: "{not json" });
    assert.strictEqual(out.toString(), "");
  });
  t("실행 파일: active면 JSON 출력", () => {
    const out = execFileSync(process.execPath, [path.join(__dirname, "learn-mode-session.js")], {
      input: JSON.stringify(ev(root)),
    });
    assert.strictEqual(JSON.parse(out.toString()).hookSpecificOutput.hookEventName, "SessionStart");
  });
  console.log(`${n}/${n} 통과`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
