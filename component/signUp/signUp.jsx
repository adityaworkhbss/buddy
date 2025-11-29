"use client";

import { useState } from "react";
import { PersonalInfoStep } from "./personalInfoStep";
import { HousingDetailsStep } from "./housingDetailStep";
import { PreferencesStep } from "./preferenceStep";
import { Progress } from "../ui/progress";
import { Card, CardContent } from "../ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

export const Signup = ({ onComplete }) => {
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
        }, 2000);
    };

    const progressValue = (currentStep / 3) * 100;

    if (isComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md mx-auto shadow-card animate-fade-in">
                    <CardContent className="p-8 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-primary-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Welcome to Buddy!</h2>
                            <p className="text-muted-foreground">
                                Your profile has been created successfully. You can now start discovering compatible flatmates in your area.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">What's next?</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>✨ Browse potential matches</li>
                                <li>💬 Start conversations</li>
                                <li>🏠 Find your perfect flatmate</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto py-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Join Buddy</h1>
                    <p className="text-muted-foreground">Find your perfect flatmate in 2 simple steps</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>Personal Info</span>
                        <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Housing Details</span>
                        {/*<span className={currentStep >= 3 ? "text-primary font-medium" : ""}>Preferences</span>*/}
                    </div>

                    <Progress value={progressValue} className="h-2" />

                    <div className="text-center text-sm text-muted-foreground">
                        Step {currentStep} of 2
                    </div>
                </div>

                {/* Step Content */}
                <Card className="shadow-card">
                    <CardContent className="p-8">
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
