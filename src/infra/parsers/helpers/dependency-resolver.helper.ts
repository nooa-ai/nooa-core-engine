/**
 * Dependency Resolver Helper
 *
 * Responsible for resolving module specifiers to actual file paths.
 * Handles TypeScript module resolution including extensions and index files.
 *
 * Following Single Responsibility Principle: Only handles dependency resolution.
 * Extracted from TSMorphParserAdapter to reduce file complexity.
 */
import { Project } from 'ts-morph';
import * as path from 'path';

export class DependencyResolverHelper {
  /**
   * Attempts to resolve a module specifier to an actual source file
   *
   * @param project - ts-morph Project instance
   * @param sourceFileDir - Directory of the file that contains the import
   * @param moduleSpecifier - Module path (e.g. './foo', '../bar')
   * @param projectPath - Root path of the project
   * @returns Relative path if resolved, null if not found
   */
  resolve(
    project: Project,
    sourceFileDir: string,
    moduleSpecifier: string,
    projectPath: string
  ): string | null {
    // Only resolve relative imports
    if (!this.isRelativeImport(moduleSpecifier)) {
      return null;
    }

    try {
      const basePath = path.resolve(sourceFileDir, moduleSpecifier);
      const candidates = this.buildCandidatePaths(basePath);

      for (const candidate of candidates) {
        const foundFile = project.getSourceFile(candidate);
        if (foundFile) {
          return this.getRelativePath(foundFile.getFilePath(), projectPath);
        }
      }
    } catch {
      // Ignore resolution errors
    }

    return null;
  }

  /**
   * Checks if a module specifier is a relative import
   */
  private isRelativeImport(moduleSpecifier: string): boolean {
    return moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/');
  }

  /**
   * Builds list of candidate file paths to try (with different extensions)
   */
  private buildCandidatePaths(basePath: string): string[] {
    return [
      basePath,                    // Exact path
      basePath + '.ts',           // .ts extension
      basePath + '.tsx',          // .tsx extension
      basePath + '.d.ts',         // .d.ts extension
      basePath + '/index.ts',     // index.ts in directory
      basePath + '/index.tsx',    // index.tsx in directory
    ];
  }

  /**
   * Converts an absolute path to a relative path from the project root
   */
  private getRelativePath(absolutePath: string, projectPath: string): string {
    const relative = path.relative(projectPath, absolutePath);
    // Normalize to always use forward slashes (cross-platform)
    return relative.replace(/\\/g, '/');
  }
}
