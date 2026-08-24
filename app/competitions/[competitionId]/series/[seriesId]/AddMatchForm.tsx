"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HeroPicker } from "./HeroPicker";
import { createMatch } from "./actions";

type Team = { id: number; name: string };
type Hero = { id: number; nameEnglish: string; nameChinese: string; class: string };
type Lane = { id: number; nameEnglish: string };

export function AddMatchForm({
    seriesId,
    teamA,
    teamB,
    nextGameNumber,
    heroes,
    lanes,
    }: {
    seriesId: number;
    teamA: Team;
    teamB: Team;
    nextGameNumber: number;
    heroes: Hero[];
    lanes: Lane[];
    }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [gameNumber, setGameNumber] = useState(nextGameNumber);
    const [blueTeamId, setBlueTeamId] = useState(teamA.id);
    const [winnerTeamId, setWinnerTeamId] = useState<number | null>(null);
    const [bansBlue, setBansBlue] = useState<(number | null)[]>([null, null, null, null]);
    const [bansRed, setBansRed] = useState<(number | null)[]>([null, null, null, null]);
    const [picksBlue, setPicksBlue] = useState<(number | null)[]>(() => lanes.map(() => null));
    const [picksRed, setPicksRed] = useState<(number | null)[]>(() => lanes.map(() => null));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setGameNumber(nextGameNumber);
    }, [nextGameNumber]);

    const redTeamId = blueTeamId === teamA.id ? teamB.id : teamA.id;
    const blueTeam = blueTeamId === teamA.id ? teamA : teamB;
    const redTeam = blueTeamId === teamA.id ? teamB : teamA;

    function reset() {
        setWinnerTeamId(null);
        setBansBlue([null, null, null, null]);
        setBansRed([null, null, null, null]);
        setPicksBlue(lanes.map(() => null));
        setPicksRed(lanes.map(() => null));
    }

    function handleSubmit() {
        setError(null);
        if (!winnerTeamId) {
            setError("Select a winner.");
            return;
        }
        if (picksBlue.some((h) => h === null) || picksRed.some((h) => h === null)) {
            setError("All 10 picks must be filled in.");
            return;
        }

        const bans = [
            ...bansBlue
                .filter((heroId): heroId is number => heroId !== null)
                .map((heroId, i) => ({ teamId: blueTeamId, heroId, banOrder: i + 1 })),
            ...bansRed
                .filter((heroId): heroId is number => heroId !== null)
                .map((heroId, i) => ({ teamId: redTeamId, heroId, banOrder: i + 5 })),
        ];
        const picks = [
            ...picksBlue.map((heroId, i) => ({ teamId: blueTeamId, heroId: heroId as number, laneId: lanes[i].id, pickOrder: i + 1 })),
            ...picksRed.map((heroId, i) => ({ teamId: redTeamId, heroId: heroId as number, laneId: lanes[i].id, pickOrder: i + 6 })),
        ];

        startTransition(async () => {
            try {
                await createMatch({
                seriesId,
                gameNumber,
                blueTeamId,
                redTeamId,
                winnerTeamId,
                bans,
                picks,
                });
                reset();
                router.refresh();
            } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong.");
            }
        });
    }

    return (
        <div className="mt-6 border-t pt-4">
        <h3 className="flex items-center gap-2 text-lg font-medium">
            Game
            <input
                type="number"
                min={1}
                max={7}
                value={gameNumber}
                onChange={(e) => setGameNumber(Number(e.target.value))}
                className="w-16 rounded-lg border px-2 py-1 text-base font-normal"
            />
        </h3>

        <div className="mt-2">
            <label className="mb-1 block text-sm text-gray-500">Blue Side</label>
            <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setBlueTeamId(teamA.id)} disabled={blueTeamId === teamA.id} className={`rounded-xl p-2 hover:cursor-pointer ${blueTeamId === teamA.id ? "bg-blue-500" : ""}`}>
                    {teamA.name}
                </button>
                <button type="button" onClick={() => setBlueTeamId(teamB.id)} disabled={blueTeamId === teamB.id} className={`rounded-xl p-2 hover:cursor-pointer ${blueTeamId === teamB.id ? "bg-blue-500" : ""}`}>
                    {teamB.name} 
                </button>
            </div>
        </div>

        <div className="mt-4">
            <label className="mb-1 block text-sm text-gray-500">Winner</label>
            <div className="flex gap-8">
                <button type="button" onClick={() => setWinnerTeamId(teamA.id)} disabled={winnerTeamId === teamA.id} className={`rounded-xl p-2 hover:cursor-pointer 
                    ${winnerTeamId === teamA.id ? 
                        blueTeamId === teamA.id ? "bg-blue-500" : "bg-red-500" 
                        : ""}`}
                >
                    {teamA.name}
                </button>
                <button type="button" onClick={() => setWinnerTeamId(teamB.id)} disabled={winnerTeamId === teamB.id} className={`rounded-xl p-2 hover:cursor-pointer 
                    ${winnerTeamId === teamB.id ? 
                        blueTeamId === teamB.id ? "bg-blue-600" : "bg-red-500" 
                        : ""}`}
                >
                    {teamB.name}
                </button>
            </div>
        </div>

        <div className="mt-4 flex justify-between font-medium">
            <strong>{blueTeam.name} (blue)</strong>
            <span />
            <strong>{redTeam.name} (red)</strong>
        </div>
        {lanes.map((lane, i) => (
            <div key={lane.id} className="grid grid-cols-[2fr_1fr_2fr] items-start gap-2 py-1">
                <HeroPicker
                    heroes={heroes}
                    value={picksBlue[i]}
                    onChange={(id) => setPicksBlue((p) => p.map((v, j) => (j === i ? id : v)))}
                />
                <span className="whitespace-nowrap px-2 pt-2 text-center text-sm text-gray-500">{lane.nameEnglish}</span>
                <HeroPicker
                    heroes={heroes}
                    value={picksRed[i]}
                    onChange={(id) => setPicksRed((p) => p.map((v, j) => (j === i ? id : v)))}
                />
            </div>
        ))}

        <h4 className="mt-4 font-medium">Bans</h4>
        {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_2fr] items-start gap-2 py-1">
                <HeroPicker
                    heroes={heroes}
                    value={bansBlue[i]}
                    onChange={(id) => setBansBlue((b) => b.map((v, j) => (j === i ? id : v)))}
                />
                <span className="whitespace-nowrap px-2 pt-2 text-center text-sm text-gray-500">Ban {i + 1}</span>
                <HeroPicker
                    heroes={heroes}
                    value={bansRed[i]}
                    onChange={(id) => setBansRed((b) => b.map((v, j) => (j === i ? id : v)))}
                />
            </div>
        ))}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="mt-4 rounded-xl border px-4 py-2 hover:cursor-pointer disabled:opacity-50"
        >
            {isPending ? "Saving..." : `Save game ${gameNumber}`}
        </button>
        </div>
    );
}
