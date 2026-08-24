import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seasonSlug } from "@/lib/seasonSlug";
import { getLanguage } from "@/lib/getLanguage";

export default async function CompetitionPage({
    params,
}: {
    params: Promise<{ competitionId: string }>;
}) {
    const { competitionId } = await params;
    const lang = await getLanguage();

    const competition = await prisma.competition.findUnique({
        where: { shortCode: competitionId },
        include: {
            seasons: {
                orderBy: [{ isOngoing: "desc" }, { year: "desc" }],
            },
        },
    });

    if (!competition) {
        notFound();
    }

    const labels = {
        seasons: {
            "en": "Seasons",
            "zh": "賽季"
        },
        ongoing: {
            "en": "Ongoing",
            "zh": "賽事進行中"
        }
    }

    return (
        <main className="w-4/5 mx-auto my-16">
            <h1 className="text-xl xl:text-2xl font-medium">{competition.name} ({competition.shortCode})</h1>
            <p className="mt-1 text-gray-400">{competition.region}</p>

            { competition.seasons.length > 0 && (
                <h2 className=" mt-8 mb-2 text-lg xl:text-xl">{labels.seasons[lang]}</h2>
            )}
            <ul className="space-y-2">                
                {competition.seasons.map((season) => (
                    <li key={season.id}>
                        <Link
                            href={`/competitions/${competition.shortCode}/${seasonSlug(season)}`}
                            className="flex items-center justify-between rounded-2xl p-4 bg-gray-500 hover:bg-gray-600"
                        >
                            <span className="text-lg font-medium">
                                {competition.shortCode} {season.year} {season.split ?? ""}
                            </span>
                            {season.isOngoing && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs xl:text-sm text-green-700">
                                    {labels.ongoing[lang]}
                                </span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
