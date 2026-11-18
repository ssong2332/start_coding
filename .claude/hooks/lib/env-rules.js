// .env 접근 판정 규칙 — block-env-access.js(Claude·Codex)와 scripts/agy-guard.js(안티그래비티)가 공유한다.
// 두 파일에 같은 정규식을 복사해 두면 한쪽만 고쳐져 어긋난다(2b50c7a 리뷰 권고 7). test-guards.js의
// [agy=claude] 케이스가 두 가드의 판정이 같은지 확인한다.

// Windows·macOS 파일 시스템은 대소문자를 가리지 않는다(.ENV도 같은 파일)
function isEnvPath(p) {
  if (typeof p !== "string") return false;
  const base = p.replace(/\\/g, "/").split("/").pop() || "";
  return /^\.env(\..+)?$/i.test(base) && base.toLowerCase() !== ".env.example";
}

// ".env"·".env.변형"이 독립 경로 세그먼트로 등장 (.env.example 제외). process.env처럼 식별자 일부는 앞 문자 조건으로 거른다.
// 뒤 문자에 PowerShell에서 붙여 쓰는 ; | , * ? } ] 포함.
const ENV_REF = /(^|[\s"'`/\\:(])\.env(?!\.example\b)(\.\w+)?(?=[\s"'`/\\:);|,*?}\]]|$)/i;

// .env를 읽거나 드러내거나 쓰거나 옮기거나 지우는 명령 (Bash·PowerShell·.NET)
const VERBS =
  /\b(cat|type|more|less|head|tail|bat|Get-Content|gc|Select-String|code|vim|nvim|nano|notepad|cp|copy|scp|curl|tee|grep|rg|findstr|sed|awk|Copy-Item|cpi|Import-Csv|ipcsv|sls|ii|Invoke-Item|ReadAll\w*|ReadLines|OpenText|StreamReader|Set-Content|sc|Add-Content|ac|Out-File|WriteAll\w*|AppendAll\w*|Move-Item|mi|move|Rename-Item|rni|ren|Remove-Item|ri|rm|del|erase)\b/i;
const REDIRECT = />>?\s*['"]?(?:\.[\\/])?\.env(?!\.example\b)/i;

function commandTouchesEnv(command) {
  if (typeof command !== "string" || !ENV_REF.test(command)) return false;
  return VERBS.test(command) || REDIRECT.test(command);
}

module.exports = { isEnvPath, commandTouchesEnv };
