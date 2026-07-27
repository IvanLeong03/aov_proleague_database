-- CreateEnum
CREATE TYPE "HeroClass" AS ENUM ('TANK', 'WARRIOR', 'ASSASSIN', 'MAGE', 'MARKSMAN', 'SUPPORT');

-- CreateTable
CREATE TABLE "Hero" (
    "id" SERIAL NOT NULL,
    "nameEnglish" TEXT NOT NULL,
    "nameChinese" TEXT NOT NULL,
    "class" "HeroClass" NOT NULL,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lane" (
    "id" SERIAL NOT NULL,
    "nameEnglish" TEXT NOT NULL,
    "nameChinese" TEXT NOT NULL,

    CONSTRAINT "Lane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "split" TEXT,
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeason" (
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,

    CONSTRAINT "TeamSeason_pkey" PRIMARY KEY ("teamId","seasonId")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "stageId" INTEGER NOT NULL,
    "teamAId" INTEGER NOT NULL,
    "teamBId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "blueTeamId" INTEGER NOT NULL,
    "redTeamId" INTEGER NOT NULL,
    "winnerTeamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "heroId" INTEGER NOT NULL,
    "laneId" INTEGER NOT NULL,
    "pickOrder" INTEGER NOT NULL,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ban" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "heroId" INTEGER NOT NULL,
    "banOrder" INTEGER NOT NULL,

    CONSTRAINT "Ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hero_class_idx" ON "Hero"("class");

-- CreateIndex
CREATE INDEX "Season_isOngoing_idx" ON "Season"("isOngoing");

-- CreateIndex
CREATE UNIQUE INDEX "Season_competitionId_year_split_key" ON "Season"("competitionId", "year", "split");

-- CreateIndex
CREATE INDEX "TeamSeason_seasonId_idx" ON "TeamSeason"("seasonId");

-- CreateIndex
CREATE INDEX "Series_seasonId_idx" ON "Series"("seasonId");

-- CreateIndex
CREATE INDEX "Series_stageId_idx" ON "Series"("stageId");

-- CreateIndex
CREATE INDEX "Series_teamAId_idx" ON "Series"("teamAId");

-- CreateIndex
CREATE INDEX "Series_teamBId_idx" ON "Series"("teamBId");

-- CreateIndex
CREATE INDEX "Match_seriesId_idx" ON "Match"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_seriesId_gameNumber_key" ON "Match"("seriesId", "gameNumber");

-- CreateIndex
CREATE INDEX "Pick_matchId_heroId_laneId_idx" ON "Pick"("matchId", "heroId", "laneId");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_matchId_pickOrder_key" ON "Pick"("matchId", "pickOrder");

-- CreateIndex
CREATE INDEX "Ban_matchId_heroId_idx" ON "Ban"("matchId", "heroId");

-- CreateIndex
CREATE UNIQUE INDEX "Ban_matchId_banOrder_key" ON "Ban"("matchId", "banOrder");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeason" ADD CONSTRAINT "TeamSeason_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeason" ADD CONSTRAINT "TeamSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_blueTeamId_fkey" FOREIGN KEY ("blueTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_redTeamId_fkey" FOREIGN KEY ("redTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_laneId_fkey" FOREIGN KEY ("laneId") REFERENCES "Lane"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
