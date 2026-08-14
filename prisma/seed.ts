import { PrismaClient, HeroClass } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function parseCsv(filename: string): Record<string, string>[] {
  const text = readFileSync(join(__dirname, "data", filename), "utf-8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}

async function main() {
  const heroes = parseCsv("heroes.csv").map((row) => ({
    nameEnglish: row.nameEnglish,
    nameChinese: row.nameChinese,
    class: row.class.toUpperCase() as HeroClass,
  }));
  await prisma.hero.createMany({ data: heroes, skipDuplicates: true });
  console.log(`Seeded ${heroes.length} heroes.`);

  const lanes = parseCsv("lanes.csv").map((row) => ({
    nameEnglish: row.nameEnglish,
    nameChinese: row.nameChinese,
  }));
  await prisma.lane.createMany({ data: lanes, skipDuplicates: true });
  console.log(`Seeded ${lanes.length} lanes.`);

  const stages = parseCsv("stages.csv").map((row) => ({
    nameEnglish: row.nameEnglish,
    nameChinese: row.nameChinese,
    order: Number(row.order),
    countsTowardStandings: row.countsTowardStandings === "true",
    winsToQualify: row.winsToQualify ? Number(row.winsToQualify) : undefined,
  }));
  await prisma.stage.createMany({ data: stages, skipDuplicates: true });
  console.log(`Seeded ${stages.length} stages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
