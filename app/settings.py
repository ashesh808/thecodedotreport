from pathlib import Path
from typing import Final

MAX_OUTPUT_CHARS: Final[int] = 50_000
TIMEOUT_SECONDS: Final[int] = 15 * 60
ROOT = Path.cwd().resolve()
OUT_DIR = ROOT / ".tcdr" / "coverage"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PREFIX = (OUT_DIR / "coverage").resolve()

command = [
    "dotnet",
    "test",
    "/p:CollectCoverage=true",
    f"/p:CoverletOutput={str(OUT_PREFIX)}",
    "/p:CoverletOutputFormat=json",
]
