# Mohio (working name)

Mohio is an open-source, desktop + mobile knowledge workspace for teams. It feels clean and simple to use, while storing everything as plain Markdown in a Git repository.

## Who it is for (v1)

- Small teams (3-20 people), especially SaaS startups.
- Teams with at least one technical champion who can set up the GitHub repo once.
- Teams that want simple, fast docs without SaaS wiki bloat.

## Who it is not for (yet)

- Teams that require zero-setup onboarding with no technical owner.
- Teams that need real-time multiplayer editing.
- Teams that need heavy enterprise compliance or admin controls out of the box.

## Positioning

Note-taking and knowledge sharing made easy for teams, without the bloat of traditional wikis.

## The core idea

Your workspace is a GitHub repo (first target). Each page is a Markdown file.

Git provides history, diffs, branching, merging, and rollback. Mohio hides Git complexity behind a non-technical UX: spaces, pages, drafts, publish, and guided conflict resolution.

Mohio is built around connected knowledge, not rigid folder trees. You can link ideas across docs and navigate your workspace like a graph.

Mohio is bring-your-own AI engine by design. Each workspace must connect an AI provider and embeddings backend. Semantic linking, quality checks, and agent workflows depend on embeddings, so Mohio does not run as intended without AI + embeddings configured.

## How collaboration works (async by design)

- You edit locally (offline-first).
- Changes sync through GitHub so drafts stay available across your devices.
- Publish applies selected draft changes to shared docs.
- When conflicts happen, Mohio guides users through resolution in product language, not Git jargon.

## AI workflow (assistant, not gatekeeper)

- AI is required and user-controlled (BYO).
- You can write directly, or ask AI to propose edits and improvements.
- Teams can use existing model subscriptions (BYOK) based on budget and policy.
- Agents can help detect outdated docs, inconsistencies, and missing links.

## What makes it different

### Versus Notion / Confluence

- No lock-in: pages are files your team owns.
- Offline-first and portable by default.
- Simpler, cleaner workflow for startup docs.

### Versus Obsidian + plugins

- Team-native workflow, not single-player first.
- Shared drafting and publishing model built in.
- AI helpers focused on maintaining team knowledge quality.

## Scope for v1

- GitHub-backed workspaces.
- Markdown-first docs (plus Mermaid diagrams).
- Core startup documentation workflows: strategy, product, engineering, design.
- Desktop + mobile with async collaboration.

## Non-goals (initially)

- Real-time collaborative editing.
- Notion-style databases and relations.
- Heavy rich media workflows.
- Full enterprise governance/compliance platform.

## 90-day proof targets

- 10 active pilot teams.
- At least 3 weekly active publishing teams.
- Median time-to-first-shared-doc under 30 minutes.
- Week-4 team retention above 40%.

## Sustainability (planned)

- Open-source core remains free.
- Paid layer later focuses on easier onboarding and non-technical team workflows.
- License will be finalized before public alpha.
