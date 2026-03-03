# AI Smart Travel Planner — Python + Azure Edition

A full-stack AI travel planning app rebuilt in Python, ready to deploy on **Azure App Service** or **Azure Container Apps**.

## Tech Stack

| Layer       | Original (TypeScript)    | This version (Python)       |
|-------------|--------------------------|------------------------------|
| Backend     | Node.js + Express        | **Python + FastAPI**         |
| Auth        | bcryptjs + jsonwebtoken  | **bcrypt + PyJWT**           |
| Database    | SQLite (better-sqlite3)  | **SQLite (stdlib)**          |
| AI          | Google Gemini API        | **Anthropic Claude API**     |
| Frontend    | React + Vite (unchanged) | React + Vite (unchanged)     |
| Deploy      | —                        | **Docker → Azure App Service** |

## Project Structure

```
travel-planner-python/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLite setup & connection
│   ├── auth.py          # JWT auth + signup/login routes
│   ├── trips.py         # Trip CRUD + AI itinerary generation
│   ├── expenses.py      # Expense tracking routes
│   ├── dashboard.py     # Dashboard stats
│   └── requirements.txt
├── frontend/            # React + Vite (same as original)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts   # Dev proxy → Python backend
├── Dockerfile           # Multi-stage: Node build → Python serve
├── deploy-azure.sh      # One-shot Azure deployment script
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions CI/CD
└── .env.example
```

## Local Development

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # proxies /api → localhost:8000
```

Open http://localhost:5173

## Deploy to Azure

### One-shot script (first deploy)

```bash
# Prerequisites: Azure CLI logged in, Docker running
export ANTHROPIC_API_KEY="sk-ant-..."
chmod +x deploy-azure.sh
./deploy-azure.sh
```

The script will:
1. Create a Resource Group
2. Create an Azure Container Registry (ACR)
3. Build & push the Docker image via `az acr build` (no local Docker needed)
4. Create a Linux App Service Plan
5. Create a Web App from the container
6. Set all environment variables as App Settings

### CI/CD with GitHub Actions

1. Run `deploy-azure.sh` once to provision resources.
2. Generate Azure credentials:
   ```bash
   az ad sp create-for-rbac --name "travel-planner-gh" \
     --role contributor \
     --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-travel-planner-ai \
     --json-auth
   ```
3. Add the JSON output as a GitHub secret named `AZURE_CREDENTIALS`.
4. Push to `main` → GitHub Actions builds and deploys automatically.

## Environment Variables

| Variable           | Description                              | Required |
|--------------------|------------------------------------------|----------|
| `ANTHROPIC_API_KEY`| Anthropic Claude API key                 | ✅       |
| `JWT_SECRET`       | Secret for signing JWT tokens            | ✅       |
| `DB_PATH`          | SQLite file path (default: `./backend/`) | ❌       |
| `PORT`             | Server port (Azure sets automatically)   | ❌       |

## Production Notes

- **SQLite persistence**: The deploy script sets `DB_PATH=/home/travel_planner.db` which uses Azure App Service's persistent `/home` volume. For multi-instance deployments, migrate to **Azure Database for PostgreSQL**.
- **Scaling**: The Dockerfile is optimized for single-instance App Service. For horizontal scaling, replace SQLite with a managed database.
- **HTTPS**: Azure App Service provides HTTPS automatically.
