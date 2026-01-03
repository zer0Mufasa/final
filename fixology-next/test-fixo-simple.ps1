Write-Host "Testing Fixo AI..."
Write-Host ""

$body = '{"message":"Hello, what can you help me with?","history":[]}'

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/fixo" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "=== SUCCESS ==="
    Write-Host ""
    Write-Host "Response:"
    Write-Host $json.response
    Write-Host ""
    Write-Host "Fixo is working!"
    
} catch {
    Write-Host "ERROR:"
    Write-Host $_.Exception.Message
    
    if ($_.ErrorDetails) {
        try {
            $errJson = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Error message:" $errJson.error
            if ($errJson.details) {
                Write-Host "Details:" $errJson.details
            }
        } catch {
            Write-Host "Error details:" $_.ErrorDetails.Message
        }
    }
}
