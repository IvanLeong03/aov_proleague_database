import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seasonSlug } from "@/lib/seasonSlug";
import { topHeroes } from "@/lib/heroStats";
import { HeroLeaderboard } from "../HeroLeaderboard";
import { getLanguage } from "@/lib/getLanguage";

export default async function SeasonHeroStatsPage({
    params,
    searchParams,
}: {
    params: Promise<{ competitionId: string; seasonSlug: string }>;
    searchParams: Promise<{ stat?: string }>;
}) {
    const { competitionId, seasonSlug: seasonSlugParam } = await params;
    const { stat } = await searchParams;
    const statType = stat === "bans" ? "bans" : "picks";

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
        include: { competition: true },
    });
    if (!season) {
        notFound();
    }

    const lang = await getLanguage();

    const labels = {
        completeRank: {
            "en": "Complete Ranking",
            "zh": "完整排行"
        },
        mostPicks: {
            "en": "Most picks",
            "zh": "選用次數"
        },
        mostBans: {
            "en": "Most bans",
            "zh": "禁用次數"
        }        
    }

    const rows =
        statType === "bans"
            ? topHeroes(
                  await prisma.ban.findMany({
                      where: { match: { series: { seasonId: season.id } } },
                      include: { hero: true },
                  })
              )
            : topHeroes(
                  await prisma.pick.findMany({
                      where: { match: { series: { seasonId: season.id } } },
                      include: { hero: true },
                  })
              );

    return (
        <main className="w-4/5 mx-auto my-16">
            <Link
                href={`/competitions/${season.competition.shortCode}/${seasonSlugParam}`}
                className="text-sm text-gray-500 hover:underline"
            >
                &larr; {season.competition.shortCode} {season.year} {season.split ?? ""}
            </Link>
            <h1 className="mt-1 text-xl font-medium">
                {statType === "bans" ? labels.mostBans[lang] : labels.mostPicks[lang]} &mdash; {labels.completeRank[lang]}
            </h1>
            <div className="mt-6 max-w-md">
                <HeroLeaderboard rows={rows} lang={lang} />
            </div>
        </main>
    );
}
