"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { SearchBar } from "./SearchBar";
import type { Language } from "@/lib/language";
import type { SearchItem } from "@/lib/search";

type NavLink = { href: string; label: string; labelChinese: string };
type CompetitionLink = { name: string; shortCode: string };

export function MobileMenu({
    links,
    competitions,
    competitionsLabel,
    searchItems,
    lang,
}: {
    links: NavLink[];
    competitions: CompetitionLink[];
    competitionsLabel: string;
    searchItems: SearchItem[];
    lang: Language;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
                aria-expanded={open}
                className="p-2 text-gray-300 hover:text-white"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full bg-[#2d2d2d] border-b border-white/60 px-6 py-4 space-y-4 z-40">
                    <SearchBar items={searchItems} lang={lang} className="w-full" onNavigate={() => setOpen(false)} />

                    <div className="flex flex-col space-y-3">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="text-gray-300 hover:text-white"
                            >
                                {lang === "en" ? link.label : link.labelChinese}
                            </Link>
                        ))}
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-2">{competitionsLabel}</p>
                        <div className="flex flex-col space-y-2 pl-2">
                            {competitions.map((c) => (
                                <Link
                                    key={c.shortCode}
                                    href={`/competitions/${c.shortCode}`}
                                    onClick={() => setOpen(false)}
                                    className="text-gray-400 hover:text-white/90"
                                >
                                    {c.name} ({c.shortCode})
                                </Link>
                            ))}
                        </div>
                    </div>

                    <LanguageToggle current={lang} />
                </div>
            )}
        </>
    );
}
