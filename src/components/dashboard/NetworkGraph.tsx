import { useMemo, useRef, useEffect, useState } from 'react';
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
}

interface GraphLink {
  source: string;
  target: string;
  type: 'member' | 'company';
  color?: string;
}

export const NetworkGraph = ({ members, companies, width = 800, height = 600 }: NetworkGraphProps) => {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width),
          height: Math.max(600, rect.height),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Build graph data
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const graphWidth = dimensions.width;
    const graphHeight = dimensions.height;

    // Add BAMAS center node (fixed position)
    const bamasNode: GraphNode = {
      id: 'bamas',
      type: 'bamas',
      name: 'BAMAS',
      label: 'BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION',
      fx: graphWidth / 2, // Fixed X position
      fy: graphHeight / 2, // Fixed Y position
      size: 80,
      color: '#10b981', // Primary green color
    };
    nodes.push(bamasNode);

    // Add user nodes
    const approvedMembers = members.filter(m => m.status === 'approved');
    approvedMembers.forEach((member, index) => {
      const angle = (index / approvedMembers.length) * 2 * Math.PI;
      const radius = Math.min(graphWidth, graphHeight) * 0.35;
      const initialX = graphWidth / 2 + radius * Math.cos(angle);
      const initialY = graphHeight / 2 + radius * Math.sin(angle);

      const userNode: GraphNode = {
        id: `user-${member.id}`,
        type: 'user',
        name: member.name,
        image: member.image,
        label: member.name,
        x: initialX,
        y: initialY,
        size: 50,
        color: member.role === 'superadmin' || member.role === 'admin' 
          ? '#ef4444' // Red for admins
          : '#3b82f6', // Blue for regular members
        user: member,
      };
      nodes.push(userNode);

      // Link user to BAMAS
      links.push({
        source: 'bamas',
        target: `user-${member.id}`,
        type: 'member',
        color: '#6b7280', // Gray connections
      });
    });

    // Add company nodes and link them to their creators
    companies.forEach((company, index) => {
      const creatorNode = nodes.find(n => n.type === 'user' && n.user?.id === company.created_by);
      
      if (creatorNode) {
        // Calculate position relative to creator
        const creatorAngle = Math.atan2(
          (creatorNode.y || graphHeight / 2) - graphHeight / 2,
          (creatorNode.x || graphWidth / 2) - graphWidth / 2
        );
        const branchAngle = creatorAngle + (index % 2 === 0 ? 0.5 : -0.5); // Alternate sides
        const branchRadius = 100;
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
          size: 40,
          color: '#f59e0b', // Orange/amber for companies
          company: company,
        };
        nodes.push(companyNode);

        // Link company to its creator
        links.push({
          source: `user-${company.created_by}`,
          target: `company-${company.id}`,
          type: 'company',
          color: '#f59e0b', // Orange for company connections
        });
      }
    });

    return { nodes, links };
  }, [members, companies, dimensions.width, dimensions.height]);

  // Image cache for avatars
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

  // Custom node paint function
  const nodePaint = (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = (node.size || 30) / globalScale;
    const x = node.x || 0;
    const y = node.y || 0;
    
    if (node.type === 'bamas') {
      // Draw BAMAS logo circle with gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#059669');
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4 / globalScale;
      ctx.stroke();

      // Draw BAMAS text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${11 / globalScale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = 'BAMAS';
      ctx.fillText(text, x, y - 8 / globalScale);
      ctx.font = `${8 / globalScale}px sans-serif`;
      ctx.fillText('BULGARIAN', x, y + 8 / globalScale);
    } else if (node.type === 'user') {
      // Draw user avatar circle
      const cachedImg = node.image ? imageCache.get(node.image) : null;
      
      if (cachedImg) {
        // Draw cached image
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(cachedImg, x - size, y - size, size * 2, size * 2);
        ctx.restore();
        
        // Draw border
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.strokeStyle = node.color || '#3b82f6';
        ctx.lineWidth = 3 / globalScale;
        ctx.stroke();
      } else {
        // Draw colored circle with initial
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();

        // Draw initial
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name.charAt(0).toUpperCase(), x, y);
      }

      // Draw name label below with background
      const labelText = node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name;
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 8 / globalScale;
      const labelHeight = 16 / globalScale;
      
      // Background for text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x - labelWidth / 2, y + size + 2 / globalScale, labelWidth, labelHeight);
      
      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `${9 / globalScale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText, x, y + size + 4 / globalScale);
    } else if (node.type === 'company') {
      // Draw company node (smaller, square-ish shape)
      const companySize = size * 0.8;
      const radius = 4 / globalScale;
      
      // Draw rounded rectangle
      ctx.beginPath();
      ctx.moveTo(x - companySize + radius, y - companySize);
      ctx.lineTo(x + companySize - radius, y - companySize);
      ctx.quadraticCurveTo(x + companySize, y - companySize, x + companySize, y - companySize + radius);
      ctx.lineTo(x + companySize, y + companySize - radius);
      ctx.quadraticCurveTo(x + companySize, y + companySize, x + companySize - radius, y + companySize);
      ctx.lineTo(x - companySize + radius, y + companySize);
      ctx.quadraticCurveTo(x - companySize, y + companySize, x - companySize, y + companySize - radius);
      ctx.lineTo(x - companySize, y - companySize + radius);
      ctx.quadraticCurveTo(x - companySize, y - companySize, x - companySize + radius, y - companySize);
      ctx.closePath();
      
      ctx.fillStyle = node.color || '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();

      // Draw company icon or initial
      const cachedImg = node.image ? imageCache.get(node.image) : null;
      if (cachedImg) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - companySize + radius, y - companySize);
        ctx.lineTo(x + companySize - radius, y - companySize);
        ctx.quadraticCurveTo(x + companySize, y - companySize, x + companySize, y - companySize + radius);
        ctx.lineTo(x + companySize, y + companySize - radius);
        ctx.quadraticCurveTo(x + companySize, y + companySize, x + companySize - radius, y + companySize);
        ctx.lineTo(x - companySize + radius, y + companySize);
        ctx.quadraticCurveTo(x - companySize, y + companySize, x - companySize, y + companySize - radius);
        ctx.lineTo(x - companySize, y - companySize + radius);
        ctx.quadraticCurveTo(x - companySize, y - companySize, x - companySize + radius, y - companySize);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(cachedImg, x - companySize, y - companySize, companySize * 2, companySize * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${companySize * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name.charAt(0).toUpperCase(), x, y);
      }

      // Draw company name label
      const labelText = node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name;
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 6 / globalScale;
      const labelHeight = 14 / globalScale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x - labelWidth / 2, y + companySize + 2 / globalScale, labelWidth, labelHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `${8 / globalScale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText, x, y + companySize + 3 / globalScale);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 rounded-lg border overflow-hidden relative"
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel={(node: GraphNode) => {
          if (node.type === 'bamas') {
            return 'BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION';
          } else if (node.type === 'company') {
            return `${node.name}\n${node.company?.activity_description || ''}`;
          }
          return `${node.name}\n${node.user?.email || ''}`;
        }}
        linkColor={(link: GraphLink) => link.color || '#6b7280'}
        linkWidth={(link: GraphLink) => link.type === 'company' ? 2 : 1.5}
        linkDirectionalArrowLength={0}
        linkOpacity={0.6}
        onNodeClick={(node: GraphNode) => {
          console.log('Node clicked:', node);
        }}
        onNodeHover={(node: GraphNode | null) => {
          if (node && fgRef.current) {
            // Highlight node on hover
          }
        }}
        cooldownTicks={150}
        onEngineStop={() => {
          if (fgRef.current) {
            fgRef.current.zoomToFit(400, 50);
          }
        }}
        nodeCanvasObject={nodePaint}
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.0228}
        warmupTicks={100}
        nodeRepulsion={(node: GraphNode) => {
          if (node.type === 'bamas') return 300;
          if (node.type === 'company') return 50;
          return 100;
        }}
        linkDistance={(link: GraphLink) => {
          if (link.type === 'company') return 120;
          return 200;
        }}
      />
    </div>
  );
};

