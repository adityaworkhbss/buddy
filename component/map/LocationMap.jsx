"use client";

import { useEffect, useRef, useState } from "react";
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

    const [tempToken, setTempToken] = useState(mapboxToken || "");
    const [isTokenSet, setIsTokenSet] = useState(!!mapboxToken);

    const [currentCoords, setCurrentCoords] = useState([77.209, 28.6139]); // Default Delhi

    const radiusCircleId = "radius-circle";

    // Custom Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // Load mapbox token
    useEffect(() => {
        if (mapboxToken) {
            setTempToken(mapboxToken);
            setIsTokenSet(true);
        }
    }, [mapboxToken]);

    // INITIAL MAP LOAD — using CSP version of Mapbox
    useEffect(() => {
        if (!mapContainer.current || !tempToken || map.current) return;

        (async () => {
            // ⭐ CSP BUILD (NO workerClass NEEDED)
            const mapboxgl = (await import("mapbox-gl/dist/mapbox-gl-csp.js")).default;
            const MapboxGeocoder = (await import("@mapbox/mapbox-gl-geocoder")).default;

            mapboxgl.accessToken = tempToken;

            const mapInit = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/streets-v12",
                center: currentCoords,
                zoom: 12,
            });

            map.current = mapInit;

            mapInit.on("load", () => {
                mapInit.addControl(new mapboxgl.NavigationControl(), "top-right");

                // ⭐ Mapbox Search Control (optional)
                const geocoder = new MapboxGeocoder({
                    accessToken: tempToken,
                    mapboxgl,
                    marker: false,
                    placeholder: "Search location...",
                });
                mapInit.addControl(geocoder);

                geocoder.on("result", (e) => {
                    const coords = e.result.center;
                    setCurrentCoords(coords);
                    onLocationChange(e.result.place_name, coords);
                    flyAndUpdate(coords);
                });

                // ⭐ Marker
                marker.current = new mapboxgl.Marker({
                    draggable: true,
                    color: "#6366f1",
                })
                    .setLngLat(currentCoords)
                    .addTo(mapInit);

                marker.current.on("dragend", () => {
                    const ll = marker.current.getLngLat();
                    const coords = [ll.lng, ll.lat];
                    setCurrentCoords(coords);
                    reverseGeocode(coords);
                    drawRadius(coords, radius);
                });

                drawRadius(currentCoords, radius);
            });

            // ⭐ Auto Detect User Location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const coords = [pos.coords.longitude, pos.coords.latitude];
                        setCurrentCoords(coords);
                        flyAndUpdate(coords);
                        reverseGeocode(coords);
                    },
                    () => console.log("Geolocation block — default Delhi")
                );
            }
        })();

        return () => map.current?.remove();
    }, [tempToken]);

    // Update radius dynamically
    useEffect(() => {
        if (map.current?.isStyleLoaded()) {
            drawRadius(currentCoords, radius);
        }
    }, [radius, currentCoords]);

    // ⭐ Fetch search autocomplete suggestions
    const searchLocation = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
        )}.json?autocomplete=true&limit=5&access_token=${tempToken}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.features) {
            setSearchResults(data.features);
        }
    };

    // ⭐ When user selects suggestion
    const handleSelectLocation = (place) => {
        const coords = place.center;

        setCurrentCoords(coords);
        onLocationChange(place.place_name, coords);

        flyAndUpdate(coords);

        setSearchResults([]);
        setSearchQuery(place.place_name);
    };

    // ⭐ Reverse geocoding
    const reverseGeocode = (coords) => {
        fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${tempToken}`
        )
            .then((r) => r.json())
            .then((d) => {
                if (d.features?.[0]) {
                    onLocationChange(d.features[0].place_name, coords);
                }
            });
    };

    // ⭐ Move map + update marker & circle
    const flyAndUpdate = (coords) => {
        if (!map.current) return;

        map.current.flyTo({ center: coords, zoom: 13 });

        if (marker.current) marker.current.setLngLat(coords);

        drawRadius(coords, radius);
    };

    // ⭐ Draw radius circle
    const drawRadius = (center, radiusKm) => {
        if (!map.current) return;

        const mapObj = map.current;

        // Delete previous circle
        if (mapObj.getLayer(radiusCircleId)) mapObj.removeLayer(radiusCircleId);
        if (mapObj.getLayer(radiusCircleId + "-outline"))
            mapObj.removeLayer(radiusCircleId + "-outline");
        if (mapObj.getSource(radiusCircleId)) mapObj.removeSource(radiusCircleId);

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

        mapObj.addSource(radiusCircleId, {
            type: "geojson",
            data: {
                type: "Feature",
                geometry: { type: "Polygon", coordinates: [circleCoords] },
            },
        });

        mapObj.addLayer({
            id: radiusCircleId,
            type: "fill",
            source: radiusCircleId,
            paint: { "fill-color": "#6366f1", "fill-opacity": 0.25 },
        });

        mapObj.addLayer({
            id: radiusCircleId + "-outline",
            type: "line",
            source: radiusCircleId,
            paint: { "line-color": "#6366f1", "line-width": 2 },
        });
    };

    // Token input UI
    if (!isTokenSet && !mapboxToken) {
        return (
            <div className="p-4 border rounded-lg">
                <Label>Mapbox Public Token</Label>
                <Input
                    placeholder="pk.eyJ1..."
                    value={tempToken}
                    onChange={(e) => setTempToken(e.target.value)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* ⭐ CUSTOM SEARCH */}
            <div className="relative">
                <Input
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchLocation(e.target.value);
                    }}
                />

                {searchResults.length > 0 && (
                    <div className="absolute z-50 bg-white border rounded-lg w-full mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((place) => (
                            <div
                                key={place.id}
                                onClick={() => handleSelectLocation(place)}
                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                {place.place_name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MAP */}
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden border">
                <div ref={mapContainer} className="absolute inset-0" />
            </div>

            {/* RADIUS SLIDER */}
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

            {location && (
                <div className="flex items-start gap-2 p-3 bg-accent/30 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm">{location}</p>
                </div>
            )}
        </div>
    );
};
