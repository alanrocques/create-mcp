import * as p from '@clack/prompts';
import pc from 'picocolors';
import path from 'node:path';
import fs from 'node:fs';
import type { ProjectConfig, Language, Transport, AuthMethod, DeployTarget, Feature } from './types.js';

export async function runWizard(defaultName?: string): Promise<ProjectConfig> {
  p.intro(pc.bgCyan(pc.black(' create-mcp ')));

  const name = await p.text({
    message: 'Project name',
    placeholder: 'my-mcp-server',
    initialValue: defaultName,
    validate(value) {
      if (!value.trim()) return 'Project name is required';
      if (!/^[a-z0-9@][a-z0-9._\-/]*$/i.test(value.trim())) {
        return 'Invalid project name. Use lowercase letters, numbers, hyphens, or dots.';
      }
      const dir = path.resolve(process.cwd(), value.trim());
      if (fs.existsSync(dir)) {
        return `Directory "${value.trim()}" already exists. Choose a different name.`;
      }
    },
  });
  if (p.isCancel(name)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  const language = await p.select({
    message: 'Language',
    options: [
      { value: 'typescript', label: 'TypeScript', hint: 'recommended' },
      { value: 'python', label: 'Python' },
    ],
    initialValue: 'typescript',
  });
  if (p.isCancel(language)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  const transport = await p.select({
    message: 'Transport',
    options: [
      { value: 'stdio', label: 'stdio', hint: 'for Claude Desktop, Cursor, VS Code' },
      { value: 'http', label: 'Streamable HTTP', hint: 'for remote/deployed servers' },
    ],
    initialValue: 'stdio',
  });
  if (p.isCancel(transport)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  let auth: AuthMethod = 'none';
  if (transport === 'http') {
    const authChoice = await p.select({
      message: 'Authentication',
      options: [
        { value: 'none', label: 'None' },
        { value: 'oauth', label: 'OAuth 2.1' },
        { value: 'apikey', label: 'API Key' },
      ],
      initialValue: 'none',
    });
    if (p.isCancel(authChoice)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    auth = authChoice as AuthMethod;
  }

  const deployOptions = [
    { value: 'none', label: 'None' },
    { value: 'docker', label: 'Docker' },
    ...(transport === 'http'
      ? [
          { value: 'cloudflare', label: 'Cloudflare Workers' },
          { value: 'lambda', label: 'AWS Lambda' },
        ]
      : []),
  ];

  const deploy = await p.select({
    message: 'Deployment target',
    options: deployOptions,
    initialValue: 'none',
  });
  if (p.isCancel(deploy)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  const features = await p.multiselect({
    message: 'Features to include',
    options: [
      { value: 'tools', label: 'Tools', hint: 'expose callable tools' },
      { value: 'resources', label: 'Resources', hint: 'expose data resources' },
      { value: 'prompts', label: 'Prompts', hint: 'expose prompt templates' },
      { value: 'sampling', label: 'Sampling', hint: 'request LLM completions' },
    ],
    initialValues: ['tools'],
    required: true,
  });
  if (p.isCancel(features)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  const projectName = name.trim();
  return {
    name: projectName,
    language: language as Language,
    transport: transport as Transport,
    auth,
    deploy: deploy as DeployTarget,
    features: features as Feature[],
    outputDir: path.resolve(process.cwd(), projectName),
  };
}
