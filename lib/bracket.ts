export type BracketSeries = {
    id: number;
    teamAId: number;
    teamBId: number;
    date: Date;
    stage: { nameEnglish: string; countsTowardStandings: boolean };
    matches: { winnerTeamId: number }[];
};

export type Feeder = {
    seriesId: number;
    stageNameEnglish: string;
    opponentTeamId: number;
    won: boolean;
};

// Finds the bracket series a team most recently played before `series`, by date — not by
// stage — since a single broad stage (e.g. "Quarterfinals") can span several real rounds
// (winner-bracket round 1, winner-bracket round 2, loser-bracket round 1, ...) that all
// share one Stage row. Scoped to `!stage.countsTowardStandings` so a team's last
// Regular-Season/Swiss-Stage series is never mistaken for a bracket feeder — that filter
// is what actually decides "is this a candidate at all," date only decides "which one."
export function findFeeder(series: BracketSeries, teamId: number, seasonSeries: BracketSeries[]): Feeder | null {
    const candidates = seasonSeries.filter(
        (s) =>
            s.id !== series.id &&
            !s.stage.countsTowardStandings &&
            s.date < series.date &&
            (s.teamAId === teamId || s.teamBId === teamId)
    );
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.date.getTime() - a.date.getTime() || b.id - a.id);
    const feeder = candidates[0];
    const opponentTeamId = feeder.teamAId === teamId ? feeder.teamBId : feeder.teamAId;
    const myWins = feeder.matches.filter((m) => m.winnerTeamId === teamId).length;
    return {
        seriesId: feeder.id,
        stageNameEnglish: feeder.stage.nameEnglish,
        opponentTeamId,
        won: myWins > feeder.matches.length - myWins,
    };
}
