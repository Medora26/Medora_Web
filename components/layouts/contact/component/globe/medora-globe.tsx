'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  ),
});

interface Marker {
  lat: number;
  lng: number;
  label: string;
  color?: string;
  size?: number;
  isPointer?: boolean; // New property to identify the pointer marker
}

interface MedoraGlobeProps {
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
  initialLat?: number;
  initialLng?: number;
  className?: string;
  size?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export interface MedoraGlobeRef {
  flyToLocation: (lat: number, lng: number, locationName: string) => void;
  addPointer: (lat: number, lng: number, locationName: string) => void; // New method
}

const MedoraGlobe = React.forwardRef<MedoraGlobeRef, MedoraGlobeProps>(({
  onLocationSelect,
  initialLat = 20,
  initialLng = 0,
  className = '',
  size = 600,
  autoRotate = true,
  rotationSpeed = 0.5,
}, ref) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [pointerMarker, setPointerMarker] = useState<Marker | null>(null); // Separate state for the pointer
  const [globeReady, setGlobeReady] = useState(false);

  const FIXED_ALTITUDE = 2.0;

  useEffect(() => {
    if (globeRef.current && !globeReady) {
      globeRef.current.pointOfView({
        lat: initialLat,
        lng: initialLng,
        altitude: FIXED_ALTITUDE,
      });
      
      setGlobeReady(true);
    }
  }, [globeReady, initialLat, initialLng]);

  // Prevent all mouse events on the container
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      
      const preventDefaults = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };
      
      container.addEventListener('wheel', preventDefaults, { passive: false });
      container.addEventListener('mousewheel', preventDefaults, { passive: false });
      container.addEventListener('mousedown', preventDefaults);
      container.addEventListener('mouseup', preventDefaults);
      container.addEventListener('mousemove', preventDefaults);
      container.addEventListener('dblclick', preventDefaults);
      
      return () => {
        container.removeEventListener('wheel', preventDefaults);
        container.removeEventListener('mousewheel', preventDefaults);
        container.removeEventListener('mousedown', preventDefaults);
        container.removeEventListener('mouseup', preventDefaults);
        container.removeEventListener('mousemove', preventDefaults);
        container.removeEventListener('dblclick', preventDefaults);
      };
    }
  }, []);

  const flyToLocation = useCallback((lat: number, lng: number, locationName: string) => {
    if (!globeRef.current) return;

    globeRef.current.pointOfView(
      {
        lat,
        lng,
        altitude: FIXED_ALTITUDE,
      },
      1000
    );

    // Add a regular marker
    const newMarker: Marker = {
      lat,
      lng,
      label: locationName,
      color: '#3b82f6',
      size: 0.5,
    };

    setMarkers((prev) => [...prev, newMarker]);
    onLocationSelect?.({ lat, lng, name: locationName });
  }, [onLocationSelect]);

  // New method to add a pulsing pointer marker
  const addPointer = useCallback((lat: number, lng: number, locationName: string) => {
    if (!globeRef.current) return;

    // First, fly to the location
    globeRef.current.pointOfView(
      {
        lat,
        lng,
        altitude: FIXED_ALTITUDE,
      },
      1000
    );

    // Create a special pointer marker with pulsing effect
    const pointer: Marker = {
      lat,
      lng,
      label: `📍 ${locationName}`,
      color: '#ef4444', // Bright red for pointer
      size: 0.8, // Slightly larger
      isPointer: true,
    };

    // Remove previous pointer and set new one
    setPointerMarker(pointer);
    
    // Also add to regular markers for persistence
    setMarkers((prev) => {
      // Remove any old pointer markers from regular markers
      const filtered = prev.filter(m => !m.isPointer);
      return [...filtered, pointer];
    });

    onLocationSelect?.({ lat, lng, name: locationName });
  }, [onLocationSelect]);

  // Combine markers for display
  const allMarkers = React.useMemo(() => {
    if (pointerMarker) {
      // Ensure pointer is included and highlighted
      const withoutPointer = markers.filter(m => !m.isPointer);
      return [...withoutPointer, pointerMarker];
    }
    return markers;
  }, [markers, pointerMarker]);

  React.useImperativeHandle(ref, () => ({
    flyToLocation,
    addPointer, // Expose the new method
  }));

  // Custom HTML marker for pointer (optional - creates a pulsing DOM element)
  const markerHtml = useCallback((marker: Marker) => {
    if (marker.isPointer) {
      // Create a custom HTML element for the pointer
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: #ef4444;
            border-radius: 50%;
            opacity: 0.6;
            animation: pulse 1.5s ease-in-out infinite;
          "></div>
          <div style="
            position: absolute;
            width: 12px;
            height: 12px;
            background: #ef4444;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
          "></div>
          <div style="
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            pointer-events: none;
            border: 1px solid #ef4444;
          ">${marker.label.replace('📍 ', '')}</div>
        </div>
      `;
      return el;
    }
    return undefined; // Use default marker for non-pointer markers
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size,
        margin: '0 auto',
        cursor: 'default',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(2);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
        }
      `}</style>

      {/* @ts-ignore */}
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        
        // METALLIC TEXTURES
        globeImageUrl="https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
        bumpImageUrl="https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"
        cloudsImageUrl="https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
        cloudsOpacity={0.2}
        
        // Completely transparent background
        backgroundColor="#00000000"
        
        // Disable ALL interactions
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        enablePointerInteraction={false}
        
        // Auto-rotate only
        autoRotate={autoRotate}
        autoRotateSpeed={rotationSpeed}
        
        // Markers
        markersData={allMarkers}
        markerLat={(d: Marker) => d.lat}
        markerLng={(d: Marker) => d.lng}
        markerLabel={(d: Marker) => d.label}
        markerColor={(d: Marker) => d.color}
        markerRadius={(d: Marker) => d.size}
        
        // Custom HTML marker for pointer
        markerHtmlElement={markerHtml}
        
        // Atmosphere
        atmosphereColor="rgb(100, 180, 255)"
        atmosphereAltitude={0.15}
        
        // Lighting for metallic effect
        ambientLightColor="white"
        ambientLightIntensity={0.8}
        pointLightColor="white"
        pointLightIntensity={2.5}
        
        onGlobeReady={() => setGlobeReady(true)}
      />
    </div>
  );
});

MedoraGlobe.displayName = 'MedoraGlobe';

export default MedoraGlobe;