"use client";

import { useState } from "react";
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
import { Home, Search, Calendar, MapPin, Camera } from "lucide-react";

const amenitiesList = [
    "WiFi", "Parking", "Gym", "Swimming Pool", "Laundry", "Air Conditioning",
    "Balcony", "Pet Friendly", "Furnished", "Kitchen"
];

export const HousingDetailsStep = ({ data, onUpdate, onNext, onBack }) => {
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

    const isValid =
        data.searchType &&
        data.budget &&
        data.location &&
        data.movingDate;

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
                            <Input
                                type="date"
                                value={data.movingDate}
                                onChange={(e) => handleInputChange("movingDate", e.target.value)}
                            />
                        </div>

                        {/* Location Map */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Preferred Location
                            </Label>

                            <LocationMap
                                location={data.location}
                                radius={data.radius}
                                onLocationChange={(location, coords) =>
                                    onUpdate({ ...data, location, locationCoords: coords })
                                }
                                onRadiusChange={(radius) => handleInputChange("radius", radius)}
                                mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_KEY}
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
                                <Input
                                    type="date"
                                    value={data.flatDetails.availableFrom}
                                    onChange={(e) =>
                                        handleFlatDetailsChange("availableFrom", e.target.value)
                                    }
                                />
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
                    disabled={!isValid}
                    onClick={onNext}
                >
                    Continue to Preferences
                </Button>
            </div>
        </div>
    );
};
