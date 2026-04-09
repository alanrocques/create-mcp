import * as p from '@clack/prompts';
import { renderTemplate } from './utils/template.js';
import { writeProjectFile } from './utils/files.js';
import type { ProjectConfig } from './types.js';

interface FileEntry {
  outputPath: string;
  content: string;
}

export async function generate(config: ProjectConfig): Promise<void> {
  const s = p.spinner();
  s.start('Generating project files...');

  const context = buildContext(config);
  const files = buildFileManifest(config, context);

  for (const file of files) {
    await writeProjectFile(config.outputDir, file.outputPath, file.content);
  }

  s.stop(`Generated ${files.length} files`);
}

function buildContext(config: ProjectConfig): Record<string, unknown> {
  const pythonModuleName = config.name.replace(/-/g, '_').replace(/\./g, '_');
  return {
    ...config,
    pythonModuleName,
    mcpSdkVersion: '1.12.1',
    zodVersion: '3.24.4',
    fastmcpVersion: '2.5.2',
  };
}

function buildFileManifest(config: ProjectConfig, context: Record<string, unknown>): FileEntry[] {
  const files: FileEntry[] = [];
  const lang = config.language;

  // Base files
  files.push(render(`${lang}/base/gitignore.hbs`, '.gitignore', context));
  files.push(render(`${lang}/base/env.example.hbs`, '.env.example', context));
  files.push(render(`${lang}/base/readme.md.hbs`, 'README.md', context));
  files.push({ outputPath: 'mcp.json', content: generateMcpJson(config) });

  // Language-specific base files
  if (lang === 'typescript') {
    files.push({ outputPath: 'package.json', content: generateTsPackageJson(config) });
    files.push(render('typescript/base/tsconfig.json.hbs', 'tsconfig.json', context));
  } else {
    files.push({ outputPath: 'pyproject.toml', content: generatePyprojectToml(config, context) });
    files.push({
      outputPath: `src/${context.pythonModuleName}/__init__.py`,
      content: '',
    });
  }

  // Entry point (varies by transport)
  const transportDir = config.transport === 'stdio' ? 'stdio' : 'http';
  if (lang === 'typescript') {
    files.push(render(
      `typescript/transport/${transportDir}/index.ts.hbs`,
      'src/index.ts',
      context
    ));
  } else {
    files.push(render(
      `python/transport/${transportDir}/server.py.hbs`,
      `src/${context.pythonModuleName}/server.py`,
      context
    ));
  }

  // Feature files
  for (const feature of config.features) {
    files.push(...getFeatureFiles(lang, feature, context));
  }

  // Auth files
  if (config.auth !== 'none') {
    files.push(...getAuthFiles(lang, config.auth, context));
  }

  // Deployment files
  if (config.deploy !== 'none') {
    files.push(...getDeployFiles(lang, config.deploy, context));
  }

  // Test files
  files.push(...getTestFiles(lang, config, context));

  return files;
}

function getFeatureFiles(lang: string, feature: string, context: Record<string, unknown>): FileEntry[] {
  const files: FileEntry[] = [];

  if (lang === 'typescript') {
    switch (feature) {
      case 'tools':
        files.push(render('typescript/features/tools/index.ts.hbs', 'src/tools/index.ts', context));
        break;
      case 'resources':
        files.push(render('typescript/features/resources/index.ts.hbs', 'src/resources/index.ts', context));
        break;
      case 'prompts':
        files.push(render('typescript/features/prompts/index.ts.hbs', 'src/prompts/index.ts', context));
        break;
      case 'sampling':
        // Sampling is a capability declaration, not a separate file
        break;
    }
  } else {
    const moduleName = context.pythonModuleName as string;
    switch (feature) {
      case 'tools':
        files.push(render('python/features/tools/example.py.hbs', `src/${moduleName}/tools/__init__.py`, context));
        break;
      case 'resources':
        files.push(render('python/features/resources/example.py.hbs', `src/${moduleName}/resources/__init__.py`, context));
        break;
      case 'prompts':
        files.push(render('python/features/prompts/example.py.hbs', `src/${moduleName}/prompts/__init__.py`, context));
        break;
      case 'sampling':
        break;
    }
  }

  return files;
}

function getAuthFiles(lang: string, auth: string, context: Record<string, unknown>): FileEntry[] {
  const files: FileEntry[] = [];

  if (lang === 'typescript') {
    if (auth === 'oauth') {
      files.push(render('typescript/auth/oauth.ts.hbs', 'src/auth/oauth.ts', context));
    } else if (auth === 'apikey') {
      files.push(render('typescript/auth/apikey.ts.hbs', 'src/auth/apikey.ts', context));
    }
  } else {
    const moduleName = context.pythonModuleName as string;
    if (auth === 'oauth') {
      files.push(render('python/auth/oauth.py.hbs', `src/${moduleName}/auth/__init__.py`, context));
    } else if (auth === 'apikey') {
      files.push(render('python/auth/apikey.py.hbs', `src/${moduleName}/auth/__init__.py`, context));
    }
  }

  return files;
}

function getDeployFiles(lang: string, deploy: string, context: Record<string, unknown>): FileEntry[] {
  const files: FileEntry[] = [];

  if (deploy === 'docker') {
    files.push(render(`${lang}/deploy/docker/Dockerfile.hbs`, 'Dockerfile', context));
    files.push(render(`${lang}/deploy/docker/docker-compose.yml.hbs`, 'docker-compose.yml', context));
    files.push(render(`${lang}/deploy/docker/dockerignore.hbs`, '.dockerignore', context));
  } else if (deploy === 'cloudflare') {
    files.push(render(`${lang}/deploy/cloudflare/wrangler.toml.hbs`, 'wrangler.toml', context));
  } else if (deploy === 'lambda') {
    files.push(render(`${lang}/deploy/lambda/template.yaml.hbs`, 'template.yaml', context));
    if (lang === 'typescript') {
      files.push(render('typescript/deploy/lambda/handler.ts.hbs', 'src/handler.ts', context));
    } else {
      const moduleName = context.pythonModuleName as string;
      files.push(render('python/deploy/lambda/handler.py.hbs', `src/${moduleName}/handler.py`, context));
    }
  }

  return files;
}

function getTestFiles(lang: string, config: ProjectConfig, context: Record<string, unknown>): FileEntry[] {
  if (lang === 'typescript') {
    return [render('typescript/tests/tools.test.ts.hbs', 'tests/tools.test.ts', context)];
  }
  return [render('python/tests/test_tools.py.hbs', 'tests/test_tools.py', context)];
}

function render(templatePath: string, outputPath: string, context: Record<string, unknown>): FileEntry {
  return {
    outputPath,
    content: renderTemplate(templatePath, context),
  };
}

// --- Programmatic JSON/TOML generators (avoid Handlebars comma issues) ---

function generateMcpJson(config: ProjectConfig): string {
  return JSON.stringify(
    {
      name: config.name,
      version: '0.1.0',
      description: `${config.name} MCP server`,
      transport: config.transport,
    },
    null,
    2
  ) + '\n';
}

function generateTsPackageJson(config: ProjectConfig): string {
  const pkg: Record<string, unknown> = {
    name: config.name,
    version: '0.1.0',
    type: 'module',
    private: true,
    bin: {
      [config.name]: './build/index.js',
    },
    scripts: {
      build: 'tsc',
      dev: 'tsx src/index.ts',
      'test': 'vitest run',
      inspect:
        config.transport === 'http'
          ? `npx @modelcontextprotocol/inspector http://localhost:3000/mcp`
          : `npx @modelcontextprotocol/inspector node build/index.js`,
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.12.1',
      zod: '^3.24.4',
    } as Record<string, string>,
    devDependencies: {
      '@types/node': '^22.15.3',
      typescript: '^5.8.3',
      tsx: '^4.19.4',
      vitest: '^3.1.2',
    } as Record<string, string>,
  };

  const deps = pkg.dependencies as Record<string, string>;
  const devDeps = pkg.devDependencies as Record<string, string>;

  if (config.transport === 'http') {
    deps['express'] = '^5.1.0';
    devDeps['@types/express'] = '^5.0.0';
  }

  if (config.auth === 'oauth') {
    deps['jose'] = '^6.0.11';
  }

  return JSON.stringify(pkg, null, 2) + '\n';
}

function generatePyprojectToml(config: ProjectConfig, context: Record<string, unknown>): string {
  const deps = [
    `    "mcp[cli]>=1.2.0"`,
  ];

  if (config.transport === 'http') {
    deps.push(`    "uvicorn>=0.34.0"`);
  }
  if (config.auth === 'oauth') {
    deps.push(`    "python-jose>=3.3.0"`);
    deps.push(`    "httpx>=0.28.0"`);
  }

  const moduleName = context.pythonModuleName as string;

  return `[project]
name = "${config.name}"
version = "0.1.0"
description = "${config.name} MCP server"
requires-python = ">=3.10"
dependencies = [
${deps.join(',\n')},
]

[project.scripts]
${moduleName} = "${moduleName}.server:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/${moduleName}"]

[dependency-groups]
dev = [
    "pytest>=8.0.0",
    "anyio>=4.0.0",
    "pytest-anyio>=0.0.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
`;
}
