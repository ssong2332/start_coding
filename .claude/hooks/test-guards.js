#!/usr/bin/env node
// PreToolUse 가드 3종과 확인 훅(confirm-agy-delegate)의 회귀 테스트. 어떤 훅 이벤트에도 안 걸려 있다 —
// 가드 패턴을 고친 뒤 손으로 돌린다:
//
//   node .claude/hooks/test-guards.js
//
// 2026-08-18에 이 파일을 처음 짜다가 block-no-verify.js가 "git commit -nm"
// (--no-verify를 -m과 묶은 짧은 플래그 클러스터)을 통과시키는 것을 발견해
// 그 자리에서 고쳤다 — 회귀 스위트가 없어서 그 전까지 아무도 몰랐던 구멍이다.
// 이 파일이 존재하는 이유가 바로 그것: 패턴을 고칠 때마다 다시 확인할 수단.
//
// 각 케이스는 종료 코드만 본다 — PreToolUse 계약의 전부이기 때문이다:
// 2는 차단, 그 외는 전부 허용. 크래시(예외로 죽는 것)도 exit 0이 아닌 다른
// 코드로 끝나므로 "크래시=ALLOW"가 되는 실패 모드를 CRASH로 별도 표시해
// 통과로 착각하지 않게 한다.
const { spawnSync } = require("child_process");
const path = require("path");
const { execFileSync } = require("child_process");

// 이 파일 자체가 block-env-access.js·block-no-verify.js가 감시하는 문자열을
// 그대로 담고 있으면 Claude Code/Codex를 통해 이 파일을 편집할 때 그 훅에
// 스스로 걸린다 — 조립해서 피한다.
const E = "." + "env";
const GC = "git" + " " + "commit";
const GP = "git" + " " + "push";

function verdict(script, payload) {
  const r = spawnSync(process.execPath, [path.resolve(__dirname, script)], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  if (r.status === 2) return "BLOCK";
  // exit 0이어도 permissionDecision "ask"를 내면 사용자 확인 창이 뜬다 — 허용과 구분한다
  if (r.status === 0 && /"permissionDecision"\s*:\s*"ask"/.test(r.stdout || "")) return "ASK";
  if (r.status === 0) return "ALLOW";
  return `CRASH(${r.status}): ${(r.stderr || "").split("\n")[0]}`;
}

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });

// block-main-writes의 두 케이스는 실행 시점의 실제 체크아웃 브랜치에 좌우된다
// (파일 헤더의 "브랜치 판정은 실행 전 HEAD 기준" 그대로) — 다른 브랜치에서
// 돌려도 항상 맞게 판정하도록 기대값을 여기서 동적으로 계산한다.
let onProtectedBranch = false;
try {
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
  onProtectedBranch = branch === "main" || branch === "master";
} catch {
  /* git 리포가 아니면 아래 두 케이스는 건너뛰지 않고 ALLOW를 기대(가드도 fail-open) */
}

const CASES = [
  // block-env-access — Bash 경로
  ["block-env-access.js", bash(`cat ${E}`), "BLOCK", "시크릿 파일을 읽음"],
  ["block-env-access.js", bash(`cat ${E}.local`), "BLOCK", "환경별 변형도 시크릿을 담는다"],
  ["block-env-access.js", bash(`cat ${E}.production`), "BLOCK", "동일"],
  ["block-env-access.js", bash(`echo X >> ${E}.local`), "BLOCK", "변형 파일 덮어쓰기"],
  ["block-env-access.js", bash(`cat ${E}.example`), "ALLOW", "추적되는 플레이스홀더는 공개"],
  ["block-env-access.js", bash("npm run dev"), "ALLOW", "무관한 명령"],
  ["block-env-access.js", bash(`gc ${E}`), "BLOCK", "PowerShell Get-Content 별칭"],
  ["block-env-access.js", bash(`Select-String KEY ${E}`), "BLOCK", "PowerShell 검색 별칭"],
  ["block-env-access.js", bash(`findstr KEY ${E}`), "BLOCK", "Windows 검색 명령"],
  ["block-env-access.js", bash(`sed -n '1p' ${E}`), "BLOCK", "sed로 라인 출력"],
  ["block-env-access.js", bash(`grep KEY ${E}`), "BLOCK", "grep으로 매칭 라인 출력"],
  // block-env-access — 파일 도구 경로
  ["block-env-access.js", { tool_name: "Read", tool_input: { file_path: `${E}.local` } }, "BLOCK", "Read로 변형 파일"],
  ["block-env-access.js", { tool_name: "Grep", tool_input: { pattern: "KEY", path: E } }, "BLOCK", "Grep은 매칭 라인 자체를 출력한다"],
  ["block-env-access.js", { tool_name: "Grep", tool_input: { pattern: "KEY", glob: `**/${E}` } }, "BLOCK", "glob이 .env를 겨냥"],
  ["block-env-access.js", { tool_name: "Read", tool_input: { file_path: `${E}.example` } }, "ALLOW", "플레이스홀더는 Read 허용"],
  ["block-env-access.js", { tool_name: "Grep", tool_input: { pattern: "KEY", path: "src" } }, "ALLOW", "평범한 Grep"],
  // block-env-access — Codex apply_patch 경로
  ["block-env-access.js", { tool_name: "apply_patch", tool_input: { command: `*** Update File: ${E}\n@@\n-a\n+b\n` } }, "BLOCK", "apply_patch 대상이 .env"],
  ["block-env-access.js", { tool_name: "apply_patch", tool_input: { command: `*** Update File: ${E}.example\n@@\n-a\n+b\n` } }, "ALLOW", "apply_patch 대상이 플레이스홀더"],
  // block-no-verify
  ["block-no-verify.js", bash(`${GC} --no-verify -m x`), "BLOCK", "장문형"],
  ["block-no-verify.js", bash(`${GC} -n -m x`), "BLOCK", "-n 단독 (--no-verify 단축형)"],
  ["block-no-verify.js", bash(`${GC} -nm "x"`), "BLOCK", "-n을 -m과 묶은 짧은 플래그 클러스터 (2026-08-18에 여기서 뚫린 것을 발견)"],
  ["block-no-verify.js", bash(`${GC} -mn "x"`), "BLOCK", "순서를 바꾼 클러스터"],
  ["block-no-verify.js", bash("git log -n 5"), "ALLOW", "commit이 아닌 곳의 -n은 count 옵션"],
  ["block-no-verify.js", bash(`${GC} -m "x"`), "ALLOW", "평범한 커밋"],
  ["block-no-verify.js", bash(`${GC} --amend`), "ALLOW", "amend는 우회가 아니다"],
  // 아래 세 건은 오탐이지만 의도된 차단이다 — 인자 단위 검사만 쓰면 bash -c·백틱·Windows 경로 우회가
  // 뚫려서(2026-10-27 재리뷰 치명 1~3) 이전 정규식을 합집합으로 되살렸다. 안전 쪽을 택한 대가.
  ["block-no-verify.js", bash(`${GC} -m "use -en flag"`), "BLOCK", "메시지 텍스트 오탐 — 합집합 설계의 대가"],
  ["block-no-verify.js", bash(`${GC} -m 'see -n docs'`), "BLOCK", "작은따옴표 메시지 오탐 — 같은 대가"],
  ["block-no-verify.js", bash(`echo "${GC} -n"`), "BLOCK", "문자열 안 언급도 차단 — 같은 대가"],
  ["block-no-verify.js", bash(`${GC} "-n" -m x`), "BLOCK", "따옴표로 감싸도 git은 -n 플래그로 받는다 (인자 단위 검사가 잡음)"],
  ["block-no-verify.js", bash(`bash -c "${GC} -n -m x"`), "BLOCK", "bash -c 문자열 안의 커밋 (재리뷰 치명 1)"],
  ["block-no-verify.js", bash(`powershell -Command "${GC} -n"`), "BLOCK", "powershell -Command 문자열 안 (치명 1)"],
  ["block-no-verify.js", bash(`"C:\\Program Files\\Git\\cmd\\git.exe" commit -n`), "BLOCK", "Windows 역슬래시 경로의 git (치명 2)"],
  ["block-no-verify.js", bash("echo `" + `${GC} -n` + "`"), "BLOCK", "백틱 서브셸 안의 커밋 (치명 3)"],
  ["block-no-verify.js", bash(`${GC} -n>/dev/null`), "BLOCK", "리다이렉트가 붙은 플래그 (치명 3)"],
  ["block-no-verify.js", bash(`git -c alias.c=commit c -n`), "BLOCK", "별칭 경유 커밋 (재리뷰 권고 8)"],
  ["block-no-verify.js", bash(`git -C repo commit -n -m x`), "BLOCK", "commit 앞의 git 전역 옵션"],
  ["block-no-verify.js", bash(`cd repo && ${GC} -nm x`), "BLOCK", "연결된 명령 구간 안의 커밋"],
  // Windows는 파일 이름 대소문자를 가리지 않아 GIT.EXE도 git으로 실행된다 (재리뷰 권고 5)
  ["block-no-verify.js", bash(`GIT.EXE commit -n -m x`), "BLOCK", "대문자 실행 파일 이름 + 짧은 플래그"],
  ["block-no-verify.js", bash(`GIT commit --no-` + "verify"), "BLOCK", "대문자 git + 장문형"],
  ["block-no-verify.js", bash(`Git commit -nm x`), "BLOCK", "섞인 대소문자 + 클러스터"],
  // 대소문자 구분을 없앤 뒤의 오탐 방지 (f8fed91 재리뷰 권고 2)
  ["block-no-verify.js", bash(`GIT log -n 5`), "ALLOW", "대문자 git의 commit 아닌 -n (count 옵션)"],
  ["block-no-verify.js", bash(`Git commit -m "x"`), "ALLOW", "섞인 대소문자의 평범한 커밋"],
  // confirm-agy-delegate — 안티그래비티 권한 우회 실행은 매번 사용자 확인 (리뷰 권고 4)
  ["confirm-agy-delegate.js", bash(`agy --dangerously-skip-permissions -p "Read x/prompt.md"`), "ASK", "권한 우회 위임 실행"],
  ["confirm-agy-delegate.js", bash(`cd repo && agy.exe --dangerously-skip-permissions -p "x"`), "ASK", "연결 명령·.exe 이름"],
  ["confirm-agy-delegate.js", bash(`agy --help`), "ALLOW", "권한 우회 플래그 없는 agy"],
  ["confirm-agy-delegate.js", bash(`echo "agy --dangerously-skip-permissions"`), "ASK", "문자열 언급도 확인 창 — 합집합 설계의 대가(차단이 아니라 확인이라 무해)"],
  ["confirm-agy-delegate.js", bash(`bash -c "agy --dangerously-skip-permissions -p x"`), "ASK", "bash -c 문자열 안 (재리뷰 권고 4)"],
  ["confirm-agy-delegate.js", bash(`agy.cmd --dangerously-skip-permissions -p x`), "ASK", "npm 래퍼 이름"],
  ["confirm-agy-delegate.js", bash(`agy --dangerously-skip-permissions=true -p x`), "ASK", "= 값 형태"],
  ["confirm-agy-delegate.js", bash("npm test"), "ALLOW", "무관한 명령"],
  // block-main-writes — 브랜치 무관 케이스
  [
    "block-main-writes.js",
    bash(`${GP} origin fix/x:main`),
    "BLOCK",
    "다른 브랜치를 병합 없이 main에 직접 push",
  ],
  ["block-main-writes.js", bash(`${GP} origin +fix/x:main`), "BLOCK", "강제 push도 동일하게 차단"],
  ["block-main-writes.js", bash(`GIT.EXE push origin fix/x:main`), "BLOCK", "대문자 실행 파일 이름의 refspec push (재리뷰 권고 5)"],
  ["block-main-writes.js", bash(`${GP} origin "fix/x:main"`), "BLOCK", "인용부호로 감싼 refspec"],
  // Windows에서 흔한 따옴표 감싼 전체 경로 — git.exe 바로 뒤에 닫는 따옴표가 온다 (2026-10-28 f8fed91 재리뷰 권고 1)
  ["block-main-writes.js", bash(`"C:\\Program Files\\Git\\cmd\\git.exe" push origin fix/x:main`), "BLOCK", "따옴표 감싼 git.exe 경로의 refspec push"],
  // 대소문자 구분을 없앤 뒤의 오탐 방지 (f8fed91 재리뷰 권고 2)
  ["block-main-writes.js", bash(`GIT push origin main`), "ALLOW", "대문자 git의 평범한 push"],
  ["block-main-writes.js", bash(`GIT.EXE log --oneline -1`), "ALLOW", "대문자 git의 무관한 하위 명령"],
  ["block-main-writes.js", bash(`${GP} origin main`), "ALLOW", "같은 브랜치의 평범한 push"],
  ["block-main-writes.js", bash(`${GP} origin main:main`), "ALLOW", "명시적 main:main도 평범한 push"],
  [
    "block-main-writes.js",
    bash(`${GP} origin feature:main-fix`),
    "ALLOW",
    "dst가 main이 아니라 하이픈 붙은 다른 브랜치(main-fix) — 오탐 방지 확인",
  ],
  ["block-main-writes.js", bash("npm test"), "ALLOW", "git과 무관한 명령"],
  // block-main-writes — 되돌릴 수 없는 git 명령 (mattpocock/skills git-guardrails 개념 차용, push 전체 차단은 제외)
  ["block-main-writes.js", bash("git reset --hard HEAD~1"), "BLOCK", "작업 트리·커밋을 버리는 reset --hard"],
  ["block-main-writes.js", bash("git -C repo reset --hard"), "BLOCK", "git 전역 -C 옵션 뒤의 reset --hard"],
  ["block-main-writes.js", bash("git reset --soft HEAD~1"), "ALLOW", "변경을 남기는 soft reset"],
  ["block-main-writes.js", bash("git clean -fd"), "BLOCK", "추적 안 되는 파일 삭제"],
  ["block-main-writes.js", bash("git clean --force"), "BLOCK", "장문형 clean 강제"],
  ["block-main-writes.js", bash("git clean -n"), "ALLOW", "dry-run은 지우지 않는다"],
  ["block-main-writes.js", bash("git branch -D feat/x"), "BLOCK", "병합 안 된 브랜치 강제 삭제"],
  ["block-main-writes.js", bash("git branch -d -f feat/x"), "BLOCK", "-d -f 조합도 강제 삭제"],
  ["block-main-writes.js", bash("git branch -d feat/x"), "ALLOW", "병합된 브랜치만 지우는 안전한 삭제"],
  ["block-main-writes.js", bash(`${GP} --force origin feat/x`), "BLOCK", "강제 push"],
  ["block-main-writes.js", bash(`${GP} -f origin feat/x`), "BLOCK", "강제 push 단축형"],
  ["block-main-writes.js", bash(`${GP} origin +feat/x`), "BLOCK", "+refspec 강제 push"],
  ["block-main-writes.js", bash(`${GP} --force-with-lease origin feat/x`), "ALLOW", "원격이 바뀌었으면 거부하는 안전한 강제 push"],
  ["block-main-writes.js", bash("git checkout -- ."), "BLOCK", "작업 트리 변경 전체 폐기"],
  ["block-main-writes.js", bash("git checkout ."), "BLOCK", "동일 (-- 생략)"],
  ["block-main-writes.js", bash("git restore ."), "BLOCK", "작업 트리 변경 전체 폐기"],
  ["block-main-writes.js", bash("git restore --staged ."), "ALLOW", "스테이징만 취소 — 작업 트리는 그대로"],
  ["block-main-writes.js", bash("git checkout -b feat/x"), "ALLOW", "브랜치 생성"],
  ["block-main-writes.js", bash("GIT.EXE reset --hard"), "BLOCK", "대문자 실행 파일 이름"],
  ["block-main-writes.js", bash(`"C:\\Program Files\\Git\\cmd\\git.exe" clean -fdx`), "BLOCK", "따옴표 감싼 git.exe 경로"],
  ["block-main-writes.js", bash("cd repo && git reset --hard"), "BLOCK", "연결된 명령 구간 안"],
  // a59c376 리뷰 치명 1~3·권고 4~5 — 전역 옵션 우회, restore 어순, branch 플래그 묶음, 단축형·변형
  ["block-main-writes.js", bash("git -c core.editor=x reset --hard"), "BLOCK", "전역 -c k=v 뒤 (치명 1)"],
  ["block-main-writes.js", bash("git --no-pager reset --hard"), "BLOCK", "전역 --no-pager 뒤 (치명 1)"],
  ["block-main-writes.js", bash(`git -P push --force origin x`), "BLOCK", "전역 -P 뒤 강제 push (치명 1)"],
  ["block-main-writes.js", bash("git --work-tree=. clean -fd"), "BLOCK", "전역 --work-tree= 뒤 (치명 1)"],
  ["block-main-writes.js", bash("git --git-dir x reset --hard"), "BLOCK", "공백으로 값을 받는 전역 --git-dir 뒤 (치명 1)"],
  ["block-main-writes.js", bash("git restore -W --staged ."), "BLOCK", "-W가 --staged 앞이어도 작업 트리 폐기 (치명 2)"],
  ["block-main-writes.js", bash("git branch -df x"), "BLOCK", "-d·-f 묶음 (치명 3)"],
  ["block-main-writes.js", bash("git branch -fd x"), "BLOCK", "순서 바꾼 묶음 (치명 3)"],
  ["block-main-writes.js", bash("git restore -S ."), "ALLOW", "-S는 --staged 단축형 (권고 4)"],
  ["block-main-writes.js", bash("git checkout ./"), "BLOCK", "./ 변형 (권고 5)"],
  ["block-main-writes.js", bash("git restore :/"), "BLOCK", "저장소 루트 :/ (권고 5)"],
  ["block-main-writes.js", bash("git checkout -- *"), "BLOCK", "* 변형 (권고 5)"],
  ["block-main-writes.js", bash("git checkout -- file.txt"), "ALLOW", "파일 하나 되돌리기는 범위 밖"],
  ["block-main-writes.js", bash("git -c user.name=x log -1"), "ALLOW", "전역 옵션 뒤 무관한 하위 명령"],
  ["block-main-writes.js", bash("git checkout main && git checkout ."), "BLOCK", "같은 하위 명령이 두 번 — 두 번째 구간"],
  ["block-main-writes.js", bash("git branch -d a; git branch -D b"), "BLOCK", "두 번째 branch 구간의 -D"],
  // block-main-writes — 실행 시점 브랜치에 좌우되는 케이스 (파일 헤더의 문서화된 한계)
  [
    "block-main-writes.js",
    bash(`${GC} -m "x"`),
    onProtectedBranch ? "BLOCK" : "ALLOW",
    `현재 브랜치가 ${onProtectedBranch ? "main/master라 차단돼야 함" : "main/master가 아니라 허용돼야 함"}`,
  ],
  [
    "block-main-writes.js",
    bash(`"C:\\Program Files\\Git\\cmd\\git.exe" commit -m "x"`),
    onProtectedBranch ? "BLOCK" : "ALLOW",
    `따옴표 감싼 git.exe 경로의 커밋 — ${onProtectedBranch ? "main/master라 차단돼야 함" : "main/master가 아니라 허용돼야 함"} (f8fed91 재리뷰 권고 1)`,
  ],
  [
    "block-main-writes.js",
    bash(`${GP} origin HEAD:refs/heads/master`),
    onProtectedBranch ? "ALLOW" : "BLOCK",
    `HEAD가 ${onProtectedBranch ? "이미 main/master이므로 자기 자신을 push하는 것과 같음" : "main/master가 아닌데 refspec으로 master에 써넣으려 함"}`,
  ],
];

// 공용 모듈(lib/shell-args.js)이 없을 때도 block-no-verify가 죽지 않고 차단해야 한다 —
// 죽으면 exit 1이라 우회 플래그가 전부 통과한다(2026-10-27 재리뷰 권고 1).
// 임시 fixture는 OS 임시 폴더에 만들고 이 실행이 끝나면 지운다.
const fs = require("fs");
const os = require("os");
const noLibDir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-nolib-"));
fs.mkdirSync(path.join(noLibDir, "lib"));
fs.copyFileSync(path.join(__dirname, "block-no-verify.js"), path.join(noLibDir, "block-no-verify.js"));
fs.copyFileSync(path.join(__dirname, "lib", "read-hook-input.js"), path.join(noLibDir, "lib", "read-hook-input.js"));
const noLib = path.join(noLibDir, "block-no-verify.js");
CASES.push(
  [noLib, bash(`${GC} --no-` + "verify"), "BLOCK", "[모듈 없음] 긴 플래그는 정규식 목록으로 차단"],
  [noLib, bash(`${GC} -` + `nm "x"`), "BLOCK", "[모듈 없음] 짧은 플래그는 대체 정규식으로 차단"],
  [noLib, bash("git status"), "ALLOW", "[모듈 없음] 대체 경로가 정상 명령을 막지 않음"]
);

// PowerShell 도구 경로 — Claude Code는 Bash 말고 PowerShell 도구로도 셸 명령을 실행한다(2026-11-18 사용자 지시 "연결해").
// 같은 payload 스키마(tool_name/tool_input.command)로 가드가 똑같이 판정해야 한다.
const ps = (command) => ({ tool_name: "PowerShell", tool_input: { command } });
CASES.push(
  ["block-env-access.js", ps(`Get-Content ${E}`), "BLOCK", "[PowerShell] 시크릿 파일 읽기"],
  ["block-env-access.js", ps(`Copy-Item ${E} x.txt`), "BLOCK", "[PowerShell] Copy-Item으로 복사"],
  ["block-env-access.js", ps(`[IO.File]::ReadAllText('${E}')`), "BLOCK", "[PowerShell] .NET 직접 읽기"],
  ["block-env-access.js", ps(`Get-Content ${E}.example`), "ALLOW", "[PowerShell] 플레이스홀더는 허용"],
  // 203ce33 리뷰 치명 1·2, 권고 4 — 붙여 쓴 파이프·세미콜론, 대소문자, 별칭, .NET 읽기, 덮어쓰기 동사
  ["block-env-access.js", ps(`gc ${E}|sls KEY`), "BLOCK", "[PowerShell] 파이프를 붙여 쓴 읽기"],
  ["block-env-access.js", ps(`gc ${E};`), "BLOCK", "[PowerShell] 세미콜론을 붙여 쓴 읽기"],
  ["block-env-access.js", ps(`gc ${E.toUpperCase()}`), "BLOCK", "[PowerShell] 대문자 파일 이름 (NTFS는 대소문자 무시)"],
  ["block-env-access.js", ps(`sls KEY ${E}`), "BLOCK", "[PowerShell] Select-String 별칭 sls"],
  ["block-env-access.js", ps(`ipcsv ${E}`), "BLOCK", "[PowerShell] Import-Csv 별칭 ipcsv"],
  ["block-env-access.js", ps(`cpi ${E} x`), "BLOCK", "[PowerShell] Copy-Item 별칭 cpi"],
  ["block-env-access.js", ps(`Import-Csv ${E}`), "BLOCK", "[PowerShell] Import-Csv"],
  ["block-env-access.js", ps(`ii ${E}`), "BLOCK", "[PowerShell] Invoke-Item 별칭 ii (기본 앱으로 열기)"],
  ["block-env-access.js", ps(`[IO.File]::ReadLines('${E}')`), "BLOCK", "[PowerShell] .NET ReadLines"],
  ["block-env-access.js", ps(`New-Object IO.StreamReader('${E}')`), "BLOCK", "[PowerShell] .NET StreamReader"],
  ["block-env-access.js", ps(`Set-Content ${E} x`), "BLOCK", "[PowerShell] Set-Content 덮어쓰기"],
  ["block-env-access.js", ps(`sc ${E} x`), "BLOCK", "[PowerShell] Set-Content 별칭 sc"],
  ["block-env-access.js", ps(`Add-Content ${E} x`), "BLOCK", "[PowerShell] Add-Content 덧붙이기"],
  ["block-env-access.js", ps(`'x' | Out-File ${E}`), "BLOCK", "[PowerShell] Out-File 덮어쓰기"],
  ["block-env-access.js", ps(`echo x > .\\${E}`), "BLOCK", "[PowerShell] .\\ 경로 리다이렉션"],
  ["block-env-access.js", ps(`Test-Path ${E}`), "ALLOW", "[PowerShell] 존재 확인은 내용을 드러내지 않는다"],
  ["block-env-access.js", ps(`$env:PATH`), "ALLOW", "[PowerShell] 환경 변수 드라이브는 파일이 아니다"],
  ["block-main-writes.js", ps("git reset `\n--hard"), "BLOCK", "[PowerShell] 백틱 줄 이어쓰기 (권고 3)"],
  ["block-no-verify.js", ps(`${GC} --no-` + "verify -m x"), "BLOCK", "[PowerShell] 훅 우회 플래그"],
  ["block-main-writes.js", ps("git reset --hard"), "BLOCK", "[PowerShell] 되돌릴 수 없는 git 명령"],
  ["block-main-writes.js", ps("git status"), "ALLOW", "[PowerShell] 평범한 git 명령"],
  ["confirm-agy-delegate.js", ps(`agy --dangerously-skip-permissions -p x`), "ASK", "[PowerShell] 권한 우회 위임"]
);

// 배선 확인: 셸 가드 4종이 settings.json에서 Bash와 PowerShell 도구 둘 다에 걸려 있어야 한다.
// 스크립트가 PowerShell 입력을 판정할 수 있어도 배선이 없으면 실행되지 않는다(2026-11-18 이 세션에서 실제로 열려 있던 공백).
const settings = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "settings.json"), "utf8"));
const shellGuards = ["block-main-writes.js", "block-no-verify.js", "block-env-access.js", "confirm-agy-delegate.js"];
const wiringFailures = [];
for (const tool of ["Bash", "PowerShell"]) {
  const wired = (settings.hooks?.PreToolUse || [])
    .filter((e) => new RegExp(`^(?:${e.matcher})$`).test(tool))
    .flatMap((e) => e.hooks.map((h) => h.command));
  for (const g of shellGuards) {
    const ok = wired.some((c) => c.includes(g));
    if (!ok) wiringFailures.push(`${tool} → ${g}`);
  }
}

// 안티그래비티 경로(scripts/agy-guard.js 2-2b)도 같은 판정 모듈로 막는지 — a59c376 리뷰 권고 7.
// agy는 종료 코드가 아니라 stdout의 decision으로 답하므로 BLOCK/ALLOW로 옮겨 같은 표에 넣는다.
const agyGuard = path.resolve(__dirname, "..", "..", "scripts", "agy-guard.js");
const agy = (command) => ({ toolCall: { name: "run_command", args: { CommandLine: command } } });
const agyVerdict = (payload) => {
  const r = spawnSync(process.execPath, [agyGuard], { input: JSON.stringify(payload), encoding: "utf8" });
  const d = ((r.stdout || "").match(/"decision"\s*:\s*"(\w+)"/) || [])[1];
  return d === "deny" ? "BLOCK" : d === "allow" ? "ALLOW" : `CRASH(${r.status})`;
};
const AGY_CASES = [
  [agy("git -c x=y reset --hard"), "BLOCK", "[agy] 전역 옵션 뒤 reset --hard"],
  [agy("git branch -df x"), "BLOCK", "[agy] branch -df"],
  [agy(`${GP} --force-with-lease origin x`), "ALLOW", "[agy] 안전한 강제 push"],
  [agy("git restore --staged ."), "ALLOW", "[agy] 스테이징만 취소"],
];

let failed = 0;
for (const [payload, expected, why] of AGY_CASES) {
  const actual = agyVerdict(payload);
  if (actual !== expected) failed++;
  console.log(`${actual === expected ? "  ok  " : " FAIL "} ${"agy-guard.js".padEnd(22)} ${why.padEnd(58)} expected=${expected} actual=${actual}`);
}
try {
for (const [script, payload, expected, why] of CASES) {
  const actual = verdict(script, payload);
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${path.basename(script).padEnd(22)} ${why.padEnd(58)} expected=${expected} actual=${actual}`);
}
} finally {
  fs.rmSync(noLibDir, { recursive: true, force: true });
}

console.log(`${wiringFailures.length ? " FAIL " : "  ok  "} ${"settings.json".padEnd(22)} 셸 가드 4종이 Bash·PowerShell 둘 다에 배선됨${wiringFailures.length ? " — 누락: " + wiringFailures.join(", ") : ""}`);
if (wiringFailures.length) failed++;
const total = CASES.length + AGY_CASES.length + 1;
console.log(`\n${total - failed}/${total} 통과`);
process.exit(failed === 0 ? 0 : 1);
