"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { IceCream, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-foreground overflow-hidden">
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Subtle ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, var(--foreground) 0%, transparent 70%)", opacity: 0.05 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)", opacity: 0.3 }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div
          className="h-16 w-16 rounded-2xl overflow-hidden border border-border/40"
          style={{ boxShadow: "0 0 40px var(--foreground), 0 2px 8px rgba(0,0,0,0.15)" }}
        >
          <img src="/logo.jpg" alt="HMJ Tekinfo Logo" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground tracking-tight">ICE HMJ Tekinfo</h1>
          <p className="text-sm text-muted-foreground">Sistem Kasir & Dashboard</p>
        </div>

        {/* CTA */}
        <Link href="/login">
          <button
            className="flex items-center gap-2.5 h-12 px-7 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-xl group"
          >
            Mulai Aplikasi
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </div>

      {/* Bottom line */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)", opacity: 0.2 }}
      />
    </div>
  );
}
