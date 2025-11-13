Param(
  [string]$ApiUrl = "http://localhost:4000",
  [string]$ProjectPath = "C:\Users\Utilizador\Documents\transactions-manager-level2\web"
)

Write-Host ">> Using API URL: $ApiUrl"
Write-Host ">> Project path: $ProjectPath"

if (-Not (Test-Path $ProjectPath)) {
  Write-Error "Project path not found: $ProjectPath"
  exit 1
}

Set-Location $ProjectPath

# Ensure dependencies
if (-Not (Test-Path ".\node_modules")) {
  Write-Host ">> Installing dependencies (npm i)..."
  npm i
}

# Set env var only for this process
$env:VITE_API_URL = $ApiUrl
Write-Host ">> Starting Vite dev server (npm run dev)..."
npm run dev
