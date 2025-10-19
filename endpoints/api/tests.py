from z8ter.endpoints.api import API
from z8ter.requests import Request
from z8ter.responses import JSONResponse

from app.responses import create_json_response
from app.test_execution import run_all_tests


class Tests(API):
    def __init__(self) -> None:
        super().__init__()

    @API.endpoint("POST", "/run")
    async def run_all(self, request: Request) -> JSONResponse:
        """Execute `dotnet test` and return the aggregated results."""
        res = await run_all_tests()
        return create_json_response(res)
