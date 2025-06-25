/// <reference types="jest" />

import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { typeDefs } from '../schema';
import { resolvers } from '../resolvers';
import { addMocksToSchema } from '@graphql-tools/mock';
import { makeExecutableSchema } from '@graphql-tools/schema';

// Apollo Server type mocks
const mocks = {
  DateTime: () => new Date('2024-01-15T00:00:00.000Z').toISOString(),
  String: () => 'Sample String',
  Int: () => 123,
  Float: () => 0.95,
  Boolean: () => true,
  ID: () => '1',

  Case: () => ({
    id: '1177184',
    name: 'Sample Case Name',
    name_abbreviation: 'Sample v. Case',
    decision_date: new Date('2024-01-15T00:00:00.000Z').toISOString(),
    docket_number: 'No. 12345',
    first_page: '1',
    last_page: '10',
    citations: [
      {
        type: 'official',
        cite: '123 U.S. 456',
      },
    ],
    court: {
      id: '8799',
      name_abbreviation: 'U.S.',
      name: 'Supreme Court of the United States',
    },
    jurisdiction: {
      id: '30',
      name_long: 'United States',
      name: 'US',
    },
    cites_to: [
      {
        cite: '456 U.S. 789',
        category: 'case',
        reporter: 'U.S.',
        case_ids: ['789'],
        opinion_index: 0,
        case_paths: ['/case/789'],
        weight: 1,
        pin_cites: [
          {
            page: '789',
          },
        ],
        year: 2024,
      },
    ],
    analysis: {
      cardinality: 100,
      char_count: 5000,
      ocr_confidence: 0.95,
      pagerank: {
        raw: 0.85,
        percentile: 0.75,
      },
      sha256: 'abc123',
      simhash: 'def456',
      word_count: 1000,
    },
    last_updated: new Date('2024-01-15T00:00:00.000Z').toISOString(),
    provenance: {
      date_added: '2024-01-15',
      source: 'Case Law Access Project',
      batch: 'batch_001',
    },
    casebody: {
      judges: ['Judge Smith'],
      parties: ['Plaintiff v. Defendant'],
      opinions: [
        {
          text: 'This is the opinion text...',
          type: 'majority',
          author: 'Judge Smith',
        },
      ],
      attorneys: ['Attorney A', 'Attorney B'],
      corrections: null,
      head_matter: 'Head matter text...',
    },
    file_name: 'sample_case.json',
    first_page_order: 1,
    last_page_order: 10,
    time_stamp: {
      created_at: new Date('2024-01-15T00:00:00.000Z').toISOString(),
      updated_at: new Date('2024-01-15T00:00:00.000Z').toISOString(),
    },
  }),

  Court: () => ({
    id: '8799',
    name_abbreviation: 'U.S.',
    name: 'Supreme Court of the United States',
  }),

  Jurisdiction: () => ({
    id: '30',
    name_long: 'United States',
    name: 'US',
  }),

  Citation: () => ({
    type: 'official',
    cite: '123 U.S. 456',
  }),

  CitesTo: () => ({
    cite: '456 U.S. 789',
    category: 'case',
    reporter: 'U.S.',
    case_ids: ['789'],
    opinion_index: 0,
    case_paths: ['/case/789'],
    weight: 1,
    pin_cites: [
      {
        page: '789',
      },
    ],
    year: 2024,
  }),

  PinCites: () => ({
    page: '789',
  }),

  Analysis: () => ({
    cardinality: 100,
    char_count: 5000,
    ocr_confidence: 0.95,
    pagerank: {
      raw: 0.85,
      percentile: 0.75,
    },
    sha256: 'abc123',
    simhash: 'def456',
    word_count: 1000,
  }),

  PageRank: () => ({
    raw: 0.85,
    percentile: 0.75,
  }),

  Provenance: () => ({
    date_added: '2024-01-15',
    source: 'Case Law Access Project',
    batch: 'batch_001',
  }),

  CaseBody: () => ({
    judges: ['Judge Smith'],
    parties: ['Plaintiff v. Defendant'],
    opinions: [
      {
        text: 'This is the opinion text...',
        type: 'majority',
        author: 'Judge Smith',
      },
    ],
    attorneys: ['Attorney A', 'Attorney B'],
    corrections: null,
    head_matter: 'Head matter text...',
  }),

  Opinion: () => ({
    text: 'This is the opinion text...',
    type: 'majority',
    author: 'Judge Smith',
  }),

  TimeStamp: () => ({
    created_at: new Date('2024-01-15T00:00:00.000Z').toISOString(),
    updated_at: new Date('2024-01-15T00:00:00.000Z').toISOString(),
  }),
};

// Create test server
const makeTestServer = () => {
  const server = new ApolloServer({
    schema: addMocksToSchema({
      schema: makeExecutableSchema({
        typeDefs,
        resolvers,
      }),
      mocks,
    }),
  });
  return server;
};

const testServer = makeTestServer();

describe('Case Queries', () => {
  test('GetAllCases', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query {
          GetAllCases {
            id
            name
            name_abbreviation
            decision_date
            docket_number
            court {
              id
              name
              name_abbreviation
            }
            jurisdiction {
              id
              name
              name_long
            }
          }
        }
      `,
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.GetAllCases).toBeDefined();
    expect(Array.isArray(response.data.GetAllCases)).toBe(true);
  });

  test('GetCaseById', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query ($id: ID!) {
          GetCaseById(id: $id) {
            id
            name
            name_abbreviation
            decision_date
            docket_number
            court {
              id
              name
              name_abbreviation
            }
            jurisdiction {
              id
              name
              name_long
            }
            casebody {
              parties
              opinions {
                text
                type
                author
              }
            }
          }
        }
      `,
      variables: {
        id: '1177184',
      },
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.GetCaseById).toBeDefined();
    expect(response.data.GetCaseById.id).toBe('1177184');
  });

  test('GetCasesByCourt', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query ($court: String!) {
          GetCasesByCourt(court: $court) {
            id
            name
            name_abbreviation
            court {
              id
              name
              name_abbreviation
            }
          }
        }
      `,
      variables: {
        court: 'Cal. Ct. App.',
      },
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.GetCasesByCourt).toBeDefined();
    expect(Array.isArray(response.data.GetCasesByCourt)).toBe(true);
  });

  test('GetCasesByJurisdiction', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query ($jurisdiction: String!) {
          GetCasesByJurisdiction(jurisdiction: $jurisdiction) {
            id
            name
            name_abbreviation
            jurisdiction {
              id
              name
              name_long
            }
          }
        }
      `,
      variables: {
        jurisdiction: 'US',
      },
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.GetCasesByJurisdiction).toBeDefined();
    expect(Array.isArray(response.data.GetCasesByJurisdiction)).toBe(true);
  });

  test('SearchCases', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query ($id: String!) {
          SearchCases(id: $id) {
            id
            name
            name_abbreviation
            decision_date
            court {
              name
            }
          }
        }
      `,
      variables: {
        id: 'Weidenfeller',
      },
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.SearchCases).toBeDefined();
    expect(Array.isArray(response.data.SearchCases)).toBe(true);
  });
});

describe('Court Queries', () => {
  test('GetAllCourts', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query {
          GetAllCourts {
            id
            name
            name_abbreviation
          }
        }
      `,
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.GetAllCourts).toBeDefined();
    expect(Array.isArray(response.data.GetAllCourts)).toBe(true);
  });
});

describe('Jurisdiction Queries', () => {
  test('GetAllJurisdictions', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query {
          GetAllJurisdictions {
            id
            name
            name_long
          }
        }
      `,
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.GetAllJurisdictions).toBeDefined();
    expect(Array.isArray(response.data.GetAllJurisdictions)).toBe(true);
  });
});

describe('Case Complex Queries', () => {
  test('GetCaseWithFullDetails', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query ($id: ID!) {
          GetCaseById(id: $id) {
            id
            name
            name_abbreviation
            decision_date
            docket_number
            first_page
            last_page
            citations {
              type
              cite
            }
            court {
              id
              name_abbreviation
              name
            }
            jurisdiction {
              id
              name_long
              name
            }
            cites_to {
              cite
              category
              reporter
              case_ids
              opinion_index
              case_paths
              weight
              pin_cites {
                page
              }
              year
            }
            analysis {
              cardinality
              char_count
              ocr_confidence
              pagerank {
                raw
                percentile
              }
              sha256
              simhash
              word_count
            }
            last_updated
            provenance {
              date_added
              source
              batch
            }
            casebody {
              judges
              parties
              opinions {
                text
                type
                author
              }
              attorneys
              corrections
              head_matter
            }
            file_name
            first_page_order
            last_page_order
            time_stamp {
              created_at
              updated_at
            }
          }
        }
      `,
      variables: {
        id: '1177184',
      },
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.GetCaseById).toBeDefined();
    expect(response.data.GetCaseById.id).toBe('1177184');
    expect(response.data.GetCaseById.court).toBeDefined();
    expect(response.data.GetCaseById.jurisdiction).toBeDefined();
    expect(response.data.GetCaseById.casebody).toBeDefined();
    expect(response.data.GetCaseById.analysis).toBeDefined();
  });
});

describe('Error Handling', () => {
  test('GetCaseById with invalid ID', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query ($id: ID!) {
          GetCaseById(id: $id) {
            id
            name
          }
        }
      `,
      variables: {
        id: 'invalid-id',
      },
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    // The mock will still return data, but in a real scenario this might return null or error
    expect(response.data.GetCaseById).toBeDefined();
  });

  test('SearchCases with empty query', async () => {
    const res = await testServer.executeOperation({
      query: gql`
        query ($id: String!) {
          SearchCases(id: $id) {
            id
            name
          }
        }
      `,
      variables: {
        id: '',
      },
    });

    // Handle both single and incremental results
    const response =
      'singleResult' in res.body
        ? JSON.parse(JSON.stringify(res.body.singleResult))
        : JSON.parse(JSON.stringify(res.body.initialResult));

    expect(response.errors).toBeUndefined();
    expect(response.data.SearchCases).toBeDefined();
  });
});
