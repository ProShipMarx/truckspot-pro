import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface PlacesAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string, placeDetails: google.maps.places.PlaceResult | null) => void;
  placeholder?: string;
  required?: boolean;
}

export const PlacesAutocomplete = ({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  required 
}: PlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      componentRestrictions: { country: "us" },
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address, place);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <Input
      ref={inputRef}
      id={id}
      placeholder={placeholder}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value, null)}
      required={required}
      autoComplete="off"
    />
  );
};
