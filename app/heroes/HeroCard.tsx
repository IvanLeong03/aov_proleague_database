import Image from "next/image";

// nameEnglish drives the icon filename lookup and must always stay the English name,
// regardless of display language — icon files on disk are named from English only.
// displayName is the only thing the language toggle should affect.
export function HeroCard({ nameEnglish, displayName }: { nameEnglish: string; displayName: string }) {

    return (
        <div className="flex flex-col gap-2 items-center justify-center">
            <div className="overflow-hidden">
                <Image
                    src={`/hero_icons/${nameEnglish.toLowerCase().replace("'","").replace(" ", "")}.jpg`}
                    alt={displayName}
                    width={120}
                    height={120}
                    className="object-contain hover:scale-105 transition-transform duration-300"
                />
            </div>
            
            <p className="text-center">{displayName}</p>
        </div>

    )

}