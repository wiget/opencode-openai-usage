# OpenAI Usage for OpenCode

`opencode-openai-usage` is a small OpenCode V2 plugin that displays remaining
ChatGPT/Codex subscription allowance in the terminal footer and sidebar.

**Status:** experimental. Use a source checkout; npm installation is not available
yet.

## Requirements

- **OpenCode V2.** The plugin targets the **2.3.0** SDK; compatibility with other
  versions is not guaranteed.
- An active **OpenAI ChatGPT OAuth connection** in OpenCode whose credentials are
  accepted by the subscription usage endpoint. An OpenAI Platform API key does
  not provide this quota.
- A terminal font with Unicode block-element coverage.

## Features

- Compact **10-column footer bar** with two stacked usage windows.
- Unicode quadrant blocks provide **5-percentage-point steps** without using a
  second terminal row.
- Primary-window allowance is on top; weekly allowance is underneath.
- The number beside the footer bar is the **primary-window percentage remaining**.
  If only a longer window is available, its duration and remaining percentage are
  shown instead.
- Sidebar entries have independent bars, remaining percentages and reset countdowns.
- No reset countdowns in the footer.
- Sidebar bars use `█`, `▌` and `░` for the same 5% resolution.
- Usage refreshes every 60 seconds; countdowns update every 30 seconds.
- Failed refreshes preserve the last successful reading and mark it **stale**.

For example, a sidebar reading of **65% left** is:

```text
██████▌░░░ 65% left
```

Each full column represents 10 percentage points; half a column represents 5.
Bars round to the nearest 5%; numeric percentages are rounded to whole percentages.

## Colors

Bar colors indicate the remaining allowance:

| Remaining | Theme color role | Default color |
| --- | --- | --- |
| More than 25% | Success (`text.feedback.success.base`) | Green |
| More than 10%, up to 25% | Warning (`text.feedback.warning.base`) | Yellow / amber |
| 10% or less | Error (`text.feedback.error.base`) | Red |

The exact colors follow your OpenCode theme, so custom themes may use different
shades or colors.

The footer's two half-height bars share a single fill color, based on the
**lowest remaining allowance**. This allows quadrant glyphs to represent both
windows using the foreground/background colors supported by a terminal cell.
Sidebar bars are colored independently. Stale readings use muted colors.

## Authentication and remote servers

Run `/connect` in OpenCode and connect OpenAI using ChatGPT OAuth.

The server part resolves the active OpenAI connection through OpenCode's
integration API. It requests usage on the server and sends only usage-window
numbers to the terminal over RPC. The terminal does not read authentication files.
No Codex CLI installation, separate token configuration, or browser on the server
is required.

For remote/headless servers, device-code OAuth lets you authorize sign-in from a
browser on another device. Device-code sign-in must be permitted in your ChatGPT
account's security settings or workspace permissions. OpenCode handles
authentication and token refresh; the plugin does not implement a separate login
flow.

Different OpenAI sign-in methods can issue credentials with different endpoint
permissions. Successful model requests do not guarantee that the usage endpoint
accepts the same credential.

## Installation

Download or clone this repository to a directory accessible to the OpenCode server.

Add the repository directory to your global
`~/.config/opencode/opencode.jsonc`, preserving other settings:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "/absolute/path/to/opencode-openai-usage"
  ]
}
```

One entry loads the server, RPC and TUI parts. A separate `cli.json` entry is not
needed. For a remote OpenCode service, the checkout and server configuration must
be on that server.

The sidebar contribution appears when OpenCode's sidebar is visible. Configuration
reloads automatically; use `/reload` to force a reload.

Avoid loading multiple copies of the plugin through different configuration
entries or automatic discovery.

## Troubleshooting

### No usage display

- Confirm that the plugin is configured on the OpenCode server, not just in the
  terminal client's `cli.json`.
- Check that the active OpenAI connection uses ChatGPT OAuth rather than an API
  key.
- The widget stays hidden if no usage windows are returned and no request error
  has occurred.
- For sidebar entries, make sure OpenCode's sidebar is visible.
- Use `/reload` after correcting configuration or authentication.

### "OpenAI usage unavailable" or "(stale)"

The latest request failed. A stale reading preserves the last successful data;
it is not a current measurement. Check your OpenAI connection and the server's
network access to `chatgpt.com`.

If model requests work but usage requests fail, your sign-in method may issue
credentials that the private usage endpoint does not accept. Repeating the same
sign-in method is not guaranteed to resolve that incompatibility.

### Bars render incorrectly

Choose a monospace font that includes Unicode block and quadrant characters.
Missing glyphs or font fallback can cause gaps, misaligned halves or replacement
characters.

## Security and limitations

- Usage comes from the undocumented endpoint
  `https://chatgpt.com/backend-api/wham/usage`. Its response and authentication
  requirements may change.
- These are provider-reported subscription allowances, not API billing totals,
  ChatGPT message limits or local session-token estimates.
- Primary/weekly footer placement currently distinguishes windows shorter than
  one day from longer windows; unusual provider window layouts may need changes.
- A reset countdown reaching zero does not fabricate new allowance; it displays
  **Reset pending refresh** until the next successful reading.
- The server only retains account ID, timestamps and usage numbers in its cache.
  OAuth credentials are obtained through OpenCode and are not returned by RPC.
- Never commit credentials, authentication files or private OpenCode configuration.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development commands, tests and release
checks.

## Acknowledgments

The compact stacked footer bars and sidebar presentation were visually inspired by
[`opencode-openai-limits`](https://github.com/vdistortion/opencode-openai-limits)
by [vdistortion](https://github.com/vdistortion).

## License

[MIT](LICENSE).

## Documentation

- [OpenCode plugin guide](https://opencode.ai/docs/build/plugins)
- [Plugin configuration](https://opencode.ai/docs/plugins)
- [TUI plugin guide](https://opencode.ai/docs/build/plugins/cli)
