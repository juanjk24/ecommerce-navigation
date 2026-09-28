---
description: Reviews unstaged changes, groups them by functionality, and commits each group with an English Conventional Commit message.
---

Review the current git changes and create logical commits.

Use the `$ARGUMENTS` as an optional override for the commit type (e.g. `feat`,
`fix`, `refactor`, `chore`, `test`, `docs`, `perf`, `build`, `ci`, `style`).

## Steps

1. Run `git status` and `git diff` (and `git diff --staged`, if applicable) to                           understand every change you will commit. Also run `git log --oneline -10`                             to review the repo's commit style and stay consistent with it.
2. Group the changes into logical batches by functionality (e.g. feature,
   bugfix, refactor, config, dependency, docs). Each group should be cohesive:
   the same feature/module files go together, and unrelated changes go in
   separate commits.
3. For each group, in order:
   - Stage exactly the files belonging to that group with `git add <files>`.
   - Create a single Conventional Commit message **in English**, format
     `<type>(<scope>): <subject>` (e.g. `feat(auth): add JWT login flow`).
     - `type` defaults to the most appropriate Conventional Commit type based
       on the change; when `$ARGUMENTS` is provided, prefer that type.
     - A lowercased scope from the module name (e.g. `auth`, `menu`, `users`,
       `frontend`, `backend`) is optional; use it when it adds clarity.
     - `subject` imperative, lowercase, under 72 chars, **without** the
       `fix: `/`feat:` prefix duplicated.
     - If the repo's previous commits strip trailing periods, match that style.
   - Run `git commit -m "<message>"`.
4. Repeat until there is nothing left to commit.
5. Report the list of commits created, with a one-line summary each.

## Rules

- Only commit the modified/untracked files that belong together; never commit
  unintended or unrelated files, and never stage with a blanket `git add .`
  unless the group truly covers the entire working tree.
- Do not amend existing commits, do not push, and do not force anything.
- If the working tree is clean or there is nothing to commit, say so and stop.
- Follow Conventional Commits (https://www.conventionalcommits.org) semantics.%