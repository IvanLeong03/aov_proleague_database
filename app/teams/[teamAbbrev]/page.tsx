import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { heroSlug } from "@/lib/heroSlug";

export default async function TeamPage({
    params,
}: {
    params: Promise<{ teamAbbrev: string }>;
}) {
    const { teamAbbrev } = await params;

    const team = await prisma.team.findUnique({ where: { abbreviation: teamAbbrev } });
    if (!team) {
        notFound();
    }

    const teamId = team.id;

    const series = await prisma.series.findMany({
        where: { OR: [{ teamAId: teamId }, { teamBId: teamId }] },
        include: {
            season: { include: { competition: true } },
            stage: true,
            teamA: true,
            teamB: true,
            matches: true,
        },
        orderBy: { date: "desc" },
    });

    const [lanes, picks] = await Promise.all([
        prisma.lane.findMany({ orderBy: { id: "asc" } }),
        prisma.pick.findMany({
            where: { teamId },
            include: { hero: true, lane: true, match: { select: { seriesId: true, winnerTeamId: true } } },
        }),
    ]);

    const byCompetition = groupByCompetition(series, teamId).map((entry) => {
        const seriesIds = new Set(entry.series.map((s) => s.id));
        const entryPicks = picks.filter((p) => seriesIds.has(p.match.seriesId));
        return { ...entry, mostPickedByLane: getMostPickedByLane(lanes, entryPicks) };
    });
    const ongoing = byCompetition.filter((c) => c.isOngoing);
    const others = byCompetition.filter((c) => !c.isOngoing);

    return (
        <main className="w-4/5 mx-auto my-8">
            <h1 className="text-2xl md:text-3xl font-semibold">{team.name}</h1>
            <p className="mt-1 text-sm text-gray-400">{team.region}</p>

            {ongoing.map((entry) => (
                <section key={entry.competition.id} className="mt-6">
                    <h2 className="text-lg font-medium">
                        {entry.competition.name}
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-sm text-green-300">
                            Ongoing
                        </span>
                    </h2>
                    <p>
                        {entry.record.seriesWins}-{entry.record.seriesLosses}L
                    </p>
                    <MostPickedByLane entries={entry.mostPickedByLane} />
                    <SeriesList series={entry.series} teamId={teamId} />
                </section>
            ))}

            {others.length > 0 && (
                <section className="mt-6">
                    <h2 className="text-lg font-medium">Competition history</h2>
                    <div className="mt-2 space-y-2">
                        {others.map((entry) => (
                            <details key={entry.competition.id} className="rounded-lg border px-3 py-2">
                                <summary className="cursor-pointer text-lg">
                                    {entry.competition.name}
                                    <p className="my-2 text-base text-white/80">
                                        Record: {entry.record.seriesWins}-{entry.record.seriesLosses}
                                    </p>
                                </summary>
                                <div className="my-4">
                                    <p className="my-2">Most picked characters:</p>
                                    <MostPickedByLane entries={entry.mostPickedByLane} />
                                    <p className="mt-8 mb-2">Match history</p>
                                    <SeriesList series={entry.series} teamId={teamId} />
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}

function MostPickedByLane({ entries }: { entries: ReturnType<typeof getMostPickedByLane> }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {entries.map(({ lane, topThree }) => (
                <div key={lane.id} className="rounded-lg border border-dotted px-3 py-2">
                    <p className="text-sm text-gray-400">{lane.nameEnglish}</p>
                    {topThree.length === 0 ? (
                        <span className="text-gray-400">—</span>
                    ) : (
                        <div className="mt-1 space-y-1">
                            {topThree.map((entry, i) => (
                                <div key={entry.hero.id} className="flex justify-between items-center">
                                    <Link
                                        href={`/heroes/${heroSlug(entry.hero.nameEnglish)}`}
                                        className={`hover:underline ${i === 0 ? "text-lg font-medium" : "text-sm text-gray-300"}`}
                                    >
                                        {entry.hero.nameEnglish}
                                    </Link>
                                    <span className={i === 0 ? "text-2xl text-gray-100" : "text-sm text-gray-400"}>
                                        {entry.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function SeriesList({
    series,
    teamId,
}: {
    series: ReturnType<typeof groupByCompetition>[number]["series"];
    teamId: number;
}) {
    return (
        <ul className="mt-2 space-y-4">
            {series.map((s) => {
                const opponent = s.teamAId === teamId ? s.teamB : s.teamA;
                const myWins = s.matches.filter((m) => m.winnerTeamId === teamId).length;
                const oppWins = s.matches.length - myWins;
                const result = myWins > oppWins ? "W" : myWins < oppWins ? "L" : "-";
                return (
                    <li key={s.id}>
                        <Link
                            href={`/competitions/${s.season.competition.shortCode}/series/${s.id}`}
                            className="flex justify-between rounded-xl px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700"
                        >
                            <span>
                                <span className={`${result === "W" ? "text-green-300" : "text-red-300"} mr-1`}>
                                    {result}
                                </span>
                                vs {opponent.name}
                                <span className="ml-4 text-gray-400">{s.stage.nameEnglish}</span>
                            </span>
                            <span className="text-gray-300">
                                {myWins}-{oppWins} &middot; {s.date.toISOString().slice(0, 10)}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function groupByCompetition<
    T extends {
        season: {
            isOngoing: boolean;
            competitionId: number;
            competition: { id: number; name: string; shortCode: string };
        };
        matches: { winnerTeamId: number }[];
        teamAId: number;
        teamBId: number;
    },
>(series: T[], teamId: number) {
    const byCompetition = new Map<
        number,
        { competition: T["season"]["competition"]; series: T[]; isOngoing: boolean }
    >();

    for (const s of series) {
        const compId = s.season.competition.id;
        const entry = byCompetition.get(compId) ?? {
            competition: s.season.competition,
            series: [],
            isOngoing: false,
        };
        entry.series.push(s);
        if (s.season.isOngoing) entry.isOngoing = true;
        byCompetition.set(compId, entry);
    }

    return Array.from(byCompetition.values()).map((entry) => ({
        ...entry,
        record: computeRecord(entry.series, teamId),
    }));
}

function computeRecord<T extends { matches: { winnerTeamId: number }[] }>(series: T[], teamId: number) {
    let seriesWins = 0;
    let seriesLosses = 0;
    let gameWins = 0;
    let gameLosses = 0;

    for (const s of series) {
        const myWins = s.matches.filter((m) => m.winnerTeamId === teamId).length;
        const oppWins = s.matches.length - myWins;
        gameWins += myWins;
        gameLosses += oppWins;
        if (myWins > oppWins) seriesWins++;
        else if (oppWins > myWins) seriesLosses++;
    }

    return { seriesWins, seriesLosses, gameWins, gameLosses };
}

function getMostPickedByLane(
    lanes: { id: number; nameEnglish: string }[],
    picks: { laneId: number; heroId: number; teamId: number; hero: { id: number; nameEnglish: string }; match: { winnerTeamId: number } }[]
) {
    return lanes.map((lane) => {
        const counts = new Map<number, { hero: { id: number; nameEnglish: string }; count: number; wins: number }>();
        for (const pick of picks) {
            if (pick.laneId !== lane.id) continue;
            const entry = counts.get(pick.heroId) ?? { hero: pick.hero, count: 0, wins: 0 };
            entry.count++;
            if (pick.teamId === pick.match.winnerTeamId) entry.wins++;
            counts.set(pick.heroId, entry);
        }
        const topThree = Array.from(counts.values())
            .sort((a, b) => b.count - a.count || b.wins - a.wins)
            .slice(0, 3);
        return { lane, topThree };
    });
}
