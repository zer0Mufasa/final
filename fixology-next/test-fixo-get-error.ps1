$body = @{
    message = "What are ticket stages?"
    history = @()
} | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/fixo" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "SUCCESS:"
    Write-Host $response.response
} catch {
    Write-Host "ERROR:"
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode"
    
    # Try to read the error response
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        $errorObj = $responseBody | ConvertFrom-Json
        Write-Host "Error Message: $($errorObj.error)"
        if ($errorObj.details) {
            Write-Host "Details: $($errorObj.details)"
        }
    } catch {
        Write-Host "Could not parse error response: $($_.Exception.Message)"
    }
}
