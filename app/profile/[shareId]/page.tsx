"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/component/ui/card";
import { Badge } from "@/component/ui/badge";
import { Separator } from "@/component/ui/separator";
import { Button } from "@/component/ui/button";
import { MapPin, Briefcase, GraduationCap, Home, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface ProfileData {
  id: number;
  fullName: string | null;
  age: number | null;
  gender: string | null;
  profilePicture: string | null;
  smoking: string | null;
  drinking: string | null;
  diet: string | null;
  sleepSchedule: string | null;
  workExperiences: Array<{
    id: number;
    company: string | null;
    position: string | null;
    from: string | null;
    till: string | null;
    stillWorking: boolean;
  }>;
  educations: Array<{
    id: number;
    institution: string | null;
    degree: string | null;
    from: string | null;
    till: string | null;
    stillStudying: boolean;
  }>;
  housingDetails: {
    lookingFor: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    movingDate: string | null;
    preferenceLocation: string | null;
    latitude: number | null;
    longitude: number | null;
    searchRadius: number | null;
    roomType: string | null;
    preferredAmenities: string[];
    address: string | null;
    roomsAvailable: number | null;
    totalRooms: number | null;
    rentPerRoom: number | null;
    availableFrom: string | null;
    deposit: number | null;
    availableAmenities: string[];
    description: string | null;
    photosVideos: string[];
  } | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareId) {
      fetchProfile();
    }
  }, [shareId]);

  // Update meta tags for social sharing (WhatsApp preview)
  useEffect(() => {
    if (profile) {
      const title = `${profile.fullName || "User"} - Profile`;
      const description = profile.housingDetails?.description || 
        `${profile.fullName || "User"}'s profile${profile.age ? `, ${profile.age} years old` : ""}`;
      const image = profile.profilePicture || "";
      const url = typeof window !== "undefined" ? window.location.href : "";

      // Update or create meta tags
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) || 
                   document.querySelector(`meta[name="${property}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("property", property);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      // Update title
      document.title = title;

      // Open Graph tags for WhatsApp/Facebook
      updateMetaTag("og:title", title);
      updateMetaTag("og:description", description);
      updateMetaTag("og:image", image);
      updateMetaTag("og:url", url);
      updateMetaTag("og:type", "profile");

      // Twitter Card tags
      updateMetaTag("twitter:card", "summary_large_image");
      updateMetaTag("twitter:title", title);
      updateMetaTag("twitter:description", description);
      updateMetaTag("twitter:image", image);

      // Standard meta tags
      updateMetaTag("description", description);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/share/${shareId}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.message || "Profile not found");
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f2ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f6f2ff] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "The profile you're looking for doesn't exist."}</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const isLookingForFlatmate = profile.housingDetails?.lookingFor === "flatmate";
  const city = profile.housingDetails?.preferenceLocation?.split(",")[0]?.trim() || "";
  const state = profile.housingDetails?.preferenceLocation?.split(",")[1]?.trim() || "";

  return (
    <div className="min-h-screen bg-[#f6f2ff] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-xl bg-white border border-gray-200">
          <CardHeader className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <img
                src={profile.profilePicture || "https://randomuser.me/api/portraits/women/44.jpg"}
                alt={profile.fullName || "User"}
                className="w-20 h-20 rounded-full object-cover border-4 border-pink-200"
              />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{profile.fullName || "Unknown User"}</h2>
                {(city || state) && (
                  <p className="text-gray-600 text-lg">{city}{city && state ? ", " : ""}{state}</p>
                )}
                {profile.age && (
                  <p className="text-gray-600 text-lg">{profile.age} years old</p>
                )}
              </div>
              <div className="ml-auto">
                <Badge className="bg-pink-500 text-white px-4 py-2 text-sm">
                  {isLookingForFlatmate ? "Has Flat" : "Looking for Flat"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <Separator className="my-0" />

          <CardContent className="space-y-6 pt-6 p-6">
            {/* Flat Details (for flatmate search) */}
            {isLookingForFlatmate && profile.housingDetails && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                    <Home className="h-5 w-5 text-pink-500" />
                    Flat Details
                  </h3>

                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5">
                      <div className="p-4 md:col-span-3 space-y-2">
                        {profile.housingDetails.address && (
                          <p className="flex items-start gap-2 text-gray-700">
                            <MapPin className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                            <span className="text-sm">{profile.housingDetails.address}</span>
                          </p>
                        )}
                        {profile.housingDetails.description && (
                          <div>
                            <span className="font-medium text-gray-900 text-sm">Description: </span>
                            <p className="text-gray-700 text-sm">{profile.housingDetails.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-200 h-32 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-300 md:col-span-2">
                        <p className="text-gray-500 text-sm">Map View</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Amenities */}
                {profile.housingDetails.availableAmenities && profile.housingDetails.availableAmenities.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 text-lg">Common/Flat Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.housingDetails.availableAmenities.map((amenity, index) => (
                        <Badge key={index} className="bg-pink-100 text-pink-700 border-pink-200">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Habits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">My Habits</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    profile.smoking,
                    profile.drinking,
                    profile.diet,
                    profile.sleepSchedule,
                  ].filter(Boolean).map((habit, index) => (
                    <Badge key={index} className="bg-pink-100 text-pink-700 border-pink-200">
                      {habit}
                    </Badge>
                  ))}
                  {[
                    profile.smoking,
                    profile.drinking,
                    profile.diet,
                    profile.sleepSchedule,
                  ].filter(Boolean).length === 0 && (
                    <p className="text-sm text-gray-600">No habits added</p>
                  )}
                </div>
              </div>
            </div>

            {/* Work Experience */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                <Briefcase className="h-5 w-5 text-pink-500" />
                Work Experience
              </h3>
              {profile.workExperiences.length === 0 ? (
                <p className="text-sm text-gray-600">No work experience added</p>
              ) : (
                <div className="space-y-3">
                  {profile.workExperiences.map((experience) => (
                    <div key={experience.id} className="border border-gray-200 rounded-lg p-4 space-y-2 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-gray-900">{experience.position || "Position"}</h4>
                          <p className="text-sm text-gray-700">{experience.company || "Company"}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {experience.from ? format(new Date(experience.from), "MMM yyyy") : ""} -{" "}
                        {experience.stillWorking
                          ? "Present"
                          : experience.till
                          ? format(new Date(experience.till), "MMM yyyy")
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                <GraduationCap className="h-5 w-5 text-pink-500" />
                Education
              </h3>
              {profile.educations.length === 0 ? (
                <p className="text-sm text-gray-600">No education added</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.educations.map((education) => (
                    <div key={education.id} className="border border-gray-200 rounded-lg p-4 space-y-2 bg-gray-50">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-900">{education.degree || "Degree"}</h4>
                        <p className="text-sm text-gray-700">{education.institution || "Institution"}</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        {education.from ? format(new Date(education.from), "yyyy") : ""} -{" "}
                        {education.stillStudying
                          ? "Present"
                          : education.till
                          ? format(new Date(education.till), "yyyy")
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

