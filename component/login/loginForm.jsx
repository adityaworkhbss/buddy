"use client";

import { useState } from "react";
import { Phone, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { useToast } from "../../hooks/use-toast";

export default function LoginComponent() {
    const router = useRouter();
    const { toast } = useToast();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast({
                    title: "Login Failed",
                    description: data.error,
                    variant: "destructive",
                });
                return;
            }

            const result = await signInWithCustomToken(auth, data.firebaseToken);

            const uid = result.user.uid;
            const idToken = await result.user.getIdToken();
            const refreshToken = result.user.refreshToken;

            console.log("UID:", uid);
            console.log("ID Token:", idToken);
            console.log("Refresh Token:", refreshToken);

            toast({
                title: "Login Successful 🎉",
                description: "Welcome back!",
            });

            router.push("/dashboard");
        } catch (err) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f6f2ff] px-4">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-200">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
                    <p className="text-gray-500 mt-1">
                        Sign in to find your perfect flatmate
                    </p>
                </div>

                {/* Input Fields */}
                <div className="space-y-6">

                    {/* Phone Field */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                            <input
                                type="text"
                                value={phone}
                                maxLength={10}
                                onChange={(e) =>
                                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                                }
                                className="w-full border border-gray-300 bg-gray-50 h-12 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-indigo-400 outline-none"
                                placeholder="Enter 10-digit phone number"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-300 bg-gray-50 h-12 rounded-lg pl-10 pr-10 focus:ring-2 focus:ring-indigo-400 outline-none"
                                placeholder="Enter your password"
                            />

                            {/* Toggle Password */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        <div className="text-right mt-1">
                            <button
                                onClick={() =>
                                    toast({
                                        title: "Reset Link Sent",
                                        description: "Password reset email sent!",
                                    })
                                }
                                className="text-sm text-pink-600 hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-pink-600 to-red-500 hover:opacity-90 text-white rounded-lg font-semibold transition"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    {/* Divider */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-gray-500">OR</span>
                        </div>
                    </div>

                    {/* Signup */}
                    <div className="text-center mt-2">
                        <p className="text-gray-500 text-sm">Don't have an account?</p>
                        <button
                            onClick={() => router.push("/register")}
                            className="w-full h-12 mt-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                        >
                            Create New Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
