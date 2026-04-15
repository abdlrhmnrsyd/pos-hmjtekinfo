"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, IceCream, Image as ImageIcon } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Product { id: string; name: string; price: number; image_url: string; is_active: boolean; }

const surface = "rounded-2xl border border-border/50 bg-card/50";
const inputCls = "w-full h-10 bg-foreground/[0.03] border border-border/40 rounded-xl px-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-foreground/20 transition-all";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [isOpen, setIsOpen]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", price: 0, image_url: "" });
  const [saving, setSaving]     = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };
  useEffect(() => { fetchProducts(); }, []);

  const toggleStatus = async (id: string, cur: boolean) => {
    await supabase.from("products").update({ is_active: !cur }).eq("id", id);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") alert("Produk tidak bisa dihapus karena sudah pernah terjual. Nonaktifkan saja.");
      else alert(`Gagal menghapus: ${error.message}`);
      return;
    }
    fetchProducts();
  };

  const handleOpenCreate = () => { setEditingId(null); setFormData({ name: "", price: 0, image_url: "" }); setImageFile(null); setImagePreviewUrl(""); setIsOpen(true); };
  const handleOpenEdit   = (p: Product) => { setEditingId(p.id); setFormData({ name: p.name, price: p.price, image_url: p.image_url || "" }); setImageFile(null); setImagePreviewUrl(""); setIsOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (saving) return; setSaving(true);
    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        setUploadingImage(true);
        const ext = imageFile.name.split(".").pop() || "png";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("products").upload(fileName, imageFile, { upsert: true });
        if (uploadError) { alert(`Gagal upload: ${uploadError.message}`); setSaving(false); setUploadingImage(false); return; }
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
        setUploadingImage(false);
      }
      const payload = { name: formData.name, price: formData.price, image_url: finalImageUrl };
      const { error } = editingId
        ? await supabase.from("products").update(payload).eq("id", editingId)
        : await supabase.from("products").insert([payload]);
      if (error) throw error;
      setIsOpen(false); fetchProducts();
    } catch (err: any) { alert(`Gagal menyimpan: ${err?.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground/90 tracking-tight">Katalog Produk</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola produk yang tersedia di sistem kasir.</p>
        </div>
        <button onClick={handleOpenCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all w-fit shadow-xl shadow-primary/25 active:scale-95">
          <Plus className="h-3.5 w-3.5" /> Tambah Produk
        </button>
      </div>

      {/* Table card */}
      <div className={surface}>
        <div className="p-5 border-b border-border/40">
          <p className="text-sm font-semibold text-foreground/80">Daftar Produk</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Semua produk yang tersedia di sistem kasir.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="h-10 px-5 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest w-[60px]">Foto</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Nama</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Harga</TableHead>
              <TableHead className="h-10 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Status</TableHead>
              <TableHead className="h-10 text-right px-5 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableCell colSpan={5} className="text-center h-32">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3.5 w-3.5 border border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Memuat...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableCell colSpan={5} className="text-center h-32">
                  <p className="text-xs text-muted-foreground/30">Belum ada produk. Tambah produk pertama Anda.</p>
                </TableCell>
              </TableRow>
            ) : products.map(p => (
              <TableRow key={p.id} className="border-border/10 hover:bg-foreground/[0.02] transition-colors group">
                <TableCell className="px-5 py-3">
                  <div className="h-9 w-9 rounded-xl overflow-hidden border border-border/40 bg-foreground/[0.02] group-hover:border-foreground/20 transition-all">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-sm">🍦</div>}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground/70">{p.name}</TableCell>
                <TableCell className="text-sm font-semibold text-foreground/80">Rp {p.price.toLocaleString("id-ID")}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                    p.is_active ? "border-primary/20 text-primary bg-primary/10"
                                : "border-border/40 text-muted-foreground/40 bg-transparent"
                  }`}>
                    <span className={`h-1 w-1 rounded-full ${p.is_active ? "bg-primary" : "bg-muted-foreground/20"}`} />
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </TableCell>
                <TableCell className="text-right px-5">
                  <div className="flex justify-end gap-1.5 transition-all">
                    <button onClick={() => handleOpenEdit(p)}
                      className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-foreground/[0.08] flex items-center justify-center transition-all border border-transparent hover:border-border/30">
                      <Edit className="h-3 w-3" />
                    </button>
                    <button onClick={() => toggleStatus(p.id, p.is_active)} title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all hover:bg-foreground/[0.08] border border-transparent hover:border-border/30 ${p.is_active ? "text-primary/70" : "text-muted-foreground/20 hover:text-muted-foreground"}`}>
                      <IceCream className="h-3 w-3" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      className="h-7 w-7 rounded-lg text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors border border-transparent hover:border-red-400/20">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl"
        >
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground/90">{editingId ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
              <p className="text-[10px] text-muted-foreground/50">{editingId ? "Ubah detail produk." : "Isi detail produk baru."}</p>
            </DialogHeader>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Nama Produk</label>
                <input className={inputCls} required placeholder="Contoh: Vanilla Dream" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Harga (Rp)</label>
                <input className={inputCls} type="number" required min={0} placeholder="15000" value={formData.price || ""} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Foto Produk</label>
                <div className="flex gap-3 items-start">
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-border/40 bg-foreground/[0.02] flex items-center justify-center shrink-0">
                    {(imagePreviewUrl || formData.image_url)
                      ? <img src={imagePreviewUrl || formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={e => Object.assign((e.currentTarget as HTMLImageElement).style, { display: "none" })} />
                      : <ImageIcon className="h-5 w-5 text-muted-foreground/20" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input type="file" accept="image/*"
                      className="cursor-pointer file:text-[10px] file:font-medium file:text-muted-foreground file:bg-foreground/[0.05] file:border-0 hover:file:bg-foreground/[0.08] text-[10px] h-9 bg-transparent border border-border/40 rounded-xl p-1.5 text-muted-foreground"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreviewUrl(URL.createObjectURL(f)); } }} />
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-border/20 flex-1" />
                      <span className="text-[9px] text-muted-foreground/30">atau URL</span>
                      <div className="h-px bg-border/20 flex-1" />
                    </div>
                    <input type="url" placeholder="https://..." className={inputCls + " h-9 text-xs"}
                      value={formData.image_url}
                      onChange={e => { setFormData({ ...formData, image_url: e.target.value }); setImageFile(null); setImagePreviewUrl(""); }} />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-1 pb-6 px-6">
              <button type="button" onClick={() => setIsOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors">
                Batal
              </button>
              <button type="submit" disabled={saving || uploadingImage}
                className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50">
                {saving || uploadingImage ? "Menyimpan..." : "Simpan Produk"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
