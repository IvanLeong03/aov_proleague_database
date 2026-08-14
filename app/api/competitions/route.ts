import { prisma } from "@/lib/prisma";

export async function GET() {
    const competitions = await prisma.competition.findMany({
        orderBy: { name: "asc" },
    });
    return Response.json(competitions);
}
