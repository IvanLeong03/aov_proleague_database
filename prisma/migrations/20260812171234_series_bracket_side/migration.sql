-- CreateEnum
CREATE TYPE "BracketSide" AS ENUM ('WINNER', 'LOSER');

-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "bracketSide" "BracketSide";
