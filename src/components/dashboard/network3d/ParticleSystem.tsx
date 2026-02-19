import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  count?: number;
  speed?: number;
  visible?: boolean;
}

export const ParticleSystem = ({
  start,
  end,
  color = '#60a5fa',
  count = 20,
  speed = 0.02,
  visible = true,
}: ParticleSystemProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(count * 3));
  const velocitiesRef = useRef<Float32Array>(new Float32Array(count));

  // Initialize particle positions and velocities
  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const index = i * 3;
      const t = Math.random();
      positionsRef.current[index] = start[0] + (end[0] - start[0]) * t;
      positionsRef.current[index + 1] = start[1] + (end[1] - start[1]) * t;
      positionsRef.current[index + 2] = start[2] + (end[2] - start[2]) * t;
      velocitiesRef.current[i] = Math.random() * speed;
    }
  }, [start, end, count, speed]);

  useFrame(() => {
    if (!particlesRef.current || !visible) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    for (let i = 0; i < count; i++) {
      const index = i * 3;
      velocitiesRef.current[i] += speed * 0.1;
      const t = velocitiesRef.current[i] % 1;
      positions[index] = start[0] + dx * t;
      positions[index + 1] = start[1] + dy * t;
      positions[index + 2] = start[2] + dz * t;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // All hooks MUST be called before any early returns (Rules of Hooks)
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positionsRef.current, 3));
    return geom;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: color,
        size: 0.05,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      }),
    [color]
  );

  if (!visible) return null;

  return <points ref={particlesRef} geometry={geometry} material={material} />;
};
