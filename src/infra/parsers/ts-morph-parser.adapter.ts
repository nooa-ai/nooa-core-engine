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
import { SymbolExtractorHelper } from './helpers';

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
    const filePath = this.getRelativePath(sourceFile.getFilePath(), projectPath);
    const dependencies = this.extractDependencies(sourceFile, projectPath);

    const symbols: CodeSymbolModel[] = [
      ...SymbolExtractorHelper.extractClasses(sourceFile, filePath, dependencies),
      ...SymbolExtractorHelper.extractInterfaces(sourceFile, filePath, dependencies),
      ...SymbolExtractorHelper.extractFunctions(sourceFile, filePath, dependencies),
      ...SymbolExtractorHelper.extractTypeAliases(sourceFile, filePath, dependencies),
    ];

    // If no specific symbols were exported, create a file-level symbol
    if (symbols.length === 0) {
      symbols.push(SymbolExtractorHelper.createDefaultSymbol(filePath, dependencies));
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
    const dependencies = new Set<string>();

    // Collect dependencies declared via imports
    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDecl of importDeclarations) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      this.tryAddDependency(sourceFile, projectPath, moduleSpecifier, dependencies);
    }

    // Collect dependencies declared via re-export statements (e.g. export * from './foo')
    const exportDeclarations = sourceFile.getExportDeclarations();
    for (const exportDecl of exportDeclarations) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) {
        continue; // Skip bare exports: `export { Foo }`
      }

      this.tryAddDependency(sourceFile, projectPath, moduleSpecifier, dependencies);
    }

    return Array.from(dependencies);
  }

  /**
   * Attempts to resolve a module specifier and add it to the dependency set
   *
   * @param sourceFile - File that declares the dependency
   * @param projectPath - Root path of the project
   * @param moduleSpecifier - Declared module path (relative string)
   * @param dependencies - Accumulator for resolved dependencies
   */
  private tryAddDependency(
    sourceFile: SourceFile,
    projectPath: string,
    moduleSpecifier: string,
    dependencies: Set<string>
  ): void {
    if (!moduleSpecifier) return;

    if (!(moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/'))) {
      return; // Ignore external packages/aliases for now
    }

    try {
      const sourceFileDir = path.dirname(sourceFile.getFilePath());
      const basePath = path.resolve(sourceFileDir, moduleSpecifier);
      const candidateFiles = [
        '',
        '.ts',
        '.tsx',
        '.d.ts',
        '/index.ts',
        '/index.tsx',
      ].map((ext) => basePath + ext);

      for (const candidate of candidateFiles) {
        const foundFile = sourceFile.getProject().getSourceFile(candidate);
        if (!foundFile) {
          continue;
        }

        const relativePath = this.getRelativePath(foundFile.getFilePath(), projectPath);
        dependencies.add(relativePath);
        break;
      }
    } catch {
      // Ignore resolution errors: aliases or missing files are handled elsewhere
    }
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
