import Image from "next/image";

export function TeamCard({ teamName, teamAbbrev }: { teamName: string, teamAbbrev: string}) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-xl">
            <div className="relative w-full h-48">
                <Image
                    src={`/team_logos/${teamAbbrev}.png`}
                    alt={teamName}
                    fill
                    className="object-contain hover:scale-105"
                />
            </div>

            <p>{teamName} ({teamAbbrev})</p>
        </div>
    )

}