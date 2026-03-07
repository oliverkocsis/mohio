Based on [README.md](/Users/oliverkocsis/Workspace/mohio/README.md), these are the questions I’d push on before designing the product.

**User And Use Case**
- Who is the primary buyer and daily user: engineering teams, product teams, operations, or mixed-function teams?
- What job is so painful in Confluence/Notion/Obsidian today that people would switch workflows for this?
- Is the first target “teams who like docs” or “teams who already think in Git and want everyone else to not have to”?
- What does success look like for a team after 30 days: faster writing, better trust in docs, fewer stale pages, lower vendor anxiety?

**Mental Model**
- If the product “feels like Confluence/Notion” but is powered by Git, what concepts are visible to users and what stays hidden?
- Do users ever see branches, commits, and merges directly, or are those always translated into drafts, approvals, and publish states?
- When something goes wrong, does the product explain it in Git terms or product terms?
- What is the smallest mental model a non-technical user needs to operate confidently?

**Onboarding And Setup**
- How does a new team start if they do not already have a clean Markdown repo structure?
- What is the first-run experience on mobile versus desktop?
- How do you make “connect to GitHub” feel safe for non-technical users who fear breaking the repo?
- What happens when a user joins a workspace with hundreds or thousands of files and inconsistent doc conventions?

**Drafts And Publishing**
- Why is a personal drafts branch the right default instead of page-level drafts or workspace-level staged changes?
- How does a user know what is still draft, what is synced across devices, and what is actually published?
- Can people draft changes to many pages and publish only part of them without confusion?
- What prevents a user from publishing unrelated or stale draft changes by accident?
- Is “publish” a page-level action, a batch action, or a workspace release concept?

**Async Collaboration**
- If real-time is intentionally excluded, what is the collaboration moment that still feels alive rather than slow or lonely?
- How do teammates discover that someone else is already working on a page before conflicts happen?
- What replaces comments, mentions, and lightweight feedback loops that people expect from collaborative docs?
- How do approvals work socially: self-approval, peer review, or role-based review?

**AI As Primary Workflow**
- What user problem becomes better when AI is the primary editing workflow rather than an optional tool?
- For users who want to type directly, is that a first-class path or a compromised fallback?
- How do users build trust in AI-generated diffs over time?
- What signals help a user quickly judge whether a proposed diff is safe, useful, or overreaching?
- If AI proposes changes across multiple files, how do you stop review fatigue?

**Conflict Resolution**
- You say conflicts are rare but expected; rare for whom and under what usage pattern?
- What does “guided, modern merge UI” look like for non-technical users who do not understand source/target/base?
- When the LLM proposes a merge resolution, how do users verify it did not subtly distort meaning?
- What happens if two people make valid but philosophically different edits to the same doc?

**Mobile Experience**
- What are the top three tasks on mobile that must feel excellent, not just possible?
- Is mobile mainly for reading, quick edits, approvals, and publishing, or full authoring?
- How do diff review and merge resolution work on small screens without becoming miserable?

**Information Architecture**
- If everything is just Markdown files in a repo, how do spaces, page hierarchies, backlinks, and navigation emerge?
- Is the product opinionated about folder structure, naming, and templates, or completely flexible?
- How will users find information fast when repos become large and messy?

**Trust, Permissions, And Safety**
- How are permissions expressed in a world where GitHub repo access may be too coarse for knowledge work?
- What happens when company policy forbids personal API keys for AI providers?
- How do you reassure users that offline-first plus auto-push will not leak unfinished thinking too early?
- What is the undo story from a user’s perspective, not Git’s perspective?

**Positioning**
- Why would a non-technical team choose this over Notion if they do not care about Git portability?
- Why would a technical team choose this over Obsidian plus Git if they do not need approvals?
- Is the core wedge “team knowledge with ownership” or “AI-native docs with human review”? Those lead to different UX priorities.

**Product Scope**
- Which missing feature will hurt adoption first: comments, permissions, search, templates, or databases?
- What is the one workflow you want to make undeniably better than every alternative in v1?
- If you had to remove either mobile or AI from the first release, which version still has the stronger product?

If useful, I can turn these into:
1. a founder interview checklist,
2. a UX research discussion guide,
3. a sharper v1 product spec.

# Answer

- Git must be completely hidden. Git only serves as an open-source, free technology to share markdown files among team members. I do not care, and users should not either. This is going to be the challenge and the questions for the developer to solve. The changes must be saved and published immeditaelly back to the repo by default. Lets start with auto sync and add options to write drafts later. Important, the changes history must be visible. In case of conflict the UI must be simple to resolve. Would be a nice idea to highlight chnages to the current doucment when openned, and even provide some notification for the user when a recent change might be interesting for the user.  Thus would be nice to have a notification section for sure. 
- the editor must simple, fixed font family, size and color. only markdown styling can be changed with a WYWYG editor which can work in read mode, hybried (editing like Obsidian) code mode, hy
- The tool must have a dedicated scracthpad section to start daily notes, start a meeting request etc, this must be a list of document without any structure where one can create new and new new documents. Here AI agents should help the work to categorize this notes and extract the importasnt information and place them into a structured place if any existin 
- Must have an old schoool tree view not to be completly new and wierd. But I want to encourage users to use the scratchpad to enter new information (short form) so the AI can suggest where to paste this informnation into. Suggestions must be real time using existing AI should work with a tab to complete a sentence. AI (connect to codex first) is primary citizen. 
-  comments, mentions, and lightweight feedback loops that people expect from collaborative docs must existin. 
- I am not sure about the user experience in navigation, the editor is easy, it must be a simple text editor with editor buttons on the top. the right side must show reelvant information about the current document and how it links to others. the left side must be the navigation, but I have no idea how to improve, I know I havr to keep tree navigation for backward compativbiltiy, but I want to encourage users to use the scratchpad to enter new information (short form) so the AI can suggest where to paste this informnation into. Suggestions must be real time using existing AI should work with a tab to complete a sentence. AI (connect to codex first) is primary citizen. I want o encourage netwrok of knowledge like Zettelkasten Method, but I do not want to know how to implement it yet. I want to experiment with different approaches and see what works best for users. I want to make it easy for users to link documents together and navigate between them. I want to make it easy for users to find relevant information quickly and easily. I want to make it easy for users to keep their knowledge up-to-date and accurate. I want the AI to link similar piece of knowledge together and suggest these links to users. I want to make it easy for users to discover new connections and insights from their knowledge. 