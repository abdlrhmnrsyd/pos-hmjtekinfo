import Link from "next/link";
import { ArrowRight, IceCream, Star, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-chart-1/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: "2s" }}></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: "4s" }}></div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto backdrop-blur-sm border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center bg-gradient-to-br from-primary to-chart-1 rounded-xl shadow-lg animate-pulse-glow">
              <IceCream className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">
              ICE HMJ Tekinfo
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Masuk
            </Link>
            <Link href="/login">
              <Button className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                Mulai Gratis
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center px-6 pt-20 pb-24 text-center max-w-5xl mx-auto animate-float-slow">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Star className="h-4 w-4" /> Solusi UMKM Kekinian
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Manajemen Es Krim <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-chart-1 to-primary bg-[length:200%_auto] animate-[pulse_3s_ease-in-out_infinite]">Lebih Manis</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            Sistem Kasir (POS) modern dengan visual memukau, transaksi kilat, dan analitik lengkap. 
            Tingkatkan omset toko es krimmu tanpa pusing memikirkan pembukuan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-full gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
                Buka Toko Sekarang <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/kasir">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-full backdrop-blur-md bg-background/50 hover:bg-secondary/50 transition-colors">
                Lihat Demo Kasir
              </Button>
            </Link>
          </div>
        </main>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-6 py-24 border-t border-border/40 bg-background/50 backdrop-blur-3xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-card to-secondary border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Transaksi Kilat</h3>
              <p className="text-muted-foreground">Proses pesanan pelanggan dalam hitungan detik. Mendukung metode pembayaran QRIS & Tunai.</p>
            </div>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-card to-secondary border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Keamanan Data</h3>
              <p className="text-muted-foreground">Didukung oleh Supabase Database dan Autentikasi canggih. Data Anda aman 24/7 di cloud.</p>
            </div>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-card to-secondary border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-chart-1/10 flex items-center justify-center mb-6 text-chart-1">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Analitik Interaktif</h3>
              <p className="text-muted-foreground">Pantau produk terlaris dan grafik pendapatan harian langsung dari Dashboard modern yang cantik.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
