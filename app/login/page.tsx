"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, Lock, Mail, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hidden register state
  const [showRegister, setShowRegister] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);

  const handleSecretClick = () => {
    const newClicks = secretClicks + 1;
    setSecretClicks(newClicks);
    if (newClicks >= 5) {
      setShowRegister(true);
      setSecretClicks(0);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!name) {
        setError("Nama harus diisi.");
        setLoading(false);
        return;
      }

      // Step 1: Find the email associated with this name from public profiles
      const { data: profileList, error: findError } = await supabase
        .from("profiles")
        .select("email, role")
        .ilike("name", name)
        .limit(1);

      if (findError || !profileList || profileList.length === 0 || !profileList[0].email) {
        setError("Nama pengguna tidak ditemukan atau belum disandingkan dengan email (Silakan lapor kontak Admin).");
        setLoading(false);
        return;
      }

      const userEmail = profileList[0].email;

      // Step 2: Sign in with the retrieved email
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (authError) {
        setError("Password salah untuk akun ini.");
        setLoading(false);
        return;
      }

      if (!data.user) return;

      if (profileList[0].role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/kasir");
      }
    } catch {
      setError("Terjadi kesalahan sistem saat login.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Automatically insert email into the profiles table bypass to ensure it maps correctly
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name: name,
          email: email
        });
      }

      if (data.user && data.session === null) {
        setSuccess("Registrasi berhasil! Silakan periksa email Anda (jika wajib konfirmasi).");
      } else {
        setSuccess("Registrasi berhasil! Anda akan dialihkan...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
      
    } catch {
      setError("Terjadi kesalahan sistem saat registrasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-background px-4">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-glow"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-chart-1/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-chart-3/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-glow" style={{ animationDelay: "4s" }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            {/* The icon acts as the secret trigger for Register mode */}
            <div 
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-1 mb-2 shadow-lg cursor-pointer"
              onClick={handleSecretClick}
              title="Double tap for secret mode"
            >
              <span className="text-white text-3xl select-none">🍦</span>
            </div>
            <CardTitle className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">
              {showRegister ? "Admin Register" : "ICE HMJ Tekinfo"}
            </CardTitle>
            <CardDescription className="text-center">
              {showRegister ? "Halaman registrasi tersembunyi" : "Akses sistem menggunakan username/nama Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {showRegister ? (
              /* REGISTER MODE */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nama Pengguna (Username)</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Contoh: Budi"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Autentikasi</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password Baru (min. 6 char)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
                {success && <div className="text-sm font-medium text-green-600 bg-green-500/10 p-3 rounded-md">{success}</div>}

                <div className="flex flex-col gap-2 pt-2">
                  <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : "Buat Akun Baru"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowRegister(false)} className="text-xs">
                    Kembali ke Login
                  </Button>
                </div>
              </form>
            ) : (
              /* NORMAL LOGIN MODE */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-name">Nama Pengguna</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-name"
                      type="text"
                      placeholder="Tuliskan nama Anda"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                  ) : (
                    "Masuk ke Sistem"
                  )}
                </Button>
              </form>
            )}
            
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
