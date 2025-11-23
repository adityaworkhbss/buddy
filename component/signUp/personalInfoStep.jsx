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

const DEFAULT_AVATAR = "/mnt/data/56de427d-b7e3-45bf-a313-a9b94ba25536.png";

export const PersonalInfoStep = ({ data = {}, onUpdate = () => {}, onNext = () => {} }) => {

    const { toast } = useToast();

    useEffect(() => {
        if (data.whatsappIsPrimary === undefined) onUpdate({ ...data, whatsappIsPrimary: true });
        if (!Array.isArray(data.jobExperiences)) onUpdate({ ...data, jobExperiences: [] });
        if (!Array.isArray(data.educationExperiences)) onUpdate({ ...data, educationExperiences: [] });
    }, []);

    const [previewUrl, setPreviewUrl] = useState(
        data.profilePicture ? URL.createObjectURL(data.profilePicture) : DEFAULT_AVATAR
    );
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [verifying, setVerifying] = useState(false);

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

    const handleSendOtp = async () => {
        const cleaned = (data.whatsapp || "").replace(/\D/g, "");

        if (!isNumberValid(cleaned)) {
            toast({
                title: "Invalid number",
                description: "Enter a 10-digit WhatsApp number",
                variant: "destructive",
            });
            return;
        }

        setSendingOtp(true);

        try {
            const phone = `+91${cleaned}`;

            const session = await OTP.sendOtp(phone); // ❤️ SWITCHED HERE

            setConfirmationResult(session);
            setOtp("");
            setOtpModalOpen(true);

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
            toast({
                title: "No OTP session",
                description: "Please request OTP again",
                variant: "destructive",
            });
            return;
        }

        if (!otp.trim()) {
            toast({
                title: "Enter OTP",
                description: "Please enter the 6-digit code",
                variant: "destructive",
            });
            return;
        }

        setVerifying(true);

        try {
            const result = await OTP.verifyOtp(confirmationResult, otp);

            if (!OTP.isFirebase) {
                if (!result.success) {
                    toast({
                        title: "Incorrect OTP",
                        description: result.message,
                        variant: "destructive",
                    });
                    setVerifying(false);
                    return;
                }
            }

            updateField("phoneVerified", true);

            toast({
                title: "Verified",
                description: "Phone number verified successfully",
            });

            setOtpModalOpen(false);
            setOtp("");
            setConfirmationResult(null);
        } catch (err) {
            toast({
                title: "Verification failed",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setVerifying(false);
        }
    };

    const isValid =
        data.name &&
        data.age &&
        data.gender &&
        !!data.phoneVerified;

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
                            if (data.phoneVerified && v !== data.whatsapp) updateField("phoneVerified", false);
                        }}
                        maxLength={10}
                    />

                    <Button onClick={handleSendOtp} disabled={!isNumberValid(data.whatsapp) || sendingOtp || data.phoneVerified}>
                        {data.phoneVerified ? "Verified" : sendingOtp ? "Sending..." : "Verify"}
                    </Button>
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
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOtpModalOpen(false)} />
                    <div className="relative bg-white rounded-xl p-5 w-full max-w-sm shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">Enter OTP</h3>
                        <Input placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />

                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleVerifyOtp} className="flex-1" disabled={verifying}>
                                {verifying ? "Verifying..." : "Verify"}
                            </Button>
                            <Button variant="outline" onClick={() => setOtp("")}>Clear</Button>
                        </div>
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
