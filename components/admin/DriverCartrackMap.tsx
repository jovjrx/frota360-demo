import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issues with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LatLng {
  lat: number;
  lng: number;
}

interface Trip {
  start: LatLng;
  end: LatLng;
  path: LatLng[];
}

interface DriverCartrackMapProps {
  initialPosition: LatLng;
  trips: Trip[];
}

const DriverCartrackMap: React.FC<DriverCartrackMapProps> = ({ initialPosition, trips }) => {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const polylinesRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map only once
      mapRef.current = L.map('driver-cartrack-map', {
        center: initialPosition,
        zoom: 13, // Um zoom mais próximo para o motorista
        zoomControl: true,
      });

      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);
      polylinesRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const map = mapRef.current;
    const markers = markersRef.current;
    const polylines = polylinesRef.current;

    if (!map || !markers || !polylines) return;

    // Clear existing layers
    markers.clearLayers();
    polylines.clearLayers();

    const bounds = L.latLngBounds([]);

    // Add markers for each trip
    trips.forEach(trip => {
      // Start marker (green)
      const startIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.marker(trip.start, { icon: startIcon }).addTo(markers).bindPopup(`<b>Início da Viagem</b><br/>Lat: ${trip.start.lat.toFixed(4)}, Lng: ${trip.start.lng.toFixed(4)}`);
      bounds.extend(trip.start);

      // End marker (red)
      const endIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.marker(trip.end, { icon: endIcon }).addTo(markers).bindPopup(`<b>Fim da Viagem</b><br/>Lat: ${trip.end.lat.toFixed(4)}, Lng: ${trip.end.lng.toFixed(4)}`);
      bounds.extend(trip.end);

      // Polyline for the trip (if path is available)
      if (trip.path && trip.path.length > 0) {
        L.polyline(trip.path, { color: 'blue', weight: 3, opacity: 0.7 }).addTo(polylines);
        trip.path.forEach(point => bounds.extend(point));
      } else {
        // If no path, draw a simple line between start and end
        L.polyline([trip.start, trip.end], { color: 'blue', weight: 3, opacity: 0.7, dashArray: '5, 5' }).addTo(polylines);
      }
    });

    // Fit map to bounds if there are trips
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // If no trips, just set to initial position
      map.setView(initialPosition, 13);
    }

    // Cleanup function
    return () => {
      // No need to remove map, just clear layers
    };
  }, [initialPosition, trips]);

  return <Box id="driver-cartrack-map" height="100%" width="100%" minH="400px" />;
};

export default DriverCartrackMap;

