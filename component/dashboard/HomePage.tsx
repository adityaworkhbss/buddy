"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, SlidersHorizontal, Bookmark, MapPin, Home, X, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Textarea } from "@/component/ui/textarea";
import { mockProfiles } from "@/data/mockProfiles";
import { Badge } from "@/component/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/component/ui/dialog";
import { Label } from "@/component/ui/label";
import { Slider } from "@/component/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Checkbox } from "@/component/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { Calendar } from "@/component/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const HomePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInConversation, setIsInConversation] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<Record<string, string>>({});
  
  const profile = mockProfiles[currentIndex];
  const totalProfiles = mockProfiles.length;
  const profileInConversation = isInConversation[profile?.id || ""] || false;
  const currentMessage = message[profile?.id || ""] || `Hey! ${profile?.name}, I'm looking for a place and your listing looks great. Can we talk?`;

  const handleNext = () => {
    if (currentIndex < totalProfiles - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Filter states
  const [flatmateAgeRange, setFlatmateAgeRange] = useState([18, 50]);
  const [flatmateHabits, setFlatmateHabits] = useState<string[]>([]);
  const [flatmateMoveInDate, setFlatmateMoveInDate] = useState<Date>();
  
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [locationRange, setLocationRange] = useState([5]);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [flatType, setFlatType] = useState<string>("");
  const [roomType, setRoomType] = useState<string>("");
  const [availableFrom, setAvailableFrom] = useState<Date>();
  const [brokerage, setBrokerage] = useState<string>("");
  const [securityDeposit, setSecurityDeposit] = useState<string>("");
  const [roomAmenities, setRoomAmenities] = useState<string[]>([]);
  const [commonAreaAmenities, setCommonAreaAmenities] = useState<string[]>([]);

  const habitsListLeft = ["Early Riser", "Vegetarian", "Fitness Enthusiast"];
  const habitsListRight = ["Night Owl", "Pet Friendly", "Non-Smoker", "Party Lover"];
  const roomAmenitiesList = ["AC", "Bed", "Attached Bathroom", "Study Table", "Wardrobe", "Geyser"];
  const commonAreaAmenitiesList = ["Wifi", "Parking", "Swimming Pool", "Balcony", "Kitchen", "Gym", "Laundry", "Security", "Power Backup"];

  const handleHabitToggle = (habit: string) => {
    setFlatmateHabits(prev => 
      prev.includes(habit) 
        ? prev.filter(h => h !== habit)
        : [...prev, habit]
    );
  };

  const handleRoomAmenityToggle = (amenity: string) => {
    setRoomAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleCommonAmenityToggle = (amenity: string) => {
    setCommonAreaAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSendMessage = () => {
    if (profile?.id && currentMessage.trim()) {
      setIsInConversation(prev => ({
        ...prev,
        [profile.id]: true
      }));
      // Here you would typically make an API call to send the message
      console.log("Sending message:", currentMessage);
    }
  };

  const handleMessageChange = (value: string) => {
    if (profile?.id) {
      setMessage(prev => ({
        ...prev,
        [profile.id]: value
      }));
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Filters Button - Top Left */}
      <Button
        onClick={() => setIsFilterOpen(true)}
        className="absolute top-4 left-4 z-20 bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
        size="lg"
      >
        <SlidersHorizontal className="w-5 h-5 mr-2" />
        Filters
      </Button>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-16 pb-20 px-8">
        {/* Profile Section */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <img
                  src={profile?.profilePicture || "https://randomuser.me/api/portraits/women/44.jpg"}
                  alt={profile?.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-pink-200"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.name}</h1>
                    <p className="text-gray-600 text-lg">
                      {profile?.city}, {profile?.state}
                    </p>
                    <p className="text-gray-600 text-lg">
                      {profile?.age} years old
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                      <Bookmark className="w-5 h-5" />
                    </Button>
                    <Badge className="bg-pink-500 text-white px-4 py-2 text-sm">
                      {profile?.searchType === "flatmate" ? "Has Flat" : "Looking for Flat"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Section or Conversation Status */}
          {profileInConversation ? (
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-700 text-sm">
                You are in conversation with {profile?.name}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 space-y-4">
              <Textarea
                placeholder={`Hey! ${profile?.name}, I'm looking for a place and your listing looks great. Can we talk?`}
                value={currentMessage}
                onChange={(e) => handleMessageChange(e.target.value)}
                className="min-h-[100px] resize-none border-gray-300"
              />
              <Button
                onClick={handleSendMessage}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                size="lg"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </div>
          )}

          {/* Flat Details Section */}
          {profile?.flatDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Flat Details</h2>
              </div>

              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <p className="text-gray-700">{profile.flatDetails.address}</p>
                </div>

                {/* Furnishing */}
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Furnishing:</span> {profile.flatDetails.furnishing}
                  </p>
                </div>

                {/* Map View Placeholder */}
                <div className="mt-4 h-64 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                  <p className="text-gray-500 text-sm">Map View</p>
                </div>
              </div>
            </div>
          )}

          {/* Available Rooms Section */}
          {profile?.flatDetails?.rooms && profile.flatDetails.rooms.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Rooms</h2>
              <div className="space-y-4">
                {profile.flatDetails.rooms.map((room: any) => (
                  <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {room.roomType === "private" ? "Private Room" : "Shared Room"}
                      </h3>
                      <p className="text-gray-600">₹{parseInt(room.rent).toLocaleString()}/month</p>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Security Deposit: ₹{parseInt(room.securityDeposit).toLocaleString()}</p>
                      <p>Available from: {format(new Date(room.availableFrom), "MMM d, yyyy")}</p>
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {room.amenities.map((amenity: string) => (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Left Arrow Button */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-white border-gray-300 shadow-sm hover:bg-gray-50"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Right Arrow Button */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-white border-gray-300 shadow-sm hover:bg-gray-50"
          onClick={handleNext}
          disabled={currentIndex >= totalProfiles - 1}
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Page Indicator - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {totalProfiles}
          </span>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="bg-pink-50 max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
          {/* Light Pink Header */}
          <div className="bg-pink-50 px-6 py-4 flex items-center justify-between border-b border-pink-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-gray-700" />
              <DialogTitle className="text-xl font-bold text-gray-900">Filters</DialogTitle>
            </div>
            <div className="flex items-center gap-3 ">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </Button>
              </DialogClose>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                Flat
              </Button>
            </div>
          </div>
          
          <div className="mx-6 py-6">
            {/* Looking for Flatmate Section */}
            <div className="space-y-4 p-6 bg-white space-y-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 text-lg">Looking for Flatmate</h3>
              
              {/* Age Range */}
              <div className="space-y-4">
                <Label className="text-gray-700">Age Range: {flatmateAgeRange[0]} - {flatmateAgeRange[1]}</Label>
                <Slider
                  value={flatmateAgeRange}
                  onValueChange={setFlatmateAgeRange}
                  min={18}
                  max={70}
                  step={1}
                  className="[&_[role=slider]]:bg-pink-500 [&>span>span]:bg-pink-500 pt-5"
                />
              </div>

              {/* Flatmate Habits */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Flatmate Habits</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {habitsListLeft.map((habit) => (
                      <div key={habit} className="flex items-center space-x-2">
                        <Checkbox
                          id={`habit-${habit}`}
                          checked={flatmateHabits.includes(habit)}
                          onCheckedChange={() => handleHabitToggle(habit)}
                        />
                        <Label htmlFor={`habit-${habit}`} className="text-sm font-normal text-gray-700 cursor-pointer">
                          {habit}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {/* Right Column */}
                  <div className="space-y-3">
                    {habitsListRight.map((habit) => (
                      <div key={habit} className="flex items-center space-x-2">
                        <Checkbox
                          id={`habit-${habit}`}
                          checked={flatmateHabits.includes(habit)}
                          onCheckedChange={() => handleHabitToggle(habit)}
                        />
                        <Label htmlFor={`habit-${habit}`} className="text-sm font-normal text-gray-700 cursor-pointer">
                          {habit}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Move-in Date */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Move-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-pink-50 border-pink-200 hover:bg-pink-100",
                        !flatmateMoveInDate && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {flatmateMoveInDate ? format(flatmateMoveInDate, "PPP") : "Select move-in date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={flatmateMoveInDate}
                      onSelect={setFlatmateMoveInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Looking for Flat Section */}
            <div className=" bg-white space-y-6 mt-6 rounded-lg  p-6">
              <h3 className="font-semibold text-gray-900 text-lg">Looking for Flat</h3>
              
              {/* Search Range */}
              <div className="space-y-2">
                <Label className="text-gray-700">Search Range: {locationRange[0]} km</Label>
                <Slider
                  value={locationRange}
                  onValueChange={setLocationRange}
                  min={1}
                  max={50}
                  step={1}
                  className="[&_[role=slider]]:bg-pink-500 [&>span>span]:bg-pink-500"
                />
              </div>

              {/* Flat Type, Room Type, Available From - 3 columns */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Flat Type</Label>
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
                
                <div className="space-y-2">
                  <Label className="text-gray-700">Room Type</Label>
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
                
                <div className="space-y-2">
                  <Label className="text-gray-700">Available From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !availableFrom && "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableFrom ? format(availableFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={availableFrom} 
                        onSelect={setAvailableFrom} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-gray-700">Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={100000}
                  step={1000}
                  className="[&_[role=slider]]:bg-pink-500 [&>span>span]:bg-pink-500"
                />
              </div>

              {/* Brokerage & Security Deposit - 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Brokerage</Label>
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
                
                <div className="space-y-2">
                  <Label className="text-gray-700">Security Deposit</Label>
                  <Select value={securityDeposit} onValueChange={setSecurityDeposit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Deposit</SelectItem>
                      <SelectItem value="1month">1 Month</SelectItem>
                      <SelectItem value="2months">2 Months</SelectItem>
                      <SelectItem value="3months">3+ Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Room Amenities */}
              <div className="space-y-2">
                <Label className="text-gray-700">Room Amenities</Label>
                <div className="grid grid-cols-3 gap-3">
                  {roomAmenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`room-amenity-${amenity}`}
                        checked={roomAmenities.includes(amenity)}
                        onCheckedChange={() => handleRoomAmenityToggle(amenity)}
                      />
                      <Label htmlFor={`room-amenity-${amenity}`} className="text-sm font-normal text-gray-700 cursor-pointer">
                        {amenity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Area Amenities */}
              <div className="space-y-2">
                <Label className="text-gray-700">Common Area Amenities</Label>
                <div className="grid grid-cols-3 gap-3">
                  {commonAreaAmenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`common-amenity-${amenity}`}
                        checked={commonAreaAmenities.includes(amenity)}
                        onCheckedChange={() => handleCommonAmenityToggle(amenity)}
                      />
                      <Label htmlFor={`common-amenity-${amenity}`} className="text-sm font-normal text-gray-700 cursor-pointer">
                        {amenity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="px-6 py-4 flex justify-end gap-x-6">
              <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(false)}
                  className="text-gray-700 bg-white border-gray-300"
              >
                Cancel
              </Button>
              <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
};
