
# Claude Code Prompt: Build `create-mcp`

> Copy everything below this line and paste it into Claude Code (or use it as a CLAUDE.md / prompt file).

---

## Project Overview

Build `create-mcp` — a CLI scaffolding tool that generates production-ready MCP (Model Context Protocol) servers in 30 seconds. Think `create-react-app` but for the MCP ecosystem.

The tool should be invoked as:

```bash
npx create-mcp@latest
```

Or installed globally:

```bash
npm install -g create-mcp
create-mcp
```

## Why This Matters

MCP has 97M+ monthly SDK downloads and 10,000+ active servers, but starting a new server means copying boilerplate from scattered GitHub examples. The existing scaffolding tools (mcp-forge, mcpc, mcp-kit) are all under 200 stars and lack key features like auth scaffolding, multi-transport support, deployment configs, and proper testing setup. `create-mcp` should become THE default answer to "how do I build an MCP server?"

## Core User Experience

When a developer runs `npx create-mcp@latest`, they should get an interactive wizard that asks:

1. **Project name** — e.g. `my-weather-server`
2. **Language** — TypeScript (default) or Python
3. **Transport** — stdio (default, for local dev tools like Claude Desktop/Cursor) or Streamable HTTP (for remote/deployed servers)
4. **Auth method** — None (default for stdio), OAuth 2.1, or API Key (for HTTP transport)
5. **Deployment target** — None (default), Docker, Cloudflare Workers, or AWS Lambda
6. **Features to include** — checkboxes: Tools (default on), Resources, Prompts, Sampling

Then it generates a complete, working project and prints next steps.

## Technical Architecture

### Package Structure

```
create-mcp/
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE                    # MIT
├── src/
│   ├── index.ts               # Entry point, CLI arg parsing
│   ├── prompts.ts             # Interactive wizard (inquirer/prompts)
│   ├── generator.ts           # Orchestrates file generation
│   ├── templates/             # Template files organized by language
│   │   ├── typescript/
│   │   │   ├── base/          # Files common to all TS projects
│   │   │   ├── transport/     # stdio vs http-specific files
│   │   │   ├── auth/          # OAuth 2.1 / API key scaffolding
│   │   │   ├── deploy/        # Docker, CF Workers, Lambda configs
│   │   │   └── features/      # Tools, Resources, Prompts, Sampling
│   │   └── python/
│   │       ├── base/
│   │       ├── transport/
│   │       ├── auth/
│   │       ├── deploy/
│   │       └── features/
│   ├── utils/
│   │   ├── files.ts           # File writing utilities
│   │   ├── template.ts        # Template rendering (handlebars or ejs)
│   │   └── postInstall.ts     # npm install / uv init runner
│   └── types.ts               # Shared TypeScript types
└── test/
    ├── generator.test.ts
    ├── prompts.test.ts
    └── snapshots/             # Snapshot tests for generated output
```

### Key Dependencies

- `@clack/prompts` — Beautiful CLI prompts (used by SvelteKit, Astro — looks way better than inquirer)
- `picocolors` — Terminal colors
- `commander` — CLI argument parsing
- `handlebars` — Template rendering
- `fs-extra` — File operations
- `execa` — Running shell commands (npm install, uv init)

### CLI Arguments (Non-Interactive Mode)

Support flags to skip the wizard for CI/scripting:

```bash
create-mcp my-server --lang typescript --transport stdio --no-auth --features tools,resources
```

## What Gets Generated

### TypeScript + stdio (the most common case)

```
my-weather-server/
├── src/
│   ├── index.ts               # Server entry point
│   ├── tools/
│   │   └── example.ts         # Example tool with proper typing
│   ├── resources/             # (if selected)
│   │   └── example.ts
│   └── prompts/               # (if selected)
│       └── example.ts
├── tests/
│   └── tools.test.ts          # Working test using MCP test utilities
├── package.json               # Scripts: dev, build, test, inspect
├── tsconfig.json
├── .gitignore
├── .env.example
├── README.md                  # Usage instructions + badge
└── mcp.json                   # MCP server manifest (for registry)
```

### Python + stdio

```
my-weather-server/
├── src/
│   └── my_weather_server/
│       ├── __init__.py
│       ├── server.py           # FastMCP server entry point
│       ├── tools/
│       │   └── example.py
│       ├── resources/          # (if selected)
│       └── prompts/            # (if selected)
├── tests/
│   └── test_tools.py
├── pyproject.toml              # Using uv as package manager
├── .gitignore
├── .env.example
├── README.md
└── mcp.json
```

### Additional Files by Option

**If Docker deployment:**
- `Dockerfile` (multi-stage build)
- `docker-compose.yml`
- `.dockerignore`

**If Cloudflare Workers:**
- `wrangler.toml`
- Adjusted entry point for Workers runtime

**If AWS Lambda:**
- `template.yaml` (SAM template)
- Lambda handler wrapper

**If OAuth 2.1 auth:**
- Auth middleware/decorator scaffolding
- Token validation logic
- `.env.example` with `OAUTH_ISSUER_URL`, `OAUTH_AUDIENCE` vars
- Comments explaining the MCP 2025-11-25 OAuth spec requirements

**If API Key auth:**
- API key validation middleware
- `.env.example` with `API_KEY` var

## Code Quality Requirements

### Generated Code Must:

1. **Actually work out of the box.** After `npm install && npm run dev` (or `uv run python -m server`), the server should start and respond to MCP protocol messages. Include a working example tool that does something real (e.g., returns current date/time, echoes input with metadata).

2. **Follow the MCP 2025-11-25 spec.** Use the latest protocol version. Include proper capability negotiation, server info metadata, and error handling per spec.

3. **Use the official SDKs correctly.** TypeScript: `@modelcontextprotocol/sdk`. Python: `mcp` (FastMCP). Pin to latest stable versions.

4. **Include proper TypeScript types.** Strict mode, no `any` types, proper Zod schemas for tool inputs.

5. **Have working tests.** At minimum one test per example tool that actually exercises the MCP protocol (not just unit tests of business logic).

6. **Include an `inspect` script.** `npm run inspect` or equivalent that launches `npx @modelcontextprotocol/inspector` pointed at the server — the single most useful dev workflow.

### Generated README Must Include:

- Project name and one-line description
- Quick start (install + run in 3 commands)
- How to test with MCP Inspector
- How to add to Claude Desktop / Cursor / VS Code (with the exact JSON config snippet)
- How to add new tools (brief guide)
- Link to MCP docs

## CLI Tool Quality Requirements

### The CLI Itself Must:

1. **Be fast.** File generation should complete in under 2 seconds (excluding npm install).
2. **Look beautiful.** Use `@clack/prompts` for a polished, modern CLI experience with spinners, colored output, and clear step indicators.
3. **Handle errors gracefully.** Directory already exists? No npm? No uv? Clear error message with fix instructions.
4. **Support `--help`** with clear documentation of all flags.
5. **Print clear next steps** after generation:

```
✔ Project created at ./my-weather-server

  Next steps:
  cd my-weather-server
  npm install
  npm run dev          # Start the server
  npm run inspect      # Test with MCP Inspector

  Add to Claude Desktop:
  {
    "mcpServers": {
      "my-weather-server": {
        "command": "node",
        "args": ["./build/index.js"]
      }
    }
  }
```

## Implementation Plan

Build in this order:

1. **Project setup** — Initialize the npm package, tsconfig, build pipeline. Make sure `npx create-mcp` works as a command.

2. **Interactive wizard** — Build the prompt flow with `@clack/prompts`. Get the UX feeling right before generating anything.

3. **TypeScript + stdio templates** — The most common case. Get a working generated server that passes tests.

4. **Python + stdio templates** — Second most common. Use FastMCP.

5. **HTTP transport variants** — Streamable HTTP for both languages.

6. **Auth scaffolding** — OAuth 2.1 and API key options.

7. **Deployment configs** — Docker, CF Workers, Lambda.

8. **Non-interactive mode** — CLI flags to skip the wizard.

9. **Tests for the CLI itself** — Snapshot tests ensuring generated output is correct.

10. **README and polish** — Comprehensive README with GIF demo, badges, etc.

## Key Design Decisions

- **Use `@clack/prompts` not `inquirer`.** Clack is modern, beautiful, and what the best CLIs (SvelteKit, Astro) use. It creates a much more premium experience.
- **Handlebars for templates, not string concatenation.** Keeps templates readable and maintainable.
- **Include `mcp.json` manifest.** The MCP Registry is live — generated servers should be registry-ready from day one.
- **Default to stdio transport.** 90%+ of MCP servers are local stdio servers for use with Claude Desktop, Cursor, and VS Code. HTTP should be opt-in.
- **Pin SDK versions.** Don't use `latest` — pin to specific tested versions to avoid breakage.
- **MIT license on the CLI and all generated code.** No license friction.

## Testing Strategy

For the CLI itself:
- **Snapshot tests**: Generate a project with each combination of options, snapshot the file tree and key file contents
- **Integration test**: Generate a TypeScript stdio project, run `npm install && npm run build`, verify it exits cleanly
- **Unit tests**: Template rendering, CLI argument parsing

## Stretch Goals (v1.1+)

- `create-mcp add tool <name>` — Add a new tool to an existing project
- `create-mcp add resource <name>` — Add a new resource
- `create-mcp register` — Register with the MCP Registry
- `create-mcp upgrade` — Upgrade SDK versions and migrate to latest spec
- Community-contributed templates via a plugin system
- Go language support

## Reference Materials

Before writing code, read these:
- MCP Spec (2025-11-25): https://modelcontextprotocol.io/specification/2025-11-25
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Python SDK (FastMCP): https://github.com/jlowin/fastmcp
- MCP Inspector: https://github.com/modelcontextprotocol/inspector
- Existing scaffolders to study (and beat): https://github.com/iddv/mcp-forge, https://github.com/vlyl/mcpc
- `@clack/prompts` docs: https://github.com/bombshell-dev/clack

Now build this. Start with step 1 (project setup) and work through the implementation plan sequentially. After each step, verify it works before moving to the next.
