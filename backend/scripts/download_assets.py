#!/usr/bin/env python3
"""
Télécharge les assets images au démarrage du conteneur.
- Portraits traders depuis raw.githubusercontent.com/the-hideout/tarkov-dev
  (aucune dépendance GraphQL — URLs statiques stables)
- Bannières de modes (PVP / PVE / Kord Breach)
Skip si le fichier existe déjà (idempotent).
Dossier cible : /assets/images/  (volume partagé avec le frontend)
"""

import os
import pathlib
import requests

ASSETS_DIR  = pathlib.Path(os.environ.get("ASSETS_DIR", "/assets/images"))
TRADERS_DIR = ASSETS_DIR / "traders"
MODES_DIR   = ASSETS_DIR / "modes"

# Base CDN — repo public the-hideout/tarkov-dev, branche main
_GH_RAW = "https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders"

# Portraits traders — URLs directes, pas de GraphQL
TRADER_PORTRAITS = {
    "prapor":      f"{_GH_RAW}/prapor-portrait.png",
    "therapist":   f"{_GH_RAW}/therapist-portrait.png",
    "skier":       f"{_GH_RAW}/skier-portrait.png",
    "peacekeeper": f"{_GH_RAW}/peacekeeper-portrait.png",
    "mechanic":    f"{_GH_RAW}/mechanic-portrait.png",
    "ragman":      f"{_GH_RAW}/ragman-portrait.png",
    "jaeger":      f"{_GH_RAW}/jaeger-portrait.png",
    "fence":       f"{_GH_RAW}/fence-portrait.png",
    "lightkeeper": f"{_GH_RAW}/lightkeeper-portrait.png",
    "ref":         f"{_GH_RAW}/ref-portrait.png",
    "btr-driver":  f"{_GH_RAW}/btr-driver-portrait.png",
    "flea-market": f"{_GH_RAW}/flea-market-portrait.png",
}

# Bannières de modes
# Source 1 : wiki Fandom officiel EFT
# Source 2 (fallback) : Steam CDN
MODE_BANNERS = {
    "pvp": {
        "file": "pvp-banner.jpg",
        "urls": [
            "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/1/1e/PMC_artwork.jpg",
            "https://cdn.cloudflare.steamstatic.com/steam/apps/203290/capsule_616x353.jpg",
        ],
    },
    "pve": {
        "file": "pve-banner.jpg",
        "urls": [
            "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/e/e3/PvE_Zone_artwork.jpg",
            "https://cdn.cloudflare.steamstatic.com/steam/apps/2522860/capsule_616x353.jpg",
        ],
    },
    "pvp-season": {
        "file": "kord-breach-banner.jpg",
        "urls": [
            "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/k/kb/Kord_Breach_key_art.jpg",
            "https://cdn.cloudflare.steamstatic.com/steam/apps/203290/ss_kord_breach.jpg",
        ],
    },
}


def download(url: str, dest: pathlib.Path, label: str) -> bool:
    if dest.exists():
        print(f"  [SKIP] {label}")
        return True
    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "TarkovMoneyMaker/2.0"})
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        print(f"  [OK]   {label} → {dest.name}  ({len(r.content)//1024} kB)")
        return True
    except Exception as exc:
        print(f"  [FAIL] {label} : {exc}")
        return False


def download_trader_portraits():
    print("\n=== Portraits traders (raw.githubusercontent.com) ===")
    for name, url in TRADER_PORTRAITS.items():
        dest = TRADERS_DIR / f"{name}-portrait.png"
        download(url, dest, name)


def download_mode_banners():
    print("\n=== Bannières de modes ===")
    for mode_key, cfg in MODE_BANNERS.items():
        dest = MODES_DIR / cfg["file"]
        if dest.exists():
            print(f"  [SKIP] {mode_key}")
            continue
        for url in cfg["urls"]:
            if download(url, dest, mode_key):
                break
        else:
            print(f"  [WARN] {mode_key} : aucune source dispo — fallback CSS couleur actif")


def main():
    print("=" * 52)
    print("Tarkov Money Maker 2 — Asset Downloader")
    print(f"Dossier cible : {ASSETS_DIR}")
    print("=" * 52)

    for d in (ASSETS_DIR, TRADERS_DIR, MODES_DIR):
        d.mkdir(parents=True, exist_ok=True)

    download_trader_portraits()
    download_mode_banners()

    print("\n=== Terminé ===")


if __name__ == "__main__":
    main()
