# Mantiene despierto Supabase desde tu portátil (opcional).
# Lee las credenciales de .env y llama a la función ping().
# Uso manual:  powershell -ExecutionPolicy Bypass -File tools/keepalive.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envPath = Join-Path $root '.env'
$logPath = Join-Path $root 'tools\keepalive.log'

function Write-Log($message) {
  $line = "{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $message
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

if (-not (Test-Path $envPath)) {
  Write-Log "ERROR: no existe .env"
  exit 1
}

$url = $null
$key = $null
foreach ($line in Get-Content $envPath) {
  if ($line -match '^\s*EXPO_PUBLIC_SUPABASE_URL\s*=\s*(.+?)\s*$') { $url = $Matches[1].Trim('"').Trim("'") }
  if ($line -match '^\s*EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+?)\s*$') { $key = $Matches[1].Trim('"').Trim("'") }
}

if (-not $url -or -not $key -or $url -like '*TU-PROYECTO*') {
  Write-Log "ERROR: configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env"
  exit 1
}

try {
  $response = Invoke-RestMethod -Method Post `
    -Uri "$($url.TrimEnd('/'))/rest/v1/rpc/ping" `
    -Headers @{ apikey = $key; Authorization = "Bearer $key"; 'Content-Type' = 'application/json' } `
    -Body '{}' `
    -TimeoutSec 30
  Write-Log "OK · ping = $response"
  exit 0
} catch {
  Write-Log "ERROR · $($_.Exception.Message)"
  exit 1
}
