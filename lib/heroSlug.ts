export function heroSlug(nameEnglish: string) {
    return nameEnglish.toLowerCase().replace(/'/g, "").replace(/\s+/g, "-");
}
