"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
    GripVertical,
    Users,
    MapPin,
    Briefcase,
    GraduationCap,
    Heart,
    Clock,
    Plus,
    X,
    Star,
} from "lucide-react";

const defaultPreferences = [
    {
        id: "college",
        label: "Same College/University",
        description: "Match with people from your educational institution",
        icon: <GraduationCap className="w-4 h-4" />,
    },
    {
        id: "age",
        label: "Similar Age Group",
        description: "Match with people within 3–5 years of your age",
        icon: <Users className="w-4 h-4" />,
    },
    {
        id: "profession",
        label: "Same Profession Field",
        description: "Match with people with similar career paths",
        icon: <Briefcase className="w-4 h-4" />,
    },
    {
        id: "location",
        label: "Close to Work/Study",
        description: "Prioritize locations near your workplace or university",
        icon: <MapPin className="w-4 h-4" />,
    },
    {
        id: "lifestyle",
        label: "Similar Lifestyle",
        description: "Match on habits like smoking, partying, cleanliness",
        icon: <Heart className="w-4 h-4" />,
    },
    {
        id: "schedule",
        label: "Compatible Schedule",
        description: "Match with people who have similar routines",
        icon: <Clock className="w-4 h-4" />,
    },
];

export const PreferencesStep = ({ data, onUpdate, onSubmit, onBack }) => {
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customLabel, setCustomLabel] = useState("");
    const [customDescription, setCustomDescription] = useState("");

    const preferences =
        data.prioritizedPreferences && data.prioritizedPreferences.length > 0
            ? data.prioritizedPreferences
            : defaultPreferences;

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const arr = Array.from(preferences);
        const [removed] = arr.splice(result.source.index, 1);
        arr.splice(result.destination.index, 0, removed);

        onUpdate({ prioritizedPreferences: arr });
    };

    const handleAddCustomPreference = () => {
        if (!customLabel.trim() || !customDescription.trim()) return;

        const newPref = {
            id: `custom-${Date.now()}`,
            label: customLabel,
            description: customDescription,
            icon: <Star className="w-4 h-4" />,
            isCustom: true,
        };

        onUpdate({
            prioritizedPreferences: [...preferences, newPref],
        });

        setCustomLabel("");
        setCustomDescription("");
        setIsAddingCustom(false);
    };

    const handleRemoveCustomPreference = (id) => {
        const updated = preferences.filter((p) => p.id !== id);
        onUpdate({ prioritizedPreferences: updated });
    };

    const handleCancelAdd = () => {
        setCustomLabel("");
        setCustomDescription("");
        setIsAddingCustom(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Set Your Priorities</h2>
                <p className="text-muted-foreground">
                    Drag and drop to rank what matters most
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Matching Preferences</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Your top preferences influence your match results the most.
                    </p>
                </CardHeader>

                <CardContent>
                    {/* Drag and Drop List */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="preferences">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                                    {preferences.map((pref, index) => (
                                        <Draggable key={pref.id} draggableId={pref.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`flex items-center gap-4 p-4 border rounded-lg bg-card transition
                            ${snapshot.isDragging ? "shadow-lg scale-105" : "shadow-sm"}
                          `}
                                                >
                                                    {/* Rank number + drag handle */}
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                                        >
                                                            {index + 1}
                                                        </Badge>

                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="cursor-grab hover:text-primary"
                                                        >
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>
                                                    </div>

                                                    {/* Icon + text */}
                                                    <div className="flex items-center flex-1 gap-3">
                                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                                            {pref.icon}
                                                        </div>

                                                        <div>
                                                            <h4 className="font-medium">{pref.label}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {pref.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Remove custom */}
                                                    {pref.isCustom && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveCustomPreference(pref.id)}
                                                            className="hover:text-destructive"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}

                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* Add Custom Preference */}
                    <div className="mt-6">
                        {!isAddingCustom ? (
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAddingCustom(true)}
                                    className="flex items-center gap-2 border-dashed border-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Custom Preference
                                </Button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed p-4 rounded-lg space-y-4">
                                <h4 className="font-medium">Add New Preference</h4>

                                <div className="space-y-2">
                                    <Label>Preference Name</Label>
                                    <Input
                                        placeholder="e.g., Similar Music Taste"
                                        value={customLabel}
                                        onChange={(e) => setCustomLabel(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="Describe why this preference matters"
                                        value={customDescription}
                                        onChange={(e) => setCustomDescription(e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleAddCustomPreference}
                                        disabled={!customLabel.trim() || !customDescription.trim()}
                                        size="sm"
                                    >
                                        Add Preference
                                    </Button>

                                    <Button variant="outline" size="sm" onClick={handleCancelAdd}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Info Section */}
            <div className="bg-accent/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">💡 How this works</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• #1 preference gets the highest weight in matching</li>
                    <li>• You can reorder or edit these anytime</li>
                    <li>• Custom preferences personalize your match results</li>
                </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    Back
                </Button>

                <Button className="flex-1 h-12" variant="gradient" onClick={onSubmit}>
                    Complete Profile & Start Matching
                </Button>
            </div>
        </div>
    );
};
