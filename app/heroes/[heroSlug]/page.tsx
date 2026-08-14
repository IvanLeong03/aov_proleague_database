import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { heroSlug } from "@/lib/heroSlug";
import Image from "next/image";

type WL = { w: number; l: number };
type StatRow = { label: string; blue: WL; red: WL };

type Season = {
    id: number;
    year: number;
    split: string | null;
    isOngoing: boolean;
    competition: { id: number; name: string };
};

type SeasonEntry = {
    season: Season;
    wins: number;
    losses: number;
    bans: number;
    byPosition: Map<string, { blue: WL; red: WL }>;
    byTeam: Map<string, { blue: WL; red: WL }>;
};

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

    const [picks, bans] = await Promise.all([
        prisma.pick.findMany({
            where: { heroId },
            include: {
                lane: true,
                team: true,
                match: {
                    include: {
                        series: { include: { season: { include: { competition: true } } } },
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

        const posRow = entry.byPosition.get(pick.lane.nameEnglish) ?? { blue: { w: 0, l: 0 }, red: { w: 0, l: 0 } };
        if (won) {
            posRow[side].w++;
        } else {
            posRow[side].l++;
        }
        entry.byPosition.set(pick.lane.nameEnglish, posRow)

        const teamRow = entry.byTeam.get(pick.team.name) ?? { blue: { w: 0, l: 0 }, red: { w: 0, l: 0 } };
        if (won) {
            teamRow[side].w++;
        } else {
            teamRow[side].l++;
        }
        entry.byTeam.set(pick.team.name, teamRow);
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
                    <h1 className="text-xl lg:text-2xl font-semibold">{hero.nameEnglish}</h1>
                    <p className="text-base text-gray-200 mt-4">
                        {hero.nameChinese}
                    </p>
                    <p className="text-base text-gray-200 my-4">
                        Class: {hero.class.slice(0, 1)}{hero.class.slice(1, ).toLowerCase()}
                    </p>
                </div>
                <div>
                    <Image
                        src={`/hero_icons/${hero.nameEnglish.toLowerCase().replace("'","").replace(" ", "")}.jpg`}
                        alt={hero.nameEnglish}
                        width={144}
                        height={144}
                        className="rounded-xl"
                    />
                </div>

            </section>


            {seasons.length === 0 && <p className="mt-4 text-lg text-gray-200">No picks or bans recorded yet.</p>}

            {seasons.map((entry) => (
                <details
                    key={entry.season.id}
                    open={entry.season.isOngoing}
                    className="mt-3 border-b py-4"
                >
                    <summary className="cursor-pointer font-medium text-lg">
                        {entry.season.competition.name} {entry.season.year} {entry.season.split ?? ""}
                        {entry.season.isOngoing && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                Ongoing
                            </span>
                        )}

                    </summary>

                    <div className="mt-2 mx-4 text-gray-300">
                        <p>Total picks: {entry.wins + entry.losses} ({entry.wins}W {entry.losses}L)</p>
                        <p>Bans: {entry.bans}</p>
                    </div>

                    <details className="group mt-2 mx-2">
                        <summary className="cursor-pointer text-gray-400">
                            <span className="group-open:hidden">View detailed statistics</span>
                            <span className="hidden group-open:inline">Hide detailed statistics</span>
                        </summary>

                        <div className="mt-3">
                            <h4 className="text-sm font-medium">By position</h4>
                            <StatTable
                                rows={Array.from(entry.byPosition.entries()).map(([label, v]) => ({ label, ...v })).sort((a, b) => totalGames(b) - totalGames(a) || totalWins(b) - totalWins(a))}
                            />
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-medium">By team</h4>
                            <StatTable
                                rows={Array.from(entry.byTeam.entries()).map(([label, v]) => ({ label, ...v })).sort((a, b) => totalGames(b) - totalGames(a) || totalWins(b) - totalWins(a))}
                            />
                        </div>
                    </details>
                </details>
            ))}
        </main>
    );
}

function StatTable({ rows }: { rows: StatRow[] }) {
    const totalBlue = sum(rows.map((row) => row.blue));
    const totalRed = sum(rows.map((row) => row.red));

    return (
        <table className="mt-1 w-full">
            <thead>
                <tr className="text-left">
                    <th className="font-normal w-3/5 lg:w-3/4"></th>
                    <th className="font-normal text-blue-400">Blue</th>
                    <th className="font-normal text-red-400">Red</th>
                    <th className="font-normal  text-gray-400">Total</th>
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
                    <td className="py-1 text-sm text-yellow-400">Total</td>
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
