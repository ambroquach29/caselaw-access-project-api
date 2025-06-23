/*
  Warnings:

  - Made the column `court_id` on table `cases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jurisdiction_id` on table `cases` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_court_id_fkey";

-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_jurisdiction_id_fkey";

-- AlterTable
ALTER TABLE "cases" ALTER COLUMN "court_id" SET NOT NULL,
ALTER COLUMN "jurisdiction_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
