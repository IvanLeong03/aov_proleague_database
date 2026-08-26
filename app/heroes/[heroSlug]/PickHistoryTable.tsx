"use client";

import { Language } from "@/lib/language";
import { useMemo, useState } from "react";

export type PickRow = {
    id: number;
    dateLabel: string;
    dateSortKey: number;
    stageName: string;
    stageOrder: number;
    teamAbbrev: string;
    opponentAbbrev: string;
    laneName: string;
    laneOrder: number;
    win: boolean;
    seriesId: number;
    gameNumber: number;
};

type SortKey = "date" | "stage" | "team" | "opponent" | "lane" | "result";

const SORT_VALUE: Record<SortKey, (row: PickRow) => number | string> = {
    date: (row) => row.dateSortKey,
    stage: (row) => row.stageOrder,
    team: (row) => row.teamAbbrev,
    opponent: (row) => row.opponentAbbrev,
    lane: (row) => row.laneOrder,
    result: (row) => (row.win ? 1 : 0),
};

const labels = {
    date: {
        "en": "Date",
        "zh": "日期"
    }, 
    stage: {
        "en": "Stage",
        "zh": "階段"
    },
    team: {
        "en": "Team",
        "zh": "選用方"
    },
    opponent: {
        "en": "Opponent",
        "zh": "對手"
    },
    lane: {
        "en": "Lane",
        "zh": "路線"
    },
    result: {
        "en": "Result",
        "zh": "賽果"
    },
    game: {
        "en": "Game",
        "zh": "場次"
    },
    noPicksYet: {
        "en": "No picks recorded yet",
        "zh": "未有選用紀錄"
    }
}

export function PickHistoryTable({ rows, lang }: { rows: PickRow[]; lang: Language }) {
    const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

    const sorted = useMemo(() => {
        return [...rows].sort((a, b) => {
            if (sort) {
                const av = SORT_VALUE[sort.key](a);
                const bv = SORT_VALUE[sort.key](b);
                const cmp = av < bv ? -1 : av > bv ? 1 : 0;
                if (cmp !== 0) return sort.dir === "asc" ? cmp : -cmp;
            }
            // Default order, and tiebreak under any active column sort: most recent date
            // first, then higher series id first, then higher game number first.
            return b.dateSortKey - a.dateSortKey || b.seriesId - a.seriesId || b.gameNumber - a.gameNumber;
        });
    }, [rows, sort]);

    function toggleSort(key: SortKey) {
        setSort((current) => {
            if (!current || current.key !== key) return { key, dir: "asc" };
            return { key, dir: current.dir === "asc" ? "desc" : "asc" };
        });
    }

    // Not a <Component/> — a plain helper returning JSX, called inline as {headerCell(...)},
    // so it doesn't trip the "component defined during render" issue a nested PascalCase
    // component would (which would remount on every render since React would treat it as
    // a new component type each time).
    function headerCell(key: SortKey, label: string) {
        const active = sort?.key === key;
        return (
            <th
                key={key}
                onClick={() => toggleSort(key)}
                className={`cursor-pointer select-none font-normal ${active ? "text-gray-100" : "text-gray-400"} pr-2 md:pr-0`}
            >
                {label}
                {active && (sort!.dir === "asc" ? " ▲" : " ▼")}
            </th>
        );
    }

    if (rows.length === 0) {
        return <p className="mt-1 text-sm text-gray-500">{labels.noPicksYet[lang]}</p>;
    }

    return (
        <div className="mt-1 overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm xl:text-base">
                <thead>
                    <tr className="text-left">
                        {headerCell("date", labels.date[lang])}
                        {/* Game number isn't sortable on its own — game 1 of one series has no
                            meaningful relationship to game 1 of another, so sorting by it alone
                            wouldn't mean anything. It's here purely so a same-hero-both-sides pick
                            in the same game is instantly visible next to the Date/Team/Opponent
                            columns that already identify the match. */}
                        {headerCell("stage", labels.stage[lang])}
                        <th className="font-normal text-gray-400 pr-4 lg:pr-2 xl:pr-0">{labels.game[lang]}</th>
                        {headerCell("team", labels.team[lang])}
                        {headerCell("opponent", labels.opponent[lang])}
                        {headerCell("lane", labels.lane[lang])}
                        {headerCell("result", labels.result[lang])}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((row) => (
                        <tr key={row.id} className="border-t border-dashed border-gray-700">
                            <td className="py-1 pr-4 lg:pr-2 xl:pr-0">{row.dateLabel}</td>
                            <td className="py-1 pr-4 lg:pr-2 xl:pr-0">{row.stageName}</td>
                            <td className="py-1 pr-4 lg:pr-2 xl:pr-0">{row.gameNumber}</td>
                            <td className="py-1 pr-4 lg:pr-2 xl:pr-0">{row.teamAbbrev}</td>
                            <td className="py-1 pr-4 lg:pr-2 xl:pr-0">{row.opponentAbbrev}</td>
                            <td className="py-1 pr-4 lg:pr-2 xl:pr-0">{row.laneName}</td>
                            <td className={`py-1 ${row.win ? "text-green-300" : "text-red-300"}`}>{row.win ? "W" : "L"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
