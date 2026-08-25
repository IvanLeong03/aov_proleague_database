"use client";

import { useRouter } from "next/navigation";
import type { Language } from "@/lib/language";

export function LanguageToggle({ current }: { current: Language }) {
    const router = useRouter();

    function setLanguage(lang: Language) {
        document.cookie = `lang=${lang}; path=/; max-age=31536000`;
        router.refresh();
    }

    return (
        <div className="flex items-center text-sm xl:text-base">
            <span className="block md:hidden mr-2">Language: </span>
            <button
                type="button"
                onClick={() => setLanguage("en")}
                className={current === "en" ? "hidden" : "text-gray-500 hover:text-white/80"}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => setLanguage("zh")}
                className={current === "zh" ? "hidden" : "text-gray-500 hover:text-white/80"}
            >
                中
            </button>
        </div>
    );
}
