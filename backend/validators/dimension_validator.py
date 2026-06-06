from typing import List, Tuple
from models.room_models import Room
from models.response_models import ValidationWarning
from constants.architectural_rules import ROOM_STANDARDS

class DimensionValidator:
    """
    Ensures that individual room dimensions are within realistic architectural bounds.
    Prevents rooms from being too small (unlivable) or too large (unrealistic).
    """
    @staticmethod
    def validate(rooms: List[Room]) -> Tuple[bool, List[ValidationWarning]]:
        warnings = []
        is_valid = True
        
        for room in rooms:
            rtype = room.room_type.lower().replace(" ", "_")
            standards = None
            
            # Match room type to standards (e.g., 'living_room' matches 'Living Room')
            for key in ROOM_STANDARDS:
                if key in rtype:
                    standards = ROOM_STANDARDS[key]
                    break
            
            if standards:
                # Check for unlivable dimensions (Below Minimum)
                # Orientation agnostic check
                min_l = standards.get("min_length", 0)
                min_w = standards.get("min_width", 0)
                
                if not (
                    (room.length >= min_l and room.width >= min_w) or
                    (room.length >= min_w and room.width >= min_l)
                ):
                    is_valid = False
                    warnings.append(ValidationWarning(
                        warning_code="DIMENSION_TOO_SMALL",
                        message=(
                            f"The {room.room_type} ({room.length}' x {room.width}') falls below "
                            f"architectural minimums ({min_l}' x {min_w}'). "
                            "This space may be unlivable or fail to meet building codes."
                        )
                    ))
                
                # Check for unrealistic dimensions (Above Maximum)
                max_l = standards.get("max_length", 999)
                max_w = standards.get("max_width", 999)
                
                if room.length > max_l or room.width > max_w:
                    warnings.append(ValidationWarning(
                        warning_code="DIMENSION_TOO_LARGE",
                        message=(
                            f"The {room.room_type} dimensions ({room.length}' x {room.width}') are unusually "
                            f"large compared to residential standards ({max_l}' x {max_w}')."
                        )
                    ))
                    
        return is_valid, warnings
