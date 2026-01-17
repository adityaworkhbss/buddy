"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal, CalendarIcon, X } from "lucide-react";
import { Button } from "@/component/ui/button";
import { ProfileCard } from "@/component/profile/ProfileCard";
import { Card } from "@/component/ui/card";
import { Label } from "@/component/ui/label";
import { Slider } from "@/component/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Checkbox } from "@/component/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { Calendar } from "@/component/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/component/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LocationMap } from "@/component/map/LocationMap";

interface DiscoveredUser {
  id: string;
  name: string;
  age: number | string;
  city: string;
  state: string;
  profilePicture: string;
  searchType: "flat" | "flatmate";
  distance: number;
  myHabits?: string[];
  lookingForHabits?: string[];
  jobExperiences?: any[];
  educationExperiences?: any[];
  flatDetails?: any;
}

export const HomePage = () => {
  const [profiles, setProfiles] = useState<DiscoveredUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"left" | "right" | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Filter location (for search)
  const [filterLocationName, setFilterLocationName] = useState<string>("");
  const [filterLatitude, setFilterLatitude] = useState<number | null>(null);
  const [filterLongitude, setFilterLongitude] = useState<number | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>("");
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  // Mock user search type - in real app, this would come from user profile
  const [searchType] = useState<"Looking for Flat" | "Looking for Flatmate" | "Both">("Both");
  
  // Flatmate filters
  const [flatmateAgeRange, setFlatmateAgeRange] = useState([18, 50]);
  const [flatmateHabits, setFlatmateHabits] = useState<string[]>([]);
  const [flatmateMoveInDate, setFlatmateMoveInDate] = useState<Date>();
  
  const habitsList = ["Early Riser", "Night Owl", "Non-Smoker", "Vegetarian", "Pet Friendly", "Party Lover", "Fitness Enthusiast"];
  
  const handleHabitToggle = (habit: string) => {
    setFlatmateHabits(prev => 
      prev.includes(habit) 
        ? prev.filter(h => h !== habit)
        : [...prev, habit]
    );
  };
  
  // Flat filters
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [locationCoords, setLocationCoords] = useState<[number, number] | null>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_KEY || "";
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [flatType, setFlatType] = useState<string>("");
  const [roomType, setRoomType] = useState<string>("");
  const [availableFrom, setAvailableFrom] = useState<Date>();
  const [brokerage, setBrokerage] = useState<string>("");
  const [securityDeposit, setSecurityDeposit] = useState<string>("");
  const [roomAmenities, setRoomAmenities] = useState<string[]>([]);
  const [commonAreaAmenities, setCommonAreaAmenities] = useState<string[]>([]);
  
  const roomAmenitiesList = ["AC", "Attached Bathroom", "Wardrobe", "Bed", "Study Table", "Geyser"];
  const commonAreaAmenitiesList = ["Wifi", "Parking", "Gym", "Swimming Pool", "Balcony", "Laundry", "Kitchen", "Security", "Power Backup"];
  
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

  // Location search for filter
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim() || !mapboxToken) {
      setLocationSearchResults([]);
      return;
    }

    setIsSearchingLocation(true);
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
      setIsSearchingLocation(false);
    }
  }, [mapboxToken]);

  // Handle location selection for filter
  const handleSelectFilterLocation = (place: any) => {
    const coords = place.center; // [lng, lat]
    setFilterLocationName(place.place_name);
    setFilterLatitude(coords[1]); // lat
    setFilterLongitude(coords[0]); // lng
    setLocationSearchQuery(place.place_name);
    setLocationSearchResults([]);
  };

  // Get current user location and fetch initial users
  useEffect(() => {
    fetchUserLocationAndDiscover();
  }, []);

  // Check conversation status for all profiles
  useEffect(() => {
    if (currentUserId && profiles.length > 0) {
      checkConversationStatus();
    }
  }, [currentUserId, profiles]);

  // Load more users when we're running low
  useEffect(() => {
    if (profiles.length - currentIndex <= 2 && hasMore && !loadingMore) {
      loadMoreUsers();
    }
  }, [currentIndex, profiles.length, hasMore]);

  // Debounce location search
  useEffect(() => {
    if (!locationSearchQuery.trim() || !mapboxToken) {
      setLocationSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchLocation(locationSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationSearchQuery, searchLocation, mapboxToken]);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setLocationSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, isAnimating]);

  const fetchUserLocationAndDiscover = async () => {
    try {
      setLoading(true);
      
      const meResponse = await fetch("/api/user/me");
      const meData = await meResponse.json();
      
      if (!meData.success) {
        throw new Error("Failed to get user information");
      }

      const profileResponse = await fetch(`/api/user/profile?userId=${meData.user.id}`);
      const profileData = await profileResponse.json();

      if (profileData.success && profileData.profile?.housingDetails) {
        setCurrentUserId(meData.user.id);
        const housing = profileData.profile.housingDetails;
        if (housing.latitude && housing.longitude) {
          setUserLocation({ lat: housing.latitude, lon: housing.longitude });
          const userSearchRadius = housing.searchRadius || 10;
          setSearchRadius(userSearchRadius);
          
          // Load saved filters from database
          try {
            const filtersResponse = await fetch("/api/user/filters");
            const filtersData = await filtersResponse.json();
            
            if (filtersData.success && filtersData.filters) {
              const filters = filtersData.filters;
              
              // Set filter values from database
              if (filters.searchRadius !== null) setSearchRadius(filters.searchRadius);
              if (filters.filterLocationName) setFilterLocationName(filters.filterLocationName);
              if (filters.filterLatitude) setFilterLatitude(filters.filterLatitude);
              if (filters.filterLongitude) setFilterLongitude(filters.filterLongitude);
              if (filters.filterLocationName) setLocationSearchQuery(filters.filterLocationName);
              if (filters.flatmateAgeRange && filters.flatmateAgeRange.length === 2) {
                setFlatmateAgeRange(filters.flatmateAgeRange);
              }
              if (filters.flatmateHabits) setFlatmateHabits(filters.flatmateHabits);
              if (filters.flatmateMoveInDate) setFlatmateMoveInDate(new Date(filters.flatmateMoveInDate));
              if (filters.locationSearch) setLocationSearch(filters.locationSearch);
              if (filters.locationCoords && Array.isArray(filters.locationCoords) && filters.locationCoords.length === 2) {
                setLocationCoords([filters.locationCoords[0], filters.locationCoords[1]]);
              }
              if (filters.priceRange && filters.priceRange.length === 2) {
                setPriceRange(filters.priceRange);
              }
              if (filters.flatType) setFlatType(filters.flatType);
              if (filters.roomType) setRoomType(filters.roomType);
              if (filters.availableFrom) setAvailableFrom(new Date(filters.availableFrom));
              if (filters.brokerage) setBrokerage(filters.brokerage);
              if (filters.securityDeposit) setSecurityDeposit(filters.securityDeposit);
              if (filters.roomAmenities) setRoomAmenities(filters.roomAmenities);
              if (filters.commonAreaAmenities) setCommonAreaAmenities(filters.commonAreaAmenities);
              
              // Use filter location if available, otherwise use user's default location
              const searchLat = filters.filterLatitude || housing.latitude;
              const searchLon = filters.filterLongitude || housing.longitude;
              const searchRadiusValue = filters.searchRadius !== null ? filters.searchRadius : userSearchRadius;
              
              await discoverUsers(searchLat, searchLon, searchRadiusValue, 0);
            } else {
              await discoverUsers(housing.latitude, housing.longitude, userSearchRadius, 0);
            }
          } catch (filterError) {
            console.error("Error loading filters:", filterError);
            await discoverUsers(housing.latitude, housing.longitude, userSearchRadius, 0);
          }
        } else {
          toast({
            title: "Location Required",
            description: "Please update your profile location to discover users nearby.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Location Required",
          description: "Please update your profile location to discover users nearby.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user location:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const discoverUsers = async (lat: number, lon: number, radius: number, offset: number) => {
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        radius: radius.toString(),
        limit: "3",
        offset: offset.toString(),
        excludeIds: excludedUserIds.join(","),
      });

      const response = await fetch(`/api/users/discover?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        if (offset === 0) {
          setProfiles(data.users);
          setCurrentIndex(0);
        } else {
          setProfiles(prev => [...prev, ...data.users]);
        }
        setHasMore(data.hasMore);
        setExcludedUserIds(prev => [...prev, ...data.users.map((u: DiscoveredUser) => u.id)]);
      } else {
        throw new Error(data.message || "Failed to discover users");
      }
    } catch (error) {
      console.error("Error discovering users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadMoreUsers = async () => {
    if (loadingMore || !hasMore) return;

    // Get location to use - filter location if available, otherwise user default location
    const meResponse = await fetch("/api/user/me");
    const meData = await meResponse.json();
    
    if (!meData.success) return;

    const profileResponse = await fetch(`/api/user/profile?userId=${meData.user.id}`);
    const profileData = await profileResponse.json();

    if (!profileData.success || !profileData.profile?.housingDetails?.latitude || !profileData.profile?.housingDetails?.longitude) {
      return;
    }

    const housing = profileData.profile.housingDetails;
    const searchLat = filterLatitude || housing.latitude;
    const searchLon = filterLongitude || housing.longitude;

    try {
      setLoadingMore(true);
      await discoverUsers(searchLat, searchLon, searchRadius, profiles.length);
    } catch (error) {
      console.error("Error loading more users:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const checkConversationStatus = async () => {
    if (!currentUserId) return;

    try {
      const conversationsResponse = await fetch(`/api/messages/conversations?userId=${currentUserId}`);
      const conversationsData = await conversationsResponse.json();

      if (conversationsData.success) {
        const statusMap: Record<string, boolean> = {};
        conversationsData.conversations.forEach((conv: any) => {
          statusMap[conv.otherUserId.toString()] = true;
        });
        setConversationStatus(statusMap);
      }
    } catch (error) {
      console.error("Error checking conversation status:", error);
    }
  };

  const handleNext = () => {
    if (isAnimating || currentIndex >= profiles.length - 1) return;
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

  const handleApplyFilters = async () => {
    setIsFilterOpen(false);
    // Use filter location if available, otherwise use user's default location
    const meResponse = await fetch("/api/user/me");
    const meData = await meResponse.json();
    
    if (!meData.success) {
      toast({
        title: "Error",
        description: "Failed to get user information.",
        variant: "destructive",
      });
      return;
    }

    const profileResponse = await fetch(`/api/user/profile?userId=${meData.user.id}`);
    const profileData = await profileResponse.json();

    if (!profileData.success || !profileData.profile?.housingDetails?.latitude || !profileData.profile?.housingDetails?.longitude) {
      toast({
        title: "Error",
        description: "Please update your profile location to discover users nearby.",
        variant: "destructive",
      });
      return;
    }

    const housing = profileData.profile.housingDetails;
    
    // Use filter location if available, otherwise use user's default location
    const searchLat = filterLatitude || housing.latitude;
    const searchLon = filterLongitude || housing.longitude;

    setLoading(true);
    setProfiles([]);
    setCurrentIndex(0);
    setExcludedUserIds([]);
    
    // Save filters to database
    try {
      const filtersResponse = await fetch("/api/user/filters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchRadius,
          filterLocationName,
          filterLatitude,
          filterLongitude,
          flatmateAgeRange,
          flatmateHabits,
          flatmateMoveInDate: flatmateMoveInDate ? flatmateMoveInDate.toISOString() : null,
          locationSearch,
          locationCoords,
          priceRange,
          flatType,
          roomType,
          availableFrom: availableFrom ? availableFrom.toISOString() : null,
          brokerage,
          securityDeposit,
          roomAmenities,
          commonAreaAmenities,
        }),
      });

      const filtersData = await filtersResponse.json();
      if (!filtersData.success) {
        console.error("Error saving filters:", filtersData.message);
      }
    } catch (error) {
      console.error("Error saving filters:", error);
      toast({
        title: "Warning",
        description: "Filters applied but failed to save. They will be reset on next page load.",
        variant: "destructive",
      });
    }
    
    await discoverUsers(searchLat, searchLon, searchRadius, 0);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading users nearby...</p>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
          <p className="text-charcoal mb-4">
            Please update your profile location to discover users nearby.
          </p>
        </div>
      </div>
    );
  }

  const currentProfile = profiles.length > 0 ? profiles[currentIndex] : null;

  return (
    <div className="h-screen flex flex-col relative bg-pink-50">
      {/* Floating Filter Button */}
      <Button
        onClick={() => setIsFilterOpen(true)}
        className="absolute top-4 left-4 z-20 shadow-lg bg-pink-500 hover:bg-pink-600 text-white"
        variant="default"
      >
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filters
      </Button>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Filter Location Search */}
            <Card className="p-4">
              <div className="space-y-2">
                <Label>Search Location</Label>
                <div className="relative" ref={locationDropdownRef}>
                  <input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Search for location (optional - uses your default address if not set)"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm pr-10"
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {locationSearchResults.length > 0 && (
                    <div className="absolute z-50 bg-white border rounded-lg w-full mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {locationSearchResults.map((place) => (
                        <div
                          key={place.id}
                          onClick={() => handleSelectFilterLocation(place)}
                          className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{place.place_name}</div>
                          {place.context && place.context.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {place.context.map((ctx: any) => ctx.text).join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {filterLocationName && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {filterLocationName}
                  </p>
                )}
              </div>
            </Card>
            
            {/* Looking for Flatmate Filters */}
            {(searchType === "Looking for Flatmate" || searchType === "Both") && (
              <Card className="p-4">
                <h3 className="font-medium mb-3">Looking for Flatmate</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Age Range: {flatmateAgeRange[0]} - {flatmateAgeRange[1]}</Label>
                    <div className="relative">
                      <Slider
                        value={flatmateAgeRange}
                        onValueChange={setFlatmateAgeRange}
                        min={18}
                        max={70}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>18</span>
                        <span>70</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Flatmate Habits</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {habitsList.map((habit) => (
                        <div key={habit} className="flex items-center space-x-2">
                          <Checkbox
                            id={`habit-${habit}`}
                            checked={flatmateHabits.includes(habit)}
                            onCheckedChange={() => handleHabitToggle(habit)}
                          />
                          <Label htmlFor={`habit-${habit}`} className="text-sm font-normal">{habit}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Move-in Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !flatmateMoveInDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {flatmateMoveInDate ? format(flatmateMoveInDate, "PPP") : <span>Select move-in date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          selected={flatmateMoveInDate}
                          onSelect={setFlatmateMoveInDate}
                          className={cn("pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Looking for Flat Filters */}
            {(searchType === "Looking for Flat" || searchType === "Both") && (
              <Card className="p-4">
                <h3 className="font-medium mb-3">Looking for Flat</h3>
                <div className="space-y-4">
                  {/* Location Search + Map */}
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm"
                    />
                    {mapboxToken ? (
                      <div className="h-64 rounded-md overflow-hidden border">
                        <LocationMap
                          location={locationSearch}
                          radius={searchRadius}
                          onLocationChange={(locationName: string, coords: [number, number]) => {
                            setLocationSearch(locationName);
                            setLocationCoords(coords);
                          }}
                          onRadiusChange={(radius: number) => {
                            setSearchRadius(radius);
                          }}
                          mapboxToken={mapboxToken}
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 text-sm border">
                        Mapbox token not configured. Please set NEXT_PUBLIC_MAPBOX_PUBLIC_KEY in your .env file
                      </div>
                    )}
                  </div>
                  
                  {/* Flat Type, Room Type, Available From - Side by Side */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Flat Type</Label>
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
                      <Label>Room Type</Label>
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
                      <Label>Available From</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !availableFrom && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {availableFrom ? format(availableFrom, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar selected={availableFrom} onSelect={setAvailableFrom} className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {/* Price Range - Full Width */}
                  <div className="space-y-2">
                    <Label>Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={100000}
                      step={1000}
                    />
                  </div>
                  
                  {/* Brokerage & Security Deposit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brokerage</Label>
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
                      <Label>Security Deposit</Label>
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
                  
                  {/* Room Amenities - 3 columns */}
                  <div className="space-y-2">
                    <Label>Room Amenities</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roomAmenitiesList.map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`room-amenity-${amenity}`}
                            checked={roomAmenities.includes(amenity)}
                            onCheckedChange={() => handleRoomAmenityToggle(amenity)}
                          />
                          <Label htmlFor={`room-amenity-${amenity}`} className="text-sm font-normal">{amenity}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Common Area Amenities - 3 columns */}
                  <div className="space-y-2">
                    <Label>Common Area Amenities</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {commonAreaAmenitiesList.map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`common-amenity-${amenity}`}
                            checked={commonAreaAmenities.includes(amenity)}
                            onCheckedChange={() => handleCommonAmenityToggle(amenity)}
                          />
                          <Label htmlFor={`common-amenity-${amenity}`} className="text-sm font-normal">{amenity}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Apply Filters Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplyFilters} className="bg-pink-500 hover:bg-pink-600 text-white">
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Cards Section */}
      {profiles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              No users found within {searchRadius}km radius. Try adjusting your filters or increasing the search radius.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center relative">
          {/* Left Navigation Button */}
          <div className="flex-shrink-0 w-12 flex items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isAnimating}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>

          {/* Profile Card - Stretched to fill space */}
          <div className="flex-1 h-full flex items-center justify-center py-8 px-2">
            {currentProfile && (
              <div
                className={
                  animationDirection === "left"
                    ? "animate-slide-out-left w-full"
                    : animationDirection === "right"
                    ? "animate-slide-out-right w-full"
                    : "animate-slide-in w-full"
                }
              >
                <ProfileCard 
                  profile={{
                    id: currentProfile.id,
                    name: currentProfile.name,
                    age: currentProfile.age,
                    city: currentProfile.city,
                    state: currentProfile.state,
                    profilePicture: currentProfile.profilePicture,
                    searchType: currentProfile.searchType as "flat" | "flatmate",
                    myHabits: currentProfile.myHabits || [],
                    lookingForHabits: currentProfile.lookingForHabits || [],
                    jobExperiences: currentProfile.jobExperiences || [],
                    educationExperiences: currentProfile.educationExperiences || [],
                    flatDetails: currentProfile.flatDetails,
                  }}
                  distance={currentProfile.distance}
                  alreadyInConversation={conversationStatus[currentProfile.id] || false}
                  onSaveProfile={(profileId, saved) => {
                    // Update conversation status when message is sent
                    if (saved) {
                      setConversationStatus(prev => ({
                        ...prev,
                        [profileId]: true
                      }));
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Navigation Button */}
          <div className="flex-shrink-0 w-12 flex items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={handleNext}
              disabled={currentIndex >= profiles.length - 1 || isAnimating}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Profile Counter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground bg-white px-4 py-2 rounded-full shadow-lg border">
            {currentIndex + 1} / {profiles.length}
            {hasMore && " +"}
          </div>
        </div>
      )}
    </div>
  );
};
