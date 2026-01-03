# Detailed Fixo AI API Test
Write-Host "=== Fixo AI Detailed Test ==="
Write-Host ""

# Test 1: Check if server is running
Write-Host "1. Checking if server is running on port 3001..."
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "   Server is running"
    } else {
        Write-Host "   Server is not responding"
        exit
    }
} catch {
    Write-Host "   Could not check server status"
}

Write-Host ""

# Test 2: Test API endpoint
Write-Host "2. Testing API endpoint..."
$body = @{
    message = "Hello, what can you help me with?"
    history = @()
} | ConvertTo-Json -Compress

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/fixo" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "   ✓ API responded with status: $($response.StatusCode)"
    
    $jsonResponse = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "=== RESPONSE ==="
    Write-Host $jsonResponse.response
    Write-Host ""
    Write-Host "=== SUCCESS! Fixo is working! ==="
    
} catch {
    Write-Host "   ✗ API Error"
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)"
    
    if ($_.ErrorDetails) {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error Message: $($errorBody.error)"
        if ($errorBody.details) {
            Write-Host "   Details: $($errorBody.details)"
        }
    } else {
        Write-Host "   Exception: $($_.Exception.Message)"
    }
}
