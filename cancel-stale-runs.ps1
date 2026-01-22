#!/usr/bin/env pwsh
<#
.SYNOPSIS
Cancel in-progress GitHub Actions runs for the drunk30.buzz repo
Usage: .\cancel-stale-runs.ps1 -Token <PAT>
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$repo = "coincrosser/drunk30.buzz"
$workflowId = "deploy.yml"

# Get all runs
$uri = "https://api.github.com/repos/$repo/actions/runs?status=in_progress&per_page=100"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
}

Write-Host "🔍 Fetching in-progress runs..."
$response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get

$inProgressRuns = $response.workflow_runs | Where-Object { $_.status -eq "in_progress" }

if ($inProgressRuns.Count -eq 0) {
    Write-Host "✅ No in-progress runs to cancel."
    exit 0
}

Write-Host "Found $($inProgressRuns.Count) in-progress run(s):"
foreach ($run in $inProgressRuns) {
    Write-Host "  - Run ID: $($run.id), Commit: $($run.head_sha.Substring(0,7)), Started: $($run.created_at)"
}

Write-Host "`n🔄 Cancelling runs..."
foreach ($run in $inProgressRuns) {
    $cancelUri = "https://api.github.com/repos/$repo/actions/runs/$($run.id)/cancel"
    try {
        Invoke-RestMethod -Uri $cancelUri -Headers $headers -Method Post | Out-Null
        Write-Host "✅ Cancelled run $($run.id)"
    } catch {
        Write-Host "❌ Failed to cancel run $($run.id): $_"
    }
}

Write-Host "`n✅ Done. Latest commit will now deploy."
