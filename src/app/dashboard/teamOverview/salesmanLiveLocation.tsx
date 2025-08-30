// src/app/dashboard/teamOverview/salesmanLiveLocation.tsx

"use client";

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

import 'leaflet/dist/leaflet.css';
//import L from 'leaflet'; // This is an CSR import inside const LeafletMap()
import { MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { io, Socket } from 'socket.io-client';
import { areas, regions } from '@/lib/Reusable-constants';


const roles = ['senior-executive', 'executive', 'junior-executive'];

// --- Zod Schema Validation ---
const liveLocationSchema = z.object({
  userId: z.number(),
  salesmanName: z.string(),
  employeeId: z.string().nullable(),
  role: z.string(),
  region: z.string().nullable(),
  area: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(),
  isActive: z.boolean(),
  accuracy: z.number().nullable(),
  speed: z.number().nullable(),
  heading: z.number().nullable(),
  altitude: z.number().nullable(),
  batteryLevel: z.number().nullable(),
});

type LiveLocationData = z.infer<typeof liveLocationSchema>;

// Move the icon creation outside the dynamic import block
// but keep L object usage inside a dynamic context
const iconSvgString = encodeURIComponent(renderToStaticMarkup(
  <MapPin className="text-gray-100 bg-cyan-700 rounded-full p-1" size={36} />
));

// A separate component to render the map and markers
const LeafletMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, useMap } = await import('react-leaflet');
    // FIX: Use ES module dynamic import for leaflet
    const L = (await import('leaflet')).default;

    const salesmanIcon = L.divIcon({
      html: `<div style="transform: translateY(-50%)">${decodeURIComponent(iconSvgString)}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
      className: "bg-transparent border-none"
    });

    const MapReset = () => {
      const map = useMap();
      useEffect(() => {
        if (map) {
          map.invalidateSize();
        }
      }, [map]);
      return null;
    };

    // FIX: Give the component a name
    const MapComponent = ({ locations }: { locations: LiveLocationData[] }) => {
      const initialPosition: [number, number] = [26.1445, 91.7362];

      return (
        <MapContainer center={initialPosition} zoom={13} scrollWheelZoom={false} className="w-full h-[600px] rounded-lg">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((location) => (
            <Marker
              key={location.userId}
              position={[location.latitude, location.longitude]}
              icon={salesmanIcon}
            >
              <Popup>
                <div className="font-semibold text-lg">{location.salesmanName}</div>
                <div className="text-sm text-gray-600">
                  <p>Role: {location.role}</p>
                  <p>Last seen: {new Date(location.recordedAt).toLocaleString()}</p>
                  <p>Location: ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})</p>
                  <p>Area: {location.area || 'N/A'}</p>
                  <p>Region: {location.region || 'N/A'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          <MapReset />
        </MapContainer>
      );
    };

    return MapComponent;
  },
  { ssr: false }
);

export function SalesmanLiveLocation() {
  const [locations, setLocations] = useState<LiveLocationData[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LiveLocationData[]>([]);
  const [filters, setFilters] = useState({
    name: '',
    role: 'all',
    area: 'all',
    region: 'all',
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/slmLiveLocation`);
        if (!response.ok) {
          throw new Error('Failed to fetch initial locations');
        }
        const data = await response.json();
        const validatedData = z.array(liveLocationSchema).parse(data);
        setLocations(validatedData);
      } catch (error) {
        console.error('Error fetching initial locations:', error);
      }
    };
    fetchLocations();

    socketRef.current = io(`${process.env.NEXT_PUBLIC_APP_URL}`);

    socketRef.current.on('locationUpdate', (update: LiveLocationData) => {
      setLocations(prevLocations => {
        const existingIndex = prevLocations.findIndex(loc => loc.userId === update.userId);

        if (existingIndex !== -1) {
          const newLocations = [...prevLocations];
          newLocations[existingIndex] = update;
          return newLocations;
        } else {
          return [...prevLocations, update];
        }
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      const filtered = locations.filter(loc => {
        const nameMatch = filters.name === '' || loc.salesmanName.toLowerCase().includes(filters.name.toLowerCase());
        const roleMatch = filters.role === 'all' || (loc.role && loc.role.toLowerCase() === filters.role.toLowerCase());
        const areaMatch = filters.area === 'all' || (loc.area && loc.area.toLowerCase() === filters.area.toLowerCase());
        const regionMatch = filters.region === 'all' || (loc.region && loc.region.toLowerCase() === filters.region.toLowerCase());
        return nameMatch && roleMatch && areaMatch && regionMatch;
      });
      setFilteredLocations(filtered);
    };
    applyFilters();
  }, [locations, filters]);

  return (
    <div className="p-6 space-y-6">
      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Salesman Live Location Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">

            {/* Salesman Name Filter */}
            <div className="space-y-2">
              <Label htmlFor="salesman-name">Salesman Name</Label>
              <Input
                id="salesman-name"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area Filter */}
            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Select value={filters.area} onValueChange={(value) => setFilters({ ...filters, area: value })}>
                <SelectTrigger id="area">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region Filter */}
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={filters.region} onValueChange={(value) => setFilters({ ...filters, region: value })}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Map Area */}
      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Live Salesman Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <LeafletMap locations={filteredLocations} />
          ) : (
            <div className="flex justify-center items-center h-[600px]">
              <p className="text-gray-500">Loading map and location data...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}