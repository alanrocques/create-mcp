import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import path from 'node:path';

const CLI = path.resolve('dist/index.js');

describe('CLI Validation', () => {
  it('rejects auth with stdio transport', async () => {
    try {
      await execa('node', [CLI, 'fail-test', '--transport', 'stdio', '--auth', 'oauth', '-y']);
      expect.fail('Should have thrown');
    } catch (err) {
      const output = (err as { stdout: string; stderr: string });
      expect(output.stdout + output.stderr).toContain('Authentication requires HTTP transport');
    }
  });

  it('rejects cloudflare with stdio transport', async () => {
    try {
      await execa('node', [CLI, 'fail-test', '--transport', 'stdio', '--deploy', 'cloudflare', '-y']);
      expect.fail('Should have thrown');
    } catch (err) {
      const output = (err as { stdout: string; stderr: string });
      expect(output.stdout + output.stderr).toContain('requires HTTP transport');
    }
  });

  it('rejects lambda with stdio transport', async () => {
    try {
      await execa('node', [CLI, 'fail-test', '--transport', 'stdio', '--deploy', 'lambda', '-y']);
      expect.fail('Should have thrown');
    } catch (err) {
      const output = (err as { stdout: string; stderr: string });
      expect(output.stdout + output.stderr).toContain('requires HTTP transport');
    }
  });

  it('rejects invalid features', async () => {
    try {
      await execa('node', [CLI, 'fail-test', '--features', 'invalid', '-y']);
      expect.fail('Should have thrown');
    } catch (err) {
      const output = (err as { stdout: string; stderr: string });
      expect(output.stdout + output.stderr).toContain('Invalid feature');
    }
  });

  it('prints help with --help', async () => {
    const result = await execa('node', [CLI, '--help']);
    expect(result.stdout).toContain('create-mcp');
    expect(result.stdout).toContain('--lang');
    expect(result.stdout).toContain('--transport');
  });

  it('prints version with --version', async () => {
    const result = await execa('node', [CLI, '--version']);
    expect(result.stdout).toContain('0.1.0');
  });
});
