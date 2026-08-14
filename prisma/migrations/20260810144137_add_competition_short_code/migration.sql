-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "shortCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Competition_shortCode_key" ON "Competition"("shortCode");
