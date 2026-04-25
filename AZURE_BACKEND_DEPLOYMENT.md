# 🚀 Deploy Habit Tracker Backend to Azure

This guide covers deploying **only the backend** to Azure using **Azure Container Apps** and **Azure Container Registry (ACR)**.

## 📋 Prerequisites

Before you begin, make sure you have:

- [ ] **Azure CLI** installed → [Install Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [ ] **An Azure subscription** (free tier works)
- [ ] **MongoDB Atlas cluster** with connection string → [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [ ] **Backend `.env` file** configured with all required variables

---

## ⚙️ Step 1: Configure Backend Environment Variables

Edit `Backend/.env` and ensure all values are set:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/habit-tracker
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
CLIENT_URL=http://localhost:5173

# Optional: For push notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

> ⚠️ **Important**: Make sure `MONGO_URI` has your actual Atlas credentials.

---

## ☁️ Step 2: Update MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Network Access
2. Add `0.0.0.0/0` (Allow from anywhere) **or** Azure IP ranges
3. This allows Azure Container Apps to connect to your database

---

## 🚀 Step 3: Deploy to Azure

### Option A: Using PowerShell (Windows)

```powershell
# Navigate to infrastructure folder
cd habit-tracker/habit-tracker/infrastructure

# Run the deployment script
.\deploy.ps1 -ResourceGroupName "rg-habittracker" -Location "eastus"
```

### Option B: Using Bash (Linux/macOS/WSL)

```bash
# Navigate to infrastructure folder
cd habit-tracker/habit-tracker/infrastructure

# Make script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh -g rg-habittracker -l eastus
```

### Option C: Manual Azure CLI Commands

If you prefer step-by-step control:

```bash
# 1. Login to Azure
az login

# 2. Set subscription (optional)
az account set --subscription "Your Subscription Name"

# 3. Create resource group
az group create --name rg-habittracker --location eastus

# 4. Deploy infrastructure (Bicep)
az deployment group create \
  --resource-group rg-habittracker \
  --template-file infrastructure/main.bicep \
  --parameters containerAppName=habit-tracker-backend \
  --parameters mongoUri="your_mongodb_uri" \
  --parameters jwtSecret="your_jwt_secret"

# 5. Get ACR credentials and build image
az acr build --registry habittracker12345 \
  --image habit-tracker-backend:latest \
  --file Backend/Dockerfile \
  Backend/

# 6. Update container app
az containerapp update \
  --name habit-tracker-backend \
  --resource-group rg-habittracker \
  --image habittracker12345.azurecr.io/habit-tracker-backend:latest
```

---

## ✅ Step 4: Verify Deployment

After deployment, your backend will be available at:

```
https://habit-tracker-backend.[random].eastus.azurecontainerapps.io
```

### Test the API

```bash
# Health check
curl https://YOUR_APP_URL/api/health

# Expected response:
{
  "status": "OK",
  "service": "User Management Service",
  "timestamp": "..."
}
```

### API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/user/profile` | Get profile (auth required) |
| PUT | `/api/user/profile` | Update profile (auth required) |
| GET | `/api/habits` | Get habits (auth required) |
| POST | `/api/habits` | Create habit (auth required) |
| GET | `/api/dashboard` | Dashboard data (auth required) |
| GET | `/api/notifications` | Notifications (auth required) |

---

## 🔧 Managing the Deployment

### View Logs
```bash
az containerapp logs show \
  --name habit-tracker-backend \
  --resource-group rg-habittracker \
  --follow
```

### Restart the App
```bash
az containerapp revision restart \
  --name habit-tracker-backend \
  --resource-group rg-habittracker
```

### Scale the App
```bash
az containerapp update \
  --name habit-tracker-backend \
  --resource-group rg-habittracker \
  --min-replicas 1 \
  --max-replicas 5
```

### Update Environment Variables
```bash
az containerapp update \
  --name habit-tracker-backend \
  --resource-group rg-habittracker \
  --set-env-vars "JWT_SECRET=newsecret"
```

---

## 💰 Cost Optimization

| Component | Tier | Approx. Monthly Cost |
|-----------|------|---------------------|
| Container Apps | Consumption (0-3 replicas) | **$0 - $30** |
| Container Registry | Basic | **$5/month** |
| Log Analytics | Pay-as-you-go | **$0 - $5** |
| **Total** | | **$5 - $40/month** |

> 💡 **Cost Saving Tip**: Set `minReplicas=0` in `main.bicep` to scale to zero when not in use.

---

## 🔐 Security Checklist

- [ ] MongoDB Atlas uses IP whitelist or VPC peering
- [ ] JWT_SECRET is a strong random string (32+ chars)
- [ ] SendGrid API key is stored in Azure secrets
- [ ] Azure Container Registry has content trust enabled
- [ ] HTTPS only (enforced by Container Apps)

---

## 🆘 Troubleshooting

### Issue: `MongoTimeoutError`
**Solution**: Whitelist Azure IPs in MongoDB Atlas Network Access.

### Issue: `401 Unauthorized`
**Solution**: Check `JWT_SECRET` is correctly set in Container App environment variables.

### Issue: Container won't start
```bash
# Check logs
az containerapp logs show --name habit-tracker-backend --resource-group rg-habittracker

# Check revision status
az containerapp revision list --name habit-tracker-backend --resource-group rg-habittracker
```

### Issue: `az` command not found
**Solution**: Install Azure CLI from [official instructions](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).

---

## 📁 What's Been Created

```
infrastructure/
├── main.bicep                  # Azure infrastructure definition
├── azuredeploy.parameters.json # Parameter template
├── deploy.ps1                  # PowerShell deployment script
└── deploy.sh                   # Bash deployment script
```

Ready to deploy! 🚀

