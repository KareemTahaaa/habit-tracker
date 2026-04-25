#!/usr/bin/env bash
# =============================================================================
# Deploy Habit Tracker Backend to Azure Container Apps
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RESOURCE_GROUP=""
LOCATION=""
CONTAINER_APP_NAME="${CONTAINER_APP_NAME:-habit-tracker-backend}"
CONTAINER_APP_ENV_NAME="${CONTAINER_APP_ENV_NAME:-habit-tracker-env}"

# Parse arguments
usage() {
    cat <<EOF
Usage: $0 -g <resource-group> -l <location> [options]

Options:
    -g, --resource-group    Azure resource group name (required)
    -l, --location          Azure region, e.g., eastus, westeurope (required)
    -n, --name              Container app name (default: habit-tracker-backend)
    -e, --env-name          Container app environment name (default: habit-tracker-env)
    -h, --help              Show this help message

Example:
    $0 -g rg-habittracker -l eastus
EOF
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -n|--name)
            CONTAINER_APP_NAME="$2"
            shift 2
            ;;
        -e|--env-name)
            CONTAINER_APP_ENV_NAME="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Validate arguments
if [[ -z "$RESOURCE_GROUP" || -z "$LOCATION" ]]; then
    echo -e "${RED}Error: Resource group and location are required.${NC}"
    usage
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/Backend"

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  Habit Tracker Backend - Azure Deploy${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it:${NC}"
    echo "  https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

AZ_VERSION=$(az version --query "azure-cli" -o tsv 2>/dev/null || echo "unknown")
echo -e "${GREEN}✓ Azure CLI detected: v$AZ_VERSION${NC}"

# Check login
ACCOUNT=$(az account show --query "name" -o tsv 2>/dev/null || true)
if [[ -z "$ACCOUNT" ]]; then
    echo -e "${YELLOW}Please login to Azure...${NC}"
    az login
else
    echo -e "${GREEN}✓ Logged in as: $ACCOUNT${NC}"
fi

# Check .env file
ENV_FILE="$BACKEND_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
    echo "Please create it with your configuration variables."
    exit 1
fi

# Read .env file
declare -A ENV_VARS
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    ENV_VARS["$key"]="$value"
done < "$ENV_FILE"

# Create resource group
echo ""
echo -e "${BLUE}Creating resource group '$RESOURCE_GROUP' in '$LOCATION'...${NC}"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
echo -e "${GREEN}✓ Resource group ready${NC}"

# Deploy infrastructure with Bicep
echo ""
echo -e "${BLUE}Deploying Azure infrastructure (Container Apps, ACR, Log Analytics)...${NC}"
echo -e "${YELLOW}This may take 3-5 minutes...${NC}"
echo ""

DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$SCRIPT_DIR/main.bicep" \
    --parameters "containerAppName=$CONTAINER_APP_NAME" \
    --parameters "containerAppEnvName=$CONTAINER_APP_ENV_NAME" \
    --parameters "mongoUri=${ENV_VARS[MONGO_URI]:-}" \
    --parameters "jwtSecret=${ENV_VARS[JWT_SECRET]:-}" \
    --parameters "jwtExpire=${ENV_VARS[JWT_EXPIRE]:-7d}" \
    --parameters "sendGridApiKey=${ENV_VARS[SENDGRID_API_KEY]:-}" \
    --parameters "fromEmail=${ENV_VARS[FROM_EMAIL]:-noreply@habittracker.com}" \
    --parameters "vapidPublicKey=${ENV_VARS[VAPID_PUBLIC_KEY]:-}" \
    --parameters "vapidPrivateKey=${ENV_VARS[VAPID_PRIVATE_KEY]:-}" \
    --query "properties.outputs" \
    -o json)

if [[ $? -ne 0 || -z "$DEPLOYMENT_OUTPUT" ]]; then
    echo -e "${RED}Infrastructure deployment failed.${NC}"
    exit 1
fi

# Parse outputs
CONTAINER_APP_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.containerAppUrl.value')
REGISTRY_LOGIN_SERVER=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.registryLoginServer.value')
REGISTRY_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.registryName.value')

echo ""
echo -e "${GREEN}✓ Infrastructure deployed successfully!${NC}"
echo "  Container App URL: $CONTAINER_APP_URL"
echo "  Registry: $REGISTRY_LOGIN_SERVER"
echo ""

# Build and push Docker image
echo -e "${BLUE}Building and pushing Docker image to ACR...${NC}"
az acr build \
    --registry "$REGISTRY_NAME" \
    --image "$CONTAINER_APP_NAME:latest" \
    --file "$BACKEND_DIR/Dockerfile" \
    --build-arg NODE_ENV=production \
    "$BACKEND_DIR"

if [[ $? -ne 0 ]]; then
    echo -e "${RED}Docker build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Docker image built and pushed!${NC}"
echo ""

# Update container app with the new image
echo -e "${BLUE}Updating Container App with new image...${NC}"
az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$REGISTRY_LOGIN_SERVER/$CONTAINER_APP_NAME:latest" \
    --output none

echo -e "${GREEN}✓ Container App updated!${NC}"

# Verify deployment
echo ""
echo -e "${BLUE}Verifying deployment...${NC}"
sleep 10

HEALTH_URL="$CONTAINER_APP_URL/api/health"
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
    if [[ "$HTTP_STATUS" == "200" ]]; then
        RESPONSE=$(curl -s "$HEALTH_URL")
        echo -e "${GREEN}✓ Health check passed: $RESPONSE${NC}"
    else
        echo -e "${YELLOW}⚠ Health check returned status $HTTP_STATUS. The app may still be starting.${NC}"
    fi
else
    echo -e "${YELLOW}curl not available. Please manually verify: $HEALTH_URL${NC}"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${BLUE}Backend API URL:${NC}"
echo "  $CONTAINER_APP_URL"
echo ""
echo -e "${BLUE}API Endpoints:${NC}"
echo "  Health:    GET  $CONTAINER_APP_URL/api/health"
echo "  Auth:      POST $CONTAINER_APP_URL/api/auth/register"
echo "  Auth:      POST $CONTAINER_APP_URL/api/auth/login"
echo "  Habits:    GET  $CONTAINER_APP_URL/api/habits"
echo "  Dashboard: GET  $CONTAINER_APP_URL/api/dashboard"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Update MongoDB Atlas IP whitelist to allow Azure IPs"
echo "  2. Update frontend .env with: VITE_API_URL=$CONTAINER_APP_URL"
echo "  3. Test the API using the endpoints above"
echo ""

