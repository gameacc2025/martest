$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
    # UI UX Pro Max has a native all-assistants installer.
    Write-Host 'Installing UI UX Pro Max for all supported assistants...'
    npm install --global ui-ux-pro-max-cli
    if ($LASTEXITCODE -ne 0) { throw 'npm install --global ui-ux-pro-max-cli failed.' }

    uipro init --ai all
    if ($LASTEXITCODE -ne 0) { throw 'uipro init --ai all failed.' }

    # The Skills CLI targets every supported agent directory with --agent '*'.
    # Project scope keeps the skills shared with the repository/team.
    Write-Host 'Installing Taste Skill for all supported agents...'
    npx --yes skills add Leonxlnx/taste-skill --skill design-taste-frontend --agent '*' --yes
    if ($LASTEXITCODE -ne 0) { throw 'Taste Skill installation failed.' }

    Write-Host 'Installing Hallmark for all supported agents...'
    npx --yes skills add nutlope/hallmark --agent '*' --yes
    if ($LASTEXITCODE -ne 0) { throw 'Hallmark skill installation failed.' }

    Write-Host 'Installing Impeccable for all supported agents...'
    npx --yes skills add pbakaus/impeccable --agent '*' --yes
    if ($LASTEXITCODE -ne 0) { throw 'Impeccable skill installation failed.' }

    Write-Host 'Installing Vercel Web Design Guidelines for all supported agents...'
    npx --yes skills add vercel-labs/agent-skills --skill web-design-guidelines --agent '*' --yes
    if ($LASTEXITCODE -ne 0) { throw 'Vercel Web Design Guidelines installation failed.' }

    Write-Host ''
    Write-Host 'All installation commands completed. Check the installed agent skill directories and restart your coding agents.'
    Write-Host 'For Impeccable-specific native integrations or commands, optionally run: npx impeccable install'
    Write-Host 'No tests, builds, or browser checks were run by this installer.'
}
finally {
    Pop-Location
}
