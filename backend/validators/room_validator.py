from typing import List, Tuple
from models.room_models import Room
from models.response_models import ValidationWarning

class RoomValidator:
    """
    Performs basic structural validation on the list of rooms.
    Ensures that the input is meaningful for further validation.
    """
    @staticmethod
    def validate(rooms: List[Room]) -> Tuple[bool, List[ValidationWarning]]:
        warnings = []
        is_valid = True
        
        if not rooms:
            is_valid = False
            warnings.append(ValidationWarning(
                warning_code="NO_ROOMS",
                message="The plan contains no defined spaces. Please add rooms (bedrooms, kitchens, etc.) to evaluate your layout."
            ))
            
        return is_valid, warnings
