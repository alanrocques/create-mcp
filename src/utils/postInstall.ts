import * as p from '@clack/prompts';
import { execa } from 'execa';
import type { ProjectConfig } from '../types.js';

export async function runPostInstall(config: ProjectConfig): Promise<void> {
  const s = p.spinner();

  if (config.language === 'typescript') {
    s.start('Installing dependencies with npm...');
    try {
      await execa('npm', ['install'], { cwd: config.outputDir });
      s.stop('Dependencies installed');
    } catch {
      s.stop('Skipped npm install (you can run it manually)');
    }
  } else {
    s.start('Setting up Python project with uv...');
    try {
      await execa('uv', ['sync'], { cwd: config.outputDir });
      s.stop('Python environment ready');
    } catch {
      s.stop('Skipped uv sync (you can run it manually)');
    }
  }
}
