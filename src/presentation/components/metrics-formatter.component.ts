/**
 * Metrics Formatter Component
 *
 * Formats and displays performance metrics and violation statistics.
 */
import { ArchitecturalViolationModel } from '../../domain/models';

export class MetricsFormatterComponent {
  display(violations: ArchitecturalViolationModel[], elapsedMs: number): void {
    console.log('📊 Performance Metrics');
    console.log('─'.repeat(50));

    // Time formatting
    const timeStr = elapsedMs < 1000
      ? `${elapsedMs}ms`
      : `${(elapsedMs / 1000).toFixed(2)}s`;

    console.log(`⏱️  Analysis Time: ${timeStr}`);

    // Violation breakdown by type
    const ruleTypes = new Map<string, number>();
    violations.forEach(v => {
      const count = ruleTypes.get(v.ruleName) || 0;
      ruleTypes.set(v.ruleName, count + 1);
    });

    if (ruleTypes.size > 0) {
      console.log(`📋 Rules Triggered: ${ruleTypes.size}`);
      console.log(`🔍 Total Violations: ${violations.length}`);

      // Show top 3 most violated rules
      const sortedRules = Array.from(ruleTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (sortedRules.length > 0) {
        console.log(`📌 Most Common Issues:`);
        sortedRules.forEach(([ruleName, count]) => {
          console.log(`   • ${ruleName}: ${count} violation${count > 1 ? 's' : ''}`);
        });
      }
    }

    console.log('─'.repeat(50));
  }
}
