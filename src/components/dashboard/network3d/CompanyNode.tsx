import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphNode } from '../networkTypes';

interface CompanyNodeProps {
  node: GraphNode;
  position: [number, number, number];
  onHover?: (node: GraphNode | null) => void;
  onClick?: (node: GraphNode) => void;
  isHovered?: boolean;
  isHighlighted?: boolean;
}

export const CompanyNode = ({
  node,
  position,
  onHover,
  onClick,
  isHovered = false,
  isHighlighted = false,
}: CompanyNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Load logo texture if available - with error handling
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
    // Texture loading failed, will use fallback colored box
    texture = null;
  }

  // Animate scale on hover
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = (hovered || isHovered || isHighlighted) ? 1.4 : 1;
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

  const size = (node.size || 50) / 200; // Scale down for 3D
  const boxSize = size * 0.8; // Slightly smaller, square-ish

  // Material
  const material = useMemo(() => {
    if (texture) {
      return new THREE.MeshStandardMaterial({
        map: texture,
        emissive: node.color || '#f59e0b',
        emissiveIntensity: isHovered || isHighlighted ? 0.3 : 0.1,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: node.color || '#f59e0b',
        emissive: node.color || '#f59e0b',
        emissiveIntensity: isHovered || isHighlighted ? 0.4 : 0.2,
        metalness: 0.4,
        roughness: 0.4,
      });
    }
  }, [texture, node.color, isHovered, isHighlighted]);

  return (
    <group position={position}>
      {/* Rounded box for company */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[boxSize, boxSize, boxSize]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Glow effect on hover */}
      {(hovered || isHovered || isHighlighted) && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[boxSize * 1.15, boxSize * 1.15, boxSize * 1.15]} />
          <meshBasicMaterial
            color={node.color || '#f59e0b'}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Company name label */}
      <Text
        position={[0, boxSize + 0.15, 0]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name}
      </Text>

      {/* Initial fallback if no texture */}
      {!texture && (
        <Text
          position={[0, 0, boxSize + 0.01]}
          fontSize={boxSize * 0.5}
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

