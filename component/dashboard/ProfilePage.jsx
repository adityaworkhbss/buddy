"use client";

import { useState, useEffect } from "react";
import { 
    User, Edit2, MapPin, Calendar, Phone, Mail, 
    Building2, GraduationCap, Home, Heart, 
    Coffee, Moon, Cigarette, CheckCircle2, X
} from "lucide-react";
import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader } from "@/component/ui/card";
import EditProfile from "@/component/profile/EditProfile";
import { cn } from "@/lib/utils";

export function ProfilePage() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem("userId");
            const phone = localStorage.getItem("userPhone");

            if (!userId && !phone) {
                setError("User not logged in");
                return;
            }

            const url = userId 
                ? `/api/user/profile?userId=${userId}`
                : `/api/user/profile?phone=${phone}`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setProfileData(result.profile);
            } else {
                setError(result.message || "Failed to load profile");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
        });
    };

    const formatYear = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.getFullYear().toString();
    };

    if (isEditMode) {
        return (
            <div className="h-full w-full overflow-auto">
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsEditMode(false);
                            fetchProfileData(); // Refresh data after editing
                        }}
                        className="flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Cancel Editing
                    </Button>
                </div>
                <EditProfile onSave={() => {
                    setIsEditMode(false);
                    fetchProfileData();
                }} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="h-full w-full flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <div className="text-red-500 mb-4">
                            <X className="w-12 h-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Error Loading Profile</h3>
                        <p className="text-gray-600 mb-4">{error || "Profile not found"}</p>
                        <Button onClick={fetchProfileData}>Try Again</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-auto bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Header with Edit Button */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                    <Button
                        onClick={() => setIsEditMode(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                    </Button>
                </div>

                {/* Profile Header Card */}
                <Card className="overflow-hidden border-2 border-purple-200 shadow-lg">
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                                    {profileData.profilePicture ? (
                                        <img
                                            src={profileData.profilePicture}
                                            alt={profileData.fullName || "Profile"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display = "flex";
                                            }}
                                        />
                                    ) : null}
                                    <div className={cn(
                                        "w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400",
                                        profileData.profilePicture && "hidden"
                                    )}>
                                        <User className="w-16 h-16 text-white" />
                                    </div>
                                </div>
                                {profileData.isWhatsappNumber && (
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left text-white">
                                <h2 className="text-3xl font-bold mb-2">
                                    {profileData.fullName || "No Name Set"}
                                </h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90">
                                    {profileData.age && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{profileData.age} years old</span>
                                        </div>
                                    )}
                                    {profileData.gender && (
                                        <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            <span>{profileData.gender}</span>
                                        </div>
                                    )}
                                    {profileData.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            <span>{profileData.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Personal Information */}
                <Card className="shadow-md">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-600" />
                            Personal Information
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                <p className="text-gray-800 font-medium">{profileData.fullName || "Not set"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Age</label>
                                <p className="text-gray-800 font-medium">{profileData.age || "Not set"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Gender</label>
                                <p className="text-gray-800 font-medium">{profileData.gender || "Not set"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Phone</label>
                                <p className="text-gray-800 font-medium">{profileData.phone || "Not set"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lifestyle Preferences */}
                {(profileData.smoking || profileData.drinking || profileData.diet || profileData.sleepSchedule) && (
                    <Card className="shadow-md">
                        <CardHeader className="bg-gradient-to-r from-pink-100 to-red-100">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-pink-600" />
                                Lifestyle Preferences
                            </h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profileData.smoking && (
                                    <div className="flex items-center gap-3">
                                        <Cigarette className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Smoking</label>
                                            <p className="text-gray-800 font-medium">{profileData.smoking}</p>
                                        </div>
                                    </div>
                                )}
                                {profileData.drinking && (
                                    <div className="flex items-center gap-3">
                                        <Coffee className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Drinking</label>
                                            <p className="text-gray-800 font-medium">{profileData.drinking}</p>
                                        </div>
                                    </div>
                                )}
                                {profileData.diet && (
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Diet</label>
                                            <p className="text-gray-800 font-medium">{profileData.diet}</p>
                                        </div>
                                    </div>
                                )}
                                {profileData.sleepSchedule && (
                                    <div className="flex items-center gap-3">
                                        <Moon className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Sleep Schedule</label>
                                            <p className="text-gray-800 font-medium">{profileData.sleepSchedule}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Work Experience */}
                {profileData.workExperiences && profileData.workExperiences.length > 0 && (
                    <Card className="shadow-md">
                        <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                Work Experience
                            </h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {profileData.workExperiences.map((exp, idx) => (
                                    <div key={exp.id || idx} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <h4 className="font-semibold text-gray-800">
                                            {exp.position || exp.experienceTitle || "Position"}
                                        </h4>
                                        <p className="text-gray-600">{exp.company || "Company"}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatYear(exp.from)} - {exp.stillWorking ? "Present" : formatYear(exp.till)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Education */}
                {profileData.educations && profileData.educations.length > 0 && (
                    <Card className="shadow-md">
                        <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-green-600" />
                                Education
                            </h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {profileData.educations.map((edu, idx) => (
                                    <div key={edu.id || idx} className="border-l-4 border-green-500 pl-4 py-2">
                                        <h4 className="font-semibold text-gray-800">
                                            {edu.degree || edu.educationTitle || "Degree"}
                                        </h4>
                                        <p className="text-gray-600">{edu.institution || "Institution"}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatYear(edu.from)} - {edu.stillStudying ? "Present" : formatYear(edu.till)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Housing Details */}
                {profileData.housingDetails && (
                    <Card className="shadow-md">
                        <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Home className="w-5 h-5 text-orange-600" />
                                Housing Preferences
                            </h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profileData.housingDetails.lookingFor && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Looking For</label>
                                        <p className="text-gray-800 font-medium">{profileData.housingDetails.lookingFor}</p>
                                    </div>
                                )}
                                {profileData.housingDetails.preferenceLocation && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Preferred Location</label>
                                            <p className="text-gray-800 font-medium">{profileData.housingDetails.preferenceLocation}</p>
                                        </div>
                                    </div>
                                )}
                                {(profileData.housingDetails.budgetMin || profileData.housingDetails.budgetMax) && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Budget Range</label>
                                        <p className="text-gray-800 font-medium">
                                            ₹{profileData.housingDetails.budgetMin?.toLocaleString() || "0"} - 
                                            ₹{profileData.housingDetails.budgetMax?.toLocaleString() || "0"}
                                        </p>
                                    </div>
                                )}
                                {profileData.housingDetails.roomType && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Room Type</label>
                                        <p className="text-gray-800 font-medium">{profileData.housingDetails.roomType}</p>
                                    </div>
                                )}
                                {profileData.housingDetails.movingDate && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Moving Date</label>
                                        <p className="text-gray-800 font-medium">{formatDate(profileData.housingDetails.movingDate)}</p>
                                    </div>
                                )}
                                {profileData.housingDetails.preferredAmenities && profileData.housingDetails.preferredAmenities.length > 0 && (
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Preferred Amenities</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {profileData.housingDetails.preferredAmenities.map((amenity, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                                >
                                                    {amenity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State for Missing Data */}
                {!profileData.fullName && !profileData.age && !profileData.gender && 
                 (!profileData.workExperiences || profileData.workExperiences.length === 0) &&
                 (!profileData.educations || profileData.educations.length === 0) && (
                    <Card className="shadow-md">
                        <CardContent className="p-8 text-center">
                            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Profile Incomplete</h3>
                            <p className="text-gray-500 mb-4">Your profile is empty. Click "Edit Profile" to add your information.</p>
                            <Button
                                onClick={() => setIsEditMode(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Complete Your Profile
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
