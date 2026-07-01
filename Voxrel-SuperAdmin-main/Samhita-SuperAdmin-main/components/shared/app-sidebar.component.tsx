"use client"

import {
  BarChart3,
  ClipboardCheck,
  Cog,
  FolderKanban,
  GalleryVerticalEnd,
  ListTodo,
  Plus,
  TrendingUp,
  UserCircle,
  Users,
  Trash2,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import * as React from "react"


import { NavMain } from "@/components/shared/nav-main.component"
import { NavUser } from "@/components/shared/nav-user.component"
import { TeamSwitcher } from "@/components/shared/team-switcher.component"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar.ui"
import { useUserStore } from "@/stores"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: undefined,
  },
  product: {
    name: "Admin",
    logo: GalleryVerticalEnd,
  },
  navGroups: [
    {
      title: "Task",
      items: [
        {
          title: "Manage Task",
          url: "/task/manage",
          icon: ListTodo,
        },
        {
          title: "Create Task",
          url: "/task/create",
          icon: Plus,
        },
        {
          title: "Review Task",
          url: "/task/review",
          icon: ClipboardCheck,
        },
        {
          title: "Task Analytics",
          url: "/task/analytic",
          icon: BarChart3,
        },
      ]
    },
    {
      title: "User",
      items: [
        {
          title: "User Management",
          url: "/user/manage",
          icon: Users,
        },
        {
          title: "User Analytics",
          url: "/user/analytic",
          icon: TrendingUp,
        },
      ]
    },
    {
      title: "Settings",
      items: [
        {
          title: "Profile Settings",
          url: "/setting/profile",
          icon: UserCircle,
        },
        {
          title: "Application Settings",
          url: "/setting/application",
          icon: Cog,
        },
      ]
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isSuperAdmin } = useUserStore()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId")

  // Use actual user data from store or fallback to sample data
  const userData = user ? {
    name: user.name,
    email: user.email,
    avatar: user.avatar
  } : data.user

  const superAdminNavGroups = [
    {
      title: "Super Admin",
      items: [
        {
          title: "Projects",
          url: "/super-admin",
          icon: FolderKanban,
        },
        {
          title: "Create Project",
          url: "/super-admin/projects/create",
          icon: Plus,
        },
        {
          title: "Project Analytics",
          url: "/super-admin/analytic",
          icon: BarChart3,
        },
      ]
    },
    {
      title: "User",
      items: [
        {
          title: "User Management",
          url: "/user/manage",
          icon: Users,
        },
      ]
    },
    {
      title: "Settings",
      items: [
        {
          title: "Profile Settings",
          url: "/setting/profile",
          icon: UserCircle,
        },
        {
          title: "Application Settings",
          url: "/setting/application",
          icon: Cog,
        },
      ]
    },
  ]

  // Determine which navigation to show based on role and context
  let navGroups = isSuperAdmin() ? superAdminNavGroups : data.navGroups
  let product = isSuperAdmin() ? { ...data.product, name: "Super Admin" } : data.product

  // If Super Admin is viewing a specific project, show project admin navigation
  if (isSuperAdmin() && projectId) {
    product = { ...data.product, name: "Super Admin" }
    navGroups = [
      {
        title: "Project",
        items: [
          {
            title: "Back to Dashboard",
            url: "/super-admin",
            icon: FolderKanban,
          },
        ]
      },
      {
        title: "Task",
        items: [
          {
            title: "Manage Task",
            url: `/task/manage?projectId=${projectId}`,
            icon: ListTodo,
          },
          {
            title: "Create Task",
            url: `/task/create?projectId=${projectId}`,
            icon: Plus,
          },
          {
            title: "Review Task",
            url: `/task/review?projectId=${projectId}`,
            icon: ClipboardCheck,
          },
          {
            title: "Task Analytics",
            url: `/task/analytic?projectId=${projectId}`,
            icon: BarChart3,
          },
          {
            title: "Trash",
            url: `/task/trash?projectId=${projectId}`,
            icon: Trash2,
          },
        ]
      },
      {
        title: "User",
        items: [
          {
            title: "Manage Users",
            url: `/user/manage?projectId=${projectId}`,
            icon: Users,
          },
        ]
      },
      {
        title: "Settings",
        items: [
          // Keep global settings or project settings? User requested "Profile Settings" and "Application Settings" in image.
          // Assuming these remain global for the Super Admin user themselves.
          {
            title: "Profile Settings",
            url: "/setting/profile",
            icon: UserCircle,
          },
          {
            title: "Application Settings",
            url: "/setting/application",
            icon: Cog,
          },
        ]
      },
    ]
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher product={product} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
