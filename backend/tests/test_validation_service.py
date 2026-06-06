import pytest
from models.plot_models import Plot
from models.room_models import Room
from services.validation_service import ValidationService
from constants.architectural_rules import RESIDENTIAL_EFFICIENCY, ROOM_STANDARDS, UTILIZATION_LOW, UTILIZATION_HIGH

# Initialize the service
# Note: Use relative imports or adjust sys.path if running outside of a standard test runner
validation_service = ValidationService()

def test_valid_plan_sufficient_area():
    plot = Plot(length=50.0, width=100.0)  # 5000 sq ft
    rooms = [
        Room(room_type="bedroom", length=12.0, width=12.0, quantity=3),  # 3 * 144 = 432
        Room(room_type="kitchen", length=10.0, width=8.0, quantity=1),   # 80
        Room(room_type="washroom", length=8.0, width=5.0, quantity=2)    # 2 * 40 = 80 (swapped orientation)
    ]
    # Total used = 432 + 80 + 80 = 592 sq ft
    # Usable area = 5000 * 0.80 = 4000 sq ft

    response = validation_service.validate_construction_plan(plot, rooms)

    assert response.success is True
    assert response.plot_area == 5000.0
    assert response.usable_area == 4000.0
    assert response.total_used_area == 592.0
    assert response.validation_summary.area_valid is True
    assert response.validation_summary.dimension_valid is True
    assert any(w.warning_code == "LOW_UTILIZATION" for w in response.warnings)


def test_invalid_plan_area_exceeded():
    plot = Plot(length=10.0, width=10.0)  # 100 sq ft
    rooms = [
        Room(room_type="bedroom", length=12.0, width=12.0, quantity=1)  # 144 sq ft
    ]
    # Usable area = 100 * 0.80 = 80 sq ft

    response = validation_service.validate_construction_plan(plot, rooms)

    assert response.success is False
    assert response.validation_summary.area_valid is False
    assert any(w.warning_code == "AREA_EXCEEDED" for w in response.warnings)

def test_invalid_dimension_too_small():
    plot = Plot(length=20.0, width=20.0)
    rooms = [
        Room(room_type="bedroom", length=5.0, width=5.0, quantity=1)
    ]

    response = validation_service.validate_construction_plan(plot, rooms)

    assert response.success is False
    assert response.validation_summary.dimension_valid is False
    assert any(w.warning_code == "DIMENSION_TOO_SMALL" for w in response.warnings)

def test_warning_high_density_critical():
    plot = Plot(length=20.0, width=20.0)  # 400 sq ft -> 320 usable
    # Recommended: 320 // (144 * 1.25) = 320 // 180 = 1
    # Critical: > 1 * 1.5 = 1.5 (so 2 or more)
    rooms = [
        Room(room_type="bedroom", length=10.0, width=10.0, quantity=3)
    ]

    response = validation_service.validate_construction_plan(plot, rooms)
    
    # 3 bedrooms in 320 usable is extremely dense (> 1.5x recommendation)
    assert response.validation_summary.density_valid is False 
    assert any(w.warning_code == "HIGH_DENSITY" for w in response.warnings)

def test_no_rooms_in_plan():
    plot = Plot(length=20.0, width=20.0)
    rooms = []

    response = validation_service.validate_construction_plan(plot, rooms)

    assert response.success is False
    assert any(w.warning_code == "NO_ROOMS" for w in response.warnings)
