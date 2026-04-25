export interface EstimateInput {
  plot_size_sqft: number
  plot_length_ft: number
  plot_width_ft: number
  number_of_floors: number
  number_of_rooms: number
  number_of_bathrooms: number
  number_of_kitchens: number
  room_sizes: string
  bathroom_sizes: string
  kitchen_sizes: string
  number_of_washingareas: number
  number_of_geysers: number
  number_of_columns: number
  include_underground_tank: boolean
  ug_tank_length_ft: number
  ug_tank_width_ft: number
  include_overhead_tank: boolean
  oh_tank_length_ft: number
  oh_tank_width_ft: number
  include_tower: boolean
  tower_length_ft: number
  tower_width_ft: number
}

export interface GrayStructureResult {
  bricks: {
    estimated_bricks: number
    total_wall_area_sqft: number
    brick_price_per_unit: number
    estimated_brick_cost: number
  }
  cement_mortar: {
    cement_bags: number
    sand_cft: number
    rohri_cft: number
    cement_cost: number
    sand_cost: number
    rohri_cost: number
    marble_steps_cost: number
    floor_tiles_cmt: number
    bath_wall_cmt: number
    floor_tiles_cost: number
    bath_wall_tiles_cost: number
  }
  concrete_mix: {
    total_volume_cft: number
    cement_bags: number
    bajri_cft: number
    crush_cft: number
    concrete_cost: number
  }
  totals: {
    total_cement_bags: number
    total_cost: number
  }
  total_cost: number
}

export interface SteelResult {
  rcc_volume_cft: number
  total_steel_kg: number
  total_steel_tons: number
  steel_rate_per_ton: number
  total_steel_cost_pkr: number
  total_cost: number
}

export interface PlumbingResult {
  pipe_1_2_length: number
  total_1_2_pipe_cost: number
  total_1_25_cost: number
  total_4_inch_cost: number
  sewer_6_inch_total_cost: number
  total_ceramics_cost: number
  number_of_bathrooms: number
  number_of_kitchens: number
  total_cost: number
}

export interface PaintResult {
  interior: {
    wall_area_sqft: number
    ceiling_area_sqft: number
    total_paint_area_sqft: number
    paint: { gallons_required: number; cost: number }
    primer: { gallons_required: number; cost: number }
    putty: { gallons_required: number; cost: number }
  }
  exterior: {
    wall_area_sqft: number
    gallons_required: number
    cost: number
  }
  total_cost: number
}

export interface ElectricResult {
  wiring: { cost: number }
  conduit_pipe: { cost: number }
  bands_and_socket: { cost: number }
  boxes: { cost: number }
  electric_sheets: { quantity: number; cost: number }
  led_lights: { quantity: number; cost: number }
  db_and_breakers: { db_quantity: number; breaker_quantity: number; cost: number }
  total_cost: number
}

export interface DoorsWindowsResult {
  total_doors_qty: number
  total_windows_qty: number
  door_area_sft: number
  window_area_sft: number
  door_cost: number
  window_cost: number
  chokhat_cost: number
  door_lock_cost: number
  total_cost: number
}

export interface LabourResult {
  base_plot_area_sqft: number
  number_of_floors: number
  total_area_including_tanks_and_tower_sqft: number
  labour_rate_per_sqft: number
  total_labour_cost_pkr: number
  total_cost: number
}

export interface EstimateResult {
  gray_structure: GrayStructureResult
  steel: SteelResult
  plumbing: PlumbingResult
  paint: PaintResult
  electric: ElectricResult
  doors_windows: DoorsWindowsResult
  labour: LabourResult
  grand_total: number
  errors?: Record<string, string>
}
