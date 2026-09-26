# Contributing

Thanks for helping out. This document describes how changes get from a branch into a release.

## Setup

Follow the [Development](README.md#development) section in the README to install dependencies and run the app.

## Workflow

1. Create a branch from `main`. Use a short prefix that matches the change type, for example `feat/roadmap-inline-items` or `fix/attachment-preview`.
2. Make your changes.
3. Run the checks locally (see [Checks](#checks)).
4. Commit your changes and push the branch. Commits on your branch are squashed on merge, so their messages are free-form. Only the PR title has to follow the [convention](#pull-request-titles).
5. Open a pull request against `main`.
6. Get one approving review and resolve every review thread.
7. The PR is squash-merged and the branch is deleted automatically.

`main` is protected: you cannot push to it directly, force-push to it or delete it. Squash merge is the only merge method.

### Reviews

- One approval is required.
- The approval must come after the most recent push. Pushing new commits dismisses earlier approvals, so ask for a re-review after addressing feedback.
- All review conversations must be resolved before merging.
- The branch must be up to date with `main` before merging.

## Pull request titles

The PR title becomes the commit message on `main` when it is squash-merged. That commit decides the next version number and the changelog entry, so titles must follow [Conventional Commits](https://www.conventionalcommits.org). A check on every PR enforces this and leaves a comment when the title is wrong.

```
feat(editor): add label autocomplete
^    ^        ^
|    |        |__ subject (lowercase start)
|    |___________ scope (optional)
|________________ type
```

Allowed types:

| Type       | Use for                                   | Version bump (before 1.0) |
| ---------- | ----------------------------------------- | ------------------------- |
| `feat`     | New user-facing functionality             | minor                     |
| `fix`      | Bug fixes                                 | patch                     |
| `perf`     | Performance improvements                  | patch                     |
| `refactor` | Code changes that don't alter behaviour   | none                      |
| `docs`     | Documentation only                        | none                      |
| `test`     | Adding or changing tests                  | none                      |
| `build`    | Build system or dependencies              | none                      |
| `ci`       | GitHub Actions and other CI configuration | none                      |
| `style`    | Formatting, whitespace                    | none                      |
| `chore`    | Anything else that doesn't touch the app  | none                      |
| `revert`   | Reverting an earlier change               | none                      |

A breaking change is marked with `!` after the type (`feat!: …`) or a `BREAKING CHANGE:` footer in the PR description. Before 1.0 this bumps the minor version.

The scope is optional. When you use one, name the part of the repo you touched, such as `editor`, `vault`, `core`, `desktop` or `tauri`.

The subject must not start with an uppercase letter.

The PR description becomes the body of the squashed commit, so write it for someone reading `git log` later.

## Checks

CI runs on every pull request and on every push to `main`.

| Job       | Command                      |
| --------- | ---------------------------- |
| Lint      | `pnpm turbo run lint`        |
| Typecheck | `pnpm turbo run check-types` |
| Test      | `pnpm turbo run test`        |
| Build     | `pnpm turbo run build`       |

On pull requests these run with `--affected`, so only packages changed since the base branch, and the packages that depend on them, are checked.

When a PR touches `apps/desktop/src-tauri/`, an extra job runs on macOS:

```sh
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

Clippy warnings fail the build. Run these from `apps/desktop/src-tauri` before pushing Rust changes.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). You don't bump versions or edit `CHANGELOG.md` by hand.

1. Every push to `main` updates an open release PR titled `chore: release x.y.z`. It collects the changelog from the merged PR titles and bumps the version in `package.json`, `apps/desktop/package.json`, `tauri.conf.json`, `Cargo.toml` and `Cargo.lock`.
2. Merging that release PR creates a git tag and a GitHub release.
3. The release then builds installers for macOS (universal), Linux and Windows and attaches them to the release.
