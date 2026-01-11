"use client";

import { useState, useEffect } from "react";
import { Phone, Lock, Eye, EyeOff, Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "../../hooks/use-toast";
import { APP_CONFIG } from "../../config/appConfigs";
import { OTP } from "../../lib/otpHandler";

export default function LoginComponent() {
    const router = useRouter();
    const { toast } = useToast();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Forgot Password Modal State
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [resetPhone, setResetPhone] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [otpSentTime, setOtpSentTime] = useState(null);
    const [otpValidityRemaining, setOtpValidityRemaining] = useState(0);
    const [resetError, setResetError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({
        phone: "",
        newPassword: "",
        confirmPassword: "",
        otp: ""
    });

    // OTP Validity Timer
    useEffect(() => {
        if (!otpSentTime) {
            setOtpValidityRemaining(0);
            return;
        }

        const updateValidity = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - otpSentTime) / 1000);
            const remaining = Math.max(0, APP_CONFIG.OTP_EXPIRY_MINUTES * 60 - elapsed);
            setOtpValidityRemaining(remaining);

            if (remaining === 0) {
                setConfirmationResult(null);
            }
        };

        updateValidity();
        const timer = setInterval(updateValidity, 1000);
        return () => clearInterval(timer);
    }, [otpSentTime]);

    // Validate phone number
    const isNumberValid = (num) => num && String(num).replace(/\D/g, "").length === 10;

    // Validate password
    const validatePassword = (pwd) => {
        if (!pwd) return "Password is required";
        if (pwd.length < 6) return "Password must be at least 6 characters";
        return "";
    };

    // Validate confirm password
    const validateConfirmPassword = (pwd, confirm) => {
        if (!confirm) return "Please confirm your password";
        if (pwd !== confirm) return "Passwords do not match";
        return "";
    };

    // Send OTP for password reset
    const handleSendResetOtp = async () => {
        setResetError("");
        setFieldErrors({ phone: "", newPassword: "", confirmPassword: "", otp: "" });

        // Validate phone
        if (!isNumberValid(resetPhone)) {
            setFieldErrors(prev => ({ ...prev, phone: "Please enter a valid 10-digit phone number" }));
            return;
        }

        // Validate passwords
        const pwdError = validatePassword(newPassword);
        if (pwdError) {
            setFieldErrors(prev => ({ ...prev, newPassword: pwdError }));
            return;
        }

        const confirmError = validateConfirmPassword(newPassword, confirmPassword);
        if (confirmError) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
            return;
        }

        setSendingOtp(true);
        try {
            const cleaned = resetPhone.replace(/\D/g, "");
            const phone = `+91${cleaned}`;

            const session = await OTP.sendOtp(phone);
            setConfirmationResult(session);
            setOtpSent(true);
            setOtpSentTime(Date.now());
            setOtpValidityRemaining(APP_CONFIG.OTP_EXPIRY_MINUTES * 60);
            setOtp("");

            toast({
                title: "OTP Sent",
                description: `A code was sent to ${phone}`,
            });
        } catch (err) {
            setResetError(err.message || "Failed to send OTP");
            toast({
                title: "Failed to send OTP",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSendingOtp(false);
        }
    };

    // Verify OTP and reset password
    const handleResetPassword = async () => {
        setResetError("");
        setFieldErrors(prev => ({ ...prev, otp: "" }));

        if (!otp.trim()) {
            setFieldErrors(prev => ({ ...prev, otp: "Please enter the 6-digit code" }));
            return;
        }

        const otpDigits = otp.replace(/\D/g, "");
        if (otpDigits.length !== 6) {
            setFieldErrors(prev => ({ ...prev, otp: "Please enter a 6-digit code" }));
            return;
        }

        setResetting(true);
        try {
            // Verify OTP
            const verifyResult = await OTP.verifyOtp(confirmationResult, otpDigits);
            console.log("OTP verification result:", verifyResult);
            
            if (!verifyResult || verifyResult.success === false) {
                const errorMsg = verifyResult?.message || verifyResult?.error || "Invalid OTP";
                setFieldErrors(prev => ({ ...prev, otp: errorMsg }));
                setResetting(false);
                return;
            }

            // Reset password
            const cleaned = resetPhone.replace(/\D/g, "");
            const phone = `+91${cleaned}`;

            console.log("Calling reset password API with:", {
                phone,
                hasNewPassword: !!newPassword,
                sessionId: confirmationResult?.sessionId,
                hasOtp: !!otpDigits,
            });

            const resetRes = await fetch("/api/user/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    newPassword,
                    sessionId: confirmationResult?.sessionId,
                    otp: otpDigits,
                }),
            });

            console.log("Reset password API response status:", resetRes.status);

            if (!resetRes.ok) {
                const errorText = await resetRes.text();
                console.error("Reset password API error response:", errorText);
                throw new Error(`API error: ${resetRes.status} - ${errorText}`);
            }

            const resetData = await resetRes.json();
            console.log("Reset password API response data:", resetData);

            if (!resetData.success) {
                setResetError(resetData.message || "Failed to reset password");
                toast({
                    title: "Error",
                    description: resetData.message || "Failed to reset password",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Success",
                description: "Password reset successfully! You can now login with your new password.",
            });

            // Close modal and reset form
            setForgotPasswordOpen(false);
            resetForgotPasswordForm();
        } catch (err) {
            console.error("Reset password error:", err);
            console.error("Error details:", {
                message: err.message,
                stack: err.stack,
                name: err.name,
            });
            setResetError(err.message || "Failed to reset password");
            toast({
                title: "Error",
                description: err.message || "Failed to reset password. Please try again.",
                variant: "destructive",
            });
            setFieldErrors(prev => ({ ...prev, otp: err.message || "Verification failed" }));
        } finally {
            setResetting(false);
        }
    };

    // Reset forgot password form
    const resetForgotPasswordForm = () => {
        setResetPhone("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
        setOtpSent(false);
        setConfirmationResult(null);
        setOtpSentTime(null);
        setOtpValidityRemaining(0);
        setResetError("");
        setFieldErrors({ phone: "", newPassword: "", confirmPassword: "", otp: "" });
    };

    const handleLogin = async () => {
        // Clear previous errors
        setError("");

        if (!phone || phone.length !== 10) {
            const errorMsg = "Please enter a valid 10-digit phone number";
            setError(errorMsg);
            toast({
                title: "Invalid Phone Number",
                description: errorMsg,
                variant: "destructive",
            });
            return;
        }

        if (!password) {
            const errorMsg = "Please enter your password";
            setError(errorMsg);
            toast({
                title: "Password Required",
                description: errorMsg,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg = data.error || "Login failed. Please try again.";
                setError(errorMsg);
                toast({
                    title: "Login Failed",
                    description: errorMsg,
                    variant: "destructive",
                });
                return;
            }

            // Clear any errors on success
            setError("");

            // Store user info in localStorage or session
            if (data.userId) {
                localStorage.setItem("userId", data.userId.toString());
            }
            if (data.uid) {
                localStorage.setItem("uid", data.uid);
            }

            toast({
                title: "Login Successful 🎉",
                description: "Welcome back!",
            });

            // Redirect to dashboard after successful login
            router.push("/dashboard");
        } catch (err) {
            console.error("Login error:", err);
            const errorMsg = err.message || "Login failed. Please try again.";
            setError(errorMsg);
            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };



    return (
        <>
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
                    {/* Error Message Display */}
                    {error && (
                        <div className="bg-white border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

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
                                onChange={(e) => {
                                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                                    // Clear error when user starts typing
                                    if (error) setError("");
                                }}
                                className={`w-full border h-12 rounded-lg pl-10 pr-4 focus:ring-2 outline-none ${
                                    error && error.includes("phone") 
                                        ? "border-red-300 bg-red-50 focus:ring-red-400" 
                                        : "border-gray-300 bg-gray-50 focus:ring-indigo-400"
                                }`}
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
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    // Clear error when user starts typing
                                    if (error) setError("");
                                }}
                                className={`w-full border h-12 rounded-lg pl-10 pr-10 focus:ring-2 outline-none ${
                                    error && (error.includes("password") || error.includes("Password") || error.includes("Invalid"))
                                        ? "border-red-300 bg-red-50 focus:ring-red-400" 
                                        : "border-gray-300 bg-gray-50 focus:ring-indigo-400"
                                }`}
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
                                onClick={() => setForgotPasswordOpen(true)}
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
                            onClick={() => router.push("/signup")}
                            className="w-full h-12 mt-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                        >
                            Create New Account
                        </button>
                    </div>
                </div>
        </div>

        {/* Forgot Password Modal */}
        {forgotPasswordOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Reset Password</h3>
                            <button
                                onClick={() => {
                                    setForgotPasswordOpen(false);
                                    resetForgotPasswordForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* General Error */}
                        {resetError && (
                            <div className="mb-4 p-3 bg-white border border-red-200 text-red-700 rounded-lg text-sm">
                                {resetError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Phone Number */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={resetPhone}
                                        maxLength={10}
                                        onChange={(e) => {
                                            setResetPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                                            setFieldErrors(prev => ({ ...prev, phone: "" }));
                                            setResetError("");
                                        }}
                                        className={`w-full border h-12 rounded-lg pl-10 pr-4 focus:ring-2 outline-none ${
                                            fieldErrors.phone
                                                ? "border-red-300 bg-red-50 focus:ring-red-400"
                                                : "border-gray-300 bg-gray-50 focus:ring-indigo-400"
                                        }`}
                                        placeholder="Enter 10-digit phone number"
                                        disabled={otpSent}
                                    />
                                </div>
                                {fieldErrors.phone && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            setFieldErrors(prev => ({ ...prev, newPassword: "" }));
                                            setResetError("");
                                        }}
                                        className={`w-full border h-12 rounded-lg pl-10 pr-10 focus:ring-2 outline-none ${
                                            fieldErrors.newPassword
                                                ? "border-red-300 bg-red-50 focus:ring-red-400"
                                                : "border-gray-300 bg-gray-50 focus:ring-indigo-400"
                                        }`}
                                        placeholder="Enter new password (min 6 characters)"
                                        disabled={otpSent}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {fieldErrors.newPassword && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.newPassword}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                                            setResetError("");
                                        }}
                                        className={`w-full border h-12 rounded-lg pl-10 pr-10 focus:ring-2 outline-none ${
                                            fieldErrors.confirmPassword
                                                ? "border-red-300 bg-red-50 focus:ring-red-400"
                                                : "border-gray-300 bg-gray-50 focus:ring-indigo-400"
                                        }`}
                                        placeholder="Confirm new password"
                                        disabled={otpSent}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {fieldErrors.confirmPassword && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Send OTP Button (before OTP is sent) */}
                            {!otpSent && (
                                <button
                                    onClick={handleSendResetOtp}
                                    disabled={sendingOtp}
                                    className="w-full h-12 bg-gradient-to-r from-pink-600 to-red-500 hover:opacity-90 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                >
                                    {sendingOtp ? "Sending OTP..." : "Send OTP"}
                                </button>
                            )}

                            {/* OTP Input (after OTP is sent) */}
                            {otpSent && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-1">
                                            Enter OTP
                                        </label>
                                        {otpValidityRemaining > 0 ? (
                                            <p className="text-xs text-gray-500 mb-2">
                                                Valid for: {Math.floor(otpValidityRemaining / 60)}:
                                                {String(otpValidityRemaining % 60).padStart(2, "0")}
                                            </p>
                                        ) : otpSentTime && otpValidityRemaining === 0 ? (
                                            <p className="text-xs text-red-600 mb-2">
                                                OTP has expired. Please request a new one.
                                            </p>
                                        ) : null}
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                setOtp(value);
                                                setFieldErrors(prev => ({ ...prev, otp: "" }));
                                                setResetError("");
                                            }}
                                            maxLength={6}
                                            className={`w-full border h-12 rounded-lg px-4 text-center text-lg tracking-widest focus:ring-2 outline-none ${
                                                fieldErrors.otp
                                                    ? "border-red-300 bg-red-50 focus:ring-red-400"
                                                    : "border-gray-300 bg-gray-50 focus:ring-indigo-400"
                                            }`}
                                            placeholder="6-digit code"
                                            disabled={otpValidityRemaining === 0 && otpSentTime !== null}
                                        />
                                        {fieldErrors.otp && (
                                            <p className="text-xs text-red-600 mt-1">{fieldErrors.otp}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleResetPassword}
                                        disabled={resetting || otp.length !== 6 || (otpValidityRemaining === 0 && otpSentTime !== null)}
                                        className="w-full h-12 bg-gradient-to-r from-pink-600 to-red-500 hover:opacity-90 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {resetting ? "Resetting Password..." : "Reset Password"}
                                    </button>

                                    {otpValidityRemaining === 0 && otpSentTime !== null && (
                                        <button
                                            onClick={handleSendResetOtp}
                                            disabled={sendingOtp}
                                            className="w-full h-12 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition"
                                        >
                                            {sendingOtp ? "Sending..." : "Resend OTP"}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
