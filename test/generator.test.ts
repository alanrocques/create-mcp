import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { generate } from '../src/generator.js';
import type { ProjectConfig } from '../src/types.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-mcp-test-'));
}

function listFiles(dir: string): string[] {
  const files: string[] = [];
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        files.push(path.relative(dir, full));
      }
    }
  }
  walk(dir);
  return files.sort();
}

describe('Generator', () => {
  let outputDir: string;

  beforeEach(() => {
    outputDir = tmpDir();
  });

  afterEach(async () => {
    await fs.remove(outputDir);
  });

  it('generates TypeScript + stdio + tools only (minimal)', async () => {
    const config: ProjectConfig = {
      name: 'test-minimal',
      language: 'typescript',
      transport: 'stdio',
      auth: 'none',
      deploy: 'none',
      features: ['tools'],
      outputDir,
    };

    await generate(config);
    const files = listFiles(outputDir);

    expect(files).toContain('package.json');
    expect(files).toContain('tsconfig.json');
    expect(files).toContain('src/index.ts');
    expect(files).toContain('src/tools/index.ts');
    expect(files).toContain('tests/tools.test.ts');
    expect(files).toContain('mcp.json');
    expect(files).toContain('.gitignore');
    expect(files).toContain('README.md');

    // Should NOT have resources/prompts dirs
    expect(files.some(f => f.includes('resources/'))).toBe(false);
    expect(files.some(f => f.includes('prompts/'))).toBe(false);

    // Verify package.json content
    const pkg = JSON.parse(fs.readFileSync(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('test-minimal');
    expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
    expect(pkg.scripts.inspect).toContain('node build/index.js');
  });

  it('generates TypeScript + stdio + all features', async () => {
    const config: ProjectConfig = {
      name: 'test-full',
      language: 'typescript',
      transport: 'stdio',
      auth: 'none',
      deploy: 'none',
      features: ['tools', 'resources', 'prompts', 'sampling'],
      outputDir,
    };

    await generate(config);
    const files = listFiles(outputDir);

    expect(files).toContain('src/tools/index.ts');
    expect(files).toContain('src/resources/index.ts');
    expect(files).toContain('src/prompts/index.ts');

    // Verify entry point imports all features
    const indexContent = fs.readFileSync(path.join(outputDir, 'src/index.ts'), 'utf-8');
    expect(indexContent).toContain('registerTools');
    expect(indexContent).toContain('registerResources');
    expect(indexContent).toContain('registerPrompts');
  });

  it('generates TypeScript + HTTP + OAuth + Docker (maximal)', async () => {
    const config: ProjectConfig = {
      name: 'test-maximal',
      language: 'typescript',
      transport: 'http',
      auth: 'oauth',
      deploy: 'docker',
      features: ['tools', 'resources', 'prompts'],
      outputDir,
    };

    await generate(config);
    const files = listFiles(outputDir);

    expect(files).toContain('Dockerfile');
    expect(files).toContain('docker-compose.yml');
    expect(files).toContain('.dockerignore');
    expect(files).toContain('src/auth/oauth.ts');
    expect(files).toContain('src/index.ts');

    const pkg = JSON.parse(fs.readFileSync(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(pkg.dependencies['express']).toBeDefined();
    expect(pkg.dependencies['jose']).toBeDefined();
    expect(pkg.scripts.inspect).toContain('http://localhost:3000/mcp');

    const indexContent = fs.readFileSync(path.join(outputDir, 'src/index.ts'), 'utf-8');
    expect(indexContent).toContain('validateOAuthToken');
    expect(indexContent).toContain('express');
  });

  it('generates Python + stdio + tools only', async () => {
    const config: ProjectConfig = {
      name: 'test-python',
      language: 'python',
      transport: 'stdio',
      auth: 'none',
      deploy: 'none',
      features: ['tools'],
      outputDir,
    };

    await generate(config);
    const files = listFiles(outputDir);

    expect(files).toContain('pyproject.toml');
    expect(files).toContain('src/test_python/server.py');
    expect(files).toContain('src/test_python/__init__.py');
    expect(files).toContain('src/test_python/tools/__init__.py');
    expect(files).toContain('tests/test_tools.py');
    expect(files).toContain('mcp.json');

    const toml = fs.readFileSync(path.join(outputDir, 'pyproject.toml'), 'utf-8');
    expect(toml).toContain('mcp[cli]');
    expect(toml).toContain('test_python.server:main');
  });

  it('generates Python + HTTP + API Key + Lambda', async () => {
    const config: ProjectConfig = {
      name: 'test-py-lambda',
      language: 'python',
      transport: 'http',
      auth: 'apikey',
      deploy: 'lambda',
      features: ['tools', 'resources'],
      outputDir,
    };

    await generate(config);
    const files = listFiles(outputDir);

    expect(files).toContain('template.yaml');
    expect(files).toContain('src/test_py_lambda/handler.py');
    expect(files).toContain('src/test_py_lambda/auth/__init__.py');
    expect(files).toContain('src/test_py_lambda/server.py');

    const envExample = fs.readFileSync(path.join(outputDir, '.env.example'), 'utf-8');
    expect(envExample).toContain('API_KEY');
  });

  it('generates mcp.json with correct transport', async () => {
    const config: ProjectConfig = {
      name: 'test-mcp-json',
      language: 'typescript',
      transport: 'http',
      auth: 'none',
      deploy: 'none',
      features: ['tools'],
      outputDir,
    };

    await generate(config);
    const mcpJson = JSON.parse(fs.readFileSync(path.join(outputDir, 'mcp.json'), 'utf-8'));
    expect(mcpJson.transport).toBe('http');
    expect(mcpJson.name).toBe('test-mcp-json');
  });
});
