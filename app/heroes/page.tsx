import { prisma } from "@/lib/prisma";
import { HeroBrowser } from "./HeroBrowser";

const CLASS_ORDER = ["All", "Tank", "Warrior", "Assassin", "Mage", "Marksman", "Support"];

export default async function HeroesPage() {
    const heroes = await prisma.hero.findMany({ orderBy: { nameEnglish: "asc" } });

    const byClass = CLASS_ORDER.map((cls) => ({
        cls,
        heroes: cls === "All" ? heroes : heroes.filter((hero) => hero.class === cls.toUpperCase()),        
    }));

    return (
        <main className="w-4/5 mx-auto my-8">
            <h1 className="text-xl font-semibold">Heroes</h1>
            <HeroBrowser byClass={byClass} />
        </main>
    );
}
