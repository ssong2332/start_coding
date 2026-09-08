<#
.SYNOPSIS
  메인 오케스트레이터 — 이 창에 텍스트를 입력하면 파이프라인 현재 단계에 맞는 CLI를
  "새 창"으로 띄워 헤드리스로 실행하고, 그 창에서 결과를 보여준다.

.DESCRIPTION
  상주 대화창(같은 CLI 세션에 계속 이어 말하기) 방식은 이 환경(tmux·WSL 없음)에서
  ConPTY 기반 새 앱이 필요해 구현 난이도가 높다 — 그래서 "매번 새 창" 방식으로 만들었다.
  이 창(오케스트레이터)은 계속 살아있고, 실행마다 별도 PowerShell 창이 뜬다.

  자동 판단 로직(docs/PRD.md·Architecture.md 머리글 상태, docs/Tasks.md 행 상태)으로
  "지금 어느 단계인지"를 스스로 파악하고, 사용자가 입력한 자유 텍스트를 그 단계 role의
  -Prompt로 넘긴다. scripts/pipeline.ps1을 그대로 재사용한다 — 이 스크립트는 pipeline.ps1의
  실행 로직을 다시 만들지 않고 "언제·어느 role을·새 창으로" 부르는 판단만 한다.

  명령어 3개:
    승인   — 지금 미승인 상태인 문서(PRD 우선, 없으면 Architecture)의 머리글을 '승인'으로 바꾼다.
             이건 스크립트가 대신 판단하는 게 아니라, 사람이 이 창에 직접 친 명령이라 AGENTS.md
             "승인은 사용자만" 규칙에 어긋나지 않는다.
    진행   — 지금 단계에 맞는 자동 동작을 새 창으로 실행한다 (구현 단계면 pipeline.ps1 -All).
    종료   — 오케스트레이터를 끝낸다.
  그 외 자유 텍스트는 지금 단계 role에게 보낼 추가 지시로 취급한다 — 단, 아이디어 인터뷰 단계는
  예외다(자유 텍스트 미지원, '진행'으로 연 대화형 창에서만 가능 — 이유는 아래 interview 케이스 주석 참조).

.EXAMPLE
  scripts/orchestrator.ps1
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pipelinePath = Join-Path $root "scripts\pipeline.ps1"

if (-not (Test-Path $pipelinePath)) {
    Write-Host "### 결론: 실행 실패 — scripts/pipeline.ps1 없음"
    exit 1
}

function Get-DocStatus {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return "없음" }
    $line = Get-Content $Path -Encoding UTF8 | Where-Object { $_ -match '상태:\s*(초안|승인)' } | Select-Object -First 1
    if ($line -match '상태:\s*(초안|승인)') { return $matches[1] }
    return "판정불명"
}

function Set-DocApproved {
    param([string]$Path)
    $content = Get-Content -Raw -Encoding UTF8 $Path
    $newContent = $content -replace '(상태:\s*)초안', '${1}승인'
    [System.IO.File]::WriteAllText($Path, $newContent, [System.Text.UTF8Encoding]::new($true))
}

function Get-NextPendingTask {
    $tasksPath = Join-Path $root "docs\Tasks.md"
    if (-not (Test-Path $tasksPath)) { return $null }
    $lines = Get-Content $tasksPath -Encoding UTF8
    foreach ($line in $lines) {
        if ($line -match '^\|\s*(T-\d+)\s*\|\s*(.+?)\s*\|.*\|\s*(대기|진행)\s*\|') {
            return @{ Id = $matches[1]; Desc = $matches[2]; Status = $matches[3] }
        }
    }
    return $null
}

function Get-Phase {
    $prdStatus = Get-DocStatus (Join-Path $root "docs\PRD.md")
    $archStatus = Get-DocStatus (Join-Path $root "docs\Architecture.md")
    $task = Get-NextPendingTask

    if ($prdStatus -ne "승인") { return @{ Name = "interview"; PrdStatus = $prdStatus; ArchStatus = $archStatus; Task = $task } }
    if ($archStatus -ne "승인") { return @{ Name = "architect"; PrdStatus = $prdStatus; ArchStatus = $archStatus; Task = $task } }
    if ($task) { return @{ Name = "implement"; PrdStatus = $prdStatus; ArchStatus = $archStatus; Task = $task } }
    return @{ Name = "done"; PrdStatus = $prdStatus; ArchStatus = $archStatus; Task = $task }
}

function Start-InteractiveWindow {
    param([string]$Command)
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $Command
}

function Start-StageWindow {
    param([string]$StageName, [string]$PromptText)
    $tmpFile = Join-Path $env:TEMP "orchestrator-prompt-$([guid]::NewGuid().ToString('N')).txt"
    [System.IO.File]::WriteAllText($tmpFile, $PromptText, [System.Text.UTF8Encoding]::new($true))
    $cmd = "Set-Location '$root'; `$p = Get-Content -Raw -Encoding UTF8 '$tmpFile'; & '$pipelinePath' -Stage $StageName -Prompt `$p; Remove-Item '$tmpFile' -Force -ErrorAction SilentlyContinue"
    Start-InteractiveWindow -Command $cmd
}

function Start-AllWindow {
    param([string]$TargetText)
    $cmd = "Set-Location '$root'; & '$pipelinePath' -All -Target '$($TargetText -replace "'", "''")'"
    Start-InteractiveWindow -Command $cmd
}

Write-Host "=================================================="
Write-Host "메인 오케스트레이터 — $root"
Write-Host "명령: 승인 | 진행 | 종료 | (그 외 자유 텍스트는 지금 단계에 지시로 전달)"
Write-Host "=================================================="

while ($true) {
    $phase = Get-Phase

    Write-Host "`n--- 현재 상태 ---"
    Write-Host "PRD: $($phase.PrdStatus) | Architecture: $($phase.ArchStatus)"
    if ($phase.Task) {
        Write-Host "다음 작업: $($phase.Task.Id) ($($phase.Task.Desc)) — 상태: $($phase.Task.Status)"
    }
    switch ($phase.Name) {
        "interview" { Write-Host "단계: 아이디어 인터뷰/기획(planner) — PRD 미승인" }
        "architect" { Write-Host "단계: 설계(architect) — Architecture 미승인" }
        "implement" { Write-Host "단계: 구현 ($($phase.Task.Id)) — '진행' 입력 시 implementer→planner→reviewer→qa 자동 루프" }
        "done" { Write-Host "단계: 대기 중인 작업 없음" }
    }

    $userInput = Read-Host "`n메인 오케스트레이터"

    if ($userInput -eq "종료" -or $userInput -eq "exit") {
        Write-Host "### 결론: 오케스트레이터 종료"
        break
    }

    if ($userInput -eq "승인") {
        if ($phase.PrdStatus -ne "승인") {
            Set-DocApproved (Join-Path $root "docs\PRD.md")
            Write-Host "### 결론: docs/PRD.md 상태를 '승인'으로 전환함 (사람이 이 창에 직접 명령)"
        } elseif ($phase.ArchStatus -ne "승인") {
            Set-DocApproved (Join-Path $root "docs\Architecture.md")
            Write-Host "### 결론: docs/Architecture.md 상태를 '승인'으로 전환함 (사람이 이 창에 직접 명령)"
        } else {
            Write-Host "### 결론: 승인할 미승인 문서가 없음"
        }
        continue
    }

    if ($userInput -eq "진행") {
        switch ($phase.Name) {
            "interview" {
                Write-Host "### 실행: planner 대화형 인터뷰를 새 창(대화형 Claude Code)으로 연다"
                Start-InteractiveWindow -Command "Set-Location '$root'; claude"
            }
            "architect" {
                Write-Host "### 실행: architect를 새 창으로 헤드리스 실행"
                Start-StageWindow -StageName "architect" -PromptText "docs/PRD.md(승인됨)를 근거로 docs/Architecture.md를 작성해."
            }
            "implement" {
                $t = "docs/Tasks.md의 $($phase.Task.Id) ($($phase.Task.Desc))"
                Write-Host "### 실행: '$t'를 -All 자동 루프로 새 창에서 실행"
                Start-AllWindow -TargetText $t
            }
            "done" {
                Write-Host "### 결론: 진행할 자동 단계 없음 — docs/Tasks.md에 새 작업을 추가하거나 종료하세요"
            }
        }
        continue
    }

    if ($userInput.Trim() -eq "") { continue }

    switch ($phase.Name) {
        "interview" {
            # 2026-09-09 실측으로 제거: 헤드리스 1회 호출은 매번 독립된 세션이라 대화가 이어지지 않는다.
            # planner에게 아이디어 한 줄 + "PRD 써라"를 던져도 AGENTS.md 규칙("인터뷰는 사람이 직접 대화하는
            # 세션이 수행, 서브에이전트 위임 금지")대로 매번 역질문만 돌아오고 PRD는 절대 안 써진다 — 실제로
            # 확인됨. 이 단계에서 자유 텍스트로 인터뷰를 진행하려면 turn마다 세션을 이어가는(예: codex exec
            # resume) 기능이 필요한데 이건 오케스트레이터 창 자체를 상주 대화형으로 만드는 것과 같은 난이도라
            # 지금 범위 밖이다. 이 단계는 '진행'(대화형 창)만 지원한다.
            Write-Host "### 결론: 이 단계(아이디어 인터뷰)는 자유 텍스트 입력을 지원하지 않음"
            Write-Host "이유: 헤드리스 1회 호출은 대화가 이어지지 않아 매번 역질문만 돌아오고 PRD가 절대 안 써짐(실측 확인됨)."
            Write-Host "'진행'을 입력해 대화형 Claude Code 창을 열고 거기서 직접 여러 턴 대화하세요."
        }
        "architect" {
            Write-Host "### 실행: architect를 새 창으로 헤드리스 실행"
            Start-StageWindow -StageName "architect" -PromptText $userInput
        }
        "implement" {
            Write-Host "### 실행: implementer를 새 창으로 헤드리스 실행 (단발 지시 — 자동 재작업 루프 아님, 루프 원하면 '진행' 입력)"
            Start-StageWindow -StageName "implementer" -PromptText $userInput
        }
        "done" {
            Write-Host "### 결론: 지시를 보낼 대상 단계가 없음"
        }
    }
}
