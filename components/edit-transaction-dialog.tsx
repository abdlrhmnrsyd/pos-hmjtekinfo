"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Minus, Trash2, CreditCard, Banknote, Search, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface EditItem {
  product_id: string;
  name: string;
  quantity: number;
  price_at_time: number;
}

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
  onSuccess: () => void;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: EditTransactionDialogProps) {
  const [items, setItems] = useState<EditItem[]>([]);
  const [payMethod, setPayMethod] = useState<string>("cash");
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (transaction && open) {
      setPayMethod(transaction.payment_method);
      const initialItems = transaction.transaction_items.map((ti: any) => ({
        product_id: ti.product_id,
        name: ti.products?.name || "Produk dihapus",
        quantity: ti.quantity,
        price_at_time: ti.price_at_time,
      }));
      setItems(initialItems);
      fetchProducts();
    }
  }, [transaction, open]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, price").eq("is_active", true);
    if (data) setAllProducts(data);
  };

  const updateQty = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const addProduct = (p: Product) => {
    const existing = items.find((i) => i.product_id === p.id);
    if (existing) {
      updateQty(p.id, 1);
    } else {
      setItems([
        ...items,
        {
          product_id: p.id,
          name: p.name,
          quantity: 1,
          price_at_time: p.price,
        },
      ]);
    }
    setProductSearch("");
  };

  const totalAmount = items.reduce((s, i) => s + i.price_at_time * i.quantity, 0);

  const handleSave = async () => {
    if (items.length === 0) {
      alert("Transaksi harus memiliki minimal 1 item.");
      return;
    }
    setSaving(true);
    try {
      // 1. Update transaction header
      const { error: trxError } = await supabase
        .from("transactions")
        .update({
          payment_method: payMethod,
          total_amount: totalAmount,
        })
        .eq("id", transaction.id);

      if (trxError) throw trxError;

      // 2. Refresh items (Delete & Re-insert)
      const { error: delError } = await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", transaction.id);

      if (delError) throw delError;

      const { error: insError } = await supabase.from("transaction_items").insert(
        items.map((i) => ({
          transaction_id: transaction.id,
          product_id: i.product_id,
          quantity: i.quantity,
          price_at_time: i.price_at_time,
        }))
      );

      if (insError) throw insError;

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/50 shadow-2xl rounded-2xl">
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground/90">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Edit Transaksi #{transaction?.id.substring(0, 8).toUpperCase()}
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground/60">Ubah detail transaksi, metode pembayaran, atau daftar pesanan.</p>
          </DialogHeader>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPayMethod("cash")}
                className={`flex items-center justify-center gap-2 h-10 rounded-xl border transition-all text-xs font-semibold ${
                  payMethod === "cash"
                    ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10"
                    : "border-border/50 text-muted-foreground hover:bg-accent/5"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Tunai
              </button>
              <button
                onClick={() => setPayMethod("qris")}
                className={`flex items-center justify-center gap-2 h-10 rounded-xl border transition-all text-xs font-semibold ${
                  payMethod === "qris"
                    ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10"
                    : "border-border/50 text-muted-foreground hover:bg-accent/5"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                QRIS
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex justify-between">
              Daftar Pesanan
              <span className="text-primary">{items.length} item</span>
            </label>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {items.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.02] border border-border/40 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground/80 truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground/50">Rp {item.price_at_time.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => updateQty(item.product_id, -1)}
                        className="h-6 w-6 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product_id, 1)}
                        className="h-6 w-6 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="h-6 w-6 rounded-lg text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="h-20 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
                  <p className="text-[10px] text-muted-foreground/40 italic">Pesanan kosong</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Product Search */}
          <div className="space-y-3 pt-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-foreground/50 transition-colors" />
              <input
                placeholder="Tambah produk lain..."
                className="w-full h-10 pl-9 pr-4 bg-foreground/[0.03] border border-border/40 rounded-xl text-xs outline-none focus:border-primary/30 transition-all font-medium"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {productSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-popover border border-border shadow-2xl rounded-xl z-50 max-h-[160px] overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-foreground/[0.04] flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground/70 group-hover:text-primary transition-colors">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground/40">Rp {p.price.toLocaleString("id-ID")}</p>
                      </div>
                      <Plus className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="p-3 text-center text-[10px] text-muted-foreground/40">Tidak ada produk</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-row items-center justify-between p-6 bg-muted/30 border-t border-border/40">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.1em]">Total Akhir</p>
            <p className="text-lg font-black text-foreground tracking-tight">Rp {totalAmount.toLocaleString("id-ID")}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-all"
            >
              Batal
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
