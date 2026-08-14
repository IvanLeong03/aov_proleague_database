import { useState } from "react";

type Hero = { id: number; nameEnglish: string; nameChinese: string; class: string };

const GROUP_LABELS: Record<string, string> = {
    TANK_SUPPORT: "Tank / support",
    WARRIOR: "Warrior",
    ASSASSIN: "Assassin",
    MAGE: "Mage",
    MARKSMAN: "Marksman",
};

function groupHeroes(heroes: Hero[]) {
    const byGroup: Record<string, Hero[]> = {};
    for (const hero of heroes) {
        const key = hero.class === "TANK" || hero.class === "SUPPORT" ? "TANK_SUPPORT" : hero.class;
        (byGroup[key] ??= []).push(hero);
    }
    return Object.entries(byGroup).map(([key, groupHeroes]) => ({
        key,
        label: GROUP_LABELS[key] ?? key,
        heroes: groupHeroes,
    }));
}

export function HeroPicker({
    heroes,
    value,
    onChange,
}: {
    heroes: Hero[];
    value: number | null;
    onChange: (heroId: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const groups = groupHeroes(heroes);
    const selectedHero = heroes.find((hero) => hero.id === value);

    const trimmedQuery = query.trim().toLowerCase();
    const searchResults = trimmedQuery
        ? heroes.filter(
              (hero) =>
                  hero.nameEnglish.toLowerCase().includes(trimmedQuery) ||
                  hero.nameChinese.includes(query.trim())
          )
        : [];

    function close() {
        setOpen(false);
        setActiveGroup(null);
        setQuery("");
    }

    function select(heroId: number) {
        onChange(heroId);
        close();
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full rounded-xl border px-2 pb-1 text-left"
            >
                {selectedHero ? selectedHero.nameEnglish : "Select hero"}
            </button>
            {open && (
                <div className="absolute z-10 max-h-72 w-full overflow-y-auto rounded-xl border bg-white text-black/80 shadow-md">
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search heroes..."
                        className="w-full border-b border-gray-300 px-3 py-2 text-sm outline-none"
                    />
                    {trimmedQuery ? (
                        searchResults.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-gray-500">No heroes found.</p>
                        ) : (
                            searchResults.map((hero) => (
                                <button
                                    key={hero.id}
                                    type="button"
                                    onClick={() => select(hero.id)}
                                    className="block w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100"
                                >
                                    {hero.nameEnglish}
                                </button>
                            ))
                        )
                    ) : activeGroup === null ? (
                        groups.map((group) => (
                            <button
                                key={group.key}
                                type="button"
                                onClick={() => setActiveGroup(group.key)}
                                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100"
                            >
                                {group.label}
                            </button>
                        ))
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setActiveGroup(null)}
                                className="block w-full rounded-lg px-3 py-2 text-left font-medium hover:bg-gray-100"
                            >
                                &larr; Back
                            </button>
                            {groups
                                .find((group) => group.key === activeGroup)!
                                .heroes.map((hero) => (
                                    <button
                                        key={hero.id}
                                        type="button"
                                        onClick={() => select(hero.id)}
                                        className="block w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100"
                                    >
                                        {hero.nameEnglish}
                                    </button>
                                ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
