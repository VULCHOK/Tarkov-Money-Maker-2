#!/usr/bin/env bash
# =============================================================================
# deploy.sh  —  Tarkov Money Maker 2
# Modes :
#   ./deploy.sh          → build avec cache (déploiement normal, rapide)
#   ./deploy.sh --fresh  → destroy volumes + rebuild sans cache (reset complet)
# =============================================================================
set -euo pipefail

COMPOSE="docker compose -f docker/docker-compose.yml"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
die()  { echo -e "${RED}[deploy] ERREUR${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
FRESH=false
for arg in "$@"; do
  case $arg in
    --fresh) FRESH=true ;;
    *) die "Argument inconnu: $arg. Usage: ./deploy.sh [--fresh]" ;;
  esac
done

# ---------------------------------------------------------------------------
# 0. Vérifications préalables
# ---------------------------------------------------------------------------
command -v git          &>/dev/null || die "git non trouvé"
command -v docker       &>/dev/null || die "docker non trouvé"
docker compose version  &>/dev/null || die "docker compose plugin non trouvé"

cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# 1. S'assurer que docker/.env existe
# ---------------------------------------------------------------------------
if [ ! -f docker/.env ]; then
    warn "docker/.env introuvable — copie depuis .env.example"
    cp docker/.env.example docker/.env
    warn "Pense à remplir docker/.env avec tes vraies valeurs !"
fi

# ---------------------------------------------------------------------------
# 2. Git pull (ignore les changements de permissions)
# ---------------------------------------------------------------------------
git config core.fileMode false
log "Pull des derniers changements..."
git fetch origin
git reset --hard origin/main

# ---------------------------------------------------------------------------
# 3. Stop + (optionnel) suppression des volumes
# ---------------------------------------------------------------------------
if [ "$FRESH" = true ]; then
    warn "Mode --fresh : suppression des volumes (reset DB complet)..."
    $COMPOSE down -v --remove-orphans
else
    log "Arrêt des conteneurs (volumes conservés)..."
    $COMPOSE down --remove-orphans
fi

# ---------------------------------------------------------------------------
# 4. Rebuild (avec cache sauf en mode --fresh)
# ---------------------------------------------------------------------------
if [ "$FRESH" = true ]; then
    log "Rebuild des images (no-cache)..."
    $COMPOSE build --no-cache --parallel
else
    log "Rebuild des images (avec cache)..."
    $COMPOSE build --parallel
fi

# ---------------------------------------------------------------------------
# 5. Lancement
# ---------------------------------------------------------------------------
log "Démarrage des conteneurs..."
$COMPOSE up -d

# ---------------------------------------------------------------------------
# 6. Attente que le backend soit prêt
# ---------------------------------------------------------------------------
log "Attente du backend..."
MAX=30
i=0
until curl -sf http://localhost:3000/health &>/dev/null; do
    i=$((i+1))
    [ $i -ge $MAX ] && die "Backend ne répond pas après ${MAX}s."
    echo -n "."
    sleep 1
done
echo
log "Backend up !"

# ---------------------------------------------------------------------------
# 7. Résumé
# ---------------------------------------------------------------------------
echo
log "======================================="
log "  Tarkov Money Maker 2 est up  "
if [ "$FRESH" = true ]; then
    warn "  Mode --fresh : DB réinitialisée, sync auto dans ~10 min"
fi
log "  http://localhost (ou ton IP/domaine)"
log "  Logs : docker compose -f docker/docker-compose.yml logs -f"
log "======================================="
