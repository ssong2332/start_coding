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

  fs.writeFileSync(profile, "﻿Learning mode: active\r\nOnboarding: complete\r\n");
  t("BOM·CRLF가 붙은 active → 안내 주입", () => assert.notStrictEqual(decide(ev(root)), null));

  fs.writeFileSync(profile, "Learning mode: paused\n\n## 메모\nLearning mode: active\n");
  t("첫 표시 줄이 paused면 본문의 active 줄은 무시", () => assert.strictEqual(decide(ev(root)), null));

  fs.writeFileSync(profile, "Learning mode: inactive\n");
  t("active가 아닌 다른 값 → 아무것도 안 함", () => assert.strictEqual(decide(ev(root)), null));

  fs.writeFileSync(profile, "Learning mode: active\n");
  t("상태 폴더가 링크면 무시", () => {
    const real = fs.mkdtempSync(path.join(os.tmpdir(), "learn-mode-real-"));
    const other = fs.mkdtempSync(path.join(os.tmpdir(), "learn-mode-link-"));
    try {
      fs.mkdirSync(path.join(real, "learn-mode"));
      fs.writeFileSync(path.join(real, "learn-mode", "profile.md"), "Learning mode: active\n");
      fs.mkdirSync(path.join(other, ".artifacts"));
      try {
        fs.symlinkSync(path.join(real, "learn-mode"), path.join(other, ".artifacts", "learn-mode"), "junction");
      } catch {
        console.log("  (이 환경에서 링크를 만들 수 없어 건너뜀)");
        return;
      }
      assert.strictEqual(decide(ev(other)), null);
    } finally {
      fs.rmSync(other, { recursive: true, force: true });
      fs.rmSync(real, { recursive: true, force: true });
    }
  });

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
