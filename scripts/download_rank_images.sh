#!/usr/bin/env bash
# =============================================================================
# download_rank_images.sh
# Les images de rang sont maintenant bundlées directement dans le dépôt :
#   frontend/public/images/Rank{1,5,10,15,20,25,30,35,45,50,60,65,70,75}.webp
# Ce script ne fait plus rien — conservé pour compatibilité avec deploy.sh.
# =============================================================================
GREEN="\033[0;32m"
NC="\033[0m"
echo -e "${GREEN}[ranks]${NC} Images de rang bundlées dans le repo (Rank*.webp) — aucun téléchargement nécessaire."
