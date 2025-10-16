/**
 * Node.js File System Adapter
 *
 * Infrastructure adapter that wraps Node.js file system module.
 * Implements IFileReader and IFileExistenceChecker protocols (ISP compliance).
 *
 * Follows Interface Segregation Principle:
 * - Implements two single-method interfaces instead of one multi-method interface
 * - Consumers can depend only on what they need (IFileReader OR IFileExistenceChecker)
 *
 * Enables:
 * - Testability: Easy to mock in tests
 * - Flexibility: Can swap implementations (e.g., in-memory for tests)
 * - Clean Architecture: Decouples domain/data layers from infrastructure
 * - ISP Compliance: Clients aren't forced to depend on methods they don't use
 */

import * as fs from 'fs';
import { IFileReader, IFileExistenceChecker, IFileSystem } from '../../data/protocols/i-file-system';

/**
 * Adapter for Node.js file system operations
 *
 * Implements both IFileReader and IFileExistenceChecker.
 * Also implements deprecated IFileSystem for backward compatibility.
 */
export class NodeFileSystemAdapter implements IFileSystem, IFileReader, IFileExistenceChecker {
  constructor(private readonly fileSystem: typeof fs = fs) {}

  readFileSync(path: string, encoding: BufferEncoding = 'utf-8'): string {
    return this.fileSystem.readFileSync(path, encoding);
  }

  existsSync(path: string): boolean {
    return this.fileSystem.existsSync(path);
  }
}
