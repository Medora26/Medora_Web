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

  React.useImperativeHandle(ref, () => ({
    flyToLocation,
  }));

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
        pointerEvents: 'none', // This completely disables all mouse interaction
      }}
    >
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
        markersData={markers}
        markerLat={(d: Marker) => d.lat}
        markerLng={(d: Marker) => d.lng}
        markerLabel={(d: Marker) => d.label}
        markerColor={(d: Marker) => d.color}
        markerRadius={(d: Marker) => d.size}
        
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