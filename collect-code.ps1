# collect-code.ps1
$OutputFile = "singlefile-code.txt"
$ProjectRoot = Get-Location

Write-Host "Sobiraem vse TypeScript fayly proekta..." -ForegroundColor Green

# Udalyayem staryy fayl esli sushchestvuet
if (Test-Path $OutputFile) { 
    Remove-Item $OutputFile 
    Write-Host "Udalem staryy fayl $OutputFile" -ForegroundColor Yellow
}

# Sozdaem zagolovok
$header = @"
================================================================================
  PUMP SCOUT BOT - Project full code collection
  DATA: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
================================================================================

"@
$header | Out-File $OutputFile -Encoding UTF8

# Poluchaem vse .ts fayly rekursivno
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts"

$fileCount = 0
foreach ($file in $files) {
    $fileCount++
    $relativePath = $file.FullName.Replace($ProjectRoot, "").TrimStart('\')
    
    Write-Host "Obrabatyvaetsya: $relativePath" -ForegroundColor Cyan
    
    # Dobavlyaem razdelitel
    $separator = @"

========================================================================
  FILE: $relativePath
========================================================================

"@
    $separator | Out-File $OutputFile -Append -Encoding UTF8
    
    # Dobavlyaem soderzhimoe fayla
    Get-Content $file.FullName -Encoding UTF8 | Out-File $OutputFile -Append -Encoding UTF8
    
    # Dobavlyaem pustuyu stroku posle fayla
    "" | Out-File $OutputFile -Append -Encoding UTF8
}

# Dobavlyaem footer
$footer = @"

================================================================================
  KONETS FAYLOV
  Vsego obrabotano failov: $fileCount
================================================================================
"@
$footer | Out-File $OutputFile -Append -Encoding UTF8

Write-Host "Gotovo!" -ForegroundColor Green
Write-Host "Fayl sozdan: $OutputFile" -ForegroundColor Yellow
Write-Host "Obrabotano failov: $fileCount" -ForegroundColor Cyan

# Otkryvaem fayl
Write-Host "Otkryt fayl? (y/n)" -ForegroundColor White
$response = Read-Host
if ($response -eq 'y') {
    Invoke-Item $OutputFile
}



#Выполните команду:
#.\collect-code.ps1
#Если появится ошибка о политике выполнения, выполните:
#Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#.\collect-code.ps1