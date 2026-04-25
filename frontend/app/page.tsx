import Link from "next/link";
import {
  Building2, Wrench, Droplets, Paintbrush, Zap,
  DoorOpen, HardHat, ArrowRight, CheckCircle2,
  ClipboardList, Calculator, BarChart3
} from "lucide-react";
import OpenChatButton from "@/components/OpenChatButton";

const features = [
  {
    icon: Building2,
    title: "Gray Structure",
    desc: "Bricks, cement, sand, concrete, plaster, tiles — complete civil work breakdown",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: Wrench,
    title: "Steel Work",
    desc: "Steel bars for columns, beams, slabs with per-ton pricing",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Droplets,
    title: "Plumbing",
    desc: "PPRC pipes, PVC sewer lines, bathroom fixtures, kitchen fittings",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Paintbrush,
    title: "Paint Work",
    desc: "Interior & exterior paint, primer, putty — all in 4-litre gallons",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Zap,
    title: "Electrical",
    desc: "Wiring, conduits, DB boards, breakers, LED lights, fan points",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    icon: DoorOpen,
    title: "Doors & Windows",
    desc: "Doors, windows, chokhat frames, locks, bolts — all sizes calculated",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: HardHat,
    title: "Labour Cost",
    desc: "Per-sqft labour rate covering all construction phases",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
];

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Enter Project Details",
    desc: "Enter plot size, floors, rooms, bathrooms, kitchen — all basic project info",
  },
  {
    number: "02",
    icon: Calculator,
    title: "Automatic Calculation",
    desc: "Our engine instantly calculates material quantities and costs for all 7 categories",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "View Detailed Results",
    desc: "Category-wise breakdown with grand total — you can print or save it",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">BuildCost</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <Link href="/floor-plan" className="hover:text-white transition-colors">Floor Plan</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          </div>
          <div className="flex items-center gap-2">
            <OpenChatButton />
            <Link
              href="/estimate"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Start Estimate
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20" />
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 text-orange-400 text-sm font-medium mb-8 animate-fade-in-up">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              Pakistan's #1 Construction Cost Estimator
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up delay-100">
              Build Smart,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Estimate Smarter
              </span>
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl animate-fade-in-up delay-200">
              Get an accurate cost estimate for your home or building in seconds.
              Detailed breakdown across 7 categories — from gray structure to finishing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in-up delay-300">
              <Link
                href="/estimate"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
              >
                Start Estimate
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all"
              >
                How Does It Work?
              </a>
            </div>

            <div className="flex flex-wrap gap-10 animate-fade-in-up delay-400">
              {[
                { value: "7+", label: "Cost Categories" },
                { value: "100%", label: "Accurate Results" },
                { value: "Fast", label: "Instant Results" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-orange-400">{stat.value}</div>
                  <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-4">
              Complete Coverage
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Accurate Estimate for Every Category
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Detailed material and cost breakdown for every aspect of construction — nothing is missed
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`border rounded-xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${f.bg}`}
              >
                <div className={`w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}

            {/* CTA card */}
            <div className="border border-dashed border-orange-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-orange-500/5 hover:bg-orange-500/10 transition-all">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                <ArrowRight className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-slate-300 font-medium mb-3">Ready to estimate?</p>
              <Link
                href="/estimate"
                className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors"
              >
                Start Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-4">
              Simple Process
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Just 3 Simple Steps</h2>
            <p className="text-slate-400 text-lg">Get your complete construction estimate in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-slate-700 via-orange-500/40 to-slate-700" />

            {steps.map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-orange-500/50 transition-all mb-6 mx-auto">
                  <step.icon className="w-8 h-8 text-orange-400" />
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium mb-6">
                What You Get
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Complete <span className="text-orange-400">Detailed Breakdown</span>
              </h2>
              <div className="space-y-4">
                {[
                  "Separate total cost for each category",
                  "Material quantities (bags, kg, litre, pcs)",
                  "Grand total at a glance",
                  "Percentage share of each category",
                  "Underground tank, overhead tank, tower — all optional",
                  "Based on current Pakistan market rates",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/estimate"
                className="inline-flex items-center gap-2 mt-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Start Your Estimate <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Preview card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Sample Estimate Preview</span>
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">Ready</span>
              </div>
              {[
                { label: "Gray Structure", cost: "19,55,330", pct: 34, color: "bg-orange-500" },
                { label: "Steel Work", cost: "14,89,750", pct: 26, color: "bg-blue-500" },
                { label: "Labour Cost", cost: "12,60,000", pct: 22, color: "bg-red-500" },
                { label: "Doors & Windows", cost: "3,76,550", pct: 7, color: "bg-green-500" },
                { label: "Plumbing", cost: "3,29,000", pct: 6, color: "bg-cyan-500" },
                { label: "Paint Work", cost: "2,88,387", pct: 5, color: "bg-purple-500" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{row.label}</span>
                    <span className="text-white font-medium">{row.cost} PKR</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm">Grand Total</span>
                <span className="text-orange-400 font-bold text-lg">57,90,514 PKR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Planning to Build Your Home?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Get an accurate estimate now and know the complete costing of your construction project
            </p>
            <Link
              href="/estimate"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-5 rounded-xl transition-all shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 animate-pulse-glow"
            >
              Start Your Estimate Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-slate-500 text-sm mt-4">Accurate results — no account required</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">BuildCost</span>
          </div>
          <p className="text-slate-500 text-sm">Construction Cost Estimator — Pakistan</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact Us</Link>
            <Link href="/admin/prices" className="hover:text-slate-300 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
