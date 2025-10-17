import json
from pathlib import Path

from z8ter.endpoints.api import API
from z8ter.requests import Request
from z8ter.responses import JSONResponse


class Dashboard(API):
    def __init__(self) -> None:
        super().__init__()

    @API.endpoint("GET", "/dashboard")
    async def get_dashboard(self, request: Request) -> JSONResponse:
        """Return the latest aggregated dashboard payload."""
        dashboard_path = Path("content/dashboard.json")
        if not dashboard_path.exists():
            return JSONResponse(
                {
                    "error": "dashboard artifact not found. "
                    "Run `tcdr collect` and `tcdr build`."
                },
                status_code=503,
            )
        try:
            with dashboard_path.open("r", encoding="utf-8") as fh:
                payload = json.load(fh)
        except json.JSONDecodeError:
            return JSONResponse(
                {"error": "dashboard artifact is invalid JSON."},
                status_code=500,
            )
        return JSONResponse(payload, 200)
