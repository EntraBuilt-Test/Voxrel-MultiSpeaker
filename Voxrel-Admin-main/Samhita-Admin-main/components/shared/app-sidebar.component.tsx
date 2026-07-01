"use client"

import {
  BarChart3,
  ClipboardCheck,
  Cog,
  GalleryVerticalEnd,
  ListTodo,
  Plus,
  UserCircle,
  Users,
} from "lucide-react"
import { useSearchParams, usePathname } from "next/navigation"
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
  const { user } = useUserStore()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const projectIdParam = searchParams.get('projectId')

  // Extract projectId from pathname if available
  // Exclude special routes like 'analytic' from being treated as projectId
  const pathMatch = pathname?.match(/\/projects\/([^/]+)/)?.[1];
  const pathProjectId = pathMatch && pathMatch !== 'analytic' ? pathMatch : null;
  const projectId = projectIdParam || pathProjectId;

  // Use actual user data from store or fallback to sample data
  const userData = user ? {
    name: user.name,
    email: user.email,
    avatar: user.avatar
  } : data.user

  // Build navigation groups
  const navGroups = React.useMemo(() => {
    let groups = [...data.navGroups];

    // When projectId exists, modify Task section and add User section
    if (projectId) {
      // Add User section for project
      const userGroup = {
        title: "User",
        items: [
          {
            title: "Manage Users",
            url: `/projects/${projectId}/users`,
            icon: Users,
          },
          // We can add distinct analytics link if needed, or handle via tabs on the main users page
          // For now, let's keep it simple or align with user request for distinct analytics
          /* {
             title: "User Analytics",
             url: `/projects/${projectId}/users?tab=analytics`,
             icon: TrendingUp
           } */
        ]
      };

      groups = groups.map(group => {
        if (group.title === "Task") {
          return {
            ...group,
            items: group.items.map(item => ({
              ...item,
              url: `${item.url}?projectId=${projectId}`
            }))
          }
        }
        return group
      });

      // Insert User group after Task group
      const taskIndex = groups.findIndex(g => g.title === "Task");
      if (taskIndex !== -1) {
        groups.splice(taskIndex + 1, 0, userGroup);
      } else {
        groups.push(userGroup);
      }

      return groups;
    }

    // When no projectId, show Project section instead of Task section
    return groups.map(group => {
      if (group.title === "Task") {
        // Replace Task section with Project section
        return {
          title: "Project",
          items: [
            {
              title: "Manage Project",
              url: "/projects",
              icon: ListTodo,
            },
            {
              title: "Project Analytics",
              url: "/projects/analytic",
              icon: BarChart3,
            },
          ]
        }
      }
      return group
    })
  }, [projectId])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher product={data.product} />
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
