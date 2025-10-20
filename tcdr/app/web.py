import importlib.util
import sys
from pathlib import Path

from z8ter import set_app_dir
from z8ter.builders.app_builder import AppBuilder


def _pkg_base_dir() -> Path:
    """
    Return the installed tcdr/ package directory (the one that contains
    endpoints/, templates/, static/). Works with regular and namespace packages
    and keeps Pylance happy.
    """
    spec = importlib.util.find_spec("tcdr")
    if not spec or not spec.submodule_search_locations:
        raise RuntimeError("Cannot locate installed 'tcdr' package directory.")
    return Path(spec.submodule_search_locations[0])


def create_app(debug: bool = False):
    base = _pkg_base_dir()
    if str(base) not in sys.path:
        sys.path.insert(0, str(base))
    set_app_dir(base)
    b = AppBuilder()
    b.use_templating()
    b.use_vite()
    b.use_errors()
    app = b.build(debug=debug)
    return app
