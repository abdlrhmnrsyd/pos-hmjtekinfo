"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  User, Lock, Eye, EyeOff, ShoppingBag, Coins,
  CreditCard, Banknote, CheckCircle2, XCircle, AlertCircle,
  KeyRound, Receipt, ArrowLeft, IceCream, CalendarDays,
  Trophy, Star, Medal, Crown, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

/* ─── Types ─── */
type Period = "daily" | "weekly" | "monthly";

interface TransactionItem { quantity: number; products: { name: string } | null; }
interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  transaction_items: TransactionItem[];
}
interface Profile {
  id: string;
  name: string | null;
  role: string;
  created_at: string;
}
interface ChartEntry { name: string; sales: number; label: string; }
type Toast = { type: "success" | "error"; msg: string } | null;

/* ─── Helpers ─── */
const fmt      = (n: number) => n.toLocaleString("id-ID");
const fmtShort = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}Jt` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;
const formatDate = (s: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));
const timeAgo = (d: string) => {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 60) return `${min}m lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j lalu`;
  return `${Math.floor(hr / 24)}h lalu`;
};

/* ─── Build chart data ─── */
function buildChartData(transactions: Transaction[], period: Period): ChartEntry[] {
  const now = new Date();
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  if (period === "daily") {
    const map = new Map<string, ChartEntry>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split("T")[0];
      map.set(key, { name: days[d.getDay()], sales: 0, label: key });
    }
    transactions.forEach(t => {
      const key = new Date(t.created_at).toISOString().split("T")[0];
      if (map.has(key)) map.get(key)!.sales += t.total_amount;
    });
    return Array.from(map.values());
  }

  if (period === "weekly") {
    const entries: ChartEntry[] = [];
    for (let w = 3; w >= 0; w--) {
      const wStart = new Date(now);
      wStart.setDate(wStart.getDate() - wStart.getDay() + 1 - w * 7);
      wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 6); wEnd.setHours(23, 59, 59, 999);
      const weekLabel = `${wStart.getDate()}/${wStart.getMonth() + 1}`;
      const sales = transactions
        .filter(t => { const d = new Date(t.created_at); return d >= wStart && d <= wEnd; })
        .reduce((s, t) => s + t.total_amount, 0);
      entries.push({ name: `W${4 - w}`, sales, label: `Minggu ${weekLabel}` });
    }
    return entries;
  }

  // Monthly: last 6 months
  const entries: ChartEntry[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear(); const month = d.getMonth();
    const sales = transactions
      .filter(t => { const td = new Date(t.created_at); return td.getFullYear() === year && td.getMonth() === month; })
      .reduce((s, t) => s + t.total_amount, 0);
    entries.push({ name: months[month], sales, label: `${months[month]} ${year}` });
  }
  return entries;
}

/* ─── Period filter ─── */
function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === "daily") {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
  }
  if (period === "weekly") {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay() + 1); d.setHours(0, 0, 0, 0); return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 rounded-xl shadow-2xl min-w-[140px] bg-popover/95 border border-border backdrop-blur-md">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{payload[0]?.payload?.label}</p>
      <p className="text-sm font-bold text-foreground">Rp {fmt(Number(payload[0]?.value || 0))}</p>
    </div>
  );
}

/* ─── Period Tabs ─── */
function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const tabs: { key: Period; label: string }[] = [
    { key: "daily", label: "Harian" },
    { key: "weekly", label: "Mingguan" },
    { key: "monthly", label: "Bulanan" },
  ];
  return (
    <div className="flex items-center border border-border/50 rounded-2xl overflow-hidden bg-foreground/[0.02] p-1 gap-1">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`h-8 px-4 rounded-xl text-[11px] font-semibold transition-all ${
            value === t.key ? "bg-primary text-primary-foreground" : "text-foreground/35 hover:text-foreground/70"
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Toast Banner ─── */
function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl bg-popover/95 backdrop-blur-md"
      style={{
        border: toast.type === "success" ? "1px solid var(--border)" : "1px solid var(--destructive)",
      }}>
      {toast.type === "success"
        ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
      <span className="text-xs font-semibold text-foreground/75">{toast.msg}</span>
      <button onClick={onDismiss} className="ml-2 text-muted-foreground hover:text-foreground text-xs">✕</button>
    </div>
  );
}

/* ─────────────── MAIN ─────────────── */
export default function ProfilePage() {
  const router = useRouter();

  /* --- state --- */
  const [loading, setLoading]   = useState(true);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [email, setEmail]       = useState("");
  const [userId, setUserId]     = useState("");

  const [allTrx, setAllTrx]     = useState<Transaction[]>([]);
  const [trxLoading, setTrxLoading] = useState(true);
  const [period, setPeriod]     = useState<Period>("daily");
  const [rank, setRank]         = useState<number | null>(null);
  const [totalStaffCount, setTotalStaffCount] = useState(0);

  /* password form */
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading]   = useState(false);

  const [toast, setToast] = useState<Toast>(null);
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Bootstrap ── */
  useEffect(() => {
    (async () => {
      let { data: { user } } = await supabase.auth.getUser();

      // Fallback: Check for cookies if user is null
      if (!user) {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(";").shift();
        };

        const access = getCookie("sb-access-token");
        const refresh = getCookie("sb-refresh-token");

        if (access && refresh) {
          try {
            const { data } = await supabase.auth.setSession({
              access_token: access,
              refresh_token: refresh
            });
            user = data?.session?.user ?? null;
          } catch (e) {
            console.error("Profile session restoration failed:", e);
          }
        }
      }

      if (!user) { 
        router.replace("/login"); 
        return; 
      }

      const uid = user.id;
      setUserId(uid);
      setEmail(user.email || "");

      // Setup time ranges
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const rankingPeriod = new Date(); rankingPeriod.setMonth(rankingPeriod.getMonth() - 3);

      setTrxLoading(true);
      
      try {
        // Run all independent queries in parallel
        const [profRes, trxRes, leadRes] = await Promise.all([
          supabase.from("profiles").select("id, name, role, created_at").eq("id", uid).single(),
          supabase.from("transactions").select("id, created_at, total_amount, payment_method, transaction_items(quantity, products(name))")
            .eq("staff_id", uid).gte("created_at", sixMonthsAgo.toISOString()).order("created_at", { ascending: false }),
          supabase.from("transactions").select("staff_id, total_amount").gte("created_at", rankingPeriod.toISOString())
        ]);

        if (profRes.data) setProfile(profRes.data as Profile);

        if (trxRes.data) {
          const mapped: Transaction[] = (trxRes.data as any[]).map(t => ({
            ...t,
            transaction_items: (t.transaction_items || []).map((ti: any) => ({
              ...ti,
              products: Array.isArray(ti.products) ? ti.products[0] : ti.products
            }))
          }));
          setAllTrx(mapped);
        }

        if (leadRes.data) {
          const staffRevenue = new Map<string, number>();
          leadRes.data.forEach((t: any) => {
            if (!t.staff_id) return;
            staffRevenue.set(t.staff_id, (staffRevenue.get(t.staff_id) || 0) + t.total_amount);
          });
          const sortedLeaderboard = Array.from(staffRevenue.entries()).sort((a, b) => b[1] - a[1]);
          const myRank = sortedLeaderboard.findIndex(([sid]) => sid === uid);
          if (myRank !== -1) setRank(myRank + 1);
          setTotalStaffCount(staffRevenue.size);
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setTrxLoading(false);
        setLoading(false);
      }
    })();
  }, [router]);

  /* ── Change password ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd || !confirmPwd || !currentPwd) { showToast("error", "Semua kolom wajib diisi."); return; }
    if (newPwd.length < 6) { showToast("error", "Password baru minimal 6 karakter."); return; }
    if (newPwd !== confirmPwd) { showToast("error", "Konfirmasi password tidak cocok."); return; }

    setPwdLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPwd });
    if (signInErr) { setPwdLoading(false); showToast("error", "Password saat ini salah."); return; }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd });
    setPwdLoading(false);
    if (updateErr) { showToast("error", updateErr.message || "Gagal mengubah password."); }
    else { showToast("success", "Password berhasil diubah."); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
  };

  /* ── Derived stats ── */
  const periodStart    = getPeriodStart(period);
  const periodTrx      = allTrx.filter(t => new Date(t.created_at) >= periodStart);
  const periodRevenue  = periodTrx.reduce((s, t) => s + t.total_amount, 0);
  const periodCount    = periodTrx.length;
  const periodQris     = periodTrx.filter(t => t.payment_method === "qris").length;
  const periodCash     = periodTrx.filter(t => t.payment_method === "cash").length;

  const totalRevenue   = allTrx.reduce((s, t) => s + t.total_amount, 0);
  const totalQris      = allTrx.filter(t => t.payment_method === "qris").length;
  const totalCash      = allTrx.filter(t => t.payment_method === "cash").length;

  const chartData      = buildChartData(allTrx, period);
  const chartTotal     = chartData.reduce((s, d) => s + d.sales, 0);

  const periodLabel    = period === "daily" ? "Hari Ini" : period === "weekly" ? "Minggu Ini" : "Bulan Ini";
  const joinedDate     = profile?.created_at
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(profile.created_at))
    : "—";
  const displayName    = profile?.name || email.split("@")[0] || "User";
  const initials       = displayName.substring(0, 2).toUpperCase();

  /* password strength */
  const pwdStrength = (() => {
    if (!newPwd) return null;
    if (newPwd.length < 6) return { label: "Terlalu pendek", color: "var(--destructive)", pct: 20 };
    if (newPwd.length < 8) return { label: "Lemah", color: "orange", pct: 45 };
    if (/[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd)) return { label: "Kuat", color: "var(--primary)", pct: 100 };
    return { label: "Cukup", color: "var(--muted-foreground)", pct: 70 };
  })();

  /* ── Loading screen ── */
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-5 w-5 animate-spin rounded-full border border-border border-t-foreground" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 border-b border-border/50 bg-background/80 backdrop-blur-md"
      >
        {/* Back button */}
        <Link href={profile?.role === "admin" ? "/dashboard" : "/kasir"}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
          <div className="h-8 w-8 rounded-xl border border-border/40 flex items-center justify-center group-hover:bg-foreground/[0.05] transition-all">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold hidden sm:block">
            {profile?.role === "admin" ? "Dashboard" : "Kasir"}
          </span>
        </Link>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl overflow-hidden border border-border/40 shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-foreground leading-tight">ICE HMJ Tekinfo</p>
            <p className="text-[9px] text-muted-foreground leading-tight uppercase tracking-widest">Profil Akun</p>
          </div>
        </div>

        {/* Right: role badge */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2">
          <span
            className={`h-7 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center border ${
              profile?.role === "admin"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-foreground/[0.04] border-border/40 text-muted-foreground"
            }`}
          >
            {profile?.role || "user"}
          </span>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-7">

        {/* ── Profile Hero Card ── */}
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50 surface">
          {/* Top strip */}
          <div className="h-20 w-full border-b border-border/40" style={{
            background: "linear-gradient(135deg, var(--border) 0%, transparent 100%)",
            opacity: 0.2
          }} />
          <div className="px-6 pb-6">
            {/* Achievement Badge */}
            {rank !== null && rank <= 3 && (
              <div className="pt-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl ${
                  rank === 1 ? "bg-amber-400/10 border-amber-400/20 text-amber-400" :
                  rank === 2 ? "bg-slate-400/10 border-slate-400/20 text-slate-300" :
                  "bg-orange-400/10 border-orange-400/20 text-orange-400"
                }`}>
                  <div className="relative">
                    {rank === 1 ? <Crown className="h-4 w-4 animate-bounce" /> :
                     rank === 2 ? <Medal className="h-4 w-4" /> :
                     <Star className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">Achievement</span>
                    <span className="text-xs font-bold tracking-tight">Bintang Danus {rank}</span>
                  </div>
                  <Sparkles className="h-3 w-3 ml-1 opacity-50" />
                </div>
              </div>
            )}

            {/* Avatar sits on the border */}
            <div className={`flex flex-col sm:flex-row sm:items-end gap-4 ${rank && rank <= 3 ? "mt-4" : "-mt-8"} mb-5`}>
              <div className="h-20 w-20 rounded-2xl border-2 border-border shrink-0 bg-primary/10 shadow-xl">
                <div className="h-full w-full rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                </div>
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-foreground tracking-tight">{displayName}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                  <User className="h-3 w-3" /> Bergabung {joinedDate}
                </p>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Transaksi", value: `${allTrx.length}`, sub: "semua waktu" },
                { label: "Total Pendapatan", value: `Rp ${fmtShort(totalRevenue)}`, sub: "semua waktu" },
                { label: "Transaksi QRIS", value: `${totalQris}×`, sub: "semua waktu" },
                { label: "Transaksi Tunai", value: `${totalCash}×`, sub: "semua waktu" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border/40 bg-foreground/[0.03] px-4 py-3">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground/40 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Period Summary Banner + Tabs ── */}
        <div className="rounded-2xl border border-border/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-card/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/40" />
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">Laporan Transaksi</span>
            </div>
            <p className="text-sm font-bold text-foreground/80">{periodLabel}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
              {periodCount} transaksi ·{" "}
              {periodQris}× QRIS · {periodCash}× Tunai
            </p>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">Pendapatan</p>
              <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">Rp {fmt(periodRevenue)}</p>
            </div>
            <PeriodTabs value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* ── Chart + Recent side by side ── */}
        <div className="grid gap-5 lg:grid-cols-5">

          {/* Chart */}
          <div className="lg:col-span-3 rounded-2xl border border-border/50 bg-card/30 p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground/80">
                  Grafik Penjualan · {period === "daily" ? "7 Hari" : period === "weekly" ? "4 Minggu" : "6 Bulan"} Terakhir
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pendapatan Anda dalam Rupiah</p>
              </div>
              <span className="text-xs font-bold text-foreground/70 bg-foreground/[0.06] border border-border/40 rounded-lg px-2.5 py-1 tabular-nums">
                Rp {fmt(chartTotal)}
              </span>
            </div>
            {trxLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="h-4 w-4 border border-white/20 border-t-white/70 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="var(--foreground)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "inherit" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} width={50}
                      tickFormatter={v => v === 0 ? "0" : fmtShort(v)}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "inherit" }} />
                    <RechartsTooltip
                      cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                      content={<ChartTooltip />}
                    />
                    <Area type="monotone" dataKey="sales"
                      stroke="var(--foreground)" strokeOpacity={0.55} strokeWidth={1.5}
                      fill="url(#areaGradP)" dot={false}
                      activeDot={{ r: 4, fill: "var(--foreground)", stroke: "var(--foreground)", strokeOpacity: 0.2, strokeWidth: 6 }}
                      animationDuration={800} animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Mini bar */}
            <div className="flex justify-between mt-3 px-1">
              {chartData.map(d => (
                <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
                  <div className="h-0.5 w-6 rounded-full mx-auto"
                    style={{ background: d.sales > 0 ? "var(--foreground)" : "var(--muted-foreground)", opacity: d.sales > 0 ? 0.35 : 0.05 }} />
                  <span className="text-[8px] text-muted-foreground/40 tabular-nums text-center">
                    {d.sales > 0 ? fmtShort(d.sales) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions in period */}
          <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 overflow-hidden flex flex-col">
            <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground/40" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground/80">Transaksi {periodLabel}</h3>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">{periodCount} pesanan</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {trxLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="h-4 w-4 border border-white/20 border-t-white/70 rounded-full animate-spin" />
                </div>
              ) : periodTrx.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <ShoppingBag className="h-6 w-6 text-foreground/5" />
                  <p className="text-xs text-muted-foreground/40">Belum ada transaksi {periodLabel.toLowerCase()}</p>
                </div>
              ) : (
                <div className="p-3 space-y-0.5">
                  {periodTrx.map(trx => (
                    <div key={trx.id} className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-foreground/[0.03] transition-colors group cursor-default">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border text-[9px] font-bold mt-0.5 ${
                        trx.payment_method === "qris"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/40 bg-foreground/[0.02] text-muted-foreground"
                      }`}>
                        {trx.payment_method === "qris" ? "QR" : "Rp"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-foreground/50 truncate group-hover:text-foreground transition-colors">
                          {trx.transaction_items.map(ti => `${ti.quantity}× ${ti.products?.name}`).join(", ")}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5">{timeAgo(trx.created_at)}</p>
                      </div>
                      <span className="text-xs font-bold text-foreground/70 shrink-0 tabular-nums">
                        +{fmtShort(trx.total_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {periodTrx.length > 0 && (
              <div className="px-5 py-3 border-t border-border/40 flex justify-between items-center bg-foreground/[0.01]">
                <span className="text-[10px] text-muted-foreground/40">{periodCount} transaksi</span>
                <span className="text-[11px] font-bold text-foreground/60 tabular-nums">
                  Rp {fmt(periodRevenue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── All period transactions table ── */}
        <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground/80">Semua Transaksi Saya</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Riwayat lengkap 6 bulan terakhir</p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-foreground/[0.03] border border-border/40 rounded-lg px-2.5 py-1">
              {allTrx.length} total
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {trxLoading ? (
              <div className="flex items-center justify-center h-32 gap-2">
                <div className="h-4 w-4 border border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">Memuat...</span>
              </div>
            ) : allTrx.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <ShoppingBag className="h-6 w-6 text-foreground/5" />
                <p className="text-xs text-muted-foreground/40">Belum ada transaksi</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="h-9 px-5 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest bg-foreground/[0.02]">Waktu</th>
                    <th className="h-9 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest bg-foreground/[0.02]">Pesanan</th>
                    <th className="h-9 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest bg-foreground/[0.02]">Bayar</th>
                    <th className="h-9 px-5 text-right text-[9px] font-semibold text-muted-foreground uppercase tracking-widest bg-foreground/[0.02]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {allTrx.map(trx => (
                    <tr key={trx.id} className="border-b border-border/20 hover:bg-foreground/[0.01] transition-colors group">
                      <td className="px-5 py-3 text-[10px] text-muted-foreground whitespace-nowrap align-top">{formatDate(trx.created_at)}</td>
                      <td className="py-3 max-w-[200px] align-top">
                        <div className="space-y-0.5">
                          {trx.transaction_items.map((ti, i) => (
                            <p key={i} className="text-[10px] text-foreground/50 truncate group-hover:text-foreground transition-colors">
                              {ti.quantity}× {ti.products?.name || "—"}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 align-top">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold border uppercase tracking-wide ${
                          trx.payment_method === "qris"
                            ? "border-primary/20 text-primary bg-primary/10"
                            : "border-border/40 text-muted-foreground/40 bg-transparent"
                        }`}>
                          {trx.payment_method === "qris"
                            ? <><CreditCard className="h-2.5 w-2.5" /> QRIS</>
                            : <><Banknote className="h-2.5 w-2.5" /> Tunai</>}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right align-top">
                        <span className="text-xs font-bold text-foreground/75 tabular-nums">Rp {fmt(trx.total_amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {allTrx.length > 0 && !trxLoading && (
            <div className="px-5 py-3 border-t border-border/40 flex justify-between items-center bg-foreground/[0.01]">
              <span className="text-[10px] text-muted-foreground/30">{allTrx.length} transaksi (6 bulan terakhir)</span>
              <span className="text-[11px] font-bold text-foreground/60 tabular-nums">Total: Rp {fmt(totalRevenue)}</span>
            </div>
          )}
        </div>

        {/* ── Change Password ── */}
        <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden max-w-lg">
          <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground/40" />
            <div>
              <h3 className="text-sm font-semibold text-foreground/80">Ganti Password</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Perbarui kata sandi akun Anda</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            {/* Current */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Password Saat Ini</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 pointer-events-none" />
                <input type={showCurrent ? "text" : "password"} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full h-10 pl-9 pr-10 bg-foreground/[0.03] border border-border/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-foreground/20 transition-all" />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors">
                  {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* New */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 pointer-events-none" />
                <input type={showNew ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full h-10 pl-9 pr-10 bg-foreground/[0.03] border border-border/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-foreground/20 transition-all" />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors">
                  {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {pwdStrength && (
                <div className="space-y-1 pt-0.5">
                  <div className="h-0.5 w-full rounded-full bg-foreground/[0.05] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pwdStrength.pct}%`, background: pwdStrength.color }} />
                  </div>
                  <p className="text-[9px]" style={{ color: pwdStrength.color }}>{pwdStrength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Konfirmasi Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 pointer-events-none" />
                <input type={showConfirm ? "text" : "password"} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full h-10 pl-9 pr-10 bg-foreground/[0.03] border border-border/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-foreground/20 transition-all" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors">
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {confirmPwd && newPwd && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  {confirmPwd === newPwd
                    ? <><CheckCircle2 className="h-3 w-3 text-primary/50" /><span className="text-[9px] text-muted-foreground/40">Password cocok</span></>
                    : <><AlertCircle className="h-3 w-3 text-destructive/70" /><span className="text-[9px] text-destructive/60">Password tidak cocok</span></>}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={pwdLoading}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
              {pwdLoading
                ? <><div className="h-3.5 w-3.5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />Menyimpan...</>
                : <><KeyRound className="h-3.5 w-3.5" />Simpan Password Baru</>}
            </button>
          </form>
        </div>

      </div>

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
