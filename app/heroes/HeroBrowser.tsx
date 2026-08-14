// app/heroes/HeroBrowser.tsx ('use client', not async, holds the state)
"use client";

import { useState } from "react";
import Link from "next/link";
import { HeroCard } from "./HeroCard";
import { heroSlug } from "@/lib/heroSlug";

type Hero = { id: number; nameEnglish: string };
type ClassGroup = { cls: string; heroes: Hero[] };

export function HeroBrowser({ byClass }: { byClass: ClassGroup[] }) {
    const [selected, setSelected] = useState("All");
    const active = byClass.find((group) => group.cls === selected)!;

    return (
        <div>
            <div className="py-4 flex space-x-6 md:space-x-8">
                {byClass.map((group) => (
                    <button 
                        key={group.cls} 
                        onClick={() => setSelected(group.cls)}
                        className={`py-1 hover:text-white ${selected === group.cls ? "text-teal-400 border-b-2 border-teal-400" : "text-white/80"}`}
                    >
                        {group.cls}
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
                        <HeroCard name={hero.nameEnglish} />
                    </Link>                    
                ))}
            </div>
        </div>
    );
}