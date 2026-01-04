"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Textarea } from "@/component/ui/textarea";
import { Label } from "@/component/ui/label";
import { mockProfiles } from "@/data/mockProfiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/component/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs";
import { Badge } from "@/component/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Phone, Mail, Briefcase, BookOpen, Bookmark, Share2, Edit2, X, Save, Camera, Heart, Trash2, Home, MapPin, Plus
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/component/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Checkbox } from "@/component/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/component/ui/dialog";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobExperience {
  id: string;
  company: string;
  position: string;
  fromYear: string;
  tillYear: string;
  currentlyWorking: boolean;
}

interface EducationExperience {
  id: string;
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
}

interface HousingPreferences {
  lookingFor: string;
  budgetRange: string;
  movingDate: string;
  preferredLocation: string;
  searchRadius: string;
  flatTypes: string[];
  roomTypes: string[];
  amenities: string[];
  locationCoords: [number, number] | null;
}

interface FlatDetails {
  address: string;
  description: string;
  commonAmenities: string[];
  rooms: Array<{
    id: string;
    roomType: string;
    rent: string;
    deposit: string;
    brokerage: string;
    available: string;
    quantity: string;
    amenities: string[];
  }>;
}

interface UserProfile {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  profilePictureUrl: string;
  jobExperiences: JobExperience[];
  educationExperiences: EducationExperience[];
  housingPreferences?: HousingPreferences;
  flatDetails?: FlatDetails;
}

const mockUserProfile: UserProfile = {
  name: "John Doe",
  age: "28",
  gender: "male",
  phone: "9876543210",
  email: "john.doe@example.com",
  city: "Mumbai",
  state: "Maharashtra",
  profilePictureUrl: "",
  jobExperiences: [
    {
      id: "1",
      company: "Tech Corp",
      position: "Software Engineer",
      fromYear: "2020",
      tillYear: "",
      currentlyWorking: true
    }
  ],
  educationExperiences: [
    {
      id: "1",
      institution: "IIT Mumbai",
      degree: "B.Tech Computer Science",
      startYear: "2016",
      endYear: "2020"
    }
  ],
  housingPreferences: {
    lookingFor: "Open To Both",
    budgetRange: "₹15,000 - ₹30,000",
    movingDate: "2/1/2024",
    preferredLocation: "Andheri West, Mumbai",
    searchRadius: "10 km",
    flatTypes: ["1 BHK", "2 BHK"],
    roomTypes: ["Private Room", "Shared Room"],
    amenities: ["WiFi", "Gym", "Parking"],
    locationCoords: null
  },
  flatDetails: {
    address: "402, Sunshine Apartments, Lokhandwala Complex, Andheri West, Mumbai - 400053",
    description: "Spacious 3BHK apartment in a prime location with great connectivity. Looking for working professionals or students.",
    commonAmenities: ["WiFi", "Parking", "Gym"],
    rooms: [
      {
        id: "1",
        roomType: "Private Room",
        rent: "18000",
        deposit: "36000",
        brokerage: "0",
        available: "2/15/2024",
        quantity: "2",
        amenities: ["AC", "Attached Bathroom"]
      },
      {
        id: "2",
        roomType: "Shared Room",
        rent: "10000",
        deposit: "20000",
        brokerage: "5000",
        available: "2/1/2024",
        quantity: "1",
        amenities: ["AC"]
      }
    ]
  }
};

export const ProfilePage = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(mockUserProfile);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>("");
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<[number, number] | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  // Add Priya Patel profile for saved section
  const priyaProfile = {
    id: "6",
    name: "Priya Patel",
    age: "28",
    profilePicture: "https://randomuser.me/api/portraits/women/65.jpg",
    city: "Mumbai",
    state: "Maharashtra",
    searchType: "flatmate" as const,
    myHabits: ["Non-Smoker", "Vegan", "Yoga Practitioner", "Clean"]
  };
  
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Mock data for habits and preferences
  const myHabits = ["Non-Smoker", "Early Riser", "Vegetarian"];
  const lookingForInFlatmate = ["Non-Smoker", "Clean"];
  const matchingPreferences = [
    { id: 1, title: "Cleanliness", description: "Maintain a clean living space" },
    { id: 2, title: "Quiet Environment", description: "Prefer peaceful surroundings" }
  ];

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/profile/current-user`
    : `/profile/current-user`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your profile link has been copied to clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditMode(false);
  };

  // Fetch user profile data and saved profiles
  useEffect(() => {
    fetchUserProfile();
    fetchSavedProfiles();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // First get current user ID
      const meResponse = await fetch("/api/user/me");
      const meData = await meResponse.json();
      
      if (!meData.success || !meData.user) {
        toast({
          title: "Error",
          description: "Failed to get user information",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setCurrentUserId(meData.user.id);

      // Then fetch full profile
      const profileResponse = await fetch(`/api/user/profile?userId=${meData.user.id}`);
      const profileData = await profileResponse.json();

      if (profileData.success && profileData.profile) {
        const apiProfile = profileData.profile;
        
        // Map API response to component structure
        const mappedProfile: UserProfile = {
          name: apiProfile.fullName || "",
          age: apiProfile.age?.toString() || "",
          gender: apiProfile.gender || "",
          phone: apiProfile.phone?.replace("+91", "") || "",
          email: "", // Email not in schema yet
          city: apiProfile.housingDetails?.preferenceLocation?.split(",")[0]?.trim() || "",
          state: apiProfile.housingDetails?.preferenceLocation?.split(",")[1]?.trim() || "",
          profilePictureUrl: apiProfile.profilePicture || "",
          jobExperiences: apiProfile.workExperiences?.map((exp: any) => ({
            id: exp.id.toString(),
            company: exp.company || "",
            position: exp.position || exp.experienceTitle || "",
            fromYear: exp.from ? new Date(exp.from).getFullYear().toString() : "",
            tillYear: exp.till ? new Date(exp.till).getFullYear().toString() : "",
            currentlyWorking: exp.stillWorking || false,
          })) || [],
          educationExperiences: apiProfile.educations?.map((edu: any) => ({
            id: edu.id.toString(),
            institution: edu.institution || "",
            degree: edu.degree || edu.educationTitle || "",
            startYear: edu.from ? new Date(edu.from).getFullYear().toString() : "",
            endYear: edu.till ? new Date(edu.till).getFullYear().toString() : "",
          })) || [],
          housingPreferences: apiProfile.housingDetails ? {
            lookingFor: apiProfile.housingDetails.lookingFor || "Open To Both",
            budgetRange: apiProfile.housingDetails.budgetMin && apiProfile.housingDetails.budgetMax
              ? `₹${apiProfile.housingDetails.budgetMin.toLocaleString()} - ₹${apiProfile.housingDetails.budgetMax.toLocaleString()}`
              : "",
            movingDate: apiProfile.housingDetails.movingDate 
              ? new Date(apiProfile.housingDetails.movingDate).toISOString().split('T')[0]
              : "",
            preferredLocation: apiProfile.housingDetails.preferenceLocation || "",
            searchRadius: apiProfile.housingDetails.searchRadius ? `${apiProfile.housingDetails.searchRadius} km` : "",
            flatTypes: [], // Not stored separately
            roomTypes: apiProfile.housingDetails.roomType ? [apiProfile.housingDetails.roomType] : [],
            amenities: apiProfile.housingDetails.preferredAmenities || [],
            locationCoords: apiProfile.housingDetails.latitude && apiProfile.housingDetails.longitude
              ? [apiProfile.housingDetails.longitude, apiProfile.housingDetails.latitude] as [number, number]
              : null,
          } : undefined,
          flatDetails: apiProfile.housingDetails?.address ? {
            address: apiProfile.housingDetails.address || "",
            description: apiProfile.housingDetails.description || "",
            commonAmenities: apiProfile.housingDetails.availableAmenities || [],
            rooms: [], // Rooms not stored in current schema
          } : undefined,
        };

        setProfile(mappedProfile);
        setEditedProfile(mappedProfile);
        
        // Set location search query and coords
        if (mappedProfile.housingPreferences?.preferredLocation) {
          setLocationSearchQuery(mappedProfile.housingPreferences.preferredLocation);
        }
        if (mappedProfile.housingPreferences?.locationCoords) {
          setLocationCoords(mappedProfile.housingPreferences.locationCoords);
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

  const fetchSavedProfiles = async () => {
    try {
      const response = await fetch("/api/user/saved-profiles");
      const data = await response.json();

      if (data.success) {
        setSavedProfiles(data.profiles || []);
      } else {
        console.error("Failed to fetch saved profiles:", data.message);
      }
    } catch (error) {
      console.error("Error fetching saved profiles:", error);
    }
  };

  // Mapbox location search
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_KEY;

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

  // Close dropdown when clicking outside
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

  // Handle location selection
  const handleSelectLocation = (place: any) => {
    const coords = place.center; // [lng, lat]
    console.log("Location selected:", place.place_name, "Coords:", coords);
    setLocationSearchQuery(place.place_name);
    setLocationSearchResults([]);
    setLocationCoords(coords);
    handleHousingPreferenceChange("preferredLocation", place.place_name);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!currentUserId) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        });
        return;
      }

      // Get current user phone
      const meResponse = await fetch("/api/user/me");
      const meData = await meResponse.json();
      
      if (!meData.success || !meData.user) {
        throw new Error("Failed to get user information");
      }

      // Prepare data for API
      const personalInfo = {
        name: editedProfile.name,
        age: editedProfile.age,
        gender: editedProfile.gender,
        profilePicture: editedProfile.profilePictureUrl,
        jobExperiences: editedProfile.jobExperiences.map(exp => ({
          company: exp.company,
          position: exp.position,
          fromYear: exp.fromYear,
          tillYear: exp.tillYear,
          currentlyWorking: exp.currentlyWorking,
        })),
        educationExperiences: editedProfile.educationExperiences.map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          startYear: edu.startYear,
          endYear: edu.endYear,
        })),
      };

      const housingDetails = {
        searchType: editedProfile.housingPreferences?.lookingFor || "Open To Both",
        budget: editedProfile.housingPreferences?.budgetRange 
          ? editedProfile.housingPreferences.budgetRange.replace(/[₹,\s]/g, "").split("-").map(v => parseInt(v))
          : [10000, 25000],
        location: editedProfile.housingPreferences?.preferredLocation || "",
        locationCoords: locationCoords || null,
        radius: editedProfile.housingPreferences?.searchRadius 
          ? parseInt(editedProfile.housingPreferences.searchRadius.replace(" km", ""))
          : 5,
        movingDate: editedProfile.housingPreferences?.movingDate || "",
        roomType: editedProfile.housingPreferences?.roomTypes?.[0] || "",
        amenityPreferences: editedProfile.housingPreferences?.amenities || [],
        flatDetails: {
          address: editedProfile.flatDetails?.address || "",
          description: editedProfile.flatDetails?.description || "",
          amenities: editedProfile.flatDetails?.commonAmenities || [],
        },
      };

      console.log("Saving housing details with locationCoords:", locationCoords);
      console.log("Housing details payload:", JSON.stringify(housingDetails, null, 2));

      const formData = new FormData();
      formData.append("phone", meData.user.phone);
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

      setProfile({ ...editedProfile });
      setIsEditMode(false);
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });

      // Refresh profile data
      await fetchUserProfile();
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast({
        title: "Failed to save",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditedProfile(prev => ({
            ...prev,
            profilePictureUrl: reader.result as string
          }));
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "profile");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success && uploadResult.url) {
          setEditedProfile(prev => ({
            ...prev,
            profilePictureUrl: uploadResult.url
          }));
          toast({
            title: "Success",
            description: "Profile picture uploaded successfully",
          });
        } else {
          throw new Error(uploadResult.message || "Failed to upload image");
        }
      } catch (error: any) {
        console.error("Error uploading profile picture:", error);
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload profile picture",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddJobExperience = () => {
    const newExp: JobExperience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      fromYear: "",
      tillYear: "",
      currentlyWorking: false
    };
    setEditedProfile(prev => ({
      ...prev,
      jobExperiences: [...prev.jobExperiences, newExp]
    }));
  };

  const handleRemoveJobExperience = (id: string) => {
    setEditedProfile(prev => ({
      ...prev,
      jobExperiences: prev.jobExperiences.filter(exp => exp.id !== id)
    }));
  };

  const handleUpdateJobExperience = (id: string, field: keyof JobExperience, value: string | boolean) => {
    setEditedProfile(prev => ({
      ...prev,
      jobExperiences: prev.jobExperiences.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleAddEducation = () => {
    const newEdu: EducationExperience = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      startYear: "",
      endYear: ""
    };
    setEditedProfile(prev => ({
      ...prev,
      educationExperiences: [...prev.educationExperiences, newEdu]
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setEditedProfile(prev => ({
      ...prev,
      educationExperiences: prev.educationExperiences.filter(edu => edu.id !== id)
    }));
  };

  const handleUpdateEducation = (id: string, field: keyof EducationExperience, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      educationExperiences: prev.educationExperiences.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i).map(y => y.toString());

  const flatTypeOptions = ["1 BHK", "2 BHK", "3 BHK", "4+ BHK"];
  const roomTypeOptions = ["Private Room", "Shared Room", "Studio", "Entire Flat"];
  const amenityOptions = ["WiFi", "Gym", "Parking", "Swimming Pool", "Balcony", "Kitchen", "Laundry", "Security", "Power Backup"];

  const handleHousingPreferenceChange = (field: keyof HousingPreferences, value: string | string[]) => {
    setEditedProfile(prev => ({
      ...prev,
      housingPreferences: {
        ...(prev.housingPreferences || {} as HousingPreferences),
        [field]: value
      } as HousingPreferences
    }));
  };

  const handleFlatDetailChange = (field: keyof FlatDetails, value: string | string[]) => {
    setEditedProfile(prev => ({
      ...prev,
      flatDetails: {
        ...(prev.flatDetails || {} as FlatDetails),
        [field]: value
      } as FlatDetails
    }));
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const currentProfile = isEditMode ? editedProfile : profile;

  if (loading) {
    return (
      <div className="w-full min-h-screen p-4 md:p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-600 mt-1">View and manage your profile details</p>
          </div>
          <div className="flex gap-2">
            {!isEditMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsShareDialogOpen(true)}
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
                <Button 
                  onClick={handleEdit}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Share Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Profile</DialogTitle>
              <DialogDescription>
                Share this link with others to let them view your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 truncate">
                {shareUrl}
              </div>
              <Button onClick={handleCopyLink} size="sm" className="shrink-0">
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Summary Card */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-pink-100">
                  {currentProfile.profilePictureUrl ? (
                    <img src={currentProfile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                {isEditMode && (
                  <>
                    <label htmlFor="profile-picture-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                  </label>
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                  </>
                )}
              </div>
              <div className="flex-1">
                {isEditMode ? (
                  <Input
                    value={currentProfile.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="text-2xl font-bold mb-1 border-gray-300 bg-gray-50 h-auto py-1 px-3"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentProfile.name}</h2>
                )}
                <p className="text-gray-700 mb-3">{currentProfile.city}, {currentProfile.state}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" /> {currentProfile.phone}
                  </span>
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" /> {currentProfile.email}
                    </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 border border-gray-200 rounded-lg p-1">
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 data-[state=active]:font-semibold data-[state=active]:border-pink-300 border border-transparent text-gray-600"
            >
              Personal
            </TabsTrigger>
            <TabsTrigger 
              value="housing"
              className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 data-[state=active]:font-semibold data-[state=active]:border-pink-300 border border-transparent text-gray-600"
            >
              Housing
            </TabsTrigger>
            <TabsTrigger 
              value="habits"
              className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 data-[state=active]:font-semibold data-[state=active]:border-pink-300 border border-transparent text-gray-600"
            >
              Habits
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 data-[state=active]:font-semibold data-[state=active]:border-pink-300 border border-transparent text-gray-600"
            >
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 data-[state=active]:font-semibold data-[state=active]:border-pink-300 border border-transparent text-gray-600"
            >
              <Bookmark className="w-4 h-4 mr-1" />
              Saved
            </TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            {/* Basic Information Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Full Name</Label>
                      {isEditMode ? (
                      <Input 
                          value={currentProfile.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          className="bg-gray-50 border-gray-300"
                      />
                    ) : (
                        <p className="text-gray-900">{currentProfile.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Age</Label>
                      {isEditMode ? (
                      <Input 
                        type="number" 
                          value={currentProfile.age}
                          onChange={(e) => handleFieldChange('age', e.target.value)}
                          className="bg-gray-50 border-gray-300"
                      />
                    ) : (
                        <p className="text-gray-900">{currentProfile.age} years</p>
                    )}
                  </div>
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Gender</Label>
                      {isEditMode ? (
                      <RadioGroup 
                          value={currentProfile.gender}
                          onValueChange={(value) => handleFieldChange('gender', value)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                        </div>
                      </RadioGroup>
                    ) : (
                        <p className="text-gray-900 capitalize">{currentProfile.gender}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Phone</Label>
                      {isEditMode ? (
                      <Input 
                          value={currentProfile.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          className="bg-gray-50 border-gray-300"
                      />
                    ) : (
                        <p className="text-gray-900">{currentProfile.phone}</p>
                    )}
                    </div>
                  </div>
                  
                  {/* Single Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Email</Label>
                      {isEditMode ? (
                      <Input 
                        type="email" 
                          value={currentProfile.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className="bg-gray-50 border-gray-300"
                      />
                    ) : (
                        <p className="text-gray-900">{currentProfile.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">City</Label>
                      {isEditMode ? (
                      <Input 
                          value={currentProfile.city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          className="bg-gray-50 border-gray-300"
                      />
                    ) : (
                        <p className="text-gray-900">{currentProfile.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">State</Label>
                      {isEditMode ? (
                      <Input 
                          value={currentProfile.state}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                          className="bg-gray-50 border-gray-300"
                      />
                    ) : (
                        <p className="text-gray-900">{currentProfile.state}</p>
                    )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Briefcase className="w-5 h-5" />
                    Work Experience
                  </CardTitle>
                  {isEditMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddJobExperience}
                      className="text-gray-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentProfile.jobExperiences.map((exp, index) => (
                  <div key={exp.id} className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-700">Experience #{index + 1}</h4>
                      {isEditMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-500"
                          onClick={() => handleRemoveJobExperience(exp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => handleUpdateJobExperience(exp.id, "company", e.target.value)}
                            className="bg-white border-gray-300"
                            placeholder="Tech Corp"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">Position</Label>
                          <Input
                            value={exp.position}
                            onChange={(e) => handleUpdateJobExperience(exp.id, "position", e.target.value)}
                            className="bg-white border-gray-300"
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">From Year</Label>
                          <Select
                            value={exp.fromYear}
                            onValueChange={(value) => handleUpdateJobExperience(exp.id, "fromYear", value)}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">Till Year</Label>
                          {exp.currentlyWorking ? (
                            <Input
                              value="Currently Working"
                              className="bg-green-50 border-green-200 text-green-700"
                              readOnly
                            />
                          ) : (
                            <Select
                              value={exp.tillYear}
                              onValueChange={(value) => handleUpdateJobExperience(exp.id, "tillYear", value)}
                            >
                              <SelectTrigger className="bg-white border-gray-300">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map(year => (
                                  <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`currently-working-${exp.id}`}
                              checked={exp.currentlyWorking}
                              onCheckedChange={(checked) => {
                                handleUpdateJobExperience(exp.id, "currentlyWorking", checked as boolean);
                                if (checked) {
                                  handleUpdateJobExperience(exp.id, "tillYear", "");
                                }
                              }}
                            />
                            <Label htmlFor={`currently-working-${exp.id}`} className="text-sm text-gray-700 cursor-pointer">
                              Currently working here
                            </Label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900 mb-1">
                          {exp.position} at {exp.company}
                        </p>
                        <p className="text-sm text-gray-600">
                          {exp.fromYear} - {exp.currentlyWorking ? "Present" : exp.tillYear}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Education Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <BookOpen className="w-5 h-5" />
                    Education
                  </CardTitle>
                  {isEditMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddEducation}
                      className="text-gray-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentProfile.educationExperiences.map((edu, index) => (
                  <div key={edu.id} className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-700">Education #{index + 1}</h4>
                      {isEditMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-500"
                          onClick={() => handleRemoveEducation(edu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">Institution</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => handleUpdateEducation(edu.id, "institution", e.target.value)}
                            className="bg-white border-gray-300"
                            placeholder="IIT Mumbai"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">Degree</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => handleUpdateEducation(edu.id, "degree", e.target.value)}
                            className="bg-white border-gray-300"
                            placeholder="B.Tech Computer Science"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">Start Year</Label>
                          <Select
                            value={edu.startYear}
                            onValueChange={(value) => handleUpdateEducation(edu.id, "startYear", value)}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 text-sm">End Year</Label>
                          <Select
                            value={edu.endYear}
                            onValueChange={(value) => handleUpdateEducation(edu.id, "endYear", value)}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900 mb-1">
                          {edu.degree}
                        </p>
                        <p className="text-sm text-gray-600">
                          {edu.institution} • {edu.startYear} - {edu.endYear}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Housing Tab */}
          <TabsContent value="housing" className="mt-4 space-y-4">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Home className="w-5 h-5" />
                  Housing Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">I'm looking for</Label>
                    {isEditMode ? (
                      <Select
                        value={currentProfile.housingPreferences?.lookingFor || ""}
                        onValueChange={(value) => handleHousingPreferenceChange("lookingFor", value)}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open To Both">Open To Both</SelectItem>
                          <SelectItem value="Flat">Flat</SelectItem>
                          <SelectItem value="Flatmate">Flatmate</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={currentProfile.housingPreferences?.lookingFor || "Open To Both"} className="bg-gray-50 border-gray-300" readOnly />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Budget Range</Label>
                    {isEditMode ? (
                      <Input
                        value={currentProfile.housingPreferences?.budgetRange || ""}
                        onChange={(e) => handleHousingPreferenceChange("budgetRange", e.target.value)}
                        className="bg-white border-gray-300"
                        placeholder="₹15,000 - ₹30,000"
                      />
                    ) : (
                      <Input value={currentProfile.housingPreferences?.budgetRange || "₹15,000 - ₹30,000"} className="bg-gray-50 border-gray-300" readOnly />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Moving Date</Label>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={currentProfile.housingPreferences?.movingDate || ""}
                        onChange={(e) => handleHousingPreferenceChange("movingDate", e.target.value)}
                        className="bg-white border-gray-300"
                      />
                    ) : (
                      <Input value={currentProfile.housingPreferences?.movingDate || "2/1/2024"} className="bg-gray-50 border-gray-300" readOnly />
                    )}
                  </div>
                  <div className="space-y-2 relative" ref={locationDropdownRef}>
                    <Label className="text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Preferred Location
                    </Label>
                    {isEditMode ? (
                      <div className="relative">
                        <Input
                          ref={locationInputRef}
                          value={locationSearchQuery}
                          onChange={(e) => {
                            setLocationSearchQuery(e.target.value);
                            handleHousingPreferenceChange("preferredLocation", e.target.value);
                          }}
                          className="bg-white border-gray-300"
                          placeholder="Search for location..."
                        />
                        {locationSearchResults.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {locationSearchResults.map((place, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleSelectLocation(place)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <p className="text-sm font-medium text-gray-900">{place.place_name}</p>
                                {place.context && (
                                  <p className="text-xs text-gray-500">
                                    {place.context.map((ctx: any) => ctx.text).join(", ")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {isSearchingLocation && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input value={currentProfile.housingPreferences?.preferredLocation || "Andheri West, Mumbai"} className="bg-gray-50 border-gray-300" readOnly />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Search Radius</Label>
                    {isEditMode ? (
                      <Input
                        value={currentProfile.housingPreferences?.searchRadius || ""}
                        onChange={(e) => handleHousingPreferenceChange("searchRadius", e.target.value)}
                        className="bg-white border-gray-300"
                        placeholder="10 km"
                      />
                    ) : (
                      <Input value={currentProfile.housingPreferences?.searchRadius || "10 km"} className="bg-gray-50 border-gray-300" readOnly />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Flat Type Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {flatTypeOptions.map((type) => {
                      const isSelected = currentProfile.housingPreferences?.flatTypes?.includes(type) || false;
                      return isEditMode ? (
                        <Badge
                          key={type}
                          className={cn(
                            "cursor-pointer",
                            isSelected ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-700 border-gray-300"
                          )}
                          onClick={() => {
                            const current = currentProfile.housingPreferences?.flatTypes || [];
                            handleHousingPreferenceChange("flatTypes", toggleArrayItem(current, type));
                          }}
                        >
                          {type}
                        </Badge>
                      ) : (
                        <Badge key={type} className={isSelected ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-700 border-gray-300"}>
                          {type}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Room Type Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {roomTypeOptions.map((type) => {
                      const isSelected = currentProfile.housingPreferences?.roomTypes?.includes(type) || false;
                      return isEditMode ? (
                        <Badge
                          key={type}
                          variant="outline"
                          className={cn(
                            "cursor-pointer",
                            isSelected ? "bg-pink-500 text-white border-pink-500" : "bg-gray-100 text-gray-700 border-gray-300"
                          )}
                          onClick={() => {
                            const current = currentProfile.housingPreferences?.roomTypes || [];
                            handleHousingPreferenceChange("roomTypes", toggleArrayItem(current, type));
                          }}
                        >
                          {type}
                        </Badge>
                      ) : (
                        <Badge key={type} variant="outline" className={isSelected ? "bg-pink-500 text-white border-pink-500" : "bg-gray-100 text-gray-700 border-gray-300"}>
                          {type}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Amenity Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => {
                      const isSelected = currentProfile.housingPreferences?.amenities?.includes(amenity) || false;
                      return isEditMode ? (
                        <Badge
                          key={amenity}
                          className={cn(
                            "cursor-pointer",
                            isSelected ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-700 border-gray-300"
                          )}
                          onClick={() => {
                            const current = currentProfile.housingPreferences?.amenities || [];
                            handleHousingPreferenceChange("amenities", toggleArrayItem(current, amenity));
                          }}
                        >
                          {amenity}
                        </Badge>
                      ) : (
                        <Badge key={amenity} className={isSelected ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-700 border-gray-300"}>
                          {amenity}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Home className="w-5 h-5" />
                  My Flat Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Flat Address
                  </Label>
                  {isEditMode ? (
                    <Input
                      value={currentProfile.flatDetails?.address || ""}
                      onChange={(e) => handleFlatDetailChange("address", e.target.value)}
                      className="bg-white border-gray-300"
                      placeholder="Enter flat address"
                    />
                  ) : (
                    <Input 
                      value={currentProfile.flatDetails?.address || "402, Sunshine Apartments, Lokhandwala Complex, Andheri West, Mumbai - 400053"} 
                      className="bg-gray-50 border-gray-300" 
                      readOnly 
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Description</Label>
                  {isEditMode ? (
                    <Textarea
                      value={currentProfile.flatDetails?.description || ""}
                      onChange={(e) => handleFlatDetailChange("description", e.target.value)}
                      className="bg-white border-gray-300 min-h-[80px]"
                      placeholder="Enter description"
                    />
                  ) : (
                    <Textarea 
                      value={currentProfile.flatDetails?.description || "Spacious 3BHK apartment in a prime location with great connectivity. Looking for working professionals or students."}
                      className="bg-gray-50 border-gray-300 min-h-[80px]"
                      readOnly
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Common Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => {
                      const isSelected = currentProfile.flatDetails?.commonAmenities?.includes(amenity) || false;
                      return isEditMode ? (
                        <Badge
                          key={amenity}
                          className={cn(
                            "cursor-pointer",
                            isSelected ? "bg-pink-100 text-pink-700 border-pink-200" : "bg-gray-100 text-gray-700 border-gray-300"
                          )}
                          onClick={() => {
                            const current = currentProfile.flatDetails?.commonAmenities || [];
                            handleFlatDetailChange("commonAmenities", toggleArrayItem(current, amenity));
                          }}
                        >
                          {amenity}
                        </Badge>
                      ) : (
                        <Badge key={amenity} className={isSelected ? "bg-pink-100 text-pink-700 border-pink-200" : "bg-gray-100 text-gray-700 border-gray-300"}>
                          {amenity}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700 font-semibold">Available Rooms</Label>
                  
                  {currentProfile.flatDetails?.rooms?.map((room, index) => (
                    <div key={room.id} className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                      <h4 className="font-semibold text-gray-900 mb-2">Room #{index + 1} - {room.roomType}</h4>
                      {isEditMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm">Room Type</Label>
                            <Select
                              value={room.roomType}
                              onValueChange={(value) => {
                                const updatedRooms = currentProfile.flatDetails?.rooms?.map(r =>
                                  r.id === room.id ? { ...r, roomType: value } : r
                                ) || [];
                                handleFlatDetailChange("rooms", updatedRooms);
                              }}
                            >
                              <SelectTrigger className="bg-white border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Private Room">Private Room</SelectItem>
                                <SelectItem value="Shared Room">Shared Room</SelectItem>
                                <SelectItem value="Studio">Studio</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm">Rent (₹/mo)</Label>
                            <Input
                              value={room.rent}
                              onChange={(e) => {
                                const updatedRooms = currentProfile.flatDetails?.rooms?.map(r =>
                                  r.id === room.id ? { ...r, rent: e.target.value } : r
                                ) || [];
                                handleFlatDetailChange("rooms", updatedRooms);
                              }}
                              className="bg-white border-gray-300"
                              placeholder="18000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm">Deposit (₹)</Label>
                            <Input
                              value={room.deposit}
                              onChange={(e) => {
                                const updatedRooms = currentProfile.flatDetails?.rooms?.map(r =>
                                  r.id === room.id ? { ...r, deposit: e.target.value } : r
                                ) || [];
                                handleFlatDetailChange("rooms", updatedRooms);
                              }}
                              className="bg-white border-gray-300"
                              placeholder="36000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm">Brokerage (₹)</Label>
                            <Input
                              value={room.brokerage}
                              onChange={(e) => {
                                const updatedRooms = currentProfile.flatDetails?.rooms?.map(r =>
                                  r.id === room.id ? { ...r, brokerage: e.target.value } : r
                                ) || [];
                                handleFlatDetailChange("rooms", updatedRooms);
                              }}
                              className="bg-white border-gray-300"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm">Available From</Label>
                            <Input
                              type="date"
                              value={room.available}
                              onChange={(e) => {
                                const updatedRooms = currentProfile.flatDetails?.rooms?.map(r =>
                                  r.id === room.id ? { ...r, available: e.target.value } : r
                                ) || [];
                                handleFlatDetailChange("rooms", updatedRooms);
                              }}
                              className="bg-white border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm">Quantity</Label>
                            <Input
                              value={room.quantity}
                              onChange={(e) => {
                                const updatedRooms = currentProfile.flatDetails?.rooms?.map(r =>
                                  r.id === room.id ? { ...r, quantity: e.target.value } : r
                                ) || [];
                                handleFlatDetailChange("rooms", updatedRooms);
                              }}
                              className="bg-white border-gray-300"
                              placeholder="1"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-gray-700 text-sm">Room Amenities</Label>
                            <div className="flex flex-wrap gap-2">
                              {["AC", "Attached Bathroom", "Study Table", "Wardrobe", "Geyser"].map((amenity) => {
                                const isSelected = room.amenities?.includes(amenity) || false;
                                return (
                                  <Badge
                                    key={amenity}
                                    variant="outline"
                                    className={cn(
                                      "cursor-pointer text-xs",
                                      isSelected ? "bg-pink-100 border-pink-300" : "bg-white border-gray-300"
                                    )}
                                    onClick={() => {
                                      const current = room.amenities || [];
                                      const updatedAmenities = toggleArrayItem(current, amenity);
                                      const updatedRooms = currentProfile.flatDetails?.rooms?.map(r =>
                                        r.id === room.id ? { ...r, amenities: updatedAmenities } : r
                                      ) || [];
                                      handleFlatDetailChange("rooms", updatedRooms);
                                    }}
                                  >
                                    {amenity}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>Rent: ₹{parseInt(room.rent || "0").toLocaleString()}/mo</p>
                          <p>Deposit: ₹{parseInt(room.deposit || "0").toLocaleString()}</p>
                          <p>Brokerage: {room.brokerage === "0" ? "No Brokerage" : `₹${parseInt(room.brokerage || "0").toLocaleString()}`}</p>
                          <p>Available: {room.available}</p>
                          <p>Qty: {room.quantity}</p>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {room.amenities.map((amenity) => (
                                <Badge key={amenity} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="mt-4 space-y-4">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Heart className="w-5 h-5" />
                  My Habits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {myHabits.map((habit, idx) => (
                    <Badge key={idx} className="bg-pink-100 text-pink-700 border-pink-200">
                      {habit}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Heart className="w-5 h-5" />
                  Looking For in Flatmate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lookingForInFlatmate.map((pref, idx) => (
                    <Badge key={idx} variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                      {pref}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-4">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Matching Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchingPreferences.map((pref) => (
                  <div key={pref.id} className="bg-pink-50 rounded-lg p-4 border border-pink-200 flex items-start gap-4">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{pref.id}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">{pref.title}</h4>
                      <p className="text-sm text-gray-600">{pref.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Bookmark className="w-5 h-5 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">Saved Profiles ({savedProfiles.length})</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedProfiles.map((savedProfile) => (
                  <Card key={savedProfile.id} className="bg-white shadow-sm border border-gray-200 relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={savedProfile.profilePicture || "https://randomuser.me/api/portraits/women/44.jpg"}
                          alt={savedProfile.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{savedProfile.name}</h3>
                              <p className="text-sm text-gray-600">
                                {savedProfile.age} years • {savedProfile.city}, {savedProfile.state}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              onClick={() => {
                                setSavedProfiles(prev => prev.filter(p => p.id !== savedProfile.id));
                                toast({ title: "Profile removed from saved" });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Badge className="bg-pink-500 text-white mb-3">
                            {savedProfile.searchType === "flatmate" ? "Has Flat" : "Looking for Flat"}
                          </Badge>
                          <div className="flex flex-wrap gap-2">
                            {(savedProfile.myHabits || []).slice(0, 3).map((habit, idx) => (
                              <Badge key={idx} variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                {habit}
                              </Badge>
                            ))}
                            {(savedProfile.myHabits || []).length > 3 && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                +{(savedProfile.myHabits || []).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
