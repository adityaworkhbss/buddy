"use client";

import { useState, useEffect } from "react";
import { 
    ChevronLeft, 
    ChevronRight, 
    SlidersHorizontal, 
    X, 
    Heart, 
    MessageCircle, 
    XCircle,
    MapPin,
    DollarSign,
    Users,
    Home,
    Calendar,
    Star,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader } from "@/component/ui/card";
import { Label } from "@/component/ui/label";
import { Slider } from "@/component/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Checkbox } from "@/component/ui/checkbox";
import { cn } from "@/lib/utils";

export function HomePage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationDirection, setAnimationDirection] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Mock user search type - in real app, this would come from user profile
    const [searchType] = useState("Both");

    // Flatmate filters
    const [flatmateAgeRange, setFlatmateAgeRange] = useState([18, 50]);
    const [flatmateHabits, setFlatmateHabits] = useState([]);

    const habitsList = ["Early Riser", "Night Owl", "Non-Smoker", "Vegetarian", "Pet Friendly", "Party Lover", "Fitness Enthusiast"];

    const handleHabitToggle = (habit) => {
        setFlatmateHabits(prev =>
            prev.includes(habit)
                ? prev.filter(h => h !== habit)
                : [...prev, habit]
        );
    };

    // Flat filters
    const [amenities, setAmenities] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 50000]);
    const [flatPreference, setFlatPreference] = useState("");
    const [flatType, setFlatType] = useState("");
    const [roomType, setRoomType] = useState("");
    const [bathroomType, setBathroomType] = useState("");
    const [brokerage, setBrokerage] = useState("");

    const amenitiesList = ["Wifi", "Parking", "Gym", "Swimming Pool", "Balcony"];

    const handleAmenityToggle = (amenity) => {
        setAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    // Enhanced mock profiles data
    const mockProfiles = [
        { 
            id: 1, 
            name: "Rahul Sharma", 
            age: 28,
            location: "Mumbai, Maharashtra",
            lookingFor: "Looking for Flatmate",
            budget: "₹15,000 - ₹20,000",
            bio: "Software engineer working in IT. Love cooking and reading. Looking for a clean, peaceful flatmate.",
            lifestyle: ["Non-Smoker", "Early Riser", "Vegetarian"],
            verified: true,
            rating: 4.8,
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"
        },
        { 
            id: 2, 
            name: "Priya Patel", 
            age: 26,
            location: "Bangalore, Karnataka",
            lookingFor: "Looking for Flat",
            budget: "₹12,000 - ₹18,000",
            bio: "Marketing professional. Pet lover and fitness enthusiast. Prefer female flatmates.",
            lifestyle: ["Fitness Enthusiast", "Pet Friendly", "Night Owl"],
            verified: true,
            rating: 4.9,
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
        },
        { 
            id: 3, 
            name: "Amit Kumar", 
            age: 30,
            location: "Delhi, NCR",
            lookingFor: "Looking for Flatmate",
            budget: "₹20,000 - ₹25,000",
            bio: "Business analyst. Love traveling and trying new cuisines. Need a flatmate who respects personal space.",
            lifestyle: ["Non-Smoker", "Party Lover"],
            verified: false,
            rating: 4.5,
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit"
        },
    ];

    const handleNext = () => {
        if (isAnimating || currentIndex >= mockProfiles.length - 1) return;
        setIsAnimating(true);
        setAnimationDirection("left");
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
            setIsAnimating(false);
            setAnimationDirection(null);
        }, 300);
    };

    const handlePrevious = () => {
        if (isAnimating || currentIndex <= 0) return;
        setIsAnimating(true);
        setAnimationDirection("right");
        setTimeout(() => {
            setCurrentIndex((prev) => prev - 1);
            setIsAnimating(false);
            setAnimationDirection(null);
        }, 300);
    };

    const handleLike = () => {
        // Handle like action
        console.log("Liked profile:", mockProfiles[currentIndex].id);
        handleNext();
    };

    const handlePass = () => {
        // Handle pass action
        console.log("Passed profile:", mockProfiles[currentIndex].id);
        handleNext();
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === "ArrowRight") {
                handleNext();
            } else if (e.key === "ArrowLeft") {
                handlePrevious();
            } else if (e.key === "l" || e.key === "L") {
                handleLike();
            } else if (e.key === "p" || e.key === "P") {
                handlePass();
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [currentIndex, isAnimating]);

    const currentProfile = mockProfiles[currentIndex];

    return (
        <div className="h-full w-full flex flex-col relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-hidden">
            {/* Header with Filter Button */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center pointer-events-none">
                <Button
                    onClick={() => setIsFilterOpen(true)}
                    className="shadow-lg hover:shadow-xl transition-shadow bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 pointer-events-auto"
                    variant="outline"
                >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                </Button>
                <div className="text-sm font-medium text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                    {currentIndex + 1} of {mockProfiles.length}
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsFilterOpen(false)}
                >
                    <Card 
                        className="max-w-4xl max-h-[90vh] overflow-y-auto w-full shadow-2xl border-0 bg-white animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader className="sticky top-0 bg-white z-10 border-b pb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                                    <SlidersHorizontal className="w-6 h-6 text-purple-600" />
                                    Filters
                                </h2>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setIsFilterOpen(false)}
                                    className="rounded-full hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Looking for Flatmate Filters */}
                                {(searchType === "Looking for Flatmate" || searchType === "Both") && (
                                    <Card className="p-5 border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                                        <h3 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            Looking for Flatmate
                                        </h3>
                                        <div className="space-y-5">
                                            <div className="space-y-3">
                                                <Label className="text-base font-medium">Age Range: {flatmateAgeRange[0]} - {flatmateAgeRange[1]} years</Label>
                                                <Slider
                                                    value={flatmateAgeRange}
                                                    onValueChange={setFlatmateAgeRange}
                                                    min={18}
                                                    max={70}
                                                    step={1}
                                                    className="w-full"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-base font-medium">Lifestyle Preferences</Label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {habitsList.map((habit) => (
                                                        <div key={habit} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                                            <Checkbox
                                                                id={`habit-${habit}`}
                                                                checked={flatmateHabits.includes(habit)}
                                                                onCheckedChange={() => handleHabitToggle(habit)}
                                                            />
                                                            <Label htmlFor={`habit-${habit}`} className="text-sm font-normal cursor-pointer">{habit}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Looking for Flat Filters */}
                                {(searchType === "Looking for Flat" || searchType === "Both") && (
                                    <Card className="p-5 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
                                        <h3 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                            <Home className="w-5 h-5 text-blue-600" />
                                            Looking for Flat
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium">Amenities</Label>
                                                    <div className="space-y-2">
                                                        {amenitiesList.map((amenity) => (
                                                            <div key={amenity} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                                                <Checkbox
                                                                    id={`amenity-${amenity}`}
                                                                    checked={amenities.includes(amenity)}
                                                                    onCheckedChange={() => handleAmenityToggle(amenity)}
                                                                />
                                                                <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal cursor-pointer">{amenity}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium">Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}</Label>
                                                    <Slider
                                                        value={priceRange}
                                                        onValueChange={setPriceRange}
                                                        min={0}
                                                        max={100000}
                                                        step={1000}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium">Flatmate Preference</Label>
                                                    <Select value={flatPreference} onValueChange={setFlatPreference}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select preference" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                            <SelectItem value="any">Any</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium">Flat Type</Label>
                                                    <Select value={flatType} onValueChange={setFlatType}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select flat type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1bhk">1 BHK</SelectItem>
                                                            <SelectItem value="2bhk">2 BHK</SelectItem>
                                                            <SelectItem value="3bhk">3 BHK</SelectItem>
                                                            <SelectItem value="4bhk+">4+ BHK</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium">Room Type</Label>
                                                    <Select value={roomType} onValueChange={setRoomType}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select room type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="private">Private</SelectItem>
                                                            <SelectItem value="shared">Shared</SelectItem>
                                                            <SelectItem value="studio">Studio</SelectItem>
                                                            <SelectItem value="entire">Entire Flat</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium">Bathroom Type</Label>
                                                    <Select value={bathroomType} onValueChange={setBathroomType}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select bathroom type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="attached">Attached</SelectItem>
                                                            <SelectItem value="common">Common</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-base font-medium">Brokerage</Label>
                                                    <Select value={brokerage} onValueChange={setBrokerage}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select preference" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="no">No Brokerage</SelectItem>
                                                            <SelectItem value="yes">Brokerage</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Apply Filters Button */}
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setIsFilterOpen(false)} className="px-6">
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={() => setIsFilterOpen(false)}
                                        className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Profile Cards Section */}
            <div className="flex-1 flex items-center justify-center relative pt-20 pb-24 px-4">
                {/* Left Navigation Button */}
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-white border-2",
                        currentIndex === 0 && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handlePrevious}
                    disabled={currentIndex === 0 || isAnimating}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                {/* Profile Card */}
                <div className="flex-1 max-w-2xl mx-4">
                    {currentProfile && (
                        <div
                            className={cn(
                                "transition-all duration-300 ease-in-out",
                                animationDirection === "left" && "opacity-0 translate-x-full scale-95",
                                animationDirection === "right" && "opacity-0 -translate-x-full scale-95",
                                !animationDirection && "opacity-100 translate-x-0 scale-100"
                            )}
                        >
                            <Card className="overflow-hidden border-2 border-gray-200 shadow-2xl bg-white">
                                {/* Profile Image Section */}
                                <div className="relative h-80 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
                                    <img 
                                        src={currentProfile.image} 
                                        alt={currentProfile.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        {currentProfile.verified && (
                                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Verified
                                            </div>
                                        )}
                                        <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            {currentProfile.rating}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                                            <h2 className="text-2xl font-bold text-gray-800">{currentProfile.name}, {currentProfile.age}</h2>
                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                <MapPin className="w-4 h-4" />
                                                {currentProfile.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-6 space-y-4">
                                    {/* Looking For Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                            {currentProfile.lookingFor}
                                        </span>
                                    </div>

                                    {/* Budget */}
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        <span className="font-semibold">{currentProfile.budget}</span>
                                    </div>

                                    {/* Bio */}
                                    <p className="text-gray-600 leading-relaxed">{currentProfile.bio}</p>

                                    {/* Lifestyle Tags */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {currentProfile.lifestyle.map((item, idx) => (
                                            <span 
                                                key={idx}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Right Navigation Button */}
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-white border-2",
                        currentIndex >= mockProfiles.length - 1 && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleNext}
                    disabled={currentIndex >= mockProfiles.length - 1 || isAnimating}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-4 pointer-events-auto">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePass}
                    className="h-14 w-14 rounded-full bg-white border-2 border-red-200 hover:bg-red-50 hover:border-red-300 shadow-lg hover:shadow-xl transition-all"
                    disabled={isAnimating}
                >
                    <XCircle className="h-6 w-6 text-red-500" />
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLike}
                    className="h-16 w-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all"
                    disabled={isAnimating}
                >
                    <Heart className="h-7 w-7 fill-white" />
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => console.log("Message")}
                    className="h-14 w-14 rounded-full bg-white border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all"
                    disabled={isAnimating}
                >
                    <MessageCircle className="h-6 w-6 text-blue-500" />
                </Button>
            </div>
        </div>
    );
}
