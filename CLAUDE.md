# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`create-mcp` is a CLI scaffolding tool (like `create-react-app`) that generates production-ready MCP (Model Context Protocol) servers. Invoked via `npx create-mcp@latest`. Supports TypeScript and Python, stdio and Streamable HTTP transports, OAuth 2.1 / API Key auth, and Docker / Cloudflare Workers / AWS Lambda deployment targets.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run in dev mode (ts-node or watch)
npm test             # Run all tests
npm run test -- --grep "pattern"  # Run specific tests
```

To test the CLI end-to-end locally:
```bash
npm run build && node dist/index.js
# or link globally:
npm link && create-mcp
```

## Architecture

- **`src/index.ts`** — Entry point, CLI argument parsing via `commander`. Supports both interactive wizard and non-interactive flags.
- **`src/prompts.ts`** — Interactive wizard using `@clack/prompts` (not inquirer). Collects: project name, language, transport, auth method, deployment target, features.
- **`src/generator.ts`** — Orchestrates file generation. Reads user choices, selects templates, renders via Handlebars, writes output.
- **`src/templates/{typescript,python}/{base,transport,auth,deploy,features}/`** — Handlebars template files organized by language and option. Templates must produce code that works out of the box.
- **`src/utils/files.ts`** — File writing utilities.
- **`src/utils/template.ts`** — Handlebars template rendering.
- **`src/utils/postInstall.ts`** — Runs `npm install` or `uv init` after generation via `execa`.
- **`src/types.ts`** — Shared TypeScript types for user choices and config.

## Key Design Decisions

- **`@clack/prompts`** for CLI UX — not inquirer. Matches the style of SvelteKit/Astro CLIs.
- **Handlebars** for template rendering — not string concatenation.
- **Generated code must work immediately** — `npm install && npm run dev` or `uv run` should produce a running MCP server.
- **MCP 2025-11-25 spec** — use latest protocol version, official SDKs (`@modelcontextprotocol/sdk` for TS, `mcp`/FastMCP for Python). Pin specific SDK versions.
- **stdio is the default transport** — HTTP is opt-in since 90%+ of MCP servers are local.
- **Generated projects include `mcp.json`** manifest for MCP Registry compatibility.
- **Generated projects include an `inspect` script** that launches `@modelcontextprotocol/inspector`.

## Dependencies

- `@clack/prompts` — CLI prompts
- `picocolors` — Terminal colors
- `commander` — Arg parsing
- `handlebars` — Template rendering
- `fs-extra` — File operations
- `execa` — Shell command execution

## Testing

- Snapshot tests: generate projects with various option combos, snapshot file trees and key contents
- Integration tests: generate a TS stdio project, run `npm install && npm run build`, verify clean exit
- Unit tests: template rendering, CLI argument parsing
