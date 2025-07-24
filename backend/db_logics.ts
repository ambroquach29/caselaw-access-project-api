// import { query, mutate } from './helpers/graphql';
// import * as gql_strings from './hasura_ops';
import { readFile } from 'fs/promises';
import {
  findCases,
  findCaseById,
  findCasesByJurisdiction,
  findCasesByCourt,
  findJurisdictions,
  findCourts,
  findCasesBySearchText,
} from './db_queries';
import { PaginationArgs } from './helpers/pagination';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

/** This function read and parse json file */
export const readParseJsonFile = async () => {
  // const filePath = path.join(__dirname, '..', '..', 'case_data.json')
  const filePath = path.join(__dirname, 'caselaw_data.json');
  const fileContents = await readFile(filePath, { encoding: 'utf8' });
  const data = JSON.parse(fileContents);
  return data;
};

/***********************************
    CRUD operations for Case Law
************************************/

/** This function returns a list of all Cases with pagination support. */
export const getAllCases = async (paginationArgs?: PaginationArgs) => {
  const result = await findCases(paginationArgs);
  return result;
};

/** This function returns a Case by its ID. */
export const getCaseById = async (id: number) => {
  const result = await findCaseById(id);
  return result;
};

export const getCasesByJurisdiction = async (
  jurisdiction: string,
  paginationArgs?: PaginationArgs,
  year?: number
) => {
  const result = await findCasesByJurisdiction(
    jurisdiction,
    paginationArgs,
    year
  );
  return result;
};

export const getCasesByCourt = async (
  court: string,
  paginationArgs?: PaginationArgs
) => {
  const result = await findCasesByCourt(court, paginationArgs);
  return result;
};

export const getJurisdictions = async () => {
  const result = await findJurisdictions();
  return result;
};

export const getCourts = async () => {
  const result = await findCourts();
  return result;
};

/** This function searches Cases by query string with pagination support. */
export const searchCases = async (
  searchText: string,
  jurisdiction: string | null,
  paginationArgs?: PaginationArgs
) => {
  const result = await findCasesBySearchText(
    searchText.toLowerCase().trim(),
    jurisdiction,
    paginationArgs
  );
  return result;
};

// In db_logics.ts
export const getFilteredCases = async (filters: {
  jurisdictionId?: string;
  courtId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: 'recent' | 'older';
}) => {
  const allCases = await readParseJsonFile();

  return allCases.filter((caseItem: any) => {
    // Jurisdiction filter
    if (
      filters.jurisdictionId &&
      caseItem.jurisdiction?.id !== filters.jurisdictionId
    ) {
      return false;
    }

    // Court filter
    if (filters.courtId && caseItem.court?.id !== filters.courtId) {
      return false;
    }

    // Date range filter
    if (filters.startDate && caseItem.decision_date < filters.startDate) {
      return false;
    }
    if (filters.endDate && caseItem.decision_date > filters.endDate) {
      return false;
    }

    // Status filter (recent vs older)
    if (filters.status) {
      const caseDate = new Date(caseItem.decision_date);
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      if (filters.status === 'recent' && caseDate < fiveYearsAgo) {
        return false;
      }
      if (filters.status === 'older' && caseDate >= fiveYearsAgo) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        caseItem.name?.toLowerCase().includes(searchTerm) ||
        caseItem.name_abbreviation?.toLowerCase().includes(searchTerm) ||
        caseItem.docket_number?.toLowerCase().includes(searchTerm);

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
};
