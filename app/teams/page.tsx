import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TeamCard } from "./TeamCard";
import { getLanguage } from "@/lib/getLanguage";

const REGION_ORDER = ["Taiwan", "Thailand", "Vietnam"];
const labels = {
    teams: {
        "en": "Teams",
        "zh": "參賽隊伍"
    },
    other: {
        "en": "Other region",
        "zh": "其他賽區"
    }
}

export default async function TeamsPage() {
    const teams = await prisma.team.findMany({
        orderBy: { name: "asc" },
    });

    const byRegion = REGION_ORDER.map((region) => ({
        region,
        teams: teams.filter((team) => team.region === region),
    }));

    const otherTeams = teams.filter((team) => !REGION_ORDER.includes(team.region));

    const regionToLeague: Record<string, string> = {
        "Taiwan": "(GCS)",
        "Thailand": "(RPL)",
        "Vietnam": "(AOG)"
    };

    const lang = await getLanguage();

    return (
        <main className="w-4/5 mx-auto my-16">
            <h1 className="text-xl xl:text-2xl font-bold mb-8">{labels.teams[lang]}</h1>

            {byRegion.map(({ region, teams: regionTeams }) => (
                <section key={region} className="mb-24">
                    <h2 className="text-lg font-semibold text-gray-400/80">{region} {regionToLeague[region]}</h2>
                    <ul className="my-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {regionTeams.map((team) => (
                            <li key={team.id}>
                                <Link
                                    href={`/teams/${team.abbreviation}`}
                                    className="block mx-auto"
                                >
                                    <TeamCard teamName={team.name} teamAbbrev={team.abbreviation}/>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {otherTeams.length > 0 && (
                <section className="mt-6">
                    <h2 className="text-sm font-medium text-gray-500">{labels.other[lang]}</h2>
                    <ul className="mt-2 space-y-1">
                        {otherTeams.map((team) => (
                            <li key={team.id}>
                                <Link
                                    href={`/teams/${team.abbreviation}`}
                                    className="block rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
                                >
                                    {team.name}
                                    <span className="ml-2 text-gray-500">{team.region}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </main>
    );
}
