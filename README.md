# Memory-Powered Code Review Agent

Memory-Powered Code Review Agent is a portfolio-ready full-stack product that shows how persistent memory can make AI code review more useful than a generic linter or one-shot reviewer. It reviews pasted code or PR diffs, retrieves team-specific memory before every review, learns from feedback, and demonstrates a clear before-memory vs after-memory improvement story.

## What This Project Demonstrates

- AI product thinking beyond chat UI wrappers
- memory-aware review generation instead of stateless output
- structured full-stack architecture with a clean service layer
- graceful fallback behavior when cloud APIs are unavailable
- a hackathon-ready demo with visible business value

## Elevator Pitch

Most automated review tools treat every code submission like a blank slate. Real engineering teams do not. They remember architecture preferences, recurring mistakes, what feedback was helpful before, and which refactors actually worked.

This project turns that missing memory into a product.

## Problem

Code review is expensive because useful context is fragmented:

- team standards live in docs, Slack, or reviewer heads
- recurring mistakes are remembered by people, not systems
- accepted fixes are rarely reused systematically
- rejected feedback keeps coming back because tools do not learn

That makes reviews slower, noisier, and less consistent.

## Solution

This app acts like a memory-powered engineering reviewer. Before every review it can retrieve:

- team coding standards
- architecture preferences
- common recurring mistakes
- similar past issues
- accepted and rejected feedback patterns
- coding habits
- score and trend history

Then it generates a review that is more team-aware, more personalized, and more reusable than a generic baseline.

## Why This Is Stronger Than A Generic Linter

With memory disabled:

- feedback is broader
- comments are less team-aware
- no repeated-mistake detection appears
- no trend or habit context is used

With memory enabled:

- comments reference team architecture standards
- accepted fix patterns are reused more confidently
- repeated mistakes are called out explicitly
- improvement since last review becomes visible
- the role of memory is shown in the UI, not hidden

## Business Value

This is designed for small backend teams reviewing Python API code.

It helps teams:

- reduce repeated human review comments
- catch architecture drift earlier
- onboard developers faster
- create more consistent review quality
- track whether developers are improving over time

## Product Highlights

- Next.js App Router dashboard with a product-style UI
- memory-on vs memory-off side-by-side comparison
- structured review comments with severity and category
- explicit architecture preference feedback
- personalized review depth for beginner, intermediate, and advanced users
- improvement since last review section
- repeated mistakes section
- reusable fix pattern suggestions
- coding habits analysis
- trend summaries and score visualization
- feedback loop for helpful, not helpful, team rule, common mistake, and architecture preference actions

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- lucide-react
- recharts
- zod
- Vitest
- local JSON storage for deterministic demo mode

## Architecture

The project uses a modular architecture so the product logic stays server-side and reusable:

- `app/api/*`: review, feedback, memory, and history endpoints
- `services/*`: storage, memory manager, Hindsight adapter, LLM adapter
- `lib/*`: parser, review engine, fixer, scoring, trend analysis, habits analysis, workflow
- `components/*`: dashboard layout, comparison, memory, trends, history, and review UI

The main orchestration flow is:

1. Parse pasted code or diff text.
2. Retrieve relevant team memory and similar past issues.
3. Load user history, habits, and trends.
4. Generate structured review issues.
5. Score the result.
6. Build trend and habit summaries.
7. Persist new history so future reviews improve.

## Hindsight And LLM Support

The app includes clean adapters for Hindsight and LLM-backed generation:

- [services/hindsight-adapter.ts](/C:/Users/parve/Downloads/code%20review%20agent%202/memory-code-review-agent/services/hindsight-adapter.ts)
- [services/llm-adapter.ts](/C:/Users/parve/Downloads/code%20review%20agent%202/memory-code-review-agent/services/llm-adapter.ts)

If API keys are available, these adapters can be used.

If API keys are missing, the app still runs fully in deterministic demo mode using:

- local JSON memory
- heuristic parsing
- rule-based review generation
- stable fallback scoring and trend analysis

That makes it safe for hackathon demos and recruiter walkthroughs without relying on paid services.

## Demo Flow

The strongest demo path is:

1. Load `Bad API Route`.
2. Run review with memory disabled.
3. Show the generic baseline in the comparison panel.
4. Turn memory on and re-run.
5. Show:
   - memory used
   - repeated mistakes still happening
   - improvement since last review
   - reusable fix patterns
   - explicit architecture preference guidance
6. Click `Helpful` or `Save as Team Rule`.
7. Re-run and show the learning loop.

## Portfolio / Recruiter Angle

This project is a strong showcase for roles involving:

- AI product engineering
- full-stack TypeScript
- developer tooling
- workflow orchestration
- memory systems
- hackathon MVP execution

It demonstrates that the product is not just "an AI wrapper," but a system with:

- durable memory
- visible retrieval
- feedback learning
- deterministic fallback behavior
- polished UI/UX
- clear business positioning

## Environment Variables

- `GROQ_API_KEY`
- `LLM_MODEL`
- `HINDSIGHT_API_KEY`
- `HINDSIGHT_BASE_URL`
- `NEXT_PUBLIC_DEFAULT_USER_ID`

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

## Suggested Final Check

```bash
npm run build
```

## Screenshots

Add screenshots in [public/placeholder-assets](/C:/Users/parve/Downloads/code%20review%20agent%202/memory-code-review-agent/public/placeholder-assets) for:

- dashboard overview
- without-memory vs with-memory comparison
- memory inspection panel
- improvement and repeated mistakes sections

## Future Improvements

- richer AST-driven parsing
- inline patch suggestions for multi-file diffs
- GitHub or GitLab PR ingestion
- multi-user team workspace support
- richer longitudinal performance analytics
- optional Playwright smoke tests for the demo path
