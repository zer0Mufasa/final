# Test Fixo AI API
$body = @{
    message = "What are the different ticket stages in Fixology?"
    history = @()
} | ConvertTo-Json -Compress

Write-Host ""
Write-Host "=== Testing Fixo AI ==="
Write-Host ""
Write-Host "Question: What are the different ticket stages in Fixology?"
Write-Host ""
Write-Host "Sending request to API..."
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/fixo" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "=== SUCCESS ==="
    Write-Host ""
    Write-Host "Response:"
    Write-Host $response.response
    Write-Host ""
    Write-Host "=== Fixo is working! ==="
} catch {
    Write-Host "=== ERROR ==="
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
