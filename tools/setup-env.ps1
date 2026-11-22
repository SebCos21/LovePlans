# Configura el archivo .env con las credenciales de Supabase.
# Uso: powershell -ExecutionPolicy Bypass -File tools/setup-env.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envPath = Join-Path $root '.env'

Write-Host "LovePlans · configuración de Supabase" -ForegroundColor Magenta
Write-Host "Copia estos datos en Supabase → Project Settings → API."

$url = Read-Host "Project URL (https://xxxx.supabase.co)"
$key = Read-Host "anon public key"

$url = $url.Trim().TrimEnd('/')
$key = $key.Trim()

if ($url -notmatch '^https://.+\.supabase\.co$') {
  Write-Host "La URL no parece válida. Debe verse como https://xxxx.supabase.co" -ForegroundColor Red
  exit 1
}
if ($key.Length -lt 40) {
  Write-Host "La anon key parece incompleta." -ForegroundColor Red
  exit 1
}

$content = @"
EXPO_PUBLIC_SUPABASE_URL=$url
EXPO_PUBLIC_SUPABASE_ANON_KEY=$key
EXPO_PUBLIC_APP_URL=http://localhost:8081
"@

Set-Content -Path $envPath -Value $content -Encoding ascii
Write-Host "Listo: .env actualizado." -ForegroundColor Green

try {
  $response = Invoke-RestMethod -Method Post `
    -Uri "$url/rest/v1/rpc/ping" `
    -Headers @{ apikey = $key; Authorization = "Bearer $key"; 'Content-Type' = 'application/json' } `
    -Body '{}' `
    -TimeoutSec 30
  Write-Host "Conexión con Supabase OK (ping = $response)." -ForegroundColor Green
} catch {
  Write-Host "No pudimos llamar a ping(). ¿Ya ejecutaste el SQL de supabase/migrations/0001_init.sql?" -ForegroundColor Yellow
  Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "Siguiente: npm run web y prueba el login con tu correo." -ForegroundColor Cyan
