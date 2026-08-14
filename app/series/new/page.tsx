import { prisma } from "@/lib/prisma";
import { NewSeriesForm } from "./NewSeriesForm";

export default async function NewSeriesPage() {
  const [competitions, stages] = await Promise.all([
    prisma.competition.findMany({ orderBy: { name: "asc" } }),
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <main className="w-4/5 mx-auto my-8">
      <h1 className="text-xl font-medium my-4">New series</h1>
      <NewSeriesForm competitions={competitions} stages={stages} />
    </main>
  );
}
