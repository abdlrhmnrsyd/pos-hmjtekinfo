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
      if (!data.user) return;
      router.push(profileList[0].role === "admin" ? "/dashboard" : "/kasir");
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
      } else { setSuccess("Berhasil! Mengalihkan..."); setTimeout(() => { window.location.href = "/dashboard"; }, 1500); }
    } catch { setError("Terjadi kesalahan saat mendaftar."); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all";

  return (
    <div className="min-h-screen bg-[oklch(0.06_0_0)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Radial ambient */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
      />
      {/* Top line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-[340px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <button
            onClick={handleSecretClick}
            className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center transition-all active:scale-95 hover:bg-white/90"
          >
            <IceCream className="h-6 w-6 text-black" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {showRegister ? "Buat Akun" : "ICE HMJ Tekinfo"}
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              {showRegister ? "Daftarkan akun kasir baru" : "Masuk ke sistem kasir"}
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {showRegister ? (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Nama</label>
                <input className={inputClass} type="text" placeholder="Nama lengkap" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Email</label>
                <input className={inputClass} type="email" placeholder="nama@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Password</label>
                <input className={inputClass} type="password" placeholder="Min. 6 karakter" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} />
              </div>

              {error && <p className="text-xs text-red-400/80 border border-red-400/10 bg-red-400/5 rounded-lg p-2.5">{error}</p>}
              {success && <p className="text-xs text-white/60 border border-white/10 bg-white/[0.04] rounded-lg p-2.5">{success}</p>}

              <div className="pt-1 space-y-2">
                <button type="submit" disabled={loading}
                  className="w-full h-10 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Akun"}
                </button>
                <button type="button" onClick={() => setShowRegister(false)}
                  className="w-full text-xs text-white/25 hover:text-white/50 transition-colors py-1">
                  ← Kembali ke halaman masuk
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Nama</label>
                <input className={inputClass} type="text" placeholder="Nama lengkap Anda" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Password</label>
                <input className={inputClass} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {error && <p className="text-xs text-red-400/80 border border-red-400/10 bg-red-400/5 rounded-lg p-2.5">{error}</p>}

              <div className="pt-1">
                <button type="submit" disabled={loading}
                  className="w-full h-10 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-white/15 mt-6">ICE HMJ Tekinfo © 2025</p>
      </div>
    </div>
  );
}
