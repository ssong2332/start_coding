#!/usr/bin/env node
// PreToolUse 가드 (Edit/Write/MultiEdit/NotebookEdit, Codex apply_patch): 이미 있는 린터·포매터 설정과
// 그 ignore 파일의 수정을 막는다. 에이전트가 코드를 고치는 대신 검사 설정을 약하게 만들어 통과시키는 것을 막고,
// AGENTS.md 금지 "포매터·린터 설정에서 .claude/·docs/ 등을 대상 제외하지 않는 것 금지"를 파일 도구 경로에서 강제한다.
// 한계(최선 노력 계층): 셸(Bash·PowerShell)로 쓰는 경우(sed -i, >>, Set-Content, mv)는 막지 못한다.
// 다른 이름의 심볼릭 링크는 실제 대상 이름으로도 판정한다. 규칙 자체가 최종 방벽이다.
// 처음 만드는 것은 허용한다(T-01 하네스 구축 등 — 약하게 만들 기존 설정이 없다).
// affaan-m/ECC scripts/hooks/config-protection.js(MIT) 개념 차용, 2026-11-18.
//
// 정당한 설정 변경이 필요하면 에이전트가 하지 않고 사용자에게 요청한다(사용자가 직접 편집).
// 대상 아님(의도): 빌드·테스트 설정(vite·jest·playwright·tsconfig), pyproject.toml(의존성과 섞여 있음).
const fs = require("fs");
const path = require("path");
const { readHookInput } = require("./lib/read-hook-input");

const NAMES = new Set([
  ".eslintrc", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.yaml",
  "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts", "eslint.config.mts", "eslint.config.cts",
  ".prettierrc", ".prettierrc.js", ".prettierrc.cjs", ".prettierrc.json", ".prettierrc.yml", ".prettierrc.yaml",
  "prettier.config.js", "prettier.config.cjs", "prettier.config.mjs",
  "biome.json", "biome.jsonc", ".biome.json", ".biome.jsonc",
  ".ruff.toml", "ruff.toml", ".shellcheckrc",
  ".stylelintrc", ".stylelintrc.json", ".stylelintrc.yml", ".stylelintrc.yaml", ".stylelintrc.js", ".stylelintrc.cjs", ".stylelintrc.mjs",
  ".markdownlint.json", ".markdownlint.jsonc", ".markdownlint.yaml", ".markdownlint.yml", ".markdownlintrc",
  ".markdownlint-cli2.jsonc", ".markdownlint-cli2.yaml", ".markdownlint-cli2.cjs", ".markdownlint-cli2.mjs",
  // ignore 목록에 경로 하나만 넣어도 검사를 피할 수 있다
  ".eslintignore", ".prettierignore", ".stylelintignore", ".markdownlintignore",
  // 다른 언어·도구 (2b50c7a 리뷰 권고 5)
  ".flake8", ".pylintrc", "pylintrc", ".rubocop.yml", ".yamllint", ".yamllint.yml", ".yamllint.yaml",
  ".oxlintrc.json", "oxlintrc.json",
]);
// eslint.config.base.mjs·.prettierrc.shared.json처럼 나눠 둔 설정
const PATTERNS = [
  /^(eslint|prettier|stylelint|commitlint|oxlint)\.config(\.[A-Za-z0-9_-]+)*\.(js|mjs|cjs|ts|mts|cts)$/i,
  /^\.(eslintrc|prettierrc|stylelintrc|markdownlintrc|commitlintrc|lintstagedrc)(\.[A-Za-z0-9_-]+)*\.(js|cjs|mjs|ts|mts|cts|json|jsonc|json5|yml|yaml|toml)$/i,
  /^\.(commitlintrc|lintstagedrc)$/i,
  /^\.golangci\.(yml|yaml|toml|json)$/i,
];

// Windows·macOS 파일 시스템은 대소문자를 가리지 않는다 — .ESLINTRC.JSON도 같은 파일
const isProtectedName = (base) => NAMES.has(base.toLowerCase()) || PATTERNS.some((re) => re.test(base));

// 존재하면 차단. ENOENT가 아닌 오류(권한 등)는 존재로 본다(가드를 조용히 약하게 만들지 않는다).
function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch (err) {
    return !(err && err.code === "ENOENT");
  }
}

function targets(toolName, ti) {
  if (toolName === "apply_patch") {
    const patch = typeof ti.command === "string" ? ti.command : typeof ti.patch === "string" ? ti.patch : "";
    // Add File은 새로 만들기라 존재 검사로 걸러지고, Update·Delete·Move to는 기존 파일을 바꾼다
    return [...patch.matchAll(/^\*\*\*\s+(?:Add|Update|Delete)\s+File:\s*(.+?)\s*$/gm), ...patch.matchAll(/^\*\*\*\s+Move\s+to:\s*(.+?)\s*$/gm)].map((m) => m[1]);
  }
  if (!["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(toolName)) return [];
  const edits = Array.isArray(ti.edits) ? ti.edits.map((e) => e && e.file_path) : [];
  return [ti.file_path, ti.notebook_path, ...edits].filter((p) => typeof p === "string" && p);
}

// 심볼릭 링크라면 실제 대상 이름도 본다 — 다른 이름의 링크로 보호 파일을 고치는 우회 (리뷰 권고 2)
function realBase(p) {
  try {
    return path.basename(fs.realpathSync(p));
  } catch {
    return null;
  }
}

readHookInput((payload) => {
  const ti = payload?.tool_input || {};
  // Codex apply_patch는 상대 경로를 줄 수 있다 — 훅 프로세스 cwd가 아니라 payload.cwd 기준으로 판정 (리뷰 권고 4)
  const base0 = typeof payload?.cwd === "string" && payload.cwd ? payload.cwd : process.cwd();
  for (const raw of targets(payload?.tool_name, ti)) {
    const p = path.resolve(base0, raw);
    const base = path.basename(p.replace(/\\/g, "/"));
    const real = realBase(p);
    if ((isProtectedName(base) || (real && isProtectedName(real))) && exists(p)) {
      console.error(
        `차단: 기존 린터·포매터 설정 "${base}" 수정 — 검사 설정을 약하게 하지 말고 코드를 고칠 것. 정당한 설정 변경이면 사용자에게 직접 수정을 요청할 것 (AGENTS.md 금지 — 포매터·린터 설정의 규칙 파일 제외 금지).`
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
