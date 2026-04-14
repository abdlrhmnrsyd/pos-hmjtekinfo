"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, Trash2, LogOut,
  CreditCard, Banknote, Search, CheckCircle2,
  IceCream, X, Receipt, ChevronRight, LayoutDashboard, UserCircle,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

/* ─── Types ─── */
type Product  = { id: string; name: string; price: number; image_url: string };
type CartItem = Product & { quantity: number };
type PayMethod = "cash" | "qris";
type DrawerView = "cart" | "payment" | "success";

const fmt = (n: number) => n.toLocaleString("id-ID");

/* ─── Qty Stepper ─── */
function QtyControl({ qty, onInc, onDec }: { qty: number; onInc: () => void; onDec: () => void }) {
  return (
    <div className="flex items-center border border-white/[0.10] rounded-xl overflow-hidden bg-white/[0.02]">
      <button onClick={onDec}
        className="w-9 h-9 flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition-all active:scale-90">
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-9 text-center text-sm font-bold text-white/85 tabular-nums select-none">{qty}</span>
      <button onClick={onInc}
        className="w-9 h-9 flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition-all active:scale-90">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─── Cart Drawer ─── */
function CartDrawer({
  open, onClose, cart, payMethod, setPayMethod,
  onInc, onDec, onRemove, onClear, onCheckout, isProcessing,
}: {
  open: boolean; onClose: () => void; cart: CartItem[];
  payMethod: PayMethod; setPayMethod: (m: PayMethod) => void;
  onInc: (id: string) => void; onDec: (id: string) => void;
  onRemove: (id: string) => void; onClear: () => void;
  onCheckout: () => void; isProcessing: boolean;
}) {
  const [view, setView] = useState<DrawerView>("cart");
  const totalItems  = cart.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // Reset view when drawer closes
  useEffect(() => {
    if (!open) setTimeout(() => setView("cart"), 300);
  }, [open]);

  const handleConfirm = async () => {
    await onCheckout();
    setView("success");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-all duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: open ? "blur(4px)" : "blur(0px)" }}
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "rgba(9,9,9,0.98)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: open ? "-32px 0 80px rgba(0,0,0,0.8)" : "none",
        }}
      >
        {/* ── Success screen ── */}
        {view === "success" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 text-center">
            <div
              className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center"
              style={{ boxShadow: "0 0 60px rgba(255,255,255,0.20)" }}
            >
              <CheckCircle2 className="h-10 w-10 text-black" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Transaksi Berhasil!</h2>
              <p className="text-sm text-white/40">
                Total <span className="text-white/70 font-semibold">Rp {fmt(totalAmount)}</span>
              </p>
              <p className="text-xs text-white/25">
                Dibayar via {payMethod === "qris" ? "QRIS" : "Tunai"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 h-11 px-8 rounded-2xl bg-white/[0.06] border border-white/[0.10] text-sm text-white/60 hover:bg-white/[0.10] hover:text-white/80 transition-all"
            >
              Tutup
            </button>
          </div>
        ) : view === "payment" ? (
          /* ── Payment view ── */
          <>
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.07] shrink-0 flex items-center gap-3">
              <button onClick={() => setView("cart")}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all">
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white/90">Metode Pembayaran</h2>
                <p className="text-[10px] text-white/30">{totalItems} item · Rp {fmt(totalAmount)}</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Payment cards */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "cash" as const, label: "Tunai",  sub: "Pembayaran langsung", Icon: Banknote },
                  { key: "qris" as const, label: "QRIS",   sub: "Scan QR code",        Icon: CreditCard },
                ]).map(({ key, label, sub, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPayMethod(key)}
                    className={`relative h-32 rounded-2xl flex flex-col items-center justify-center gap-3 border transition-all duration-200 overflow-hidden ${
                      payMethod === key
                        ? "bg-white text-black border-white"
                        : "border-white/[0.08] text-white/40 hover:border-white/[0.18] hover:text-white/70 bg-white/[0.02]"
                    }`}
                    style={payMethod === key ? { boxShadow: "0 8px 32px rgba(255,255,255,0.15)" } : undefined}
                  >
                    {payMethod === key && (
                      <div className="absolute inset-0 rounded-2xl"
                        style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)" }} />
                    )}
                    <Icon className="h-7 w-7 relative" />
                    <div className="text-center relative">
                      <p className={`text-sm font-bold ${payMethod === key ? "text-black" : ""}`}>{label}</p>
                      <p className={`text-[9px] mt-0.5 ${payMethod === key ? "text-black/40" : "text-white/20"}`}>{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Order summary */}
              <div
                className="rounded-2xl p-4 space-y-2.5"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest mb-3">Rincian Pesanan</p>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-xs text-white/45 truncate max-w-[220px]">
                      <span className="text-white/25 mr-1.5">{item.quantity}×</span>{item.name}
                    </span>
                    <span className="text-xs font-semibold text-white/60 tabular-nums shrink-0">
                      Rp {fmt(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-white/[0.06] pt-2.5 mt-2.5 flex justify-between items-center">
                  <span className="text-sm font-bold text-white/60">Total</span>
                  <span className="text-lg font-bold text-white tabular-nums">Rp {fmt(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/[0.06] shrink-0">
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full h-13 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
                style={{ height: 52, boxShadow: "0 4px 24px rgba(255,255,255,0.12)" }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isProcessing ? "Memproses..." : `Konfirmasi · Rp ${fmt(totalAmount)}`}
              </button>
            </div>
          </>
        ) : (
          /* ── Cart view ── */
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="h-4 w-4 text-white/50" />
                  <h2 className="text-sm font-bold text-white/90">Pesanan</h2>
                  {cart.length > 0 && (
                    <span
                      className="h-5 px-2 rounded-full text-[10px] font-bold text-black bg-white flex items-center"
                    >
                      {totalItems}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button onClick={onClear}
                      className="text-[9px] font-medium text-white/25 hover:text-red-400/60 transition-colors border border-white/[0.06] hover:border-red-400/20 rounded-lg px-2.5 py-1">
                      Kosongkan
                    </button>
                  )}
                  <button onClick={onClose}
                    className="h-7 w-7 flex items-center justify-center rounded-xl text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {cart.length > 0 && (
                <p className="text-[10px] text-white/25 mt-1.5">{cart.length} produk berbeda</p>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-24 gap-4">
                  <div
                    className="h-20 w-20 rounded-3xl flex items-center justify-center border"
                    style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                  >
                    <ShoppingCart className="h-9 w-9 text-white/10" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/25">Keranjang masih kosong</p>
                    <p className="text-xs text-white/15 mt-1">Pilih produk dari daftar menu</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="group flex gap-3.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-white/[0.07] bg-white/[0.02]">
                        {item.image_url
                          ? <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                          : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🍦
                            </div>
                          )}
                      </div>
                      {/* Detail */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white/80 truncate leading-tight">{item.name}</p>
                          <button
                            onClick={() => onRemove(item.id)}
                            className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/70 transition-all p-0.5 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-sm font-bold text-white/85 tabular-nums">
                            Rp {fmt(item.price * item.quantity)}
                          </span>
                          <QtyControl
                            qty={item.quantity}
                            onInc={() => onInc(item.id)}
                            onDec={() => onDec(item.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div
                className="border-t border-white/[0.07] p-5 space-y-4 shrink-0"
                style={{ background: "rgba(255,255,255,0.01)" }}
              >
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/30">
                    <span>Subtotal ({totalItems} item)</span>
                    <span className="tabular-nums">Rp {fmt(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                      Rp {fmt(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => setView("payment")}
                  className="w-full rounded-2xl font-bold text-black bg-white hover:bg-white/90 transition-all flex items-center justify-between px-5 group"
                  style={{ height: 56, boxShadow: "0 4px 24px rgba(255,255,255,0.12)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm">Lanjut Pembayaran</span>
                  </div>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────── MAIN PAGE ─────────────── */
export default function KasirPage() {
  const router = useRouter();
  const [loading, setLoading]     = useState(true);
  const [staffName, setStaffName] = useState("");
  const [userId, setUserId]       = useState<string | null>(null);
  const [products, setProducts]   = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.push("/login"); return; }
      setUserId(authData.user.id);
      const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", authData.user.id).single();
      setStaffName(profile?.name || authData.user.email?.split("@")[0] || "Staff");
      setIsAdmin(profile?.role === "admin");
      const { data: pd } = await supabase.from("products").select("*").eq("is_active", true).order("name", { ascending: true });
      if (pd) setProducts(pd);
      setLoading(false);
    })();
  }, [router]);

  const addToCart = useCallback((product: Product) =>
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      return ex ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
               : [...prev, { ...product, quantity: 1 }];
    }), []);

  const updateQty = useCallback((id: string, delta: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)), []);

  const removeItem  = useCallback((id: string) => setCart(prev => prev.filter(i => i.id !== id)), []);
  const clearCart   = useCallback(() => setCart([]), []);

  const totalItems  = cart.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const filtered    = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCheckout = async () => {
    if (!cart.length || !userId) return;
    setIsProcessing(true);
    try {
      const { data: trxData, error: trxError } = await supabase
        .from("transactions")
        .insert({ staff_id: userId, payment_method: payMethod, total_amount: totalAmount, notes: "Transaksi POS Kasir" })
        .select("id").single();
      if (trxError) throw trxError;
      const { error } = await supabase.from("transaction_items").insert(
        cart.map(item => ({ transaction_id: trxData.id, product_id: item.id, quantity: item.quantity, price_at_time: item.price }))
      );
      if (error) throw error;
      // Cart cleared after drawer closes
      setTimeout(() => setCart([]), 3000);
    } catch (err) {
      console.error("Checkout Failed:", err);
      alert("Gagal checkout. Cek tabel Supabase!");
      throw err;
    } finally { setIsProcessing(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[oklch(0.06_0_0)]">
      <div className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-white/80" />
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-[oklch(0.06_0_0)] overflow-hidden">

      {/* ── Top bar ── */}
      <header
        className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-white/[0.06] z-20"
        style={{ background: "rgba(6,6,6,0.90)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl overflow-hidden border border-white/[0.10] shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/80 leading-tight">ICE HMJ Tekinfo</p>
            <p className="text-[9px] text-white/25 leading-tight">Point of Sale</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="font-mono text-xs text-white/30 tabular-nums hidden sm:block">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <Separator orientation="vertical" className="h-5 bg-white/[0.06] hidden sm:block" />
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-white/60">{staffName}</span>
            <span className="text-[9px] text-white/25">{isAdmin ? "Admin" : "Staff aktif"}</span>
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/[0.06] hidden sm:block" />

          {/* Profile button — all users */}
          <Link href="/profile">
            <button
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/[0.10] text-white/50 hover:text-white/90 hover:bg-white/[0.06] hover:border-white/[0.20] transition-all text-xs font-semibold"
              title="Lihat profil saya"
            >
              <UserCircle className="h-3.5 w-3.5" />
              <span>Profil</span>
            </button>
            {/* Mobile: icon only */}
            <button
              className="flex sm:hidden h-8 w-8 items-center justify-center rounded-xl border border-white/[0.10] text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-all"
              title="Profil Saya"
            >
              <UserCircle className="h-3.5 w-3.5" />
            </button>
          </Link>

          {/* Admin shortcut */}
          {isAdmin && (
            <>
              <Separator orientation="vertical" className="h-5 bg-white/[0.06] hidden sm:block" />
              <Link href="/dashboard">
                <button
                  className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/[0.10] text-white/50 hover:text-white/90 hover:bg-white/[0.06] hover:border-white/[0.20] transition-all text-xs font-semibold"
                  title="Buka halaman Admin"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </button>
                {/* Mobile: icon only */}
                <button
                  className="flex sm:hidden h-8 w-8 items-center justify-center rounded-xl border border-white/[0.10] text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-all"
                  title="Dashboard Admin"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </button>
              </Link>
            </>
          )}

          <button onClick={handleLogout}
            className="text-white/25 hover:text-white/60 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all" title="Keluar">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── Search + title ── */}
      <div className="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white/80">Pilih Menu</h2>
          <p className="text-[10px] text-white/25 mt-0.5">{products.length} produk tersedia</p>
        </div>
        <div className="relative group min-w-[200px] sm:min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-focus-within:text-white/50 transition-colors pointer-events-none" />
          <input
            placeholder="Cari produk..."
            className="w-full h-9 pl-8 pr-8 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white/70 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Products grid ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 border border-dashed border-white/[0.05] rounded-2xl gap-3">
            <IceCream className="h-8 w-8 text-white/10" />
            <p className="text-xs text-white/20">
              {searchQuery ? `Tidak ada produk "${searchQuery}"` : "Belum ada produk aktif"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filtered.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`overflow-hidden text-left rounded-2xl transition-all duration-200 active:scale-[0.96] group relative border ${
                    inCart
                      ? "border-white/25 bg-white/[0.07]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14]"
                  }`}
                  style={inCart ? { boxShadow: "0 0 0 1px rgba(255,255,255,0.10)" } : undefined}
                >
                  {/* Qty badge */}
                  {inCart && (
                    <div
                      className="absolute top-2.5 left-2.5 z-30 h-6 w-6 bg-white rounded-full flex items-center justify-center"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                    >
                      <span className="text-[10px] font-bold text-black">{inCart.quantity}</span>
                    </div>
                  )}

                  {/* Image */}
                  <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent z-10 pointer-events-none" />
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IceCream className="h-10 w-10 text-white/10 group-hover:text-white/20 transition-colors" />
                      </div>
                    )}
                    {/* Price */}
                    <div className="absolute bottom-2.5 left-2.5 z-20">
                      <span className="text-[11px] font-bold text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                        Rp {fmt(product.price)}
                      </span>
                    </div>
                    {/* Add icon */}
                    <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <Plus className="h-3.5 w-3.5 text-black" />
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="px-3 py-2.5">
                    <p className={`text-xs font-semibold line-clamp-1 transition-colors ${
                      inCart ? "text-white/90" : "text-white/45 group-hover:text-white/80"
                    }`}>
                      {product.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Floating cart button ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex items-center gap-4 rounded-2xl transition-all duration-300 ${
            cart.length > 0
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 8px 40px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)",
            padding: "12px 20px 12px 14px",
          }}
        >
          {/* Left: cart icon + badge */}
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-black/[0.08] flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-black" />
            </div>
            <span
              className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums"
            >
              {totalItems}
            </span>
          </div>

          {/* Center: label */}
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-black/40 font-medium leading-none">{cart.length} produk</span>
            <span className="text-base font-bold text-black leading-snug tabular-nums">
              Rp {fmt(totalAmount)}
            </span>
          </div>

          {/* Right: chevron */}
          <div className="h-7 w-7 bg-black rounded-xl flex items-center justify-center ml-1">
            <ChevronRight className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>

      {/* ── Cart drawer ── */}
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cart={cart}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        onInc={id => updateQty(id, +1)}
        onDec={id => updateQty(id, -1)}
        onRemove={removeItem}
        onClear={clearCart}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
      />
    </div>
  );
}
