// ─── Primitives ───────────────────────────────────────────────────────────────

export type Vector3Tuple = [x: number, y: number, z: number];

// ─── Camera ───────────────────────────────────────────────────────────────────

export interface CameraTarget {
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov?: number;
}

// ─── System Categories ────────────────────────────────────────────────────────

export type SystemCategory =
  | 'navigation'
  | 'communication'
  | 'scientific'
  | 'propulsion'
  | 'power'
  | 'launch'
  | 'mapping'
  | 'mission'
  | 'crew';

// ─── Mesh Binding ─────────────────────────────────────────────────────────────

export type MeshBindingRole = 'primary' | 'highlight' | 'collision';

export interface MeshBinding {
  meshName: string;
  role: MeshBindingRole;
  offset?: Vector3Tuple;
}

// ─── Component Fact ───────────────────────────────────────────────────────────

export interface ComponentFact {
  label: string;
  value: string;
  unit?: string;
}

// ─── Animation Reference ──────────────────────────────────────────────────────

export interface AnimationRef {
  id: string;
  label: string;
  clipName: string;
}

// ─── Tour Stop ────────────────────────────────────────────────────────────────

export interface TourStop {
  tourId: string;
  order: number;
  narration: string;
  dwellMs: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface VesselComponent {
  id: string;
  systemId: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  facts: ComponentFact[];
  camera: CameraTarget;
  meshBindings: MeshBinding[];
  animations: AnimationRef[];
  relatedComponentIds: string[];
  tourStops: TourStop[];
  tags: string[];
}

// ─── System ───────────────────────────────────────────────────────────────────

export interface VesselSystem {
  id: string;
  name: string;
  category: SystemCategory;
  description: string;
  components: VesselComponent[];
  relatedSystemIds: string[];
}

// ─── Vessel ───────────────────────────────────────────────────────────────────

export interface Vessel {
  id: string;
  name: string;
  class: string;
  description: string;
  defaultCamera: CameraTarget;
  systems: VesselSystem[];
}

// ─── Tour ─────────────────────────────────────────────────────────────────────

export interface TourStep {
  componentId: string;
  narration: string;
  dwellMs: number;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  estimatedDurationMs: number;
  steps: TourStep[];
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export interface MeshRegistryEntry {
  meshName: string;
  componentId: string;
  role: MeshBindingRole;
}
