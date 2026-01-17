"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { MapPin } from "lucide-react";

export const LocationMap = ({
    location,
    radius,
    onLocationChange,
    onRadiusChange,
    mapboxToken,
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);

    const [mapLoading, setMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [currentCoords, setCurrentCoords] = useState([77.209, 28.6139]); // [lng, lat] - Default Delhi

    const radiusCircleId = "radius-circle";

    // Initialize Mapbox map
    useEffect(() => {
        if (!mapContainer.current || !mapboxToken || map.current) {
            if (!mapboxToken) {
                setMapError("Mapbox token is required");
                setMapLoading(false);
            }
            return;
        }

        // Wait for container to have dimensions
        const initMap = async () => {
            // Check container dimensions
            if (mapContainer.current.offsetWidth === 0 || mapContainer.current.offsetHeight === 0) {
                setTimeout(initMap, 100);
                return;
            }

            try {
                setMapLoading(true);
                setMapError(null);

                // Dynamically import Mapbox GL
                const mapboxgl = (await import("mapbox-gl")).default;

                // Disable telemetry
                if (mapboxgl.config) {
                    mapboxgl.config.COLLECT_MAPBOX_TELEMETRY = false;
                }

                // Set access token
                mapboxgl.accessToken = mapboxToken;

                // Create map
                const mapInstance = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: "mapbox://styles/mapbox/streets-v12",
                    center: currentCoords,
                    zoom: 12,
                });

                map.current = mapInstance;

                // Wait for map to load
                mapInstance.on("load", () => {
                    setMapLoading(false);

                    // Add navigation controls
                    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

                    // Get theme primary color
                    const primaryColor = getComputedStyle(document.documentElement)
                        .getPropertyValue('--pink-500').trim();
                    const hslValues = primaryColor.split(' ');
                    const markerColor = hslValues.length === 3
                        ? `hsl(${hslValues[0]}, ${hslValues[1]}, ${hslValues[2]})`
                        : "hsl(358, 100%, 68%)"; // Fallback to pink-500

                    // Create draggable marker
                    marker.current = new mapboxgl.Marker({
                        draggable: true,
                        color: markerColor,
                    })
                        .setLngLat(currentCoords)
                        .addTo(mapInstance);

                    // Handle marker drag
                    marker.current.on("dragend", () => {
                        const lngLat = marker.current.getLngLat();
                        const coords = [lngLat.lng, lngLat.lat];
                        setCurrentCoords(coords);
                        reverseGeocode(coords);
                        drawRadius(coords, radius);
                    });

                    // Handle map click
                    mapInstance.on("click", (e) => {
                        const coords = [e.lngLat.lng, e.lngLat.lat];
                        setCurrentCoords(coords);
                        marker.current.setLngLat(coords);
                        reverseGeocode(coords);
                        drawRadius(coords, radius);
                    });

                    // Draw initial radius
                    drawRadius(currentCoords, radius);

                    // Resize map after a short delay to ensure proper rendering
                    setTimeout(() => {
                        mapInstance.resize();
                    }, 100);
                });

                // Handle map errors
                mapInstance.on("error", (e) => {
                    console.error("Mapbox error:", e);
                    setMapError("Failed to load map. Please check your Mapbox token.");
                    setMapLoading(false);
                });

                // Auto-detect user location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const coords = [pos.coords.longitude, pos.coords.latitude];
                            setCurrentCoords(coords);
                            mapInstance.flyTo({ center: coords, zoom: 13 });
                            updateMarkerAndRadius(coords);
                            reverseGeocode(coords);
                        },
                        () => {
                            console.log("Geolocation blocked — using default location");
                        }
                    );
                }
            } catch (error) {
                console.error("Error initializing map:", error);
                setMapError(error.message || "Failed to initialize map");
                setMapLoading(false);
            }
        };

        initMap();

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            marker.current = null;
        };
    }, [mapboxToken]);

    // Update radius when it changes
    useEffect(() => {
        if (map.current?.isStyleLoaded() && currentCoords) {
            drawRadius(currentCoords, radius);
        }
    }, [radius]);

    // Update marker and radius
    const updateMarkerAndRadius = (coords) => {
        if (marker.current) {
            marker.current.setLngLat(coords);
        }
        if (map.current) {
            map.current.flyTo({ center: coords, zoom: 13 });
        }
        drawRadius(coords, radius);
    };

    // Reverse geocoding
    const reverseGeocode = (coords) => {
        if (!mapboxToken) return;

        fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${mapboxToken}`
        )
            .then((r) => r.json())
            .then((d) => {
                if (d.features?.[0]) {
                    onLocationChange(d.features[0].place_name, coords);
                }
            })
            .catch((err) => console.error("Reverse geocoding error:", err));
    };

    // Draw radius circle
    const drawRadius = (center, radiusKm) => {
        if (!map.current || !map.current.isStyleLoaded()) {
            return;
        }

        const mapObj = map.current;

        try {
            // Remove existing circle
            if (mapObj.getLayer(radiusCircleId)) {
                mapObj.removeLayer(radiusCircleId);
            }
            if (mapObj.getLayer(radiusCircleId + "-outline")) {
                mapObj.removeLayer(radiusCircleId + "-outline");
            }
            if (mapObj.getSource(radiusCircleId)) {
                mapObj.removeSource(radiusCircleId);
            }

            // Calculate circle coordinates
            const radiusInDegrees = radiusKm / 111;
            const points = 64;
            const circleCoords = [];

            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const lng = center[0] + radiusInDegrees * Math.cos(angle);
                const lat = center[1] + radiusInDegrees * Math.sin(angle);
                circleCoords.push([lng, lat]);
            }
            circleCoords.push(circleCoords[0]);

            // Add circle source
            mapObj.addSource(radiusCircleId, {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [circleCoords],
                    },
                },
            });

            // Get theme primary color
            const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--pink-500').trim();
            const hslValues = primaryColor.split(' ');
            const circleColor = hslValues.length === 3
                ? `hsl(${hslValues[0]}, ${hslValues[1]}, ${hslValues[2]})`
                : "hsl(358, 100%, 68%)"; // Fallback to pink-500

            // Add fill layer
            mapObj.addLayer({
                id: radiusCircleId,
                type: "fill",
                source: radiusCircleId,
                paint: {
                    "fill-color": circleColor,
                    "fill-opacity": 0.25,
                },
            });

            // Add outline layer
            mapObj.addLayer({
                id: radiusCircleId + "-outline",
                type: "line",
                source: radiusCircleId,
                paint: {
                    "line-color": circleColor,
                    "line-width": 2,
                },
            });
        } catch (error) {
            console.error("Error drawing radius:", error);
        }
    };

    // Show token input if no token provided
    if (!mapboxToken) {
        return (
            <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Label className="text-sm font-medium">Mapbox Token Required</Label>
                <p className="text-xs text-muted-foreground mb-2 mt-1">
                    Please set NEXT_PUBLIC_MAPBOX_PUBLIC_KEY in your .env.local file
                </p>
                <p className="text-xs text-muted-foreground">
                    Get your token from{" "}
                    <a
                        href="https://account.mapbox.com/access-tokens/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                    >
                        Mapbox
                    </a>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Map Container */}
            <div
                className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border bg-muted"
                style={{ minHeight: "400px" }}
            >
                <div
                    ref={mapContainer}
                    className="absolute inset-0 w-full h-full"
                    style={{ width: "100%", height: "100%" }}
                />
                {mapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                        <p className="text-sm text-muted-foreground">Loading map...</p>
                    </div>
                )}
                {mapError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 z-10">
                        <div className="text-center p-4">
                            <p className="text-sm text-destructive font-medium">{mapError}</p>
                            <p className="text-xs text-muted-foreground mt-1">Please check your Mapbox token</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Radius Slider */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Label>Search Radius</Label>
                    <span className="text-sm">{radius} km</span>
                </div>
                <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={[radius]}
                    onValueChange={(v) => onRadiusChange(v[0])}
                />
            </div>

            {/* Location Display */}
            {location && (
                <div className="flex items-start gap-2 p-3 bg-accent/30 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm">{location}</p>
                </div>
            )}
        </div>
    );
};
