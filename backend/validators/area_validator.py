from typing import List, Tuple
from models.response_models import ValidationWarning

class AreaValidator:
    """
    Validates that the total area of all rooms does not exceed the net usable area of the plot.
    """
    @staticmethod
    def validate(total_used_area: float, usable_area: float) -> Tuple[bool, List[ValidationWarning]]:
        warnings = []
        is_valid = True
        
        if total_used_area > usable_area:
            is_valid = False
            excess = total_used_area - usable_area
            warnings.append(ValidationWarning(
                warning_code="AREA_EXCEEDED",
                message=(
                    f"The total assigned area ({total_used_area:.2f} sq ft) exceeds the "
                    f"usable area limit ({usable_area:.2f} sq ft) by {excess:.2f} sq ft. "
                    "The current layout is overcrowded. Consider reducing room dimensions "
                    "or removing non-essential spaces to fit within the plot boundaries."
                )
            ))
            
        return is_valid, warnings
