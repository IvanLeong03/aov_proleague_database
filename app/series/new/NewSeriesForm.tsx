"use client";

import { useEffect, useState } from "react";
import { createSeries } from "../actions";

type Competition = { id: number; name: string; region: string };
type Stage = { id: number; nameEnglish: string; nameChinese: string; order: number };
type Season = { id: number; year: number; split: string | null; isOngoing: boolean };
type Team = { id: number; name: string; region: string; abbreviation: string };

export function NewSeriesForm({
    competitions,
    stages,
    }: {
    competitions: Competition[];
    stages: Stage[];
    }) {
    const [competitionId, setCompetitionId] = useState("");
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonId, setSeasonId] = useState("");
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamAId, setTeamAId] = useState("");
    const [teamBId, setTeamBId] = useState("");

    const selectedSeason = seasons.find((s) => String(s.id) === seasonId);

    useEffect(() => {
        setSeasonId("");
        setSeasons([]);
        if (!competitionId) return;
        fetch(`/api/competitions/${competitionId}/seasons`)
        .then((res) => res.json())
        .then(setSeasons);
    }, [competitionId]);

    useEffect(() => {
        setTeamAId("");
        setTeamBId("");
        setTeams([]);
        if (!seasonId) return;
        fetch(`/api/seasons/${seasonId}/teams`)
        .then((res) => res.json())
        .then(setTeams);
    }, [seasonId]);

    return (
        <form action={createSeries} className="space-y-4">
        <div className="grid grid-cols-2">
            <label>Competition</label>
            <select
            name="competitionId"
            value={competitionId}
            onChange={(e) => setCompetitionId(e.target.value)}
            className="rounded-xl px-2"
            required
            >
            <option value="">Select competition</option>
            {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                {c.name}
                </option>
            ))}
            </select>
        </div>

        <div className="grid grid-cols-2">
            <label>Season</label>
            <select
            name="seasonId"
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            disabled={!competitionId}
            className="rounded-xl px-2"
            required
            >
            <option value="">Select season</option>
            {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                {s.year} {s.split ?? ""}
                </option>
            ))}
            </select>
        </div>

        <div className="grid grid-cols-2">
            <label>Stage</label>
            <select className="rounded-xl px-2" name="stageId" defaultValue="" required>
            <option value="">Select stage</option>
            {stages.map((s) => (
                <option key={s.id} value={s.id}>
                {s.nameEnglish}
                </option>
            ))}
            </select>
        </div>

        <div className="grid grid-cols-2">
            <label>Bracket side</label>
            <select className="rounded-xl px-2" name="bracketSide" defaultValue="">
            <option value="">N/A</option>
            <option value="WINNER">Winner Bracket</option>
            <option value="LOSER">Loser Bracket</option>
            </select>
        </div>

        <div className="grid grid-cols-2">
            <label>Team A</label>
            <select
            name="teamAId"
            value={teamAId}
            onChange={(e) => setTeamAId(e.target.value)}
            disabled={!seasonId}
            className="rounded-xl px-2"
            required
            >
            <option value="">Select team</option>
            {teams.map((t) => (
                <option key={t.id} value={t.id}>
                {t.abbreviation} ({t.name})
                </option>
            ))}
            </select>
        </div>

        <div className="grid grid-cols-2">
            <label>Team B</label>
            <select
            name="teamBId"
            value={teamBId}
            onChange={(e) => setTeamBId(e.target.value)}
            disabled={!seasonId}
            className="rounded-xl px-2"
            required
            >
            <option value="">Select team</option>
            {teams.map((t) => (
                <option key={t.id} value={t.id}>
                {t.abbreviation}
                </option>
            ))}
            </select>
        </div>

        <div className="grid grid-cols-2">
            <label>Date</label>
            <input
            className="border border-white rounded-xl px-2 py-1"
            type="date"
            name="date"
            required
            disabled={!selectedSeason}
            min={selectedSeason ? `${selectedSeason.year}-01-01` : undefined}
            max={selectedSeason ? `${selectedSeason.year}-12-31` : undefined}
            />
        </div>

        <button 
            type="submit" 
            className="rounded-xl my-4 bg-yellow-600 hover:bg-yellow-400 px-4 py-2"
        >
            Create series
        </button>
        </form>
    );
}
