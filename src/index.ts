#!/usr/bin/env node

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import path from 'node:path';
import { runWizard } from './prompts.js';
import { generate } from './generator.js';
import { runPostInstall } from './utils/postInstall.js';
import type { ProjectConfig, Language, Transport, AuthMethod, DeployTarget, Feature } from './types.js';

const program = new Command();

program
  .name('create-mcp')
  .description('Scaffold a production-ready MCP server')
  .version('0.1.0')
  .argument('[name]', 'Project name')
  .option('--lang <language>', 'Language: typescript or python', 'typescript')
  .option('--transport <transport>', 'Transport: stdio or http', 'stdio')
  .option('--auth <method>', 'Auth: none, oauth, or apikey', 'none')
  .option('--deploy <target>', 'Deploy: none, docker, cloudflare, or lambda', 'none')
  .option('--features <list>', 'Comma-separated features: tools,resources,prompts,sampling', 'tools')
  .option('-y, --yes', 'Accept all defaults (name is required)')
  .action(async (name: string | undefined, opts: Record<string, string | boolean>) => {
    try {
      let config: ProjectConfig;

      if (name && opts.yes) {
        // Non-interactive mode
        config = buildConfigFromFlags(name, opts);
        validateConfig(config);
      } else if (name && hasExplicitFlags(opts)) {
        // Partial flags provided
        config = buildConfigFromFlags(name, opts);
        validateConfig(config);
      } else {
        // Interactive wizard
        config = await runWizard(name);
      }

      await generate(config);
      await runPostInstall(config);
      printNextSteps(config);
    } catch (err) {
      if (err instanceof Error) {
        p.cancel(err.message);
      }
      process.exit(1);
    }
  });

program.parse();

function hasExplicitFlags(opts: Record<string, string | boolean>): boolean {
  // Check if user provided any non-default flag values
  const args = process.argv.slice(2);
  return ['--lang', '--transport', '--auth', '--deploy', '--features'].some(
    flag => args.includes(flag)
  );
}

function buildConfigFromFlags(name: string, opts: Record<string, string | boolean>): ProjectConfig {
  const language = (opts.lang as Language) || 'typescript';
  const transport = (opts.transport as Transport) || 'stdio';
  const auth = (opts.auth as AuthMethod) || 'none';
  const deploy = (opts.deploy as DeployTarget) || 'none';
  const featuresStr = (opts.features as string) || 'tools';
  const features = featuresStr.split(',').map(f => f.trim()) as Feature[];

  return {
    name,
    language,
    transport,
    auth,
    deploy,
    features,
    outputDir: path.resolve(process.cwd(), name),
  };
}

function validateConfig(config: ProjectConfig): void {
  if (config.auth !== 'none' && config.transport !== 'http') {
    throw new Error('Authentication requires HTTP transport. Use --transport http with --auth.');
  }
  if ((config.deploy === 'cloudflare' || config.deploy === 'lambda') && config.transport !== 'http') {
    throw new Error(`${config.deploy} deployment requires HTTP transport. Use --transport http.`);
  }
  const validFeatures = ['tools', 'resources', 'prompts', 'sampling'];
  for (const f of config.features) {
    if (!validFeatures.includes(f)) {
      throw new Error(`Invalid feature: ${f}. Valid features: ${validFeatures.join(', ')}`);
    }
  }
}

function printNextSteps(config: ProjectConfig): void {
  const isTs = config.language === 'typescript';
  const moduleName = config.name.replace(/-/g, '_');
  const installCmd = isTs ? 'npm install' : 'uv sync';
  const devCmd = isTs ? 'npm run dev' : `uv run ${moduleName}`;
  const inspectCmd = isTs ? 'npm run inspect' : `npx @modelcontextprotocol/inspector uv run ${moduleName}`;
  const testCmd = isTs ? 'npm test' : 'uv run pytest';

  p.outro(pc.green('Project created at ./' + config.name));

  console.log();
  console.log('  Next steps:');
  console.log(pc.dim('  ─────────────────────────────'));
  console.log(`  cd ${config.name}`);
  console.log(`  ${installCmd}`);
  console.log(`  ${devCmd}          ${pc.dim('# Start the server')}`);
  console.log(`  ${inspectCmd}      ${pc.dim('# Test with MCP Inspector')}`);
  console.log(`  ${testCmd}          ${pc.dim('# Run tests')}`);

  if (isTs && config.transport === 'stdio') {
    console.log();
    console.log('  Add to Claude Desktop:');
    console.log(pc.dim('  ─────────────────────────────'));
    console.log(`  {`);
    console.log(`    "mcpServers": {`);
    console.log(`      "${config.name}": {`);
    console.log(`        "command": "node",`);
    console.log(`        "args": ["./build/index.js"]`);
    console.log(`      }`);
    console.log(`    }`);
    console.log(`  }`);
  }
  console.log();
}
