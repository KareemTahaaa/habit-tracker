#requires -Version 7
<#
.SYNOPSIS
  Deploy Habit Tracker Backend to Azure Container Apps

.DESCRIPTION
  This script deploys the backend only to Azure Container Apps using Bicep.

.PARAMETER ResourceGroupName
  The name of the Azure resource group.

.PARAMETER Location
  The Azure region (e.g., eastus, westeurope).

.EXAMPLE
  .\deploy.ps1 -ResourceGroupName "rg-habittracker" -Location "eastus"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $true)]
    [string]$Location,

    [string]$ContainerAppName = 'habit-tracker-backend',
    [string]$ContainerAppEnvName = 'habit-tracker-env'
)

$ErrorActionPreference = 'Stop'

Write-Host "=========================================="
Write-Host "  Habit Tracker Backend - Azure Deploy"
Write-Host "=========================================="
Write-Host ""

# Check Azure CLI
$azVersion = az version --query "azure-cli" -o tsv 2>$null
if (-not $azVersion) {
    Write-Error "Azure CLI is not installed. Please install it from: https://aka.ms/installazurecliwindows"
    exit 1
}
Write-Host "✓ Azure CLI detected: v$azVersion"

# Check login
$account = az account show --query "name" -o tsv 2>$null
if (-not $account) {
    Write-Host "Please login to Azure..."
    az login
} else {
    Write-Host "✓ Logged in as: $account"
}

# Create resource group
Write-Host ""
Write-Host "Creating resource group '$ResourceGroupName' in '$Location'..."
az group create --name $ResourceGroupName --location $Location --output none
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Resource group ready"
} else {
    Write-Error "Failed to create resource group"
    exit 1
}

# Get directory
$infraDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $infraDir
$backendDir = Join-Path $rootDir "Backend"

# Check for required env variables file
$envFile = Join-Path $backendDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Error ".env file not found at $envFile. Please create it first."
    exit 1
}

# Source .env file content manually (PowerShell compatible)
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Get ACR name from deployment or create unique name
$acrName = "habittracker$(-join ([guid]::NewGuid().ToString().Replace('-','').ToLower())[-6..-1])"

# Deploy infrastructure with Bicep
Write-Host ""
Write-Host "Deploying Azure infrastructure (Container Apps, ACR, Log Analytics)..."
Write-Host "This may take 3-5 minutes..."
Write-Host ""

$deployment = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "$infraDir\main.bicep" `
    --parameters containerAppName=$ContainerAppName `
    --parameters containerAppEnvName=$ContainerAppEnvName `
    --parameters mongoUri="$($envVars['MONGO_URI'])" `
    --parameters jwtSecret="$($envVars['JWT_SECRET'])" `
    --parameters jwtExpire="$($envVars['JWT_EXPIRE'])" `
    --parameters sendGridApiKey="$($envVars['SENDGRID_API_KEY'])" `
    --parameters fromEmail="$($envVars['FROM_EMAIL'])" `
    --parameters vapidPublicKey="$($envVars['VAPID_PUBLIC_KEY'])" `
    --parameters vapidPrivateKey="$($envVars['VAPID_PRIVATE_KEY'])" `
    --query "properties.outputs" `
    -o json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0 -or -not $deployment) {
    Write-Error "Infrastructure deployment failed. Check the error messages above."
    exit 1
}

$containerAppUrl = $deployment.containerAppUrl.value
$registryLoginServer = $deployment.registryLoginServer.value
$registryName = $deployment.registryName.value

Write-Host ""
Write-Host "✓ Infrastructure deployed successfully!"
Write-Host "  Container App URL: $containerAppUrl"
Write-Host "  Registry: $registryLoginServer"
Write-Host ""

# Build and push Docker image
Write-Host "Building and pushing Docker image to ACR..."
Write-Host "Navigate to backend directory..."

az acr build `
    --registry $registryName `
    --image $ContainerAppName:latest `
    --file "$backendDir\Dockerfile" `
    --build-arg NODE_ENV=production `
    $backendDir

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}

Write-Host ""
Write-Host "✓ Docker image built and pushed!"
Write-Host ""

# Update container app with the new image
Write-Host "Updating Container App with new image..."
az containerapp update `
    --name $ContainerAppName `
    --resource-group $ResourceGroupName `
    --image "$registryLoginServer/$ContainerAppName:latest" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Container App updated!"
} else {
    Write-Error "Failed to update Container App"
    exit 1
}

# Verify deployment
Write-Host ""
Write-Host "Verifying deployment..."
Start-Sleep -Seconds 10

$healthUrl = "$containerAppUrl/api/health"
try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 30
    Write-Host "✓ Health check passed: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Warning "Health check may still be warming up. URL: $healthUrl"
    Write-Warning "Wait a minute and try accessing: $containerAppUrl/api/health"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "  Deployment Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Backend API URL:"
Write-Host "  $containerAppUrl"
Write-Host ""
Write-Host "API Endpoints:"
Write-Host "  Health:    GET  $containerAppUrl/api/health"
Write-Host "  Auth:      POST $containerAppUrl/api/auth/register"
Write-Host "  Auth:      POST $containerAppUrl/api/auth/login"
Write-Host "  Habits:    GET  $containerAppUrl/api/habits"
Write-Host "  Dashboard: GET  $containerAppUrl/api/dashboard"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "  1. Update your MongoDB Atlas IP whitelist to allow Azure IPs"
Write-Host "  2. Update your frontend .env with: VITE_API_URL=$containerAppUrl"
Write-Host "  3. Test the API using the endpoints above"
Write-Host ""

