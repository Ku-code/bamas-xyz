import { supabase } from './supabase';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Material {
  id: string;
  name: string;
  name_bg?: string;
  category: 'Metal' | 'Polymer';
  subcategory?: string;
  description_en?: string;
  description_bg?: string;
  
  // Physical Properties
  tensile_strength_mpa?: number;
  yield_strength_mpa?: number;
  elongation_percent?: number;
  hardness_hb?: number;
  density_g_cm3?: number;
  melting_point_c?: number;
  thermal_conductivity_w_mk?: number;
  
  // Economic Properties
  cost_per_kg_usd?: number;
  cost_per_kg_bgn?: number;
  
  // Process Properties
  printability_score?: number;
  post_processing_required?: boolean;
  post_processing_types?: string[];
  
  // Metadata
  standard_reference?: string;
  safety_notes?: string;
  applications?: string[];
  tags?: string[];
  
  created_at: string;
  updated_at?: string;
}

export interface PrinterSpec {
  id: string;
  printer_name: string;
  manufacturer: string;
  technology: 'SLA' | 'SLS' | 'FDM' | 'EBM' | 'DMLS' | 'MJF' | 'PolyJet' | 'CLIP' | 'Other';
  max_build_volume_x?: number;
  max_build_volume_y?: number;
  max_build_volume_z?: number;
  max_temperature_c?: number;
  supported_materials?: string[];
  layer_resolution_min?: number;
  layer_resolution_max?: number;
  is_metal_capable: boolean;
  is_polymer_capable: boolean;
  created_at: string;
}

export interface MaterialCompatibility {
  id: string;
  material_id: string;
  printer_id: string;
  compatibility_score: number;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface MaterialFilters {
  category?: 'Metal' | 'Polymer';
  subcategory?: string;
  min_tensile_strength?: number;
  max_tensile_strength?: number;
  min_yield_strength?: number;
  max_yield_strength?: number;
  max_cost_per_kg?: number;
  min_printability_score?: number;
  tags?: string[];
  search?: string;
}

export interface MaterialRequirements {
  min_tensile_strength?: number;
  min_yield_strength?: number;
  max_cost_per_kg?: number;
  max_density?: number;
  min_melting_point?: number;
  category?: 'Metal' | 'Polymer';
  must_be_printable?: boolean;
}

export interface ScoringWeights {
  cost: number;        // 0-100
  strength: number;    // 0-100
  printability: number; // 0-100
  durability: number;  // 0-100
}

export interface MaterialMatch {
  material: Material;
  compatibility_score: number; // 0-100
  match_percentage: number;    // 0-100
  matched_requirements: string[];
  missing_requirements: string[];
}

// ============================================
// MATERIAL CRUD OPERATIONS
// ============================================

/**
 * Load materials with optional filters
 */
export const loadMaterials = async (filters?: MaterialFilters): Promise<Material[]> => {
  try {
    let query = supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (filters) {
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }
      if (filters.min_tensile_strength !== undefined) {
        query = query.gte('tensile_strength_mpa', filters.min_tensile_strength);
      }
      if (filters.max_tensile_strength !== undefined) {
        query = query.lte('tensile_strength_mpa', filters.max_tensile_strength);
      }
      if (filters.min_yield_strength !== undefined) {
        query = query.gte('yield_strength_mpa', filters.min_yield_strength);
      }
      if (filters.max_yield_strength !== undefined) {
        query = query.lte('yield_strength_mpa', filters.max_yield_strength);
      }
      if (filters.max_cost_per_kg !== undefined) {
        query = query.lte('cost_per_kg_usd', filters.max_cost_per_kg);
      }
      if (filters.min_printability_score !== undefined) {
        query = query.gte('printability_score', filters.min_printability_score);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`name.ilike.%${searchTerm}%,name_bg.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%,description_bg.ilike.%${searchTerm}%`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Material[];
  } catch (error: any) {
    console.error('Error loading materials:', error);
    // Check if tables don't exist
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
      console.warn('Materials table not found. Please run migration 021_material_database.sql');
      return []; // Return empty array instead of throwing
    }
    throw error;
  }
};

/**
 * Get single material by ID
 */
export const getMaterialById = async (id: string): Promise<Material | null> => {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return data as Material;
  } catch (error: any) {
    console.error('Error getting material:', error);
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Materials table not found. Please run migration 021_material_database.sql');
      return null;
    }
    throw error;
  }
};

// ============================================
// PRINTER SPECS OPERATIONS
// ============================================

/**
 * Load all printer specifications
 */
export const loadPrinters = async (): Promise<PrinterSpec[]> => {
  try {
    const { data, error } = await supabase
      .from('printer_specs')
      .select('*')
      .order('printer_name', { ascending: true });

    if (error) throw error;

    return (data || []) as PrinterSpec[];
  } catch (error: any) {
    console.error('Error loading printers:', error);
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Printer specs table not found. Please run migration 021_material_database.sql');
      return [];
    }
    throw error;
  }
};

/**
 * Get single printer by ID
 */
export const getPrinterById = async (id: string): Promise<PrinterSpec | null> => {
  try {
    const { data, error } = await supabase
      .from('printer_specs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return data as PrinterSpec;
  } catch (error: any) {
    console.error('Error getting printer:', error);
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Printer specs table not found. Please run migration 021_material_database.sql');
      return null;
    }
    throw error;
  }
};

// ============================================
// COMPATIBILITY OPERATIONS
// ============================================

/**
 * Load compatibility data for a material
 */
export const loadCompatibility = async (materialId: string): Promise<MaterialCompatibility[]> => {
  try {
    const { data, error } = await supabase
      .from('material_compatibility')
      .select('*')
      .eq('material_id', materialId)
      .order('compatibility_score', { ascending: false });

    if (error) throw error;

    return (data || []) as MaterialCompatibility[];
  } catch (error: any) {
    console.error('Error loading compatibility:', error);
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Compatibility table not found. Please run migration 021_material_database.sql');
      return [];
    }
    throw error;
  }
};

/**
 * Load compatibility data for a printer
 */
export const loadCompatibilityByPrinter = async (printerId: string): Promise<MaterialCompatibility[]> => {
  try {
    const { data, error } = await supabase
      .from('material_compatibility')
      .select('*')
      .eq('printer_id', printerId)
      .order('compatibility_score', { ascending: false });

    if (error) throw error;

    return (data || []) as MaterialCompatibility[];
  } catch (error: any) {
    console.error('Error loading compatibility by printer:', error);
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Compatibility table not found. Please run migration 021_material_database.sql');
      return [];
    }
    throw error;
  }
};

// ============================================
// WEIGHTED SCORING ALGORITHM
// ============================================

/**
 * Normalize a value to 0-1 scale based on min/max
 */
const normalize = (value: number, min: number, max: number, inverse: boolean = false): number => {
  if (max === min) return 0.5; // Avoid division by zero
  const normalized = (value - min) / (max - min);
  return inverse ? 1 - normalized : normalized;
};

/**
 * Calculate durability score (composite of hardness, elongation, thermal properties)
 */
const calculateDurabilityScore = (material: Material, allMaterials: Material[]): number => {
  const hardnessValues = allMaterials
    .map(m => m.hardness_hb)
    .filter((v): v is number => v !== undefined && v !== null);
  const elongationValues = allMaterials
    .map(m => m.elongation_percent)
    .filter((v): v is number => v !== undefined && v !== null);
  const thermalValues = allMaterials
    .map(m => m.thermal_conductivity_w_mk)
    .filter((v): v is number => v !== undefined && v !== null);

  const hardnessMin = Math.min(...hardnessValues);
  const hardnessMax = Math.max(...hardnessValues);
  const elongationMin = Math.min(...elongationValues);
  const elongationMax = Math.max(...elongationValues);
  const thermalMin = Math.min(...thermalValues);
  const thermalMax = Math.max(...thermalValues);

  let durabilityScore = 0;
  let factors = 0;

  if (material.hardness_hb !== undefined && hardnessMax > hardnessMin) {
    durabilityScore += normalize(material.hardness_hb, hardnessMin, hardnessMax) * 0.4;
    factors += 0.4;
  }
  if (material.elongation_percent !== undefined && elongationMax > elongationMin) {
    durabilityScore += normalize(material.elongation_percent, elongationMin, elongationMax) * 0.3;
    factors += 0.3;
  }
  if (material.thermal_conductivity_w_mk !== undefined && thermalMax > thermalMin) {
    durabilityScore += normalize(material.thermal_conductivity_w_mk, thermalMin, thermalMax) * 0.3;
    factors += 0.3;
  }

  return factors > 0 ? durabilityScore / factors : 0.5;
};

/**
 * Calculate compatibility match for a single material
 */
export const calculateCompatibilityMatch = (
  material: Material,
  requirements: MaterialRequirements,
  weights: ScoringWeights,
  allMaterials: Material[]
): MaterialMatch => {
  const matchedRequirements: string[] = [];
  const missingRequirements: string[] = [];

  // Check requirements
  if (requirements.min_tensile_strength !== undefined) {
    if (material.tensile_strength_mpa && material.tensile_strength_mpa >= requirements.min_tensile_strength) {
      matchedRequirements.push('tensile_strength');
    } else {
      missingRequirements.push('tensile_strength');
    }
  }
  if (requirements.min_yield_strength !== undefined) {
    if (material.yield_strength_mpa && material.yield_strength_mpa >= requirements.min_yield_strength) {
      matchedRequirements.push('yield_strength');
    } else {
      missingRequirements.push('yield_strength');
    }
  }
  if (requirements.max_cost_per_kg !== undefined) {
    if (material.cost_per_kg_usd && material.cost_per_kg_usd <= requirements.max_cost_per_kg) {
      matchedRequirements.push('cost');
    } else {
      missingRequirements.push('cost');
    }
  }
  if (requirements.max_density !== undefined) {
    if (material.density_g_cm3 && material.density_g_cm3 <= requirements.max_density) {
      matchedRequirements.push('density');
    } else {
      missingRequirements.push('density');
    }
  }
  if (requirements.min_melting_point !== undefined) {
    if (material.melting_point_c && material.melting_point_c >= requirements.min_melting_point) {
      matchedRequirements.push('melting_point');
    } else {
      missingRequirements.push('melting_point');
    }
  }
  if (requirements.category) {
    if (material.category === requirements.category) {
      matchedRequirements.push('category');
    } else {
      missingRequirements.push('category');
    }
  }
  if (requirements.must_be_printable) {
    if (material.printability_score && material.printability_score >= 5) {
      matchedRequirements.push('printability');
    } else {
      missingRequirements.push('printability');
    }
  }

  // Calculate normalized scores for each factor
  const costValues = allMaterials
    .map(m => m.cost_per_kg_usd)
    .filter((v): v is number => v !== undefined && v !== null);
  const strengthValues = allMaterials
    .map(m => material.category === 'Metal' ? m.tensile_strength_mpa : m.tensile_strength_mpa)
    .filter((v): v is number => v !== undefined && v !== null);
  const printabilityValues = allMaterials
    .map(m => m.printability_score)
    .filter((v): v is number => v !== undefined && v !== null);

  const costMin = Math.min(...costValues);
  const costMax = Math.max(...costValues);
  const strengthMin = Math.min(...strengthValues);
  const strengthMax = Math.max(...strengthValues);
  const printabilityMin = Math.min(...printabilityValues);
  const printabilityMax = Math.max(...printabilityValues);

  // Normalize scores (0-1)
  const costScore = material.cost_per_kg_usd 
    ? normalize(material.cost_per_kg_usd, costMin, costMax, true) // Inverse: lower is better
    : 0.5;
  
  const strengthScore = material.tensile_strength_mpa
    ? normalize(material.tensile_strength_mpa, strengthMin, strengthMax, false) // Higher is better
    : 0.5;
  
  const printabilityScore = material.printability_score
    ? normalize(material.printability_score, printabilityMin, printabilityMax, false) // Higher is better
    : 0.5;
  
  const durabilityScore = calculateDurabilityScore(material, allMaterials);

  // Calculate total weight
  const totalWeight = weights.cost + weights.strength + weights.printability + weights.durability;
  if (totalWeight === 0) {
    // Default equal weights if all are zero
    const defaultWeight = 25;
    const weightedScore = (
      defaultWeight * costScore +
      defaultWeight * strengthScore +
      defaultWeight * printabilityScore +
      defaultWeight * durabilityScore
    ) / 100;
    
    // Bonus for meeting requirements
    const requirementBonus = matchedRequirements.length / (matchedRequirements.length + missingRequirements.length || 1);
    const finalScore = Math.min(1, weightedScore * 0.8 + requirementBonus * 0.2);
    
    return {
      material,
      compatibility_score: Math.round(finalScore * 100),
      match_percentage: Math.round(finalScore * 100),
      matched_requirements: matchedRequirements,
      missing_requirements: missingRequirements,
    };
  }

  // Calculate weighted score
  const weightedScore = (
    weights.cost * costScore +
    weights.strength * strengthScore +
    weights.printability * printabilityScore +
    weights.durability * durabilityScore
  ) / totalWeight;

  // Bonus for meeting requirements (20% of final score)
  const requirementBonus = matchedRequirements.length / (matchedRequirements.length + missingRequirements.length || 1);
  const finalScore = Math.min(1, weightedScore * 0.8 + requirementBonus * 0.2);

  return {
    material,
    compatibility_score: Math.round(finalScore * 100),
    match_percentage: Math.round(finalScore * 100),
    matched_requirements: matchedRequirements,
    missing_requirements: missingRequirements,
  };
};

/**
 * Rank materials based on requirements and weights
 */
export const rankMaterials = async (
  requirements: MaterialRequirements,
  weights: ScoringWeights
): Promise<MaterialMatch[]> => {
  try {
    // Load all materials
    const materials = await loadMaterials({
      category: requirements.category,
    });

    if (materials.length === 0) {
      return [];
    }

    // Calculate matches for all materials
    const matches = materials.map(material =>
      calculateCompatibilityMatch(material, requirements, weights, materials)
    );

    // Sort by match percentage (descending)
    matches.sort((a, b) => b.match_percentage - a.match_percentage);

    return matches;
  } catch (error: any) {
    console.error('Error ranking materials:', error);
    return [];
  }
};
