"use client";

import * as React from "react";
import { Home, IceCream, ReceiptText, Store, LogOut } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [userName, setUserName] = React.useState("Tamu");
  const [userEmail, setUserEmail] = React.useState("Memuat...");

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      
      const email = authData.user.email || "";
      let name = email.split("@")[0] || "User";

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", authData.user.id)
        .single();
        
      if (profile) {
        if (profile.name) name = profile.name;
        // Use auth email if profile email is somehow absent
      }
      
      setUserName(name);
      setUserEmail(profile?.email || email || "");
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const items = [
    {
      title: "Overview",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Produk Es Krim",
      url: "/dashboard/products",
      icon: IceCream,
    },
    {
      title: "Riwayat Transaksi",
      url: "/dashboard/transactions",
      icon: ReceiptText,
    },
    {
      title: "Buka POS (Kasir)",
      url: "/kasir",
      icon: Store,
    },
  ];

  return (
    <Sidebar className="border-r border-border/50 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="border-b border-border/40 p-6">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-1 text-white shadow-lg animate-pulse-glow">
            <IceCream className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">ICE HMJ Tekinfo</span>
            <span className="text-xs font-medium text-muted-foreground">Sales Monitor</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      className={`h-11 rounded-full transition-all duration-300 ${
                        isActive 
                          ? "bg-primary/10 text-primary font-bold shadow-sm" 
                          : "hover:bg-primary/5 hover:text-primary font-medium text-muted-foreground"
                      }`}
                      render={
                        <a href={item.url} className="flex items-center gap-3 px-3">
                          <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.title}</span>
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
      <SidebarFooter className="border-t border-border/40 p-4 bg-secondary/30">
        <div className="flex items-center justify-between w-full rounded-2xl bg-background/80 p-3 shadow-sm border border-border/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-primary/20 bg-primary/10 overflow-hidden flex items-center justify-center">
              <span className="font-bold text-primary uppercase">{userName.substring(0, 2)}</span>
            </Avatar>
            <div className="flex flex-col text-sm">
              <span className="font-bold text-foreground truncate max-w-[100px]">{userName}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{userEmail}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors flex-shrink-0">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
