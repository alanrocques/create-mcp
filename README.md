# create-mcp

Scaffold production-ready [MCP](https://modelcontextprotocol.io) servers in seconds.

```bash
npx create-mcp@latest
```

## Features

- **TypeScript & Python** — Official SDK support for both languages
- **stdio & Streamable HTTP** — Local dev tools or remote deployed servers
- **Auth scaffolding** — OAuth 2.1 and API Key middleware out of the box
- **Deployment configs** — Docker, Cloudflare Workers, AWS Lambda
- **Working tests** — Generated projects include tests that pass immediately
- **MCP Inspector** — `npm run inspect` to test your server interactively
- **Registry-ready** — Includes `mcp.json` manifest for the MCP Registry

## Usage

### Interactive (recommended)

```bash
npx create-mcp@latest
```

The wizard will ask for:
1. Project name
2. Language (TypeScript / Python)
3. Transport (stdio / Streamable HTTP)
4. Authentication (None / OAuth 2.1 / API Key)
5. Deployment target (None / Docker / Cloudflare Workers / AWS Lambda)
6. Features (Tools / Resources / Prompts / Sampling)

### Non-interactive

```bash
npx create-mcp@latest my-server --lang typescript --transport stdio --features tools,resources -y
```

### All flags

| Flag | Values | Default |
|------|--------|---------|
| `--lang` | `typescript`, `python` | `typescript` |
| `--transport` | `stdio`, `http` | `stdio` |
| `--auth` | `none`, `oauth`, `apikey` | `none` |
| `--deploy` | `none`, `docker`, `cloudflare`, `lambda` | `none` |
| `--features` | Comma-separated: `tools`, `resources`, `prompts`, `sampling` | `tools` |
| `-y, --yes` | Accept all defaults | — |

## Generated project

A TypeScript + stdio project with tools generates:

```
my-server/
├── src/
│   ├── index.ts         # Server entry point
│   └── tools/
│       └── index.ts     # Example tools (hello, get-time)
├── tests/
│   └── tools.test.ts    # Working tests
├── package.json
├── tsconfig.json
├── mcp.json             # MCP Registry manifest
├── README.md
├── .gitignore
└── .env.example
```

After generation:

```bash
cd my-server
npm install
npm run dev        # Start the server
npm run inspect    # Test with MCP Inspector
npm test           # Run tests
```

## License

MIT
