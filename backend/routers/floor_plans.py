"""
routers/floor_plans.py — Floor Plan CRUD router

Endpoints:
  POST   /api/floor-plans/                   Create a new floor plan
  GET    /api/floor-plans/project/{project_id} Get all plans for a project
  GET    /api/floor-plans/{id}               Get one plan by UUID
  PUT    /api/floor-plans/{id}               Update name / canvas data
  DELETE /api/floor-plans/{id}               Delete a plan

Database model: FloorPlan (SQLite / PostgreSQL / MySQL via SQLAlchemy)
All timestamps are stored as UTC.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import Column, DateTime, String, Text, Index
from sqlalchemy.orm import Session

# Local imports
from database import Base, get_db

# ─── ORM Model ────────────────────────────────────────────────

class FloorPlan(Base):
    """
    Stores one floor-plan canvas snapshot.

    floor_plan_data is a JSON string: { rooms, walls, doors, windows, selectedId }
    project_id is a free-form string key (e.g. "proj_123" or a slug).
    """
    __tablename__ = "floor_plans"

    id              = Column(String(36),  primary_key=True,  default=lambda: str(uuid4()))
    project_id      = Column(String(255), nullable=False,     index=True)
    name            = Column(String(255), nullable=False,     default="My Floor Plan")
    floor_plan_data = Column(Text,        nullable=False)   # JSON string
    created_at      = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at      = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),  # auto-updated by SQLAlchemy ORM
    )

    # Composite index: speeds up "all plans for a project, sorted by date"
    __table_args__ = (
        Index("ix_floor_plans_project_updated", "project_id", "updated_at"),
    )

    def __repr__(self) -> str:
        return f"<FloorPlan id={self.id!r} project={self.project_id!r} name={self.name!r}>"


# ─── Pydantic Schemas ─────────────────────────────────────────

class FloorPlanCreate(BaseModel):
    """Body for POST /api/floor-plans/"""
    project_id:      str
    name:            str = "My Floor Plan"
    floor_plan_data: str   # must be valid JSON

    @field_validator("floor_plan_data")
    @classmethod
    def must_be_valid_json(cls, v: str) -> str:
        try:
            json.loads(v)
        except json.JSONDecodeError as exc:
            raise ValueError(f"floor_plan_data is not valid JSON: {exc}") from exc
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name cannot be blank")
        return v


class FloorPlanUpdate(BaseModel):
    """Body for PUT /api/floor-plans/{id}  — all fields optional"""
    name:            Optional[str] = None
    floor_plan_data: Optional[str] = None

    @field_validator("floor_plan_data")
    @classmethod
    def must_be_valid_json(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            json.loads(v)
        except json.JSONDecodeError as exc:
            raise ValueError(f"floor_plan_data is not valid JSON: {exc}") from exc
        return v

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("name cannot be blank")
        return v.strip() if v else v


class FloorPlanResponse(BaseModel):
    """Returned by every endpoint that sends back a floor plan."""
    id:              str
    project_id:      str
    name:            str
    floor_plan_data: str
    created_at:      datetime
    updated_at:      datetime

    model_config = {"from_attributes": True}   # allows ORM → Pydantic conversion


class FloorPlanCreatedResponse(BaseModel):
    """Returned by POST."""
    id:      str
    success: bool
    plan:    FloorPlanResponse


class DeleteResponse(BaseModel):
    """Returned by DELETE."""
    id:      str
    success: bool
    message: str


# ─── Router ───────────────────────────────────────────────────

router = APIRouter(
    prefix="/api/floor-plans",
    tags=["Floor Plans"],
)


# ── Helpers ───────────────────────────────────────────────────

def _get_or_404(db: Session, plan_id: str) -> FloorPlan:
    """Fetch a FloorPlan by UUID, raise 404 if missing."""
    plan = db.get(FloorPlan, plan_id)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Floor plan with id '{plan_id}' not found.",
        )
    return plan


# ─── 1. POST /api/floor-plans/ ────────────────────────────────

@router.post(
    "/",
    response_model=FloorPlanCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new floor plan",
    description=(
        "Saves a new floor plan snapshot for the given project. "
        "Returns the assigned UUID and the full record."
    ),
)
def create_floor_plan(
    payload: FloorPlanCreate,
    db: Session = Depends(get_db),
) -> FloorPlanCreatedResponse:
    """
    Create a floor plan.

    Request body:
    ```json
    {
      "project_id": "proj_abc123",
      "name": "Ground Floor",
      "floor_plan_data": "{\"rooms\":[...],\"walls\":[...],\"doors\":[...],\"windows\":[]}"
    }
    ```
    """
    plan = FloorPlan(
        id=str(uuid4()),
        project_id=payload.project_id.strip(),
        name=payload.name.strip(),
        floor_plan_data=payload.floor_plan_data,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)   # reload generated defaults (id, created_at, updated_at)

    return FloorPlanCreatedResponse(
        id=plan.id,
        success=True,
        plan=FloorPlanResponse.model_validate(plan),
    )


# ── 2a. GET /api/floor-plans/project/{project_id} ─────────────

@router.get(
    "/project/{project_id}",
    response_model=List[FloorPlanResponse],
    summary="Get all floor plans for a project",
    description=(
        "Returns all floor plans that belong to a project, "
        "sorted by most recently updated first."
    ),
)
def get_plans_by_project(
    project_id: str,
    db: Session = Depends(get_db),
) -> List[FloorPlanResponse]:
    """
    Fetch every floor plan stored under `project_id`.
    Returns an empty list (not 404) if the project has no plans yet.
    """
    plans = (
        db.query(FloorPlan)
        .filter(FloorPlan.project_id == project_id)
        .order_by(FloorPlan.updated_at.desc())
        .all()
    )
    return [FloorPlanResponse.model_validate(p) for p in plans]


# ── 2b. GET /api/floor-plans/{id} ─────────────────────────────

@router.get(
    "/{plan_id}",
    response_model=FloorPlanResponse,
    summary="Get one floor plan by UUID",
)
def get_floor_plan(
    plan_id: str,
    db: Session = Depends(get_db),
) -> FloorPlanResponse:
    """Fetch a single floor plan by its UUID primary key."""
    plan = _get_or_404(db, plan_id)
    return FloorPlanResponse.model_validate(plan)


# ── 3. PUT /api/floor-plans/{id} ──────────────────────────────

@router.put(
    "/{plan_id}",
    response_model=FloorPlanResponse,
    summary="Update an existing floor plan",
    description=(
        "Partial update — send only the fields you want to change. "
        "`updated_at` is refreshed automatically."
    ),
)
def update_floor_plan(
    plan_id: str,
    payload: FloorPlanUpdate,
    db: Session = Depends(get_db),
) -> FloorPlanResponse:
    """
    Update `name` and/or `floor_plan_data`.
    At least one field must be provided; sending `{}` returns a 422.

    Request body example:
    ```json
    {
      "name": "First Floor",
      "floor_plan_data": "{\"rooms\":[...],\"walls\":[...]}"
    }
    ```
    """
    # Require at least one field
    if payload.name is None and payload.floor_plan_data is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least one of: name, floor_plan_data",
        )

    plan = _get_or_404(db, plan_id)

    if payload.name is not None:
        plan.name = payload.name
    if payload.floor_plan_data is not None:
        plan.floor_plan_data = payload.floor_plan_data

    # Explicitly set updated_at (SQLAlchemy onupdate fires on flush, but setting
    # it here guarantees it even if the ORM decides nothing changed)
    plan.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(plan)
    return FloorPlanResponse.model_validate(plan)


# ── 4. DELETE /api/floor-plans/{id} ───────────────────────────

@router.delete(
    "/{plan_id}",
    response_model=DeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a floor plan",
)
def delete_floor_plan(
    plan_id: str,
    db: Session = Depends(get_db),
) -> DeleteResponse:
    """
    Permanently delete a floor plan by UUID.
    Returns 404 if the plan does not exist.
    """
    plan = _get_or_404(db, plan_id)
    db.delete(plan)
    db.commit()
    return DeleteResponse(
        id=plan_id,
        success=True,
        message=f"Floor plan '{plan_id}' deleted successfully.",
    )
