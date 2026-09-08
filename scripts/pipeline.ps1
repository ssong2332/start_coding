<#
.SYNOPSIS
  Role -> Provider 파이프라인 실행기. .agents/role-map.yaml의 매핑대로 각 역할을
  Claude Code / Codex CLI / Antigravity CLI 중 지정된 헤드리스 CLI로 실행한다.

.DESCRIPTION
  이 스크립트는 자체 YAML 파서 없이 .agents/role-map.yaml의 고정된 구조(roles:, providers:)만
  파싱한다 — 외부 모듈 의존성을 두지 않기 위한 의도적 선택. role-map.yaml 구조를 크게 바꾸면
  이 파서도 같이 고쳐야 한다.

  사람 승인 게이트(PRD 승인·Architecture 승인)는 provider가 무엇이든 이 스크립트가 자동으로
  넘어가지 않는다 — planner/architect의 "최초 문서 작성"은 이 스크립트가 자동으로 호출하지 않는다
  (-All 대상 아님). -All은 "PRD·Architecture가 이미 승인된 뒤" 구간만 자동화한다:
  implementer -> planner(근거 기록·검증중 전환, 사람 승인 불필요한 정상 업무) -> reviewer -> qa.

  2026-09-09 실측으로 발견: planner 단계를 빼고 implementer -> reviewer -> qa로 바로 가면, QA가
  implementer의 Red-First 실행 증거를 검증할 방법이 없어(그 CLI 세션에만 존재하고 파일에 안 남음)
  항상 "미검증"으로 막힌다. planner가 그 증거를 Tasks.md 근거 칸에 옮겨 적어야 QA가 참조할 수 있다.

  재작업 루프: reviewer가 치명 결함을 내거나 qa가 DoD 미통과를 내면 implementer로 자동 재진입한다.
  AGENTS.md "같은 방법으로 2번 실패 → 3번째 반복 금지" 규칙을 그대로 반영해 최대 2회 시도(-MaxAttempts)
  까지만 자동 반복하고, 그래도 안 되면 멈추고 사람에게 보고한다 — 조용히 계속 반복하지 않는다.

.PARAMETER Stage
  단일 role만 실행 (planner, architect, implementer, reviewer, qa, docs). -All과 동시 사용 불가.

.PARAMETER All
  implementer -> reviewer -> qa를 자동으로 순서대로 실행하고, 결함 발견 시 implementer로 재진입한다.
  -Target이 필요하다. planner/architect(사람 승인 게이트)는 포함하지 않는다 — PRD·Architecture가
  이미 "승인" 상태라는 전제다.

.PARAMETER Target
  -All 사용 시 구현 대상 설명(예: "T-01"). 각 단계 프롬프트에 그대로 포함된다.

.PARAMETER MaxAttempts
  -All의 최대 재작업 횟수. 기본 2(AGENTS.md 검증 루프 규칙과 동일 — 2번 실패하면 멈추고 원인 분석 보고).

.PARAMETER Prompt
  -Stage 단일 실행 시 role에게 전달할 추가 지시. 없으면 role.md만 읽고 판단하게 한다.

.PARAMETER ConfirmDangerous
  provider가 antigravity인 role을 실행하려면 반드시 이 스위치를 명시해야 한다 —
  --dangerously-skip-permissions는 범위 한정 옵션이 없는 전체 권한 우회이기 때문
  (2026-09-08 실측: --mode accept-edits만으로는 read_file조차 자동 거부됨).

.EXAMPLE
  scripts/pipeline.ps1 -Stage implementer -Prompt "Tasks.md의 T-02를 구현해"
.EXAMPLE
  scripts/pipeline.ps1 -All -Target "T-01"
#>

param(
    [ValidateSet("planner", "architect", "implementer", "reviewer", "qa", "docs")]
    [string]$Stage,

    [switch]$All,

    [string]$Target = "",

    [int]$MaxAttempts = 2,

    [string]$Prompt = "",

    [switch]$ConfirmDangerous
)

$ErrorActionPreference = "Stop"

if (-not $Stage -and -not $All) {
    Write-Host "### 결론: 실행 실패 — -Stage <role> 또는 -All -Target <설명> 중 하나는 필수"
    exit 1
}
if ($Stage -and $All) {
    Write-Host "### 결론: 실행 실패 — -Stage와 -All은 동시에 쓸 수 없음"
    exit 1
}
if ($All -and -not $Target) {
    Write-Host "### 결론: 실행 실패 — -All은 -Target(구현 대상 설명, 예: 'T-01') 필수"
    exit 1
}

$root = Split-Path -Parent $PSScriptRoot
$roleMapPath = Join-Path $root ".agents\role-map.yaml"

if (-not (Test-Path $roleMapPath)) {
    Write-Host "### 결론: 실행 실패 — .agents/role-map.yaml 없음"
    exit 1
}

# --- role-map.yaml의 고정 구조만 파싱 (roles: 섹션, providers: 섹션) ---
$lines = Get-Content $roleMapPath
$section = ""
$roles = @{}
$providers = @{}
$currentProvider = ""

foreach ($line in $lines) {
    if ($line -match '^\s*#' -or $line.Trim() -eq "") { continue }
    if ($line -match '^roles:\s*$') { $section = "roles"; continue }
    if ($line -match '^providers:\s*$') { $section = "providers"; continue }

    if ($section -eq "roles" -and $line -match '^\s{2}(\w+):\s*(\w+)\s*$') {
        $roles[$matches[1]] = $matches[2]
        continue
    }
    if ($section -eq "providers") {
        if ($line -match '^\s{2}(\w+):\s*$') {
            $currentProvider = $matches[1]
            $providers[$currentProvider] = @{ command = ""; args = @() }
            continue
        }
        if ($currentProvider -and $line -match '^\s{4}command:\s*(\S+)\s*$') {
            $providers[$currentProvider].command = $matches[1]
            continue
        }
        if ($currentProvider -and $line -match '^\s{4}args:\s*\[(.*)\]\s*$') {
            $raw = $matches[1]
            $providers[$currentProvider].args = $raw -split ',' | ForEach-Object { $_.Trim().Trim('"') }
            continue
        }
    }
}

# --- 단일 role 실행. $capture=$true면 콘솔에도 찍고 문자열로도 반환(재작업 루프 판정용). ---
function Invoke-Role {
    param(
        [string]$RoleName,
        [string]$ExtraPrompt,
        [switch]$Capture,
        [switch]$SkipApprovalNotice
    )

    $roleSpecPath = Join-Path $root ".agents\roles\$RoleName.role.md"
    if (-not (Test-Path $roleSpecPath)) {
        Write-Host "### 결론: 실행 실패 — .agents/roles/$RoleName.role.md 없음"
        exit 1
    }
    if (-not $roles.ContainsKey($RoleName)) {
        Write-Host "### 결론: 실행 실패 — role-map.yaml의 roles: 절에 '$RoleName'이 없음"
        exit 1
    }
    $providerName = $roles[$RoleName]
    if (-not $providers.ContainsKey($providerName)) {
        Write-Host "### 결론: 실행 실패 — role-map.yaml의 providers: 절에 '$providerName' 정의 없음"
        exit 1
    }
    $provider = $providers[$providerName]

    if (($RoleName -eq "planner" -or $RoleName -eq "architect") -and -not $SkipApprovalNotice) {
        Write-Host "안내: 이 role의 산출물은 사람 승인이 필요합니다. 실행 후 결과를 검토하고, 승인 시 문서 머리글 '상태'를 직접 '승인'으로 바꿔주세요."
    }

    if ($providerName -eq "antigravity" -and -not $ConfirmDangerous) {
        Write-Host "### 결론: 실행 보류 — provider가 antigravity인데 -ConfirmDangerous가 없음"
        Write-Host "Antigravity는 범위 한정된 자동 승인 옵션이 없고 --dangerously-skip-permissions(전체 권한 우회)만 가능합니다."
        Write-Host "이해하고 진행하려면 -ConfirmDangerous를 추가하세요."
        exit 1
    }

    $basePrompt = "너는 이 리포의 '$RoleName' role이다. .agents/roles/$RoleName.role.md를 먼저 읽고 그 지시(권한·금지·입력 문서·절차·보고 형식)를 그대로 따르되, AGENTS.md 규칙이 그 문서보다 우선한다. 필요한 docs/*.md는 role.md가 지시하는 대로 직접 읽어라."
    if ($ExtraPrompt) {
        $fullPrompt = "$basePrompt`n`n추가 지시: $ExtraPrompt"
    } else {
        $fullPrompt = $basePrompt
    }

    $exe = $provider.command
    $cliArgs = @($provider.args) + @($fullPrompt)

    Write-Host "### 실행: role=$RoleName provider=$providerName ($exe $($provider.args -join ' ') `"<prompt>`")"

    Push-Location $root
    try {
        if ($Capture) {
            # 화면에도 찍고 변수로도 모은다 — Tee-Object가 파이프라인 stdout을 그대로 통과시킨다.
            # 2>&1을 네이티브 명령에 쓰면 PS 5.1이 stderr 한 줄마다 오류 레코드로 감싸고,
            # 상위 스코프의 $ErrorActionPreference="Stop"과 겹치면 중간에 죽는다 — stdout만 캡처한다.
            $prevEAP = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            $outLines = & $exe @cliArgs | Tee-Object -Variable teeVar
            $ErrorActionPreference = $prevEAP
            $exitCode = $LASTEXITCODE
            $text = ($teeVar | Out-String)
        } else {
            & $exe @cliArgs
            $exitCode = $LASTEXITCODE
            $text = ""
        }
    } finally {
        Pop-Location
    }

    if ($exitCode -ne 0) {
        Write-Host "### 결론: '$RoleName' 실행 종료 코드 $exitCode — 출력 로그 확인 필요"
        exit $exitCode
    }
    return $text
}

# ============================== 단일 -Stage 실행 ==============================
if ($Stage) {
    Invoke-Role -RoleName $Stage -ExtraPrompt $Prompt | Out-Null
    Write-Host "### 결론: '$Stage' 실행 완료. 결과는 위 CLI 출력과 실제 변경된 파일로 직접 확인할 것 — 이 스크립트는 CLI의 자체 보고를 검증하지 않는다."
    exit 0
}

# ============================== -All: implementer -> reviewer -> qa 재작업 루프 ==============================
Write-Host "### 파이프라인 시작: target=$Target, maxAttempts=$MaxAttempts"
Write-Host "전제: docs/PRD.md·docs/Architecture.md가 이미 '승인' 상태여야 한다. 이 스크립트는 그 상태를 자동 확인하지 않는다 — 착수 전 사람이 확인할 것."

$attempt = 1
$carryPrompt = "$Target 을(를) 구현해."
$success = $false

while ($attempt -le $MaxAttempts) {
    Write-Host "`n--- 시도 $attempt/${MaxAttempts}: implementer ---"
    $implementerText = Invoke-Role -RoleName "implementer" -ExtraPrompt $carryPrompt -Capture

    # 2026-09-09 실측으로 발견: implementer의 "검증 전환 요청"(Red-First 실행 출력 포함)은 그 CLI 세션에만
    # 존재하고 Tasks.md에 남지 않아, 다음 세션(qa)이 재확인할 방법이 없어 "미검증"으로 막혔다.
    # AGENTS.md 원래 핸드오프(implementer -> planner가 근거 기록 -> reviewer/QA)대로 planner를 끼워 넣는다.
    # 이건 PRD 최초 작성처럼 사람 승인이 필요한 행동이 아니라(AGENTS.md: 상태 전환은 planner의 정상 업무),
    # -SkipApprovalNotice로 그 안내 문구만 생략한다.
    Write-Host "`n--- 시도 $attempt/${MaxAttempts}: planner (근거 기록 + 검증중 전환) ---"
    Invoke-Role -RoleName "planner" -SkipApprovalNotice -ExtraPrompt "implementer가 아래처럼 '$Target' 구현을 보고하며 검증 전환을 요청했다. docs/Tasks.md의 해당 작업을 '검증중'으로 전환하고, 근거 칸에 이 보고의 테스트 실행 결과(Red/Green 출력 포함)를 그대로 옮겨 기록해라. 코드는 건드리지 마라:`n$implementerText" | Out-Null

    Write-Host "`n--- 시도 $attempt/${MaxAttempts}: reviewer ---"
    $reviewText = Invoke-Role -RoleName "reviewer" -ExtraPrompt "$Target 구현을 리뷰해. node --test 등 재현 가능한 주장은 직접 재실행해서 대조해." -Capture

    $criticalCount = 0
    if ($reviewText -match '치명\s*(\d+)\s*건') { $criticalCount = [int]$matches[1] }

    if ($criticalCount -gt 0) {
        Write-Host "`n결과: reviewer가 치명 결함 ${criticalCount}건 발견 — implementer로 재진입"
        $carryPrompt = "$Target 구현에서 reviewer가 다음 치명 결함을 지적했다. 고쳐라:`n$reviewText"
        $attempt++
        continue
    }

    Write-Host "`n--- 시도 $attempt/${MaxAttempts}: qa ---"
    $qaText = Invoke-Role -RoleName "qa" -ExtraPrompt "$Target 구현을 검증해. 검증된 명령어로 직접 재실행해서 대조해." -Capture

    if ($qaText -match 'DoD\s*(통과|미통과)') {
        $dodResult = $matches[1]
    } else {
        $dodResult = "판정불명"
    }

    if ($dodResult -eq "통과") {
        $success = $true
        break
    }

    Write-Host "`n결과: qa가 DoD 미통과 판정 — implementer로 재진입"
    $carryPrompt = "$Target 구현에서 qa가 DefinitionOfDone 미통과를 판정했다. 고쳐라:`n$qaText"
    $attempt++
}

Write-Host "`n=================================================="
if ($success) {
    Write-Host "### 결론: '$Target' 자동 파이프라인 통과 (reviewer 치명 0건 + qa DoD 통과, ${attempt}차 시도)"
    Write-Host "다음 단계: 사람이 planner 역할로 docs/Tasks.md 상태를 '검증중'→'완료'로 전환 (이 스크립트는 Tasks.md를 대신 쓰지 않는다 — AGENTS.md상 상태 전환은 planner만 가능)."
} else {
    Write-Host "### 결론: '$Target' 자동 파이프라인 실패 — ${MaxAttempts}회 시도 모두 결함/미통과. 3번째 자동 반복 금지(AGENTS.md 검증 루프 규칙)."
    Write-Host "다음 단계: 사람이 위 로그(reviewer/qa 마지막 보고)를 읽고 원인을 분석할 것. 자동으로 더 반복하지 않는다."
}
