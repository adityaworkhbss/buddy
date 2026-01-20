"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MediaUpload } from "../ui/media-upload";
import { LocationMap } from "../map/LocationMap";
import { Home, Search, Calendar as CalendarIcon, MapPin, Camera } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";

const amenitiesList = [
    "WiFi", "Parking", "Gym", "Swimming Pool", "Laundry", "Air Conditioning",
    "Balcony", "Pet Friendly", "Furnished", "Kitchen"
];

export const HousingDetailsStep = ({ data, onUpdate, onNext, onBack, personalInfo }) => {
    // Location search state
    const [locationSearchQuery, setLocationSearchQuery] = useState("");
    const [locationSearchResults, setLocationSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_KEY;
    const { toast } = useToast();

    // Update main fields
    const handleInputChange = (field, value) => {
        onUpdate({ ...data, [field]: value });
    };

    // Update flat details object
    const handleFlatDetailsChange = (field, value) => {
        onUpdate({
            ...data,
            flatDetails: { ...data.flatDetails, [field]: value }
        });
    };

    // Update media array
    const handleMediaChange = (mediaFiles) => {
        handleFlatDetailsChange("media", mediaFiles);
    };

    // Toggle amenities for Flat OR Preferences
    const handleAmenityToggle = (amenity, isFlat = false) => {
        if (isFlat) {
            const current = data.flatDetails.amenities || [];
            const updated = current.includes(amenity)
                ? current.filter((a) => a !== amenity)
                : [...current, amenity];

            handleFlatDetailsChange("amenities", updated);
        } else {
            const current = data.amenityPreferences || [];
            const updated = current.includes(amenity)
                ? current.filter((a) => a !== amenity)
                : [...current, amenity];

            handleInputChange("amenityPreferences", updated);
        }
    };

    // Search location using Mapbox Geocoding API
    const searchLocation = useCallback(async (query) => {
        if (!query.trim() || !mapboxToken) {
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
        const coords = place.center; // [lng, lat]
        setLocationSearchQuery(place.place_name);
        setLocationSearchResults([]);
        onUpdate({ ...data, location: place.place_name, locationCoords: coords });
    };

    // Debounce search
    useEffect(() => {
        if (!locationSearchQuery.trim()) {
            setLocationSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            searchLocation(locationSearchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [locationSearchQuery, searchLocation]);

    // Upload files to S3 and get URLs
    const uploadFiles = async (files, type = "media") => {
        if (!files || files.length === 0) return [];

        const uploadedUrls = [];
        
        for (const fileItem of files) {
            // If it's already a URL string, use it
            if (typeof fileItem === "string") {
                uploadedUrls.push(fileItem);
                continue;
            }

            // If it has a file object, upload it
            if (fileItem.file) {
                const fileFormData = new FormData();
                fileFormData.append("file", fileItem.file);
                fileFormData.append("type", type);

                try {
                    const uploadResponse = await fetch("/api/upload", {
                        method: "POST",
                        body: fileFormData,
                    });

                    const contentType = uploadResponse.headers.get("content-type") || "";
                    if (!contentType.includes("application/json")) {
                        const text = await uploadResponse.text();
                        console.error("/api/upload returned non-JSON:", text.slice(0, 1000));
                        toast({ title: "Upload Error", description: "File upload failed. Server returned an unexpected response.", variant: "destructive" });
                        // skip this file but continue with others
                        continue;
                    }

                    const uploadResult = await uploadResponse.json();
                    if (!uploadResponse.ok || !uploadResult.success) {
                        console.error("Upload API error:", uploadResult);
                        toast({ title: "Upload Error", description: uploadResult?.message || "File upload failed.", variant: "destructive" });
                        continue;
                    }

                    if (uploadResult.url) uploadedUrls.push(uploadResult.url);
                } catch (error) {
                    console.error("Error uploading file:", error);
                    toast({ title: "Upload Error", description: "File upload failed. Please try again.", variant: "destructive" });
                    // continue with next file
                }
             }
         }

         return uploadedUrls;
     };

    // Save profile data to database
    const handleSaveProfile = async () => {
        // Check if user has phone number (required for saving)
        if (!personalInfo?.whatsapp) {
            toast({
                title: "Error",
                description: "Phone number is required",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            // Upload profile picture if it's a file
            let profilePictureUrl = personalInfo.profilePicture;
            if (personalInfo.profilePicture && personalInfo.profilePicture instanceof File) {
                const profilePicFormData = new FormData();
                profilePicFormData.append("file", personalInfo.profilePicture);
                profilePicFormData.append("type", "profile");

                const picUploadResponse = await fetch("/api/upload", {
                    method: "POST",
                    body: profilePicFormData,
                });

                const picContentType = picUploadResponse.headers.get("content-type") || "";
                if (!picContentType.includes("application/json")) {
                    const text = await picUploadResponse.text();
                    console.error("/api/upload (profile pic) returned non-JSON:", text.slice(0, 1000));
                    toast({ title: "Upload Error", description: "Profile picture upload failed. Server returned an unexpected response.", variant: "destructive" });
                    throw new Error("Profile picture upload failed: non-JSON response");
                }
                const picUploadResult = await picUploadResponse.json();
                if (!picUploadResponse.ok || !picUploadResult.success) {
                    console.error("Profile pic upload failed:", picUploadResult);
                    toast({ title: "Upload Error", description: picUploadResult?.message || "Profile picture upload failed.", variant: "destructive" });
                    throw new Error(picUploadResult?.message || "Profile picture upload failed");
                }
                if (picUploadResult.url) {
                    profilePictureUrl = picUploadResult.url;
                }
             }

            // Upload media files
            const mediaUrls = await uploadFiles(data.flatDetails?.media || [], "media");

            const formData = new FormData();
            
            // Get phone number
            const cleaned = (personalInfo.whatsapp || "").replace(/\D/g, "");
            const phone = `+91${cleaned}`;
            formData.append("phone", phone);
            
            // Add personal info with uploaded profile picture URL
            const personalInfoToSave = {
                ...personalInfo,
                profilePicture: profilePictureUrl,
                // Include password if it exists (for initial setup)
                password: personalInfo.password || undefined,
            };
            formData.append("personalInfo", JSON.stringify(personalInfoToSave));
            
            // Add housing details with uploaded media URLs
            const housingDetailsToSave = {
                ...data,
                flatDetails: {
                    ...data.flatDetails,
                    media: mediaUrls,
                },
            };

            // Normalize searchType to a consistent set of values: 'both', 'flat', 'flatmate'
            const normalizeSearchType = (val) => {
                if (!val) return 'both';
                const s = String(val).toLowerCase();
                if (s.includes('both')) return 'both';
                if (s.includes('flatmate')) return 'flatmate';
                if (s.includes('flat')) return 'flat';
                return 'both';
            };

            housingDetailsToSave.searchType = normalizeSearchType(data.searchType);

            formData.append("housingDetails", JSON.stringify(housingDetailsToSave));

            const response = await fetch("/api/user/update-profile", {
                method: "PUT",
                body: formData,
            });

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const text = await response.text();
                console.error("/api/user/update-profile returned non-JSON:", text.slice(0, 2000));
                toast({ title: "Server Error", description: "Failed to save profile. Server returned an unexpected response.", variant: "destructive" });
                throw new Error("/api/user/update-profile returned non-JSON response");
            }

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error("Update profile API error:", result);
                toast({ title: "Error", description: result?.message || "Failed to save profile", variant: "destructive" });
                throw new Error(result?.message || "Failed to save profile");
            }

            toast({
                title: "Success",
                description: "Profile updated successfully!",
            });

            // Continue to next step
            if (onNext) {
                onNext();
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Housing Preferences</h2>
                <p className="text-muted-foreground">
                    Help us understand what you're looking for
                </p>
            </div>

            {/* Search Type Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        What are you looking for?
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <RadioGroup
                        value={data.searchType}
                        onValueChange={(value) => handleInputChange("searchType", value)}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50">
                            <RadioGroupItem value="flat" id="flat" />
                            <div className="flex-1">
                                <Label htmlFor="flat" className="font-medium">
                                    Looking for a flat
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    I need a place to live
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50">
                            <RadioGroupItem value="flatmate" id="flatmate" />
                            <div className="flex-1">
                                <Label htmlFor="flatmate" className="font-medium">
                                    Looking for flatmates
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    I have a flat and need roommates
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50">
                            <RadioGroupItem value="both" id="both" />
                            <div className="flex-1">
                                <Label htmlFor="both" className="font-medium">
                                    Open to both
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    I'm flexible with either option
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* FLAT SEEKER SECTION */}
            {(data.searchType === "flat" || data.searchType === "both") && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Flat Preferences
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Budget Slider */}
                        <div className="space-y-4">
                            <Label>Budget Range</Label>

                            <div className="flex justify-between text-sm">
                                ₹{(data.budget[0] / 1000).toFixed(0)}k — ₹
                                {(data.budget[1] / 1000).toFixed(0)}k
                            </div>

                            <Slider
                                min={5000}
                                max={50000}
                                step={1000}
                                value={data.budget}
                                onValueChange={(value) => handleInputChange("budget", value)}
                            />
                        </div>

                        {/* Moving Date */}
                        <div className="space-y-2">
                            <Label>Moving Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {data.movingDate ? (
                                            format(new Date(data.movingDate), "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        selected={data.movingDate ? new Date(data.movingDate) : undefined}
                                        onSelect={(date) => {
                                            handleInputChange("movingDate", date ? date.toISOString().split('T')[0] : "");
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Location Map */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Preferred Location
                            </Label>

                            {/* Location Search Input */}
                            <div className="relative">
                                <Input
                                    placeholder="Search location..."
                                    value={locationSearchQuery}
                                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                                    className="w-full"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {locationSearchResults.length > 0 && (
                                    <div className="absolute z-50 bg-white border rounded-lg w-full mt-1 shadow-lg max-h-60 overflow-y-auto">
                                        {locationSearchResults.map((place) => (
                                            <div
                                                key={place.id}
                                                onClick={() => handleSelectLocation(place)}
                                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            >
                                                {place.place_name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <LocationMap
                                location={data.location}
                                radius={data.radius}
                                onLocationChange={(location, coords) =>
                                    onUpdate({ ...data, location, locationCoords: coords })
                                }
                                onRadiusChange={(radius) => handleInputChange("radius", radius)}
                                mapboxToken={mapboxToken}
                            />
                        </div>

                        {/* Room Type */}
                        <div className="space-y-2">
                            <Label>Room Type</Label>

                            <RadioGroup
                                value={data.roomType}
                                onValueChange={(value) => handleInputChange("roomType", value)}
                                className="flex gap-4"
                            >
                                {["private", "shared", "studio"].map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <RadioGroupItem value={type} id={type} />
                                        <Label htmlFor={type} className="capitalize">
                                            {type}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Amenity Preferences */}
                        <div className="space-y-2">
                            <Label>Preferred Amenities</Label>

                            <div className="grid grid-cols-2 gap-2">
                                {amenitiesList.map((a) => (
                                    <div key={a} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={data.amenityPreferences?.includes(a)}
                                            onCheckedChange={() => handleAmenityToggle(a)}
                                        />
                                        <Label className="text-sm">{a}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* FLAT OWNER SECTION */}
            {(data.searchType === "flatmate" || data.searchType === "both") && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            Your Flat Details
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Flat Address</Label>
                            <Input
                                placeholder="123 Main Street"
                                value={data.flatDetails.address}
                                onChange={(e) =>
                                    handleFlatDetailsChange("address", e.target.value)
                                }
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Rooms Available</Label>
                                <Input
                                    type="number"
                                    value={data.flatDetails.roomsAvailable}
                                    onChange={(e) =>
                                        handleFlatDetailsChange("roomsAvailable", e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Rooms</Label>
                                <Input
                                    type="number"
                                    value={data.flatDetails.totalRooms}
                                    onChange={(e) =>
                                        handleFlatDetailsChange("totalRooms", e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Rent per Room</Label>
                                <Input
                                    value={data.flatDetails.rent}
                                    onChange={(e) => handleFlatDetailsChange("rent", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Available From</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {data.flatDetails.availableFrom ? (
                                                format(new Date(data.flatDetails.availableFrom), "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            selected={data.flatDetails.availableFrom ? new Date(data.flatDetails.availableFrom) : undefined}
                                            onSelect={(date) => {
                                                handleFlatDetailsChange("availableFrom", date ? date.toISOString().split('T')[0] : "");
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Deposit</Label>
                                <Input
                                    value={data.flatDetails.deposit}
                                    onChange={(e) =>
                                        handleFlatDetailsChange("deposit", e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-2">
                            <Label>Available Amenities</Label>

                            <div className="grid grid-cols-2 gap-2">
                                {amenitiesList.map((a) => (
                                    <div key={a} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={data.flatDetails.amenities.includes(a)}
                                            onCheckedChange={() => handleAmenityToggle(a, true)}
                                        />
                                        <Label className="text-sm">{a}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                rows={4}
                                value={data.flatDetails.description}
                                onChange={(e) =>
                                    handleFlatDetailsChange("description", e.target.value)
                                }
                            />
                        </div>

                        {/* Media Upload */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Photos & Videos
                            </Label>

                            <MediaUpload
                                value={data.flatDetails.media}
                                onChange={handleMediaChange}
                                maxFiles={10}
                                acceptedTypes={["image/*", "video/*"]}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    Back
                </Button>

                <Button
                    className="flex-1 h-12"
                    variant="gradient"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                >
                    {isSaving ? "Saving..." : "Continue to Preferences"}
                </Button>
            </div>
        </div>
    );
};
