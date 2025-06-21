import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Query {
    # Case queries
    GetAllCases: [Case]
    GetCaseById(id: ID!): Case
    GetCasesByCourt(courtId: ID!): [Case]
    GetCasesByJurisdiction(jurisdictionId: ID!): [Case]
    GetCasesByDateRange(startDate: String!, endDate: String!): [Case]
    SearchCases(query: String!): [Case]

    # Court queries
    GetAllCourts: [Court]
    GetCourtById(id: ID!): Court

    # Jurisdiction queries
    GetAllJurisdictions: [Jurisdiction]
    GetJurisdictionById(id: ID!): Jurisdiction
  }

  type Mutation {
    # Case mutations
    InsertCase(input: CaseInput!): Case
    UpdateCase(id: ID!, input: CaseInput!): Case
    DeleteCase(id: ID!): Case

    # Court mutations
    InsertCourt(input: CourtInput!): Court
    UpdateCourt(id: ID!, input: CourtInput!): Court
    DeleteCourt(id: ID!): Court

    # Jurisdiction mutations
    InsertJurisdiction(input: JurisdictionInput!): Jurisdiction
    UpdateJurisdiction(id: ID!, input: JurisdictionInput!): Jurisdiction
    DeleteJurisdiction(id: ID!): Jurisdiction
  }

  type Case {
    id: ID!
    name: String
    name_abbreviation: String
    decision_date: String
    docket_number: String
    first_page: String
    last_page: String
    citations: [Citation]
    court: Court
    jurisdiction: Jurisdiction
    cites_to: [CitesTo]
    analysis: Analysis
    last_updated: DateTime
    provenance: Provenance
    casebody: CaseBody
    file_name: String
    first_page_order: Int
    last_page_order: Int
  }

  type Citation {
    type: String
    cite: String
  }

  type Court {
    id: ID!
    name_abbreviation: String
    name: String
  }

  type Jurisdiction {
    id: ID!
    name_long: String
    name: String
  }

  type CitesTo {
    cite: String
    category: String
    reporter: String
    case_ids: [ID]
    opinion_index: Int
    case_paths: [String]
    weight: Int
    pin_cites: [PinCites]
    year: Int
  }

  type PinCites {
    page: String
  }

  type Analysis {
    cardinality: Int
    char_count: Int
    ocr_confidence: Float
    pagerank: PageRank
    sha256: String
    simhash: String
    word_count: Int
  }

  type PageRank {
    raw: Float
    percentile: Float
  }

  type Provenance {
    date_added: String
    source: String
    batch: String
  }

  type CaseBody {
    judges: [String]
    parties: [String]
    opinions: [Opinion]
    attorneys: [String]
    corrections: String
    head_matter: String
  }

  type Opinion {
    text: String
    type: String
    author: String
  }

  # Input types for mutations
  input CaseInput {
    name: String
    name_abbreviation: String
    decision_date: String
    docket_number: String
    first_page: String
    last_page: String
    citations: [CitationInput]
    court_id: ID
    jurisdiction_id: ID
    cites_to: [CitesToInput]
    analysis: AnalysisInput
    provenance: ProvenanceInput
    casebody: CaseBodyInput
    file_name: String
    first_page_order: Int
    last_page_order: Int
  }

  input CitationInput {
    type: String
    cite: String
  }

  input CourtInput {
    name_abbreviation: String
    name: String
  }

  input JurisdictionInput {
    name_long: String
    name: String
  }

  input CitesToInput {
    cite: String
    category: String
    reporter: String
    case_ids: [ID]
    opinion_index: Int
    case_paths: [String]
    weight: Int
    pin_cites: [PinCitesInput]
    year: Int
  }

  input PinCitesInput {
    page: String
  }

  input AnalysisInput {
    cardinality: Int
    char_count: Int
    ocr_confidence: Float
    pagerank: PageRankInput
    sha256: String
    simhash: String
    word_count: Int
  }

  input PageRankInput {
    raw: Float
    percentile: Float
  }

  input ProvenanceInput {
    date_added: String
    source: String
    batch: String
  }

  input CaseBodyInput {
    judges: [String]
    parties: [String]
    opinions: [OpinionInput]
    attorneys: [String]
    corrections: String
    head_matter: String
  }

  input OpinionInput {
    text: String
    type: String
    author: String
  }

  scalar DateTime
`;
