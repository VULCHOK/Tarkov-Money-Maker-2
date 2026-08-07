#!/usr/bin/env bash
# =============================================================================
# deploy.sh  —  Tarkov Money Maker 2
# Modes :
#   ./deploy.sh          → build avec cache (déploiement normal)
#   ./deploy.sh --fresh  → destroy volumes + rebuild sans cache (reset complet)
#   ./deploy.sh --dev    → expose les ports 3001 (frontend) et 3000 (backend) sur l'hôte
#
# Variable d'environnement optionnelle :
#   TRAEFIK_DOMAIN  Si définie, active l'overlay Traefik (docker-compose.traefik.yml)
#                   Ex : TRAEFIK_DOMAIN=tmm.example.com ./deploy.sh
# =============================================================================
set -euo pipefail

BASE_COMPOSE="docker/docker-compose.yml"
TRAEFIK_COMPOSE="docker/docker-compose.traefik.yml"
DEV_COMPOSE="docker/docker-compose.dev.yml"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
die()  { echo -e "${RED}[deploy] ERREUR${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Détection du mode Traefik
# ---------------------------------------------------------------------------
if [ -n "${TRAEFIK_DOMAIN:-}" ]; then
    TRAEFIK_MODE=true
    log "Mode Traefik activé — domaine : ${TRAEFIK_DOMAIN}"
else
    TRAEFIK_MODE=false
fi

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
FRESH=false
DEV=false
for arg in "$@"; do
  case $arg in
    --fresh) FRESH=true ;;
    --dev)   DEV=true ;;
    *) die "Argument inconnu: $arg. Usage: ./deploy.sh [--fresh] [--dev]" ;;
  esac
done

# ---------------------------------------------------------------------------
# Construction de la commande compose finale
# ---------------------------------------------------------------------------
COMPOSE="docker compose -f $BASE_COMPOSE"
if [ "$TRAEFIK_MODE" = true ]; then
    COMPOSE="$COMPOSE -f $TRAEFIK_COMPOSE"
fi
if [ "$DEV" = true ]; then
    COMPOSE="$COMPOSE -f $DEV_COMPOSE"
    warn "Mode --dev : ports 3001 (frontend) et 3000 (backend) exposés sur l'hôte"
fi

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
# 3. Téléchargement des images de rang (une seule fois, mise en cache locale)
# ---------------------------------------------------------------------------
log "Vérification des images de rang..."
bash scripts/download_rank_images.sh

# ---------------------------------------------------------------------------
# 4. Stop + (optionnel) suppression des volumes
# ---------------------------------------------------------------------------
if [ "$FRESH" = true ]; then
    warn "Mode --fresh : suppression des volumes (reset DB complet)..."
    $COMPOSE down -v --remove-orphans
else
    log "Arrêt des conteneurs (volumes conservés)..."
    $COMPOSE down --remove-orphans
fi

# ---------------------------------------------------------------------------
# 5. Rebuild (avec cache sauf en mode --fresh)
# ---------------------------------------------------------------------------
if [ "$FRESH" = true ]; then
    log "Rebuild des images (no-cache)..."
    $COMPOSE build --no-cache --parallel
else
    log "Rebuild des images (avec cache)..."
    $COMPOSE build --parallel
fi

# ---------------------------------------------------------------------------
# 6. Lancement
# ---------------------------------------------------------------------------
log "Démarrage des conteneurs..."
$COMPOSE up -d

# ---------------------------------------------------------------------------
# 7. Attente que le backend soit prêt
# ---------------------------------------------------------------------------
log "Attente du backend..."
MAX=60
i=0
until docker compose -f $BASE_COMPOSE exec -T backend \
      python -c "import urllib.request; urllib.request.urlopen('http://localhost:3000/health')" \
      &>/dev/null; do
    i=$((i+1))
    if [ $i -ge $MAX ]; then
        echo
        echo -e "${RED}[deploy] ERREUR${NC} Backend ne répond pas après ${MAX}s."
        echo
        warn "=== Logs du backend ==="
        $COMPOSE logs --tail=100 backend || true
        echo
        warn "=== État des conteneurs ==="
        $COMPOSE ps || true
        $COMPOSE down --remove-orphans || true
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo
log "Backend up !"

# ---------------------------------------------------------------------------
# 8. Résumé
# ---------------------------------------------------------------------------
echo
log "======================================="
log "  Tarkov Money Maker 2 est up  "
if [ "$FRESH" = true ]; then
    warn "  Mode --fresh : DB réinitialisée, sync auto dans ~10 min"
fi
if [ "$TRAEFIK_MODE" = true ]; then
    log "  https://${TRAEFIK_DOMAIN}"
elif [ "$DEV" = true ]; then
    log "  http://localhost:3001  (frontend)"
    log "  http://localhost:3000  (backend API)"
else
    log "  Accès via IP/domaine du serveur"
fi
log "  Logs : docker compose -f $BASE_COMPOSE logs -f"
log "======================================="
