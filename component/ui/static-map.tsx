"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { Plus, Minus } from "lucide-react";

interface StaticMapProps {
    latitude: number;
    longitude: number;
    mapboxToken?: string;
    height?: string;
    className?: string;
}

export const StaticMap = ({
    latitude,
    longitude,
    mapboxToken,
    height = "100%",
    className = "",
}: StaticMapProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);
    const marker = useRef<any>(null);
    const [mapLoading, setMapLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    const handleZoomIn = () => {
        if (map.current) {
            map.current.zoomIn({ duration: 300 });
        }
    };

    const handleZoomOut = () => {
        if (map.current) {
            map.current.zoomOut({ duration: 300 });
        }
    };

    useEffect(() => {
        if (!mapContainer.current || !mapboxToken || map.current) {
            if (!mapboxToken) {
                setMapError("Mapbox token not configured");
                setMapLoading(false);
            }
            return;
        }

        const initMap = async () => {
            if (!mapContainer.current || mapContainer.current.offsetWidth === 0 || mapContainer.current.offsetHeight === 0) {
                setTimeout(initMap, 100);
                return;
            }

            try {
                setMapLoading(true);
                setMapError(null);

                const mapboxgl = (await import("mapbox-gl")).default;

                // Disable Mapbox telemetry (type-safe workaround)
                if (mapboxgl.config && 'COLLECT_MAPBOX_TELEMETRY' in mapboxgl.config) {
                    (mapboxgl.config as any).COLLECT_MAPBOX_TELEMETRY = false;
                }

                mapboxgl.accessToken = mapboxToken;

                const mapInstance = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: "mapbox://styles/mapbox/streets-v12",
                    center: [longitude, latitude],
                    zoom: 13,
                    interactive: true, // Enable map interaction
                    scrollZoom: true, // Enable scroll to zoom
                    dragPan: true, // Enable dragging
                    dragRotate: false, // Disable rotation
                    touchZoomRotate: true, // Enable touch zoom
                });

                map.current = mapInstance;

                mapInstance.on("load", () => {
                    setMapLoading(false);

                    // Add marker
                    marker.current = new mapboxgl.Marker({
                        color: "#ec4899", // Pink color
                    })
                        .setLngLat([longitude, latitude])
                        .addTo(mapInstance);
                });

                mapInstance.on("error", (e) => {
                    console.error("Mapbox error:", e);
                    setMapError("Failed to load map");
                    setMapLoading(false);
                });

                return () => {
                    if (map.current) {
                        map.current.remove();
                        map.current = null;
                    }
                    marker.current = null;
                };
            } catch (error: any) {
                console.error("Error initializing map:", error);
                setMapError(error.message || "Failed to initialize map");
                setMapLoading(false);
            }
        };

        initMap();
    }, [mapboxToken, latitude, longitude]);

    if (!mapboxToken) {
        return (
            <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ height }}>
                <p className="text-gray-500 text-sm">Map unavailable</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} style={{ height }}>
            <div
                ref={mapContainer}
                className="absolute inset-0 w-full h-full rounded-md"
            />

            {/* Zoom Controls */}
            {!mapLoading && !mapError && (
                <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                    <button
                        onClick={handleZoomIn}
                        className="bg-white hover:bg-gray-100 border border-gray-300 rounded-md p-2 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
                        aria-label="Zoom in"
                        title="Zoom in"
                    >
                        <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="bg-white hover:bg-gray-100 border border-gray-300 rounded-md p-2 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
                        aria-label="Zoom out"
                        title="Zoom out"
                    >
                        <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                </div>
            )}

            {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10 rounded-md">
                    <p className="text-sm text-gray-500">Loading map...</p>
                </div>
            )}
            {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10 rounded-md">
                    <p className="text-xs text-gray-500">{mapError}</p>
                </div>
            )}
        </div>
    );
};
