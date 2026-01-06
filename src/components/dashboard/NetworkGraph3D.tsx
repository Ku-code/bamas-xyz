import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, Suspense } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { User } from '@/contexts/AuthContext';
import type { Company } from '@/lib/companies';
import { buildGraphData, calculateSpherePosition, detectDeviceCapability, type GraphNode, type GraphLink } from './networkTypes';
import { BAMASSphere } from './network3d/BAMASSphere';
import { MemberNode } from './network3d/MemberNode';
import { CompanyNode } from './network3d/CompanyNode';
import { ConnectionLine } from './network3d/ConnectionLine';
import { ParticleSystem } from './network3d/ParticleSystem';
import { CameraController } from './network3d/CameraController';

interface NetworkGraph3DProps {
  members: User[];
  companies: Company[];
  width?: number;
  height?: number;
}

// Scene component that contains all 3D elements
const NetworkScene = ({
  members,
  companies,
  onNodeHover,
  onNodeClick,
  hoveredNodeId,
  highlightedNodeIds,
  cameraTarget,
}: {
  members: User[];
  companies: Company[];
  onNodeHover: (node: GraphNode | null) => void;
  onNodeClick: (node: GraphNode) => void;
  hoveredNodeId: string | null;
  highlightedNodeIds: Set<string>;
  cameraTarget: { x: number; y: number; z: number } | null;
}) => {
  const { nodes, links } = useMemo(() => buildGraphData(members, companies), [members, companies]);
  
  // Position member nodes on a sphere around BAMAS
  const memberNodes = useMemo(() => {
    const userNodes = nodes.filter(n => n.type === 'user');
    const radius = 6; // Distance from center
    
    return userNodes.map((node, index) => {
      const pos = calculateSpherePosition(index, Math.max(1, userNodes.length), radius);
      return { node, position: [pos.x, pos.y, pos.z] as [number, number, number] };
    });
  }, [nodes]);

  // Position company nodes relative to their creators
  const companyNodes = useMemo(() => {
    const companyNodesList = nodes.filter(n => n.type === 'company');
    
    return companyNodesList.map((companyNode) => {
      const creatorNode = memberNodes.find(m => m.node.user?.id === companyNode.company?.created_by);
      
      if (creatorNode) {
        const [cx, cy, cz] = creatorNode.position;
        // Position company slightly outward from creator
        const direction = new THREE.Vector3(cx, cy, cz).normalize();
        const offset = 1.5; // Distance from creator
        const companyPos: [number, number, number] = [
          cx + direction.x * offset,
          cy + direction.y * offset,
          cz + direction.z * offset,
        ];
        return { node: companyNode, position: companyPos };
      }
      
      return null;
    }).filter(Boolean) as Array<{ node: GraphNode; position: [number, number, number] }>;
  }, [nodes, memberNodes]);

  // Get BAMAS node
  const bamasNode = nodes.find(n => n.type === 'bamas');

  // Build connection data with 3D positions
  const connections = useMemo(() => {
    return links.map((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      let sourcePos: [number, number, number] = [0, 0, 0];
      let targetPos: [number, number, number] = [0, 0, 0];
      
      if (sourceId === 'bamas') {
        sourcePos = [0, 0, 0];
      } else {
        const member = memberNodes.find(m => m.node.id === sourceId);
        if (member) sourcePos = member.position;
        else {
          const company = companyNodes.find(c => c.node.id === sourceId);
          if (company) sourcePos = company.position;
        }
      }
      
      if (targetId === 'bamas') {
        targetPos = [0, 0, 0];
      } else {
        const member = memberNodes.find(m => m.node.id === targetId);
        if (member) targetPos = member.position;
        else {
          const company = companyNodes.find(c => c.node.id === targetId);
          if (company) targetPos = company.position;
        }
      }
      
      return { link, sourcePos, targetPos };
    });
  }, [links, memberNodes, companyNodes]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
      <directionalLight position={[0, 10, 5]} intensity={0.5} />

      {/* BAMAS central sphere */}
      {bamasNode && <BAMASSphere radius={2.5} />}

      {/* Member nodes */}
      {memberNodes.map(({ node, position }) => (
        <MemberNode
          key={node.id}
          node={node}
          position={position}
          onHover={onNodeHover}
          onClick={onNodeClick}
          isHovered={hoveredNodeId === node.id}
          isHighlighted={highlightedNodeIds.has(node.id)}
        />
      ))}

      {/* Company nodes */}
      {companyNodes.map(({ node, position }) => (
        <CompanyNode
          key={node.id}
          node={node}
          position={position}
          onHover={onNodeHover}
          onClick={onNodeClick}
          isHovered={hoveredNodeId === node.id}
          isHighlighted={highlightedNodeIds.has(node.id)}
        />
      ))}

      {/* Connection lines */}
      {connections.map(({ link, sourcePos, targetPos }, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        const isHighlighted = highlightedNodeIds.has(sourceId) || highlightedNodeIds.has(targetId);
        
        return (
          <group key={`${sourceId}-${targetId}-${index}`}>
            <ConnectionLine
              link={link}
              sourcePosition={sourcePos}
              targetPosition={targetPos}
              isHighlighted={isHighlighted}
            />
            {/* Particle effects on highlighted connections - only for medium/high quality */}
            {isHighlighted && deviceCapability.recommendedQuality !== 'low' && (
              <ParticleSystem
                start={sourcePos}
                end={targetPos}
                color={link.color}
                count={deviceCapability.recommendedQuality === 'high' ? 15 : 8}
                visible={true}
              />
            )}
          </group>
        );
      })}

      {/* Background stars - reduced count for performance */}
      {deviceCapability.recommendedQuality !== 'low' && (
        <Stars radius={50} depth={50} count={deviceCapability.recommendedQuality === 'high' ? 1000 : 500} factor={4} fade speed={0.5} />
      )}
    </>
  );
};

export const NetworkGraph3D = ({ members, companies, width = 800, height = 700 }: NetworkGraph3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [cameraTarget, setCameraTarget] = useState<{ x: number; y: number; z: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceCapability, setDeviceCapability] = useState(detectDeviceCapability());

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width),
          height: Math.max(700, rect.height),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Re-detect device capability on mount
  useEffect(() => {
    setDeviceCapability(detectDeviceCapability());
    // Simulate loading time for smooth initialization
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    
    if (node) {
      // Highlight connected nodes
      const { nodes: allNodes, links: allLinks } = buildGraphData(members, companies);
      const connected = new Set<string>([node.id]);
      
      allLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (sourceId === node.id) connected.add(targetId);
        if (targetId === node.id) connected.add(sourceId);
      });
      
      setHighlightedNodes(connected);
    } else {
      setHighlightedNodes(new Set());
    }
  }, [members, companies]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    
    // Focus camera on clicked node
    if (node.type === 'bamas') {
      setCameraTarget({ x: 0, y: 0, z: 0 });
    } else if (node.type === 'user') {
      const { nodes: allNodes } = buildGraphData(members, companies);
      const userNodes = allNodes.filter(n => n.type === 'user');
      const index = userNodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        const pos = calculateSpherePosition(index, userNodes.length, 6);
        setCameraTarget({ x: pos.x, y: pos.y, z: pos.z });
      }
    }
    
    console.log('Node clicked:', node);
  }, [members, companies]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setCameraTarget({ x: 0, y: 0, z: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Check WebGL support
  if (!deviceCapability.canHandle3D) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-4">
          <p className="text-lg font-bold mb-2">3D View Not Available</p>
          <p className="text-sm text-slate-400">
            Your device doesn't support WebGL or 3D rendering.
            <br />
            Please use the 2D view instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden relative"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading 3D Network...</p>
          </div>
        </div>
      )}
      
      <Canvas
        dpr={deviceCapability.recommendedQuality === 'high' ? [1, 2] : [1, 1.5]}
        gl={{
          antialias: deviceCapability.recommendedQuality !== 'low',
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 10], fov: 75 }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={75} />
        
        <CameraController
          autoRotate={false}
          minDistance={3}
          maxDistance={20}
          targetNode={cameraTarget}
        />
        
        <Suspense fallback={null}>
          <NetworkScene
            members={members}
            companies={companies}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            hoveredNodeId={hoveredNode?.id || null}
            highlightedNodeIds={highlightedNodes}
            cameraTarget={cameraTarget}
            deviceCapability={deviceCapability}
          />
        </Suspense>
      </Canvas>

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-xs text-white border border-slate-700 z-10">
        <div className="font-bold mb-2">3D Network Controls</div>
        <div className="space-y-1 text-slate-300">
          <div>• Click & drag to rotate</div>
          <div>• Scroll to zoom</div>
          <div>• Click nodes to focus</div>
          <div>• Press R to reset camera</div>
          <div>• Hover to highlight connections</div>
        </div>
      </div>

      {/* Quality indicator */}
      {deviceCapability.recommendedQuality !== 'high' && (
        <div className="absolute top-4 left-4 bg-amber-900/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-amber-100 border border-amber-700 z-10">
          Quality: {deviceCapability.recommendedQuality === 'low' ? 'Low (Performance Optimized)' : 'Medium'}
        </div>
      )}
    </div>
  );
};

