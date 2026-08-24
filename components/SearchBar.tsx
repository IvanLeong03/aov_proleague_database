"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { pickName, type Language } from "@/lib/language";
import { filterSearchItems, type SearchItem } from "@/lib/search";

const TYPE_LABELS: Record<SearchItem["type"], { en: string; zh: string }> = {
    hero: { en: "Hero", zh: "英雄" },
    team: { en: "Team", zh: "隊伍" },
    competition: { en: "Competition", zh: "賽事" },
    season: { en: "Season", zh: "賽季" },
};

const PLACEHOLDER = { en: "Search heroes, teams, competitions...", zh: "搜尋英雄、隊伍、賽事..." };
const NO_RESULTS = { en: "No results", zh: "沒有結果" };

export function SearchBar({
    items,
    lang,
    className,
    onNavigate,
}: {
    items: SearchItem[];
    lang: Language;
    className?: string;
    onNavigate?: () => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const results = filterSearchItems(items, query);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleSelect() {
        setQuery("");
        setOpen(false);
        onNavigate?.();
    }

    return (
        <div ref={containerRef} className={`relative ${className ?? ""}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={PLACEHOLDER[lang]}
                className="w-full rounded-md bg-[#131313] border border-white/20 px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-teal-400"
            />
            {open && query.trim() !== "" && (
                <div className="absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-md bg-[#131313] border border-white/20 shadow-lg z-50">
                    {results.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-gray-500">{NO_RESULTS[lang]}</p>
                    ) : (
                        <ul>
                            {results.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        href={item.href}
                                        onClick={handleSelect}
                                        className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-700"
                                    >
                                        <span>{pickName(lang, item.labelEnglish, item.labelChinese)}</span>
                                        <span className="ml-2 shrink-0 text-xs text-gray-500">{TYPE_LABELS[item.type][lang]}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
