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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden w-full flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {/* We can add a user dropdown or a theme toggle here later */}
        </header>
        <div className="relative flex-1 w-full bg-background overflow-hidden">
          {/* Subtle background effects for dashboard */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3 animate-pulse-glow"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-chart-1/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10 w-full h-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
