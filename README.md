# Mohio

Mohio is an open source knowledge workspace for small teams. It combines fast note capture, structured team documentation, and bring-your-own AI assistance that works with Codex and Claude Code while keeping content stored as plain Markdown in a Git-backed workspace.

The goal is simple: make team knowledge easy to capture, refine, and share without forcing every contributor to think in Git, file structures, or documentation bureaucracy.

## Project Status

Mohio is in active development. The repository currently focuses on product direction, documentation, and browser or desktop application development.

The first real desktop application scaffold now lives in `desktop/`. It is an Electron + React + TypeScript foundation for the final product shell, while the `prototypes/` directories remain exploration work.

## Documentation

The main project documentation lives in `docs/`:

- [Features](docs/FEATURES.md)
- [Design](docs/DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Changelog](docs/changelog/README.md)
- [Roadmap](docs/ROADMAP.md)

`README.md` should stay high level. Detailed product scope, design-system decisions, and engineering direction belong in the sub-documents above.

## Desktop App

The real Mohio desktop app starts in `desktop/`.

Typical local workflow:

1. `cd desktop`
2. `npm install`
3. `npm run dev`

Other useful commands:

- `npm test`
- `npm run build`

## Documentation Maintenance

Every developer should maintain the documentation as the product evolves.

When making changes, update the relevant document in the same PR:

- `docs/FEATURES.md`: all user-visible product capabilities and scope changes
- `docs/DESIGN.md`: the design system, interaction principles, and shared UI rules
- `docs/ARCHITECTURE.md`: the tech stack, platform direction, and engineering specifications
- `docs/changelog/`: a detailed record of every software change

If a change affects product behavior, visual system, and engineering direction, update more than one document. Do not keep detailed feature, design, or architecture notes only in code or PR descriptions.

## Development Workflow

All development work must happen on a feature branch using this exact format:

- `feature-yyyymmdd-descriptive-feature-name`

Rules:

- Do not develop directly on `main`.
- Complete the feature on its branch first.
- A code review is required on the feature branch before it can be merged into `main`.
- Do not merge into `main` until the code review is finished.

## Change Log

All software changes must be documented in `docs/changelog/`.

During feature development, developers may keep working changelog notes for the branch. Before the reviewed feature branch is merged into `main`, all changelog notes for that branch must be consolidated into one final Markdown file named exactly after the branch:

- `feature-yyyymmdd-descriptive-feature-name.md`

The final changelog must explain:

- why the feature was developed
- what the final merged version includes
- which parts of the software were affected

Rules:

- The final changelog must be ready before the feature branch is merged into `main`.
- The final changelog should describe the merged result, not the full development history.
- Merge all branch changelog notes into the single final changelog file for that branch.
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
