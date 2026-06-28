---
name: issue
description: >-
  GitHub issues via gh CLI: verify auth first, then either create a new issue
  (discover related code, ask probing questions, draft with
  Considerations, set issue type Bug/Feature/Task and labels) or pick an open issue (/issue or /issue 123), read body and
  comments, and plan implementation. Never use prefilled shareable new-issue
  URLs. Use when the user invokes /issue.
disable-model-invocation: true
---

# GitHub issue (gh CLI)

Default repo: **`Freemius/freemius-wp-plugin`**.

**Not for:** changelog-only commits.

Two modes — pick **one** after Phase 0:

| Mode | When |
| --- | --- |
| **Work** | `/issue` with no args and thin session; or `/issue <number>` / `/issue #<number>` |
| **Create** | `/issue <title hint>` (non-numeric text); or session already has a clear bug/feature to **file** |

When in doubt: numeric-only arg → **Work**; descriptive text after `/issue` → **Create**; bare `/issue` with no filing intent in the chat → **Work**.

## Phase 0 — Auth (first, always)

Run **before** mode selection, git context, listing, or questions:

```bash
gh auth status
```

| Result | Action |
| --- | --- |
| **Not logged in** | Stop. Tell the user to run `gh auth login`, then retry `/issue`. |
| **Logged in but missing repo access** | Stop. Explain which account is active; suggest `gh auth refresh` or the correct org login. |
| **OK** | Continue. |

Never fall back to prefilled or shareable “new issue” URLs.

Resolve repo early (both modes):

```bash
gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null
```

Default `Freemius/freemius-wp-plugin` when cwd is the plugin and remote matches.

## Branch relevance (both modes)

The **current branch may be unrelated** to the issue (leftover WIP, different topic). Do not blindly attach branch/PR to Context or plans.

```bash
git branch --show-current
gh pr view --json number,url,title,body,closingIssuesReferences 2>/dev/null
git log -5 --oneline
```

| Current branch | Action |
| --- | --- |
| **`develop`**, **`main`**, **`master`** | Neutral base — omit branch from issue **Context** unless a **related** open PR exists. |
| **`feature/*`**, **`fix/*`**, other topic branch | **Check relevance** before citing branch or suggesting “stay on current branch”. |

**Treat branch/PR as related** only when at least one signal matches:

- Issue number in PR body/title, `closingIssuesReferences`, or `fixes #n` / `#n` links
- Issue number or clear topic keywords in **branch name** or recent **commit messages**
- Issue body/comments already reference this branch or PR
- **Session** explicitly ties the issue to current branch work

**If not related:** do not put branch/PR in the issue **Context**; in Work mode, propose a **fresh** `feature/<slug>` or `fix/<slug>` from `develop` (per git-branch-workflow) instead of continuing on the unrelated branch. Optionally note in chat: “Current branch `feature/other` looks unrelated — plan assumes branching from `develop`.”

**If unsure:** ask once whether current WIP should be linked or ignored.

---

# Mode A — Work on an existing issue

Pick up an open issue, understand it from body + comments, and **plan implementation**. Do not create a new issue. Do not edit product code in the first response unless the user asked to implement in the same message.

## A1 — Resolve issue number

**Quick path** — user passed a number (`/issue 123`, `/issue #123`):

```bash
gh issue view 123 --repo <owner/repo> --json number,title,body,state,labels,url
```

If **404** or not found → stop with a clear message. If **closed** → show link, note state, ask once whether to plan from it anyway.

**List path** — bare `/issue`, no numeric arg, thin session:

```bash
gh issue list --repo <owner/repo> --state open --limit 50 \
  --json number,title,labels,updatedAt,url
```

Present a **selectable list** (use **AskQuestion** when available):

- One option per issue: `#<n> — <title>` (add label names when helpful).
- Sort by **most recently updated** unless the user asked otherwise.
- If more than ~15 issues, show the 15 most recent and mention total open count.
- If **zero** open issues → stop; suggest `/issue <title hint>` to file one.

After selection (or quick path), always link the issue: `[#n — Title](url)`.

## A2 — Load discussion

Fetch comments with `gh` (read scope only — no shareable links):

```bash
gh api repos/<owner>/<repo>/issues/<n>/comments \
  --jq '.[] | {author: .user.login, created_at, body}'
```

Or:

```bash
gh issue view <n> --repo <owner/repo> --comments
```

Summarize for yourself:

- **Problem / goal** from title + body
- **Constraints or decisions** from comments (especially maintainer replies)
- **Acceptance hints** — explicit checklists, repro steps, linked PRs
- **Gaps** — anything still unclear (one focused question max)

## A3 — Repo context

From the plugin repo root:

```bash
git branch --show-current
git status -sb
```

Apply **Branch relevance** (above). If the current topic branch is **not** related to this issue, do not fold its WIP into the plan — suggest a new branch from `develop`.

Read files the issue points at or that likely own the behavior (`includes/`, `src/`, blocks, REST, admin).

## A4 — Implementation plan

Produce a **short numbered plan** (5–10 bullets):

1. **Suggested branch** — `feature/<slug>` or `fix/<slug>` from issue title. If current branch is **related**, you may say “stay on `feature/…`”; if **unrelated** or on `develop`/`main`/`master`, propose a **new** branch (do not checkout unless user asked).
2. **Summary** — one paragraph restating what “done” means for this issue.
3. **Approach** — concrete steps mapped to repo areas.
4. **Touch areas** — likely files/modules (hypotheses until read).
5. **Verification** — tests or manual checks when obvious from the issue.
6. **Open questions** — from comments, issue body, or code skim.

End with: clickable issue link + offer **`/feature <slug>`** to branch and start coding.

---

# Mode B — Create a new issue

File a **new** GitHub issue with **`gh issue create`**.

## Hard stops (create only)

| Check | Action |
| --- | --- |
| **Duplicate** | Open issue same intent → show clickable link; ask before creating another |

## B1 — Context (branch first)

```bash
git branch --show-current
git status -sb
git log -3 --oneline
gh pr view --json number,url,title,state 2>/dev/null
```

Collect: branch, open PR, working tree, session hint, relevant code paths.

Apply **Branch relevance** — include branch and PR in the issue **Context** section **only when related** to what is being filed. On `develop`/`main`/`master` with no related PR, omit branch lines.

**Dedupe:**

```bash
gh issue list --repo <owner/repo> --search "in:title <keywords>" --state open --limit 10
```

Also scan for **related open issues/PRs** beyond title dedupe — same subsystem, opposite intent, or a dependency:

```bash
gh issue list --repo <owner/repo> --search "<subsystem keywords>" --state open --limit 5
gh pr list --repo <owner/repo> --search "<subsystem keywords>" --state open --limit 5
```

## B2 — Discover and clarify (think wider)

**Do not rush to draft.** Even when goal and scope sound obvious from the chat, run a short **discovery pass** first, then ask **targeted questions** about anything that would change how the issue is written or implemented.

### Discovery pass (before questions or draft)

1. **Read** files the session points at — and **one level outward** (callers, hooks, stored options, REST routes, editor vs checkout vs admin).
2. **Note cross-cutting factors** that might affect the issue — record them even if you don’t ask about every one:

| Area | Ask yourself |
| --- | --- |
| **Architecture** | Block editor, settings, REST/API, checkout modal — which layer owns this? |
| **Stored state** | Options API product settings — backward compatible? |
| **Checkout / API** | Freemius product/plan IDs, API token handling — breaking changes? |
| **Extensibility** | Filters and hooks — breaking change for third parties? |
| **Admin vs front** | Block editor, settings screen, checkout modal — where does behavior surface? |
| **Integrations** | Block themes, page caches — assumptions to state explicitly? |
| **Related work** | Open issues/PRs on the same subsystem — sequence, duplicate, or dependency? |
| **Release impact** | User-visible changelog? Screenshots? Support burden? |

### When to ask questions

Use **AskQuestion** when available. Prefer **one focused round** (2–4 questions max) that surfaces **decisions**, not trivia.

**Always ask** when goal, type, scope, title, duplicate, or repo is unknown.

**Also ask** when discovery reveals any of these — even if the user seemed clear:

- **Multiple valid approaches** with different trade-offs (e.g. option vs meta, sync vs async, editor vs server render).
- **Scope creep risk** — fix touches block editor + settings + API; confirm what’s in v1.
- **Breaking or migration risk** — existing sites, stored product settings, API shape.
- **Product tension** — UX simplicity vs power-user knobs
- **Conflict** — open issue or in-flight PR says something different.
- **Missing “why now”** — bug without repro, feature without user story, refactor without pain.

**Question style:** concrete and decision-forcing — “Should v1 support multiple products in the button block or settings only?” not “Any preferences?”

If the user already answered in the session, **state your assumptions** in the draft instead of re-asking — but still call out discovered risks in **Considerations**.

### If user declines to answer

Proceed with best-effort draft; label unknowns under **Open questions** and **Considerations** so implementers see the gaps.

## B3 — Draft

**Title:** imperative, ~8–14 words, no trailing period.

**Body** (omit empty sections):

```markdown
## Summary

<what and why>

**Goal:** <outcome>

## Problem

<current behavior or gap>

## Proposed approach

1. ...
2. ...

## Out of scope

- ...

## Acceptance criteria

- [ ] ...
- [ ] ...

## Considerations

<non-obvious constraints, risks, migrations, cache/version bumps, extensibility, related issues/PRs — from discovery; omit if none>

## Open questions

- ...

## Context

- Branch: `<current-branch>` (only if related to this issue)
- PR: #<n> <url> (only if related)
- <session note>
```

When you asked clarifying questions, show **title + summary + type + labels + key considerations** before publishing; otherwise draft and publish, but still include **Considerations** when discovery found anything non-obvious.

### Screenshots (create mode)

When the session includes images (user paste, `<image_files>`, or paths under `~/.cursor/projects/.../assets/image-*.png`), embed them in the issue **before** `gh issue create` — or `gh issue edit` immediately after if create already ran without them.

**Never** invent `https://github.com/user-attachments/assets/...` URLs or placeholder paths. Broken image links are worse than no screenshots.

#### Upload via `gh image` (preferred)

GitHub’s REST API cannot attach binary files to issues. Use the **`gh-image`** extension, which replicates the browser upload flow and returns real `user-attachments` markdown:

```bash
# One-time setup (per machine)
gh extension install drogers0/gh-image
gh image check-token   # must succeed — needs github.com logged in via browser
```

Upload session images and capture markdown (replace alt text with descriptive labels):

```bash
gh image --repo <owner/repo> /path/to/editor.png /path/to/output.png
```

Example output (rewrite alts before embedding):

```markdown
![Block editor — button settings](https://github.com/user-attachments/assets/<uuid>)
![Checkout modal — open state](https://github.com/user-attachments/assets/<uuid>)
```

Add a `### Screenshots` subsection under **Problem** when visuals help repro.

| Result | Action |
| --- | --- |
| **`gh image check-token` fails** | Run `gh image extract-token` or log into github.com in the default browser, then retry. |
| **Upload fails** | Omit `### Screenshots` from the body. Note in the create report that images could not be uploaded and the user should drag-drop them into the issue in the browser. **Do not** use fake URLs. |
| **No session images** | Skip the section unless the user explicitly asks for a placeholder note. |

#### Fallback (no browser session)

Only when `gh image` is unavailable and commits are acceptable: push PNGs via the Contents API and reference `https://github.com/{owner}/{repo}/raw/{branch}/{path}` (works for private repos when the viewer is authenticated; does not render in email). See [GitHub awesome-copilot images reference](https://github.com/github/awesome-copilot/blob/main/skills/github-issues/references/images.md).

### Issue type (create mode)

Always set **exactly one** GitHub issue type when creating — use `--type` with the **exact** name:

| Type | When to apply |
| --- | --- |
| **Bug** | Unexpected problem or broken behavior |
| **Feature** | Request, idea, or new functionality |
| **Task** | Specific piece of work — refactor, tech debt, migration, docs, cleanup, chore |

Pick from discovery and clarifying questions. If both **Feature** and **Task** fit, prefer **Feature** when user-facing capability changes; **Task** when internal/maintenance work only.

**Typical pairings with labels** (type + label are independent — set both when applicable):

| Type | Common labels |
| --- | --- |
| **Bug** | `bug`; add `help wanted` when repro or scope is thin |
| **Feature** | `enhancement`; add `help wanted` when relevant |
| **Task** | `documentation` for docs-only; `good first issue` for small scoped work; often no primary label |

Omit `--type` only when classification is genuinely unknown after discovery — prefer asking once over guessing wrong.

### Labels (create mode)

When applicable, add **one primary type label** and optional **secondary** labels via `--label`. Confirm names exist:

```bash
gh label list --repo <owner/repo> --limit 20
```

**`Freemius/freemius-wp-plugin` labels** (use exact names):

| Label | When to apply |
| --- | --- |
| **bug** | Broken behavior, regression, incorrect output |
| **enhancement** | New feature or improvement to existing behavior |
| **documentation** | Docs-only change (user guide, dev docs, README) |
| **question** | Filing to track an open question — scope still unclear after discovery |
| **help wanted** | Needs extra input (design, product call, external blocker) |
| **good first issue** | Small, well-scoped, low-risk; clear steps for a newcomer |

**Do not apply** on create unless the user explicitly asks: `duplicate`, `invalid`, `wontfix`.

Pick from discovery and clarifying questions — e.g. bug + `help wanted` when repro is thin. Omit labels when none fit confidently (type unknown).

### Assignee (create mode)

Omit `--assignee` unless the user asks for a specific person.

## B4 — Publish

**Screenshots first** (when the session has images): run `gh image --repo <owner/repo> …`, rewrite alts, embed the returned markdown in the draft body, then create or edit the issue. Never publish placeholder `user-attachments` URLs.

```bash
gh issue create --repo <owner/repo> \
  --title "<title>" \
  --type "<Bug|Feature|Task>" \
  --label "<primary>" \
  --label "<optional-secondary>" \
  --body "$(cat <<'EOF'
<body>
EOF
)"
```

Omit `--type` only when classification is unknown. Omit `--label` flags when no label applies. Add `--assignee` only when the user requests it.

Use **`required_permissions: ["all"]`** for `gh` commands.

### If `gh issue create` fails

Stop and explain (403 → Issues read/write on PAT + `gh auth refresh`; 404 → repo; network → retry later). Provide drafted title/body as copy-paste text only. **Do not** generate a shareable “new issue” URL.

## B5 — Report (create)

- **Clickable link:** `[#n — Title](url)` for the new issue
- Title + one-line summary
- **Type** (`Bug` / `Feature` / `Task`) and **labels** applied (or note what was omitted)
- **Assignee:** only when user requested one
- **Screenshots:** confirm embedded via `gh image`, or note if upload failed and manual paste is needed
- Branch / PR in Context **only if related** (say so in chat if omitted)
- Duplicate noted if skipped

Do not commit unless the user asks.

---

## Examples

**Work — pick from backlog**

`/issue` with no session → auth → list open issues → user picks #87 → read body + comments → plan → link + suggest `/feature`.

**Work — quick ID**

`/issue 42` → auth → `gh issue view 42` + comments → plan → `[#42 — …](url)`.

**Work — unrelated branch**

`/issue 42` while on `feature/customer-portal` (issue is about checkout button) → relevance check fails → plan proposes `fix/checkout-button-…` from `develop`, does not assume customer-portal WIP applies.

**Create — clear session**

On **related** `feature/pricing-tables` with open PR after design thread → `/issue` with filing intent → branch + PR in Context → `gh issue create`.

**Create — title hint**

`/issue add pricing table block` → read blocks + API code → ask about editor-only vs settings persistence if unclear → **Considerations** notes block API → `gh issue create`.

**Create — discovery surfaces migration**

Session proposes new option shape → discovery finds existing sites store product IDs in options → ask scope + record **Considerations** / migration note → type **Feature**, label `enhancement` → publish.

**Create — small docs fix**

`/issue update README installation steps` → type **Task**, label `documentation` → `gh issue create`.

**Create — with session screenshots**

Session includes editor vs checkout PNGs → `gh image --repo Freemius/freemius-wp-plugin editor.png checkout.png` → embed returned markdown in `### Screenshots` → `gh issue create`. If create already ran with broken placeholders, `gh issue edit <n> --body` with real URLs.

## Related commands

- **`/feature`** — branch + implement (natural follow-up after Work mode plan)
