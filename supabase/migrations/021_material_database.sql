-- ============================================
-- MATERIAL DATABASE & COMPATIBILITY SYSTEM
-- Migration 021: Complete material database infrastructure
-- ============================================
-- Tables: materials, printer_specs, material_compatibility
-- Features: Material properties, printer specifications, compatibility matching
-- ============================================

-- ============================================
-- TABLE: materials
-- ============================================

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Information
  name TEXT NOT NULL,
  name_bg TEXT,
  category TEXT NOT NULL CHECK (category IN ('Metal', 'Polymer')),
  subcategory TEXT,
  description_en TEXT,
  description_bg TEXT,
  
  -- Physical Properties
  tensile_strength_mpa DECIMAL(10,2),
  yield_strength_mpa DECIMAL(10,2),
  elongation_percent DECIMAL(5,2),
  hardness_hb DECIMAL(8,2),
  density_g_cm3 DECIMAL(8,4),
  melting_point_c DECIMAL(8,2),
  thermal_conductivity_w_mk DECIMAL(8,4),
  
  -- Economic Properties
  cost_per_kg_usd DECIMAL(10,2),
  cost_per_kg_bgn DECIMAL(10,2),
  
  -- Process Properties
  printability_score INTEGER CHECK (printability_score >= 1 AND printability_score <= 10),
  post_processing_required BOOLEAN DEFAULT false,
  post_processing_types TEXT[] DEFAULT '{}',
  
  -- Metadata
  standard_reference TEXT,
  safety_notes TEXT,
  applications TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  UNIQUE(name)
);

-- Indexes for materials
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_subcategory ON materials(subcategory);
CREATE INDEX IF NOT EXISTS idx_materials_tensile_strength ON materials(tensile_strength_mpa);
CREATE INDEX IF NOT EXISTS idx_materials_cost ON materials(cost_per_kg_usd);
CREATE INDEX IF NOT EXISTS idx_materials_printability ON materials(printability_score);

-- ============================================
-- TABLE: printer_specs
-- ============================================

CREATE TABLE IF NOT EXISTS printer_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  printer_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  technology TEXT NOT NULL CHECK (technology IN ('SLA', 'SLS', 'FDM', 'EBM', 'DMLS', 'MJF', 'PolyJet', 'CLIP', 'Other')),
  
  -- Build Volume (mm)
  max_build_volume_x INTEGER,
  max_build_volume_y INTEGER,
  max_build_volume_z INTEGER,
  
  -- Temperature
  max_temperature_c DECIMAL(6,2),
  
  -- Supported Materials
  supported_materials TEXT[] DEFAULT '{}',
  
  -- Resolution
  layer_resolution_min DECIMAL(6,3), -- in mm
  layer_resolution_max DECIMAL(6,3), -- in mm
  
  -- Capabilities
  is_metal_capable BOOLEAN DEFAULT false,
  is_polymer_capable BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(printer_name, manufacturer)
);

-- Indexes for printer_specs
CREATE INDEX IF NOT EXISTS idx_printer_specs_technology ON printer_specs(technology);
CREATE INDEX IF NOT EXISTS idx_printer_specs_metal_capable ON printer_specs(is_metal_capable);
CREATE INDEX IF NOT EXISTS idx_printer_specs_polymer_capable ON printer_specs(is_polymer_capable);

-- ============================================
-- TABLE: material_compatibility
-- ============================================

CREATE TABLE IF NOT EXISTS material_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  printer_id UUID NOT NULL REFERENCES printer_specs(id) ON DELETE CASCADE,
  
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  notes TEXT,
  
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(material_id, printer_id)
);

-- Indexes for material_compatibility
CREATE INDEX IF NOT EXISTS idx_compatibility_material ON material_compatibility(material_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_printer ON material_compatibility(printer_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_score ON material_compatibility(compatibility_score DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_compatibility ENABLE ROW LEVEL SECURITY;

-- Materials: Public read, Admin-only write
CREATE POLICY "Materials are viewable by everyone"
  ON materials
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert materials"
  ON materials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can update materials"
  ON materials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can delete materials"
  ON materials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

-- Printer Specs: Public read, Admin-only write
CREATE POLICY "Printer specs are viewable by everyone"
  ON printer_specs
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert printer specs"
  ON printer_specs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can update printer specs"
  ON printer_specs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can delete printer specs"
  ON printer_specs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

-- Material Compatibility: Public read, Admin-only write
CREATE POLICY "Compatibility is viewable by everyone"
  ON material_compatibility
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert compatibility"
  ON material_compatibility
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can update compatibility"
  ON material_compatibility
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can delete compatibility"
  ON material_compatibility
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

-- ============================================
-- SEED DATA: Materials (50+ industrial materials)
-- ============================================

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM users 
  WHERE role IN ('superadmin', 'admin') 
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users LIMIT 1;
  END IF;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create at least one user before running this seed.';
  END IF;

  -- METALS (25+ materials)
  INSERT INTO materials (name, name_bg, category, subcategory, description_en, description_bg, 
    tensile_strength_mpa, yield_strength_mpa, elongation_percent, hardness_hb, density_g_cm3, 
    melting_point_c, thermal_conductivity_w_mk, cost_per_kg_usd, cost_per_kg_bgn, 
    printability_score, post_processing_required, post_processing_types, applications, tags)
  VALUES
  -- Titanium Alloys
  ('Ti-6Al-4V', 'Ti-6Al-4V', 'Metal', 'Titanium Alloy', 
   'Ti-6Al-4V (Ti64) is the most commonly used titanium alloy in additive manufacturing, known for excellent strength-to-weight ratio and biocompatibility.',
   'Ti-6Al-4V (Ti64) е най-често използваният титанов сплав в адитивното производство, известен с отлично съотношение якост-тегло и биосъвместимост.',
   900, 830, 14, 334, 4.43, 1604, 6.7, 120.00, 216.00, 8, true, 
   ARRAY['Heat Treatment', 'HIP'], 
   ARRAY['Aerospace', 'Medical Implants', 'Automotive'], 
   ARRAY['titanium', 'aerospace', 'medical', 'high_strength'])
  ON CONFLICT (name) DO NOTHING,

  ('Ti-6Al-4V ELI', 'Ti-6Al-4V ELI', 'Metal', 'Titanium Alloy',
   'Extra Low Interstitial version of Ti-6Al-4V with improved ductility and fracture toughness for medical applications.',
   'Версия с изключително ниско съдържание на междукристални елементи на Ti-6Al-4V с подобрена пластичност и твърдост на счупване за медицински приложения.',
   860, 795, 15, 320, 4.43, 1604, 6.7, 140.00, 252.00, 8, true,
   ARRAY['Heat Treatment', 'HIP'],
   ARRAY['Medical Implants', 'Aerospace'],
   ARRAY['titanium', 'medical', 'eli', 'biocompatible'])
  ON CONFLICT (name) DO NOTHING,

  -- Aluminum Alloys
  ('AlSi10Mg', 'AlSi10Mg', 'Metal', 'Aluminum Alloy',
   'Aluminum-silicon-magnesium alloy with excellent thermal properties and good printability, commonly used in automotive and aerospace.',
   'Алуминиево-силициево-магнезиев сплав с отлични топлинни свойства и добра печатаемост, често използван в автомобилната и авиационната промишленост.',
   400, 250, 8, 120, 2.68, 570, 113, 35.00, 63.00, 9, true,
   ARRAY['Heat Treatment'],
   ARRAY['Automotive', 'Aerospace', 'Heat Exchangers'],
   ARRAY['aluminum', 'lightweight', 'thermal', 'automotive'])
  ON CONFLICT (name) DO NOTHING,

  ('AlSi12', 'AlSi12', 'Metal', 'Aluminum Alloy',
   'Aluminum-silicon alloy with 12% silicon, offering good castability and thermal properties.',
   'Алуминиево-силициев сплав с 12% силиций, предлагащ добра леяемост и топлинни свойства.',
   350, 200, 10, 100, 2.65, 577, 120, 32.00, 57.60, 9, true,
   ARRAY['Heat Treatment'],
   ARRAY['Automotive', 'Heat Exchangers'],
   ARRAY['aluminum', 'silicon', 'thermal'])
  ON CONFLICT (name) DO NOTHING,

  -- Stainless Steels
  ('316L Stainless Steel', '316L Неръждаема стомана', 'Metal', 'Stainless Steel',
   'Low-carbon austenitic stainless steel with excellent corrosion resistance and biocompatibility.',
   'Нисковъглеродна аустенитна неръждаема стомана с отлична корозионна устойчивост и биосъвместимост.',
   520, 205, 50, 217, 7.99, 1375, 15, 25.00, 45.00, 7, true,
   ARRAY['Heat Treatment', 'Polishing'],
   ARRAY['Medical Devices', 'Marine', 'Food Processing'],
   ARRAY['stainless_steel', 'corrosion_resistant', 'medical', '316l'])
  ON CONFLICT (name) DO NOTHING,

  ('17-4 PH Stainless Steel', '17-4 PH Неръждаема стомана', 'Metal', 'Stainless Steel',
   'Precipitation-hardening stainless steel with high strength and good corrosion resistance.',
   'Неръждаема стомана с втвърдяване чрез отлагане с висока якост и добра корозионна устойчивост.',
   1100, 1000, 10, 363, 7.80, 1400, 18, 45.00, 81.00, 7, true,
   ARRAY['Heat Treatment', 'Aging'],
   ARRAY['Aerospace', 'Medical', 'Marine'],
   ARRAY['stainless_steel', 'high_strength', 'ph'])
  ON CONFLICT (name) DO NOTHING,

  -- Nickel Alloys
  ('Inconel 718', 'Inconel 718', 'Metal', 'Nickel Alloy',
   'Nickel-chromium superalloy with excellent high-temperature strength and corrosion resistance.',
   'Никел-хромов суперсплав с отлична якост при високи температури и корозионна устойчивост.',
   1275, 1035, 20, 352, 8.19, 1260, 11.4, 85.00, 153.00, 6, true,
   ARRAY['Heat Treatment', 'HIP', 'Solution Treatment'],
   ARRAY['Aerospace', 'Gas Turbines', 'Nuclear'],
   ARRAY['inconel', 'high_temperature', 'aerospace', 'superalloy'])
  ON CONFLICT (name) DO NOTHING,

  ('Inconel 625', 'Inconel 625', 'Metal', 'Nickel Alloy',
   'Nickel-chromium-molybdenum superalloy with excellent corrosion resistance and high-temperature properties.',
   'Никел-хром-молибденов суперсплав с отлична корозионна устойчивост и свойства при високи температури.',
   760, 345, 50, 200, 8.44, 1290, 9.8, 75.00, 135.00, 7, true,
   ARRAY['Heat Treatment'],
   ARRAY['Aerospace', 'Marine', 'Chemical Processing'],
   ARRAY['inconel', 'corrosion_resistant', 'high_temperature'])
  ON CONFLICT (name) DO NOTHING,

  -- Cobalt-Chromium
  ('CoCr (Co-28Cr-6Mo)', 'CoCr (Co-28Cr-6Mo)', 'Metal', 'Cobalt-Chromium',
   'Cobalt-chromium alloy with excellent wear resistance and biocompatibility for medical implants.',
   'Кобалт-хромов сплав с отлична износоустойчивост и биосъвместимост за медицински импланти.',
   900, 650, 20, 300, 8.30, 1395, 15, 95.00, 171.00, 7, true,
   ARRAY['Heat Treatment', 'HIP'],
   ARRAY['Medical Implants', 'Dental', 'Aerospace'],
   ARRAY['cobalt_chromium', 'medical', 'wear_resistant', 'biocompatible'])
  ON CONFLICT (name) DO NOTHING,

  -- Tool Steels
  ('Maraging Steel (18Ni300)', 'Маражингова стомана (18Ni300)', 'Metal', 'Tool Steel',
   'Ultra-high strength maraging steel with excellent toughness and dimensional stability.',
   'Ултра-висока якост маражингова стомана с отлична твърдост и размерна стабилност.',
   2000, 1950, 8, 500, 8.00, 1410, 20, 60.00, 108.00, 6, true,
   ARRAY['Aging', 'Heat Treatment'],
   ARRAY['Tooling', 'Aerospace', 'Molds'],
   ARRAY['maraging', 'ultra_high_strength', 'tool_steel'])
  ON CONFLICT (name) DO NOTHING,

  ('H13 Tool Steel', 'H13 Инструментална стомана', 'Metal', 'Tool Steel',
   'Hot-work tool steel with excellent thermal fatigue resistance and high hardness.',
   'Инструментална стомана за горещо формиране с отлична устойчивост на топлинна умора и висока твърдост.',
   1650, 1400, 10, 450, 7.80, 1427, 24.3, 40.00, 72.00, 6, true,
   ARRAY['Heat Treatment', 'Tempering'],
   ARRAY['Molds', 'Dies', 'Tooling'],
   ARRAY['tool_steel', 'h13', 'hot_work'])
  ON CONFLICT (name) DO NOTHING,

  -- POLYMERS (25+ materials)
  ('PEEK', 'PEEK', 'Polymer', 'High-Performance Polymer',
   'Polyether ether ketone is a high-performance thermoplastic with excellent mechanical and thermal properties.',
   'Полиетер етер кетон е високопроизводителен термопласт с отлични механични и топлинни свойства.',
   100, 90, 50, 99, 1.32, 343, 0.25, 180.00, 324.00, 6, false,
   ARRAY[]::TEXT[],
   ARRAY['Aerospace', 'Medical', 'Automotive', 'Electronics'],
   ARRAY['peek', 'high_performance', 'high_temperature', 'chemical_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('PEI (Ultem)', 'PEI (Ultem)', 'Polymer', 'High-Performance Polymer',
   'Polyetherimide is a high-performance thermoplastic with excellent heat resistance and mechanical properties.',
   'Полиетеримид е високопроизводителен термопласт с отлична топлоустойчивост и механични свойства.',
   105, 95, 60, 109, 1.27, 217, 0.22, 120.00, 216.00, 7, false,
   ARRAY[]::TEXT[],
   ARRAY['Aerospace', 'Medical', 'Electronics'],
   ARRAY['pei', 'ultem', 'high_temperature', 'flame_retardant'])
  ON CONFLICT (name) DO NOTHING,

  ('Nylon 12', 'Найлон 12', 'Polymer', 'Engineering Polymer',
   'Polyamide 12 with excellent chemical resistance, low moisture absorption, and good mechanical properties.',
   'Полиамид 12 с отлична химическа устойчивост, ниско поглъщане на влага и добри механични свойства.',
   50, 45, 300, 70, 1.01, 178, 0.25, 45.00, 81.00, 8, false,
   ARRAY[]::TEXT[],
   ARRAY['Automotive', 'Medical', 'Consumer Products'],
   ARRAY['nylon', 'pa12', 'chemical_resistant', 'flexible'])
  ON CONFLICT (name) DO NOTHING,

  ('Nylon 11', 'Найлон 11', 'Polymer', 'Engineering Polymer',
   'Polyamide 11 with good flexibility, impact resistance, and chemical resistance.',
   'Полиамид 11 с добра гъвкавост, ударна устойчивост и химическа устойчивост.',
   55, 50, 350, 75, 1.04, 186, 0.23, 50.00, 90.00, 8, false,
   ARRAY[]::TEXT[],
   ARRAY['Automotive', 'Medical', 'Consumer Products'],
   ARRAY['nylon', 'pa11', 'flexible', 'impact_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('ABS', 'ABS', 'Polymer', 'Standard Polymer',
   'Acrylonitrile Butadiene Styrene is a strong, durable thermoplastic commonly used in 3D printing.',
   'Акрилонитрил бутадиен стирол е здрав, устойчив термопласт, често използван в 3D печат.',
   40, 35, 20, 110, 1.04, 105, 0.17, 25.00, 45.00, 9, false,
   ARRAY[]::TEXT[],
   ARRAY['Prototyping', 'Consumer Products', 'Automotive'],
   ARRAY['abs', 'durable', 'functional', 'common'])
  ON CONFLICT (name) DO NOTHING,

  ('PLA', 'PLA', 'Polymer', 'Standard Polymer',
   'Polylactic Acid is a biodegradable thermoplastic derived from renewable resources.',
   'Полилактична киселина е биоразградим термопласт, получен от възобновяеми ресурси.',
   60, 50, 5, 80, 1.24, 150, 0.13, 20.00, 36.00, 10, false,
   ARRAY[]::TEXT[],
   ARRAY['Prototyping', 'Consumer Products', 'Education'],
   ARRAY['pla', 'biodegradable', 'renewable', 'easy_print'])
  ON CONFLICT (name) DO NOTHING,

  ('PETG', 'PETG', 'Polymer', 'Standard Polymer',
   'Polyethylene terephthalate glycol is a strong, clear thermoplastic with good chemical resistance.',
   'Полиетилен терефталат гликол е здрав, прозрачен термопласт с добра химическа устойчивост.',
   55, 50, 300, 85, 1.27, 260, 0.24, 30.00, 54.00, 8, false,
   ARRAY[]::TEXT[],
   ARRAY['Packaging', 'Medical', 'Consumer Products'],
   ARRAY['petg', 'transparent', 'chemical_resistant', 'tough'])
  ON CONFLICT (name) DO NOTHING,

  ('TPU', 'TPU', 'Polymer', 'Elastomer',
   'Thermoplastic polyurethane is a flexible, elastic material with excellent impact resistance.',
   'Термопластичен полиуретан е гъвкав, еластичен материал с отлична ударна устойчивост.',
   35, 30, 600, 75, 1.20, 200, 0.18, 40.00, 72.00, 7, false,
   ARRAY[]::TEXT[],
   ARRAY['Wearables', 'Gaskets', 'Protective Cases'],
   ARRAY['tpu', 'flexible', 'elastic', 'impact_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('PPSU', 'PPSU', 'Polymer', 'High-Performance Polymer',
   'Polyphenylsulfone is a high-performance thermoplastic with excellent heat and chemical resistance.',
   'Полифенилсулфон е високопроизводителен термопласт с отлична топлоустойчивост и химическа устойчивост.',
   70, 65, 60, 88, 1.29, 220, 0.35, 150.00, 270.00, 6, false,
   ARRAY[]::TEXT[],
   ARRAY['Medical', 'Aerospace', 'Automotive'],
   ARRAY['ppsu', 'high_temperature', 'chemical_resistant', 'medical'])
  ON CONFLICT (name) DO NOTHING,

  ('PC (Polycarbonate)', 'PC (Поликарбонат)', 'Polymer', 'Engineering Polymer',
   'Polycarbonate is a strong, transparent thermoplastic with excellent impact resistance.',
   'Поликарбонатът е здрав, прозрачен термопласт с отлична ударна устойчивост.',
   65, 60, 110, 115, 1.20, 150, 0.20, 35.00, 63.00, 7, false,
   ARRAY[]::TEXT[],
   ARRAY['Electronics', 'Automotive', 'Medical'],
   ARRAY['polycarbonate', 'pc', 'transparent', 'impact_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('PA6 (Nylon 6)', 'PA6 (Найлон 6)', 'Polymer', 'Engineering Polymer',
   'Polyamide 6 with good mechanical properties and chemical resistance.',
   'Полиамид 6 с добри механични свойства и химическа устойчивост.',
   80, 75, 50, 120, 1.14, 220, 0.25, 30.00, 54.00, 8, false,
   ARRAY[]::TEXT[],
   ARRAY['Automotive', 'Consumer Products', 'Industrial'],
   ARRAY['nylon', 'pa6', 'strong', 'chemical_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('PA6-GF30', 'PA6-GF30', 'Polymer', 'Composite Polymer',
   'Nylon 6 with 30% glass fiber reinforcement for enhanced strength and stiffness.',
   'Найлон 6 с 30% стъклени влакна за повишена якост и твърдост.',
   140, 120, 3, 95, 1.36, 220, 0.30, 40.00, 72.00, 7, false,
   ARRAY[]::TEXT[],
   ARRAY['Automotive', 'Industrial', 'Aerospace'],
   ARRAY['nylon', 'glass_fiber', 'composite', 'high_strength'])
  ON CONFLICT (name) DO NOTHING,

  ('PA12-CF (Carbon Fiber)', 'PA12-CF (Въглеродни влакна)', 'Polymer', 'Composite Polymer',
   'Nylon 12 with carbon fiber reinforcement for maximum strength and stiffness.',
   'Найлон 12 с въглеродни влакна за максимална якост и твърдост.',
   180, 160, 2, 110, 1.20, 178, 0.50, 80.00, 144.00, 6, false,
   ARRAY[]::TEXT[],
   ARRAY['Aerospace', 'Automotive', 'Sports Equipment'],
   ARRAY['nylon', 'carbon_fiber', 'composite', 'ultra_high_strength'])
  ON CONFLICT (name) DO NOTHING,

  ('PPS', 'PPS', 'Polymer', 'High-Performance Polymer',
   'Polyphenylene sulfide is a high-performance thermoplastic with excellent chemical and heat resistance.',
   'Полифенилен сулфид е високопроизводителен термопласт с отлична химическа и топлоустойчивост.',
   85, 80, 3, 120, 1.35, 285, 0.30, 100.00, 180.00, 5, false,
   ARRAY[]::TEXT[],
   ARRAY['Automotive', 'Electronics', 'Industrial'],
   ARRAY['pps', 'high_temperature', 'chemical_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('PEKK', 'PEKK', 'Polymer', 'High-Performance Polymer',
   'Polyetherketoneketone is a high-performance thermoplastic with excellent mechanical and thermal properties.',
   'Полиетеркетонкетон е високопроизводителен термопласт с отлични механични и топлинни свойства.',
   95, 85, 5, 105, 1.30, 360, 0.28, 200.00, 360.00, 5, false,
   ARRAY[]::TEXT[],
   ARRAY['Aerospace', 'Medical', 'Automotive'],
   ARRAY['pekk', 'high_performance', 'high_temperature'])
  ON CONFLICT (name) DO NOTHING,

  ('PBT', 'PBT', 'Polymer', 'Engineering Polymer',
   'Polybutylene terephthalate is a strong, rigid thermoplastic with good chemical resistance.',
   'Полибутилен терефталат е здрав, твърд термопласт с добра химическа устойчивост.',
   60, 55, 50, 100, 1.31, 225, 0.29, 35.00, 63.00, 7, false,
   ARRAY[]::TEXT[],
   ARRAY['Automotive', 'Electronics', 'Industrial'],
   ARRAY['pbt', 'rigid', 'chemical_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('ASA', 'ASA', 'Polymer', 'Standard Polymer',
   'Acrylonitrile Styrene Acrylate is a weather-resistant alternative to ABS with better UV stability.',
   'Акрилонитрил стирол акрилат е устойчив на атмосферни условия алтернатива на ABS с по-добра UV стабилност.',
   42, 38, 25, 105, 1.07, 105, 0.17, 30.00, 54.00, 8, false,
   ARRAY[]::TEXT[],
   ARRAY['Outdoor Applications', 'Automotive', 'Consumer Products'],
   ARRAY['asa', 'weather_resistant', 'uv_stable'])
  ON CONFLICT (name) DO NOTHING,

  ('PP (Polypropylene)', 'PP (Полипропилен)', 'Polymer', 'Standard Polymer',
   'Polypropylene is a lightweight, chemical-resistant thermoplastic with good fatigue resistance.',
   'Полипропиленът е лек, химически устойчив термопласт с добра устойчивост на умора.',
   35, 30, 400, 60, 0.90, 160, 0.22, 15.00, 27.00, 8, false,
   ARRAY[]::TEXT[],
   ARRAY['Packaging', 'Automotive', 'Consumer Products'],
   ARRAY['polypropylene', 'pp', 'lightweight', 'chemical_resistant'])
  ON CONFLICT (name) DO NOTHING,

  ('POM (Acetal)', 'POM (Ацетал)', 'Polymer', 'Engineering Polymer',
   'Polyoxymethylene is a strong, rigid thermoplastic with excellent dimensional stability and low friction.',
   'Полиоксиметилен е здрав, твърд термопласт с отлична размерна стабилност и ниско триене.',
   70, 65, 40, 120, 1.42, 175, 0.31, 40.00, 72.00, 7, false,
   ARRAY[]::TEXT[],
   ARRAY['Gears', 'Bearings', 'Industrial'],
   ARRAY['pom', 'acetal', 'low_friction', 'dimensional_stable'])
  ON CONFLICT (name) DO NOTHING;

  -- PRINTER SPECS (10-15 common industrial printers)
  INSERT INTO printer_specs (printer_name, manufacturer, technology, 
    max_build_volume_x, max_build_volume_y, max_build_volume_z, 
    max_temperature_c, supported_materials, layer_resolution_min, layer_resolution_max,
    is_metal_capable, is_polymer_capable)
  VALUES
  -- Metal Printers
  ('EOS M 290', 'EOS', 'DMLS', 250, 250, 325, 1200, 
   ARRAY['Ti-6Al-4V', 'AlSi10Mg', 'Inconel 718', '316L Stainless Steel', 'Maraging Steel'], 
   0.02, 0.10, true, false)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('EOS M 400', 'EOS', 'DMLS', 400, 400, 400, 1200,
   ARRAY['Ti-6Al-4V', 'AlSi10Mg', 'Inconel 718', '316L Stainless Steel', 'CoCr'],
   0.02, 0.10, true, false)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('SLM Solutions SLM 280', 'SLM Solutions', 'SLM', 280, 280, 365, 1200,
   ARRAY['Ti-6Al-4V', 'AlSi10Mg', 'Inconel 718', '316L Stainless Steel'],
   0.02, 0.10, true, false)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('Concept Laser M2', 'Concept Laser', 'DMLS', 250, 250, 280, 1200,
   ARRAY['Ti-6Al-4V', 'AlSi10Mg', 'Inconel 718', '17-4 PH Stainless Steel'],
   0.02, 0.10, true, false)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  -- Polymer Printers
  ('Stratasys Fortus 450mc', 'Stratasys', 'FDM', 406, 355, 406, 400,
   ARRAY['ABS', 'PC', 'PEI', 'PPSF'],
   0.127, 0.330, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('Stratasys F900', 'Stratasys', 'FDM', 914, 610, 914, 400,
   ARRAY['ABS', 'PC', 'PEI', 'PPSF', 'ULTEM'],
   0.127, 0.330, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('Formlabs Form 3', 'Formlabs', 'SLA', 145, 145, 185, 200,
   ARRAY['Standard Resin', 'Tough Resin', 'Clear Resin', 'Durable Resin'],
   0.025, 0.300, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('3D Systems ProX SLS 6100', '3D Systems', 'SLS', 381, 330, 457, 200,
   ARRAY['Nylon 12', 'PA11', 'TPU', 'Glass-filled Nylon'],
   0.08, 0.15, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('HP Multi Jet Fusion 4200', 'HP', 'MJF', 380, 284, 380, 200,
   ARRAY['PA12', 'PA12-CF', 'TPU'],
   0.08, 0.12, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('Markforged X7', 'Markforged', 'FDM', 330, 270, 200, 300,
   ARRAY['Onyx', 'Nylon', 'Carbon Fiber', 'Kevlar'],
   0.1, 0.2, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('Ultimaker S5', 'Ultimaker', 'FDM', 330, 240, 300, 280,
   ARRAY['PLA', 'ABS', 'PETG', 'TPU', 'Nylon', 'PC'],
   0.1, 0.3, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('Prusa i3 MK3S+', 'Prusa Research', 'FDM', 250, 210, 210, 300,
   ARRAY['PLA', 'ABS', 'PETG', 'TPU', 'ASA'],
   0.05, 0.3, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('EOS P 396', 'EOS', 'SLS', 340, 340, 600, 200,
   ARRAY['PA12', 'PA11', 'TPU', 'PP'],
   0.06, 0.15, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING,

  ('EOS P 770', 'EOS', 'SLS', 700, 380, 580, 200,
   ARRAY['PA12', 'PA11', 'TPU'],
   0.06, 0.15, false, true)
  ON CONFLICT (printer_name, manufacturer) DO NOTHING;

END $$;
