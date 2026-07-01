"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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
    // Redirect to Freelancer home page (Available Projects)
    if (product.name === "Freelancer") {
      router.push("/projects/manage")
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
            <img src="/kreativs-ai-logo.jpg" alt="KreativS Logo" className="size-full object-contain" />
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
