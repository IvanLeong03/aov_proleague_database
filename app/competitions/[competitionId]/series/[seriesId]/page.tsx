import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddMatchForm } from "./AddMatchForm";
import { deleteMatch, deleteSeries } from "./actions";

export default async function SeriesPage({
    params,
    }: {
    params: Promise<{ competitionId: string; seriesId: string }>;
    }) {
    const { competitionId, seriesId } = await params;

    const series = await prisma.series.findUnique({
        where: { id: Number(seriesId) },
        include: {
            season: { include: { competition: true } },
            stage: true,
            teamA: true,
            teamB: true,
            matches: {
                orderBy: { gameNumber: "asc" },
                include: {
                    winnerTeam: true,
                    blueTeam: true,
                    redTeam: true,
                    picks: { include: { hero: true, lane: true }, orderBy: { pickOrder: "asc" } },
                    bans: { include: { hero: true }, orderBy: { banOrder: "asc" } },
                },
            },
        },
    });

    if (!series) {
        notFound();
    }

    const [heroes, lanes] = await Promise.all([
        prisma.hero.findMany({ orderBy: { nameEnglish: "asc" } }),
        prisma.lane.findMany({ orderBy: { id: "asc" } }),
    ]);

    const nextGameNumber =
        series.matches.length === 0 ? 1 : Math.max(...series.matches.map((match) => match.gameNumber)) + 1;

    return (
        <main className="w-4/5 mx-auto my-8">
            <h1 className="text-xl font-medium">
                {series.teamA.name} vs {series.teamB.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
                {series.season.competition.name} &middot; {series.season.year} {series.season.split ?? ""} &middot;{" "}
                {series.stage.nameEnglish} &middot; {series.date.toISOString().slice(0, 10)}
            </p>

            <h2 className="mt-6 text-lg font-medium">Saved matches</h2>
            {series.matches.length === 0 && <p className="mt-2 text-sm text-gray-500">No matches saved yet.</p>}
            <ul className="mt-2 space-y-1">
                {series.matches.map((match) => (
                    <li key={match.id} className="rounded-lg border px-3 py-2 text-sm">
                        <div className="flex items-start justify-between">
                            <details className="flex-1">
                                <summary className="cursor-pointer">
                                    Game {match.gameNumber} — {match.winnerTeam.name} won
                                </summary>
                                <MatchDetails match={match} lanes={lanes} />
                            </details>
                            <form action={deleteMatch.bind(null, match.id, series.id, competitionId)}>
                                <button type="submit" className="ml-2 top-0 text-sm text-red-400 hover:underline">
                                    Delete
                                </button>
                            </form>
                        </div>
                    </li>
                ))}
            </ul>

            <AddMatchForm
                seriesId={series.id}
                teamA={series.teamA}
                teamB={series.teamB}
                nextGameNumber={nextGameNumber}
                heroes={heroes}
                lanes={lanes}
            />

            <div className="mt-8 border-t pt-4">
                <form action={deleteSeries.bind(null, series.id, competitionId)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                        Delete series
                    </button>
                </form>
            </div>
        </main>
    );
}

function MatchDetails({
    match,
    lanes,
}: {
    match: {
        blueTeamId: number;
        redTeamId: number;
        blueTeam: { name: string };
        redTeam: { name: string };
        picks: { teamId: number; laneId: number; hero: { nameEnglish: string } }[];
        bans: { teamId: number; hero: { nameEnglish: string } }[];
    };
    lanes: { id: number; nameEnglish: string }[];
}) {
    const bluePicks = match.picks.filter((pick) => pick.teamId === match.blueTeamId);
    const redPicks = match.picks.filter((pick) => pick.teamId === match.redTeamId);
    const blueBans = match.bans.filter((ban) => ban.teamId === match.blueTeamId);
    const redBans = match.bans.filter((ban) => ban.teamId === match.redTeamId);

    return (
        <div className="mt-3 space-y-4">
            <div>
                <div className="grid grid-cols-[1fr_auto_1fr] text-xs font-medium text-gray-500">
                    <span>{match.blueTeam.name} (blue)</span>
                    <span />
                    <span className="text-right">{match.redTeam.name} (red)</span>
                </div>
                {lanes.map((lane) => {
                    const bluePick = bluePicks.find((pick) => pick.laneId === lane.id);
                    const redPick = redPicks.find((pick) => pick.laneId === lane.id);
                    return (
                        <div key={lane.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-0.5 text-sm">
                            <span>{bluePick?.hero.nameEnglish ?? "-"}</span>
                            <span className="text-xs text-gray-500">{lane.nameEnglish}</span>
                            <span className="text-right">{redPick?.hero.nameEnglish ?? "-"}</span>
                        </div>
                    );
                })}
            </div>

            <div>
                <p className="text-xs font-medium text-gray-500">Bans</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>{blueBans.map((ban) => ban.hero.nameEnglish).join(", ") || "-"}</span>
                    <span className="text-right">{redBans.map((ban) => ban.hero.nameEnglish).join(", ") || "-"}</span>
                </div>
            </div>
        </div>
    );
}
