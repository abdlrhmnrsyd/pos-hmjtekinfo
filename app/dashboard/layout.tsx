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
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden w-full flex flex-col bg-background text-foreground">
        {/* Top bar */}
        <header
          className="sticky top-0 z-50 flex h-14 shrink-0 items-center px-5 border-b border-border/50"
          style={{ background: "var(--background)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-3 flex-1">
            <SidebarTrigger className="-ml-1 text-primary hover:text-primary/70 hover:bg-primary/10 transition-all h-9 w-9 rounded-xl" />
            <Separator orientation="vertical" className="h-5 bg-border/40 hidden sm:block" />
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-xs text-primary/60 hover:text-primary transition-colors font-bold uppercase tracking-widest">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground/20" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs text-primary font-black uppercase tracking-widest">
                    Overview
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/40 animate-[dot-pulse_2s_ease-in-out_infinite]" />
            <span className="text-[10px] text-primary/60 uppercase tracking-widest hidden sm:block font-bold">Live</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="relative flex-1 w-full">
          {/* Subtle ambient */}
          <div
            className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] -translate-y-1/4 translate-x-1/4"
            style={{ background: "radial-gradient(ellipse, var(--border) 0%, transparent 70%)", opacity: 0.05 }}
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
