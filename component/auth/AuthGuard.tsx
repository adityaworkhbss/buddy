"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getClientToken, isTokenExpired } from "@/lib/auth.client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      setChecking(true);

      // Allow profile routes
      const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");
      const publicRoutes = ["/login", "/signup", "/debug-auth"];

      if (isProfileRoute || publicRoutes.includes(pathname)) {
        if (mounted) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      const token = getClientToken();
      const expired = !token || isTokenExpired(token);

      if (!expired) {
        // valid client token
        if (mounted) {
          setAllowed(true);
          setChecking(false);
        }
        // If on root or login, redirect to dashboard
        if (pathname === "/" || pathname === "/login") {
          router.replace("/dashboard");
        }
        return;
      }

      // Fallback: try server-side check using cookie-based session
      try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        if (res.ok) {
          // server confirms session; allow access
          if (mounted) {
            setAllowed(true);
            setChecking(false);
          }
          // If on root or login, redirect to dashboard
          if (pathname === "/" || pathname === "/login") {
            router.replace("/dashboard");
          }
          return;
        }
      } catch (e) {
        console.error("AuthGuard server check error:", e);
      }

      // Not authenticated
      if (mounted) {
        setAllowed(false);
        setChecking(false);
      }
      router.replace("/login");
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checking) return null; // or a spinner component
  if (!allowed) return null;

  return <>{children}</>;
}
