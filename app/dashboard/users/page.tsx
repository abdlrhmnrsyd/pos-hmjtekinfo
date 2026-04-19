"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, Search, X, TrendingUp, ShoppingBag, Coins,
  CreditCard, Banknote, ChevronDown, ChevronUp,
  Crown, Star, Medal, Trash2, Shield, ShieldAlert, UserCog
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* ─── Types ─── */
interface UserStat {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  trxCount: number;
  trxTotal: number;
  qrisCount: number;
  cashCount: number;
  lastTrx: string | null;
}

type SortKey = "name" | "trxCount" | "trxTotal" | "lastTrx";

const fmt = (n: number) => n.toLocaleString("id-ID");
const fmtShort = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}Jt` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;

const surface = "rounded-2xl border border-border/50 bg-card/50";

/* ─── Badge ─── */
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-widest ${
        isAdmin
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border/40 bg-foreground/[0.04] text-muted-foreground/60"
      }`}
    >
      {isAdmin ? "Admin" : role === "staff" ? "Kasir" : "User"}
    </span>
  );
}

function BintangBadge({ rank }: { rank: number }) {
  const colors = [
    "text-amber-400 bg-amber-400/10 border-amber-400/20", // Gold
    "text-slate-300 bg-slate-400/10 border-slate-400/20", // Silver
    "text-orange-400 bg-orange-400/10 border-orange-400/20" // Bronze
  ];
  const icons = [<Crown className="h-2.5 w-2.5" />, <Medal className="h-2.5 w-2.5" />, <Star className="h-2.5 w-2.5" />];
  const labels = ["Bintang Danus 1", "Bintang Danus 2", "Bintang Danus 3"];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-tighter ${colors[rank - 1]}`}>
      {icons[rank - 1]}
      {labels[rank - 1]}
    </div>
  );
}

/* ─── Sort Header ─── */
function SortHeader({
  label, sortKey, current, dir, onClick,
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc"; onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-foreground/60 transition-colors group"
    >
      {label}
      <span className={`transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}>
        {active && dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </span>
    </button>
  );
}

/* ─── Main ─── */
export default function UsersPage() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("trxCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff" | "user">("all");

  const loadData = async () => {
    setLoading(true);

    /* 1. Fetch all profiles */
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email, role, created_at");

    if (!profiles) { setLoading(false); return; }

    const profileIds = profiles.map((p: any) => p.id);

    /* 2. Fetch all transactions */
    let trxRaw: any[] | null = null;
    if (profileIds.length > 0) {
      const { data } = await supabase
        .from("transactions")
        .select("id, staff_id, total_amount, payment_method, created_at")
        .in("staff_id", profileIds);
      trxRaw = data;
    }

    /* 3. Aggregate per user */
    const trxMap = new Map<string, {
      count: number; total: number; qris: number; cash: number; last: string | null;
    }>();

    (trxRaw || []).forEach((t: any) => {
      const prev = trxMap.get(t.staff_id) || { count: 0, total: 0, qris: 0, cash: 0, last: null };
      trxMap.set(t.staff_id, {
        count: prev.count + 1,
        total: prev.total + t.total_amount,
        qris:  prev.qris  + (t.payment_method === "qris" ? 1 : 0),
        cash:  prev.cash  + (t.payment_method === "cash" ? 1 : 0),
        last:  prev.last  ? (new Date(t.created_at) > new Date(prev.last) ? t.created_at : prev.last) : t.created_at,
      });
    });

    const merged: UserStat[] = profiles.map((p: any) => {
      const stats = trxMap.get(p.id) || { count: 0, total: 0, qris: 0, cash: 0, last: null };
      return {
        id: p.id,
        name: p.name || "—",
        email: p.email || "—",
        role: p.role || "user",
        created_at: p.created_at,
        trxCount: stats.count,
        trxTotal: stats.total,
        qrisCount: stats.qris,
        cashCount: stats.cash,
        lastTrx: stats.last,
      };
    });

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const deleteUser = async (user: UserStat) => {
    if (user.role === "admin") {
      alert("Anda tidak bisa menghapus sesama Admin atau akun Anda sendiri.");
      return;
    }
    if (!confirm(`Hapus profil "${user.name}"? Akses dashboard user ini akan hilang.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("id", user.id);
    if (error) {
      alert(`Gagal menghapus user: ${error.message}`);
      return;
    }
    loadData();
  };

  const updateRole = async (user: UserStat, newRole: string) => {
    if (user.role === "admin") {
      alert("Anda tidak bisa mengubah role sesama Admin atau akun Anda sendiri.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", user.id);
    if (error) {
      alert(`Gagal mengubah role: ${error.message}`);
      return;
    }
    loadData();
  };

  /* ── Sort & filter ── */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = users
    .filter(u => {
      const matchRole   = roleFilter === "all" || u.role === roleFilter;
      const matchSearch = !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === "name")     diff = a.name.localeCompare(b.name);
      if (sortKey === "trxCount") diff = a.trxCount - b.trxCount;
      if (sortKey === "trxTotal") diff = a.trxTotal - b.trxTotal;
      if (sortKey === "lastTrx")  {
        const at = a.lastTrx ? new Date(a.lastTrx).getTime() : 0;
        const bt = b.lastTrx ? new Date(b.lastTrx).getTime() : 0;
        diff = at - bt;
      }
      return sortDir === "asc" ? diff : -diff;
    });

  /* ── Summary stats ── */
  const totalUsers      = filtered.length;
  const totalTrx        = filtered.reduce((s, u) => s + u.trxCount, 0);
  const totalRevenue    = filtered.reduce((s, u) => s + u.trxTotal, 0);
  const activeUsers     = filtered.filter(u => u.trxCount > 0).length;

  const formatDate = (s: string | null) => {
    if (!s) return "—";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));
  };

  const timeAgo = (d: string | null) => {
    if (!d) return null;
    const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (min < 60) return `${min}m lalu`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}j lalu`;
    return `${Math.floor(hr / 24)}h lalu`;
  };

  /* max trx for bar */
  const maxTrx = Math.max(...filtered.map(u => u.trxCount), 1);
  const maxRev = Math.max(...filtered.map(u => u.trxTotal), 1);

  return (
    <div className="space-y-6 pb-12 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Daftar Pengguna</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Semua akun terdaftar beserta riwayat transaksinya.</p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: `${totalUsers} pengguna`,   icon: Users },
            { label: `${totalTrx} transaksi`,    icon: ShoppingBag },
            { label: `Rp ${fmtShort(totalRevenue)}`, icon: Coins  },
          ].map(({ label, icon: Icon }) => (
            <span key={label} className="h-7 px-3 rounded-xl border border-border bg-accent/20 text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
              <Icon className="h-3 w-3 text-muted-foreground/40" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total User",       value: totalUsers,                   icon: Users,       sub: "akun terdaftar"             },
          { title: "Aktif Bertransaksi", value: activeUsers,               icon: TrendingUp,  sub: "pernah melakukan transaksi"  },
          { title: "Total Transaksi",  value: totalTrx,                    icon: ShoppingBag, sub: "semua pengguna"              },
          { title: "Total Pendapatan", value: `Rp ${fmtShort(totalRevenue)}`, icon: Coins,    sub: "seluruh transaksi"           },
        ].map(({ title, value, icon: Icon, sub }) => (
          <div key={title} className="group rounded-2xl border border-border/50 bg-card/50 hover:bg-accent/5 transition-all p-5">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{title}</span>
              <div className="h-7 w-7 rounded-xl bg-foreground/[0.04] border border-border/40 flex items-center justify-center group-hover:bg-foreground/[0.08] transition-all">
                <Icon className="h-3.5 w-3.5 text-foreground/35 group-hover:text-foreground/70 transition-colors" />
              </div>
            </div>
            <p className="text-[1.6rem] font-bold text-foreground tracking-tight leading-none mb-2">{value}</p>
            <p className="text-[10px] text-muted-foreground/60">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative group flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-foreground/50 transition-colors pointer-events-none" />
          <input
            placeholder="Cari nama, ID pengguna..."
            className="w-full h-9 pl-8 pr-8 bg-foreground/[0.03] border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/20 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/60 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="flex items-center border border-border/50 rounded-xl overflow-hidden bg-foreground/[0.02] p-0.5 gap-0.5">
          {(["all", "admin", "staff", "user"] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`h-8 px-3.5 rounded-[10px] text-[11px] font-semibold transition-all ${
                roleFilter === r ? "bg-primary text-primary-foreground" : "text-foreground/35 hover:text-foreground/70"
              }`}
            >
              {r === "all" ? "Semua" : r === "admin" ? "Admin" : r === "staff" ? "Kasir" : "User"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className={surface}>
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground/80">Semua Pengguna</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Klik header kolom untuk mengurutkan.</p>
          </div>
          <p className="text-[10px] text-muted-foreground/40 font-mono">{filtered.length} pengguna</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="h-10 px-5 w-[180px]">
                <SortHeader label="Nama" sortKey="name" current={sortKey} dir={sortDir} onClick={handleSort} />
              </TableHead>
              <TableHead className="h-10">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Role</span>
              </TableHead>
              <TableHead className="h-10">
                <SortHeader label="Transaksi" sortKey="trxCount" current={sortKey} dir={sortDir} onClick={handleSort} />
              </TableHead>
              <TableHead className="h-10">
                <SortHeader label="Total Revenue" sortKey="trxTotal" current={sortKey} dir={sortDir} onClick={handleSort} />
              </TableHead>
              <TableHead className="h-10">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">QRIS / Tunai</span>
              </TableHead>
              <TableHead className="h-10">
                <SortHeader label="Terakhir Aktif" sortKey="lastTrx" current={sortKey} dir={sortDir} onClick={handleSort} />
              </TableHead>
              <TableHead className="h-10 text-right px-5 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableCell colSpan={7} className="text-center h-40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3.5 w-3.5 border border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Memuat data pengguna...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableCell colSpan={7} className="text-center h-40">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-6 w-6 text-foreground/5" />
                    <p className="text-xs text-muted-foreground/40">Tidak ada pengguna ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.map(user => {

              const trxPct = Math.round((user.trxCount / maxTrx) * 100);
              const revPct = Math.round((user.trxTotal / maxRev) * 100);
              const rankEntry = [...users]
                .filter(u => u.trxTotal > 0)
                .sort((a, b) => b.trxTotal - a.trxTotal)
                .findIndex(u => u.id === user.id);
              const rank = rankEntry !== -1 ? rankEntry + 1 : null;

              return (
                <TableRow key={user.id} className="border-border/20 hover:bg-foreground/[0.01] transition-colors group">

                  {/* Nama */}
                  <TableCell className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {user.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {user.name}
                          </p>
                          {rank && rank <= 3 && <BintangBadge rank={rank} />}
                        </div>
                        <p className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">
                          {user.id.substring(0, 12)}…
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>

                  {/* Transaksi */}
                  <TableCell>
                    <div className="space-y-1.5 min-w-[100px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-foreground/80 tabular-nums">{user.trxCount}</span>
                        <span className="text-[9px] text-muted-foreground/60">transaksi</span>
                      </div>
                      <div className="h-0.5 bg-foreground/[0.04] rounded-full overflow-hidden w-[90px]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${trxPct}%`,
                            background: trxPct >= 75
                              ? "var(--foreground)"
                              : trxPct >= 40
                              ? "var(--foreground)"
                              : "var(--foreground)",
                            opacity: trxPct >= 75 ? 0.55 : trxPct >= 40 ? 0.30 : 0.12,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Revenue */}
                  <TableCell>
                    <div className="space-y-1.5 min-w-[110px]">
                      <p className="text-sm font-bold text-foreground/80 tabular-nums">
                        {user.trxTotal > 0 ? `Rp ${fmtShort(user.trxTotal)}` : "—"}
                      </p>
                      {user.trxTotal > 0 && (
                        <div className="h-0.5 bg-foreground/[0.04] rounded-full overflow-hidden w-[90px]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${revPct}%`,
                              background: "var(--foreground)",
                              opacity: 0.22,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* QRIS / Tunai */}
                  <TableCell>
                    {user.trxCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-primary/20 bg-primary/10 text-primary">
                          <CreditCard className="h-2.5 w-2.5" /> {user.qrisCount}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-border/40 text-muted-foreground/60">
                          <Banknote className="h-2.5 w-2.5" /> {user.cashCount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-foreground/5">—</span>
                    )}
                  </TableCell>

                  {/* Terakhir aktif */}
                  <TableCell>
                    {user.lastTrx ? (
                      <div>
                        <p className="text-[10px] font-semibold text-foreground/50 whitespace-nowrap">
                          {timeAgo(user.lastTrx)}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5 whitespace-nowrap">
                          {formatDate(user.lastTrx)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-foreground/10 italic">Belum transaksi</span>
                    )}
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className="text-right px-5">
                    {user.role !== "admin" ? (
                      <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Change Role Button */}
                        <button
                          onClick={() => {
                            const roles = ["admin", "staff", "user"];
                            const next = roles[(roles.indexOf(user.role) + 1) % roles.length];
                            if (confirm(`Ubah role "${user.name}" menjadi ${next.toUpperCase()}?`)) updateRole(user, next);
                          }}
                          className="h-7 w-7 rounded-lg text-muted-foreground/30 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all border border-transparent hover:border-primary/20"
                          title="Ubah Role"
                        >
                          <UserCog className="h-3 w-3" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteUser(user)}
                          className="h-7 w-7 rounded-lg text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors border border-transparent hover:border-red-400/20"
                          title="Hapus Profil"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest italic pr-2">Protected</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] text-muted-foreground/60">{filtered.length} pengguna ditampilkan</span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-muted-foreground/60">
                Total: <span className="font-bold text-foreground/50">{totalTrx} transaksi</span>
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                Revenue: <span className="font-bold text-foreground/50 tabular-nums">Rp {fmt(totalRevenue)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
