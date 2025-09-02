# shared_inputs.py

shared_inputs = {
    "plot_size_sqft": None,
    "plot_length_ft": None,
    "plot_width_ft": None,
    "number_of_floors": None,
    "room_sizes": None,
    "bathroom_sizes": None,
    "kitchen_sizes": None,
    "number_of_washingareas": None,
    "number_of_geysers": None,
    "number_of_rooms": None,
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

def get_initial_inputs():
    print("📥 Enter your project details:\n")

    try:
        shared_inputs["plot_size_sqft"] = float(input("Plot size (sqft): "))
        shared_inputs["plot_length_ft"] = float(input("Plot length (ft): "))
        shared_inputs["plot_width_ft"] = float(input("Plot width (ft): "))
        shared_inputs["number_of_floors"] = int(input("Number of floors: "))
        shared_inputs["number_of_rooms"] = int(input("Number of rooms: "))
        shared_inputs["room_sizes"] = input("Room sizes (comma-separated, e.g. 12x12, 14x14): ")
        shared_inputs["bathroom_sizes"] = input("Bathroom sizes (comma-separated): ")
        shared_inputs["kitchen_sizes"] = input("Kitchen sizes (comma-separated): ")
        shared_inputs["number_of_washingareas"] = int(input("Number of washing areas: "))
        shared_inputs["number_of_geysers"] = int(input("Number of geysers: "))

        # Optional: User-defined columns
        columns_input = input("Number of columns [default 14]: ")
        if columns_input:
            shared_inputs["number_of_columns"] = int(columns_input)

        # Underground Tank
        if input("Include underground tank? (y/n): ").lower() == 'y':
            shared_inputs["include_underground_tank"] = True
            shared_inputs["ug_tank_length_ft"] = float(input("Underground tank length (ft) : "))
            shared_inputs["ug_tank_width_ft"] = float(input("Underground tank width (ft) : "))
        else:
            shared_inputs["include_underground_tank"] = False

        # Overhead Tank
        if input("Include overhead tank? (y/n): ").lower() == 'y':
            shared_inputs["include_overhead_tank"] = True
            shared_inputs["oh_tank_length_ft"] = float(input("Overhead tank length (ft) : "))
            shared_inputs["oh_tank_width_ft"] = float(input("Overhead tank width (ft) : "))
        else:
            shared_inputs["include_overhead_tank"] = False

        if input("include_tower? (y/n): ").lower() == 'y':
            shared_inputs["include_tower"] = True
            shared_inputs["tower_length_ft"] = float(input("Tower length (ft) : "))
            shared_inputs["tower_width_ft"] = float(input("Tower width (ft) : "))
        else:
            shared_inputs["include_tower"] = False

    except Exception as e:
        print(f"❌ Input error: {e}")


