import argparse
import asyncio
import json
import sys
from dataclasses import asdict
from pathlib import Path

import uvicorn

from tcdr.app.features.execute_tests import run_all_tests
from tcdr.app.features.generate_props import generate_dashboard_props
from tcdr.app.web import create_app

MODE = "dev"
HOST = "127.0.0.1"
DEFAULT_PORT = 8080


async def run_tcdr(port: int) -> int:
    """
    Runs tests, generates dashboard props, then starts the server.
    Returns exit code.
    """
    res = await run_all_tests()

    if not res.ok:
        print("There was an error in executing the tests, see details below:")
        print(json.dumps(asdict(res), indent=2))

    content_path: Path = generate_dashboard_props()
    print(f"Dashboard props generated at: {content_path}")
    app = create_app(debug=True)
    uvicorn.run(app, host="127.0.0.1", port=port)
    return 0


def parse_args(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        prog="tcdr",
        description="The Code Dot Report — "
        + "zero-config .NET coverage dashboard",
        add_help=True,
    )
    parser.add_argument(
        "--serve",
        nargs="?",
        const=DEFAULT_PORT,
        type=int,
        metavar="PORT",
        help="Run tests, generate dashboard props, "
        + "and start the server (default PORT: 8080).",
    )
    args = parser.parse_args(argv)

    if args.serve is None:
        parser.print_help()
        return 2

    port = int(args.serve)
    if not (1 <= port <= 65535):
        print(f"Invalid port: {port}. Use 1-65535.", file=sys.stderr)
        return 2

    try:
        asyncio.run(run_tcdr(port))
        return 0
    except KeyboardInterrupt:
        print("\nShutting down...")
        return 130


def main() -> None:
    code = parse_args(sys.argv[1:])
    raise SystemExit(code)


if __name__ == "__main__":
    main()
