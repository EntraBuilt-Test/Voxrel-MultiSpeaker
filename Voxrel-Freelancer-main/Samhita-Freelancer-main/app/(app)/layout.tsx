"use client";

import { Toaster } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { RouteGuard } from "@/components/route-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteGuard requireActive={true}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-muted">
          <div className="flex flex-1 flex-col gap-4 pt-4 px-4 pb-0">{children}</div>
        </SidebarInset>
        <Toaster 
          position="top-right"
          theme="system"
          richColors
          closeButton
          duration={4000}
          expand={false}
          visibleToasts={1}
          offset={16}
          gap={8}
          toastOptions={{
            className: 'group toast',
            style: {
              animation: 'none', // Let CSS handle animation
            },
          }}
        />
      </SidebarProvider>
    </RouteGuard>
  );
}