# Contributing

## Run tests

Use Node.js **24 or newer**:

```sh
npm ci --ignore-scripts
npm test
```

The formatting tests use Node's built-in test runner and TypeScript stripping.
They can also run without installed dependencies, credentials or network access.
Coverage includes all 441 primary/weekly combinations in 5% steps, missing
windows, clamping, remaining-percentage conversion and reset formatting.

These tests do not replace server integration, installed-package, actual TUI
rendering or security tests.

## Continuous integration

The GitHub Actions workflow runs on pushes to `main`, pull requests and manual
dispatches. It tests Node.js **24 and 26**, installs dependencies from the committed
`package-lock.json`, runs the tests, checks package contents and verifies that
dependency files were not modified. It also runs `npm audit`, failing on high or
critical production-dependency advisories; moderate advisories are reported but
do not fail the job.

Action references are pinned to commit hashes. Dependency lifecycle scripts are
disabled during CI installation because these checks do not require them.
The workflow starts running after it is pushed to GitHub; adding it locally does
not execute a hosted CI run.

## Project structure

| File | Role |
| --- | --- |
| `index.ts` | Server-side OAuth resolution, usage request and one-minute cache |
| `rpc.ts` | Shared, validated usage-window RPC contract |
| `tui.tsx` | Footer/sidebar slots, polling and lifecycle cleanup |
| `format.ts` | Pure percentage, block-bar and countdown formatting |
| `tests/format.test.ts` | Credential-free formatting tests |

The server plugin, TUI plugin and RPC ID are all `opencode-openai-usage`.
Both server and TUI import the shared contract from `rpc.ts`.

## Dependencies

The package accepts compatible OpenCode SDK updates with **`^2.3.0`**, while the
committed lockfile records the exact versions used for development and CI.
OpenTUI peer minimums follow that SDK's published metadata. Validate SDK and UI
updates against real supported hosts; a newer dependency version alone is not
evidence of compatibility.

Commit `package-lock.json` alongside dependency changes. Use `npm ci` for clean,
reproducible installs rather than regenerating the lockfile in CI. Update the
manifest and lockfile together when changing a dependency.

`renovate.json` provides a recommended starting configuration with automatic
merging disabled. It does not activate a bot on its own: enable Renovate on the
chosen Git host or configure a self-hosted runner. Renovate can update both npm
dependencies and the pinned GitHub Actions.

## Inspect package contents

```sh
npm run pack:check
```

The package allowlist includes only the runtime source files; npm also includes
the package manifest, README and license. Never include authentication files, private
OpenCode configuration or environment secrets.

## Before a public release

1. Verify that the MIT license and copyright notices are included.
2. Configure the repository remote on the chosen Git host.
3. Verify that GitHub Actions passes and dependency-update automation is enabled.
4. Review dependency advisories and validate the package/build strategy.
5. Validate an installed package and the actual TUI on supported OpenCode
   versions, including remote/headless OAuth.
6. Confirm package-name availability if publishing to npm.
7. Update installation instructions for the actual distribution method.
8. Remove `private: true` only when npm publishing is intentional.
