"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized">("loading");

  useEffect(() => {
    (async () => {
      // Small delay to allow Supabase to re-hydrate from localStorage
      await new Promise(r => setTimeout(r, 300));

      // 1. Cek auth
      let { data: { user } } = await supabase.auth.getUser();
      
      // Fallback: Check if we have cookies but no user in memory (browser restart)
      if (!user) {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(";").shift();
        };

        const access = getCookie("sb-access-token");
        const refresh = getCookie("sb-refresh-token");

        if (access && refresh) {
          try {
            const { data } = await supabase.auth.setSession({
              access_token: access,
              refresh_token: refresh
            });
            user = data?.session?.user ?? null;
          } catch (e) {
            console.error("AdminGuard session restoration failed:", e);
          }
        }
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      // 2. Cek role dari profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.replace("/kasir");
        return;
      }

      setStatus("authorized");
    })();
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border border-border border-t-foreground" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
