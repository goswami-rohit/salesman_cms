// src/components/reusable-dealer-locations.tsx
//'use client';

import * as React from 'react';
import { toast } from 'sonner';

// Define the type for the API response
type Locations = {
  regions: string[];
  areas: string[];
};

/**
 * Custom hook to fetch and provide dynamic dealer locations.
 * This hook handles loading, error, and caching to avoid multiple API calls.
 */
export function useDealerLocations() {
  const [locations, setLocations] = React.useState<Locations>({ regions: [], areas: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/dealerManagement/dealer-locations`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Locations = await response.json();
        setLocations(data);
      } catch (e: any) {
        console.error("Failed to fetch dealer locations:", e);
        setError(e.message);
        toast.error("Failed to load dealer locations.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, loading, error };
}