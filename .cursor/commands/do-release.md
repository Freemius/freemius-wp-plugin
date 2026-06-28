---
description: Prepare and cut a plugin release — README sync, tests, release branch and tag, then post-release version bump on develop
---

# Prepare and cut a Freemius release

Run a **three-phase** release workflow. **Stop on any failure** — do not commit, tag, or push through red tests or unresolved CHANGELOG/README drift without calling it out and getting explicit user direction.

**Changelog-first:** Day-to-day work updates [`CHANGELOG.md`](CHANGELOG.md) under `## [Unreleased]`. This command renames that section to the release version, syncs the WordPress.org-style changelog in [`README.md`](README.md), and tags the version already on `develop`. **Phase 3** bumps `develop` to the next version for ongoing feature work (`@since` alignment).

## Overview

```text
develop (version = release, ## [Unreleased] has bullets)
  → pre-flight: release = package.json version (no patch bump)
  → release/<version> — CHANGELOG/README/dates/tests only (no version bump)
  → checkpoint → commit + tag
  → checkpoint → optional push
  → merge release/<version> → develop (user confirms)
  → Phase 3: bump to next version + fresh ## [Unreleased] on develop
```

Pushing the tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml) (build, zip, Freemius pending release, GitHub release). Tag format: **`<version>`** with **no** `v` prefix (matches existing tag `0.1.0`).

---

## Phase 1 — Pre-flight on `develop` (hard stops)

Run **before** creating the release branch. Do **not** auto-merge feature branches into `develop`.

| Check | Action if fail |
| --- | --- |
| **Current branch** | Must be **`develop`**. If on `feature/*`, `release/*`, or anything else → **stop**. Instruct: merge/rebase into `develop` first; do not auto-merge. |
| **Sync `develop`** | `git fetch origin`. Compare `develop` to `origin/develop`; `git pull origin develop` if behind (warn if offline / fetch fails). |
| **Working tree** | Prefer a **clean** tree on `develop`. If uncommitted changes exist → **stop** and show `git status -sb`. Continue only if the user **explicitly** accepts releasing with those changes. |

Then **resolve release version** (next section). After resolution:

| Check | Action if fail |
| --- | --- |
| **Duplicate branch/tag** | After fetch: `release/<version>` must not exist locally or on `origin`. `git tag -l '<version>'` and `git tag -l 'v<version>'` must be empty locally; check remote tags after fetch. → **stop** (do not delete or reset branches/tags without user instruction). |
| **Version file drift** | `package.json`, [`freemius.php`](freemius.php) `Version:`, and README `Stable tag:` must all equal `<release>`. → **stop** and list mismatches. |
| **CHANGELOG ready** | `## [Unreleased]` must exist with **at least one** bullet (`- ` lines). Empty section → **stop** before branching. |

---

## Resolve release version

1. Read `release` from [`package.json`](package.json): `jq -r '.version'`.
2. Verify it matches [`freemius.php`](freemius.php) `* Version:` and [`README.md`](README.md) `Stable tag:` — **stop** on drift.
3. Echo: `Releasing <release> (version already on develop).`
4. **Do not** patch-bump, minor-bump, or catch up from CHANGELOG headings. The version on `develop` **is** the release.

Optional `patch` / `minor` / `major` from the user applies only in [Phase 3](#phase-3--post-release-bump-on-develop) when bumping to the **next** development version — not when resolving `release`.

---

## Phase 2 — Create `release/<version>` branch (first git step after pre-flight)

Still on **`develop`**, after pre-flight and version resolution succeed:

```bash
git checkout develop
git pull origin develop   # if network OK; else warn and continue with local develop
git checkout -b release/<version>
```

- All release edits, tests, commits, and tags happen **on this branch**, not on `develop`.
- **Do not** bump version files on the release branch — they already match `<release>`.

---

## Verify versioned files (no bump)

Confirm these already equal `<release>` (no edits unless drift was missed in pre-flight):

| File | Field |
| --- | --- |
| [`package.json`](package.json) | `"version"` |
| [`package-lock.json`](package-lock.json) | Root and `"packages"."".version"` |
| [`freemius.php`](freemius.php) | `* Version: x.y.z` in plugin header |
| [`README.md`](README.md) | `Stable tag: x.y.z` |

---

## WordPress “Tested up to”

1. Fetch latest **stable** WordPress: `https://api.wordpress.org/core/version-check/1.7/?version=0` → use `offers[0].version` (not RC).
2. Update [`README.md`](README.md) line `Tested up to: <version>`.
3. In the checkpoint summary, if `Requires at least:` is still below tested-up-to, **mention** whether to raise the minimum — do **not** change `Requires at least` without user OK.

---

## CHANGELOG (release branch)

Use **today’s date** in local timezone (`YYYY-MM-DD`).

1. Rename `## [Unreleased]` → `## [<release>] - YYYY-MM-DD` (keep bullets).
2. **Do not** insert a fresh `## [Unreleased]` here — Phase 3 creates it on `develop` after merge.

---

## README changelog sync (guard before copy)

**Goal:** README release notes must not ship bullets that only exist under `### Unreleased` and are missing from CHANGELOG `## [Unreleased]`.

### Step A — Detect drift (stop unless user resolves)

1. If [`README.md`](README.md) has a `### Unreleased` section under `## Changelog`, collect every bullet line (`- ` …) until the next `###` or non-bullet block.
2. Collect bullets from `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md) (until the next `##`).
3. For each README unreleased bullet, check it appears in the CHANGELOG unreleased set (compare normalized text: trim, collapse whitespace; exact match after normalization is enough).
4. If **any** README unreleased bullet is **not** in CHANGELOG `## [Unreleased]` → **stop** before replacing `### Unreleased`. Report:

   - List bullets **only in README** (missing from CHANGELOG).
   - List bullets **only in CHANGELOG** if helpful for context.
   - Explain: routine dev should add user-facing notes to CHANGELOG; README `### Unreleased` is optional staging and must be a **subset** of CHANGELOG for this release.

5. **User must choose** before continuing (do not auto-merge silently):
   - **Merge into CHANGELOG** — add missing bullets under `## [Unreleased]` in CHANGELOG, then re-run the guard; or
   - **Drop from README** — remove orphan unreleased bullets if they should not ship; or
   - **Explicit override** — user says to release anyway and accept README losing those lines (document in summary).

### Step B — Copy after guard passes

1. Run [CHANGELOG (release branch)](#changelog-release-branch) first so `## [<release>]` exists with bullets.
2. Extract bullets from `## [<release>]` in CHANGELOG.
3. Under `## Changelog` in README:
   - Replace `### Unreleased` (and its bullets) with `### <release>` and the **CHANGELOG** bullets (WordPress.org-style `###`, not `## [x.y.z]`).
   - If there was no `### Unreleased`, insert `### <release>` at the top of the changelog section with copied bullets.
4. Update footer: `Version **<release>** — see CHANGELOG.md`.
5. Set README changelog date: `### <release> — YYYY-MM-DD` under `## Changelog`.

---

## Verification (stop on failure)

Run from plugin root in order:

| Step | Command |
| --- | --- |
| JS deps (if needed) | `npm ci` |
| Lint (recommended) | `npm run lint:js` and `npm run lint:css` |
| Production build | `npm run build` |

Capture stdout/stderr. On failure → **stop** (release branch may have uncommitted edits; do not commit or tag).

**Scope warning:** Before commit, run `git status`. If files outside README/CHANGELOG changed, **warn** and only stage intended release files unless the user says otherwise.

---

## Checkpoint 1 — summary (required before commit/tag)

Present a compact summary:

- Branch: `release/<version>` (already created)
- Release version (already on `develop` — no version file bumps on this branch)
- CHANGELOG: `## [Unreleased]` renamed to `## [<release>] - YYYY-MM-DD`
- Release date in CHANGELOG and README (`YYYY-MM-DD`)
- CHANGELOG ↔ README sync status (including any unreleased mismatch resolved)
- New `Tested up to` value
- Test / lint / build results (pass/fail)
- Files to be committed (list paths)
- Planned tag: `<version>` (no `v` prefix)
- Reminder: pushing the tag triggers release workflow (Freemius pending + GitHub release)

**Ask explicitly:** “Proceed with commit and tag on `release/<version>`?”

If **no** → **stop**. Leave the release branch and local changes for the user to finish manually.

---

## Commit and tag (only after “yes”)

On **`release/<version>`**, stage release-intended files:

```bash
git add README.md CHANGELOG.md
git commit -m "release: <version>"
git tag <version>
```

- **Stop** if a commit hook fails; do not amend unless hook auto-fixed files and project amend rules allow.
- Do **not** push unless the user confirms in Checkpoint 2.

---

## Checkpoint 2 — push (optional)

Ask: “Push `release/<version>` and tag `<version>` to origin?”

If **yes**:

```bash
git push -u origin release/<version>
git push origin <version>
```

---

## Phase 3 — post-release bump on `develop`

Run only after:

1. User confirmed push in Checkpoint 2 (or tag exists locally and user skipped push intentionally), **and**
2. `release/<version>` is merged into `develop` (merge now if user confirms; otherwise **stop** until user confirms the PR is merged).

```bash
git checkout develop
git pull origin develop
# merge release/<version> if not already merged (user confirms):
# git merge release/<version>
```

Determine **next** version bump type:

- Default: **patch** (`npm version patch --no-git-tag-version`)
- User said `minor` or `major` in the original `/do-release` invocation → use that for Phase 3 only

```bash
NEXT=$(npm version patch --no-git-tag-version | tr -d v)   # or minor / major
```

| File | What to update |
| --- | --- |
| [`package.json`](package.json) + [`package-lock.json`](package-lock.json) | via `npm version` |
| [`freemius.php`](freemius.php) | `* Version: $NEXT` |
| [`README.md`](README.md) | `Stable tag: $NEXT` |
| [`CHANGELOG.md`](CHANGELOG.md) | Insert empty `## [Unreleased]` at the top |

```bash
git add package.json package-lock.json freemius.php README.md CHANGELOG.md
git commit -m "chore: bump to $NEXT for next development cycle"
```

- **Do not** tag `$NEXT`.
- **Checkpoint 3:** summary of bumped files + ask before push to `origin develop`.

If **yes**:

```bash
git push origin develop
```

---

## Post-release checklist (human)

Tell the user to verify after Phase 3:

- [ ] Tag push triggered **Create Release**
- [ ] GitHub release + Freemius pending release completed
- [ ] `release/<version>` merged into `develop`
- [ ] Phase 3 bump landed on `develop` (`$NEXT` + fresh `## [Unreleased]`) so the next feature branch sees the correct version for `@since`
- [ ] Optional local smoke test: `npm run plugin-zip`

**Out of scope:** Freemius secrets, WP.org `readme.txt` generation (CI uses root `README.md` + md2wp).

---

## Example invocation

User: **`/do-release`**

Agent: pre-flight on `develop` → `release = package.json` → `release/<version>` → CHANGELOG/README/dates (no version bump) → verify → summary → user “proceed” → commit + tag → optional push → merge → Phase 3 bump to next patch on `develop`.

User: **`/do-release minor`** — Phase 3 uses a **minor** bump for the next development version (not for resolving `release`).
