import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    ctx: RouteContext<"/api/seasons/[seasonId]/teams">
    ) {
    const { seasonId } = await ctx.params;

    const teamSeasons = await prisma.teamSeason.findMany({
        where: { seasonId: Number(seasonId) },
        include: { team: true },
        orderBy: { team: { name: "asc" } },
    });
    const teams = teamSeasons.map((ts) => ts.team);
    return Response.json(teams);
}
