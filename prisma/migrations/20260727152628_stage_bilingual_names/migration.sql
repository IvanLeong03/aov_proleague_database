/*
  Warnings:

  - You are about to drop the column `name` on the `Stage` table. All the data in the column will be lost.
  - Added the required column `nameChinese` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEnglish` to the `Stage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stage" DROP COLUMN "name",
ADD COLUMN     "nameChinese" TEXT NOT NULL,
ADD COLUMN     "nameEnglish" TEXT NOT NULL;
