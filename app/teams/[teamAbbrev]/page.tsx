import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { heroSlug } from "@/lib/heroSlug";
import { pickName, type Language } from "@/lib/language";
import { getLanguage } from "@/lib/getLanguage";

// Matches the `include` shape of the prisma.series.findMany call below exactly, so
// groupBySeason/SeriesList can share one concrete type instead of a bare generic —
// referencing a generic function's return type via ReturnType<typeof fn> without ever
// calling it with a real argument makes TypeScript fall back to the generic's
// constraint bound (missing fields like `teamA`/`stage`), not the actual wider type.
type TeamSeriesRow = Prisma.SeriesGetPayload<{
    include: {
        season: { include: { competition: true } };
        stage: true;
        teamA: true;
        teamB: true;
        matches: true;
    };
}>;

const labels = {
    mostPicked: {
        "en": "Most picked characters",
        "zh": "最常選用"
    },
    record: {
        "en": "Season record",
        "zh": "賽季戰績"
    },
    pastCompetitions: {
        "en": "Past competitions",
        "zh": "已完成賽事"
    },
    matchHistory: {
        "en": "Match history",
        "zh": "戰績一覽"
    },
    Vietnam: {
        "en": "Vietnam (AOG)",
        "zh": "越南 (AOG)"
    },
    Thailand: {
        "en": "Thailand (RPL)",
        "zh": "泰國 (RPL)"
    },
    Taiwan: {
        "en": "Taiwan (GCS)",
        "zh": "台灣 (GCS)"
    },
    ongoing: {
        "en": "Ongoing",
        "zh": "賽事進行中"
    }

}

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
    const teamRegion = team.region;

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

    const [lanes, picks, lang] = await Promise.all([
        prisma.lane.findMany({ orderBy: { id: "asc" } }),
        prisma.pick.findMany({
            where: { teamId },
            include: { hero: true, lane: true, match: { select: { seriesId: true, winnerTeamId: true } } },
        }),
        getLanguage(),
    ]);

    const bySeasonGrouped = groupBySeason(series, teamId).map((entry) => {
        const seriesIds = new Set(entry.series.map((s) => s.id));
        const entryPicks = picks.filter((p) => seriesIds.has(p.match.seriesId));
        return { ...entry, mostPickedByLane: getMostPickedByLane(lanes, entryPicks) };
    });
    const ongoing = bySeasonGrouped.filter((entry) => entry.season.isOngoing);
    const others = bySeasonGrouped.filter((entry) => !entry.season.isOngoing);

    return (
        <main className="w-4/5 mx-auto my-16">
            <h1 className="text-2xl md:text-3xl font-semibold">{team.name}</h1>
            <p className="my-1 text-sm xl:text-base text-gray-400">{labels[teamRegion as keyof typeof labels]?.[lang] ?? teamRegion} </p>

            {ongoing.map((entry) => (
                <section key={entry.season.id} className="mt-8 mb-24">
                    <h2 className="text-lg font-semibold">
                        {entry.season.competition.name} {entry.season.year} {entry.season.split ?? ""}
                        <span className="mx-4 rounded-full bg-green-200 px-3 py-1 text-sm xl:text-base text-green-700">
                            {labels.ongoing[lang]}
                        </span>
                    </h2>
                    <p className="my-2 text-base text-white/80">
                        {labels.record[lang]}: {entry.record.seriesWins}-{entry.record.seriesLosses}
                    </p>
                    <div className="my-4">
                        <p className="my-2">{labels.mostPicked[lang]}:</p>
                        <MostPickedByLane entries={entry.mostPickedByLane} lang={lang} />
                        <p className="mt-8 mb-2">{labels.matchHistory[lang]}</p>
                        <SeriesList series={entry.series} teamId={teamId} lang={lang} />
                    </div>
                    
                </section>
            ))}

            {others.length > 0 && (
                <section className="mt-8 mb-24">
                    <h2 className="text-lg font-medium">{labels.pastCompetitions[lang]}</h2>
                    <div className="mt-2 space-y-2">
                        {others.map((entry) => (
                            <details key={entry.season.id} className="border-b px-3 py-2">
                                <summary className="cursor-pointer text-lg font-semibold">
                                    {entry.season.competition.shortCode} {entry.season.year} {entry.season.split ?? ""}
                                    <p className="my-2 text-base text-white/80 font-medium">
                                        {labels.record[lang]}: {entry.record.seriesWins}-{entry.record.seriesLosses}
                                    </p>
                                </summary>
                                <div className="my-4">
                                    <p className="my-2 font-bold">{labels.mostPicked[lang]}:</p>
                                    <MostPickedByLane entries={entry.mostPickedByLane} lang={lang} />
                                    <p className="mt-8 mb-2 font-bold">{labels.matchHistory[lang]}</p>
                                    <SeriesList series={entry.series} teamId={teamId} lang={lang} />
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}

function MostPickedByLane({ entries, lang }: { entries: ReturnType<typeof getMostPickedByLane>; lang: Language }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
            {entries.map(({ lane, topThree }) => (
                <div key={lane.id} className="rounded-xl bg-gray-600 px-3 py-2 text-gray-400">
                    <p className="text-sm text-gray-200/80 mb-2 font-semibold">{pickName(lang, lane.nameEnglish, lane.nameChinese)}</p>
                    {topThree.length === 0 ? (
                        <span className="text-gray-400">—</span>
                    ) : (
                        <div className="mt-1 space-y-1">
                            {topThree.map((entry, i) => (
                                <div key={entry.hero.id} className="flex justify-between items-center">
                                    <Link
                                        href={`/heroes/${heroSlug(entry.hero.nameEnglish)}`}
                                        className={`hover:underline ${i === 0 ? "text-lg xl:text-xl font-medium text-gray-100" : "text-sm xl:text-base"}`}
                                    >
                                        {pickName(lang, entry.hero.nameEnglish, entry.hero.nameChinese)}
                                    </Link>
                                    <span className={i === 0 ? "text-2xl text-gray-100" : "text-sm"}>
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
    lang,
}: {
    series: TeamSeriesRow[];
    teamId: number;
    lang: Language;
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
                            className="flex justify-between items-center gap-2 rounded-2xl px-4 py-2 text-sm bg-gray-700 hover:bg-gray-700/75"
                        >
                            <span className="text-sm xl:text-base">
                                <span className={`${result === "W" ? "text-green-300" : "text-red-300"} mr-1 font-semibold`}>
                                    {result}
                                </span>
                                vs {opponent.name}
                                <span className="ml-4 text-gray-400 whitespace-nowrap">
                                    ({myWins}-{oppWins})
                                </span>
                            </span>
                            <span className="grid grid-cols-1 text-gray-300 whitespace-nowrap text-right">
                                <span>
                                    {pickName(lang, s.stage.nameEnglish, s.stage.nameChinese)}
                                </span>
                                <span>
                                    {s.date.toISOString().slice(5, 10)}
                                </span>                                
                            </span>

                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function groupBySeason(series: TeamSeriesRow[], teamId: number) {
    const bySeason = new Map<number, { season: TeamSeriesRow["season"]; series: TeamSeriesRow[] }>();

    for (const s of series) {
        const seasonId = s.season.id;
        const entry = bySeason.get(seasonId) ?? { season: s.season, series: [] };
        entry.series.push(s);
        bySeason.set(seasonId, entry);
    }

    return Array.from(bySeason.values())
        .map((entry) => ({
            ...entry,
            record: computeRecord(entry.series, teamId),
            firstGameDate: entry.series.reduce((min, s) => (s.date < min ? s.date : min), entry.series[0].date),
        }))
        .sort((a, b) => b.firstGameDate.getTime() - a.firstGameDate.getTime());
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
    lanes: { id: number; nameEnglish: string; nameChinese: string }[],
    picks: { laneId: number; heroId: number; teamId: number; hero: { id: number; nameEnglish: string; nameChinese: string }; match: { winnerTeamId: number } }[]
) {
    return lanes.map((lane) => {
        const counts = new Map<number, { hero: { id: number; nameEnglish: string; nameChinese: string }; count: number; wins: number }>();
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
