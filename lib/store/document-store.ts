import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Document {
  title: string;
  content: string;
}

export interface DocumentStore {
  document: Document;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setDocument: (document: Document) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  devtools(
    persist(
      (set) => ({
        document: {
          title: 'Mohio',
          content: `
    <blockquote>
      <p><strong>Stop Rewriting. Start Connecting.</strong><br>
      Mohio keeps your content linked, consistent, and reusable by design.</p>
    </blockquote>

    <h2><strong>Executive Summary</strong></h2>

    <p>Product teams spend countless hours rephrasing the same ideas across various tools — from initiative documents to presentations, specifications, user stories, test cases, and help documents. This leads to outdated content, misalignment, and slow validation loops.</p>

    <p>Mohio proposes a new solution: <strong>modular, reusable knowledge blocks</strong>, authored once and adapted across views. This can radically improve product team alignment, reduce manual rework, and improve stakeholder trust.</p>

    <h2><strong>Problem Statement</strong></h2>

    <p>Product professionals routinely rework the same core information across multiple formats and tools — a costly and error-prone process.</p>

    <ul>
      <li>Writing detailed documents in Word that are hard to digest and validate.</li>
      <li>Converting those into user stories or slide decks—reshaping the same content over and over.</li>
      <li>Copying backlog items into roadmaps, and then again into presentations.</li>
      <li>Watching testers rewrite stories into functional tests.</li>
      <li>Turning test scenarios into release notes and help pages.</li>
    </ul>

    <p>This cycle of <em>copy-paste-driven documentation</em> leads to a bloated, fragile process where changes must be manually synced across formats. Despite different outputs, the meaning rarely changes—its <strong>representation</strong> does.</p>

    <h2><strong>Customer Segment</strong></h2>

    <p><strong>Teams and professionals who suffer most from fragmented, redundant documentation</strong> and misaligned outputs:</p>

    <ul>
      <li><strong>Product Professionals</strong> — Product Managers, Business Analysts, and Product Owners who transform the same source of truth into multiple deliverables for different audiences.</li>
      <li><strong>Software & Digital Agencies</strong> — Consultants and solution teams who adapt the same knowledge for client specifications, presentations, and deliverables.</li>
      <li><strong>Cross-Functional Teams</strong> — QA Leads, Technical Writers, and Release Managers who rewrite specs into test cases, release notes, and help pages.</li>
    </ul>

    <h2>Solution Proposal</h2>

    <h3><strong>Assumption</strong></h3>

    <p>Knowledge isn't a static document, presentation, or whiteboard—it's a system of reusable thoughts. Each thought exists only once, adapts to its audience in different ways, and connects to others in a dynamic, structured network.</p>

    <h3><strong>Zettelkasten</strong></h3>

    <p><strong>Niklas Luhmann's Zettelkasten (Slip-Box)</strong> is a personal knowledge management system based on <strong>atomic, interconnected notes</strong>. It offers a powerful conceptual model for transforming fragmented content into a <strong>modular, reusable knowledge network</strong>.</p>

    <h3><strong>Core Principles</strong></h3>

    <p>We build on the idea of Zettelkasten to create a system where information is authored once, semantically versioned and reused across multiple outputs.</p>

    <ol>
      <li><strong>Atomic Blocks:</strong> Information is composed of <strong>atomic, uniquely identifiable blocks</strong>, each representing a single, clear idea. This promotes reuse and traceability across contexts.</li>
      <li><strong>Multi-Format Adaptation:</strong> While the <strong>format</strong> of information may vary — whether shown in a document, slide deck, spreadsheet, or whiteboard — the <strong>underlying blocks remain the same</strong>.</li>
      <li><strong>Semantic Integrity:</strong> Blocks can be <strong>rephrased, summarized, or reformatted</strong> to suit different audiences and artifact types. These <strong>style variants remain semantically linked</strong> to the original.</li>
      <li><strong>Linking & Associations:</strong> Content exists in a <strong>network</strong>, not a tree. Blocks are linked to one another using <strong>semantic references</strong>, allowing ideas to form a graph of knowledge rather than being trapped in static folders.</li>
      <li><strong>Bidirectional Connections:</strong> Every block not only links outward but also maintains <strong>backlinks</strong>, showing where and how it's referenced across the system. This creates a <strong>web of meaning</strong> with multi-parent relationships and traceability.</li>
      <li><strong>Emergent Structure:</strong> There's no fixed hierarchy. Instead, <strong>structure emerges organically</strong> through connections, curated views, and thematic entry points.</li>
    </ol>

    <h2><strong>Success Criteria</strong></h2>

    <h3><strong>Product Metrics</strong></h3>

    <ul>
      <li><strong>Reuse Ratio:</strong> ≥50% of content blocks reused in 2+ artifacts.</li>
      <li><strong>Consistency:</strong> 0 outdated versions; linked outputs automatically stay in sync.</li>
      <li><strong>Engagement:</strong> High weekly activity; ≥2 new or adapted artifacts per user.</li>
      <li><strong>Adoption:</strong> ≥5 active teams piloting within 3 months.</li>
    </ul>

    <h3><strong>Customer Value</strong></h3>

    <ul>
      <li><strong>Error Reduction:</strong> Fewer manual mistakes caused by out-of-sync documents.</li>
      <li><strong>Collaboration:</strong> Better teamwork across PMs, BAs, QAs, and stakeholders.</li>
      <li><strong>Confidence:</strong> Stakeholders trust that all outputs reflect the current truth.</li>
      <li><strong>Alignment Speed:</strong> Faster sign-offs and validation loops.</li>
    </ul>
  `
        },
        setTitle: (title: string) =>
          set((state) => ({
            document: { ...state.document, title }
          })),
        setContent: (content: string) =>
          set((state) => ({
            document: { ...state.document, content }
          })),
        setDocument: (document: Document) =>
          set({ document })
      }),
      {
        name: 'document-store'
      }
    ),
    {
      name: 'document-store'
    }
  )
);