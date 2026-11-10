"""Reusable response schemas."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

MIN_PAGE_SIZE = 1
MAX_PAGE_SIZE = 100


class PaginatedResponse(BaseModel, Generic[T]):
    """A page of results plus pagination metadata."""

    items: list[T]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=MIN_PAGE_SIZE, le=MAX_PAGE_SIZE)
    total_pages: int = Field(ge=0)
