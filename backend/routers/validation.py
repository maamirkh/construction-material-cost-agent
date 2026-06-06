from fastapi import APIRouter, HTTPException
from typing import List
from models.plot_models import Plot
from models.room_models import Room
from models.response_models import ValidationResponse
from services.validation_service import ValidationService

router = APIRouter()

validation_service = ValidationService()

from pydantic import BaseModel

class PlanValidationRequest(BaseModel):
    plot: Plot
    rooms: List[Room]

@router.post("/validate-plan", response_model=ValidationResponse, tags=["Validation"])
async def validate_plan(request: PlanValidationRequest):
    try:
        response = validation_service.validate_construction_plan(request.plot, request.rooms)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")
