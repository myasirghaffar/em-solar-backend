# Supabase MCP (`em-solar-api`)

## Config files

| Tool | File | Purpose |
|------|------|---------|
| **Claude Code** | [`.mcp.json`](./.mcp.json) | Project-scoped HTTP MCP when **`em-solar-backend`** is the project root |
| **Cursor (this folder only)** | [`.cursor/mcp.json`](./.cursor/mcp.json) | Supabase MCP if you open **`em-solar-backend`** as the workspace root |
| **Cursor (monorepo root)** | [`../.cursor/mcp.json`](../.cursor/mcp.json) | When the workspace is **`em-solar-project`**, Cursor reads MCP here (keep in sync if you change URLs) |

Server URL: `https://mcp.supabase.com/mcp?project_ref=geqhoiiqwlymljdgppco`

## Authenticate

- **Cursor:** **Settings → Cursor Settings → Tools & MCP** → **supabase** → sign in. If you use two entries, disable the duplicate and keep one enabled (see screenshot in repo history).
- **Claude Code:** `claude /mcp` → **supabase** → **Authenticate**.

From **`em-solar-backend`** (if `claude` CLI is installed):

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=geqhoiiqwlymljdgppco"
```

## Agent skills (optional)

From monorepo root, skills install under [`.agents/skills/`](../.agents/skills/). Reinstall:

```bash
cd ..   # monorepo root
npx skills add supabase/agent-skills -y
```

## Verify via MCP (in Cursor)

With **supabase** connected and tools enabled, ask the agent to run a read-only check, e.g. *“List tables in the public schema using Supabase MCP.”* Approve the tool call when prompted.

## Security

[Supabase MCP security](https://supabase.com/docs/guides/getting-started/mcp#security-risks) — use a dev project when possible, consider `read_only=true` on the MCP URL, and review each tool invocation.
