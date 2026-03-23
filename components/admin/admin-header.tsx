"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/slots": "Ad Slots",
  "/admin/campaigns": "Campaigns",
  "/admin/banners": "Banners",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
}

export function AdminHeader() {
  const pathname = usePathname()
  
  // Get the base path for breadcrumb
  const basePath = Object.keys(pageTitles).find(
    (path) => pathname === path || (path !== "/admin" && pathname.startsWith(path))
  ) || "/admin"
  
  const pageTitle = pageTitles[basePath] || "Dashboard"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          {basePath !== "/admin" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
