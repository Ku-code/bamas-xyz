import type { User } from '@/contexts/AuthContext';
import type { Company } from '@/lib/companies';

// Shared interfaces for both 2D and 3D network graphs
export interface GraphNode {
  id: string;
  type: 'bamas' | 'user' | 'company';
  name: string;
  image?: string;
  label: string;
  x?: number;
  y?: number;
  z?: number; // For 3D
  vx?: number;
  vy?: number;
  vz?: number; // For 3D
  fx?: number | null;
  fy?: number | null;
  fz?: number | null; // For 3D
  size?: number;
  color?: string;
  user?: User;
  company?: Company;
  hovered?: boolean;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'member' | 'company';
  color?: string;
  opacity?: number;
}

export interface NetworkGraphProps {
  members: User[];
  companies: Company[];
  width?: number;
  height?: number;
}

// Utility function to get node color based on role
export const getNodeColor = (role: string): string => {
  switch (role) {
    case 'superadmin':
      return '#ef4444'; // Red
    case 'admin':
      return '#f59e0b'; // Orange
    case 'board_member':
      return '#8b5cf6'; // Purple
    case 'wg_lead':
      return '#06b6d4'; // Cyan
    default:
      return '#3b82f6'; // Blue
  }
};

// Calculate 3D sphere position for nodes
export const calculateSpherePosition = (
  index: number,
  total: number,
  radius: number
): { x: number; y: number; z: number } => {
  // Use golden angle spiral for even distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = goldenAngle * index;
  const y = 1 - (index / (total - 1)) * 2; // y goes from 1 to -1
  const radiusAtY = Math.sqrt(1 - y * y);
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;
  
  return {
    x: x * radius,
    y: y * radius,
    z: z * radius,
  };
};

// Device capability detection
export const detectDeviceCapability = (): {
  canHandle3D: boolean;
  isMobile: boolean;
  recommendedQuality: 'low' | 'medium' | 'high';
} => {
  if (typeof window === 'undefined') {
    return { canHandle3D: false, isMobile: false, recommendedQuality: 'low' };
  }

  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  // Check WebGL support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const hasWebGL = !!gl;
  
  // Check for high DPI
  const hasHighDPI = window.devicePixelRatio > 1.5;
  
  // Check for hardware acceleration hints
  const userAgent = navigator.userAgent.toLowerCase();
  const isLowEndDevice = 
    /android.*(?:mobile|tablet)/i.test(userAgent) && 
    /chrome/i.test(userAgent) === false; // Non-Chrome Android often has issues
  
  // Determine capability
  let canHandle3D = hasWebGL;
  let recommendedQuality: 'low' | 'medium' | 'high' = 'medium';
  
  if (isMobile || isLowEndDevice) {
    canHandle3D = hasWebGL && !isLowEndDevice;
    recommendedQuality = 'low';
  } else if (isTablet) {
    recommendedQuality = 'medium';
  } else {
    recommendedQuality = hasHighDPI ? 'high' : 'medium';
  }
  
  return {
    canHandle3D,
    isMobile,
    recommendedQuality,
  };
};

// Build graph data structure (shared between 2D and 3D)
export const buildGraphData = (
  members: User[],
  companies: Company[],
  dimensions?: { width: number; height: number }
) => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Add BAMAS center node
  const bamasNode: GraphNode = {
    id: 'bamas',
    type: 'bamas',
    name: 'BAMAS',
    label: 'BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION',
    x: dimensions ? dimensions.width / 2 : 0,
    y: dimensions ? dimensions.height / 2 : 0,
    z: 0,
    fx: dimensions ? dimensions.width / 2 : 0,
    fy: dimensions ? dimensions.height / 2 : 0,
    fz: 0,
    size: 100,
    color: '#10b981',
  };
  nodes.push(bamasNode);

  // Add user nodes
  const approvedMembers = members.filter(m => m.status === 'approved');
  
  approvedMembers.forEach((member, index) => {
    const nodeColor = getNodeColor(member.role);
    
    const userNode: GraphNode = {
      id: `user-${member.id}`,
      type: 'user',
      name: member.name,
      image: member.image,
      label: member.name,
      size: 60,
      color: nodeColor,
      user: member,
    };
    nodes.push(userNode);

    // Link user to BAMAS
    links.push({
      source: 'bamas',
      target: `user-${member.id}`,
      type: 'member',
      color: '#60a5fa',
      opacity: 0.4,
    });
  });

  // Add company nodes
  companies.forEach((company) => {
    const creatorNode = nodes.find(n => n.type === 'user' && n.user?.id === company.created_by);
    
    if (creatorNode) {
      const companyNode: GraphNode = {
        id: `company-${company.id}`,
        type: 'company',
        name: company.name,
        image: company.logo_url,
        label: company.name,
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
        color: '#fbbf24',
        opacity: 0.5,
      });
    }
  });

  return { nodes, links };
};

