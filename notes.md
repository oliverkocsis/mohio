* https://logseq.com/ is a similar to Obsidian
* The PARA Method: The Simple System for Organizing Your Digital Life in Seconds


## Questions

**Market / Customer**
- Who is the primary buyer and decision-maker: startups, OSS teams, agencies, regulated enterprises, or individuals who “convince” a team?
- What is the painful, frequent, budgeted problem you solve that Notion/Confluence users already complain about enough to switch?
- What does “team knowledge workspace” mean in your wedge: docs, specs/RFCs, meeting notes, runbooks, ADRs, onboarding, incident retros?
- What is the smallest team size where your draft/publish model is clearly better than “just use Notion”?
- What is the killer use case that makes “Git-backed” a must-have, not a nice-to-have?

**Differentiation**
- What’s the durable moat beyond “UI over Markdown + Git”? What stops Notion/Confluence/Obsidian from copying the workflow?
- Why will teams choose this over: Obsidian + Git plugin, Obsidian Sync, Logseq, Anytype, Standard Notes, or “docs in a repo” (MkDocs/Docusaurus)?
- What is the one sentence positioning that’s sharper than “Confluence/Notion feel + Markdown repo”?

**Product / UX**
- How do non-technical users onboard if the workspace is a GitHub repo: accounts, permissions, private repos, SSH keys, 2FA?
- How do you prevent “branch sprawl” (`drafts/<username>`) from becoming confusing at scale?
- What’s the UX for “what’s published vs draft” and “who changed what” without users thinking in Git terms?
- What’s your definition of “publish”: squash merge? cherry-pick selected commits? per-page publishing? how do you avoid partial, inconsistent states?
- How do you handle attachments and images if you’re “text-first”: where do files live, and how do you keep repos from ballooning?

**LLM Workflow**
- What evidence do you have that “AI as primary editing workflow (diff → approve → publish)” is what teams actually want day-to-day?
- How do you prevent the approval queue from turning into a bottleneck (one person approving everyone’s diffs)?
- What are your safety guarantees: prompt injection from docs, secret leakage in repos, and “agent proposes harmful changes” risk?
- “BYOK” is good for control, but bad for UX: what’s the simplest setup that works for most teams?

**Tech / Reliability**
- Offline-first is hard: what’s the conflict rate you expect, and what’s your plan when conflicts are common (traveling teams, spotty Wi‑Fi)?
- What’s the guided merge UX MVP (the 1–2 conflicts you solve well first), and what’s out of scope?
- Mobile + desktop: what framework and storage model makes “fast + Git-backed” realistic on iOS/Android without battery/network pain?
- How do you handle large repos, partial checkouts, and search/indexing performance across devices?

**Business Model / Sustainability**
- If it’s open source and “no hosted service (initially)”, where does revenue come from: paid app, paid team features, enterprise support, plugins?
- What license are you choosing, and how does it align with monetization and preventing a cloud vendor from re-hosting it?
- What’s the distribution strategy: GitHub virality, developer communities, content, integrations, partnerships?

**Traction / Proof**
- What concrete milestones over the next 90 days prove pull: number of active teams, weekly publishing events, retention, time-to-first-publish?
- What’s your early adopter pipeline right now, and what are the top 3 objections you’re hearing?
