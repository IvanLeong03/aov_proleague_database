import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seasonSlug } from "@/lib/seasonSlug";
import { heroSlug } from "@/lib/heroSlug";

export default async function SeasonPage({
    params,
}: {
    params: Promise<{ competitionId: string; seasonSlug: string }>;
}) {
    const { competitionId, seasonSlug: seasonSlugParam } = await params;

    const seasons = await prisma.season.findMany({
        where: { competition: { shortCode: competitionId } },
        select: { id: true, year: true, split: true },
    });
    const matched = seasons.find((s) => seasonSlug(s) === seasonSlugParam);
    if (!matched) {
        notFound();
    }

    const season = await prisma.season.findUnique({
        where: { id: matched.id },
        include: {
            competition: true,
            teamSeasons: { include: { team: true }, orderBy: { team: { name: "asc" } } },
            series: {
                include: {
                    stage: true,
                    teamA: true,
                    teamB: true,
                    matches: true,
                },
                orderBy: [{ stage: { order: "asc" } }, { date: "desc" }],
            },
        },
    });

    if (!season) {
        notFound();
    }

    const [picks, bans] = await Promise.all([
        prisma.pick.findMany({
            where: { match: { series: { seasonId: season.id } } },
            include: { hero: true },
        }),
        prisma.ban.findMany({
            where: { match: { series: { seasonId: season.id } } },
            include: { hero: true },
        }),
    ]);

    const standingsSeries = season.series.filter((s) => s.stage.countsTowardStandings);
    const standingsEntries = season.teamSeasons.map((ts) => ({
        team: ts.team,
        record: computeRecord(ts.team.id, standingsSeries),
    }));
    const standings = sortStandings(standingsEntries, standingsSeries);
    const qualifyThreshold = getQualifyThreshold(standingsSeries);

    const mostPicked = topHeroes(picks);
    const mostBanned = topHeroes(bans);

    return (
        <main className="w-4/5 mx-auto my-8">
            <Link href={`/competitions/${season.competition.shortCode}`} className="text-sm text-gray-500 hover:underline">
                &larr; {season.competition.name}
            </Link>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-medium">
                {season.competition.name} {season.year} {season.split ?? ""}
                {season.isOngoing && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Ongoing</span>
                )}
            </h1>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
                <section>
                    <h2 className="text-lg font-semibold">Standings</h2>
                    <p className="mt-1 text-xs xl:text-sm text-gray-400">
                        Excludes Playoffs/Knockout Stage &middot; series record, then game differential, then head-to-head
                    </p>
                    <table className="mt-2 w-full">
                        <thead>
                            <tr className="text-left text-lg text-gray-400 font-medium tracking-tight">
                                <th>Team</th>
                                <th >Series</th>
                                <th>Games</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map(({ team, record }) => (
                                <tr key={team.id} className="border-t border-white/60">
                                    <td className="py-1">
                                        <Link href={`/teams/${team.abbreviation}`} className="hover:underline">
                                            {team.name}
                                        </Link>
                                        {qualifyThreshold !== null && record.seriesWins >= qualifyThreshold && <span className="text-green-300 mx-1">(Q)</span>}
                                        {qualifyThreshold !== null && record.seriesLosses >= qualifyThreshold && " (E)"}
                                    </td>
                                    <td className="py-1">
                                        {record.seriesWins}-{record.seriesLosses}
                                    </td>
                                    <td className="py-1">
                                        {record.gameWins}-{record.gameLosses}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2 className="text-lg font-semibold">Hero stats</h2>
                    <div className="grid grid-cols-2 mt-4 gap-8">
                        <div className="pr-4">
                            <h3 className="font-medium text-gray-400">Most picked</h3>
                            <HeroLeaderboard rows={mostPicked} />
                        </div>
                        <div className="pr-4">
                            <h3 className="font-medium text-gray-400">Most banned</h3>
                            <HeroLeaderboard rows={mostBanned} />
                        </div>

                    </div>
                    
                </section>
            </div>

            <h2 className="mt-16 text-lg font-semibold">Fixtures</h2>
            {season.series.length === 0 && <p className="mt-1 text-sm text-gray-500">No series yet.</p>}
            {groupByStage(season.series).map(({ stage, series }) => (
                <div key={stage.id} className="my-8">
                    <h3 className="font-medium text-gray-400 my-2">{stage.nameEnglish}</h3>

                    <ul className="my-2 space-y-1">
                        {groupByDate(series).map(({ date, series }) => (
                            <div key={date.toISOString()} className="py-4">
                                <h3 className="my-2 text-sm font-semibold text-gray-200" >{date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</h3>
                                <ul className="space-y-2">
                                    {series.map((s) => {
                                        const aWins = s.matches.filter((m) => m.winnerTeamId === s.teamAId).length;
                                        const bWins = s.matches.filter((m) => m.winnerTeamId === s.teamBId).length;
                                        return (
                                            <li key={s.id}>
                                                <Link
                                                    href={`/competitions/${season.competition.shortCode}/series/${s.id}`}
                                                    className="flex justify-between py-2 hover:bg-gray-600"
                                                >
                                                    <span>
                                                        <span className={`${aWins > bWins ? "font-bold" : "brightness-75"}`}>
                                                            {s.teamA.name}
                                                        </span>
                                                        
                                                        <span className="mx-2">
                                                            {aWins}:{bWins}  
                                                        </span>
                                                        <span className={`${bWins > aWins ? "font-bold" : "brightness-75"}`}>
                                                            {s.teamB.name}
                                                        </span>                                                        
                                                    </span>                                                    
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>                                
                            </div>
                        ))}

                    </ul>
                </div>
            ))}
        </main>
    );
}

function HeroLeaderboard({ rows }: { rows: { hero: { id: number; nameEnglish: string }; count: number }[] }) {
    if (rows.length === 0) {
        return <p className="mt-1 text-sm text-gray-500">No data yet.</p>;
    }
    return (
        <ol className="mt-1 space-y-1">
            {rows.map((row, i) => (
                <li key={row.hero.id} className="flex justify-between text-lg">
                    <span>
                        {i + 1}. <Link href={`/heroes/${heroSlug(row.hero.nameEnglish)}`} className="hover:underline">{row.hero.nameEnglish}</Link>
                    </span>
                    <span className="text-gray-400">{row.count}</span>
                </li>
            ))}
        </ol>
    );
}

function computeRecord<T extends { teamAId: number; teamBId: number; matches: { winnerTeamId: number }[] }>(
    teamId: number,
    series: T[]
) {
    let seriesWins = 0;
    let seriesLosses = 0;
    let gameWins = 0;
    let gameLosses = 0;

    for (const s of series) {
        if (s.teamAId !== teamId && s.teamBId !== teamId) continue;
        const myWins = s.matches.filter((m) => m.winnerTeamId === teamId).length;
        const oppWins = s.matches.length - myWins;
        gameWins += myWins;
        gameLosses += oppWins;
        if (myWins > oppWins) seriesWins++;
        else if (oppWins > myWins) seriesLosses++;
    }

    return { seriesWins, seriesLosses, gameWins, gameLosses };
}

type Record = { seriesWins: number; seriesLosses: number; gameWins: number; gameLosses: number };
type StandingsEntry = { team: { id: number; name: string; abbreviation: string }; record: Record };
type SeriesForTiebreak = { teamAId: number; teamBId: number; matches: { winnerTeamId: number }[] };

// Ranking follows the official regular-season tiebreak rules: total series wins first (fewer
// losses breaks a tie on wins, since a real completed round-robin gives every team the same
// number of games, but a season in progress won't), then three official steps for teams still
// deadlocked on an identical win-loss record: (1) overall game differential across the whole
// season, (2) head-to-head record among just the tied teams, (3) head-to-head game differential
// among just the tied teams. Steps beyond that (towers, kills, deaths, assists, game duration)
// aren't implemented — that data isn't captured anywhere in the schema yet.
function sortStandings(entries: StandingsEntry[], series: SeriesForTiebreak[]): StandingsEntry[] {
    const sorted = [...entries].sort(
        (a, b) =>
            b.record.seriesWins - a.record.seriesWins ||
            a.record.seriesLosses - b.record.seriesLosses ||
            gameDiff(b.record) - gameDiff(a.record)
    );

    const result: StandingsEntry[] = [];
    let i = 0;
    while (i < sorted.length) {
        let j = i + 1;
        while (
            j < sorted.length &&
            sorted[j].record.seriesWins === sorted[i].record.seriesWins &&
            sorted[j].record.seriesLosses === sorted[i].record.seriesLosses &&
            gameDiff(sorted[j].record) === gameDiff(sorted[i].record)
        ) {
            j++;
        }
        const group = sorted.slice(i, j);
        result.push(...(group.length === 1 ? group : breakTieHeadToHead(group, series)));
        i = j;
    }
    return result;
}

function gameDiff(record: Record) {
    return record.gameWins - record.gameLosses;
}

function breakTieHeadToHead(group: StandingsEntry[], series: SeriesForTiebreak[]) {
    const teamIds = new Set(group.map((entry) => entry.team.id));
    const headToHeadSeries = series.filter((s) => teamIds.has(s.teamAId) && teamIds.has(s.teamBId));

    const headToHeadRecords = new Map(
        group.map((entry) => [entry.team.id, { wins: 0, losses: 0, gameWins: 0, gameLosses: 0 }])
    );

    for (const s of headToHeadSeries) {
        for (const teamId of [s.teamAId, s.teamBId]) {
            const record = headToHeadRecords.get(teamId)!;
            const myWins = s.matches.filter((m) => m.winnerTeamId === teamId).length;
            const oppWins = s.matches.length - myWins;
            record.gameWins += myWins;
            record.gameLosses += oppWins;
            if (myWins > oppWins) record.wins++;
            else if (oppWins > myWins) record.losses++;
        }
    }

    return [...group].sort((a, b) => {
        const recordA = headToHeadRecords.get(a.team.id)!;
        const recordB = headToHeadRecords.get(b.team.id)!;
        return (
            recordB.wins - recordA.wins ||
            recordB.gameWins - recordB.gameLosses - (recordA.gameWins - recordA.gameLosses)
        );
    });
}

function topHeroes(items: { hero: { id: number; nameEnglish: string } }[], n = 5) {
    const counts = new Map<number, { hero: { id: number; nameEnglish: string }; count: number }>();
    for (const item of items) {
        const entry = counts.get(item.hero.id) ?? { hero: item.hero, count: 0 };
        entry.count++;
        counts.set(item.hero.id, entry);
    }
    return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}

function groupByStage<T extends { stage: { id: number; nameEnglish: string; order: number } }>(series: T[]) {
    const byStage = new Map<number, { stage: T["stage"]; series: T[] }>();
    for (const s of series) {
        const existing = byStage.get(s.stage.id);
        if (existing) {
            existing.series.push(s);
        } else {
            byStage.set(s.stage.id, { stage: s.stage, series: [s] });
        }
    }
    return Array.from(byStage.values()).sort((a, b) => b.stage.order - a.stage.order);
}

function groupByDate<T extends { date: Date }>(series: T[]) {
    const byDate = new Map<string, { date: Date; series: T[] }>();
    for (const s of series) {
        const key = s.date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
        const existing = byDate.get(key);
        if (existing) {
            existing.series.push(s);
        } else {
            byDate.set(key, { date: s.date, series: [s] });
        }
    }
    return Array.from(byDate.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Returns the shared win/loss threshold for "race to N" formats like Swiss (e.g. 3 wins
// qualifies, 3 losses eliminates) — null if the stages feeding standings aren't all the
// same qualify-threshold format (including the common case of none being, e.g. Regular
// Season), so (Q)/(E) markers only ever show when every involved stage agrees on one N.
function getQualifyThreshold(series: { stage: { winsToQualify: number | null } }[]): number | null {
    const thresholds = new Set(series.map((s) => s.stage.winsToQualify).filter((n): n is number => n !== null));
    return thresholds.size === 1 ? [...thresholds][0] : null;
}