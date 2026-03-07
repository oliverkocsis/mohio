
**Market / Customer**
- Who is the primary buyer and decision-maker: startups, OSS teams, agencies, regulated enterprises, or individuals who “convince” a team? I want to make an open source pojeect and tool for small teams in which there is at least one tech person who can set up the GitHub repo and train others on the workflow. Later I want to make this setupo easier for non-technical users, which will be paid. But I now I want to focus on dleivering a useful tool. For my own pride not for moeny. 
- What is the painful, frequent, budgeted problem you solve that Notion/Confluence users already complain about enough to switch? Notion/Confluence are big saas. they have too much wihtin. I want a simple tool like Obisidian. But Obsidian is more like Lion ux especiialy the UI. I want an iOS clean user interface for teams still keeping it free for the basics using existing cosystems like git for sharing between team members. I want to solve the problem of sharing notes and documents within teams in a simple and efficient way.
- What does “team knowledge workspace” mean in your wedge: docs, specs/RFCs, meeting notes, runbooks, ADRs, onboarding, incident retros? Anything the team needs, but I want to focus on SaaS start up docs, like strategy, product, engineering, and design docs. I want to make it easy for teams to share and collaborate on these types of documents. Though for monetization I think I wil need to pivot to a more non technical audience, small manufactrures, small businesses, and individuals. I want to make it easy for them to share and collaborate on their documents as well.
- What is the smallest team size where your draft/publish model is clearly better than “just use Notion”? I would say from 3-4 people and above. the draft/publish model can help to keep the knowledge organized and prevent confusion.
- What is the killer use case that makes “Git-backed” a must-have, not a nice-to-have? Sahre amongs team members seemlessyly, use exisring chatgpt and claude subscription. I want to experiment with a different documenting approach then standard big wikis. I want to get rid of strict tree strucutre, and I want to make it more like a graph, where you can link knwoledge together and easily navigate between them. Like Zettelkasten Method. 

**Differentiation**
- What’s the durable moat beyond “UI over Markdown + Git”? What stops Notion/Confluence/Obsidian from copying the workflow? Open source local first, not saas. 
- Why will teams choose this over: Obsidian + Git plugin, Obsidian Sync, Logseq, Anytype, Standard Notes, or “docs in a repo” (MkDocs/Docusaurus)? Better user experience, less Linux like. I want to make it more user friendly and less technical. I want to make it easy for teams to share and collaborate on their documents without needing to know how to use Git or Markdown. I want to make it more accessible for non-technical users as well. I want to make an inbox for ideas and set up agentds to process these ideas and turn them into documents. I want to make it easy for teams to capture and organize their knowledge in a way that works for them. I want to make agents which scans the documents and warns about discrepancies, outdated information, and potential improvements. I want to make it easy for teams to keep their knowledge up-to-date and accurate.
- What is the one sentence positioning that’s sharper than “Confluence/Notion feel + Markdown repo”? Note takling and knowledge sharing made easy for teams, without the bloat of traditional wikis. 

**Product / UX**
- How do non-technical users onboard if the workspace is a GitHub repo: accounts, permissions, private repos, SSH keys, 2FA? Later stagte, first need a person who will manage this. 
- How do you prevent “branch sprawl” (`drafts/<username>`) from becoming confusing at scale? No idea what this means. Explain.
- What’s the UX for “what’s published vs draft” and “who changed what” without users thinking in Git terms?
- What’s your definition of “publish”: squash merge? cherry-pick selected commits? per-page publishing? how do you avoid partial, inconsistent states?
- How do you handle attachments and images if you’re “text-first”: where do files live, and how do you keep repos from ballooning?

**LLM Workflow**
- What evidence do you have that “AI as primary editing workflow (diff → approve → publish)” is what teams actually want day-to-day?
- How do you prevent the approval queue from turning into a bottleneck (one person approving everyone’s diffs)? There should not be an approval flow. It must be seemless. 
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
