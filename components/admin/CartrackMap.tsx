import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@chakra-ui/react';

interface Trip {
  trip_id: number;
  registration: string;
  driver_name: string;
  driver_surname: string;
  start_location: string;
  end_location: string;
  start_coordinates: {
    latitude: number;
    longitude: number;
  };
  end_coordinates: {
    latitude: number;
    longitude: number;
  };
  trip_distance: number;
  max_speed: number;
}

interface CartrackMapProps {
  trips: Trip[];
}

export default function CartrackMap({ trips }: CartrackMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !trips || trips.length === 0) return;

    // Criar mapa centrado em Portugal
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([41.1579, -8.6291], 12);

      // Adicionar camada de tiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Limpar marcadores anteriores
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Ícone customizado para início (verde)
    const startIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
          <text x="12" y="17" font-size="14" font-weight="bold" text-anchor="middle" fill="white">S</text>
        </svg>
      `),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Ícone customizado para fim (vermelho)
    const endIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
          <text x="12" y="17" font-size="14" font-weight="bold" text-anchor="middle" fill="white">F</text>
        </svg>
      `),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Adicionar marcadores e linhas para cada viagem
    const bounds = L.latLngBounds([]);

    trips.slice(0, 50).forEach((trip) => {
      const start = [trip.start_coordinates.latitude, trip.start_coordinates.longitude] as [number, number];
      const end = [trip.end_coordinates.latitude, trip.end_coordinates.longitude] as [number, number];

      // Marcador de início
      const startMarker = L.marker(start, { icon: startIcon }).addTo(mapRef.current!);
      startMarker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong>${trip.registration}</strong><br/>
          <strong>Motorista:</strong> ${trip.driver_name} ${trip.driver_surname}<br/>
          <strong>Início:</strong> ${trip.start_location}<br/>
          <strong>Vel. Máx:</strong> ${trip.max_speed} km/h<br/>
          <strong>Distância:</strong> ${(trip.trip_distance / 1000).toFixed(1)} km
        </div>
      `);

      // Marcador de fim
      const endMarker = L.marker(end, { icon: endIcon }).addTo(mapRef.current!);
      endMarker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong>Fim da Viagem</strong><br/>
          ${trip.end_location}
        </div>
      `);

      // Linha conectando início e fim
      const polyline = L.polyline([start, end], {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 5',
      }).addTo(mapRef.current!);

      // Adicionar aos bounds
      bounds.extend(start);
      bounds.extend(end);
    });

    // Ajustar zoom para mostrar todas as viagens
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [trips]);

  return (
    <Box
      ref={mapContainerRef}
      w="100%"
      h="100%"
      borderRadius="md"
      overflow="hidden"
      sx={{
        '.leaflet-container': {
          height: '100%',
          width: '100%',
        },
      }}
    />
  );
}
