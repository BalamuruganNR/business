import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface GoogleMapProps {
  apiKey: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !apiKey) return;
    
    // Clean up any existing script to prevent duplicates
    if (scriptRef.current && document.head.contains(scriptRef.current)) {
      document.head.removeChild(scriptRef.current);
    }
    
    // Add the Google Maps script to the document
    const script = document.createElement('script');
    scriptRef.current = script; // Store reference for cleanup
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Define the callback function that Google Maps will call
    window.initMap = () => {
      try {
        if (!mapRef.current) return;
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 11,
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#c9c9c9" }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#e5e5e5" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#d9ead3" }],
            },
          ],
        });
  
        // Add some adoption locations (in a real app, these would come from Firebase)
        const adoptionLocations = [
          { lat: 37.7749, lng: -122.4194, name: "SF SPCA", animals: 18 },
          { lat: 37.8044, lng: -122.2712, name: "Oakland Animal Services", animals: 23 },
          { lat: 37.7336, lng: -122.5021, name: "Peninsula Humane Society", animals: 15 },
          { lat: 37.3333, lng: -121.9, name: "San Jose Animal Care Center", animals: 29 },
        ];
  
        // Create markers for each adoption location
        adoptionLocations.forEach(location => {
          const marker = new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: location.name,
            icon: {
              url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h.3c1.6 0 2.7-1.2 2.7-2.5V10c0-2.2-1.8-5-4-5z'%3E%3C/path%3E%3Cpath d='M2 9v5'%3E%3C/path%3E%3Cpath d='M6 8v6'%3E%3C/path%3E%3C/svg%3E",
              scaledSize: new window.google.maps.Size(30, 30),
            },
          });
  
          // Add info window to each marker
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 200px;">
                <h3 style="margin: 0 0 5px; color: #10b981; font-weight: bold;">${location.name}</h3>
                <p style="margin: 0 0 5px;">Available for adoption: ${location.animals} animals</p>
                <button 
                  style="background-color: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;"
                  onclick="window.location.href = '/post/1'"
                >
                  View Animals
                </button>
              </div>
            `
          });
  
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        });
  
        setMapLoaded(true);
      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("Failed to initialize map");
      }
    };
    
    // Add script to document head
    document.head.appendChild(script);
    
    return () => {
      // Cleanup function to properly handle script removal
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
      
      // Clean up the global callback
      if (window.initMap) {
        delete window.initMap;
      }
      
      // Additional cleanup for the map instance
      if (window.google && window.google.maps) {
        // Clear any map instances
        setMapLoaded(false);
      }
    };
  }, [apiKey]);

  return (
    <>
      <div 
        ref={mapRef} 
        className="bg-gray-200 dark:bg-muted h-96 rounded-lg shadow-md relative overflow-hidden"
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleMap;