# Logboeker

A desktop app for keeping a study logbook as plain Markdown files. You point it at a folder (a _vault_) and it gives you a calendar of daily entries, a live-preview editor, skills labelling, references, attachments, search and a semester roadmap. Everything stays on disk as ordinary Markdown with frontmatter, so the vault stays readable without the app.

Built with [Tauri](https://tauri.app), React and TypeScript in a [Turborepo](https://turborepo.dev) monorepo.

## Download

Installers for macOS (universal), Windows and Linux are attached to each [GitHub release](https://github.com/gijsbartman/logboeker/releases).

## Vault layout

```
my-vault/
├── data/
│   ├── config.md            # student name, semester start, sprint length
│   └── json/
│       └── vaardigheden.json
└── logboek/
    ├── daily/               # one entry per day, e.g. 2026-09-08.md
    ├── evidence/            # standalone pieces of evidence
    ├── files/               # attachments
    └── roadmap.md           # semester planning
```

A complete example lives in [fixtures/vault](fixtures/vault).

## Repository

| Path                         | What it is                                                            |
| ---------------------------- | --------------------------------------------------------------------- |
| `apps/desktop`               | The Tauri app: React frontend in `src/`, Rust backend in `src-tauri/` |
| `packages/core`              | Domain model: entries, frontmatter, config, criteria, roadmap, search |
| `packages/vault`             | Loads and writes a vault on top of `core`                             |
| `packages/editor`            | CodeMirror extensions: live preview, commands and mentions            |
| `packages/eslint-config`     | Shared ESLint config                                                  |
| `packages/typescript-config` | Shared `tsconfig` bases                                               |
| `packages/vitest-config`     | Shared Vitest config and coverage report merging                      |
| `fixtures/vault`             | Sample vault used in tests and development                            |

## Development

Requirements:

- Node.js 24.20 or newer
- pnpm 11 (`corepack enable` picks up the version from `package.json`)
- Rust stable and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your platform

```sh
pnpm install
pnpm --filter desktop tauri dev   # run the desktop app
```

Common tasks from the repository root:

```sh
pnpm build          # build all packages and the app frontend
pnpm test           # run all tests
pnpm lint           # lint all packages
pnpm check-types    # typecheck all packages
pnpm format         # format with Prettier
```

Rust checks, run from `apps/desktop/src-tauri`:

```sh
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch, pull request and release workflow.
