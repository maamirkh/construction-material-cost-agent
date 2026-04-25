import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EstimateResult } from "@/types";

const fmtPKR = (n: number) =>
  "PKR " + new Intl.NumberFormat("en-IN").format(Math.round(n));

const fmtNum = (n: number, d = 1) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: d }).format(n);

export function downloadPDF(result: EstimateResult) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Header background ──────────────────────────────────────
  doc.setFillColor(234, 88, 12); // orange-600
  doc.rect(0, 0, W, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BuildCost", 14, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Construction Cost Estimate", 14, 23);
  doc.text("Professional Quotation Report", 14, 29);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(`Date: ${today}`, W - 14, 20, { align: "right" });
  doc.text("Powered by BuildCost AI", W - 14, 27, { align: "right" });

  // ── Grand Total banner ──────────────────────────────────────
  doc.setFillColor(31, 41, 55); // slate-800
  doc.roundedRect(14, 46, W - 28, 22, 3, 3, "F");

  doc.setTextColor(253, 186, 116); // orange-300
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL CONSTRUCTION COST ESTIMATE", 20, 55);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(fmtPKR(result.grand_total), 20, 64);

  // ── Section: Cost Summary ───────────────────────────────────
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COST SUMMARY", 14, 80);

  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(14, 82, W - 14, 82);

  const summaryRows = [
    ["Gray Structure", fmtPKR(result.gray_structure.total_cost)],
    ["Steel Work", fmtPKR(result.steel.total_cost)],
    ["Plumbing", fmtPKR(result.plumbing.total_cost)],
    ["Paint Work", fmtPKR(result.paint.total_cost)],
    ["Electrical", fmtPKR(result.electric.total_cost)],
    ["Doors & Windows", fmtPKR(result.doors_windows.total_cost)],
    ["Labour Cost", fmtPKR(result.labour.total_cost)],
  ];

  autoTable(doc, {
    startY: 85,
    head: [["Category", "Estimated Cost"]],
    body: summaryRows,
    foot: [["GRAND TOTAL", fmtPKR(result.grand_total)]],
    styles: { fontSize: 10, cellPadding: 3.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [253, 186, 116], fontStyle: "bold" },
    footStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 11 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  // ── Section: Gray Structure ─────────────────────────────────
  const gs = result.gray_structure;
  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const addSection = (title: string) => {
    if (currentY > pageH - 40) { doc.addPage(); currentY = 20; }
    doc.setTextColor(234, 88, 12);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, currentY);
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.5);
    doc.line(14, currentY + 2, W - 14, currentY + 2);
    currentY += 7;
  };

  const addTable = (rows: string[][], head: string[][]) => {
    autoTable(doc, {
      startY: currentY,
      head,
      body: rows,
      styles: { fontSize: 9, cellPadding: 2.8 },
      headStyles: { fillColor: [30, 41, 59], textColor: [253, 186, 116], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  };

  addSection("1. GRAY STRUCTURE BREAKDOWN");
  addTable(
    [
      ["Estimated Bricks", fmtNum(gs.bricks.estimated_bricks, 0) + " pcs"],
      ["Total Wall Area", fmtNum(gs.bricks.total_wall_area_sqft) + " sqft"],
      ["Brick Cost", fmtPKR(gs.bricks.estimated_brick_cost)],
      ["Cement Bags (mortar)", fmtNum(gs.cement_mortar.cement_bags) + " bags"],
      ["Sand", fmtNum(gs.cement_mortar.sand_cft) + " cft"],
      ["Rohri", fmtNum(gs.cement_mortar.rohri_cft) + " cft"],
      ["Floor Tiles", fmtNum(gs.cement_mortar.floor_tiles_cmt) + " cmt"],
      ["Bath Wall Tiles", fmtNum(gs.cement_mortar.bath_wall_cmt) + " cmt"],
      ["Concrete Volume", fmtNum(gs.concrete_mix.total_volume_cft) + " cft"],
      ["Cement Bags (concrete)", fmtNum(gs.concrete_mix.cement_bags) + " bags"],
      ["Bajri", fmtNum(gs.concrete_mix.bajri_cft) + " cft"],
      ["Crush", fmtNum(gs.concrete_mix.crush_cft) + " cft"],
      ["Total Cement Bags", fmtNum(gs.totals.total_cement_bags) + " bags"],
      ["Gray Structure Total", fmtPKR(gs.total_cost)],
    ],
    [["Item", "Quantity / Cost"]]
  );

  // ── Section: Steel ──────────────────────────────────────────
  addSection("2. STEEL WORK");
  addTable(
    [
      ["RCC Volume", fmtNum(result.steel.rcc_volume_cft) + " cft"],
      ["Total Steel", fmtNum(result.steel.total_steel_kg) + " kg"],
      ["Total Steel (tons)", fmtNum(result.steel.total_steel_tons, 3) + " tons"],
      ["Rate per Ton", fmtPKR(result.steel.steel_rate_per_ton)],
      ["Steel Work Total", fmtPKR(result.steel.total_cost)],
    ],
    [["Item", "Quantity / Cost"]]
  );

  // ── Section: Plumbing ───────────────────────────────────────
  addSection("3. PLUMBING");
  addTable(
    [
      ["Bathrooms", String(result.plumbing.number_of_bathrooms)],
      ["Kitchens", String(result.plumbing.number_of_kitchens)],
      ["½ inch PPRC Pipe Cost", fmtPKR(result.plumbing.total_1_2_pipe_cost)],
      ["1¼ inch Pipe Cost", fmtPKR(result.plumbing.total_1_25_cost)],
      ["4 inch Sewer Pipe Cost", fmtPKR(result.plumbing.total_4_inch_cost)],
      ["6 inch Sewer Cost", fmtPKR(result.plumbing.sewer_6_inch_total_cost)],
      ["Ceramics / Fixtures", fmtPKR(result.plumbing.total_ceramics_cost)],
      ["Plumbing Total", fmtPKR(result.plumbing.total_cost)],
    ],
    [["Item", "Quantity / Cost"]]
  );

  // ── Section: Paint ──────────────────────────────────────────
  addSection("4. PAINT WORK");
  addTable(
    [
      ["Interior Wall Area", fmtNum(result.paint.interior.wall_area_sqft) + " sqft"],
      ["Interior Ceiling Area", fmtNum(result.paint.interior.ceiling_area_sqft) + " sqft"],
      ["Interior Paint", fmtNum(result.paint.interior.paint.gallons_required) + " gallons"],
      ["Primer", fmtNum(result.paint.interior.primer.gallons_required) + " gallons"],
      ["Putty", fmtNum(result.paint.interior.putty.gallons_required) + " gallons"],
      ["Exterior Wall Area", fmtNum(result.paint.exterior.wall_area_sqft) + " sqft"],
      ["Exterior Paint", fmtNum(result.paint.exterior.gallons_required) + " gallons"],
      ["Paint Work Total", fmtPKR(result.paint.total_cost)],
    ],
    [["Item", "Quantity / Cost"]]
  );

  // ── Section: Electrical ─────────────────────────────────────
  addSection("5. ELECTRICAL WORK");
  addTable(
    [
      ["Wiring Cost", fmtPKR(result.electric.wiring.cost)],
      ["Conduit Pipe Cost", fmtPKR(result.electric.conduit_pipe.cost)],
      ["Bands & Sockets", fmtPKR(result.electric.bands_and_socket.cost)],
      ["Boxes Cost", fmtPKR(result.electric.boxes.cost)],
      ["LED Lights", result.electric.led_lights.quantity + " pcs — " + fmtPKR(result.electric.led_lights.cost)],
      ["DB Boards", String(result.electric.db_and_breakers.db_quantity) + " pcs"],
      ["Breakers", String(result.electric.db_and_breakers.breaker_quantity) + " pcs"],
      ["Electrical Total", fmtPKR(result.electric.total_cost)],
    ],
    [["Item", "Quantity / Cost"]]
  );

  // ── Section: Doors & Windows ────────────────────────────────
  addSection("6. DOORS & WINDOWS");
  addTable(
    [
      ["Total Doors", String(result.doors_windows.total_doors_qty) + " pcs"],
      ["Total Windows", String(result.doors_windows.total_windows_qty) + " pcs"],
      ["Door Area", fmtNum(result.doors_windows.door_area_sft) + " sft"],
      ["Window Area", fmtNum(result.doors_windows.window_area_sft) + " sft"],
      ["Door Cost", fmtPKR(result.doors_windows.door_cost)],
      ["Window Cost", fmtPKR(result.doors_windows.window_cost)],
      ["Chokhat / Frame Cost", fmtPKR(result.doors_windows.chokhat_cost)],
      ["Locks Cost", fmtPKR(result.doors_windows.door_lock_cost)],
      ["Doors & Windows Total", fmtPKR(result.doors_windows.total_cost)],
    ],
    [["Item", "Quantity / Cost"]]
  );

  // ── Section: Labour ─────────────────────────────────────────
  addSection("7. LABOUR COST");
  addTable(
    [
      ["Base Plot Area", fmtNum(result.labour.base_plot_area_sqft) + " sqft"],
      ["Number of Floors", String(result.labour.number_of_floors)],
      ["Total Area (incl. tanks/tower)", fmtNum(result.labour.total_area_including_tanks_and_tower_sqft) + " sqft"],
      ["Rate per Sqft", fmtPKR(result.labour.labour_rate_per_sqft)],
      ["Labour Total", fmtPKR(result.labour.total_cost)],
    ],
    [["Item", "Quantity / Cost"]]
  );

  // ── Footer on all pages ─────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(30, 41, 59);
    doc.rect(0, pageH - 12, W, 12, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("BuildCost — Construction Cost Estimator | This is an AI-generated estimate. Actual costs may vary.", 14, pageH - 5);
    doc.text(`Page ${i} of ${totalPages}`, W - 14, pageH - 5, { align: "right" });
  }

  doc.save("BuildCost-Estimate-Quotation.pdf");
}
