"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Upload, Plus, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

import { OTP } from "../../lib/otpHandler";
import { APP_CONFIG } from "../../config/appConfigs";

const DEFAULT_AVATAR = "/mnt/data/56de427d-b7e3-45bf-a313-a9b94ba25536.png";

export const PersonalInfoStep = ({ data = {}, onUpdate = () => {}, onNext = () => {} }) => {

    const { toast } = useToast();

    // State declarations - must be before useEffect hooks
    const [previewUrl, setPreviewUrl] = useState(
        data.profilePicture ? URL.createObjectURL(data.profilePicture) : DEFAULT_AVATAR
    );
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [otpSentTime, setOtpSentTime] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpValidityRemaining, setOtpValidityRemaining] = useState(0); // Time remaining for OTP validity in seconds
    const [otpError, setOtpError] = useState(null); // Error message to display in modal

    useEffect(() => {
        if (data.whatsappIsPrimary === undefined) onUpdate({ ...data, whatsappIsPrimary: true });
        if (!Array.isArray(data.jobExperiences)) onUpdate({ ...data, jobExperiences: [] });
        if (!Array.isArray(data.educationExperiences)) onUpdate({ ...data, educationExperiences: [] });
    }, []);

    // Countdown timer for resend OTP cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Countdown timer for OTP validity
    const OTP_VALIDITY_SECONDS = APP_CONFIG.OTP_EXPIRY_MINUTES * 60;
    
    useEffect(() => {
        if (!otpSentTime) {
            setOtpValidityRemaining(0);
            return;
        }

        const updateValidity = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - otpSentTime) / 1000);
            const remaining = Math.max(0, OTP_VALIDITY_SECONDS - elapsed);
            setOtpValidityRemaining(remaining);

            // If OTP expired, clear the session but keep otpSentTime for UI display
            if (remaining === 0) {
                setConfirmationResult(null);
            }
        };

        // Update immediately
        updateValidity();

        // Update every second
        const timer = setInterval(updateValidity, 1000);

        return () => clearInterval(timer);
    }, [otpSentTime]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 60 }, (_, i) => (currentYear - i).toString());

    const updateField = (field, value) => onUpdate({ ...data, [field]: value });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        updateField("profilePicture", file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // Helpers for work
    const addJob = () => {
        const newJob = {
            id: Date.now().toString(),
            company: "",
            position: "",
            fromYear: "",
            tillYear: "",
            currentlyWorking: false,
        };
        updateField("jobExperiences", [...data.jobExperiences, newJob]);
    };

    const removeJob = (id) =>
        updateField("jobExperiences", data.jobExperiences.filter((j) => j.id !== id));

    const updateJob = (id, field, value) => {
        updateField(
            "jobExperiences",
            data.jobExperiences.map((j) => (j.id === id ? { ...j, [field]: value } : j))
        );
    };

    // Helpers for education
    const addEdu = () => {
        const newEdu = {
            id: Date.now().toString(),
            institution: "",
            degree: "",
            startYear: "",
            endYear: "",
        };
        updateField("educationExperiences", [...data.educationExperiences, newEdu]);
    };

    const removeEdu = (id) =>
        updateField("educationExperiences", data.educationExperiences.filter((e) => e.id !== id));

    const updateEdu = (id, field, value) => {
        updateField(
            "educationExperiences",
            data.educationExperiences.map((e) =>
                e.id === id ? { ...e, [field]: value } : e
            )
        );
    };

    const isNumberValid = (num) => num && String(num).replace(/\D/g, "").length === 10;

    // Check if existing session is still valid
    const isSessionValid = () => {
        if (!confirmationResult || !confirmationResult.sessionId || !otpSentTime) {
            return false;
        }
        
        const now = Date.now();
        const minutesElapsed = (now - otpSentTime) / 60000;
        return minutesElapsed < APP_CONFIG.OTP_EXPIRY_MINUTES;
    };

    const handleSendOtp = async (forceNew = false) => {
        const cleaned = (data.whatsapp || "").replace(/\D/g, "");

        if (!isNumberValid(cleaned)) {
            toast({
                title: "Invalid number",
                description: "Enter a 10-digit WhatsApp number",
                variant: "destructive",
            });
            return;
        }

        // Check if we have a valid existing session and user didn't force a new one
        if (!forceNew && isSessionValid()) {
            // Reopen modal with existing session
            setOtpModalOpen(true);
            setOtpError(null);
            return;
        }

        setSendingOtp(true);

        try {
            const phone = `+91${cleaned}`;

            // Request new OTP (backend will handle deleting old sessions)
            const session = await OTP.sendOtp(phone);

            // Only clear and set new session state after successful API call
            // This ensures we don't lose the session if API call fails
            setConfirmationResult(session);
            setOtp("");
            setOtpError(null); // Clear any previous errors
            setOtpModalOpen(true);
            setOtpSentTime(Date.now()); // Track when OTP was sent
            setOtpValidityRemaining(0); // Reset validity timer

            toast({
                title: "OTP Sent",
                description: `A code was sent to ${phone}`,
            });
        } catch (err) {
            toast({
                title: "Failed to send OTP",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmationResult) {
            setOtpError("No OTP session. Please request OTP again.");
            return;
        }

        if (!confirmationResult.sessionId) {
            setOtpError("Session ID is missing. Please request a new OTP.");
            return;
        }

        // Clear any previous errors when starting verification
        setOtpError(null);

        if (otpSentTime) {
            const now = Date.now();
            const minutesElapsed = (now - otpSentTime) / 60000;
            if (minutesElapsed > APP_CONFIG.OTP_EXPIRY_MINUTES) {
                setOtpError(`OTP is valid for ${APP_CONFIG.OTP_EXPIRY_MINUTES} minutes only. Please request a new OTP.`);
                setConfirmationResult(null);
                setOtpSentTime(null);
                setOtpValidityRemaining(0);
                return;
            }
        }

        if (!otp.trim()) {
            setOtpError("Please enter the 6-digit code");
            return;
        }

        const otpDigits = otp.replace(/\D/g, "");
        if (otpDigits.length !== 6) {
            setOtpError("Please enter a 6-digit code");
            return;
        }

        // Clear error when user enters valid format
        setOtpError(null);

        setVerifying(true);

        try {
            console.log("sessionId:", confirmationResult?.sessionId);
            console.log("OTP entered:", otpDigits);

            if (!confirmationResult?.sessionId) {
                setOtpError("Session ID is missing. Please request a new OTP.");
                setVerifying(false);
                return;
            }

            const result = await OTP.verifyOtp(confirmationResult, otpDigits);
            
            console.log("Verification result:", result);

            if (!OTP.isFirebase) {
                if (!result || result.success === false || !result.success) {
                    const errorMessage = result?.message || result?.error || "Invalid OTP. Please check and try again.";
                    
                    // Set error message in modal instead of toast
                    setOtpError(errorMessage);
                    setOtp("");
                    setVerifying(false);
                    return;
                }
            } else {
                // Firebase OTP - if it throws, it's handled in catch
                // If it doesn't throw, verification succeeded
            }

            // Create user in backend after successful verification
            try {
                const cleaned = (data.whatsapp || "").replace(/\D/g, "");
                const phone = `+91${cleaned}`;
                
                const signupResponse = await fetch("/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        phone: phone,
                        password: data.password,
                    }),
                });

                const signupResult = await signupResponse.json();

                if (!signupResult.success) {
                    // If user creation fails, show error but don't mark as verified
                    setOtpError(signupResult.message || "Failed to create account. Please try again.");
                    setVerifying(false);
                    return;
                }

                // User created successfully
                updateField("phoneVerified", true);

                // Clear error on success
                setOtpError(null);

                toast({
                    title: "Verified",
                    description: "Phone number verified and account created successfully",
                });

                setOtpModalOpen(false);
                setOtp("");
                setConfirmationResult(null);
                setOtpSentTime(null);
                setOtpValidityRemaining(0);
            } catch (signupErr) {
                // Handle signup errors
                console.error("Error creating user:", signupErr);
                setOtpError(signupErr.message || "Failed to create account. Please try again.");
                setVerifying(false);
                return;
            }
        } catch (err) {
            // Handle network errors, Firebase errors, or other exceptions
            const errorMessage = err.message || err.details?.message || err.code || "An error occurred. Please try again.";
            
            // Set error message in modal instead of toast
            setOtpError(errorMessage);
            setOtp("");
        } finally {
            setVerifying(false);
        }
    };

    // Validate all mandatory fields
    const isValid =
        data.name?.trim() && // Name must be non-empty after trimming
        data.age && // Age must be provided
        Number(data.age) > 0 && // Age must be a valid positive number
        data.gender && // Gender must be selected
        data.phoneVerified === true; // Phone must be verified (explicitly true)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 🔥 BELOW THIS — ZERO CHANGES (keeping your UI EXACT SAME) */}

            {/* Image Upload */}
            <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-accent/30">
                        <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    </div>
                    <label htmlFor="profile-picture" className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                        <Upload className="w-4 h-4 text-primary-foreground" />
                    </label>
                    <input id="profile-picture" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <p className="text-sm text-muted-foreground">Upload your profile picture</p>
            </div>

            <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={data.name || ""} placeholder="Your full name" onChange={(e) => updateField("name", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Age</Label>
                    <Input type="number" value={data.age || ""} placeholder="25" onChange={(e) => updateField("age", e.target.value)} />
                </div>

                <div>
                    <Label>Gender</Label>
                    <RadioGroup value={data.gender || ""} onValueChange={(v) => updateField("gender", v)} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="male" /><Label>Male</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="female" /><Label>Female</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="other" /><Label>Other</Label></div>
                    </RadioGroup>
                </div>
            </div>

            <div className="space-y-2">
                <Label>WhatsApp Number *</Label>
                <div className="flex gap-2">
                    <Input
                        type="tel"
                        placeholder="10-digit Phone number"
                        value={data.whatsapp || ""}
                        onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                            updateField("whatsapp", v);
                            if (data.phoneVerified && v !== data.whatsapp) {
                                updateField("phoneVerified", false);
                            }
                            // Reset OTP state if phone number changes
                            if (v !== data.whatsapp) {
                                setOtpSentTime(null);
                                setConfirmationResult(null);
                            }
                        }}
                        maxLength={10}
                    />

                    <Button 
                        onClick={() => handleSendOtp(false)} 
                        disabled={!isNumberValid(data.whatsapp) || !data.password || sendingOtp || data.phoneVerified}
                    >
                        {data.phoneVerified ? "Verified" : sendingOtp ? "Sending..." : "Verify"}
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                        type="password"
                        placeholder="Enter your password"
                        value={data.password || ""}
                        onChange={(e) => {
                            updateField("password", e.target.value);
                            // Reset verification if password changes
                            if (data.phoneVerified && e.target.value !== data.password) {
                                updateField("phoneVerified", false);
                            }
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <Checkbox checked={data.whatsappIsPrimary ?? true} onCheckedChange={(c) => updateField("whatsappIsPrimary", c)} />
                    <Label className="text-sm text-muted-foreground">
                        This is your WhatsApp number for notifications.
                    </Label>
                </div>
            </div>

            {otpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => {
                        setOtpModalOpen(false);
                        // Don't clear error or session when closing - keep them for when modal reopens
                    }} />
                    <div className="relative bg-white rounded-xl p-5 w-full max-w-sm shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">Enter OTP</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                            Enter the 6-digit code sent to your WhatsApp.
                        </p>
                        {otpValidityRemaining > 0 ? (
                            <p className="text-xs text-muted-foreground mb-3">
                                Valid for: {Math.floor(otpValidityRemaining / 60)}:{String(otpValidityRemaining % 60).padStart(2, '0')}
                            </p>
                        ) : otpSentTime && otpValidityRemaining === 0 ? (
                            <p className="text-xs text-destructive mb-3">
                                OTP has expired. Please request a new one.
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mb-3">
                                Valid for {APP_CONFIG.OTP_EXPIRY_MINUTES} minutes.
                            </p>
                        )}
                        
                        {/* Display error message in modal */}
                        {otpError && (
                            <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                                <p className="text-xs text-destructive">{otpError}</p>
                            </div>
                        )}
                        
                        <Input 
                            placeholder="6-digit code" 
                            value={otp} 
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setOtp(value);
                                // Clear error when user starts typing
                                if (otpError) setOtpError(null);
                            }}
                            maxLength={6}
                            className="text-center text-lg tracking-widest"
                            disabled={otpValidityRemaining === 0 && otpSentTime !== null}
                        />

                        <div className="flex gap-2 mt-4">
                            <Button 
                                onClick={handleVerifyOtp} 
                                className="flex-1" 
                                disabled={verifying || otp.length !== 6 || (otpValidityRemaining === 0 && otpSentTime !== null) || !confirmationResult}
                            >
                                {verifying ? "Verifying..." : "Verify"}
                            </Button>
                            <Button variant="outline" onClick={() => setOtp("")}>Clear</Button>
                        </div>
                        {/* Show Resend OTP button only after OTP expires */}
                        {otpValidityRemaining === 0 && otpSentTime !== null && (
                            <Button 
                                variant="ghost" 
                                className="w-full mt-2 text-sm"
                                onClick={async () => {
                                    setOtp("");
                                    setOtpError(null); // Clear error when resending
                                    await handleSendOtp(true); // Force new OTP when resending
                                }}
                                disabled={sendingOtp}
                            >
                                {sendingOtp ? "Sending..." : "Resend OTP"}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Work Experience</Label>
                    <Button size="sm" variant="outline" onClick={addJob}>
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </div>

                {data.jobExperiences.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No work experience added yet.</div>
                ) : (
                    <div className="space-y-3">
                        {data.jobExperiences.map((job, idx) => (
                            <div key={job.id} className="border rounded-md p-3 space-y-2 bg-accent/30">
                                <div className="flex justify-between items-center">
                                    <div className="font-medium">Experience #{idx + 1}</div>
                                    <Button variant="ghost" size="sm" onClick={() => removeJob(job.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Input placeholder="Company" value={job.company} onChange={(e) => updateJob(job.id, "company", e.target.value)} />
                                <Input placeholder="Position" value={job.position} onChange={(e) => updateJob(job.id, "position", e.target.value)} />

                                <div className="grid grid-cols-3 gap-2">
                                    <select className="rounded-md border px-2 py-2" value={job.fromYear} onChange={(e) => updateJob(job.id, "fromYear", e.target.value)}>
                                        <option value="">From</option>
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>

                                    {!job.currentlyWorking ? (
                                        <select className="rounded-md border px-2 py-2" value={job.tillYear} onChange={(e) => updateJob(job.id, "tillYear", e.target.value)}>
                                            <option value="">Till</option>
                                            {years.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex items-center px-2 py-2">Present</div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={job.currentlyWorking} onChange={(e) => updateJob(job.id, "currentlyWorking", e.target.checked)} />
                                        <Label>Currently working</Label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Education</Label>
                    <Button size="sm" variant="outline" onClick={addEdu}>
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </div>

                {data.educationExperiences.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No education added yet.</div>
                ) : (
                    <div className="space-y-3">
                        {data.educationExperiences.map((edu, idx) => (
                            <div key={edu.id} className="border rounded-md p-3 space-y-2 bg-accent/30">
                                <div className="flex justify-between items-center">
                                    <div className="font-medium">Education #{idx + 1}</div>
                                    <Button variant="ghost" size="sm" onClick={() => removeEdu(edu.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Input placeholder="Institution" value={edu.institution} onChange={(e) => updateEdu(edu.id, "institution", e.target.value)} />
                                <Input placeholder="Degree" value={edu.degree} onChange={(e) => updateEdu(edu.id, "degree", e.target.value)} />

                                <div className="grid grid-cols-2 gap-2">
                                    <select className="rounded-md border px-2 py-2" value={edu.startYear} onChange={(e) => updateEdu(edu.id, "startYear", e.target.value)}>
                                        <option value="">Start Year</option>
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>

                                    <select className="rounded-md border px-2 py-2" value={edu.endYear} onChange={(e) => updateEdu(edu.id, "endYear", e.target.value)}>
                                        <option value="">End Year</option>
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <Label>Smoking</Label>
                <RadioGroup value={data.lifestyle?.smoking || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), smoking: v })} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="smoker" /><Label>Smoker</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="non-smoker" /><Label>Non-smoker</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="okay-with-smokers" /><Label>Okay with smokers</Label></div>
                </RadioGroup>

                <Label>Drinking</Label>
                <RadioGroup value={data.lifestyle?.drinking || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), drinking: v })} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="drinks" /><Label>Drinks</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="social-drinker" /><Label>Social drinker</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="does-not-drink" /><Label>Doesn't drink</Label></div>
                </RadioGroup>

                <Label>Diet</Label>
                <RadioGroup value={data.lifestyle?.diet || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), diet: v })} className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2"><RadioGroupItem value="veg" /><Label>Veg</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="non-veg" /><Label>Non-veg</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="eggetarian" /><Label>Eggetarian</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="vegan" /><Label>Vegan</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="jain" /><Label>Jain</Label></div>
                </RadioGroup>

                <Label>Sleep Schedule</Label>
                <RadioGroup value={data.lifestyle?.sleep || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), sleep: v })} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="early-riser" /><Label>Early riser</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="night-owl" /><Label>Night owl</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="flexible" /><Label>Flexible</Label></div>
                </RadioGroup>
            </div>

            <Button
                onClick={onNext}
                disabled={!isValid}
                className="w-full h-12"
                variant="gradient"
            >
                Continue to Housing Details
            </Button>
        </div>
    );
};

export default PersonalInfoStep;
