# Standings & season page logic

Reference notes for the helper functions in
`app/competitions/[competitionId]/[seasonSlug]/page.tsx`. Almost none of this
is stored in the database — it's computed fresh from `Series`/`Match`/`Pick`/
`Ban` rows every time the page loads. The one exception is which *stages*
feed the standings table at all: `Stage.countsTowardStandings` (a stored
boolean, `true` by default) decides that, not a hardcoded stage name. Group
phases — Regular Season, Group Stage, Swiss Stage — are `true`; elimination
brackets — Playoffs, Knockout Stage — are `false`. The page filters
`season.series` down to `s.stage.countsTowardStandings` before it ever reaches
`computeRecord`/`sortStandings` below, so a new stage type just needs the
right flag set in the DB, not a code change.

## `computeRecord(teamId, series)`

Takes one team and a list of series, and tallies up that team's record:
`seriesWins`, `seriesLosses`, `gameWins`, `gameLosses`.

For each series the team played in, it counts how many `Match` rows that team
won vs. the opponent. If the team won more games than it lost in that series,
that's a series win; otherwise a series loss. Game wins/losses are the raw
match counts, summed across every series passed in.

This is the basic building block everything else in this file is built on top
of — both the standings table and the tie-break logic call it.

## `sortStandings(entries, series)`

The actual ranking algorithm for the standings table. Implements the league's
official tiebreak rules (as given, in Chinese, for the domestic regular
season), as far as the data we track allows:

1. **Series wins (descending), then series losses (ascending)** — this is the
   official primary key ("rank by total wins"), with one addition: comparing
   losses too. In a *completed* round-robin every team has played the same
   number of games, so wins alone fully determines rank. Partway through a
   season that's not true yet — without this, a 1-0 team and a 1-1 team both
   show "1 win" and would incorrectly tie. Comparing losses fixes that for an
   in-progress season without changing anything once the season is complete.
2. **Overall game differential** (`gameWins - gameLosses`, descending) —
   official tiebreak step 1. Only applies to teams that are *still* tied
   after step 1 above (identical wins and identical losses).
3. **Head-to-head, among just the tied teams** — official steps 2 and 3.
   Handled by `breakTieHeadToHead`, see below.

Steps beyond that in the official rules (towers destroyed, kills, deaths,
assists, game duration) are **not implemented** — that data isn't captured
anywhere in the schema. If a real tie ever gets that deep, the order falls
back to whatever the head-to-head comparison left it at.

### Why this needs more than a single `.sort()` call

Head-to-head comparisons are only meaningful *within a group of teams that
are otherwise tied* — you can't compare "Team A's record vs Team B" in
isolation and use it to rank a third unrelated team. So the function:

1. Does the primary sort (wins, losses, game differential) first.
2. Walks through the sorted list looking for **runs of consecutive teams with
   an identical record** (same wins, same losses, same game differential).
3. For any such run longer than one team, calls `breakTieHeadToHead` on just
   that group to re-order them, then stitches the result back into the full
   list.

This mirrors the official ruleset's own worked example: three teams tied at
8-2 get pulled into their own mini round-robin table and ranked by *their*
results against each other, not against the rest of the league.

## `gameDiff(record)`

One-line helper: `gameWins - gameLosses`. Exists mainly so the comparison
logic in `sortStandings` doesn't repeat that subtraction three separate
times.

## `breakTieHeadToHead(group, series)`

Given a group of teams that are deadlocked on overall record, and the full
list of regular-season series, this:

1. Finds every series played **between two teams inside the tied group**
   (ignoring series against teams outside the group — head-to-head only
   counts matchups among the tied teams themselves).
2. Builds a separate win/loss/game-win/game-loss tally for each team, but
   only counting those head-to-head series.
3. Re-sorts just this group by head-to-head wins, then head-to-head game
   differential.

This is official tiebreak steps 2 and 3 combined into one pass.

## `topHeroes(items, n = 5)`

Generic counter: given a list of `Pick` or `Ban` rows (each with a `hero`
attached), counts how many times each hero appears and returns the top `n`,
sorted by count descending. Used for both the "Most picked" and "Most
banned" leaderboards on the season page — same function, just called once
with picks and once with bans.

## `groupByStage(series)`

Takes a flat list of series and buckets them by `Stage` (Regular Season,
Playoffs, etc.), returning the groups sorted by `Stage.order` so they always
display in the right sequence (Regular Season before Playoffs, Group Stage
before Knockout, etc.). Used to render the "Fixtures" section grouped by
stage rather than as one long undifferentiated list.

## `HeroLeaderboard` (component)

Small rendering component, not really "logic" — just turns the array
`topHeroes` returns into a numbered list with a link to each hero's own page.
Reused for both the picked and banned leaderboards to avoid writing the same
markup twice.
