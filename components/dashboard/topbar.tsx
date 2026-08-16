"use client"

import { useTransition } from "react"
import { useRole } from "@/components/dashboard/role-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { LogOut, Moon, Sun } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { getInitials } from "@/lib/format"
import { signOut } from "@/app/auth/actions"

const PAGE_TITLES: Record<UserRole, string> = {
  client: "Client Dashboard",
  lawyer: "Lawyer Dashboard",
  admin: "Admin Control Panel",
}

export function DashboardTopbar() {
  const { role, currentUser, theme, toggleTheme } = useRole()
  const [isSigningOut, startTransition] = useTransition()

  // Signing out server-side clears the httpOnly auth cookies that the
  // browser client cannot reach.
  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="font-heading text-lg font-semibold">{PAGE_TITLES[role]}</h1>

      <div className="flex items-center gap-3">
        <Badge
          variant={role === "admin" ? "destructive" : role === "lawyer" ? "default" : "secondary"}
          className="hidden text-[10px] uppercase sm:inline-flex"
        >
          {role}
        </Badge>

        <Separator orientation="vertical" className="h-6" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </TooltipTrigger>
          <TooltipContent>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            <LogOut className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Sign out</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{currentUser.name}</span>
        </div>
      </div>
    </header>
  )
}
