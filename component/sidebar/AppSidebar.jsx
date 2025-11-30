"use client";

import { Home, MessageSquare, User, HelpCircle } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/component/ui/sidebar";
import { sidebarConfig } from "@/config/sidebarConfig";
import { cn } from "@/lib/utils";

export function AppSidebar({ activeView, onViewChange, position = "left" }) {
    const menuItems = [
        {
            title: "Home",
            icon: Home,
            view: "home",
        },
        {
            title: "Messages",
            icon: MessageSquare,
            view: "messages",
        },
        {
            title: "Profile",
            icon: User,
            view: "profile",
        },
        {
            title: "Help",
            icon: HelpCircle,
            view: "help",
        },
    ];

    // Determine sidebar orientation based on position
    const isVertical = position === "left" || position === "right";
    const isHorizontal = position === "top" || position === "bottom";

    return (
        <div
            className={cn(
                "h-full w-full overflow-hidden",
                "bg-sidebar text-sidebar-foreground"
            )}
            style={{
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
            }}
        >
            <SidebarContent 
                className={cn(
                    "h-full w-full overflow-y-auto overflow-x-hidden",
                    isHorizontal && "flex-row items-center justify-center gap-2 px-4",
                    isVertical && "flex-col"
                )}
            >
                <SidebarGroup className={cn(
                    isHorizontal && "flex-row items-center gap-2 w-full",
                    isVertical && "w-full"
                )}>
                    {!isHorizontal && (
                        <SidebarGroupLabel className="px-2">Navigation</SidebarGroupLabel>
                    )}
                    <SidebarGroupContent className={cn(
                        isHorizontal && "flex-row gap-1 w-full",
                        isHorizontal && "justify-center"
                    )}>
                        <SidebarMenu className={cn(
                            isHorizontal && "flex-row gap-1 w-full",
                            isHorizontal && "justify-center"
                        )}>
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <SidebarMenuItem 
                                        key={item.view} 
                                        className={cn(
                                            isHorizontal && "flex-1"
                                        )}
                                    >
                                        <SidebarMenuButton
                                            onClick={() => onViewChange(item.view)}
                                            isActive={activeView === item.view}
                                            tooltip={isHorizontal ? undefined : item.title}
                                            className={cn(
                                                isHorizontal && "w-full justify-center",
                                                isHorizontal && "h-12"
                                            )}
                                        >
                                            <Icon className={cn(
                                                isHorizontal && "w-5 h-5"
                                            )} />
                                            {isHorizontal && (
                                                <span className="text-xs font-medium">{item.title}</span>
                                            )}
                                            {!isHorizontal && (
                                                <span>{item.title}</span>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </div>
    );
}
