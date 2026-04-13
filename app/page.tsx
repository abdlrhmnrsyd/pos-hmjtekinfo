"use client";

import Link from "next/link";
import { ArrowRight, IceCream, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const features = [
  {
    icon: Zap,
    title: "Transaksi Cepat",
    desc: "Proses pesanan dalam hitungan detik. Mendukung QRIS dan tunai secara real-time.",
  },
  {
    icon: ShieldCheck,
    title: "Data Aman",
    desc: "Autentikasi Supabase dengan enkripsi penuh. Semua data tersimpan aman di cloud.",
    featured: true,
  },
  {
    icon: BarChart3,
    title: "Analitik Lengkap",
    desc: "Grafik pendapatan harian, produk terlaris, ringkasan — semuanya dalam satu layar.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[oklch(0.06_0_0)] overflow-hidden">
      {/* Subtle top-center gradient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col min-h-screen max-w-5xl mx-auto px-6">
        {/* ── Nav ── */}
        <motion.nav
          {...anim(0)}
          className="flex items-center justify-between py-6"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
              <IceCream className="h-4 w-4 text-black" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">ICE HMJ Tekinfo</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-white/40 hover:text-white/80 transition-colors hidden sm:block">
              Masuk
            </Link>
            <Link href="/login">
              <button className="h-8 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors">
                Mulai
              </button>
            </Link>
          </div>
        </motion.nav>

        {/* ── Hero ── */}
        <main className="flex-1 flex flex-col items-center justify-center text-center pt-12 pb-24">
          {/* Badge */}
          <motion.div {...anim(0.05)} className="mb-7">
            <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-white/10 text-[10px] font-medium text-white/50 tracking-wide uppercase">
              <span className="h-1 w-1 rounded-full bg-white/60 animate-[dot-pulse_2s_ease-in-out_infinite]" />
              Point of Sale · ICE HMJ
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...anim(0.12)}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-5"
          >
            Sistem Kasir untuk<br />
            <span className="text-white/40">Toko Es Krim</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            {...anim(0.2)}
            className="max-w-md text-sm text-white/35 leading-relaxed mb-10"
          >
            Kelola penjualan, produk, dan laporan keuangan — semua dalam satu
            dashboard yang bersih dan cepat.
          </motion.p>

          {/* CTA */}
          <motion.div {...anim(0.27)} className="flex items-center gap-3 flex-wrap justify-center">
            <Link href="/login">
              <button className="h-11 px-7 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all flex items-center gap-2 hover:gap-3">
                Buka Kasir
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
            <Link href="/kasir">
              <button className="h-11 px-7 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/20 hover:text-white/80 transition-all">
                Lihat Demo
              </button>
            </Link>
          </motion.div>
        </main>

        {/* ── Features ── */}
        <section className="pb-20">
          <div className="border-t border-white/[0.06] pt-14 grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                {...anim(0.1 + i * 0.08)}
                className={`rounded-2xl p-6 transition-all duration-300 group relative overflow-hidden ${
                  f.featured
                    ? "bg-white/[0.06] border border-white/12"
                    : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"
                }`}
              >
                {f.featured && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)" }}
                  />
                )}
                <div
                  className={`relative h-9 w-9 rounded-xl flex items-center justify-center mb-5 ${
                    f.featured ? "bg-white text-black" : "bg-white/[0.06] text-white/60"
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="relative text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="relative text-xs text-white/35 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.06] py-6 flex items-center justify-between">
          <span className="text-xs text-white/20">© 2025 ICE HMJ Tekinfo</span>
          <span className="text-xs text-white/15">POS System</span>
        </footer>
      </div>
    </div>
  );
}
