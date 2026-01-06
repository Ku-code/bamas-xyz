import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphNode } from '../networkTypes';

interface MemberNodeProps {
  node: GraphNode;
  position: [number, number, number];
  onHover?: (node: GraphNode | null) => void;
  onClick?: (node: GraphNode) => void;
  isHovered?: boolean;
  isHighlighted?: boolean;
}

export const MemberNode = ({
  node,
  position,
  onHover,
  onClick,
  isHovered = false,
  isHighlighted = false,
}: MemberNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Load avatar texture if available - with error handling
  let texture: THREE.Texture | null = null;
  try {
    if (node.image) {
      const loadedTexture = useTexture(node.image);
      if (loadedTexture) {
        if (Array.isArray(loadedTexture)) {
          texture = loadedTexture[0];
        } else {
          texture = loadedTexture;
        }
        if (texture) {
          texture.flipY = false;
        }
      }
    }
  } catch (error) {
    // Texture loading failed, will use fallback colored sphere
    texture = null;
  }

  // Animate scale on hover
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = (hovered || isHovered || isHighlighted) ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(node);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
  };

  const handleClick = () => {
    onClick?.(node);
  };

  // Material based on whether we have a texture
  const material = useMemo(() => {
    if (texture) {
      return new THREE.MeshStandardMaterial({
        map: texture,
        emissive: node.color || '#3b82f6',
        emissiveIntensity: isHovered || isHighlighted ? 0.3 : 0.1,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: node.color || '#3b82f6',
        emissive: node.color || '#3b82f6',
        emissiveIntensity: isHovered || isHighlighted ? 0.4 : 0.2,
        metalness: 0.5,
        roughness: 0.3,
      });
    }
  }, [texture, node.color, isHovered, isHighlighted]);

  const radius = (node.size || 60) / 200; // Scale down for 3D

  return (
    <group position={position}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Border ring for emphasis */}
      {(hovered || isHovered || isHighlighted) && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[radius * 1.1, radius * 1.15, 32]} />
          <meshBasicMaterial
            color={node.color || '#3b82f6'}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Name label */}
      <Text
        position={[0, radius + 0.2, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.5}
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name}
      </Text>

      {/* Initial fallback if no texture */}
      {!texture && (
        <Text
          position={[0, 0, radius + 0.01]}
          fontSize={radius * 0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {node.name.charAt(0).toUpperCase()}
        </Text>
      )}
    </group>
  );
};

