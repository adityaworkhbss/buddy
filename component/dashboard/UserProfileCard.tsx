"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, MapPin, Home, Send, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/component/ui/button";
import { Textarea } from "@/component/ui/textarea";
import { Badge } from "@/component/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DiscoveredUser {
  id: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  profilePicture: string;
  city: string;
  state: string;
  distance: number;
  searchType: string;
  flatDetails?: {
    address: string;
    furnishing: string;
    description?: string;
    rooms: Array<{
      id: string;
      roomType: string;
      rent: string;
      securityDeposit: string;
      availableFrom: Date | string;
      amenities: string[];
    }>;
  };
}

interface UserProfileCardProps {
  profile: DiscoveredUser;
  isInConversation: boolean;
  message: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  isInConversation,
  message,
  onMessageChange,
  onSendMessage,
}) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Check if profile is saved on mount
  useEffect(() => {
    checkIfProfileIsSaved();
  }, [profile.id]);

  const handleShareProfile = async () => {
    if (isSharing) return;

    try {
      setIsSharing(true);

      // Get share ID for the profile being viewed
      const shareResponse = await fetch(`/api/user/share?userId=${profile.id}`);

      const shareData = await shareResponse.json();

      if (shareData.success && shareData.shareUrl) {
        // Build formatted text with profile details
        const formattedText = buildShareText(shareData.shareUrl, profile);
        
        // Copy formatted text to clipboard
        await navigator.clipboard.writeText(formattedText);
        
        toast({
          title: "Link Copied!",
          description: "Profile details and link have been copied to clipboard. You can now share it with others.",
        });
      } else {
        throw new Error(shareData.message || "Failed to get share link");
      }
    } catch (error: any) {
      console.error("Error sharing profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate share link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const buildShareText = (shareUrl: string, profileData: DiscoveredUser): string => {
    const age = profileData.age || "N/A";
    const address = profileData.flatDetails?.address || `${profileData.city}, ${profileData.state}` || "N/A";
    
    // Get moving date from flat details (availableFrom in rooms)
    let movingDate = "N/A";
    if (profileData.flatDetails?.rooms && profileData.flatDetails.rooms.length > 0) {
      const firstRoom = profileData.flatDetails.rooms[0];
      if (firstRoom.availableFrom) {
        try {
          const date = typeof firstRoom.availableFrom === "string" 
            ? new Date(firstRoom.availableFrom) 
            : firstRoom.availableFrom;
          movingDate = format(date, "dd MMM yyyy");
        } catch (e) {
          movingDate = typeof firstRoom.availableFrom === "string" 
            ? firstRoom.availableFrom 
            : "N/A";
        }
      }
    }
    
    // Calculate annual rent from rooms
    let annualRent = "N/A";
    if (profileData.flatDetails?.rooms && profileData.flatDetails.rooms.length > 0) {
      const totalMonthlyRent = profileData.flatDetails.rooms.reduce((sum, room) => {
        const rent = parseFloat(room.rent?.replace(/[^0-9.]/g, "") || "0");
        return sum + rent;
      }, 0);
      if (totalMonthlyRent > 0) {
        const annual = totalMonthlyRent * 12;
        annualRent = `₹${annual.toLocaleString("en-IN")}`;
      }
    }

    return `${shareUrl}

Name: ${profileData.name}
Age: ${age}
Address: ${address}
Moving Date: ${movingDate}
Annual Rent: ${annualRent}`;
  };

  const handleShareOnWhatsApp = async () => {
    if (isSharing) return;

    try {
      setIsSharing(true);

      // Get share ID for the profile being viewed
      const shareResponse = await fetch(`/api/user/share?userId=${profile.id}`);

      const shareData = await shareResponse.json();

      if (shareData.success && shareData.shareUrl) {
        const shareText = buildShareText(shareData.shareUrl, profile);
        const encodedText = encodeURIComponent(shareText);
        
        // Open WhatsApp with pre-filled text
        // The image will show as preview if the link has proper Open Graph meta tags
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, "_blank");
        
        toast({
          title: "Opening WhatsApp",
          description: "Share this profile on WhatsApp",
        });
      } else {
        throw new Error(shareData.message || "Failed to get share link");
      }
    } catch (error: any) {
      console.error("Error sharing on WhatsApp:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open WhatsApp. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const checkIfProfileIsSaved = async () => {
    try {
      const savedResponse = await fetch("/api/user/saved-profiles");
      const savedData = await savedResponse.json();

      if (savedData.success) {
        const isSavedProfile = savedData.profiles.some(
          (p: any) => p.id === profile.id
        );
        setIsSaved(isSavedProfile);
      }
    } catch (error) {
      console.error("Error checking if profile is saved:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
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

      if (isSaved) {
        // Unsave the profile
        const response = await fetch(`/api/user/saved-profiles?savedUserId=${profile.id}`, {
          method: "DELETE",
        });
        const result = await response.json();

        if (result.success) {
          setIsSaved(false);
          toast({
            title: "Profile Removed",
            description: `${profile.name}'s profile has been removed from saved.`,
          });
        } else {
          throw new Error(result.message || "Failed to remove saved profile");
        }
      } else {
        // Save the profile
        const response = await fetch("/api/user/saved-profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ savedUserId: profile.id }),
        });
        const result = await response.json();

        if (result.success) {
          setIsSaved(true);
          toast({
            title: "Profile Saved",
            description: `${profile.name}'s profile has been saved.`,
          });
        } else {
          throw new Error(result.message || "Failed to save profile");
        }
      }
    } catch (error: any) {
      console.error("Error saving/unsaving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update saved profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl border border-gray-200 overflow-y-auto max-h-[calc(100vh-300px)]">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-start gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <img
              src={profile.profilePicture || "https://randomuser.me/api/portraits/women/44.jpg"}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-pink-200"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                <p className="text-gray-600 text-lg">
                  {profile.city}, {profile.state}
                </p>
                <p className="text-gray-600 text-lg">
                  {profile.age} years old • {profile.distance}km away
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-600 hover:text-gray-900"
                  onClick={handleShareProfile}
                  disabled={isSharing}
                  title="Copy Profile Link"
                >
                  <Share2 className={`w-5 h-5 ${isSharing ? "animate-spin" : ""}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleShareOnWhatsApp}
                  disabled={isSharing}
                  title="Share on WhatsApp"
                >
                  <MessageCircle className={`w-5 h-5 ${isSharing ? "animate-spin" : ""}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`text-gray-600 hover:text-gray-900 ${isSaved ? "text-pink-500" : ""}`}
                  onClick={handleSaveProfile}
                  title={isSaved ? "Remove from saved" : "Save profile"}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                </Button>
                <Badge className="bg-pink-500 text-white px-4 py-2 text-sm">
                  {profile.searchType === "flatmate" ? "Has Flat" : "Looking for Flat"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Section or Conversation Status */}
      {isInConversation ? (
        <div className="bg-gray-100 rounded-lg p-4 text-center m-6">
          <p className="text-gray-700 text-sm">
            You are in conversation with {profile.name}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 space-y-4 m-6">
          <Textarea
            placeholder={`Hey! ${profile.name}, I'm looking for a place and your listing looks great. Can we talk?`}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            className="min-h-[100px] resize-none border-gray-300"
          />
          <Button
            onClick={onSendMessage}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            size="lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Send Message
          </Button>
        </div>
      )}

      {/* Flat Details Section */}
      {profile.flatDetails && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 m-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Flat Details</h2>
          </div>

          <div className="space-y-4">
            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{profile.flatDetails.address}</p>
            </div>

            {/* Furnishing */}
            <div>
              <p className="text-gray-700">
                <span className="font-medium">Furnishing:</span> {profile.flatDetails.furnishing}
              </p>
            </div>

            {/* Description */}
            {profile.flatDetails.description && (
              <div>
                <p className="text-gray-700">
                  <span className="font-medium">Description:</span> {profile.flatDetails.description}
                </p>
              </div>
            )}

            {/* Map View Placeholder */}
            <div className="mt-4 h-64 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
              <p className="text-gray-500 text-sm">Map View</p>
            </div>
          </div>
        </div>
      )}

      {/* Available Rooms Section */}
      {profile.flatDetails?.rooms && profile.flatDetails.rooms.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 m-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Rooms</h2>
          <div className="space-y-4">
            {profile.flatDetails.rooms.map((room) => (
              <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">
                    {room.roomType === "private" ? "Private Room" : "Shared Room"}
                  </h3>
                  <p className="text-gray-600">₹{parseInt(room.rent || "0").toLocaleString()}/month</p>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Security Deposit: ₹{parseInt(room.securityDeposit || "0").toLocaleString()}</p>
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
  );
};

