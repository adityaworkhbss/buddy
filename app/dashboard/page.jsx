import { Suspense } from "react";
import Dashboard from "@/component/dashboard/Dashboard";

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Dashboard />
        </Suspense>
    );
}

