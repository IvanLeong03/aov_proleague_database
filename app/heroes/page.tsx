import { prisma } from "@/lib/prisma";
import { HeroBrowser } from "./HeroBrowser";
import { getLanguage } from "@/lib/getLanguage";

const CLASS_ORDER = ["All", "Tank", "Warrior", "Assassin", "Mage", "Marksman", "Support"];
const labels = {
    heroes: {
        "en": "Heroes",
        "zh": "英雄"
    }
};

export default async function HeroesPage() {
    const [heroes, lang] = await Promise.all([
        prisma.hero.findMany({ orderBy: { nameEnglish: "asc" } }),
        getLanguage(),
    ]);

    const byClass = CLASS_ORDER.map((cls) => ({
        cls,
        heroes: cls === "All" ? heroes : heroes.filter((hero) => hero.class === cls.toUpperCase()),
    }));

    return (
        <main className="w-4/5 mx-auto my-16">
            <h1 className="text-xl xl:text-2xl font-bold">{labels.heroes[lang]}</h1>
            <HeroBrowser byClass={byClass} lang={lang} />
        </main>
    );
}
