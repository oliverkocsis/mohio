# Mohio

Mohio is an open source knowledge workspace for small teams. It combines fast document capture, structured team documentation, and bring-your-own AI assistance that works with Codex and Claude Code while keeping content stored as plain Markdown in a Git-backed workspace.

The goal is simple: make team knowledge easy to capture, refine, and share without forcing every contributor to think in Git, file structures, or documentation bureaucracy.

## Project Status

Mohio is in active development. The repository currently focuses on product direction, documentation, and browser or desktop application development.

The first real desktop application scaffold now lives in `desktop/`. It is an Electron + React + TypeScript foundation for the final product shell, while the `prototypes/` directories remain exploration work.

## Documentation

The main project documentation lives in `docs/`:

- [Documentation Landing Page](docs/index.md)
- [Architecture](docs/architecture.md)
- [Design System](docs/design.md)
- [Feature Details](docs/features/index.md)
- [User Manual](docs/manual/index.md)
- [Roadmap](docs/roadmap.md)
- [Changelog](docs/changelog/index.md)

`README.md` should stay high level. Detailed product scope, architecture, feature state, design-system decisions, user workflows, and changelog history belong in the sub-documents above.

Audience split:

- `docs/index.md`: user-facing project overview and docs landing page
- `docs/roadmap.md`: user-facing roadmap
- `docs/manual/`: end-user-facing guides
- `docs/architecture.md`, `docs/design.md`, `docs/features/`, `docs/changelog/`: developer-facing documentation

## Desktop App

The real Mohio desktop app starts in `desktop/`.

Quikstart development:

```
cd desktop
npm install
npm run dev
```

Other useful commands:

- `npm test`
- `npm run build`

## Documentation Maintenance

Every developer should maintain the documentation as the product evolves.

Documentation is a required deliverable for every feature and bug fix.

When making changes, update the relevant document in the same PR:

- `docs/changelog/`: every software change, with date, context, change, and decision
- `docs/features/`: the technical source of truth for the current implementation
- `docs/manual/`: user-facing workflows affected by UI or behavior changes
- `docs/architecture.md`: system boundaries, integrations, and runtime structure
- `docs/design.md`: layout, interaction, and visual-system changes

Rules:

- `docs/features/` must describe the current implementation, not the roadmap.
- `docs/manual/` must stay aligned with `docs/features/`, but remain non-technical.
- Keep docs concise and split files only when a feature or workflow is large enough to need its own document.
- If a change affects product behavior, visual system, and engineering direction, update more than one document.
- Do not keep the only accurate version of product, design, or architecture decisions in code or PR descriptions.

Definition of done:

1. Update `docs/changelog/` with `Date`, `Context`, `Change`, and `Decision`.
2. Update the affected file in `docs/features/` so it matches the code exactly.
3. Update `docs/manual/` if the UI, wording, or workflow changed.
4. Review `docs/architecture.md` and `docs/design.md` and update them if the system boundary or shared UI changed.

## Development Workflow

All development work must happen on a feature branch using this exact format:

- `feature-yyyymmdd-descriptive-feature-name`

Codex users can start this workflow with the repo-local `start-feature` skill. Ask Codex to use `start-feature`, answer the clarification questions, and it will update `main` and create the branch in the required format.

Codex users can finish this workflow with the repo-local `finish-feature` skill. Ask Codex to use `finish-feature` to run final cleanup, prepare or respond to code review, and sync `main` after merge.

Rules:

- Always branch from `main`.
- Always fetch and pull the latest `origin/main` before creating the feature branch.
- Always use the exact format `feature-yyyymmdd-descriptive-feature-name`.
- Always use `git switch`, not interactive Git flows.
- Never proceed through a dirty worktree without explicit user direction.
- Do not develop directly on `main`.
- Complete the feature on its branch first.
- A code review is required on the feature branch before it can be merged into `main`.
- Do not merge into `main` until the code review is finished.

## Change Log

All software changes must be documented in `docs/changelog/`.

During feature development, developers may keep working changelog entries for the branch. Before the reviewed feature branch is merged into `main`, all changelog entries for that branch must be consolidated into one final Markdown file named exactly after the branch:

- `feature-yyyymmdd-descriptive-feature-name.md`

The final changelog must explain:

- `Date`
- `Context`
- `Change`
- `Decision`

Rules:

- The final changelog must be ready before the feature branch is merged into `main`.
- The final changelog should describe the merged result, not the full development history.
- `Context` should explain the situation behind the change.
- `Decision` should capture the trade-offs and chosen direction.
- The final changelog may also include `Affected Areas` and `Impact` when useful.
- Merge all branch changelog entries into the single final changelog file for that branch.
- Do not rely on commit messages or PR descriptions as the only historical record.

## Product Direction

Mohio is aimed at small teams that want a lightweight, document-first workspace for strategy, product, engineering, design, and operational knowledge.

## Who Mohio Is For

Mohio is especially relevant for teams that:

- prefer open formats over proprietary document storage,
- want bring-your-own AI assistance with tools like Codex and Claude Code without giving up human review,
- need a simpler alternative to heavyweight wiki platforms,
- have at least one technical team member who can help with initial setup.

## Contributing

The project is in active development, so feedback on product direction, workflows, prototypes, and documentation is useful. Issues and pull requests are welcome.

## License

Mohio is licensed under the [MIT License](LICENSE).
