"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, ArrowRight, ArrowLeft, Loader2,
  Home, BedDouble, Settings2, CheckCircle2, AlertCircle, House
} from "lucide-react";
import OpenChatButton from "@/components/OpenChatButton";

interface FormData {
  plot_size_sqft: string;
  plot_length_ft: string;
  plot_width_ft: string;
  construction_percentage: string;
  number_of_floors: string;
  number_of_columns: string;
  number_of_rooms: string;
  number_of_bathrooms: string;
  number_of_kitchens: string;
  room_sizes: string;
  bathroom_sizes: string;
  kitchen_sizes: string;
  number_of_washingareas: string;
  number_of_geysers: string;
  include_underground_tank: boolean;
  ug_tank_length_ft: string;
  ug_tank_width_ft: string;
  include_overhead_tank: boolean;
  oh_tank_length_ft: string;
  oh_tank_width_ft: string;
  include_tower: boolean;
  tower_length_ft: string;
  tower_width_ft: string;
}

const initialForm: FormData = {
  plot_size_sqft: "",
  plot_length_ft: "",
  plot_width_ft: "",
  construction_percentage: "100",
  number_of_floors: "",
  number_of_columns: "14",
  number_of_rooms: "",
  number_of_bathrooms: "",
  number_of_kitchens: "",
  room_sizes: "",
  bathroom_sizes: "",
  kitchen_sizes: "",
  number_of_washingareas: "",
  number_of_geysers: "",
  include_underground_tank: false,
  ug_tank_length_ft: "",
  ug_tank_width_ft: "",
  include_overhead_tank: false,
  oh_tank_length_ft: "",
  oh_tank_width_ft: "",
  include_tower: false,
  tower_length_ft: "",
  tower_width_ft: "",
};

const steps = [
  { id: 1, label: "Plot Details", icon: Home },
  { id: 2, label: "Room Config", icon: BedDouble },
  { id: 3, label: "Extra Features", icon: Settings2 },
];

interface FieldProps {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (name: keyof FormData, value: string) => void;
  placeholder?: string;
  type?: string;
  helper?: string;
  required?: boolean;
}

function Field({ label, name, value, onChange, placeholder, type = "number", helper, required }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-orange-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none transition-all"
      />
      {helper && <p className="text-slate-500 text-xs mt-1.5">{helper}</p>}
    </div>
  );
}

interface ToggleCardProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

function ToggleCard({ label, description, checked, onToggle, children }: ToggleCardProps) {
  return (
    <div className={`border rounded-xl p-4 ${checked ? "border-orange-500/50 bg-orange-500/5" : "border-slate-700 bg-slate-800/50"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors mt-0.5 ${checked ? "bg-orange-500" : "bg-slate-600"}`}
        >
          <span
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"
            style={{ transform: checked ? "translateX(24px)" : "translateX(0px)" }}
          />
        </button>
      </div>
      {checked && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EstimatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (name: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (): string => {
    if (step === 1) {
      if (!form.plot_size_sqft) return "Plot size is required";
      if (!form.plot_length_ft) return "Plot length is required";
      if (!form.plot_width_ft) return "Plot width is required";
      if (!form.number_of_floors) return "Number of floors is required";
    }
    if (step === 2) {
      if (!form.number_of_rooms) return "Number of rooms is required";
      if (!form.number_of_bathrooms) return "Number of bathrooms is required";
      if (!form.number_of_kitchens) return "Number of kitchens is required";
      if (!form.room_sizes) return "Room sizes are required (e.g. 12x12, 14x14)";
      if (!form.bathroom_sizes) return "Bathroom sizes are required";
      if (!form.kitchen_sizes) return "Kitchen sizes are required";
      if (!form.number_of_washingareas) return "Number of washing areas is required";
      if (!form.number_of_geysers) return "Number of geysers is required";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const payload = {
      plot_size_sqft: parseFloat(form.plot_size_sqft),
      plot_length_ft: parseFloat(form.plot_length_ft),
      plot_width_ft: parseFloat(form.plot_width_ft),
      construction_percentage: parseFloat(form.construction_percentage) || 100,
      number_of_floors: parseInt(form.number_of_floors),
      number_of_columns: parseInt(form.number_of_columns) || 14,
      number_of_rooms: parseInt(form.number_of_rooms),
      number_of_bathrooms: parseInt(form.number_of_bathrooms),
      number_of_kitchens: parseInt(form.number_of_kitchens),
      room_sizes: form.room_sizes,
      bathroom_sizes: form.bathroom_sizes,
      kitchen_sizes: form.kitchen_sizes,
      number_of_washingareas: parseInt(form.number_of_washingareas),
      number_of_geysers: parseInt(form.number_of_geysers),
      include_underground_tank: form.include_underground_tank,
      ug_tank_length_ft: parseFloat(form.ug_tank_length_ft) || 0,
      ug_tank_width_ft: parseFloat(form.ug_tank_width_ft) || 0,
      include_overhead_tank: form.include_overhead_tank,
      oh_tank_length_ft: parseFloat(form.oh_tank_length_ft) || 0,
      oh_tank_width_ft: parseFloat(form.oh_tank_width_ft) || 0,
      include_tower: form.include_tower,
      tower_length_ft: parseFloat(form.tower_length_ft) || 0,
      tower_width_ft: parseFloat(form.tower_width_ft) || 0,
    };

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.error || "Server error — is the backend running?";
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          msg = `${msg}: ${data.details.join(" ")}`;
        }
        throw new Error(msg);
      }

      sessionStorage.setItem("estimateResult", JSON.stringify(data));
      sessionStorage.setItem("estimateInput", JSON.stringify(payload));
      router.push("/results");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">BuildCost</span>
          </Link>
          <div className="flex items-center gap-2">
            <OpenChatButton />
            <Link href="/" className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
              <House className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-28 pb-16">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${step >= s.id ? "text-white" : "text-slate-500"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.id ? "bg-green-500" : step === s.id ? "bg-orange-500" : "bg-slate-700"
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className="hidden sm:block text-sm font-medium">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${step > s.id ? "bg-green-500/50" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Plot Details</h2>
                <p className="text-slate-400">Enter basic information about your plot and building</p>
              </div>
              <Field label="Plot Size" name="plot_size_sqft" value={form.plot_size_sqft} onChange={setField} placeholder="e.g. 1800" helper="Total area in square feet" required />
              <Field label="Construction Area (%)" name="construction_percentage" value={form.construction_percentage} onChange={setField} placeholder="e.g. 80" helper="Percentage of plot area to be constructed (0-100)" required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Plot Length (ft)" name="plot_length_ft" value={form.plot_length_ft} onChange={setField} placeholder="e.g. 40" required />
                <Field label="Plot Width (ft)" name="plot_width_ft" value={form.plot_width_ft} onChange={setField} placeholder="e.g. 45" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Number of Floors" name="number_of_floors" value={form.number_of_floors} onChange={setField} placeholder="e.g. 2" required />
                <Field label="Number of Columns" name="number_of_columns" value={form.number_of_columns} onChange={setField} placeholder="default: 14" helper="Default is 14" />
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Room Configuration</h2>
                <p className="text-slate-400">Enter details for rooms, bathrooms, and kitchen</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Rooms (per floor)" name="number_of_rooms" value={form.number_of_rooms} onChange={setField} placeholder="e.g. 3" required />
                <Field label="Bathrooms (per floor)" name="number_of_bathrooms" value={form.number_of_bathrooms} onChange={setField} placeholder="e.g. 2" required />
                <Field label="Kitchens (per floor)" name="number_of_kitchens" value={form.number_of_kitchens} onChange={setField} placeholder="e.g. 1" required />
              </div>
              <Field label="Room Sizes" name="room_sizes" value={form.room_sizes} onChange={setField} placeholder="12x12, 14x14, 12x14" type="text" helper="Length x Width per room, comma-separated" required />
              <Field label="Bathroom Sizes" name="bathroom_sizes" value={form.bathroom_sizes} onChange={setField} placeholder="6x6, 6x6" type="text" helper="Each bathroom size per floor, comma-separated" required />
              <Field label="Kitchen Sizes" name="kitchen_sizes" value={form.kitchen_sizes} onChange={setField} placeholder="10x12" type="text" helper="Each kitchen size per floor, comma-separated" required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Washing Areas" name="number_of_washingareas" value={form.number_of_washingareas} onChange={setField} placeholder="e.g. 1" required />
                <Field label="Geysers" name="number_of_geysers" value={form.number_of_geysers} onChange={setField} placeholder="e.g. 2" required />
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Extra Features</h2>
                <p className="text-slate-400">Optional additions — include what you need</p>
              </div>

              <ToggleCard
                label="Underground Water Tank"
                description="Underground water storage tank"
                checked={form.include_underground_tank}
                onToggle={() => setForm((p) => ({ ...p, include_underground_tank: !p.include_underground_tank }))}
              >
                <Field label="Length (ft)" name="ug_tank_length_ft" value={form.ug_tank_length_ft} onChange={setField} placeholder="e.g. 8" />
                <Field label="Width (ft)" name="ug_tank_width_ft" value={form.ug_tank_width_ft} onChange={setField} placeholder="e.g. 6" />
              </ToggleCard>

              <ToggleCard
                label="Overhead Water Tank"
                description="Water tank placed on the rooftop"
                checked={form.include_overhead_tank}
                onToggle={() => setForm((p) => ({ ...p, include_overhead_tank: !p.include_overhead_tank }))}
              >
                <Field label="Length (ft)" name="oh_tank_length_ft" value={form.oh_tank_length_ft} onChange={setField} placeholder="e.g. 6" />
                <Field label="Width (ft)" name="oh_tank_width_ft" value={form.oh_tank_width_ft} onChange={setField} placeholder="e.g. 5" />
              </ToggleCard>

              <ToggleCard
                label="Water Tower"
                description="Elevated water tower structure"
                checked={form.include_tower}
                onToggle={() => setForm((p) => ({ ...p, include_tower: !p.include_tower }))}
              >
                <Field label="Length (ft)" name="tower_length_ft" value={form.tower_length_ft} onChange={setField} placeholder="e.g. 6" />
                <Field label="Width (ft)" name="tower_width_ft" value={form.tower_width_ft} onChange={setField} placeholder="e.g. 6" />
              </ToggleCard>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    Calculate Estimate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Step {step} of {steps.length} — Your data stays only in your browser
        </p>
      </main>
    </div>
  );
}
