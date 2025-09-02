# tools/paint_estimate_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs

def paint_estimate_logic(
    number_of_floors: int,
    room_sizes: str,
    bathroom_sizes: str,
    kitchen_sizes: str
) -> dict:
    """
    Estimate Paint, Primer, Putty for interior (walls & ceilings) + exterior paint (in 4-liter gallons).
    """

    number_of_floors = shared_inputs.get("number_of_floors", number_of_floors)
    room_sizes = shared_inputs.get("room_sizes", room_sizes) or ""
    bathroom_sizes = shared_inputs.get("bathroom_sizes", bathroom_sizes) or ""
    kitchen_sizes = shared_inputs.get("kitchen_sizes", kitchen_sizes) or ""

    try:
        with open("material_prices.json", "r") as file:
            prices = json.load(file)
    except Exception as e:
        return {"error": f"Failed to load material_prices.json: {str(e)}"}

    # Validate pricing keys
    for item in ["paint", "primer", "putty", "exterior_paint"]:
        if item not in prices or "price_per_gallon" not in prices[item]:
            return {"error": f"Missing '{item}' price_per_gallon in material_prices.json"}

    paint_price = prices["paint"]["price_per_gallon"]
    primer_price = prices["primer"]["price_per_gallon"]
    putty_price = prices["putty"]["price_per_gallon"]
    exterior_price = prices["exterior_paint"]["price_per_gallon"]

    def parse_sizes(size_str):
        sizes = []
        for item in size_str.split(","):
            item = item.strip().lower().replace(" ", "")
            if "x" in item:
                try:
                    length, width = map(float, item.split("x"))
                    sizes.append((length, width))
                except:
                    continue
        return sizes

    try:
        room_list = parse_sizes(room_sizes)
        bath_list = parse_sizes(bathroom_sizes)
        kitchen_list = parse_sizes(kitchen_sizes)

        height = 9  # feet

        total_wall_area = 0
        total_ceiling_area = 0

        for l, w in room_list + bath_list + kitchen_list:
            total_wall_area += 2 * (l + w) * height
            total_ceiling_area += l * w

        total_wall_area *= number_of_floors
        total_ceiling_area *= number_of_floors
        total_paint_area = total_wall_area + total_ceiling_area

        # ✅ Coverage (sqft per 4-liter gallon)
        paint_coverage = 350
        primer_coverage = 300
        putty_coverage = 100
        exterior_coverage = 325

        # ✅ Interior Quantities
        paint_gallons = total_paint_area / paint_coverage
        primer_gallons = total_paint_area / primer_coverage
        putty_gallons = total_paint_area / putty_coverage

        paint_cost = paint_gallons * paint_price
        primer_cost = primer_gallons * primer_price
        putty_cost = putty_gallons * putty_price

        # ✅ Estimate exterior paint (assume building footprint from rooms)
        if room_list:
            max_length = max(l for l, _ in room_list)
            max_width = max(w for _, w in room_list)
        else:
            max_length, max_width = 20, 20  # default fallback

        exterior_wall_area = 2 * (max_length + max_width) * (number_of_floors * height)
        exterior_gallons = exterior_wall_area / exterior_coverage
        exterior_cost = exterior_gallons * exterior_price

        total_cost = paint_cost + primer_cost + putty_cost + exterior_cost

        result = {
            "interior": {
                "wall_area_sqft": round(total_wall_area, 2),
                "ceiling_area_sqft": round(total_ceiling_area, 2),
                "total_paint_area_sqft": round(total_paint_area, 2),

                "paint": {
                    "gallons_required": round(paint_gallons, 2),
                    "price_per_gallon": paint_price,
                    "cost": round(paint_cost, 2)
                },
                "primer": {
                    "gallons_required": round(primer_gallons, 2),
                    "price_per_gallon": primer_price,
                    "cost": round(primer_cost, 2)
                },
                "putty": {
                    "gallons_required": round(putty_gallons, 2),
                    "price_per_gallon": putty_price,
                    "cost": round(putty_cost, 2)
                }
            },
            "exterior": {
                "wall_area_sqft": round(exterior_wall_area, 2),
                "gallons_required": round(exterior_gallons, 2),
                "price_per_gallon": exterior_price,
                "cost": round(exterior_cost, 2)
            },
            "total_cost": round(total_cost, 2)
        }

        shared_inputs["paint_data"] = result
        return result

    except Exception as e:
        return {"error": f"Paint estimate error: {str(e)}"}


# ✅ Create tool-compatible wrapper for main.py

def paint_estimate_tool_func():
    number_of_floors = shared_inputs.get("number_of_floors")
    room_sizes = shared_inputs.get("room_sizes")
    bathroom_sizes = shared_inputs.get("bathroom_sizes")
    kitchen_sizes = shared_inputs.get("kitchen_sizes")

    return paint_estimate_logic(
        number_of_floors,
        room_sizes,
        bathroom_sizes,
        kitchen_sizes
    )

# Optional standalone function tool
estimate_paint = function_tool(paint_estimate_logic)
