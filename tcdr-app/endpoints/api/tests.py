from z8ter.endpoints.api import API
from z8ter.requests import Request
from z8ter.responses import JSONResponse

from tcdr.features.execute_tests import run_all_tests
from tcdr.features.generate_props import generate_dashboard_props
from tcdr.responses import create_json_response


class Tests(API):
    def __init__(self) -> None:
        super().__init__()

    @API.endpoint("POST", "/run")
    async def run_all(self, request: Request) -> JSONResponse:
        """Execute `dotnet test` and return the aggregated results."""
        res = await run_all_tests()
        if res.ok:
            content_path = generate_dashboard_props()
            print(f"Dashboard props updated at: {str(content_path)}")
        return create_json_response(res)
