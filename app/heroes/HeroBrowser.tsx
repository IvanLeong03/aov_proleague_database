// app/heroes/HeroBrowser.tsx ('use client', not async, holds the state)
"use client";

import { useState } from "react";
import Link from "next/link";
import { HeroCard } from "./HeroCard";
import { heroSlug } from "@/lib/heroSlug";
import { pickName, type Language } from "@/lib/language";
import { classLabel } from "@/lib/heroClass";

type Hero = { id: number; nameEnglish: string; nameChinese: string };
type ClassGroup = { cls: string; heroes: Hero[] };

export function HeroBrowser({ byClass, lang }: { byClass: ClassGroup[]; lang: Language }) {
    const [selected, setSelected] = useState("All");
    const active = byClass.find((group) => group.cls === selected)!;

    return (
        <div>
            <div className="py-4 flex flex-wrap gap-x-6 gap-y-2 md:gap-x-8">
                {byClass.map((group) => (
                    <button
                        key={group.cls}
                        onClick={() => setSelected(group.cls)}
                        className={`py-1 whitespace-nowrap hover:text-white ${selected === group.cls ? "text-teal-400 border-b-2 border-teal-400" : "text-white/80"}`}
                    >
                        {classLabel(lang, group.cls)}
                    </button>
                ))}
            </div>
            <div className="my-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {active.heroes.map((hero) => (                    
                    <Link 
                        key={hero.id} 
                        href={`/heroes/${heroSlug(hero.nameEnglish)}`}
                        className="rounded-2xl p-8 border border-black"
                    >
                        <HeroCard nameEnglish={hero.nameEnglish} displayName={pickName(lang, hero.nameEnglish, hero.nameChinese)} />
                    </Link>                    
                ))}
            </div>
        </div>
    );
}