import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pickName } from "@/lib/language";
import { getLanguage } from "@/lib/getLanguage";
import { seasonSlug } from "@/lib/seasonSlug";

const labels = {
    tagline: {
        en: "Stats, standings, and match history for Arena of Valor's pro competitions.",
        zh: "傳說對決職業聯賽的數據、排名與對戰記錄",
    },
    ongoing: { en: "Active competitions", zh: "進行中賽事" },
    ongoingBadge: { en: "Ongoing", zh: "進行中" },
    noOngoing: { en: "No ongoing seasons right now.", zh: "目前沒有進行中的賽季" },
    recentResults: { en: "Recent results", zh: "近期賽果" },
    noResults: { en: "No results yet.", zh: "尚無賽果" },
    browse: { en: "Browse", zh: "瀏覽" },
    teams: { en: "Teams", zh: "隊伍" },
    teamsDesc: { en: "Every team's record and match history across all competitions.", zh: "查看各隊伍在所有賽事中的戰績與對戰記錄" },
    heroes: { en: "Heroes", zh: "英雄" },
    heroesDesc: { en: "Pick rates, ban rates, and stats by lane and matchup.", zh: "查看英雄的選用率、禁用率及各路線對戰數據" },
    competitions: { en: "Competitions", zh: "賽事" },
    competitionsDesc: { en: "Standings, champions, and playoff results by season.", zh: "查看各賽季的排名、冠軍與季後賽結果" },
    pageTitle: {
        en: "AOV Pro League Database",
        zh: "傳說對決職業電競資料庫"
    }
};

export default async function Home() {
    const ongoingSeasons = await prisma.season.findMany({
        where: { isOngoing: true },
        include: { competition: true },
        orderBy: { competition: { name: "asc" } },
    });

    // When a competition is actively running, "recent results" should only show that
    // competition's games — otherwise the most recent games from any competition
    // (which could be months-old, finished competitions) would crowd out the live one.
    const [recentSeries, competitions, lang] = await Promise.all([
        prisma.series.findMany({
            where: {
                matches: { some: {} },
                ...(ongoingSeasons.length > 0 ? { season: { isOngoing: true } } : {}),
            },
            include: {
                stage: true,
                teamA: true,
                teamB: true,
                matches: true,
                season: { include: { competition: true } },
            },
            orderBy: [{ date: "desc" }, { id: "desc" }],
            take: 5,
        }),
        prisma.competition.findMany({
            select: { name: true, shortCode: true },
            orderBy: { name: "asc" },
        }),
        getLanguage(),
    ]);

    return (
        <main className="w-9/10 md:w-4/5 mx-auto my-16">
            <h1 className="text-2xl md:text-3xl font-semibold">{labels.pageTitle[lang]}</h1>
            <p className="mt-2 text-sm xl:text-base text-gray-400/80">{labels.tagline[lang]}</p>

            <section className="my-8">
                <h2 className="text-lg font-bold">{labels.ongoing[lang]}</h2>
                {ongoingSeasons.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">{labels.noOngoing[lang]}</p>
                ) : (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ongoingSeasons.map((season) => (
                            <Link
                                key={season.id}
                                href={`/competitions/${season.competition.shortCode}/${seasonSlug(season)}`}
                                className="rounded-xl bg-gray-800 px-4 py-3 hover:bg-gray-700"
                            >
                                <p className="font-medium">
                                    {season.competition.name} {season.year} {season.split ?? ""}
                                </p>
                                <span className="mt-1 inline-block rounded-full bg-green-200 px-3 py-1 text-sm xl:text-base text-green-700">
                                    {labels.ongoingBadge[lang]}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="my-8">
                <h2 className="text-lg font-bold">{labels.recentResults[lang]}</h2>
                {recentSeries.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">{labels.noResults[lang]}</p>
                ) : (
                    <ul className="mt-4 space-y-4">
                        {recentSeries.map((s) => {
                            const aWins = s.matches.filter((m) => m.winnerTeamId === s.teamAId).length;
                            const bWins = s.matches.filter((m) => m.winnerTeamId === s.teamBId).length;
                            return (
                                <li key={s.id}>
                                    <Link
                                        href={`/competitions/${s.season.competition.shortCode}/series/${s.id}`}
                                        className="flex justify-between items-center gap-2 rounded-xl px-4 py-2 xl:py-3 text-sm xl:text-base bg-gray-600 hover:bg-gray-700"
                                    >
                                        <span>
                                            <span className={aWins > bWins ? "font-bold" : "brightness-75"}>{s.teamA.name}</span>
                                            <span className="mx-2 tracking-wider">
                                                {aWins}:{bWins}
                                            </span>
                                            <span className={bWins > aWins ? "font-bold" : "brightness-75"}>{s.teamB.name}</span>
                                        </span>
                                        <span className="text-gray-300 grid grid-cols-1 whitespace-nowrap">
                                            <span>{s.season.competition.shortCode}</span>
                                            <span>{pickName(lang, s.stage.nameEnglish, s.stage.nameChinese)}</span>
                                            <span>{s.date.toISOString().slice(5, 10)}</span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="mt-24">
                <h2 className="text-lg font-bold">{labels.browse[lang]}</h2>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/teams" className="rounded-xl bg-gray-800 px-4 py-4 hover:bg-gray-700">
                        <p className="font-medium">{labels.teams[lang]}</p>
                        <p className="mt-1 text-sm text-gray-400">{labels.teamsDesc[lang]}</p>
                    </Link>
                    <Link href="/heroes" className="rounded-xl bg-gray-800 px-4 py-4 hover:bg-gray-700">
                        <p className="font-medium">{labels.heroes[lang]}</p>
                        <p className="mt-1 text-sm text-gray-400">{labels.heroesDesc[lang]}</p>
                    </Link>
                    <div className="rounded-xl bg-gray-800 px-4 py-4">
                        <p className="font-medium">{labels.competitions[lang]}</p>
                        <p className="mt-1 text-sm text-gray-400">{labels.competitionsDesc[lang]}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {competitions.map((c) => (
                                <Link
                                    key={c.shortCode}
                                    href={`/competitions/${c.shortCode}`}
                                    className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-200 hover:bg-gray-600"
                                >
                                    {c.name} ({c.shortCode})
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
