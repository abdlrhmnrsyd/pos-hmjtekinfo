"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, IceCream, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    image_url: ""
  });
  const [saving, setSaving] = useState(false);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from("products").update({ is_active: !currentStatus }).eq("id", id);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if(!confirm("Yakin ingin menghapus produk ini?")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    
    if (error) {
      if (error.code === '23503') {
        alert("Produk ini tidak bisa dihapus karena sudah pernah terjual dan tercatat di riwayat transaksi. Sebaiknya matikan saja statusnya (klik tombol centang hijau) agar tidak tampil di Kasir.");
      } else {
        alert(`Gagal menghapus produk: ${error.message}`);
      }
      return;
    }
    
    fetchProducts();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", price: 0, image_url: "" });
    setImageFile(null);
    setImagePreviewUrl("");
    setIsOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({ name: p.name, price: p.price, image_url: p.image_url || "" });
    setImageFile(null);
    setImagePreviewUrl("");
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    
    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        setUploadingImage(true);
        const fileExt = imageFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // @ts-ignore (status is present on StorageApiError)
          alert(`Gagal mengupload gambar. Status: ${uploadError.status || uploadError.statusCode || 'Unknown'}\nPesan: ${uploadError.message}`);
          setSaving(false);
          setUploadingImage(false);
          return;
        }
        
        const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
        setUploadingImage(false);
      }

      if (editingId) {
        const { error } = await supabase.from("products").update({
          name: formData.name,
          price: formData.price,
          image_url: finalImageUrl
        }).eq("id", editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([{
          name: formData.name,
          price: formData.price,
          image_url: finalImageUrl
        }]);
        
        if (error) throw error;
      }
      
      setIsOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan saat menyimpan data produk.\nPesan: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-chart-1/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 translate-y-1/4 hidden md:block"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">Katalog Produk</h2>
          <p className="text-muted-foreground font-medium mt-1">Kelola daftar es krim yang dijual di toko.</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-primary to-chart-1 hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all w-fit" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl shadow-background/50 overflow-hidden relative z-10">
        <CardHeader className="border-b border-border/30 bg-muted/20">
          <CardTitle className="text-xl">Daftar Es Krim</CardTitle>
          <CardDescription>Semua produk yang tersedia di sistem Kasir saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Gambar</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">Loading data...</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">Belum ada produk terdaftar.</TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50 transition-colors group">
                    <TableCell>
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-chart-1/10 overflow-hidden border border-border/50 group-hover:border-primary/30 transition-colors">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xl">🍦</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>Rp {p.price.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" title="Edit Produk" onClick={() => handleOpenEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" title="Ubah Aktif" onClick={() => toggleStatus(p.id, p.is_active)}>
                          <IceCream className={`h-4 w-4 ${p.is_active ? "" : "opacity-30"}`} />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteProduct(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modern Dialog UI */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Produk Es Krim" : "Tambah Es Krim Baru"}</DialogTitle>
              <DialogDescription>
                Isi data form di bawah ini untuk menyimpan item ke katalog POS.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Es Krim</Label>
                <div className="relative">
                  <IceCream className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    required
                    placeholder="E.g. Strawberry Splash"
                    className="pl-9"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">Rp</span>
                  <Input
                    id="price"
                    type="number"
                    required
                    min={0}
                    placeholder="15000"
                    className="pl-9"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label>Foto Es Krim</Label>
                
                <div className="flex gap-4 items-center">
                  <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0 shadow-sm">
                    {(imagePreviewUrl || formData.image_url) ? (
                      <img 
                        src={imagePreviewUrl || formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => Object.assign(e.currentTarget.style, {display: 'none'})}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {/* File Upload Variant */}
                    <div>
                      <Input
                        id="image-file"
                        type="file"
                        accept="image/*"
                        className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:border-0 hover:file:bg-primary/20 text-sm h-10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full">
                      <div className="h-[1px] bg-border/60 flex-1"></div>
                      <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Atau URL</span>
                      <div className="h-[1px] bg-border/60 flex-1"></div>
                    </div>

                    {/* URL Variant */}
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="https://..."
                        className="pl-9 h-10 text-sm"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setImageFile(null);
                          setImagePreviewUrl("");
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || uploadingImage}>
                {saving || uploadingImage ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
