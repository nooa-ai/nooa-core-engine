/**
 * Class Complexity Validator
 *
 * Validates class complexity based on public method and property counts.
 */
import {
  ArchitecturalViolationModel,
  CodeSymbolModel,
  ClassComplexityRule,
} from '../../../domain/models';
import { BaseRuleValidator } from '../base-rule.validator';

export class ClassComplexityValidator extends BaseRuleValidator {
  constructor(private readonly rules: ClassComplexityRule[]) {
    super();
  }

  async validate(
    symbols: CodeSymbolModel[],
    projectPath: string
  ): Promise<ArchitecturalViolationModel[]> {
    if (this.rules.length === 0) return [];

    // Performance: Create ts-morph Project once and reuse for all rules
    const { Project } = await import('ts-morph');
    const path = await import('path');
    const fsSync = await import('fs');

    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    let hasTsConfig = false;
    try {
      fsSync.accessSync(tsconfigPath);
      hasTsConfig = true;
    } catch {
      // No tsconfig, will use default config
    }

    const project = new Project(
      hasTsConfig
        ? {
            tsConfigFilePath: tsconfigPath,
            skipAddingFilesFromTsConfig: false,
          }
        : {
            compilerOptions: {
              target: 99, // ScriptTarget.Latest
            },
          }
    );

    const violations: ArchitecturalViolationModel[] = [];

    for (const rule of this.rules) {
      violations.push(...(await this.validateClassComplexity(symbols, rule, projectPath, project, path)));
    }

    return violations;
  }

  private async validateClassComplexity(
    symbols: CodeSymbolModel[],
    rule: ClassComplexityRule,
    projectPath: string,
    project: any,
    path: any
  ): Promise<ArchitecturalViolationModel[]> {
    const violations: ArchitecturalViolationModel[] = [];

    const symbolsToCheck = symbols.filter((symbol) =>
      this.roleMatcher.matches(symbol.role, rule.for.role)
    );

    const hasTsConfig = project.compilerOptions ? false : true;

    for (const symbol of symbolsToCheck) {
      try {
        const filePath = path.join(projectPath, symbol.path);

        // If no tsconfig, manually add the file
        let sourceFile = project.getSourceFile(filePath);
        if (!sourceFile && !hasTsConfig) {
          project.addSourceFileAtPath(filePath);
          sourceFile = project.getSourceFile(filePath);
        }

        if (!sourceFile) continue;

        // Get all classes in the file
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
          // Count public methods (excluding constructor)
          // In TypeScript, methods are public by default unless marked private/protected
          const allMethods = classDecl.getMethods();
          const publicMethods = allMethods.filter((method: any) => {
            const scope = method.getScope();
            // scope is undefined for default (public) methods
            // scope exists and is not private/protected for explicit public
            return scope === undefined || !['private', 'protected'].includes(scope?.toString() || '');
          });

          // Count all properties (public, private, protected)
          const properties = classDecl.getProperties();

          if (publicMethods.length > rule.max_public_methods) {
            violations.push({
              ruleName: rule.name,
              severity: rule.severity,
              file: symbol.path,
              message: `${rule.name}: ${symbol.path} has ${publicMethods.length} public methods (exceeds ${rule.max_public_methods})${rule.comment ? ` - ${rule.comment}` : ''}`,
              fromRole: symbol.role,
              toRole: undefined,
              dependency: undefined,
            });
          }

          if (properties.length > rule.max_properties) {
            violations.push({
              ruleName: rule.name,
              severity: rule.severity,
              file: symbol.path,
              message: `${rule.name}: ${symbol.path} has ${properties.length} properties (exceeds ${rule.max_properties})${rule.comment ? ` - ${rule.comment}` : ''}`,
              fromRole: symbol.role,
              toRole: undefined,
              dependency: undefined,
            });
          }
        }
      } catch (error) {
        // File might not exist or be readable, skip
      }
    }

    return violations;
  }
}
