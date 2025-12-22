Write-Host "Stopping Next.js server..." -ForegroundColor Yellow

# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Waiting for cleanup..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Clean Next.js cache
$nextDir = "F:\Projects\travelling_agency\.next"
if (Test-Path $nextDir) {
    Remove-Item $nextDir -Recurse -Force
    Write-Host "Cleared .next cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Next.js server..." -ForegroundColor Yellow

# Start Next.js in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'F:\Projects\travelling_agency'; npm run dev"

Write-Host "Next.js server started!" -ForegroundColor Green
Write-Host "URL: http://localhost:3000" -ForegroundColor Cyan
