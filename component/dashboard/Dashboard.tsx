"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AppSidebar } from "@/component/dashboard/AppSidebar";
import { HomePage } from "@/component/dashboard/HomePage";
import { MessagePage } from "@/component/dashboard/MessagePage";
import { ProfilePage } from "@/component/dashboard/ProfilePage";
import { HelpPage } from "@/component/dashboard/HelpPage";
import { ProfileCard } from "@/component/profile/ProfileCard";
import { mockProfiles } from "@/data/mockProfiles";
import { Button } from "@/component/ui/button";
import { ArrowLeft, MoreVertical, Bookmark, Flag, Copy, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export type DashboardView = "home" | "messages" | "profile" | "help";

const Dashboard = () => {
    const [activeView, setActiveView] = useState<DashboardView>("home");
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [savedProfileIds, setSavedProfileIds] = useState<string[]>(["1", "3"]);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const profileId = searchParams.get("profile");
    const fromSource = searchParams.get("from");

    const selectedProfile = profileId
        ? mockProfiles.find(p => p.id === profileId)
        : null;

    const isProfileSaved = profileId ? savedProfileIds.includes(profileId) : false;

    const handleSaveProfile = () => {
        if (!profileId) return;
        if (isProfileSaved) {
            setSavedProfileIds(prev => prev.filter(id => id !== profileId));
            toast({ title: "Profile removed from saved" });
        } else {
            setSavedProfileIds(prev => [...prev, profileId]);
            toast({ title: "Profile saved!" });
        }
    };

    const handleReportProfile = () => {
        toast({ title: "Report submitted", description: "Thank you for your feedback." });
    };

    const handleCopyProfile = () => {
        const shareUrl = `${window.location.origin}/profile/${profileId}`;
        navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        toast({ title: "Profile link copied!" });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleBack = () => {
        router.push(pathname);
        if (fromSource === "saved") {
            setActiveView("profile");
        } else {
            setActiveView("messages");
        }
    };

    const getBackLabel = () => {
        if (fromSource === "saved") {
            return "Back to Saved Profiles";
        }
        return "Back to Messages";
    };

    const renderContent = () => {
        // If a profile is selected via query param, show that profile
        if (selectedProfile) {
            return (
                <div className="h-screen flex flex-col p-4">
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {getBackLabel()}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem onClick={handleSaveProfile}>
                                    <Bookmark className={`h-4 w-4 mr-2 ${isProfileSaved ? "fill-current" : ""}`} />
                                    {isProfileSaved ? "Unsave Profile" : "Save Profile"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleReportProfile}>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Report
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopyProfile}>
                                    {isCopied ? (
                                        <Check className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Copy className="h-4 w-4 mr-2" />
                                    )}
                                    {isCopied ? "Copied!" : "Copy Profile"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <ProfileCard profile={selectedProfile} />
                    </div>
                </div>
            );
        }

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

    return (
        <div className="flex min-h-screen w-full bg-white">
            <div className="w-[7%] flex-shrink-0">
                <AppSidebar activeView={activeView} onViewChange={setActiveView} />
            </div>
            <main className="w-[93%] flex-shrink-0 ">
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;
