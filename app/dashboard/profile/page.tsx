"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  User, Lock, Eye, EyeOff, ShoppingBag, Coins,
  CreditCard, Banknote, CheckCircle2, XCircle, AlertCircle,
  KeyRound, Receipt,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/* ─── Types ─── */
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

type Toast = { type: "success" | "error"; msg: string } | null;

/* ─── Helpers ─── */
const fmt = (n: number) => n.toLocaleString("id-ID");
const formatDate = (s: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));

/* ─── Toast ─── */
function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  if (!toast) return null;
  const isOk = toast.type === "success";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl transition-all duration-300`}
      style={{
        background: isOk ? "rgba(20,20,20,0.97)" : "rgba(20,20,20,0.97)",
        border: isOk ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,80,80,0.30)",
        backdropFilter: "blur(20px)",
      }}
    >
      {isOk
        ? <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0" />
        : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
      }
      <span className="text-xs font-semibold text-white/75">{toast.msg}</span>
      <button onClick={onDismiss} className="ml-2 text-white/25 hover:text-white/60 transition-colors text-xs">✕</button>
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] ${className}`}>
      {children}
    </div>
  );
}

/* ─── Stat pill ─── */
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">{label}</span>
      <span className="text-base font-bold text-white/85 tabular-nums tracking-tight">{value}</span>
    </div>
  );
}

/* ─────────────── MAIN ─────────────── */
export default function ProfilePage() {
  /* --- auth/profile state --- */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail]     = useState("");
  const [userId, setUserId]   = useState("");

  /* --- transactions --- */
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trxLoading, setTrxLoading]     = useState(true);

  /* --- password form --- */
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading]   = useState(false);

  /* --- ui --- */
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Load user & transactions ── */
  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const uid = authData.user.id;
      setUserId(uid);
      setEmail(authData.user.email || "");

      // Fetch profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, name, role, created_at")
        .eq("id", uid)
        .single();
      if (prof) setProfile(prof as Profile);

      // Fetch transactions by this user
      setTrxLoading(true);
      const { data: trxRaw } = await supabase
        .from("transactions")
        .select("id, created_at, total_amount, payment_method, transaction_items(quantity, products(name))")
        .eq("staff_id", uid)
        .order("created_at", { ascending: false });

      if (trxRaw) setTransactions(trxRaw as Transaction[]);
      setTrxLoading(false);
    })();
  }, []);

  /* ── Change password handler ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPwd || !confirmPwd) {
      showToast("error", "Semua kolom wajib diisi.");
      return;
    }
    if (newPwd.length < 6) {
      showToast("error", "Password baru minimal 6 karakter.");
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast("error", "Konfirmasi password tidak cocok.");
      return;
    }

    setPwdLoading(true);

    // Re-authenticate with current password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPwd,
    });

    if (signInErr) {
      setPwdLoading(false);
      showToast("error", "Password saat ini salah.");
      return;
    }

    // Update password
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd });

    setPwdLoading(false);

    if (updateErr) {
      showToast("error", updateErr.message || "Gagal mengubah password.");
    } else {
      showToast("success", "Password berhasil diubah.");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    }
  };

  /* ── Stats ── */
  const totalRevenue = transactions.reduce((s, t) => s + t.total_amount, 0);
  const totalQris    = transactions.filter(t => t.payment_method === "qris").length;
  const totalCash    = transactions.filter(t => t.payment_method === "cash").length;
  const favMethod    = transactions.length === 0 ? "—" : totalQris >= totalCash ? "QRIS" : "Tunai";
  const joinedDate   = profile?.created_at
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(profile.created_at))
    : "—";

  const displayName = profile?.name || email.split("@")[0] || "User";
  const initials    = displayName.substring(0, 2).toUpperCase();

  /* ── Password strength ── */
  const pwdStrength = (() => {
    if (!newPwd) return null;
    if (newPwd.length < 6) return { label: "Terlalu pendek", color: "rgba(255,80,80,0.8)", pct: 20 };
    if (newPwd.length < 8) return { label: "Lemah", color: "rgba(255,160,40,0.8)", pct: 45 };
    if (/[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd)) return { label: "Kuat", color: "rgba(120,255,120,0.7)", pct: 100 };
    return { label: "Cukup", color: "rgba(200,200,255,0.7)", pct: 70 };
  })();

  return (
    <div className="space-y-7 pb-16 max-w-5xl">

      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold text-white/90 tracking-tight">Profil Saya</h2>
        <p className="text-xs text-white/25 mt-0.5">Kelola informasi akun dan riwayat transaksi Anda.</p>
      </div>

      {/* ── Profile Info Card ── */}
      <SectionCard>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center border border-white/[0.12]"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <span className="text-2xl font-bold text-white/70">{initials}</span>
            </div>
            <span
              className="absolute -bottom-1 -right-1 h-5 px-2 rounded-full text-[8px] font-bold uppercase tracking-wide flex items-center border"
              style={{
                background: profile?.role === "admin" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                border: profile?.role === "admin" ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.10)",
                color: profile?.role === "admin" ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.40)",
              }}
            >
              {profile?.role || "user"}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white/90 tracking-tight">{displayName}</h3>
            <p className="text-xs text-white/35 mt-0.5">{email}</p>
            <p className="text-[10px] text-white/20 mt-1.5 flex items-center gap-1">
              <User className="h-3 w-3" />
              Bergabung sejak {joinedDate}
            </p>
          </div>

          {/* Summary pills */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 shrink-0">
            <StatPill label="Total Transaksi" value={`${transactions.length}`} />
            <StatPill label="Total Pendapatan" value={`Rp ${totalRevenue >= 1_000_000 ? `${(totalRevenue / 1_000_000).toFixed(1)}Jt` : fmt(totalRevenue)}`} />
            <StatPill label="Metode Favorit" value={favMethod} />
            <StatPill label="ID Akun" value={`#${userId.substring(0, 6).toUpperCase()}`} />
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/[0.06] px-6 py-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5 text-white/25" />
            <span className="text-[11px] text-white/40">{transactions.length} transaksi total</span>
          </div>
          <div className="h-3 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-white/25" />
            <span className="text-[11px] text-white/40">{totalQris}× QRIS</span>
          </div>
          <div className="h-3 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <Banknote className="h-3.5 w-3.5 text-white/25" />
            <span className="text-[11px] text-white/40">{totalCash}× Tunai</span>
          </div>
          <div className="h-3 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <Coins className="h-3.5 w-3.5 text-white/25" />
            <span className="text-[11px] text-white/40">Rp {fmt(totalRevenue)} total pendapatan</span>
          </div>
        </div>
      </SectionCard>

      {/* ── Two columns: Transactions + Change Password ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* ── Transactions Table (wider) ── */}
        <div className="lg:col-span-3 space-y-0">
          <SectionCard className="overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-white/30" />
                <div>
                  <h3 className="text-sm font-semibold text-white/80">Riwayat Transaksi Saya</h3>
                  <p className="text-[10px] text-white/25 mt-0.5">Semua transaksi yang Anda lakukan</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/20 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1">
                {transactions.length} total
              </span>
            </div>

            {/* Table */}
            <div className="max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.05] hover:bg-transparent sticky top-0">
                    <TableHead className="h-9 px-4 text-[9px] font-semibold text-white/20 uppercase tracking-widest bg-white/[0.02]">Waktu</TableHead>
                    <TableHead className="h-9 text-[9px] font-semibold text-white/20 uppercase tracking-widest bg-white/[0.02]">Pesanan</TableHead>
                    <TableHead className="h-9 text-[9px] font-semibold text-white/20 uppercase tracking-widest bg-white/[0.02]">Bayar</TableHead>
                    <TableHead className="h-9 text-right px-4 text-[9px] font-semibold text-white/20 uppercase tracking-widest bg-white/[0.02]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trxLoading ? (
                    <TableRow className="border-white/[0.04] hover:bg-transparent">
                      <TableCell colSpan={4} className="text-center h-32">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-3.5 w-3.5 border border-white/20 border-t-white/70 rounded-full animate-spin" />
                          <span className="text-xs text-white/30">Memuat...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow className="border-white/[0.04] hover:bg-transparent">
                      <TableCell colSpan={4} className="text-center h-32">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag className="h-6 w-6 text-white/10" />
                          <p className="text-xs text-white/20">Belum ada transaksi</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : transactions.map(trx => (
                    <TableRow key={trx.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                      {/* Waktu */}
                      <TableCell className="px-4 py-3 text-[10px] text-white/35 whitespace-nowrap align-top">
                        {formatDate(trx.created_at)}
                      </TableCell>

                      {/* Pesanan */}
                      <TableCell className="max-w-[160px] py-3 align-top">
                        <div className="space-y-0.5">
                          {trx.transaction_items.map((ti, i) => (
                            <p key={i} className="text-[10px] text-white/45 truncate group-hover:text-white/65 transition-colors">
                              {ti.quantity}× {ti.products?.name || "—"}
                            </p>
                          ))}
                        </div>
                      </TableCell>

                      {/* Metode */}
                      <TableCell className="py-3 align-top">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold border uppercase tracking-wide ${
                          trx.payment_method === "qris"
                            ? "border-white/15 text-white/60 bg-white/[0.05]"
                            : "border-white/[0.05] text-white/25 bg-transparent"
                        }`}>
                          {trx.payment_method === "qris"
                            ? <><CreditCard className="h-2.5 w-2.5" /> QRIS</>
                            : <><Banknote className="h-2.5 w-2.5" /> Tunai</>}
                        </span>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-right px-4 py-3 align-top">
                        <span className="text-xs font-bold text-white/75 tabular-nums">
                          Rp {fmt(trx.total_amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            {transactions.length > 0 && !trxLoading && (
              <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-white/20">{transactions.length} transaksi</span>
                <span className="text-[11px] font-bold text-white/55 tabular-nums">
                  Total: Rp {fmt(totalRevenue)}
                </span>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Change Password Form ── */}
        <div className="lg:col-span-2">
          <SectionCard>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-white/30" />
              <div>
                <h3 className="text-sm font-semibold text-white/80">Ganti Password</h3>
                <p className="text-[10px] text-white/25 mt-0.5">Perbarui kata sandi akun Anda</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-10 pl-9 pr-10 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white/70 placeholder:text-white/20 outline-none focus:border-white/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/55 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-10 pl-9 pr-10 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white/70 placeholder:text-white/20 outline-none focus:border-white/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/55 transition-colors"
                  >
                    {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Strength bar */}
                {pwdStrength && (
                  <div className="space-y-1 pt-0.5">
                    <div className="h-0.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pwdStrength.pct}%`, background: pwdStrength.color }}
                      />
                    </div>
                    <p className="text-[9px]" style={{ color: pwdStrength.color }}>{pwdStrength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-10 pl-9 pr-10 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white/70 placeholder:text-white/20 outline-none focus:border-white/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/55 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPwd && newPwd && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {confirmPwd === newPwd
                      ? <><CheckCircle2 className="h-3 w-3 text-white/50" /><span className="text-[9px] text-white/40">Password cocok</span></>
                      : <><AlertCircle className="h-3 w-3 text-red-400/70" /><span className="text-[9px] text-red-400/60">Password tidak cocok</span></>
                    }
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-white/20 shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Setelah berhasil mengganti password, Anda tidak akan keluar dari sesi ini secara otomatis.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full h-10 rounded-xl bg-white text-black text-xs font-bold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 active:bg-white/80 transition-all flex items-center justify-center gap-2"
              >
                {pwdLoading
                  ? <><div className="h-3.5 w-3.5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />Menyimpan...</>
                  : <><KeyRound className="h-3.5 w-3.5" />Simpan Password Baru</>
                }
              </button>
            </form>
          </SectionCard>
        </div>
      </div>

      {/* Toast */}
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
