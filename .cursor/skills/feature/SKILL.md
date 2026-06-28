---
name: feature
description: >-
  Start implementation on a feature branch: match README roadmap items when
  relevant, follow git-branch-workflow, create feature/<slug>, and produce a
  short plan. Use when the user invokes /feature or starts new feature work.
disable-model-invocation: true
---

# Feature branch kickoff

Start **implementation** on a new topic. The **Roadmap** section in [`README.md`](../../../README.md) supplies scope when a bullet matches; branching follows [`.cursor/rules/git-branch-workflow.mdc`](../../rules/git-branch-workflow.mdc).

**Not for:** filing GitHub issues (`/issue`) or releases (`/do-release`).

## When to run

User invokes **`/feature`** with a rough topic (title, slug fragment, or keywords), e.g. `/feature pricing tables` or `/feature customer portal`.

## Hard stops

| Check | Action if fail |
| --- | --- |
| **Already shipped** | Behavior is live and only changelog/README matter → **stop**; suggest updating [`CHANGELOG.md`](../../../CHANGELOG.md) under `## [Unreleased]`. |
| **Issue-only request** | User wants to file or pick a GitHub issue, not branch → **stop**; use `/issue`. |
| **No topic** | Empty message after `/feature` → ask once for a **short feature name** (3–8 words). |
| **Checkout blocked** | Uncommitted conflicts prevent `git checkout -b` → **stop**; report status; do not force. |
| **Protected branch commit** | User asked to implement on `main`/`master` without override → prefer branching from `develop`; do not commit feature work on `main`/`master`. |

## Phase 1 — Parse topic and match roadmap

1. Extract the **topic hint** from the user message (text after `/feature`, or the whole message if they did not use the slash form).
2. Read the **Roadmap** bullets under [`README.md`](../../../README.md) (`### Roadmap`):
   - Support for Pricing tables
   - Better support to measure analytics
   - Dedicated Settings page
   - Testimonials (from the API)
3. **Match** (best first):
   - Keyword overlap with a roadmap bullet (e.g. `pricing` → pricing tables)
   - Intent overlap with README feature descriptions or open GitHub issues when relevant
4. **Outcomes:**
   - **One clear match** → treat that roadmap bullet as scope context for the plan. Tell the user which item you matched.
   - **Several plausible matches** → list up to 3 with one-line labels; ask **once** which to follow (or confirm “none — greenfield”).
   - **No match** → proceed from the user hint only.

5. Skim related code (`includes/`, `src/`, blocks) for existing work on the topic (e.g. partial settings UI, pricing table code).

## Phase 2 — Propose branch name

Derive **`feature/<short-slug>`** (kebab-case, ~2–5 words):

- Prefer a slug from the matched roadmap topic (e.g. pricing tables → `feature/pricing-tables`).
- Otherwise slugify the user’s topic hint.

If the user passed an explicit branch or slug (e.g. `feature/customer-portal`), use it.

**Confirm once** only when the slug is ambiguous and the user did not name one. Otherwise state the proposed branch and continue.

### Branch rules ([`git-branch-workflow.mdc`](../../rules/git-branch-workflow.mdc))

| Current branch | Action |
| --- | --- |
| `develop`, `main`, `master` | Create `feature/<slug>` from current HEAD (if on `main`/`master`, prefer checking out `develop` first when it exists and is the team default). |
| `feature/*`, `fix/*`, … **same topic** | **Stay** on the branch; do not nest another feature branch. |
| `feature/*`, … **new unrelated topic** | Create a **new** `feature/<slug>` from current HEAD (warn if dirty tree might mix topics). |
| User: **no branch**, **skip branch**, **stay on develop**, **commit on this branch** | Skip `git checkout -b`; note the exception in the summary. |

Run before branching (plugin root):

```bash
git status -sb
git branch --show-current
```

Then, unless skipped:

```bash
git checkout -b feature/<slug>
```

Uncommitted changes carry onto the new branch — **do not stash** unless checkout fails.

## Phase 3 — Plan (no implementation yet)

Produce a **short numbered plan** (5–10 bullets max) unless the user asked to implement immediately in the same message:

1. **First item (always):** Confirm feature branch `feature/<slug>` — mark done only after checkout succeeds or stay decision is recorded.
2. Scope bullets from the matched roadmap item or user hint (requirements, open questions, out-of-scope).
3. Likely touch areas in the repo (`includes/`, `src/`, blocks, REST, admin) — hypotheses only until code is read.
4. Verification step (lint, build, manual check in block editor) when obvious from the topic.

**Do not** edit product code in this command’s first response unless the user explicitly said to start implementing in the same message. Reading files for matching and planning is allowed.

## Phase 4 — Report

Summarize for the user:

- **Topic** and **branch** (created, stayed, or skipped per override)
- **Roadmap:** matched README bullet, or “no roadmap match”
- **Plan** (numbered)
- **Open questions** from your code skim or ambiguous scope

Commit only when the user asks.

## Examples

**Matched roadmap**

User: `/feature pricing tables`

Agent matches README “Support for Pricing tables”, proposes `feature/pricing-tables`, runs `git checkout -b feature/pricing-tables`, outputs plan with branch step first.

**Ambiguous**

User: `/feature settings`

Agent lists “Dedicated Settings page” vs existing settings code in `includes/class-freemius-settings.php`, asks once, then branches and plans from the chosen direction.

**Greenfield**

User: `/feature customer portal`

No roadmap match; proposes `feature/customer-portal`, branches, plan from user hint only.

**Continue existing branch**

User: `/feature customer portal` while already on `feature/customer-portal`

Agent reports staying on `feature/customer-portal`, refreshes plan, does not create a nested branch.

## Related commands

- **`/issue`** — file or pick GitHub issues, then plan implementation
- **`/do-release`** — versioned release when work is ready to ship
