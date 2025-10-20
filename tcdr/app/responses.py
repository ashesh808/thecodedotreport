from dataclasses import asdict, is_dataclass
from typing import NoReturn, Union

from z8ter.responses import JSONResponse

from app.core import (
    RunAllExceptionResult,
    RunAllResult,
)

Result = Union[
    RunAllExceptionResult,
    RunAllResult,
]


def _type_error(msg: str) -> NoReturn:
    raise TypeError(msg)


def create_json_response(res: Result) -> JSONResponse:
    if not is_dataclass(res):
        _type_error("create_response expects a dataclass instance.")

    if isinstance(res, RunAllExceptionResult):
        status = 500
    else:
        status = 200
    return JSONResponse(content=asdict(res), status_code=status)
