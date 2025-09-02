# tools/gray_structure_tool.py
import json
from agents import function_tool
from shared_inputs import shared_inputs

def gray_structure_logic(
    number_of_floors: int = None,
    room_sizes: str = None,
    bathroom_sizes: str = None,
    kitchen_sizes: str = None,
    plot_length_ft: float = None,
    plot_width_ft: float = None,
    number_of_rooms: int = None,
    number_of_columns: int = None,
    include_underground_tank: bool = None,
    ug_tank_length_ft: float = None,
    ug_tank_width_ft: float = None,
    include_overhead_tank: bool = None,
    oh_tank_length_ft: float = None,
    oh_tank_width_ft: float = None,
    include_tower: bool = None,
    tower_length_ft: float = None,
    tower_width_ft: float = None,
) -> dict:

    # --- Fallback to shared_inputs if args are None ---
    number_of_floors = number_of_floors or shared_inputs.get("number_of_floors")
    room_sizes = room_sizes or shared_inputs.get("room_sizes")
    bathroom_sizes = bathroom_sizes or shared_inputs.get("bathroom_sizes")
    kitchen_sizes = kitchen_sizes or shared_inputs.get("kitchen_sizes")
    plot_length_ft = plot_length_ft or shared_inputs.get("plot_length_ft")
    plot_width_ft = plot_width_ft or shared_inputs.get("plot_width_ft")
    number_of_rooms = number_of_rooms or shared_inputs.get("number_of_rooms")
    number_of_columns = number_of_columns or shared_inputs.get("number_of_columns")

    include_underground_tank = (
        include_underground_tank
        if include_underground_tank is not None
        else shared_inputs.get("include_underground_tank", False)
    )
    ug_tank_length_ft = ug_tank_length_ft or shared_inputs.get("ug_tank_length_ft", 0.0)
    ug_tank_width_ft = ug_tank_width_ft or shared_inputs.get("ug_tank_width_ft", 0.0)

    include_overhead_tank = (
        include_overhead_tank
        if include_overhead_tank is not None
        else shared_inputs.get("include_overhead_tank", False)
    )
    oh_tank_length_ft = oh_tank_length_ft or shared_inputs.get("oh_tank_length_ft", 0.0)
    oh_tank_width_ft = oh_tank_width_ft or shared_inputs.get("oh_tank_width_ft", 0.0)

    include_tower = (
        include_tower
        if include_tower is not None
        else shared_inputs.get("include_tower", False)
    )
    tower_length_ft = tower_length_ft or shared_inputs.get("tower_length_ft", 0.0)
    tower_width_ft = tower_width_ft or shared_inputs.get("tower_width_ft", 0.0)

    # --- Defaults if tank/tower included but no size provided ---
    if include_underground_tank:
        ug_tank_length_ft = ug_tank_length_ft if ug_tank_length_ft > 0 else 8.0
        ug_tank_width_ft = ug_tank_width_ft if ug_tank_width_ft > 0 else 6.0
    else:
        ug_tank_length_ft = ug_tank_width_ft = 0.0

    if include_overhead_tank:
        oh_tank_length_ft = oh_tank_length_ft if oh_tank_length_ft > 0 else 6.0
        oh_tank_width_ft = oh_tank_width_ft if oh_tank_width_ft > 0 else 5.0
    else:
        oh_tank_length_ft = oh_tank_width_ft = 0.0

    if include_tower:
        tower_length_ft = tower_length_ft if tower_length_ft > 0 else 6.0
        tower_width_ft = tower_width_ft if tower_width_ft > 0 else 6.0
    else:
        tower_length_ft = tower_width_ft = 0.0
        

    try:
        with open("material_prices.json", "r") as file:
            prices = json.load(file)
    except Exception as e:
        return {"error": f"Failed to load material_prices.json: {str(e)}"}

    # -------------------- BRICKS --------------------
    def parse_sizes(size_str):
        sizes = []
        for item in size_str.split(","):
            item = item.strip().lower().replace(" ", "")
            if "x" in item:
                try:
                    l, w = map(float, item.split("x"))
                    sizes.append((l, w))
                except:
                    continue
        return sizes

    room_list = parse_sizes(room_sizes)
    bath_list = parse_sizes(bathroom_sizes)
    kitchen_list = parse_sizes(kitchen_sizes)

    if not room_list:
        room_list = [(12, 12)] * number_of_rooms
    if not bath_list:
        bath_list = [(6, 6)] * number_of_rooms
    if not kitchen_list:
        kitchen_list = [(8, 10)]

    all_rooms = room_list + bath_list + kitchen_list
    bath_wall_list = bath_list

    wall_height = 9
    total_wall_area = 0
    total_bath_wall_area = 0
    total_ceiling_area = 0
    for length, width in all_rooms:
        perimeter = 2 * (length + width)
        wall_area = perimeter * wall_height
        total_wall_area += wall_area
        ceiling_area = length * width
        total_ceiling_area += ceiling_area

    for length, width in bath_wall_list:
        bath_perimeter = 2 * (length + width)
        bath_wall_area = bath_perimeter * wall_height
        total_bath_wall_area += bath_wall_area

    total_ceiling_area *= number_of_floors
    total_wall_area *= number_of_floors * 0.85 # less 15% bricks
    bricks_per_sqft = 1.5
    estimated_bricks = int(total_wall_area * bricks_per_sqft)
    brick_price = prices.get("bricks", {}).get("price_per_brick", 0)
    estimated_brick_cost = int(estimated_bricks * brick_price)

    shared_inputs["bricks_data"] = {
        "estimated_bricks": estimated_bricks,
        "estimated_bricks_cost": estimated_brick_cost, 
        "total_wall_area_sqft": total_wall_area
    }

    # -------------------- CEMENT MORTAR --------------------
    cement_price = prices.get("cement", {}).get("price_per_bag", 0)
    sand_price = prices.get("sand", {}).get("price_per_cft", 0)
    rohri_price = prices.get("rohri", {}).get("price_per_cft", 0)
    floor_tiles_price = prices.get("flooring_tiles", {}).get("tiles_per_cmt", 0)
    bath_tiles_price = prices.get("flooring_tiles", {}).get("tiles_per_cmt", 0)
    floor_area = sum(l * w for l, w in all_rooms) * number_of_floors


    cement_bags_masonry = estimated_bricks / 200
    sand_cft_masonry = cement_bags_masonry * 7.5

    plaster_volume = (total_wall_area + total_ceiling_area) * 2 * 0.042  # plaster both sides of wall
    cement_bags_plaster = (plaster_volume * 0.2) / 1.25    # 1 : 4 ratio 1/5
    sand_cft_plaster = plaster_volume * 0.8     # 1 : 4 ratio 4/5

    flooring_volume = floor_area * 0.25
    cement_bags_flooring = (flooring_volume * 0.2) / 1.25     # 1 : 4 ratio 1/5
    sand_cft_flooring = flooring_volume * 0.8     # 1 : 4 ratio 4/5

    total_bath_wall_area *= number_of_floors
    flooring_tiles = floor_area / 10.7639
    bath_wall_tiles = total_bath_wall_area / 10.7639

    base_ground = plot_length_ft * plot_width_ft * 0.5
    cement_bags_base_ground = (base_ground * 0.2) / 1.25
    sand_base_ground = base_ground * 0.8
    rohri_volume = plot_length_ft * plot_width_ft * (6 / 12)

    total_cement_bags = cement_bags_masonry + cement_bags_plaster + cement_bags_flooring + cement_bags_base_ground
    total_sand_cft = sand_cft_masonry + sand_cft_plaster + sand_cft_flooring + sand_base_ground
    total_cement_cost = total_cement_bags * cement_price
    total_sand_cost = total_sand_cft * sand_price
    rohri_cost = rohri_volume * rohri_price
    floor_tiles_cost = flooring_tiles * floor_tiles_price
    bath_tiles_cost = bath_wall_tiles * bath_tiles_price
    total_mortar_cost = total_cement_cost + total_sand_cost + rohri_cost + floor_tiles_cost + bath_tiles_cost

    shared_inputs["cement_mortar_data"] = {
        "plaster_volume_sft": plaster_volume,
        "cement_bags": total_cement_bags,
        "sand_cft": total_sand_cft,
        "rohri_cft": rohri_volume,
        "floor_tiles_cft": flooring_tiles,
        "bath_wall_tiles_cft": bath_wall_tiles,
    }

    # -------------------- CONCRETE MIX --------------------
    bajri_price = prices.get("bajri", {}).get("price_per_cft", 0)
    crush_price = prices.get("crush", {}).get("price_per_cft", 0)
    marble_step_price = prices.get("marble_steps", {}).get("step_per_pcs", 0)

    # all volumes in cubic feet cft
    base_concrete = 50 * number_of_columns         # digginig 5(length) x 5(width) x 2(heigth) concrete filling
    short_col_concrete = 4 * number_of_columns     # 2(width) x 0.5(thickness) x 4(heigth)
    full_col_concrete = 10.5 * number_of_columns   # 2(width) x 0.5(thickness) x 10.5(heigth)
    wall_length = ((plot_length_ft + plot_width_ft) * 2) + (number_of_rooms * 20)
    plinth_volume = wall_length * 2 * 0.5
    slab_volume = (plot_length_ft * plot_width_ft) * 0.42 * number_of_floors    # 0.42 = 5 inches
    beam_length = (2 * (plot_length_ft + plot_width_ft)) + (number_of_rooms * 10) 
    beam_volume = beam_length * 1.5 * 0.5 * number_of_floors

   
    # UG Tank Volume in cubic feet cft
    ug_volume = 0
    if include_underground_tank:
        wall_area = 2 * ((ug_tank_length_ft * 9) + (ug_tank_width_ft * 9))
        wall_volume = wall_area * 0.5
        floor = ug_tank_length_ft * ug_tank_width_ft * 0.5
        slab = floor
        ug_volume = wall_volume + floor + slab

    # OH Tank Volume in cubic feet cft
    oh_volume = 0
    if include_overhead_tank:
        wall_area = 2 * ((oh_tank_length_ft * 5) + (oh_tank_width_ft * 5))
        wall_volume = wall_area * 0.5
        floor = oh_tank_length_ft * oh_tank_width_ft * 0.5
        slab = floor
        oh_volume = wall_volume + floor + slab

    # Tower Volume in cubic feet cft
    tower_col_volume = tower_slab_volume = tower_beam_volume = total_tower_volume = 0
    if include_tower:
        tower_col_volume = 4 * (1.5 * 0.5 * 10)
        tower_slab_volume = tower_length_ft * tower_width_ft * 0.42
        tower_beam_volume = (tower_length_ft + tower_width_ft) * 2 * 1.5 * 0.5
        total_tower_volume = tower_col_volume + tower_slab_volume + tower_beam_volume

    # Stairs
    stair_width = 3.5
    tread_depth = 0.5
    riser_height = 0.583
    floor_height = 10
    steps_per_floor = int(floor_height / riser_height)
    step_volume = stair_width * tread_depth * riser_height
    stair_volume = number_of_floors * steps_per_floor * step_volume # total volume in cubic feet cft
    marble_steps = steps_per_floor * number_of_floors
    marble_step_cost = marble_steps * marble_step_price

    # total volume in cubic feet cft
    total_volume = (
        base_concrete + short_col_concrete + full_col_concrete +
        slab_volume + beam_volume + plinth_volume +
        total_tower_volume + stair_volume + ug_volume + oh_volume 
    )

    cement_cft = total_volume * (1 / 7)
    bajri_cft = total_volume * (4 / 7)
    crush_cft = total_volume * (2 / 7)
    cement_bags_concrete = cement_cft / 1.25

    cement_cost_concrete = cement_bags_concrete * cement_price
    bajri_cost = bajri_cft * bajri_price
    crush_cost = crush_cft * crush_price
    

    concrete_cost = cement_cost_concrete + bajri_cost + crush_cost 

    total_cost = estimated_brick_cost + total_mortar_cost+ concrete_cost

    result = {
        "bricks": {
            "estimated_bricks": estimated_bricks,
            "total_wall_area_sqft": round(total_wall_area, 2),
            "brick_price_per_unit": brick_price,
            "estimated_brick_cost": estimated_brick_cost
        },
        "cement_mortar": {
            "cement_bags": round(total_cement_bags, 1),
            "sand_cft": round(total_sand_cft, 1),
            "rohri_cft": round(rohri_volume, 1),
            "floor_tiles_cmt": round(flooring_tiles,1),
            "bath_wall_cmt": round(bath_wall_tiles,1),
            "cement_cost": round(total_cement_cost),
            "sand_cost": round(total_sand_cost),
            "rohri_cost": round(rohri_cost),
            "marble_steps_cost": round(marble_step_cost),
            "floor_tiles_cost": round(floor_tiles_cost),
            "bath_wall_tiles_cost": round(bath_tiles_cost)
        },
        "concrete_mix": {
            "total_volume_cft": round(total_volume, 2),
            "cement_bags": round(cement_bags_concrete, 1),
            "bajri_cft": round(bajri_cft, 1),
            "crush_cft": round(crush_cft, 1),
            "cement_cost": round(cement_cost_concrete),
            "bajri_cost": round(bajri_cost),
            "crush_cost": round(crush_cost),            
            "concrete_cost": round(concrete_cost)
        },
        "totals": {
            "total_cement_bags": round(total_cement_bags + cement_bags_concrete, 1),
            "total_cost": total_cost
        }

    }
    
    shared_inputs["gray_structure_data"] = result
    return result

gray_structure_tool_func = gray_structure_logic
estimate_gray_structure = function_tool(gray_structure_logic)







# import json
# from agents import function_tool
# from shared_inputs import shared_inputs

# def gray_structure_logic(
#     number_of_floors: int,
#     room_sizes: str,
#     bathroom_sizes: str,
#     kitchen_sizes: str,
#     plot_length_ft: float,
#     plot_width_ft: float,
#     number_of_rooms: int,
#     number_of_columns: int = 14,
#     include_underground_tank: bool = True,
#     ug_tank_length_ft: float =0.0,
#     ug_tank_width_ft: float = 0.0,
#     include_overhead_tank: bool = True,
#     oh_tank_length_ft: float =0.0,
#     oh_tank_width_ft: float = 0.0,
#     include_tower: bool = True,
#     tower_length_ft: float =0.0,
#     tower_width_ft: float = 0.0
# ) -> dict:
    
    

#     # Save shared inputs
#     shared_inputs.update({
#         "number_of_floors": number_of_floors,
#         "room_sizes": room_sizes,
#         "bathroom_sizes": bathroom_sizes,
#         "kitchen_sizes": kitchen_sizes,
#         "plot_length_ft": plot_length_ft,
#         "plot_width_ft": plot_width_ft,
#         "number_of_rooms": number_of_rooms,
#         "number_of_columns": number_of_columns,
#         "include_underground_tank": include_underground_tank,
#         "ug_tank_length_ft": ug_tank_length_ft,
#         "ug_tank_width_ft": ug_tank_width_ft,
#         "include_overhead_tank": include_overhead_tank,
#         "oh_tank_length_ft": oh_tank_length_ft,
#         "oh_tank_width_ft": oh_tank_width_ft,
#         "include_tower": include_tower,
#         "tower_length_ft": tower_length_ft,
#         "tower_width_ft": tower_width_ft
#     })

#     try:
#         with open("material_prices.json", "r") as file:
#             prices = json.load(file)
#     except Exception as e:
#         return {"error": f"Failed to load material_prices.json: {str(e)}"}

#     # -------------------- BRICKS --------------------
#     def parse_sizes(size_str):
#         sizes = []
#         for item in size_str.split(","):
#             item = item.strip().lower().replace(" ", "")
#             if "x" in item:
#                 try:
#                     l, w = map(float, item.split("x"))
#                     sizes.append((l, w))
#                 except:
#                     continue
#         return sizes

#     room_list = parse_sizes(room_sizes)
#     bath_list = parse_sizes(bathroom_sizes)
#     kitchen_list = parse_sizes(kitchen_sizes)
#     all_rooms = room_list + bath_list + kitchen_list

#     wall_height = 9
#     total_wall_area = 0
#     for length, width in all_rooms:
#         perimeter = 2 * (length + width)
#         wall_area = perimeter * wall_height
#         total_wall_area += wall_area

#     total_wall_area *= number_of_floors * 0.85
#     bricks_per_sqft = 1.5
#     estimated_bricks = int(total_wall_area * bricks_per_sqft)
#     brick_price = prices.get("bricks", {}).get("price_per_brick", 0)
#     estimated_brick_cost = int(estimated_bricks * brick_price)

#     shared_inputs["bricks_data"] = {
#         "estimated_bricks": estimated_bricks,
#         "total_wall_area_sqft": total_wall_area
#     }

#     # -------------------- CEMENT MORTAR --------------------
#     cement_price = prices.get("cement", {}).get("price_per_bag", 0)
#     sand_price = prices.get("sand", {}).get("price_per_cft", 0)

#     total_bricks = estimated_bricks
#     wall_area = total_wall_area
#     floor_area = sum(l * w for l, w in all_rooms) * number_of_floors

#     # Masonry
#     cement_bags_masonry = total_bricks / 200
#     sand_cft_masonry = cement_bags_masonry * 7.5

#     # Plaster
#     plaster_volume = wall_area * 0.042
#     cement_bags_plaster = (plaster_volume * (1 / 5)) / 1.25
#     sand_cft_plaster = plaster_volume * (4 / 5)

#     # Flooring
#     flooring_volume = floor_area * 0.166
#     cement_bags_flooring = (flooring_volume * (1 / 5)) / 1.25
#     sand_cft_flooring = flooring_volume * (4 / 5)

#     total_cement_bags = cement_bags_masonry + cement_bags_plaster + cement_bags_flooring
#     total_sand_cft = sand_cft_masonry + sand_cft_plaster + sand_cft_flooring
#     total_cement_cost = total_cement_bags * cement_price
#     total_sand_cost = total_sand_cft * sand_price

#     shared_inputs["cement_mortar_data"] = {
#         "cement_bags": total_cement_bags,
#         "sand_cft": total_sand_cft
#     }

    

#     # -------------------- CONCRETE MIX --------------------
#     bajri_price = prices.get("bajri", {}).get("price_per_cft", 0)
#     crush_price = prices.get("crush", {}).get("price_per_cft", 0)
#     rohri_price = prices.get("rohri", {}).get("price_per_cft", 0)

#     base_concrete = 32 * number_of_columns
#     short_col_concrete = 3 * number_of_columns
#     full_col_concrete = 10.5 * number_of_columns
#     wall_length = (plot_length_ft + plot_width_ft) * 2 + (number_of_rooms * 20)
#     plinth_volume = wall_length * 2 * 0.5
#     slab_volume = (plot_length_ft * plot_width_ft) * 0.42 * number_of_floors
#     beam_length = 2 * (plot_length_ft + plot_width_ft) * 1.5 * 0.5 + (number_of_rooms * 10) 
#     beam_volume = beam_length * number_of_floors

#     # Tower volumes (conditional)
#     tower_col_volume = tower_slab_volume = tower_beam_volume = 0
#     if include_tower:
#         tower_col_volume = 4 * (1.5 * 0.5 * 10)
#         tower_slab_volume = tower_length_ft * tower_width_ft * 0.42
#         tower_beam_volume = (tower_length_ft + tower_width_ft) * 2 * 1.5 * 0.5
#         total_tower_volume = tower_col_volume + tower_slab_volume + tower_beam_volume
    

#     base_ground = plot_length_ft * plot_width_ft * 0.33
#     rohri_volume = plot_length_ft * plot_width_ft * (4 / 12)

#     ug_volume = 0
#     if include_underground_tank:
#         wall_area = 2 * (ug_tank_length_ft * 9 + ug_tank_width_ft * 9)
#         wall_volume = wall_area * 0.5
#         floor = ug_tank_length_ft * ug_tank_width_ft * 0.5
#         slab = floor
#         ug_volume = wall_volume + floor + slab
   

#     oh_volume = 0
#     if include_overhead_tank:
#         wall_area = 2 * (oh_tank_length_ft * 5 + oh_tank_width_ft * 5)
#         wall_volume = wall_area * 0.5
#         floor = oh_tank_length_ft * oh_tank_width_ft * 0.5
#         slab = floor
#         oh_volume = wall_volume + floor + slab
   

#     stair_width = 3.5
#     tread_depth = 0.5
#     riser_height = 0.583
#     floor_height = 10
#     steps_per_floor = int(floor_height / riser_height)
#     step_volume = stair_width * tread_depth * riser_height
#     stair_volume = number_of_floors * steps_per_floor * step_volume

#     total_volume = (
#         base_concrete + short_col_concrete + full_col_concrete +
#         slab_volume + beam_volume + plinth_volume +
#         total_tower_volume + stair_volume + ug_volume + oh_volume + base_ground
#     )

#     cement_cft = total_volume * (1 / 7)
#     bajri_cft = total_volume * (4 / 7)
#     crush_cft = total_volume * (2 / 7)
#     cement_bags_concrete = cement_cft / 1.25

#     cement_cost_concrete = cement_bags_concrete * prices.get("cement", {}).get("price_per_bag", 0)
#     bajri_cost = bajri_cft * bajri_price
#     crush_cost = crush_cft * crush_price
#     rohri_cost = rohri_volume * rohri_price

#     concrete_cost = cement_cost_concrete + bajri_cost + crush_cost + rohri_cost

#     result = {
#         "bricks": {
#             "estimated_bricks": estimated_bricks,
#             "total_wall_area_sqft": round(total_wall_area, 2),
#             "brick_price_per_unit": brick_price,
#             "estimated_brick_cost": estimated_brick_cost
#         },
#         "cement_mortar": {
#             "cement_bags": round(total_cement_bags, 1),
#             "sand_cft": round(total_sand_cft, 1),
#             "cement_cost": round(total_cement_cost),
#             "sand_cost": round(total_sand_cost)
#         },
#         "concrete_mix": {
#             "total_volume_cft": round(total_volume, 2),
#             "cement_bags": round(cement_bags_concrete, 1),
#             "bajri_cft": round(bajri_cft, 1),
#             "crush_cft": round(crush_cft, 1),
#             "rohri_cft": round(rohri_volume, 1),
#             "cement_cost": round(cement_cost_concrete),
#             "bajri_cost": round(bajri_cost),
#             "crush_cost": round(crush_cost),
#             "rohri_cost": round(rohri_cost),
#             "concrete_cost": round(concrete_cost)
#         },
#         "totals": {
#             "total_cement_bags": round(total_cement_bags + cement_bags_concrete, 1),
#             "total_cost": round(estimated_brick_cost + total_cement_cost + total_sand_cost + concrete_cost)
#         }
#     }

#     shared_inputs["gray_structure_data"] = result
#     return result

# gray_structure_tool_func = gray_structure_logic
# estimate_gray_structure = function_tool(gray_structure_logic)



