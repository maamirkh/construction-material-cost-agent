from typing import List, Tuple
from models.response_models import ValidationWarning
from constants.architectural_rules import UTILIZATION_LOW, UTILIZATION_HIGH

class UtilizationValidator:
    """
    Evaluates how effectively the plot area is being used. 
    Flags both under-utilization (inefficiency) and over-utilization (overcrowding).
    """
    @staticmethod
    def validate(utilization_ratio: float, usable_area: float) -> Tuple[bool, List[ValidationWarning]]:
        warnings = []
        is_valid = True
        
        if utilization_ratio < UTILIZATION_LOW:
            warnings.append(ValidationWarning(
                warning_code="LOW_UTILIZATION",
                message=(
                    f"Space utilization is currently low ({utilization_ratio:.1%}). "
                    f"Out of {usable_area:.0f} sq ft of usable area, significant space remains unassigned. "
                    "Consider adding more functional rooms or increasing room dimensions to optimize land use."
                )
            ))
        elif utilization_ratio > UTILIZATION_HIGH:
            # Over-utilization is a concern for circulation and light
            warnings.append(ValidationWarning(
                warning_code="OVER_UTILIZATION",
                message=(
                    f"Space utilization is very high ({utilization_ratio:.1%}). "
                    "This suggests a very dense plan with minimal space for corridors, stairs, and ventilation. "
                    "Ensure that all structural and service requirements (pipes, conduits, walls) can be accommodated."
                )
            ))
            
        return is_valid, warnings
