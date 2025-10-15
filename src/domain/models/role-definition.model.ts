/**
 * Represents a role definition from the grammar configuration
 * Roles are assigned to code symbols based on path patterns
 */

/**
 * A role definition that maps path patterns to architectural roles
 */
export type RoleDefinitionModel = {
  /** Unique name for the role (e.g., NOUN, VERB_CONTRACT, ADVERB_ABSTRACT) */
  name: string;

  /** Regular expression pattern to match file paths */
  path: string;

  /** Optional: Human-readable description of the role */
  description?: string;
};
