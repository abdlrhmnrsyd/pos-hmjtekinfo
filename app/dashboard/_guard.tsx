"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized">("loading");

  useEffect(() => {
    (async () => {
      // 1. Cek auth
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace("/login");
        return;
      }

      // 2. Cek role dari profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profile?.role !== "admin") {
        // Bukan admin → langsung ke kasir
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
