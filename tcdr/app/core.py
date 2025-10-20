from dataclasses import dataclass
from typing import Optional


@dataclass
class RunAllExceptionResult:
    ok: bool
    error: str
    timeout: Optional[bool] = None
    duration_seconds: Optional[float] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None


@dataclass
class RunAllResult:
    ok: bool
    exit_code: int
    duration_seconds: float
    stdout: str
    stderr: str
