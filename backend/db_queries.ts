import { prisma } from './helpers/prisma';
import {
  parsePaginationArgs,
  createPaginationResult,
  PaginationArgs,
} from './helpers/pagination';
import fs from 'fs';
import path from 'path';

export const findCases = async (paginationArgs?: PaginationArgs) => {
  if (!paginationArgs) {
    // Fallback to original behavior for backward compatibility
    const cases = await prisma.case.findMany({
      take: 12000,
      include: {
        court: true,
        jurisdiction: true,
      },
    });
    return cases;
  }

  const params = parsePaginationArgs(paginationArgs);

  // Get total count
  const totalCount = await prisma.case.count();

  // Get paginated results
  const cases = await prisma.case.findMany({
    ...params,
    include: {
      court: true,
      jurisdiction: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  // Check if there are more items
  const hasNextPage = cases.length === params.take;
  const hasPreviousPage = !!paginationArgs.after;

  return createPaginationResult(
    cases,
    totalCount,
    hasNextPage,
    hasPreviousPage
  );
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

export const findCasesByJurisdiction = async (
  jurisdiction: string,
  paginationArgs?: PaginationArgs,
  year?: number
) => {
  // Build year filter if provided
  let yearFilter = {};
  if (year) {
    yearFilter = {
      decision_date: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    };
  }

  if (!paginationArgs) {
    // Fallback to original behavior
    const cases = await prisma.case.findMany({
      take: 1000,
      where: { jurisdiction: { name_long: jurisdiction }, ...yearFilter },
      select: {
        id: true,
        name: true,
        name_abbreviation: true,
        decision_date: true,
        docket_number: true,
        court: {
          select: {
            id: true,
            name: true,
            name_abbreviation: true,
          },
        },
        jurisdiction: {
          select: {
            id: true,
            name: true,
            name_long: true,
          },
        },
      },
    });
    return cases;
  }

  const params = parsePaginationArgs(paginationArgs);

  // Get total count for this jurisdiction and year
  const totalCount = await prisma.case.count({
    where: { jurisdiction: { name_long: jurisdiction }, ...yearFilter },
  });

  // Get paginated results
  const cases = await prisma.case.findMany({
    ...params,
    where: { jurisdiction: { name_long: jurisdiction }, ...yearFilter },
    select: {
      id: true,
      name: true,
      name_abbreviation: true,
      decision_date: true,
      docket_number: true,
      court: {
        select: {
          id: true,
          name: true,
          name_abbreviation: true,
        },
      },
      jurisdiction: {
        select: {
          id: true,
          name: true,
          name_long: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  const hasNextPage = cases.length === params.take;
  const hasPreviousPage = !!paginationArgs.after;

  return createPaginationResult(
    cases,
    totalCount,
    hasNextPage,
    hasPreviousPage
  );
};

export const findCasesByCourt = async (
  court: string,
  paginationArgs?: PaginationArgs
) => {
  if (!paginationArgs) {
    // Fallback to original behavior
    const cases = await prisma.case.findMany({
      take: 1000,
      where: { court: { name: court } },
      include: {
        court: true,
        jurisdiction: true,
      },
    });
    return cases;
  }

  const params = parsePaginationArgs(paginationArgs);

  // Get total count for this court
  const totalCount = await prisma.case.count({
    where: { court: { name: court } },
  });

  // Get paginated results
  const cases = await prisma.case.findMany({
    ...params,
    where: { court: { name: court } },
    include: {
      court: true,
      jurisdiction: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  const hasNextPage = cases.length === params.take;
  const hasPreviousPage = !!paginationArgs.after;

  return createPaginationResult(
    cases,
    totalCount,
    hasNextPage,
    hasPreviousPage
  );
};

export const findCasesBySearchText = async (
  searchText: string,
  jurisdiction: string | null,
  paginationArgs?: PaginationArgs
) => {
  const whereClause: any = {
    OR: [
      { name: { contains: searchText, mode: 'insensitive' } },
      { name_abbreviation: { contains: searchText, mode: 'insensitive' } },
      { docket_number: { contains: searchText, mode: 'insensitive' } },
    ],
  };

  // Only add jurisdiction filter if jurisdiction is not null
  if (jurisdiction) {
    whereClause.jurisdiction = { name_long: jurisdiction };
  }

  if (!paginationArgs) {
    // Fallback to original behavior
    const cases = await prisma.case.findMany({
      take: 1000,
      where: whereClause,
      include: {
        court: true,
        jurisdiction: true,
      },
    });
    return cases;
  }

  const params = parsePaginationArgs(paginationArgs);

  // Get total count for search
  const totalCount = await prisma.case.count({
    where: whereClause,
  });

  // Get paginated results
  const cases = await prisma.case.findMany({
    ...params,
    where: whereClause,
    include: {
      court: true,
      jurisdiction: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  const hasNextPage = cases.length === params.take;
  const hasPreviousPage = !!paginationArgs.after;

  return createPaginationResult(
    cases,
    totalCount,
    hasNextPage,
    hasPreviousPage
  );
};

export const findJurisdictions = async () => {
  const jurisdictions = await prisma.jurisdiction.findMany();
  return jurisdictions;
};

export const findCourts = async () => {
  const courts = await prisma.court.findMany();
  return courts;
};

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
