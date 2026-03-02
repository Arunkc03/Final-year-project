$headers = @{
    "Authorization" = "Bearer 17|ehCQRROBsvbfqgS7tSHAGHCMGWimq6uQLOjx5WQq067e9ea5"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

$body = ConvertTo-Json @{
    hospital_id = 1
    name = "TestDept"
    status = "active"
}

Write-Host "Sending request..." -ForegroundColor Green
Write-Host "URL: http://localhost:8000/api/departments" -ForegroundColor Cyan
Write-Host "Body: $body" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/departments" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -UseBasicParsing `
        -ErrorAction Stop

    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        Write-Host "Response Content:" -ForegroundColor Yellow
        Write-Host $content
    }
}
