"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PersonalInfoStep } from "./personalInfoStep";
import { HousingDetailsStep } from "./housingDetailStep";
import { PreferencesStep } from "./preferenceStep";
import { Progress } from "../ui/progress";
import { Card, CardContent } from "../ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

export const Signup = ({ onComplete }) => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isComplete, setIsComplete] = useState(false);
    const { toast } = useToast();

    const [signupData, setSignupData] = useState({
        personalInfo: {
            name: "",
            age: "",
            gender: "",
            phone: "",
            email: "",
            profilePicture: null,
            phoneVerified: false,
            jobExperiences: [],
            educationExperiences: []
        },
        housingDetails: {
            searchType: "flat",
            budget: [10000, 25000],
            location: "",
            locationCoords: undefined,
            radius: 5,
            movingDate: "",
            roomType: "",
            amenityPreferences: [],
            flatDetails: {
                address: "",
                roomsAvailable: "",
                totalRooms: "",
                rent: "",
                deposit: "",
                availableFrom: "",
                amenities: [],
                description: "",
                media: []
            }
        },
        preferences: {
            prioritizedPreferences: []
        }
    });

    const handlePersonalInfoUpdate = (data) => {
        setSignupData((prev) => ({ ...prev, personalInfo: data }));
    };

    const handleHousingDetailsUpdate = (data) => {
        setSignupData((prev) => ({ ...prev, housingDetails: data }));
    };

    const handlePreferencesUpdate = (data) => {
        setSignupData((prev) => ({ ...prev, preferences: data }));
    };

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        } else if (currentStep === 2) {
            // If we're on step 2 and clicking next, complete the signup
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        console.log("Signup completed with data:", signupData);
        setIsComplete(true);

        toast({
            title: "Profile Created Successfully! 🎉",
            description: "You can now start discovering potential flatmates.",
        });

        setTimeout(() => {
            if (onComplete) onComplete();
            // Redirect to dashboard after successful registration
            router.push("/dashboard");
        }, 2000);
    };

    const progressValue = (currentStep / 2) * 100;

    if (isComplete) {
        return (
            <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 bg-gradient-to-r from-pink-600 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-gray-800">Welcome to Buddy!</h2>
                        <p className="text-gray-500">
                            Your profile has been created successfully. You can now start discovering compatible flatmates in your area.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4">
                        <p className="text-sm font-semibold text-gray-700">What's next?</p>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-center justify-center gap-2">
                                <span className="text-lg">✨</span> Browse potential matches
                            </li>
                            <li className="flex items-center justify-center gap-2">
                                <span className="text-lg">💬</span> Start conversations
                            </li>
                            <li className="flex items-center justify-center gap-2">
                                <span className="text-lg">🏠</span> Find your perfect flatmate
                            </li>
                        </ul>
                    </div>
                </div>
        );
    }

    return (
        <div className="w-full max-w-2xl">
            {/* Header */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Join Buddy</h1>
                    <p className="text-gray-500 text-lg">Find your perfect flatmate in 2 simple steps</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 space-y-3 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between text-sm mb-2">
                        <span className={`transition-colors font-medium ${
                            currentStep >= 1 ? "text-pink-600" : "text-gray-400"
                        }`}>
                            Personal Info
                        </span>
                        <span className={`transition-colors font-medium ${
                            currentStep >= 2 ? "text-pink-600" : "text-gray-400"
                        }`}>
                            Housing Details
                        </span>
                    </div>

                    {/* Custom Progress Bar with Gradient */}
                    <div className="relative h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-600 to-red-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>

                    <div className="text-center text-sm text-gray-500 font-medium">
                        Step {currentStep} of 2
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8">
                        {currentStep === 1 && (
                            <PersonalInfoStep
                                data={signupData.personalInfo}
                                onUpdate={handlePersonalInfoUpdate}
                                onNext={handleNext}
                            />
                        )}

                        {currentStep === 2 && (
                            <HousingDetailsStep
                                data={signupData.housingDetails}
                                onUpdate={handleHousingDetailsUpdate}
                                onNext={handleNext}
                                onBack={handleBack}
                                personalInfo={signupData.personalInfo}
                            />
                        )}

                        {/*{currentStep === 3 && (*/}
                        {/*    <PreferencesStep*/}
                        {/*        data={signupData.preferences}*/}
                        {/*        onUpdate={handlePreferencesUpdate}*/}
                        {/*        onSubmit={handleSubmit}*/}
                        {/*        onBack={handleBack}*/}
                        {/*    />*/}
                        {/*)}*/}
                    </div>
                </div>
        </div>
    );
};
