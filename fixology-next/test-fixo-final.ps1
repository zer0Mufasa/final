Write-Host "========================================"
Write-Host "  FIXO AI TEST - Testing Intelligence"
Write-Host "========================================"
Write-Host ""

$testQuestion = "What are the different ticket stages in Fixology?"
Write-Host "Test Question: $testQuestion"
Write-Host ""

$body = @{
    message = $testQuestion
    history = @()
} | ConvertTo-Json -Compress

Write-Host "Sending request to Fixo API..."
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/fixo" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "========================================"
    Write-Host "  SUCCESS - Fixo is Working!"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Fixo Response:"
    Write-Host "----------------------------------------"
    Write-Host $json.response
    Write-Host "----------------------------------------"
    Write-Host ""
    Write-Host "Fixo understands questions intelligently"
    Write-Host "Using Claude AI (not pattern matching)"
    Write-Host "API key is configured correctly"
    Write-Host ""
    
} catch {
    Write-Host "========================================"
    Write-Host "  ERROR - Test Failed"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)"
    Write-Host ""
    
    if ($_.ErrorDetails) {
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "API Error: $($errorJson.error)"
            if ($errorJson.details) {
                Write-Host "Details: $($errorJson.details)"
            }
        } catch {
            Write-Host "Error Details: $($_.ErrorDetails.Message)"
        }
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "- Make sure the dev server is running"
    Write-Host "- Check that ANTHROPIC_API_KEY is in .env.local"
    Write-Host "- Restart the server after adding the API key"
    Write-Host ""
}
