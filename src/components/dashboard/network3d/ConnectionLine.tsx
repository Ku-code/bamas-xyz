import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphLink } from '../networkTypes';

interface ConnectionLineProps {
  link: GraphLink;
  sourcePosition: [number, number, number];
  targetPosition: [number, number, number];
  isHighlighted?: boolean;
  animated?: boolean;
}

export const ConnectionLine = ({
  link,
  sourcePosition,
  targetPosition,
  isHighlighted = false,
  animated = true,
}: ConnectionLineProps) => {
  const lineRef = useRef<THREE.Line>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Create points for the line
  const points = useMemo(
    () => [
      new THREE.Vector3(...sourcePosition),
      new THREE.Vector3(...targetPosition),
    ],
    [sourcePosition, targetPosition]
  );

  // Animate opacity
  useFrame((state) => {
    if (materialRef.current && animated) {
      const time = state.clock.getElapsedTime();
      const opacity = isHighlighted
        ? 0.9 + Math.sin(time * 3) * 0.1
        : (link.opacity || 0.4) + Math.sin(time * 2) * 0.1;
      materialRef.current.opacity = Math.max(0.2, Math.min(1, opacity));
    } else if (materialRef.current) {
      materialRef.current.opacity = isHighlighted ? 0.9 : (link.opacity || 0.4);
    }
  });

  const lineWidth = link.type === 'company' ? (isHighlighted ? 3 : 2) : (isHighlighted ? 2.5 : 1.5);
  const color = link.color || '#60a5fa';

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={lineWidth}
      dashed={false}
    >
      <lineBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={isHighlighted ? 0.9 : (link.opacity || 0.4)}
      />
    </Line>
  );
};

