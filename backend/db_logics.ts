// import { query, mutate } from './helpers/graphql';
// import * as gql_strings from './hasura_ops';
import { readFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

/** This function read and parse json file */
const readParseJsonFile = async () => {
  // const filePath = path.join(__dirname, '..', '..', 'case_data.json')
  const filePath = path.join(__dirname, 'caselaw_data.json');
  const fileContents = await readFile(filePath, { encoding: 'utf8' });
  const data = JSON.parse(fileContents);
  return data;
};

/***********************************
    CRUD operations for Case Law
************************************/

/** This function returns a list of all Cases. */
export const getAllCases = async () => {
  const result = await readParseJsonFile();
  console.log(result);
  return result;
};

/** This function returns a Case by its ID. */
export const getCaseById = async (id: number) => {
  const result = await readParseJsonFile();
  return result.find((caseItem: any) => caseItem.id === id);
};

export const getCasesByJurisdiction = async (jurisdiction: string) => {
  const result = await readParseJsonFile();
  return result.filter(
    (caseItem: any) => caseItem.jurisdiction.name_long === jurisdiction
  );
};

/** This function searches Cases by query string. */
export const searchCases = async (queryString: string) => {
  const result = await readParseJsonFile();
  const searchTerm = queryString.toLowerCase();

  return result.filter((caseItem: any) => {
    return (
      (caseItem.name && caseItem.name.toLowerCase().includes(searchTerm)) ||
      (caseItem.name_abbreviation &&
        caseItem.name_abbreviation.toLowerCase().includes(searchTerm)) ||
      (caseItem.docket_number &&
        caseItem.docket_number.toLowerCase().includes(searchTerm))
    );
  });
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

// /** This function returns Cases by Court ID. */
// export const getCasesByCourt = async (courtId: number) => {
//   const result = await query(gql_strings.GET_CASES_BY_COURT, {
//     courtId: courtId,
//   });
//   return result.data.Case;
// };

// /** This function returns Cases by Jurisdiction ID. */
// export const getCasesByJurisdiction = async (jurisdictionId: number) => {
//   const result = await query(gql_strings.GET_CASES_BY_JURISDICTION, {
//     jurisdictionId: jurisdictionId,
//   });
//   return result.data.Case;
// };

// /** This function returns Cases by date range. */
// export const getCasesByDateRange = async (
//   startDate: string,
//   endDate: string
// ) => {
//   const result = await query(gql_strings.GET_CASES_BY_DATE_RANGE, {
//     startDate: startDate,
//     endDate: endDate,
//   });
//   return result.data.Case;
// };

// /** This function inserts a new Case into the database. */
// export const insertCase = async (input: any) => {
//   const result = await mutate(gql_strings.INSERT_CASE, {
//     input: {
//       name: input.name,
//       name_abbreviation: input.name_abbreviation,
//       decision_date: input.decision_date,
//       docket_number: input.docket_number,
//       first_page: input.first_page,
//       last_page: input.last_page,
//       citations: input.citations,
//       court_id: input.court_id,
//       jurisdiction_id: input.jurisdiction_id,
//       cites_to: input.cites_to,
//       analysis: input.analysis,
//       provenance: input.provenance,
//       casebody: input.casebody,
//       file_name: input.file_name,
//       first_page_order: input.first_page_order,
//       last_page_order: input.last_page_order,
//       last_updated: new Date(),
//     },
//   });
//   return result.data.insert_Case_one;
// };

// /** This function inserts multiple Cases into the database. */
// export const insertCases = async () => {
//   const cases = await readParseJsonFile();
//   const result = await mutate(gql_strings.INSERT_CASES, {
//     objects: cases,
//   });
//   return result.data.insert_Case.returning;
// };

// /** This function updates an existing Case in the database. */
// export const updateCaseById = async (id: number, input: any) => {
//   const result = await mutate(gql_strings.UPDATE_CASE_BY_ID, {
//     id: id,
//     changes: {
//       name: input.name,
//       name_abbreviation: input.name_abbreviation,
//       decision_date: input.decision_date,
//       docket_number: input.docket_number,
//       first_page: input.first_page,
//       last_page: input.last_page,
//       citations: input.citations,
//       court_id: input.court_id,
//       jurisdiction_id: input.jurisdiction_id,
//       cites_to: input.cites_to,
//       analysis: input.analysis,
//       provenance: input.provenance,
//       casebody: input.casebody,
//       file_name: input.file_name,
//       first_page_order: input.first_page_order,
//       last_page_order: input.last_page_order,
//       last_updated: new Date(),
//     },
//   });
//   return result.data.update_Case.returning[0];
// };

// /** This function deletes an existing Case from the database. */
// export const deleteCaseById = async (id: number) => {
//   const result = await mutate(gql_strings.DELETE_CASE_BY_ID, { id: id });
//   return result.data.delete_Case.returning[0];
// };

// /***********************************
//     CRUD operations for Courts
// ************************************/

// /** This function returns a list of all Courts. */
// export const getAllCourts = async () => {
//   const result = await query(gql_strings.GET_ALL_COURTS);
//   return result.data.Court;
// };

// /** This function returns a Court by its ID. */
// export const getCourtById = async (id: number) => {
//   const result = await query(gql_strings.GET_COURT_BY_ID, { id: id });
//   return result.data.Court[0];
// };

// /** This function inserts a new Court into the database. */
// export const insertCourt = async (input: any) => {
//   const result = await mutate(gql_strings.INSERT_COURT, {
//     input: {
//       name_abbreviation: input.name_abbreviation,
//       name: input.name,
//     },
//   });
//   return result.data.insert_Court_one;
// };

// /** This function updates an existing Court in the database. */
// export const updateCourtById = async (id: number, input: any) => {
//   const result = await mutate(gql_strings.UPDATE_COURT_BY_ID, {
//     id: id,
//     changes: {
//       name_abbreviation: input.name_abbreviation,
//       name: input.name,
//     },
//   });
//   return result.data.update_Court.returning[0];
// };

// /** This function deletes an existing Court from the database. */
// export const deleteCourtById = async (id: number) => {
//   const result = await mutate(gql_strings.DELETE_COURT_BY_ID, { id: id });
//   return result.data.delete_Court.returning[0];
// };

// /***********************************
//     CRUD operations for Jurisdictions
// ************************************/

// /** This function returns a list of all Jurisdictions. */
// export const getAllJurisdictions = async () => {
//   const result = await query(gql_strings.GET_ALL_JURISDICTIONS);
//   return result.data.Jurisdiction;
// };

// /** This function returns a Jurisdiction by its ID. */
// export const getJurisdictionById = async (id: number) => {
//   const result = await query(gql_strings.GET_JURISDICTION_BY_ID, { id: id });
//   return result.data.Jurisdiction[0];
// };

// /** This function inserts a new Jurisdiction into the database. */
// export const insertJurisdiction = async (input: any) => {
//   const result = await mutate(gql_strings.INSERT_JURISDICTION, {
//     input: {
//       name_long: input.name_long,
//       name: input.name,
//     },
//   });
//   return result.data.insert_Jurisdiction_one;
// };

// /** This function updates an existing Jurisdiction in the database. */
// export const updateJurisdictionById = async (id: number, input: any) => {
//   const result = await mutate(gql_strings.UPDATE_JURISDICTION_BY_ID, {
//     id: id,
//     changes: {
//       name_long: input.name_long,
//       name: input.name,
//     },
//   });
//   return result.data.update_Jurisdiction.returning[0];
// };

// /** This function deletes an existing Jurisdiction from the database. */
// export const deleteJurisdictionById = async (id: number) => {
//   const result = await mutate(gql_strings.DELETE_JURISDICTION_BY_ID, {
//     id: id,
//   });
//   return result.data.delete_Jurisdiction.returning[0];
// };
