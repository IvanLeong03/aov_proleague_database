/*
  Warnings:

  - Added the required column `date` to the `Series` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "date" DATE NOT NULL;

-- CreateIndex
CREATE INDEX "Series_date_idx" ON "Series"("date");
