"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Upload, User, Plus, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const DEFAULT_AVATAR = "/mnt/data/56de427d-b7e3-45bf-a313-a9b94ba25536.png";

export const PersonalInfoStep = ({ data = {}, onUpdate = () => {}, onNext = () => {} }) => {
    const { toast } = useToast();

    // Ensure data shape defaults
    useEffect(() => {
        if (data.whatsappIsPrimary === undefined) onUpdate({ ...data, whatsappIsPrimary: true });
        if (!Array.isArray(data.jobExperiences)) onUpdate({ ...data, jobExperiences: data.jobExperiences || [] });
        if (!Array.isArray(data.educationExperiences)) onUpdate({ ...data, educationExperiences: data.educationExperiences || [] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Local UI state
    const [previewUrl, setPreviewUrl] = useState(
        data.profilePicture ? URL.createObjectURL(data.profilePicture) : DEFAULT_AVATAR
    );
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 60 }, (_, i) => (currentYear - i).toString());

    // helpers to update parent data
    const updateField = (field, value) => {
        onUpdate({ ...data, [field]: value });
    };

    // file upload handler
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        updateField("profilePicture", file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // Job helpers
    const addJob = () => {
        const newJob = { id: Date.now().toString(), company: "", position: "", fromYear: "", tillYear: "", currentlyWorking: false };
        updateField("jobExperiences", [...(data.jobExperiences || []), newJob]);
    };
    const removeJob = (id) => updateField("jobExperiences", (data.jobExperiences || []).filter((j) => j.id !== id));
    const updateJob = (id, field, value) => {
        const updated = (data.jobExperiences || []).map((j) => (j.id === id ? { ...j, [field]: value } : j));
        updateField("jobExperiences", updated);
    };

    // Education helpers
    const addEdu = () => {
        const newEdu = { id: Date.now().toString(), institution: "", degree: "", startYear: "", endYear: "" };
        updateField("educationExperiences", [...(data.educationExperiences || []), newEdu]);
    };
    const removeEdu = (id) => updateField("educationExperiences", (data.educationExperiences || []).filter((e) => e.id !== id));
    const updateEdu = (id, field, value) => {
        const updated = (data.educationExperiences || []).map((e) => (e.id === id ? { ...e, [field]: value } : e));
        updateField("educationExperiences", updated);
    };

    // Simple validation
    const isWhatsappValid = (num) => {
        if (!num) return false;
        const cleaned = String(num).replace(/\D/g, "");
        return cleaned.length === 10;
    };

    /* ---------------------------
       OTP flow (calls your backend)
       ---------------------------
       Backend endpoints (examples):
       - POST /api/auth/send-otp   { phone: "+911234567890" } -> { success: true, sessionId: "abc" }
       - POST /api/auth/verify-otp { sessionId, code }        -> { success: true, uid: "uid123", token?: "..." }
       Implement these routes to interact with your SMS/OTP provider or Firebase Admin.
    */

    const handleSendOtp = async () => {
        const cleaned = (data.whatsapp || "").replace(/\D/g, "");
        if (!isWhatsappValid(cleaned)) {
            toast({ title: "Invalid number", description: "Enter a 10-digit WhatsApp number", variant: "destructive" });
            return;
        }

        setSendingOtp(true);
        try {
            const phone = `+91${cleaned}`; // adapt country code if needed
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const json = await res.json();
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || "Failed to send OTP");
            }

            setSessionId(json.sessionId || json.session || null);
            setOtp("");
            setOtpModalOpen(true);
            toast({ title: "OTP sent", description: `A code was sent to ${phone}` });
        } catch (err) {
            console.error("sendOtp", err);
            toast({ title: "Could not send OTP", description: err.message || "Try again later", variant: "destructive" });
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!sessionId) {
            toast({ title: "No session", description: "Please request OTP first", variant: "destructive" });
            return;
        }
        const code = (otp || "").trim();
        if (!code) {
            toast({ title: "Enter OTP", description: "Please enter the received code", variant: "destructive" });
            return;
        }

        setVerifying(true);
        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, code }),
            });
            const json = await res.json();
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || "Invalid code");
            }

            // backend should return a canonical user id (uid) and optionally a token
            updateField("firebaseUid", json.uid || json.userId || null);
            updateField("phoneVerified", true);

            // optionally persist server-side token if provided
            if (json.token) updateField("authToken", json.token);

            toast({ title: "Verified", description: "Phone number verified successfully" });
            setOtpModalOpen(false);
            setOtp("");
            setSessionId(null);
        } catch (err) {
            console.error("verifyOtp", err);
            toast({ title: "Verification failed", description: err.message || "Please retry", variant: "destructive" });
        } finally {
            setVerifying(false);
        }
    };

    // computed validity for Next button
    const isValid =
        data.name &&
        data.age &&
        data.gender &&
        isWhatsappValid(data.whatsapp) &&
        !!data.phoneVerified;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
                <p className="text-muted-foreground">Personal details & lifestyle — used to match you.</p>
            </div>

            {/* Profile upload */}
            <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-accent/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    </div>

                    <label htmlFor="profile-picture" className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors" title="Upload profile">
                        <Upload className="w-4 h-4 text-primary-foreground" />
                    </label>

                    <input id="profile-picture" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                <p className="text-sm text-muted-foreground">Upload your profile picture</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={data.name || ""} placeholder="Your full name" onChange={(e) => updateField("name", e.target.value)} />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Age</Label>
                    <Input type="number" value={data.age || ""} placeholder="25" onChange={(e) => updateField("age", e.target.value)} />
                </div>

                <div>
                    <Label>Gender</Label>
                    <RadioGroup value={data.gender || ""} onValueChange={(v) => updateField("gender", v)} className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="male" id="gender-male" />
                            <Label htmlFor="gender-male">Male</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="female" id="gender-female" />
                            <Label htmlFor="gender-female">Female</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="other" id="gender-other" />
                            <Label htmlFor="gender-other">Other</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            {/* WhatsApp number */}
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
                            if (data.phoneVerified && v !== data.whatsapp) updateField("phoneVerified", false);
                        }}
                        maxLength={10}
                    />

                    <Button onClick={handleSendOtp} disabled={!isWhatsappValid(data.whatsapp) || sendingOtp || data.phoneVerified} variant={data.phoneVerified ? "default" : "outline"}>
                        {data.phoneVerified ? "Verified" : sendingOtp ? "Sending..." : "Verify"}
                    </Button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <Checkbox id="whatsapp-agree" checked={data.whatsappIsPrimary ?? true} onCheckedChange={(c) => updateField("whatsappIsPrimary", c)} />
                    <Label className="text-sm text-muted-foreground" htmlFor="whatsapp-agree">
                        Number provided by you is your WhatsApp number for future notifications.
                    </Label>
                </div>
            </div>

            {/* OTP modal (simple) */}
            {otpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOtpModalOpen(false)} />
                    <div className="relative bg-white rounded-xl p-5 w-full max-w-sm shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">Enter OTP</h3>
                        <Input placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleVerifyOtp} disabled={verifying} className="flex-1">
                                {verifying ? "Verifying..." : "Verify OTP"}
                            </Button>
                            <Button variant="outline" onClick={() => setOtp("")}>
                                Clear
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground mt-3">
                            Didn't receive it? Close and press <strong>Verify</strong> again to resend.
                        </div>
                    </div>
                </div>
            )}

            {/* Work Experience */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Work Experience</Label>
                    <Button size="sm" variant="outline" onClick={addJob}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                    </Button>
                </div>

                {(data.jobExperiences || []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No work experience added yet.</div>
                ) : (
                    <div className="space-y-3">
                        {(data.jobExperiences || []).map((job, idx) => (
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
                                    <select value={job.fromYear || ""} onChange={(e) => updateJob(job.id, "fromYear", e.target.value)} className="rounded-md border px-2 py-2">
                                        <option value="">From</option>
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                    {!job.currentlyWorking ? (
                                        <select value={job.tillYear || ""} onChange={(e) => updateJob(job.id, "tillYear", e.target.value)} className="rounded-md border px-2 py-2">
                                            <option value="">Till</option>
                                            {years.map((y) => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex items-center px-2 py-2">Present</div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <input id={`job-current-${job.id}`} type="checkbox" checked={!!job.currentlyWorking} onChange={(e) => updateJob(job.id, "currentlyWorking", e.target.checked)} className="h-4 w-4" />
                                        <Label htmlFor={`job-current-${job.id}`} className="text-sm">
                                            Currently working
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Education */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Education</Label>
                    <Button size="sm" variant="outline" onClick={addEdu}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                    </Button>
                </div>

                {(data.educationExperiences || []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No education added yet.</div>
                ) : (
                    <div className="space-y-3">
                        {(data.educationExperiences || []).map((edu, idx) => (
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
                                    <select value={edu.startYear || ""} onChange={(e) => updateEdu(edu.id, "startYear", e.target.value)} className="rounded-md border px-2 py-2">
                                        <option value="">Start Year</option>
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                    <select value={edu.endYear || ""} onChange={(e) => updateEdu(edu.id, "endYear", e.target.value)} className="rounded-md border px-2 py-2">
                                        <option value="">End Year</option>
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lifestyle (MVP fields) */}
            <div className="space-y-3">
                <Label>Smoking</Label>
                <RadioGroup value={data.lifestyle?.smoking || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), smoking: v })} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="smoker" id="smoke-smoker" /><Label htmlFor="smoke-smoker">Smoker</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="non-smoker" id="smoke-non" /><Label htmlFor="smoke-non">Non-smoker</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="okay-with-smokers" id="smoke-ok" /><Label htmlFor="smoke-ok">Okay with smokers</Label></div>
                </RadioGroup>

                <Label>Drinking</Label>
                <RadioGroup value={data.lifestyle?.drinking || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), drinking: v })} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="drinks" id="drink-drinks" /><Label htmlFor="drink-drinks">Drinks</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="social-drinker" id="drink-social" /><Label htmlFor="drink-social">Social drinker</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="does-not-drink" id="drink-no" /><Label htmlFor="drink-no">Doesn't drink</Label></div>
                </RadioGroup>

                <Label>Diet</Label>
                <RadioGroup value={data.lifestyle?.diet || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), diet: v })} className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2"><RadioGroupItem value="veg" id="diet-veg" /><Label htmlFor="diet-veg">Veg</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="non-veg" id="diet-non" /><Label htmlFor="diet-non">Non-veg</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="eggetarian" id="diet-egg" /><Label htmlFor="diet-egg">Eggetarian</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="vegan" id="diet-vegan" /><Label htmlFor="diet-vegan">Vegan</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="jain" id="diet-jain" /><Label htmlFor="diet-jain">Jain</Label></div>
                </RadioGroup>

                <Label>Sleep schedule</Label>
                <RadioGroup value={data.lifestyle?.sleep || ""} onValueChange={(v) => updateField("lifestyle", { ...(data.lifestyle || {}), sleep: v })} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="early-riser" id="sleep-early" /><Label htmlFor="sleep-early">Early riser</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="night-owl" id="sleep-night" /><Label htmlFor="sleep-night">Night owl</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="flexible" id="sleep-flex" /><Label htmlFor="sleep-flex">Flexible</Label></div>
                </RadioGroup>
            </div>

            {/* Next */}
            <div>
                <Button onClick={onNext} disabled={!isValid} className="w-full h-12" variant="gradient">
                    Continue to Housing Details
                </Button>
            </div>
        </div>
    );
};

export default PersonalInfoStep;
