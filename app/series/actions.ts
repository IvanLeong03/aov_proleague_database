"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isAdminMode } from "@/lib/admin";

export async function createSeries(formData: FormData) {
  if (!isAdminMode()) {
    throw new Error("Not available in read-only mode.");
  }

  const competitionId = Number(formData.get("competitionId"));
  const seasonId = Number(formData.get("seasonId"));
  const stageId = Number(formData.get("stageId"));
  const teamAId = Number(formData.get("teamAId"));
  const teamBId = Number(formData.get("teamBId"));
  const date = String(formData.get("date"));
  const bracketSideRaw = formData.get("bracketSide");
  const bracketSide = bracketSideRaw === "WINNER" || bracketSideRaw === "LOSER" ? bracketSideRaw : undefined;

  if (!competitionId || !seasonId || !stageId || !teamAId || !teamBId || !date) {
    throw new Error("All fields are required.");
  }
  if (teamAId === teamBId) {
    throw new Error("Team A and Team B must be different teams.");
  }

  const [series, competition] = await Promise.all([
    prisma.series.create({
      data: {
        seasonId,
        stageId,
        teamAId,
        teamBId,
        date: new Date(date),
        bracketSide,
      },
    }),
    prisma.competition.findUniqueOrThrow({
      where: { id: competitionId },
      select: { shortCode: true },
    }),
  ]);

  redirect(`/competitions/${competition.shortCode}/series/${series.id}`);
}
