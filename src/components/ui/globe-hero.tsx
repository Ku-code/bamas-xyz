import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

const Globe: React.FC<{
  rotationSpeed: number;
  radius: number;
}> = ({ rotationSpeed, radius }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!);
  
  // Adaptive geometry quality and size based on device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const segments = isMobile ? 24 : 64;
  // Scale radius based on device - smaller on mobile to fit screen
  const scaledRadius = isMobile ? radius * 0.7 : radius * 1.5;

  // Check if dark mode is active and set color accordingly
  React.useEffect(() => {
    const updateColor = () => {
      if (materialRef.current) {
        const isDark = document.documentElement.classList.contains('dark');
        // Bright white for dark mode, vibrant primary color for light mode
        if (isDark) {
          materialRef.current.color.setStyle('#FFFFFF'); // Bright white for visibility
        } else {
          // Primary green color for light mode
          materialRef.current.color.setStyle('#0C9D6A'); // Primary green
        }
      }
    };

    updateColor();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3;
      groupRef.current.rotation.z += rotationSpeed * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[scaledRadius, segments, segments]} />
        <meshBasicMaterial
          ref={materialRef}
          transparent
          opacity={0.5}
          wireframe
        />
      </mesh>
    </group>
  );
};



const DotGlobeHero = React.forwardRef<
  HTMLDivElement,
  DotGlobeHeroProps
>(({
  rotationSpeed = 0.005,
  globeRadius = 1.134,
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full min-h-screen bg-background overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {children}
      </div>
      
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <Canvas
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          gl={{ 
            antialias: false, 
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: false,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
          frameloop="always"
          style={{ width: '100%', height: '100%' }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, typeof window !== 'undefined' && window.innerWidth < 768 ? 3.5 : 3]} fov={typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 75} />
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -10, -10]} intensity={0.8} />
          
          <Globe
            rotationSpeed={rotationSpeed}
            radius={globeRadius}
          />
        </Canvas>
      </div>
    </div>
  );
});

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
