"use client";

import React from "react";
import { Bookmark, MapPin, Home, Send } from "lucide-react";
import { Button } from "@/component/ui/button";
import { Textarea } from "@/component/ui/textarea";
import { Badge } from "@/component/ui/badge";
import { format } from "date-fns";

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
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                  <Bookmark className="w-5 h-5" />
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

