import asyncio
import json
from dataclasses import asdict
from pathlib import Path

from z8ter.cli.run_server import run_server

from app.test_execution import run_all_tests

MODE = "dev"
HOST = "127.0.0.1"
PORT = 8080
DASHBOARD_PATH = Path("content/dashboard.json")


async def run_tcdr():
    res = await run_all_tests()

    if not res.ok:
        print("There was an error in executing the tests, see details below:")
        print(json.dumps(asdict(res), indent=2))

    DASHBOARD_PATH.parent.mkdir(parents=True, exist_ok=True)
    await asyncio.to_thread(run_server, MODE, HOST, PORT, reload=True)
