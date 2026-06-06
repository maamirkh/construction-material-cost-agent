from typing import List, Tuple
from models.response_models import ValidationWarning
from constants.architectural_rules import MIN_CIRCULATION_PERCENTAGE

class CirculationValidator:
    """
    Ensures that enough 'free' space is left for movement, walls, and services.
    A layout that assigns 100% of usable area to rooms is physically impossible to build.
    """
    @staticmethod
    def validate(remaining_area: float, usable_area: float) -> Tuple[bool, List[ValidationWarning]]:
        warnings = []
        is_valid = True
        
        if usable_area <= 0:
            return is_valid, warnings

        # Heuristic: Minimum percentage of usable area should remain unassigned
        minimum_circulation_area = usable_area * MIN_CIRCULATION_PERCENTAGE
        
        if remaining_area < minimum_circulation_area:
            warnings.append(ValidationWarning(
                warning_code="POTENTIAL_CIRCULATION_ISSUE",
                message=(
                    f"Only {remaining_area:.1f} sq ft remains for circulation and walls, "
                    f"which is less than the recommended {minimum_circulation_area:.1f} sq ft "
                    f"({MIN_CIRCULATION_PERCENTAGE:.0%} of usable area). "
                    "This layout may be difficult to implement without compromising passage widths or wall thicknesses."
                )
            ))
            
        return is_valid, warnings
