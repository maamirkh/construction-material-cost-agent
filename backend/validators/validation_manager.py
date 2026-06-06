from typing import List, Tuple
from models.plot_models import Plot
from models.room_models import Room
from models.response_models import ValidationWarning, ValidationSummary
from validators.area_validator import AreaValidator
from validators.density_validator import DensityValidator
from validators.dimension_validator import DimensionValidator
from validators.utilization_validator import UtilizationValidator
from validators.circulation_validator import CirculationValidator
from validators.room_validator import RoomValidator

class ValidationManager:
    """
    Orchestrates the architectural validation process by coordinating 
    multiple specialized validators.
    """
    def validate_plan(
        self, 
        plot: Plot, 
        rooms: List[Room], 
        plot_area: float,
        usable_area: float,
        total_used_area: float,
        utilization_ratio: float,
        remaining_area: float
    ) -> Tuple[ValidationSummary, List[ValidationWarning]]:
        """
        Executes all registered validations and returns a consolidated summary 
        and warning list.
        """
        all_warnings: List[ValidationWarning] = []
        
        # 1. Initial Structural Check: Are there any rooms?
        room_valid, room_warnings = RoomValidator.validate(rooms)
        all_warnings.extend(room_warnings)
        
        if not room_valid:
            return ValidationSummary(
                area_valid=False,
                density_valid=False,
                dimension_valid=False,
                utilization_valid=False
            ), all_warnings

        # 2. Individual Specialized Validations
        area_valid, area_warnings = AreaValidator.validate(total_used_area, usable_area)
        all_warnings.extend(area_warnings)

        dimension_valid, dimension_warnings = DimensionValidator.validate(rooms)
        all_warnings.extend(dimension_warnings)

        density_valid, density_warnings = DensityValidator.validate(rooms, usable_area)
        all_warnings.extend(density_warnings)

        utilization_valid, utilization_warnings = UtilizationValidator.validate(utilization_ratio, usable_area)
        all_warnings.extend(utilization_warnings)

        circulation_valid, circulation_warnings = CirculationValidator.validate(remaining_area, usable_area)
        all_warnings.extend(circulation_warnings)

        # 3. Construct Summary
        summary = ValidationSummary(
            area_valid=area_valid,
            density_valid=density_valid,
            dimension_valid=dimension_valid,
            utilization_valid=utilization_valid
        )
        
        return summary, all_warnings
