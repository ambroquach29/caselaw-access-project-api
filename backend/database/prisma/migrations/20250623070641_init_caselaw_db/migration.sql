-- CreateTable
CREATE TABLE "courts" (
    "id" SERIAL NOT NULL,
    "name_abbreviation" TEXT,
    "name" TEXT,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurisdictions" (
    "id" SERIAL NOT NULL,
    "name_long" TEXT,
    "name" TEXT,

    CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" BIGINT NOT NULL,
    "name" TEXT,
    "name_abbreviation" TEXT,
    "decision_date" DATE,
    "docket_number" TEXT,
    "first_page" TEXT,
    "last_page" TEXT,
    "citations" JSONB,
    "cites_to" JSONB,
    "analysis" JSONB,
    "provenance" JSONB,
    "casebody" JSONB,
    "last_updated" TIMESTAMP(3),
    "file_name" TEXT,
    "first_page_order" INTEGER,
    "last_page_order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "court_id" INTEGER,
    "jurisdiction_id" INTEGER,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "jurisdictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
