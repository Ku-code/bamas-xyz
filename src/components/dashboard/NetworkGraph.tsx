import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { User } from '@/contexts/AuthContext';
import type { Company } from '@/lib/companies';

interface NetworkGraphProps {
  members: User[];
  companies: Company[];
  width?: number;
  height?: number;
}

interface GraphNode {
  id: string;
  type: 'bamas' | 'user' | 'company';
  name: string;
  image?: string;
  label: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  size?: number;
  color?: string;
  user?: User;
  company?: Company;
  hovered?: boolean;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'member' | 'company';
  color?: string;
  opacity?: number;
}

export const NetworkGraph = ({ members, companies, width = 800, height = 700 }: NetworkGraphProps) => {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());

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

  // Build graph data with improved layout
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const graphWidth = dimensions.width;
    const graphHeight = dimensions.height;

    // Add BAMAS center node (fixed position) - larger and more prominent
    const bamasNode: GraphNode = {
      id: 'bamas',
      type: 'bamas',
      name: 'BAMAS',
      label: 'BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION',
      fx: graphWidth / 2,
      fy: graphHeight / 2,
      size: 100, // Larger center node
      color: '#10b981',
    };
    nodes.push(bamasNode);

    // Add user nodes - arranged in a perfect circle around BAMAS
    const approvedMembers = members.filter(m => m.status === 'approved');
    const memberRadius = Math.min(graphWidth, graphHeight) * 0.38; // Better spacing
    
    approvedMembers.forEach((member, index) => {
      // Perfect circular distribution
      const angle = (index / approvedMembers.length) * 2 * Math.PI - Math.PI / 2; // Start from top
      const initialX = graphWidth / 2 + memberRadius * Math.cos(angle);
      const initialY = graphHeight / 2 + memberRadius * Math.sin(angle);

      // Determine color based on role
      let nodeColor = '#3b82f6'; // Default blue
      if (member.role === 'superadmin') {
        nodeColor = '#ef4444'; // Red
      } else if (member.role === 'admin') {
        nodeColor = '#f59e0b'; // Orange
      } else if (member.role === 'board_member') {
        nodeColor = '#8b5cf6'; // Purple
      } else if (member.role === 'wg_lead') {
        nodeColor = '#06b6d4'; // Cyan
      }

      const userNode: GraphNode = {
        id: `user-${member.id}`,
        type: 'user',
        name: member.name,
        image: member.image,
        label: member.name,
        x: initialX,
        y: initialY,
        size: 60, // Larger user nodes
        color: nodeColor,
        user: member,
      };
      nodes.push(userNode);

      // Link user to BAMAS with gradient effect
      links.push({
        source: 'bamas',
        target: `user-${member.id}`,
        type: 'member',
        color: '#60a5fa', // Lighter blue for better visibility
        opacity: 0.4,
      });
    });

    // Add company nodes - positioned as branches from their creators
    companies.forEach((company, companyIndex) => {
      const creatorNode = nodes.find(n => n.type === 'user' && n.user?.id === company.created_by);
      
      if (creatorNode) {
        // Calculate angle from BAMAS to creator
        const creatorAngle = Math.atan2(
          (creatorNode.y || graphHeight / 2) - graphHeight / 2,
          (creatorNode.x || graphWidth / 2) - graphWidth / 2
        );
        
        // Position companies in a fan pattern from the creator
        const companiesForCreator = companies.filter(c => c.created_by === company.created_by);
        const companyIndexInGroup = companiesForCreator.findIndex(c => c.id === company.id);
        const totalCompaniesForCreator = companiesForCreator.length;
        
        // Spread companies in an arc
        const spreadAngle = Math.min(1.2, totalCompaniesForCreator * 0.3); // Max 1.2 radians spread
        const angleOffset = (companyIndexInGroup - (totalCompaniesForCreator - 1) / 2) * (spreadAngle / Math.max(1, totalCompaniesForCreator - 1));
        const branchAngle = creatorAngle + angleOffset;
        
        const branchRadius = 130; // Distance from user to company
        const companyX = (creatorNode.x || graphWidth / 2) + branchRadius * Math.cos(branchAngle);
        const companyY = (creatorNode.y || graphHeight / 2) + branchRadius * Math.sin(branchAngle);

        const companyNode: GraphNode = {
          id: `company-${company.id}`,
          type: 'company',
          name: company.name,
          image: company.logo_url,
          label: company.name,
          x: companyX,
          y: companyY,
          size: 50,
          color: '#f59e0b',
          company: company,
        };
        nodes.push(companyNode);

        // Link company to its creator
        links.push({
          source: `user-${company.created_by}`,
          target: `company-${company.id}`,
          type: 'company',
          color: '#fbbf24', // Lighter orange
          opacity: 0.5,
        });
      }
    });

    return { nodes, links };
  }, [members, companies, dimensions.width, dimensions.height]);

  // Image cache for avatars and logos
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  // Preload images
  useEffect(() => {
    const cache = new Map<string, HTMLImageElement>();
    const loadPromises: Promise<void>[] = [];

    graphData.nodes.forEach((node) => {
      if (node.image && !cache.has(node.image)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const promise = new Promise<void>((resolve) => {
          img.onload = () => {
            cache.set(node.image!, img);
            resolve();
          };
          img.onerror = () => resolve();
        });
        img.src = node.image;
        loadPromises.push(promise);
      }
    });

    Promise.all(loadPromises).then(() => {
      setImageCache(cache);
    });
  }, [graphData]);

  // Enhanced node paint function with better visuals
  const nodePaint = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = (node.size || 30) / globalScale;
    const x = node.x || 0;
    const y = node.y || 0;
    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightedNodes.has(node.id);
    
    if (node.type === 'bamas') {
      // Draw BAMAS center node with glow effect
      const glowSize = size + (isHovered ? 15 : 10) / globalScale;
      
      // Outer glow
      const glowGradient = ctx.createRadialGradient(x, y, size, x, y, glowSize);
      glowGradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
      glowGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
      glowGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, 2 * Math.PI);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Main circle with gradient
      const gradient = ctx.createRadialGradient(x, y, size * 0.3, x, y, size);
      gradient.addColorStop(0, '#34d399');
      gradient.addColorStop(0.5, '#10b981');
      gradient.addColorStop(1, '#059669');
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Multiple border rings for depth
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5 / globalScale;
      ctx.stroke();
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();

      // BAMAS text with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4 / globalScale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 / globalScale;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${14 / globalScale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BAMAS', x, y - 12 / globalScale);
      
      ctx.font = `bold ${9 / globalScale}px sans-serif`;
      ctx.fillText('BULGARIAN', x, y + 8 / globalScale);
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
    } else if (node.type === 'user') {
      // Draw user node with enhanced visuals
      const nodeSize = size + (isHovered ? 5 : 0) / globalScale;
      
      // Glow effect on hover
      if (isHovered || isHighlighted) {
        const glowGradient = ctx.createRadialGradient(x, y, nodeSize, x, y, nodeSize + 15 / globalScale);
        glowGradient.addColorStop(0, `${node.color}80`);
        glowGradient.addColorStop(1, `${node.color}00`);
        
        ctx.beginPath();
        ctx.arc(x, y, nodeSize + 15 / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
      
      const cachedImg = node.image ? imageCache.get(node.image) : null;
      
      if (cachedImg) {
        // Draw avatar image with border
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(cachedImg, x - nodeSize, y - nodeSize, nodeSize * 2, nodeSize * 2);
        ctx.restore();
        
        // Animated border
        const borderGradient = ctx.createLinearGradient(x - nodeSize, y - nodeSize, x + nodeSize, y + nodeSize);
        borderGradient.addColorStop(0, node.color || '#3b82f6');
        borderGradient.addColorStop(0.5, '#ffffff');
        borderGradient.addColorStop(1, node.color || '#3b82f6');
        
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = (isHovered ? 5 : 3) / globalScale;
        ctx.stroke();
      } else {
        // Draw colored circle with gradient
        const gradient = ctx.createRadialGradient(x, y, nodeSize * 0.3, x, y, nodeSize);
        const baseColor = node.color || '#3b82f6';
        gradient.addColorStop(0, lightenColor(baseColor, 20));
        gradient.addColorStop(1, baseColor);
        
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = (isHovered ? 4 : 3) / globalScale;
        ctx.stroke();
        
        // Colored border
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();

        // Initial with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3 / globalScale;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${nodeSize * 0.55}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name.charAt(0).toUpperCase(), x, y);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Enhanced name label with better background
      const labelText = node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name;
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 12 / globalScale;
      const labelHeight = 20 / globalScale;
      const labelY = y + nodeSize + 5 / globalScale;
      
      // Label background with rounded corners
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      drawRoundedRect(ctx, x - labelWidth / 2, labelY, labelWidth, labelHeight, 4 / globalScale, 'rgba(0, 0, 0, 0.75)');
      
      // Border for label
      ctx.strokeStyle = node.color || '#3b82f6';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
      
      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${10 / globalScale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText, x, labelY + 4 / globalScale);
      
    } else if (node.type === 'company') {
      // Draw company node with enhanced visuals
      const companySize = size * 0.85;
      const adjustedSize = companySize + (isHovered ? 3 : 0) / globalScale;
      const radius = 6 / globalScale;
      
      // Glow on hover
      if (isHovered || isHighlighted) {
        const glowGradient = ctx.createRadialGradient(x, y, adjustedSize, x, y, adjustedSize + 12 / globalScale);
        glowGradient.addColorStop(0, '#f59e0b80');
        glowGradient.addColorStop(1, '#f59e0b00');
        
        ctx.beginPath();
        ctx.arc(x, y, adjustedSize + 12 / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
      
      // Rounded rectangle with gradient
      const gradient = ctx.createLinearGradient(x - adjustedSize, y - adjustedSize, x + adjustedSize, y + adjustedSize);
      gradient.addColorStop(0, '#fbbf24');
      gradient.addColorStop(1, '#f59e0b');
      
      drawRoundedRect(ctx, x - adjustedSize, y - adjustedSize, adjustedSize * 2, adjustedSize * 2, radius, gradient);
      
      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = (isHovered ? 3 : 2) / globalScale;
      ctx.stroke();

      // Company logo or initial
      const cachedImg = node.image ? imageCache.get(node.image) : null;
      if (cachedImg) {
        ctx.save();
        drawRoundedRect(ctx, x - adjustedSize, y - adjustedSize, adjustedSize * 2, adjustedSize * 2, radius, null, true);
        ctx.clip();
        ctx.drawImage(cachedImg, x - adjustedSize, y - adjustedSize, adjustedSize * 2, adjustedSize * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${adjustedSize * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name.charAt(0).toUpperCase(), x, y);
      }

      // Company name label
      const labelText = node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name;
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 8 / globalScale;
      const labelHeight = 16 / globalScale;
      const labelY = y + adjustedSize + 4 / globalScale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      drawRoundedRect(ctx, x - labelWidth / 2, labelY, labelWidth, labelHeight, 3 / globalScale, 'rgba(0, 0, 0, 0.75)');
      
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${9 / globalScale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText, x, labelY + 3 / globalScale);
    }
  }, [hoveredNode, selectedNode, highlightedNodes, imageCache]);

  // Helper function to lighten color
  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // Helper function to draw rounded rectangle
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string | CanvasGradient | null = null,
    clip: boolean = false
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fillStyle && !clip) {
      if (typeof fillStyle === 'string') {
        ctx.fillStyle = fillStyle;
      } else {
        ctx.fillStyle = fillStyle;
      }
      ctx.fill();
    }
  };

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    
    if (node) {
      // Highlight connected nodes
      const connected = new Set<string>([node.id]);
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (sourceId === node.id) connected.add(targetId);
        if (targetId === node.id) connected.add(sourceId);
      });
      setHighlightedNodes(connected);
    } else {
      setHighlightedNodes(new Set());
    }
  }, [graphData]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden relative"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
        `,
      }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel={(node: GraphNode) => {
          if (node.type === 'bamas') {
            return 'BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION\nCore of the Network';
          } else if (node.type === 'company') {
            return `${node.name}\n${node.company?.activity_description || 'Company'}\n${node.company?.headquarters_address || ''}`;
          }
          return `${node.name}\n${node.user?.email || ''}\n${node.user?.role || 'Member'}`;
        }}
        linkColor={(link: GraphLink) => link.color || '#60a5fa'}
        linkWidth={(link: GraphLink) => {
          const isHighlighted = highlightedNodes.size > 0 && (
            (typeof link.source === 'string' ? highlightedNodes.has(link.source) : highlightedNodes.has(link.source.id)) ||
            (typeof link.target === 'string' ? highlightedNodes.has(link.target) : highlightedNodes.has(link.target.id))
          );
          return link.type === 'company' 
            ? (isHighlighted ? 3 : 2)
            : (isHighlighted ? 2.5 : 1.5);
        }}
        linkDirectionalArrowLength={0}
        linkOpacity={(link: GraphLink) => {
          if (highlightedNodes.size === 0) return link.opacity || 0.4;
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          return highlightedNodes.has(sourceId) || highlightedNodes.has(targetId) ? 0.8 : 0.15;
        }}
        linkCurvature={0.1}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDragEnd={(node: GraphNode) => {
          // Allow dragging but keep BAMAS fixed
          if (node.type === 'bamas') {
            node.fx = dimensions.width / 2;
            node.fy = dimensions.height / 2;
          } else {
            node.fx = node.x;
            node.fy = node.y;
          }
        }}
        cooldownTicks={200}
        onEngineStop={() => {
          if (fgRef.current) {
            fgRef.current.zoomToFit(400, 80);
          }
        }}
        nodeCanvasObject={nodePaint}
        d3VelocityDecay={0.25}
        d3AlphaDecay={0.02}
        warmupTicks={150}
        nodeRepulsion={(node: GraphNode) => {
          if (node.type === 'bamas') return 400;
          if (node.type === 'company') return 60;
          return 120;
        }}
        linkDistance={(link: GraphLink) => {
          if (link.type === 'company') return 140;
          return 250;
        }}
        backgroundColor="transparent"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-xs text-white border border-slate-700">
        <div className="font-bold mb-2">Network Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>BAMAS Core</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Companies</span>
          </div>
        </div>
      </div>
    </div>
  );
};
