# update-version.ps1
# Atualiza o ?v= de cache-busting em todos os HTMLs do rpg-aurores/
# Uso: .\update-version.ps1

$version = Get-Date -Format "yyyyMMddHHmm"
$root    = $PSScriptRoot
$dir     = Join-Path $root "rpg-aurores"

$htmlFiles = Get-ChildItem -Path $dir -Recurse -Filter "*.html"

foreach ($file in $htmlFiles) {
    $content  = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Adiciona/atualiza ?v= em src e href de arquivos locais (.js e .css).
    # Ignora URLs externas (http:// ou https://).
    $content = $content -replace `
        '((?:src|href)="(?!https?://)[^"]*\.(?:js|css))(?:\?v=[^"]*)?(")', `
        "`$1?v=$version`$2"

    if ($content -ne $original) {
        Set-Content $file.FullName $content -Encoding UTF8 -NoNewline
        Write-Host "  updated  $($file.FullName -replace [regex]::Escape($root), '.')"
    } else {
        Write-Host "  skipped  $($file.FullName -replace [regex]::Escape($root), '.')"
    }
}

Write-Host ""
Write-Host "Versao aplicada: $version"
