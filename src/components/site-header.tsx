//import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
//import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Business Dashboard</h1>
        {/* <div className="ml-auto flex items-center gap-2">
          <Button variant="default" asChild size="sm" className="hidden sm:flex bg-red-700 hover:bg-red-900 text-white">
            <Link
              href=""
            >
              LogOut
            </Link>
          </Button>
        </div> */}
      </div>
    </header>
  )
}
