import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    ctx: RouteContext<"/api/competitions/[competitionId]/seasons">
    ) {
    const { competitionId } = await ctx.params;

    const seasons = await prisma.season.findMany({
        where: { competitionId: Number(competitionId) },
        orderBy: [{ year: "desc" }, { split: "desc" }],
    });
    return Response.json(seasons);
}
