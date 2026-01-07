import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Company } from '@/lib/companies';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Maximize2, Minimize2, X, ChevronRight, ChevronLeft } from 'lucide-react';
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
// Get a free API key at https://cloud.maptiler.com/
// Free tier includes 100,000 map loads per month
// Add VITE_MAPTILER_API_KEY to your .env file
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

// Maptiler Dataviz style URLs
// If no API key is provided, uses OpenFreeMap/OSM styles as fallback
const getMaptilerStyle = (isDark: boolean): string | maplibregl.StyleSpecification => {
  if (MAPTILER_API_KEY) {
    return isDark
      ? `https://api.maptiler.com/maps/dataviz-v4-dark/style.json?key=${MAPTILER_API_KEY}`
      : `https://api.maptiler.com/maps/dataviz-v4/style.json?key=${MAPTILER_API_KEY}`;
  }

  const lightTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkTiles = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png';

  return {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [isDark ? darkTiles : lightTiles],
        tileSize: 256,
        attribution: isDark
          ? '© Stadia Maps, © OpenMapTiles © OpenStreetMap contributors'
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
  // Default to light mode (false = light, true = dark)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const previousCompaniesCount = useRef<number>(0);
  const fitBoundsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Update map style when dark mode changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    try {
      const newStyle = getMaptilerStyle(isDarkMode);
      
      if (typeof newStyle === 'string') {
        // Set the new style
        map.current.setStyle(newStyle);
        
        // Re-add markers after style change
        map.current.once('styledata', () => {
          // Markers will be re-added by the markers effect
        });
        
        // Handle style loading errors (only log, don't interfere)
        map.current.once('error', (e: any) => {
          console.error('Map style load error:', e);
        });
      }
    } catch (error) {
      console.error('Error changing map style:', error);
      // Don't throw - just log the error
    }
  }, [isDarkMode, isLoaded]);

  // Update markers when companies change
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    try {
      // Remove existing markers
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {
          // Ignore errors when removing markers
        }
      });
      markersRef.current.clear();

      // Add markers for each company with coordinates
      companies.forEach((company) => {
        if (!company.headquarters_latitude || !company.headquarters_longitude) return;

        const el = document.createElement('div');
        el.className = 'company-marker';
        el.style.width = '48px';
        el.style.height = '48px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.overflow = 'hidden';
        el.style.backgroundColor = '#fff';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.transition = 'transform 0.2s, box-shadow 0.2s';

        // Add logo or fallback
        if (company.logo_url) {
          const img = document.createElement('img');
          img.src = company.logo_url;
          img.alt = company.name;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.onerror = () => {
            // Fallback to text if image fails
            el.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #666;">${company.name.charAt(0).toUpperCase()}</div>`;
          };
          el.appendChild(img);
        } else {
          // Fallback to text
          el.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #666;">${company.name.charAt(0).toUpperCase()}</div>`;
        }

        // Hover effect - make marker more prominent and easier to interact with
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3)';
          el.style.zIndex = '1000';
          el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = selectedCompanyId === company.id ? 'scale(1.2)' : 'scale(1)';
          el.style.zIndex = selectedCompanyId === company.id ? '1000' : 'auto';
          el.style.boxShadow = selectedCompanyId === company.id 
            ? '0 4px 12px rgba(239, 68, 68, 0.5)' 
            : '0 2px 8px rgba(0,0,0,0.3)';
        });

        // Click handler - prevent event bubbling to stop map interactions
        el.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent map click events
          e.preventDefault(); // Prevent default behavior
          if (onCompanyClick) {
            onCompanyClick(company);
          }
        });
        
        // Make marker easier to click
        el.style.pointerEvents = 'auto';
        el.style.position = 'relative';

        // Highlight selected company
        if (selectedCompanyId === company.id) {
          el.style.border = '4px solid #ef4444';
          el.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.6)';
          el.style.transform = 'scale(1.2)';
          el.style.zIndex = '1000';
        }

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
          // Prevent marker from being dragged
          draggable: false,
        })
          .setLngLat([company.headquarters_longitude, company.headquarters_latitude])
          .addTo(map.current!);

        markersRef.current.set(company.id, marker);
      });

      // Fit map to show all companies - but only if it makes sense
      // Don't auto-fit if only one company was just added (prevents aggressive panning)
      const currentCount = companies.filter(c => c.headquarters_latitude && c.headquarters_longitude).length;
      const wasFirstLoad = previousCompaniesCount.current === 0;
      const isNewCompanyAdded = currentCount > previousCompaniesCount.current && currentCount === 1;
      
      // Clear any pending fitBounds
      if (fitBoundsTimeoutRef.current) {
        clearTimeout(fitBoundsTimeoutRef.current);
        fitBoundsTimeoutRef.current = null;
      }

      if (companies.length > 0 && companies.some(c => c.headquarters_latitude && c.headquarters_longitude)) {
        const bounds = new maplibregl.LngLatBounds();
        companies.forEach((company) => {
          if (company.headquarters_latitude && company.headquarters_longitude) {
            bounds.extend([company.headquarters_longitude, company.headquarters_latitude]);
          }
        });

        if (bounds.isEmpty() === false) {
          // Only auto-fit if:
          // 1. It's the first load (no companies before)
          // 2. There are multiple companies (not just one new one)
          // 3. Or if there's only one company but it's the first time loading
          const shouldFitBounds = wasFirstLoad || currentCount > 1 || (currentCount === 1 && !isNewCompanyAdded);
          
          if (shouldFitBounds) {
            // Debounce fitBounds to prevent rapid re-fitting
            fitBoundsTimeoutRef.current = setTimeout(() => {
              try {
                // Calculate padding based on panel state
                // Add more padding on the left if panel is open to prevent markers from being hidden
                const leftPadding = isPanelOpen ? 400 : 150;
                const rightPadding = 150;
                const topPadding = 150;
                const bottomPadding = 150;

                map.current?.fitBounds(bounds, {
                  padding: {
                    top: topPadding,
                    bottom: bottomPadding,
                    left: leftPadding,
                    right: rightPadding,
                  },
                  maxZoom: 11, // Reduced from 12 to show more context
                  duration: 1500, // Slower, smoother animation (1.5 seconds)
                  easing: (t: number) => {
                    // Ease-in-out-cubic for very smooth animation
                    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                  },
                });
              } catch (e) {
                // Ignore fitBounds errors
              }
            }, 300); // Small delay to batch rapid updates
          } else if (isNewCompanyAdded && currentCount === 1) {
            // If a single new company was added, smoothly pan to it instead of fitting all bounds
            // This prevents the map from jumping around
            const newCompany = companies.find(c => c.headquarters_latitude && c.headquarters_longitude);
            if (newCompany && map.current) {
              fitBoundsTimeoutRef.current = setTimeout(() => {
                try {
                  map.current?.easeTo({
                    center: [newCompany.headquarters_longitude, newCompany.headquarters_latitude],
                    zoom: 10, // Reasonable zoom level to see the company
                    duration: 1000, // Smooth 1 second animation
                    easing: (t: number) => {
                      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                    },
                  });
                } catch (e) {
                  // Ignore errors
                }
              }, 500); // Small delay to let marker render first
            }
          }
        }
      }
      
      // Update previous count
      previousCompaniesCount.current = currentCount;
    } catch (error) {
      console.error('Error updating markers:', error);
      // Don't throw - just log the error
    }
  }, [companies, isLoaded, selectedCompanyId, onCompanyClick, isPanelOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fitBoundsTimeoutRef.current) {
        clearTimeout(fitBoundsTimeoutRef.current);
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

