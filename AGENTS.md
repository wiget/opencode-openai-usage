# Agent guide

## Project

OpenCode V2 plugin displaying OpenAI ChatGPT/Codex subscription quota.
Server, TUI and RPC IDs are all `opencode-openai-usage`.

- `index.ts`: active OpenAI OAuth connection, usage requests and cache.
- `rpc.ts`: shared RPC contract; credentials must never cross it.
- `tui.tsx`: footer/sidebar rendering, refresh timers and cleanup.
- `format.ts`: pure formatting helpers.
- `tests/`: Node.js built-in tests; no real credentials or network required.

## Preserve behavior

- Display **remaining**, not used, percentages.
- Bars stay 10 columns wide with 5% steps.
- Footer: primary window above weekly, shared worst-window color, no countdowns.
- Sidebar: independent colors and reset countdowns.
- Resolve credentials through OpenCode on the server; do not read auth files,
  log tokens, or implement a separate login/refresh flow.

## Development

Use Node.js 24+. Run `npm ci --ignore-scripts`, `npm test`, and
`npm run pack:check`. Keep `package.json` and the committed `package-lock.json`
in sync. Do not introduce dependencies unless needed.

Do not edit the user's installed plugin or OpenCode configuration when changing
this repository. Keep documentation user-facing, not specific to a local setup.
Do not push, publish, or change authentication without explicit permission.
