import { AuthGuard } from "@/components/auth/auth.guard"
import { AppSidebar } from "@/components/shared/app-sidebar.component"
import { DynamicHeader } from "@/components/shared/dynamic-header.component"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar.ui"

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-gray-50 dark:bg-gray-900">
          <DynamicHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
