# ---- Stage 1: Build React frontend ----
FROM node:22-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build


# ---- Stage 2: Python backend ----
FROM python:3.12-slim

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into backend's expected path
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Azure App Service sets PORT env var; default to 8000
ENV PORT=8000
ENV PYTHONPATH=/app

EXPOSE 8000

CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
