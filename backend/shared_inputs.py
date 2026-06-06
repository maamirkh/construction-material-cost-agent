import re

# shared_inputs.py

shared_inputs = {
    "plot_size_sqft": None,
    "plot_length_ft": None,
    "plot_width_ft": None,
    "construction_percentage": 100.0,
    "number_of_floors": None,
    "number_of_rooms": None,
    "number_of_bathrooms": None,
    "number_of_kitchens": None,
    "room_sizes": None,
    "bathroom_sizes": None,
    "kitchen_sizes": None,
    "number_of_washingareas": None,
    "number_of_geysers": None,
    "number_of_columns": 14,
    "include_underground_tank": False,
    "ug_tank_length_ft": None,
    "ug_tank_width_ft": None,
    "include_overhead_tank": False,
    "oh_tank_length_ft": None,
    "oh_tank_width_ft": None,
    "include_tower": False,
    "tower_length_ft": None,
    "tower_width_ft": None
}

def _parse_sizes(sizes_str):
    """Parses a comma-separated string of WxL dimensions into a list of areas."""
    areas = []
    if not sizes_str:
        return areas
    
    parts = sizes_str.split(',')
    for part in parts:
        part = part.strip()
        if not part:
            continue
        match = re.match(r'(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)', part, re.IGNORECASE)
        if match:
            try:
                width = float(match.group(1))
                length = float(match.group(3))
                areas.append(width * length)
            except ValueError:
                # Should not happen if regex matches floats, but for safety
                raise ValueError(f"Invalid dimension format in '{part}'. Expected 'WxL'.")
        else:
            raise ValueError(f"Invalid dimension format in '{part}'. Expected 'WxL'.")
    return areas

def get_validated_input(prompt, type_func, validation_func=None, error_message="Invalid input. Please try again."):
    """Handles input prompting, type conversion, and optional validation."""
    while True:
        user_input = input(prompt)
        try:
            value = type_func(user_input)
            if validation_func:
                if not validation_func(value):
                    print(f"❌ {error_message}")
                    continue
            return value
        except ValueError:
            print(f"❌ Invalid format. Please enter a valid {type_func.__name__} value.")

def get_initial_inputs():
    print("📥 Enter your project details:\n")

    # Plot Details
    while True:
        try:
            plot_size_sqft = get_validated_input(
                "Plot size (sqft): ", float,
                lambda x: x > 0, "Plot size must be greater than 0."
            )
            plot_length_ft = get_validated_input(
                "Plot length (ft): ", float,
                lambda x: x > 0, "Plot length must be greater than 0."
            )
            plot_width_ft = get_validated_input(
                "Plot width (ft): ", float,
                lambda x: x > 0, "Plot width must be greater than 0."
            )

            # Validate consistency: plot_length * plot_width should be close to plot_size_sqft
            calculated_plot_sqft = plot_length_ft * plot_width_ft
            if not (0.95 * plot_size_sqft <= calculated_plot_sqft <= 1.05 * plot_size_sqft):
                print(f"❌ Warning: Plot length ({plot_length_ft}ft) * width ({plot_width_ft}ft) = {calculated_plot_sqft:.2f} sqft, "
                      f"which is significantly different from the entered Plot size ({plot_size_sqft} sqft). "
                      "Please re-enter plot details for consistency.")
                continue
            
            shared_inputs["plot_size_sqft"] = plot_size_sqft
            shared_inputs["plot_length_ft"] = plot_length_ft
            shared_inputs["plot_width_ft"] = plot_width_ft
            
            shared_inputs["construction_percentage"] = get_validated_input(
                "Construction area percentage (0-100) [default 100]: ", float,
                lambda x: 0 <= x <= 100, "Percentage must be between 0 and 100."
            )
            break
        except Exception as e:
            print(f"❌ Error during plot input: {e}")
            print("Please re-enter all plot details.")
            continue

    try:
        shared_inputs["number_of_floors"] = get_validated_input(
            "Number of floors: ", int,
            lambda x: x >= 1, "Number of floors must be at least 1."
        )
        
        num_rooms_per_floor = get_validated_input(
            "Number of rooms (per floor): ", int,
            lambda x: x >= 0, "Number of rooms cannot be negative."
        )
        shared_inputs["number_of_rooms"] = num_rooms_per_floor

        num_bathrooms_per_floor = get_validated_input(
            "Number of bathrooms (per floor): ", int,
            lambda x: x >= 0, "Number of bathrooms cannot be negative."
        )
        shared_inputs["number_of_bathrooms"] = num_bathrooms_per_floor

        num_kitchens_per_floor = get_validated_input(
            "Number of kitchens (per floor): ", int,
            lambda x: x >= 0, "Number of kitchens cannot be negative."
        )
        shared_inputs["number_of_kitchens"] = num_kitchens_per_floor

        # Basic validation for counts vs plot size (e.g., too many rooms for the plot)
        # This will be more thoroughly validated with actual room sizes.
        total_rooms_possible = int(shared_inputs["plot_size_sqft"] / 100) # Assuming avg 10x10 room
        if num_rooms_per_floor > total_rooms_possible * shared_inputs["number_of_floors"]:
            print(f"⚠️ Warning: {num_rooms_per_floor} rooms per floor for {shared_inputs['number_of_floors']} floors "
                  f"seems excessive for a {shared_inputs['plot_size_sqft']} sqft plot. "
                  "Consider reviewing your input. Proceeding anyway.")
        
        if num_bathrooms_per_floor > num_rooms_per_floor + shared_inputs["number_of_kitchens"]:
             print(f"⚠️ Warning: {num_bathrooms_per_floor} bathrooms per floor seems high compared to "
                  f"{num_rooms_per_floor} rooms and {num_kitchens_per_floor} kitchens. "
                  "Consider reviewing your input. Proceeding anyway.")


        while True:
            room_sizes_str = input("Room sizes (comma-separated, e.g. 12x12, 14x14): ")
            try:
                room_areas = _parse_sizes(room_sizes_str)
                if len(room_areas) != num_rooms_per_floor:
                    print(f"❌ Error: Expected {num_rooms_per_floor} room sizes, but received {len(room_areas)}. Please re-enter.")
                    continue
                shared_inputs["room_sizes"] = room_sizes_str
                break
            except ValueError as e:
                print(f"❌ Input error: {e}. Please re-enter room sizes.")
        
        while True:
            bathroom_sizes_str = input("Bathroom sizes (comma-separated): ")
            try:
                bathroom_areas = _parse_sizes(bathroom_sizes_str)
                if len(bathroom_areas) != num_bathrooms_per_floor:
                    print(f"❌ Error: Expected {num_bathrooms_per_floor} bathroom sizes, but received {len(bathroom_areas)}. Please re-enter.")
                    continue
                shared_inputs["bathroom_sizes"] = bathroom_sizes_str
                break
            except ValueError as e:
                print(f"❌ Input error: {e}. Please re-enter bathroom sizes.")

        while True:
            kitchen_sizes_str = input("Kitchen sizes (comma-separated): ")
            try:
                kitchen_areas = _parse_sizes(kitchen_sizes_str)
                if len(kitchen_areas) != num_kitchens_per_floor:
                    print(f"❌ Error: Expected {num_kitchens_per_floor} kitchen sizes, but received {len(kitchen_areas)}. Please re-enter.")
                    continue
                shared_inputs["kitchen_sizes"] = kitchen_sizes_str
                break
            except ValueError as e:
                print(f"❌ Input error: {e}. Please re-enter kitchen sizes.")

        # Validate total area of rooms/bathrooms/kitchens against plot size
        total_internal_area_per_floor = sum(room_areas) + sum(bathroom_areas) + sum(kitchen_areas)
        
        # Use user-defined construction percentage if available
        efficiency = (shared_inputs.get("construction_percentage", 100.0) / 100.0)
        max_allowed_area_per_floor = shared_inputs["plot_size_sqft"] * efficiency
        
        if total_internal_area_per_floor > max_allowed_area_per_floor:
            print(f"❌ Error: The total area of rooms, bathrooms, and kitchens ({total_internal_area_per_floor:.2f} sqft per floor) "
                  f"exceeds your specified limit ({max_allowed_area_per_floor:.2f} sqft). "
                  "Please reduce the number or sizes of rooms/bathrooms/kitchens and re-enter.")
            # This is a critical error, so we should re-prompt for these sections
            raise ValueError("Area constraint violation") # Raise to trigger re-entry of previous block

        shared_inputs["number_of_washingareas"] = get_validated_input(
            "Number of washing areas: ", int,
            lambda x: x >= 0, "Number of washing areas cannot be negative."
        )
        shared_inputs["number_of_geysers"] = get_validated_input(
            "Number of geysers: ", int,
            lambda x: x >= 0, "Number of geysers cannot be negative."
        )

        # Optional: User-defined columns
        columns_input = input("Number of columns [default 14]: ")
        if columns_input:
            shared_inputs["number_of_columns"] = get_validated_input(
                f"Number of columns [default {shared_inputs['number_of_columns']}]: ", int,
                lambda x: x > 0, "Number of columns must be positive."
            )

        # Underground Tank
        include_ug_tank = input("Include underground tank? (y/n): ").lower() == 'y'
        shared_inputs["include_underground_tank"] = include_ug_tank
        if include_ug_tank:
            shared_inputs["ug_tank_length_ft"] = get_validated_input(
                "Underground tank length (ft) : ", float,
                lambda x: x > 0, "Tank length must be positive."
            )
            shared_inputs["ug_tank_width_ft"] = get_validated_input(
                "Underground tank width (ft) : ", float,
                lambda x: x > 0, "Tank width must be positive."
            )

        # Overhead Tank
        include_oh_tank = input("Include overhead tank? (y/n): ").lower() == 'y'
        shared_inputs["include_overhead_tank"] = include_oh_tank
        if include_oh_tank:
            shared_inputs["oh_tank_length_ft"] = get_validated_input(
                "Overhead tank length (ft) : ", float,
                lambda x: x > 0, "Tank length must be positive."
            )
            shared_inputs["oh_tank_width_ft"] = get_validated_input(
                "Overhead tank width (ft) : ", float,
                lambda x: x > 0, "Tank width must be positive."
            )

        # Tower
        include_tower = input("Include tower? (y/n): ").lower() == 'y'
        shared_inputs["include_tower"] = include_tower
        if include_tower:
            shared_inputs["tower_length_ft"] = get_validated_input(
                "Tower length (ft) : ", float,
                lambda x: x > 0, "Tower length must be positive."
            )
            shared_inputs["tower_width_ft"] = get_validated_input(
                "Tower width (ft) : ", float,
                lambda x: x > 0, "Tower width must be positive."
            )
    except ValueError as e:
        print(f"❌ Critical input error: {e}. Please restart the input process.")
        get_initial_inputs() # Re-call to restart the entire process if a critical error occurs.
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        print("Please restart the input process.")
        get_initial_inputs()


