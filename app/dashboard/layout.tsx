import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AdminGuard } from "./_guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden w-full flex flex-col bg-[oklch(0.06_0_0)]">
        {/* Top bar */}
        <header
          className="sticky top-0 z-50 flex h-14 shrink-0 items-center px-5 border-b border-white/[0.06]"
          style={{ background: "rgba(6,6,6,0.90)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-3 flex-1">
            <SidebarTrigger className="-ml-1 text-white/30 hover:text-white/70 hover:bg-white/[0.05] p-2 rounded-xl transition-all h-9 w-9" />
            <Separator orientation="vertical" className="h-5 bg-white/[0.08] hidden sm:block" />
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-xs text-white/30 hover:text-white/65 transition-colors font-semibold">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-white/15" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs text-white/60 font-bold">
                    Overview
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/40 animate-[dot-pulse_2s_ease-in-out_infinite]" />
            <span className="text-[10px] text-white/20 uppercase tracking-widest hidden sm:block font-semibold">Live</span>
          </div>
        </header>

        {/* Content */}
        <div className="relative flex-1 w-full">
          {/* Subtle ambient */}
          <div
            className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] -translate-y-1/4 translate-x-1/4"
            style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 p-5 lg:p-7">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
    </AdminGuard>
  );
}
