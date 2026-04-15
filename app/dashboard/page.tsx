"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Coins, ShoppingBag, IceCream, TrendingUp,
  ArrowUpRight, CalendarDays, User, Trophy, Star, Medal, Crown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

/* ─── Types ─── */
interface TransactionItem { quantity: number; products: { name: string } | null; }
interface Transaction {
  id: string; created_at: string; total_amount: number; payment_method: string;
  profiles: { name: string } | null;
  transaction_items: TransactionItem[];
}
interface ChartEntry { name: string; sales: number; label: string; }

type Period = "daily" | "weekly" | "monthly";

/* ─── Helpers ─── */
const fmt      = (n: number) => n.toLocaleString("id-ID");
const fmtShort = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}Jt` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;

/* ─── Stat Card ─── */
function StatCard({ title, value, sub, icon: Icon }: {
  title: string; value: string; sub: string; icon: React.ElementType;
}) {
  return (
    <div className="group rounded-2xl border border-border/50 bg-card/50 hover:bg-accent/5 transition-all duration-300 p-5">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{title}</span>
        <div className="h-7 w-7 rounded-xl bg-foreground/[0.04] border border-border/40 flex items-center justify-center group-hover:bg-foreground/[0.08] transition-all">
          <Icon className="h-3.5 w-3.5 text-foreground/35 group-hover:text-foreground/70 transition-colors" />
        </div>
      </div>
      <p className="text-[1.6rem] font-bold text-foreground tracking-tight leading-none mb-2">{value}</p>
      <p className="text-[10px] text-muted-foreground/60">{sub}</p>
    </div>
  );
}

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 rounded-xl shadow-2xl min-w-[150px] bg-popover/95 border border-border backdrop-blur-md">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{payload[0]?.payload?.label}</p>
      <p className="text-sm font-bold text-foreground">Rp {fmt(Number(payload[0]?.value || 0))}</p>
    </div>
  );
}

/* ─── Period Tabs ─── */
function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const tabs: { key: Period; label: string }[] = [
    { key: "daily",   label: "Harian"  },
    { key: "weekly",  label: "Mingguan" },
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

/* ─── Build chart data ─── */
function buildChartData(transactions: Transaction[], period: Period): ChartEntry[] {
  const now = new Date();

  if (period === "daily") {
    // Last 7 days
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const map = new Map<string, ChartEntry>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
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
    // Last 4 weeks (Mon–Sun)
    const entries: ChartEntry[] = [];
    for (let w = 3; w >= 0; w--) {
      const wStart = new Date(now);
      wStart.setDate(wStart.getDate() - wStart.getDay() + 1 - w * 7); // Monday
      wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);

      const weekLabel = `${wStart.getDate()}/${wStart.getMonth() + 1}`;
      const sales = transactions
        .filter(t => { const d = new Date(t.created_at); return d >= wStart && d <= wEnd; })
        .reduce((s, t) => s + t.total_amount, 0);
      entries.push({ name: `W${4 - w}`, sales, label: `Minggu ${weekLabel}` });
    }
    return entries;
  }

  // Monthly: last 6 months
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const entries: ChartEntry[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const sales = transactions
      .filter(t => {
        const td = new Date(t.created_at);
        return td.getFullYear() === year && td.getMonth() === month;
      })
      .reduce((s, t) => s + t.total_amount, 0);
    entries.push({ name: months[month], sales, label: `${months[month]} ${year}` });
  }
  return entries;
}

/* ─── Compute period stats ─── */
function getPeriodRange(period: Period) {
  const now = new Date();
  if (period === "daily") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { start, label: "Hari Ini" };
  }
  if (period === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    return { start, label: "Minggu Ini" };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, label: "Bulan Ini" };
}

/* ─────────────── MAIN ─────────────── */
export default function Dashboard() {
  const [loading, setLoading]       = useState(true);
  const [allTrx, setAllTrx]         = useState<Transaction[]>([]);
  const [period, setPeriod]         = useState<Period>("daily");
  const [now, setNow]               = useState(new Date());
  const [topStaff, setTopStaff]     = useState<{ name: string; total: number; count: number }[]>([]);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    (async () => {
      // Auth is already verified by AdminGuard in layout

      // Fetch 6 months of data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Step 1: Fetch transactions
      const { data: trxRaw } = await supabase
        .from("transactions")
        .select("id, created_at, total_amount, payment_method, staff_id, transaction_items(quantity, products(name))")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: false });

      if (!trxRaw) { setLoading(false); return; }

      // Step 2: Fetch profiles for all unique staff_ids
      const staffIds = [...new Set(trxRaw.map((t: any) => t.staff_id).filter(Boolean))];
      const { data: profilesRaw } = staffIds.length > 0
        ? await supabase.from("profiles").select("id, name").in("id", staffIds)
        : { data: [] };

      const profileMap = new Map((profilesRaw || []).map((p: any) => [p.id, p.name]));

      // Step 3: Merge
      const merged: Transaction[] = (trxRaw as any[]).map(t => ({
        ...t,
        profiles: profileMap.has(t.staff_id) ? { name: profileMap.get(t.staff_id)! } : null,
      }));

      if (merged) {
        setAllTrx(merged);

        // Top staff by revenue (all time)
        const staffMap = new Map<string, { total: number; count: number }>();
        merged.forEach(t => {
          const name = t.profiles?.name || "Tidak diketahui";
          const prev = staffMap.get(name) || { total: 0, count: 0 };
          staffMap.set(name, { total: prev.total + t.total_amount, count: prev.count + 1 });
        });
        const sorted = Array.from(staffMap.entries())
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)
          .map(([name, v]) => ({ name, ...v }));
        setTopStaff(sorted);
      }
      setLoading(false);
    })();
  }, []);

  // Compute period data
  const { start: periodStart, label: periodLabel } = getPeriodRange(period);
  const periodTrx = allTrx.filter(t => new Date(t.created_at) >= periodStart);

  const periodRevenue   = periodTrx.reduce((s, t) => s + t.total_amount, 0);
  const periodCount     = periodTrx.length;
  const periodItems     = periodTrx.reduce((s, t) => s + t.transaction_items.reduce((a, i) => a + i.quantity, 0), 0);
  const periodQris      = periodTrx.filter(t => t.payment_method === "qris").length;
  const periodAvg       = periodCount > 0 ? Math.round(periodRevenue / periodCount) : 0;
  const favMethod       = periodCount === 0 ? "—" : periodQris >= (periodCount - periodQris) ? "QRIS" : "Tunai";

  const chartData = buildChartData(allTrx, period);
  const chartTotal = chartData.reduce((s, d) => s + d.sales, 0);

  // Top products in period
  const productMap = new Map<string, number>();
  periodTrx.forEach(t =>
    t.transaction_items.forEach(i => {
      const name = i.products?.name || "Lainnya";
      productMap.set(name, (productMap.get(name) || 0) + i.quantity);
    })
  );
  const topProducts = Array.from(productMap.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  // Recent 5 transactions
  const recentTrx = allTrx.slice(0, 5);

  const timeAgo = (d: string) => {
    const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (min < 60) return `${min}m lalu`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}j lalu`;
    return `${Math.floor(hr / 24)}h lalu`;
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center min-h-[60vh] bg-background">
      <div className="h-4 w-4 animate-spin rounded-full border border-border border-t-foreground" />
    </div>
  );

  return (
    <div className="space-y-7 pb-16 max-w-[1400px] text-foreground">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Dashboard Admin</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-foreground/80 tabular-nums tracking-tight">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-[dot-pulse_2s_ease-in-out_infinite]" />
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {/* ── Period selector + summary banner ── */}
      <div
        className="rounded-2xl border border-border/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-card/20"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Laporan</span>
          </div>
          <p className="text-sm font-bold text-foreground/80">{periodLabel}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {periodCount} transaksi · {periodItems} item terjual
          </p>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">Total Pendapatan</p>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">Rp {fmt(periodRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">Rata-rata/Trx</p>
            <p className="text-lg font-bold text-foreground/70 tabular-nums">Rp {fmt(periodAvg)}</p>
          </div>
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pendapatan" value={`Rp ${fmtShort(periodRevenue)}`} sub={`Total ${periodLabel.toLowerCase()}`} icon={Coins} />
        <StatCard title="Transaksi"  value={`${periodCount}`}               sub={`Pesanan ${periodLabel.toLowerCase()}`} icon={ShoppingBag} />
        <StatCard title="Item Terjual" value={`${periodItems} pcs`}         sub={`Produk ${periodLabel.toLowerCase()}`}  icon={IceCream} />
        <StatCard title="Metode Favorit" value={favMethod}                  sub={periodCount > 0 ? `${periodQris}× QRIS · ${periodCount - periodQris}× Tunai` : "Belum ada data"} icon={TrendingUp} />
      </div>

      {/* ── Chart + Top Staff ── */}
      <div className="grid gap-4 lg:grid-cols-7">

        {/* Area chart */}
        <div className="lg:col-span-5 rounded-2xl border border-border/50 surface p-5">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground/80">
                Grafik Penjualan · {period === "daily" ? "7 Hari" : period === "weekly" ? "4 Minggu" : "6 Bulan"} Terakhir
              </h3>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Pendapatan dalam Rupiah</p>
            </div>
            <span className="text-xs font-bold text-white/70 bg-accent/30 border border-white/[0.08] rounded-lg px-2.5 py-1 tabular-nums">
              Rp {fmt(chartTotal)}
            </span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#areaGrad)" dot={false}
                  activeDot={{ r: 4, fill: "var(--foreground)", stroke: "var(--foreground)", strokeOpacity: 0.2, strokeWidth: 6 }}
                  animationDuration={800} animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Min bar below chart */}
          <div className="flex justify-between mt-3 px-1">
            {chartData.map(d => (
              <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
                <div className="h-0.5 w-6 rounded-full mx-auto"
                  style={{ background: d.sales > 0 ? "var(--foreground)" : "var(--muted-foreground)", opacity: d.sales > 0 ? 0.35 : 0.1 }} />
                <span className="text-[8px] text-muted-foreground/40 tabular-nums text-center">
                  {d.sales > 0 ? fmtShort(d.sales) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Staff by Revenue */}
        <div className="lg:col-span-2 rounded-2xl border border-border/50 surface p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Bintang Danus
              </h3>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Penjualan Terbanyak (All Time)</p>
            </div>
            <span className="text-[9px] text-muted-foreground/40 border border-border/40 rounded-lg px-2 py-0.5 uppercase tracking-wider">
              Hall of Fame
            </span>
          </div>
          {topStaff.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
              <Star className="h-6 w-6 text-foreground/5 animate-pulse" />
              <p className="text-xs text-muted-foreground/40 text-center">Belum ada pejuang danus terdeteksi</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {topStaff.map((s, i) => {
                const maxTotal = topStaff[0].total;
                const pct = Math.round((s.total / maxTotal) * 100);
                
                // Achievement Rank Styling
                const isTop3 = i < 3;
                const rankLabels = ["Bintang Danus 1", "Bintang Danus 2", "Bintang Danus 3"];
                const rankColors = [
                  "text-amber-400 bg-amber-400/10 border-amber-400/20", // Gold
                  "text-slate-300 bg-slate-400/10 border-slate-400/20", // Silver
                  "text-orange-400 bg-orange-400/10 border-orange-400/20" // Bronze
                ];
                const rankIcons = [
                  <Crown key="cr" className="h-3 w-3" />,
                  <Medal key="md" className="h-3 w-3" />,
                  <Star key="st" className="h-3 w-3" />
                ];

                return (
                  <div key={s.name} className="relative group p-2.5 rounded-2xl border border-transparent hover:border-border/40 hover:bg-foreground/[0.02] transition-all duration-300">
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border text-[10px] font-bold ${isTop3 ? rankColors[i] : "border-border/40 bg-foreground/[0.02] text-muted-foreground/40"}`}>
                            {isTop3 ? rankIcons[i] : (i + 1)}
                          </div>
                          {i === 0 && <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-amber-400 items-center justify-center rounded-full border-2 border-background flex shadow-lg animate-bounce">
                             <Crown className="h-2 w-2 text-amber-900" />
                          </div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-foreground/90 truncate flex items-center gap-1.5">
                            {s.name}
                            {isTop3 && <span className={`text-[8px] px-1.5 py-0.5 rounded-full border uppercase tracking-tighter ${rankColors[i]}`}>
                              {rankLabels[i]}
                            </span>}
                          </p>
                          <p className="text-[9px] text-muted-foreground/60">{s.count} Transaksi</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-black tabular-nums ${i === 0 ? "text-primary" : "text-foreground/80"}`}>Rp {fmt(s.total)}</p>
                      </div>
                    </div>
                    {/* Progress Bar with Gradient */}
                    <div className="h-1 bg-foreground/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${pct}%`, 
                          background: i === 0 
                            ? "linear-gradient(90deg, var(--primary) 0%, #fbbf24 100%)" 
                            : "var(--foreground)",
                          opacity: i === 0 ? 0.8 : i === 1 ? 0.4 : 0.15 
                        }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Period detail: Recent + Top Products ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent in period */}
        <div className="rounded-2xl border border-border/50 surface overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground/80">Transaksi Terbaru</h3>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">5 pesanan terakhir</p>
            </div>
            <a href="/dashboard/transactions" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors border border-border/40 rounded-lg px-2.5 py-1">
              Lihat semua →
            </a>
          </div>
          <div className="p-3 space-y-0.5">
            {recentTrx.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <IceCream className="h-6 w-6 text-white/10" />
                <p className="text-xs text-muted-foreground/40">Belum ada transaksi</p>
              </div>
            ) : recentTrx.map(trx => (
              <div key={trx.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-default">
                {/* Method icon */}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border text-[9px] font-bold ${
                  trx.payment_method === "qris"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border/40 bg-foreground/[0.02] text-muted-foreground"
                }`}>
                  {trx.payment_method === "qris" ? "QR" : "Rp"}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Staff name */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-semibold text-foreground/40 uppercase tracking-wide">
                      {trx.profiles?.name || "—"}
                    </span>
                    <span className="text-[8px] text-foreground/10">·</span>
                    <span className="text-[9px] text-muted-foreground/40">{timeAgo(trx.created_at)}</span>
                  </div>
                  <p className="text-[10px] text-foreground/50 truncate group-hover:text-foreground/75 transition-colors">
                    {trx.transaction_items.map(ti => `${ti.quantity}× ${ti.products?.name}`).join(", ")}
                  </p>
                </div>
                <span className="text-xs font-bold text-foreground/70 shrink-0 tabular-nums">
                  +{fmtShort(trx.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products in period */}
        <div className="rounded-2xl border border-border/50 surface p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground/80">Produk Terlaris</h3>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{periodLabel}</p>
            </div>
            <span className="text-[9px] text-muted-foreground/40 border border-border/40 rounded-lg px-2 py-0.5">
              {topProducts.reduce((s, p) => s + p.qty, 0)} item
            </span>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
              <IceCream className="h-6 w-6 text-white/10" />
              <p className="text-xs text-muted-foreground/40">Tidak ada data untuk periode ini</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0].qty;
                const pct = Math.round((p.qty / maxQty) * 100);
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[9px] font-mono text-muted-foreground/40 w-3 shrink-0">{i + 1}</span>
                        <span className="text-xs text-foreground/60 truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-foreground/70 tabular-nums shrink-0">{p.qty} pcs</span>
                    </div>
                    <div className="h-0.5 bg-foreground/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: i === 0 ? "rgba(var(--primary), 0.5)" : "rgba(var(--foreground), 0.18)", opacity: 0.5 }} />
                    </div>
                  </div>
                );
              })}

              {/* Bar chart */}
              {topProducts.length > 1 && (
                <div className="pt-3 border-t border-white/[0.05]">
                  <div className="h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false}
                          tick={{ fill: "rgba(255,255,255,0.20)", fontSize: 9 }}
                          tickFormatter={n => n.length > 8 ? n.substring(0, 8) + "…" : n} />
                        <RechartsTooltip
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="px-2.5 py-1.5 rounded-lg text-xs"
                                style={{ background: "rgba(18,18,18,0.97)", border: "1px solid rgba(255,255,255,0.10)" }}>
                                <p className="text-white/70 font-bold">{payload[0].payload.name}: {payload[0].value} pcs</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="qty" radius={[4, 4, 0, 0]} maxBarSize={32}>
                          {topProducts.map((_, i) => (
                            <Cell key={i} fill="var(--foreground)" fillOpacity={i === 0 ? 0.55 : 0.18} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
