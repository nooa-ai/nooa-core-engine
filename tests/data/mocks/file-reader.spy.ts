import { IFileReader, IFileExistenceChecker } from '../../../src/data/protocols';

export class FileReaderSpy implements IFileReader, IFileExistenceChecker {
  fileContents: Map<string, string> = new Map();
  callCount = 0;
  lastPath?: string;

  readFileSync(path: string, encoding?: BufferEncoding): string {
    this.callCount++;
    this.lastPath = path;

    const content = this.fileContents.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }

    return content;
  }

  existsSync(path: string): boolean {
    return this.fileContents.has(path);
  }
}
