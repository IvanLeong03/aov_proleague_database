import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seasonSlug } from "@/lib/seasonSlug";
import { topHeroes } from "@/lib/heroStats";
import { HeroLeaderboard } from "./HeroLeaderboard";
import { pickName } from "@/lib/language";
import { getLanguage } from "@/lib/getLanguage";


const labels = {
    fixtures: {
        "en": "Fixtures",
        "zh": "賽程"
    },
    noMatches: {
        "en": "No matches yet.",
        "zh": "未進行比賽"
    },
    standings: {
        "en": "Standings",
        "zh": "排行榜"
    },
    team: {
        "en": "Team",
        "zh": "隊伍"
    },
    series: {
        "en": "Series",
        "zh": "大分"
    },
    games: {
        "en": "Games",
        "zh": "小分"
    },
    champions: {
        "en": "Champions",
        "zh": "冠軍"
    },
    runnerUp: {
        "en": "Runner-up",
        "zh": "亞軍"
    },
    standingsDesc: {
        "en": "Regular season/Swiss stage; sorted by series record, then game differential, then head-to-head",
        "zh": "例行賽/瑞士倫: 按大分，小分，對賽成績排序"
    },
    heroStats: {
        "en": "Hero stats",
        "zh": "英雄數據"
    },
    mostPicks: {
        "en": "Most picks",
        "zh": "選用次數"
    },
    mostBans: {
        "en": "Most bans",
        "zh": "禁用次數"
    },
    showComplete: {
        "en": "Show complete statistics",
        "zh": "顯示完整數據"
    },
    ongoing: {
        "en": "Ongoing",
        "zh": "賽事進行中"
    }
}


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

    const [picks, bans, lang] = await Promise.all([
        prisma.pick.findMany({
            where: { match: { series: { seasonId: season.id } } },
            include: { hero: true },
        }),
        prisma.ban.findMany({
            where: { match: { series: { seasonId: season.id } } },
            include: { hero: true },
        }),
        getLanguage(),
    ]);

    const standingsSeries = season.series.filter((s) => s.stage.countsTowardStandings);
    const standingsEntries = season.teamSeasons.map((ts) => ({
        team: ts.team,
        record: computeRecord(ts.team.id, standingsSeries),
    }));
    const standings = sortStandings(standingsEntries, standingsSeries);
    const qualifyThreshold = getQualifyThreshold(standingsSeries);
    const championship = getChampionship(season.series);

    const mostPicked = topHeroes(picks, 5);
    const mostBanned = topHeroes(bans, 5);

    return (
        <main className="w-4/5 mx-auto my-16">
            <Link href={`/competitions/${season.competition.shortCode}`} className="text-sm text-gray-500 hover:underline">
                &larr; {season.competition.shortCode}
            </Link>
            <h1 className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-4 xl:gap-8 text-2xl md:text-3xl font-semibold">
                {season.competition.name} {season.year} {season.split ?? ""}
                {season.isOngoing && (
                    <span className="rounded-full bg-green-200 px-3 py-1 text-sm xl:text-base text-green-700 whitespace-nowrap">{labels.ongoing[lang]}</span>
                )}
            </h1>

            <div className="my-4 text-sm text-gray-400 flex-col justify-start">
                <p>
                    <span className={`mr-2 inline-block ${ lang === 'en' ? "w-20" : "w-8"}`}>
                        {labels.champions[lang]}:
                    </span>
                    <span>
                        {championship ? (
                            <Link href={`/teams/${championship.champion.abbreviation}`} className="text-gray-200 hover:underline">
                                {championship.champion.name}
                            </Link>
                        ) : (
                            "N/A"
                        )}
                    </span>
                </p>
                <p>
                    <span className={`mr-2 inline-block ${ lang === 'en' ? "w-20" : "w-8"}`}>
                        {labels.runnerUp[lang]}:
                    </span>
                    <span>
                        {championship ? (
                        <Link href={`/teams/${championship.runnerUp.abbreviation}`} className="text-gray-200 hover:underline">
                            {championship.runnerUp.name}
                        </Link>
                        ) : (
                            "N/A"
                        )}
                    </span>
                </p>
                
            </div>

            <div className="my-8 grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
                <section>
                    <h2 className="text-lg font-bold">{labels.standings[lang]}</h2>
                    <p className="mt-1 text-xs xl:text-sm text-gray-400">
                        {labels.standingsDesc[lang]}
                    </p>
                    <table className="mt-2 w-full">
                        <thead>
                            <tr className="text-left text-lg text-gray-400 font-medium tracking-tight border-b border-white/80">
                                <th>{labels.team[lang]}</th>
                                <th>{labels.series[lang]}</th>
                                <th>{labels.games[lang]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map(({ team, record }) => (
                                <tr
                                    key={team.id}
                                    className="odd:bg-white/10"
                                >
                                    <td className="py-1">
                                        <Link
                                            href={`/teams/${team.abbreviation}`} 
                                            className={`hover:underline ${qualifyThreshold !== null && record.seriesLosses >= qualifyThreshold ? "text-gray-500 line-through" : ""}`}
                                        >
                                            {team.name}
                                        </Link>
                                        {qualifyThreshold !== null && record.seriesWins >= qualifyThreshold && <span className="text-green-300 mx-1">(Q)</span>}
                                    </td>
                                    <td className="py-1 tracking-wide font-medium">
                                        {record.seriesWins}-{record.seriesLosses}
                                    </td>
                                    <td className="py-1 text-white/70">
                                        {record.gameWins}-{record.gameLosses}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2 className="text-lg font-bold">{labels.heroStats[lang]}</h2>
                    <div className="grid grid-cols-2 mt-4 gap-8">
                        <div className="pr-4">
                            <h3 className="font-medium text-gray-400">{labels.mostPicks[lang]}</h3>
                            <HeroLeaderboard rows={mostPicked} lang={lang} />
                            <Link
                                href={`/competitions/${season.competition.shortCode}/${seasonSlugParam}/heroes?stat=picks`}
                                className="mt-2 inline-block text-xs text-gray-500 hover:underline"
                            >
                                {labels.showComplete[lang]}
                            </Link>
                        </div>
                        <div className="pr-4">
                            <h3 className="font-medium text-gray-400">{labels.mostBans[lang]}</h3>
                            <HeroLeaderboard rows={mostBanned} lang={lang} />
                            <Link
                                href={`/competitions/${season.competition.shortCode}/${seasonSlugParam}/heroes?stat=bans`}
                                className="mt-2 inline-block text-xs text-gray-500 hover:underline"
                            >
                                {labels.showComplete[lang]}
                            </Link>
                        </div>
                    </div>                    
                </section>

                <section>
                    <h2 className="text-lg font-bold">{labels.fixtures[lang]}</h2>
                    {season.series.length === 0 && <p className="my-4 text-gray-500">{labels.noMatches[lang]}</p>}
                    {groupByStage(season.series).map(({ stage, series }) => (
                        <div key={stage.id} className="my-8">
                            <h3 className="font-semibold text-gray-400 my-2">{pickName(lang, stage.nameEnglish, stage.nameChinese)}</h3>

                            <ul className="my-2 space-y-1">
                                {groupByDate(series).map(({ date, series }) => (
                                    <div key={date.toISOString()} className="py-4">
                                        <h3 className="my-2 text-sm font-semibold text-gray-500" >{date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</h3>
                                        <ul className="space-y-2 divide-y divide-dashed divide-gray-600/80">
                                            {series.map((s) => {
                                                const aWins = s.matches.filter((m) => m.winnerTeamId === s.teamAId).length;
                                                const bWins = s.matches.filter((m) => m.winnerTeamId === s.teamBId).length;
                                                return (
                                                    <li key={s.id} className="py-2">
                                                        <Link
                                                            href={`/competitions/${season.competition.shortCode}/series/${s.id}`}
                                                        >
                                                            <span className="grid grid-cols-[3fr_1fr_3fr]">
                                                                <span className={`${aWins > bWins ? "font-bold" : "brightness-60"} inline-block`}>
                                                                    {s.teamA.name}
                                                                </span>
                                                                
                                                                <span className="text-center tracking-wider">
                                                                    {aWins}:{bWins}  
                                                                </span>
                                                                <span className={`${bWins > aWins ? "font-bold" : "brightness-60"} text-right`}>
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
                </section>
                <section>
                    {/* remaining space for playoff bracket */}
                    {/* swap this with hero stats leaderboard in the future*/}
                </section>
            </div>

            
        </main>
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

// Season champion/runner-up is never stored — derived from whichever series is tagged
// the "Final" stage, same principle as everywhere else in this schema (series winners are
// always counted from Match.winnerTeamId, never stored). Returns null before the Final has
// been played (no Final series yet, or it exists with no matches recorded), rendered as N/A.
function getChampionship<
    T extends {
        stage: { nameEnglish: string };
        teamAId: number;
        teamBId: number;
        teamA: { name: string; abbreviation: string };
        teamB: { name: string; abbreviation: string };
        matches: { winnerTeamId: number }[];
    },
>(series: T[]) {
    const final = series.find((s) => s.stage.nameEnglish === "Final");
    if (!final || final.matches.length === 0) return null;

    const aWins = final.matches.filter((m) => m.winnerTeamId === final.teamAId).length;
    const bWins = final.matches.length - aWins;
    if (aWins === bWins) return null;

    return aWins > bWins
        ? { champion: final.teamA, runnerUp: final.teamB }
        : { champion: final.teamB, runnerUp: final.teamA };
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

function groupByStage<T extends { stage: { id: number; nameEnglish: string; nameChinese: string; order: number } }>(series: T[]) {
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

function groupByDate<T extends { date: Date; id: number }>(series: T[]) {
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
    for (const group of byDate.values()) {
        group.series.sort((a, b) => b.id - a.id);
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