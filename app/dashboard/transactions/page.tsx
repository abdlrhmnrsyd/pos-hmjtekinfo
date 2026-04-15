"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, CreditCard, Banknote, Search, X } from "lucide-react";

interface TransactionItem { quantity: number; products: { name: string } | null; }
interface StaffProfile   { name: string; }
interface Transaction {
  id: string; created_at: string; total_amount: number;
  payment_method: string; staff_id: string;
  profiles: StaffProfile | null;
  transaction_items: TransactionItem[];
}

const surface = "rounded-2xl border border-border/50 bg-card/50";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterMethod, setFilterMethod] = useState<"all" | "cash" | "qris">("all");

  const loadData = async () => {
    setLoading(true);

    // Step 1: Fetch transactions (no FK join)
    const { data: trxRaw } = await supabase
      .from("transactions")
      .select("id, created_at, total_amount, payment_method, staff_id, transaction_items(quantity, products(name))")
      .order("created_at", { ascending: false });

    if (!trxRaw) { setLoading(false); return; }

    // Step 2: Fetch profiles for all unique staff_ids
    const staffIds = [...new Set(trxRaw.map((t: any) => t.staff_id).filter(Boolean))];
    const { data: profilesRaw } = staffIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", staffIds)
      : { data: [] };

    const profileMap = new Map((profilesRaw || []).map((p: any) => [p.id, p.name]));

    // Step 3: Merge & Map
    const merged: Transaction[] = (trxRaw as any[]).map(t => ({
      ...t,
      profiles: profileMap.has(t.staff_id) ? { name: profileMap.get(t.staff_id)! } : null,
      transaction_items: (t.transaction_items || []).map((ti: any) => ({
        ...ti,
        products: Array.isArray(ti.products) ? ti.products[0] : ti.products
      }))
    }));

    setTransactions(merged);
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const formatDate = (s: string) =>
    new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));

  const filtered = transactions.filter(trx => {
    const matchMethod = filterMethod === "all" || trx.payment_method === filterMethod;
    const matchSearch = !search ||
      trx.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
      trx.transaction_items.some(ti => ti.products?.name?.toLowerCase().includes(search.toLowerCase())) ||
      trx.id.toLowerCase().includes(search.toLowerCase());
    return matchMethod && matchSearch;
  });

  const totalRevenue   = filtered.reduce((s, t) => s + t.total_amount, 0);
  const totalQris      = filtered.filter(t => t.payment_method === "qris").length;
  const totalCash      = filtered.filter(t => t.payment_method === "cash").length;

  return (
    <div className="space-y-6 pb-12 max-w-7xl">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-white/90 tracking-tight">Riwayat Transaksi</h2>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Log semua penjualan beserta kasir yang menangani.</p>
        </div>
        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="h-7 px-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-[10px] text-white/50 font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            {filtered.length} transaksi
          </span>
          <span className="h-7 px-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-[10px] text-white/50 font-semibold flex items-center">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative group flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-white/50 transition-colors pointer-events-none" />
          <input
            placeholder="Cari kasir, produk, ID..."
            className="w-full h-9 pl-8 pr-8 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white/70 placeholder:text-muted-foreground/40 outline-none focus:border-white/20 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-white/60 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Method filter */}
        <div className="flex items-center border border-white/[0.07] rounded-xl overflow-hidden bg-white/[0.02] p-0.5 gap-0.5">
          {(["all", "cash", "qris"] as const).map(m => (
            <button
              key={m}
              onClick={() => setFilterMethod(m)}
              className={`h-8 px-3.5 rounded-[10px] text-[11px] font-semibold transition-all ${
                filterMethod === m
                  ? "bg-white text-black"
                  : "text-white/35 hover:text-white/70"
              }`}
            >
              {m === "all" ? "Semua" : m === "cash" ? `Tunai (${totalCash})` : `QRIS (${totalQris})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={surface}>
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground/80">Semua Transaksi</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Termasuk informasi kasir yang menangani.</p>
          </div>
          <p className="text-[10px] text-muted-foreground/40 font-mono">{filtered.length} hasil</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.05] hover:bg-transparent">
              <TableHead className="h-10 px-5 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest w-[110px]">ID</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Waktu</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Kasir</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Bayar</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Pesanan</TableHead>
              <TableHead className="h-10 text-right px-5 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableCell colSpan={6} className="text-center h-32">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3.5 w-3.5 border border-white/20 border-t-white/70 rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Memuat...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableCell colSpan={6} className="text-center h-32">
                  <p className="text-xs text-muted-foreground/40">Tidak ada transaksi ditemukan.</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(trx => (
              <TableRow key={trx.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                {/* ID */}
                <TableCell className="px-5 py-4">
                  <span className="font-mono text-[10px] text-muted-foreground/60 group-hover:text-white/50 transition-colors">
                    #{trx.id.substring(0, 8).toUpperCase()}
                  </span>
                </TableCell>

                {/* Waktu */}
                <TableCell className="text-[10px] text-white/35 whitespace-nowrap">
                  {formatDate(trx.created_at)}
                </TableCell>

                {/* Kasir */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white/50">
                        {(trx.profiles?.name || "?").substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-white/60 group-hover:text-foreground/80 transition-colors whitespace-nowrap">
                      {trx.profiles?.name || <span className="text-muted-foreground/40 italic">Tidak diketahui</span>}
                    </span>
                  </div>
                </TableCell>

                {/* Metode */}
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wide ${
                    trx.payment_method === "qris"
                      ? "border-white/15 text-white/60 bg-white/[0.05]"
                      : "border-white/[0.05] text-muted-foreground/60 bg-transparent"
                  }`}>
                    {trx.payment_method === "qris"
                      ? <><CreditCard className="h-2.5 w-2.5" /> QRIS</>
                      : <><Banknote className="h-2.5 w-2.5" /> Tunai</>}
                  </span>
                </TableCell>

                {/* Pesanan */}
                <TableCell className="max-w-[220px]">
                  <p className="text-[10px] text-muted-foreground group-hover:text-white/55 transition-colors truncate">
                    {trx.transaction_items.map(ti => `${ti.quantity}× ${ti.products?.name}`).join(", ")}
                  </p>
                </TableCell>

                {/* Total */}
                <TableCell className="text-right px-5">
                  <span className="text-sm font-bold text-foreground/80 tabular-nums">
                    Rp {trx.total_amount.toLocaleString("id-ID")}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer total */}
        {filtered.length > 0 && !loading && (
          <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/60">{filtered.length} transaksi ditampilkan</span>
            <span className="text-xs font-bold text-white/60 tabular-nums">
              Total: Rp {totalRevenue.toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
