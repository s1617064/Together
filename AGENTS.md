# AGENTS.md

## Working mode

Do not immediately implement when the requirement is unclear.

Use these workflow modes when requested:

### grill-me

Ask clarifying questions before implementation.
Focus on:

- user goal
- scope
- edge cases
- what not to build
- acceptance criteria

### to-prd

Convert the confirmed discussion into a PRD with:

- background
- user stories
- functional requirements
- non-goals
- edge cases
- acceptance criteria

### to-issue

Break the PRD into small vertical-slice implementation issues.
Each issue should include:

- goal
- files likely involved
- acceptance criteria
- testing notes

### implement

Implement only the selected issue.
Do not expand scope unless necessary.
Explain changed files briefly.

### handoff

Create a handoff document for a new coding session.
Include:

- project goal
- tech stack
- current state
- completed work
- key decisions
- open issues
- next recommended step
- known pitfalls

## Repository conventions

- The checked-out repository root is the only production development and release directory.
- `prototype/` is the only production frontend source directory.
- Treat `prototype-draft/` as local draft work unless the user explicitly promotes it.
- Treat `.tmp-*`, `tmp/`, and `outputs/` as local-only scratch/output directories.
- When implementing, prefer changing production files in `prototype/` unless the user explicitly asks for draft-only work.
