import { useEffect, useState } from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";

interface LoadMapWithRouteProps {
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  onDistanceCalculated: (distanceInMiles: number) => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795, // Center of US
};

export const LoadMapWithRoute = ({ origin, destination, onDistanceCalculated }: LoadMapWithRouteProps) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!origin || !destination || !window.google) return;

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Calculate distance in miles
          const distanceInMeters = result.routes[0].legs[0].distance?.value || 0;
          const distanceInMiles = Math.round(distanceInMeters * 0.000621371);
          onDistanceCalculated(distanceInMiles);
        }
      }
    );
  }, [origin, destination, onDistanceCalculated]);

  useEffect(() => {
    if (map && origin && destination) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds);
    }
  }, [map, origin, destination]);

  const center = origin || destination || defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={4}
      onLoad={setMap}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {origin && !directions && <Marker position={origin} label="A" />}
      {destination && !directions && <Marker position={destination} label="B" />}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};
