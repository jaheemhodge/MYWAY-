from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DB_PATH = ROOT / "research_demo.sqlite"

# Delivery is fail-closed. Flip only after clinician sign-off of specific content.
CLINICAL_DELIVERY_ENABLED = False
DEMO_MODE = True
