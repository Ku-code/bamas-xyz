import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CameraControllerProps {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  targetNode?: { x: number; y: number; z: number } | null;
}

export const CameraController = ({
  autoRotate = false,
  autoRotateSpeed = 1,
  minDistance = 3,
  maxDistance = 15,
  enableZoom = true,
  enablePan = true,
  targetNode = null,
}: CameraControllerProps) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef<THREE.Vector3 | null>(null);

  // Smooth camera transition to target node
  useEffect(() => {
    if (targetNode && controlsRef.current) {
      targetRef.current = new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z);
      
      // Calculate camera position to look at the node
      const distance = 5;
      const cameraOffset = new THREE.Vector3(0, 0, distance);
      const targetPosition = targetRef.current.clone().add(cameraOffset);
      
      // Animate camera
      const startPosition = camera.position.clone();
      const startTarget = controlsRef.current.target.clone();
      let progress = 0;
      
      const animate = () => {
        progress += 0.02;
        if (progress < 1) {
          camera.position.lerp(targetPosition, progress);
          controlsRef.current.target.lerp(targetRef.current!, progress);
          controlsRef.current.update();
          requestAnimationFrame(animate);
        } else {
          camera.position.copy(targetPosition);
          controlsRef.current.target.copy(targetRef.current!);
          controlsRef.current.update();
        }
      };
      
      animate();
    }
  }, [targetNode, camera]);

  // Reset camera to default position
  const resetCamera = () => {
    if (controlsRef.current) {
      camera.position.set(0, 0, 10);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Expose reset function globally for keyboard shortcut
  useEffect(() => {
    (window as any).resetNetworkCamera = resetCamera;
    return () => {
      delete (window as any).resetNetworkCamera;
    };
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={enableZoom}
      enablePan={enablePan}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      enableDamping
      dampingFactor={0.05}
    />
  );
};

