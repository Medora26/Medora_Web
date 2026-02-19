// types/react-globe.gl.d.ts
declare module 'react-globe.gl' {
  export interface GlobeMethods {
    pointOfView: (params: { lat: number; lng: number; altitude: number }, duration?: number) => void;
    controls: () => void;
    pauseAnimation: () => void;
    resumeAnimation: () => void;
    [key: string]: any;
  }

  export interface GlobeProps {
    ref?: React.Ref<GlobeMethods>;
    globeImageUrl?: string;
    bumpImageUrl?: string;
    backgroundImageUrl?: string;
    cloudsImageUrl?: string;
    cloudsOpacity?: number;
    markersData?: any[];
    markerLat?: (d: any) => number;
    markerLng?: (d: any) => number;
    markerLabel?: (d: any) => string;
    markerColor?: (d: any) => string;
    markerRadius?: (d: any) => number;
    atmosphereColor?: string;
    atmosphereAltitude?: number;
    enablePointerInteraction?: boolean;
    onGlobeReady?: () => void;
    onGlobeClick?: (lat: number, lng: number) => void;
    [key: string]: any;
  }

  const Globe: React.ForwardRefExoticComponent<GlobeProps & React.RefAttributes<GlobeMethods>>;
  export default Globe;
}