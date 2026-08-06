#!/usr/bin/env python3
"""
Télécharge les assets images au démarrage du conteneur.
Utilise httpx (déjà dans requirements.txt) — pas de dépendance supplémentaire.
Skip si le fichier existe déjà (idempotent).
Dossier cible : /assets/images/ (volume partagé avec le frontend)
"""

import os
import pathlib
import httpx

ASSETS_DIR  = pathlib.Path(os.environ.get("ASSETS_DIR", "/assets/images"))
TRADERS_DIR = ASSETS_DIR / "traders"
MODES_DIR   = ASSETS_DIR / "modes"

_GH_RAW = "https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders"

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


def download(client: httpx.Client, url: str, dest: pathlib.Path, label: str) -> bool:
    if dest.exists():
        print(f"  [SKIP] {label}")
        return True
    try:
        r = client.get(url, timeout=15, follow_redirects=True)
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        print(f"  [OK]   {label} -> {dest.name}  ({len(r.content)//1024} kB)")
        return True
    except Exception as exc:
        print(f"  [FAIL] {label} : {exc}")
        return False


def main():
    print("=" * 52)
    print("Tarkov Money Maker 2 - Asset Downloader")
    print(f"Dossier cible : {ASSETS_DIR}")
    print("=" * 52)

    for d in (ASSETS_DIR, TRADERS_DIR, MODES_DIR):
        d.mkdir(parents=True, exist_ok=True)

    with httpx.Client(headers={"User-Agent": "TarkovMoneyMaker/2.0"}) as client:
        print("\n=== Portraits traders (raw.githubusercontent.com) ===")
        for name, url in TRADER_PORTRAITS.items():
            download(client, url, TRADERS_DIR / f"{name}-portrait.png", name)

        print("\n=== Bannieres de modes ===")
        for mode_key, cfg in MODE_BANNERS.items():
            dest = MODES_DIR / cfg["file"]
            if dest.exists():
                print(f"  [SKIP] {mode_key}")
                continue
            for url in cfg["urls"]:
                if download(client, url, dest, mode_key):
                    break
            else:
                print(f"  [WARN] {mode_key} : aucune source dispo - fallback CSS couleur actif")

    print("\n=== Termine ===")


if __name__ == "__main__":
    main()
