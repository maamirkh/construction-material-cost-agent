"""
Architectural Rules and Standards for Residential Planning.

This module contains the foundational constants and heuristics used by the 
dynamic validation engine. These standards are based on international 
residential planning guidelines and adapted for a dynamic, scale-agnostic 
validation approach.
"""

# RESIDENTIAL_EFFICIENCY defines the usable footprint of a plot.
# The remaining area is reserved for walls, stairs, circulation, setbacks, 
# and ventilation. Default is now 100% as per user request, but can be 
# overridden by user input.
RESIDENTIAL_EFFICIENCY = 1.00

# Room Area Standards (in sq ft)
# These values define the minimum, recommended, and maximum dimensions
# for standard residential rooms. The engine uses these to validate 
# individual room feasibility and plot-wide density.
ROOM_STANDARDS = {
    "bedroom": {
        "min_width": 10.0,
        "min_length": 10.0,
        "recommended_width": 12.0,
        "recommended_length": 12.0,
        "max_width": 20.0,
        "max_length": 25.0,
        "avg_area": 144.0  # 12x12
    },
    "kitchen": {
        "min_width": 6.0,
        "min_length": 8.0,
        "recommended_width": 8.0,
        "recommended_length": 10.0,
        "max_width": 15.0,
        "max_length": 20.0,
        "avg_area": 80.0  # 8x10
    },
    "washroom": {
        "min_width": 4.0,
        "min_length": 6.0,
        "recommended_width": 5.0,
        "recommended_length": 8.0,
        "max_width": 12.0,
        "max_length": 15.0,
        "avg_area": 40.0  # 5x8
    },
    "living_room": {
        "min_width": 12.0,
        "min_length": 14.0,
        "recommended_width": 15.0,
        "recommended_length": 18.0,
        "max_width": 30.0,
        "max_length": 40.0,
        "avg_area": 250.0
    }
}

# Utilization Thresholds for Space Planning
# LOW (< 40%): Suggests inefficient use of land or "dead" space.
# HIGH (> 95%): Suggests overcrowding, poor circulation, or violation of local bylaws.
UTILIZATION_LOW = 0.40
UTILIZATION_HIGH = 0.95

# Circulation Heuristics
# Minimum percentage of usable area that should be left unassigned for 
# movement, services, and structural elements.
MIN_CIRCULATION_PERCENTAGE = 0.15
