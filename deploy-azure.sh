#!/usr/bin/env bash
# =============================================================
# deploy-azure.sh  —  Deploy AI Smart Travel Planner to Azure
# =============================================================
# Prerequisites:
#   - Azure CLI installed and logged in  (az login)
#   - Docker installed and running
#   - ANTHROPIC_API_KEY set in your environment
#
# Usage:
#   chmod +x deploy-azure.sh
#   GEMINI_API_KEY=... DB_HOST=... DB_USER=... DB_PASSWORD=... ./deploy-azure.sh
# =============================================================

set -euo pipefail

# -------- Configuration (edit these) --------
APP_NAME="travel-planner-ai"
RESOURCE_GROUP="rg-${APP_NAME}"
LOCATION="eastus"                       # Azure region
ACR_NAME="${APP_NAME//-/}acr"           # must be globally unique, letters+digits only
APP_SERVICE_PLAN="${APP_NAME}-plan"
WEBAPP_NAME="${APP_NAME}-app"           # must be globally unique
SKU="B1"                                # App Service SKU (B1=Basic, P1v3=Premium)
# --------------------------------------------

echo "🚀 Deploying ${APP_NAME} to Azure..."

# 1. Create Resource Group
echo "📦 Creating resource group ${RESOURCE_GROUP}..."
az group create --name "${RESOURCE_GROUP}" --location "${LOCATION}"

# 2. Create Azure Container Registry
echo "🐳 Creating container registry ${ACR_NAME}..."
az acr create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${ACR_NAME}" \
  --sku Basic \
  --admin-enabled true

ACR_LOGIN_SERVER=$(az acr show --name "${ACR_NAME}" --query loginServer -o tsv)
ACR_PASSWORD=$(az acr credential show --name "${ACR_NAME}" --query "passwords[0].value" -o tsv)

# 3. Build & push Docker image
echo "🔨 Building and pushing Docker image..."
az acr build \
  --registry "${ACR_NAME}" \
  --image "${APP_NAME}:latest" \
  .

# 4. Create App Service Plan (Linux)
echo "⚙️  Creating App Service Plan..."
az appservice plan create \
  --name "${APP_SERVICE_PLAN}" \
  --resource-group "${RESOURCE_GROUP}" \
  --is-linux \
  --sku "${SKU}"

# 5. Create Web App from container
echo "🌐 Creating Web App ${WEBAPP_NAME}..."
az webapp create \
  --resource-group "${RESOURCE_GROUP}" \
  --plan "${APP_SERVICE_PLAN}" \
  --name "${WEBAPP_NAME}" \
  --deployment-container-image-name "${ACR_LOGIN_SERVER}/${APP_NAME}:latest"

# 6. Configure container registry credentials
az webapp config container set \
  --name "${WEBAPP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --container-registry-url "https://${ACR_LOGIN_SERVER}" \
  --container-registry-user "${ACR_NAME}" \
  --container-registry-password "${ACR_PASSWORD}"

# 7. Set environment variables (App Settings)
echo "🔑 Setting environment variables..."
az webapp config appsettings set \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${WEBAPP_NAME}" \
  --settings \
    GEMINI_API_KEY="${GEMINI_API_KEY}" \
    JWT_SECRET="$(openssl rand -base64 32)" \
    DB_HOST="${DB_HOST}" \
    DB_PORT="${DB_PORT:-3306}" \
    DB_USER="${DB_USER}" \
    DB_PASSWORD="${DB_PASSWORD}" \
    DB_NAME="${DB_NAME:-travel_planner}" \
    WEBSITES_PORT="8000"

echo ""
echo "✅ Deployment complete!"
echo "🌍 App URL: https://${WEBAPP_NAME}.azurewebsites.net"
echo ""
echo "💡 Tip: For production, consider migrating from SQLite to Azure Database for PostgreSQL."
