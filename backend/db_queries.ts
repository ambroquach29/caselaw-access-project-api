import { prisma } from './helpers/prisma';
import fs from 'fs';
import path from 'path';

export const insertCases = async () => {
  // Load the JSON data
  const dataPath = path.join(__dirname, 'case_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const cases = JSON.parse(rawData);

  cases.forEach((caseData: any) => {
    caseData.decision_date = new Date(caseData.decision_date).toISOString();
    caseData.last_updated = new Date(caseData.last_updated).toISOString();
  });

  for (const caseData of cases) {
    try {
      // Insert the case
      await prisma.case.upsert({
        where: { id: caseData.id },
        update: {}, // No update for now, just skip if exists
        create: {
          id: caseData.id,
          name: caseData.name,
          name_abbreviation: caseData.name_abbreviation,
          decision_date: caseData.decision_date,
          docket_number: caseData.docket_number,
          first_page: caseData.first_page,
          last_page: caseData.last_page,
          court: {
            connectOrCreate: {
              where: { id: caseData.court.id },
              create: {
                id: caseData.court.id,
                name: caseData.court.name,
                name_abbreviation: caseData.court.name_abbreviation,
              },
            },
          },
          jurisdiction: {
            connectOrCreate: {
              where: { id: caseData.jurisdiction.id },
              create: {
                id: caseData.jurisdiction.id,
                name: caseData.jurisdiction.name,
                name_long: caseData.jurisdiction.name_long,
              },
            },
          },
          citations: caseData.citations || undefined,
          cites_to: caseData.cites_to || undefined,
          analysis: caseData.analysis || undefined,
          provenance: caseData.provenance || undefined,
          casebody: caseData.casebody || undefined,
          file_name: caseData.file_name,
          first_page_order: caseData.first_page_order,
          last_page_order: caseData.last_page_order,
          last_updated: caseData.last_updated,
        },
      });
      console.log(`✅ Inserted case ${caseData.id}`);
    } catch (err) {
      console.error(`❌ Error inserting case ${caseData.id}:`, err);
    }
  }
  return cases;
};

export const findCases = async () => {
  const cases = await prisma.case.findMany({
    include: {
      court: true,
      jurisdiction: true,
    },
  });
  // console.log(cases);
  return cases;
};

export const findCaseById = async (id: number) => {
  const caselaw = await prisma.case.findUnique({
    where: { id },
    include: {
      court: true,
      jurisdiction: true,
    },
  });
  return caselaw;
};

export const findCasesByJurisdiction = async (jurisdiction: string) => {
  const cases = await prisma.case.findMany({
    where: { jurisdiction: { name_long: jurisdiction } },
  });
  return cases;
};

export const findCasesByCourt = async (court: string) => {
  const cases = await prisma.case.findMany({
    where: { court: { name: court } },
  });
  return cases;
};

export const findJurisdictions = async () => {
  const jurisdictions = await prisma.jurisdiction.findMany();
  return jurisdictions;
};

export const findCourts = async () => {
  const courts = await prisma.court.findMany();
  return courts;
};

// insertCases()
//   .catch((err) => {
//     console.error('Fatal error:', err);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
