# Parallel development with git worktrees

Two features in Sprint 2 — **guest flow** (#17) and **Vercel Blob re-hosting**
(#18) — were developed in parallel using `git worktree`. This doc records
the pattern so future sprints can use it without re-deriving it.

## Why worktrees

Without worktrees, parallel work means:
- Stashing the current branch, checking out another, re-installing deps,
  rebuilding Prisma, rerunning the dev server.
- Or: two clones of the repo, duplicated `node_modules`, diverging `.env.local`.

With worktrees, each feature branch has its own working directory on disk and
its own dev server on a different port. One Claude Code session per worktree.

## Layout

```
~/Desktop/StoryNest/              # main worktree, checked out to `main`
~/Desktop/StoryNest-guest/        # worktree for `feat/guest-flow`
~/Desktop/StoryNest-blob/         # worktree for `feat/blob-rehost`
```

The extra worktrees are outside the main project root so editors, `.gitignore`,
and the existing `.env.local` don't trip over each other.

## Setup commands

```bash
# From the main worktree (which lives at ~/Desktop/StoryNest)
git worktree add ../StoryNest-guest -b feat/guest-flow
git worktree add ../StoryNest-blob  -b feat/blob-rehost

# In each new worktree:
cd ../StoryNest-guest
cp ../StoryNest/.env.local .            # share secrets
npm ci                                  # fresh node_modules
PORT=3101 npm run dev                   # unique port per worktree
```

## How Claude Code was used

One Claude Code session per worktree. Each session:
- Has its own `.claude/` (inherited from the branch).
- Sees only the branch's files.
- Runs the `add-feature` skill independently.

That isolation matters: when the guest-flow session hit an auth-redirect issue,
it could not accidentally trample the blob-rehost session's changes because
they were on disk in different directories.

## Cleanup

```bash
# After both branches merged:
git worktree remove ../StoryNest-guest
git worktree remove ../StoryNest-blob
git branch -d feat/guest-flow feat/blob-rehost
```

## Evidence

- `git branch -a` shows `feat/guest-flow` and `feat/blob-rehost` branched
  off the same main commit.
- `git log --graph --all --oneline` shows the two branches merging into
  main within hours of each other — parallel execution, not sequential.
- `git worktree list` (run during development) shows three active worktrees.
