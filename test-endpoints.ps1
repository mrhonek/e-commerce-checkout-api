# PowerShell script to test POST endpoints

$API_URL = "https://e-commerce-checkout-api-production.up.railway.app"

# Function to test Calculate Shipping endpoint
function Test-CalculateShipping {
    $uri = "$API_URL/api/shipping/calculate"
    $body = @{
        address = @{
            street = "123 Main St"
            city = "Anytown"
            state = "CA"
            zipCode = "90210"
            country = "US"
        }
        items = @(
            @{id = "product-1"; quantity = 2; weight = 0.5}
            @{id = "product-2"; quantity = 1; weight = 1.0}
        )
        shippingOptionId = "express"
    } | ConvertTo-Json
    
    Write-Host "Testing Calculate Shipping endpoint..." -ForegroundColor Cyan
    Write-Host "POST $uri" -ForegroundColor Yellow
    Write-Host "Request Body:" -ForegroundColor Yellow
    Write-Host $body
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json"
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host $_.Exception.Response.StatusCode
    }
}

# Function to test Stripe Webhook endpoint
function Test-StripeWebhook {
    $uri = "$API_URL/api/webhooks/stripe"
    $body = @{
        type = "payment_intent.succeeded"
    } | ConvertTo-Json
    
    Write-Host "`nTesting Stripe Webhook endpoint..." -ForegroundColor Cyan
    Write-Host "POST $uri" -ForegroundColor Yellow
    Write-Host "Request Body:" -ForegroundColor Yellow
    Write-Host $body
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json"
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host $_.Exception.Response.StatusCode
    }
}

# Function to test Create Order endpoint
function Test-CreateOrder {
    $uri = "$API_URL/api/orders"
    $body = @{
        items = @(
            @{
                id = "product-1"
                name = "Modern Desk Lamp"
                price = 49.99
                quantity = 1
                image = "https://via.placeholder.com/50"
            },
            @{
                id = "product-2"
                name = "Wireless Earbuds"
                price = 129.99
                quantity = 2
                image = "https://via.placeholder.com/50"
            }
        )
        shippingMethod = @{
            id = "express"
            name = "Express Shipping"
            price = 12.99
            estimatedDays = "1-2 business days"
        }
        shippingAddress = @{
            firstName = "John"
            lastName = "Doe"
            street = "123 Main St"
            city = "Anytown"
            state = "CA"
            zipCode = "90210"
            country = "US"
        }
        email = "your-email@example.com" # Replace with your email
    } | ConvertTo-Json -Depth 5
    
    Write-Host "`nTesting Create Order endpoint..." -ForegroundColor Cyan
    Write-Host "POST $uri" -ForegroundColor Yellow
    Write-Host "Request Body: (truncated for readability)" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json"
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 3
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host $_.Exception.Response.StatusCode
    }
}

# Main script
Write-Host "E-Commerce API Testing Script" -ForegroundColor Magenta
Write-Host "============================" -ForegroundColor Magenta

# Execute tests based on arguments
param(
    [Parameter(Position=0)]
    [string]$TestName = "all"
)

switch ($TestName.ToLower()) {
    "shipping" { Test-CalculateShipping; break }
    "webhook" { Test-StripeWebhook; break }
    "order" { Test-CreateOrder; break }
    "all" { 
        Test-CalculateShipping
        Test-StripeWebhook
        Test-CreateOrder
        break
    }
    default { Write-Host "Unknown test: $TestName. Valid options: shipping, webhook, order, all" -ForegroundColor Red }
} 