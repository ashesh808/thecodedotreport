import asyncio
import time
from typing import Final

from z8ter.endpoints.api import API
from z8ter.requests import Request
from z8ter.responses import JSONResponse

MAX_OUTPUT_CHARS: Final[int] = 50_000
TIMEOUT_SECONDS: Final[int] = 15 * 60


def _trim_output(raw: bytes) -> str:
    text = raw.decode(errors="replace")
    if len(text) <= MAX_OUTPUT_CHARS:
        return text
    return f"...(truncated)...\n{text[-MAX_OUTPUT_CHARS:]}"


class Tests(API):
    def __init__(self) -> None:
        super().__init__()

    @API.endpoint("POST", "/run")
    async def run_all(self, request: Request) -> JSONResponse:
        """Execute `dotnet test` and return the aggregated results."""

        command = ["dotnet", "test", "--nologo"]
        started_at = time.perf_counter()

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError:
            return JSONResponse(
                {
                    "ok": False,
                    "error": "dotnet executable not found. Install the "
                    ".NET SDK on the server.",
                },
                status_code=500,
            )
        except OSError as exc:
            return JSONResponse(
                {
                    "ok": False,
                    "error": f"Failed to spawn dotnet process: {exc}",
                },
                status_code=500,
            )

        try:
            stdout_raw, stderr_raw = await asyncio.wait_for(
                process.communicate(), timeout=TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            process.kill()
            stdout_raw, stderr_raw = await process.communicate()
            duration = time.perf_counter() - started_at
            return JSONResponse(
                {
                    "ok": False,
                    "timeout": True,
                    "duration_seconds": round(duration, 2),
                    "stdout": _trim_output(stdout_raw),
                    "stderr": _trim_output(stderr_raw),
                    "error": "`dotnet test`"
                    + "exceeded timeout ({TIMEOUT_SECONDS} seconds).",
                },
                status_code=504,
            )

        duration = time.perf_counter() - started_at
        exit_code = process.returncode or 0
        stdout = _trim_output(stdout_raw)
        stderr = _trim_output(stderr_raw)

        payload = {
            "ok": exit_code == 0,
            "exit_code": exit_code,
            "duration_seconds": round(duration, 2),
            "stdout": stdout,
            "stderr": stderr,
        }

        if exit_code != 0 and not stderr.strip():
            payload["error"] = "`dotnet test` reported failures."
        elif exit_code != 0:
            payload["error"] = "dotnet test failed."

        return JSONResponse(
            payload, status_code=200 if exit_code == 0 else 500
        )
