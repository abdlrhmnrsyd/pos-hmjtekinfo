"use client";

import Link from "next/link";
import { IceCream, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[oklch(0.06_0_0)] overflow-hidden">

      {/* Subtle ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div
          className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center"
          style={{ boxShadow: "0 0 40px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.4)" }}
        >
          <IceCream className="h-8 w-8 text-black" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">ICE HMJ Tekinfo</h1>
          <p className="text-sm text-white/30">Sistem Kasir & Dashboard</p>
        </div>

        {/* CTA */}
        <Link href="/login">
          <button
            className="flex items-center gap-2.5 h-12 px-7 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all group"
            style={{ boxShadow: "0 4px 24px rgba(255,255,255,0.14)" }}
          >
            Mulai Aplikasi
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </div>

      {/* Bottom line */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
      />
    </div>
  );
}
