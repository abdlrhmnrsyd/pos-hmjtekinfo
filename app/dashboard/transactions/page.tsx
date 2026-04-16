"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, CreditCard, Banknote, Search, X, Download, Trash2 } from "lucide-react";

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
  
  const deleteTransaction = async (id: string) => {
    if (!confirm("Yakin ingin menghapus transaksi ini? Tindakan ini tidak bisa dibatalkan.")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      alert(`Gagal menghapus transaksi: ${error.message}`);
      return;
    }
    loadData();
  };

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

  const handleExport = () => {
    if (filtered.length === 0) return;

    const brandColor = "#f97316"; // Brand Orange
    const dateStr = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

    // Build HTML for Excel
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan Penjualan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          .title { font-family: sans-serif; font-size: 22px; font-weight: bold; color: ${brandColor}; text-align: center; }
          .meta  { font-family: sans-serif; font-size: 11px; color: #666; }
          .header { background-color: ${brandColor}; color: white; font-weight: bold; font-family: sans-serif; }
          .cell   { font-family: sans-serif; border: 0.5pt solid #eee; padding: 5px; }
          .zebra  { background-color: #fcfcfc; }
          .total  { font-family: sans-serif; font-weight: bold; background-color: #fef3c7; }
          .id     { font-family: monospace; color: #999; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" class="title">LAPORAN PENJUALAN ICE HMJ TEKINFO</td></tr>
          <tr><td colspan="6" class="meta">Diekspor pada: ${dateStr}</td></tr>
          <tr><td colspan="6" class="meta">Total Transaksi: ${filtered.length} | Total Omzet: Rp ${totalRevenue.toLocaleString("id-ID")}</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr class="header">
            <td class="cell">ID TRANSAKSI</td>
            <td class="cell">WAKTU</td>
            <td class="cell">KASIR</td>
            <td class="cell">METODE</td>
            <td class="cell">DAFTAR PESANAN</td>
            <td class="cell">TOTAL BAYAR</td>
          </tr>
          ${filtered.map((t, i) => `
            <tr class="${i % 2 === 0 ? "" : "zebra"}">
              <td class="cell id">#${t.id.substring(0, 8).toUpperCase()}</td>
              <td class="cell">${new Date(t.created_at).toLocaleString("id-ID")}</td>
              <td class="cell">${t.profiles?.name || "Tidak diketahui"}</td>
              <td class="cell">${t.payment_method.toUpperCase()}</td>
              <td class="cell">${t.transaction_items.map(ti => `${ti.quantity}x ${ti.products?.name}`).join(" | ")}</td>
              <td class="cell">Rp ${t.total_amount.toLocaleString("id-ID")}</td>
            </tr>
          `).join("")}
          <tr><td colspan="6"></td></tr>
          <tr class="total">
            <td colspan="5" class="cell" style="text-align: right;">GRAND TOTAL PENDAPATAN:</td>
            <td class="cell">Rp ${totalRevenue.toLocaleString("id-ID")}</td>
          </tr>
        </table>
        <p style="font-size: 9px; color: #aaa; margin-top: 20px;">Dokumen ini dibuat otomatis oleh Sistem POS ICE HMJ Tekinfo.</p>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_ICE_HMJ_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground/90 tracking-tight">Riwayat Transaksi</h2>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Log semua penjualan beserta kasir yang menangani.</p>
        </div>
        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleExport}
            className="h-7 px-3 rounded-xl border border-primary/20 bg-primary/5 text-[10px] text-primary font-bold flex items-center gap-1.5 hover:bg-primary/10 transition-all active:scale-95"
          >
            <Download className="h-3 w-3" />
            Export Laporan
          </button>
          <span className="h-7 px-3 rounded-xl border border-border bg-accent/20 text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            {filtered.length} transaksi
          </span>
          <span className="h-7 px-3 rounded-xl border border-border bg-accent/20 text-[10px] text-muted-foreground font-semibold flex items-center">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative group flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-foreground/50 transition-colors pointer-events-none" />
          <input
            placeholder="Cari kasir, produk, ID..."
            className="w-full h-9 pl-8 pr-8 bg-foreground/[0.03] border border-border rounded-xl text-xs text-foreground/70 placeholder:text-muted-foreground/40 outline-none focus:border-foreground/20 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/60 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Method filter */}
        <div className="flex items-center border border-border rounded-xl overflow-hidden bg-foreground/[0.02] p-0.5 gap-0.5">
          {(["all", "cash", "qris"] as const).map(m => (
            <button
              key={m}
              onClick={() => setFilterMethod(m)}
              className={`h-8 px-3.5 rounded-[10px] text-[11px] font-semibold transition-all ${
                filterMethod === m
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/35 hover:text-foreground/70"
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
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="h-10 px-5 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest w-[110px]">ID</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Waktu</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Kasir</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Bayar</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Pesanan</TableHead>
              <TableHead className="h-10 text-right text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Total</TableHead>
              <TableHead className="h-10 text-right px-5 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableCell colSpan={6} className="text-center h-32">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3.5 w-3.5 border border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Memuat...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableCell colSpan={6} className="text-center h-32">
                  <p className="text-xs text-muted-foreground/40">Tidak ada transaksi ditemukan.</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(trx => (
              <TableRow key={trx.id} className="border-border/20 hover:bg-foreground/[0.01] transition-colors group">
                {/* ID */}
                <TableCell className="px-5 py-4">
                  <span className="font-mono text-[10px] text-muted-foreground/60 group-hover:text-foreground/50 transition-colors">
                    #{trx.id.substring(0, 8).toUpperCase()}
                  </span>
                </TableCell>

                {/* Waktu */}
                <TableCell className="text-[10px] text-foreground/35 whitespace-nowrap">
                  {formatDate(trx.created_at)}
                </TableCell>

                {/* Kasir */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-foreground/[0.05] border border-border flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-muted-foreground/70">
                        {(trx.profiles?.name || "?").substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-foreground/60 group-hover:text-foreground transition-colors whitespace-nowrap">
                      {trx.profiles?.name || <span className="text-muted-foreground/40 italic">Tidak diketahui</span>}
                    </span>
                  </div>
                </TableCell>

                {/* Metode */}
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wide ${
                    trx.payment_method === "qris"
                      ? "border-primary/20 text-primary bg-primary/10"
                      : "border-border text-muted-foreground/60 bg-transparent"
                  }`}>
                    {trx.payment_method === "qris"
                      ? <><CreditCard className="h-2.5 w-2.5" /> QRIS</>
                      : <><Banknote className="h-2.5 w-2.5" /> Tunai</>}
                  </span>
                </TableCell>

                {/* Pesanan */}
                <TableCell className="max-w-[220px]">
                  <p className="text-[10px] text-muted-foreground group-hover:text-foreground/75 transition-colors truncate">
                    {trx.transaction_items.map(ti => `${ti.quantity}× ${ti.products?.name}`).join(", ")}
                  </p>
                </TableCell>

                {/* Total */}
                <TableCell className="text-right font-bold text-foreground/80 tabular-nums">
                  Rp {trx.total_amount.toLocaleString("id-ID")}
                </TableCell>

                {/* Aksi */}
                <TableCell className="text-right px-5">
                  <button
                    onClick={() => deleteTransaction(trx.id)}
                    className="h-7 w-7 rounded-lg text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors border border-transparent hover:border-red-400/20"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer total */}
        {filtered.length > 0 && !loading && (
          <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/60">{filtered.length} transaksi ditampilkan</span>
            <span className="text-xs font-bold text-foreground/60 tabular-nums">
              Total: Rp {totalRevenue.toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
