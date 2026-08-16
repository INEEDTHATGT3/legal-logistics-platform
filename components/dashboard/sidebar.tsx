"use client";

import { useRole } from "@/components/dashboard/role-context";
import {
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Settings,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import type { UserRole } from "@/lib/types";

interface NavLink {
  label: string;
  icon: LucideIcon;
  /** Anchors into a section of the single-page dashboard for this role. */
  href: string;
}

const ROLE_LINKS: Record<UserRole, NavLink[]> = {
  client: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/client" },
    { label: "Find Lawyers", icon: Users, href: "/dashboard/client#directory" },
    { label: "My Consultations", icon: Calendar, href: "/dashboard/client#consultations" },
    { label: "Request Delivery", icon: FileText, href: "/dashboard/client#delivery-request" },
    { label: "Track Delivery", icon: Truck, href: "/dashboard/client#tracking" },
  ],
  lawyer: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/lawyer" },
    { label: "My Schedule", icon: Calendar, href: "/dashboard/lawyer#schedule" },
    { label: "Client Notes", icon: BookOpen, href: "/dashboard/lawyer#notes" },
    { label: "Rate Settings", icon: Settings, href: "/dashboard/lawyer#rate" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/admin" },
    { label: "All Deliveries", icon: Package, href: "/dashboard/admin#deliveries" },
  ],
};

export function DashboardSidebar() {
  const { role, currentUser, sidebarCollapsed, toggleSidebar } = useRole();

  const links = ROLE_LINKS[role] ?? [];

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out",
        sidebarCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Branding */}
      <div
        className={cn(
          "flex shrink-0 items-center text-primary",
          sidebarCollapsed ? "justify-center p-4" : "gap-2 p-4"
        )}
      >
        <Scale className="h-6 w-6 shrink-0" />
        {!sidebarCollapsed && (
          <span className="overflow-hidden whitespace-nowrap font-heading text-xl font-semibold tracking-tight text-foreground">
            NyaySetu
          </span>
        )}
      </div>
      <Separator />

      {/* Navigation */}
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto py-4",
          sidebarCollapsed ? "items-center px-2" : "px-3"
        )}
      >
        {links.map((link) => {
          const Icon = link.icon;

          if (sidebarCollapsed) {
            return (
              <Tooltip key={link.label}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      render={<a href={link.href} aria-label={link.label} />}
                    />
                  }
                >
                  <Icon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {link.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Button
              key={link.label}
              variant="ghost"
              size="sm"
              className="w-full justify-start normal-case text-muted-foreground hover:text-foreground"
              render={<a href={link.href} />}
            >
              <Icon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <Separator />
      <div
        className={cn(
          "flex shrink-0",
          sidebarCollapsed ? "justify-center p-2" : "justify-end px-3 py-2"
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-muted-foreground hover:text-foreground"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User profile */}
      <Separator />
      <div
        className={cn(
          "flex shrink-0 items-center",
          sidebarCollapsed ? "justify-center p-3" : "gap-3 p-4"
        )}
      >
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
              }
            />
            <TooltipContent side="right" sideOffset={8}>
              <div className="flex flex-col">
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-[10px] capitalize opacity-70">{role}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                {currentUser.name}
              </span>
              <span className="truncate text-xs capitalize text-muted-foreground">
                {role}
              </span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
