import sys
import os

# Add the current directory to sys.path to import local modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.models.plot_models import Plot
from backend.models.room_models import Room as RoomModel
from backend.services.validation_service import ValidationService
from backend.services.calculation_service import CalculationService
from pydantic import BaseModel
from typing import List

# Mock EstimateRequest
class EstimateRequest(BaseModel):
    plot_size_sqft: float
    plot_length_ft: float
    plot_width_ft: float
    number_of_floors: int
    number_of_rooms: int
    number_of_bathrooms: int
    number_of_kitchens: int
    room_sizes: str
    bathroom_sizes: str
    kitchen_sizes: str
    number_of_washingareas: int
    number_of_geysers: int

def parse_to_room_models(size_str, room_type):
    rooms = []
    if not size_str:
        return rooms
    for item in size_str.split(","):
        item = item.strip().lower().replace(" ", "")
        if "x" in item:
            try:
                l, w = map(float, item.split("x"))
                rooms.append(RoomModel(room_type=room_type, length=l, width=w))
            except:
                continue
    return rooms

def test_validation():
    # User Input
    data = EstimateRequest(
        plot_size_sqft=1200,
        plot_length_ft=50,
        plot_width_ft=24,
        number_of_floors=1,
        number_of_rooms=4,
        number_of_bathrooms=1,
        number_of_kitchens=1,
        room_sizes="12x12, 12x12, 12x12, 40x40",
        bathroom_sizes="5x8",
        kitchen_sizes="8x10",
        number_of_washingareas=1,
        number_of_geysers=1
    )

    print(f"Plot Area: {data.plot_length_ft * data.plot_width_ft} sq ft")
    
    validation_rooms = []
    validation_rooms.extend(parse_to_room_models(data.room_sizes, "bedroom"))
    validation_rooms.extend(parse_to_room_models(data.bathroom_sizes, "washroom"))
    validation_rooms.extend(parse_to_room_models(data.kitchen_sizes, "kitchen"))

    print(f"Parsed Rooms: {len(validation_rooms)}")
    for r in validation_rooms:
        print(f"  - {r.room_type}: {r.length}x{r.width}")

    plot = Plot(length=data.plot_length_ft, width=data.plot_width_ft)
    
    v_service = ValidationService()
    v_res = v_service.validate_construction_plan(plot, validation_rooms)

    print(f"\nValidation Result Success: {v_res.success}")
    print(f"Validation Message: {v_res.message}")
    print(f"Total Used Area: {v_res.total_used_area}")
    print(f"Usable Area: {v_res.usable_area}")
    
    if v_res.warnings:
        print("Warnings:")
        for w in v_res.warnings:
            print(f"  - [{w.warning_code}] {w.message}")

if __name__ == "__main__":
    test_validation()
