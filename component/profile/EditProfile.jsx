"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
    User, Mail, Phone, Calendar as CalendarIcon, MapPin, Edit2, Save, X, 
    Camera, Upload, Building2, GraduationCap, Home, 
    Heart, Coffee, Moon, Cigarette
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { APP_CONFIG } from "../../config/appConfigs";
import { OTP } from "../../lib/otpHandler";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { safeJson } from "@/lib/safeJson";

export default function EditProfile({ onSave }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState("personal");
    
    // Profile data state
    const [profileData, setProfileData] = useState({
        // Personal Info
        fullName: "",
        age: "",
        gender: "",
        phone: "",
        email: "",
        profilePicture: "",
        
        // Lifestyle
        smoking: "",
        drinking: "",
        diet: "",
        sleepSchedule: "",
        
        // Work & Education
        workExperiences: [],
        educationExperiences: [],
        
        // Housing Preferences
        location: "",
        budget: { min: "", max: "" },
        roomType: "",
        movingDate: ""
    });

    const [profilePicturePreview, setProfilePicturePreview] = useState("");
    const [profilePictureFile, setProfilePictureFile] = useState(null);

    // Mapbox location search state
    const [locationSearchQuery, setLocationSearchQuery] = useState("");
    const [locationSearchResults, setLocationSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const locationSearchTimeoutRef = useRef(null);
    const locationInputRef = useRef(null);
    const locationDropdownRef = useRef(null);

    // Phone change OTP state
    const [phoneChangeModalOpen, setPhoneChangeModalOpen] = useState(false);
    const [newPhone, setNewPhone] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [otpSentTime, setOtpSentTime] = useState(null);
    const [otpValidityRemaining, setOtpValidityRemaining] = useState(0);
    const [otpError, setOtpError] = useState(null);

    // Fetch user profile data
    useEffect(() => {
        fetchProfileData();
    }, []);

    // Initialize location search query from profile data
    useEffect(() => {
        if (profileData.location) {
            setLocationSearchQuery(profileData.location);
        }
    }, [profileData.location]);

    // Mapbox token
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_KEY;

    // Search location using Mapbox Geocoding API
    const searchLocation = useCallback(async (query) => {
        if (!query.trim() || !mapboxToken || !APP_CONFIG.suggestionFromMapbox) {
            setLocationSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                query
            )}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.features) {
                setLocationSearchResults(data.features);
            }
        } catch (error) {
            console.error("Error searching location:", error);
            setLocationSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [mapboxToken]);

    // Handle location selection from search
    const handleSelectLocation = (place) => {
        const locationName = place.place_name;
        setLocationSearchQuery(locationName);
        setLocationSearchResults([]);
        handleInputChange("location", locationName);
    };

    // Debounce search
    useEffect(() => {
        if (locationSearchTimeoutRef.current) {
            clearTimeout(locationSearchTimeoutRef.current);
        }

        if (!locationSearchQuery.trim() || !APP_CONFIG.suggestionFromMapbox) {
            setLocationSearchResults([]);
            return;
        }

        locationSearchTimeoutRef.current = setTimeout(() => {
            searchLocation(locationSearchQuery);
        }, 300);

        return () => {
            if (locationSearchTimeoutRef.current) {
                clearTimeout(locationSearchTimeoutRef.current);
            }
        };
    }, [locationSearchQuery, searchLocation]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                locationDropdownRef.current &&
                !locationDropdownRef.current.contains(event.target) &&
                locationInputRef.current &&
                !locationInputRef.current.contains(event.target)
            ) {
                setLocationSearchResults([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // OTP validity countdown timer
    useEffect(() => {
        if (!otpSentTime || otpValidityRemaining <= 0) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const minutesElapsed = (now - otpSentTime) / 60000;
            const remainingSeconds = Math.max(0, (APP_CONFIG.OTP_EXPIRY_MINUTES * 60) - Math.floor(minutesElapsed * 60));
            setOtpValidityRemaining(remainingSeconds);

            if (remainingSeconds === 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [otpSentTime, otpValidityRemaining]);

    // Phone number validation
    const isNumberValid = (phone) => {
        const cleaned = phone.replace(/\D/g, "");
        return cleaned.length === 10;
    };

    // Send OTP for phone change
    const handleSendOtpForPhoneChange = async (forceNew = false) => {
        const cleaned = newPhone.replace(/\D/g, "");

        if (!isNumberValid(cleaned)) {
            toast({
                title: "Invalid number",
                description: "Enter a 10-digit phone number",
                variant: "destructive",
            });
            return;
        }

        // Check if new phone is same as current
        const currentPhoneCleaned = (profileData.phone || "").replace(/\D/g, "");
        if (cleaned === currentPhoneCleaned) {
            toast({
                title: "Same number",
                description: "New phone number must be different from current number",
                variant: "destructive",
            });
            return;
        }

        // Check if we have a valid existing session and user didn't force a new one
        if (!forceNew && confirmationResult && otpSentTime) {
            const now = Date.now();
            const minutesElapsed = (now - otpSentTime) / 60000;
            if (minutesElapsed < APP_CONFIG.OTP_EXPIRY_MINUTES) {
                setOtpModalOpen(true);
                setOtpError(null);
                return;
            }
        }

        setSendingOtp(true);

        try {
            const phone = `+91${cleaned}`;
            const session = await OTP.sendOtp(phone);

            setConfirmationResult(session);
            setOtp("");
            setOtpError(null);
            setOtpModalOpen(true);
            setOtpSentTime(Date.now());
            setOtpValidityRemaining(APP_CONFIG.OTP_EXPIRY_MINUTES * 60);

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

    // Verify OTP and change phone number
    const handleVerifyOtpAndChangePhone = async () => {
        if (!confirmationResult) {
            setOtpError("No OTP session. Please request OTP again.");
            return;
        }

        if (!confirmationResult.sessionId) {
            setOtpError("Session ID is missing. Please request a new OTP.");
            return;
        }

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

        setOtpError(null);
        setVerifying(true);

        try {
            const result = await OTP.verifyOtp(confirmationResult, otpDigits);

            if (!result || result.success === false || !result.success) {
                const errorMessage = result?.message || result?.error || "Invalid OTP. Please check and try again.";
                setOtpError(errorMessage);
                setOtp("");
                setVerifying(false);
                return;
            }

            // OTP verified, now change phone number
            const userId = localStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found. Please log in again.");
            }

            const cleaned = newPhone.replace(/\D/g, "");
            const phone = `+91${cleaned}`;

            const changePhoneResponse = await fetch("/api/user/change-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    newPhone: phone,
                    sessionId: confirmationResult.sessionId,
                    otp: otpDigits,
                }),
            });

            const changePhoneResult = await changePhoneResponse.json();

            if (!changePhoneResult.success) {
                setOtpError(changePhoneResult.message || "Failed to change phone number. Please try again.");
                setVerifying(false);
                return;
            }

            // Success - update local state and close modals
            handleInputChange("phone", phone);
            setOtpError(null);
            setOtpModalOpen(false);
            setPhoneChangeModalOpen(false);
            setNewPhone("");
            setOtp("");
            setConfirmationResult(null);
            setOtpSentTime(null);
            setOtpValidityRemaining(0);

            toast({
                title: "Success! 🎉",
                description: "Phone number changed successfully.",
            });

            // Refresh profile data
            await fetchProfileData();
        } catch (error) {
            console.error("Error changing phone:", error);
            setOtpError(error.message || "Failed to change phone number. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem("userId");
            const phone = localStorage.getItem("userPhone");

            if (!userId && !phone) {
                setLoading(false);
                return;
            }

            const url = userId 
                ? `/api/user/profile?userId=${userId}`
                : `/api/user/profile?phone=${phone}`;

            const response = await fetch(url);
            const result = await safeJson(response);

            if (result && result.success && result.profile) {
                const profile = result.profile;
                
                // Format work experiences
                const workExps = (profile.workExperiences || []).map(exp => ({
                    id: exp.id?.toString() || Date.now().toString(),
                    company: exp.company || "",
                    position: exp.position || "",
                    fromYear: exp.from ? new Date(exp.from).getFullYear().toString() : "",
                    tillYear: exp.till ? new Date(exp.till).getFullYear().toString() : "",
                    currentlyWorking: exp.stillWorking || false,
                }));

                // Format education experiences
                const educations = (profile.educations || []).map(edu => ({
                    id: edu.id?.toString() || Date.now().toString(),
                    institution: edu.institution || "",
                    degree: edu.degree || "",
                    startYear: edu.from ? new Date(edu.from).getFullYear().toString() : "",
                    endYear: edu.till ? new Date(edu.till).getFullYear().toString() : "",
                    stillStudying: edu.stillStudying || false,
                }));

                setProfileData({
                    fullName: profile.fullName || "",
                    age: profile.age?.toString() || "",
                    gender: profile.gender || "",
                    phone: profile.phone || "",
                    email: "",
                    profilePicture: profile.profilePicture || "",
                    smoking: profile.smoking || "",
                    drinking: profile.drinking || "",
                    diet: profile.diet || "",
                    sleepSchedule: profile.sleepSchedule || "",
                    workExperiences: workExps,
                    educationExperiences: educations,
                    location: profile.housingDetails?.preferenceLocation || "",
                    budget: {
                        min: profile.housingDetails?.budgetMin?.toString() || "",
                        max: profile.housingDetails?.budgetMax?.toString() || "",
                    },
                    roomType: profile.housingDetails?.roomType || "",
                    movingDate: profile.housingDetails?.movingDate 
                        ? new Date(profile.housingDetails.movingDate).toISOString().split('T')[0]
                        : "",
                });

                if (profile.profilePicture) {
                    setProfilePicturePreview(profile.profilePicture);
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setProfileData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePictureFile(file);
            setProfilePicturePreview(URL.createObjectURL(file));
        }
    };

    const addWorkExperience = () => {
        const newExp = {
            id: Date.now().toString(),
            company: "",
            position: "",
            fromYear: "",
            tillYear: "",
            currentlyWorking: false,
        };
        setProfileData(prev => ({
            ...prev,
            workExperiences: [...prev.workExperiences, newExp]
        }));
    };

    const removeWorkExperience = (id) => {
        setProfileData(prev => ({
            ...prev,
            workExperiences: prev.workExperiences.filter(exp => exp.id !== id)
        }));
    };

    const updateWorkExperience = (id, field, value) => {
        setProfileData(prev => ({
            ...prev,
            workExperiences: prev.workExperiences.map(exp =>
                exp.id === id ? { ...exp, [field]: value } : exp
            )
        }));
    };

    const addEducation = () => {
        const newEdu = {
            id: Date.now().toString(),
            institution: "",
            degree: "",
            startYear: "",
            endYear: "",
            stillStudying: false,
        };
        setProfileData(prev => ({
            ...prev,
            educationExperiences: [...prev.educationExperiences, newEdu]
        }));
    };

    const removeEducation = (id) => {
        setProfileData(prev => ({
            ...prev,
            educationExperiences: prev.educationExperiences.filter(edu => edu.id !== id)
        }));
    };

    const updateEducation = (id, field, value) => {
        setProfileData(prev => ({
            ...prev,
            educationExperiences: prev.educationExperiences.map(edu =>
                edu.id === id ? { ...edu, [field]: value } : edu
            )
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Upload profile picture if changed
            let profilePictureUrl = profileData.profilePicture;
            if (profilePictureFile) {
                const formData = new FormData();
                formData.append("file", profilePictureFile);
                formData.append("type", "profile");

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                if (uploadData.success && uploadData.url) {
                    profilePictureUrl = uploadData.url;
                }
            }

            // Prepare form data
            const formData = new FormData();
            const phone = profileData.phone || localStorage.getItem("userPhone") || "";
            formData.append("phone", phone);
            
            const personalInfo = {
                name: profileData.fullName,
                age: profileData.age,
                gender: profileData.gender,
                profilePicture: profilePictureUrl,
                lifestyle: {
                    smoking: profileData.smoking,
                    drinking: profileData.drinking,
                    diet: profileData.diet,
                    sleep: profileData.sleepSchedule
                },
                jobExperiences: profileData.workExperiences,
                educationExperiences: profileData.educationExperiences
            };

            const housingDetails = {
                location: profileData.location,
                budget: profileData.budget.min || profileData.budget.max 
                    ? [profileData.budget.min || "0", profileData.budget.max || "0"]
                    : null,
                roomType: profileData.roomType,
                movingDate: profileData.movingDate || null,
            };

            formData.append("personalInfo", JSON.stringify(personalInfo));
            formData.append("housingDetails", JSON.stringify(housingDetails));

            const response = await fetch("/api/user/update-profile", {
                method: "PUT",
                body: formData,
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to update profile");
            }

            toast({
                title: "Success! 🎉",
                description: "Your profile has been updated successfully.",
            });

            // Call onSave callback if provided
            if (onSave) {
                onSave();
            }

        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const sections = [
        { id: "personal", label: "Personal Info", icon: User },
        { id: "lifestyle", label: "Lifestyle", icon: Heart },
        { id: "work", label: "Work & Education", icon: Building2 },
        { id: "housing", label: "Housing", icon: Home },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-900">Loading profile data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pink-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
                            <p className="text-gray-500 mt-1">Update your profile information</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 active:scale-95 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`px-4 py-3 flex items-center gap-2 font-medium transition-all border-b-2 whitespace-nowrap ${
                                        activeSection === section.id
                                            ? "border-pink-600 text-pink-600 bg-pink-50/50"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Personal Info Section */}
                    {activeSection === "personal" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
                            
                            {/* Profile Picture */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-200 bg-gray-100">
                                        {profilePicturePreview || profileData.profilePicture ? (
                                            <img 
                                                src={profilePicturePreview || profileData.profilePicture} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
                                                <User className="w-12 h-12 text-pink-600" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white p-3 rounded-full cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-xl">
                                        <Camera className="w-5 h-5" />
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleProfilePictureChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Click to change profile picture</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.fullName}
                                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        value={profileData.age}
                                        onChange={(e) => handleInputChange("age", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                        placeholder="Enter your age"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        Phone Number
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => handleInputChange("phone", e.target.value)}
                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                            placeholder="Enter phone number"
                                            readOnly
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewPhone("");
                                                setPhoneChangeModalOpen(true);
                                            }}
                                            className="px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 active:scale-95 text-white rounded-lg font-medium transition-all text-sm shadow-md hover:shadow-lg whitespace-nowrap"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gender
                                    </label>
                                    <div className="flex gap-4">
                                        {["Male", "Female", "Other"].map((gender) => (
                                            <label key={gender} className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value={gender}
                                                    checked={profileData.gender === gender}
                                                    onChange={(e) => handleInputChange("gender", e.target.value)}
                                                    className="w-4 h-4 text-pink-600 focus:ring-2 focus:ring-pink-500 border-gray-300"
                                                />
                                                <span className="ml-2 text-gray-700">{gender}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lifestyle Section */}
                    {activeSection === "lifestyle" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Lifestyle Preferences</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Cigarette className="w-4 h-4" />
                                        Smoking
                                    </label>
                                    <select
                                        value={profileData.smoking}
                                        onChange={(e) => handleInputChange("smoking", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                    >
                                        <option value="">Select preference</option>
                                        <option value="Never">Never</option>
                                        <option value="Occasionally">Occasionally</option>
                                        <option value="Regularly">Regularly</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Coffee className="w-4 h-4" />
                                        Drinking
                                    </label>
                                    <select
                                        value={profileData.drinking}
                                        onChange={(e) => handleInputChange("drinking", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                    >
                                        <option value="">Select preference</option>
                                        <option value="Never">Never</option>
                                        <option value="Occasionally">Occasionally</option>
                                        <option value="Regularly">Regularly</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Diet Preference
                                    </label>
                                    <select
                                        value={profileData.diet}
                                        onChange={(e) => handleInputChange("diet", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                    >
                                        <option value="">Select preference</option>
                                        <option value="Vegetarian">Vegetarian</option>
                                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                                        <option value="Vegan">Vegan</option>
                                        <option value="No Preference">No Preference</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Moon className="w-4 h-4" />
                                        Sleep Schedule
                                    </label>
                                    <select
                                        value={profileData.sleepSchedule}
                                        onChange={(e) => handleInputChange("sleepSchedule", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                    >
                                        <option value="">Select preference</option>
                                        <option value="Early Bird">Early Bird (10 PM - 6 AM)</option>
                                        <option value="Night Owl">Night Owl (12 AM - 8 AM)</option>
                                        <option value="Flexible">Flexible</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Work & Education Section */}
                    {activeSection === "work" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Work & Education</h2>
                            
                            <div className="space-y-8">
                                {/* Work Experience */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-pink-600" />
                                            Work Experience
                                        </h3>
                                        <button 
                                            onClick={addWorkExperience}
                                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                                        >
                                            Add Experience
                                        </button>
                                    </div>

                                    {profileData.workExperiences.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                            <p>No work experience added yet. Click "Add Experience" to add one.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {profileData.workExperiences.map((exp, idx) => (
                                                <div key={exp.id} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-medium text-gray-700">Experience #{idx + 1}</div>
                                                        <button
                                                            onClick={() => removeWorkExperience(exp.id)}
                                                            className="text-pink-600 hover:text-pink-700 text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Company"
                                                            value={exp.company}
                                                            onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Position"
                                                            value={exp.position}
                                                            onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="From Year (e.g., 2020)"
                                                            value={exp.fromYear}
                                                            onChange={(e) => updateWorkExperience(exp.id, "fromYear", e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                        />
                                                        {!exp.currentlyWorking ? (
                                                            <input
                                                                type="text"
                                                                placeholder="Till Year (e.g., 2023)"
                                                                value={exp.tillYear}
                                                                onChange={(e) => updateWorkExperience(exp.id, "tillYear", e.target.value)}
                                                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center px-3 py-2 text-gray-500">Present</div>
                                                        )}
                                                    </div>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={exp.currentlyWorking}
                                                            onChange={(e) => updateWorkExperience(exp.id, "currentlyWorking", e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm text-gray-700">Currently working here</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Education */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-pink-600" />
                                            Education
                                        </h3>
                                        <button 
                                            onClick={addEducation}
                                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                                        >
                                            Add Education
                                        </button>
                                    </div>

                                    {profileData.educationExperiences.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                            <p>No education added yet. Click "Add Education" to add one.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {profileData.educationExperiences.map((edu, idx) => (
                                                <div key={edu.id} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-medium text-gray-700">Education #{idx + 1}</div>
                                                        <button
                                                            onClick={() => removeEducation(edu.id)}
                                                            className="text-pink-600 hover:text-pink-700 text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Institution"
                                                            value={edu.institution}
                                                            onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Degree"
                                                            value={edu.degree}
                                                            onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Start Year (e.g., 2018)"
                                                            value={edu.startYear}
                                                            onChange={(e) => updateEducation(edu.id, "startYear", e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                        />
                                                        {!edu.stillStudying ? (
                                                            <input
                                                                type="text"
                                                                placeholder="End Year (e.g., 2022)"
                                                                value={edu.endYear}
                                                                onChange={(e) => updateEducation(edu.id, "endYear", e.target.value)}
                                                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center px-3 py-2 text-gray-500">Currently studying</div>
                                                        )}
                                                    </div>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={edu.stillStudying}
                                                            onChange={(e) => updateEducation(edu.id, "stillStudying", e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm text-gray-700">Currently studying</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Housing Section */}
                    {activeSection === "housing" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Housing Preferences</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Preferred Location
                                    </label>
                                    <div className="relative">
                                        <input
                                            ref={locationInputRef}
                                            type="text"
                                            value={locationSearchQuery}
                                            onChange={(e) => {
                                                setLocationSearchQuery(e.target.value);
                                                handleInputChange("location", e.target.value);
                                            }}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                            placeholder="Enter preferred location"
                                        />
                                        {isSearching && APP_CONFIG.suggestionFromMapbox && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                        {locationSearchResults.length > 0 && APP_CONFIG.suggestionFromMapbox && (
                                            <div 
                                                ref={locationDropdownRef}
                                                className="absolute z-50 bg-white border rounded-lg w-full mt-1 shadow-lg max-h-60 overflow-y-auto"
                                            >
                                                {locationSearchResults.map((place) => (
                                                    <div
                                                        key={place.id}
                                                        onClick={() => handleSelectLocation(place)}
                                                        className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900">{place.place_name}</div>
                                                        {place.context && place.context.length > 0 && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {place.context.map(ctx => ctx.text).join(", ")}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Room Type
                                    </label>
                                    <select
                                        value={profileData.roomType}
                                        onChange={(e) => handleInputChange("roomType", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                    >
                                        <option value="">Select room type</option>
                                        <option value="Single">Single Room</option>
                                        <option value="Shared">Shared Room</option>
                                        <option value="Studio">Studio</option>
                                        <option value="1BHK">1 BHK</option>
                                        <option value="2BHK">2 BHK</option>
                                        <option value="3BHK+">3 BHK+</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Budget (Min)
                                    </label>
                                    <input
                                        type="number"
                                        value={profileData.budget.min}
                                        onChange={(e) => handleNestedChange("budget", "min", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                        placeholder="Min budget"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Budget (Max)
                                    </label>
                                    <input
                                        type="number"
                                        value={profileData.budget.max}
                                        onChange={(e) => handleNestedChange("budget", "max", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-gray-50 focus:bg-white"
                                        placeholder="Max budget"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preferred Moving Date
                                    </label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal bg-gray-50 hover:bg-white"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {profileData.movingDate ? (
                                                    format(new Date(profileData.movingDate), "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                selected={profileData.movingDate ? new Date(profileData.movingDate) : undefined}
                                                onSelect={(date) => {
                                                    handleInputChange("movingDate", date ? date.toISOString().split('T')[0] : "");
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Phone Change Modal */}
            {phoneChangeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/40" 
                        onClick={() => {
                            setPhoneChangeModalOpen(false);
                            setNewPhone("");
                        }} 
                    />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Change Phone Number</h3>
                            <button
                                onClick={() => {
                                    setPhoneChangeModalOpen(false);
                                    setNewPhone("");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={profileData.phone || ""}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setNewPhone(v);
                                    }}
                                    placeholder="10-digit phone number"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                                    maxLength={10}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setPhoneChangeModalOpen(false);
                                        setNewPhone("");
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSendOtpForPhoneChange(false)}
                                    disabled={!isNumberValid(newPhone) || sendingOtp}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {sendingOtp ? "Sending..." : "Send OTP"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP Verification Modal */}
            {otpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/40" 
                        onClick={() => {
                            // Don't close on backdrop click - user must verify or cancel
                        }} 
                    />
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Enter OTP</h3>
                            <button
                                onClick={() => {
                                    setOtpModalOpen(false);
                                    setOtp("");
                                    setOtpError(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Enter the 6-digit code sent to <strong>+91{newPhone}</strong>
                            </p>
                            {otpValidityRemaining > 0 ? (
                                <p className="text-xs text-gray-500">
                                    Valid for: {Math.floor(otpValidityRemaining / 60)}:{String(otpValidityRemaining % 60).padStart(2, '0')}
                                </p>
                            ) : otpSentTime && otpValidityRemaining === 0 ? (
                                <p className="text-xs text-red-500">
                                    OTP has expired. Please request a new one.
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    Valid for {APP_CONFIG.OTP_EXPIRY_MINUTES} minutes.
                                </p>
                            )}
                            
                            {otpError && (
                                <div className="p-2 bg-white border border-red-200 rounded-md">
                                    <p className="text-xs text-red-600">{otpError}</p>
                                </div>
                            )}
                            
                            <input
                                type="text"
                                placeholder="6-digit code"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setOtp(value);
                                    if (otpError) setOtpError(null);
                                }}
                                maxLength={6}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                                disabled={otpValidityRemaining === 0 && otpSentTime !== null}
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={handleVerifyOtpAndChangePhone}
                                    disabled={verifying || otp.length !== 6 || (otpValidityRemaining === 0 && otpSentTime !== null) || !confirmationResult}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {verifying ? "Verifying..." : "Verify & Change"}
                                </button>
                                <button
                                    onClick={() => setOtp("")}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Clear
                                </button>
                            </div>

                            {otpValidityRemaining === 0 && otpSentTime !== null && (
                                <button
                                    onClick={async () => {
                                        setOtp("");
                                        setOtpError(null);
                                        await handleSendOtpForPhoneChange(true);
                                    }}
                                    disabled={sendingOtp}
                                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                                >
                                    {sendingOtp ? "Sending..." : "Resend OTP"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

