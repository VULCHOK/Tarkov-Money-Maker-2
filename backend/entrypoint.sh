#!/bin/sh
set -e

echo "[entrypoint] Téléchargement des assets..."
python /app/scripts/download_assets.py

echo "[entrypoint] Démarrage de l'API..."
exec uvicorn src.main:app --host 0.0.0.0 --port 3000
