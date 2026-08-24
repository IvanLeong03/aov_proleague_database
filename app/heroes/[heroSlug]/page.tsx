import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { heroSlug } from "@/lib/heroSlug";
import Image from "next/image";
import { PickHistoryTable, type PickRow } from "./PickHistoryTable";
import { pickName, type Language } from "@/lib/language";
import { getLanguage } from "@/lib/getLanguage";

type WL = { w: number; l: number };
type StatRow = { label: string; blue: WL; red: WL };
type MatchupEntry = { hero: { id: number; nameEnglish: string; nameChinese: string }; count: number; wins: number; losses: number };

type Season = {
    id: number;
    year: number;
    split: string | null;
    isOngoing: boolean;
    competition: { id: number; name: string, shortCode: string };
};

type SeasonEntry = {
    season: Season;
    wins: number;
    losses: number;
    bans: number;
    byPosition: Map<string, { blue: WL; red: WL }>;
    byTeam: Map<string, { blue: WL; red: WL }>;
    matchupCounts: Map<number, MatchupEntry>;
    pickRows: PickRow[];
};

const labels = {
    noRecord: {
        "en": "No picks or bans recorded yet",
        "zh": "未有選用或禁用紀錄"
    },
    byLane: {
        "en": "By lane",
        "zh": "分路數據"
    },
    byTeam: {
        "en": "By team",
        "zh": "隊伍數據"
    },
    frequentMatchups: {
        "en": "Frequent matchups",
        "zh": "常見對線英雄"
    },
    allPicks: {
        "en": "All picks",
        "zh": "完整選用紀錄"
    },
    blue: {
        "en": "Blue",
        "zh": "藍方" 
    },
    red: {
        "en": "Red",
        "zh": "紅方"
    },
    total: {
        "en": "Total",
        "zh": "總和"
    },
    winrate: {
        "en": "Win rate",
        "zh": "勝率"
    },
    picks: {
        "en": "Picks",
        "zh": "選用"
    },
    wl: {
        "en": "W-L",
        "zh": "勝/負"
    },
    totalpicks: {
        "en": "Total picks",
        "zh": "選用次數"
    },
    bans: {
        "en": "Bans",
        "zh": "禁用次數"
    },
    viewDetails: {
        "en": "View details",
        "zh": "顯示詳細數據"
    },
    hideDetails: {
        "en": "Hide details",
        "zh": "隱藏詳細數據"
    },
    ongoing: {
        "en": "Ongoing",
        "zh": "賽事進行中"
    },
    statsbycompseason: {
        "en": "Stats by competition season",
        "zh": "每季賽事數據"
    }

}

export default async function HeroPage({
    params,
}: {
    params: Promise<{ heroSlug: string }>;
}) {
    const { heroSlug: heroSlugParam } = await params;

    const heroes = await prisma.hero.findMany();
    const hero = heroes.find((h) => heroSlug(h.nameEnglish) === heroSlugParam);
    if (!hero) {
        notFound();
    }

    const heroId = hero.id;

    const [picks, bans, lang] = await Promise.all([
        prisma.pick.findMany({
            where: { heroId },
            include: {
                lane: true,
                team: true,
                match: {
                    include: {
                        picks: { include: { hero: true } },
                        series: {
                            include: {
                                stage: true,
                                teamA: true,
                                teamB: true,
                                season: { include: { competition: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma.ban.findMany({
            where: { heroId },
            include: {
                match: {
                    include: {
                        series: { include: { season: { include: { competition: true } } } },
                    },
                },
            },
        }),
        getLanguage(),
    ]);

    const bySeason = new Map<number, SeasonEntry>();

    function getEntry(season: Season): SeasonEntry {
        let entry = bySeason.get(season.id);
        if (!entry) {
            entry = {
                season,
                wins: 0,
                losses: 0,
                bans: 0,
                byPosition: new Map(),
                byTeam: new Map(),
                matchupCounts: new Map(),
                pickRows: [],
            };
            bySeason.set(season.id, entry);
        }
        return entry;
    }

    for (const pick of picks) {
        const entry = getEntry(pick.match.series.season);
        const won = pick.teamId === pick.match.winnerTeamId;
        const side: "blue" | "red" = pick.teamId === pick.match.blueTeamId ? "blue" : "red";

        if (won) {
            entry.wins++;
        } else {
            entry.losses++;
        }

        const laneLabel = pickName(lang, pick.lane.nameEnglish, pick.lane.nameChinese);
        const posRow = entry.byPosition.get(laneLabel) ?? { blue: { w: 0, l: 0 }, red: { w: 0, l: 0 } };
        if (won) {
            posRow[side].w++;
        } else {
            posRow[side].l++;
        }
        entry.byPosition.set(laneLabel, posRow)

        const teamRow = entry.byTeam.get(pick.team.name) ?? { blue: { w: 0, l: 0 }, red: { w: 0, l: 0 } };
        if (won) {
            teamRow[side].w++;
        } else {
            teamRow[side].l++;
        }
        entry.byTeam.set(pick.team.name, teamRow);

        const opposingPick = pick.match.picks.find((p) => p.laneId === pick.laneId && p.teamId !== pick.teamId);
        if (opposingPick) {
            const matchup = entry.matchupCounts.get(opposingPick.heroId) ?? { hero: opposingPick.hero, count: 0, wins: 0, losses: 0 };
            matchup.count++;
            if (won) matchup.wins++;
            else matchup.losses++;
            entry.matchupCounts.set(opposingPick.heroId, matchup);
        }

        const opponentTeam = pick.teamId === pick.match.series.teamAId ? pick.match.series.teamB : pick.match.series.teamA;
        entry.pickRows.push({
            id: pick.id,
            dateLabel: pick.match.series.date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
            dateSortKey: pick.match.series.date.getTime(),
            stageName: pickName(lang, pick.match.series.stage.nameEnglish, pick.match.series.stage.nameChinese),
            stageOrder: pick.match.series.stage.order,
            teamAbbrev: pick.team.abbreviation,
            opponentAbbrev: opponentTeam.abbreviation,
            laneName: pickName(lang, pick.lane.nameEnglish, pick.lane.nameChinese),
            laneOrder: pick.laneId,
            win: won,
            seriesId: pick.match.seriesId,
            gameNumber: pick.match.gameNumber,
        });
    }

    for (const ban of bans) {
        getEntry(ban.match.series.season).bans++;
    }

    const seasons = Array.from(bySeason.values()).sort((a, b) => {
        if (a.season.isOngoing !== b.season.isOngoing) return a.season.isOngoing ? -1 : 1;
        return b.season.year - a.season.year;
    });

    return (
        <main className="w-3/5 mx-auto my-8">
            <section className="space-y-2 mb-16 flex items-start justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl xl:text-3xl font-semibold">{pickName(lang, hero.nameEnglish, hero.nameChinese)}</h1>
                    <p className="text-base xl:text-lg text-gray-200 mt-4">
                        {lang === "zh" ? hero.nameEnglish : hero.nameChinese}
                    </p>
                </div>
                <div>
                    <Image
                        src={`/hero_icons/${hero.nameEnglish.toLowerCase().replace("'","").replace(" ", "")}.jpg`}
                        alt={pickName(lang, hero.nameEnglish, hero.nameChinese)}
                        width={144}
                        height={144}
                        className="rounded-xl"
                    />
                </div>

            </section>

            <h2 className="text-xl xl:text-2xl font-semibold mb-2">{labels.statsbycompseason[lang]}</h2>

            {seasons.length === 0 && <p className="my-8 text-base xl:text-lg text-gray-200">{labels.noRecord[lang]}</p>}

            {seasons.map((entry) => (
                <details
                    key={entry.season.id}
                    open={entry.season.isOngoing}
                    className="mt-3 border-b py-4"
                >
                    <summary className="cursor-pointer font-medium text-lg ">
                        {entry.season.competition.shortCode} {entry.season.year} {entry.season.split ?? ""}
                        {entry.season.isOngoing && (
                            <span className="mx-4 rounded-full bg-green-100 px-2 py-0.5 text-sm text-green-700">
                                {labels.ongoing[lang]}
                            </span>
                        )}
                    </summary>

                    <div className="mt-2 mx-4 text-gray-300">
                        <p>{labels.totalpicks[lang]}: {entry.wins + entry.losses}</p>
                        <p>{labels.winrate[lang]}: {(entry.wins / (entry.wins + entry.losses) * 100).toFixed(2)}%</p>
                        <p>{labels.bans[lang]}: {entry.bans}</p>
                    </div>

                    <details className="group mt-2 mx-2">
                        <summary className="cursor-pointer text-gray-400 text-sm">
                            <span className="group-open:hidden">{labels.viewDetails[lang]}</span>
                            <span className="hidden group-open:inline">{labels.hideDetails[lang]}</span>
                        </summary>

                        <div className="mt-4 mb-16">
                            <h4 className="text-sm font-bold">{labels.byLane[lang]}</h4>
                            <StatTable
                                rows={Array.from(entry.byPosition.entries()).map(([label, v]) => ({ label, ...v })).sort((a, b) => totalGames(b) - totalGames(a) || totalWins(b) - totalWins(a))}
                                lang={lang}
                            />
                        </div>

                        <div className="mb-16">
                            <h4 className="text-sm font-bold">{labels.byTeam[lang]}</h4>
                            <StatTable
                                rows={Array.from(entry.byTeam.entries()).map(([label, v]) => ({ label, ...v })).sort((a, b) => totalGames(b) - totalGames(a) || totalWins(b) - totalWins(a))}
                                lang={lang}
                            />
                        </div>

                        <div className="mb-16">
                            <h4 className="text-sm font-bold">{labels.frequentMatchups[lang]}</h4>
                            <MatchupTable
                                rows={Array.from(entry.matchupCounts.values()).sort((a, b) => b.count - a.count || b.wins - a.wins).slice(0, 3)}
                                lang={lang}
                            />
                        </div>

                        <div className="mb-16">
                            <h4 className="text-sm font-bold mb-2">{labels.allPicks[lang]}</h4>
                            <PickHistoryTable rows={entry.pickRows} lang={lang} />
                        </div>
                    </details>
                </details>
            ))}
        </main>
    );
}

function MatchupTable({ rows, lang }: { rows: MatchupEntry[]; lang: Language }) {
    if (rows.length === 0) {
        return <p className="mt-1 text-sm text-gray-500">No data yet.</p>;
    }
    return (
        <table className="mt-1 w-full">
            <thead>
                <tr className="text-left">
                    <th className="font-normal w-3/5 lg:w-3/4"></th>
                    <th className="font-normal text-gray-400">{labels.picks[lang]}</th>
                    <th className="font-normal text-gray-400">{labels.wl[lang]}</th>
                    <th className="font-normal text-gray-400">{labels.winrate[lang]}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.hero.id} className="border-t border-dashed border-gray-700">
                        <td className="py-1">
                            <Link href={`/heroes/${heroSlug(row.hero.nameEnglish)}`} className="hover:underline">
                                {pickName(lang, row.hero.nameEnglish, row.hero.nameChinese)}
                            </Link>
                        </td>
                        <td className="py-1">{row.count}</td>
                        <td className="py-1">{row.wins}-{row.losses}</td>
                        <td className="py-1">{Math.round((row.wins / row.count) * 100)}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function StatTable({ rows, lang }: { rows: StatRow[]; lang: Language }) {
    const totalBlue = sum(rows.map((row) => row.blue));
    const totalRed = sum(rows.map((row) => row.red));

    return (
        <table className="mt-1 w-full">
            <thead>
                <tr className="text-left">
                    <th className="font-normal w-1/2 lg:w-3/4"></th>
                    <th className="font-normal text-blue-400">{labels.blue[lang]}</th>
                    <th className="font-normal text-red-400">{labels.red[lang]}</th>
                    <th className="font-normal  text-gray-400">{labels.total[lang]}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.label} className="border-t border-dashed border-gray-700">
                        <td className="py-1">{row.label}</td>
                        <td className="py-1">{fmt(row.blue)}</td>
                        <td className="py-1">{fmt(row.red)}</td>
                        <td className="py-1">{fmt(sum([row.blue, row.red]))}</td>
                    </tr>
                ))}
                <tr className="border-t border-gray-500 font-semibold">
                    <td className="py-1 text-sm text-green-500"></td>
                    <td className="py-1">{fmt(totalBlue)}</td>
                    <td className="py-1">{fmt(totalRed)}</td>
                    <td className="py-1">{fmt(sum([totalBlue, totalRed]))}</td>
                </tr>
            </tbody>
        </table>
    );
}

function sum(records: WL[]): WL {
    return records.reduce((acc, r) => ({ w: acc.w + r.w, l: acc.l + r.l }), { w: 0, l: 0 });
}

function fmt(record: WL) {
    return `${record.w}-${record.l}`;
}

function totalGames(row: { blue: WL; red: WL }) {
    const combined = sum([row.blue, row.red]);
    return combined.w + combined.l;
}

function totalWins(row: { blue: WL; red: WL }) {
    return row.blue.w + row.red.w;
}
