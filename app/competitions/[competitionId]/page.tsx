import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seasonSlug } from "@/lib/seasonSlug";

export default async function CompetitionPage({
    params,
}: {
    params: Promise<{ competitionId: string }>;
}) {
    const { competitionId } = await params;

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

    return (
        <main className="w-4/5 mx-auto my-8">
            <h1 className="text-xl xl:text-2xl font-medium">{competition.name}</h1>
            <p className="mt-1 text-gray-400">{competition.region}</p>

            <ul className="mt-4 space-y-1">
                { competition.seasons.length > 0 && (
                    <h2 className="text-lg xl:text-xl">Seasons</h2>
                )}
                {competition.seasons.map((season) => (
                    <li key={season.id}>
                        <Link
                            href={`/competitions/${competition.shortCode}/${seasonSlug(season)}`}
                            className="flex items-center justify-between rounded-2xl p-4 bg-gray-500 hover:bg-gray-600"
                        >
                            <span className="text-lg font-medium">
                                {season.year} {season.split ?? ""}
                            </span>
                            {season.isOngoing && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                    Ongoing
                                </span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
