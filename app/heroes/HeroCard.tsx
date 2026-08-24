import Image from "next/image";

// nameEnglish drives the icon filename lookup and must always stay the English name,
// regardless of display language — icon files on disk are named from English only.
// displayName is the only thing the language toggle should affect.
export function HeroCard({ nameEnglish, displayName }: { nameEnglish: string; displayName: string }) {

    return (
        <div className="flex flex-col gap-2 items-center justify-center">
            <Image
                src={`/hero_icons/${nameEnglish.toLowerCase().replace("'","").replace(" ", "")}.jpg`}
                alt={displayName}
                width={100}
                height={100}
            />
            <p className="text-center text-md">{displayName}</p>
        </div>

    )

}