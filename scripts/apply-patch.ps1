param(
  [string]$File = "change.patch",
  [switch]$Check
)

Write-Host "Repo root: $((Get-Location).Path)" -ForegroundColor Cyan
Write-Host "Patch file: $File" -ForegroundColor Cyan

if (-not (Test-Path $File)) {
  Write-Host "Patch file not found. Save it in the project root as '$File'." -ForegroundColor Red
  exit 1
}

if ($Check) {
  Write-Host "`nRunning dry-run check..." -ForegroundColor Yellow
  git apply --check $File
  exit $LASTEXITCODE
}

Write-Host "`nApplying patch..." -ForegroundColor Yellow
git apply --index $File
if ($LASTEXITCODE -eq 0) {
  Write-Host "`nSuccess! Review changes in GitHub Desktop, then commit & push." -ForegroundColor Green
  exit 0
}

Write-Host "`nPatch failed. Trying with --reject to show conflicts..." -ForegroundColor Yellow
git apply --reject $File
if ($LASTEXITCODE -ne 0) {
  Write-Host "Apply failed. To abort and reset:" -ForegroundColor Red
  Write-Host "  git reset --hard HEAD" -ForegroundColor Red
}

