export function seasonSlug(season: { year: number; split: string | null }) {
    return season.split ? `${season.year}-${season.split.toLowerCase()}` : `${season.year}`;
}
