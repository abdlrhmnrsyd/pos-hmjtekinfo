"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, IceCream } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [secretClicks, setSecretClicks] = useState(0);

  const handleSecretClick = () => {
    const n = secretClicks + 1;
    setSecretClicks(n);
    if (n >= 5) { setShowRegister(true); setSecretClicks(0); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (!name) { setError("Nama harus diisi."); setLoading(false); return; }
      const { data: profileList, error: findError } = await supabase
        .from("profiles").select("email, role").ilike("name", name).limit(1);
      if (findError || !profileList?.length || !profileList[0].email) {
        setError("Nama pengguna tidak ditemukan."); setLoading(false); return;
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: profileList[0].email, password,
      });
      if (authError) { setError("Password salah."); setLoading(false); return; }
      if (!data.user || !data.session) return;
      
      // Set cookies for 7 days
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure" : ""}`;
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=604800; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure" : ""}`;

      // Admin dan Staff semuanya diarahkan ke Kasir terlebih dahulu
      router.push("/kasir");
    } catch { setError("Terjadi kesalahan. Coba lagi."); } 
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail, password: regPassword, options: { data: { name: regName } }
      });
      if (signUpError) { setError(signUpError.message); return; }
      if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, name: regName, email: regEmail });
      if (data.user && data.session === null) {
        setSuccess("Akun dibuat! Cek email untuk konfirmasi.");
      } else if (data.session) { 
        // Set cookies for 7 days
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure" : ""}`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=604800; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure" : ""}`;

        setSuccess("Berhasil! Mengalihkan..."); 
        setTimeout(() => { window.location.href = "/kasir"; }, 1500); 
      }
    } catch { setError("Terjadi kesalahan saat mendaftar."); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full h-10 bg-background/50 border border-border/50 rounded-xl px-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Radial ambient */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
        style={{ background: "radial-gradient(ellipse, var(--border) 0%, transparent 70%)", opacity: 0.1 }}
      />
      {/* Top line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)", opacity: 0.3 }}
      />

      <div className="relative z-10 w-full max-w-[340px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <button
            onClick={handleSecretClick}
            className="h-12 w-12 rounded-2xl overflow-hidden border border-border transition-all active:scale-95"
          >
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {showRegister ? "Buat Akun" : "ICE HMJ Tekinfo"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {showRegister ? "Daftarkan akun kasir baru" : "Masuk ke sistem kasir"}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 relative overflow-hidden surface"
        >
          {showRegister ? (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nama</label>
                <input className={inputClass} type="text" placeholder="Nama lengkap" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                <input className={inputClass} type="email" placeholder="nama@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                <input className={inputClass} type="password" placeholder="Min. 6 karakter" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} />
              </div>

              {error && <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded-lg p-2.5">{error}</p>}
              {success && <p className="text-xs text-muted-foreground border border-border bg-accent/20 rounded-lg p-2.5">{success}</p>}

              <div className="pt-1 space-y-2">
                <button type="submit" disabled={loading}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Akun"}
                </button>
                <button type="button" onClick={() => setShowRegister(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  ← Kembali ke halaman masuk
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nama</label>
                <input className={inputClass} type="text" placeholder="Nama lengkap Anda" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                <input className={inputClass} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {error && <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded-lg p-2.5">{error}</p>}

              <div className="pt-1">
                <button type="submit" disabled={loading}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-6">ICE HMJ Tekinfo © 2025</p>
      </div>
    </div>
  );
}
