#!/usr/bin/env bash
# =============================================================================
# download_rank_images.sh
# Télécharge les 18 images de rang officielles (wiki Tarkov Fandom)
# dans frontend/public/images/ranks/
# Appelé automatiquement par deploy.sh avant le build Docker.
# =============================================================================
set -euo pipefail

DEST="$(dirname "$0")/../frontend/public/images/ranks"
mkdir -p "$DEST"

WIKI="https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images"

declare -A RANKS=(
  [recruit]="4/4d/Shoulder_strap_RECRUIT.png"
  [private]="0/0c/Shoulder_strap_PRIVATE.png"
  [lance_corporal]="9/91/Shoulder_strap_LANCE_CORPORAL.png"
  [corporal]="e/ea/Shoulder_strap_CORPORAL.png"
  [sergeant]="1/1e/Shoulder_strap_SERGEANT.png"
  [staff_sergeant]="c/c3/Shoulder_strap_STAFF_SERGEANT.png"
  [master_sergeant]="d/d9/Shoulder_strap_MASTER_SERGEANT.png"
  [first_sergeant]="b/b9/Shoulder_strap_FIRST_SERGEANT.png"
  [sergeant_major]="2/2b/Shoulder_strap_SERGEANT_MAJOR.png"
  [second_lieutenant]="0/05/Shoulder_strap_SECOND_LIEUTENANT.png"
  [lieutenant]="7/74/Shoulder_strap_LIEUTENANT.png"
  [captain]="5/53/Shoulder_strap_CAPTAIN.png"
  [major]="a/a0/Shoulder_strap_MAJOR.png"
  [lieutenant_colonel]="5/5c/Shoulder_strap_LIEUTENANT_COLONEL.png"
  [colonel]="4/4e/Shoulder_strap_COLONEL.png"
  [major_general]="b/b2/Shoulder_strap_MAJOR_GENERAL.png"
  [lieutenant_general]="9/9c/Shoulder_strap_LIEUTENANT_GENERAL.png"
  [general]="f/f4/Shoulder_strap_GENERAL.png"
)

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m"

for key in "${!RANKS[@]}"; do
  FILE="$DEST/${key}.png"
  if [ -f "$FILE" ]; then
    echo -e "${YELLOW}[ranks]${NC} Déjà présent : ${key}.png"
    continue
  fi
  URL="$WIKI/${RANKS[$key]}/revision/latest"
  echo -e "${GREEN}[ranks]${NC} Téléchargement : ${key}.png"
  curl -sf -L -o "$FILE" "$URL" || {
    echo -e "${YELLOW}[ranks]${NC} WARN: impossible de télécharger ${key}.png — ignoré"
    rm -f "$FILE"
  }
done

echo -e "${GREEN}[ranks]${NC} Images de rang prêtes dans $DEST"
