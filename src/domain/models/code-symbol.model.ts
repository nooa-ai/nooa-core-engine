/**
 * Represents a code symbol (file, class, function, etc.) extracted from the codebase
 * This is the fundamental unit of analysis in the architectural validation
 */

/**
 * A code symbol with its metadata and dependencies
 */
export type CodeSymbolModel = {
  /** Absolute or relative file path of the symbol */
  path: string;

  /** Name of the symbol (class name, function name, or file name) */
  name: string;

  /** Architectural role assigned to this symbol based on path matching */
  role: string;

  /** List of file paths that this symbol depends on (imports) */
  dependencies: string[];

  /** Optional: Type of symbol (class, interface, function, etc.) */
  symbolType?: 'class' | 'interface' | 'function' | 'type' | 'const' | 'file';
};
