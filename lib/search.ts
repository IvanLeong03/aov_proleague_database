export type SearchItem = {
    id: string;
    type: "hero" | "team" | "competition" | "season";
    labelEnglish: string;
    labelChinese: string;
    keywords: string;
    href: string;
};

export function filterSearchItems(items: SearchItem[], query: string, limit = 20): SearchItem[] {
    const q = query.trim();
    if (!q) return [];
    const qLower = q.toLowerCase();
    return items
        .filter(
            (item) =>
                item.labelEnglish.toLowerCase().includes(qLower) ||
                item.labelChinese.includes(q) ||
                item.keywords.includes(qLower)
        )
        .slice(0, limit);
}
