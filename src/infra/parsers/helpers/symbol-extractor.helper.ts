/**
 * Helper: Symbol Extraction from Source Files
 *
 * Extracts various symbol types (classes, interfaces, functions, types)
 * from TypeScript source files using ts-morph.
 */

import { SourceFile } from 'ts-morph';
import * as path from 'path';
import { CodeSymbolModel } from '../../../domain/models';

export class SymbolExtractorHelper {
  /**
   * Creates a code symbol model
   */
  static createSymbol(
    filePath: string,
    name: string,
    dependencies: string[],
    symbolType: CodeSymbolModel['symbolType']
  ): CodeSymbolModel {
    return {
      path: filePath,
      name,
      role: 'UNKNOWN', // Will be assigned later based on path
      dependencies,
      symbolType,
    };
  }

  /**
   * Extracts exported classes from source file
   */
  static extractClasses(
    sourceFile: SourceFile,
    filePath: string,
    dependencies: string[]
  ): CodeSymbolModel[] {
    const classes = sourceFile.getClasses().filter((cls) => cls.isExported());
    return classes.map((cls) =>
      this.createSymbol(filePath, cls.getName() || 'AnonymousClass', dependencies, 'class')
    );
  }

  /**
   * Extracts exported interfaces from source file
   */
  static extractInterfaces(
    sourceFile: SourceFile,
    filePath: string,
    dependencies: string[]
  ): CodeSymbolModel[] {
    const interfaces = sourceFile.getInterfaces().filter((iface) => iface.isExported());
    return interfaces.map((iface) =>
      this.createSymbol(filePath, iface.getName(), dependencies, 'interface')
    );
  }

  /**
   * Extracts exported functions from source file
   */
  static extractFunctions(
    sourceFile: SourceFile,
    filePath: string,
    dependencies: string[]
  ): CodeSymbolModel[] {
    const functions = sourceFile.getFunctions().filter((fn) => fn.isExported());
    return functions.map((fn) =>
      this.createSymbol(filePath, fn.getName() || 'AnonymousFunction', dependencies, 'function')
    );
  }

  /**
   * Extracts exported type aliases from source file
   */
  static extractTypeAliases(
    sourceFile: SourceFile,
    filePath: string,
    dependencies: string[]
  ): CodeSymbolModel[] {
    const typeAliases = sourceFile.getTypeAliases().filter((type) => type.isExported());
    return typeAliases.map((typeAlias) =>
      this.createSymbol(filePath, typeAlias.getName(), dependencies, 'type')
    );
  }

  /**
   * Creates a default file-level symbol when no specific symbols are exported
   */
  static createDefaultSymbol(
    filePath: string,
    dependencies: string[]
  ): CodeSymbolModel {
    const fileName = path.basename(filePath, path.extname(filePath));
    return this.createSymbol(filePath, fileName, dependencies, 'file');
  }
}
