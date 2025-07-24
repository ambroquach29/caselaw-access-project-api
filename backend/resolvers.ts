import { GraphQLScalarType, Kind } from 'graphql';
import * as db_logics from './db_logics';
import { PaginationArgs } from './helpers/pagination';

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
    GetAllCases: async (_: any, { first, after }: PaginationArgs) => {
      return await db_logics.getAllCases({ first, after });
    },

    GetCaseById: async (_: any, { id }: { id: string }) => {
      return await db_logics.getCaseById(parseInt(id));
    },

    GetCasesByJurisdiction: async (
      _: any,
      {
        jurisdiction,
        year,
        first,
        after,
      }: { jurisdiction: string; year?: number } & PaginationArgs
    ) => {
      return await db_logics.getCasesByJurisdiction(
        jurisdiction,
        { first, after },
        year
      );
    },

    GetCasesByCourt: async (
      _: any,
      { court, first, after }: { court: string } & PaginationArgs
    ) => {
      return await db_logics.getCasesByCourt(court, { first, after });
    },

    GetAllJurisdictions: async () => {
      return await db_logics.getJurisdictions();
    },

    GetAllCourts: async () => {
      return await db_logics.getCourts();
    },

    SearchCases: async (
      _: any,
      {
        searchText,
        jurisdiction,
        first,
        after,
      }: { searchText: string; jurisdiction: string | null } & PaginationArgs
    ) => {
      console.log('searchText:', searchText);
      console.log('jurisdiction:', jurisdiction);
      return await db_logics.searchCases(searchText, jurisdiction, {
        first,
        after,
      });
    },
  },
  Case: {
    time_stamp: (parent: any) => ({
      created_at: parent.created_at,
      updated_at: parent.updated_at,
    }),
  },

  DateTime: dateTimeScalar,
};
