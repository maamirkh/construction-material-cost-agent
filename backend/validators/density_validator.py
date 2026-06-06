from typing import List, Tuple
from models.room_models import Room
from models.response_models import ValidationWarning
from constants.architectural_rules import ROOM_STANDARDS

class DensityValidator:
    """
    Analyzes the concentration of rooms relative to the available usable area.
    Prevents unrealistic planning density for both small and large plots.
    """
    @staticmethod
    def validate(rooms: List[Room], usable_area: float) -> Tuple[bool, List[ValidationWarning]]:
        warnings = []
        is_valid = True
        
        # Calculate bedroom density as the primary metric for residential density
        bedrooms = [r for r in rooms if "bedroom" in r.room_type.lower()]
        total_bedrooms = sum(r.quantity for r in bedrooms)
        
        # Intelligent density logic based on average bedroom footprint (including its share of common areas)
        avg_bedroom_area = ROOM_STANDARDS.get("bedroom", {}).get("avg_area", 144.0)
        
        # The dynamic recommended count: Plot size / average footprint
        # We use a 1.25 multiplier to account for minimum essential common spaces (kitchen/bath/hall)
        max_recommended_bedrooms = max(1, int(usable_area // (avg_bedroom_area * 1.25)))
        
        if total_bedrooms > max_recommended_bedrooms:
            # High density is a strong warning, not necessarily a hard failure unless extreme
            severity = "critical" if total_bedrooms > max_recommended_bedrooms * 1.5 else "warning"
            
            message = (
                f"The current layout is high-density ({total_bedrooms} bedrooms). "
                f"For a usable area of {usable_area:.2f} sq ft, the recommended limit is "
                f"{max_recommended_bedrooms} bedrooms to maintain architectural comfort. "
            )
            
            if severity == "critical":
                message += "This density level suggests significant overcrowding that may violate standard living conditions."
            else:
                message += "Consider optimizing room sizes or consolidating spaces."

            warnings.append(ValidationWarning(
                warning_code="HIGH_DENSITY",
                message=message
            ))
            
            # Mark as invalid only if density is extremely unrealistic (e.g., > 150% of recommendation)
            if total_bedrooms > max_recommended_bedrooms * 1.5:
                is_valid = False
            
        return is_valid, warnings
