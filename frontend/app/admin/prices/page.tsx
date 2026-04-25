"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, Save, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, House, ChevronDown, ChevronUp,
} from "lucide-react";
import OpenChatButton from "@/components/OpenChatButton";

// ── Price schema: label, unit, path in JSON ───────────────────────────
interface PriceField {
  label: string;
  unit: string;
  path: [string, string]; // [parent_key, child_key]
}

interface PriceGroup {
  title: string;
  color: string;
  border: string;
  bg: string;
  fields: PriceField[];
}

const PRICE_GROUPS: PriceGroup[] = [
  {
    title: "Gray Structure — Masonry & Mortar",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    fields: [
      { label: "Bricks", unit: "PKR / brick", path: ["bricks", "price_per_brick"] },
      { label: "Cement", unit: "PKR / bag", path: ["cement", "price_per_bag"] },
      { label: "Sand", unit: "PKR / cft", path: ["sand", "price_per_cft"] },
      { label: "Bajri (Gravel)", unit: "PKR / cft", path: ["bajri", "price_per_cft"] },
      { label: "Crush (Stone)", unit: "PKR / cft", path: ["crush", "price_per_cft"] },
      { label: "Rohri (Filling)", unit: "PKR / cft", path: ["rohri", "price_per_cft"] },
      { label: "Marble Steps", unit: "PKR / piece", path: ["marble_steps", "step_per_pcs"] },
      { label: "Flooring Tiles", unit: "PKR / cmt", path: ["flooring_tiles", "tiles_per_cmt"] },
    ],
  },
  {
    title: "Steel Work",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    fields: [
      { label: "Steel (Sariya)", unit: "PKR / ton", path: ["steel", "price_per_ton"] },
    ],
  },
  {
    title: "Plumbing — PPRC Pipes",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    fields: [
      { label: "½ inch PPRC Pipe", unit: "PKR / ft", path: ["pipe_1_2_inch", "price_per_ft"] },
      { label: "½ inch Socket", unit: "PKR / unit", path: ["socket_1_2", "price_per_unit"] },
      { label: "½ inch Elbow", unit: "PKR / unit", path: ["elbow_1_2", "price_per_unit"] },
      { label: "½ inch Tee", unit: "PKR / unit", path: ["tee_1_2", "price_per_unit"] },
      { label: "½ inch Brass Socket", unit: "PKR / unit", path: ["brass_socket_1_2", "price_per_unit"] },
      { label: "1¼ inch PPRC Pipe", unit: "PKR / ft", path: ["pipe_1_25_inch", "price_per_ft"] },
      { label: "1¼ inch Socket", unit: "PKR / unit", path: ["socket_1_25", "price_per_unit"] },
      { label: "1¼ inch Elbow", unit: "PKR / unit", path: ["elbow_1_25", "price_per_unit"] },
      { label: "1¼ inch Tee", unit: "PKR / unit", path: ["tee_1_25", "price_per_unit"] },
    ],
  },
  {
    title: "Plumbing — Sewer Pipes",
    color: "text-teal-400",
    border: "border-teal-500/30",
    bg: "bg-teal-500/5",
    fields: [
      { label: "6 inch Sewer Pipe", unit: "PKR / ft", path: ["pipe_6_inch_sewer_pipe", "price_per_ft"] },
      { label: "6 inch Socket", unit: "PKR / unit", path: ["socket_6_inch", "price_per_unit"] },
      { label: "6 inch Elbow", unit: "PKR / unit", path: ["elbow_6_inch", "price_per_unit"] },
      { label: "4 inch Sewer Pipe", unit: "PKR / ft", path: ["pipe_4_inch_sewer_pipe", "price_per_ft"] },
      { label: "4 inch Socket", unit: "PKR / unit", path: ["socket_4_inch", "price_per_unit"] },
      { label: "4 inch Elbow", unit: "PKR / unit", path: ["elbow_4_inch", "price_per_unit"] },
      { label: "4 inch Tee", unit: "PKR / unit", path: ["tee_4_inch", "price_per_unit"] },
      { label: "4 inch Y-Tee", unit: "PKR / unit", path: ["ytee_4_inch", "price_per_unit"] },
      { label: "4 inch P-Trap", unit: "PKR / unit", path: ["ptrap_4_inch", "price_per_unit"] },
    ],
  },
  {
    title: "Plumbing — Bathroom & Kitchen Fixtures",
    color: "text-sky-400",
    border: "border-sky-500/30",
    bg: "bg-sky-500/5",
    fields: [
      { label: "Bathroom Set", unit: "PKR / unit", path: ["bathroom_set", "price_per_unit"] },
      { label: "Wash Basin", unit: "PKR / unit", path: ["wash_basin", "price_per_unit"] },
      { label: "Commode", unit: "PKR / unit", path: ["commode", "price_per_unit"] },
      { label: "Kitchen Sink", unit: "PKR / unit", path: ["kitchen_sink", "price_per_unit"] },
      { label: "Kitchen Mixer Tap", unit: "PKR / unit", path: ["kitchen_mixer", "price_per_unit"] },
      { label: "Washing Area Tap", unit: "PKR / unit", path: ["washing_tap", "price_per_unit"] },
    ],
  },
  {
    title: "Paint Work",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    fields: [
      { label: "Interior Paint", unit: "PKR / gallon", path: ["paint", "price_per_gallon"] },
      { label: "Primer", unit: "PKR / gallon", path: ["primer", "price_per_gallon"] },
      { label: "Putty", unit: "PKR / gallon", path: ["putty", "price_per_gallon"] },
      { label: "Exterior Paint", unit: "PKR / gallon", path: ["exterior_paint", "price_per_gallon"] },
    ],
  },
  {
    title: "Electrical",
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    fields: [
      { label: "Wire 3/29 (Light)", unit: "PKR / ft", path: ["wire_3_29", "price_per_ft"] },
      { label: "Wire 7/29 (Fan/Socket)", unit: "PKR / ft", path: ["wire_7_29", "price_per_ft"] },
      { label: "Wire 7/36 (AC)", unit: "PKR / ft", path: ["wire_7_36", "price_per_ft"] },
      { label: "Wire 7/44 (Main)", unit: "PKR / ft", path: ["wire_7_44", "price_per_ft"] },
      { label: "Conduit Pipe", unit: "PKR / ft", path: ["pipe", "price_per_ft"] },
      { label: "Band (Clip)", unit: "PKR / unit", path: ["band", "price_per_unit"] },
      { label: "Plastic Socket", unit: "PKR / unit", path: ["plastic_socket", "price_per_unit"] },
      { label: "Fan Box", unit: "PKR / unit", path: ["fan_box", "price_per_unit"] },
      { label: "Switch Box", unit: "PKR / unit", path: ["switch_box", "price_per_unit"] },
      { label: "Electric Sheet (Point)", unit: "PKR / unit", path: ["electric_sheet", "price_per_unit"] },
      { label: "LED Light", unit: "PKR / unit", path: ["led_light", "price_per_unit"] },
      { label: "DB Board", unit: "PKR / unit", path: ["db", "price_per_unit"] },
      { label: "Circuit Breaker", unit: "PKR / unit", path: ["breaker", "price_per_unit"] },
    ],
  },
  {
    title: "Doors & Windows",
    color: "text-green-400",
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    fields: [
      { label: "Door", unit: "PKR / sft", path: ["door", "price_per_sft"] },
      { label: "Window", unit: "PKR / sft", path: ["window", "price_per_sft"] },
      { label: "Door / Window Frame (Chokhat)", unit: "PKR / rft", path: ["door_window_frame", "price_per_rft"] },
      { label: "Door Lock", unit: "PKR / lock", path: ["door_lock", "price_per_lock"] },
      { label: "Bolt", unit: "PKR / bolt", path: ["bolt", "price_per_bolt"] },
      { label: "Door Stopper", unit: "PKR / stopper", path: ["door_stopper", "price_per_stopper"] },
    ],
  },
  {
    title: "Labour Cost",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    fields: [
      { label: "Labour Rate", unit: "PKR / sqft", path: ["labour", "rate_per_sqft"] },
    ],
  },
];

// ── Types ──────────────────────────────────────────────────────────────
type PricesJson = Record<string, Record<string, number>>;

export default function AdminPricesPage() {
  const [prices, setPrices] = useState<PricesJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PRICE_GROUPS.map((g) => [g.title, true]))
  );

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => { setPrices(data); setLoading(false); })
      .catch(() => { setError("Failed to load prices. Is the backend running?"); setLoading(false); });
  }, []);

  const getValue = (path: [string, string]): number => {
    if (!prices) return 0;
    return prices?.[path[0]]?.[path[1]] ?? 0;
  };

  const setValue = (path: [string, string], val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setPrices((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [path[0]]: { ...prev[path[0]], [path[1]]: num },
      };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!prices) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prices),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setSaved(false);
    setError("");
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => { setPrices(data); setLoading(false); })
      .catch(() => { setError("Failed to load prices."); setLoading(false); });
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">BuildCost</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 text-sm font-medium">Admin — Material Prices</span>
          </div>
          <div className="flex items-center gap-2">
            <OpenChatButton />
            <Link href="/" className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
              <House className="w-4 h-4" /> Home
            </Link>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !prices}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Material Price Manager</h1>
          <p className="text-slate-400">Update construction material prices. Changes take effect on the next estimate calculation.</p>
        </div>

        {/* Status messages */}
        {saved && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-5 py-3 mb-6">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">All prices saved successfully!</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-3 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-slate-400 text-sm">Loading prices from backend…</p>
            </div>
          </div>
        )}

        {/* Price Groups */}
        {!loading && prices && (
          <div className="space-y-4">
            {PRICE_GROUPS.map((group) => {
              const isOpen = openGroups[group.title];
              return (
                <div key={group.title} className={`border rounded-2xl overflow-hidden ${group.border} ${group.bg}`}>

                  {/* Group Header */}
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                    onClick={() => toggleGroup(group.title)}
                  >
                    <span className={`font-semibold text-sm ${group.color}`}>{group.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">{group.fields.length} items</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </button>

                  {/* Fields */}
                  {isOpen && (
                    <div className="px-6 pb-5 border-t border-slate-800/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {group.fields.map((field) => (
                          <div key={field.path.join(".")} className="bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-3">
                            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                              {field.label}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={getValue(field.path)}
                                onChange={(e) => setValue(field.path, e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-2 text-white text-sm transition-colors"
                              />
                              <span className="text-xs text-slate-500 whitespace-nowrap min-w-fit">{field.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Save Button */}
        {!loading && prices && (
          <div className="mt-8 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4">
            <p className="text-slate-400 text-sm">
              {saved
                ? "✓ All changes saved."
                : "Make changes above then click Save."}
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
