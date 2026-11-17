// 되돌릴 수 없는 git 명령 판정 — block-main-writes.js(Claude·Codex)와 scripts/agy-guard.js가 공유한다.
// mattpocock/skills의 git-guardrails 개념 차용. 원본은 push 전체를 막지만 이 킷은 병합 후 push가
// 정상 흐름이라(docs/GitWorkflow.md) 강제 push만 막는다.
// 플래그 대소문자(-D와 -d)가 의미를 가르므로 정규식에 i 플래그를 쓰지 않고 실행 파일 이름만 대소문자를 무시한다.
// 한계: 다른 가드와 같은 문자열 검사라 echo 문자열 안의 언급도 차단한다(안전 쪽 오탐).
const GIT = String.raw`\b[gG][iI][tT](?:\.[eE][xX][eE])?["']?\s+(?:-C\s+\S+\s+)?`;
const SEG = String.raw`[^\n;&|]*`; // 같은 명령 구간 안에서만 찾는다
const DOT = String.raw`\s(?:--\s+)?["']?\.["']?(?=\s|$)`;

const RULES = [
  [new RegExp(`${GIT}reset\\b${SEG}\\s--hard\\b`), "git reset --hard (커밋·작업 트리 변경 폐기)"],
  [new RegExp(`${GIT}clean\\b${SEG}\\s(?:-[a-zA-Z]*f[a-zA-Z]*|--force)\\b`), "git clean -f (추적 안 되는 파일 삭제)"],
  [new RegExp(`${GIT}branch\\b${SEG}\\s-[a-zA-Z]*D[a-zA-Z]*\\b`), "git branch -D (병합 안 된 브랜치 강제 삭제)"],
  [
    new RegExp(`${GIT}branch\\b(?=${SEG}\\s(?:-d|--delete)\\b)${SEG}\\s(?:-f|--force)\\b`),
    "git branch -d -f (브랜치 강제 삭제)",
  ],
  [
    new RegExp(`${GIT}push\\b${SEG}\\s(?:--force(?![-\\w])|-[a-zA-Z]*f[a-zA-Z]*\\b|["']?\\+[\\w./-])`),
    "강제 git push (--force-with-lease는 허용)",
  ],
  [new RegExp(`${GIT}checkout\\b${SEG}${DOT}`), "git checkout . (작업 트리 변경 전체 폐기)"],
  [
    new RegExp(`${GIT}restore\\b(?!${SEG}\\s--staged\\b(?!${SEG}\\s(?:--worktree|-W)\\b))${SEG}${DOT}`),
    "git restore . (작업 트리 변경 전체 폐기, --staged만이면 허용)",
  ],
];

function findDestructiveGit(command) {
  if (typeof command !== "string") return null;
  for (const [re, label] of RULES) if (re.test(command)) return label;
  return null;
}

module.exports = { findDestructiveGit };
