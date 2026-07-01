param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^tunnel_')]
  [string]$TunnelId
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$client = Join-Path $root '.tools\bin\tunnel-client.exe'
$profileDir = Join-Path $root '.chatgpt-tunnel'
$server = Join-Path $root 'src\server.mjs'

if (-not (Test-Path -LiteralPath $client)) {
  throw 'Official tunnel-client is missing from .tools\bin. Download and verify the Windows AMD64 release from openai/tunnel-client.'
}
if (-not $env:CONTROL_PLANE_API_KEY) {
  throw 'Set CONTROL_PLANE_API_KEY to the OpenAI tunnel runtime API key for this terminal session.'
}

New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
$mcpCommand = "node `"$server`""

& $client init `
  --sample sample_mcp_stdio_local `
  --profile med-research `
  --profile-dir $profileDir `
  --tunnel-id $TunnelId `
  --mcp-command $mcpCommand `
  --force
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $client doctor --profile med-research --profile-dir $profileDir --explain
exit $LASTEXITCODE
