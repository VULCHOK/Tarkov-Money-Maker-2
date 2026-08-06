#!/usr/bin/env python3
"""
Télécharge les assets images au démarrage du conteneur.
- Portraits traders (tarkov.dev GraphQL → normalizedName)
- Bannières de modes (PVP / PVE / Kord Breach) depuis le wiki Fandom
Skip si le fichier existe déjà (idempotent).
Dossier cible : /assets/images/  (volume partagé avec le frontend)
"""

import os
import sys
import time
import pathlib
import requests

ASSETS_DIR = pathlib.Path(os.environ.get("ASSETS_DIR", "/assets/images"))
TRADERS_DIR = ASSETS_DIR / "traders"
MODES_DIR   = ASSETS_DIR / "modes"

TARKOV_GRAPHQL = "https://api.tarkov.dev/graphql"

TRADER_QUERY = """
{
  traders {
    id
    name
    normalizedName
    imageLink
  }
}
"""

# Fallback URLs si l'API ne retourne pas imageLink
# Format: normalizedName -> URL portrait officielle
FALLBACK_PORTRAITS = {
    "prapor":      "https://tarkov.dev/images/traders/prapor-portrait.png",
    "therapist":   "https://tarkov.dev/images/traders/therapist-portrait.png",
    "skier":       "https://tarkov.dev/images/traders/skier-portrait.png",
    "peacekeeper": "https://tarkov.dev/images/traders/peacekeeper-portrait.png",
    "mechanic":    "https://tarkov.dev/images/traders/mechanic-portrait.png",
    "ragman":      "https://tarkov.dev/images/traders/ragman-portrait.png",
    "jaeger":      "https://tarkov.dev/images/traders/jaeger-portrait.png",
    "fence":       "https://tarkov.dev/images/traders/fence-portrait.png",
    "lightkeeper": "https://tarkov.dev/images/traders/lightkeeper-portrait.png",
}

# Images officielless de modes
# Source : wiki Fandom officiel EFT (images stables, hébergées sur Wikimedia CDN)
MODE_IMAGES = {
    "pvp": (
        "pvp-banner.jpg",
        "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/1/1e/PMC_artwork.jpg",
    ),
    "pve": (
        "pve-banner.jpg",
        "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/e/e3/PvE_Zone_artwork.jpg",
    ),
    "pvp-season": (
        "kord-breach-banner.jpg",
        "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/k/kb/Kord_Breach_key_art.jpg",
    ),
}


def download(url: str, dest: pathlib.Path, label: str) -> bool:
    """Télécharge url → dest. Retourne True si succès."""
    if dest.exists():
        print(f"  [SKIP] {label} — déjà présent")
        return True
    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "TarkovMoneyMaker/2.0"})
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        print(f"  [OK]   {label} → {dest.name}  ({len(r.content)//1024} kB)")
        return True
    except Exception as exc:
        print(f"  [ERR]  {label} : {exc}")
        return False


def fetch_traders() -> list[dict]:
    """Récupère la liste des traders via l'API GraphQL tarkov.dev."""
    try:
        r = requests.post(
            TARKOV_GRAPHQL,
            json={"query": TRADER_QUERY},
            timeout=15,
            headers={"Content-Type": "application/json"},
        )
        r.raise_for_status()
        return r.json().get("data", {}).get("traders", [])
    except Exception as exc:
        print(f"  [WARN] API GraphQL inaccessible : {exc}")
        return []


def download_trader_portraits():
    print("\n=== Portraits traders ===")
    traders = fetch_traders()

    seen = set()
    for t in traders:
        name = t.get("normalizedName", "")
        if not name:
            continue
        seen.add(name)
        dest = TRADERS_DIR / f"{name}-portrait.png"
        url  = t.get("imageLink") or FALLBACK_PORTRAITS.get(name)
        if url:
            download(url, dest, name)
        else:
            print(f"  [SKIP] {name} — pas d'URL connue")

    # Fallback pour les traders non retournés par l'API
    for name, url in FALLBACK_PORTRAITS.items():
        if name not in seen:
            dest = TRADERS_DIR / f"{name}-portrait.png"
            download(url, dest, f"{name} (fallback)")


def download_mode_banners():
    print("\n=== Bannières de modes ===")
    for mode_key, (filename, url) in MODE_IMAGES.items():
        dest = MODES_DIR / filename
        ok   = download(url, dest, mode_key)
        if not ok:
            # Tenter une URL de secours depuis le CDN Steam
            fallback_urls = {
                "pvp":        "https://cdn.cloudflare.steamstatic.com/steam/apps/203290/capsule_616x353.jpg",
                "pve":        "https://cdn.cloudflare.steamstatic.com/steam/apps/2522860/capsule_616x353.jpg",
                "pvp-season": "https://cdn.cloudflare.steamstatic.com/steam/apps/203290/ss_b0c4c2e6a8b5e6e5b9a5d5e5b5e5b5e5.jpg",
            }
            if mode_key in fallback_urls:
                print(f"  [RETRY] Tentative fallback Steam CDN pour {mode_key}")
                download(fallback_urls[mode_key], dest, f"{mode_key} (Steam fallback)")


def main():
    print("=" * 50)
    print("Tarkov Money Maker 2 — Asset Downloader")
    print(f"Dossier cible : {ASSETS_DIR}")
    print("=" * 50)

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    TRADERS_DIR.mkdir(parents=True, exist_ok=True)
    MODES_DIR.mkdir(parents=True, exist_ok=True)

    download_trader_portraits()
    download_mode_banners()

    print("\n=== Terminé ===")


if __name__ == "__main__":
    main()
