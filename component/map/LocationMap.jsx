import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Input } from "../ui/input";
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
    const radiusCircle = useRef(null);

    const [tempToken, setTempToken] = useState(mapboxToken || "");
    const [isTokenSet, setIsTokenSet] = useState(!!mapboxToken);

    const [currentCoords, setCurrentCoords] = useState([77.2090, 28.6139]); // Delhi

    // Initialize Mapbox
    useEffect(() => {
        if (!mapContainer.current || !tempToken) return;

        mapboxgl.accessToken = tempToken;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/streets-v12",
                center: currentCoords,
                zoom: 12,
            });

            map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

            const geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                marker: false,
                placeholder: "Search for your office or preferred location...",
            });

            map.current.addControl(geocoder);

            geocoder.on("result", (e) => {
                const coords = [e.result.center[0], e.result.center[1]];
                setCurrentCoords(coords);
                onLocationChange(e.result.place_name, coords);
                updateMarkerAndCircle(coords);
            });

            marker.current = new mapboxgl.Marker({
                draggable: true,
                color: "#6366f1",
            })
                .setLngLat(currentCoords)
                .addTo(map.current);

            marker.current.on("dragend", () => {
                const lngLat = marker.current.getLngLat();
                const coords = [lngLat.lng, lngLat.lat];
                setCurrentCoords(coords);

                fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${tempToken}`
                )
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.features && data.features[0]) {
                            onLocationChange(data.features[0].place_name, coords);
                        }
                    });
            });

            map.current.on("load", () => {
                updateRadiusCircle(currentCoords, radius);
            });

            setIsTokenSet(true);
        } catch (error) {
            console.error("Error initializing map:", error);
            setIsTokenSet(false);
        }

        return () => {
            map.current?.remove();
        };
    }, [tempToken]);

    // Update circle on radius change
    useEffect(() => {
        if (map.current && map.current.isStyleLoaded()) {
            updateRadiusCircle(currentCoords, radius);
        }
    }, [radius, currentCoords]);

    const updateMarkerAndCircle = (coords) => {
        if (marker.current) {
            marker.current.setLngLat(coords);
        }
        if (map.current) {
            map.current.flyTo({ center: coords, zoom: 12 });
            updateRadiusCircle(coords, radius);
        }
    };

    const updateRadiusCircle = (center, radiusKm) => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        if (radiusCircle.current) {
            if (map.current.getLayer(radiusCircle.current)) {
                map.current.removeLayer(radiusCircle.current);
            }
            if (map.current.getSource(radiusCircle.current)) {
                map.current.removeSource(radiusCircle.current);
            }
        }

        const circleId = "radius-circle";
        radiusCircle.current = circleId;

        const radiusInDegrees = radiusKm / 111;
        const points = 64;
        const coordinates = [];

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const lng = center[0] + radiusInDegrees * Math.cos(angle);
            const lat = center[1] + radiusInDegrees * Math.sin(angle);
            coordinates.push([lng, lat]);
        }
        coordinates.push(coordinates[0]);

        map.current.addSource(circleId, {
            type: "geojson",
            data: {
                type: "Feature",
                geometry: { type: "Polygon", coordinates: [coordinates] },
            },
        });

        map.current.addLayer({
            id: circleId,
            type: "fill",
            source: circleId,
            paint: { "fill-color": "#6366f1", "fill-opacity": 0.2 },
        });

        map.current.addLayer({
            id: `${circleId}-outline`,
            type: "line",
            source: circleId,
            paint: {
                "line-color": "#6366f1",
                "line-width": 2,
                "line-opacity": 0.6,
            },
        });
    };

    // Fallback UI when no Mapbox token
    if (!isTokenSet && !mapboxToken) {
        return (
            <div className="space-y-4 p-6 border rounded-lg bg-accent/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <p className="text-sm">
                        To use the map feature, please enter your Mapbox public token below.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
                    <Input
                        id="mapbox-token"
                        type="text"
                        placeholder="pk.eyJ1..."
                        value={tempToken}
                        onChange={(e) => setTempToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Get a token from{" "}
                        <a
                            href="https://account.mapbox.com/access-tokens/"
                            target="_blank"
                            className="text-primary hover:underline"
                        >
                            mapbox.com
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Map */}
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border">
                <div ref={mapContainer} className="absolute inset-0" />
            </div>

            {/* Radius Slider */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label>Search Radius</Label>
                    <span className="text-sm text-muted-foreground">{radius} km</span>
                </div>

                <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={[radius]}
                    onValueChange={(value) => onRadiusChange(value[0])}
                    className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 km</span>
                    <span>50 km</span>
                </div>
            </div>

            {location && (
                <div className="flex items-start gap-2 p-3 bg-accent/30 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{location}</p>
                </div>
            )}
        </div>
    );
};
