---
name: update-screenshots
description: >-
  Regenerate all documentation screenshots from screenshots/image-manifest.json
  using npm run update-screenshots (Playwright). Use when the user invokes
  /update-screenshots or asks to bulk-refresh doc screenshots.
disable-model-invocation: true
---

# Update documentation screenshots

Bulk-regenerate committed doc PNGs from [`screenshots/image-manifest.json`](../../../screenshots/image-manifest.json). One-off captures: [`/screenshot`](../../commands/screenshot.md).

## When to run

User invokes **`/update-screenshots`** or asks to refresh all doc screenshots.

## Hard stops

| Check | Action if fail |
| --- | --- |
| **Playwright missing** | Run `npx playwright install chromium` from plugin root |
| **Local site down** | `https://dev.local` must be running with auto-login |
| **Fixture post missing** | Post **428** must exist — see [`screenshots/fixture-post-428.md`](../../../screenshots/fixture-post-428.md) |
| **Orphan doc image** | Register in manifest first; do not capture orphan images |

## Manifest-first rule

Every `docs/assets/*.png` and `![…](…)` in docs markdown must have a matching manifest entry.

## Workflow

1. Confirm `dev.local` is running; verify fixture post **428**.
2. From plugin root:

   ```bash
   npm run update-screenshots
   npm run update-screenshots -- button-overview
   npm run update-screenshots -- --force button-overview
   ```

3. On failure, fix manifest or [`scripts/update-doc-screenshots.mjs`](../../../scripts/update-doc-screenshots.mjs).
4. Show `git diff` for manifest and `docs/assets/*.png` only (`docs/` markdown should not change on capture).
5. Do not re-prompt for alt text on bulk refresh.
6. Do not commit unless the user asks.

## Script behavior

[`scripts/update-doc-screenshots.mjs`](../../../scripts/update-doc-screenshots.mjs):

- Processes `use: docs` entries with `capture`; desktop viewport; `ignoreHTTPSErrors: true`.
- `CAPTURE_WAIT_MS` default 5000; fixture post `428` via `FIXTURE_POST_ID` in capture URLs.
- Writes `embed.from` → copies to `embed.path` → verifies `![alt](…)` in docs markdown → `embed.status: captured`.
- Deduplicates by shared `embed.from`.
- Compares to committed baseline via `looks-same`; `--force` skips compare.
- Runs `sync:screenshots-docs` after successful updates.

## Fixture

Editor captures use post **428**; playground at `https://dev.local/playground/`.
