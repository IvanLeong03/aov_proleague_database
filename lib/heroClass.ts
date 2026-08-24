import type { Language } from "./language";

const CLASS_LABELS_ZH: Record<string, string> = {
    Tank: "坦克",
    Warrior: "戰士",
    Assassin: "刺客",
    Mage: "法師",
    Marksman: "射手",
    Support: "輔助",
};

export function classLabel(lang: Language, cls: string) {
    if (cls === "All") return lang === "zh" ? "全部" : "All";
    return lang === "zh" ? CLASS_LABELS_ZH[cls] ?? cls : cls;
}
