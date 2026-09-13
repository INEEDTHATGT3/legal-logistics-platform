"use client"

import { useState } from "react"
import { useRole } from "@/components/dashboard/role-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Moon, RotateCcw, Sun } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { DEMO_PERSONAS } from "@/lib/demo-data"
import { resetDemo } from "@/lib/demo-store"
import { getInitials } from "@/lib/format"

const PAGE_TITLES: Record<UserRole, string> = {
  client: "Client Dashboard",
  lawyer: "Lawyer Dashboard",
  admin: "Admin Control Panel",
}

const PERSONA_ORDER: UserRole[] = ["client", "lawyer", "admin"]

export function DashboardTopbar() {
  const { role, currentUser, switchPersona, theme, toggleTheme } = useRole()
  const [justReset, setJustReset] = useState(false)

  // Drops every booking, note, and status change made during the last
  // run-through and restores the seeded scenario.
  const handleReset = () => {
    resetDemo()
    setJustReset(true)
    window.setTimeout(() => setJustReset(false), 2000)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate font-heading text-lg font-semibold">
          {PAGE_TITLES[role]}
        </h1>
        <Badge
          variant="outline"
          className="hidden shrink-0 text-[10px] uppercase tracking-wider lg:inline-flex"
        >
          Demo Mode
        </Badge>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* The persona switcher. Each button is a route, so the browser
            back button walks the demo in reverse. */}
        <div
          className="flex items-center rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Switch demo persona"
        >
          {PERSONA_ORDER.map((persona) => (
            <Button
              key={persona}
              variant={persona === role ? "secondary" : "ghost"}
              size="sm"
              onClick={() => switchPersona(persona)}
              aria-current={persona === role ? "true" : undefined}
              className="h-7 px-2 text-xs capitalize sm:px-3"
            >
              {persona}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

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
                onClick={handleReset}
                aria-label="Reset the demo scenario"
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            <RotateCcw className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>
            {justReset ? "Demo reset" : "Reset demo"}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline">
            {DEMO_PERSONAS[role].label}
          </span>
        </div>
      </div>
    </header>
  )
}
