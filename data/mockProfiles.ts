import { Profile } from "@/component/profile/ProfileCard";

export const mockProfiles: Profile[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    age: "26",
    profilePicture: "https://randomuser.me/api/portraits/women/44.jpg",
    city: "Mumbai",
    state: "Maharashtra",
    searchType: "flatmate",
    myHabits: ["Non-Smoker", "Early Riser", "Vegetarian"],
    flatDetails: {
      address: "123 Park Avenue, Downtown, Mumbai",
      furnishingType: "Fully Furnished",
      commonAmenities: ["WiFi", "Parking", "Gym"],
      commonPhotos: [],
      rooms: [
        {
          id: "1",
          type: "private",
          available: 1,
          rent: "18000",
          securityDeposit: "36000",
          brokerage: "0",
          availableFrom: "2024-02-15",
          furnishingType: "Fully Furnished",
          amenities: ["AC", "Attached Bathroom"],
          photos: []
        }
      ]
    }
  },
  {
    id: "2",
    name: "John Doe",
    age: "28",
    profilePicture: "https://randomuser.me/api/portraits/men/32.jpg",
    city: "Mumbai",
    state: "Maharashtra",
    searchType: "flat",
    myHabits: ["Non-Smoker", "Social"],
  },
  {
    id: "3",
    name: "Jane Smith",
    age: "25",
    profilePicture: "https://randomuser.me/api/portraits/women/28.jpg",
    city: "Mumbai",
    state: "Maharashtra",
    searchType: "flatmate",
    myHabits: ["Pet Friendly", "Clean"],
  },
  {
    id: "4",
    name: "Bob Johnson",
    age: "30",
    profilePicture: "https://randomuser.me/api/portraits/men/45.jpg",
    city: "Mumbai",
    state: "Maharashtra",
    searchType: "flatmate",
    myHabits: ["Work From Home", "Quiet"],
  },
  {
    id: "5",
    name: "Alice Williams",
    age: "27",
    profilePicture: "https://randomuser.me/api/portraits/women/35.jpg",
    city: "Mumbai",
    state: "Maharashtra",
    searchType: "flat",
    myHabits: ["Fitness Enthusiast", "Early Riser"],
  },
];

