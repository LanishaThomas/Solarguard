"""
SolarGuard — Secure Checkpoint Transfer Utility
Transfers solarguard_mobilenetv3_50epoch_finetuned.pt into backend/models/
without exposing credentials or hardcoding secrets.
"""

import os
import sys
import argparse
from pathlib import Path
import urllib.request
import shutil

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

TARGET_FILE = MODELS_DIR / "solarguard_mobilenetv3_50epoch_finetuned.pt"

def transfer_via_signed_url(url: str, target_path: Path):
    """Securely downloads checkpoint via pre-signed URL (e.g. S3 / GCS presigned token)."""
    print(f"[*] Downloading checkpoint from secure signed URL to {target_path}...")
    headers = {"User-Agent": "SolarGuard-ModelSync/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response, open(target_path, "wb") as out_file:
        shutil.copyfileobj(response, out_file)
    print(f"[+] Download complete: {target_path.stat().st_size / (1024*1024):.2f} MB")

def transfer_via_local_copy(source_path: str, target_path: Path):
    """Copies checkpoint from local or mounted drive path."""
    src = Path(source_path)
    if not src.exists():
        raise FileNotFoundError(f"Source file not found at: {src.resolve()}")
    print(f"[*] Copying checkpoint from {src} to {target_path}...")
    shutil.copy2(src, target_path)
    print(f"[+] Checkpoint copied successfully ({target_path.stat().st_size / (1024*1024):.2f} MB)")

def print_colab_instructions():
    """Prints instructions for exporting directly from Google Colab."""
    print("=" * 70)
    print("HOW TO TRANSFER THE MODEL FROM GOOGLE COLAB / GOOGLE DRIVE")
    print("=" * 70)
    print("\nOption 1: Download from Google Drive Web UI (Quickest)")
    print("  1. Open Google Drive (lanishathomas@gmail.com)")
    print("  2. Navigate to: MyDrive/SolarGuard/models/")
    print("  3. Right-click 'solarguard_mobilenetv3_50epoch_finetuned.pt' -> Download")
    print(f"  4. Place the downloaded file into:\n     {TARGET_FILE.resolve()}")
    print("\nOption 2: Run in Google Colab (Export directly to machine)")
    print("  Execute this cell in your Colab notebook:")
    print("  ```python")
    print("  from google.colab import files")
    print("  checkpoint_path = '/content/drive/MyDrive/SolarGuard/models/solarguard_mobilenetv3_50epoch_finetuned.pt'")
    print("  files.download(checkpoint_path)")
    print("  ```")
    print("\nOption 3: Secure Production Deployment (CI/CD or Cloud VM)")
    print("  - Use a Google Cloud Service Account with Google Drive Read-Only permission.")
    print("  - Set the environment variable GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa_key.json")
    print("  - Run: python backend/scripts/download_checkpoint.py --service-account")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="SolarGuard Checkpoint Transfer Utility")
    parser.add_argument("--source", type=str, help="Local file path to copy from (e.g. from Downloads)")
    parser.add_argument("--url", type=str, help="Secure pre-signed URL to download from")
    parser.add_argument("--info", action="store_true", help="Print secure transfer instructions")

    args = parser.parse_args()

    if args.info or (not args.source and not args.url):
        print_colab_instructions()
        return

    if args.source:
        transfer_via_local_copy(args.source, TARGET_FILE)
    elif args.url:
        transfer_via_signed_url(args.url, TARGET_FILE)

if __name__ == "__main__":
    main()
