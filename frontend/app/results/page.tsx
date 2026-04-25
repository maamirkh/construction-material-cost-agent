"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Wrench, Droplets, Paintbrush, Zap, DoorOpen,
  HardHat, ArrowLeft, Printer, RefreshCw, ChevronDown, ChevronUp,
  TrendingUp, Package, Layers, FileDown, FileText, House
} from "lucide-react";
import OpenChatButton from "@/components/OpenChatButton";
import type { EstimateResult } from "@/types";
import { downloadPDF } from "@/utils/downloadPDF";
import { downloadWord } from "@/utils/downloadWord";

const formatPKR = (n: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(n)) + " PKR";

const formatNum = (n: number, decimals = 1) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: decimals }).format(n);

const CATEGORIES = [
  {
    key: "gray_structure" as const,
    label: "Gray Structure",
    icon: Building2,
    color: "orange",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    barColor: "bg-orange-500",
    desc: "Bricks, cement, sand, concrete, plaster, tiles",
  },
  {
    key: "steel" as const,
    label: "Steel Work",
    icon: Wrench,
    color: "blue",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    barColor: "bg-blue-500",
    desc: "Steel bars, columns, beams, slabs",
  },
  {
    key: "plumbing" as const,
    label: "Plumbing",
    icon: Droplets,
    color: "cyan",
    textColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    barColor: "bg-cyan-500",
    desc: "Pipes, fittings, bathroom & kitchen fixtures",
  },
  {
    key: "paint" as const,
    label: "Paint Work",
    icon: Paintbrush,
    color: "purple",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    barColor: "bg-purple-500",
    desc: "Interior, exterior paint, primer, putty",
  },
  {
    key: "electric" as const,
    label: "Electrical",
    icon: Zap,
    color: "yellow",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    barColor: "bg-yellow-500",
    desc: "Wiring, conduits, DB, lights, fans",
  },
  {
    key: "doors_windows" as const,
    label: "Doors & Windows",
    icon: DoorOpen,
    color: "green",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    barColor: "bg-green-500",
    desc: "Doors, windows, frames, locks, bolts",
  },
  {
    key: "labour" as const,
    label: "Labour Cost",
    icon: HardHat,
    color: "red",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    barColor: "bg-red-500",
    desc: "Construction workers, skilled labour",
  },
] as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

function CategoryDetail({ catKey, result }: { catKey: string; result: EstimateResult }) {
  if (catKey === "gray_structure") {
    const d = result.gray_structure;
    return (
      <div className="space-y-4 mt-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Bricks</p>
          <DetailRow label="Estimated Bricks" value={formatNum(d.bricks.estimated_bricks, 0) + " pcs"} />
          <DetailRow label="Total Wall Area" value={formatNum(d.bricks.total_wall_area_sqft) + " sqft"} />
          <DetailRow label="Brick Cost" value={formatPKR(d.bricks.estimated_brick_cost)} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Layers className="w-3 h-3" /> Cement & Mortar</p>
          <DetailRow label="Cement Bags" value={formatNum(d.cement_mortar.cement_bags) + " bags"} />
          <DetailRow label="Sand" value={formatNum(d.cement_mortar.sand_cft) + " cft"} />
          <DetailRow label="Rohri" value={formatNum(d.cement_mortar.rohri_cft) + " cft"} />
          <DetailRow label="Floor Tiles" value={formatNum(d.cement_mortar.floor_tiles_cmt) + " cmt"} />
          <DetailRow label="Bath Wall Tiles" value={formatNum(d.cement_mortar.bath_wall_cmt) + " cmt"} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Layers className="w-3 h-3" /> Concrete Mix</p>
          <DetailRow label="Total Volume" value={formatNum(d.concrete_mix.total_volume_cft) + " cft"} />
          <DetailRow label="Cement Bags" value={formatNum(d.concrete_mix.cement_bags) + " bags"} />
          <DetailRow label="Bajri" value={formatNum(d.concrete_mix.bajri_cft) + " cft"} />
          <DetailRow label="Crush" value={formatNum(d.concrete_mix.crush_cft) + " cft"} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Totals</p>
          <DetailRow label="All Cement Bags" value={formatNum(d.totals.total_cement_bags) + " bags"} />
        </div>
      </div>
    );
  }

  if (catKey === "steel") {
    const d = result.steel;
    return (
      <div className="mt-4">
        <DetailRow label="RCC Volume" value={formatNum(d.rcc_volume_cft) + " cft"} />
        <DetailRow label="Total Steel" value={formatNum(d.total_steel_kg) + " kg"} />
        <DetailRow label="Total Steel (tons)" value={formatNum(d.total_steel_tons, 3) + " tons"} />
        <DetailRow label="Rate per Ton" value={formatPKR(d.steel_rate_per_ton)} />
      </div>
    );
  }

  if (catKey === "plumbing") {
    const d = result.plumbing;
    return (
      <div className="mt-4">
        <DetailRow label="Bathrooms" value={String(d.number_of_bathrooms)} />
        <DetailRow label="Kitchens" value={String(d.number_of_kitchens)} />
        <DetailRow label="1/2 inch PPRC Pipe Cost" value={formatPKR(d.total_1_2_pipe_cost)} />
        <DetailRow label="1¼ inch Pipe Cost" value={formatPKR(d.total_1_25_cost)} />
        <DetailRow label="4 inch Sewer Pipe Cost" value={formatPKR(d.total_4_inch_cost)} />
        <DetailRow label="6 inch Sewer Cost" value={formatPKR(d.sewer_6_inch_total_cost)} />
        <DetailRow label="Ceramics (fixtures)" value={formatPKR(d.total_ceramics_cost)} />
      </div>
    );
  }

  if (catKey === "paint") {
    const d = result.paint;
    return (
      <div className="space-y-4 mt-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Interior</p>
          <DetailRow label="Wall Area" value={formatNum(d.interior.wall_area_sqft) + " sqft"} />
          <DetailRow label="Ceiling Area" value={formatNum(d.interior.ceiling_area_sqft) + " sqft"} />
          <DetailRow label="Paint" value={formatNum(d.interior.paint.gallons_required) + " gallons"} />
          <DetailRow label="Primer" value={formatNum(d.interior.primer.gallons_required) + " gallons"} />
          <DetailRow label="Putty" value={formatNum(d.interior.putty.gallons_required) + " gallons"} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Exterior</p>
          <DetailRow label="Wall Area" value={formatNum(d.exterior.wall_area_sqft) + " sqft"} />
          <DetailRow label="Paint" value={formatNum(d.exterior.gallons_required) + " gallons"} />
        </div>
      </div>
    );
  }

  if (catKey === "electric") {
    const d = result.electric;
    return (
      <div className="mt-4">
        <DetailRow label="Wiring Cost" value={formatPKR(d.wiring.cost)} />
        <DetailRow label="Conduit Pipe Cost" value={formatPKR(d.conduit_pipe.cost)} />
        <DetailRow label="Bands & Sockets" value={formatPKR(d.bands_and_socket.cost)} />
        <DetailRow label="Boxes Cost" value={formatPKR(d.boxes.cost)} />
        <DetailRow label="LED Lights" value={String(d.led_lights.quantity) + " pcs — " + formatPKR(d.led_lights.cost)} />
        <DetailRow label="DB Boards" value={String(d.db_and_breakers.db_quantity) + " pcs"} />
        <DetailRow label="Breakers" value={String(d.db_and_breakers.breaker_quantity) + " pcs"} />
      </div>
    );
  }

  if (catKey === "doors_windows") {
    const d = result.doors_windows;
    return (
      <div className="mt-4">
        <DetailRow label="Total Doors" value={String(d.total_doors_qty) + " pcs"} />
        <DetailRow label="Total Windows" value={String(d.total_windows_qty) + " pcs"} />
        <DetailRow label="Door Area" value={formatNum(d.door_area_sft) + " sft"} />
        <DetailRow label="Window Area" value={formatNum(d.window_area_sft) + " sft"} />
        <DetailRow label="Door Cost" value={formatPKR(d.door_cost)} />
        <DetailRow label="Window Cost" value={formatPKR(d.window_cost)} />
        <DetailRow label="Chokhat / Frame Cost" value={formatPKR(d.chokhat_cost)} />
        <DetailRow label="Locks Cost" value={formatPKR(d.door_lock_cost)} />
      </div>
    );
  }

  if (catKey === "labour") {
    const d = result.labour;
    return (
      <div className="mt-4">
        <DetailRow label="Base Plot Area" value={formatNum(d.base_plot_area_sqft) + " sqft"} />
        <DetailRow label="Floors" value={String(d.number_of_floors)} />
        <DetailRow label="Total Area (incl. tanks)" value={formatNum(d.total_area_including_tanks_and_tower_sqft) + " sqft"} />
        <DetailRow label="Rate per Sqft" value={formatPKR(d.labour_rate_per_sqft)} />
      </div>
    );
  }

  return null;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("estimateResult");
    if (!raw) { router.push("/estimate"); return; }
    try { setResult(JSON.parse(raw)); } catch { router.push("/estimate"); }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500" />
      </div>
    );
  }

  const grand = result.grand_total;

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    setPdfLoading(true);
    try { downloadPDF(result); } finally { setPdfLoading(false); }
  };

  const handleWord = async () => {
    setWordLoading(true);
    try { await downloadWord(result); } finally { setWordLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">BuildCost</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <OpenChatButton />
            <Link href="/" className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
              <House className="w-4 h-4" /> Home
            </Link>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handlePDF}
              disabled={pdfLoading}
              className="flex items-center gap-2 border border-orange-600/60 hover:border-orange-500 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 hover:text-orange-300 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" />
              {pdfLoading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handleWord}
              disabled={wordLoading}
              className="flex items-center gap-2 border border-blue-600/60 hover:border-blue-500 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
            >
              <FileText className="w-4 h-4" />
              {wordLoading ? "Generating..." : "Download Word"}
            </button>
            <Link
              href="/estimate"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" /> New Estimate
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">

        {/* Back */}
        <Link href="/estimate" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors print:hidden">
          <ArrowLeft className="w-4 h-4" /> Back to Form
        </Link>

        {/* Grand Total Hero */}
        <div className="relative bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30 rounded-2xl p-8 mb-8 overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Total Construction Cost Estimate
            </p>
            <p className="text-5xl md:text-6xl font-bold text-white mb-2">
              {formatPKR(grand)}
            </p>
            <p className="text-slate-400">Combined estimate across 7 categories</p>
          </div>
        </div>

        {/* Overview bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 animate-fade-in-up delay-100">
          <h3 className="font-semibold text-white mb-5">Cost Distribution</h3>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const cost = result[cat.key]?.total_cost ?? 0;
              const pct = grand > 0 ? (cost / grand) * 100 : 0;
              return (
                <div key={cat.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={`font-medium ${cat.textColor}`}>{cat.label}</span>
                    <span className="text-white">
                      {formatPKR(cost)}{" "}
                      <span className="text-slate-500">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.barColor} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category cards */}
        <h3 className="font-semibold text-white mb-4 text-lg">Category-wise Breakdown</h3>
        <div className="space-y-3">
          {CATEGORIES.map((cat, i) => {
            const cost = result[cat.key]?.total_cost ?? 0;
            const pct = grand > 0 ? (cost / grand) * 100 : 0;
            const isOpen = expanded === cat.key;

            return (
              <div
                key={cat.key}
                className={`border rounded-xl overflow-hidden transition-all animate-fade-in-up ${cat.borderColor} ${cat.bgColor}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <button
                  className="w-full flex items-center gap-4 p-5 text-left"
                  onClick={() => setExpanded(isOpen ? null : cat.key)}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center flex-shrink-0">
                    <cat.icon className={`w-5 h-5 ${cat.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{cat.label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{cat.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-white">{formatPKR(cost)}</p>
                    <p className={`text-sm font-medium ${cat.textColor}`}>{pct.toFixed(1)}%</p>
                  </div>
                  <div className="ml-2 text-slate-500">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-700/50">
                    <CategoryDetail catKey={cat.key} result={result} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-500 text-sm mt-10">
          This estimate is based on current Pakistan market rates. Actual cost may vary.
        </p>
      </main>
    </div>
  );
}
