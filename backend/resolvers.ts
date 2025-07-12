import { GraphQLScalarType, Kind } from 'graphql';
import * as db_logics from './db_logics';

const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A date-time string in ISO 8601 format',
  serialize(value) {
    if (value instanceof Date) {
      // Convert Date to ISO 8601 string
      return value.toISOString();
    } else if (typeof value === 'string') {
      // Assume it's already in ISO 8601 format or other desired string format
      return value;
    }
    throw new Error(
      'DateTime Scalar serializer expected a `Date` object or valid date string'
    );
  },
  parseValue(value) {
    if (typeof value === 'number') {
      // Convert numeric timestamp to Date object
      return new Date(value);
    } else if (typeof value === 'string') {
      // Convert string to Date object
      return new Date(value);
    }
    throw new Error(
      'DateTime Scalar parser expected a `number` or valid date string'
    );
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      // Convert integer literal to Date
      return new Date(parseInt(ast.value, 10));
    } else if (ast.kind === Kind.STRING) {
      // Convert string literal to Date
      return new Date(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  Query: {
    // Case queries
    GetAllCases: async () => {
      return await db_logics.getAllCases();
    },

    GetCaseById: async (_: any, { id }: { id: string }) => {
      return await db_logics.getCaseById(parseInt(id));
    },

    GetCasesByJurisdiction: async (
      _: any,
      { jurisdiction }: { jurisdiction: string }
    ) => {
      return await db_logics.getCasesByJurisdiction(jurisdiction);
    },

    GetCasesByCourt: async (_: any, { court }: { court: string }) => {
      return await db_logics.getCasesByCourt(court);
    },

    GetAllJurisdictions: async () => {
      return await db_logics.getJurisdictions();
    },

    GetAllCourts: async () => {
      return await db_logics.getCourts();
    },

    SearchCases: async (_: any, { searchText }: { searchText: string }) => {
      return await db_logics.searchCases(searchText);
    },

    //   GetCasesByDateRange: async (
    //     _: any,
    //     { startDate, endDate }: { startDate: string; endDate: string }
    //   ) => {
    //     return await db_logics.getCasesByDateRange(startDate, endDate);
    //   },

    // Mutation: {
    //   // Case mutations
    //   InsertCase: async (_: any, { input }: { input: any }) => {
    //     return await db_logics.insertCase(input);
    //   },

    //   UpdateCase: async (_: any, { id, input }: { id: string; input: any }) => {
    //     return await db_logics.updateCaseById(parseInt(id), input);
    //   },

    //   DeleteCase: async (_: any, { id }: { id: string }) => {
    //     return await db_logics.deleteCaseById(parseInt(id));
    //   },

    //   // Court mutations
    //   InsertCourt: async (_: any, { input }: { input: any }) => {
    //     return await db_logics.insertCourt(input);
    //   },

    //   UpdateCourt: async (_: any, { id, input }: { id: string; input: any }) => {
    //     return await db_logics.updateCourtById(parseInt(id), input);
    //   },

    //   DeleteCourt: async (_: any, { id }: { id: string }) => {
    //     return await db_logics.deleteCourtById(parseInt(id));
    //   },

    //   // Jurisdiction mutations
    //   InsertJurisdiction: async (_: any, { input }: { input: any }) => {
    //     return await db_logics.insertJurisdiction(input);
    //   },

    //   UpdateJurisdiction: async (
    //     _: any,
    //     { id, input }: { id: string; input: any }
    //   ) => {
    //     return await db_logics.updateJurisdictionById(parseInt(id), input);
    //   },

    //   DeleteJurisdiction: async (_: any, { id }: { id: string }) => {
    //     return await db_logics.deleteJurisdictionById(parseInt(id));
    //   },
  },
  Case: {
    time_stamp: (parent: any) => ({
      created_at: parent.created_at,
      updated_at: parent.updated_at,
    }),
  },

  DateTime: dateTimeScalar,
};
