import { useState } from "react";
import { Search, MessageCircle, Scale, History, Menu, X, User, ShoppingBag, Briefcase, FileText, BookOpen, FolderOpen, Crown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Search", url: "/search", icon: Search },
  { title: "Chat", url: "/", icon: MessageCircle },
  { title: "JTL", url: "/jtl", icon: Scale },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingBag },
  { title: "Find/Post Jobs", url: "/jobs", icon: Briefcase },
  { title: "Judge Notes", url: "/judge-notes", icon: FileText },
  { title: "Diary", url: "/diary", icon: BookOpen },
  { title: "Cases", url: "/cases", icon: FolderOpen },
  { title: "Upgrade", url: "/upgrade", icon: Crown },
  { title: "History", url: "/history", icon: History },
];

export function JuristSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (active: boolean) =>
    active
      ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium border-l-2 border-sidebar-primary"
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300`}>
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">JURIST</h1>
                <p className="text-sm text-sidebar-foreground/70">MIND</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="px-2 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClasses(
                        isActive(item.url)
                      )}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Section */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <User className="w-5 h-5" />
              <span className="text-sm">Profile</span>
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}