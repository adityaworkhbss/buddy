"use client";

import { Card, CardContent, CardHeader } from "@/component/ui/card";
import { Button } from "@/component/ui/button";
import { Textarea } from "@/component/ui/textarea";
import { Badge } from "@/component/ui/badge";
import { Separator } from "@/component/ui/separator";
import { MapPin, Briefcase, GraduationCap, Home, Send, Bookmark } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

interface Room {
  id: string;
  type: string;
  rent: string;
  available: number;
  brokerage?: string;
  securityDeposit: string;
  availableFrom: string;
  furnishingType: string;
  amenities: string[];
  photos: string[];
}

export interface Profile {
  id: string;
  name: string;
  age: number | string;
  city: string;
  state: string;
  profilePicture: string;
  searchType: "flat" | "flatmate";
  myHabits?: string[];
  lookingForHabits?: string[];
  jobExperiences?: JobExperience[];
  educationExperiences?: EducationExperience[];
  flatDetails?: {
    address: string;
    furnishingType: string;
    description?: string;
    commonAmenities: string[];
    commonPhotos: string[];
    rooms: Room[];
  };
}

interface ProfileCardProps {
  profile: Profile;
  alreadyInConversation?: boolean;
  onSaveProfile?: (profileId: string, saved: boolean) => void;
  isSaved?: boolean;
  distance?: number;
}

export const ProfileCard = ({ 
  profile, 
  alreadyInConversation, 
  onSaveProfile, 
  isSaved = false,
  distance 
}: ProfileCardProps) => {
  const isLookingForFlatmate = profile.searchType === "flatmate";
  const { toast } = useToast();
  const [saved, setSaved] = useState(isSaved);
  const [hasExistingConversation, setHasExistingConversation] = useState(alreadyInConversation ?? false);
  const [isSending, setIsSending] = useState(false);
  
  const [message, setMessage] = useState(
    isLookingForFlatmate
      ? `Hey! ${profile.name}, I'm looking for a place and your listing looks great. Can we talk?`
      : `Hey! ${profile.name}, I've got a flat vacancy. Want to know the details?`
  );

  // Check if conversation exists on mount
  useEffect(() => {
    checkConversationExists();
  }, [profile.id]);

  const checkConversationExists = async () => {
    try {
      const meResponse = await fetch("/api/user/me");
      const meData = await meResponse.json();
      
      if (!meData.success || !meData.user) return;

      const conversationsResponse = await fetch(`/api/messages/conversations?userId=${meData.user.id}`);
      const conversationsData = await conversationsResponse.json();

      if (conversationsData.success) {
        const hasConv = conversationsData.conversations.some(
          (conv: any) => conv.otherUserId === parseInt(profile.id)
        );
        setHasExistingConversation(hasConv || alreadyInConversation);
      }
    } catch (error) {
      console.error("Error checking conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      
      // Get current user ID
      const meResponse = await fetch("/api/user/me");
      const meData = await meResponse.json();
      
      if (!meData.success || !meData.user) {
        toast({
          title: "Error",
          description: "Failed to get user information",
          variant: "destructive",
        });
        return;
      }

      const currentUserId = meData.user.id;
      const receiverId = parseInt(profile.id);

      // Create or get conversation and send message
      const formData = new FormData();
      formData.append("senderId", currentUserId.toString());
      formData.append("receiverId", receiverId.toString());
      formData.append("content", message);
      formData.append("type", "text");

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Message Sent!",
          description: `Your message has been sent to ${profile.name}`,
        });
        setMessage("");
        setHasExistingConversation(true);
        // Optionally trigger a callback to update conversation status
        if (onSaveProfile) {
          onSaveProfile(profile.id, true); // Mark as in conversation
        }
      } else {
        throw new Error(result.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveProfile = () => {
    const newSavedState = !saved;
    setSaved(newSavedState);
    onSaveProfile?.(profile.id, newSavedState);
    toast({
      title: newSavedState ? "Profile Saved" : "Profile Removed",
      description: newSavedState 
        ? `${profile.name}'s profile has been saved.`
        : `${profile.name}'s profile has been removed from saved.`,
    });
  };

  const ageDisplay = typeof profile.age === "number" ? profile.age : parseInt(profile.age) || profile.age;

  return (
    <Card className="shadow-lg bg-white">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={profile.profilePicture || "https://randomuser.me/api/portraits/women/44.jpg"} 
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-pink-200"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-600">{profile.city}, {profile.state}</p>
              <p className="text-gray-600 text-lg">
                {ageDisplay} years old{distance ? ` • ${distance}km away` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={saved ? "default" : "outline"}
              size="icon"
              onClick={handleSaveProfile}
              className="h-10 w-10"
            >
              <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
            </Button>
            <Badge variant={isLookingForFlatmate ? "default" : "secondary"} className="h-8 px-4 bg-pink-500 text-white">
              {isLookingForFlatmate ? "Has Flat" : "Looking for Flat"}
            </Badge>
          </div>
        </div>

        {/* Message Box */}
        <div className="space-y-2">
          {hasExistingConversation ? (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
              <p className="text-gray-700">
                You are in conversation with <span className="font-semibold text-gray-900">{profile.name}</span>
              </p>
            </div>
          ) : (
            <>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] resize-none"
                placeholder="Type your message..."
              />
              <Button 
                onClick={handleSendMessage} 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                size="lg"
                disabled={isSending || !message.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 pt-6 max-h-[calc(100vh-400px)] overflow-y-auto">
        {/* Flat Details (for flatmate search) */}
        {isLookingForFlatmate && profile.flatDetails && (
          <div className="space-y-6">
            {/* Flat Details - Address & Map */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Home className="h-5 w-5 text-pink-500" />
                Flat Details
              </h3>
              
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-5">
                  {/* Address & Furnishing */}
                  <div className="p-4 md:col-span-3 space-y-2">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-pink-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{profile.flatDetails.address}</span>
                    </p>
                    <div>
                      <span className="font-medium text-gray-900 text-sm">Furnishing: </span>
                      <Badge variant="outline">{profile.flatDetails.furnishingType || "Furnished"}</Badge>
                    </div>
                    {profile.flatDetails.description && (
                      <p className="text-sm text-gray-600 mt-2">{profile.flatDetails.description}</p>
                    )}
                  </div>

                  {/* Location Map */}
                  <div className="bg-gray-200 h-32 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-300 md:col-span-2">
                    <p className="text-gray-500 text-sm">Map View</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rooms Available */}
            {profile.flatDetails.rooms && profile.flatDetails.rooms.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Available Rooms</h4>
                {profile.flatDetails.rooms.map((room) => (
                  <div key={room.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <h5 className="font-semibold text-gray-900">{room.type}</h5>
                      <Badge variant="default" className="bg-pink-500">{room.available || 1} Available</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Rent:</span>
                        <p className="text-gray-600">{room.rent}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Security Deposit:</span>
                        <p className="text-gray-600">{room.securityDeposit}</p>
                      </div>
                      {room.brokerage && (
                        <div>
                          <span className="font-medium text-gray-900">Brokerage:</span>
                          <p className="text-gray-600">{room.brokerage}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-900">Available From:</span>
                        <p className="text-gray-600">
                          {room.availableFrom ? format(new Date(room.availableFrom), "MMM d, yyyy") : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Furnishing Type:</span>
                        <p className="text-gray-600">{room.furnishingType || "Furnished"}</p>
                      </div>
                    </div>

                    {/* Room Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium text-gray-900">Room Amenities</h6>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity) => (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Room Photos */}
                    {room.photos && room.photos.length > 0 && (
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium text-gray-900">Room Photos</h6>
                        <div className="grid grid-cols-3 gap-2">
                          {room.photos.map((photo, idx) => (
                            <div key={idx} className="bg-gray-200 aspect-video rounded-lg" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Common Amenities & Photos */}
            {profile.flatDetails.commonAmenities && profile.flatDetails.commonAmenities.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Common/Flat Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.flatDetails.commonAmenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>

                {/* Common Photos */}
                {profile.flatDetails.commonPhotos && profile.flatDetails.commonPhotos.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-sm font-medium text-gray-900">Common Area Photos</h6>
                    <div className="grid grid-cols-3 gap-2">
                      {profile.flatDetails.commonPhotos.map((photo, idx) => (
                        <div key={idx} className="bg-gray-200 aspect-video rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* My Habits & Looking For - Side by Side */}
        {(profile.myHabits || profile.lookingForHabits) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Habits */}
            {profile.myHabits && profile.myHabits.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">My Habits</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.myHabits.map((habit) => (
                    <Badge key={habit} variant="secondary">
                      {habit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Looking For Habits */}
            {profile.lookingForHabits && profile.lookingForHabits.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Looking For in Flatmate</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.lookingForHabits.map((habit) => (
                    <Badge key={habit} variant="default" className="bg-pink-500">
                      {habit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Work Experience */}
        {profile.jobExperiences && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <Briefcase className="h-5 w-5 text-pink-500" />
              Work Experience
            </h3>
            {!profile.jobExperiences || profile.jobExperiences.length === 0 ? (
              <p className="text-sm text-gray-600">No work experience added</p>
            ) : (
              <div className="space-y-3">
                {profile.jobExperiences.map((experience) => (
                  <div key={experience.id} className="border rounded-lg p-4 space-y-2 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-900">{experience.position}</h4>
                        <p className="text-sm text-gray-600">{experience.company}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {experience.fromYear} - {experience.currentlyWorking ? 'Present' : experience.tillYear}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Education */}
        {profile.educationExperiences && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <GraduationCap className="h-5 w-5 text-pink-500" />
              Education
            </h3>
            {!profile.educationExperiences || profile.educationExperiences.length === 0 ? (
              <p className="text-sm text-gray-600">No education added</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.educationExperiences.map((education) => (
                  <div key={education.id} className="border rounded-lg p-4 space-y-2 bg-gray-50">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900">{education.degree}</h4>
                      <p className="text-sm text-gray-600">{education.institution}</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      {education.startYear} - {education.endYear}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
