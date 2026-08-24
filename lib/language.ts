// Pure, universally-safe exports only — no "next/headers" import here. This file gets
// imported by Client Components too (e.g. HeroBrowser), and Next.js taints an entire
// module as server-only the moment ANY export in it touches a server-only API, even one
// the client-side importer never actually uses. getLanguage() (which needs next/headers)
// lives in a separate file, lib/getLanguage.ts, imported only by Server Components.

export type Language = "en" | "zh";

export function pickName(lang: Language, nameEnglish: string, nameChinese: string) {
    return lang === "zh" ? nameChinese : nameEnglish;
}
