// 되돌릴 수 없는 git 명령 판정 — block-main-writes.js(Claude·Codex)와 scripts/agy-guard.js가 공유한다.
// mattpocock/skills의 git-guardrails 개념 차용. 원본은 push 전체를 막지만 이 킷은 병합 후 push가
// 정상 흐름이라(docs/GitWorkflow.md) 강제 push만 막는다.
// 플래그 대소문자(-D와 -d, -S와 -s)가 의미를 가르므로 정규식에 i 플래그를 쓰지 않고 실행 파일 이름만 대소문자를 무시한다.
// 한계: 다른 가드와 같은 문자열 검사라 echo 문자열 안의 언급도 차단한다(안전 쪽 오탐).
// 범위 밖(의도): 원격 브랜치 삭제 push(:x, --delete, --mirror), branch -f 이동, checkout -f, stash drop,
// 파일 하나 되돌리기(checkout -- file) — 필요해지면 케이스부터 추가한다.

// git 전역 옵션(-C 경로, -c k=v, --no-pager, -P, --git-dir[=]x 등)을 몇 개든 건너뛴다 — a59c376 리뷰 치명 1
const GLOBAL_OPT = String.raw`(?:-[cC]\s+\S+|--(?:git-dir|work-tree|namespace|super-prefix|config-env|exec-path)\s+(?!-)\S+|--[\w-]+(?:=\S+)?|-[pP])\s+`;
const GIT = String.raw`\b[gG][iI][tT](?:\.[eE][xX][eE])?["']?\s+(?:${GLOBAL_OPT})*`;
const SEG = String.raw`[^\n;&|]*`; // 같은 명령 구간 안에서만 찾는다
// 작업 트리 전체를 가리키는 경로: . ./ * :/ (따옴표 허용) — 리뷰 권고 5
const WHOLE_TREE = new RegExp(String.raw`\s(?:--\s+)?["']?(?:\.\/?|\*|:\/\.?)["']?(?=\s|$)`);

const flag = (short, long) => new RegExp(String.raw`\s(?:--${long}\b|-[a-zA-Z]*${short}[a-zA-Z]*\b)`);
// 한 명령줄에 같은 하위 명령이 여러 번 나와도(git checkout main && git checkout .) 구간마다 본다
const anySegment = (command, sub, pred) =>
  [...command.matchAll(new RegExp(`${GIT}${sub}\\b(${SEG})`, "g"))].some((m) => pred(m[1]));

const RULES = [
  [(c) => new RegExp(`${GIT}reset\\b${SEG}\\s--hard\\b`).test(c), "git reset --hard (커밋·작업 트리 변경 폐기)"],
  [(c) => new RegExp(`${GIT}clean\\b${SEG}\\s(?:-[a-zA-Z]*f[a-zA-Z]*|--force)\\b`).test(c), "git clean -f (추적 안 되는 파일 삭제)"],
  [
    // -D, 또는 삭제(-d/--delete)와 강제(-f/--force)를 묶든 나누든 함께 쓴 경우 — 리뷰 치명 3
    (c) => anySegment(c, "branch", (s) => /\s-[a-zA-Z]*D/.test(s) || (flag("d", "delete").test(s) && flag("f", "force").test(s))),
    "git branch 강제 삭제 (-D, -d -f)",
  ],
  [
    (c) => new RegExp(`${GIT}push\\b${SEG}\\s(?:--force(?![-\\w])|-[a-zA-Z]*f[a-zA-Z]*\\b|["']?\\+[\\w./-])`).test(c),
    "강제 git push (--force-with-lease는 허용)",
  ],
  [
    (c) => anySegment(c, "checkout", (s) => WHOLE_TREE.test(s)),
    "git checkout . (작업 트리 변경 전체 폐기)",
  ],
  [
    // --staged(-S)만 있고 --worktree(-W)가 없을 때만 허용 — 옵션 순서와 무관 (리뷰 치명 2·권고 4)
    (c) =>
      anySegment(c, "restore", (s) => WHOLE_TREE.test(s) && !(flag("S", "staged").test(s) && !flag("W", "worktree").test(s))),
    "git restore . (작업 트리 변경 전체 폐기, --staged만이면 허용)",
  ],
];

function findDestructiveGit(command) {
  if (typeof command !== "string") return null;
  for (const [test, label] of RULES) if (test(command)) return label;
  return null;
}

module.exports = { findDestructiveGit };
