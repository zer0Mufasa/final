$body = @{
    message = "What are ticket stages?"
    history = @()
} | ConvertTo-Json -Compress

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/fixo" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $json = $response.Content | ConvertFrom-Json
    Write-Host "SUCCESS:"
    Write-Host $json.response
} catch {
    Write-Host "ERROR Status: $($_.Exception.Response.StatusCode.value__)"
    if ($_.ErrorDetails) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error: $($errorJson.error)"
        if ($errorJson.details) {
            Write-Host "Details: $($errorJson.details)"
        }
    } else {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}
