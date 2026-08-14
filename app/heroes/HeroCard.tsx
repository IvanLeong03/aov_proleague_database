import Image from "next/image";

export function HeroCard({name} : {name: string}) {

    return (
        <div className="flex flex-col gap-2 items-center justify-center">
            <Image
                src={`/hero_icons/${name.toLowerCase().replace("'","").replace(" ", "")}.jpg`}
                alt={name}
                width={100}
                height={100}
            />
            <p className="text-center text-md">{name}</p>
        </div>
        
    )

}