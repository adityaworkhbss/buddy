import React from "react";

export interface Profile {
  id: string;
  name: string;
  age?: string;
  profilePicture?: string;
  [key: string]: any;
}

interface ProfileCardProps {
  profile: Profile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {profile.profilePicture && (
            <img
              src={profile.profilePicture}
              alt={profile.name}
              className="w-24 h-24 rounded-full mx-auto mb-4"
            />
          )}
          <h3 className="text-xl font-semibold">{profile.name}</h3>
          {profile.age && <p className="text-gray-600">Age: {profile.age}</p>}
        </div>
      </div>
    </div>
  );
};

