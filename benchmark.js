#!/usr/bin/env node

/**
 * Nooa Core Engine - Benchmark Script
 *
 * Executa benchmarks automáticos e salva os resultados em docs/whitepaper/benchmark
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BENCHMARK_DIR = path.join(__dirname, 'docs', 'whitepaper', 'benchmark');
const ITERATIONS = 5;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseBenchmarkOutput(output) {
  const timeMatch = output.match(/Analysis Time:\s*(\d+)ms/);
  const rulesMatch = output.match(/Rules Triggered:\s*(\d+)/);
  const violationsMatch = output.match(/Total Violations:\s*(\d+)/);
  const summaryMatch = output.match(/Summary:\s*(\d+)\s*errors,\s*(\d+)\s*warnings,\s*(\d+)\s*info/);

  return {
    analysisTime: timeMatch ? parseInt(timeMatch[1]) : null,
    rulesTriggered: rulesMatch ? parseInt(rulesMatch[1]) : null,
    totalViolations: violationsMatch ? parseInt(violationsMatch[1]) : null,
    errors: summaryMatch ? parseInt(summaryMatch[1]) : 0,
    warnings: summaryMatch ? parseInt(summaryMatch[2]) : 0,
    info: summaryMatch ? parseInt(summaryMatch[3]) : 0,
  };
}

function parseMemoryOutput(output) {
  const memMatch = output.match(/(\d+)\s+maximum resident set size/);
  const realMatch = output.match(/([\d.]+)\s+real/);
  const userMatch = output.match(/([\d.]+)\s+user/);
  const sysMatch = output.match(/([\d.]+)\s+sys/);

  return {
    memoryBytes: memMatch ? parseInt(memMatch[1]) : null,
    memoryMB: memMatch ? Math.round(parseInt(memMatch[1]) / 1024 / 1024) : null,
    realTime: realMatch ? parseFloat(realMatch[1]) * 1000 : null, // Convert to ms
    userTime: userMatch ? parseFloat(userMatch[1]) * 1000 : null,
    sysTime: sysMatch ? parseFloat(sysMatch[1]) * 1000 : null,
  };
}

function calculateStats(values) {
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: Math.round(mean),
    median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
    stdDev: Math.round(stdDev),
  };
}

async function runBenchmarks() {
  log('\n🔬 Iniciando Benchmarks do Nooa Core Engine...', 'bright');
  log('═══════════════════════════════════════════════════\n', 'blue');

  const results = [];
  const timestamp = new Date().toISOString();
  const now = new Date();
  const dateStr = `${now.toISOString().split('T')[0]}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;

  // Ensure benchmark directory exists
  if (!fs.existsSync(BENCHMARK_DIR)) {
    fs.mkdirSync(BENCHMARK_DIR, { recursive: true });
  }

  for (let i = 1; i <= ITERATIONS; i++) {
    log(`\n📊 Execução ${i}/${ITERATIONS}...`, 'cyan');

    try {
      // Run with time measurement
      const output = execSync(
        '/usr/bin/time -l npm start . 2>&1',
        {
          cwd: __dirname,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024
        }
      );

      const nooaMetrics = parseBenchmarkOutput(output);
      const systemMetrics = parseMemoryOutput(output);

      const result = {
        iteration: i,
        timestamp: new Date().toISOString(),
        ...nooaMetrics,
        ...systemMetrics,
      };

      results.push(result);

      log(`  ⏱️  Análise: ${nooaMetrics.analysisTime}ms`, 'green');
      log(`  🧠 Memória: ${systemMetrics.memoryMB}MB`, 'green');
      log(`  ✅ Erros: ${nooaMetrics.errors}, Warnings: ${nooaMetrics.warnings}, Info: ${nooaMetrics.info}`, 'green');

    } catch (error) {
      log(`  ❌ Erro na execução ${i}: ${error.message}`, 'yellow');
    }
  }

  log('\n\n📈 Calculando estatísticas...', 'bright');

  // Calculate statistics
  const analysisTimes = results.map(r => r.analysisTime).filter(v => v !== null);
  const realTimes = results.map(r => r.realTime).filter(v => v !== null);
  const memoryUsages = results.map(r => r.memoryMB).filter(v => v !== null);

  const stats = {
    timestamp,
    iterations: ITERATIONS,
    results,
    statistics: {
      analysisTime: calculateStats(analysisTimes),
      realTime: calculateStats(realTimes),
      memory: calculateStats(memoryUsages),
    },
    projectInfo: {
      files: 22,
      linesOfCode: 1920,
      roles: 10,
      rules: 15,
    },
  };

  // Save JSON
  const jsonPath = path.join(BENCHMARK_DIR, `benchmark-${dateStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(stats, null, 2));
  log(`\n💾 Resultados salvos em: ${jsonPath}`, 'green');

  // Generate Markdown report
  const mdReport = generateMarkdownReport(stats);
  const mdPath = path.join(BENCHMARK_DIR, `benchmark-${dateStr}.md`);
  fs.writeFileSync(mdPath, mdReport);
  log(`📄 Relatório Markdown salvo em: ${mdPath}`, 'green');

  // Generate latest.json symlink/copy
  const latestPath = path.join(BENCHMARK_DIR, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(stats, null, 2));
  log(`🔗 Última execução salva em: ${latestPath}`, 'green');

  // Print summary
  printSummary(stats);

  return stats;
}

function generateMarkdownReport(stats) {
  const { statistics, projectInfo, results, timestamp } = stats;

  return `# Benchmark do Nooa Core Engine

**Data**: ${new Date(timestamp).toLocaleString('pt-BR')}
**Iterações**: ${stats.iterations}

## Configuração do Projeto

- **Arquivos TypeScript**: ${projectInfo.files}
- **Linhas de Código**: ${projectInfo.linesOfCode}
- **Roles Definidas**: ${projectInfo.roles}
- **Regras na Gramática**: ${projectInfo.rules}

## Resultados Detalhados

| Exec | Análise (ms) | Tempo Total (ms) | Memória (MB) | Erros | Warnings | Info |
|------|--------------|------------------|--------------|-------|----------|------|
${results.map(r =>
  `| ${r.iteration} | ${r.analysisTime || 'N/A'} | ${r.realTime ? Math.round(r.realTime) : 'N/A'} | ${r.memoryMB || 'N/A'} | ${r.errors} | ${r.warnings} | ${r.info} |`
).join('\n')}

## Estatísticas

### Tempo de Análise

- **Mínimo**: ${statistics.analysisTime.min}ms
- **Máximo**: ${statistics.analysisTime.max}ms
- **Média**: ${statistics.analysisTime.mean}ms
- **Mediana**: ${statistics.analysisTime.median}ms
- **Desvio Padrão**: ±${statistics.analysisTime.stdDev}ms
- **Variação**: ${((statistics.analysisTime.stdDev / statistics.analysisTime.mean) * 100).toFixed(1)}%

### Tempo Total (Incluindo Inicialização)

- **Mínimo**: ${statistics.realTime.min}ms
- **Máximo**: ${statistics.realTime.max}ms
- **Média**: ${statistics.realTime.mean}ms
- **Mediana**: ${statistics.realTime.median}ms
- **Desvio Padrão**: ±${statistics.realTime.stdDev}ms

### Uso de Memória

- **Mínimo**: ${statistics.memory.min} MB
- **Máximo**: ${statistics.memory.max} MB
- **Média**: ${statistics.memory.mean} MB
- **Mediana**: ${statistics.memory.median} MB
- **Desvio Padrão**: ±${statistics.memory.stdDev} MB

## Performance

- **Throughput**: ~${Math.round(projectInfo.files / (statistics.analysisTime.mean / 1000))} arquivos/segundo
- **Latência**: ~${Math.round(statistics.analysisTime.mean / projectInfo.files)}ms por arquivo
- **Eficiência de Memória**: ~${Math.round(statistics.memory.mean / projectInfo.files)}MB por arquivo

## Conclusão

${results[0].errors === 0 ? '✅ Nenhum erro arquitetural detectado' : `❌ ${results[0].errors} erros detectados`}
${results[0].warnings === 0 ? '✅ Nenhum warning detectado' : `⚠️ ${results[0].warnings} warnings detectados`}
ℹ️ ${results[0].info} mensagens informativas

---

*Benchmark gerado automaticamente pelo Nooa Core Engine*
`;
}

function printSummary(stats) {
  const { statistics, projectInfo } = stats;

  log('\n\n═══════════════════════════════════════════════════', 'blue');
  log('📊 RESUMO DO BENCHMARK', 'bright');
  log('═══════════════════════════════════════════════════\n', 'blue');

  log(`📁 Projeto:`, 'cyan');
  log(`   • ${projectInfo.files} arquivos TypeScript`);
  log(`   • ${projectInfo.linesOfCode} linhas de código`);
  log(`   • ${projectInfo.roles} roles definidas`);
  log(`   • ${projectInfo.rules} regras na gramática\n`);

  log(`⏱️  Tempo de Análise:`, 'cyan');
  log(`   • Média: ${statistics.analysisTime.mean}ms (±${statistics.analysisTime.stdDev}ms)`);
  log(`   • Range: ${statistics.analysisTime.min}ms - ${statistics.analysisTime.max}ms`);
  log(`   • Variação: ${((statistics.analysisTime.stdDev / statistics.analysisTime.mean) * 100).toFixed(1)}%\n`);

  log(`🕐 Tempo Total:`, 'cyan');
  log(`   • Média: ${statistics.realTime.mean}ms (±${statistics.realTime.stdDev}ms)`);
  log(`   • Range: ${statistics.realTime.min}ms - ${statistics.realTime.max}ms\n`);

  log(`🧠 Memória:`, 'cyan');
  log(`   • Média: ${statistics.memory.mean} MB (±${statistics.memory.stdDev} MB)`);
  log(`   • Pico: ${statistics.memory.max} MB\n`);

  log(`📈 Performance:`, 'cyan');
  log(`   • Throughput: ~${Math.round(projectInfo.files / (statistics.analysisTime.mean / 1000))} arquivos/segundo`);
  log(`   • Latência: ~${Math.round(statistics.analysisTime.mean / projectInfo.files)}ms por arquivo\n`);

  log(`✅ Resultado da Validação:`, 'cyan');
  log(`   • ${stats.results[0].errors} erros`);
  log(`   • ${stats.results[0].warnings} warnings`);
  log(`   • ${stats.results[0].info} info\n`);

  log('═══════════════════════════════════════════════════\n', 'blue');
}

// Execute benchmarks
if (require.main === module) {
  runBenchmarks()
    .then(() => {
      log('✨ Benchmark concluído com sucesso!', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`\n❌ Erro ao executar benchmark: ${error.message}`, 'yellow');
      process.exit(1);
    });
}

module.exports = { runBenchmarks };
