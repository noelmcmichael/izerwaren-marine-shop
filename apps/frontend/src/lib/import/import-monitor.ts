// Production import monitoring and dashboard system

import { promises as fs } from 'fs';
import path from 'path';

import { ImportState } from './production-importer';

export class ImportMonitor {
  private stateFilePath: string;
  private monitoringInterval?: NodeJS.Timeout;
  private callbacks: Array<(state: ImportState) => void> = [];

  constructor() {
    this.stateFilePath = path.join(process.cwd(), '.taskmaster', 'import-state.json');
  }

  async getCurrentState(): Promise<ImportState | null> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  subscribe(callback: (state: ImportState) => void): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  startMonitoring(intervalMs: number = 2000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      const state = await this.getCurrentState();
      if (state) {
        this.callbacks.forEach(callback => callback(state));
      }
    }, intervalMs);

    console.log(`📊 Import monitoring started (checking every ${intervalMs}ms)`);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('📊 Import monitoring stopped');
    }
  }

  async displayStatus(): Promise<void> {
    const state = await this.getCurrentState();

    if (!state) {
      console.log('❌ No import state found');
      return;
    }

    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    PRODUCTION IMPORT STATUS                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();

    // Status header
    const statusIcon = this.getStatusIcon(state.status);
    console.log(`🔄 Status: ${statusIcon} ${state.status.toUpperCase()}`);
    console.log(`📋 Phase: ${state.currentPhase}`);
    console.log(`🕐 Started: ${new Date(state.startTime).toLocaleString()}`);
    console.log(`🔄 Updated: ${new Date(state.lastUpdate).toLocaleString()}`);

    if (state.estimatedCompletion) {
      console.log(`⏰ ETA: ${new Date(state.estimatedCompletion).toLocaleString()}`);
    }

    console.log();

    // Progress bars
    console.log('┌─ BATCH PROGRESS ──────────────────────────────────────────────┐');
    this.displayProgressBar('Batches', state.batchProgress.current, state.batchProgress.total, 50);
    console.log(
      `   Processed: ${state.batchProgress.processed} | Failed: ${state.batchProgress.failed}`
    );
    console.log('└───────────────────────────────────────────────────────────────┘');
    console.log();

    // Statistics
    console.log('┌─ IMPORT STATISTICS ───────────────────────────────────────────┐');
    console.log(`│ 📦 Simple Products:    ${state.stats.simpleProducts.toString().padStart(6)}`);
    console.log(`│ 🔧 Variable Products:  ${state.stats.variableProducts.toString().padStart(6)}`);
    console.log(`│ 🏷️  Variant Groups:     ${state.stats.variantGroups.toString().padStart(6)}`);
    console.log(`│ ⚙️  Variant Options:    ${state.stats.variantOptions.toString().padStart(6)}`);
    console.log(`│ 🎯 Product Variants:   ${state.stats.productVariants.toString().padStart(6)}`);
    console.log(`│ 📋 Technical Specs:    ${state.stats.technicalSpecs.toString().padStart(6)}`);
    console.log(`│ 🖼️  Images:             ${state.stats.images.toString().padStart(6)}`);
    console.log(`│ ⏭️  Skipped:            ${state.stats.skipped.toString().padStart(6)}`);
    console.log('└───────────────────────────────────────────────────────────────┘');
    console.log();

    // Errors summary
    if (state.errors.length > 0) {
      console.log('┌─ ERROR SUMMARY ───────────────────────────────────────────────┐');
      const errorsByType = this.groupErrorsByType(state.errors);

      Object.entries(errorsByType).forEach(([type, errors]) => {
        console.log(
          `│ ${type.toUpperCase().padEnd(15)}: ${errors.length.toString().padStart(4)} errors`
        );
      });

      console.log('└───────────────────────────────────────────────────────────────┘');
      console.log();

      // Show recent errors
      if (state.errors.length > 0) {
        console.log('📋 RECENT ERRORS (last 5):');
        state.errors.slice(-5).forEach(error => {
          const time = new Date(error.timestamp).toLocaleTimeString();
          console.log(
            `   ${time} [${error.type}] ${error.sku}: ${error.error.substring(0, 60)}...`
          );
        });
        console.log();
      }
    }

    // Performance metrics
    const elapsed = Date.now() - new Date(state.startTime).getTime();
    const elapsedMinutes = Math.floor(elapsed / 60000);
    const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

    console.log('┌─ PERFORMANCE METRICS ─────────────────────────────────────────┐');
    console.log(`│ Runtime:        ${elapsedMinutes}m ${elapsedSeconds}s`);

    if (state.batchProgress.processed > 0) {
      const itemsPerMinute = Math.round(state.batchProgress.processed / (elapsed / 60000));
      console.log(`│ Processing Rate: ${itemsPerMinute} items/minute`);
    }

    console.log('└───────────────────────────────────────────────────────────────┘');
    console.log();

    // Action hints
    if (state.status === 'in_progress') {
      console.log('💡 Commands: [Ctrl+C] Abort | [p] Pause | [r] Resume');
    } else if (state.status === 'paused') {
      console.log('💡 Commands: [Ctrl+C] Abort | [r] Resume');
    } else if (state.status === 'completed') {
      console.log('🎉 Import completed successfully!');
    } else if (state.status === 'failed') {
      console.log('❌ Import failed. Check errors above for details.');
    }
  }

  private getStatusIcon(status: string): string {
    const icons = {
      initializing: '🔄',
      in_progress: '⚡',
      completed: '✅',
      failed: '❌',
      paused: '⏸️',
    };
    return icons[status as keyof typeof icons] || '❓';
  }

  private displayProgressBar(
    label: string,
    current: number,
    total: number,
    width: number = 40
  ): void {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const display = `${current}/${total} (${percentage}%)`.padStart(15);

    console.log(`   ${label.padEnd(12)}: [${bar}] ${display}`);
  }

  private groupErrorsByType(
    errors: Array<{ type: string; sku: string; error: string; timestamp: string }>
  ): Record<string, any[]> {
    return errors.reduce(
      (groups, error) => {
        if (!groups[error.type]) {
          groups[error.type] = [];
        }
        groups[error.type].push(error);
        return groups;
      },
      {} as Record<string, any[]>
    );
  }

  async generateDetailedReport(): Promise<string> {
    const state = await this.getCurrentState();

    if (!state) {
      return 'No import state available';
    }

    const report = `
# Production Import Report

**Import ID**: ${state.id}
**Status**: ${state.status}
**Started**: ${new Date(state.startTime).toLocaleString()}
**Last Update**: ${new Date(state.lastUpdate).toLocaleString()}

## Progress Summary

- **Batch Progress**: ${state.batchProgress.current}/${state.batchProgress.total} (${Math.round((state.batchProgress.current / state.batchProgress.total) * 100)}%)
- **Items Processed**: ${state.batchProgress.processed}
- **Items Failed**: ${state.batchProgress.failed}

## Import Statistics

| Category | Count |
|----------|-------|
| Simple Products | ${state.stats.simpleProducts} |
| Variable Products | ${state.stats.variableProducts} |
| Variant Groups | ${state.stats.variantGroups} |
| Variant Options | ${state.stats.variantOptions} |
| Product Variants | ${state.stats.productVariants} |
| Technical Specs | ${state.stats.technicalSpecs} |
| Images | ${state.stats.images} |
| Skipped | ${state.stats.skipped} |

## Error Analysis

${
  state.errors.length > 0
    ? `
**Total Errors**: ${state.errors.length}

### Errors by Type
${Object.entries(this.groupErrorsByType(state.errors))
  .map(([type, errors]) => `- **${type}**: ${errors.length}`)
  .join('\n')}

### Recent Errors
${state.errors
  .slice(-10)
  .map(error => `- \`${error.sku}\` [${error.type}]: ${error.error}`)
  .join('\n')}
`
    : 'No errors recorded.'
}

## Performance Metrics

- **Runtime**: ${Math.round((Date.now() - new Date(state.startTime).getTime()) / 60000)} minutes
- **Processing Rate**: ${
      state.batchProgress.processed > 0
        ? Math.round(
            state.batchProgress.processed /
              ((Date.now() - new Date(state.startTime).getTime()) / 60000)
          )
        : 0
    } items/minute

---
*Generated on ${new Date().toLocaleString()}*
`;

    return report;
  }

  async saveReport(filename?: string): Promise<string> {
    const report = await this.generateDetailedReport();
    const reportPath =
      filename ||
      path.join(process.cwd(), '.taskmaster', 'reports', `import-report-${Date.now()}.md`);

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report);

    return reportPath;
  }
}

export default ImportMonitor;
