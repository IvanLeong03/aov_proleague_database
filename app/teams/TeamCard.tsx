import Image from "next/image";

export function TeamCard({ teamName, teamAbbrev }: { teamName: string, teamAbbrev: string}) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-500/60 pt-4">
            <div className="relative w-full h-48">
                <Image
                    src={`/team_logos/${teamAbbrev}.png`}
                    alt={teamName}
                    fill
                    className="object-contain"
                />
            </div>
            <div className="w-full bg-gray-900 text-center py-1 rounded-b-xl">
                {teamName} ({teamAbbrev})
            </div>
        </div>
    )

}