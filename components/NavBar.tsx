import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminMode } from "@/lib/admin";
import { getLanguage } from "@/lib/getLanguage";
import { heroSlug } from "@/lib/heroSlug";
import { seasonSlug } from "@/lib/seasonSlug";
import type { SearchItem } from "@/lib/search";
import { LanguageToggle } from "./LanguageToggle";
import { SearchBar } from "./SearchBar";
import { MobileMenu } from "./MobileMenu";

const LINKS = [
    //{ href: "/competitions", label: "Competitions" },
    { href: "/teams", label: "Teams", labelChinese: "隊伍" },
    { href: "/heroes", label: "Heroes", labelChinese: "英雄" },
    { href: "/series/new", label: "New series", labelChinese: "新增對局", adminOnly: true },
];

const labels = {
    competitions: {
        "en": "Competitions",
        "zh": "賽事"
    },

}

export async function NavBar() {
    const [competitions, heroes, teams, seasons] = await Promise.all([
        prisma.competition.findMany({
            select: { name: true, shortCode: true },
            orderBy: { name: "desc" },
        }),
        prisma.hero.findMany({
            select: { id: true, nameEnglish: true, nameChinese: true },
        }),
        prisma.team.findMany({
            select: { id: true, name: true, abbreviation: true },
        }),
        prisma.season.findMany({
            select: {
                id: true,
                year: true,
                split: true,
                competition: { select: { name: true, shortCode: true } },
            },
        }),
    ]);
    const links = LINKS.filter((link) => !link.adminOnly || isAdminMode());
    const lang = await getLanguage();

    const searchItems: SearchItem[] = [
        ...heroes.map((h): SearchItem => ({
            id: `hero-${h.id}`,
            type: "hero",
            labelEnglish: h.nameEnglish,
            labelChinese: h.nameChinese,
            keywords: "",
            href: `/heroes/${heroSlug(h.nameEnglish)}`,
        })),
        ...teams.map((t): SearchItem => ({
            id: `team-${t.id}`,
            type: "team",
            labelEnglish: t.name,
            labelChinese: t.name,
            keywords: t.abbreviation.toLowerCase(),
            href: `/teams/${t.abbreviation}`,
        })),
        ...competitions.map((c): SearchItem => ({
            id: `competition-${c.shortCode}`,
            type: "competition",
            labelEnglish: c.name,
            labelChinese: c.name,
            keywords: c.shortCode.toLowerCase(),
            href: `/competitions/${c.shortCode}`,
        })),
        ...seasons.map((s): SearchItem => ({
            id: `season-${s.id}`,
            type: "season",
            labelEnglish: `${s.competition.name} ${s.year}${s.split ? ` ${s.split}` : ""}`,
            labelChinese: `${s.competition.name} ${s.year}${s.split ? ` ${s.split}` : ""}`,
            keywords: `${s.competition.shortCode.toLowerCase()} ${s.year}`,
            href: `/competitions/${s.competition.shortCode}/${seasonSlug(s)}`,
        })),
    ];

    return (
        <nav className="relative border-b border-white/60 px-6 py-4 flex items-center gap-8 bg-[#2d2d2d]">
            <Link href="/" className="font-semibold text-lg">
                AOV Pro League Database
            </Link>

            <div className="hidden md:flex items-center gap-8">
                <div className="group relative">
                    <span className="cursor-pointer text-gray-400 hover:text-white/80">{labels.competitions[lang]}</span>
                    <div className="hidden group-hover:block absolute bg-[#131313] p-2 w-60">
                        <ul className="flex flex-col space-y-4">
                            {competitions.map((c) => (
                            <Link
                                key={c.shortCode}
                                href={`/competitions/${c.shortCode}`}
                                className="text-gray-500 hover:text-white/90"
                            >
                                <li>
                                    {c.name} ({c.shortCode})
                                </li>
                            </Link>
                        ))}
                        </ul>

                    </div>
                </div>
                <div className="space-x-8">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className="text-gray-400 hover:text-white/80">
                            {lang === "en" ? link.label : link.labelChinese}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="hidden md:flex items-center gap-4 ml-auto">
                <SearchBar items={searchItems} lang={lang} className="w-56" />
                <LanguageToggle current={lang} />
            </div>

            <div className="md:hidden ml-auto">
                <MobileMenu
                    links={links}
                    competitions={competitions}
                    competitionsLabel={labels.competitions[lang]}
                    searchItems={searchItems}
                    lang={lang}
                />
            </div>
        </nav>
    );
}
