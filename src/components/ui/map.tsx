import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Company } from '@/lib/companies';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapProps {
  companies: Company[];
  onCompanyClick?: (company: Company) => void;
  selectedCompanyId?: string | null;
  className?: string;
  isFullscreen?: boolean;
  isPanelOpen?: boolean;
}

// Maptiler API key - must be set via environment variable VITE_MAPTILER_API_KEY
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

// Maptiler Dataviz style URLs with fallbacks
const getMaptilerStyle = (isDark: boolean): string | maplibregl.StyleSpecification => {
  if (MAPTILER_API_KEY) {
    return isDark
      ? `https://api.maptiler.com/maps/dataviz-v4-dark/style.json?key=${MAPTILER_API_KEY}`
      : `https://api.maptiler.com/maps/dataviz-v4/style.json?key=${MAPTILER_API_KEY}`;
  }

  // Fallback: Use CartoDB tiles (dark) or OSM tiles (light)
  const lightTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkTiles = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

  return {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [isDark ? darkTiles : lightTiles],
        tileSize: 256,
        attribution: isDark
          ? '© CARTO, © OpenStreetMap contributors'
          : '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
      },
    ],
  };
};

export const Map = ({ companies, onCompanyClick, selectedCompanyId, className = '', isFullscreen = false, isPanelOpen = true }: MapProps) => {
  const { t } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isStyleChanging, setIsStyleChanging] = useState(false);
  const previousCompaniesCount = useRef<number>(0);
  const fitBoundsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const styleChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map (only once on mount)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Use a safe fallback style for initial load
      const fallbackStyle: maplibregl.StyleSpecification = {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      };

      // Initialize map with Maptiler style if API key is available, otherwise use fallback
      const initialStyle = MAPTILER_API_KEY ? getMaptilerStyle(isDarkMode) : fallbackStyle;
      
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: typeof initialStyle === 'string' ? initialStyle : initialStyle,
        center: [23.3219, 42.6977], // Sofia, Bulgaria (default focus)
        zoom: 7,
        minZoom: 1, // Allow viewing entire world
        maxZoom: 18,
      });

      // Only handle errors during initial load, not during style changes
      let isInitialLoad = true;
      
      map.current.on('load', () => {
        isInitialLoad = false; // Mark initial load as complete
        setIsLoaded(true);
        // Trigger resize to ensure map renders correctly
        setTimeout(() => {
          map.current?.resize();
        }, 100);
      });
      
      map.current.on('style.load', () => {
        // Style loaded successfully
        setIsLoaded(true);
        // Trigger resize after style loads
        setTimeout(() => {
          map.current?.resize();
        }, 100);
      });

      // Handle styledata event (fires when style is fully loaded and ready)
      map.current.on('styledata', () => {
        setIsLoaded(true);
        setTimeout(() => {
          map.current?.resize();
        }, 50);
      });

      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        // Only use fallback during initial load, not for subsequent style changes
        if (isInitialLoad && e.error && e.error.message && e.error.message.includes('style')) {
          try {
            map.current?.setStyle(fallbackStyle);
          } catch (fallbackError) {
            console.error('Fallback style also failed:', fallbackError);
          }
        }
      });

      // Ensure map resizes correctly (useful on mobile/orientation changes)
      const handleResize = () => {
        try {
          map.current?.resize();
        } catch (_) {}
      };
      window.addEventListener('resize', handleResize);

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
        window.removeEventListener('resize', handleResize);
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      // Don't throw - just log the error so the component can still render
    }
  }, []); // Only run once on mount

  // Clear all markers helper
  const clearAllMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        // Ignore errors when removing markers
      }
    });
    markersRef.current.clear();
  }, []);

  // Update map style when dark mode changes - with proper sequencing
  useEffect(() => {
    if (!map.current) return;

    // Clear any pending timeout
    if (styleChangeTimeoutRef.current) {
      clearTimeout(styleChangeTimeoutRef.current);
      styleChangeTimeoutRef.current = null;
    }

    setIsStyleChanging(true);
    
    try {
      const newStyle = getMaptilerStyle(isDarkMode);
      
      // Store current center and zoom to restore after style change
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      
      // Remove all markers before style change
      clearAllMarkers();
      
      // Set the new style
      map.current.setStyle(newStyle);
      
      // Wait for style to fully load before restoring state
      const onStyleLoad = () => {
        styleChangeTimeoutRef.current = setTimeout(() => {
          if (!map.current) return;
          
          try {
            // Restore map position
            map.current.setCenter(currentCenter);
            map.current.setZoom(currentZoom);
            map.current.resize();
          } catch (e) {
            // Ignore positioning errors
          }
          
          setIsStyleChanging(false);
          setIsLoaded(true);
        }, 150);
      };
      
      // Listen for style load completion
      map.current.once('style.load', onStyleLoad);
      map.current.once('styledata', () => {
        // Also handle styledata as backup
        if (!styleChangeTimeoutRef.current) {
          onStyleLoad();
        }
      });
      
    } catch (error) {
      console.error('Error changing map style:', error);
      setIsStyleChanging(false);
      setIsLoaded(true);
    }
  }, [isDarkMode, clearAllMarkers]);

  // Create a single marker element - anchored to fixed geo-coordinates (no floating physics)
  const createMarkerElement = useCallback((company: Company, isSelected: boolean) => {
    const el = document.createElement('div');
    el.className = 'company-marker';
    el.dataset.companyId = company.id;
    
    // Fixed size - anchored element, no floating animation
    Object.assign(el.style, {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: isSelected ? '4px solid #ef4444' : '3px solid white',
      boxShadow: isSelected ? '0 4px 16px rgba(239, 68, 68, 0.6)' : '0 2px 8px rgba(0,0,0,0.3)',
      cursor: 'pointer',
      overflow: 'hidden',
      backgroundColor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out, border 0.15s ease-out',
      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
      zIndex: isSelected ? '1000' : '1',
      pointerEvents: 'auto',
      position: 'relative',
    });

    // Add logo or fallback initial
    if (company.logo_url) {
      const img = document.createElement('img');
      img.src = company.logo_url;
      img.alt = company.name;
      Object.assign(img.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      });
      img.onerror = () => {
        el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#666;background:#f3f4f6;">${company.name.charAt(0).toUpperCase()}</div>`;
      };
      el.appendChild(img);
    } else {
      el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#666;background:#f3f4f6;">${company.name.charAt(0).toUpperCase()}</div>`;
    }

    // Hover effects (scale only, no physics/floating)
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.3)';
      el.style.zIndex = '1000';
      el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
      el.style.zIndex = isSelected ? '1000' : '1';
      el.style.boxShadow = isSelected ? '0 4px 16px rgba(239, 68, 68, 0.6)' : '0 2px 8px rgba(0,0,0,0.3)';
    });

    // Click handler
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (onCompanyClick) {
        onCompanyClick(company);
      }
    });

    return el;
  }, [onCompanyClick]);

  // Update markers when companies change or style finishes loading
  useEffect(() => {
    if (!map.current || isStyleChanging) return;
    if (!isLoaded) return;

    // Wait for style to be loaded
    if (!map.current.isStyleLoaded()) {
      const onStyleReady = () => {
        map.current?.off('styledata', onStyleReady);
        // Trigger re-render by setting state
        setIsLoaded(prev => prev);
      };
      map.current.on('styledata', onStyleReady);
      return;
    }

    try {
      // Clear existing markers
      clearAllMarkers();

      // Add markers for each company with valid coordinates
      companies.forEach((company) => {
        if (typeof company.headquarters_latitude !== 'number' || typeof company.headquarters_longitude !== 'number') return;
        if (isNaN(company.headquarters_latitude) || isNaN(company.headquarters_longitude)) return;

        const isSelected = selectedCompanyId === company.id;
        const el = createMarkerElement(company, isSelected);

        // Create marker anchored to fixed geo-coordinates (no dragging, no physics)
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
          draggable: false,
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport',
        })
          .setLngLat([company.headquarters_longitude, company.headquarters_latitude])
          .addTo(map.current!);

        markersRef.current.set(company.id, marker);
      });

      // Fit bounds logic
      const companiesWithCoords = companies.filter(
        c => typeof c.headquarters_latitude === 'number' && typeof c.headquarters_longitude === 'number'
      );
      const currentCount = companiesWithCoords.length;
      const wasFirstLoad = previousCompaniesCount.current === 0;

      if (fitBoundsTimeoutRef.current) {
        clearTimeout(fitBoundsTimeoutRef.current);
        fitBoundsTimeoutRef.current = null;
      }

      if (currentCount > 0 && wasFirstLoad) {
        const bounds = new maplibregl.LngLatBounds();
        companiesWithCoords.forEach((company) => {
          bounds.extend([company.headquarters_longitude!, company.headquarters_latitude!]);
        });

        if (!bounds.isEmpty()) {
          fitBoundsTimeoutRef.current = setTimeout(() => {
            try {
              const padding = isPanelOpen ? { top: 100, bottom: 100, left: 100, right: 420 } : 100;
              map.current?.fitBounds(bounds, {
                padding,
                maxZoom: 11,
                duration: 1200,
                easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
              });
            } catch (e) {
              // Ignore
            }
          }, 200);
        }
      }

      previousCompaniesCount.current = currentCount;
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [companies, isLoaded, isStyleChanging, selectedCompanyId, isPanelOpen, createMarkerElement, clearAllMarkers]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fitBoundsTimeoutRef.current) {
        clearTimeout(fitBoundsTimeoutRef.current);
      }
      if (styleChangeTimeoutRef.current) {
        clearTimeout(styleChangeTimeoutRef.current);
      }
    };
  }, []);

  // Resize map when fullscreen or panel state changes
  useEffect(() => {
    if (map.current && isLoaded) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [isFullscreen, isPanelOpen, isLoaded]);

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
  };

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '500px' }}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" style={{ minHeight: '500px' }} />
      
      {/* Dark/Light Mode Toggle Button - Like Footer */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <Sun className="h-4 w-4" />
        <Switch
          id="map-dark-mode"
          checked={isDarkMode}
          onCheckedChange={toggleDarkMode}
        />
        <Moon className="h-4 w-4" />
        <Label htmlFor="map-dark-mode" className="sr-only">
          {isDarkMode ? (t("dashboard.additivemap.map.toggleLight") || "Switch to Light Mode") : (t("dashboard.additivemap.map.toggleDark") || "Switch to Dark Mode")}
        </Label>
      </div>

      <style>{`
        .company-marker {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .maplibregl-ctrl-attrib {
          font-size: 10px;
        }
      `}</style>
    </div>
  );
};

