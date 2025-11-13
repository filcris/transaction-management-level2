Param(
  [string]$Root = "C:\Users\Utilizador\Documents\transactions-manager-level2",
  [int]$ApiPort = 4000,
  [int]$WebPort = 5173
)

$serverPath = Join-Path $Root "server"
$webPath    = Join-Path $Root "web"

if (-Not (Test-Path $serverPath)) { Write-Error "Server path not found: $serverPath"; exit 1 }
if (-Not (Test-Path $webPath))    { Write-Error "Web path not found: $webPath"; exit 1 }

# Launch API window (keeps window open)
$apiCmd = @"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;
`$env:PORT = "$ApiPort";
cd "$serverPath";
if (-Not (Test-Path .\node_modules)) { npm i };
npm run dev;
Read-Host 'API stopped. Press Enter to close...'
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd -WindowStyle Normal

# Launch Web window (keeps window open)
$webCmd = @"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;
`$env:VITE_API_URL = "http://localhost:$ApiPort";
cd "$webPath";
if (-Not (Test-Path .\node_modules)) { npm i };
npm run dev -- --port $WebPort;
Read-Host 'Web stopped. Press Enter to close...'
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCmd -WindowStyle Normal

Write-Host "Launched two windows: API (port $ApiPort) and WEB (port $WebPort)."
