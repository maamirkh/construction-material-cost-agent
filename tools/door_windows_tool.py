# tools/doors_windows_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs


def doors_windows_logic() -> dict:
    try:
        # 🏗️ Load shared inputs
        number_of_floors = shared_inputs["number_of_floors"]
        number_of_rooms = shared_inputs["number_of_rooms"]
        bathroom_sizes = shared_inputs["bathroom_sizes"]
        kitchen_sizes = shared_inputs["kitchen_sizes"]

        number_of_bathrooms = len([b for b in bathroom_sizes.split(",") if b.strip()])
        number_of_kitchens = len([k for k in kitchen_sizes.split(",") if k.strip()])

        # 💵 Load prices
        with open("material_prices.json") as f:
            prices = json.load(f)

        # 🚪 Door Counts
        main_door = 1
        washing_area_door = 1
        balcony_door = 1
        tower_door = 1

        room_doors = number_of_rooms * number_of_floors
        bathroom_doors = number_of_bathrooms * number_of_floors
        kitchen_doors = number_of_kitchens * number_of_floors

        total_doors = (
            main_door + washing_area_door + balcony_door + tower_door +
            room_doors + bathroom_doors + kitchen_doors
        )

        # 🪟 Window Counts
        floor_windows = 4 * number_of_floors
        room_windows = number_of_rooms
        bathroom_windows = number_of_bathrooms
        kitchen_windows = number_of_kitchens
        washing_window = 1
        balcony_window = 1
        tower_window = 1

        total_windows = (
            floor_windows + room_windows + bathroom_windows +
            kitchen_windows + washing_window + balcony_window + tower_window
        )

        # 📏 Door Area (sq ft)
        door_area_sft = (
            main_door * 4 * 7 +
            (room_doors + kitchen_doors) * 3 * 7 +
            (bathroom_doors + washing_area_door) * 3 * 6.5 +
            (balcony_door + tower_door) * 3 * 7
        )

        # 📏 Window Area (sq ft)
        window_area_sft = (
            room_windows * 4 * 4 +
            kitchen_windows * 3 * 3 +
            bathroom_windows * 2 * 2 +
            washing_window * 2 * 2 +
            balcony_window * 4 * 4 +
            tower_window * 2 * 2 +
            floor_windows * 4 * 4
        )

        # 📐 Chokhat Running Feet
        door_frame_rft = (
            main_door * (4 + 7 + 7) +
            (room_doors + kitchen_doors + balcony_door + tower_door) * (3 + 7 + 7) +
            (bathroom_doors + washing_area_door) * (3 + 6.5 + 6.5)
        )

        window_frame_rft = (
            room_windows * (4 * 4) +
            kitchen_windows * (3 * 4) +
            bathroom_windows * (2 * 4) +
            washing_window * (2 * 4) +
            balcony_window * (4 * 4) +
            tower_window * (2 * 4) +
            floor_windows * (4 * 4)
        )

        total_chokhat_rft = door_frame_rft + window_frame_rft

        door_lock = total_doors
        bolts = total_doors
        door_stopper = total_doors

        # 💰 Prices
        door_rate = prices["door"]["price_per_sft"]
        window_rate = prices["window"]["price_per_sft"]
        door_window_frame_rate = prices["door_window_frame"]["price_per_rft"]
        door_lock_rate = prices["door_lock"]["price_per_lock"]
        bolt_rate = prices["bolt"]["price_per_bolt"]
        door_stopper_rate = prices["door_stopper"]["price_per_stopper"]

        # 💰 Costs
        door_cost = round(door_area_sft * door_rate)
        window_cost = round(window_area_sft * window_rate)
        door_windows_frame_cost = round(total_chokhat_rft * door_window_frame_rate)
        door_lock_cost = round(door_lock * door_lock_rate)
        bolt_cost = round(bolts * bolt_rate)
        door_stopper_cost = round(door_stopper * door_stopper_rate)
        total_cost = door_cost + window_cost + door_windows_frame_cost + door_lock_cost + bolt_cost + door_stopper_cost


        result = {
            "total_doors_qty": round(total_doors, 2),
            "total_windows_qty": round(total_windows, 2),
            "door_area_sft": round(door_area_sft, 2),
            "window_area_sft": round(window_area_sft, 2),
            "total_chokhat_rft": round(total_chokhat_rft, 2),
            "door_cost": door_cost,
            "window_cost": window_cost,
            "chokhat_cost": door_windows_frame_cost,
            "door_lock_cost": door_lock_cost,
            "bolt_cost": bolt_cost,
            "door_stopper_cost": door_stopper_cost,
            "total_cost": total_cost
        }

        # 🔁 Store in shared_inputs for next tools
        shared_inputs["doors_windows_data"] = result
        return result

    except Exception as e:
        return {"error": f"❌ Failed to calculate doors/windows: {str(e)}"}


# ✅ Use in agent chaining
doors_windows_tool_func = doors_windows_logic

# ✅ Decorate for OpenAI function_calling / SDK
doors_windows_tool = function_tool(doors_windows_logic)
