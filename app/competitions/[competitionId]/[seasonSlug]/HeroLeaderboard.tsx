import Link from "next/link";
import { heroSlug } from "@/lib/heroSlug";
import { pickName, type Language } from "@/lib/language";

const labels = {
    noData: {
        "en": "No data yet",
        "zh": "未有數據"
    }
}

export function HeroLeaderboard({
    rows,
    lang,
}: {
    rows: { hero: { id: number; nameEnglish: string; nameChinese: string }; count: number }[];
    lang: Language;
}) {
    if (rows.length === 0) {
        return <p className="my-8 text-gray-500">{labels.noData[lang]}</p>;
    }
    return (
        <ol className="mt-1 space-y-1">
            {rows.map((row, i) => (
                <li key={row.hero.id} className="flex justify-between text-lg">
                    <span>
                        {i + 1}.{" "}
                        <Link href={`/heroes/${heroSlug(row.hero.nameEnglish)}`} className="hover:underline">
                            {pickName(lang, row.hero.nameEnglish, row.hero.nameChinese)}
                        </Link>
                    </span>
                    <span className="text-gray-400">{row.count}</span>
                </li>
            ))}
        </ol>
    );
}
