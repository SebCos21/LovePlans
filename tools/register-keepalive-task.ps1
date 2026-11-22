# Registra una tarea de Windows que ejecuta tools/keepalive.ps1 cada 3 días.
# Ejecuta este script una vez:  powershell -ExecutionPolicy Bypass -File tools/register-keepalive-task.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$script = Join-Path $root 'tools\keepalive.ps1'
$taskName = 'LovePlans Supabase keepalive'

if (-not (Test-Path $script)) {
  throw "No se encontró $script"
}

$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""

$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 3 -At 9:00am

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Hace un ping a Supabase para que el proyecto gratuito no se pause por inactividad.' `
  -Force | Out-Null

Write-Host "Tarea registrada: $taskName"
Write-Host "Se ejecutará cada 3 días a las 9:00 (o cuando el portátil despierte)."
Write-Host "Puedes probarla ahora con:  Start-ScheduledTask -TaskName `"$taskName`""
