/**
 * Violation Deduplicator Helper
 *
 * Removes duplicate violations for the same file + rule + message combination.
 * The parser creates one symbol per export, so files with multiple exports
 * generate duplicate violations. This helper keeps only the first occurrence.
 */
import { ArchitecturalViolationModel } from '../../domain/models';

export class ViolationDeduplicatorHelper {
  /**
   * Removes duplicate violations for same file + rule + message combination
   *
   * Key includes message to preserve legitimate multiple violations from same rule.
   * Example: class_complexity can generate 2 violations (methods + properties).
   *
   * Example: architectural-rule.model.ts has 24 exports
   * - Before: 24x "File-Size-Error: 308 lines" = 24 identical violations
   * - After: 1x "File-Size-Error: 308 lines" = 1 violation
   *
   * @param violations - Raw violations (with duplicates)
   * @returns Deduplicated violations (unique file + rule + message combinations)
   */
  deduplicate(violations: ArchitecturalViolationModel[]): ArchitecturalViolationModel[] {
    const seen = new Set<string>();
    const unique: ArchitecturalViolationModel[] = [];

    for (const violation of violations) {
      // Create unique key: file + ruleName + message
      // This ensures same violation is reported only once, but allows
      // multiple different violations from same rule (e.g. methods + properties)
      const key = `${violation.file}::${violation.ruleName}::${violation.message}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(violation);
      }
    }

    return unique;
  }
}
