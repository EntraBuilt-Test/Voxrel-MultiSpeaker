"use client"

import { usePathname } from "next/navigation"

interface RouteInfo {
    title: string
    description: string
}

const routeMap: Record<string, RouteInfo> = {
    "/task/create": {
        title: "Create Task",
        description: "Upload audio files and configure transcription task requirements."
    },
    "/task/manage": {
        title: "Manage Tasks",
        description: "View, organize, and track all transcription tasks with filtering, search, and bulk operations."
    },
    "/task/review": {
        title: "Review Tasks",
        description: "Quality control hub for reviewing completed transcriptions, approving work, and providing feedback."
    },
    "/task/analytic": {
        title: "Task Analytics",
        description: "Performance dashboard with completion rates, productivity metrics, and detailed workflow analytics."
    },
    "/user/manage": {
        title: "User Management",
        description: "Administer user accounts, assign roles, manage permissions, and track team performance."
    },
    "/user/analytic": {
        title: "User Analytics",
        description: "Monitor individual and team productivity, performance metrics, and engagement insights."
    },
    "/setting/application": {
        title: "Application Settings",
        description: "Configure system preferences, notifications, integrations, and global platform settings."
    },
    "/setting/profile": {
        title: "Profile Settings",
        description: "Update personal information, change passwords, and customize notification preferences."
    },
}

const defaultRoute: RouteInfo = {
    title: "Dashboard",
    description: "Comprehensive transcription management platform for tasks, users, and workflow optimization."
}

export function DynamicHeader() {
    const pathname = usePathname()
    const routeInfo = routeMap[pathname] || defaultRoute

    return (
        <header className="flex h-20 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16">
            <div className="flex flex-col gap-1 px-4 py-4 w-full">
                <h1 className="text-2xl font-bold tracking-tight">{routeInfo.title}</h1>
                <p className="text-sm text-muted-foreground">{routeInfo.description}</p>
            </div>
        </header>
    )
}
