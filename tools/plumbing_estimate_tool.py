# tools/plumbing_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs

def plumbing_logic() -> dict:
    try:
        bathroom_sizes = shared_inputs["bathroom_sizes"]
        kitchen_sizes = shared_inputs["kitchen_sizes"]
        number_of_washingareas = shared_inputs["number_of_washingareas"]
        number_of_floors = shared_inputs["number_of_floors"]
        number_of_geysers = shared_inputs["number_of_geysers"]

        # ✅ Dynamically infer numbers
        number_of_bathrooms = len([b for b in bathroom_sizes.split(",") if b.strip()])
        number_of_kitchens = len([k for k in kitchen_sizes.split(",") if k.strip()])
        

        with open("material_prices.json", "r") as f:
            prices = json.load(f)


        # Piping lengths (ft)
        pipe_length_per_bathroom = 40
        pipe_length_per_kitchen = 20
        pipe_length_per_washing = 15
        pipe_length_per_geyser = 10

        total_1_2_pipe_length = (
            number_of_bathrooms * pipe_length_per_bathroom  +
            number_of_kitchens * pipe_length_per_kitchen +
            number_of_washingareas * pipe_length_per_washing +
            number_of_geysers * pipe_length_per_geyser
        ) 

       
        # 1/2 inch PPRC Pipe 
     
        pipe_1_2_inch_length = total_1_2_pipe_length * number_of_floors
        pipe_1_2_elbow = (number_of_bathrooms * 10) + (number_of_kitchens * 2) + (number_of_washingareas * 2) * number_of_floors
        pipe_1_2_socket = number_of_bathrooms * 10 + number_of_kitchens * 2 + number_of_washingareas * 2 * number_of_floors
        pipe_1_2_tee = number_of_bathrooms * 5 + number_of_kitchens * 1 + number_of_washingareas * 1 * number_of_floors
        pipe_1_2_brass_socket = number_of_bathrooms * 6 + number_of_kitchens * 2 + number_of_washingareas *2 * number_of_floors

        total_1_2_pipe_cost = pipe_1_2_inch_length * prices["pipe_1_2_inch"]["price_per_ft"] 
        total_1_2_elbow_cost = pipe_1_2_elbow * prices["elbow_1_2"]["price_per_unit"] 
        total_1_2_socket_cost = pipe_1_2_socket * prices["socket_1_2"]["price_per_unit"] 
        total_1_2_tee_cost = pipe_1_2_tee * prices["tee_1_2"]["price_per_unit"] 
        total_brass_socket_cost = pipe_1_2_brass_socket * prices["brass_socket_1_2"]["price_per_unit"]
        total_1_2_cost = total_1_2_pipe_length + total_1_2_elbow_cost + total_1_2_socket_cost + total_1_2_tee_cost + total_brass_socket_cost

        # 1-1/4 inch PVC Pipe (UG to OH tank ×2)
        pipe_1_25_inch_length = number_of_floors * 50 * 2
        pipe_1_25_elbow = number_of_floors * 4
        pipe_1_25_socket = number_of_floors * 4
        pipe_1_25_tee = number_of_floors * 2

        total_1_25_pipe = pipe_1_25_inch_length * prices["pipe_1_25_inch"]["price_per_ft"]
        total_1_25_elbow = pipe_1_25_elbow * prices["elbow_1_25"]["price_per_unit"]
        total_1_25_socket = pipe_1_25_socket * prices["socket_1_25"]["price_per_unit"]
        total_1_25_tee = pipe_1_25_tee * prices["tee_1_25"]["price_per_unit"]
        total_1_25_cost = total_1_25_pipe + total_1_25_elbow + total_1_25_socket + total_1_25_tee

        # Main sewer pipe (6 inch)
        main_sewer_pipe_length = number_of_floors * 25
        sewer_elbow_6_inch = number_of_floors * 2
        sewer_socket_6_inch = number_of_floors * 2

        total_6_inch_pipe = main_sewer_pipe_length * prices["pipe_6_inch_sewer_pipe"]["price_per_ft"]
        total_6_inch_elbow = sewer_elbow_6_inch * prices["elbow_6_inch"]["price_per_unit"]
        total_6_inch_socket = sewer_socket_6_inch * prices["socket_6_inch"]["price_per_unit"]
        total_6_inch_cost = total_6_inch_pipe + total_6_inch_elbow + total_6_inch_socket


        # 4" sewer fittings
        sewer_pipe_4_inch_length = number_of_bathrooms * 30 * number_of_floors
        sewer_elbow_4_inch = number_of_bathrooms * 2 * number_of_floors
        sewer_tee_4_inch = number_of_bathrooms * 2 * number_of_floors
        sewer_ytee_4_inch = number_of_bathrooms * 2 * number_of_floors
        sewer_ptrap_4_inch = number_of_bathrooms * 3 + number_of_kitchens + number_of_washingareas * number_of_floors

        total_4_inch_pipe = sewer_pipe_4_inch_length * prices ["pipe_4_inch_sewer_pipe"]["price_per_ft"]
        total_4_inch_elbow = sewer_elbow_4_inch * prices["elbow_4_inch"]["price_per_unit"]
        total_4_inch_tee = sewer_tee_4_inch * prices["tee_4_inch"]["price_per_unit"]
        total_4_inch_ytee = sewer_ytee_4_inch * prices["ytee_4_inch"]["price_per_unit"]
        total_4_inch_ptrap = sewer_ptrap_4_inch * prices["ptrap_4_inch"]["price_per_unit"]
        total_4_inch_cost = total_4_inch_pipe + total_4_inch_elbow + total_4_inch_tee +total_4_inch_ytee + total_4_inch_ptrap
        

        # Ceramic fittings
        
        bathroom_sets = number_of_bathrooms * number_of_floors
        commodes = number_of_bathrooms * number_of_floors
        wash_basin = number_of_bathrooms * number_of_floors
        kitchen_sink = number_of_kitchens * number_of_floors
        kitchen_mixture = number_of_kitchens * number_of_floors
        washing_taps = number_of_washingareas * 2
        

        bathroom_sets_cost = bathroom_sets * prices["bathroom_set"]["price_per_unit"]
        commodes_cost = commodes * prices["commode"]["price_per_unit"]
        wash_basin_cost = wash_basin * prices["wash_basin"]["price_per_unit"]
        kitchen_sink_cost = kitchen_sink * prices["kitchen_sink"]["price_per_unit"]
        kitchen_mixer_cost = kitchen_mixture * prices["kitchen_mixer"]["price_per_unit"]
        washing_taps_cost = washing_taps * prices["washing_tap"]["price_per_unit"]
        total_ceramics_cost = bathroom_sets_cost + commodes_cost + wash_basin_cost + kitchen_sink_cost + kitchen_mixer_cost + washing_taps_cost

        total_cost = total_1_2_cost + total_1_25_cost + total_4_inch_cost + total_6_inch_cost + total_ceramics_cost

        result = {
            # Pipe estimates
            "pipe_1_2_length": pipe_1_2_inch_length,
            "pipe_1_2cost": total_1_2_pipe_cost,
            "elbow_1_2_cost": total_1_2_elbow_cost,
            "socket_1_2_cost": total_1_2_socket_cost,
            "tee_1_2_cost": total_1_2_tee_cost,
            "brass_socket_cost": total_brass_socket_cost,
            "total_1_2_pipe_cost": total_1_2_cost,


            # 6 inch sewer line
            "sewer_pipe_6inch_ft": main_sewer_pipe_length,
            "sewer_pipe_cost": total_6_inch_pipe,
            "sewer_6_inch_elbows_cost": total_6_inch_elbow,
            "sewer_6_inch_sockets_cost": total_6_inch_socket,
            "sewer_6_inch_total_cost" : total_6_inch_cost,

            # 1-1/4 inch PPRC
            "pipe_1_25_inch_ft": pipe_1_25_inch_length,
            "pipe_1_25_inch_cost": total_1_25_pipe,
            "pipe_1_25_elbows": total_1_25_elbow,
            "pipe_1_25_sockets": total_1_25_socket,
            "pipe_1_25_tees": total_1_25_tee,
            "total_1_25_cost" : total_1_25_cost,


            # 4" PVC Sewer
            "sewer_pipe_4inch_ft": sewer_pipe_4_inch_length,
            "sewer_pipe_4inch_cost" : total_4_inch_pipe,
            "sewer_4_inch_elbows": total_4_inch_elbow,
            "sewer_4_inch_tees": total_4_inch_tee,
            "sewer_4_inch_ytees": total_4_inch_ytee,
            "sewer_4_inch_ptraps": total_4_inch_ptrap,
            "total_4_inch_cost" : total_4_inch_cost,
            "number_of_bathrooms": number_of_bathrooms,
            "number_of_kitchens": number_of_kitchens,

            # Ceramics
            "bathroom_sets_cost" : bathroom_sets_cost,
            "commodes_cost" : commodes_cost,
            "wash_basin_cost" : wash_basin_cost,
            "kitchen_sink_cost" : kitchen_sink_cost,
            "kitchen_mixture_cost" : kitchen_mixer_cost,
            "washong_tap_cost" : washing_taps_cost,
            "total_ceramics_cost" : total_ceramics_cost,

            "total_cost" : total_cost 
            
        }

        # Optional shared save
        shared_inputs["plumbing_data"] = result

        return result

    except Exception as e:
        return {"error": str(e)}

# ✅ Phase 1: Internal callable
plumbing_tool_func = plumbing_logic

# ✅ Phase 2: Agent-compatible tool
estimate_plumbing = function_tool(plumbing_logic)
