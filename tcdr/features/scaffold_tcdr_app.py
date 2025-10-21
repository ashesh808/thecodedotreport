"""Project scaffolding command for TCDR."""

from __future__ import annotations

import os
import sys
from collections.abc import Iterable
from dataclasses import dataclass
from importlib.resources import as_file, files
from pathlib import Path
from typing import Final

__all__ = ["new_app"]

_TEMPLATE_RELPATH: Final[tuple[str, ...]] = (
    "scaffold",
    "tcdr_app",
)

RC_OK: Final[int] = 0
RC_NONEMPTY_DIR: Final[int] = 2
RC_TEMPLATE_MISSING: Final[int] = 3
RC_COPY_ERROR: Final[int] = 4


@dataclass(frozen=True)
class CopyStats:
    """Simple copy statistics for debugging and tests."""

    files_copied: int
    dirs_created: int


def _iter_dirnames(root: Path) -> Iterable[Path]:
    """Yield all directories under `root`, including `root` itself."""
    for current, _dirnames, _filenames in os.walk(root):
        yield Path(current)


def _copy_tree(src: Path, dst: Path) -> CopyStats:
    """Recursively copy the directory tree from `src` into `dst`."""
    if not src.is_dir():
        raise ValueError(f"Source is not a directory: {src}")

    dirs_created = 0
    files_copied = 0

    for d in _iter_dirnames(src):
        rel = d.relative_to(src)
        target_dir = dst / rel
        if not target_dir.exists():
            target_dir.mkdir(parents=True, exist_ok=True)
            dirs_created += 1

    for current, _dirnames, filenames in os.walk(src):
        current_path = Path(current)
        rel_dir = current_path.relative_to(src)
        for name in filenames:
            s = current_path / name
            d = (dst / rel_dir) / name
            try:
                if not s.is_file():
                    continue
                d.write_bytes(s.read_bytes())
            except OSError as exc:
                raise OSError(f"Failed to copy '{s}' → '{d}': {exc}") from exc
            files_copied += 1

    return CopyStats(files_copied=files_copied, dirs_created=dirs_created)


def _template_root_path() -> Path | None:
    """Resolve the on-disk path to the bundled project template (zip-safe)."""
    try:
        traversable = files("tcdr")
        for part in _TEMPLATE_RELPATH:
            traversable = traversable / part
    except ModuleNotFoundError:
        return None

    with as_file(traversable) as p:
        path = Path(p)
        return path if path.is_dir() else None


def new_app(project_name: str, path: str | None = None) -> int:
    target = Path(path or project_name).resolve()
    if target.exists() and any(target.iterdir()):
        print(
            f"✖ Target directory is not empty: {target}",
            file=sys.stderr,
            flush=True,
        )
        return RC_NONEMPTY_DIR

    template_path = _template_root_path()
    if template_path is None:
        print(
            "✖ Project template missing inside package.",
            file=sys.stderr,
            flush=True,
        )
        return RC_TEMPLATE_MISSING

    try:
        target.mkdir(parents=True, exist_ok=True)
        _ = _copy_tree(template_path, target)
    except OSError as exc:
        print(
            f"✖ Failed to create project: {exc}", file=sys.stderr, flush=True
        )
        return RC_COPY_ERROR

    print(f"✓ Created new Z8ter project at: {target}")
    print("Next steps:")
    print(f"  cd {target}")
    print("  z8 dev")
    return RC_OK
