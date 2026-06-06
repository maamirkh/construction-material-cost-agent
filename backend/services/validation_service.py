from typing import List
from models.plot_models import Plot
from models.room_models import Room
from models.response_models import ValidationResponse, ValidationWarning, ValidationSummary
from services.calculation_service import CalculationService
from validators.validation_manager import ValidationManager

class ValidationService:
    """
    Higher-level service that coordinates calculations and validations
    to provide a comprehensive architectural assessment.
    """
    def __init__(self):
        self.calculation_service = CalculationService()
        self.validation_manager = ValidationManager()

    def validate_construction_plan(
        self, 
        plot: Plot, 
        rooms: List[Room]
    ) -> ValidationResponse:
        """
        Validates a construction plan based on plot dimensions and room requirements.
        """
        # 1. Core Calculations
        plot_area = self.calculation_service.calculate_plot_area(plot)
        usable_area = self.calculation_service.calculate_usable_area(plot_area, plot.construction_percentage)
        total_used_area = self.calculation_service.calculate_total_used_area(rooms)
        remaining_area = usable_area - total_used_area
        utilization_ratio = self.calculation_service.calculate_utilization_ratio(total_used_area, usable_area)

        # 2. Comprehensive Validation
        validation_summary, all_warnings = self.validation_manager.validate_plan(
            plot, rooms, plot_area, usable_area, total_used_area, utilization_ratio, remaining_area
        )

        # 3. Success Determination
        # A plan is successful if it meets Area and Dimension standards.
        # Density and Utilization are typically advisory unless extreme.
        overall_success = validation_summary.area_valid and validation_summary.dimension_valid
        
        # 4. Human-friendly summary message
        if overall_success:
            if all_warnings:
                message = "Plan is structurally sound but has optimization warnings."
            else:
                message = "Excellent architectural planning! All standards met."
        else:
            message = "Plan requires revisions to meet architectural standards."

        return ValidationResponse(
            success=overall_success,
            plot_area=plot_area,
            usable_area=usable_area,
            total_used_area=total_used_area,
            remaining_area=remaining_area,
            utilization_ratio=utilization_ratio,
            warnings=all_warnings,
            validation_summary=validation_summary,
            message=message
        )
