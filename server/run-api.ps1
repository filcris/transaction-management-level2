Param(
  [int]$Port = 4000,
  [switch]$KillExisting = $true,
  [string]$ProjectPath = "C:\Users\Utilizador\Documents\transactions-manager-level2\server"
)

Write-Host ">> API project path: $ProjectPath"
Write-Host ">> Desired PORT: $Port"
Write-Host ">> Kill existing on port: $KillExisting"

if (-Not (Test-Path $ProjectPath)) {
  Write-Error "Project path not found: $ProjectPath"
  exit 1
}

Set-Location $ProjectPath

# Optionally free the port
if ($KillExisting) {
  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($conns) {
    foreach ($c in $conns) {
      try {
        Write-Host ">> Port $Port is in use by PID $($c.OwningProcess). Killing..."
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
      } catch {
        Write-Warning "Could not kill PID $($c.OwningProcess). Try manually with: taskkill /PID $($c.OwningProcess) /F"
      }
    }
  }
}

# Ensure dependencies
if (-Not (Test-Path ".\node_modules")) {
  Write-Host ">> Installing dependencies (npm i)..."
  npm i
}

# Set the PORT env var just for this process
$env:PORT = "$Port"

Write-Host ">> Starting API: npm run dev"
npm run dev
