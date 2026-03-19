import type { AppInfo } from "@shared/mohio-types";

const leftRailSections = [
  {
    title: "Recent",
    items: ["Welcome note", "Team handbook", "Publishing checklist"],
  },
  {
    title: "Pinned",
    items: ["Roadmap", "Architecture"],
  },
];

const headingTools = [
  { label: "Heading 1", displayLabel: "H1" },
  { label: "Heading 2", displayLabel: "H2" },
  { label: "Heading 3", displayLabel: "H3" },
] as const;

const textStyleTools = [
  { label: "Bold", icon: BoldIcon },
  { label: "Underline", icon: UnderlineIcon },
  { label: "Italic", icon: ItalicIcon },
] as const;

const listTools = [
  { label: "Bulleted list", icon: BulletedListIcon },
  { label: "Numbered list", icon: NumberedListIcon },
 ] as const;

const insertTools = [
  { label: "Link", icon: LinkIcon },
  { label: "Table", icon: TableIcon },
  { label: "Clear formatting", icon: ClearFormattingIcon },
] as const;

export function App() {
  const appInfo: AppInfo = window.mohio.getAppInfo();

  return (
    <div className="app-shell">
      <header className="top-bar" data-testid="top-bar">
        <div className="top-bar__context">
          <span className="workspace-label">
            <span>Mohio</span>
            <span className="workspace-label__chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </span>
        </div>

        <div className="top-bar__search">
          <input
            aria-label="Search workspace"
            className="search-input search-input--top-bar"
            placeholder="Search workspace"
            readOnly
            type="search"
          />
        </div>

        <div className="top-bar__actions">
          <button className="primary-button" type="button">
            New note
          </button>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="sidebar sidebar--left" data-testid="workspace-sidebar">
          {leftRailSections.map((section) => (
            <section className="sidebar__section" key={section.title}>
              <h2 className="sidebar__title">{section.title}</h2>
              <ul className="note-list">
                {section.items.map((item, index) => (
                  <li className={`note-row${index === 0 && section.title === "Recent" ? " note-row--active" : ""}`} key={item}>
                    <span className="note-row__title">{item}</span>
                    <span className="note-row__meta">Draft</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </aside>

        <main className="editor-panel">
          <div className="editor-panel__inner">
            <div className="editor-toolbar">
              <div className="toolbar-actions">
                <div className="toolbar-group">
                  {headingTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--text"
                      key={tool.label}
                      type="button"
                    >
                      <span className="toolbar-button__text">{tool.displayLabel}</span>
                    </button>
                  ))}
                  <button
                    aria-label="Heading styles"
                    className="toolbar-button toolbar-button--selector-only"
                    type="button"
                  >
                    <span className="toolbar-button__chevron" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                <span className="toolbar-separator" aria-hidden="true" />

                <div className="toolbar-group">
                  {textStyleTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--icon"
                      key={tool.label}
                      type="button"
                    >
                      <tool.icon />
                    </button>
                  ))}
                  <button
                    aria-label="Text styles"
                    className="toolbar-button toolbar-button--selector-only"
                    type="button"
                  >
                    <span className="toolbar-button__chevron" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                <span className="toolbar-separator" aria-hidden="true" />

                <div className="toolbar-group">
                  {listTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--icon"
                      key={tool.label}
                      type="button"
                    >
                      <tool.icon />
                    </button>
                  ))}
                  <button
                    aria-label="Text alignment"
                    className="toolbar-button toolbar-button--icon"
                    type="button"
                  >
                    <AlignLeftIcon />
                  </button>
                  <button
                    aria-label="Alignment options"
                    className="toolbar-button toolbar-button--selector-only"
                    type="button"
                  >
                    <span className="toolbar-button__chevron" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                <span className="toolbar-separator" aria-hidden="true" />

                <div className="toolbar-group">
                  {insertTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--icon"
                      key={tool.label}
                      type="button"
                    >
                      <tool.icon />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="hello-state" data-testid="hello-state">
              <h1>Hello Mohio</h1>
              <p className="hello-state__copy">
                The first real Mohio desktop shell is running. Workspace selection,
                Markdown documents, and assistant workflows will layer onto this
                frame next.
              </p>

              <dl className="hello-state__meta">
                <div>
                  <dt>App</dt>
                  <dd>{appInfo.name}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{appInfo.version}</dd>
                </div>
                <div>
                  <dt>Platform</dt>
                  <dd>{appInfo.platform}</dd>
                </div>
              </dl>
            </section>
          </div>
        </main>

        <aside className="sidebar sidebar--right" data-testid="assistant-sidebar">
          <section className="sidebar__section assistant-panel-header">
            <p className="assistant-panel__label">Assistant</p>
          </section>

          <div className="assistant-panel__footer">
            <section className="sidebar__section">
              <ul className="action-list">
                <li>Summarize note</li>
                <li>Discover related notes</li>
                <li>Resolve conflicting notes</li>
              </ul>
            </section>

            <div className="chat-composer" aria-label="Assistant composer">
              Ask Mohio for help
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BoldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M5 3.5h3.3a2.2 2.2 0 1 1 0 4.4H5zm0 4.4h3.8a2.3 2.3 0 1 1 0 4.6H5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M5.2 3.6v3.6a2.8 2.8 0 0 0 5.6 0V3.6M4 12.4h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="toolbar-chevron-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M4.5 6.5 8 10l3.5-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M9.8 3.5H6.9m2.2 0L6.8 12.5m2.3 0H6.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function BulletedListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M6 4h6M6 8h6M6 12h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <circle cx="3.25" cy="4" fill="currentColor" r="0.85" />
      <circle cx="3.25" cy="8" fill="currentColor" r="0.85" />
      <circle cx="3.25" cy="12" fill="currentColor" r="0.85" />
    </svg>
  );
}

function NumberedListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M6 4h6M6 8h6M6 12h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M2.5 4h1.4v2M2.2 8h1.6c.4 0 .7.3.7.7 0 .2-.1.4-.3.6l-1.6 1.4h2M2.3 12h1.5c.5 0 .8.3.8.7s-.3.7-.8.7H2.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.5 4h8M3.5 7h6.2M3.5 10h8M3.5 13h5.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M6.4 9.6 9.6 6.4m-4.8.9L3.7 8.4a2.2 2.2 0 0 0 3.1 3.1l1.1-1.1m1.3-4.9 1.1-1.1a2.2 2.2 0 0 1 3.1 3.1l-1.1 1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.2 4.2h9.6v7.6H3.2zm0 2.5h9.6M6.4 4.2v7.6M9.6 4.2v7.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ClearFormattingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <text
        fill="currentColor"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="12.5"
        fontWeight="700"
        x="3"
        y="12.3"
      >
        T
      </text>
      <path
        d="M11.3 7.3 4.2 8.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export default App;
