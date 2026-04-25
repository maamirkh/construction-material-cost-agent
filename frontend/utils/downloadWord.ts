import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, Header, Footer, PageNumber,
} from "docx";
import { saveAs } from "file-saver";
import type { EstimateResult } from "@/types";

const fmtPKR = (n: number) =>
  "PKR " + new Intl.NumberFormat("en-IN").format(Math.round(n));

const fmtNum = (n: number, d = 1) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: d }).format(n);

const ORANGE = "EA580C";
const SLATE_DARK = "1E293B";
const SLATE_LIGHT = "F8FAFC";
const ORANGE_LIGHT = "FED7AA";

function makeCell(text: string, opts?: {
  bold?: boolean; color?: string; fill?: string;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  fontSize?: number;
}) {
  return new TableCell({
    shading: opts?.fill ? { type: ShadingType.CLEAR, color: "auto", fill: opts.fill } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    },
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts?.bold ?? false,
            color: opts?.color ?? "334155",
            size: (opts?.fontSize ?? 10) * 2,
          }),
        ],
      }),
    ],
  });
}

function makeHeaderRow(col1: string, col2: string) {
  return new TableRow({
    children: [
      makeCell(col1, { bold: true, fill: SLATE_DARK, color: ORANGE_LIGHT }),
      makeCell(col2, { bold: true, fill: SLATE_DARK, color: ORANGE_LIGHT, align: AlignmentType.RIGHT }),
    ],
  });
}

function makeDataRow(label: string, value: string, shade?: boolean) {
  const fill = shade ? "F1F5F9" : SLATE_LIGHT;
  return new TableRow({
    children: [
      makeCell(label, { fill }),
      makeCell(value, { fill, align: AlignmentType.RIGHT }),
    ],
  });
}

function makeTotalRow(label: string, value: string) {
  return new TableRow({
    children: [
      makeCell(label, { bold: true, fill: ORANGE, color: "FFFFFF" }),
      makeCell(value, { bold: true, fill: ORANGE, color: "FFFFFF", align: AlignmentType.RIGHT }),
    ],
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({ text, bold: true, color: ORANGE, size: 24 }),
    ],
  });
}

function makeTable(rows: [string, string][], totalLabel?: string, totalValue?: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      makeHeaderRow("Item", "Quantity / Cost"),
      ...rows.map(([l, v], i) => makeDataRow(l, v, i % 2 === 1)),
      ...(totalLabel && totalValue ? [makeTotalRow(totalLabel, totalValue)] : []),
    ],
  });
}

export async function downloadWord(result: EstimateResult) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const gs = result.gray_structure;

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "BuildCost  ", bold: true, size: 28, color: ORANGE }),
                  new TextRun({ text: "— Construction Cost Estimate Quotation", size: 20, color: "64748B" }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "BuildCost AI | This is an AI-generated estimate. Actual costs may vary. | Page ", size: 16, color: "94A3B8" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "94A3B8" }),
                  new TextRun({ text: " of ", size: 16, color: "94A3B8" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "94A3B8" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ── Title block ──────────────────────────────────────
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "BuildCost", bold: true, size: 48, color: ORANGE }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "Construction Cost Estimate — Professional Quotation", size: 24, color: "64748B" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: `Date: ${today}`, size: 20, color: "94A3B8" }),
            ],
          }),

          // ── Grand Total ──────────────────────────────────────
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, color: "auto", fill: SLATE_DARK },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 2, color: ORANGE },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: ORANGE },
                      left: { style: BorderStyle.SINGLE, size: 2, color: ORANGE },
                      right: { style: BorderStyle.SINGLE, size: 2, color: ORANGE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "TOTAL CONSTRUCTION COST ESTIMATE", bold: true, size: 20, color: ORANGE_LIGHT }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: fmtPKR(result.grand_total), bold: true, size: 44, color: "FFFFFF" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Combined across 7 categories", size: 18, color: "94A3B8" }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ── Cost Summary ─────────────────────────────────────
          sectionHeading("COST SUMMARY"),
          makeTable(
            [
              ["Gray Structure", fmtPKR(result.gray_structure.total_cost)],
              ["Steel Work", fmtPKR(result.steel.total_cost)],
              ["Plumbing", fmtPKR(result.plumbing.total_cost)],
              ["Paint Work", fmtPKR(result.paint.total_cost)],
              ["Electrical", fmtPKR(result.electric.total_cost)],
              ["Doors & Windows", fmtPKR(result.doors_windows.total_cost)],
              ["Labour Cost", fmtPKR(result.labour.total_cost)],
            ],
            "GRAND TOTAL",
            fmtPKR(result.grand_total)
          ),

          // ── 1. Gray Structure ────────────────────────────────
          sectionHeading("1. GRAY STRUCTURE BREAKDOWN"),
          makeTable(
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
            ],
            "Gray Structure Total",
            fmtPKR(gs.total_cost)
          ),

          // ── 2. Steel ─────────────────────────────────────────
          sectionHeading("2. STEEL WORK"),
          makeTable(
            [
              ["RCC Volume", fmtNum(result.steel.rcc_volume_cft) + " cft"],
              ["Total Steel", fmtNum(result.steel.total_steel_kg) + " kg"],
              ["Total Steel (tons)", fmtNum(result.steel.total_steel_tons, 3) + " tons"],
              ["Rate per Ton", fmtPKR(result.steel.steel_rate_per_ton)],
            ],
            "Steel Work Total",
            fmtPKR(result.steel.total_cost)
          ),

          // ── 3. Plumbing ──────────────────────────────────────
          sectionHeading("3. PLUMBING"),
          makeTable(
            [
              ["Bathrooms", String(result.plumbing.number_of_bathrooms)],
              ["Kitchens", String(result.plumbing.number_of_kitchens)],
              ["½ inch PPRC Pipe Cost", fmtPKR(result.plumbing.total_1_2_pipe_cost)],
              ["1¼ inch Pipe Cost", fmtPKR(result.plumbing.total_1_25_cost)],
              ["4 inch Sewer Pipe Cost", fmtPKR(result.plumbing.total_4_inch_cost)],
              ["6 inch Sewer Cost", fmtPKR(result.plumbing.sewer_6_inch_total_cost)],
              ["Ceramics / Fixtures", fmtPKR(result.plumbing.total_ceramics_cost)],
            ],
            "Plumbing Total",
            fmtPKR(result.plumbing.total_cost)
          ),

          // ── 4. Paint ─────────────────────────────────────────
          sectionHeading("4. PAINT WORK"),
          makeTable(
            [
              ["Interior Wall Area", fmtNum(result.paint.interior.wall_area_sqft) + " sqft"],
              ["Interior Ceiling Area", fmtNum(result.paint.interior.ceiling_area_sqft) + " sqft"],
              ["Interior Paint", fmtNum(result.paint.interior.paint.gallons_required) + " gallons"],
              ["Primer", fmtNum(result.paint.interior.primer.gallons_required) + " gallons"],
              ["Putty", fmtNum(result.paint.interior.putty.gallons_required) + " gallons"],
              ["Exterior Wall Area", fmtNum(result.paint.exterior.wall_area_sqft) + " sqft"],
              ["Exterior Paint", fmtNum(result.paint.exterior.gallons_required) + " gallons"],
            ],
            "Paint Work Total",
            fmtPKR(result.paint.total_cost)
          ),

          // ── 5. Electrical ────────────────────────────────────
          sectionHeading("5. ELECTRICAL WORK"),
          makeTable(
            [
              ["Wiring Cost", fmtPKR(result.electric.wiring.cost)],
              ["Conduit Pipe Cost", fmtPKR(result.electric.conduit_pipe.cost)],
              ["Bands & Sockets", fmtPKR(result.electric.bands_and_socket.cost)],
              ["Boxes Cost", fmtPKR(result.electric.boxes.cost)],
              ["LED Lights", result.electric.led_lights.quantity + " pcs — " + fmtPKR(result.electric.led_lights.cost)],
              ["DB Boards", String(result.electric.db_and_breakers.db_quantity) + " pcs"],
              ["Breakers", String(result.electric.db_and_breakers.breaker_quantity) + " pcs"],
            ],
            "Electrical Total",
            fmtPKR(result.electric.total_cost)
          ),

          // ── 6. Doors & Windows ───────────────────────────────
          sectionHeading("6. DOORS & WINDOWS"),
          makeTable(
            [
              ["Total Doors", String(result.doors_windows.total_doors_qty) + " pcs"],
              ["Total Windows", String(result.doors_windows.total_windows_qty) + " pcs"],
              ["Door Area", fmtNum(result.doors_windows.door_area_sft) + " sft"],
              ["Window Area", fmtNum(result.doors_windows.window_area_sft) + " sft"],
              ["Door Cost", fmtPKR(result.doors_windows.door_cost)],
              ["Window Cost", fmtPKR(result.doors_windows.window_cost)],
              ["Chokhat / Frame Cost", fmtPKR(result.doors_windows.chokhat_cost)],
              ["Locks Cost", fmtPKR(result.doors_windows.door_lock_cost)],
            ],
            "Doors & Windows Total",
            fmtPKR(result.doors_windows.total_cost)
          ),

          // ── 7. Labour ────────────────────────────────────────
          sectionHeading("7. LABOUR COST"),
          makeTable(
            [
              ["Base Plot Area", fmtNum(result.labour.base_plot_area_sqft) + " sqft"],
              ["Number of Floors", String(result.labour.number_of_floors)],
              ["Total Area (incl. tanks/tower)", fmtNum(result.labour.total_area_including_tanks_and_tower_sqft) + " sqft"],
              ["Rate per Sqft", fmtPKR(result.labour.labour_rate_per_sqft)],
            ],
            "Labour Total",
            fmtPKR(result.labour.total_cost)
          ),

          // ── Disclaimer ───────────────────────────────────────
          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: "Note: This estimate is based on current Pakistan market rates. Actual construction cost may vary depending on material quality, location, and contractor rates.",
                italics: true,
                color: "94A3B8",
                size: 18,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "BuildCost-Estimate-Quotation.docx");
}
