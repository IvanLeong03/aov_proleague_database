"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type CreateMatchInput = {
    seriesId: number;
    gameNumber: number;
    blueTeamId: number;
    redTeamId: number;
    winnerTeamId: number;
    bans: { teamId: number; heroId: number; banOrder: number }[];
    picks: { teamId: number; heroId: number; laneId: number; pickOrder: number }[];
};

export async function createMatch(input: CreateMatchInput) {
    const { seriesId, gameNumber, blueTeamId, redTeamId, winnerTeamId, bans, picks } = input;

    if (winnerTeamId !== blueTeamId && winnerTeamId !== redTeamId) {
        throw new Error("Winner must be one of the two teams playing.");
    }
    {/* 
    if (bans.length !== 8) {
        throw new Error("Expected 8 bans.");
    }
        */}
    if (picks.length !== 10) {
        throw new Error("Expected 10 picks.");
    }

    const series = await prisma.series.findUnique({
        where: { id: seriesId },
        select: { season: { select: { competition: { select: { shortCode: true } } } } },
    });
    if (!series) {
        throw new Error("Series not found.");
    }

    try {
        await prisma.$transaction(async (tx) => {
            const match = await tx.match.create({
                data: { seriesId, gameNumber, blueTeamId, redTeamId, winnerTeamId },
            });
            await tx.ban.createMany({
                data: bans.map((ban) => ({ ...ban, matchId: match.id })),
            });
            await tx.pick.createMany({
                data: picks.map((pick) => ({ ...pick, matchId: match.id })),
            });
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            throw new Error(`Game ${gameNumber} already exists in this series — pick a different number.`);
        }
        throw e;
    }

    revalidatePath(`/competitions/${series.season.competition.shortCode}/series/${seriesId}`);
}

export async function deleteMatch(matchId: number, seriesId: number, competitionId: string) {
    await prisma.$transaction(async (tx) => {
        await tx.pick.deleteMany({ where: { matchId } });
        await tx.ban.deleteMany({ where: { matchId } });
        await tx.match.delete({ where: { id: matchId } });
    });

    revalidatePath(`/competitions/${competitionId}/series/${seriesId}`);
}

export async function deleteSeries(seriesId: number, competitionId: string) {
    await prisma.$transaction(async (tx) => {
        const matches = await tx.match.findMany({ where: { seriesId }, select: { id: true } });
        const matchIds = matches.map((match) => match.id);

        await tx.pick.deleteMany({ where: { matchId: { in: matchIds } } });
        await tx.ban.deleteMany({ where: { matchId: { in: matchIds } } });
        await tx.match.deleteMany({ where: { seriesId } });
        await tx.series.delete({ where: { id: seriesId } });
    });

    redirect(`/competitions/${competitionId}`);
}
