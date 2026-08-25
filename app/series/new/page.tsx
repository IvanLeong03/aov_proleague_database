import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminMode } from "@/lib/admin";
import { NewSeriesForm } from "./NewSeriesForm";

// This is the only page that doesn't call getLanguage() (no bilingual text), so it's
// missing the cookies()-read signal every other page uses to tell Next.js "never
// prerender this at build time." Without it, a build-time prerender attempt renders
// the shared layout (including NavBar's own Prisma queries) against the database
// during the build itself, which isn't guaranteed to succeed. force-dynamic removes
// the ambiguity outright — this page also needs isAdminMode() checked per-request
// anyway, not baked into a static build artifact.
export const dynamic = "force-dynamic";

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
