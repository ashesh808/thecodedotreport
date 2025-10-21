import json
import os
from pathlib import Path

from tcdr.settings import OUT_PREFIX


def generate_dashboard_props() -> Path:
    src = Path(f"{OUT_PREFIX}.json")
    raw = json.loads(src.read_text(encoding="utf-8"))
    payload = {"dashboard_props": raw}
    dest = Path(".tcdr/tcdr-app/content/dashboard.json")
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    os.replace(tmp, dest)
    return dest
