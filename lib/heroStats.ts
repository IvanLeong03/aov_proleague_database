export function topHeroes(items: { hero: { id: number; nameEnglish: string; nameChinese: string } }[], n?: number) {
    const counts = new Map<number, { hero: { id: number; nameEnglish: string; nameChinese: string }; count: number }>();
    for (const item of items) {
        const entry = counts.get(item.hero.id) ?? { hero: item.hero, count: 0 };
        entry.count++;
        counts.set(item.hero.id, entry);
    }
    const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    return n === undefined ? sorted : sorted.slice(0, n);
}
