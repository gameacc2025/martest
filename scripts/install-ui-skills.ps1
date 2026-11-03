$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
    Write-Host 'Installing UI UX Pro Max for Codex...'
    npm install --global ui-ux-pro-max-cli
    if ($LASTEXITCODE -ne 0) { throw 'npm install --global ui-ux-pro-max-cli failed.' }

    uipro init --ai codex
    if ($LASTEXITCODE -ne 0) { throw 'uipro init --ai codex failed.' }

    Write-Host 'Installing Taste Skill (design-taste-frontend) for Codex...'
    npx --yes skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend -a codex
    if ($LASTEXITCODE -ne 0) { throw 'Taste Skill installation failed.' }

    Write-Host 'Installing Impeccable...'
    npx --yes impeccable install
    if ($LASTEXITCODE -ne 0) { throw 'Impeccable installation failed.' }

    Write-Host 'Installing Vercel Web Design Guidelines for Codex...'
    npx --yes skills add vercel-labs/agent-skills --skill web-design-guidelines -a codex
    if ($LASTEXITCODE -ne 0) { throw 'Vercel Web Design Guidelines installation failed.' }

    Write-Host ''
    Write-Host 'Installation commands completed. Review the generated .agents/skills and Impeccable files, then restart Codex so it reloads the skills.'
    Write-Host 'No tests, builds, or browser checks were run by this installer.'
}
finally {
    Pop-Location
}
