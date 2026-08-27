import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminMode } from "@/lib/admin";
import { pickName, type Language } from "@/lib/language";
import { getLanguage } from "@/lib/getLanguage";
import { AddMatchForm } from "./AddMatchForm";
import { deleteMatch, deleteSeries } from "./actions";
import Image from "next/image";
import Link from "next/link";
import { heroSlug } from "@/lib/heroSlug";

const labels = {
    won: {
        "en": "wins",
        "zh": "獲勝"
    },
    bans: {
        "en": "Bans",
        "zh": "禁用"
    },
    result: {
        "en": "Result",
        "zh": "賽果"
    },
    blue: {
        "en": "Blue",
        "zh": "藍方"
    },
    red: {
        "en": "Red",
        "zh": "紅方"
    },
    gameHistory: {
        "en": "Game history",
        "zh": "對局紀錄"
    }
};

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

    const adminMode = isAdminMode();
    const [heroes, lanes, lang] = await Promise.all([
        adminMode ? prisma.hero.findMany({ orderBy: { nameEnglish: "asc" } }) : Promise.resolve([]),
        prisma.lane.findMany({ orderBy: { id: "asc" } }),
        getLanguage(),
    ]);

    const nextGameNumber =
        series.matches.length === 0 ? 1 : Math.max(...series.matches.map((match) => match.gameNumber)) + 1;

    const aWins = series.matches.filter((m) => m.winnerTeamId === series.teamAId).length;
    const bWins = series.matches.filter((m) => m.winnerTeamId === series.teamBId).length;        


    return (
        <main className="w-4/5 mx-auto my-16">
            <h1 className="text-xl xl:text-2xl font-medium">
                {series.teamA.name} vs {series.teamB.name}
            </h1>
            <p className="my-2 text-sm xl:text-base text-gray-400/80">
                {series.season.competition.shortCode} {series.season.year} {series.season.split ?? ""} &middot;{" "}
                {pickName(lang, series.stage.nameEnglish, series.stage.nameChinese)} &middot; {series.date.toISOString().slice(0, 10)}
            </p>
            <p className="text-lg my-4 text-amber-300">
                {labels.result[lang]}: {series.teamA.abbreviation} {aWins} - {bWins} {series.teamB.abbreviation}
            </p>

            <h2 className="mt-16 text-lg font-bold">{labels.gameHistory[lang]}</h2>
            {series.matches.length === 0 && <p className="mt-2 text-sm text-gray-500">No matches saved yet.</p>}
            <ul className="mt-2 divide-y md:divide-y-2 divide-dashed divide-gray-400">
                {series.matches.map((match) => (
                    <li key={match.id} className="px-2 py-3">
                        <div className="flex items-start justify-between">
                            <details className="flex-1">
                                <summary className="cursor-pointer">
                                    Game {match.gameNumber}: {match.winnerTeam.abbreviation} {labels.won[lang]}
                                </summary>
                                <MatchDetails match={match} lanes={lanes} lang={lang} />
                            </details>
                            {adminMode && (
                                <form action={deleteMatch.bind(null, match.id, series.id, competitionId)}>
                                    <button type="submit" className="ml-2 top-0 text-sm text-red-400 hover:underline">
                                        Delete
                                    </button>
                                </form>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {adminMode && (
                <>
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
                </>
            )}
        </main>
    );
}

function MatchDetails({
    match,
    lanes,
    lang,
}: {
    match: {
        blueTeamId: number;
        redTeamId: number;
        blueTeam: { name: string; abbreviation: string };
        redTeam: { name: string; abbreviation: string };
        picks: { teamId: number; laneId: number; hero: { nameEnglish: string; nameChinese: string } }[];
        bans: { teamId: number; hero: { nameEnglish: string; nameChinese: string } }[];
    };
    lanes: { id: number; nameEnglish: string; nameChinese: string }[];
    lang: Language;
}) {
    const bluePicks = match.picks.filter((pick) => pick.teamId === match.blueTeamId);
    const redPicks = match.picks.filter((pick) => pick.teamId === match.redTeamId);
    const blueBans = match.bans.filter((ban) => ban.teamId === match.blueTeamId);
    const redBans = match.bans.filter((ban) => ban.teamId === match.redTeamId);

    return (
        <div className="mt-3 pb-4">
            <div>
                <div className="grid grid-cols-[1fr_auto_1fr] font-medium text-gray-400 my-4 xl:my-8">
                    <div className="tracking-wide font-semibold">
                        {match.blueTeam.abbreviation}
                        <span className="text-blue-500 ml-2">({labels.blue[lang]})</span>
                    </div>
                    <span />
                    <div className="text-right tracking-wide font-semibold">
                        {match.redTeam.abbreviation}
                        <span className="text-red-500 ml-2">({labels.red[lang]})</span>
                    </div>
                </div>
                {lanes.map((lane) => {
                    const bluePick = bluePicks.find((pick) => pick.laneId === lane.id);
                    const redPick = redPicks.find((pick) => pick.laneId === lane.id);
                    return (
                        <div key={lane.id} className="grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_5fr_1fr] items-center gap-2 py-0.5 xl:py-1 mb-4 xl:mb-8">
                            <div className="flex items-center gap-2 justify-start md:justify-between text-sm xl:text-base">
                                {bluePick ? (
                                    <>
                                        <Link href={`/heroes/${heroSlug(bluePick.hero.nameEnglish)}`} className="hover:underline text-base xl:text-lg font-medium">
                                            {pickName(lang, bluePick.hero.nameEnglish, bluePick.hero.nameChinese)}
                                        </Link>
                                        <Image
                                            src={`/hero_icons/${bluePick.hero.nameEnglish.toLowerCase().replace("'","").replace(" ", "")}.jpg`}
                                            alt={bluePick.hero.nameEnglish}
                                            width={60}
                                            height={60}
                                            className="hidden md:block rounded-sm"
                                        />
                                    </>
                                ) : (
                                    "-"
                                )}
                            </div>
                            <span className="text-sm xl:text-base font-medium text-gray-400 text-center whitespace-nowrap">{pickName(lang, lane.nameEnglish, lane.nameChinese)}</span>
                            <div className="flex items-center gap-2 justify-end md:justify-between text-right">
                                {redPick ? (
                                    <>
                                        <Image
                                            src={`/hero_icons/${redPick.hero.nameEnglish.toLowerCase().replace("'","").replace(" ", "")}.jpg`}
                                            alt={redPick.hero.nameEnglish}
                                            width={60}
                                            height={60}
                                            className="hidden md:block rounded-sm"
                                        />
                                        <Link href={`/heroes/${heroSlug(redPick.hero.nameEnglish)}`} className="hover:underline text-right">
                                            {pickName(lang, redPick.hero.nameEnglish, redPick.hero.nameChinese)}
                                        </Link>
                                    </>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4">
                <p className="text-sm font-bold text-amber-300 mb-1 text-center">{labels.bans[lang]}</p>
                <div className="grid grid-cols-2 gap-8 text-sm xl:text-base text-gray-300/80">
                    <span>
                        {blueBans.map((ban) => pickName(lang, ban.hero.nameEnglish, ban.hero.nameChinese)).join(", ") || "-"}
                    </span>
                    <span className="text-right">{redBans.map((ban) => pickName(lang, ban.hero.nameEnglish, ban.hero.nameChinese)).join(", ") || "-"}</span>
                </div>
            </div>
        </div>
    );
}
