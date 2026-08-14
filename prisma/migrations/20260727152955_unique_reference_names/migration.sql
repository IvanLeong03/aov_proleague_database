/*
  Warnings:

  - A unique constraint covering the columns `[nameEnglish]` on the table `Hero` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameEnglish]` on the table `Lane` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameEnglish]` on the table `Stage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Hero_nameEnglish_key" ON "Hero"("nameEnglish");

-- CreateIndex
CREATE UNIQUE INDEX "Lane_nameEnglish_key" ON "Lane"("nameEnglish");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_nameEnglish_key" ON "Stage"("nameEnglish");
