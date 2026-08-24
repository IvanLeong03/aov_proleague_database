import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminMode } from "@/lib/admin";
import { NewSeriesForm } from "./NewSeriesForm";

export default async function NewSeriesPage() {
  if (!isAdminMode()) {
    notFound();
  }

  const [competitions, stages] = await Promise.all([
    prisma.competition.findMany({ orderBy: { name: "asc" } }),
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <main className="w-4/5 mx-auto my-16">
      <h1 className="text-xl font-medium my-4">New series</h1>
      <NewSeriesForm competitions={competitions} stages={stages} />
    </main>
  );
}
