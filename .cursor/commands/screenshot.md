---
description: Manage tracked screenshots via image-manifest.json — paste, URL capture, or Playwright runs
---

# Screenshot workflow

[`screenshots/image-manifest.json`](../../screenshots/image-manifest.json) is the **single source of truth** for every tracked image.

**Manifest-first (required):** Before saving any PNG under `screenshots/{id}/`, copying into `docs/**/assets/`, or updating markdown image refs, **register or update** the matching entry in `image-manifest.json`. Bulk doc refresh: [`/update-screenshots`](update-screenshots.md) (`npm run update-screenshots`). Raw captures live under `screenshots/{id}/` (gitignored except the manifest). The Playwright MCP server in [`.cursor/mcp.json`](../mcp.json) handles one-off captures (`--ignore-https-errors` for `dev.local`).

## Prerequisites

- Playwright MCP enabled in Cursor, or project Playwright via `npx playwright install chromium`.
- Local site at `https://dev.local` with auto-login (no credentials in this workflow).

## Fixture

- Editor: `https://dev.local/wp-admin/post.php?post=428&action=edit` (`SCREENSHOT_FIXTURE_POST_ID`)
- Playground: `https://dev.local/playground/` (`SCREENSHOT_PLAYGROUND_URL`)

See [`screenshots/fixture-post-428.md`](../../screenshots/fixture-post-428.md).

## Manifest and `use` types

| Field | Purpose |
| ----- | ------- |
| `id` | Kebab-case; directory `screenshots/{id}/` |
| `title`, `description` | Human context and caption text |
| `use` | `docs` or `review` |
| `match` | Optional keyword hints for paste matching |
| `capture` | Playwright: `url`, `viewports`, optional `selector`, `padding` |
| `embed` | `use: docs` — `from`, `doc`, `path`, `alt`, `status` |

**`use: docs`** — Copy `embed.from` → `embed.path`, set `embed.status` to `captured`. Do **not** add workflow text to `docs/` markdown (images only).

**`use: review`** — QA only; `npm run update-screenshots -- {id}` writes `screenshots/{id}/source.png`.

Doc bulk regen uses **desktop** viewport only (1280×800).

## Input modes

### 1. Pasted image(s)

1. Infer manifest entry from `title`, `description`, `match`, `embed.alt`.
2. Confirm with the user.
3. Save as `screenshots/{id}/source.png`.
4. For `docs`: confirm alt text, copy to `embed.path`, ensure `![alt](…)` already exists in docs markdown, set `embed.status` to `captured`.
5. Rewrite manifest using [Determinism rules](#determinism-rules).

### 2. URL passed

Example: `/screenshot https://dev.local/wp-admin/post.php?post=428&action=edit`

1. Derive kebab-case `id` from URL or use existing manifest entry.
2. Capture viewports from manifest (default desktop).
3. Save under `screenshots/{id}/`.
4. Summarize visual issues; do not commit unless asked.

### 3. No input — manifest-driven capture

Run all manifest entries with `capture` blocks; embed docs entries when `embed.from` exists.

## Output paths

- Source: `screenshots/{id}/source.png`
- Committed: `docs/assets/{id}.png` (via `embed.path`)
- `screenshots/**` is gitignored except manifest, README, schema, fixture doc

## Alt text

`embed.alt` must match the `![alt](…)` line already in `docs/`. Propose alt text and **ask the user to confirm** before first embed. Bulk `update-screenshots` does not edit docs markdown.

## Determinism rules

- JSON: tab indent, trailing newline
- Top-level keys: `version`, `viewports`, `images`
- Per-entry keys: `id`, `title`, `description`, `use`, `match`, `capture`, `embed`
- Sort `images` by `id` ascending
- Viewport key order: `mobile`, `tablet`, `desktop`, `wide`

## Registering a new entry

1. Unique kebab-case `id`.
2. Set `use`, `title`, `description`, optional `match`.
3. For `docs`: `embed` with `status: placeholder` until captured.
4. For Playwright: `capture.url` (use `FIXTURE_POST_ID` token in URL), `capture.viewports`, optional `selector`.
5. Add `![alt](assets/….png)` (or `../assets/….png` under `docs/scopes/`) to the target docs page (user-facing prose only). Run `npm run sync:screenshot-captions` to strip any accidental caption lines.

Execute the full workflow for the detected input mode unless the user narrowed scope.
