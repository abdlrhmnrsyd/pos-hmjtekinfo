"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  LogOut, 
  CreditCard, 
  Banknote,
  Search,
  CheckCircle2,
  IceCream
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define Types
type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
};

type CartItem = Product & {
  quantity: number;
};

export default function KasirPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash"|"qris">("cash");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [isCheckoutView, setIsCheckoutView] = useState(false);

  useEffect(() => {
    const fetchInitData = async () => {
      // Get User auth config
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }
      
      setUserId(authData.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', authData.user.id)
        .single();
        
      setStaffName(profile?.name || authData.user.email?.split("@")[0] || "Staff");

      // Fetch Products
      const { data: productsData, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (productsData) {
        setProducts(productsData);
      }
      setLoading(false);
    };

    fetchInitData();
  }, [router]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQ = item.quantity + delta;
          return { ...item, quantity: newQ > 0 ? newQ : 1 };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !userId) return;
    setIsProcessing(true);

    try {
      // 1. Insert Transaction
      const { data: trxData, error: trxError } = await supabase
        .from("transactions")
        .insert({
          staff_id: userId,
          payment_method: paymentMethod,
          total_amount: totalAmount,
          notes: "Transaksi POS Kasir",
        })
        .select("id")
        .single();

      if (trxError) throw trxError;

      // 2. Insert Transaction Items
      const trxItems = cart.map(item => ({
        transaction_id: trxData.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(trxItems);

      if (itemsError) throw itemsError;

      // Success
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCart([]);
        setCheckoutSuccess(false);
        setIsCheckoutView(false);
        setCartModalOpen(false);
      }, 3000);

    } catch (error) {
      console.error("Checkout Failed:", error);
      alert("Gagal melakukan checkout. Pastikan tabel di Supabase sudah dibuat!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden">
      
      {/* Left Area - Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Navbar Kasir */}
        <header className="h-16 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-chart-1 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
              <span className="text-white text-xl">🍦</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">ICE HMJ Tekinfo / Kasir</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium bg-secondary px-4 py-2 rounded-full border border-border/50">
              Staff: <span className="text-primary font-bold">{staffName || "..."}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </header>

        {/* Product Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="p-6 pb-2">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">Pilih Pesanan</h2>
            <p className="text-muted-foreground mb-6">Klik item untuk ditambahkan ke keranjang pos.</p>
            
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Cari es krim..." 
                className="pl-10 h-12 rounded-full border-border/50 shadow-sm focus-visible:ring-primary/40 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/20 mb-4 animate-bounce"></div>
                  <p className="text-muted-foreground">Memuat katalog...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Tidak ada produk ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden cursor-pointer group hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border/50 bg-card/60 backdrop-blur-sm"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted">
                          <IceCream className="h-12 w-12 text-primary/30 group-hover:scale-125 transition-transform duration-500" />
                        </div>
                      )}
                      
                      {/* Price Badge over image */}
                      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold border border-border/50 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Rp {(product.price/1000).toFixed(0)}k
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Dialog 
            open={cartModalOpen} 
            onOpenChange={(open) => {
              setCartModalOpen(open);
              if (!open) setTimeout(() => setIsCheckoutView(false), 300);
            }}
          >
            <DialogTrigger 
              render={
                <Button size="lg" className="h-16 rounded-full shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all bg-gradient-to-r from-primary to-chart-1 px-6 flex gap-4" />
              }
            >
              <ShoppingCart className="h-6 w-6" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-bold text-white/80">{cart.reduce((a, b) => a + b.quantity, 0)} items pesanan</span>
                <span className="text-sm font-extrabold">Rp {totalAmount.toLocaleString("id-ID")}</span>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background border-border/50 shadow-2xl">
              {checkoutSuccess ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 px-4 bg-zinc-50/50">
                  <CheckCircle2 className="h-20 w-20 text-green-500 animate-bounce" />
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">Transaksi Berhasil!</h2>
                  <p className="text-muted-foreground font-medium">
                    Terima kasih, struk elektronik sedang dicetak (simulasi).
                  </p>
                </div>
              ) : isCheckoutView ? (
                <div className="flex flex-col bg-zinc-50/50">
                  <DialogHeader className="p-6 pb-2 border-b border-border/40">
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                      <span>Pilih Metode Pembayaran</span>
                      <button 
                        onClick={() => setIsCheckoutView(false)}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Kembali
                      </button>
                    </DialogTitle>
                    <DialogDescription>
                      Total yang harus dibayar: <strong className="text-foreground text-lg ml-1">Rp {totalAmount.toLocaleString("id-ID")}</strong>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 p-6">
                    <Button 
                      variant={paymentMethod === "cash" ? "default" : "outline"} 
                      className={`h-24 flex flex-col gap-2 ${paymentMethod === "cash" ? "bg-gradient-to-br from-primary to-chart-1 shadow-md border-0" : ""}`}
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <Banknote className="h-8 w-8" />
                      Tunai (Cash)
                    </Button>
                    <Button 
                      variant={paymentMethod === "qris" ? "default" : "outline"}
                      className={`h-24 flex flex-col gap-2 ${paymentMethod === "qris" ? "bg-gradient-to-br from-primary to-chart-1 shadow-md border-0" : ""}`}
                      onClick={() => setPaymentMethod("qris")}
                    >
                      <CreditCard className="h-8 w-8" />
                      QRIS Pindai
                    </Button>
                  </div>
                  <DialogFooter className="p-6 pt-0">
                    <Button 
                      onClick={handleCheckout} 
                      className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-chart-1 rounded-xl shadow-lg hover:shadow-primary/20" 
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Memproses..." : "Selesaikan Pembayaran"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="flex flex-col max-h-[85vh] bg-zinc-50/50">
                  <div className="p-4 border-b flex items-center justify-between bg-card shrink-0">
                    <h2 className="font-bold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Pesanan Saat Ini
                    </h2>
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                      {cart.reduce((a, b) => a + b.quantity, 0)} Items
                    </span>
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-3 bg-card p-2 rounded-xl shadow-sm border border-border/30">
                        <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">🍦</div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-semibold line-clamp-2 pr-1">{item.name}</h4>
                            <button onClick={() => removeItem(item.id)} className="text-destructive/70 hover:text-destructive shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="font-bold text-sm text-primary">
                              Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                            </span>
                            <div className="flex items-center bg-muted/50 rounded-md border border-border/50">
                              <button 
                                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold">
                                {item.quantity}
                              </span>
                              <button 
                                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Section & Floating Payment Options */}
                  <div className="p-6 border-t border-border/50 bg-card shrink-0">
                    <div className="space-y-3 pb-6">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">Pajak (0%)</span>
                        <span>Rp 0</span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between font-extrabold text-lg">
                        <span>Total Pembayaran</span>
                        <span className="text-primary">
                          Rp {totalAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      onClick={() => setIsCheckoutView(true)}
                      className="w-full text-base h-14 rounded-xl shadow-xl hover:shadow-primary/20 hover:scale-[1.02] transition-all bg-gradient-to-r from-primary to-chart-1 text-primary-foreground border-none disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none" 
                    >
                      Konfirmasi Pesanan
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
