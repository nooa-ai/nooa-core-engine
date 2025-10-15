/**
 * Infrastructure Adapter: TypeScript Code Parser using ts-morph
 *
 * This adapter implements the ICodeParser protocol using the ts-morph library.
 * It's responsible for the technical details of parsing TypeScript code.
 *
 * Following Clean Architecture principles:
 * - Implements a protocol from the Data layer
 * - Contains infrastructure-specific code (ts-morph library)
 * - Can be replaced with another parser without affecting business logic
 */

import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';
import { ICodeParser } from '../../data/protocols';
import { CodeSymbolModel } from '../../domain/models';

/**
 * TypeScript code parser implementation using ts-morph
 */
export class TSMorphParserAdapter implements ICodeParser {
  /**
   * Parses a TypeScript project and extracts code symbols with dependencies
   *
   * @param projectPath - Root path of the TypeScript project
   * @returns Promise resolving to an array of code symbols
   */
  async parse(projectPath: string): Promise<CodeSymbolModel[]> {
    // Initialize ts-morph Project
    const project = new Project({
      tsConfigFilePath: path.join(projectPath, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
    });

    // Get all source files
    const sourceFiles = project.getSourceFiles();

    // Extract symbols from each file
    const symbols: CodeSymbolModel[] = [];

    for (const sourceFile of sourceFiles) {
      const fileSymbols = this.extractSymbolsFromFile(sourceFile, projectPath);
      symbols.push(...fileSymbols);
    }

    return symbols;
  }

  /**
   * Extracts code symbols from a single source file
   *
   * @param sourceFile - The source file to analyze
   * @param projectPath - Root path of the project (for relative path calculation)
   * @returns Array of code symbols found in the file
   */
  private extractSymbolsFromFile(
    sourceFile: SourceFile,
    projectPath: string
  ): CodeSymbolModel[] {
    const symbols: CodeSymbolModel[] = [];
    const filePath = this.getRelativePath(sourceFile.getFilePath(), projectPath);

    // Extract dependencies (imports)
    const dependencies = this.extractDependencies(sourceFile, projectPath);

    // Extract exported classes
    const classes = sourceFile.getClasses().filter((cls) => cls.isExported());
    for (const cls of classes) {
      symbols.push({
        path: filePath,
        name: cls.getName() || 'AnonymousClass',
        role: 'UNKNOWN', // Will be assigned later based on path
        dependencies,
        symbolType: 'class',
      });
    }

    // Extract exported interfaces
    const interfaces = sourceFile.getInterfaces().filter((iface) => iface.isExported());
    for (const iface of interfaces) {
      symbols.push({
        path: filePath,
        name: iface.getName(),
        role: 'UNKNOWN',
        dependencies,
        symbolType: 'interface',
      });
    }

    // Extract exported functions
    const functions = sourceFile.getFunctions().filter((fn) => fn.isExported());
    for (const fn of functions) {
      symbols.push({
        path: filePath,
        name: fn.getName() || 'AnonymousFunction',
        role: 'UNKNOWN',
        dependencies,
        symbolType: 'function',
      });
    }

    // Extract exported type aliases
    const typeAliases = sourceFile.getTypeAliases().filter((type) => type.isExported());
    for (const typeAlias of typeAliases) {
      symbols.push({
        path: filePath,
        name: typeAlias.getName(),
        role: 'UNKNOWN',
        dependencies,
        symbolType: 'type',
      });
    }

    // If no specific symbols were exported, create a file-level symbol
    if (symbols.length === 0) {
      symbols.push({
        path: filePath,
        name: path.basename(filePath, path.extname(filePath)),
        role: 'UNKNOWN',
        dependencies,
        symbolType: 'file',
      });
    }

    return symbols;
  }

  /**
   * Extracts dependencies (imports) from a source file
   *
   * @param sourceFile - The source file to analyze
   * @param projectPath - Root path of the project
   * @returns Array of relative file paths that this file depends on
   */
  private extractDependencies(sourceFile: SourceFile, projectPath: string): string[] {
    const dependencies: string[] = [];

    // Get all import declarations
    const importDeclarations = sourceFile.getImportDeclarations();

    for (const importDecl of importDeclarations) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // Only process relative imports (project files, not external libraries)
      if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
        try {
          // Resolve the import to an absolute path
          const sourceFileDir = path.dirname(sourceFile.getFilePath());
          let resolvedPath = path.resolve(sourceFileDir, moduleSpecifier);

          // Try to find the actual file (handling .ts, .tsx extensions)
          const possibleExtensions = ['', '.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx'];
          let actualPath: string | null = null;

          for (const ext of possibleExtensions) {
            const testPath = resolvedPath + ext;
            const foundFile = sourceFile.getProject().getSourceFile(testPath);
            if (foundFile) {
              actualPath = testPath;
              break;
            }
          }

          if (actualPath) {
            const relativePath = this.getRelativePath(actualPath, projectPath);
            dependencies.push(relativePath);
          }
        } catch (error) {
          // Ignore errors in resolving imports (might be aliased paths, etc.)
          continue;
        }
      }
    }

    return dependencies;
  }

  /**
   * Converts an absolute path to a relative path from the project root
   *
   * @param absolutePath - The absolute file path
   * @param projectPath - The project root path
   * @returns Relative path from project root
   */
  private getRelativePath(absolutePath: string, projectPath: string): string {
    const relative = path.relative(projectPath, absolutePath);
    // Normalize to always use forward slashes (for cross-platform compatibility)
    return relative.replace(/\\/g, '/');
  }
}
