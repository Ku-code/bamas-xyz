import { Canvas, useFrame } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.PointsMaterial>(null!);

  const isMobile = useIsMobile();
  const scaledRadius = isMobile ? radius * 0.75 : radius * 1.5;

  // Create points geometry for a "Dot Globe" effect
  const points = useMemo(() => {
    const geo = new THREE.SphereGeometry(scaledRadius, isMobile ? 32 : 48, isMobile ? 32 : 48);
    return geo;
  }, [scaledRadius, isMobile]);

  // Handle color updates for dark/light mode
  useEffect(() => {
    const updateColor = () => {
      if (materialRef.current) {
        const isDark = document.documentElement.classList.contains('dark');
        materialRef.current.color.setStyle(isDark ? '#ffffff' : '#0C9D6A');
        materialRef.current.opacity = isDark ? 0.8 : 0.6;
      }
    };

    updateColor();
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += rotationSpeed;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <points ref={pointsRef} geometry={points}>
      <pointsMaterial
        ref={materialRef}
        size={isMobile ? 0.015 : 0.02}
        sizeAttenuation={true}
        transparent
        alphaTest={0.5}
        color="#ffffff"
      />
    </points>
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
  const isMobile = useIsMobile();

  const cameraProps = useMemo(() => ({
    position: [0, 0, isMobile ? 3.5 : 3] as [number, number, number],
    fov: isMobile ? 60 : 75,
    near: 0.1,
    far: 1000
  }), [isMobile]);

  const glProps = useMemo(() => ({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance" as const,
    preserveDrawingBuffer: true,
  }), []);

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full min-h-screen bg-background overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center h-full w-full px-4">
        {children}
      </div>

      {/* HIGH-PERFORMANCE INSTANT CSS PLACEHOLDER */}
      {/* This renders instantly while Three.js initializes */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
        style={{ perspective: '1000px' }}
      >
        <div className="relative w-72 h-72 md:w-[600px] md:h-[600px] opacity-20">
          <div
            className="absolute inset-0 rounded-full border border-primary/40 dark:border-white/40"
            style={{ animation: 'spin 20s linear infinite' }}
          />
          <div
            className="absolute inset-0 rounded-full border border-primary/20 dark:border-white/20 rotate-45"
            style={{ animation: 'spin 30s linear infinite' }}
          />
          <div
            className="absolute inset-0 rounded-full border border-primary/10 dark:border-white/10 -rotate-45"
            style={{ animation: 'spin 40s linear infinite' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 dark:from-white/10 via-transparent to-primary/5 dark:to-white/5 rounded-full blur-3xl" />
        </div>
      </div>

      <div className="absolute inset-0 z-[1] pointer-events-none">
        <Canvas
          dpr={[1, 2]}
          frameloop="always"
          gl={glProps}
          camera={cameraProps}
          onCreated={({ gl, scene, camera }) => {
            gl.setClearColor(0x000000, 0);
            // Force an initial render to avoid white flash/empty state
            gl.render(scene, camera);
          }}
        >
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <Globe
            rotationSpeed={rotationSpeed}
            radius={globeRadius}
          />
          <Preload all />
        </Canvas>
      </div>
    </div>
  );
});

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
