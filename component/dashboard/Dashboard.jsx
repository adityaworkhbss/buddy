"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/component/ui/sidebar";
import { AppSidebar } from "@/component/sidebar/AppSidebar";
import { HomePage } from "./HomePage";
import { MessagePage } from "./MessagePage";
import { ProfilePage } from "./ProfilePage";
import { HelpPage } from "./HelpPage";
import { sidebarConfig } from "@/config/sidebarConfig";
import { cn } from "@/lib/utils";

const Dashboard = () => {
    const [activeView, setActiveView] = useState("home");

    const renderContent = () => {
        switch (activeView) {
            case "home":
                return <HomePage />;
            case "messages":
                return <MessagePage />;
            case "profile":
                return <ProfilePage />;
            case "help":
                return <HelpPage />;
            default:
                return <HomePage />;
        }
    };

    // Determine layout direction based on sidebar position
    const isVertical = sidebarConfig.position === "left" || sidebarConfig.position === "right";
    const isHorizontal = sidebarConfig.position === "top" || sidebarConfig.position === "bottom";

    return (
        <SidebarProvider>
            <div 
                className={cn(
                    "flex w-screen h-screen overflow-hidden bg-background",
                    isVertical && "flex-row",
                    isHorizontal && "flex-col"
                )}
                style={{
                    maxWidth: "100vw",
                    maxHeight: "100vh",
                }}
            >
                {/* Sidebar Container - Fixed size, no overflow */}
                <div 
                    className={cn(
                        "flex-shrink-0 overflow-hidden border-sidebar-border",
                        sidebarConfig.position === "left" && "order-1 border-r",
                        sidebarConfig.position === "right" && "order-2 border-l",
                        sidebarConfig.position === "top" && "order-1 border-b",
                        sidebarConfig.position === "bottom" && "order-2 border-t"
                    )}
                    style={{
                        width: isVertical ? sidebarConfig.width : "100%",
                        height: isHorizontal ? sidebarConfig.height : "100%",
                        minWidth: isVertical ? sidebarConfig.width : "auto",
                        minHeight: isHorizontal ? sidebarConfig.height : "auto",
                        maxWidth: isVertical ? sidebarConfig.width : "100%",
                        maxHeight: isHorizontal ? sidebarConfig.height : "100%",
                    }}
                >
                    <AppSidebar 
                        activeView={activeView} 
                        onViewChange={setActiveView}
                        position={sidebarConfig.position}
                    />
                </div>

                {/* Main Content Area - Takes remaining space, strict boundaries */}
                <div 
                    className={cn(
                        "flex-1 overflow-hidden min-w-0 min-h-0",
                        sidebarConfig.position === "left" && "order-2",
                        sidebarConfig.position === "right" && "order-1",
                        sidebarConfig.position === "top" && "order-2",
                        sidebarConfig.position === "bottom" && "order-1"
                    )}
                    style={{
                        width: isVertical ? "auto" : "100%",
                        height: isHorizontal ? "auto" : "100%",
                        flexBasis: 0, // Ensures flex-1 works correctly
                    }}
                >
                    <SidebarInset className="h-full w-full overflow-hidden">
                        <div className="h-full w-full overflow-auto">
                            {renderContent()}
                        </div>
                    </SidebarInset>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default Dashboard;
