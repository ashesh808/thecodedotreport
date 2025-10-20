import asyncio
import time

from app.core import RunAllExceptionResult, RunAllResult
from app.settings import MAX_OUTPUT_CHARS, TIMEOUT_SECONDS, command


def _trim_output(raw: bytes) -> str:
    text = raw.decode(errors="replace")
    if len(text) <= MAX_OUTPUT_CHARS:
        return text
    return f"...(truncated)...\n{text[-MAX_OUTPUT_CHARS:]}"


async def run_all_tests():
    """Execute `dotnet test` and return the aggregated results."""

    started_at = time.perf_counter()

    try:
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError:
        not_found_result = RunAllExceptionResult(
            ok=False,
            error="dotnet executable not found. Install the "
            ".NET SDK on the server.",
        )
        return not_found_result
    except OSError as exc:
        os_error_result = RunAllExceptionResult(
            ok=False, error=f"Failed to spawn dotnet process: {exc}"
        )
        return os_error_result
    try:
        stdout_raw, stderr_raw = await asyncio.wait_for(
            process.communicate(), timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        process.kill()
        stdout_raw, stderr_raw = await process.communicate()
        duration = time.perf_counter() - started_at
        timeout_error_result = RunAllExceptionResult(
            ok=False,
            timeout=True,
            duration_seconds=round(duration, 2),
            stdout=_trim_output(stderr_raw),
            stderr=_trim_output(stderr_raw),
            error="`dotnet test` "
            + "exceeded timeout ({TIMEOUT_SECONDS} seconds).",
        )
        return timeout_error_result

    duration = time.perf_counter() - started_at
    exit_code = process.returncode or 0
    stdout = _trim_output(stdout_raw)
    stderr = _trim_output(stderr_raw)
    error = False
    error_message = ""
    if exit_code != 0 and not stderr.strip():
        error = True
        error_message = "`dotnet test` reported failures."
    elif exit_code != 0:
        error = True
        error_message = "dotnet test failed."

    if error:
        return RunAllExceptionResult(
            ok=False,
            timeout=True,
            duration_seconds=round(duration, 2),
            stdout=_trim_output(stderr_raw),
            stderr=_trim_output(stderr_raw),
            error=error_message,
        )

    return RunAllResult(
        ok=exit_code == 0,
        exit_code=exit_code,
        duration_seconds=round(duration, 2),
        stdout=stdout,
        stderr=stderr,
    )
