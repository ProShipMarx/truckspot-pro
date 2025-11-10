import { useLoadScript } from '@react-google-maps/api';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

export const useGoogleMaps = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDTLv7a7XD-AoZ0KIHfap3yPkE1-NvpYuU",
    libraries,
  });

  return { isLoaded, loadError };
};
