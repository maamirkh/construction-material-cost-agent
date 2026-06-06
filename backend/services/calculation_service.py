from typing import List
from models.plot_models import Plot
from models.room_models import Room
from constants.architectural_rules import RESIDENTIAL_EFFICIENCY

class CalculationService:
    @staticmethod
    def calculate_plot_area(plot: Plot) -> float:
        return plot.length * plot.width

    @staticmethod
    def calculate_usable_area(plot_area: float, construction_percentage: float = None) -> float:
        efficiency = (construction_percentage / 100.0) if construction_percentage is not None else RESIDENTIAL_EFFICIENCY
        return plot_area * efficiency

    @staticmethod
    def calculate_room_area(room: Room) -> float:
        return room.length * room.width * room.quantity

    @staticmethod
    def calculate_total_used_area(rooms: List[Room]) -> float:
        return sum(CalculationService.calculate_room_area(room) for room in rooms)

    @staticmethod
    def calculate_utilization_ratio(used_area: float, usable_area: float) -> float:
        if usable_area == 0:
            return 0
        return used_area / usable_area
