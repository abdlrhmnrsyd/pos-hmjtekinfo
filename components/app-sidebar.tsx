"use client";

import * as React from "react";
import { Home, IceCream, ReceiptText, Store, LogOut, Users, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview",           url: "/dashboard",              icon: Home },
  { title: "Produk Es Krim",     url: "/dashboard/products",     icon: IceCream },
  { title: "Riwayat Transaksi",  url: "/dashboard/transactions", icon: ReceiptText },
  { title: "Daftar Pengguna",    url: "/dashboard/users",        icon: Users },
  { title: "Profil Saya",        url: "/profile",                icon: UserCircle },
  { title: "Buka POS (Kasir)",   url: "/kasir",                  icon: Store },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = React.useState("Tamu");
  const [userEmail, setUserEmail] = React.useState("Memuat...");

  React.useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const email = authData.user.email || "";
      let name = email.split("@")[0] || "User";
      const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", authData.user.id).single();
      if (profile?.name) name = profile.name;
      setUserName(name);
      setUserEmail(profile?.email || email);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "sb-refresh-token=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
  };

  return (
    <Sidebar
      className="border-r border-border bg-sidebar"
    >
      {/* Logo */}
      <SidebarHeader className="px-4 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 border border-border/50">
            <img src="/logo.jpg" alt="ICE HMJ Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-black text-primary tracking-tight leading-none">ICE HMJ</p>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-0.5">Tekinfo</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-4 bg-sidebar flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-black uppercase tracking-[0.25em] text-primary/80 px-2 mb-2">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={`h-10 rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent font-medium"
                      }`}
                      render={
                        <a href={item.url} className="flex items-center gap-3 px-3 w-full">
                          <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-primary-foreground" : "text-primary/40 group-hover:text-primary transition-colors"}`} />
                          <span className={`text-[13px] ${isActive ? "text-primary-foreground" : "text-primary/80 group-hover:text-primary font-bold transition-all"}`}>
                            {item.title}
                          </span>
                        </a>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="border-t border-border/40 p-3">
        <div
          className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 surface"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-xl bg-accent/50 flex items-center justify-center shrink-0 border border-border/50">
              <span className="text-xs font-bold text-muted-foreground/70">{userName.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-[13px] font-semibold text-foreground/75 truncate leading-tight">{userName}</span>
              <span className="text-[10px] text-muted-foreground/40 truncate leading-tight">{userEmail}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-primary/40 hover:text-primary p-1.5 rounded-lg transition-colors hover:bg-primary/[0.08] shrink-0"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
