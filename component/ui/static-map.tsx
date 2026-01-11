"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

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

                if (mapboxgl.config) {
                    mapboxgl.config.COLLECT_MAPBOX_TELEMETRY = false;
                }

                mapboxgl.accessToken = mapboxToken;

                const mapInstance = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: "mapbox://styles/mapbox/streets-v12",
                    center: [longitude, latitude],
                    zoom: 13,
                    interactive: false, // Static map - no interaction
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
                className="absolute inset-0 w-full h-full"
            />
            {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
                    <p className="text-sm text-gray-500">Loading map...</p>
                </div>
            )}
            {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
                    <p className="text-xs text-gray-500">{mapError}</p>
                </div>
            )}
        </div>
    );
};
