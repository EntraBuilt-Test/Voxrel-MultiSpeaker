"use client"

import {
  CheckCircle,
  Clock,
  GalleryVerticalEnd,
  Search,
  User,
  FolderOpen,
  Briefcase,
  FolderCheck
} from "lucide-react"
import { usePathname } from "next/navigation"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// User dashboard navigation data
const data = {
  product: {
    name: "Freelancer",
    logo: GalleryVerticalEnd,
  },
  taskNavGroups: [
    {
      title: "Tasks",
      items: [
        {
          title: "Available Tasks",
          url: "/tasks/available",
          icon: Search,
        },
        {
          title: "My Tasks",
          url: "/tasks/draft",
          icon: Clock,
        },
        {
          title: "Completed",
          url: "/tasks/completed",
          icon: CheckCircle,
        },
      ]
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          url: "/profile",
          icon: User,
        },
      ]
    },
  ],
  projectNavGroups: [
    {
      title: "Projects",
      items: [
        {
          title: "Available Projects",
          url: "/projects/manage",
          icon: FolderOpen,
        },
        {
          title: "My Projects",
          url: "/projects/draft",
          icon: Briefcase,
        },
        {
          title: "Completed Projects",
          url: "/projects/completed",
          icon: FolderCheck,
        },
      ]
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          url: "/profile",
          icon: User,
        },
      ]
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Determine if we are in a project context
  // Project context includes:
  // - /tasks/* routes (global task views)
  // - /projects/* routes EXCEPT /projects/manage (specific project views)
  const isProjectContext =
    pathname?.startsWith("/tasks") ||
    (pathname?.startsWith("/projects") &&
      !pathname?.startsWith("/projects/manage") &&
      !pathname?.startsWith("/projects/draft") &&
      !pathname?.startsWith("/projects/completed") &&
      pathname !== "/projects");

  const navGroups = isProjectContext ? data.taskNavGroups : data.projectNavGroups;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher product={data.product} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
