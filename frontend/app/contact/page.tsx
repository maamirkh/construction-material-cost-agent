import Link from "next/link";
import {
  Building2, Phone, Mail, MapPin, Clock, MessageSquare,
  Facebook, Instagram, Youtube, ArrowRight, House,
  PhoneCall, Send, CheckCircle2
} from "lucide-react";
import OpenChatButton from "@/components/OpenChatButton";

const contactCards = [
  {
    icon: Phone,
    title: "Phone & WhatsApp",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    items: [
      { label: "Primary", value: "+92 300 1234567" },
      { label: "Secondary", value: "+92 321 9876543" },
    ],
  },
  {
    icon: Mail,
    title: "Email",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    items: [
      { label: "General", value: "info@buildcost.pk" },
      { label: "Support", value: "support@buildcost.pk" },
    ],
  },
  {
    icon: MapPin,
    title: "Office Address",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    items: [
      { label: "Location", value: "Office # 12, 2nd Floor" },
      { label: "", value: "Tech Tower, Blue Area" },
      { label: "", value: "Islamabad, Pakistan" },
    ],
  },
  {
    icon: Clock,
    title: "Working Hours",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    items: [
      { label: "Mon – Sat", value: "9:00 AM – 6:00 PM" },
      { label: "Sunday", value: "Closed" },
    ],
  },
];

const socials = [
  {
    icon: Facebook,
    label: "Facebook",
    handle: "@BuildCostPK",
    href: "#",
    color: "text-blue-400",
    bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/60",
  },
  {
    icon: Instagram,
    label: "Instagram",
    handle: "@buildcost.pk",
    href: "#",
    color: "text-pink-400",
    bg: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 hover:border-pink-500/60",
  },
  {
    icon: Youtube,
    label: "YouTube",
    handle: "BuildCost Pakistan",
    href: "#",
    color: "text-red-400",
    bg: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 hover:border-red-500/60",
  },
];

const faqs = [
  {
    q: "How accurate is the cost estimate?",
    a: "Our estimates are based on current Pakistan market rates and standard construction norms. Actual costs may vary ±10–15% depending on location, material quality, and contractor rates.",
  },
  {
    q: "Can I get a custom estimate for my project?",
    a: "Yes! Use our online estimator tool for instant results, or contact us directly for a detailed custom quotation tailored to your specific project.",
  },
  {
    q: "Do you provide on-site consultation?",
    a: "We offer both online and on-site consultation services. Contact us via phone or email to schedule an appointment.",
  },
  {
    q: "How do I download my estimate report?",
    a: "After generating your estimate, you can download it in PDF or MS Word format directly from the results page.",
  },
];

export default function ContactPage() {
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
          <div className="flex items-center gap-3">
            <OpenChatButton />
            <Link href="/" className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
              <House className="w-4 h-4" /> Home
            </Link>
            <Link href="/estimate" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Get Estimate <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20">

        {/* ── Hero ───────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 text-center py-14">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4" /> Get In Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            We&apos;re Here to <span className="text-orange-400">Help You</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Have questions about your construction project? Need a custom estimate or consultation?
            Our team is ready to assist you.
          </p>
        </section>

        {/* ── Contact Cards ───────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border p-6 ${card.bg} ${card.border} flex flex-col gap-4 hover:scale-[1.02] transition-transform`}
              >
                <div className={`w-11 h-11 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm mb-3 ${card.color}`}>{card.title}</p>
                  <div className="space-y-1.5">
                    {card.items.map((item, i) => (
                      <div key={i}>
                        {item.label && (
                          <p className="text-slate-500 text-xs">{item.label}</p>
                        )}
                        <p className="text-white text-sm font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Main Content: Map + Quick Actions ──────────── */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Map placeholder */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="relative h-56 bg-slate-800 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "radial-gradient(circle, #ea580c 1px, transparent 1px)",
                    backgroundSize: "28px 28px"
                  }}
                />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-orange-500/20 border-2 border-orange-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-white font-semibold">BuildCost Office</p>
                  <p className="text-slate-400 text-sm text-center px-4">Tech Tower, Blue Area<br />Islamabad, Pakistan</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-slate-400 text-sm mb-4">
                  Easily accessible via public transport. Parking available on-site.
                </p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                >
                  <MapPin className="w-4 h-4" /> Open in Google Maps <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
              <a
                href="tel:+923001234567"
                className="flex items-center gap-4 bg-green-500/10 border border-green-500/30 hover:border-green-500/60 hover:bg-green-500/15 rounded-2xl p-5 transition-all group"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PhoneCall className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Call Us Now</p>
                  <p className="text-green-400 text-sm">+92 300 1234567</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/15 rounded-2xl p-5 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">WhatsApp Chat</p>
                  <p className="text-emerald-400 text-sm">Chat with us instantly</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="mailto:info@buildcost.pk"
                className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/15 rounded-2xl p-5 transition-all group"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Send className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Send an Email</p>
                  <p className="text-orange-400 text-sm">info@buildcost.pk</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </a>

              <Link
                href="/estimate"
                className="flex items-center gap-4 bg-slate-800 border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800/80 rounded-2xl p-5 transition-all group"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Start Your Estimate</p>
                  <p className="text-slate-400 text-sm">Get instant cost breakdown</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Social Media ───────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">Follow Us on Social Media</h2>
            <p className="text-slate-400 text-sm mb-6">Stay updated with construction tips, material prices, and project insights.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 border rounded-xl p-4 transition-all ${s.bg}`}
                >
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                  <div>
                    <p className="text-white font-medium text-sm">{s.label}</p>
                    <p className={`text-xs ${s.color}`}>{s.handle}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-6 mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-center text-sm mb-8">Quick answers to common questions</p>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-2">{faq.q}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30 rounded-2xl p-10 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-3">Ready to Estimate Your Project?</h2>
              <p className="text-slate-400 mb-6">Get a detailed, AI-powered construction cost breakdown in minutes.</p>
              <Link
                href="/estimate"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3 rounded-xl font-semibold transition-all"
              >
                Start Estimate <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-10">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">BuildCost</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} BuildCost Pakistan. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/estimate" className="hover:text-white transition-colors">Estimate</Link>
            <Link href="/contact" className="hover:text-orange-400 transition-colors text-orange-400">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
