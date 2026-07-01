"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import * as React from "react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.ui"

export function TeamSwitcher({
  product,
}: {
  product: {
    name: string
    logo: React.ElementType
  }
}) {
  const router = useRouter()

  if (!product) {
    return null
  }

  const handleClick = () => {
    // Redirect to home page based on role
    if (product.name === "Super Admin") {
      router.push("/super-admin")
    } else if (product.name === "Admin" || product.name === "Project Admin") {
      router.push("/projects")
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          size="lg" 
          className="cursor-pointer hover:bg-sidebar-accent"
          onClick={handleClick}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
            <Image src="/kreativs-ai-logo.jpg" alt="KreativS Logo" width={32} height={32} className="object-contain" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {product.name}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
