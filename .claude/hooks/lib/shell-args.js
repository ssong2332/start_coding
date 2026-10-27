// 명령 문자열을 셸처럼 인자 단위로 나눠 검사한다. 정규식으로 문자열 전체를 훑으면
// 커밋 메시지 따옴표 안의 텍스트를 플래그로 오인하고, 반대로 "-n"처럼 따옴표로
// 감싼 실제 플래그는 놓친다(2026-10-27 리뷰 권고 2). Claude·Codex 가드와
// 안티그래비티 가드(scripts/agy-guard.js)가 함께 쓴다 — 패턴 드리프트 방지.
//
// 완전한 셸 파서가 아니다: 따옴표·역슬래시·명령 구분자(; & | 줄바꿈 괄호)만 처리한다.
// 그래서 bash -c 문자열·백틱·Windows 역슬래시 경로·붙은 리다이렉트를 놓친다(2026-10-27
// 재리뷰 치명 1~3). 판정 함수는 인자 단위 검사와 이전 정규식의 합집합으로만 쓴다 —
// 어느 한쪽만 걸려도 차단·확인한다. 메시지 텍스트 오탐은 그 대가로 감수한다.

// 명령 구간(;, &&, ||, |, 줄바꿈 등으로 나뉜 단위)마다 인자 배열을 돌려준다.
function segments(command) {
  const out = [];
  let args = [];
  let cur = "";
  let has = false; // 빈 따옴표("")도 인자 하나로 센다
  let quote = null;
  const pushArg = () => {
    if (has) args.push(cur);
    cur = "";
    has = false;
  };
  const pushSeg = () => {
    pushArg();
    if (args.length) out.push(args);
    args = [];
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === "\\" && quote === '"' && i + 1 < command.length) cur += command[++i];
      else cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      has = true;
    } else if (ch === "\\" && i + 1 < command.length) {
      cur += command[++i];
      has = true;
    } else if (/\s/.test(ch)) {
      if (ch === "\n") pushSeg();
      else pushArg();
    } else if (";&|()".includes(ch)) {
      pushSeg();
    } else {
      cur += ch;
      has = true;
    }
  }
  pushSeg();
  return out;
}

const isProgram = (arg, name) => {
  const base = arg.split(/[\\/]/).pop().toLowerCase();
  return base === name || base === name + ".exe";
};

// git 전역 옵션 중 다음 인자를 값으로 받는 것 (값이 "="로 붙으면 해당 없음)
const GIT_GLOBAL_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env"]);
// git commit의 짧은 플래그 묶음 중 n(--no-verify 단축형)을 포함하는 것.
// -mn은 git이 실제로는 "-m n"으로 해석하지만 기존 회귀 스위트대로 보수적으로 차단한다.
const NO_VERIFY_CLUSTER = /^-[aceCimnopqsSuvF]*n[aceCimnopqsSuvF]*$/;

// 2026-10-27 이전 가드의 정규식. 인자 단위 검사가 놓치는 입력(위 머리말)을 이것이 잡는다.
const LEGACY_COMMIT_NO_VERIFY = /\bcommit\b[^\n]*\s(-[aceCimnopqsSuvF]*n[aceCimnopqsSuvF]*)\b/;
const LEGACY_AGY_SKIP_PERMISSIONS = /\bagy(?:\.\w+)?\b[^\n]*--dangerously-skip-permissions/i;

// 커밋의 -n 계열 플래그를 찾으면 그 표기를, 없으면 null을 돌려준다(인자 단위 ∪ 이전 정규식).
function findCommitNoVerifyShortFlag(command) {
  const byArgs = argCommitNoVerify(command);
  if (byArgs) return byArgs;
  const m = command.match(LEGACY_COMMIT_NO_VERIFY);
  return m ? m[1] : null;
}

// git ... commit 구간에서 -n 계열 인자를 찾으면 그 인자를, 없으면 null을 돌려준다.
function argCommitNoVerify(command) {
  for (const args of segments(command)) {
    for (let g = 0; g < args.length; g++) {
      if (!isProgram(args[g], "git")) continue;
      let i = g + 1;
      while (i < args.length && args[i].startsWith("-")) {
        i += GIT_GLOBAL_WITH_VALUE.has(args[i]) ? 2 : 1;
      }
      if (args[i] !== "commit") continue;
      for (let j = i + 1; j < args.length && args[j] !== "--"; j++) {
        if (NO_VERIFY_CLUSTER.test(args[j])) return args[j];
      }
    }
  }
  return null;
}

// agy를 --dangerously-skip-permissions로 실행하는가(인자 단위 ∪ 이전 정규식)
function runsAgyWithoutPermissions(command) {
  const byArgs = segments(command).some(
    (args) => args.some((a) => isProgram(a, "agy")) && args.includes("--dangerously-skip-permissions")
  );
  return byArgs || LEGACY_AGY_SKIP_PERMISSIONS.test(command);
}

module.exports = { segments, findCommitNoVerifyShortFlag, runsAgyWithoutPermissions };
