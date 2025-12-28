"use client";

import { useState } from "react";
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
  User, Phone, Mail, Briefcase, BookOpen, Bookmark, Share2, Edit2, X, Save, Camera, Heart, Trash2, Home, MapPin
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/component/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/component/ui/dialog";
import { Copy, Check } from "lucide-react";

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
};

export const ProfilePage = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(mockUserProfile);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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
  
  const [savedProfiles, setSavedProfiles] = useState([
    mockProfiles[0], // Sarah Johnson
    priyaProfile // Priya Patel
  ]);
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

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to save the profile
    setProfile({ ...editedProfile });
      setIsEditMode(false);
    toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (err) {
      toast({
        title: "Failed to save",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile(prev => ({
          ...prev,
          profilePictureUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const currentProfile = isEditMode ? editedProfile : profile;

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
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
                <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Briefcase className="w-5 h-5" />
                    Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.jobExperiences.map((exp, index) => (
                  <div key={exp.id} className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Experience #{index + 1}</h4>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">
                      {exp.position} at {exp.company}
                    </p>
                    <p className="text-sm text-gray-600">
                      {exp.fromYear} - {exp.currentlyWorking ? "Present" : exp.tillYear}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Education Card */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                    <BookOpen className="w-5 h-5" />
                    Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.educationExperiences.map((edu, index) => (
                  <div key={edu.id} className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Education #{index + 1}</h4>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">
                      {edu.degree}
                    </p>
                    <p className="text-sm text-gray-600">
                      {edu.institution} • {edu.startYear} - {edu.endYear}
                    </p>
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
                    <Input value="Open To Both" className="bg-gray-50 border-gray-300" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Budget Range</Label>
                    <Input value="₹15,000 - ₹30,000" className="bg-gray-50 border-gray-300" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Moving Date</Label>
                    <Input value="2/1/2024" className="bg-gray-50 border-gray-300" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Preferred Location
                    </Label>
                    <Input value="Andheri West, Mumbai" className="bg-gray-50 border-gray-300" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Search Radius</Label>
                    <Input value="10 km" className="bg-gray-50 border-gray-300" readOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Flat Type Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-pink-500 text-white">1 BHK</Badge>
                    <Badge className="bg-pink-500 text-white">2 BHK</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Room Type Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Private Room</Badge>
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Shared Room</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Amenity Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-pink-500 text-white">WiFi</Badge>
                    <Badge className="bg-pink-500 text-white">Gym</Badge>
                    <Badge className="bg-pink-500 text-white">Parking</Badge>
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
                  <Input 
                    value="402, Sunshine Apartments, Lokhandwala Complex, Andheri West, Mumbai - 400053" 
                    className="bg-gray-50 border-gray-300" 
                    readOnly 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Description</Label>
                  <Textarea 
                    value="Spacious 3BHK apartment in a prime location with great connectivity. Looking for working professionals or students."
                    className="bg-gray-50 border-gray-300 min-h-[80px]"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Common Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-pink-100 text-pink-700 border-pink-200">WiFi</Badge>
                    <Badge className="bg-pink-100 text-pink-700 border-pink-200">Parking</Badge>
                    <Badge className="bg-pink-100 text-pink-700 border-pink-200">Gym</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700 font-semibold">Available Rooms</Label>
                  
                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Room #1 - Private Room</h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>Rent: ₹18,000/mo</p>
                      <p>Deposit: ₹36,000</p>
                      <p>Brokerage: No Brokerage</p>
                      <p>Available: 2/15/2024</p>
                      <p>Qty: 2</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">AC</Badge>
                        <Badge variant="outline" className="text-xs">Attached Bathroom</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Room #2 - Shared Room</h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>Rent: ₹10,000/mo</p>
                      <p>Deposit: ₹20,000</p>
                      <p>Brokerage: ₹5,000</p>
                      <p>Available: 2/1/2024</p>
                      <p>Qty: 1</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">AC</Badge>
                      </div>
                    </div>
                  </div>
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
