// frontend/src/types/Topic.ts

export interface TopicManager {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Topic {
  // From your existing App.tsx mapping
  topicCode: string;
  topicId: string; // <<--- ENSURED THIS IS PRESENT (Critical for PDF downloads)
  topicTitle?: string;
  phaseHierarchy?: string; // This is often a JSON string, consider parsing it into a structured type if needed elsewhere
  component?: string;
  program?: string;
  topicStatus?: string;
  solicitationTitle?: string;
  topicManagers?: TopicManager[];

  // Add any other properties that your application uses for a Topic
  // For example, if you directly use these from the API or transform them:
  // description?: string;
  // agency?: string;
  // branch?: string;
  // sbirContractId?: string; // Or solicitationNumber
  // solicitationYear?: number;
  // solicitationOpenDate?: string; // Consider Date type after fetching
  // solicitationCloseDate?: string; // Consider Date type after fetching
  // technologyAreas?: string[];
  // modernizationPriorities?: string[];
  // keywords?: string[];
  // abstract?: string;
  // anticipatedAwards?: string;
  // primaryPointOfContact?: TopicManager; // If structured differently
  // isUnderReview?: boolean;
  // allowCommercializationReport?: boolean;
  // uid?: string; // If there's another UID distinct from topicId and topicCode
}

// Your existing types from the last App.tsx provided (or original Topic.ts)
// It's good practice to keep related types together or organize them logically.

// Example Filter Options structure (align with what your backend provides or frontend derives)
export interface FilterOptions {
  programs: string[];
  components: string[];
  topic_statuses: string[]; // Or topicStatuses if you prefer camelCase consistently
  technology_areas: string[]; // Or technologyAreas
  modernization_priorities: string[]; // Or modernizationPriorities
  solicitations: string[];
  // Add other filter categories as needed
}

// Example Applied Filters structure
export interface AppliedFilters {
  searchTerm?: string;
  program?: string; // 'All' or a specific program
  component?: string; // 'All' or a specific component
  topicStatus?: string; // 'All' or a specific status
  solicitation?: string; // 'All' or a specific solicitation
  technologyArea?: string; // 'All' or a specific area
  modernizationPriority?: string; // 'All' or a specific priority
  // Add other applied filter fields as needed
}

// Example Sort Configuration structure
export interface SortConfig {
  key: keyof Topic; // Ensures sorting is done on valid Topic properties
  direction: 'ascending' | 'descending';
}

// If you have a specific type for what `topic.phaseHierarchy` parses into:
// export interface PhaseConfigItem {
//   displayValue: string;
//   phase: string; // e.g., "I", "II"
//   // other properties from the phase config
// }
// export interface ParsedPhaseHierarchy {
//   config: PhaseConfigItem[];
//   // other properties from the parsed JSON
// }
