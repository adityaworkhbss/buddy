import { Home, MessageCircle, User, HelpCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/component/ui/alert-dialog";

type DashboardView = "home" | "messages" | "profile" | "help";

interface AppSidebarProps {
    activeView: DashboardView;
    onViewChange: (view: DashboardView) => void;
}

const menuItems = [
    { id: "home" as DashboardView, label: "Home", icon: Home },
    { id: "messages" as DashboardView, label: "Messages", icon: MessageCircle },
    { id: "profile" as DashboardView, label: "Profile", icon: User },
    { id: "help" as DashboardView, label: "Help", icon: HelpCircle },
];

export const AppSidebar = ({ activeView, onViewChange }: AppSidebarProps) => {
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const response = await fetch("/api/logout", {
                method: "POST",
            });

            const data = await response.json();

            if (data.success) {
                // Clear any client-side storage
                if (typeof window !== "undefined") {
                    localStorage.clear();
                }
                
                // Redirect to login page
                router.push("/login");
            } else {
                console.error("Logout failed:", data.message);
                // Still redirect to login even if API call fails
                router.push("/login");
            }
        } catch (error) {
            console.error("Logout error:", error);
            // Still redirect to login even if API call fails
            router.push("/login");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <>
            <div className="fixed left-0 top-0 h-screen w-[7%] bg-gray-800 border-r border-gray-700 flex flex-col z-50">
                {/* Logo/Brand at top */}
                <div className="pt-4 pb-4 flex items-center justify-center">
                    <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">N</span>
                    </div>
                </div>
                
                <div className="flex-1">
                    <div className="flex flex-col">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={cn(
                                    "w-full h-16 flex flex-col items-center justify-center gap-1 transition-colors relative",
                                    activeView === item.id
                                        ? "bg-pink-200 text-pink-700 hover:bg-pink-300"
                                        : "text-gray-300 hover:bg-gray-700"
                                )}
                            >
                                {activeView === item.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-600" />
                                )}
                                <item.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pb-4">
                    <button
                        onClick={() => setShowLogoutDialog(true)}
                        className="w-full h-16 flex flex-col items-center justify-center gap-1 text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-xs font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 font-bold">Logout</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            Are you sure you want to logout from your account?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 justify-end">
                        <AlertDialogCancel className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 bg-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                        >
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

