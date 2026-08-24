import { cookies } from "next/headers";
import type { Language } from "./language";

// Server Components only — imports next/headers. Cookie, not localStorage: most pages
// here are Server Components that fetch data (including which name to display) before
// anything reaches the browser, so the language choice has to be readable server-side.
// A cookie is sent with every request; localStorage would only be visible client-side.
export async function getLanguage(): Promise<Language> {
    const cookieStore = await cookies();
    return cookieStore.get("lang")?.value === "zh" ? "zh" : "en";
}
