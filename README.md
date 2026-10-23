# gh-project-tracker

A local dashboard for one GitHub repo:

- lines changed and tickets closed over the last 14 days
- a burndown for a milestone
- how much of each label is still open
- remaining tickets, with priority, labels and milestone editable in place (saved to GitHub immediately)

## Setup

Needs Node (tested on 26), git 2.37+, and the [GitHub CLI](https://cli.github.com).

```bash
gh auth login
gh auth refresh -s project          # the Priority field lives on a Projects board
npm install
cp tracker.config.example.json tracker.config.json   # then edit it
npm start                            # http://127.0.0.1:5174
```

`npm run dev` runs with hot reload. `npm test` runs the tests.

## Config

| Key | Meaning |
|---|---|
| `owner`, `repo` | The repo to track |
| `branch` | Branch counted for lines changed |
| `projectOwner`, `projectNumber` | A Projects board owned by a user account |
| `priorityField` | Single-select field on that board with options `P0`, `P1`, `P2` |
| `defaultMilestone` | Selected on load; falls back to "All tickets" if it doesn't exist |
| `excludeGlobs` | Paths left out of line counts |
| `port` | Local port |

## How it counts

- **Done** = closed, unless closed as "not planned" or "duplicate" (those are ignored).
- **Lines changed** come from `git log --numstat` on a bare clone in `.cache/`, merges skipped. Always whole-repo.
- **Burndown** uses each ticket's current milestone.
- Days are local calendar days.
- Charts update on **Refresh**; table rows stay put while you edit.

Your GitHub token stays in the local server. It's never sent to the browser or written to disk.
