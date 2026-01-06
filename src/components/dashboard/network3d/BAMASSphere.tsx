import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface BAMASSphereProps {
  radius?: number;
}

export const BAMASSphere = ({ radius = 2.5 }: BAMASSphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Animated pulse effect
  useFrame((state) => {
    if (meshRef.current && glowRef.current && materialRef.current) {
      const time = state.clock.getElapsedTime();
      const pulse = 1 + Math.sin(time * 2) * 0.1;
      
      // Pulse the glow
      if (glowRef.current.scale) {
        glowRef.current.scale.setScalar(pulse);
      }
      
      // Animate emissive intensity
      const intensity = 0.5 + Math.sin(time * 1.5) * 0.3;
      materialRef.current.emissiveIntensity = intensity;
    }
  });

  // Glow material
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#10b981',
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
      }),
    []
  );

  // Main sphere material with emissive glow
  const sphereMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#10b981',
        emissive: '#10b981',
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.2,
      }),
    []
  );

  return (
    <group>
      {/* Outer glow sphere */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[radius * 1.3, 32, 32]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Main BAMAS sphere */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <primitive ref={materialRef} object={sphereMaterial} attach="material" />
      </mesh>

      {/* BAMAS text label */}
      <Text
        position={[0, radius + 0.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        BAMAS
      </Text>
      <Text
        position={[0, radius + 0.8, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
        textAlign="center"
      >
        BULGARIAN ADDITIVE
      </Text>
    </group>
  );
};

