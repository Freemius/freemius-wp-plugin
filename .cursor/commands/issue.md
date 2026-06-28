---
description: GitHub issues — create new ones or pick an open issue and plan implementation
---

# Issue

Work with **GitHub issues** via **`gh`**. Two modes — the skill picks based on what the user passes and session context.

Follow every step in [`.cursor/skills/issue/SKILL.md`](../skills/issue/SKILL.md).

**Not for** changelog-only commits. After planning from an existing issue, continue with **`/feature <slug>`** to branch and implement.

## Modes

| Invocation | Mode |
| --- | --- |
| `/issue` — no args, thin session | **Work** — list open issues, user picks one, plan implementation |
| `/issue 123` or `/issue #123` | **Work** — fetch that issue directly, plan implementation |
| `/issue <title hint>` or rich session with something to file | **Create** — draft and `gh issue create` |

## Rules (both modes)

1. **Auth first** — run `gh auth status` before anything else. If not logged in or missing repo scope, stop immediately with a clear explanation (`gh auth login` / `gh auth refresh`).
2. **Use `gh` yourself** — fetch, list, view, and create via CLI. Never browser automation or prefilled/shareable “new issue” URLs.
3. **Fail clearly** — explain auth, permissions, network, or missing-issue errors. On create failure, give title/body as copy-paste text only (no shareable link).
4. **Clickable issue link** — always return the issue as markdown the user can open in the browser, e.g. `[#123 — Title](https://github.com/owner/repo/issues/123)`.
5. **Branch relevance** — on `develop`/`main`/`master`, branch is neutral. On a topic branch, check whether it relates to the issue (PR links, `fixes #n`, branch name, commits, session) before citing it in Context or planning; if unrelated, omit and propose branching from `develop`.

## Create mode extras

- **Screenshots** — when the session has images, upload with `gh image --repo <owner/repo> <paths>` (`gh extension install drogers0/gh-image`; needs browser GitHub session via `gh image check-token`) and embed the returned markdown in the issue body. **Never** use placeholder `user-attachments` URLs. If upload fails, omit screenshots and tell the user to paste manually.
- **Discover before you draft** — read related code even when the session feels clear; surface factors that could change the approach.
- **Ask probing questions** — don’t only fill gaps; challenge assumptions, call out trade-offs, and use AskQuestion when a decision would materially change the issue.
- **Record what you learned** — put non-obvious constraints, risks, and open decisions in the issue body so future implementers are aware.
- **Gather git context**, then session — include branch/PR in the issue only when related.
- **Labels** — when creating, add applicable repo labels (`bug`, `enhancement`, `documentation`, etc.); see skill for the full mapping.
- **Issue type** — always set one of `Bug`, `Feature`, or `Task` via `--type` when creating (see skill).
- On success, link to the **newly created** issue.

## Work mode extras

- **No context** → fetch open issues, present a selectable list (AskQuestion when available).
- **Issue ID given** → skip the list; load that issue.
- Pull **body + comments** via `gh` to understand intent and constraints.
- Read relevant repo code, then produce a **short implementation plan** (branch slug, touch areas, steps, open questions).
- If current branch is unrelated to the issue, plan a **new** branch from `develop` — don’t inherit another topic’s WIP.
- Offer **`/feature <slug>`** to start coding when the plan looks right.
